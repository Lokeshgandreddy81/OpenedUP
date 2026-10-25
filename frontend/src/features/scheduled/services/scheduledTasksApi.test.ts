import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock global fetch so we can control responses without a real server.
const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

import {
  createScheduledTask,
  deleteScheduledTask,
  listScheduledTasks,
  listScheduledTaskRuns,
  runScheduledTask,
} from "./scheduledTasksApi";

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("scheduled task persistence without auth", () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
  });

  it("imports browser tasks once and keeps the local copy", async () => {
    const legacyTasks = [
      {
        id: "legacy-1",
        title: "Monthly digest",
        prompt: "Summarize my month.",
        icon: "📅",
        frequency: "custom",
        time: "9:00 AM",
        isActive: true,
        createdAt: Date.parse("2025-01-31T08:00:00.000Z"),
        model: "Claude 3.7 Sonnet",
        effort: "High",
      },
    ];
    localStorage.setItem("shoebox_scheduled_tasks", JSON.stringify(legacyTasks));
    mockFetch
      .mockResolvedValueOnce(response(200, { imported: 1, skipped: 0 }))
      .mockResolvedValueOnce(response(200, { tasks: [] }))
      .mockResolvedValueOnce(response(200, { tasks: [] }));

    await listScheduledTasks();
    await listScheduledTasks();

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "/api/scheduled-tasks/import",
      expect.objectContaining({ method: "POST" })
    );
    const imported = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string);
    expect(imported.tasks[0]).toMatchObject({
      legacyId: "legacy-1",
      frequency: "monthly",
      model: "claude-opus-5.5",
      effort: "High",
    });
    // import once + list twice = 3 calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem("shoebox_scheduled_tasks")).toBe(JSON.stringify(legacyTasks));
    expect(localStorage.getItem("shoebox_scheduled_tasks_imported_v1")).toBe("imported");
  });

  it("creates, runs, lists runs, and deletes tasks without auth headers", async () => {
    localStorage.setItem("shoebox_scheduled_tasks_imported_v1", "imported");

    // createScheduledTask
    mockFetch.mockResolvedValueOnce(
      response(201, {
        task: {
          id: "task-1",
          title: "My Task",
          prompt: "Do something",
          icon: "☀️",
          frequency: "daily",
          time: "09:00",
          timezone: "UTC",
          isActive: true,
          model: "gpt-6-astra",
          effort: "Medium",
          notifications: "Important updates",
          startInNewChat: true,
          createdAt: 1000,
          updatedAt: 1000,
          lastRunAt: null,
          nextRunAt: 2000,
        },
      })
    );

    const task = await createScheduledTask({
      title: "My Task",
      prompt: "Do something",
      icon: "☀️",
      frequency: "daily",
      time: "09:00",
      timezone: "UTC",
      isActive: true,
      model: "gpt-6-astra",
      effort: "Medium",
      notifications: "Important updates",
      startInNewChat: true,
    });
    expect(task.id).toBe("task-1");

    // runScheduledTask (queued then succeeded)
    mockFetch
      .mockResolvedValueOnce(
        response(202, {
          run: {
            id: "run-1",
            taskId: "task-1",
            trigger: "manual",
            status: "queued",
            createdAt: 1000,
            scheduledFor: null,
            startedAt: null,
            finishedAt: null,
            output: null,
            error: null,
          },
        })
      )
      .mockResolvedValueOnce(
        response(200, {
          run: {
            id: "run-1",
            taskId: "task-1",
            trigger: "manual",
            status: "succeeded",
            createdAt: 1000,
            scheduledFor: null,
            startedAt: 1010,
            finishedAt: 1050,
            output: "Done successfully!",
            error: null,
          },
        })
      );

    const runResult = await runScheduledTask("task-1", "test-key");
    expect(runResult.status).toBe("succeeded");
    expect(runResult.output).toBe("Done successfully!");

    // listScheduledTaskRuns
    mockFetch.mockResolvedValueOnce(response(200, { runs: [runResult] }));
    const runs = await listScheduledTaskRuns("task-1");
    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe("run-1");

    // deleteScheduledTask
    mockFetch.mockResolvedValueOnce(response(200, { success: true }));
    await deleteScheduledTask("task-1");
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/scheduled-tasks/task-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
