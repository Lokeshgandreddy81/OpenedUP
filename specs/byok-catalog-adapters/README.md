# BYOK catalog and adapter support

## Next Agent Prompt

Status: selected-model BYOK dispatch now covers scanned-PDF OCR. Typecheck, the full backend suite, and bounded renderer tests pass. No live provider OCR has been run. Last updated 2026-10-26.

Next: run opt-in image probes with provider test accounts, then finish provider-aware cost controls. Current official docs describe different tokenized image billing: OpenAI uses model-specific resized patches, Anthropic uses 28×28 visual tokens, DeepSeek caps image input at about 1,024 tokens per image, and Gemini bills document tokens at its image rate. Those references do not attest the app's exact selected-model requests or account prices, so capture live usage before choosing a dollar ceiling. Scanned-PDF OCR renders ordered JPEG pages with an eight-page cap, 1600-pixel maximum edge, 1.5 MB encoded page limit, and 8 MB aggregate limit, then dispatches them through the selected verified image-capable model. Searchable-PDF local extraction remains first. No live provider OCR result is claimed.

Pricing references: [OpenAI image cost calculator](https://developers.openai.com/api/docs/guides/image-cost-calculator), [Anthropic vision limits and costs](https://platform.claude.com/docs/en/build-with-claude/vision), [DeepSeek vision token usage](https://api-docs.deepseek.com/guides/vision/), and [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

- [x] Shared receipt/duplicate model selection — shipped in current code.
- [x] Opt-in live image probe — runner ready; live provider results pending.
- [x] [Bounded PDF rendering](slices/01-bounded-pdf-rendering.md) — implemented; five Python tests pass.
- [x] [Scanned PDF BYOK dispatch](slices/02-scanned-pdf-byok-dispatch.md) — implemented; TypeScript checks, backend tests, and Python renderer tests pass.
- [ ] Run image probes with provider test accounts — credentials and results pending.
- [ ] Set provider-aware image cost limits — pricing references reviewed; live usage measurements and account/regional rates still needed.

Before ending a pass, update this handoff section with the current slice status, verification results, and the next pickup point.

## Goal

Keep the selectable model catalog traceable to current provider documentation and keep each transport contract covered by deterministic request/response tests. A passing mock proves the application constructs and parses a request; it does not prove a provider account can access a model. Live checks remain opt-in and use dedicated test accounts.

## Decisions

- `packages/contracts/src/types/models.ts` owns model identity, provider, documented API protocol, documented upstream capabilities and limits, app-supported input modalities, availability status, and source provenance.
- Provider-specific endpoint construction and request serialization remain in the backend provider service. Tests exercise exported generation functions with mocked HTTP/SDK fetch, not private serializers.
- Model source URL and review date are required for every fixed catalog entry. A user-configured model is explicitly marked as such and cites the endpoint protocol documentation rather than claiming the user-supplied model ID has been verified.
- `inputModalities` describes inputs currently implemented by this app path. Separate upstream modality metadata records what the provider documents, so provider support does not imply the app can send that modality.
- Custom endpoints have no verified capability metadata; standard chat therefore treats them as text-only until the endpoint is configured with explicit app-supported capabilities.
- Provider reasoning and tool-call support is documentation metadata. It does not claim that Shoebox's chat request currently sends native provider tools; workspace context tools remain app-managed.
- Entries that are unavailable or restricted to a different class of client remain non-selectable in standard chat and say why.
- This work changes static build-time metadata only. It adds no persisted state, migration, live provider call, or credential handling.

## Slice ladder

1. **Sourced catalog and adapter contract** (complete): verify every registry entry; add source, review date, lifecycle/restriction status, upstream modalities and documented features; correct stale claims; add catalog invariants and request-boundary coverage for every selectable entry and protocol branch.
2. **Capability-aware model selection** (complete with defined limits): block unsupported image input in the composer and backend, show app-supported inputs and documented provider limits/features in the picker, and conservatively preflight text-only requests for fixed catalog models. Image and user-configured model context remains provider-validated.
3. **Failure and stream lifecycle** (complete): bound chat requests, reject malformed provider streams, preserve partial output on failure, and keep fallback retries limited to a safe pre-output Gemini model-unavailable case.
4. **Cross-feature parity** (implemented; live validation pending): interactive chat, chapter chat, scheduled tasks, duplicate review, receipt image extraction, and scanned-PDF OCR use the shared provider dispatcher. Searchable-PDF extraction remains local.
5. **Privacy and operations** (complete): prevent payload and credential logging and add provider/model/failure-category diagnostics without raw upstream errors.
6. **Opt-in live matrix** (runner ready; live results pending): document provider test-account setup and store per-provider/model smoke outcomes separately from deterministic unit tests. Each run checks one provider/model, one text or image probe, and one streaming mode; live calls have not been run.

## Acceptance for slice 1

- Every fixed catalog record has a source URL, review date, and explicit evidence status.
- Every selectable fixed catalog record has a documented upstream ID, API protocol, context limit, and supported model family; output limits are recorded when the provider publishes a fixed limit. User-configured records are explicitly marked unverified, and endpoint-restricted entries cannot enter ordinary chat selection.
- Upstream input capabilities are distinguishable from modalities the app actually sends.
- Mocked adapter tests assert resolved provider/model, URL path, auth/version headers, provider-specific request fields, response parsing, streaming behavior, and errors without external credentials.
- Typecheck and backend tests pass. No live key is required.

## Research sources

Sources were reviewed on 2026-10-26 and are recorded on the corresponding model entries. Provider documentation can change; the review date records the evidence snapshot, not a freshness guarantee.

## Capability selection status

- Image input is blocked in the composer and backend when the selected model's app-supported modalities exclude images. Custom endpoints default to text-only because their capabilities are unknown.
- The picker shows app-supported input modalities, context size, documented provider reasoning/tool-call support, and a documented output limit when available. Provider tool-call support is informational; the current chat request does not pass native tools to providers.
- Context size is shown. Fixed catalog text-only requests use a conservative UTF-8 byte upper bound with output/framing reserve before dispatch; this can reject text that a model tokenizer would fit. Image requests and user-configured models skip this preflight because their total token cost/window is not reliably known. Provider context-overflow errors give actionable guidance. Automatic truncation remains out of scope so conversation history is not silently discarded.
- Audio and video are documented upstream for some models but are not currently accepted by the chat composer and remain unavailable in the app.

## Failure and stream lifecycle status

- Ordinary chat requests, chat streams, and chapter streams use a 90-second server-side generation deadline. Disconnect cancellation remains separate from timeout handling.
- Gemini falls back only for a 404 that identifies the requested model as unavailable, and only before emitting output. Other providers do not automatically retry requests, avoiding duplicate billable generations.
- Invalid JSON inside a provider SSE event now fails the generation with safe, actionable guidance instead of being silently dropped.
- If generation fails after tokens reached the client, chat and project surfaces retain those tokens and append the interruption reason. A retry remains an explicit user action.
- Provider tests cover malformed streams, upstream SSE errors, cancellation, partial-output failures, and the allowed Gemini fallback behavior. No live provider credentials are needed.

## Cross-feature parity status

- Interactive chat, chapter chat, and scheduled tasks use the shared chat generation service, so they share provider dispatch and model capability admission. Scheduled runs now receive the same 90-second generation deadline as interactive chat.
- Duplicate review now uses the model selected in the receipt workflow and the shared multi-provider text dispatcher. Its API requires a model ID (hard cutover), sends request/vault credentials using the same BYOK resolution rules, and validates model-returned row references before applying suggestions. Providers receive a JSON-only prompt rather than a provider-specific structured-output option, preserving compatibility across adapters. Deterministic reconciliation remains active if model review fails; the workflow surfaces the failure.
- Receipt extraction and duplicate review now share one selected image-capable catalog model. Receipt requests require an explicit model (hard cutover), resolve credentials using the same BYOK request/vault path, reject models the app marks text-only, validate the model's JSON response, and cap batches at ten images / 50 MB encoded image data. Provider generations are not automatically retried because timeout outcomes may already be billable.
- Searchable PDF parsing runs through local extraction first. When OCR is needed, rendered pages go to the selected verified image-capable model through the shared dispatcher and the request/vault credential path. The original PDF is not sent to the provider. Renderer or provider failure preserves available local recovery and marks OCR recommended; there is no implicit server Gemini-key fallback. OCR currently accepts at most eight pages, each encoded image is capped at 1.5 MB, and aggregate encoded images at 8 MB.
- Remaining parity validation: opt-in live image/OCR checks and provider-specific image cost ceilings. These require test accounts and current provider pricing; deterministic adapter tests do not prove live account/model access.

## Privacy and operations status

- Log metadata redacts credential fields and user payload fields (prompts, messages, content, input/output, and similar values). Request URL logging redacts prompt/content-style query parameters as well as credentials.
- Gemini/PDF fallback and global error logs no longer include raw exception messages or stacks. PDF filenames are omitted from logs. Error responses retain the existing secret redaction behavior.
- Provider failures use bounded categories such as authentication, rate limit, timeout, malformed stream, network, provider unavailable, and invalid request. Chat and scheduled failure diagnostics include request/task identity, provider, model, error type, and category without storing prompt or provider response text.
- Redaction coverage includes Google `AQ.` and `ya29.` token forms in addition to existing provider key formats. Tests cover payload metadata, query strings, and provider failure classification.

## Opt-in live matrix status

- `backend/scripts/runByokLiveMatrix.ts` uses the production dispatcher to run one short text or synthetic image probe for one catalog chat model, in either streaming or non-streaming mode. Image probes are limited to verified catalog models whose app-supported modalities include images. It checks the provider response for the probe token.
- The runner requires an explicit confirmation sentinel, provider, catalog model ID, dedicated test API key, and mode. Custom model runs additionally require a custom model ID; a custom base URL is optional and retains the existing endpoint validation.
- A run prints one credential-free JSON record containing UTC time, provider, catalog/upstream model IDs, mode, outcome, bounded failure category, duration, and provider-reported input/output/total token counts when available. Set `BYOK_LIVE_RESULTS_FILE` to append the same JSONL record with restrictive file permissions. Token counts are raw provider usage, not an estimated dollar amount; streamed responses may omit them.
- Run it from `backend/` with `npm run test:byok-live`. Set `BYOK_LIVE_CONFIRM=I_UNDERSTAND_THIS_MAY_COST`, `BYOK_LIVE_PROVIDER`, `BYOK_LIVE_MODEL_ID`, `BYOK_LIVE_API_KEY`, `BYOK_LIVE_PROBE=text|image`, and `BYOK_LIVE_MODE=stream|non-stream`. Use provider test credentials and a model with a low-cost quota. Custom model examples also set `BYOK_LIVE_CUSTOM_MODEL`; custom gateways may set `BYOK_LIVE_BASE_URL`. Image mode requires a verified fixed catalog model that advertises app-supported image input.
- The runner is intentionally one-entry-per-invocation. It never reads the app's normal provider-key environment variables and does not emit request text, output text, raw upstream errors, or credentials. The image probe sends a tiny synthetic red-square PNG through the selected adapter. Live calls were not executed while building this runner; the provider/model support matrix has no attested results yet.
