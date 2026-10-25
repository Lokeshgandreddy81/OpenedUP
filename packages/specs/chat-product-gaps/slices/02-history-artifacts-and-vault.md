# Slice 02 — Persistent history, shared artifacts, and credential vault

## Contract

Signed-in users can create, list, edit, archive, and delete their own conversations, with ordered persisted turns. Artifacts persist per account and can be explicitly shared with authenticated users only; owner can revoke. Existing local artifacts import idempotently after sign-in. Browser storage contains no long-lived provider secret after migration.

## API and ownership seam

- `/api/conversations` list/create; `/:id` get/update/delete; `/:id/messages` append. Server owns turn IDs, timestamps, title updates, and owner UID.
- `/api/artifacts` list/create; `/:id` update/delete; `/:id/share` owner-only visibility toggle; import endpoint upserts legacy artifact IDs scoped to UID.
- `/api/credentials` lists masked status only, accepts provider key writes and deletes. AES-256-GCM envelope: fresh random nonce per value, authenticated provider/UID as AAD, key from `BYOK_ENCRYPTION_KEY`; never return ciphertext or plaintext. Key writes require authenticated TLS; one-shot ephemeral header remains available.
- Frontend API client owns bearer-token injection and typed response parsing. ChatWindow/sidebar and artifactStore consume API state, not duplicate persistence logic.
- Import is idempotent; leave local records intact unless user explicitly confirms cleanup after successful upload.

## Human-visible surface

Conversations remain after reload. Artifacts work across devices. “Shared” records are visible only after sign-in and only while their owner keeps sharing enabled. On first sign-in, show how many existing artifacts will import and offer import. Provider keys are saved to the authenticated vault; old local keys are removed from localStorage and offered for explicit vault save.

## Verification

Two-account integration tests: private artifact denied to B; shared artifact readable to B; B cannot mutate; revoke removes access. Conversation list and message APIs isolate A/B. Repeated import is idempotent. Credential responses/logs never include secret; encryption round-trip and wrong-key/tampered-ciphertext rejection. Existing local artifacts remain until import is acknowledged.

## Delegated choices

Pagination size and ergonomic UI copy are delegated. No public share links, guest access, workspace/team membership, or automatic publication.

## Must stay green

Temporary chat remains unpersisted; project sessions keep their existing project context while their conversational turns use the authenticated owner contract when signed in.

## Human review

Non-blocking: show the import confirmation and private/shared states in the app. If the user stays silent, decide from account-scoped API evidence, record the decision, close any screenshot preview, and proceed.
