import { getDocument } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

const docCache = new Map<string, Promise<PDFDocumentProxy>>();
const MAX_CACHED_PDF_DOCS = 8;

export function clearPdfDocumentCache(urlKey?: string): void {
  const entries = urlKey
    ? [[urlKey.split("#")[0], docCache.get(urlKey.split("#")[0])] as const]
    : [...docCache.entries()];
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

export function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
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
