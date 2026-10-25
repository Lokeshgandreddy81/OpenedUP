# Backend Service

The backend is a single-process modular Express service with domain separation and platform abstractions.

## Architecture

- **Domain Boundaries (`src/domains/`)**: HTTP controllers, application services, provider integrations, and repositories grouped by business domain (`audit`, `chat`, `documents`, `scheduled`, etc.).
- **Platform Layer (`src/platform/`)**: Auth verification, database connections, configuration, structured Pino logging, and HTTP error handling.
- **Composition Root (`src/app.ts`)**: Wires domain routers, security middleware, CORS policies, and health checks.
- **Shared Contracts**: Consumes runtime-neutral validation schemas and types from `@charan-interiors/contracts` (`packages/contracts`).

## Security & State Invariants

- Chat requests use the client-selected provider key. Signed-in users can securely persist keys via the encrypted AES-256 credential vault.
- Server environment keys (`GEMINI_API_KEY`) are strictly reserved for server-side PDF chapter extraction and document OCR; they never act as fallback for user chat requests.
- Full architectural details and persistence rules are documented in [Chat architecture](../packages/docs/chat-architecture.md).

## Development

Run the backend service from the repository root:

```bash
npm run dev:backend
```

Run test suites and full build verification via `npm test` and `npm run build`.
