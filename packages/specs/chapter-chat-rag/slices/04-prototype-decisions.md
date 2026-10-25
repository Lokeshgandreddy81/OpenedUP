# Slice 04 — Prototype decision checkpoint

## Goal

Use the complete vertical slice to make evidence-based decisions about retrieval quality and data lifetime before adding persistent infrastructure.

## Review evidence

Record results from a small representative set of searchable chapters and student questions:

- Exact lookup and paraphrase recall.
- Multi-page questions and whether all necessary pages are retrieved.
- Unsupported-question abstention and false-positive rate.
- Citation correctness against original PDF page and excerpt.
- Extraction/retrieval/first-token latency and payload size.
- Local clone/setup friction and behavior when a source file is removed or the page reloads.

## Decisions to make with the user

1. Is lexical/BM25 retrieval sufficient? If not, compare a hybrid lexical/vector approach with measured quality, cost, dependency, privacy, and operational effects. Do not add vector infrastructure solely for convention.
2. What should persist: PDF, page text, index, conversation, or some subset? Decide account ownership, deletion, retention, cross-device behavior, storage location, encryption, and auth together.
3. How should chapter chat behave for guests and on reload? Keep current prototype behavior session-only until this is decided.

## Exit criteria

- A complete vertical slice has been tried with real searchable PDFs.
- Retrieval/citation/abstention evidence is documented.
- User has a concrete persistence and retrieval trade-off proposal to decide.
- No migration or durable storage is added before lifecycle choices are settled.
