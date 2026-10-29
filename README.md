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

The root `vercel.json` defines Vercel Services routing for the Vite frontend and Express API, with `/api/*` sent to the backend. Vercel Services availability depends on the account; enable it for the project before deploying this configuration.

Uploads for PDF analysis, receipt images, chat images, and ZIP skill packages use short-lived Supabase Storage signed uploads. Apply both `supabase/migrations/20261028000000_openedup_app_schema.sql` and `supabase/migrations/20261029000000_skill_storage_bucket.sql` before using the backend. The server checks account ownership before reading uploaded objects and removes processed uploads; abandoned-upload cleanup still needs a scheduled cleanup job.

The backend repositories use Supabase Postgres when `DATABASE_URL` is present. Use the Supabase **shared transaction pooler** URI for Vercel and keep it server-only. Add the URI under the backend service's Production environment as `DATABASE_URL`. The backend verifies the server certificate and hostname with the Supabase root CA bundled in the service; use `DATABASE_SSL_CA` to override it if the project CA changes. The API refuses to silently fall back to SQLite in production, and `/readyz` checks that its configured database is reachable.

Configure the frontend service with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Configure the backend service with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `BYOK_ENCRYPTION_KEY`, and `DATABASE_URL`. Set `DATABASE_SSL_CA` only when overriding the bundled CA. `BYOK_ENCRYPTION_KEY` must be base64 for exactly 32 random bytes; generate it with `openssl rand -base64 32` and keep it stable. Keep secret values out of `VITE_` variables. The Supabase secret key is used only for server-side Storage operations. Provider keys such as `GEMINI_API_KEY` are optional unless server-side PDF OCR uses them. Never commit populated environment files.

Skill packages and generated chat files are stored in private Supabase Storage buckets. Chat code execution uses the isolated Vercel Sandbox SDK; enable Vercel Sandbox for the project. It runs Bash and workspace Read/Write/SendUserFile tools in an isolated microVM, and generated file downloads require the authenticated owner of the conversation. The Vercel Sandbox SDK authenticates with Vercel OIDC in deployed functions.

Scheduled tasks need a separate worker because serverless functions do not keep the local polling loop alive. Build and deploy `backend/Dockerfile` as a Northflank scheduled job using command `node dist/scheduled-worker.js`, scheduled once per minute. Copy the backend's production environment variables to this job. The worker drains up to five due tasks per run. Set up a second daily Northflank job with command `node dist/upload-cleanup-worker.js`; it removes signed-upload objects older than 24 hours (up to 1,000 per run). The main Vercel API and scheduled-task worker must use the same Postgres database. (Northflank can run image commands on a cron schedule: <https://northflank.com/docs/v1/application/run/run-an-image-once-or-on-a-schedule>.)

The existing Vercel SQLite data was ephemeral and is not migrated by these SQL migrations. After configuration, verify `/readyz`, sign in, create a conversation, and confirm it persists across separate function invocations before routing production traffic. Vercel deployment and Supabase configuration still need to be completed in the respective dashboards.

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

Production must use authenticated identity and an isolated execution runtime (Vercel Sandbox on Vercel, Docker for the standalone server). Keep `SANDBOX_MODE=unsafe-local` limited to development and tests. Report vulnerabilities through GitHub Private Vulnerability Reporting.

## License

Distributed under the [MIT License](LICENSE). Copyright (c) 2026 Charan Interiors / Openedup Contributors.
