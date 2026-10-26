# Slice 01: Bounded PDF page rendering

## Contract

Provide a deterministic local renderer that converts a PDF into ordered JPEG page images for later model OCR. Rendering is limited to at most eight pages, matching the existing chapter image-input contract. Each output image is at most 1600 pixels on its longest side and 1.5 MB encoded; aggregate encoded images are at most 8 MB. The renderer never calls a provider and never returns image bytes in logs.

## Seam and ownership

- `python/src/pdf_page_renderer.py` owns PDF validation, page rendering, page order, output naming, and image limits.
- The renderer is a CLI invoked with a source PDF and a caller-owned temporary output directory. It prints JSON metadata containing 1-based page number, MIME type, relative output filename, and encoded byte count.
- It exits nonzero with a bounded error code/message when the PDF is invalid, has more than eight pages, or cannot fit the output budget. It must not render a partial prefix and present it as complete.
- The documents domain will own cleanup and later dispatch; that integration is slice 02.

## Verification

- Add standard-library Python tests using synthetic PDFs generated with PyMuPDF.
- Verify page numbering/order, output MIME and JPEG decodability, longest-side limit, page cap, aggregate byte cap, malformed PDF rejection, and no partial output on a rejected oversized document.
- Run the renderer tests with the Python version and PyMuPDF dependency used by the repo.

## Decisions and scope

- The hard cap is eight rendered pages per PDF request. Larger scanned PDFs remain on the existing local recovery path and are not sent to a provider by this slice.
- Use JPEG at quality 70 with a 1600-pixel maximum edge. The implementation may lower quality and edge size to meet the aggregate budget, but must preserve the page count or fail the whole render.
- Delegated: internal Python function names and temporary filename format.
- Out of scope: provider credentials, model selection, chapter extraction, OCR prompt, UI explanation for over-limit PDFs, and live provider calls.

## Required follow-up

Slice 02 must consume the metadata, read the rendered files, dispatch them as image inputs through the selected verified model, validate chapter page ranges, and retain local recovery without claiming provider OCR success on errors.
