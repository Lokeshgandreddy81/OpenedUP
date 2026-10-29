import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { ParsePdfChaptersRequestSchema } from "@charan-interiors/contracts";
import { parsePdfChapters } from "./pdf.service.js";

const RED_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGP4z8AARAwQCgAf7gP9i18U1AAAAABJRU5ErkJggg==",
  "base64"
);

async function makeScannedPdf(pageCount = 1): Promise<Buffer> {
  const document = await PDFDocument.create();
  const image = await document.embedPng(RED_PIXEL_PNG);
  for (let pageNumber = 0; pageNumber < pageCount; pageNumber += 1) {
    const page = document.addPage([612, 792]);
    page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
  }
  return Buffer.from(await document.save());
}

test("PDF parse API requires a selected model for local and OCR paths", () => {
  const request = { base64Data: "JVBERi0xLjQK", mimeType: "application/pdf" };
  assert.equal(ParsePdfChaptersRequestSchema.safeParse(request).success, false);
  assert.equal(
    ParsePdfChaptersRequestSchema.safeParse({ ...request, model: "gemini-3.8-flash" }).success,
    true
  );
});

test("scanned PDF OCR sends rendered pages through the selected shared image adapter", async (t) => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: input instanceof Request ? input.url : String(input), init });
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                document_title: "Scan",
                total_pages: 1,
                has_explicit_structure: true,
                chapters: [
                  {
                    chapter_number: 1,
                    title: "Scanned section",
                    start_page: 1,
                    end_page: 1,
                    content: "OCR extracted this section.",
                    summary: "A scanned section.",
                    key_topics: ["scan"],
                    word_count: 4,
                    is_explicit_chapter: true,
                  },
                ],
              }),
            },
          },
        ],
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const result = await parsePdfChapters({
    mimeType: "application/pdf",
    base64Data: (await makeScannedPdf()).toString("base64"),
    modelId: "gpt-6-astra",
    apiKey: "test-provider-key",
    baseUrl: "https://1.1.1.1/v1",
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, "https://1.1.1.1/v1/chat/completions");
  assert.equal(
    new Headers(requests[0]?.init?.headers).get("authorization"),
    "Bearer test-provider-key"
  );
  const body = JSON.parse(String(requests[0]?.init?.body)) as {
    model: string;
    messages: Array<{
      role: string;
      content: string | Array<{ type: string; image_url?: { url: string } }>;
    }>;
  };
  assert.equal(body.model, "gpt-6-astra");
  const userMessage = body.messages.find((message) => message.role === "user");
  assert.ok(Array.isArray(userMessage?.content));
  assert.ok(userMessage.content.some((part) => part.type === "image_url"));
  assert.match(result.chapters[0]?.title || "", /Scanned section/);
  assert.equal(result.ocr_recommended, false);
});

test("searchable PDFs return local extraction without calling the selected provider", async (t) => {
  let providerCalls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    providerCalls += 1;
    throw new Error("searchable PDFs should not call the provider");
  });
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  for (let line = 0; line < 6; line += 1) {
    page.drawText(
      `Chapter ${line + 1}: searchable local content remains available through this PDF text layer`,
      { x: 50, y: 750 - line * 24 }
    );
  }

  const result = await parsePdfChapters({
    mimeType: "application/pdf",
    base64Data: Buffer.from(await document.save()).toString("base64"),
    modelId: "gpt-6-astra",
    apiKey: "test-provider-key",
  });

  assert.equal(providerCalls, 0);
  assert.equal(result.is_scanned_pdf, false);
  assert.equal(result.ocr_recommended, false);
});

test("short searchable PDFs stay on local extraction without provider credentials", async (t) => {
  let providerCalls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    providerCalls += 1;
    throw new Error("searchable PDFs should not call the provider");
  });
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  page.drawText("A short searchable note with fewer than twenty five words", {
    x: 50,
    y: 700,
  });

  const result = await parsePdfChapters({
    mimeType: "application/pdf",
    base64Data: Buffer.from(await document.save()).toString("base64"),
    modelId: "gemini-3.8-flash",
  });

  assert.equal(providerCalls, 0);
  assert.equal(result.is_scanned_pdf, false);
  assert.equal(result.total_pages, 1);
  assert.ok(result.chapters.length > 0);
  assert.match(result.chapters[0]?.content || "", /short searchable note/i);
});

test("scanned PDF without a BYOK key fails instead of returning local recovery", async (t) => {
  let providerCalls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    providerCalls += 1;
    throw new Error("provider should not be called");
  });

  await assert.rejects(
    parsePdfChapters({
      mimeType: "application/pdf",
      base64Data: (await makeScannedPdf()).toString("base64"),
      modelId: "gemini-3.8-flash",
    }),
    { statusCode: 401 }
  );

  assert.equal(providerCalls, 0);
});

test("scanned PDF beyond the renderer page cap returns an error without local recovery", async (t) => {
  let providerCalls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    providerCalls += 1;
    throw new Error("provider should not be called");
  });

  await assert.rejects(
    parsePdfChapters({
      mimeType: "application/pdf",
      base64Data: (await makeScannedPdf(9)).toString("base64"),
      modelId: "gemini-3.8-flash",
      apiKey: "test-provider-key",
    }),
    /eight pages or fewer/i
  );

  assert.equal(providerCalls, 0);
});

test("invalid OCR model output fails instead of substituting local chapter data", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "not JSON" } }] }), {
        headers: { "Content-Type": "application/json" },
      })
  );

  await assert.rejects(
    parsePdfChapters({
      mimeType: "application/pdf",
      base64Data: (await makeScannedPdf()).toString("base64"),
      modelId: "gpt-6-astra",
      apiKey: "test-provider-key",
      baseUrl: "https://1.1.1.1/v1",
    }),
    /selected model returned invalid PDF chapter data/i
  );
});
