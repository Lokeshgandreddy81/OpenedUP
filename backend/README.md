# @charan-interiors/backend

High-performance, modular Node.js/Express API powering the expense receipt vision OCR, duplicate reconciliation, PDF chapter slicing, AI benchmarks, and conversational assistants.

## Architecture

The backend application follows a clean layered domain architecture with strict TypeScript and zero `any`:

```
backend/
├── src/
│   ├── config/          # Environment variables, Gemini API keys, Firebase applet
│   ├── controllers/     # HTTP endpoint handlers (Express req/res)
│   ├── middleware/      # RequestId, Pino HTTP logger, Zod validator, Error boundary
│   ├── models/          # Domain data models
│   ├── routes/          # Express route definitions (health, analytics, pdf, chat)
│   ├── services/        # Business logic (Gemini fallback, PDF-lib, duplicates)
│   ├── utils/           # Structured logger, AppError classes, chapter repair
│   ├── app.ts           # Express application composition
│   └── index.ts         # Server bootstrap and graceful shutdown
├── tests/
│   ├── unit/            # Isolated service & utility test suites
│   └── integration/     # End-to-end HTTP route tests with supertest
├── Dockerfile           # Multi-stage production container
├── package.json
└── tsconfig.json        # Strict compiler suite (NodeNext, exactOptionalPropertyTypes)
```

## Available Scripts

- `npm run dev` - Start local server with hot reloading (`tsx watch`)
- `npm run build` - Bundle server into production bundle (`esbuild`)
- `npm run start` - Run production server (`node dist/server.js`)
- `npm run typecheck` - Verify strict TypeScript compilation (`tsc --noEmit`)
- `npm run test` - Execute unit and integration tests (`vitest run`)
- `npm run test:coverage` - Run tests with V8 code coverage report

## Environment Variables

| Variable         | Type   | Default       | Description                                               |
| ---------------- | ------ | ------------- | --------------------------------------------------------- |
| `PORT`           | number | `3000`        | HTTP port for incoming requests                           |
| `NODE_ENV`       | string | `development` | Runtime environment (`development`, `production`, `test`) |
| `GEMINI_API_KEY` | string | -             | Google Gemini AI API key                                  |
| `LOG_LEVEL`      | string | `info`        | Pino logging level (`debug`, `info`, `warn`, `error`)     |

## Observability

- **Structured Logging**: JSON output via `pino` with ISO timestamps, PID, hostname, and HTTP duration.
- **Request Tracking**: Every request receives a unique `X-Request-Id` UUID, propagated to all log entries.
- **Probes**: `/healthz` for container liveness and `/readyz` for dependency readiness.
