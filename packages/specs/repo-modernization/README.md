# Repository modernization

## Next Agent Prompt

**Status (2026-10-24):** The feature/domain layout and route-level page failure boundary are in place. A clean install with Node 24.12.0 reports no dependency advisories. The root typecheck builds the contracts workspace before checking its consumers. The README distinguishes local development from Compose setup, and the environment examples document optional server-side Gemini processing. The root development command uses a Node process runner, and application-level feature imports are checked alongside feature-to-feature imports. Page loading fallbacks have separate public entry points so static fallbacks do not pull lazy page modules into the initial bundle. The provider-key migration and paid-model-to-provider-to-chat journey have regression coverage. Formatting, typechecks, feature-boundary checks, all 315 unit tests, production build, and all ten Playwright smoke tests pass. ESLint has 0 errors and 28 React Fast Refresh warnings where files export both components and helpers/data. The frontend build has no ineffective Customize import warning; it reports the separately loaded 1.35 MB HEIC converter chunk. Docker is unavailable in the audit environment, so Compose and image builds remain unverified; Slice 06 remains open.

Continue from the architecture cleanup and verification checklist below. Preserve the user's existing uncommitted chat, BYOK, auth, artifact, project, and SQLite work. Preserve existing browser URLs, HTTP API behavior, and stored data. Do not remove code based on appearance: prove it is unreachable from imports, route registries, dynamic loaders, tests, package scripts, config, and runtime assets first. Update this handoff before ending your pass.

### Global TODO

- [x] [Slice 01](slices/01-route-isolation.md): route-level lazy-load and render failure isolation.
- [x] [Slice 02](slices/02-boundary-inventory.md): inventory route/API/auth/persistence contracts and initial ownership.
- [x] [Slice 03](slices/03-chat-screens.md): split chat workspace screens into TSX modules with local boundaries.
- [x] [Slice 04](slices/04-frontend-domains.md): move screens, state, UI, services, hooks, and data into feature folders.
- [x] [Slice 05](slices/05-backend-domains.md): group backend route/controller/application/repository modules by domain.
- [ ] [Slice 06](slices/06-enforcement.md): verify full builds and suites, audit import direction, add sustainable boundary checks, and remove only proven dead source.

## Objective and accepted decisions

The repository has two application roots: `frontend/` and `backend/`. Frontend product code belongs to `frontend/src/features/<feature>/`; backend product code belongs to `backend/src/domains/<domain>/`. The shared, runtime-neutral API schema/type workspace is nested at `backend/contracts/` to honor the two-root layout without making the browser depend on server runtime modules.

- Keep a modular monolith: one deployable Express process and current SQLite topology. Internal domain folders are not separate microservices.
- Preserve existing URLs, API methods/payloads/status/error behavior, auth coverage, and stored user data.
- Every route or independently shown screen has a `.tsx` page/screen module owned by its feature. The app shell owns route composition only.
- Keep roadmap and benchmark catalogs as data modules, separate from rendering.
- Cross-feature imports use a feature's `index.ts` public API; never import another feature's private page or mutable store. The app shell may use a page's `loading.ts` entry point for lightweight suspense fallbacks without eagerly importing the lazy page implementation.
- Shared auth, shell integration, browser capabilities, and routing live under `frontend/src/app/`. Avoid a global bucket for product-specific behavior.
- Backend `src/app.ts` remains the composition root. Each domain owns its HTTP adapters and business/persistence flow; platform modules own config, auth middleware, database connection, request lifecycle, logging, and errors.
- Preserve all pre-existing work in this uncommitted tree.
- Cleanup removes generated build/coverage outputs and source proven unreachable; it does not delete product catalogs, fixtures, data, or compatibility behavior based on naming or apparent redundancy.

## Current architecture map

### Frontend

`frontend/src/App.tsx` composes the existing nine URLs: `/`, `/results`, `/roadmap`, `/benchmarks`, `/chat`, `/projects`, `/scheduled`, `/image-arena`, and `/coding-agents`. Each is lazy-loaded inside `PageRoute`, which places a route error boundary outside its suspense fallback. The source layout is now:

