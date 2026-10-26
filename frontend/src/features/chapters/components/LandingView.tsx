import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getChatModels,
  modelSupportsInput,
  PROVIDER_CATALOG,
  type FailedBatchInfo,
  type UploadedPhoto,
} from "@charan-interiors/contracts";
import { RisingWord } from "../../../app/components/MotionPrimitives";
import { usePrefersReducedMotion } from "../../../app/hooks/usePrefersReducedMotion";

export type ReadingPhase =
  "idle" | "reading_photos" | "checking_duplicates" | "adding_up" | "transitioning_out";

export interface LandingViewProps {
  onGetStarted?: () => void;
  receiptModel: string;
  onReceiptModelChange: (model: string) => void;
  photos?: UploadedPhoto[];
  privacyAccepted?: boolean;
  readingPhase?: ReadingPhase;
  totalReceiptsFound?: number;
  recentDiscoveries?: Array<{
    merchant: string;
    total: number | null;
    currency: string;
  }>;
  failedBatches?: FailedBatchInfo[];
  connectedEmail?: string | null;
  onAddFiles?: (files: FileList | File[]) => void;
  onRemovePhoto?: (id: string) => void;
  onTogglePrivacy?: () => void;
  onStartVisualise?: () => void;
  onRetryFailedBatches?: () => void;
  onOpenWorkspaceModal?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onGetStarted,
  receiptModel,
  onReceiptModelChange,
}) => {
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const [loadStep, setLoadStep] = useState<number>(reducedMotion ? 10 : 0);
  const [ctaHovered, setCtaHovered] = useState(false);

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

  const handleStart = useCallback(() => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate("/chat");
    }
  }, [navigate, onGetStarted]);

  /* ── Keyboard shortcut: Enter key triggers get started ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStart]);

  const fadeIn = (step: number, delay = 0): React.CSSProperties => ({
    opacity: loadStep >= step ? 1 : 0,
    transform: loadStep >= step || reducedMotion ? "translateY(0)" : "translateY(10px)",
    transition: reducedMotion
      ? "opacity 150ms linear"
      : `opacity 360ms var(--ease-out) ${delay}ms, transform 360ms var(--ease-out) ${delay}ms`,
  });

  return (
    <div className="w-full min-h-screen md:h-screen flex flex-col md:grid md:grid-cols-12 bg-white overflow-x-hidden md:overflow-hidden select-none">
      {/* ═══ LEFT COLUMN ═══ Clean Slate Architectural Typography ═══ */}
      <div
        className="md:col-span-7 min-h-[460px] md:h-full flex flex-col justify-between relative z-10 overflow-hidden bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/80 text-slate-900"
        style={{
          padding: "clamp(24px, 3.6vw, 56px)",
        }}
      >
        {/* Subtle architectural grid guidelines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* ── Top: Identity + Status Header ── */}
        <div className="flex flex-col relative z-10">
          {/* Provenance Header */}
          <div
            className="mb-5 sm:mb-8 flex flex-wrap items-center justify-between gap-3"
            style={fadeIn(3)}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[9px] sm:text-[9.5px] tracking-[0.24em] text-slate-500 uppercase font-medium">
                Document &amp; Expense Audit
              </span>
            </div>
          </div>

          {/* Monumental Wordmark (Foundational) */}
          <h1
            className="m-0 tracking-[-0.05em] font-semibold leading-[0.82] text-slate-950"
            style={{
              fontSize: "clamp(48px, 9vw, 122px)",
            }}
          >
            <RisingWord
              text="Shoebox"
              visible={loadStep >= 4}
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
            <span className="text-slate-900 block font-medium">
              Drop documents &amp; receipts in.
            </span>
            <span className="text-slate-500 font-normal block mt-0.5">
              Get audited ledgers out.
            </span>
          </p>

          {/* Capability Strip */}
          <div
            className="mt-4 sm:mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] sm:text-[10.5px] font-mono tracking-[0.14em] text-slate-500 uppercase"
            style={fadeIn(6, 100)}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              Deterministic Code Audit
            </span>
            <span className="text-slate-300">·</span>
            <span>Multi-Page Statement OCR</span>
            <span className="text-slate-300">·</span>
            <span>Zero Data Persistence</span>
          </div>
        </div>

        {/* ── Bottom: Pipeline Stepper ── */}
        <div className="pt-6 relative z-10">
          <div className="mb-4">
            <h2
              className="m-0 tracking-[-0.02em] font-medium text-slate-900 text-[15px] sm:text-[18px]"
              style={fadeIn(7)}
            >
              Pipeline verification
            </h2>
          </div>

          <div className="relative">
            {/* Stepper connecting vertical track */}
            <div className="absolute left-[13px] top-3.5 bottom-3.5 w-[1px] bg-slate-200 pointer-events-none" />

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
                  text: "Parse line items, merchants & tax tables",
                },
                {
                  num: 3 as const,
                  label: "Reconcile",
                  spec: "CODE + MODEL REVIEW",
                  text: "Verify arithmetic totals & review likely duplicate submissions",
                },
              ].map((step, idx) => (
                <li
                  key={step.num}
                  className="flex items-start gap-3.5 leading-[1.35]"
                  style={fadeIn(7, (idx + 1) * 70)}
                >
                  <div
                    className={`w-[27px] h-[27px] rounded-full shrink-0 flex items-center justify-center font-mono text-[10.5px] transition-all duration-200 ${
                      step.num === 1
                        ? "bg-slate-950 text-white font-bold shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 shadow-xs"
                    }`}
                  >
                    {`0${step.num}`}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium tracking-tight text-[13px] sm:text-[14px] text-slate-900">
                        {step.label}
                      </span>
                      <span className="font-mono text-[8px] tracking-[0.16em] uppercase px-1.5 py-0.2 rounded bg-white text-slate-500 border border-slate-200">
                        {step.spec}
                      </span>
                      {step.num === 1 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-auto" />
                      )}
                    </div>
                    <p className="m-0 mt-0.5 text-[12px] sm:text-[12.5px] leading-snug text-slate-600">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT COLUMN ═══ Clean Modern Action Canvas ═══ */}
      <div
        className="md:col-span-5 min-h-[460px] md:h-full min-w-0 flex flex-col justify-between overflow-hidden bg-white text-slate-900"
        style={{
          padding: "clamp(24px, 3.6vw, 56px)",
        }}
      >
        {/* ── Top: Right-column Provenance Bar ── */}
        <div
          className="flex items-center justify-between select-none pb-2 border-b border-slate-100"
          style={fadeIn(3)}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] sm:text-[9.5px] tracking-[0.24em] text-slate-400 uppercase font-medium">
              Ingestion
            </span>
          </div>

          <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase tabular-nums text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-semibold">
            READY
          </span>
        </div>

        {/* ── Center: Clean & Neat Get Started Action ── */}
        <div className="relative z-10 w-full flex-1 flex flex-col justify-center my-auto min-h-0 py-6 sm:py-8">
          <div
            className="flex-1 flex flex-col items-start justify-center max-w-[420px]"
            style={fadeIn(5)}
          >
            {/* Clean Direct Headline */}
            <h2
              className="font-normal m-0 mb-4 text-slate-950"
              style={{
                fontSize: "clamp(26px, 3vw, 40px)",
                letterSpacing: "-0.038em",
                lineHeight: 1.12,
              }}
            >
              Get started
            </h2>

            {/* Single Clean Primary Action Button */}
            <button
              type="button"
              onClick={handleStart}
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
              aria-label="Get started"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-900 text-white text-[15px] sm:text-[16px] font-medium tracking-tight shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer select-none"
            >
              <span>Get started</span>
              <span
                className="inline-block transition-transform duration-200 ease-out font-mono text-[14px]"
                style={{
                  transform: ctaHovered ? "translateX(3px)" : "translateX(0)",
                }}
              >
                →
              </span>
            </button>

            <p className="m-0 mt-3.5 text-[12.5px] text-slate-500 font-normal">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
                Enter ↵
              </kbd>{" "}
              or click to open Chat Assistant
            </p>
            <label className="mt-5 flex flex-col gap-1.5 text-[12px] text-slate-600">
              <span>Receipt and duplicate review model</span>
              <select
                aria-label="Receipt and duplicate review model"
                value={receiptModel}
                onChange={(event) => onReceiptModelChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
              >
                {getChatModels()
                  .filter(
                    (model) =>
                      model.catalogStatus === "verified" && modelSupportsInput(model.id, "image")
                  )
                  .map((model) => (
                    <option key={model.id} value={model.id}>
                      {`${model.name} (${PROVIDER_CATALOG[model.provider].name})`}
                    </option>
                  ))}
              </select>
              <span>
                Choose an image-capable model. Connect its provider key in Customize → Providers.
              </span>
            </label>
          </div>
        </div>

        {/* ── Bottom: Legal Footnote ── */}
        <div className="flex flex-col gap-3 select-none pt-2" style={fadeIn(7)}>
          <p className="m-0 text-[10.5px] text-slate-400 leading-[1.6] font-normal">
            Receipt extraction and duplicate review use the selected image-capable model and its
            connected provider key; configure it in Customize → Providers. Searchable PDF parsing
            runs locally, with Gemini as an optional fallback for scanned or unsupported documents.
            Gemini requests are subject to Google&apos;s{" "}
            <a
              href="https://policies.google.com/terms/generative-ai/use-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-700 font-medium text-slate-500"
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
