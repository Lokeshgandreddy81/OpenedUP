# Chapter chat with grounded retrieval

**Status:** Slices 01–03 implemented; typecheck/build passed; behavior and visual gates pending
**Updated:** 2026-10-24
**Next pickup:** run the focused behavior and visual gates, then review the prototype with the user

## Next Agent Prompt

Review the current Slice 01–03 implementation against the acceptance criteria. Preserve the app shell, existing chapter layout, and generic chat behavior. Do not add OCR, persistence, embeddings, migrations, or generic-chat changes. Behavioral tests and a real-PDF visual review are still pending; follow the session instruction about test authorization. Capture any defects in the implementation notes, repair them, update the checklist/status, then let the user try the complete slice before making Slice 04 retrieval/persistence decisions. The user has already authorized building the feature; do not ask again about settled decisions. Do not push or commit unless asked.

## Intent

Add a chapter-grounded chat to the existing chapter reader. Keep the current application shell, navigation, chapter selection, and visual language. In the current reader workspace, give the PDF canvas a little more room than the chat on desktop (currently 60.5% PDF / 39.5% chat). The selected chapter is the only evidence source. The model must distinguish supported answers from absent evidence, show page citations with short source excerpts, and let a citation move the PDF canvas to the original page.

The first release is a complete, session-only vertical slice for searchable-text PDFs. Scanned-image OCR and persistence are deliberately deferred. Existing generic chat stays behaviorally unchanged and receives no data migration.

## Build checklist

- [x] [Slice 01: page-aware source evidence](slices/01-page-evidence.md) — extractor added; verification pending
- [x] [Slice 02: selected-chapter retrieval and grounded API](slices/02-grounded-chat.md) — lexical retrieval and dedicated endpoint added; verification pending
- [x] [Slice 03: reader integration and cited chat](slices/03-reader-integration.md) — split reader, isolated session history, citation navigation added; verification pending
- [ ] [Slice 04: prototype decision checkpoint](slices/04-prototype-decisions.md)

## Decision ledger

| Decision                        | State                                  | Choice / rationale                                                                                                                                                                                                    |
| ------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product shell and reader layout | **User decided**                       | Preserve current app shell/layout; add the RAG system in the existing chapter workspace. The PDF canvas gets more desktop width than the chat; the current split is 60.5% / 39.5%.                                                              |
| Evidence scope                  | **User decided**                       | Selected chapter only. Do not send other chapters or unrelated attachments as context.                                                                                                                                |
| Unsupported questions           | **User decided**                       | Say the answer is not in the selected chapter.                                                                                                                                                                        |
| Switching chapters              | **User decided**                       | Separate conversation per chapter; never carry chapter evidence/history across a switch.                                                                                                                              |
| Citation behavior               | **User decided**                       | Clickable original-PDF page and short excerpt; click navigates the PDF pane to that page.                                                                                                                             |
| First checkpoint                | **User decided**                       | Searchable PDF → selected-chapter retrieval → grounded answer with citation → PDF page jump.                                                                                                                          |
| OCR                             | **User decided**                       | Searchable-text PDF first; defer OCR for scans.                                                                                                                                                                       |
| Persistence                     | **Open after prototype**               | Prototype session-only. Decide persistence after exercising the slice, including document ownership, deletion, retention, and chapter chat history together.                                                          |
| Retrieval method                | **Open after prototype**               | Start with deterministic page-aware lexical/BM25 retrieval. Measure recall/grounding on a small representative fixture set before deciding whether hybrid/vector retrieval earns its dependency and operational cost. |
| Generic chat compatibility      | **User decided**                       | No migrations; generic chat remains unchanged. Give chapter chat a dedicated contract and route.                                                                                                                      |
| Provider/model flow             | **Inferred; verify in implementation** | Use the currently selected model and existing BYOK/credential resolution path; do not duplicate key storage or change provider linking.                                                                               |
| Responsive behavior             | **Implementation choice**              | Use a 60.5% PDF / 39.5% chat desktop split; stack panes below the wide-screen breakpoint. This does not alter the outer app shell.                                                              |

