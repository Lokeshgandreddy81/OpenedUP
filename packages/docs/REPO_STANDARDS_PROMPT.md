# Repository maintenance standards

This document records the maintenance principles for OpenedUP. It is not a repository snapshot or a task prompt; use the source tree and CI workflows for current implementation details and gate names.

## Ownership

- Keep the browser application and Express service as the two application roots. Shared runtime-neutral contracts belong under `backend/contracts/`.
- Product behavior belongs to its frontend feature or backend domain. Shared infrastructure should stay small and have one clear owner.
- Preserve browser routes, public API behavior, account ownership, and stored data unless a change explicitly migrates them.
- Load expensive route and catalog features on demand. Measure production output before adding bundler exceptions or raising size limits.

## Change quality

- Validate user input at public boundaries and derive authorization identity from verified auth state.
- Keep credentials out of logs, browser persistence, and API responses. Server-held account credentials must remain encrypted at rest and scoped to their owner.
- Add regression coverage at the user-facing boundary for behavior changes. Keep test selectors independent from presentational copy.
- Fix the cause of type, lint, test, and build failures. Do not weaken a gate to make a change pass.
- Update the owning documentation when a contract or operating assumption changes; avoid duplicating implementation inventories.

## Verification and release

The root [README](../README.md) contains the local verification commands. The canonical CI and security checks live in `.github/workflows/`; branch protection expectations live in [branch-protection.md](branch-protection.md). CI must run from a clean lockfile install on the supported Node runtime. Do not report a check as passing unless it was run and its result was observed.

Keep broader modernization work and its open verification items in [the repository modernization plan](../specs/repo-modernization/README.md). A green build alone does not establish that browser journeys, persistence, or container deployment work.
