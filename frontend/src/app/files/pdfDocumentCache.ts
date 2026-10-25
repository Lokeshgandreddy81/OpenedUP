import { getDocument } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

const docCache = new Map<string, Promise<PDFDocumentProxy>>();
const MAX_CACHED_PDF_DOCS = 8;

export function clearPdfDocumentCache(urlKey?: string): void {
  if (urlKey && typeof urlKey === "string") {
    const key = urlKey.split("#")[0];
    const promise = docCache.get(key);
    if (promise) {
      docCache.delete(key);
      promise.then(
        (doc) => {
          try {
            doc.destroy?.();
          } catch {
            // Ignore already-released PDF.js documents.
          }
        },
        () => undefined
      );
    }
    return;
  }
  const entries = [...docCache.entries()];
  for (const [key, promise] of entries) {
    if (!promise) continue;
    docCache.delete(key);
    promise.then(
      (doc) => {
        try {
          doc.destroy?.();
        } catch {
          // Ignore already-released PDF.js documents.
        }
      },
      () => undefined
    );
  }
}

export function loadPdfDocument(url?: string | null): Promise<PDFDocumentProxy> {
  if (!url || typeof url !== "string") {
    return Promise.reject(new Error("No valid PDF URL provided"));
  }
  const key = url.split("#")[0];
  let cached = docCache.get(key);
  if (!cached) {
    if (docCache.size >= MAX_CACHED_PDF_DOCS) {
      const oldestKey = docCache.keys().next().value;
      if (oldestKey) clearPdfDocumentCache(oldestKey);
    }
    cached = getDocument(key).promise;
    cached.catch(() => docCache.delete(key));
    docCache.set(key, cached);
  }
  return cached;
}
