import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectItem, ProjectSession } from "./projectTypes";
import { applyProjectSessionUpdate } from "./projectUpdates";

test("session updates preserve newer project fields from concurrent edits", () => {
  const currentSession: ProjectSession = {
    id: "session-1",
    projectId: "project-1",
    title: "Original session",
    createdAt: 100,
    updatedAt: 300,
    messages: [{ id: "message-1", role: "user", content: "new reply", timestamp: "now" }],
  };
  const currentProject: ProjectItem = {
    id: "project-1",
    name: "Renamed while the model was responding",
    description: "Recent description",
    colorTag: "stone",
    createdAt: 50,
    updatedAt: 500,
    sessionCount: 1,
    files: [
      {
        id: "file-1",
        name: "new-notes.txt",
        size: 4,
        type: "text/plain",
        content: "new",
      },
    ],
    sessions: [currentSession],
  };
  const staleSessionUpdate: ProjectSession = {
    ...currentSession,
    title: "Original session",
    updatedAt: 400,
    messages: [{ id: "message-1", role: "user", content: "streamed reply", timestamp: "later" }],
  };

  const [updatedProject] = applyProjectSessionUpdate(
    [currentProject],
    currentProject.id,
    staleSessionUpdate
  );

  assert.ok(updatedProject);
  assert.equal(updatedProject.name, currentProject.name);
  assert.equal(updatedProject.description, currentProject.description);
  assert.deepEqual(updatedProject.files, currentProject.files);
  assert.deepEqual(updatedProject.sessions, [staleSessionUpdate]);
  assert.equal(updatedProject.updatedAt, currentProject.updatedAt);
});
