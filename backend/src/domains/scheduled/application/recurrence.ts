export type ScheduledFrequency = "daily" | "weekdays" | "weekly" | "monthly";

export interface ScheduledRecurrence {
  frequency: ScheduledFrequency;
  time: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function partsAt(epochMs: number, timezone: string): LocalDateTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(epochMs);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
  };
}

function dateKey(date: Pick<LocalDateTime, "year" | "month" | "day">): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function timezoneOffsetAt(epochMs: number, timezone: string): number {
  const local = partsAt(epochMs, timezone);
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  return localAsUtc - Math.floor(epochMs / 60_000) * 60_000;
}

function parseTime(time: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error("Scheduled time must use HH:mm format.");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error("Scheduled time is invalid.");
  return { hour, minute };
}

function addCalendarDays(date: Pick<LocalDateTime, "year" | "month" | "day">, days: number) {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

function matchesFrequency(
  date: ReturnType<typeof addCalendarDays>,
  recurrence: ScheduledRecurrence
) {
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  if (recurrence.frequency === "weekdays") return weekday !== 0 && weekday !== 6;
  if (recurrence.frequency === "weekly") return weekday === recurrence.dayOfWeek;
  if (recurrence.frequency === "monthly") {
    const finalDay = new Date(Date.UTC(date.year, date.month, 0)).getUTCDate();
    return date.day === Math.min(recurrence.dayOfMonth || date.day, finalDay);
  }
  return true;
}

/** Find the next matching instant, preserving local wall time across timezone transitions. */
export function nextScheduledOccurrence(afterMs: number, recurrence: ScheduledRecurrence): number {
  const { hour, minute } = parseTime(recurrence.time);
  // Validate the IANA zone before entering the search loop.
  const today = partsAt(afterMs, recurrence.timezone);
  for (let dayOffset = 0; dayOffset <= 370; dayOffset += 1) {
    const date = addCalendarDays(today, dayOffset);
    if (!matchesFrequency(date, recurrence)) continue;

    const targetDate = dateKey(date);
    const nominalUtc = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
    // Sample offsets around the target local date. This covers both sides of
    // timezone transitions without formatting every minute in a 36-hour window.
    const offsets = new Set<number>();
    for (let delta = -36; delta <= 36; delta += 6) {
      offsets.add(timezoneOffsetAt(nominalUtc + delta * 60 * 60_000, recurrence.timezone));
    }
    const candidates = [...offsets]
      .map((offset) => nominalUtc - offset)
      .filter((instant) => {
        const local = partsAt(instant, recurrence.timezone);
        return dateKey(local) === targetDate && local.hour === hour && local.minute === minute;
      })
      .sort((left, right) => left - right);

    if (candidates.length === 0) continue; // Nonexistent wall time in a spring-forward gap.
    const occurredOnThisDate = candidates.some((candidate) => candidate <= afterMs);
    if (occurredOnThisDate) continue; // Includes the second occurrence of a fall-back fold.
    const next = candidates.find((candidate) => candidate > afterMs);
    if (next !== undefined) return next;
  }
  throw new Error("Could not find the next scheduled occurrence.");
}
