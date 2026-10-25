import { afterEach, describe, expect, it } from "vitest";
import { openChatDatabase } from "../../src/platform/database/chatDatabase.js";
import { ScheduledTaskRepository } from "../../src/domains/scheduled/repositories/scheduledTaskRepository.js";
import type { ScheduledTaskInput } from "@charan-interiors/contracts";

const db = openChatDatabase(":memory:");
const repository = new ScheduledTaskRepository(db);

function task(overrides: Partial<ScheduledTaskInput> = {}): ScheduledTaskInput {
  return {
    title: "Morning summary",
    prompt: "Summarize what changed overnight.",
    icon: "☀️",
    frequency: "daily",
    time: "09:00",
    timezone: "Asia/Kolkata",
    isActive: true,
    model: "gpt-6-astra",
    effort: "Medium",
    notifications: "Important updates",
    startInNewChat: false,
    ...overrides,
  };
}

afterEach(() => {
  db.exec("DELETE FROM scheduled_task_runs; DELETE FROM scheduled_tasks;");
});

describe("scheduled task persistence", () => {
  it("keeps tasks isolated to the authenticated owner", () => {
    const created = repository.create("user-a", task());

    expect(repository.list("user-a")).toMatchObject([{ id: created.id, title: "Morning summary" }]);
    expect(repository.list("user-b")).toEqual([]);
    expect(
      repository.update("user-b", created.id, task({ title: "Read another account's task" }))
    ).toBeNull();
    expect(repository.delete("user-b", created.id)).toBe(false);
    expect(repository.get("user-a", created.id)?.title).toBe("Morning summary");
  });

  it("imports existing browser tasks idempotently by legacy ID", () => {
    const request = {
      tasks: [{ ...task({ isActive: false }), legacyId: "local-42", createdAt: 100 }],
    };

    expect(repository.import("user-a", request)).toEqual({ imported: 1, skipped: 0 });
    expect(repository.import("user-a", request)).toEqual({ imported: 0, skipped: 1 });
    expect(repository.list("user-a")).toMatchObject([
      { title: "Morning summary", isActive: false, nextRunAt: null },
    ]);
  });

  it("claims each due occurrence once and advances the next run", () => {
    const created = repository.create("user-a", task());
    const dueAt = Date.now() - 1_000;
    db.prepare("UPDATE scheduled_tasks SET next_run_at = ? WHERE id = ?").run(dueAt, created.id);

    expect(repository.enqueueDueRuns(Date.now())).toBe(1);
    expect(repository.enqueueDueRuns(Date.now())).toBe(0);
    expect(repository.list("user-a")[0]?.nextRunAt).toBeGreaterThan(Date.now());
    expect(repository.listRuns("user-a", created.id)).toMatchObject([
      { trigger: "scheduled", status: "queued", scheduledFor: dueAt },
    ]);
  });
});
