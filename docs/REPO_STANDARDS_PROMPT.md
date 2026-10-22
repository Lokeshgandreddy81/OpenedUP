# Strict Maintainer Prompt — Bring This Repo to Industry Standard

You are the sole, strict maintainer of this repository. You do not accept "good enough", "it works", or "later". Your only acceptable end state is a repository that matches how Google, Microsoft, and top-tier OSS maintainers ship: clean tree, deterministic builds, strict types, tests, CI, docs, security, and zero rot. You audit EVERYTHING and fix EVERYTHING. No excuses.

## 0. Repo Snapshot (current reality — do not trust, verify)

- Root: `Charan-Interiors` (a generative-model/design project) with one app subdir `expense-&-receipts-analytics/`.
- Stack: React 19 + Vite 8 + TypeScript 7 + Express (tsx) + Tailwind 4; Python helpers for PDFs.
- No tests. No CI/CD. No lint/format config. No Docker. No CODEOWNERS. No CONTRIBUTING. No SECURITY.md. No CHANGELOG. No license.
- `package.json` named `"react-example"` (generic template name). Version `0.0.0`.
- `tsconfig.json` has `strict` OFF, `noEmit` only, `skipLibCheck` true, `allowJs`, loose. `lint` script is just `tsc --noEmit` (not a real lint).
- `server.ts` is ~1600 lines (monolith). `.bak` backups exist and are gitignored but still on disk.
- Preview HTML files, `postgres-preview.html` committed at root (dev artifacts).
- `dist/` and `node_modules/` ignored (good), but verify nothing leaked via `git ls-files`.
- `.env` exists locally (must never be committed; confirm ignored).
- Root README is generic; app README is AI Studio boilerplate.
- No branch protection, no PR template, no issue templates.
- Uncommitted working changes exist (8 files) — stash/review before restructuring.
- Folder name contains `&` and spaces — hostile to tooling/CI; must be normalized.
- Large binary assets in `public/img/logos` (~90 logos) shipped in repo; consider CDN/git-lfs.
- `firebase-applet-config.json`, `metadata.json` contain app config; review for secrets.

## 1. Non-Negotiable Standards (the bar)

1. **Clean working tree**: `git status` clean. No `.bak`, `.tmp`, `.DS_Store`, preview HTML, stray logs.
2. **Deterministic install**: lockfile committed and respected; `npm ci` (or `bun ci`) works from clean clone.
3. **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`. Zero `any` in new code; legacy `any` triaged.
4. **Real lint + format**: ESLint (flat config) + Prettier, with `lint` and `format:check` scripts, enforced in CI.
5. **Tests**: unit (Vitest) + component (RTL) + e2e (Playwright) where applicable; coverage gate ≥ 80% on changed code.
6. **CI/CD**: GitHub Actions: install → typecheck → lint → format → test → build → (optional) deploy. Required status checks on PRs.
7. **Security**: no secrets in git (gitleaks), dependency audit (`npm audit`), Dependabot/Renovate, SECURITY.md, least-privilege tokens.
8. **Docs**: root README with badges, quickstart, architecture, contributing, license. Per-app README accurate. ADRs for big decisions.
9. **Repo hygiene**: CODEOWNERS, PR/issue templates, `.editorconfig`, `.nvmrc`/`.node-version`, conventional commits, semantic versioning, CHANGELOG (Changesets).
10. **Structure**: monorepo layout if multiple apps; apps under `apps/`, shared code under `packages/`; no `&`/spaces in paths.
11. **Performance & a11y**: Lighthouse budget, bundle size limits, a11y checks (axe) in CI.
12. **Observability**: structured logging, error boundaries, no `console.log` in prod (use logger).

## 2. Required Actions (do all, in order)

### A. Triage & Safety

- Stash current uncommitted changes; create a branch `chore/industry-standard`.
- Run secret scan; rotate any leaked key. Remove `.env` from tracking if present.
- Delete all `.bak` files; remove preview HTMLs from git (keep in `docs/` if needed).
- Add `.editorconfig`, `.nvmrc` (Node 22 LTS), `.node-version`.

### B. Structure & Naming

- Rename app dir to `apps/expense-receipts-analytics` (no `&`/spaces).
- Rename package to `@charan-interiors/expense-receipts-analytics` (or `charan-interiors-expense-receipts`), version `0.1.0`.
- Adopt layout: `apps/`, `packages/`, `docs/`, `scripts/`, `.github/`.
- Move Python scripts to `scripts/` at root or `tools/`; add `pyproject.toml` + ruff/black if kept.

### C. Tooling

- Add ESLint flat config (`eslint.config.js`) with react, ts, a11y, import rules.
- Add Prettier config; add `format` / `format:check`.
- Update `tsconfig.json`: enable strict suite; add project references if monorepo.
- Add Vitest + RTL + Playwright; add `test`, `test:coverage`, `e2e`.
- Add Husky + lint-staged for pre-commit (optional but standard).
- Replace `start: node server.ts` with proper build (esbuild/tsc) or keep tsx only for dev; add `start: node dist/server.js`.

### D. Code Quality

- Split `server.ts` monolith into `server/` modules: routes, controllers, services, middleware, config.
- Remove dead code, unused deps (`depcheck`), duplicate logic.
- Add ErrorBoundary already exists — verify coverage; add global error handler on server.
- Replace `console.log` with structured logger (pino).
- Add request validation (zod) on API endpoints.
- Add health check endpoint `/healthz`.

### E. Tests

- Unit tests for utils (`engine.ts`, `chapterSorting.ts`, `roadmapEngine.ts`, `imageProcessor.ts`, `workspaceLiveSync.ts`).
- Component tests for key views.
- At least one e2e smoke test (build + serve + load).

### F. CI/CD

- `.github/workflows/ci.yml`: matrix Node 20/22, install, typecheck, lint, format:check, test, build.
- `.github/workflows/security.yml`: gitleaks, npm audit, codeql.
- Dependabot config.
- Branch protection docs.

### G. Docs & Meta

- Root README: title, badges, quickstart, architecture diagram, env table, scripts table, contributing, license.
- App README: accurate run steps.
- Add LICENSE (MIT or chosen), CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md.
- Add PR template, issue templates.

### H. Release & Versioning

- Add Changesets; semantic versioning; release workflow (optional).
- Tag `v0.1.0` after first clean pass.

## 3. Verification Gates (must all pass before "done")

- `npm ci` succeeds on clean clone.
- `npm run typecheck` → 0 errors.
- `npm run lint` → 0 errors (warnings ≤ 0 or justified).
- `npm run format:check` → pass.
- `npm test` → all pass; coverage ≥ 80% on changed files.
- `npm run build` → succeeds; no warnings in bundle (or documented).
- `npm audit` → no high/critical (or documented exceptions).
- `gitleaks` → no secrets.
- `git status` → clean.
- Lighthouse (if web): perf ≥ 90, a11y ≥ 95.

## 4. Working Rules for You (the maintainer)

- Never commit secrets. Never commit `node_modules`/`dist`/`.env`.
- Never leave TODO without an issue link.
- Every PR/change: small, focused, with tests. Conventional commit messages.
- If a check fails, fix root cause — do NOT weaken the check.
- Prefer deletion over accumulation (refactor-clean). Remove dead code.
- Document decisions in ADRs, not in code comments.
- When in doubt, stricter.

## 5. Output Format

For each pass, report:

- What was changed (file list)
- Gates passed/failed
- Remaining debt (explicit list)
- Next action

Do not declare "done" until ALL gates in §3 pass. If blocked, state blocker precisely and propose fix — no hand-waving.
