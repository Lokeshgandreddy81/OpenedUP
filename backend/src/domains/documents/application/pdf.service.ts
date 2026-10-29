import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import type { ParsedPdfResult, ProviderId } from "@charan-interiors/contracts";
import { generateMultiProviderChat } from "../../chat/providers/llm.service.js";
import { validateAndRepairChapters } from "../../receipts/application/chapterRepair.js";
import { AppError } from "../../../platform/errors/errors.js";
import { logEvent } from "../../../platform/observability/logger.js";

const execFileAsync = promisify(execFile);

const PDF_PARSE_SYSTEM_INSTRUCTION = `You are an expert document structuring engine. Your task is to analyze an entire PDF document and extract clean, sequential chapter and section boundaries.

Guiding Principles:
1. Complete Document Coverage: Every page from page 1 to the final page must be accounted for across the chapters. There must be NO skipped pages and NO overlapping page ranges.
2. Structure Recognition:
   - If the document has a Table of Contents (TOC) or outline bookmarks, inspect ALL levels of the hierarchy. If chapters are nested under 'Parts' or 'Units', extract the individual chapters (or include standalone un-nested sections like Preface, Introduction, Appendix, Conclusion). Do NOT discard the TOC just because headings are across multiple indentation levels or have an overarching book title. Use explicit TOC entries as exact chapter boundaries. Set is_explicit_chapter = true.
   - Front-Matter & Back-Matter Recognition: Treat preliminary materials (Cover, Table of Contents, Preface, Foreword, Acknowledgments, Dedication, Executive Summary) as distinct front-matter sections starting on page 1 rather than lumping them into Chapter 1. Similarly, treat reference sections (Appendices, Bibliography, References, Works Cited, Index, Glossary, Endnotes) as distinct back-matter sections rather than swallowing them into the final chapter.
   - FALLBACK (Unstructured Documents): Only if the document genuinely has NO Table of Contents, headings, or structural divisions, semantically partition it into 3 to 10 balanced chapters based on topical progression. Set is_explicit_chapter = false.
3. For each chapter:
   - title: Clear, concise chapter title.
   - start_page: Starting page number in the PDF (1-based integer).
   - end_page: Ending page number in the PDF (1-based integer, inclusive).
   - summary: High-value 2-4 sentence summary of core insights.
   - content: Detailed chapter overview (100–300 words), highlighting key arguments and section anchors.
   - key_topics: 2-5 core concepts or tags.
   - word_count: Word count estimate for this chapter.
4. Strict Ordering: Chapters must be ordered sequentially (chapter_number = 1, 2, 3...).
5. If the PDF is completely blank or corrupt, return an empty chapters list with total_chapters = 0.
6. Scanned / Image-Only PDFs: If the document contains scanned images or photocopies without an embedded text layer, perform visual OCR on each page to read chapter titles, section boundaries, and page contents accurately.`;

const PdfModelResponseSchema = z.object({
  document_title: z.string().optional(),
  total_pages: z.number().int().positive().optional(),
  has_explicit_structure: z.boolean().optional(),
  chapters: z.array(z.record(z.string(), z.unknown())).max(500),
});

export interface ParsePdfModelOptions {
  modelId: string;
  customModel?: string;
  customProvider?: ProviderId;
  apiKey?: string;
  baseUrl?: string;
}

interface RenderedPdfPage {
  pageNumber: number;
  mimeType: "image/jpeg";
  base64Data: string;
}

