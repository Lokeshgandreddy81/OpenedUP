# Backend API Service

The backend API service provides the computational, analytical, and AI-driven backbone for the **Charan Interiors** platform, powering receipt parsing, expense ledger analytics, benchmark comparisons, and LLM integrations.

---

## Architecture & Directory Structure

The backend follows a layered, decoupled service-oriented architecture:

```
backend/
├── src/
│   ├── config/          # Zod environment validation & runtime options
│   ├── controllers/     # HTTP route controllers & parameter extraction
│   ├── middleware/      # Request tracking, Pino logger, error handling
│   ├── models/          # Domain models & database interfaces
│   ├── routes/          # Express route definitions & endpoint mapping
│   ├── services/        # Business logic, Gemini LLM client, data parsers
│   └── utils/           # Utility helpers & response formatters
├── tests/
│   ├── unit/            # Vitest unit tests for services & utils
│   └── integration/     # Supertest API endpoint & healthcheck tests
├── .env.example         # Example environment variables
└── README.md            # Backend service documentation
```

---

## Core Capabilities & Services

1. **Receipt & Expense Ingestion**:
   - Extraction of structured expense lines, totals, vendors, and dates from PDF receipts and raster images.
   - Multimodal document analysis leveraging Google Gemini models.
2. **Benchmark Intelligence**:
   - Real-time catalog queries for LLM leaderboards, evaluation metrics, coding benchmarks, and capability indices.
3. **Structured Observability**:
   - Fast JSON structured logging with **Pino**.
   - Universal correlation via `x-request-id` headers passed through all downstream operations.
4. **Resilient Validation**:
   - Zero-trust input validation using **Zod** schemas for query parameters and JSON payloads.

---

## Health Check Contract (`/healthz`)

The service exposes a standardized liveness and readiness probe for Kubernetes, Docker Compose, and uptime monitors.

### Endpoint

```http
GET /healthz
```

### Response Schema

```json
{
  "status": "ok",
  "uptime": 142.36,
  "timestamp": "2026-10-22T16:45:00.000Z",
  "version": "0.1.0",
  "service": "charan-interiors-backend"
}
```

### Status Codes

- `200 OK`: Service is healthy and capable of accepting traffic.
- `503 Service Unavailable`: Critical dependency failure or shutdown sequence initiated.

---

## Environment Variables

Copy `.env.example` to `.env` in the backend or root workspace:

| Variable         | Type     | Default       | Description                                                       |
| :--------------- | :------- | :------------ | :---------------------------------------------------------------- |
| `PORT`           | `number` | `3000`        | Port for the Express HTTP server                                  |
| `NODE_ENV`       | `string` | `development` | Environment mode (`development`, `production`, `test`)            |
| `LOG_LEVEL`      | `string` | `info`        | Pino logger verbosity (`trace`, `debug`, `info`, `warn`, `error`) |
| `GEMINI_API_KEY` | `string` | _None_        | Required API key for Google Gemini model inference                |
| `CORS_ORIGIN`    | `string` | `*`           | Allowed CORS origins (comma-separated list for production)        |
| `HOST`           | `string` | `0.0.0.0`     | Bind host address                                                 |

---

## Development & Run Scripts

From the repository root (or inside the backend workspace):

```bash
# Run backend in development mode with hot reload
npm run dev

# Run static type checking
npm run typecheck

# Run backend unit and integration tests
npm test

# Run tests with code coverage report
npm run test:coverage

# Build compiled production bundle (dist/server.js)
npm run build:server

# Run production server
npm run start
```

---

## Middleware Pipeline

Each incoming request passes through an automated pipeline:

1. **Request ID (`requestIdMiddleware`)**:
   - Inspects `x-request-id` header or generates a unique UUID.
   - Injects the ID into request context and response headers.
2. **Structured Logging (`pinoHttpMiddleware`)**:
   - Logs method, URL, status code, latency, and request ID.
3. **Body & URL Encoding**:
   - Standard Express `json()` and `urlencoded()` parsers with payload size bounds.
4. **CORS & Security Headers**:
   - Origin restrictions and HTTP security headers.
5. **Schema Validation**:
   - Validates route inputs against Zod schemas; returns `400 Bad Request` with structured error details on failure.
6. **Global Error Boundary (`errorHandler`)**:
   - Catches unhandled exceptions, sanitizes error messages in production, and logs full stack traces.
