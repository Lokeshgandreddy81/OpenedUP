import { randomUUID } from "node:crypto";
import type {
  ImportScheduledTasksRequest,
  ScheduledTaskInput,
  ScheduledTaskRecord,
  ScheduledTaskRunRecord,
  UpdateScheduledTaskRequest,
} from "@charan-interiors/contracts";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import {
  asDatabaseClient,
  type DatabaseClient,
} from "../../../platform/database/databaseClient.js";
import {
  nextScheduledOccurrence,
  type ScheduledFrequency,
  type ScheduledRecurrence,
} from "../application/recurrence.js";

interface TaskRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  legacy_id: string | null;
  title: string;
  prompt: string;
  icon: string;
  frequency: ScheduledTaskInput["frequency"];
  time: string;
  timezone: string;
  day_of_week: number | null;
  day_of_month: number | null;
  is_active: number;
  model_id: string;
  effort: ScheduledTaskInput["effort"];
  notifications: ScheduledTaskInput["notifications"];
  start_in_new_chat: number;
  conversation_id: string | null;
  created_at: number;
  updated_at: number;
  last_run_at: number | null;
  next_run_at: number | null;
}

interface RunRow extends Record<string, unknown> {
  id: string;
  task_id: string;
  trigger: ScheduledTaskRunRecord["trigger"];
  status: ScheduledTaskRunRecord["status"];
  scheduled_for: number | null;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  output: string | null;
  error: string | null;
  model_used: string | null;
  provider_used: string | null;
  conversation_id: string | null;
}

const TASK_COLUMNS = `id, user_id, legacy_id, title, prompt, icon, frequency, time, timezone,
  day_of_week, day_of_month, is_active, model_id, effort, notifications, start_in_new_chat,
  conversation_id, created_at, updated_at, last_run_at, next_run_at`;

function recurrence(
  task: Pick<ScheduledTaskInput, "frequency" | "time" | "timezone" | "dayOfWeek" | "dayOfMonth">
): ScheduledRecurrence {
  return {
    frequency: task.frequency,
    time: task.time,
    timezone: task.timezone,
    ...(task.dayOfWeek === undefined ? {} : { dayOfWeek: task.dayOfWeek }),
    ...(task.dayOfMonth === undefined ? {} : { dayOfMonth: task.dayOfMonth }),
  };
}

function toTask(row: TaskRow): ScheduledTaskRecord {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    icon: row.icon,
    frequency: row.frequency,
    time: row.time,
    timezone: row.timezone,
    ...(row.day_of_week === null ? {} : { dayOfWeek: row.day_of_week }),
    ...(row.day_of_month === null ? {} : { dayOfMonth: row.day_of_month }),
    isActive: Boolean(row.is_active),
    model: row.model_id,
    effort: row.effort,
    notifications: row.notifications,
    startInNewChat: Boolean(row.start_in_new_chat),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
  };
}

function toRun(row: RunRow): ScheduledTaskRunRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    trigger: row.trigger,
    status: row.status,
    scheduledFor: row.scheduled_for,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    output: row.output,
    error: row.error,
    modelUsed: row.model_used,
    providerUsed: row.provider_used,
    conversationId: row.conversation_id,
  };
}

export interface ScheduledTaskForExecution extends ScheduledTaskRecord {
  userId: string;
  conversationId: string | null;
}

export interface ClaimedScheduledRun extends ScheduledTaskRunRecord {
  userId: string;
  conversationId: string | null;
}

export class ScheduledTaskRepository {
  private readonly db: DatabaseClient;

  constructor(db?: DatabaseClient | BetterSqliteDatabase) {
    this.db = asDatabaseClient(db);
  }

  async list(userId: string): Promise<ScheduledTaskRecord[]> {
    return (
      await this.db
        .prepare(
          `SELECT ${TASK_COLUMNS} FROM scheduled_tasks WHERE user_id = ? ORDER BY is_active DESC, next_run_at ASC, created_at DESC`
        )
        .all(userId) as TaskRow[]
    ).map(toTask);
  }

  async get(userId: string, taskId: string): Promise<ScheduledTaskRecord | null> {
    const row = await this.db
      .prepare(`SELECT ${TASK_COLUMNS} FROM scheduled_tasks WHERE user_id = ? AND id = ?`)
      .get(userId, taskId) as TaskRow | undefined;
    return row ? toTask(row) : null;
  }

  async getForExecution(taskId: string): Promise<ScheduledTaskForExecution | null> {
    const row = await this.db
      .prepare(`SELECT ${TASK_COLUMNS} FROM scheduled_tasks WHERE id = ?`)
      .get(taskId) as TaskRow | undefined;
    return row
      ? { ...toTask(row), userId: row.user_id, conversationId: row.conversation_id }
      : null;
  }

