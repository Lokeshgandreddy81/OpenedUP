import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const MAX_PDF_BYTES = 5_000_000;
const MAX_EXTRACTED_CHARACTERS = 200_000;
const MAX_PAGES = 50;

export interface ExtractedPdfText {
  content: string;
  pagesImported: number;
  totalPages: number;
  truncated: boolean;
}

export async function extractPdfText(file: File): Promise<ExtractedPdfText> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDFs must be 5 MB or smaller.");
  }

  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pageLimit = Math.min(pdf.numPages, MAX_PAGES);
  const pages: string[] = [];
  let characterCount = 0;
  let pagesProcessed = 0;
  let truncated = pdf.numPages > pageLimit;

  try {
    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      pagesProcessed = pageNumber;
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ")
        .trim();

      if (!text) continue;

      const pageText = `## Page ${pageNumber}\n\n${text}`;
      const separator = pages.length ? "\n\n" : "";
      const remaining = MAX_EXTRACTED_CHARACTERS - characterCount - separator.length;
      if (remaining <= 0) {
        truncated = true;
        break;
      }
      if (pageText.length > remaining) {
        pages.push(`${separator}${pageText.slice(0, remaining).trimEnd()}`);
        truncated = true;
        break;
      }

      pages.push(`${separator}${pageText}`);
      characterCount += separator.length + pageText.length;
    }

    const content = pages.join("");
    if (!content.trim()) {
      throw new Error(
        "No selectable text was found in this PDF. Scanned PDFs need OCR before they can be imported."
      );
    }

    return {
      content,
      pagesImported: pagesProcessed,
      totalPages: pdf.numPages,
      truncated,
    };
  } finally {
    await pdf.destroy();
  }
}
