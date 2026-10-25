# Shared Packages & Architecture Documentation

This directory contains shared runtime-neutral packages, contracts, and core architectural documentation for the monorepo.

## Contents

```
packages/
├── contracts/     # @charan-interiors/contracts: Shared API models, Zod schemas, and types
└── docs/          # Architecture decision records (ADRs), OpenAPI specs, and system blueprints
```

## Packages & Modules

### `@charan-interiors/contracts`

Runtime-neutral TypeScript models and Zod validation schemas shared between the Express backend and the React frontend.

- **`src/types/`**: Domain types (ProviderCatalog, LLM messages, chapter schemas, scheduled tasks).
- **`src/schemas/`**: Zod validation schemas for API inputs and storage payloads.
- **`src/utils/`**: Shared numeral and chapter normalization helpers.

### `docs/`

- **`chat-architecture.md`**: Chat provider selection, BYOK credential encryption, and context extraction invariants.
- **`api/openapi.yaml`**: Canonical OpenAPI 3.1 HTTP contract specification.
- **`adr/`**: Architectural Decision Records documenting system topology and boundaries.
