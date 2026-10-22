# Openedup — Spend Audit & Document Intelligence Platform

[![CI](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/ci.yml/badge.svg)](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/ci.yml)
[![Security & Audit](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/security.yml/badge.svg)](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/security.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%205.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Audit](https://img.shields.io/badge/Audit-0%20Vulnerabilities-brightgreen.svg)](SECURITY.md)

Enterprise document intelligence and spend reconciliation platform designed for multi-source receipt auditing, PDF structural decomposition, and automated B2B expense verification.

---

## Architecture Overview

```mermaid
graph TD
    subgraph Client ["Frontend Client (React 19 + Vite 8 + Tailwind 4)"]
        UI["Landing & Workspace Views"]
        AuditView["Spend Audit & Treemap Ledger"]
        RoadmapCanvas["Interactive 2D Topology Canvas"]
        ChatInterface["Unify AI Document Assistant"]
    end

    subgraph API ["Modular Server (Node.js 22 + Express)"]
        Router["Express Gateway (JSON up to 100MB)"]
        Logger["Pino Structured Logger & Metrics"]
        Validator["Zod Schema Validation Middleware"]
        HealthRoute["GET /healthz"]
        ReceiptRoute["POST /api/read-receipts"]
        DuplicateRoute["POST /api/check-duplicates"]
        PdfRoute["POST /api/parse-pdf-chapters"]
        ChatRoute["POST /api/chat"]
    end

    subgraph Engines ["Processing & Intelligence Engines"]
        GeminiService["Google GenAI Service (Gemini 3.8 Flash + Cascade Fallback)"]
        PythonExtractor["Local Python Extractor (PyMuPDF / pypdf)"]
        PdfLibService["Pure JS pdf-lib Engine (Zero-Dependency Fallback)"]
    end

    subgraph Integrations ["External Services & Data"]
        GoogleDrive["Google Drive API"]
        Gmail["Gmail API"]
        FirebaseAuth["Firebase Auth (OAuth Client)"]
    end

    UI --> Router
    AuditView --> Router
    RoadmapCanvas --> Router
    ChatInterface --> Router

    Router --> Logger
    Router --> Validator
    Validator --> HealthRoute
    Validator --> ReceiptRoute
    Validator --> DuplicateRoute
    Validator --> PdfRoute
    Validator --> ChatRoute

    ReceiptRoute --> GeminiService
    DuplicateRoute --> GeminiService
    ChatRoute --> GeminiService

    PdfRoute --> PythonExtractor
    PythonExtractor -. fallback .-> GeminiService
    GeminiService -. fallback .-> PdfLibService

    ReceiptRoute --> Integrations
```

---

## Monorepo Layout

```text
.
├── .changeset/                     # Semantic versioning and changelog automation
├── .github/
│   ├── workflows/                  # CI/CD and Security GitHub Actions
│   │   ├── ci.yml                  # Matrix build, typecheck, lint, test, format:check
│   │   └── security.yml            # Gitleaks scan, npm audit, CodeQL analysis
│   ├── CODEOWNERS                  # Component code ownership specifications
│   ├── dependabot.yml              # Automated dependency update configuration
│   └── PULL_REQUEST_TEMPLATE.md    # Strict PR checklist and gate enforcement
├── frontend/                       # React 19 + Vite 8 + Tailwind 4 UI App
│   ├── public/                     # Static assets, logos, and icons
│   ├── src/                        # Presentation, state, and client algorithms
│   │   ├── components/             # React presentation views & controls
│   │   ├── test/                   # Vitest unit & component test suites
│   │   └── utils/                  # Pure financial & image processing utilities
│   ├── tests/e2e/                  # Playwright end-to-end smoke tests
│   ├── Dockerfile                  # Multi-stage production container with Nginx
│   └── vite.config.ts              # Vite bundle configuration & reverse proxy
├── backend/                        # Modular Express Node 22 API
│   ├── src/
│   │   ├── config/                 # Secrets & environment resolution
│   │   ├── controllers/            # HTTP endpoint handlers
│   │   ├── middleware/             # Request ID, Pino logging, Zod validation
│   │   ├── models/                 # Domain models
│   │   ├── routes/                 # Health, analytics, pdf, chat routes
│   │   ├── services/               # Gemini AI & PDF processing engines
│   │   └── utils/                  # Structured logger & chapter repair
│   ├── tests/                      # Unit & integration test suites (supertest)
│   └── Dockerfile                  # Multi-stage production container
├── shared/                         # Shared package (@charan-interiors/shared)
│   ├── src/schemas/                # Canonical Zod request/response validation
│   ├── src/types/                  # Strict TypeScript interfaces
│   └── src/utils/                  # Chapter sorting & numeral normalization
├── docs/                           # Architecture decision records & OpenAPI spec
│   ├── adr/                        # Architectural Decision Records
│   └── api/openapi.yaml            # OpenAPI 3.1 specification
├── infra/                          # Infrastructure & Docker configuration
│   └── docker/nginx.conf           # Production Nginx reverse proxy configuration
├── docker-compose.yml              # Local multi-container orchestration
├── pyproject.toml                  # Python packaging & tool configuration (Ruff)
├── scripts/                        # Standalone Python PDF processing utilities
│   ├── pdf_chapter_extractor.py    # Native document boundary parser
│   └── pdf_roadmap_generator.py    # Topical roadmap extractor
└── package.json                    # Workspace orchestration & root scripts
```

---

## Quickstart

### Prerequisites

- **Node.js**: `v22.14.0+` (LTS recommended, see `.nvmrc`)
- **npm**: `v10.9.0+`
- **Python**: `3.9+` (for local standalone PDF chapter extraction)

### Installation

Clone the repository and run deterministic installation:

```bash
git clone git@github.com:Lokeshgandreddy81/OpenedUP.git
cd OpenedUP
npm ci
```

### Environment Configuration

Copy the example environment configuration into the application directory:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| Variable           | Required | Default | Description                                                                      |
| :----------------- | :------- | :------ | :------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`   | Optional | None    | Gemini API Key. If omitted, PDF extraction runs 100% locally via Python/pdf-lib. |
| `PORT`             | Optional | `3000`  | HTTP port for the API and static asset server.                                   |
| `GOOGLE_CLIENT_ID` | Optional | None    | OAuth 2.0 client ID for Google Drive and Gmail live synchronization.             |

---

## Available Scripts

Run all scripts from the repository root:

| Command                                                              | Action                                                                      |
| :------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `npm run dev`                                                        | Boots application in development mode with live Vite HMR.                   |
| `npm run build`                                                      | Compiles frontend assets with Vite and compiles server bundle with esbuild. |
| `npm start --workspace=@charan-interiors/expense-receipts-analytics` | Runs production server (`node dist/server.js`).                             |
| `npm test`                                                           | Executes complete Vitest suite across all unit & API tests.                 |
| `npm run test:coverage`                                              | Generates detailed V8 code coverage report.                                 |
| `npm run typecheck`                                                  | Validates strict TypeScript types with 0 emit across all workspaces.        |
| `npm run lint`                                                       | Runs ESLint flat configuration check with zero allowable errors.            |
| `npm run format:check`                                               | Verifies code adherence to Prettier formatting standards.                   |
| `npm run format`                                                     | Auto-formats all code, markdown, YAML, and configuration files.             |
| `npm run e2e`                                                        | Executes Playwright end-to-end smoke test suite against running server.     |
| `npm audit`                                                          | Scans dependency tree for vulnerabilities (0 high/critical allowed).        |

---

## Verification Gates Checklist

Prior to merging any pull request into `main`, all 9 verification gates must pass:

1. :white_check_mark: **Deterministic Install**: `npm ci` completes with zero dependency warnings.
2. :white_check_mark: **Strict Typecheck**: `npm run typecheck` passes with 0 errors.
3. :white_check_mark: **Linter**: `npm run lint` passes with 0 errors.
4. :white_check_mark: **Formatting**: `npm run format:check` passes without discrepancies.
5. :white_check_mark: **Tests**: `npm test` passes 100% of test suites.
6. :white_check_mark: **Build**: `npm run build` generates valid client and server distribution files.
7. :white_check_mark: **Security Audit**: `npm audit` reports 0 vulnerabilities.
8. :white_check_mark: **Secret Scanning**: Gitleaks reports 0 leaked tokens or keys.
9. :white_check_mark: **Clean Tree**: Working tree is clean with zero untracked dev artifacts.

---

## Security

Please report vulnerabilities directly via GitHub Private Vulnerability Reporting or review our [Security Policy](SECURITY.md).

## Contributing

Review the [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting contributions.

## License

Distributed under the [MIT License](LICENSE). Copyright (c) 2026 Charan Interiors / Openedup Contributors.
