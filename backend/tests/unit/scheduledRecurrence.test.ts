import { describe, expect, it } from "vitest";
import { nextScheduledOccurrence } from "../../src/domains/scheduled/application/recurrence.js";

describe("scheduled task recurrence", () => {
  it("returns the next daily wall-clock occurrence in the selected timezone", () => {
    const after = Date.parse("2026-10-25T00:00:00.000Z");
    const actual = nextScheduledOccurrence(after, {
      frequency: "daily",
      time: "09:00",
      timezone: "Asia/Kolkata",
    });

    expect(new Date(actual).toISOString()).toBe("2026-10-25T03:30:00.000Z");
  });

  it("returns the next selected weekday rather than the same local day", () => {
    const after = Date.parse("2026-10-25T04:00:00.000Z"); // Sunday, 09:30 in Kolkata
    const actual = nextScheduledOccurrence(after, {
      frequency: "weekly",
      time: "09:00",
      timezone: "Asia/Kolkata",
      dayOfWeek: 1,
    });

    expect(new Date(actual).toISOString()).toBe("2026-10-26T03:30:00.000Z");
  });

  it("clamps a monthly date to the last day of shorter months", () => {
    const after = Date.parse("2025-01-31T05:00:00.000Z");
    const actual = nextScheduledOccurrence(after, {
      frequency: "monthly",
      time: "09:00",
      timezone: "Asia/Kolkata",
      dayOfMonth: 31,
    });

    expect(new Date(actual).toISOString()).toBe("2025-02-28T03:30:00.000Z");
  });

  it("skips a nonexistent wall time during spring-forward", () => {
    const after = Date.parse("2026-03-08T08:00:00.000Z");
    const actual = nextScheduledOccurrence(after, {
      frequency: "daily",
      time: "02:30",
      timezone: "America/Los_Angeles",
    });

    expect(new Date(actual).toISOString()).toBe("2026-03-09T09:30:00.000Z");
  });

  it("runs only once on a repeated wall time during fall-back", () => {
    const afterFirstOccurrence = Date.parse("2026-11-01T08:45:00.000Z");
    const actual = nextScheduledOccurrence(afterFirstOccurrence, {
      frequency: "daily",
      time: "01:30",
      timezone: "America/Los_Angeles",
    });

    expect(new Date(actual).toISOString()).toBe("2026-11-02T09:30:00.000Z");
  });
});
