# Shared Packages, Specifications & Architecture

This folder contains the shared runtime-neutral contracts, specifications, architectural decision records (ADRs), and documentation used across Charan Interiors and Openedup.

## Contents

```
packages/
├── contracts/     # @charan-interiors/contracts: Shared API models, Zod schemas, and types
├── docs/          # Architecture documentation, ADRs, and deployment blueprints
└── specs/         # Functional slices, product specs, and testing requirements
```

## Packages

### `@charan-interiors/contracts`
Runtime-neutral TypeScript models and Zod validation schemas shared between the Express backend and the React frontend.
- **`src/types/`**: Domain types (ProviderCatalog, LLM messages, chapter schemas, scheduled tasks).
- **`src/schemas/`**: Zod validation schemas for API inputs and storage payloads.
