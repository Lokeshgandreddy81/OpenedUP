# Supabase Postgres backend

## Next Agent Prompt

The Vercel container is deployed from `main`. On 2026-10-29, `/healthz` and `/readyz` both returned 200; readiness reported Python, vault, and persistent storage ready. The Chapters UI also showed a PDF with 31 extracted chapters and rendered its selected page. These checks verify container startup, database connectivity, and the visible PDF reading path; they do not prove schema migration completeness, every authenticated API, or persistence across separate function invocations. Finish those checks before calling the full production cutover complete. Keep SQLite only as a local development adapter.

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
- [x] Production Vercel container starts and `/healthz` and `/readyz` return 200; readiness confirms database connectivity, Python availability, and vault health.
- [ ] Verify both SQL migrations and the authenticated APIs that depend on their tables; `/readyz` checks only database connectivity.
- [ ] Verify persistence across separate Vercel invocations and confirm Vercel Sandbox and scheduled jobs are configured.

## Active blockers

- Apply `20261028000000_openedup_app_schema.sql` and `20261029000000_skill_storage_bucket.sql` in Supabase.
- Verify required server-only storage and sandbox settings in Vercel; readiness does not check those integrations.
- Deploy a Northflank scheduled job from the repository-root `Dockerfile`, running `node dist/scheduled-worker.js` once per minute with the same backend environment.
- Deploy a second daily cleanup job running `node dist/upload-cleanup-worker.js` with the same Supabase server environment.
- No production smoke test has proven persistence across separate serverless invocations.

## Global TODO

- [x] Implement repository conversion, storage persistence, async routes, readiness, sandbox adapter, and bounded worker.
- [ ] Verify schema migrations and all authenticated APIs against the live production stack.
- [ ] Verify cross-invocation persistence and complete Vercel Sandbox/Northflank worker configuration.
