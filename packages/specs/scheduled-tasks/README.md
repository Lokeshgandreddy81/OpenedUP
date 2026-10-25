# Scheduled tasks (10/10 Architecture & Implementation)

## Goal

Provide a robust, durable, and autonomous background scheduling system that executes even when the browser is closed. The feature operates without mandatory user authentication, supporting optional authentication with fallback to a shared `"default"` context. Scheduled tasks execute using the selected chat model and credentials resolved from task-level overrides, the credential vault, or server environment variables.

## Current State

The feature is fully implemented and operating at 10/10 production quality across:
- **Backend HTTP API**: Unauthenticated `/api/scheduled-tasks` endpoints for CRUD, manual execution, browser migration, and run history.
- **In-Process Worker (`ScheduledTaskWorker`)**: Persistent background loop with lease-based crash recovery (`lease_until`), burst processing (up to 5 runs per tick), and immediate worker dispatch on manual runs.
- **Timezone Recurrence Engine**: Pure mathematical recurrence engine supporting Daily, Weekdays, Weekly (with weekday selection), and Monthly (with day-of-month 1–31 selection), correctly handling daylight saving folds/gaps and month ends.
- **Frontend Presentation (`ScheduledTasksView.tsx`)**: High-craft dashboard with an unclipped responsive sidebar (`w-72 lg:w-80`), active/paused indicators, dedicated 4-card Task Detail view, execution history timeline with formatted markdown responses, quick emoji selector, and frosted glass execution modal.

## Decisions and Boundaries

- **Autonomous Execution**: Unauthenticated requests use user ID `"default"`. If a Firebase token is present, the request is scoped to that user ID.
- **Credential Resolution Priority**:
  1. Per-task custom API key override (`apiKey` field on task)
  2. Workspace saved credentials in `credentialVault`
  3. Environment variable fallback (e.g., `GEMINI_API_KEY`)
- **Frequencies Supported**:
  - `daily`: Runs every day at specified wall-clock time.
  - `weekdays`: Runs Monday through Friday.
  - `weekly`: Runs on selected day of the week (Monday through Sunday).
  - `monthly`: Runs on selected day of month (1 to 31), clamped to final day of shorter months.
- **Timezone Calculation**: Stored with IANA timezone string; UTC timestamp calculated using `nextScheduledOccurrence` to maintain wall-clock stability across DST transitions.
- **Crash Recovery & Concurrency**: Leased runs ensure at-least-once execution. Stale runs (>5 minutes) are recovered on server restart. Recurring occurrences are coalesced so missed intervals trigger one catch-up run.
- **Instant Manual Execution**: `POST /api/scheduled-tasks/:id/run` triggers execution immediately in the background worker without waiting for the 2-second interval tick.
- **Fast Adaptive Polling**: Frontend polls at 350ms, 600ms, and 1s intervals for responsive status updates.
- **Conversation Linkage**: When `startInNewChat` is true, each run creates its own conversation thread. When false, runs append to the task's dedicated conversation thread.

## Review Surface

- Create, list, edit, pause/resume, and delete schedules.
- Verify weekly and monthly daylight-saving behavior with deterministic IANA fixtures.
- Verify manual "Run Now" triggers immediate background execution and streams outputs to the execution modal and history timeline.
- Verify task deletion prompts a confirmation dialog to prevent accidental schedule loss.

## Single-Owner Invariants

- Shared Zod contracts in `backend/contracts` own request/response validation and recurrence schemas.
- `backend/src/domains/scheduled/repositories` owns all scheduled task and run SQLite queries.
- `backend/src/domains/scheduled/application/recurrence.ts` owns pure wall-time calculations.
- `backend/src/domains/scheduled/application/scheduledTaskService.ts` coordinates task lifecycle, credential resolution, and chat generation.
- `backend/src/domains/scheduled/application/scheduledTaskWorker.ts` owns the timer loop and crash recovery.
- `frontend/src/features/scheduled/services/scheduledTasksApi.ts` owns the unauthenticated HTTP client.
- `frontend/src/features/scheduled/components/ScheduledTasksView.tsx` owns the 10/10 dashboard presentation.
