# Slice 01: Postgres foundation and conversations/projects

## Contract

Vercel production repositories use an async database interface backed by Supabase Postgres; local development can use SQLite through the same interface. The pool is created once per warm process, capped at one client, uses TLS, and works through Supabase's transaction pooler. Schema installation is a reviewed migration operation, never function startup behavior. Conversation and project snapshot CRUD persist in Postgres.

## API seam

`backend/src/platform/database` owns connection selection, typed query results, affected-row counts, and transaction lifecycle. `ConversationRepository` and `ProjectRepository` must not import or depend on `better-sqlite3` or `pg` types. HTTP handlers await repository methods and preserve their response contracts.

## Verification

- Run backend typecheck and production build.
- Run focused repository/route behavior tests against a local Postgres-compatible fixture or isolated test database.
- Run the app with `VERCEL=1` and no `DATABASE_URL`; startup must fail with a concise configuration error rather than silently create ephemeral SQLite.
- With a valid transaction-pooler URL, create/read/update/delete conversations and replace/import project snapshots; verify transaction rollback and owner scoping.

## Human review

The database password is not needed for code review. Before enabling production, the user must add the Supabase transaction-pooler URI as `DATABASE_URL` in Vercel Production and redeploy after the migration is applied.

## Delegated decisions

Internal names and file boundaries may change if database ownership remains singular. Do not change public API JSON shapes, Supabase Auth identity, per-user ownership semantics, or move database credentials to frontend variables.
