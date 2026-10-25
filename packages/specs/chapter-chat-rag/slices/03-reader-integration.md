# Slice 03 — Reader vertical slice

## Goal

Integrate cited chapter chat into the current reader and prove the user-selected end-to-end behavior without changing the app shell or generic chat.

## UX constraints

- Preserve the existing sidebar, top-level navigation, chapter selection, reader controls, and current visual design.
- Within the existing chapter reader workspace, give the PDF canvas 60.5% and chat 39.5% of usable desktop width. Do not replace the chapter list or move the feature into a new global screen.
- When the available reader width is too narrow for usable side-by-side panes, stack them while retaining clear access to the PDF and chat.
- Keep the current chat header compact (the user asked to remove the repeated chapter/page subtitle). The selected chapter remains indicated by the composer context. On chapter switch, use that chapter’s isolated in-memory transcript and evidence; never display a previous chapter’s retrieved passages.
- Provide clear no-selection, extracting, no-searchable-text, ready, sending, error, and empty-answer states.
- Chat uses the user’s selected model and current provider setup. Do not add generic attachments/plugins to chapter chat.
- Render compact page-only citation controls; do not repeat source excerpts beneath the answer because the PDF itself is visible beside chat. Activating one navigates the existing PDF canvas to the original 1-based page.

## Implementation seams

- Keep `ResultsView.tsx` as composition/selection owner or reduce its responsibilities with one chapter workspace component; do not place retrieval algorithms in the large view component.
- Add a narrow absolute-page navigation method to `PdfCanvasPages.tsx` or its owner, and map from original page number to rendered page correctly where the proof viewer shows a sliced PDF.
- Keep chapter chat state scoped by the ephemeral chapter session identity. Persistence remains deferred.
- Reuse the current model selector/provider setup without changing generic `ChatWindow` behavior.

## Acceptance criteria

- At normal desktop width, PDF and chat are simultaneously usable at the chosen 60.5% / 39.5% split; the global shell is visually stable.
- A searchable selected chapter can be queried and answers are grounded only in its retrieved pages.
- Citation controls expose the cited page and navigate the PDF to the corresponding original page without duplicating the chapter text in the response.
- An unsupported question clearly says the selected chapter does not contain the answer.
- Switching chapter creates/loads a separate transcript, cancels any in-flight answer for the previous chapter, and removes prior chapter evidence from active context.
- Generic chat remains behaviorally unchanged.

## Visual verification

Capture the real reader with a loaded multi-page PDF, selected chapter, and cited answer. Run `screenshot-critique` as the last visual check. Compare the reader-workspace crop only; assess shell/sidebar preservation, pane usability/split, page control placement, and citation-to-page affordance. Mask page contents and generated prose. Do not critique or change the global shell, provider screen, or unrelated composer styling.

## Verification to add/run during implementation

Add interaction tests for per-chapter history isolation and citation navigation. Run the focused frontend/API checks and manually exercise a real searchable PDF plus absent-answer case. The planning pass does not run tests.
