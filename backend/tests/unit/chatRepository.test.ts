import { afterEach, describe, expect, it } from "vitest";
import { openChatDatabase } from "../../src/platform/database/chatDatabase.js";
import { ArtifactRepository } from "../../src/domains/artifacts/repositories/artifactRepository.js";
import { ConversationRepository } from "../../src/domains/conversations/repositories/conversationRepository.js";
import { ProjectRepository } from "../../src/domains/projects/repositories/projectRepository.js";

const db = openChatDatabase(":memory:");
afterEach(() => {
  db.exec(
    "DELETE FROM chat_messages; DELETE FROM conversations; DELETE FROM chat_artifacts; DELETE FROM project_snapshots;"
  );
});

describe("chat repositories", () => {
  it("scopes conversation reads and writes by the authenticated user", () => {
    const repository = new ConversationRepository(db);
    const conversation = repository.create("user-a", "Private", "gemini-3.8-flash");
    repository.appendMessage("user-a", conversation.id, {
      role: "user",
      content: "Hello",
      status: "complete",
      metadata: {},
    });

    expect(repository.get("user-a", conversation.id)?.messages).toHaveLength(1);
    expect(repository.get("user-b", conversation.id)).toBeNull();
    expect(repository.update("user-b", conversation.id, { isPinned: true })).toBe(false);
    expect(repository.delete("user-b", conversation.id)).toBe(false);
    expect(repository.get("user-a", conversation.id)?.isPinned).toBe(false);
    expect(
      repository.update("user-a", conversation.id, {
        model: "openrouter-nemotron-3.5-lightning-free",
      })
    ).toBe(true);
    expect(repository.get("user-a", conversation.id)?.model).toBe(
      "openrouter-nemotron-3.5-lightning-free"
    );
  });

  it("truncates an edited prompt and every later turn without crossing conversation ownership", () => {
    const repository = new ConversationRepository(db);
    const conversation = repository.create("user-a", "Edit", "gemini-3.8-flash");
    const first = repository.appendMessage("user-a", conversation.id, {
      role: "user",
      content: "first",
      status: "complete",
      metadata: {},
    })!;
    repository.appendMessage("user-a", conversation.id, {
      role: "assistant",
      content: "answer",
      status: "complete",
      metadata: {},
    });
    repository.appendMessage("user-a", conversation.id, {
      role: "user",
      content: "second",
      status: "complete",
      metadata: {},
    });

    expect(repository.deleteMessagesFrom("user-b", conversation.id, first.id)).toBe(false);
    expect(repository.deleteMessagesFrom("user-a", conversation.id, first.id)).toBe(true);
    expect(repository.get("user-a", conversation.id)?.messages).toEqual([]);
  });

  it("shares artifacts only with signed-in viewers and keeps mutations owner-only", () => {
    const repository = new ArtifactRepository(db);
    const artifact = repository.create("user-a", {
      title: "Private note",
      category: "Documents",
      content: "secret",
      isShared: false,
    });

    expect(repository.list("user-b")).toHaveLength(0);
    expect(repository.setShared("user-b", artifact.id, true)).toBe(false);
    expect(repository.setShared("user-a", artifact.id, true)).toBe(true);
    expect(repository.list("user-b")).toMatchObject([
      { id: artifact.id, content: "secret", isOwner: false, isShared: true },
    ]);
    expect(repository.delete("user-b", artifact.id)).toBe(false);
  });

  it("updates artifact title and contents only for its owner", () => {
    const repository = new ArtifactRepository(db);
    const artifact = repository.create("user-a", {
      title: "Draft",
      category: "Documents",
      content: "before",
      isShared: true,
    });
    const updated = repository.update("user-a", artifact.id, {
      title: "Final",
      category: "Documents",
      content: "after",
      isShared: true,
    });

    expect(updated).toMatchObject({
      id: artifact.id,
      title: "Final",
      content: "after",
      isShared: true,
    });
    expect(repository.versions("user-a", artifact.id)).toMatchObject([
      { title: "Draft", content: "before" },
    ]);
    expect(repository.versions("user-b", artifact.id)).toBeNull();
    expect(
      repository.update("user-b", artifact.id, {
        title: "Hijacked",
        category: "Documents",
        content: "spoofed",
        isShared: false,
      })
    ).toBeNull();
    expect(repository.list("user-a")[0]).toMatchObject({ title: "Final", content: "after" });
  });

  it("imports browser artifacts idempotently per owner", () => {
    const repository = new ArtifactRepository(db);
    const payload = {
      artifacts: [
        {
          legacyId: "legacy-1",
          title: "Imported",
          category: "Code" as const,
          content: "export const value = 1;",
          isShared: true,
          createdAt: 100,
          updatedAt: 200,
        },
      ],
    };

    expect(repository.import("user-a", payload)).toEqual({ imported: 1, skipped: 0 });
    expect(repository.import("user-a", payload)).toEqual({ imported: 0, skipped: 1 });
    expect(repository.list("user-b")).toHaveLength(1);
    expect(repository.list("user-b")[0]?.isOwner).toBe(false);
  });

  it("stores project snapshots per owner and imports them idempotently", () => {
    const repository = new ProjectRepository(db);
    const project = {
      id: "project-1",
      name: "Private project",
      description: "Account scoped",
      colorTag: "stone" as const,
      createdAt: 100,
      updatedAt: 200,
      sessionCount: 1,
      sessions: [
        {
          id: "session-1",
          projectId: "project-1",
          title: "Planning",
          createdAt: 110,
          updatedAt: 190,
          messages: [
            { id: "message-1", role: "user" as const, content: "Private prompt", timestamp: "Now" },
          ],
        },
      ],
    };

    expect(repository.import("user-a", { projects: [project] })).toEqual({
      imported: 1,
      skipped: 0,
    });
    expect(repository.import("user-a", { projects: [project] })).toEqual({
      imported: 0,
      skipped: 1,
    });
    expect(repository.list("user-a")).toEqual([project]);
    expect(repository.list("user-b")).toEqual([]);
    expect(repository.replace("user-b", { projects: [] })).toEqual([]);
    expect(repository.list("user-a")).toEqual([project]);
    expect(repository.replace("user-a", { projects: [{ ...project, name: "Updated" }] })).toEqual([
      { ...project, name: "Updated" },
    ]);
  });
});
