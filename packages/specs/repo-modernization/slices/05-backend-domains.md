# Slice 05: Backend domain ownership

## Outcome

Express remains one process and `src/app.ts` remains its composition root. Each backend product domain groups its HTTP, application/provider, and persistence modules under `backend/src/domains/`.

## Current ownership

`domains/` contains identity, receipts, documents, chat/providers/tools/skills, benchmarks, conversations, artifacts, credentials, and projects. `platform/` contains configuration, auth middleware, database connection, HTTP middleware/types, health, observability, and errors. `backend/contracts/` is the runtime-neutral workspace for schemas, types, and pure shared helpers; the frontend imports only this package, never backend runtime modules.

## Compatibility invariants

- Preserve route paths/methods, payload validation, status codes, response/error shape, auth middleware coverage/order, and SSE framing/cancellation/partial-error semantics.
- Preserve SQLite schema, owner scoping, existing records, and the single-instance volume assumptions.
- Keep provider key storage encrypted and preserve key/endpoint selection semantics.
- `app.ts` retains JSON body limits, request ID/log middleware order, optional versus required Firebase auth, static frontend handling, 404 and global error handlers.
- Dockerfiles, npm workspace build ordering, contract package resolution, and runner files must remain functional with contracts nested under `backend/`.

## Acceptance

- Backend and contract typechecks/builds pass from a clean install.
- Existing backend tests and route integration checks pass.
- Route registration and auth wrapping are behaviorally identical to the pre-move contract.
- No controller calls another controller or reaches across a domain to access its repository.
- No domain is presented as an independently deployable microservice.
