# Slice 02: Boundary inventory and contracts

## Outcome

Before moving code, every user-facing route and backend endpoint family has an owner, dependency direction, contract surface, and persistence/auth behavior recorded.

## Frontend route ownership

| Current path | Current entry | Proposed owner | Current shared dependencies / notes |
|---|---|---|---|
| `/` | `LandingPage` | Intake | `AppContext` for file ingestion and workspace state |
| `/results` | `ResultsPage` | Receipts/results | `AppContext`, `ResultsView`; reconciliation, retries, file ingest |
| `/roadmap` | `RoadmapPage` | Roadmaps | Role/skill/best-practice pages with separate catalog data |
| `/benchmarks` | `BenchmarksPage` | Benchmarks | Benchmark catalog, charts, providers, leaderboard, comparator |
| `/chat` | `ChatPage` | Chat | `ChatWindow` contains chat, artifacts, customize, plugins, benchmarks, chapters, roadmaps view state |
| `/projects` | `ProjectsPage` | Projects | Project/session/files UI and project persistence |
| `/scheduled` | `ScheduledPage` | Scheduled tasks | Dedicated scheduled task view |
| `/image-arena` | `ImageArenaPage` | Benchmarks / image arena | Current standalone route; preserve path |
| `/coding-agents` | `CodingAgentsPage` | Benchmarks / coding agents | Current standalone route; preserve path |

The `ChatWindow` internal views are not independent browser routes today. Slice 03 must give each user-facing screen an owned TSX entry and preserve existing navigation while adding deep-linkable routes only where needed. Do not claim current deep-link behavior for those internal views.

`AppContext.tsx` is the primary frontend cross-domain state owner (969 lines), and `ResultsView.tsx` is a large receipts/results view (2,846 lines). Chat/project view modules are already grouped in `components/chat` and `components/projects`, with project persistence helpers present. These are migration candidates, not blanket rewrite targets. Roadmap and benchmark data files remain data.

## Backend endpoint ownership

| Existing mount and routes | Proposed domain | Current auth / contract source |
|---|---|---|
| `/healthz`, `/readyz` | Platform health | Public; health controllers |
| `/api/workspace-config` | Identity/platform config | Optional Firebase middleware mounted on `/api`; auth controller |
| `/api/read-receipts`, `/api/check-duplicates`, `/api/logs` | Receipts/analytics | Current route schemas in `backend/contracts`; receipts controller |
| `/api/parse-pdf-chapters` | Documents/PDF | Current contracts request schema; PDF controller/service |
| `/api/chat`, `/api/chat/stream`, `/api/chat/providers`, `/api/chat/skills`, `/api/chat/verify-key`, `/api/chat/rules` | Chat/providers/skills | Optional Firebase identity; contract schemas and existing SSE contract |
| `/api/benchmarks` | Benchmarks | Current benchmark controller |
| `/api/conversations/*` | Conversations | `requireFirebaseUser`; SQLite repository and contract schemas |
| `/api/artifacts/*` | Artifacts | `requireFirebaseUser`; owner/share scope and import/version behavior |
| `/api/credentials/*` | Credentials | `requireFirebaseUser`; encrypted vault; API never returns key material |
| `/api/projects/*` | Projects | `requireFirebaseUser`; SQLite snapshot and import behavior |

`backend/src/app.ts` mounts middleware in this order: body parsing, request ID, logging, health, optional Firebase identity for `/api`, public/optional-identity API routers, then required-identity mounts for conversations/artifacts/credentials/projects, static frontend, 404, and error handler. Preserve ordering and route-level auth coverage while regrouping modules.

## Contract and persistence firewalls

- Keep every existing path, method, request/response schema, status code, error semantics, and auth coverage. `backend/contracts/src/schemas`, `backend/contracts/src/types`, and `docs/api/openapi.yaml` are the contract sources.
- Keep `POST /api/chat/stream` SSE event/framing, cancellation, and partial-error behavior intact.
- Keep identity derived from verified Firebase claims. Persistent conversations, artifacts, credentials, and projects stay owner-scoped.
- Keep artifact local import idempotency, share visibility, project browser-to-account import, and existing SQLite snapshots unchanged.
- Keep SQLite single-instance and mounted-volume behavior. No domain-level network service or separate database is introduced.
- Preserve the direct browser routes above and the wildcard redirect to `/`.

## Acceptance

- Every route and endpoint has one proposed owner.
- Compatibility checklist references current route/schema/auth/storage sources.
- No code movement or API redesign is bundled into the inventory.
