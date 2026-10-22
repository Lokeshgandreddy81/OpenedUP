# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-22

### Added

- Monorepo layout structuring apps under `apps/` and tools under `scripts/`.
- Strict TypeScript configuration across the monorepo.
- Deterministic lockfile verification via `npm ci`.
- Full testing pipeline with Vitest, React Testing Library, and Playwright e2e scaffolding.
- Modularized Express server architecture with dedicated routes, controllers, middleware, and services.
- Structured logging with Pino and HTTP request tracking.
- Request payload validation using Zod.
- Operational health check endpoint `/healthz`.
- Comprehensive GitHub Actions CI/CD workflows and security audits (Gitleaks, CodeQL, Dependabot).
- Open-source repository hygiene: LICENSE, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT, PR & Issue templates, Changesets.
