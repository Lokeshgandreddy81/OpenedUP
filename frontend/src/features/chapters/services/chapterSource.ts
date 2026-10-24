import { GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { loadPdfDocument } from "../../../app/files/pdfDocumentCache";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Source text tied to its original, one-based page in the uploaded PDF. */
export interface ChapterSourcePage {
  id: string;
  pageNumber: number;
  text: string;
}

/** Ephemeral, browser-session representation used by chapter-scoped retrieval. */
export interface ChapterSource {
  documentId: string;
  chapterId: string;
  title: string;
  startPage: number;
  endPage: number;
  pages: ChapterSourcePage[];
}

export type ChapterSourceErrorCode =
  "invalid_range" | "range_out_of_bounds" | "no_searchable_text" | "pdf_unavailable";

export class ChapterSourceError extends Error {
  constructor(
    public readonly code: ChapterSourceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ChapterSourceError";
  }
}

export interface ExtractChapterSourceOptions {
  /** The original PDF URL, shared with the reader's parsed-document cache. */
  url: string;
  title: string;
  startPage: number;
  endPage: number;
  /** Stable for this uploaded file's current session; do not persist it. */
  documentId: string;
  /** Stable for this chapter within the current document session. */
  chapterId: string;
  signal?: AbortSignal;
}

function createPassageId(documentId: string, chapterId: string, pageNumber: number) {
  return `${documentId}:${chapterId}:page-${pageNumber}`;
}

/**
 * Extract selectable text from the selected chapter's original PDF page range.
 * This deliberately does not OCR, summarize, or consult adjacent chapters.
 */
export async function extractChapterSource({
  url,
  title,
  startPage,
  endPage,
  documentId,
  chapterId,
  signal,
}: ExtractChapterSourceOptions): Promise<ChapterSource> {
  if (
    !Number.isInteger(startPage) ||
    !Number.isInteger(endPage) ||
    startPage < 1 ||
    endPage < startPage ||
    !documentId.trim() ||
    !chapterId.trim()
  ) {
    throw new ChapterSourceError(
      "invalid_range",
      "This chapter has an invalid page range and cannot be searched."
    );
  }

  let document: PDFDocumentProxy;
  try {
    document = await loadPdfDocument(url);
  } catch {
    throw new ChapterSourceError(
      "pdf_unavailable",
      "This PDF could not be opened for text search."
    );
  }

  if (endPage > document.numPages) {
    throw new ChapterSourceError(
      "range_out_of_bounds",
      "This chapter points to pages outside the uploaded PDF."
    );
  }

  const pages: ChapterSourcePage[] = [];
  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
    if (signal?.aborted)
      throw new DOMException("Chapter text extraction was cancelled.", "AbortError");
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let line = "";
    let previousY: number | undefined;
    let previousHeight = 0;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const part = item.str.replace(/\s+/g, " ").trim();
      if (!part) continue;

      const y = item.transform[5];
      if (previousY !== undefined && Math.abs(previousY - y) > Math.max(2, previousHeight * 0.35)) {
        if (line) lines.push(line.trim());
        const paragraphBreak = Math.abs(previousY - y) > Math.max(4, previousHeight * 1.15);
        if (paragraphBreak && lines.at(-1) !== "") lines.push("");
        line = "";
      }
      line = line ? `${line} ${part}` : part;
      if (item.hasEOL) {
        lines.push(line.trim());
        line = "";
      }
      previousY = y;
      previousHeight = item.height;
    }
    if (line) lines.push(line.trim());
    const text = lines
      .join("\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    pages.push({
      id: createPassageId(documentId, chapterId, pageNumber),
      pageNumber,
      text,
    });
  }

  return { documentId, chapterId, title, startPage, endPage, pages };
}

export interface ChapterPageImage {
  pageNumber: number;
  mimeType: "image/jpeg";
  base64Data: string;
}

/** Render a small, bounded set of original PDF pages for vision-capable models. */
export async function renderChapterPageImages(
  url: string,
  pageNumbers: number[],
  signal?: AbortSignal
): Promise<ChapterPageImage[]> {
  const document = await loadPdfDocument(url);
  const uniquePages = [...new Set(pageNumbers)].slice(0, 8);
  const images: ChapterPageImage[] = [];
  for (const pageNumber of uniquePages) {
    if (signal?.aborted) throw new DOMException("Page rendering was cancelled.", "AbortError");
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > document.numPages) continue;
    const page = await document.getPage(pageNumber);
    const initialViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.6, 1600 / Math.max(initialViewport.width, initialViewport.height));
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("This browser could not prepare a PDF page image.");
    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    canvas.width = 0;
    canvas.height = 0;
    const base64Data = dataUrl.slice(dataUrl.indexOf(",") + 1);
    if (base64Data.length > 1_500_000) {
      throw new Error("A PDF page image is too large to send. Try a lower-resolution scan.");
    }
    images.push({ pageNumber, mimeType: "image/jpeg", base64Data });
  }
  return images;
}
