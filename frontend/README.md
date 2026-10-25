# Frontend Client

The frontend is a modern React 19 single-page application bundled with Vite.

## Architecture

- **App Shell (`src/app/`)**: Owns root navigation, shell layout, auth context, and shared browser integrations.
- **Feature Modules (`src/features/`)**: Organized by domain (e.g. `artifacts`, `benchmarks`, `chapters`, `chat`, `customize`, `plugins`, `projects`, `roadmaps`, `scheduled`).
  - Each screen is an individual, dedicated `.tsx` page inside the feature's `pages/` directory.
  - Feature-to-feature dependencies are exported through public barrel entries.
- **Shared Contracts**: Runtime-neutral types and Zod schemas are imported from `@charan-interiors/contracts` (`packages/contracts`).

## Development

Run the frontend development server from the repository root:

```bash
npm run dev:frontend
```

Verification workflows and overall monorepo guidelines are documented in the [root README](../README.md).
