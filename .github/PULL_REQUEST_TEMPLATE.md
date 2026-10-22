## Description

Brief summary of the changes made and the motivation.

Fixes #(issue)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring / Chore (no functional changes)
- [ ] Documentation update

## Verification Gates Checklist

- [ ] Deterministic install (`npm ci`) passes
- [ ] Static typecheck (`npm run typecheck`) passes with 0 errors
- [ ] Linter (`npm run lint`) passes with 0 errors
- [ ] Formatter (`npm run format:check`) passes
- [ ] Tests (`npm test` / `npm run test:coverage`) pass with >=80% coverage on changed code
- [ ] Build (`npm run build`) passes cleanly
- [ ] Dependency audit (`npm audit`) reports 0 high/critical vulnerabilities
- [ ] No secrets committed (verified with gitleaks)
- [ ] Changeset added (if applicable, via `npx changeset`)

## Screenshots / Evidence (if UI change)
