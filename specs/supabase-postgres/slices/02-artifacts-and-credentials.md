# Slice 02: Artifacts and encrypted provider credentials

## Contract

Artifact records, provider credentials, skills metadata, and scheduled-task records use the same async database boundary as conversation data. Encryption remains in the application layer; Postgres stores nonce, authentication tag, ciphertext, and timestamps only. Ownership filters and existing API response shapes stay unchanged.

## API seam

Repositories use `DatabaseClient` from `backend/src/platform/database`; only that platform layer knows about SQLite or `pg`. Credential vault functions are asynchronous because all database operations can cross a network. HTTP routes forward rejected promises to the central Express error handler.

## Current state

The repository and route conversions are implemented. Skills file bytes still depend on local disk, and scheduled-task execution still needs a bounded serverless runner; those runtime constraints are tracked in slice 03.

## Verification

Backend TypeScript typecheck and production bundle pass. Focused behavior tests and a live Supabase Postgres check remain required before cutover.
