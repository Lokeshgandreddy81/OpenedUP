import React, { useEffect, useRef, useState } from "react";
import type { FailedBatchInfo, UploadedPhoto } from "@charan-interiors/shared";
import { formatCurrencyAmount } from "../utils/engine";
import {
  CustomScrollList,
  RisingWord,
  RollingNumber,
  usePrefersReducedMotion,
} from "./MotionPrimitives";

export type ReadingPhase =
  "idle" | "reading_photos" | "checking_duplicates" | "adding_up" | "transitioning_out";

interface LandingViewProps {
  photos: UploadedPhoto[];
  privacyAccepted: boolean;
  readingPhase: ReadingPhase;
  totalReceiptsFound: number;
  recentDiscoveries?: Array<{
    merchant: string;
    total: number | null;
    currency: string;
  }>;
  failedBatches: FailedBatchInfo[];
  connectedEmail?: string | null;
  onAddFiles: (files: FileList | File[]) => void;
  onRemovePhoto: (id: string) => void;
  onTogglePrivacy: () => void;
  onStartVisualise: () => void;
  onRetryFailedBatches: () => void;
  onOpenWorkspaceModal?: () => void;
}

function formatFileSize(bytes?: number): string {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export const LandingView: React.FC<LandingViewProps> = ({
  photos,
  privacyAccepted,
  readingPhase,
  totalReceiptsFound,
  recentDiscoveries = [],
  failedBatches,
  connectedEmail = null,
  onAddFiles,
  onRemovePhoto,
  onTogglePrivacy,
  onStartVisualise,
  onRetryFailedBatches,
  onOpenWorkspaceModal,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDropHovered, setIsDropHovered] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [ctaHovered, setCtaHovered] = useState(false);

  const [loadStep, setLoadStep] = useState<number>(reducedMotion ? 10 : 0);
  const [exitStep, setExitStep] = useState<number>(0);

  const isReading =
    readingPhase === "reading_photos" ||
    readingPhase === "checking_duplicates" ||
    readingPhase === "adding_up";
  const isExiting = readingPhase === "transitioning_out";
  const canVisualise = photos.length > 0 && readingPhase === "idle";

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const shortcutLabel = isMac ? "⌘O" : "Ctrl+O";

  /* ── Entrance choreography ── */
  useEffect(() => {
    if (reducedMotion) {
      setLoadStep(10);
      return;
    }
    const timers = [
      window.setTimeout(() => setLoadStep(1), 30),
      window.setTimeout(() => setLoadStep(2), 180),
      window.setTimeout(() => setLoadStep(3), 380),
      window.setTimeout(() => setLoadStep(4), 500),
      window.setTimeout(() => setLoadStep(5), 660),
      window.setTimeout(() => setLoadStep(6), 780),
      window.setTimeout(() => setLoadStep(7), 940),
      window.setTimeout(() => setLoadStep(8), 1120),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reducedMotion]);

  const isPdfDocument = photos.some(
    (p) => p.mimeType === "application/pdf" || p.name.toLowerCase().endsWith(".pdf")
  );

  /* ── Fluid World-Class Exit Choreography ── */
  useEffect(() => {
    if (readingPhase !== "transitioning_out") {
      setExitStep(0);
      return;
    }
    if (reducedMotion) {
      setExitStep(2);
      return;
    }
    setExitStep(1);
    const t = window.setTimeout(() => setExitStep(2), 25);
    return () => window.clearTimeout(t);
  }, [readingPhase, reducedMotion]);

  const prevPhotosLenRef = useRef(photos.length);
  useEffect(() => {
    if (photos.length > prevPhotosLenRef.current) {
      setScrollTrigger((n) => n + 1);
    }
    prevPhotosLenRef.current = photos.length;
  }, [photos.length]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (isReading || isExiting) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const openFilePicker = () => {
    if (isReading || isExiting) return;
    fileInputRef.current?.click();
  };

  /* ── Google standard keyboard shortcut ⌘O / Ctrl+O ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        if (!isReading && !isExiting) {
          openFilePicker();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReading, isExiting]);

  const completedPhotosCount = photos.filter((p) => p.status === "done").length;

  let step2Label = "Parse line items, merchants & tax tables";
  if (readingPhase === "reading_photos") {
    step2Label = `Reading ${photos.length} ${photos.length === 1 ? "document" : "documents"}…`;
  } else if (readingPhase === "checking_duplicates") {
    step2Label = "Checking duplicate claims…";
  } else if (readingPhase === "adding_up" || readingPhase === "transitioning_out") {
    step2Label = "Verifying totals in code…";
  }

  const getStepStatus = (stepNum: 1 | 2 | 3): "idle" | "active" | "done" => {
    if (!isReading && !isExiting) {
      if (stepNum === 1 && photos.length > 0) return "done";
      return "idle";
    }
    if (stepNum === 1) return "done";
    if (stepNum === 2) {
      return readingPhase === "adding_up" || isExiting ? "done" : "active";
    }
    return readingPhase === "adding_up" || isExiting ? "active" : "idle";
  };

  /* ── Shared transition helpers ── */
  const fadeOut = (delay = 0): React.CSSProperties => ({
    opacity: exitStep >= 1 ? 0 : 1,
    transform: exitStep >= 1 && !reducedMotion ? "translateY(-8px)" : "translateY(0)",
    transition: reducedMotion
      ? "opacity 120ms linear"
      : `opacity 180ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 180ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
  });

  const fadeIn = (step: number, delay = 0): React.CSSProperties => ({
    opacity: loadStep >= step ? 1 : 0,
    transform: loadStep >= step || reducedMotion ? "translateY(0)" : "translateY(10px)",
    transition: reducedMotion
      ? "opacity 150ms linear"
      : `opacity 360ms var(--ease-out) ${delay}ms, transform 360ms var(--ease-out) ${delay}ms`,
  });

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isReading && !isExiting) setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsDraggingOver(false);
        }
      }}
      onDrop={handleDrop}
      className="w-full min-h-screen md:h-screen flex flex-col md:grid md:grid-cols-12 bg-white overflow-x-hidden md:overflow-hidden select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* ═══ LEFT COLUMN ═══ Google Blue #0047FF — Pure Architectural Typography ═══ */}
      <div
        className="md:col-span-7 min-h-[460px] md:h-full flex flex-col justify-between relative z-10 overflow-hidden"
        style={{
          backgroundColor: "#0047FF",
          color: "#FFFFFF",
          padding: "clamp(24px, 3.6vw, 56px)",
          transformOrigin: "left top",
          transform: reducedMotion
            ? "none"
            : exitStep >= 2
              ? "scaleX(0.2168)"
              : loadStep >= 1
                ? "scaleX(1)"
                : "scaleX(0)",
          transition: reducedMotion
            ? "opacity 150ms linear"
            : exitStep >= 2
              ? "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "transform 640ms var(--ease-soft)",
        }}
      >
        {/* Subtle architectural grid guidelines (pure Google precision) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* ── Top: Identity + Status Header ── */}
        <div className="flex flex-col relative z-10" style={fadeOut()}>
          {/* Provenance Header */}
          <div
            className="mb-5 sm:mb-8 flex flex-wrap items-center justify-between gap-3"
            style={fadeIn(3)}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-mono text-[9px] sm:text-[9.5px] tracking-[0.24em] text-white/80 uppercase font-medium">
                Document &amp; Expense Audit
              </span>
            </div>
          </div>

          {/* Monumental Wordmark (Foundational) */}
          <h1
            className="m-0 tracking-[-0.05em] font-normal leading-[0.82] text-white"
            style={{
              fontSize: "clamp(48px, 9vw, 122px)",
            }}
          >
            <RisingWord
              text="Shoebox"
              visible={loadStep >= 4 && exitStep === 0}
              baseDelayMs={0}
              letterStaggerMs={24}
              durationMs={540}
              easing="var(--ease-spring)"
              letterByLetter={true}
            />
          </h1>

          {/* Editorial Tagline — Clean, Crisp, Zero Fluff */}
          <p
            className="m-0 mt-5 sm:mt-6 max-w-[480px]"
            style={{
              fontSize: "clamp(16px, 2vw, 26px)",
              lineHeight: 1.28,
              letterSpacing: "-0.018em",
              ...fadeIn(6),
            }}
          >
            <span className="text-white block font-medium">Drop documents &amp; receipts in.</span>
            <span className="text-white/60 font-light block mt-0.5">Get audited ledgers out.</span>
          </p>

          {/* Google Engineering Capability Strip — Zero Fluff */}
          <div
            className="mt-4 sm:mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] sm:text-[10.5px] font-mono tracking-[0.14em] text-white/65 uppercase"
            style={fadeIn(6, 100)}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-white/70" />
              Deterministic Code Audit
            </span>
            <span className="text-white/30">·</span>
            <span>Multi-Page Statement OCR</span>
            <span className="text-white/30">·</span>
            <span>Zero Data Persistence</span>
          </div>

          {/* Dynamic counter during extraction */}
          {(isReading || totalReceiptsFound > 0) && (
            <div className="mt-6 sm:mt-8 flex flex-col gap-2">
              <div
                className="tracking-[-0.035em] leading-none tabular-nums font-light text-white flex items-baseline gap-2"
                style={{
                  fontSize: "clamp(26px, 3.4vw, 46px)",
                }}
              >
                <RollingNumber value={totalReceiptsFound} />{" "}
                <span className="text-[0.52em] font-normal opacity-85 tracking-[-0.01em]">
                  {totalReceiptsFound === 1 ? "receipt verified" : "receipts verified"}
                </span>
              </div>

              {isReading && (
                <div className="flex flex-col gap-1.5 max-w-md">
                  <div className="flex items-center justify-between text-[12px] text-white/80 tabular-nums font-mono">
                    <span>
                      {readingPhase === "reading_photos"
                        ? `Reading ${completedPhotosCount} of ${photos.length} documents…`
                        : readingPhase === "checking_duplicates"
                          ? "Checking duplicate claims…"
                          : "Verifying arithmetic totals…"}
                    </span>
                    <span>
                      {photos.length > 0
                        ? `${Math.round((completedPhotosCount / photos.length) * 100)}%`
                        : ""}
                    </span>
                  </div>

                  {/* Google linear progress track */}
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300 ease-out"
                      style={{
                        width:
                          photos.length > 0
                            ? `${Math.max(8, (completedPhotosCount / photos.length) * 100)}%`
                            : "100%",
                      }}
                    />
                  </div>
                </div>
              )}

              {isReading && recentDiscoveries.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 max-w-lg">
                  {recentDiscoveries.slice(-2).map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[10.5px] text-white/85 font-mono tracking-tight"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/70" />
                      <span className="font-medium truncate max-w-[140px]">{d.merchant}</span>
                      {d.total !== null && (
                        <span className="opacity-90">
                          {formatCurrencyAmount(d.total, d.currency)}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Failed batch notification */}
          {failedBatches.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-200/30 text-[12.5px] text-white">
              <svg
                className="w-4 h-4 text-white shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                Couldn&apos;t process document{" "}
                {failedBatches
                  .map((b) =>
                    b.startPhotoIndex === b.endPhotoIndex
                      ? `${b.startPhotoIndex}`
                      : `${b.startPhotoIndex}–${b.endPhotoIndex}`
                  )
                  .join(", ")}
                : {failedBatches.map((b) => b.errorMessage).join("; ")}
              </span>
              <button
                type="button"
                onClick={onRetryFailedBatches}
                className="underline hover:no-underline font-medium cursor-pointer ml-1"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom: Google Material Stepper (Pipeline Foundation Preserved) ── */}
        <div className="pt-6 relative z-10" style={fadeOut(30)}>
          <div className="mb-4">
            <h2
              className="m-0 tracking-[-0.02em] font-normal text-white text-[15px] sm:text-[18px]"
              style={fadeIn(7)}
            >
              Pipeline verification
            </h2>
          </div>

          <div className="relative">
            {/* Stepper connecting vertical track */}
            <div className="absolute left-[13px] top-3.5 bottom-3.5 w-[1px] bg-white/20 pointer-events-none" />

            <ol className="m-0 p-0 list-none flex flex-col gap-4 max-w-lg relative z-10">
              {[
                {
                  num: 1 as const,
                  label: "Ingest",
                  spec: "BATCH INTAKE",
                  text: "Drop receipts, invoices, or multi-page PDF statements",
                },
                {
                  num: 2 as const,
                  label: "Extract",
                  spec: "GEMINI 2.5 FLASH",
                  text: step2Label,
                },
                {
                  num: 3 as const,
                  label: "Reconcile",
                  spec: "DETERMINISTIC CODE",
                  text: "Verify arithmetic totals & eliminate duplicate submissions",
                },
              ].map((step, idx) => {
                const status = getStepStatus(step.num);
                const isActive = status === "active";
                const isDone = status === "done";

                return (
                  <li
                    key={step.num}
                    className="flex items-start gap-3.5 leading-[1.35]"
                    style={fadeIn(7, (idx + 1) * 70)}
                  >
                    {/* Step indicator node */}
                    <div
                      className={`w-[27px] h-[27px] rounded-full shrink-0 flex items-center justify-center font-mono text-[10.5px] transition-all duration-200 ${
                        isDone
                          ? "bg-white text-[#0047FF] font-bold shadow-sm"
                          : isActive
                            ? "bg-white text-[#0047FF] font-bold ring-4 ring-white/25"
                            : "bg-white/10 text-white/70 border border-white/25"
                      }`}
                    >
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M3 8.5L6.5 12L13 4"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        `0${step.num}`
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium tracking-tight text-[13px] sm:text-[14px] ${
                            isActive || isDone ? "text-white" : "text-white/90"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="font-mono text-[8px] tracking-[0.16em] uppercase px-1.5 py-0.2 rounded bg-white/10 text-white/60 border border-white/10">
                          {step.spec}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-auto" />
                        )}
                      </div>
                      <p
                        className={`m-0 mt-0.5 text-[12px] sm:text-[12.5px] leading-snug transition-colors ${
                          isActive || isDone ? "text-white/90" : "text-white/65"
                        }`}
                      >
                        {step.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT COLUMN ═══ Google Gallery White — Ingestion Canvas ═══ */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isReading && !isExiting) setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={handleDrop}
        className="md:col-span-5 min-h-[460px] md:h-full min-w-0 flex flex-col justify-between overflow-hidden"
        style={{
          backgroundColor: isDraggingOver
            ? "#F0F5FF"
            : isExiting && isPdfDocument
              ? "#001A45"
              : "#FFFFFF",
          color: "#1F1F1F",
          padding: "clamp(24px, 3.6vw, 56px)",
          transformOrigin: "center bottom",
          transform: reducedMotion ? "none" : loadStep >= 2 ? "scaleY(1)" : "scaleY(0)",
          opacity: 1,
          transition: reducedMotion
            ? "opacity 150ms linear, background-color 200ms var(--ease-out)"
            : isExiting
              ? "background-color 380ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "transform 540ms var(--ease-soft), background-color 200ms var(--ease-out)",
        }}
      >
        {/* ── Top: Right-column Provenance Bar ── */}
        <div
          className="flex items-center justify-between select-none pb-2 border-b border-gray-100"
          style={fadeIn(3)}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] sm:text-[9.5px] tracking-[0.24em] text-gray-400 uppercase font-medium">
              Ingestion
            </span>
          </div>

          <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase tabular-nums text-[#0047FF] font-semibold">
            {photos.length === 0 ? "READY" : `${photos.length} STAGED`}
          </span>
        </div>

        {/* ── Center: Drop Canvas / Staged Files (Open & Neat) ── */}
        <div className="relative z-10 w-full flex-1 flex flex-col justify-center my-auto min-h-0 py-6 sm:py-8">
          <div
            onClick={() => {
              if (!isReading && !isExiting) {
                openFilePicker();
              }
            }}
            role="button"
            tabIndex={isReading || isExiting ? -1 : 0}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (!isReading && !isExiting && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                openFilePicker();
              }
            }}
            aria-label="Drop documents here or choose files"
            onMouseEnter={() => setIsDropHovered(true)}
            onMouseLeave={() => setIsDropHovered(false)}
            className={`flex-1 flex flex-col justify-center select-none overflow-hidden group ${
              isReading || isExiting ? "cursor-default" : "cursor-pointer"
            }`}
            style={{
              transformOrigin: "center top",
              transform: reducedMotion
                ? "none"
                : exitStep >= 2
                  ? "scaleY(0)"
                  : loadStep >= 5
                    ? "scaleY(1)"
                    : "scaleY(0)",
              opacity: reducedMotion ? (exitStep >= 2 ? 0 : 1) : 1,
              transition: reducedMotion
                ? "opacity 150ms linear"
                : exitStep >= 2
                  ? "transform 280ms var(--ease-in)"
                  : "transform 440ms var(--ease-out)",
            }}
          >
            <div className="flex-1 min-h-0 flex flex-col justify-center" style={fadeOut()}>
              {photos.length === 0 ? (
                /* ── Open, Minimalist Intake Stage (Zero Fluff, Zero Big Containers) ── */
                <div className="flex-1 flex flex-col items-start justify-center">
                  {/* Clean Precision Drop Glyph */}
                  <svg
                    className="mb-5 sm:mb-6 text-[#0047FF] transition-transform duration-300 ease-out"
                    style={{
                      width: "clamp(30px, 3.2vw, 38px)",
                      height: "clamp(30px, 3.2vw, 38px)",
                      transform: isDraggingOver
                        ? "translateY(5px)"
                        : isDropHovered
                          ? "translateY(2px)"
                          : "translateY(0)",
                    }}
                    viewBox="0 0 32 32"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M5 21v6h22v-6"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 4v14M10.5 12.5L16 18l5.5-5.5"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {/* Clean, Direct Headline */}
                  <h2
                    className="font-normal m-0 mb-3 text-[#1F1F1F] max-w-[420px]"
                    style={{
                      fontSize: "clamp(26px, 3vw, 40px)",
                      letterSpacing: "-0.038em",
                      lineHeight: 1.12,
                    }}
                  >
                    {isDraggingOver ? "Drop to stage" : "Drop documents here"}
                  </h2>

                  {/* Single Clean Primary Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFilePicker();
                    }}
                    className="group/btn inline-flex items-baseline gap-2 text-[15px] sm:text-[16px] tracking-[-0.015em] font-normal text-[#0047FF] hover:text-[#0038CC] cursor-pointer"
                  >
                    <span className="underline underline-offset-4 decoration-[#0047FF]/40 group-hover/btn:decoration-[#0047FF]">
                      or choose files
                    </span>
                    <span className="inline-block transition-transform duration-200 ease-out group-hover/btn:translate-x-1 font-mono text-[13px]">
                      →
                    </span>
                    <span className="ml-1 text-[10px] font-mono text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 tracking-wider hidden sm:inline-block">
                      {shortcutLabel}
                    </span>
                  </button>

                  {/* Format Bar — Pure Minimalist Specification */}
                  <div className="mt-8 sm:mt-10 flex items-center gap-2 font-mono text-[9px] sm:text-[9.5px] tracking-[0.24em] text-gray-400 uppercase font-medium">
                    <span>PDF</span>
                    <span className="text-gray-300">·</span>
                    <span>PNG</span>
                    <span className="text-gray-300">·</span>
                    <span>JPG</span>
                    <span className="text-gray-300">·</span>
                    <span>HEIC</span>
                  </div>
                </div>
              ) : (
                /* ── Staged Documents List (Google Drive Elegance) ── */
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Staged Header */}
                  <div className="pb-2.5 mb-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[13px] text-gray-800">
                        Staged Documents
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0047FF] text-[11px] font-mono font-medium">
                        {photos.length}
                      </span>
                    </div>

                    {!isReading && !isExiting && (
                      <div className="flex items-center gap-3 text-[12px]">
                        <button
                          type="button"
                          onClick={openFilePicker}
                          className="text-[#0047FF] hover:underline font-medium cursor-pointer"
                        >
                          + Add more
                        </button>
                        <span className="text-gray-300">·</span>
                        <button
                          type="button"
                          onClick={() => photos.forEach((p) => onRemovePhoto(p.id))}
                          className="text-gray-400 hover:text-red-600 font-medium cursor-pointer transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  <CustomScrollList
                    theme="on-white"
                    fadeLastVisibleRow={true}
                    scrollToBottomTrigger={scrollTrigger}
                  >
                    <ul className="m-0 p-0 list-none flex flex-col">
                      {photos.map((photo, idx) => (
                        <FileRowItem
                          key={photo.id}
                          photo={photo}
                          index={idx}
                          isReading={isReading}
                          onRemove={() => onRemovePhoto(photo.id)}
                        />
                      ))}
                    </ul>
                  </CustomScrollList>

                  {!isReading && !isExiting && (
                    <div className="pt-2.5 mt-1.5 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-400">
                      <span className="font-mono text-[10px]">{shortcutLabel} to add more</span>
                      <span className="font-mono text-[10px] tabular-nums">
                        {photos.length} {photos.length === 1 ? "file" : "files"} staged
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom: Clean Action Trigger + Legal Footnote ── */}
        <div
          className="flex flex-col gap-3 select-none pt-2"
          style={{
            opacity: exitStep >= 1 ? 0 : loadStep >= 6 ? 1 : 0,
            transform: exitStep >= 1 && !reducedMotion ? "translateY(-6px)" : "translateY(0)",
            transition: reducedMotion
              ? "opacity 150ms linear"
              : exitStep >= 1
                ? "opacity 200ms var(--ease-in), transform 200ms var(--ease-in)"
                : "opacity 360ms var(--ease-out)",
          }}
        >
          {/* Action Trigger */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={!canVisualise}
              onClick={(e) => {
                e.stopPropagation();
                onStartVisualise();
              }}
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
              className={`inline-flex items-baseline gap-2 tracking-[-0.02em] font-normal transition-colors duration-150 ${
                canVisualise
                  ? "text-[#0047FF] hover:text-[#0038CC] cursor-pointer"
                  : isReading
                    ? "text-[#0047FF] cursor-wait"
                    : "text-gray-300 cursor-default"
              }`}
              style={{
                fontSize: "clamp(18px, 2vw, 24px)",
              }}
            >
              {isReading || isExiting ? (
                <span className="inline-flex items-baseline gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-ping" />
                  {readingPhase === "reading_photos" ? (
                    <>
                      <span>reading</span>
                      <RollingNumber value={completedPhotosCount} />
                      <span>of {photos.length}…</span>
                    </>
                  ) : readingPhase === "checking_duplicates" ? (
                    <span>checking duplicates…</span>
                  ) : readingPhase === "adding_up" ? (
                    <span>verifying totals…</span>
                  ) : (
                    <span>opening document…</span>
                  )}
                </span>
              ) : photos.length > 0 ? (
                <>
                  <span className="underline underline-offset-4 decoration-[#0047FF]/40 hover:decoration-[#0047FF]">
                    visualise {photos.length}{" "}
                    {photos.length === 1
                      ? photos[0].name.toLowerCase().endsWith(".pdf")
                        ? "document"
                        : "receipt"
                      : "documents"}
                  </span>
                  <span
                    className="inline-block transition-transform duration-200 ease-out font-mono text-[15px]"
                    style={{
                      transform: ctaHovered && canVisualise ? "translateX(3px)" : "translateX(0)",
                    }}
                  >
                    →
                  </span>
                </>
              ) : (
                <>
                  <span className="opacity-40">visualise data</span>
                  <span className="opacity-30 font-mono text-[15px]">→</span>
                </>
              )}
            </button>
          </div>

          {/* Clean Legal Footnote */}
          <p className="m-0 text-[10.5px] text-gray-400 leading-[1.6] font-normal">
            Processed securely via Gemini. Subject to Google's{" "}
            <a
              href="https://policies.google.com/terms/generative-ai/use-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 font-medium text-gray-500"
            >
              Use Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

/* ═══ Elevated File Row Item (Google Drive / Cloud Style) ═══ */

interface FileRowItemProps {
  photo: UploadedPhoto;
  index: number;
  isReading: boolean;
  onRemove: () => void;
}

const FileRowItem: React.FC<FileRowItemProps> = ({ photo, index, isReading, onRemove }) => {
  const reducedMotion = usePrefersReducedMotion();
  const [entered, setEntered] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setEntered(true);
      return;
    }
    const t = window.setTimeout(() => setEntered(true), Math.min(index * 35, 280));
    return () => window.clearTimeout(t);
  }, [index, reducedMotion]);

  const isPdf = photo.name.toLowerCase().endsWith(".pdf");
  const fileSizeStr = photo.file ? formatFileSize(photo.file.size) : "";

  return (
    <li
      className="group relative border-b border-gray-100 overflow-hidden hover:bg-gray-50/70 transition-colors"
      style={{
        maxHeight: entered ? "48px" : "0px",
        opacity: entered ? 1 : 0,
        transition: reducedMotion
          ? "opacity 150ms linear"
          : "max-height 220ms var(--ease-out), opacity 220ms var(--ease-out)",
      }}
    >
      <div
        className="flex items-center justify-between py-2 px-1 text-[12.5px] leading-[1.2] tabular-nums gap-3"
        style={{
          transform: entered || reducedMotion ? "translateX(0)" : "translateX(-6px)",
          transition: reducedMotion ? "none" : "transform 220ms var(--ease-out)",
        }}
      >
        {/* Left: Format chip + Display name + File size */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span
            className={`shrink-0 font-mono text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
              isPdf
                ? "bg-red-50 text-red-600 border border-red-200/60"
                : "bg-blue-50 text-blue-600 border border-blue-200/60"
            }`}
          >
            {isPdf ? "PDF" : "IMG"}
          </span>

          <span className="truncate text-gray-900 font-normal tracking-[-0.005em]">
            {photo.displayName}
          </span>

          {fileSizeStr && (
            <span className="text-[10.5px] text-gray-400 font-mono shrink-0 hidden sm:inline">
              {fileSizeStr}
            </span>
          )}
        </div>

        {/* Right: Status badge & Remove button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {photo.status === "reading" && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#0047FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-ping" />
              <span>reading…</span>
            </span>
          )}

          {photo.status === "done" && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#137333] font-medium bg-[#E6F4EA] px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3 text-[#137333]" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2.5 8.5L6.2 12L13.5 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <RollingNumber value={photo.receiptsCount} />
              <span className="tracking-[-0.005em]">
                {isPdf
                  ? photo.receiptsCount === 1
                    ? "chapter"
                    : "chapters"
                  : photo.receiptsCount === 1
                    ? "receipt"
                    : "receipts"}
              </span>
            </span>
          )}

          {photo.status === "error" && (
            <span className="text-[10.5px] text-[#D93025] font-mono bg-[#FCE8E6] px-2 py-0.5 rounded-full">
              failed
            </span>
          )}

          {photo.status === "idle" && (
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
              staged
            </span>
          )}

          {!isReading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove ${photo.displayName}`}
              className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              title="Remove file"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Google Linear Progress Sweep */}
      {(photo.status === "reading" || photo.status === "done") && (
        <div className="absolute left-0 right-0 bottom-0 h-[2px] overflow-hidden pointer-events-none">
          <div
            className={`h-full w-full ${
              photo.status === "reading" ? "bg-[#0047FF] animate-sweep" : "bg-[#137333]"
            }`}
            style={{
              transformOrigin: "left center",
              transform: photo.status === "done" ? "scaleX(1)" : undefined,
              opacity: photo.status === "done" ? 0.7 : 0.9,
              transition:
                photo.status === "done"
                  ? "transform 220ms var(--ease-out), opacity 300ms var(--ease-out)"
                  : undefined,
            }}
          />
        </div>
      )}
    </li>
  );
};