  async create(
    userId: string,
    input: ScheduledTaskInput,
    options: { legacyId?: string; createdAt?: number } = {}
  ): Promise<ScheduledTaskRecord> {
    const now = Date.now();
    const createdAt = options.createdAt ?? now;
    const id = randomUUID();
    const nextRunAt = input.isActive ? nextScheduledOccurrence(now, recurrence(input)) : null;
    await this.insertTask(userId, id, input, createdAt, now, nextRunAt, options.legacyId ?? null);
    const created = await this.get(userId, id);
    if (!created) throw new Error("Scheduled task insert could not be read back.");
    return created;
  }

  private async insertTask(
    userId: string,
    id: string,
    input: ScheduledTaskInput,
    createdAt: number,
    updatedAt: number,
    nextRunAt: number | null,
    legacyId: string | null
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO scheduled_tasks (
      id, user_id, legacy_id, title, prompt, icon, frequency, time, timezone, day_of_week,
      day_of_month, is_active, model_id, effort, notifications, start_in_new_chat,
      created_at, updated_at, next_run_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        userId,
        legacyId,
        input.title,
        input.prompt,
        input.icon,
        input.frequency,
        input.time,
        input.timezone,
        input.dayOfWeek ?? null,
        input.dayOfMonth ?? null,
        Number(input.isActive),
        input.model,
        input.effort,
        input.notifications,
        Number(input.startInNewChat),
        createdAt,
        updatedAt,
        nextRunAt
      );
  }

  async update(
    userId: string,
    taskId: string,
    patch: UpdateScheduledTaskRequest
  ): Promise<ScheduledTaskRecord | null> {
    const current = await this.db
      .prepare(`SELECT ${TASK_COLUMNS} FROM scheduled_tasks WHERE user_id = ? AND id = ?`)
      .get(userId, taskId) as TaskRow | undefined;
    if (!current) return null;
    const merged: ScheduledTaskInput = patch;
    const now = Date.now();
    const nextRunAt = merged.isActive ? nextScheduledOccurrence(now, recurrence(merged)) : null;
    await this.db
      .prepare(
        `UPDATE scheduled_tasks SET title = ?, prompt = ?, icon = ?, frequency = ?, time = ?,
      timezone = ?, day_of_week = ?, day_of_month = ?, is_active = ?, model_id = ?, effort = ?,
      notifications = ?, start_in_new_chat = ?, updated_at = ?, next_run_at = ?
      WHERE user_id = ? AND id = ?`
      )
      .run(
        merged.title,
        merged.prompt,
        merged.icon,
        merged.frequency,
        merged.time,
        merged.timezone,
        merged.dayOfWeek ?? null,
        merged.dayOfMonth ?? null,
        Number(merged.isActive),
        merged.model,
        merged.effort,
        merged.notifications,
        Number(merged.startInNewChat),
        now,
        nextRunAt,
        userId,
        taskId
      );
    return await this.get(userId, taskId);
  }

