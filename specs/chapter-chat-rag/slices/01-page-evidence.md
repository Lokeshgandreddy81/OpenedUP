# Slice 01 — Page-aware source evidence

## Goal

Make a selected searchable-text chapter representable as immutable, page-aware source evidence that later retrieval and citations can trust. This is a narrow foundation slice; it does not add chat UI or database persistence.

## Current seams to inspect

- `frontend/src/features/chapters/state/AppContext.tsx` — uploaded PDF/blob and chapter selection lifecycle.
- `frontend/src/features/chapters/components/ProofPanel.tsx` — selected chapter range and current PDF slicing.
- `frontend/src/features/chapters/components/PdfCanvasPages.tsx` — PDF.js page rendering/range.
- `frontend/src/app/files/chatAttachments.ts` — existing PDF.js text extraction conventions.
- `backend/scripts/pdf_chapter_extractor.py` — source page text and scan placeholders.

## Design

- Introduce a chapter-chat-owned source type with opaque session `documentId` and `chapterId`, chapter title, original 1-based start/end page, and an ordered list of `{ passageId, pageNumber, text }` source pages/passages.
- Extract from the original browser PDF (or the existing parser response if it can prove exact per-page text); never use generated overview/summary fields as evidence.
- Restrict extraction to the selected chapter’s validated page range. Preserve original page numbers even if the viewer uses a sliced PDF blob.
- Treat a chapter as searchable only when it has usable extracted text. A scanned/empty chapter yields a typed unsupported state and an actionable explanation; it is never indexed as empty placeholder or OCR output.
- Keep data in memory for the prototype and clear it when the source file/session is discarded. Do not persist API keys or source text.
- Keep generic attachment extraction behavior unchanged. Share a low-level PDF.js helper only if it does not inherit generic attachment caps or change its outputs.

## Acceptance criteria

- Each extracted text passage has a stable identity for the current session and an absolute original page number.
- Invalid, empty, reversed, and out-of-document page ranges fail safely.
- Scanned/image-only and zero-text pages cannot be misrepresented as searchable source.
- Extracted text is tied to the selected chapter and discarded when the active source is removed.
- Existing chapter and generic-chat behavior is unchanged.

## Verification to add/run during implementation

Add focused tests for a synthetic PDF with known text on pages before, within, and after a chapter range; assert only in-range pages are emitted with original numbering. Add empty/scanned and invalid-range cases. Do not use generated summaries as expected source. Run the repository’s relevant focused checks after implementation (the planning pass does not run tests).

## Out of scope

OCR, embeddings, vector storage, model requests, chat UI, chapter-history persistence, generic chat refactors, migrations.
