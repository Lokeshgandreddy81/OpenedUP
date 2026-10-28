# Architecture Boundaries

- Keep product behavior, state, and UI inside the feature that owns them. Cross-feature imports use an exposed feature entry point; `npm run check:feature-boundaries` enforces the rule.
- Keep shared request and response schemas in `packages/contracts`. That package stays independent of frontend and backend runtimes.
- Let backend domains own their application workflows and persistence. Put cross-domain HTTP, authentication, configuration, and observability in `backend/src/platform`.
- Keep document-processing algorithms in the Python workspace and call them through explicit inputs and outputs.
- Keep the HTTP contract in `packages/docs/api/openapi.yaml`; update it with externally visible API changes.
