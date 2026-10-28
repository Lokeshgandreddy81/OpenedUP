# Openedup

[![CI](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/ci.yml/badge.svg)](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/ci.yml)
[![Security & Audit](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/security.yml/badge.svg)](https://github.com/Lokeshgandreddy81/OpenedUP/actions/workflows/security.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%205.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.12%2B-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Openedup brings document analysis, spend review, model-backed chat, and coding tools into one workspace.

## Supabase Auth setup

Openedup uses Supabase Auth for email/password accounts, Google sign-in, email confirmation, password recovery, and protected API sessions. The backend verifies each bearer token with the configured Supabase Auth service and only accepts users whose email is confirmed. The browser uses the Supabase publishable key; never put a Supabase secret or `service_role` key in the frontend.

Set these values before enabling sign-in:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `frontend/.env`.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `backend/.env`.
- For Docker Compose, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the root `.env`; Compose passes them to the backend and frontend build.
- `GOOGLE_CLIENT_ID` in `backend/.env` is used by the separate Drive/Gmail authorization flow.

In the Supabase dashboard, set the project Site URL and add each app origin's `/auth/callback` URL (local and production) to the Auth redirect URL allowlist. Enable email/password and Google providers, and keep email confirmation enabled. The Google provider needs its OAuth client ID and client secret in Supabase; in Google Cloud, authorize the Supabase project's Auth callback URL shown in its dashboard. The app's Google client ID is also used by the separate Drive/Gmail flow, which needs its consent screen and requested scopes configured in Google Cloud. Configure custom SMTP in Supabase before production email delivery; the built-in sender is intended for testing.

## Architecture

The frontend owns product interactions and feature state. The Express backend owns authenticated requests, provider dispatch, persistence, and isolated tool execution. Shared request and response shapes live in `packages/contracts`; Python utilities handle document-processing tasks that need them.

Keep cross-workspace contracts in the shared package and product behavior with the feature that owns it. The [architecture boundaries](packages/docs/ARCHITECTURE.md) describe these rules.

## Development

Use the Node version in `.nvmrc`, npm 10 or newer, and Python 3.9 or newer for local PDF processing.

```bash
npm ci
npm run dev
```

Open <http://localhost:5173>. Vite proxies API requests to the backend on port 3000. Chat and scanned-document OCR use a provider key configured by the user; searchable PDF text is extracted locally when possible.

For Docker Compose, the root `.env` supplies the Supabase settings to both the backend and frontend build. Copy `.env.example` to `.env` on a fresh checkout, then fill `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from the Supabase project's Connect dialog or Settings → API Keys. Set `GOOGLE_CLIENT_ID` when using Google Workspace access.

Generate the BYOK encryption key with:

```bash
openssl rand -base64 32
```

Put the output in `BYOK_ENCRYPTION_KEY` in the root `.env`. For a local backend run outside Docker, set the same value in `backend/.env`. Keep this key stable and backed up; losing or rotating it can make saved provider credentials unreadable.

Then run:

```bash
docker compose up --build
```

The Compose stack serves the app on port 8080. Retain the `openedup-data` volume to preserve account data. Never commit populated environment files.

## Vercel deployment

The root `vercel.json` defines Vercel Services routing for the Vite frontend and Express API, with `/api/*` sent to the backend. Services are currently in beta; choose **Services** as the Vercel project's framework and confirm the feature is enabled for your account.

Uploads for PDF analysis, receipt images, chat images, and ZIP skill packages now use short-lived Supabase Storage signed uploads. Apply `supabase/migrations/20261028000000_openedup_app_schema.sql` in the Supabase SQL editor to create private buckets with PDF, image, and skill-package size limits before using these upload routes. The server checks account ownership before reading uploaded objects and removes them after processing. Cleanup is best effort; a scheduled job to delete abandoned uploads is still required before production.

**Do not deploy this backend to production yet.** Application records and skill/workspace data still use synchronous SQLite and local filesystem paths; `DATABASE_URL` is not connected to the repositories, and the SQL migration does not migrate existing SQLite data. The Docker sandbox, 2-second scheduled-task worker, and abandoned-upload cleanup also still require Vercel-compatible implementations. Vercel instances have ephemeral storage and the current function request limit makes the direct Storage upload path necessary; these remaining runtime changes must land before production data is safe.

The current local environment has Supabase Auth settings, but no `SUPABASE_SECRET_KEY` or Postgres connection string. Create a Supabase secret key in **Settings → API Keys** and add it as a server-only Vercel production variable; the upload route accepts the legacy `SUPABASE_SERVICE_ROLE_KEY` name as a fallback. Use `DATABASE_URL` only after the PostgreSQL repository migration is implemented. Never use a `VITE_` prefix for server secrets, and never commit populated environment files.

For the frontend build, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. For the backend, add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `BYOK_ENCRYPTION_KEY`; provider keys such as `GEMINI_API_KEY` are optional unless server-side PDF OCR uses them. Keep `DATABASE_URL` unset until the repository migration is ready.

## Common checks

Run these from the repository root:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

The root [`package.json`](package.json) owns the current workspace commands; CI is the source of truth for the required checks.

## Documentation

- [OpenAPI contract](packages/docs/api/openapi.yaml)
- [BYOK provider catalog](specs/byok-catalog-adapters/README.md)
- [Feature implementation notes](specs/)

## Security

Production must use authenticated identity and the Docker sandbox. Keep `SANDBOX_MODE=unsafe-local` limited to development and tests. Report vulnerabilities through GitHub Private Vulnerability Reporting.

## License

Distributed under the [MIT License](LICENSE). Copyright (c) 2026 Charan Interiors / Openedup Contributors.
