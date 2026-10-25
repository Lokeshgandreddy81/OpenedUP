import { describe, expect, it } from "vitest";
import { ImportScheduledTasksRequestSchema, ScheduledTaskInputSchema } from "./index.js";

const task = {
  title: "Morning summary",
  prompt: "Summarize updates.",
  frequency: "daily",
  time: "09:00",
  timezone: "Asia/Kolkata",
  model: "gpt-6-astra",
};

describe("scheduled task contracts", () => {
  it("validates IANA timezone and recurrence-specific fields", () => {
    expect(ScheduledTaskInputSchema.safeParse(task).success).toBe(true);
    expect(ScheduledTaskInputSchema.safeParse({ ...task, timezone: "Mars/Olympus" }).success).toBe(
      false
    );
    expect(ScheduledTaskInputSchema.safeParse({ ...task, frequency: "weekly" }).success).toBe(
      false
    );
    expect(
      ScheduledTaskInputSchema.safeParse({ ...task, frequency: "monthly", dayOfMonth: 31 }).success
    ).toBe(true);
  });

  it("rejects duplicate legacy IDs in one import batch", () => {
    const legacyTask = { ...task, legacyId: "old-1", createdAt: 100 };
    expect(
      ImportScheduledTasksRequestSchema.safeParse({ tasks: [legacyTask, legacyTask] }).success
    ).toBe(false);
  });
});
