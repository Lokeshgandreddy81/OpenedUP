import assert from "node:assert/strict";
import test from "node:test";
import type { DatabaseClient } from "../../../platform/database/databaseClient.js";
import { ScheduledTaskRepository } from "./scheduledTaskRepository.js";

test("repository maps Postgres BIGINT task and run timestamps to contract numbers", async () => {
  const taskRow = {
    id: "task-id",
    user_id: "user-id",
    legacy_id: null,
    title: "Daily summary",
    prompt: "Summarize the day.",
    icon: "⏱️",
    frequency: "daily",
    time: "09:00",
    timezone: "UTC",
    day_of_week: null,
    day_of_month: null,
    is_active: 1,
    model_id: "gpt-6-astra",
    effort: "Medium",
    notifications: "Important updates",
    start_in_new_chat: 0,
    conversation_id: null,
    created_at: "1793364000000",
    updated_at: "1793364000001",
    last_run_at: "1793364000002",
    next_run_at: "1793364000003",
  };
  const runRow = {
    id: "run-id",
    task_id: "task-id",
    user_id: "user-id",
    trigger: "manual",
    status: "succeeded",
    scheduled_for: null,
    created_at: "1793364000004",
    started_at: "1793364000005",
    finished_at: "1793364000006",
    output: "Done.",
    error: null,
    model_used: "gpt-6-astra",
    provider_used: "openai",
    conversation_id: null,
  };

  const database = {
    prepare(sql: string) {
      return {
        all: async () => (sql.includes("scheduled_task_runs") ? [runRow] : [taskRow]),
        get: async () => undefined,
        run: async () => ({ changes: 0 }),
      };
    },
    all: async () => [],
    get: async () => undefined,
    run: async () => ({ changes: 0 }),
    transaction: (operation: (db: DatabaseClient) => Promise<unknown>) => {
      const run = () => operation(database as unknown as DatabaseClient);
      return Object.assign(run, { immediate: run });
    },
  } as unknown as DatabaseClient;

  const repository = new ScheduledTaskRepository(database);
  const [task] = await repository.list("user-id");
  assert.ok(task);
  assert.equal(task.createdAt, 1_793_364_000_000);
  assert.equal(task.updatedAt, 1_793_364_000_001);
  assert.equal(task.lastRunAt, 1_793_364_000_002);
  assert.equal(task.nextRunAt, 1_793_364_000_003);
  assert.equal(typeof task.createdAt, "number");

  const [run] = await repository.listRuns("user-id", "task-id");
  assert.ok(run);
  assert.equal(run.scheduledFor, null);
  assert.equal(run.createdAt, 1_793_364_000_004);
  assert.equal(run.startedAt, 1_793_364_000_005);
  assert.equal(run.finishedAt, 1_793_364_000_006);
  assert.equal(typeof run.createdAt, "number");
});
