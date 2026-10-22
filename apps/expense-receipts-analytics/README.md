# Expense & Receipts Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-blue)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](package.json)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](package.json)

The **Expense & Receipts Analytics** platform is a full-stack enterprise web application delivering automated receipt ingestion, multimodal document extraction with Google Gemini, financial reporting, and a frontier AI model benchmark observatory.

---

## Architecture Overview

```
apps/expense-receipts-analytics/
├── index.html           # Single-page application root
├── index.css            # Tailwind CSS 4 theme imports
├── server/              # Modular Express API backend
│   ├── config.ts        # Zod environment variable parsing
│   ├── logger.ts        # Fast Pino structured logger
│   ├── middleware/      # Request ID tracing, error handling, Pino HTTP
│   └── schemas/         # Shared request/response validation schemas
├── src/                 # Client source code
│   ├── components/      # UI components (benchmarks, chat, projects, roadmap)
│   ├── utils/           # Client analytics, HEIC/PDF conversions, layout solvers
│   ├── App.tsx          # Client routing & view controller
│   └── main.tsx         # Client root mounting
├── public/              # Static public assets & brand glyphs
├── package.json         # Workspace manifest with full scripts
├── tsconfig.json        # Strict TypeScript compiler options
└── vite.config.ts       # Vite bundler configuration
```

---

## Key Capabilities

1. **Intelligent Receipt Parsing**:
   - Ingests scanned receipts, photos (including HEIC), and PDF invoices.
   - Extracts date, vendor, tax, itemized lines, category, and currency into structured JSON.
2. **Interactive Benchmark Observatory**:
   - Deep evaluation metrics across 100+ state-of-the-art frontier models.
   - Pareto frontier analysis comparing model quality vs. token price.
   - Multimodal Image Arena comparing visual generation outputs.
3. **Dynamic Roadmap Solver**:
   - Automated directed acyclic graph (DAG) layout using Dagre and XYFlow for learning roadmaps and execution plans.
4. **Structured Observability**:
   - Pino JSON logging with correlation IDs on every HTTP exchange.
   - Standard `/healthz` contract for orchestration health checks.

---

## Quickstart & Local Development

### 1. Prerequisites

- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### 2. Environment Setup

Create a `.env` file in this directory or in the monorepo root:

```bash
cp .env.example .env
```

Ensure your `GEMINI_API_KEY` is configured:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Running the Application

```bash
# Start development server with hot reload
npm run dev

# Run static type verification
npm run typecheck

# Run linter
npm run lint

# Run unit tests
npm test

# Build client bundle and server bundle for production
npm run build

# Start the compiled production server
npm run start
```

---

## Available Scripts

| Script                  | Command                                        | Purpose                                                    |
| :---------------------- | :--------------------------------------------- | :--------------------------------------------------------- |
| `npm run dev`           | `tsx server/index.ts`                          | Runs the server in development mode with live TS reloading |
| `npm run build:client`  | `vite build`                                   | Compiles client assets into `dist/client/`                 |
| `npm run build:server`  | `esbuild ...`                                  | Bundles backend into production-ready `dist/server.js`     |
| `npm run build`         | `npm run build:client && npm run build:server` | Full production build                                      |
| `npm run start`         | `node dist/server.js`                          | Launches production server                                 |
| `npm run typecheck`     | `tsc --noEmit`                                 | Strict type verification                                   |
| `npm run lint`          | `eslint .`                                     | Runs ESLint flat config                                    |
| `npm test`              | `vitest run`                                   | Runs Vitest test suite                                     |
| `npm run test:coverage` | `vitest run --coverage`                        | Generates v8 coverage metrics                              |
| `npm run e2e`           | `playwright test`                              | Runs Playwright browser integration tests                  |

---

## Related Documentation

- [Monorepo Root README](../../README.md)
- [Architecture Decision Record: Frontend/Backend Split](../../docs/adr/0001-frontend-backend-split.md)
- [Security Policy](../../SECURITY.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
