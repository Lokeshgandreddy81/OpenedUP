import { describe, expect, it } from "vitest";
import { ProjectSnapshotSchema, ReplaceProjectsRequestSchema } from "./index.js";

const project = {
  id: "project-1",
  name: "A project",
  colorTag: "stone",
  createdAt: 1,
  updatedAt: 2,
  sessionCount: 1,
  sessions: [
    {
      id: "session-1",
      projectId: "project-1",
      title: "Chat",
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: "message-1", role: "user", content: "Hello", timestamp: "Now" }],
    },
  ],
};

describe("project snapshot contracts", () => {
  it("accepts nested project sessions and file context", () => {
    expect(
      ProjectSnapshotSchema.safeParse({
        ...project,
        files: [{ id: "file-1", name: "notes.md", size: 5, uploadedAt: 1, content: "notes" }],
      }).success
    ).toBe(true);
  });

  it("rejects sessions that claim another project and excessive file text", () => {
    expect(
      ProjectSnapshotSchema.safeParse({
        ...project,
        sessions: [{ ...project.sessions[0], projectId: "other" }],
      }).success
    ).toBe(false);
    expect(
      ProjectSnapshotSchema.safeParse({
        ...project,
        files: [
          { id: "file-1", name: "notes.md", size: 1, uploadedAt: 1, content: "x".repeat(120_001) },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects duplicate IDs in collection replacement", () => {
    expect(ReplaceProjectsRequestSchema.safeParse({ projects: [project, project] }).success).toBe(
      false
    );
  });
});
