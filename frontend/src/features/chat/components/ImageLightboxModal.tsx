import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";

export interface ImageLightboxModalProps {
  src: string;
  alt: string;
  onClose: () => void;
  fileName?: string;
  fileSize?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  src,
  alt,
  onClose,
  fileName,
  fileSize,
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fileName || alt || "Image preview"}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-between bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top action header bar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white py-2 px-1 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 pr-4">
          <span className="text-sm font-medium text-slate-100 truncate" title={fileName || alt}>
            {fileName || alt || "Image preview"}
          </span>
          {fileSize && <span className="text-xs text-slate-400">{fileSize}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            title={isZoomed ? "Zoom out" : "Zoom in"}
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            {isZoomed ? <ZoomOut size={16} strokeWidth={1.75} /> : <ZoomIn size={16} strokeWidth={1.75} />}
          </button>
          <a
            href={src}
            download={fileName || "image-preview"}
            title="Download image"
            aria-label="Download image"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <Download size={16} strokeWidth={1.75} />
          </a>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close image preview"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 w-full max-w-5xl flex items-center justify-center min-h-0 overflow-auto p-2"
        onClick={onClose}
      >
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed((prev) => !prev);
          }}
          className={`rounded-xl shadow-2xl transition-all duration-200 object-contain cursor-zoom-in ${
            isZoomed
              ? "max-h-none max-w-none cursor-zoom-out scale-125 my-auto"
              : "max-h-[82vh] max-w-[92vw]"
          }`}
        />
      </div>

      {/* Bottom hint */}
      <div
        className="text-[12px] text-slate-400 pt-2 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-slate-200 font-mono">Esc</kbd> or click outside to close · Click image to zoom
      </div>
    </div>,
    document.body
  );
};
