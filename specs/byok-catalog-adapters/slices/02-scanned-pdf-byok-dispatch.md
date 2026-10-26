# Slice 02: Scanned PDF BYOK dispatch

## Contract

Keep searchable-PDF local extraction as the first path. For a scanned PDF within slice 01 limits, send the rendered ordered pages through the selected verified image-capable model and the shared provider dispatcher. Resolve credentials from the existing BYOK request headers or signed-in credential vault. Never send the original PDF to this image path.

## API seam

- `ParsePdfChaptersRequestSchema` requires the selected model and accepts the same optional custom model/provider fields used by receipt requests. The API hard-cuts over; old callers without a model are updated in the app in the same slice.
- `pdf.controller.ts` rejects models that are not fixed verified catalog chat models with app-supported image input and resolves provider credentials through `requestCredential.ts`.
- `pdf.service.ts` retains local searchable-PDF early return, invokes the renderer only for scanned PDFs, and sends ordered page images through `generateMultiProviderChat`.
- Provider JSON is parsed and validated before existing chapter normalization. Validate the final ranges against the known PDF page count and never infer provider OCR success from fallback chapters.
- Provider/renderer failures retain the current local recovery result and scanned/OCR-recommended flags. Do not retry billable generation or silently fall back to the server Gemini key.

## Verification

- Mock local extraction and provider transport; test searchable PDFs do not call the provider, scanned PDFs pass ordered page images/model/key to the dispatcher, and text-only/unknown models fail before provider dispatch.
- Test renderer limit failures, malformed model JSON, out-of-range chapter pages, missing credentials, and provider errors all preserve local recovery without prompt, image, filename, key, or raw upstream error logging.
- Update OpenAPI and README product behavior. No live key is needed for deterministic tests.

## Out of scope

Live OCR quality claims, PDFs over eight pages, page sampling, provider-specific prices, PDF upload-size changes, and changing the searchable-PDF extraction algorithm.
