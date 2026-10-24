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
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter((part) => part.length > 0)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text) {
      pages.push({
        id: createPassageId(documentId, chapterId, pageNumber),
        pageNumber,
        text,
      });
    }
  }

  if (pages.length === 0) {
    throw new ChapterSourceError(
      "no_searchable_text",
      "No selectable text was found in this chapter. Scanned PDFs are not supported yet."
    );
  }

  return { documentId, chapterId, title, startPage, endPage, pages };
}