### Unknown-known context

- The primary audience is students; this is a browser application that collaborators should be able to clone and run locally.
- Future chapter tools should live within the chapter feature boundary rather than grow generic chat into a chapter-specific module.
- The user corrected the initial mock: no shell redesign or overall layout change. The mock is an interaction concept for the added reader/chat split, not an approved visual redesign.
- Do not copy the mock’s sample title/content or temporary visual styling into product data.

## Map: facts from the repository

Paths below were inspected during planning; verify the live tree before implementation.

| Area                     | Current owner / evidence                                                                                                                                                                                         | Consequence                                                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chapter page composition | `frontend/src/features/chapters/pages/ResultsPage/ResultsPage.tsx` composes `ResultsView` and reads `AppContext`.                                                                                                | Keep the route and surrounding application shell stable.                                                                                                               |
| Chapter workspace        | `frontend/src/features/chapters/components/ResultsView.tsx` owns selection, proof rendering, and a full-screen generic `ChatWindow` overlay.                                                                     | Extract/mount a focused chapter workspace component; avoid growing this already large component with retrieval internals.                                              |
| PDF proof                | `frontend/src/features/chapters/components/ProofPanel.tsx` slices a PDF to a chapter range. `PdfCanvasPages.tsx` renders PDF.js pages by a range but exposes no absolute-page navigation seam.                   | Preserve original 1-based PDF page provenance and add an explicit navigation API. A page number relative to a sliced Blob is not a citation.                           |
| Chapter data             | `frontend/src/features/chapters/state/AppContext.tsx` parses files and maps chapter data into receipt-shaped properties; original text and blob URLs are held in volatile state.                                 | Define a chapter-chat-owned typed source model and ephemeral identifiers. Do not make RAG depend on `merchant`, totals, or other finance-shaped fields.                |
| Extraction               | `backend/scripts/pdf_chapter_extractor.py` has per-page text while parsing, but chapter response data does not carry page-level citation passages. It may synthesize empty placeholder sections and marks scans. | Only index actual selectable page text; reject empty/scan-only evidence rather than cite generated summaries/placeholders.                                             |
| PDF processing           | `backend/src/domains/documents/application/pdf.service.ts` may use configured Gemini fallback/OCR and describes chapter `content` as an overview.                                                                | Do not use the overview or OCR path as source evidence. Keep the chapter RAG extraction path text-only.                                                                |
| Contracts                | `backend/contracts/src/types/index.ts` has `PdfChapter` text/ranges but no page passage identity/citations. `backend/contracts/src/schemas/index.ts` generic chat accepts summary/range context only.            | Add a separately typed, validated chapter-chat request/response; do not overload generic `ChatRequest`.                                                                |
| Generic chat             | `frontend/src/features/chat/components/ChatWindow.tsx` sends broad chapter metadata. `backend/src/domains/chat/application/tools.service.ts` keyword-matches summaries and falls back to unrelated chapters.     | Chapter chat must not route through this selection/fallback logic. No unrelated chapter fallback.                                                                      |
| Provider requests        | `backend/src/domains/chat/application/chat.service.ts`, `chat.controller.ts`, and `chat.routes.ts` own provider generation, credentials, and chat endpoints.                                                     | Reuse the single credential/provider owner through a narrow internal seam; avoid parallel key handling. Generic endpoints retain behavior.                             |
| Attachment extraction    | `frontend/src/app/files/chatAttachments.ts` already extracts PDF text via PDF.js, but applies generic attachment size/page/context caps.                                                                         | Reuse primitives only where appropriate; chapter page-range extraction needs its own bounds and absolute page metadata, without changing generic attachment semantics. |
| Storage                  | `backend/src/platform/database/chatDatabase.ts` persists authenticated generic conversations/messages, no documents/index.                                                                                       | Prototype chapter files, passages, and histories in session memory; do not add schema migrations now.                                                                  |

