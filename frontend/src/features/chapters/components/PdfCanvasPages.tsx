import React, { useEffect, useMemo, useRef, useState } from "react";
import { GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { loadPdfDocument } from "../../../app/files/pdfDocumentCache";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfCanvasPagesProps {
  url: string;
  fromPage?: number;
  toPage?: number;
  /** Add this offset when the rendered PDF is a chapter-only page slice. */
  pageNumberOffset?: number;
  /** Original 1-based PDF page to scroll into view. */
  scrollToPage?: number;
  scrollRequestId?: number;
  aspectHint?: number | null;
  zoom?: number;
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
  pageNumberOffset = 0,
  scrollToPage,
  scrollRequestId,
  aspectHint,
  zoom = 1,
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
    if (!url || typeof url !== "string") {
      return;
    }
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

  useEffect(() => {
    if (!scrollToPage || !doc) return;
    const frame = window.requestAnimationFrame(() => {
      const target = scrollRef.current?.querySelector<HTMLElement>(
        `[data-original-page="${scrollToPage}"]`
      );
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [doc, scrollToPage, scrollRequestId, pageNumberOffset]);

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
    <div
      ref={scrollRef}
      className={`${className} ${zoom > 1 ? "chapter-page-zoom overflow-x-auto items-start" : ""}`}
      style={style}
    >
      {doc ? (
        pageNumbers.map((pageNumber, index) => (
          <PdfPageCanvas
            key={`${pageNumber}-${rasterKey}`}
            doc={doc}
            pageNumber={pageNumber}
            originalPageNumber={pageNumber + pageNumberOffset}
            aspectHint={placeholderAspect}
            separated={index > 0}
            zoom={zoom}
          />
        ))
      ) : (
        <div
          className="shrink-0"
          style={{ width: `${zoom * 100}%`, aspectRatio: String(placeholderAspect) }}
        />
      )}
    </div>
  );
};

interface PdfPageCanvasProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  originalPageNumber: number;
  aspectHint: number;
  separated: boolean;
  zoom: number;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  doc,
  pageNumber,
  originalPageNumber,
  aspectHint,
  separated,
  zoom,
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
      if (cancelled) return;

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
  }, [doc, pageNumber, visible, zoom]);

  return (
    <div
      ref={wrapRef}
      data-original-page={originalPageNumber}
      className={`relative shrink-0 rounded-xl overflow-hidden bg-transparent${separated ? " mt-4 border-t border-transparent" : ""}`}
      style={{ width: `${zoom * 100}%`, aspectRatio: String(aspect) }}
    >
      <canvas ref={canvasRef} className="block w-full h-full rounded-xl" />
    </div>
  );
};
