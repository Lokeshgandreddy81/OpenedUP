import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PDFDocument } from "pdf-lib";
import { Type } from "@google/genai";
import type { ParsedPdfResult } from "@charan-interiors/contracts";
import { resolveApiKey } from "../../../platform/config/index.js";
import { validateAndRepairChapters, type NormalizedChapter } from "../../receipts/application/chapterRepair.js";
import { AppError, parseJsonSafely } from "../../../platform/errors/errors.js";
import { logEvent } from "../../../platform/observability/logger.js";
import { generateWithModelFallback } from "../../chat/providers/gemini.service.js";

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

const PDF_PARSE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_title: {
      type: Type.STRING,
      description: "The document title from the title page or inferred from content.",
    },
    total_pages: {
      type: Type.NUMBER,
      description: "Total number of pages in the PDF.",
    },
    total_chapters: {
      type: Type.NUMBER,
      description: "Total number of chapters or sections found/inferred.",
    },
    has_explicit_structure: {
      type: Type.BOOLEAN,
      description:
        "True if the document has explicit chapter/section headings; false if structure was inferred.",
    },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          chapter_number: {
            type: Type.NUMBER,
            description: "1-based chapter/section number in document order.",
          },
          title: {
            type: Type.STRING,
            description: "Title of the chapter/section as printed or inferred.",
          },
          start_page: {
            type: Type.NUMBER,
            description: "Starting page number (1-based).",
          },
          end_page: {
            type: Type.NUMBER,
            description: "Ending page number (1-based, inclusive).",
          },
          content: {
            type: Type.STRING,
            description: "Detailed chapter overview highlighting core concepts and anchors.",
          },
          summary: {
            type: Type.STRING,
            description: "Brief 2-4 sentence summary of this chapter.",
          },
          key_topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-5 key topics or themes in this chapter.",
          },
          word_count: {
            type: Type.NUMBER,
            description: "Estimated number of words in this chapter.",
          },
          is_explicit_chapter: {
            type: Type.BOOLEAN,
            description:
              "True if chapter boundary came from explicit document structure; false if inferred.",
          },
        },
        required: [
          "chapter_number",
          "title",
          "start_page",
          "end_page",
          "content",
          "summary",
          "key_topics",
          "word_count",
          "is_explicit_chapter",
        ],
      },
    },
  },
  required: [
    "document_title",
    "total_pages",
    "total_chapters",
    "has_explicit_structure",
    "chapters",
  ],
};

export async function parsePdfWithPdfLib(
  pdfBuffer: Buffer,
  fileName?: string
): Promise<{
  document_title: string;
  total_pages: number;
  total_chapters: number;
  has_explicit_structure: boolean;
  chapters: NormalizedChapter[];
}> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = Math.max(1, doc.getPageCount());

  let metaTitle = doc.getTitle()?.trim() || "";
  if (metaTitle.toLowerCase().endsWith(".pdf")) {
    metaTitle = metaTitle.slice(0, -4);
  }
  const cleanDocTitle =
    metaTitle ||
    (fileName
      ? fileName
          .replace(/\.[a-zA-Z0-9]+$/, "")
          .replace(/[-_]/g, " ")
          .trim()
      : "") ||
    "Untitled Document";

  const numChapters =
    totalPages <= 1
      ? 1
      : totalPages <= 4
        ? totalPages
        : Math.min(10, Math.max(3, Math.round(totalPages / 6)));

  const rawChapters: NormalizedChapter[] = [];
  const pagesPerChapter = Math.max(1, Math.floor(totalPages / numChapters));

  for (let i = 0; i < numChapters; i++) {
    const sp = i === 0 ? 1 : i * pagesPerChapter + 1;
    const ep = i === numChapters - 1 ? totalPages : Math.min(totalPages, (i + 1) * pagesPerChapter);
    const chNum = i + 1;

    let partTitle = `Section ${chNum}: Overview & Analysis (Pages ${sp}–${ep})`;
    let secType: "front_matter" | "chapter" | "back_matter" = "chapter";

    if (numChapters > 2) {
      if (i === 0 && sp === 1) {
        partTitle = `Part 1: Preliminary & Overview (Pages ${sp}–${ep})`;
        secType = "front_matter";
      } else if (i === numChapters - 1 && ep === totalPages) {
        partTitle = `Part ${chNum}: Concluding Synthesis (Pages ${sp}–${ep})`;
        secType = "back_matter";
      } else {
        partTitle = `Part ${chNum}: Core Analysis (Pages ${sp}–${ep})`;
        secType = "chapter";
      }
    } else if (numChapters === 1) {
      partTitle = `${cleanDocTitle} (Complete Document, Pages 1–${totalPages})`;
    }

    rawChapters.push({
      chapter_number: chNum,
      title: partTitle,
      chapter_title: partTitle,
      start_page: sp,
      end_page: ep,
      content: `Extracted logical section ${chNum} of ${cleanDocTitle}, covering pages ${sp} to ${ep}.`,
      extracted_text: `Extracted logical section ${chNum} of ${cleanDocTitle}, covering pages ${sp} to ${ep}.`,
      summary: `Logical section ${chNum} covering document progression from page ${sp} through page ${ep}.`,
      key_topics: [cleanDocTitle, `Pages ${sp}–${ep}`],
      word_count: 0,
      is_explicit_chapter: false,
      section_type: secType,
    });
  }

  const { chapters: normalizedChapters, totalPages: calculatedTotal } = validateAndRepairChapters(
    rawChapters,
    totalPages,
    cleanDocTitle
  );

  return {
    document_title: cleanDocTitle,
    total_pages: calculatedTotal,
    total_chapters: normalizedChapters.length,
    has_explicit_structure: false,
    chapters: normalizedChapters,
  };
}

