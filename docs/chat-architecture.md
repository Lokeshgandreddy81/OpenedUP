# Chat architecture

## Provider and model routing

`backend/contracts/src/types/models.ts` owns the provider catalog and selectable model registry. The frontend model pickers derive their options from this registry, and the backend resolves the selected public model ID to a provider and upstream model ID. Unknown model IDs are rejected. The `custom-model` entry uses a model ID entered by the user.

The shared provider request configuration keeps the main chat and project sessions on the same selected model, key, and endpoint. Signed-in accounts can save provider credentials to `/api/credentials`; AES-256-GCM encrypts them at rest and the API only returns configured provider IDs. Endpoint-only updates preserve the saved key without returning it to the browser. `BYOK_ENCRYPTION_KEY` must be a base64-encoded 32-byte key in hosted deployments. Provider endpoints are stored with the selected provider’s settings. Provider requests require HTTPS, reject redirects, resolve only to public addresses, and pin the connection to the address that passed validation.

Chat requests are validated by the contracts Zod schema. Project uploads extract browser-local text from plain text, Markdown, CSV, JSON, XML, YAML, and log files up to 100 KB each, or text-based PDF content up to 5 MB and the first 50 pages; scanned PDFs without selectable text are rejected. Total extracted project text is limited to 120 KB. PDF page markers are retained so the model can cite the source filename and page. Other binary formats are rejected with a visible explanation. Extracted name/content pairs are sent with project instructions and document chapter metadata; they are not uploaded to a file store. The backend JSON-encodes file context and treats it as untrusted data. The backend also adds project and workspace rules from `OPENEDUP.md` and `~/.config/openedup/AGENTS.md`, then calls the selected provider. The versioned skill registry exposes three bounded, server-owned skills. `document-grounding` searches only request-supplied chapter metadata, `workspace-context` inspects only supplied instructions and filenames, and `executive-directness` applies a response-format policy. No skill executes code or reads arbitrary paths. Chapter matching is local keyword matching, not semantic retrieval.

## State and persistence

Firebase ID tokens are verified against the configured Firebase project; the verified UID owns conversation, artifact, project, and credential rows. Conversations persist in SQLite and are queried by owner. Projects persist as bounded JSON snapshots keyed by `(user_id, project_id)`; their nested sessions, messages, and extracted files have one canonical owner. Existing browser projects import idempotently for the first account claiming that browser snapshot, excluding the demo fixture; after import, project data is read from the account store and is not copied back to the shared anonymous localStorage key. Signed-out projects remain browser-local. The database is single-instance and its container volume must be kept persistent. Existing browser artifacts import idempotently after sign-in; private artifacts are owner-only and shared artifacts are readable by signed-in users while sharing remains enabled. Artifact edits and renames are owner-scoped, exports are browser downloads, and the latest 50 pre-edit snapshots are available for restore. Anonymous and temporary chats remain transient. Existing local conversation history did not exist to migrate.

The plugin catalog currently installs only bundled, allowlisted chat capabilities backed by the three server-owned skills. Install state is browser-local and installed capabilities appear in the chat skill picker. Permission labels state the supplied context each capability reads; the system has no third-party plugin code execution or remote connector installation.

The SSE endpoint forwards provider deltas from Gemini, Anthropic, and OpenAI-compatible APIs as they arrive. Main chat and both project-session entry points consume that endpoint; project sessions expose cancellation. Disconnects abort upstream generation. Provider failures are sanitized at the API boundary; interrupted partial output is not stored as a completed turn. Main-chat dictation uses browser speech recognition where supported and lets the user review the transcript before sending; read-aloud uses browser speech synthesis. These browser APIs vary by browser and require live permission/device testing.

## API surface

The chat router exposes:

- `POST /api/chat` for a single provider response.
- `POST /api/chat/stream` for provider-to-client SSE token streaming.
- `GET /api/chat/providers` for server configuration status, without key material.
- `GET /api/chat/skills` for the versioned built-in skill catalog.
- Authenticated `/api/conversations`, `/api/artifacts`, and `/api/projects` for account-scoped state; `/api/credentials` stores provider secrets and allows endpoint changes without returning those secrets.
- `POST /api/chat/verify-key` for provider connection checks.
- `GET` and `POST /api/chat/rules` for reading and saving workspace instructions. Writes are restricted to loopback and non-production.

The OpenAPI contract is maintained in `docs/api/openapi.yaml`.

For Docker deployments, copy `.env.example` to `.env`, set `FIREBASE_PROJECT_ID` to the frontend Firebase project, and set a stable random `BYOK_ENCRYPTION_KEY`. Keep the `openedup-data` volume; losing it deletes account data and the local development credential key.

Server-owned provider keys are disabled by default. To let authenticated users consume configured server keys, explicitly set `ALLOW_SERVER_PROVIDER_KEYS=true`. The two built-in OpenRouter `:free` models can use `OPENROUTER_API_KEY` in unauthenticated loopback sessions only when `OPENROUTER_FREE_MODELS_ENABLED=true`; this does not allow remote anonymous use or paid models. User-owned BYOK keys continue to work without either setting. Custom provider endpoints must use HTTPS and resolve only to public addresses; the outbound connection pins the validated address and refuses redirects.