- `features/chapters`: intake, document, and results screens, state, processing services, and demo data.
- `features/chat`: chat route, conversation UI and workspace view composition.
- `features/projects`: project, session, and file-context screens and state.
- `features/artifacts`, `features/customize`, and `features/plugins`: their own screen entries and owned client behavior.
- `features/benchmarks`, `features/roadmaps`, and `features/scheduled`: route screens, supporting UI, and domain data.
- `app/`: route-level error handling, Firebase chat identity, authenticated chat API helpers, shared browser capabilities, and workspace integration.

Feature code may depend on app-level infrastructure and stable public feature APIs. The oversized chapter/results view and broad chapter context remain candidates for later internal extraction; a folder move does not imply their responsibilities have already been split into smaller modules.

### Backend

`backend/src/app.ts` retains middleware ordering, existing route paths, auth wrapping, static-file behavior, 404 handling, and error handling. Route families are grouped under `src/domains/` for identity, receipts, documents, chat/providers, benchmarks, conversations, artifacts, credentials, and projects. `src/platform/` owns configuration, auth middleware, database connection, HTTP middleware/types, health, observability, and error types. `backend/contracts/` contains the shared Zod schemas/types and runtime-neutral helpers. Keep SQLite single-instance and preserve database ownership constraints.

### Support roots

`docs/`, `specs/`, `.github/`, the lockfile, and workspace manifests are repository support, not application roots. Frontend Nginx configuration lives in `frontend/infra/`; standalone PDF tools live in `backend/scripts/`.

## Dependency rules

- Frontend: app composition → feature public page APIs; a feature may use its own modules, app infrastructure, and runtime-neutral contracts. Cross-feature feature internals stay private.
- Backend: composition root → domain routers; HTTP adapters → domain application services → repositories/provider adapters. Domains do not call other controllers or directly reach into other domains' repositories. Shared contracts contain no Node/browser implementations.
- Frontend modules must not import backend runtime code. The frontend may consume only `backend/contracts` through its public package entry.
- Static catalogs are data modules, not TSX-rendered data trees.

## Slice graph

1. [Route failure isolation](slices/01-route-isolation.md) — complete.
2. [Boundary inventory and contracts](slices/02-boundary-inventory.md) — complete; keep paths and notes current as seams settle.
3. [Chat screen ownership](slices/03-chat-screens.md) — complete for independently shown screens; future state/orchestration extraction is separate work.
4. [Frontend feature ownership](slices/04-frontend-domains.md) — feature folders and TSX screen owners are in place; responsibility-level extraction remains incremental.
5. [Backend domain ownership](slices/05-backend-domains.md) — route/controller/application/repository files are grouped; verify runtime composition and behavior.
6. [Enforcement and cleanup](slices/06-enforcement.md) — remaining verification, import-boundary enforcement, dead-code evidence, and docs closeout.

## Completion criteria

- Existing browser URLs, API methods/payloads/status/error semantics, authentication rules, stored data, and SQLite constraints remain compatible.
- Every product route resolves to a feature-owned `.tsx` entry and route failures do not blank sibling routes.
- Features own their screens, state, API interactions, UI, and data where domain-specific; shared app infrastructure is explicit and small.
- Backend domains have one coherent internal owner behind the current Express routes; `app.ts` composes rather than implements domain behavior.
- Typecheck and builds pass from a clean workspace install; existing frontend, backend, and contract suites pass; focused route/API checks preserve existing contracts.
- CI or repository tooling prevents imports across private feature internals and prevents frontend imports from backend runtime modules.
- Every deletion has evidence that no import, dynamic entry, test, script, asset, configuration, or runtime path uses it.

## Verification and current caveats

Latest verification: `npm run format:check`, `npm run typecheck`, `npm run check:feature-boundaries`, all workspace unit suites (backend 144, contracts 15, frontend 156), `npm run build`, `npm audit --audit-level=high` (0 vulnerabilities), and all ten Playwright smoke tests pass. The new provider-key regression test was confirmed to fail when the fix was removed. The paid-model E2E test selects Claude Opus, routes to provider settings, connects a session key, and asserts the outgoing chat model and key. ESLint has 0 errors and 28 React Fast Refresh warnings, with no hook dependency warnings. Vite reports the lazy HEIC converter chunk at 1.35 MB; the route-specific app context chunk is 532 KB and is below the warning threshold. Docker checks could not run because Docker is not installed here. Do not suppress warnings or delete code without tracing its runtime and feature ownership.
