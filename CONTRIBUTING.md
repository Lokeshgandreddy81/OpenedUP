# Contributing Guidelines

Thank you for your interest in contributing to this project. We hold our codebase to the highest industry standards for reliability, security, type-safety, and test coverage.

## Ground Rules

1. **Clean Git Tree**: No stray logs, backups (`.bak`), or preview HTMLs.
2. **Deterministic Builds**: Always use `npm ci` rather than `npm install` in CI/testing.
3. **Strict TypeScript**: No `any` types in new code. Strict mode is enforced.
4. **Testing**: All utils and API routes require unit and integration tests. Test coverage must remain >= 80% on changed code.
5. **Security First**: Never commit secrets, tokens, or environment files (`.env`). All commits pass Gitleaks and `npm audit`.
6. **Conventional Commits**: Format commit messages according to [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new expense export method`
   - `fix: prevent NaN when total is missing`
   - `test: add unit tests for chapter sorting`
   - `chore: update dependencies`
   - `docs: update quickstart guide`

## Development Workflow

1. Clone the repository:

   ```bash
   git clone git@github.com:Lokeshgandreddy81/OpenedUP.git
   cd OpenedUP
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Run verification checks before opening a pull request:

   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm run test:coverage
   npm run build
   ```

4. Create changesets for versioned changes:
   ```bash
   npx changeset
   ```
