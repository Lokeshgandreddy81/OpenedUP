import {
  MODEL_REGISTRY,
  getChatModels,
  type ScheduledTaskInput,
  type ScheduledTaskRecord,
  type ScheduledTaskRunRecord,
} from "@charan-interiors/contracts";
import type { ScheduledTask, TaskFrequency } from "../components/scheduledTypes";

const LEGACY_TASKS_KEY = "shoebox_scheduled_tasks";
const IMPORT_MARKER_KEY = "shoebox_scheduled_tasks_imported_v1";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Keep scheduled runs aligned with the models offered in the regular chat picker.
// The custom endpoint is user-defined and is not a stable choice for a background task.
export const SCHEDULED_MODEL_IDS = getChatModels()
  .filter((model) => model.id !== "custom-model")
  .map((model) => model.id);

export function scheduledModelName(id: string): string {
  return MODEL_REGISTRY[id]?.name ?? id;
}

function toDisplayTime(time: string): string {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
}

function toApiTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return "09:00";
  let hour = Number(match[1]) % 12;
  if (match[3]?.toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function formatRunTime(epoch: number | null, timezone: string): string | undefined {
  if (epoch === null) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(epoch);
}

function fromApiTask(task: ScheduledTaskRecord): ScheduledTask {
  return {
    id: task.id,
    title: task.title,
    prompt: task.prompt,
    icon: task.icon,
    frequency: task.frequency,
    time: toDisplayTime(task.time),
    timezone: task.timezone,
    ...(task.dayOfWeek === undefined ? {} : { dayOfWeek: DAYS[task.dayOfWeek] }),
    ...(task.dayOfMonth === undefined ? {} : { dayOfMonth: task.dayOfMonth }),
    isActive: task.isActive,
    createdAt: task.createdAt,
    ...(task.lastRunAt === null ? {} : { lastRun: formatRunTime(task.lastRunAt, task.timezone) }),
    ...(task.nextRunAt === null ? {} : { nextRun: formatRunTime(task.nextRunAt, task.timezone) }),
    notifications: task.notifications,
    startInNewChat: task.startInNewChat,
    model: task.model,
    effort: task.effort,
  };
}

function toApiTask(task: ScheduledTask): ScheduledTaskInput {
  const dayOfWeek = task.dayOfWeek ? DAYS.indexOf(task.dayOfWeek) : -1;
  return {
    title: task.title,
    prompt: task.prompt,
    icon: task.icon,
    frequency: task.frequency,
    time: toApiTime(task.time),
    timezone: task.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    ...(task.frequency === "weekly" ? { dayOfWeek: Math.max(0, dayOfWeek) } : {}),
    ...(task.frequency === "monthly"
      ? { dayOfMonth: task.dayOfMonth ?? getDayOfMonth(task.createdAt, task.timezone || "UTC") }
      : {}),
    isActive: task.isActive,
    model: task.model || "gpt-6-astra",
    effort: task.effort || "Medium",
    notifications: task.notifications || "Important updates",
    startInNewChat: task.startInNewChat || false,
    ...(task.apiKey ? { apiKey: task.apiKey } : {}),
  };
}

function getDayOfMonth(epoch: number, timezone: string): number {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: timezone, day: "numeric" }).format(
    epoch
  );
  return Number(day);
}

function legacyModel(value: unknown): string {
  if (typeof value === "string" && MODEL_REGISTRY[value]?.isChatModel) return value;
  const name = typeof value === "string" ? value.toLowerCase() : "";
  if (name.includes("claude")) return "claude-opus-5.5";
  if (name.includes("gemini")) return "gemini-4-argon";
  if (name.includes("deepseek")) return "deepseek-v4-pro";
  if (name.includes("grok")) return "grok-4.7";
  return "gpt-6-astra";
}

function legacyFrequency(value: unknown): TaskFrequency {
  if (value === "weekdays" || value === "weekly" || value === "monthly") return value;
  if (value === "custom") return "monthly";
  return "daily";
}

function legacyWeekday(value: unknown): number {
  if (typeof value === "number" && value >= 0 && value <= 6) return value;
  if (typeof value === "string") {
    const index = DAYS.findIndex((day) => day.toLowerCase() === value.toLowerCase());
    if (index >= 0) return index;
  }
  return 1;
}

