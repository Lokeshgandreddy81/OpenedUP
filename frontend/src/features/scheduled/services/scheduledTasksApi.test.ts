import assert from "node:assert/strict";
import test from "node:test";
import type { ScheduledTaskRecord, ScheduledTaskRunRecord } from "@charan-interiors/contracts";
import type { ScheduledTask } from "../components/scheduledTypes";
import {
  createScheduledTask,
  deleteScheduledTask,
  listScheduledTaskRuns,
  listScheduledTasks,
  runScheduledTask,
  taskInput,
  updateScheduledTask,
} from "./scheduledTasksApi";

const taskRecord: ScheduledTaskRecord = {
  id: "task-a",
  title: "Account task",
  prompt: "Summarize my day.",
  icon: "⏱️",
  frequency: "daily",
  time: "09:00",
  timezone: "UTC",
  isActive: true,
  createdAt: 1,
  updatedAt: 1,
  lastRunAt: null,
  nextRunAt: null,
  notifications: "Important updates",
  startInNewChat: false,
  model: "gpt-6-astra",
  effort: "Medium",
};

const runRecord: ScheduledTaskRunRecord = {
  id: "run-a",
  taskId: taskRecord.id,
  trigger: "manual",
  status: "succeeded",
  scheduledFor: null,
  createdAt: 1,
  startedAt: 1,
  finishedAt: 2,
  output: "Done.",
  error: null,
  modelUsed: taskRecord.model,
  providerUsed: "openai",
  conversationId: null,
};

const task: ScheduledTask = {
  id: taskRecord.id,
  title: taskRecord.title,
  prompt: taskRecord.prompt,
  icon: taskRecord.icon,
  frequency: taskRecord.frequency,
  time: "9:00 AM",
  timezone: taskRecord.timezone,
  isActive: true,
  createdAt: taskRecord.createdAt,
  notifications: taskRecord.notifications,
  startInNewChat: taskRecord.startInNewChat,
  model: taskRecord.model,
  effort: taskRecord.effort,
};

async function withBrowserStorage<T>(
  run: (entries: Map<string, string>) => Promise<T>
): Promise<T> {
  const previousStorage = globalThis.localStorage;
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    },
  });
  try {
    return await run(entries);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousStorage,
    });
  }
}

test("every scheduled task request carries the account that initiated it", async () => {
  await withBrowserStorage(async () => {
    const previousFetch = globalThis.fetch;
    const captured: Array<{ path: string; method: string; expectedUserId: string | null }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      const method = init?.method ?? "GET";
      captured.push({
        path,
        method,
        expectedUserId: new Headers(init?.headers).get("X-Expected-User-Id"),
      });
      if (method === "DELETE") return new Response(null, { status: 204 });
      if (path.endsWith("/runs")) return Response.json({ runs: [runRecord] });
      if (path.includes("/runs/")) return Response.json({ run: runRecord });
      if (path.endsWith("/run")) {
        return Response.json({ run: { ...runRecord, status: "running", output: null } });
      }
      if (method === "GET") return Response.json({ tasks: [taskRecord] });
      return Response.json({ task: taskRecord });
    }) as typeof fetch;

    try {
      const userId = "scheduled-account-a";
      assert.deepEqual(await listScheduledTasks(userId), [task]);
      assert.deepEqual(await createScheduledTask(userId, taskInput(task)), task);
      assert.deepEqual(await updateScheduledTask(userId, task.id, task), task);
      await deleteScheduledTask(userId, task.id);
      assert.deepEqual(await listScheduledTaskRuns(userId, task.id), [runRecord]);
      assert.deepEqual(await runScheduledTask(userId, task.id), runRecord);

      assert.equal(captured.length, 7);
      assert.deepEqual(
        captured.map(({ method, expectedUserId }) => ({ method, expectedUserId })),
        ["GET", "POST", "PUT", "DELETE", "GET", "POST", "GET"].map((method) => ({
          method,
          expectedUserId: userId,
        }))
      );
      assert.equal(captured[6]?.path, "/api/scheduled-tasks/runs/run-a");
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test("legacy scheduled tasks stay reserved to the account that begins import", async () => {
  await withBrowserStorage(async (entries) => {
    const previousFetch = globalThis.fetch;
    const requestedPaths: string[] = [];
    entries.set(
      "shoebox_scheduled_tasks",
      JSON.stringify([
        {
          id: "legacy-task",
          title: "Legacy task",
          prompt: "Review updates.",
          frequency: "daily",
          time: "9:00 AM",
        },
      ])
    );
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      requestedPaths.push(`${init?.method ?? "GET"} ${path}`);
      if (path.endsWith("/import")) return Response.json({ imported: 1, skipped: 0 });
      return Response.json({ tasks: [] });
    }) as typeof fetch;

    try {
      await listScheduledTasks("scheduled-account-a");
      await listScheduledTasks("scheduled-account-b");

      assert.deepEqual(requestedPaths, [
        "POST /api/scheduled-tasks/import",
        "GET /api/scheduled-tasks",
        "GET /api/scheduled-tasks",
      ]);
      assert.equal(
        entries.get("shoebox_scheduled_tasks_imported_v1"),
        "complete:scheduled-account-a"
      );
      assert.equal(entries.has("shoebox_scheduled_tasks"), false);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test("failed legacy import remains retryable only by its reserved account", async () => {
  await withBrowserStorage(async (entries) => {
    const previousFetch = globalThis.fetch;
    let importAttempts = 0;
    const requestedPaths: string[] = [];
    entries.set(
      "shoebox_scheduled_tasks",
      JSON.stringify([
        {
          id: "legacy-task",
          title: "Legacy task",
          prompt: "Review updates.",
          frequency: "daily",
          time: "9:00 AM",
        },
      ])
    );
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      requestedPaths.push(`${init?.method ?? "GET"} ${path}`);
      if (path.endsWith("/import")) {
        importAttempts += 1;
        if (importAttempts === 1)
          return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
        return Response.json({ imported: 1, skipped: 0 });
      }
      return Response.json({ tasks: [] });
    }) as typeof fetch;

    try {
      await assert.rejects(listScheduledTasks("scheduled-account-a"), /Temporarily unavailable/);
      await listScheduledTasks("scheduled-account-b");
      await listScheduledTasks("scheduled-account-a");

      assert.equal(importAttempts, 2);
      assert.deepEqual(requestedPaths, [
        "POST /api/scheduled-tasks/import",
        "GET /api/scheduled-tasks",
        "POST /api/scheduled-tasks/import",
        "GET /api/scheduled-tasks",
      ]);
      assert.equal(
        entries.get("shoebox_scheduled_tasks_imported_v1"),
        "complete:scheduled-account-a"
      );
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
