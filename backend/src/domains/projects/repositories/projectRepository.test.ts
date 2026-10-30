import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectSnapshot } from "@charan-interiors/contracts";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../../skills/repositories/skillRepository.js";
import { ProjectRepository } from "./projectRepository.js";

function createProject(id: string): ProjectSnapshot {
  return {
    id,
    name: id,
    colorTag: "stone",
    createdAt: 1,
    updatedAt: 1,
    sessionCount: 0,
  };
}

test("replacing a user's projects prunes only that user's stale skill associations", async () => {
  const db = openChatDatabase(":memory:");
  const projects = new ProjectRepository(db);
  const skills = new SkillRepository(db);
  const skill = await skills.create({
    name: "project-skill",
    description: "A project scoped skill.",
    scope: "builtin",
    storagePath: "/skills/project-skill",
  });

  await projects.replace("owner-a", { projects: [createProject("shared-project-id")] });
  await projects.replace("owner-b", { projects: [createProject("shared-project-id")] });
  await skills.setProjectSkills("owner-a", "shared-project-id", [skill.id]);
  await skills.setProjectSkills("owner-b", "shared-project-id", [skill.id]);

  await projects.replace("owner-a", { projects: [] });
  await projects.replace("owner-a", { projects: [createProject("shared-project-id")] });

  assert.deepEqual(await skills.getProjectSkills("owner-a", "shared-project-id"), []);
  assert.deepEqual(
    (await skills.getProjectSkills("owner-b", "shared-project-id")).map(({ id }) => id),
    [skill.id]
  );
});
