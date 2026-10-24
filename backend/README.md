# Backend

The backend is a single Express process with internal domain boundaries. It owns HTTP adapters, application workflows, provider integrations, persistence, authentication, and request lifecycle concerns. Domain folders are code ownership boundaries, not separately deployed services.

Shared request and response contracts live in [`contracts/`](contracts/). Keep them runtime-neutral so the browser can consume them without importing server code. The app composition root wires domain routers and platform middleware; business logic belongs behind the route handlers.

Chat requests use the selected user's provider key. Signed-in users may save keys in the encrypted credential vault; server environment keys are reserved for document processing and are not chat fallbacks. See [Chat architecture](../docs/chat-architecture.md) for the security and persistence invariants.

Run the service from the repository root with `npm run dev:backend`; run the full installation and verification workflow from the [root README](../README.md). Production containers use the Node version pinned by the repository's runtime policy and keep SQLite data on a persistent volume.
