import React from "react";
import {
  BookOpen,
  Check,
  Clock,
  FileText,
  Folder,
  Lock,
  Mic,
  MoreHorizontal,
  Search,
  SquarePen,
  BarChart3,
  ArrowUp,
} from "lucide-react";

const risks = [
  { index: "01", title: "Supply concentration", note: "Two suppliers carry 61% of volume", page: "p. 24" },
  { index: "02", title: "Currency exposure", note: "Unhedged EUR revenue doubled", page: "p. 48" },
  { index: "03", title: "Customer churn", note: "Enterprise renewals soften in Q3", page: "p. 61" },
];

const chapters = [
  { index: "01", title: "Summary" },
  { index: "02", title: "Market overview" },
  { index: "03", title: "Risk factors" },
  { index: "04", title: "Financials" },
];

const railIcons = [
  { icon: SquarePen, label: "New chat", active: true },
  { icon: Folder, label: "Projects", active: false },
  { icon: BookOpen, label: "Chapters", active: false },
  { icon: BarChart3, label: "Benchmarks", active: false },
  { icon: Clock, label: "Scheduled", active: false },
];

/**
 * Pure CSS product window used in the features hero. It shows chat, document
 * chapters, and sources together so the "one place" idea reads at a glance.
 */
export const HeroWorkspaceMockup: React.FC = () => (
  <div className="relative overflow-hidden rounded-[18px] border border-black/[0.09] bg-white shadow-[0_48px_120px_-36px_rgba(15,23,42,0.42),0_12px_32px_-14px_rgba(15,23,42,0.18)] sm:rounded-[24px]">
    {/* Browser chrome */}
    <div className="flex h-10 items-center gap-3 border-b border-black/[0.07] bg-[#f7f7f8] px-3 sm:h-11 sm:px-4">
      <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#ff6a61] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#f4bd50] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#5cc78b] sm:h-2.5 sm:w-2.5" />
      </div>
      <div className="mx-auto flex min-w-0 max-w-[320px] flex-1 items-center justify-center gap-1.5 rounded-md border border-black/[0.06] bg-white px-3 py-1 text-[10px] text-neutral-500 sm:text-[11px]">
        <Lock className="h-2.5 w-2.5 shrink-0 text-neutral-400" />
        <span className="truncate">sara.app / workspace</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-neutral-400">
        <span className="hidden h-3.5 w-3.5 items-center justify-center rounded-full border border-neutral-300 sm:flex" />
        <MoreHorizontal className="h-3.5 w-3.5" />
      </div>
    </div>

    <div className="flex min-h-[390px] sm:min-h-[452px]">
      {/* Icon rail */}
      <aside
        aria-hidden="true"
        className="hidden w-[58px] shrink-0 flex-col items-center gap-1.5 border-r border-black/[0.06] bg-[#fbfbfc] py-4 sm:flex"
      >
        <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-[9px] bg-neutral-950 text-[12px] font-semibold text-white">
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
        <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#b6affe] to-[#509fff] text-[9px] font-semibold text-white">
          LG
        </span>
      </aside>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2 text-[11px] sm:text-[12px]">
            <span className="truncate font-medium text-neutral-900">Q3 launch review</span>
            <span className="hidden text-neutral-300 sm:inline">/</span>
            <span className="hidden truncate text-neutral-400 sm:inline">Annual report 2025</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-2 py-1 text-[9px] font-medium text-neutral-500 sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Private
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
          {/* User turn */}
          <div className="ml-auto flex w-full max-w-[430px] flex-col items-end">
            <div className="rounded-2xl rounded-tr-md bg-[#f2f2f3] px-3.5 py-2.5 text-[11px] leading-relaxed text-neutral-800 sm:px-4 sm:py-3 sm:text-[12.5px]">
              Read the annual report and pull out the three biggest risks.
            </div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-black/[0.07] bg-white px-2.5 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#eef4ff] text-[#2f91fd]">
                <FileText className="h-3 w-3" strokeWidth={1.8} />
              </span>
              <span className="text-[10px] font-medium text-neutral-700 sm:text-[11px]">
                annual-report-2025.pdf
              </span>
              <span className="text-[9px] text-neutral-400 sm:text-[10px]">112 pages</span>
            </div>
          </div>

          {/* Assistant turn */}
          <div className="mt-5 flex gap-2.5 sm:mt-6 sm:gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-neutral-950 text-[10px] font-semibold text-white sm:h-7 sm:w-7">
              s
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] text-neutral-400 sm:text-[11px]">
                <span className="font-medium text-neutral-800">Sara</span>
                <span>just now</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-700 sm:text-[12.5px]">
                I read all 112 pages. Three things stand out:
              </p>
              <div className="mt-2.5 space-y-1.5">
                {risks.map((risk) => (
                  <div
                    key={risk.index}
                    className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#fbfbfc] px-3 py-2"
                  >
                    <span className="font-mono text-[9px] text-neutral-400">{risk.index}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-medium text-neutral-900 sm:text-[11.5px]">
                        {risk.title}
                      </p>
                      <p className="truncate text-[9.5px] text-neutral-500 sm:text-[10.5px]">
                        {risk.note}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 font-mono text-[9px] text-neutral-500 ring-1 ring-black/[0.06]">
                      {risk.page}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-[9.5px] font-medium text-emerald-600 sm:text-[10px]">
                <Check className="h-3 w-3" strokeWidth={2.4} />
                Checked against the source
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="mt-auto pt-5">
            <div className="flex items-center gap-2 rounded-2xl border border-black/[0.09] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:px-3.5 sm:py-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-black/[0.08] text-[13px] leading-none text-neutral-400">
                +
              </span>
              <span className="min-w-0 flex-1 truncate text-[10px] text-neutral-400 sm:text-[11px]">
                Ask about this report…
              </span>
              <Mic className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
                <ArrowUp className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Context rail */}
      <aside className="hidden w-[216px] shrink-0 flex-col border-l border-black/[0.06] bg-[#fbfbfc] px-4 py-4 lg:flex">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Chapters
          </span>
          <Search className="h-3 w-3 text-neutral-400" />
        </div>
        <div className="mt-3 space-y-0.5">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.index}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10.5px] ${
                index === 2
                  ? "bg-white font-medium text-neutral-900 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.05]"
                  : "text-neutral-500"
              }`}
            >
              <span className="font-mono text-[9px] text-neutral-400">{chapter.index}</span>
              <span className="truncate">{chapter.title}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-black/[0.06] pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Sources
          </span>
          <div className="mt-2.5 space-y-1.5">
            {["Annual report 2025", "Q2 board notes"].map((source) => (
              <div
                key={source}
                className="flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-2 py-1.5"
              >
                <FileText className="h-3 w-3 shrink-0 text-neutral-400" />
                <span className="truncate text-[9.5px] text-neutral-600">{source}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-5 text-[9.5px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          112 pages indexed
        </div>
      </aside>
    </div>
  </div>
);
