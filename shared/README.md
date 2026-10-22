# @charan-interiors/shared

Shared TypeScript models, Zod validation schemas, and domain utility functions used across `@charan-interiors/frontend` and `@charan-interiors/backend`.

## Modules

- `schemas/`: Zod schemas for HTTP requests and responses (`ReadReceiptsRequestSchema`, `ParsePdfChaptersRequestSchema`, `ChatRequestSchema`, `CheckDuplicatesRequestSchema`).
- `types/`: Canonical TypeScript interfaces for receipts, chapters, and workspace state.
- `utils/`: Document chapter sorting, numeral normalization (Roman, English words), and prefix stripping.

## Available Scripts

- `npm run typecheck` - Run TypeScript compiler checks (`tsc --noEmit`)
- `npm run test` - Execute shared unit tests (`vitest run`)
