# Slice 03 — Provider-to-client streaming

## Contract

`POST /api/chat/stream` emits genuine provider text deltas while generation is in progress, followed by `done`, or a sanitized `error`. Disconnect aborts the upstream request. No controller-side fabricated chunking remains.

## API and ownership seam

- Provider adapters expose `generateMultiProviderChatStream(params, onDelta)` with an optional abort signal; the route emits token deltas and terminal metadata using the established SSE event names.
- OpenAI-compatible adapters parse SSE `data:` frames and `[DONE]`; Anthropic parses named SSE events and text deltas; Gemini uses `generateContentStream`.
- Chat controller writes normalized deltas to SSE and stops/aborts on response close. Persist final assistant output only after clean completion; on partial error persist an interrupted turn with explicit status when user-authenticated.
- Frontend ChatWindow incrementally applies SSE deltas into one stable assistant message and aborts on user cancel.

## Verification

The OpenAI-compatible adapter test emits delayed chunks and Unicode deltas and asserts the first delta arrives before stream completion. Cancellation is wired from response close through provider abort signals. Anthropic and Gemini streaming adapters need provider-fixture coverage before claiming parity; no live provider credentials were exercised.

## Delegated choices

Keep current event names (`step`, `token`, `done`, `error`) and add metadata as needed. Heartbeat cadence is delegated; no fake chunk timing remains.

## Must stay green

Unary `POST /api/chat` remains available to project/session flows; provider fallback behavior reports the actual `modelUsed`.
