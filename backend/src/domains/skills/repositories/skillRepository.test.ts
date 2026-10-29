import assert from "node:assert/strict";
import test from "node:test";
import { openChatDatabase, type ChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "./skillRepository.js";

function setupTestDb(): ChatDatabase {
  return openChatDatabase(":memory:");
}

test("SkillRepository - Schema & Migrations: creates skills and enforces uniqueness", async () => {
  const db = setupTestDb();
  const repo = new SkillRepository(db);

  const skill1 = await repo.create({
    name: "csv-summary",
    description: "Summarize CSV files with a Python script",
    scope: "builtin",
    storagePath: "/mnt/skills/builtin/csv-summary",
  });

  assert.ok(skill1.id);
  assert.equal(skill1.name, "csv-summary");
  assert.equal(skill1.scope, "builtin");
  assert.equal(skill1.version, 1);
  assert.equal(skill1.isActive, true);

  // Duplicate name in same scope and empty owner/org should violate unique constraint
  await assert.rejects(async () => {
    await repo.create({
      name: "csv-summary",
      description: "Another duplicate",
      scope: "builtin",
      storagePath: "/another/path",
    });
  });

  // Same name in user scope with specific owner is allowed
  const userSkill = await repo.create({
    name: "csv-summary",
    description: "User version of csv-summary",
    scope: "user",
    ownerId: "user-123",
    storagePath: "/mnt/skills/user/csv-summary",
  });
  assert.ok(userSkill.id);
  assert.notEqual(userSkill.id, skill1.id);
});

test("Directory listing prefers the marketplace copy over a legacy built-in duplicate", async () => {
  const db = setupTestDb();
  const repo = new SkillRepository(db);
  await repo.create({
    name: "duplicate-marketplace-skill",
    description: "Legacy built-in copy",
    scope: "builtin",
    storagePath: "/skills/builtin/duplicate-marketplace-skill",
  });
  const directoryCopy = await repo.create({
    name: "duplicate-marketplace-skill",
    description: "Marketplace copy",
    scope: "directory",
    storagePath: "/skills/directory/duplicate-marketplace-skill",
  });

  const listed = await repo.listDirectorySkills();

  assert.equal(listed.filter((skill) => skill.name === "duplicate-marketplace-skill").length, 1);
  assert.equal(
    listed.find((skill) => skill.name === "duplicate-marketplace-skill")?.id,
    directoryCopy.id
  );
});

test("Visible library listing hides a legacy built-in when its marketplace copy exists", async () => {
  const db = setupTestDb();
  const repo = new SkillRepository(db);
  await repo.create({
    name: "visible-marketplace-skill",
    description: "Legacy built-in copy",
    scope: "builtin",
    storagePath: "/skills/builtin/visible-marketplace-skill",
  });
  const directoryCopy = await repo.create({
    name: "visible-marketplace-skill",
    description: "Marketplace copy",
    scope: "directory",
    storagePath: "/skills/directory/visible-marketplace-skill",
  });

  const listed = await repo.listVisible("guest");
  const matchingSkills = listed.filter((skill) => skill.name === "visible-marketplace-skill");

  assert.equal(matchingSkills.length, 1);
  assert.equal(matchingSkills[0]?.id, directoryCopy.id);
});

test("SkillRepository - Skill Files and cascading deletes", async () => {
  const db = setupTestDb();
  const repo = new SkillRepository(db);

  const skill = await repo.create({
    name: "hello-format",
    description: "Format responses nicely",
    scope: "builtin",
    storagePath: "/mnt/skills/builtin/hello-format",
  });

  const files = await repo.addFiles(skill.id, [
    { relativePath: "SKILL.md", sizeBytes: 120, sha256: "abc123" },
    { relativePath: "scripts/run.sh", sizeBytes: 50, sha256: "def456" },
  ]);

  assert.equal(files.length, 2);
  const listed = await repo.listFiles(skill.id);
  assert.equal(listed.length, 2);
  assert.equal(listed[0]?.relativePath, "SKILL.md");

  // Delete skill -> skill_files cascade
  const deleted = await repo.delete(skill.id);
  assert.equal(deleted, true);
  assert.equal((await repo.listFiles(skill.id)).length, 0);
  assert.equal(await repo.get(skill.id), null);
});

test("SkillRepository - Visibility scoping (builtin, org, user)", async () => {
  const db = setupTestDb();
  const repo = new SkillRepository(db);

  await repo.create({
    name: "builtin-1",
    description: "Builtin skill",
    scope: "builtin",
    storagePath: "/path/1",
  });
  await repo.create({
    name: "user1-skill",
    description: "User 1 private skill",
    scope: "user",
    ownerId: "user-1",
    storagePath: "/path/2",
  });
  await repo.create({
    name: "user2-skill",
    description: "User 2 private skill",
    scope: "user",
    ownerId: "user-2",
    storagePath: "/path/3",
  });
  await repo.create({
    name: "org-skill",
    description: "Organization shared skill",
    scope: "org",
    orgId: "org-alpha",
    storagePath: "/path/4",
  });

  // User 1 in org-alpha should see: builtin-1, user1-skill, org-skill (NOT user2-skill)
  const visibleToUser1 = await repo.listVisible("user-1", "org-alpha");
  const namesUser1 = visibleToUser1.map((s) => s.name);
  assert.ok(namesUser1.includes("builtin-1"));
  assert.ok(namesUser1.includes("user1-skill"));
  assert.ok(namesUser1.includes("org-skill"));
  assert.ok(!namesUser1.includes("user2-skill"));

  // Query filter
  const queried = await repo.listVisible("user-1", "org-alpha", { query: "private" });
  assert.equal(queried.length, 1);
  assert.equal(queried[0]?.name, "user1-skill");
});

test("SkillRepository - Conversation skills and Project skills link & toggle", async () => {
  const db = setupTestDb();
  const repo = new SkillRepository(db);

  // Create a conversation in conversations table
  const now = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-1", "user-1", "Test Chat", "gemini-3.8-flash", now, now);

  const skillA = await repo.create({
    name: "skill-a",
    description: "Skill A",
    scope: "builtin",
    storagePath: "/path/a",
  });
  const skillB = await repo.create({
    name: "skill-b",
    description: "Skill B",
    scope: "builtin",
    storagePath: "/path/b",
  });

  // Enable skills for conversation
  await repo.setConversationSkills("conv-1", [skillA.id, skillB.id], "user-1");
  let enabled = await repo.getConversationSkills("conv-1");
  assert.equal(enabled.length, 2);

  // Replace with just skillA
  await repo.setConversationSkills("conv-1", [skillA.id], "user-1");
  enabled = await repo.getConversationSkills("conv-1");
  assert.equal(enabled.length, 1);
  assert.equal(enabled[0]?.name, "skill-a");

  // Project skills
  await repo.setProjectSkills("proj-1", [skillB.id]);
  const projSkills = await repo.getProjectSkills("proj-1");
  assert.equal(projSkills.length, 1);
  assert.equal(projSkills[0]?.name, "skill-b");
});

test("SkillRepository - Usage logging", async () => {
  const db = setupTestDb();
  const repo = new SkillRepository(db);

  // Insert conversation first for foreign key constraint
  const now = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-1", "user-1", "Test Chat", "gemini-3.8-flash", now, now);

  const log = await repo.logUsage("conv-1", "csv-summary", "user-1");
  assert.ok(log.id);
  assert.equal(log.skill, "csv-summary");
  assert.equal(log.conversationId, "conv-1");

  const usage = await repo.listUsage("conv-1");
  assert.equal(usage.length, 1);
  assert.equal(usage[0]?.skill, "csv-summary");

  // Also verify null conversationId is allowed
  const log2 = await repo.logUsage(null, "hello-format", "user-1");
  assert.ok(log2.id);
  assert.equal(log2.conversationId, null);
});
