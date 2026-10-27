import { PDFDocument } from "pdf-lib";

// Shared document caches are managed outside the component module so state owners
// can clear them without coupling to a React component export.
const parsedPdfDocCache = new Map<string, PDFDocument>();
const slicedBlobUrlCache = new Map<string, { url: string; aspect: number; photoId: string }>();
const MAX_CACHED_PARSED_DOCS = 6;
const MAX_CACHED_SLICED_BLOBS = 30;

export function getCachedPdfDocument(photoId: string): PDFDocument | undefined {
  return parsedPdfDocCache.get(photoId);
}

export function setCachedPdfDocument(photoId: string, document: PDFDocument): void {
  if (parsedPdfDocCache.size >= MAX_CACHED_PARSED_DOCS && !parsedPdfDocCache.has(photoId)) {
    const oldestPhotoId = parsedPdfDocCache.keys().next().value;
    if (oldestPhotoId) parsedPdfDocCache.delete(oldestPhotoId);
  }
  parsedPdfDocCache.set(photoId, document);
}

export function getCachedSlicedBlob(cacheKey: string) {
  return slicedBlobUrlCache.get(cacheKey);
}

export function setCachedSlicedBlob(
  cacheKey: string,
  item: { url: string; aspect: number; photoId: string }
): void {
  if (slicedBlobUrlCache.size >= MAX_CACHED_SLICED_BLOBS && !slicedBlobUrlCache.has(cacheKey)) {
    const oldestKey = slicedBlobUrlCache.keys().next().value;
    if (oldestKey) {
      const evicted = slicedBlobUrlCache.get(oldestKey);
      if (evicted) {
        try {
          URL.revokeObjectURL(evicted.url);
        } catch {
          // Cache eviction must not block storing the new document slice.
        }
      }
      slicedBlobUrlCache.delete(oldestKey);
    }
  }
  slicedBlobUrlCache.set(cacheKey, item);
}

export function clearDocumentCache(photoId?: string): void {
  if (photoId) {
    parsedPdfDocCache.delete(photoId);
    for (const [key, item] of Array.from(slicedBlobUrlCache.entries())) {
      if (item.photoId === photoId) {
        try {
          URL.revokeObjectURL(item.url);
        } catch {
          // ignore
        }
        slicedBlobUrlCache.delete(key);
      }
    }
  } else {
    parsedPdfDocCache.clear();
    for (const item of Array.from(slicedBlobUrlCache.values())) {
      try {
        URL.revokeObjectURL(item.url);
      } catch {
        // ignore
      }
    }
    slicedBlobUrlCache.clear();
  }
}