  async delete(userId: string, taskId: string): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM scheduled_tasks WHERE user_id = ? AND id = ?")
      .run(userId, taskId);
    return result.changes > 0;
  }

  async import(
    userId: string,
    request: ImportScheduledTasksRequest
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    const importTasks = this.db.transaction(async () => {
      for (const task of request.tasks) {
        if (
          await this.db
            .prepare("SELECT 1 FROM scheduled_tasks WHERE user_id = ? AND legacy_id = ?")
            .get(userId, task.legacyId)
        )
          continue;
        const { legacyId, createdAt, legacyFrequency: _legacyFrequency, ...input } = task;
        const normalized: ScheduledTaskInput = input;
        const id = randomUUID();
        const now = Date.now();
        const nextRunAt = normalized.isActive
          ? nextScheduledOccurrence(now, recurrence(normalized))
          : null;
        await this.insertTask(userId, id, normalized, createdAt, now, nextRunAt, legacyId);
        imported += 1;
      }
    });
    await importTasks();
    return { imported, skipped: request.tasks.length - imported };
  }

  async enqueueDueRuns(now: number): Promise<number> {
    let queued = 0;
    const enqueue = this.db.transaction(async () => {
      const due = await this.db
        .prepare(
          `SELECT id, frequency, time, timezone, day_of_week, day_of_month, next_run_at
        FROM scheduled_tasks WHERE is_active = 1 AND next_run_at <= ? ORDER BY next_run_at LIMIT 100`
        )
        .all(now) as Array<{
        id: string;
        frequency: ScheduledFrequency;
        time: string;
        timezone: string;
        day_of_week: number | null;
        day_of_month: number | null;
        next_run_at: number;
      }>;
      const insertRun = this.db.prepare(`INSERT INTO scheduled_task_runs
        (id, task_id, user_id, trigger, status, scheduled_for, created_at)
        SELECT ?, id, user_id, 'scheduled', 'queued', ?, ? FROM scheduled_tasks WHERE id = ?
        ON CONFLICT(task_id, scheduled_for) DO NOTHING`);
      const advance = this.db.prepare(
        "UPDATE scheduled_tasks SET next_run_at = ?, updated_at = ? WHERE id = ? AND next_run_at = ?"
      );
      for (const task of due) {
        const next = nextScheduledOccurrence(now, {
          frequency: task.frequency,
          time: task.time,
          timezone: task.timezone,
          ...(task.day_of_week === null ? {} : { dayOfWeek: task.day_of_week }),
          ...(task.day_of_month === null ? {} : { dayOfMonth: task.day_of_month }),
        });
        const result = await insertRun.run(randomUUID(), task.next_run_at, now, task.id);
        queued += result.changes;
        await advance.run(next, now, task.id, task.next_run_at);
      }
    });
    await enqueue();
    return queued;
  }

  async createManualRun(userId: string, taskId: string): Promise<ScheduledTaskRunRecord | null> {
    const task = await this.get(userId, taskId);
    if (!task) return null;
    const id = randomUUID();
    const now = Date.now();
    await this.db
      .prepare(
        `INSERT INTO scheduled_task_runs(id, task_id, user_id, trigger, status, created_at)
      VALUES (?, ?, ?, 'manual', 'queued', ?)`
      )
      .run(id, taskId, userId, now);
    const run = await this.getRun(userId, id);
    return run;
  }

  async claimNextRun(now: number, leaseMs: number): Promise<ClaimedScheduledRun | null> {
    let claimed: ClaimedScheduledRun | null = null;
    const claim = this.db.transaction(async () => {
      const row = await this.db
        .prepare(
          `SELECT r.*, t.user_id, t.conversation_id AS task_conversation_id FROM scheduled_task_runs r
        JOIN scheduled_tasks t ON t.id = r.task_id
        WHERE r.status = 'queued' OR (r.status = 'running' AND r.lease_until <= ?)
        ORDER BY r.created_at LIMIT 1`
        )
        .get(now) as
        (RunRow & { user_id: string; task_conversation_id: string | null }) | undefined;
      if (!row) return;
      const update = await this.db
        .prepare(
          `UPDATE scheduled_task_runs SET status = 'running',
        started_at = COALESCE(started_at, ?), lease_until = ? WHERE id = ? AND
        (status = 'queued' OR (status = 'running' AND lease_until <= ?))`
        )
        .run(now, now + leaseMs, row.id, now);
      if (!update.changes) return;
      claimed = {
        ...toRun(row),
        status: "running",
        startedAt: row.started_at ?? now,
        userId: row.user_id,
        conversationId: row.task_conversation_id,
      };
    });
    await claim.immediate();
    return claimed;
  }

  async finishRun(params: {
    runId: string;
    taskId: string;
    status: "succeeded" | "failed";
    finishedAt: number;
    output?: string;
    error?: string;
    modelUsed?: string;
    providerUsed?: string;
    conversationId?: string;
  }): Promise<void> {
    const task = await this.getForExecution(params.taskId);
    await this.db
      .prepare(
        `UPDATE scheduled_task_runs SET status = ?, finished_at = ?, lease_until = NULL,
      output = ?, error = ?, model_used = ?, provider_used = ?, conversation_id = ? WHERE id = ?`
      )
      .run(
        params.status,
        params.finishedAt,
        params.output ?? null,
        params.error ?? null,
        params.modelUsed ?? null,
        params.providerUsed ?? null,
        params.conversationId ?? null,
        params.runId
      );
    if (task)
      await this.db
        .prepare("UPDATE scheduled_tasks SET last_run_at = ?, updated_at = ? WHERE id = ?")
        .run(params.finishedAt, params.finishedAt, params.taskId);
  }

  async setConversationId(taskId: string, conversationId: string): Promise<void> {
    await this.db
      .prepare("UPDATE scheduled_tasks SET conversation_id = ? WHERE id = ?")
      .run(conversationId, taskId);
  }

  async recoverLeases(): Promise<void> {
    await this.db
      .prepare("UPDATE scheduled_task_runs SET lease_until = 0 WHERE status = 'running'")
      .run();
  }

  async getRun(userId: string, runId: string): Promise<ScheduledTaskRunRecord | null> {
    const row = await this.db
      .prepare("SELECT * FROM scheduled_task_runs WHERE user_id = ? AND id = ?")
      .get(userId, runId) as RunRow | undefined;
    return row ? toRun(row) : null;
  }

  async listRuns(userId: string, taskId: string, limit = 30): Promise<ScheduledTaskRunRecord[]> {
    return (
      await this.db
        .prepare(
          `SELECT * FROM scheduled_task_runs WHERE user_id = ? AND task_id = ?
      ORDER BY created_at DESC LIMIT ?`
        )
        .all(userId, taskId, limit) as RunRow[]
    ).map(toRun);
  }
}
