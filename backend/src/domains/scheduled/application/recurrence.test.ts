import assert from "node:assert/strict";
import test from "node:test";
import { nextScheduledOccurrence } from "./recurrence.js";

test("daily recurrence stays at the requested local wall time and rolls forward strictly", () => {
  const recurrence = { frequency: "daily" as const, time: "09:00", timezone: "UTC" };
  assert.equal(
    new Date(nextScheduledOccurrence(Date.parse("2026-10-27T08:59:00Z"), recurrence)).toISOString(),
    "2026-10-27T09:00:00.000Z"
  );
  assert.equal(
    new Date(nextScheduledOccurrence(Date.parse("2026-10-27T09:00:00Z"), recurrence)).toISOString(),
    "2026-10-28T09:00:00.000Z"
  );
});

test("weekdays and weekly schedules honor their selected calendar days", () => {
  assert.equal(
    new Date(
      nextScheduledOccurrence(Date.parse("2026-10-30T09:01:00Z"), {
        frequency: "weekdays",
        time: "09:00",
        timezone: "UTC",
      })
    ).toISOString(),
    "2026-11-02T09:00:00.000Z"
  );
  assert.equal(
    new Date(
      nextScheduledOccurrence(Date.parse("2026-10-27T00:00:00Z"), {
        frequency: "weekly",
        time: "09:00",
        timezone: "UTC",
        dayOfWeek: 6,
      })
    ).toISOString(),
    "2026-10-31T09:00:00.000Z"
  );
});

test("monthly dates clamp to the last day of shorter months", () => {
  assert.equal(
    new Date(
      nextScheduledOccurrence(Date.parse("2026-02-01T00:00:00Z"), {
        frequency: "monthly",
        time: "09:00",
        timezone: "UTC",
        dayOfMonth: 31,
      })
    ).toISOString(),
    "2026-02-28T09:00:00.000Z"
  );
});

test("timezone conversion preserves the local wall time across DST transitions", () => {
  assert.equal(
    new Date(
      nextScheduledOccurrence(Date.parse("2026-10-26T19:44:00Z"), {
        frequency: "daily",
        time: "01:15",
        timezone: "Asia/Kolkata",
      })
    ).toISOString(),
    "2026-10-26T19:45:00.000Z"
  );
  assert.equal(
    new Date(
      nextScheduledOccurrence(Date.parse("2026-03-08T00:00:00Z"), {
        frequency: "daily",
        time: "02:30",
        timezone: "America/New_York",
      })
    ).toISOString(),
    "2026-03-09T06:30:00.000Z"
  );
});
