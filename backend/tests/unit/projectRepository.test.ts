import { afterEach, describe, expect, it } from "vitest";
import { openChatDatabase } from "../../src/platform/database/chatDatabase.js";
import { ProjectRepository } from "../../src/domains/projects/repositories/projectRepository.js";
import type { ProjectSnapshot } from "@charan-interiors/contracts";

const db = openChatDatabase(":memory:");
const repository = new ProjectRepository(db);

function project(id: string, name = id): ProjectSnapshot {
  return {
    id,
    name,
    colorTag: "stone",
    createdAt: 1,
    updatedAt: 2,
    sessionCount: 0,
    sessions: [],
    files: [],
  };
}

afterEach(() => {
  db.exec("DELETE FROM project_snapshots;");
});

describe("project snapshots", () => {
  it("keeps reads and writes isolated by account", () => {
    repository.replace("user-a", { projects: [project("private", "Private work")] });

    expect(repository.list("user-a")).toMatchObject([{ id: "private", name: "Private work" }]);
    expect(repository.list("user-b")).toEqual([]);
  });

  it("replaces an account snapshot atomically", () => {
    repository.replace("user-a", { projects: [project("existing")] });

    expect(() =>
      repository.replace("user-a", { projects: [project("duplicate"), project("duplicate")] })
    ).toThrow();

    expect(repository.list("user-a")).toMatchObject([{ id: "existing" }]);
  });

  it("imports without overwriting existing projects", () => {
    repository.replace("user-a", { projects: [project("same", "Server version")] });

    expect(
      repository.import("user-a", { projects: [project("same", "Local version"), project("new")] })
    ).toEqual({ imported: 1, skipped: 1 });
    expect(repository.list("user-a")).toMatchObject([
      { id: "same", name: "Server version" },
      { id: "new" },
    ]);
  });
});