## Open choices to revisit after the prototype

1. **Retrieval quality:** define a small set of representative chapter questions, including exact facts, paraphrase, ambiguous multi-page questions, and absent answers. Compare lexical ranking with a hybrid/vector candidate only if the lexical baseline misses useful passages. Keep measured evidence and latency/cost/dependency implications in Slice 04.
2. **Persistence:** evaluate ephemeral browser text/index versus server/account persistence. Decide as one lifecycle: uploaded PDF, extracted pages, index, per-chapter conversation, deletion, retention, ownership, and cross-device behavior. No retention policy or persistence is implied by the current plan.
3. **Provider input boundary:** confirm the current selected-model state can be passed to a chapter-specific request without moving or duplicating provider key logic.

## Landmine cards

| Landmine                                          | Evidence / harm                                                                                                          | Mitigation                                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placeholder chapter text looks like evidence      | Extractor can create synthetic zero-word sections for scans. A plausible title/summary could yield fabricated citations. | Require actual nonempty page text and provenance before indexing; show a clear searchable-text requirement when unavailable.                                     |
| Chapter-local pages are mistaken for source pages | `ProofPanel` slices the PDF; slice-relative page 1 may be original page 37.                                              | Carry original 1-based `pageNumber` through extraction, chunking, request, citation, and PDF navigation.                                                         |
| Generic chat leaks scope                          | Existing chat sends broad metadata and tool service falls back to unrelated chapters.                                    | Dedicated chapter route and contract; backend accepts only selected chapter evidence, validates page range and source IDs, never falls back.                     |
| Summaries/overview mistaken for exact text        | Backend chapter overview can be generated and is not page-grounded.                                                      | Retrieve only from source-extracted page passages; derive citation excerpts from the immutable passage, not model prose.                                         |
| Provider code forks                               | Existing provider auth and credential lookup is shared infrastructure.                                                   | Reuse its owner with a typed chapter prompt/evidence input; test credential behavior at the seam without changing generic route behavior.                        |
| PDF text contains prompt injection                | A PDF can include instructions aimed at the model.                                                                       | Treat every passage as untrusted reference material; system instructions define evidence-only use, no tool execution, and no obedience to document instructions. |
| Persistence scope creeps into first slice         | Existing generic history persistence has ownership semantics absent for chapter documents.                               | Keep prototype session-only; resolve full lifecycle and security rules after user review.                                                                        |
| Long/large chapters exceed prompt budgets         | Full chapter text can be large and generic attachment limits do not fit chapter UX.                                      | Chunk by page with deterministic bounded overlap, retrieve bounded top passages, cap request bytes/tokens, and return clear errors for oversized/empty input.    |

## Tweakable implementation plan

These are intentionally ordered by change likelihood: source evidence first (validates assumptions), then the API seam, then the UI, then durable/product decisions.

1. **Slice 01 — page-aware evidence:** create a chapter-domain source shape with ephemeral IDs, extract only searchable text for the selected chapter’s original page range, retain original page numbers, and reject unsupported scans/empty input. No OCR and no persistence.
2. **Slice 02 — retrieval and API:** deterministically chunk page text; first implement lexical ranking over the selected chapter only. Add a dedicated chapter request/response with evidence/citation identities, bounded payloads, explicit abstention, prompt-injection handling, and current model/provider credentials through the shared owner. Generic chat is untouched.
3. **Slice 03 — reader vertical slice:** keep existing shell, chapter list, PDF proof, and selection. Give the PDF pane 60.5% and chat 39.5% of usable desktop width; stack panes at narrower widths. Add per-chapter in-memory transcript, current model selection, empty/loading/error states, cited excerpts, and exact absolute-page jumps. Do not include generic attachment/plugin controls unless they can be disabled without changing shared chat.
4. **Slice 04 — prototype checkpoint:** demonstrate with searchable PDFs; collect retrieval questions/quality and local run instructions; then decide whether to persist and whether lexical retrieval is adequate. Do not silently add a database, vector store, embeddings API, or server OCR.