export async function renderPdfPagesForOcr(pdfBuffer: Buffer): Promise<RenderedPdfPage[]> {
  const tempDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "shoebox_pdf_ocr_"));
  const sourcePath = path.join(tempDirectory, "source.pdf");
  const outputDirectory = path.join(tempDirectory, "pages");
  try {
    await fs.promises.writeFile(sourcePath, pdfBuffer);
    const scriptCandidates = [
      path.join(process.cwd(), "python", "src", "pdf_page_renderer.py"),
      path.join(process.cwd(), "..", "python", "src", "pdf_page_renderer.py"),
      path.join(os.homedir(), "Desktop", "journal", "python", "src", "pdf_page_renderer.py"),
    ];
    const rendererPath = scriptCandidates.find((candidate) => fs.existsSync(candidate));
    if (!rendererPath) throw new AppError("The local scanned-PDF renderer is unavailable.", 503);

    let stdout: string;
    try {
      ({ stdout } = await execFileAsync("python3", [rendererPath, sourcePath, outputDirectory], {
        maxBuffer: 1_000_000,
        timeout: 20_000,
      }));
    } catch (error) {
      const details =
        error && typeof error === "object" ? (error as { stderr?: unknown; stdout?: unknown }) : {};
      const output = `${String(details.stderr || "")} ${String(details.stdout || "")}`;
      if (output.includes("page_limit_exceeded")) {
        throw new AppError("Scanned PDFs must have eight pages or fewer for provider OCR.", 400);
      }
      throw new AppError("Could not render scanned PDF pages for the selected provider.", 422);
    }
    const response = JSON.parse(stdout) as {
      pages?: Array<{
        pageNumber?: number;
        mimeType?: string;
        fileName?: string;
        encodedByteCount?: number;
      }>;
    };
    if (!Array.isArray(response.pages) || response.pages.length < 1 || response.pages.length > 8) {
      throw new AppError(
        "The scanned PDF could not be rendered within the eight-page OCR limit.",
        400
      );
    }

    const pages: RenderedPdfPage[] = [];
    let totalEncodedBytes = 0;
    for (const [index, metadata] of response.pages.entries()) {
      if (
        metadata.pageNumber !== index + 1 ||
        metadata.mimeType !== "image/jpeg" ||
        !metadata.fileName ||
        path.basename(metadata.fileName) !== metadata.fileName
      ) {
        throw new AppError("The local PDF renderer returned invalid page metadata.", 500);
      }
      const imageBytes = await fs.promises.readFile(path.join(outputDirectory, metadata.fileName));
      const base64Data = imageBytes.toString("base64");
      if (base64Data.length > 1_500_000) {
        throw new AppError("A scanned PDF page exceeds the image input limit.", 400);
      }
      totalEncodedBytes += base64Data.length;
      if (totalEncodedBytes > 8_000_000) {
        throw new AppError("Scanned PDF pages exceed the image input limit.", 400);
      }
      pages.push({ pageNumber: metadata.pageNumber, mimeType: "image/jpeg", base64Data });
    }
    return pages;
  } finally {
    await fs.promises.rm(tempDirectory, { recursive: true, force: true });
  }
}

