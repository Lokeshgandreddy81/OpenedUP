# Supabase Postgres backend

## Next Agent Prompt

The code migration is implemented, but the Vercel deployment and Supabase production project have not been validated from this workspace. The user selected Supabase Postgres. Before declaring launch complete, apply both migrations, configure Vercel backend secrets and `DATABASE_URL`, enable Vercel Sandbox, deploy, and smoke-test `/readyz`, auth, and persistence across separate function invocations. Keep SQLite only as a local development adapter. Update this section after the live checks.

## Goal and constraints

Move all durable backend data from process-local SQLite to Supabase Postgres for Vercel. The backend runs as a Node.js serverless function, so use Supabase's shared transaction pooler connection string, a module-scoped pool capped at one connection per warm instance, SSL required, and no session-dependent features. Never expose the connection string to browser code. Supabase Auth remains the user identity provider; backend table queries remain server-only.

The existing `supabase/migrations/20261028000000_openedup_app_schema.sql` is a starting schema, not proof the application uses Postgres. The code currently has synchronous `better-sqlite3` repositories, filesystem skill storage, local scheduled-task worker loops, and Docker sandbox code. Do not claim those behaviors are durable or serverless-compatible until each owning slice is complete.

## Slice graph

1. **Postgres foundation and conversation/project repositories** (`slices/01-postgres-foundation.md`): transaction-safe query interface, runtime connection settings, schema migration path, conversations and project snapshots. First useful API checkpoint is persistent conversation CRUD.
2. **Artifacts and encrypted provider credentials** (`slices/02-artifacts-and-credentials.md`): convert remaining core user data writes; preserve ownership filters, encrypted BYOK fields, idempotency, and transactions.
3. **Skills and scheduled task persistence**: skill metadata and scheduled-task records use the database abstraction; skill file contents use a private Supabase Storage bucket. `backend/src/scheduledWorker.ts` is a bounded one-shot runner intended for a Northflank scheduled job.
4. **Serverless deployment contract and data cutover** (`slices/04-vercel-cutover.md`): remove SQLite from Vercel, apply migrations, configure `DATABASE_URL`, verify health/readiness and persistence across separate invocations; document migration from any existing local SQLite data.
5. **Sandbox execution boundary**: Vercel deployments use the Vercel Sandbox SDK for isolated Bash/Read/Write/SendUserFile tools. Generated files and signed uploads use private Supabase Storage buckets.

## Review map

- One database owner: `backend/src/platform/database`; repositories depend on async typed operations, not driver APIs.
- Postgres is the Vercel production store. SQLite is local-only and must not be selected silently in production.
- Serverless connections use the Supabase shared transaction pooler, SSL, and low per-instance pool size.
- One migration history under `supabase/migrations`; apply it with the Supabase CLI, not at request startup.
- File bytes live in Supabase Storage. SQL stores metadata and object paths only.
- Scheduled execution is a bounded worker invocation; no process-lifetime polling loop in Vercel.
- Readiness reports degraded unless production persistence is connected and verified.

## Current implementation status

- [x] Async database abstraction, Postgres pool, and conversation, project, artifact, credential, skill metadata, and scheduled-task repositories select Postgres when `DATABASE_URL` is configured. SQLite remains the local development adapter.
- [x] Async HTTP error forwarding for the converted API routes.
- [x] `/readyz` now performs a database connectivity check and returns HTTP 503 when readiness is degraded.
- [x] Skill files and generated chat files persist in private Supabase Storage buckets; builtin skills are seeded into Postgres/storage.
- [x] Vercel Sandbox integration and bounded scheduled-worker entrypoint.
- [x] Bounded abandoned-upload cleanup job.
- [x] Backend and frontend typechecks/builds, backend tests, and npm audit pass. One live Anthropic test is skipped when no provider key is present.
- [ ] Live Supabase/Vercel/Northflank deployment smoke checks remain external setup steps.

## Active blockers

- Apply `20261028000000_openedup_app_schema.sql` and `20261029000000_skill_storage_bucket.sql` in Supabase.
- Add `DATABASE_URL` and the required server-only secrets in the Vercel backend environment; enable Vercel Sandbox.
- Deploy a Northflank scheduled job from `backend/Dockerfile`, running `node dist/scheduled-worker.js` once per minute with the same backend environment.
- Deploy a second daily cleanup job running `node dist/upload-cleanup-worker.js` with the same Supabase server environment.
- No production smoke test has proven persistence across separate serverless invocations.

## Global TODO

- [x] Implement repository conversion, storage persistence, async routes, readiness, sandbox adapter, and bounded worker.
- [ ] Apply migrations and configure Vercel/Northflank production environments.
- [ ] Verify authenticated app behavior and persistence against the live production stack.
