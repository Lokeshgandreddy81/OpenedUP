> **Current implementation note (2026-10-23):** This ADR records the original split decision. The current source layout is `frontend/` and `backend/`, with feature modules under `frontend/src/features/` and backend domains under `backend/src/domains/`. The runtime-neutral contracts workspace now lives at `backend/contracts/`; it is not a separately deployable service. See [repository modernization](../../specs/repo-modernization/README.md) for the current target and migration status.

# ADR 0001: Decouple Monolithic Server into Distinct Frontend Client and Backend Service

- **Status**: Accepted
- **Deciders**: Platform Architecture Team, Core Maintainers
- **Date**: 2026-10-22
- **Tags**: architecture, monorepo, backend, frontend, modularity

## Context and Problem Statement

The repository originated as a single bundle project rooted in `expense-&-receipts-analytics/`, which combined a ~1600-line monolithic Express server (`server.ts`) with a React 19 / Vite client, Python utility scripts, and assets in a single directory.

This tightly coupled structure introduced several operational and engineering bottlenecks:

1. **Lack of Clean Architectural Boundaries**: Server-side logic (file system access, PDF parsers, Gemini LLM integrations, and Express routing) lived immediately adjacent to client-side components and React state hooks.
2. **Coupled Runtime & Deployment**: Serving the frontend bundle via Vite middleware inside Express prevented using modern edge hosting, CDN caching for client assets, or independent server horizontal scaling.
3. **Build & Typecheck Friction**: Running `tsc` or `vite build` required compiling or ignoring Node.js runtime types alongside DOM types, leading to loose compiler flags (`skipLibCheck: true`, `strict: false`).
4. **Testing Obstacles**: Mocking the server for client component tests and integration testing backend endpoints required loading the entire Vite dev environment, dramatically slowing test runs.
5. **Tooling & Multi-Agent Conflicts**: Parallel development tracks (observability, UI features, API endpoints) created frequent merge conflicts in the single `server.ts` file and root directory.

## Decision Drivers

- **Independent Deployment & Scalability**: Ability to deploy the frontend to static CDN/edge storage and the backend API as an isolated containerized service.
- **Strict Typing & Module Safety**: Clear boundary between Node.js 22 runtime code (backend) and browser runtime code (frontend), enabling `strict: true` across all packages without type collisions.
- **Micro-Layered Backend Architecture**: Transforming the 1600-line `server.ts` monolith into standard layers: routes, controllers, services, middleware, config, and schemas.
- **High-Velocity Parallel Collaboration**: Allowing multiple developers and autonomous agents to work concurrently on frontend components, backend endpoints, and infrastructure without file contention.
- **Deterministic Testing & CI**: Fast unit tests with Vitest, contract verification with Supertest, and isolated end-to-end tests with Playwright.

## Considered Options

### Option 1: Retain Single Monolithic Directory with Submodules

Keep `expense-&-receipts-analytics` as a single directory, but divide files internally into `src/client/` and `src/server/`.

- _Pros_: Minimal directory churn; preserves existing paths for immediate script execution.
- _Cons_: Does not solve package boundary isolation, shared lockfile dependencies, or clean container builds. Does not adhere to standard enterprise monorepo conventions.

### Option 2: Polyrepo Split into Multiple Git Repositories

Separate the client and server into entirely different Git repositories (`charan-frontend` and `charan-backend`).

- _Pros_: Complete isolation of repositories, access control, and independent release cycles.
- _Cons_: High overhead for a small team; requires publishing shared types/contracts to an external npm registry; multi-repo PR coordination overhead; breaks unified end-to-end testing in a single PR.

### Option 3: Monorepo Workspace Structure (`apps/` and `packages/` or `frontend/` and `backend/`)

Adopt an industry-standard npm workspace layout with dedicated frontend and backend workspaces alongside shared domain packages:

```
├── frontend/ (or apps/frontend)
│   ├── index.html
│   ├── src/
│   │   ├── components/
│   │   └── utils/
│   └── vite.config.ts
├── backend/ (or apps/backend)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── utils/
│   └── package.json
├── shared/ (or packages/shared)
│   ├── src/
│   │   ├── types/
│   │   └── schemas/
└── docs/
```

- _Pros_:
  - Clear separation of concerns with isolated dependencies and tsconfig targets.
  - Zero-overhead code sharing for TypeScript interfaces and Zod validation schemas via workspace symlinks.
  - Independent Docker containers for frontend (Nginx/static) and backend (Node.js/Express).
  - Enables granular CI workflows that only rebuild or test impacted workspaces.
- _Cons_: Requires updating import paths, CI scripts, and directory structures during migration.

## Decision Outcome

Chosen option: **Option 3 - Monorepo Workspace Separation**.

This layout aligns with Google, Microsoft, and premier open-source standards, providing modularity without the operational tax of polyrepo synchronization.

### Positive Consequences

1. **Isolated Build Targets**:
   - Frontend compiles targeting modern browsers with Vite and ES modules.
   - Backend compiles targeting Node.js 22 with ESBuild/TSX.
2. **Dedicated Modular Layers**:
   - Server endpoints are isolated into dedicated routers (`/api/expenses`, `/api/benchmarks`, `/healthz`).
   - Controllers handle HTTP contracts, Services manage business logic & LLM orchestration, and Middleware manages request tracing (`x-request-id`), Pino logging, and error capture.
3. **Optimized CI Pipeline**:
   - CI can run frontend lint/tests and backend lint/tests concurrently.
4. **Contract-Driven Development**:
   - Request and response schemas validated with Zod in a single source of truth (`shared/` or `server/schemas/`), guaranteeing client-server contract synchronization.

### Negative Consequences & Trade-offs

1. Path adjustments required in documentation and developer onboarding scripts.
2. Cross-workspace dependencies must be properly referenced via npm workspaces.

## Implementation Phases

1. **Phase 1: Workspace & Directory Standardization**
   - Normalize directory names (eliminate special characters such as `&` and whitespace).
   - Establish `frontend/`, `backend/`, and `shared/` workspace directories.
2. **Phase 2: Monolith Decomposition**
   - Extract middleware (`requestId`, `pinoHttp`, `errorHandler`) into `backend/src/middleware/`.
   - Extract configuration and environment validation into `backend/src/config/`.
   - Decompose route handlers from `server.ts` into individual route modules.
3. **Phase 3: Client Decoupling & API Contract Alignment**
   - Configure frontend Vite proxy or environment variable `VITE_API_BASE_URL` pointing to backend API.
   - Ensure `/healthz` endpoint contract is standardized for container orchestrators and monitoring.
4. **Phase 4: CI/CD & Container Scaffolding**
   - Implement multi-stage Dockerfiles for both frontend static server and backend Node.js server.
   - Configure Docker Compose with automatic healthchecks.

## Validation & Compliance

- `npm run typecheck` passes with zero errors on both frontend and backend configurations with `strict: true`.
- Backend unit and integration tests run independently of Vite frontend builds.
- Frontend builds succeed cleanly via `npm run build:client` with zero references to Node.js native packages (`fs`, `path`, `child_process`).
