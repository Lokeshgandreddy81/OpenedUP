import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { ConversationRepository } from "../../conversations/repositories/conversationRepository.js";
import { seedBuiltinSkills } from "./seedBuiltinSkills.js";

describe("Phase 4: Project-Level Default Skills & Inheritance", () => {
  let db: ReturnType<typeof getChatDatabase>;
  let skillRepo: SkillRepository;
  let convRepo: ConversationRepository;

  beforeEach(() => {
    db = getChatDatabase();
    skillRepo = new SkillRepository(db);
    convRepo = new ConversationRepository(db);
    seedBuiltinSkills(skillRepo);
  });

  test("Project skills configuration and new conversation inheritance", () => {
    const projectId = `proj-test-${Date.now()}`;
    const helloSkill = skillRepo.getByNameAndScope("hello-format", "builtin");
    assert.ok(helloSkill);

    // 1. Set project default skills
    const setSkills = skillRepo.setProjectSkills(projectId, [helloSkill.id]);
    assert.equal(setSkills.length, 1);
    assert.equal(setSkills[0]!.name, "hello-format");

    // Verify GET project skills
    const fetchedProjectSkills = skillRepo.getProjectSkills(projectId);
    assert.equal(fetchedProjectSkills.length, 1);
    assert.equal(fetchedProjectSkills[0]!.id, helloSkill.id);

    // 2. Create a new conversation under this project
    const conversation = convRepo.create("user-1", "Test Conversation", "default", projectId);
    assert.ok(conversation.id);

    // Verify conversation inherited the project's default skill
    const convSkills = skillRepo.getConversationSkills(conversation.id);
    assert.equal(convSkills.length, 1);
    assert.equal(convSkills[0]!.name, "hello-format");

    const meta = skillRepo.getConversationSkillMeta(conversation.id, helloSkill.id);
    assert.ok(meta);
    assert.equal(meta.source, "project");
    assert.equal(meta.explicitlySelected, false);
  });

  test("Later project changes do NOT silently alter existing conversations, but trigger update hint", () => {
    const projectId = `proj-alter-${Date.now()}`;
    const helloSkill = skillRepo.getByNameAndScope("hello-format", "builtin");
    const csvSkill = skillRepo.getByNameAndScope("csv-summary", "builtin");
    assert.ok(helloSkill);
    assert.ok(csvSkill);

    // Initialize project with hello-format
    skillRepo.setProjectSkills(projectId, [helloSkill.id]);

    // Create conversation A in project
    const convA = convRepo.create("user-1", "Conv A", "default", projectId);
    const initialSkills = skillRepo.getConversationSkills(convA.id);
    assert.equal(initialSkills.length, 1);
    assert.equal(initialSkills[0]!.name, "hello-format");

    // Now update project's default skills to csv-summary instead
    skillRepo.setProjectSkills(projectId, [csvSkill.id]);

    // Check that existing conversation A is NOT silently altered
    const skillsAfterProjectChange = skillRepo.getConversationSkills(convA.id);
    assert.equal(skillsAfterProjectChange.length, 1);
    assert.equal(
      skillsAfterProjectChange[0]!.name,
      "hello-format",
      "Existing conversation must not be silently altered"
    );

    // Verify update detection: project has csv-summary, conversation has hello-format
    const projectSkills = skillRepo.getProjectSkills(projectId);
    const projectSkillIds = new Set(projectSkills.map((s) => s.id));
    const convMeta = skillRepo.getConversationSkills(convA.id).map((s) => ({
      ...s,
      meta: skillRepo.getConversationSkillMeta(convA.id, s.id),
    }));
    const currentProjectSourced = convMeta.filter((s) => s.meta?.source === "project");
    const currentProjectSkillIds = new Set(currentProjectSourced.map((s) => s.id));

    const hasProjectUpdate =
      projectSkillIds.size !== currentProjectSkillIds.size ||
      [...projectSkillIds].some((id) => !currentProjectSkillIds.has(id));

    assert.equal(hasProjectUpdate, true, "Update available hint must be detected");

    // Sync project skills into conversation
    skillRepo.removeProjectSourcedConversationSkills(convA.id);
    skillRepo.inheritProjectSkills(convA.id, projectId, "user-1");

    // Assert synced
    const syncedSkills = skillRepo.getConversationSkills(convA.id);
    assert.equal(syncedSkills.length, 1);
    assert.equal(
      syncedSkills[0]!.name,
      "csv-summary",
      "After sync, conversation has updated project skills"
    );
  });
});
