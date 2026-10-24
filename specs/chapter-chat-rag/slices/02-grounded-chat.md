# Slice 02 — Selected-chapter retrieval and grounded API

## Goal

Provide a dedicated chapter-chat API that receives only bounded evidence retrieved from the selected chapter and returns typed grounded answer/citation/abstention events.

## Architecture owner

The chapter feature owns extraction, chunking, and initial lexical retrieval. The backend owns request validation, provider invocation through the existing provider/credential owner, and the grounded response shape. The generic chat service/tool selector is not the chapter retrieval owner.

## Contract and behavior

- Add a chapter-specific typed request/response contract; do not add chapter passages to generic `ChatRequest`.
- Include opaque chapter/session identity, selected model, user question, and a bounded list of retrieved passage IDs, absolute page numbers, and text. Reject malformed or out-of-range citations.
- Start with deterministic page-aware chunks and lexical/BM25-style ranking, scoped strictly to the selected chapter. Do not silently search neighboring chapters or fallback to arbitrary content.
- Return an explicit abstention when no relevant evidence is found or the model cannot support an answer. The assistant instruction must say to answer only from supplied evidence and state when it is absent.
- Model output citations are references to supplied passage IDs; resolve page number and short excerpt from source data, never trust model-invented page numbers/quotes.
- Reuse the existing selected model and BYOK provider credential resolution through a narrow shared service seam. Do not store or copy API keys into chapter data.
- Treat passage text as untrusted quoted source; it cannot authorize tools or override the system instruction. Chapter mode has no generic attachments, plugins, or other-chapter context.
- Bound number of passages, text bytes/tokens, and prompt size. Surface validation/provider errors without exposing credentials.

## Acceptance criteria

- Retrieval results only identify passages from the selected chapter.
- No-match produces a clear not-in-chapter answer rather than a fabricated citation.
- Every citation resolves to a passage supplied in the request and exact source excerpt/page.
- Provider/model selection works through the existing credential owner; generic endpoints remain unchanged.
- Request validation prevents caller-supplied unrelated chapter or invalid page references.

## Verification to add/run during implementation

Add deterministic retrieval fixtures including exact term, paraphrase, multi-page evidence, irrelevant chapter distractor, and absent answer. Test selected-chapter isolation, payload limits, citation resolution, malformed references, abstention, and provider errors. Exercise generic chat contract regression after code changes (the planning pass does not run tests).

## Out of scope

Vector database/embedding dependencies, server OCR, document persistence, generic chat behavior changes, provider key schema changes.