function legacyInput(raw: unknown, timezone: string) {
  if (!raw || typeof raw !== "object") return null;
  const task = raw as Record<string, unknown>;
  const id = typeof task.id === "string" ? task.id : "";
  const createdAt = typeof task.createdAt === "number" ? task.createdAt : Date.now();
  const frequency = legacyFrequency(task.frequency);
  const displayTime = typeof task.time === "string" ? task.time : "9:00 AM";
  const model = legacyModel(task.model);
  return {
    legacyId: id || `legacy-${createdAt}-${String(task.title || "task")}`,
    createdAt,
    legacyFrequency: task.frequency === "custom" ? "custom" : undefined,
    title: typeof task.title === "string" && task.title.trim() ? task.title : "Scheduled task",
    prompt:
      typeof task.prompt === "string" && task.prompt.trim()
        ? task.prompt
        : "Review my updates and summarize what needs attention.",
    icon: typeof task.icon === "string" ? task.icon : "⏱️",
    frequency,
    time: toApiTime(displayTime),
    timezone,
    ...(frequency === "weekly" ? { dayOfWeek: legacyWeekday(task.dayOfWeek) } : {}),
    ...(frequency === "monthly"
      ? {
          dayOfMonth:
            typeof task.dayOfMonth === "number"
              ? task.dayOfMonth
              : getDayOfMonth(createdAt, timezone),
        }
      : {}),
    isActive: typeof task.isActive === "boolean" ? task.isActive : true,
    model,
    effort: task.effort === "Low" || task.effort === "High" ? task.effort : "Medium",
    notifications:
      task.notifications === "Failed runs only" ? "Failed runs only" : "Important updates",
    startInNewChat: Boolean(task.startInNewChat),
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok)
    throw new Error(
      typeof body.error === "string" ? body.error : "Scheduled tasks request failed."
    );
  return body as T;
}

async function scheduledFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  return fetch(input, init);
}

async function ensureLegacyImport(): Promise<void> {
  const importedBy = localStorage.getItem(IMPORT_MARKER_KEY);
  if (importedBy) return;
  let legacy: unknown[] = [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LEGACY_TASKS_KEY) || "[]");
    if (Array.isArray(parsed)) legacy = parsed;
  } catch {
    // Keep malformed local data untouched; there is nothing safe to import.
  }
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const tasks = legacy.map((task) => legacyInput(task, timezone)).filter((task) => task !== null);
  if (tasks.length > 0) {
    const response = await scheduledFetch("/api/scheduled-tasks/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
    await parseResponse(response);
  }
  localStorage.setItem(IMPORT_MARKER_KEY, "imported");
}

export async function listScheduledTasks(): Promise<ScheduledTask[]> {
  await ensureLegacyImport();
  const response = await scheduledFetch("/api/scheduled-tasks");
  const body = await parseResponse<{ tasks: ScheduledTaskRecord[] }>(response);
  return body.tasks.map(fromApiTask);
}

export async function createScheduledTask(input: ScheduledTaskInput): Promise<ScheduledTask> {
  const response = await scheduledFetch("/api/scheduled-tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseResponse<{ task: ScheduledTaskRecord }>(response);
  return fromApiTask(body.task);
}

export async function updateScheduledTask(id: string, task: ScheduledTask): Promise<ScheduledTask> {
  const response = await scheduledFetch(`/api/scheduled-tasks/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiTask(task)),
  });
  const body = await parseResponse<{ task: ScheduledTaskRecord }>(response);
  return fromApiTask(body.task);
}

export async function deleteScheduledTask(id: string): Promise<void> {
  const response = await scheduledFetch(`/api/scheduled-tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) await parseResponse(response);
}

export async function listScheduledTaskRuns(taskId: string): Promise<ScheduledTaskRunRecord[]> {
  const response = await scheduledFetch(`/api/scheduled-tasks/${encodeURIComponent(taskId)}/runs`);
  const body = await parseResponse<{ runs: ScheduledTaskRunRecord[] }>(response);
  return body.runs;
}

export async function runScheduledTask(
  id: string,
  apiKey?: string
): Promise<ScheduledTaskRunRecord> {
  const headers = new Headers();
  if (apiKey) headers.set("x-provider-key", apiKey);
  const response = await scheduledFetch(`/api/scheduled-tasks/${encodeURIComponent(id)}/run`, {
    method: "POST",
    headers,
  });
  const body = await parseResponse<{ run: ScheduledTaskRunRecord }>(response);
  let run = body.run;
  for (
    let attempt = 0;
    attempt < 120 && (run.status === "queued" || run.status === "running");
    attempt += 1
  ) {
    const delay = attempt === 0 ? 350 : attempt < 3 ? 600 : 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    const statusResponse = await scheduledFetch(
      `/api/scheduled-tasks/runs/${encodeURIComponent(run.id)}`
    );
    run = (await parseResponse<{ run: ScheduledTaskRunRecord }>(statusResponse)).run;
  }
  return run;
}

export function taskInput(task: ScheduledTask): ScheduledTaskInput {
  return toApiTask(task);
}

export function scheduledRunMessage(run: ScheduledTaskRunRecord): string {
  if (run.status === "succeeded") return run.output || "The task completed without a response.";
  if (run.status === "failed") return run.error || "The task run failed.";
  return "The task is still running. Check its run history shortly.";
}
