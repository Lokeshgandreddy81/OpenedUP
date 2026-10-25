# 01 — Contracts, storage, recurrence

## Unlocks

One canonical wire/data shape and a deterministic schedule calculator that the HTTP API and background worker can share.

## Owned seams

- `backend/contracts/src/schemas/index.ts`: create/update/import request and task/run response schemas. Task identity, ownership, run state, timestamps, next UTC occurrence, model ID, effort, timezone, recurrence, and preferences have explicit types. Import requests contain legacy task IDs and are idempotent per owner.
- `backend/src/domains/scheduled/application/recurrence.ts`: pure `nextOccurrence(after, recurrence)` accepting a fixed epoch and returning the next matching epoch in an IANA timezone.
- `backend/src/platform/database/chatDatabase.ts`: additive `scheduled_tasks` and `scheduled_task_runs` tables; update schema version without rewriting other records.
- `backend/src/domains/scheduled/repositories/scheduledTaskRepository.ts`: owner-scoped task/run reads/writes, due-task claiming, run leases and startup recovery.

Task recurrence fields: `frequency` daily/weekdays/weekly/monthly, `time` in `HH:mm`, IANA `timezone`, and weekday or day-of-month only for the matching frequency. Monthly days past a month's end clamp to that month's final date. A due occurrence is unique by `(task_id, scheduled_for)`; manual runs have no scheduled occurrence key.

## Runnable evidence

Vitest tests use in-memory SQLite and fixed timestamps. Test existing schemas migrate without changing project/chat data, owner isolation, import idempotency, and actual next-occurrence values across weekday boundaries, leap/month ends, DST gaps/folds, and invalid timezones.

## Out of scope

Routes, provider calls, worker lifecycle, frontend API wiring, notification delivery, UI styling.

## Delegated

Repository method naming and private row-mapping structure are implementation details. Persistence must remain parameterized SQL and every user-facing query must include the owner UID.
