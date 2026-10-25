# Slice 04: Frontend feature ownership

## Outcome

Product routes and independently shown workspace screens have their own feature-owned `.tsx` entries. UI, state, services, hooks, and catalogs sit with the feature they implement.

## Current ownership

- `frontend/src/features/chapters`: landing/intake, document/results screens, receipt processing, and chapter state.
- `frontend/src/features/chat`: chat screen, message/session UI, and workspace view composition.
- `frontend/src/features/projects`: project and session screens, file extraction and project state.
- `frontend/src/features/artifacts`: artifact screen and persistence client.
- `frontend/src/features/customize`: provider/model screen and key/configuration client.
- `frontend/src/features/plugins`: plugin screen, built-in catalog, and install state.
- `frontend/src/features/benchmarks`: benchmarks, coding agents, image arena, and benchmark data.
- `frontend/src/features/roadmaps`: roadmap screens/rendering/progress and catalog data.
- `frontend/src/features/scheduled`: scheduled-task screen and components.
- `frontend/src/app`: route shell, failure boundaries, auth/integration adapters, and shared browser capabilities.

Each route and independently shown screen remains a `.tsx` file. Public `index.ts` exports are the only supported cross-feature entry points. The nine browser URLs, chat view state behavior, and browser data are preserved.

## Follow-up extraction

The feature move establishes ownership but does not claim every large module is already decomposed. `ResultsView.tsx`, `AppContext.tsx`, and `ChatWindow.tsx` still contain substantial responsibilities; extract them only as separately reviewable behavior-preserving work with tests at stable seams. Keep catalogs data-only.

## Acceptance

- Frontend typecheck/build and existing tests pass.
- Feature code does not import another feature's private files.
- Every route page and chat workspace screen is independently addressable as a `.tsx` file.
- No public URL, internal navigation behavior, authentication behavior, API request, or browser persistence key changes because of folder moves.
