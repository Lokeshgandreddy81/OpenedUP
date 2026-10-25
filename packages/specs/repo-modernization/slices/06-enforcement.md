# Slice 06: Enforcement, verification, and cleanup

## Outcome

The feature/domain ownership layout is safe to extend, documented for maintainers, and checked by repeatable repository tooling.

## Scope

- Verify frontend/backend/contracts build order from a clean workspace install, including both Docker build contexts.
- Run existing frontend, backend, and contract suites plus focused route/import checks; preserve the existing public URLs, API contracts, auth behavior, and data.
- Add import-boundary checks after confirming actual imports: prohibit private feature-to-feature imports and frontend imports from backend runtime.
- Audit cleanup candidates across direct and dynamic imports, route registration, tests, npm scripts, CI/Docker config, and runtime assets.
- Update the README and ADR references so feature folders and internal modular-monolith domains are the maintainer source of truth.

## Acceptance

- Typechecks and builds pass from a clean install and current Docker contexts build.
- Existing suites pass with no URL/API/schema/storage changes.
- CI rejects prohibited import directions.
- Every removed source file has repository-wide unreachability evidence; generated outputs are not confused with source.
- The ADR identifies `frontend/` and `backend/` as application roots and `backend/contracts/` as runtime-neutral contract source.