export async function parsePdfChapters(
  params: { mimeType?: string; base64Data: string; fileName?: string } & ParsePdfModelOptions
): Promise<ParsedPdfResult> {
  const startTime = Date.now();
  const { mimeType, base64Data, fileName } = params;

  const cleanBase64 = base64Data.includes(",")
    ? base64Data.slice(base64Data.indexOf(",") + 1).trim()
    : base64Data.trim();

  if (!cleanBase64) {
    throw new AppError("No PDF data provided.", 400);
  }

  const effectiveMime = (mimeType || "").toLowerCase().trim();
  const isPdfLike =
    !effectiveMime ||
    effectiveMime.includes("pdf") ||
    effectiveMime === "application/octet-stream" ||
    (Boolean(fileName) && fileName!.toLowerCase().endsWith(".pdf"));

  if (!isPdfLike) {
    throw new AppError(`Invalid MIME type "${mimeType}". Expected a PDF document.`, 400);
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = Buffer.from(cleanBase64, "base64");
  } catch {
    throw new AppError("Failed to decode base64 PDF payload.", 400);
  }

  const headerChunk = pdfBuffer.slice(0, 1024).toString("latin1");
  if (!headerChunk.includes("%PDF-")) {
    throw new AppError("The provided file is not a valid PDF document (missing %PDF header).", 400);
  }

  const pdfSizeKB = Math.round(pdfBuffer.length / 1024);
  logEvent("START /api/parse-pdf-chapters", {
    method: "local-text-extraction",
    pdfSizeKB,
  });

  let accuratePageCount = 1;
  let accurateTitle = fileName || "Document";
  try {
    const preDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    accuratePageCount = Math.max(1, preDoc.getPageCount());
    const t = preDoc.getTitle()?.trim();
    if (t) {
      accurateTitle = t.toLowerCase().endsWith(".pdf") ? t.slice(0, -4) : t;
    }
  } catch (preErr) {
    logEvent("WARN pdf-lib pre-check notice", {
      errorType: preErr instanceof Error ? preErr.name : "UnknownError",
    });
  }

  // Find python script
  const scriptCandidates = [
    path.join(process.cwd(), "python", "src", "pdf_chapter_extractor.py"),
    path.join(process.cwd(), "..", "python", "src", "pdf_chapter_extractor.py"),
    path.join(os.homedir(), "Desktop", "journal", "python", "src", "pdf_chapter_extractor.py"),
  ];
  let scriptPath = scriptCandidates[0]!;
  for (const cand of scriptCandidates) {
    if (fs.existsSync(cand)) {
      scriptPath = cand;
      break;
    }
  }

  const tempId = `shoebox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.pdf`;
  const tempFilePath = path.join(os.tmpdir(), tempId);

  let pyResult: {
    chapters?: unknown[];
    total_pages?: number;
    total_words?: number;
    document_title?: string;
    has_explicit_structure?: boolean;
    is_scanned_pdf?: boolean;
    ocr_recommended?: boolean;
  } | null = null;
  let pythonSuccess = false;

  try {
    await fs.promises.writeFile(tempFilePath, pdfBuffer);
    const { stdout } = await execFileAsync(
      "python3",
      [scriptPath, tempFilePath, accurateTitle || fileName || "Document"],
      { maxBuffer: 64 * 1024 * 1024, timeout: 60_000 }
    );

    if (stdout && stdout.trim()) {
      pyResult = JSON.parse(stdout.trim());
      if (pyResult && Array.isArray(pyResult.chapters) && pyResult.chapters.length > 0) {
        pythonSuccess = true;
      }
    }
  } catch (pyErr: unknown) {
    logEvent("WARN local PDF text extraction failed; selected provider analysis is required", {
      errorType: pyErr instanceof Error ? pyErr.name : "UnknownError",
    });
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }
    } catch {
      // ignore cleanup error
    }
  }

  const totalPages = Math.max(accuratePageCount, pyResult?.total_pages || 1);
  const isScannedPdf = Boolean(pyResult?.is_scanned_pdf);
  if (pythonSuccess && pyResult && !isScannedPdf) {
    const { chapters: normalizedChapters, totalPages: calculatedTotal } = validateAndRepairChapters(
      pyResult.chapters || [],
      totalPages,
      accurateTitle || fileName || "Document"
    );

    const result: ParsedPdfResult = {
      document_title: pyResult.document_title || accurateTitle || fileName || "Untitled Document",
      total_pages: calculatedTotal,
      total_chapters: normalizedChapters.length,
      has_explicit_structure: Boolean(pyResult.has_explicit_structure ?? true),
      is_scanned_pdf: false,
      ocr_recommended: false,
      total_words: pyResult.total_words,
      chapters: normalizedChapters,
    };

    const elapsedMs = Date.now() - startTime;
    logEvent("DONE /api/parse-pdf-chapters (Python Local Text)", {
      method: "python-local",
      chaptersFound: normalizedChapters.length,
      totalPages: result.total_pages,
      elapsedMs,
    });

    return result;
  }

  if (!params.apiKey) {
    throw new AppError(
      "MISSING_API_KEY:Connect your selected provider API key to analyze this PDF.",
      401
    );
  }

  logEvent("ROUTE /api/parse-pdf-chapters to selected provider", {
    model: params.modelId,
    isScannedPdf,
  });
  const renderedPages = await renderPdfPagesForOcr(pdfBuffer);
  const pageMap = renderedPages
    .map((page, index) => `Image ${index + 1} is PDF page ${page.pageNumber}.`)
    .join("\n");
  const prompt = `Read the rendered pages of this PDF in order. The PDF has ${totalPages} pages and every page is included as an image. ${pageMap} Extract chapter and section boundaries across the whole document. Return only JSON matching {"document_title":"title","total_pages":${totalPages},"has_explicit_structure":true,"chapters":[{"chapter_number":1,"title":"Chapter title","start_page":1,"end_page":${totalPages},"content":"Detailed overview","summary":"Brief summary","key_topics":["topic"],"word_count":100,"is_explicit_chapter":true}]}. Do not include markdown or commentary.`;
  const generated = await generateMultiProviderChat({
    modelId: params.modelId,
    ...(params.customModel ? { customModel: params.customModel } : {}),
    ...(params.customProvider ? { customProvider: params.customProvider } : {}),
    injectedApiKey: params.apiKey,
    ...(params.baseUrl ? { injectedBaseUrl: params.baseUrl } : {}),
    images: renderedPages.map((page) => ({
      mimeType: page.mimeType,
      base64Data: page.base64Data,
    })),
    systemInstruction: PDF_PARSE_SYSTEM_INSTRUCTION,
    effort: "Low",
    signal: AbortSignal.timeout(90_000),
    messages: [{ role: "user", content: prompt }],
  });

  let decoded: unknown;
  try {
    decoded = JSON.parse(generated.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new AppError("The selected model returned invalid PDF chapter data.", 502);
  }
  const parsedResult = PdfModelResponseSchema.safeParse(decoded);
  if (!parsedResult.success) {
    throw new AppError("The selected model returned invalid PDF chapter data.", 502);
  }

  const { chapters: normalizedChapters, totalPages: calculatedTotal } = validateAndRepairChapters(
    parsedResult.data.chapters,
    totalPages,
    accurateTitle || fileName || "Document"
  );
  const result: ParsedPdfResult = {
    document_title:
      parsedResult.data.document_title || accurateTitle || fileName || "Untitled Document",
    total_pages: calculatedTotal,
    total_chapters: normalizedChapters.length,
    has_explicit_structure: Boolean(parsedResult.data.has_explicit_structure ?? true),
    is_scanned_pdf: isScannedPdf,
    ocr_recommended: false,
    chapters: normalizedChapters,
  };

  logEvent("DONE /api/parse-pdf-chapters (Selected Provider)", {
    model: generated.modelUsed,
    provider: generated.providerUsed,
    chaptersFound: normalizedChapters.length,
    totalPages: result.total_pages,
    elapsedMs: Date.now() - startTime,
  });
  return result;
}
