import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// One parsed document per URL, shared across every page canvas and chapter switch
const docCache = new Map<string, Promise<PDFDocumentProxy>>();
const MAX_CACHED_PDF_DOCS = 8;

export function clearPdfDocumentCache(urlKey?: string): void {
  if (urlKey) {
    const key = urlKey.split("#")[0];
    const cachedPromise = docCache.get(key);
    if (cachedPromise) {
      docCache.delete(key);
      cachedPromise.then(
        (doc) => {
          try {
            doc.destroy?.();
          } catch {
            // ignore
          }
        },
        () => {}
      );
    }
  } else {
    for (const [key, promise] of docCache.entries()) {
      docCache.delete(key);
      promise.then(
        (doc) => {
          try {
            doc.destroy?.();
          } catch {
            // ignore
          }
        },
        () => {}
      );
    }
  }
}

function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  const key = url.split("#")[0];
  let cached = docCache.get(key);
  if (!cached) {
    // Evict oldest cached document proxy if limit reached
    if (docCache.size >= MAX_CACHED_PDF_DOCS) {
      const oldestKey = docCache.keys().next().value;
      if (oldestKey) {
        clearPdfDocumentCache(oldestKey);
      }
    }
    cached = getDocument(key).promise;
    cached.catch(() => docCache.delete(key));
    docCache.set(key, cached);
  }
  return cached;
}

interface PdfCanvasPagesProps {
  url: string;
  fromPage?: number;
  toPage?: number;
  aspectHint?: number | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders PDF pages onto canvases inside an app-owned scroll column.
 * Deliberately avoids the browser's native PDF viewer (iframe/embed), whose
 * floating toolbar, zoom and download chrome cannot be hidden via CSS.
 */
export const PdfCanvasPages: React.FC<PdfCanvasPagesProps> = ({
  url,
  fromPage = 1,
  toPage,
  aspectHint,
  className = "w-full flex flex-col",
  style,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState<boolean>(false);
  const [rasterKey, setRasterKey] = useState<number>(0);

  useEffect(() => {
    let active = true;
    setDoc(null);
    setFailed(false);
    loadPdfDocument(url).then(
      (loaded) => {
        if (active) setDoc(loaded);
      },
      () => {
        if (active) setFailed(true);
      }
    );
    return () => {
      active = false;
    };
  }, [url]);

  // Re-rasterize pages at the new pixel width when the column is resized
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !doc) return;
    let lastWidth = el.clientWidth;
    let timer: number | undefined;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (Math.abs(w - lastWidth) < 8) return;
      lastWidth = w;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setRasterKey((k) => k + 1), 180);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, [doc]);

  const pageNumbers = useMemo(() => {
    if (!doc) return [];
    const last = Math.min(doc.numPages, toPage ?? doc.numPages);
    const first = Math.max(1, Math.min(fromPage, last));
    const numbers: number[] = [];
    for (let p = first; p <= last; p++) numbers.push(p);
    return numbers;
  }, [doc, fromPage, toPage]);

  const placeholderAspect = aspectHint && aspectHint > 0 ? aspectHint : 8.5 / 11;

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-white`} style={style}>
        <span className="font-mono text-[11px] tracking-[0.18em] text-gray-400 uppercase">
          PDF preview unavailable
        </span>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className={className} style={style}>
      {doc ? (
        pageNumbers.map((pageNumber, index) => (
          <PdfPageCanvas
            key={`${pageNumber}-${rasterKey}`}
            doc={doc}
            pageNumber={pageNumber}
            aspectHint={placeholderAspect}
            separated={index > 0}
          />
        ))
      ) : (
        <div className="w-full" style={{ aspectRatio: String(placeholderAspect) }} />
      )}
    </div>
  );
};

interface PdfPageCanvasProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  aspectHint: number;
  separated: boolean;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  doc,
  pageNumber,
  aspectHint,
  separated,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [aspect, setAspect] = useState<number>(aspectHint);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        setVisible(entry.isIntersecting);
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Release the pixel buffer of sheets scrolled well out of view; the wrapper
  // keeps its aspect box so the column geometry never shifts.
  useEffect(() => {
    if (visible) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.width > 0) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    (async () => {
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;

      const base = page.getViewport({ scale: 1 });
      setAspect(base.width / base.height);

      const el = wrapRef.current;
      const canvas = canvasRef.current;
      if (!el || !canvas) return;
      const cssWidth = el.clientWidth;
      if (cssWidth <= 0) return;

      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const viewport = page.getViewport({
        scale: (cssWidth * dpr) / base.width,
      });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
      page.cleanup();
    })().catch(() => {
      // aborted or failed render; the sheet stays blank
    });

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        // already finished
      }
    };
  }, [doc, pageNumber, visible]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full rounded-xl overflow-hidden bg-transparent${separated ? " mt-4 border-t border-transparent" : ""}`}
      style={{ aspectRatio: String(aspect) }}
    >
      <canvas ref={canvasRef} className="block w-full h-full rounded-xl" />
    </div>
  );
};
