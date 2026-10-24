import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticatedChatFetch } = vi.hoisted(() => ({
  authenticatedChatFetch: vi.fn(),
}));

vi.mock("../../../app/api/chatApi", () => ({ authenticatedChatFetch }));

import { PROJECTS_STORAGE_KEY, loadAccountProjects, saveAccountProjects } from "./projectStore";
import type { ProjectItem } from "./projectTypes";

const project: ProjectItem = {
  id: "project-1",
  name: "Offline recovery",
  colorTag: "stone",
  createdAt: 1,
  updatedAt: 2,
  sessionCount: 0,
  sessions: [],
  files: [],
};

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("project account persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    authenticatedChatFetch.mockReset();
  });

  it("restores a failed save only for the same account", async () => {
    authenticatedChatFetch.mockResolvedValueOnce(response(503, {}));
    await expect(saveAccountProjects("user/a", [project])).rejects.toThrow(
      "Could not save projects"
    );

    authenticatedChatFetch.mockResolvedValueOnce(response(200, { projects: [] }));
    const loaded = await loadAccountProjects("user/a");
    expect(loaded.projects).toEqual([project]);
    expect(loaded.hasPendingSnapshot).toBe(true);

    authenticatedChatFetch.mockResolvedValueOnce(response(200, { projects: [] }));
    const otherAccount = await loadAccountProjects("user-b");
    expect(otherAccount.projects).toEqual([]);
    expect(otherAccount.hasPendingSnapshot).toBe(false);
  });

  it("clears its recovery copy only after the server confirms the save", async () => {
    authenticatedChatFetch.mockResolvedValueOnce(response(200, { projects: [project] }));
    await saveAccountProjects("user-1", [project]);
    expect(localStorage.getItem(`${PROJECTS_STORAGE_KEY}:pending:user-1`)).toBeNull();
  });
});