### Visual verification gate

For Slice 03, capture the actual chapter workspace with a loaded PDF and a cited answer. Use `screenshot-critique` as the final visual gate before declaring the visual change done. Compare only the reader workspace crop against the existing shell reference (`assets/current-empty-chapter-canvas.png`) and the mock (`visualizations/chapter-workspace-mock.html`): evaluate that the outer shell/sidebar remains stable, both panes are usable, and the PDF page citation visibly maps to the displayed original page. Mask document content and model-generated prose when comparing layout. Out of scope: restyling the global sidebar/header, changing provider screens, or redesigning the chat composer. Visual review is evidence, not proof of backend grounding.

## Implementation notes

| Slice | Plan                                                      | Code finding                                                                                                                                                                                | Conservative call                                                                                                                                 | User judgment?          |
| ----- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 01    | Extract selected chapter text with original page numbers. | The proof viewer's chapter PDF can be sliced, which renumbers pages in that rendering. The extractor reads the original PDF URL through the shared PDF.js cache and records original pages. | Keep source page numbers absolute; map them to the viewer's sliced-page offsets for citation navigation.                                          | No                      |
| 02    | Use a dedicated chapter chat stream.                      | Citation IDs and excerpts must be validated against the complete structured model response before they are shown.                                                                           | Use a dedicated JSON response after model completion; the UI shows a pending state while the request runs.                                        | No                      |
| 03    | Reuse the chat console model selection.                   | Generic `ChatWindow` owns model state internally and is a separate overlay.                                                                                                                 | The chapter workspace has its own model selector using the existing model catalog and credential config; no generic-chat model state was changed. | Review during prototype |

Slices 01–03 are implemented. The monorepo typecheck and production build passed. The chat empty state, prompt suggestions, retry/error handling, and composer styling were refined during implementation. Behavioral tests have not been added or run; the behavior gates remain specified in each slice for a later authorized verification pass. The production build retains the existing large-chunk warning for the `heic2any` bundle.

## Verification gates (for implementation; not run during this planning pass)

- Unit-level behavior: page-range boundaries and absolute-page preservation; empty/scanned PDF rejection; deterministic chunk/page identity; ranking restricted to selected chapter; no-match abstention; citations must resolve to supplied source passages and their exact page/excerpt; input text treated as untrusted.
- API behavior: schema rejects malformed/out-of-chapter evidence; response includes typed answer/citations/abstention; selected model/provider credential path works; generic chat route contract and behavior remain unchanged.
- UI behavior: chapter-specific histories remain isolated; citation click navigates to exact original page; switching chapter cannot retain prior passages; no selected chapter, parsing, sending, failure, and empty states are usable.
- End-to-end acceptance: searchable PDF → select a chapter → ask a supported question → receive grounded answer with clickable excerpt/page → PDF lands on correct page; ask an unsupported question → explicit “not in this chapter”; switch chapter → fresh transcript.

## Research notes

- Lewis et al., [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401), describes combining parametric generation with retrieved passages; this plan uses the concept without requiring a vector database.
- Anthropic, [Contextual Retrieval](https://www.anthropic.com/research/contextual-retrieval), reports a hybrid lexical-plus-vector approach. This is a candidate for a measured follow-up, not a default dependency.
- OpenAI, [Retrieval guide](https://developers.openai.com/api/docs/guides/retrieval), documents semantic/vector retrieval as an option; this plan keeps provider-neutral lexical retrieval first.

## Prototype handoff

The workspace concept lives in [the HTML mock](visualizations/chapter-workspace-mock.html); the user-requested current empty canvas reference is [here](assets/current-empty-chapter-canvas.png). The mock is not a product-shell redesign. Slices 01–03 are drafted and typechecked; behavioral verification and the visual review gate remain. Keep this document current, and do not close the prototype checkpoint until the user can try the complete vertical slice.
