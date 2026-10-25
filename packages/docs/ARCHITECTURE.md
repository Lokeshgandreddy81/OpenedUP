# Architecture Boundaries & Guidelines

- **Architecture Boundary**: The repository is organized into four clean directories:
  - `frontend/`: React 19 single-page application with modular feature pages and isolated screens.
  - `backend/`: Modular Express application with domain separation and platform services.
  - `python/`: High-performance PDF processing, chapter boundary detection, and roadmap generation.
  - `packages/`: Shared runtime-neutral contracts (`packages/contracts`) and architecture docs (`packages/docs`).
- **Strict Typing**: Enforce strict TypeScript types across all workspaces with zero allowable `any` casts.
- **Contract Safety**: Shared data schemas and models must reside in `@charan-interiors/contracts` so the frontend never imports server runtime modules.
- **Modularity**: Keep screens as dedicated individual `.tsx` pages and features as self-contained domain folders.
