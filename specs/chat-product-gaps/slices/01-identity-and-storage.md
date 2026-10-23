# Slice 01 — Verified identity and persistence foundation

## Contract

Protected chat persistence endpoints receive a verified Firebase `Principal`; no route derives identity from body fields, email, loopback, or BYOK headers. SQLite survives backend restart and is mounted as persistent Docker data.

## API and ownership seam

- Add `Principal { uid: string; email?: string }` to Express request typing.
- Verify Firebase ID token bearer auth: RS256 only; `kid` must match Google's Secure Token certificate set; validate `aud`, `iss`, `sub`, `iat`, `auth_time`, and `exp` against configured Firebase project ID; cache certs according to HTTP `max-age`.
- Add `requireFirebaseUser` middleware for all `/api/conversations`, `/api/artifacts`, `/api/credentials`, and skill execution routes. Do not put it on ordinary anonymous `/api/chat`.
- Add one SQLite database module with foreign keys, WAL mode, busy timeout, and `user_id` indexes. DB path comes from `CHAT_DB_PATH`; default is a user data directory outside the repo.
- SQLite migrations are additive and versioned; current chat conversations have no persistent rows to migrate.

## Human-visible surface

App exposes a lightweight Google/Firebase sign-in for chat sync without requesting Drive or Gmail scopes. Signed-out chat remains transient. Protected APIs return a clear 401 when signed out.

## Verification

- Valid test token maps to its verified UID; forged signature, wrong audience/issuer, expired token, missing project ID, and unknown `kid` fail closed.
- A protected route rejects missing/bad bearer tokens.
- Repository test proves records for user A are not queryable as user B.
- Build and typecheck pass; Docker compose mounts the configured SQLite data directory.

## Delegated choices

Internal SQL helper naming and non-API migration file layout are delegated. SQLite is the approved single-instance store; do not substitute a hosted database or accept deployment-specific service-account assumptions.

## Must stay green

Existing anonymous document chat, BYOK header usage, provider checks, and all unrelated modules continue to work. Existing roadmap changes remain untouched.

## Human review

Non-blocking: show sign-in affordance and signed-out error state in the running app. If the user stays silent, decide from the existing visual system, record the choice, close any screenshot preview, and proceed.
