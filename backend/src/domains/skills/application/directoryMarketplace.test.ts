import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { seedBuiltinSkills } from "./seedBuiltinSkills.js";

describe("Phase 5: Directory / Marketplace & Detail Page Tests", () => {
  let db: ReturnType<typeof getChatDatabase>;
  let repo: SkillRepository;

  beforeEach(() => {
    db = getChatDatabase();
    repo = new SkillRepository(db);
    seedBuiltinSkills(repo);
  });

  test("Directory lists seeded directory skills with categories and agents", () => {
    const dirSkills = repo.listDirectorySkills();
    assert.ok(dirSkills.length >= 4, `Expected at least 4 directory skills, found ${dirSkills.length}`);

    const researchSkill = dirSkills.find((s) => s.name === "web-research-analyst");
    assert.ok(researchSkill, "web-research-analyst must be in directory");
    assert.equal(researchSkill.icon, "Globe");
    assert.equal(researchSkill.author, "Anthropic Community");

    // Verify categories
    const categories = repo.getSkillCategories(researchSkill.id);
    assert.ok(categories.includes("Research") || categories.includes("Productivity"));

    // Verify agents
    const agents = repo.listSkillAgents(researchSkill.id);
    assert.equal(agents.length, 1);
    assert.equal(agents[0]!.name, "Research Specialist");
    assert.ok(agents[0]!.tools.includes("Bash"));
  });

  test("Directory category filter and query search", () => {
    // Category filter
    const researchSkills = repo.listDirectorySkills({ category: "Research" });
    assert.ok(researchSkills.some((s) => s.name === "web-research-analyst"));

    // Query search
    const sqlSkills = repo.listDirectorySkills({ query: "schema" });
    assert.ok(sqlSkills.some((s) => s.name === "sql-schema-architect"));
  });

  test("Skill versions history and file contents", () => {
    const skill = repo.getByNameAndScope("web-research-analyst", "directory");
    assert.ok(skill);

    const versions = repo.listSkillVersions(skill.id);
    assert.ok(versions.length >= 1, "Must have version 1 recorded");
    assert.equal(versions[0]!.version, 1);
    assert.ok(Array.isArray(versions[0]!.fileManifest));

    // Verify files
    const files = repo.listFiles(skill.id);
    assert.ok(files.some((f) => f.relativePath === "SKILL.md"));
    assert.ok(files.some((f) => f.relativePath === "agents/researcher.md"));
  });

  test("Add directory skill to user library saves a private copy", () => {
    const dirSkill = repo.getByNameAndScope("sql-schema-architect", "directory");
    assert.ok(dirSkill);

    const userCopy = repo.addDirectorySkillToUserLibrary(dirSkill.id, "dev-user-library");
    assert.ok(userCopy.id);
    assert.equal(userCopy.scope, "user");
    assert.equal(userCopy.ownerId, "dev-user-library");
    assert.equal(userCopy.name, "sql-schema-architect");

    // Files are copied
    const userFiles = repo.listFiles(userCopy.id);
    assert.ok(userFiles.length >= 1);
  });
});
