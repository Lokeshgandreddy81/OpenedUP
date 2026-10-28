import React from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Folder,
  GitPullRequest,
  ListTree,
  Lock,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Search,
  Sparkles,
  SquarePen,
  BarChart3,
  Clock,
  Terminal,
} from "lucide-react";
import type { ModeId } from "../../data/featuresContent";

export interface ModeVisualProps {
  mode: ModeId;
}

const railIcons = [
  { icon: SquarePen, label: "New chat", active: true },
  { icon: Folder, label: "Projects", active: false },
  { icon: BookOpen, label: "Chapters", active: false },
  { icon: BarChart3, label: "Benchmarks", active: false },
  { icon: Clock, label: "Scheduled", active: false },
];

export const ModeVisual: React.FC<ModeVisualProps> = ({ mode }) => (
  <div key={mode} className="feature-rise h-full">
    {mode === "chat" && <ChatVisual />}
    {mode === "study" && <StudyVisual />}
    {mode === "build" && <BuildVisual />}
  </div>
);

const BrowserChrome: React.FC<{ url: string; badge?: string; dark?: boolean }> = ({
  url,
  badge,
  dark = false,
}) => (
  <div
    className={`flex h-10 items-center gap-3 border-b px-3 sm:h-11 sm:px-4 ${
      dark ? "border-white/10 bg-[#161b22]" : "border-black/[0.07] bg-[#f7f7f8]"
    }`}
  >
    <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-[#ff6a61] sm:h-2.5 sm:w-2.5" />
      <span className="h-2 w-2 rounded-full bg-[#f4bd50] sm:h-2.5 sm:w-2.5" />
      <span className="h-2 w-2 rounded-full bg-[#5cc78b] sm:h-2.5 sm:w-2.5" />
    </div>
    <div
      className={`mx-auto flex min-w-0 max-w-[320px] flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1 text-[10px] sm:text-[11px] ${
        dark
          ? "border-white/10 bg-black/40 text-neutral-300"
          : "border-black/[0.06] bg-white text-neutral-500"
      }`}
    >
      <Lock className="h-2.5 w-2.5 shrink-0 opacity-60" />
      <span className="truncate">{url}</span>
    </div>
    <div className="flex shrink-0 items-center gap-2 text-neutral-400">
      {badge && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-medium sm:text-[10px] ${
            dark
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-black/[0.06] bg-white text-neutral-500"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {badge}
        </span>
      )}
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  </div>
);

const ChatVisual: React.FC = () => (
  <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-[22px] border border-black/[0.09] bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.28)] sm:min-h-[574px] sm:rounded-[24px]">
    <BrowserChrome url="sara.app / workspace" badge="Private" />

    <div className="flex min-h-[440px] flex-1">
      {/* Icon rail */}
      <aside
        aria-hidden="true"
        className="hidden w-[54px] shrink-0 flex-col items-center gap-1.5 border-r border-black/[0.06] bg-[#fbfbfc] py-3.5 sm:flex"
      >
        <span className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-[9px] bg-neutral-950 text-[12px] font-semibold text-white">
          s
        </span>
        {railIcons.map(({ icon: Icon, label, active }) => (
          <span
            key={label}
            title={label}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              active
                ? "bg-white text-neutral-900 shadow-[0_1px_3px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.05]"
                : "text-neutral-400"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
        ))}
      </aside>

      {/* Main chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Thread header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-800 sm:text-[12px]">
            <MessageSquare className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.8} />
            Q3 launch review
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-[#fafafa] px-2.5 py-1 text-[10px] font-medium text-neutral-600">
            Argon
            <ChevronDown className="h-3 w-3 text-neutral-400" />
          </span>
        </div>

        {/* Conversation turns */}
        <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
          {/* User message */}
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-[#f2f2f3] px-3.5 py-2.5 text-[11px] leading-relaxed text-neutral-800 sm:text-[12px]">
            Which model should I use to summarize this 112-page report?
          </div>

          {/* Assistant message */}
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-neutral-950 text-[10px] font-semibold text-white">
              s
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] leading-relaxed text-neutral-700 sm:text-[12.5px]">
                For a document that long, start with Argon for speed, then switch to a reasoning model
                if you need a deeper read. The thread, context, and files stay put when you switch.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {["Argon", "Opus 5.5", "Fable 5.1"].map((model, index) => (
                  <span
                    key={model}
                    className={`rounded-full px-2.5 py-1 text-[9.5px] font-medium ${
                      index === 0
                        ? "bg-neutral-950 text-white"
                        : "border border-black/[0.07] bg-white text-neutral-600"
                    }`}
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9.5px] font-medium text-[#2f91fd]">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            Switched model mid-thread · context kept
          </div>

          {/* Suggestion pills & Composer */}
          <div className="mt-auto flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {["Compare the top risks", "Draft a one-page summary", "Cite page numbers"].map(
                (suggestion) => (
                  <span
                    key={suggestion}
                    className="rounded-full border border-black/[0.07] bg-white px-2.5 py-1 text-[9.5px] font-medium text-neutral-600 shadow-2xs"
                  >
                    {suggestion}
                  </span>
                )
              )}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-black/[0.09] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:px-3.5 sm:py-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-black/[0.08] text-[13px] leading-none text-neutral-400">
                +
              </span>
              <span className="min-w-0 flex-1 truncate text-[10.5px] text-neutral-400 sm:text-[11px]">
                Ask a follow-up…
              </span>
              <Mic className="h-3.5 w-3.5 text-neutral-400" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-white">
                <ArrowUp className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StudyVisual: React.FC = () => (
  <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-[22px] border border-black/[0.09] bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.28)] sm:min-h-[574px] sm:rounded-[24px]">
    <BrowserChrome url="sara.app / study" badge="112 pages" />

    <div className="flex min-h-[440px] flex-1">
      {/* Icon rail */}
      <aside
        aria-hidden="true"
        className="hidden w-[54px] shrink-0 flex-col items-center gap-1.5 border-r border-black/[0.06] bg-[#fbfbfc] py-3.5 sm:flex"
      >
        <span className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-[9px] bg-neutral-950 text-[12px] font-semibold text-white">
          s
        </span>
        {railIcons.map(({ icon: Icon, label }, idx) => (
          <span
            key={label}
            title={label}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              idx === 2
                ? "bg-white text-neutral-900 shadow-[0_1px_3px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.05]"
                : "text-neutral-400"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
        ))}
      </aside>

      {/* Main split study area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef4ff] text-[#2f91fd]">
              <FileText className="h-3 w-3" strokeWidth={1.8} />
            </span>
            <span className="truncate text-[11px] font-medium text-neutral-800 sm:text-[12px]">
              annual-report-2025.pdf
            </span>
          </div>
          <span className="shrink-0 rounded-full border border-black/[0.06] bg-[#fafafa] px-2 py-0.5 font-mono text-[9px] text-neutral-500">
            PDF · 4 CHAPTERS
          </span>
        </div>

        <div className="grid flex-1 gap-4 p-4 sm:grid-cols-[0.8fr_1.2fr] sm:p-5">
          {/* PDF Page Preview */}
          <div className="hidden flex-col rounded-xl border border-black/[0.06] bg-[#fbfbfc] p-3 sm:flex">
            <div className="flex flex-1 flex-col rounded-lg border border-black/[0.05] bg-white p-3.5 shadow-xs">
              <span className="font-mono text-[8.5px] text-neutral-400">PAGE 48</span>
              <p className="mt-2 text-[11px] font-semibold leading-snug text-neutral-900">
                Risk factors &amp; dependencies
              </p>
              <div className="mt-3 space-y-1.5">
                <span className="block h-1.5 w-[94%] rounded bg-neutral-100" />
                <span className="block h-1.5 w-[88%] rounded bg-neutral-100" />
                <span className="block h-1.5 w-[91%] rounded bg-neutral-100" />
                <span className="block h-1.5 w-[76%] rounded bg-neutral-100" />
              </div>
              <div className="mt-3 rounded-md bg-[#eef4ff] px-2.5 py-2">
                <span className="block h-1.5 w-[92%] rounded bg-[#c9dcff]" />
                <span className="mt-1.5 block h-1.5 w-[75%] rounded bg-[#c9dcff]" />
              </div>
              <div className="mt-2 space-y-1.5">
                <span className="block h-1.5 w-[86%] rounded bg-neutral-100" />
                <span className="block h-1.5 w-[92%] rounded bg-neutral-100" />
                <span className="block h-1.5 w-[64%] rounded bg-neutral-100" />
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between font-mono text-[8.5px] text-neutral-400">
              <span>Page 48</span>
              <span>112 total</span>
            </div>
          </div>

          {/* Chapters Rail & Key Passage */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between text-[9.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <ListTree className="h-3 w-3" strokeWidth={1.8} />
                Chapters
              </span>
              <Search className="h-3 w-3" />
            </div>

            <div className="mt-2 space-y-1">
              {["01 Summary", "02 Market overview", "03 Risk factors", "04 Financials"].map(
                (chapter, index) => (
                  <div
                    key={chapter}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] ${
                      index === 2
                        ? "bg-[#eef4ff] font-medium text-[#1c63d6] ring-1 ring-[#c9dcff]"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <span>{chapter}</span>
                    {index === 2 && <span className="font-mono text-[8.5px]">P. 48</span>}
                  </div>
                )
              )}
            </div>

            <div className="mt-3 rounded-xl border border-black/[0.07] bg-[#fbfbfc] p-3 sm:mt-4">
              <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                <BookOpen className="h-3 w-3" strokeWidth={1.8} />
                Key passage citation
              </div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-neutral-700">
                “Two suppliers now account for 61% of total volume, leaving the group exposed to a
                single-region disruption.”
              </p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-mono text-[8.5px] text-neutral-600 ring-1 ring-black/[0.06]">
                p. 48 · verified source
              </span>
            </div>

            <div className="mt-auto pt-3">
              <div className="flex items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-3 py-2 shadow-xs">
                <MessageSquare className="h-3 w-3 shrink-0 text-[#2f91fd]" />
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-neutral-400">
                  Ask about Chapter 3…
                </span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
                  <ArrowUp className="h-2.5 w-2.5" strokeWidth={2.4} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BuildVisual: React.FC = () => (
  <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-[22px] border border-black/20 bg-[#0c1017] text-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.55)] sm:min-h-[574px] sm:rounded-[24px]">
    <BrowserChrome url="sara.app / build" badge="Agent active" dark />

    <div className="flex min-h-[440px] flex-1">
      {/* Icon rail */}
      <aside
        aria-hidden="true"
        className="hidden w-[54px] shrink-0 flex-col items-center gap-1.5 border-r border-white/10 bg-[#080c12] py-3.5 sm:flex"
      >
        <span className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-[9px] bg-white text-[12px] font-semibold text-black">
          s
        </span>
        {railIcons.map(({ icon: Icon, label }, idx) => (
          <span
            key={label}
            title={label}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              idx === 1 ? "bg-white/15 text-white" : "text-neutral-500"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
        ))}
      </aside>

      {/* Main build agent column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-200 sm:text-[12px]">
            <Terminal className="h-3.5 w-3.5 text-[#4d83ff]" strokeWidth={1.8} />
            Agent run
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[8.5px] text-neutral-400">
              LIVE
            </span>
          </div>
          <span className="font-mono text-[9.5px] text-neutral-400">main → feat/checkout</span>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-6">
          {/* Progress Steps */}
          <div className="flex flex-col gap-2">
            {[
              { label: "Planned the change across 4 files", done: true },
              { label: "Reused the pending order on retry", done: true },
              { label: "Running checkout integration tests", done: false },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-2.5 text-[10.5px] text-neutral-300">
                <span
                  className={`flex h-4.5 w-4.5 items-center justify-center rounded-full ${
                    step.done
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-[#2f91fd]/15 text-[#6ea0ff]"
                  }`}
                >
                  {step.done ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={2.8} />
                  ) : (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6ea0ff]" />
                  )}
                </span>
                {step.label}
              </div>
            ))}
          </div>

          {/* Syntax-highlighted Diff snippet */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50 font-mono text-[9.5px] leading-[1.7] sm:text-[10px]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[8.5px] text-neutral-400">
              <span>src/checkout/order.ts</span>
              <span className="text-emerald-400">+12 / -2</span>
            </div>
            <div className="px-3 py-2.5">
              <div className="text-neutral-500">
                <span className="inline-block w-5 text-neutral-600">41</span>
                const existing = await findPendingOrder(cart);
              </div>
              <div className="text-rose-400/90">
                <span className="inline-block w-5 text-rose-500/60">42</span>
                - if (!existing) await createOrder(cart);
              </div>
              <div className="text-emerald-400/90">
                <span className="inline-block w-5 text-emerald-500/60">42</span>
                + return existing ?? (await createOrder(cart));
              </div>
              <div className="text-neutral-400">
                <span className="inline-block w-5 text-neutral-600">43</span>
                const payment = await startPayment(order);
              </div>
            </div>
          </div>

          {/* Review status bar */}
          <div className="mt-auto flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Check className="h-3 w-3" strokeWidth={2.6} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] font-medium text-white">Ready for review</p>
                <p className="truncate text-[9px] text-neutral-400">14 tests passing · 0 conflicts</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-[9.5px] font-medium text-neutral-950">
              <GitPullRequest className="h-2.5 w-2.5" strokeWidth={2} />
              View diff
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
