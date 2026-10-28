import React, { useState } from "react";
import { ArrowRight, Check, FileText } from "lucide-react";

type PreviewMode = "audit" | "study" | "workspace";

const previewModes: Array<{ id: PreviewMode; label: string }> = [
  { id: "audit", label: "Spend audit" },
  { id: "study", label: "PDF study" },
  { id: "workspace", label: "AI workspace" },
];

export const LandingProductPreview: React.FC = () => {
  const [mode, setMode] = useState<PreviewMode>("audit");

  return (
    <div className="overflow-hidden rounded-[25px] border border-white/10 bg-[#0c1017] shadow-[0_32px_90px_rgba(0,0,0,0.8),0_4px_14px_rgba(0,0,0,0.4)] sm:rounded-[29px]">
      <div className="flex h-11 items-center gap-3 border-b border-white/10 bg-black/40 px-4 sm:h-[50px] sm:px-5">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff6a61]" />
          <span className="h-2 w-2 rounded-full bg-[#f4bd50]" />
          <span className="h-2 w-2 rounded-full bg-[#5cc78b]" />
        </div>
        <span className="mx-auto truncate rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-[8px] tracking-[0.08em] text-slate-400 sm:text-[9px]">
          openedup / workspace
        </span>
        <span className="w-8 text-right font-mono text-[8px] tracking-[0.08em] text-slate-400 sm:w-10 sm:text-[9px]">
          LOCAL
        </span>
      </div>

      <div className="flex min-h-[370px] sm:min-h-[414px]">
        <aside
          aria-hidden="true"
          className="flex w-[42px] shrink-0 flex-col items-center gap-3 border-r border-white/10 bg-black/30 py-4 sm:w-[54px] sm:gap-4 sm:py-5"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-[#0047ff] text-[12px] font-semibold text-white">
            o
          </span>
          <span className="mt-2 h-6 w-6 rounded-lg bg-[#0047ff]/20 ring-1 ring-[#0047ff]/40" />
          <span className="h-6 w-6 rounded-lg border border-white/10 bg-white/5" />
          <span className="h-6 w-6 rounded-lg border border-white/10 bg-white/5" />
          <span className="mt-auto h-6 w-6 rounded-full border border-white/10 bg-white/5" />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="m-0 truncate text-[10px] font-semibold tracking-[-0.01em] text-white sm:text-[11px]">
                Workspace overview
              </p>
              <p className="m-0 mt-0.5 truncate font-mono text-[7px] tracking-[0.08em] text-slate-400 sm:text-[8px]">
                SHOEBOX · DOCUMENT STUDY · CHAT
              </p>
            </div>
            <span className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-[7px] tracking-[0.08em] text-slate-300 sm:text-[8px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> SAMPLE
            </span>
          </div>

          <div className="p-3 sm:p-5">
            <div
              role="group"
              aria-label="Sample product tour"
              className="mb-3 flex gap-1 rounded-xl bg-white/[0.05] p-1 sm:mb-4"
            >
              {previewModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mode === item.id}
                  onClick={() => setMode(item.id)}
                  className={`min-w-0 flex-1 rounded-lg px-1.5 py-2 text-[8px] font-semibold transition sm:px-2 sm:text-[9px] ${
                    mode === item.id
                      ? "bg-white/15 text-white shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div aria-live="polite" className="min-h-[285px] sm:min-h-[306px]">
              {mode === "audit" && <SpendAuditPreview />}
              {mode === "study" && <PdfStudyPreview />}
              {mode === "workspace" && <WorkspacePreview />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpendAuditPreview: React.FC = () => (
  <div>
    <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
      <div>
        <p className="m-0 font-mono text-[7px] tracking-[0.12em] text-slate-400 sm:text-[8px]">
          BATCH REVIEW · 08 FILES
        </p>
        <h3 className="m-0 mt-1 text-[16px] font-semibold tracking-[-0.055em] text-white sm:text-[20px]">
          April expense audit
        </h3>
      </div>
      <span className="rounded-full border border-emerald-800/40 bg-emerald-950/60 px-2 py-1 font-mono text-[7px] tracking-[0.08em] text-emerald-400 sm:text-[8px]">
        READY TO REVIEW
      </span>
    </div>

    <div className="grid grid-cols-[1.12fr_0.88fr] gap-2 sm:gap-3">
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[16px] sm:p-4">
        <p className="m-0 font-mono text-[7px] tracking-[0.11em] text-slate-400 sm:text-[8px]">
          RECONCILED AMOUNT · SAMPLE USD
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-[21px] font-semibold tracking-[-0.065em] text-white sm:text-[27px]">
            $2,481.60
          </span>
          <span className="mb-1 inline-flex items-center gap-1 font-mono text-[7px] text-emerald-400 sm:text-[8px]">
            <Check size={10} /> CHECKED
          </span>
        </div>
        <div className="mt-3 flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-white/10">
          <span className="w-[34%] rounded-full bg-[#0047ff]" />
          <span className="w-[24%] rounded-full bg-[#4d83ff]" />
          <span className="w-[20%] rounded-full bg-[#86aaff]" />
          <span className="w-[22%] rounded-full bg-[#d9e4ff]" />
        </div>
        <div className="mt-3 flex justify-between font-mono text-[7px] text-slate-400 sm:text-[8px]">
          <span>4 transactions</span>
          <span>1 duplicate flagged</span>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[14px] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[16px] sm:p-4">
        <div>
          <p className="m-0 font-mono text-[7px] tracking-[0.11em] text-slate-400 sm:text-[8px]">
            AUDIT CHECKS
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-950/80 text-emerald-400">
              <Check size={12} />
            </span>
            <span className="text-[8px] font-medium text-slate-300 sm:text-[9px]">
              Totals verified
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-950/80 text-[10px] text-amber-400">
              !
            </span>
            <span className="text-[8px] font-medium text-slate-300 sm:text-[9px]">
              Possible duplicate
            </span>
          </div>
        </div>
        <span className="mt-4 text-[7px] leading-relaxed text-slate-400 sm:text-[8px]">
          Illustrative preview, not a live audit.
        </span>
      </div>
    </div>

    <div className="mt-2 overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.03] sm:mt-3 sm:rounded-[16px]">
      <div className="grid grid-cols-[1fr_auto] border-b border-white/10 px-3 py-2 font-mono text-[7px] tracking-[0.1em] text-slate-400 sm:px-4 sm:text-[8px]">
        <span>DOCUMENT</span>
        <span>STATUS</span>
      </div>
      {[
        ["Northstar · receipt 01.jpg", "Verified", "text-emerald-400"],
        ["Fieldnote · receipt 02.jpg", "Verified", "text-emerald-400"],
        ["Vela · receipt 03.jpg", "Review match", "text-amber-400"],
      ].map(([name, status, color]) => (
        <div
          key={name}
          className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-white/5 px-3 py-2 last:border-b-0 sm:px-4"
        >
          <span className="truncate text-[8px] text-slate-300 sm:text-[9px]">{name}</span>
          <span className={`font-mono text-[7px] ${color} sm:text-[8px]`}>{status}</span>
        </div>
      ))}
    </div>
  </div>
);

const PdfStudyPreview: React.FC = () => (
  <div>
    <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
      <div>
        <p className="m-0 font-mono text-[7px] tracking-[0.12em] text-slate-400 sm:text-[8px]">
          CHAPTER STUDY · SAMPLE PDF
        </p>
        <h3 className="m-0 mt-1 truncate text-[16px] font-semibold tracking-[-0.055em] text-white sm:text-[20px]">
          Annual report 2025
        </h3>
      </div>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-[7px] text-slate-400 sm:text-[8px]">
        112 PAGES
      </span>
    </div>

    <div className="grid min-h-[236px] grid-cols-[0.9fr_1.1fr] gap-2 sm:min-h-[258px] sm:gap-3">
      <div className="rounded-[14px] border border-white/10 bg-white/[0.02] p-3 sm:rounded-[16px] sm:p-4">
        <p className="m-0 font-mono text-[7px] tracking-[0.1em] text-slate-400 sm:text-[8px]">
          CHAPTERS
        </p>
        {["Summary", "Market overview", "Risk factors", "Financials"].map((chapter, index) => (
          <div
            key={chapter}
            className={`mt-2 flex items-center gap-2 rounded-lg px-2 py-2 ${index === 2 ? "border border-[#0047ff]/40 bg-[#0047ff]/20 text-[#6095ff]" : "text-slate-400"}`}
          >
            <span className="font-mono text-[7px] opacity-70">0{index + 1}</span>
            <span className="truncate text-[8px] font-medium sm:text-[9px]">{chapter}</span>
          </div>
        ))}
      </div>
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[16px] sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[7px] tracking-[0.1em] text-[#4d83ff] sm:text-[8px]">
            CHAPTER 03
          </span>
          <span className="font-mono text-[7px] text-slate-400 sm:text-[8px]">P. 48–61</span>
        </div>
        <h4 className="mb-2 mt-3 text-[12px] font-semibold tracking-[-0.03em] text-white sm:text-[14px]">
          Risk factors
        </h4>
        <div className="space-y-1.5">
          <span className="block h-1.5 w-[96%] rounded bg-white/10" />
          <span className="block h-1.5 w-[91%] rounded bg-white/10" />
          <span className="block h-1.5 w-[84%] rounded bg-white/10" />
          <span className="block h-1.5 w-[93%] rounded bg-white/10" />
          <span className="block h-1.5 w-[70%] rounded bg-white/10" />
        </div>
        <div className="mt-4 rounded-lg border border-[#0047ff]/30 bg-[#0047ff]/10 p-2.5 sm:p-3">
          <p className="m-0 font-mono text-[7px] tracking-[0.08em] text-[#4d83ff] sm:text-[8px]">
            ASK WITH THIS CHAPTER
          </p>
          <p className="m-0 mt-1.5 text-[8px] leading-relaxed text-slate-300 sm:text-[9px]">
            What changed in the company&apos;s exposure this year?
          </p>
        </div>
      </div>
    </div>
    <p className="mb-0 mt-2 text-[7px] text-slate-400 sm:mt-3 sm:text-[8px]">
      Illustrative chapter view. Source text remains the reference.
    </p>
  </div>
);

const WorkspacePreview: React.FC = () => (
  <div>
    <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
      <div>
        <p className="m-0 font-mono text-[7px] tracking-[0.12em] text-slate-400 sm:text-[8px]">
          PROJECT · FOLLOW-THROUGH
        </p>
        <h3 className="m-0 mt-1 text-[16px] font-semibold tracking-[-0.055em] text-white sm:text-[20px]">
          Quarter close review
        </h3>
      </div>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-[7px] text-slate-400 sm:text-[8px]">
        PRIVATE
      </span>
    </div>

    <div className="flex min-h-[236px] flex-col gap-2 rounded-[14px] border border-white/10 bg-white/[0.02] p-3 sm:min-h-[258px] sm:gap-3 sm:rounded-[16px] sm:p-4">
      <div className="flex max-w-[88%] gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#0047ff]/30 bg-[#0047ff]/20 text-[#6095ff]">
          <FileText size={12} />
        </span>
        <div className="rounded-xl rounded-tl-sm border border-white/10 bg-white/[0.05] p-2.5 sm:p-3">
          <p className="m-0 font-mono text-[7px] tracking-[0.1em] text-slate-400 sm:text-[8px]">
            YOU · 10:42 AM
          </p>
          <p className="m-0 mt-1 text-[8px] leading-relaxed text-slate-200 sm:text-[9px]">
            Compare the receipt totals with the attached statement and list anything that needs
            review.
          </p>
        </div>
      </div>

      <div className="ml-auto flex max-w-[92%] gap-2.5">
        <div className="rounded-xl rounded-tr-sm border border-[#0047ff]/30 bg-[#0047ff]/10 p-2.5 sm:p-3">
          <p className="m-0 font-mono text-[7px] tracking-[0.1em] text-[#4d83ff] sm:text-[8px]">
            OPENEDUP · SAMPLE
          </p>
          <p className="m-0 mt-1 text-[8px] leading-relaxed text-slate-200 sm:text-[9px]">
            I found one amount that differs by $18.40. I linked the source rows and drafted a review
            note.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[7px] text-slate-300 sm:text-[8px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0047ff]" /> Review note · draft
          </div>
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-[8px] font-semibold text-white">
          o
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="text-[8px] text-slate-400 sm:text-[9px]">Ask about the documents…</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0047ff] text-white">
          <ArrowRight size={12} />
        </span>
      </div>
    </div>
    <p className="mb-0 mt-2 text-[7px] text-slate-400 sm:mt-3 sm:text-[8px]">
      Illustrative workspace conversation. No model is called.
    </p>
  </div>
);
