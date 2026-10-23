import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FailedBatchInfo, UploadedPhoto } from "@charan-interiors/shared";
import { RisingWord, usePrefersReducedMotion } from "./MotionPrimitives";

export type ReadingPhase =
  "idle" | "reading_photos" | "checking_duplicates" | "adding_up" | "transitioning_out";

export interface LandingViewProps {
  onGetStarted?: () => void;
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

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
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

  const handleStart = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate("/chat");
    }
  };

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
  }, [onGetStarted, navigate]);

  const fadeIn = (step: number, delay = 0): React.CSSProperties => ({
    opacity: loadStep >= step ? 1 : 0,
    transform: loadStep >= step || reducedMotion ? "translateY(0)" : "translateY(10px)",
    transition: reducedMotion
      ? "opacity 150ms linear"
      : `opacity 360ms var(--ease-out) ${delay}ms, transform 360ms var(--ease-out) ${delay}ms`,
  });

  return (
    <div className="w-full min-h-screen md:h-screen flex flex-col md:grid md:grid-cols-12 bg-white overflow-x-hidden md:overflow-hidden select-none">
      {/* ═══ LEFT COLUMN ═══ Google Blue #0047FF — Pure Architectural Typography ═══ */}
      <div
        className="md:col-span-7 min-h-[460px] md:h-full flex flex-col justify-between relative z-10 overflow-hidden"
        style={{
          backgroundColor: "#0047FF",
          color: "#FFFFFF",
          padding: "clamp(24px, 3.6vw, 56px)",
          transformOrigin: "left top",
          transform: reducedMotion ? "none" : loadStep >= 1 ? "scaleX(1)" : "scaleX(0)",
          transition: reducedMotion ? "opacity 150ms linear" : "transform 640ms var(--ease-soft)",
        }}
      >
        {/* Subtle architectural grid guidelines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
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
        </div>

        {/* ── Bottom: Google Material Stepper (Pipeline Foundation Preserved) ── */}
        <div className="pt-6 relative z-10">
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
                  text: "Parse line items, merchants & tax tables",
                },
                {
                  num: 3 as const,
                  label: "Reconcile",
                  spec: "DETERMINISTIC CODE",
                  text: "Verify arithmetic totals & eliminate duplicate submissions",
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
                        ? "bg-white text-[#0047FF] font-bold shadow-sm"
                        : "bg-white/10 text-white/70 border border-white/25"
                    }`}
                  >
                    {`0${step.num}`}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium tracking-tight text-[13px] sm:text-[14px] text-white">
                        {step.label}
                      </span>
                      <span className="font-mono text-[8px] tracking-[0.16em] uppercase px-1.5 py-0.2 rounded bg-white/10 text-white/60 border border-white/10">
                        {step.spec}
                      </span>
                      {step.num === 1 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-auto" />
                      )}
                    </div>
                    <p className="m-0 mt-0.5 text-[12px] sm:text-[12.5px] leading-snug text-white/80">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT COLUMN ═══ Google Gallery White — Get Started Canvas ═══ */}
      <div
        className="md:col-span-5 min-h-[460px] md:h-full min-w-0 flex flex-col justify-between overflow-hidden bg-white text-[#1F1F1F]"
        style={{
          padding: "clamp(24px, 3.6vw, 56px)",
          transformOrigin: "center bottom",
          transform: reducedMotion ? "none" : loadStep >= 2 ? "scaleY(1)" : "scaleY(0)",
          opacity: 1,
          transition: reducedMotion ? "opacity 150ms linear" : "transform 540ms var(--ease-soft)",
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
              className="font-normal m-0 mb-4 text-[#1F1F1F]"
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
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#0047FF] hover:bg-[#0038CC] active:bg-[#002FA7] text-white text-[15px] sm:text-[16px] font-medium tracking-tight shadow-sm hover:shadow transition-all cursor-pointer select-none"
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

            <p className="m-0 mt-3.5 text-[12.5px] text-gray-500 font-normal">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-[11px] text-gray-700">
                Enter ↵
              </kbd>{" "}
              or click to open Chat Assistant
            </p>
          </div>
        </div>

        {/* ── Bottom: Legal Footnote ── */}
        <div className="flex flex-col gap-3 select-none pt-2" style={fadeIn(7)}>
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
