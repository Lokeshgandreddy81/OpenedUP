# Branch Protection Rules

To maintain high code quality and security, `main` branch protection must be enabled with the following rules in GitHub Repository Settings:

## Required Settings for `main`

1. **Require a pull request before merging**
   - Require approvals: Minimum 1 approval
   - Dismiss stale pull request approvals when new commits are pushed
   - Require review from Code Owners

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - Required status checks:
     - `Build, Lint & Test (Node 24.12.0)`
     - `Dependency Audit & Secret Scan`
     - `CodeQL Static Analysis`

3. **Require conversation resolution before merging**
   - All comments and review discussions must be resolved.

4. **Require signed commits** (recommended)

5. **Require linear history**
   - Use "Squash and merge" or "Rebase and merge" to avoid merge commits.

6. **Do not allow bypassing the above settings**
   - Apply to administrators as well.