export async function parsePdfChapters(params: {
  mimeType?: string | undefined;
  base64Data: string;
  fileName?: string | undefined;
}): Promise<ParsedPdfResult> {
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
    method: "hybrid-local",
    fileName: fileName || "unknown.pdf",
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
    logEvent("WARN pdf-lib pre-check notice", { err: String(preErr) });
  }

  // Find python script
  const scriptCandidates = [
    path.join(process.cwd(), "scripts", "pdf_chapter_extractor.py"),
    path.join(process.cwd(), "..", "scripts", "pdf_chapter_extractor.py"),
    path.join(os.homedir(), "Desktop", "journal", "scripts", "pdf_chapter_extractor.py"),
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
      { maxBuffer: 64 * 1024 * 1024 }
    );

    if (stdout && stdout.trim()) {
      pyResult = JSON.parse(stdout.trim());
      if (pyResult && Array.isArray(pyResult.chapters) && pyResult.chapters.length > 0) {
        pythonSuccess = true;
      }
    }
  } catch (pyErr: unknown) {
    const msg = pyErr instanceof Error ? pyErr.message : String(pyErr);
    logEvent("WARN python-extractor failed, evaluating fallback", { err: msg });
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
  const isScannedPdf = Boolean(
    pyResult?.is_scanned_pdf || (pyResult?.total_words !== undefined && pyResult.total_words === 0)
  );

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
      fileName: fileName || "unknown.pdf",
      chaptersFound: normalizedChapters.length,
      totalPages: result.total_pages,
      elapsedMs,
    });

    return result;
  }

  // Fallback to Gemini if API key is present
  if (resolveApiKey()) {
    try {
      logEvent(
        isScannedPdf
          ? "ROUTE /api/parse-pdf-chapters to Gemini Vision OCR (scanned PDF detected)"
          : "FALLBACK /api/parse-pdf-chapters to Gemini",
        {
          fileName: fileName || "unknown.pdf",
          isScannedPdf,
        }
      );

      const ocrHint = isScannedPdf
        ? " This PDF appears to be scanned or image-only with no embedded text layer. Use visual OCR to read every page, then extract chapters from the recognized text."
        : "";

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        {
          text: `Read the following PDF document in its entirety. Parse and return every chapter or logical section in strict document order, following the schema exactly.${
            fileName ? ` The file is named "${fileName}".` : ""
          }${ocrHint}`,
        },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: cleanBase64,
          },
        },
      ];

      const { response, modelUsed } = await generateWithModelFallback({
        contents: { parts },
        config: {
          systemInstruction: PDF_PARSE_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: PDF_PARSE_RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });

      const parsed = parseJsonSafely<{
        document_title?: string;
        total_pages?: number;
        total_chapters?: number;
        has_explicit_structure?: boolean;
        chapters?: unknown[];
      }>(response.text, {
        document_title: fileName || "Untitled Document",
        total_pages: 0,
        total_chapters: 0,
        has_explicit_structure: false,
        chapters: [],
      });

      const { chapters: normalizedChapters, totalPages: calculatedTotal } =
        validateAndRepairChapters(
          parsed.chapters || [],
          Math.max(totalPages, parsed.total_pages || 0),
          accurateTitle || fileName || "Document"
        );

      const result: ParsedPdfResult = {
        document_title: parsed.document_title || accurateTitle || fileName || "Untitled Document",
        total_pages: calculatedTotal,
        total_chapters: normalizedChapters.length,
        has_explicit_structure: Boolean(parsed.has_explicit_structure ?? true),
        chapters: normalizedChapters,
      };

      const elapsedMs = Date.now() - startTime;
      logEvent("DONE /api/parse-pdf-chapters (Gemini Fallback)", {
        model: modelUsed,
        fileName: fileName || "unknown.pdf",
        chaptersFound: normalizedChapters.length,
        totalPages: result.total_pages,
        elapsedMs,
      });

      return result;
    } catch (geminiErr: unknown) {
      logEvent("WARN Gemini fallback failed or quota exhausted, using local engine", {
        err: String(geminiErr),
      });
    }
  }

  if (
    pythonSuccess &&
    pyResult &&
    Array.isArray(pyResult.chapters) &&
    pyResult.chapters.length > 0
  ) {
    const { chapters: normalizedChapters, totalPages: calculatedTotal } = validateAndRepairChapters(
      pyResult.chapters,
      totalPages,
      accurateTitle || fileName || "Document"
    );

    const result: ParsedPdfResult = {
      document_title: pyResult.document_title || accurateTitle || fileName || "Untitled Document",
      total_pages: calculatedTotal,
      total_chapters: normalizedChapters.length,
      has_explicit_structure: Boolean(pyResult.has_explicit_structure ?? true),
      is_scanned_pdf: Boolean(pyResult.is_scanned_pdf),
      ocr_recommended: Boolean(pyResult.ocr_recommended),
      total_words: pyResult.total_words,
      chapters: normalizedChapters,
    };

    const elapsedMs = Date.now() - startTime;
    logEvent("DONE /api/parse-pdf-chapters (Python Scanned/Partitioned Recovery)", {
      method: "python-local",
      fileName: fileName || "unknown.pdf",
      chaptersFound: normalizedChapters.length,
      totalPages: result.total_pages,
      elapsedMs,
    });

    return result;
  }

  // Pure JS fallback via pdf-lib
  try {
    logEvent("FALLBACK /api/parse-pdf-chapters to pure JS pdf-lib engine", {
      fileName: fileName || "unknown.pdf",
    });
    const jsResult = await parsePdfWithPdfLib(pdfBuffer, accurateTitle || fileName);

    const elapsedMs = Date.now() - startTime;
    logEvent("DONE /api/parse-pdf-chapters (pdf-lib Pure JS Fallback)", {
      fileName: fileName || "unknown.pdf",
      chaptersFound: jsResult.total_chapters,
      totalPages: jsResult.total_pages,
      elapsedMs,
    });

    return jsResult;
  } catch (pdfLibErr: unknown) {
    logEvent("WARN pdf-lib pure JS fallback failed", {
      err: String(pdfLibErr),
    });
  }

  // Synthesized fallback
  const fallbackTotalPages = totalPages || 1;
  const { chapters: fallbackChapters, totalPages: calculatedFallbackTotal } =
    validateAndRepairChapters(
      pyResult?.chapters || [],
      fallbackTotalPages,
      accurateTitle || fileName || "Document"
    );

  const result: ParsedPdfResult = {
    document_title: pyResult?.document_title || accurateTitle || fileName || "Untitled Document",
    total_pages: calculatedFallbackTotal,
    total_chapters: fallbackChapters.length,
    has_explicit_structure: Boolean(pyResult?.has_explicit_structure ?? false),
    is_scanned_pdf: Boolean(pyResult?.is_scanned_pdf),
    ocr_recommended: Boolean(pyResult?.ocr_recommended),
    total_words: pyResult?.total_words,
    chapters: fallbackChapters,
  };

  const elapsedMs = Date.now() - startTime;
  logEvent("DONE /api/parse-pdf-chapters (Synthesized Fallback)", {
    fileName: fileName || "unknown.pdf",
    chaptersFound: fallbackChapters.length,
    totalPages: result.total_pages,
    elapsedMs,
  });

  return result;
}
