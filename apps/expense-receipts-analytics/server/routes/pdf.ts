import { Router } from "express";
import { PDFDocument } from "pdf-lib";
import {
  parsePdfRequestSchema,
  PDF_PARSE_SYSTEM_INSTRUCTION,
  PDF_PARSE_RESPONSE_SCHEMA,
  type ParsePdfRequest,
} from "../schemas/pdf.ts";
import { validateBody } from "../middleware/validateRequest.ts";
import {
  runPythonChapterExtractor,
  validateAndRepairChapters,
  parsePdfWithPdfLib,
} from "../services/pdfService.ts";
import {
  generateWithModelFallback,
  parseJsonSafely,
  extractHumanErrorMessage,
} from "../services/geminiService.ts";
import { resolveApiKey } from "../config.ts";
import { logEvent } from "../logger.ts";

export const pdfRouter = Router();

pdfRouter.post("/api/parse-pdf-chapters", validateBody(parsePdfRequestSchema), async (req, res) => {
  const startTime = Date.now();
  try {
    const { mimeType, base64Data, fileName } = req.body as ParsePdfRequest;

    const cleanBase64 = base64Data.includes(",")
      ? base64Data.slice(base64Data.indexOf(",") + 1).trim()
      : base64Data.trim();

    if (!cleanBase64) {
      res.status(400).json({ error: "No PDF data provided." });
      return;
    }

    const effectiveMime = (mimeType || "").toLowerCase().trim();
    const isPdfLike =
      !effectiveMime ||
      effectiveMime.includes("pdf") ||
      effectiveMime === "application/octet-stream" ||
      (Boolean(fileName) && fileName!.toLowerCase().endsWith(".pdf"));

    if (!isPdfLike) {
      res.status(400).json({
        error: `Invalid MIME type "${mimeType}". Expected a PDF document.`,
      });
      return;
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = Buffer.from(cleanBase64, "base64");
    } catch {
      res.status(400).json({ error: "Failed to decode base64 PDF payload." });
      return;
    }

    const headerChunk = pdfBuffer.slice(0, 1024).toString("latin1");
    if (!headerChunk.includes("%PDF-")) {
      res.status(400).json({
        error: "The provided file is not a valid PDF document (missing %PDF header).",
      });
      return;
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
      const preDoc = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true,
      });
      accuratePageCount = Math.max(1, preDoc.getPageCount());
      const t = preDoc.getTitle()?.trim();
      if (t) {
        accurateTitle = t.toLowerCase().endsWith(".pdf") ? t.slice(0, -4) : t;
      }
    } catch (preErr) {
      logEvent("WARN pdf-lib pre-check notice", { err: String(preErr) });
    }

    const { success: pythonSuccess, result: pyResult } = await runPythonChapterExtractor(
      pdfBuffer,
      accurateTitle || fileName || "Document"
    );

    const totalPages = Math.max(accuratePageCount, pyResult?.total_pages || 1);
    const isScannedPdf = Boolean(
      pyResult?.is_scanned_pdf ||
      (pyResult?.total_words !== undefined && pyResult.total_words === 0)
    );

    if (pythonSuccess && pyResult && !isScannedPdf) {
      const { chapters: normalizedChapters, totalPages: calculatedTotal } =
        validateAndRepairChapters(
          pyResult.chapters || [],
          totalPages,
          accurateTitle || fileName || "Document"
        );

      const result = {
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

      res.json(result);
      return;
    }

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

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
          [
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

        const result = {
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

        res.json(result);
        return;
      } catch (geminiErr) {
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
      const { chapters: normalizedChapters, totalPages: calculatedTotal } =
        validateAndRepairChapters(
          pyResult.chapters,
          totalPages,
          accurateTitle || fileName || "Document"
        );

      const result = {
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

      res.json(result);
      return;
    }

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

      res.json(jsResult);
      return;
    } catch (pdfLibErr) {
      logEvent("WARN pdf-lib pure JS fallback failed", {
        err: String(pdfLibErr),
      });
    }

    const fallbackTotalPages = totalPages || 1;
    const { chapters: fallbackChapters, totalPages: calculatedFallbackTotal } =
      validateAndRepairChapters(
        pyResult?.chapters || [],
        fallbackTotalPages,
        accurateTitle || fileName || "Document"
      );

    const result = {
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

    res.json(result);
    return;
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = extractHumanErrorMessage(
      error,
      "Failed to parse PDF document. Please verify the file is a valid PDF."
    );
    logEvent("ERROR /api/parse-pdf-chapters", { message, elapsedMs });
    res.status(500).json({ error: message });
  }
});
