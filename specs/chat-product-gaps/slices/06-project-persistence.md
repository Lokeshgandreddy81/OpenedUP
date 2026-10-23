# Slice 06 — Account-owned project persistence

## Contract

Signed-in users load their own projects, sessions, messages, and extracted file text from the authenticated backend. Signed-out users continue using browser-local projects. Existing browser projects are imported once by the first account that claims that browser snapshot; the stable demo project is excluded. A failed import remains retryable and does not discard local data. Project-session messages have one canonical owner: the project record, not a duplicate general conversation.

## API and ownership seam

- Shared Zod schemas validate project snapshots and nested project files, sessions, and messages with size/count bounds.
- Authenticated `GET /api/projects`, `PUT /api/projects`, and `POST /api/projects/import` are mounted behind `requireFirebaseUser`. The authenticated UID is the only owner key.
- SQLite stores one JSON snapshot per `(user_id, project_id)`. Import is transactional and idempotent for a user/project ID. Reads and replacement are scoped by UID.
- Frontend project persistence owns auth loading, first-account legacy import, remote loading, writes, and sync errors; `ProjectsView` remains the UI owner.
- While signed in, server state is authoritative and account snapshots are not written to the shared anonymous localStorage key. On successful import the legacy key is removed to avoid exposing that data after sign-out.
- Project session messages are stored in the project snapshot. Remove the extra conversation writes from `ProjectSessionView` for new sessions.

## First useful proof and verification

- Repository/API behavior: owner A can create/load/update/delete their snapshot; owner B cannot read or change it; a repeated import stores no duplicate; invalid/oversized nested data is rejected.
- Frontend behavior: signed-out local state remains usable; authenticated load waits for Firebase resolution; import precedes load; server data replaces stale local data; failed import retains local data; switching users does not flash prior account data.
- UI behavior: create, edit instructions/files, create/reply/delete session, and delete project all persist and survive refresh.
- Keyboard and responsive checks run on the actual Projects page after the persistence work is complete.

## Decisions delegated to implementation

Internal repository and hook naming, SQLite column names, and request retry copy are delegated. Do not add multi-tab merge, project sharing, original file-byte storage, or arbitrary file formats in this slice.

## Alternatives considered

Normalized project/session/message tables would support field-level updates but add migration and mutation paths that do not match the current whole-project UI contract. A bounded, validated per-project JSON snapshot is the smallest owned persistence seam. Keeping project sessions in the general conversation table would continue duplicating history and exposing project chats as unrelated conversations.

## Must stay green

- Existing project-file extraction and chat streaming behavior.
- Authenticated conversation/artifact ownership behavior.
- Anonymous BYOK chat and signed-out local projects.
- Run the frontend/backend/contracts suites, typecheck, and build after this slice; report external checks separately.
