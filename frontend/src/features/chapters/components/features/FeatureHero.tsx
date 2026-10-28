import React from "react";
import {
  ArrowLeft,
  ArrowUp,
  BarChart3,
  BookOpen,
  Copy,
  FileText,
  GitFork,
  Mic,
  PanelLeft,
  Plus,
  RefreshCw,
  Shapes,
  Share2,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Reveal } from "./Reveal";

export interface FeatureHeroProps {
  onGetStarted: () => void;
}

const ProjectsIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = "text-slate-600 shrink-0",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 4h14" />
    <path d="M5 8h14" />
    <path d="M4 12h16l-1 7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l-1-7Z" />
  </svg>
);

export const FeatureHero: React.FC<FeatureHeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-10 sm:pt-28 sm:pb-12">
      {/* Exact main-hero celestial sky & periwinkle palette, controlled height, single layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] sm:h-[580px]"
        style={{
          backgroundImage: [
            "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 55%, #ffffff 100%)",
            "radial-gradient(circle at 82% 18%, rgba(182, 175, 254, 0.70) 0%, rgba(131, 141, 255, 0.42) 36%, rgba(162, 180, 250, 0.18) 55%, transparent 75%)",
            "radial-gradient(circle at 24% 36%, rgba(80, 159, 255, 0.58) 0%, rgba(107, 185, 255, 0.36) 42%, rgba(146, 191, 255, 0.15) 60%, transparent 75%)",
            "url('/hero-gradient.png')",
          ].join(", "),
          backgroundPosition: "center, center, center, top center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, cover",
        }}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-5xl text-center">
          <h1 className="text-[40px] font-bold leading-[1.03] tracking-[-0.045em] text-neutral-950 sm:text-[64px] md:text-[76px] lg:text-[84px]">
            <span className="block">Think faster.</span>
            <span className="block">Learn deeper.</span>
            <span className="block text-[#2f91fd]">Build better.</span>
          </h1>

          <div className="mt-6 flex items-center justify-center gap-3 sm:mt-7">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-6 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-black active:scale-[0.98]"
            >
              Try it now*
            </button>
          </div>
        </Reveal>

        <div className="relative mx-auto mt-10 w-full max-w-[1240px] sm:mt-12">
          <Reveal delay={120}>
            <div className="relative overflow-hidden rounded-t-[22px] bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.22),0_14px_32px_-10px_rgba(15,23,42,0.08)] sm:rounded-t-[28px]">
              {/* Apple macOS Window Titlebar Header */}
              <header className="flex h-9 items-center justify-between bg-[#fbfbfc] px-4 sm:h-10 sm:px-5">
                <div aria-hidden="true" className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>
              </header>

              {/* Product Window Content */}
              <div>
                <HeroChatMockup />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* 1. Chat Mockup — Exact match to Sara's real sidebar & workspace chat */
const HeroChatMockup: React.FC = () => (
  <div className="flex">
    {/* Left Sidebar */}
    <aside
      aria-label="Sara Workspace Navigation"
      className="hidden w-[220px] shrink-0 flex-col bg-[#fafbfc] py-3 select-none sm:flex md:w-[236px]"
    >
      {/* Top action row: Back navigation + Collapse sidebar */}
      <div className="mb-1 flex items-center justify-between px-3 pb-2">
        <div className="flex items-center gap-1.5 px-2 py-1 text-[13px] font-bold text-slate-900">
          <ArrowLeft size={15} strokeWidth={2.2} />
          <span>Back</span>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500">
          <PanelLeft size={15} strokeWidth={1.8} />
        </div>
      </div>

      {/* Navigation list */}
      <div className="flex flex-col gap-0.5 px-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-800">
          <SquarePen size={15} strokeWidth={2} className="shrink-0 text-slate-600" />
          <span>New chat</span>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-800">
          <ProjectsIcon size={15} className="shrink-0 text-slate-600" />
          <span>Projects</span>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-800">
          <Shapes size={15} strokeWidth={2} className="shrink-0 text-slate-600" />
          <span>Artifacts</span>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-800">
          <BookOpen size={15} strokeWidth={2} className="shrink-0 text-slate-600" />
          <span>Chapters</span>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-800">
          <BarChart3 size={15} strokeWidth={2} className="shrink-0 text-slate-600" />
          <span>Benchmarks</span>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-800">
          <GitFork size={15} strokeWidth={2} className="shrink-0 text-slate-600" />
          <span>Roadmaps</span>
        </div>
      </div>

      {/* Recents Section */}
      <div className="mt-3 px-3 pt-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">RECENTS</p>
        <div className="mt-1.5 space-y-0.5 text-[12.5px]">
          <div className="truncate rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-950">
            Quarterly risk analysis
          </div>
          <div className="truncate rounded-lg px-2.5 py-1 text-slate-600">
            Refactor checkout flow
          </div>
        </div>
      </div>
    </aside>

    {/* Main Chat Canvas */}
    <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-7 lg:p-8">
      <div className="space-y-5">
        {/* User Query with Attachment */}
        <div className="ml-auto w-fit max-w-[85%] space-y-1.5">
          <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-1 text-[11.5px] font-medium text-slate-700">
              <FileText className="h-3.5 w-3.5 text-[#2f91fd]" />
              <span>annual-report-2025.pdf</span>
              <span className="text-[10.5px] text-slate-400">· 112 p.</span>
            </div>
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-[#f4f4f4] px-4 py-2.5 text-[13px] leading-relaxed text-neutral-900 sm:text-[14px]">
            Analyze our 2025 supplier disclosures for single-source dependencies and cross-reference Chapter 3.
          </div>
        </div>

        {/* Assistant Response */}
        <div className="max-w-[90%] space-y-2.5">
          {/* Thinking time pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
            <img
              src="/logos/brand-logo.png"
              alt="Sara"
              className="h-3.5 w-3.5 shrink-0 object-contain"
            />
            <span>Thought for 4 seconds</span>
          </div>

          <div className="text-[13.5px] leading-relaxed text-neutral-800 sm:text-[14.5px]">
            Based on <span className="font-semibold text-slate-900">annual-report-2025.pdf</span> (Page 48):
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-neutral-700">
              <li>
                <strong className="text-slate-950">High concentration:</strong> Two suppliers account for 61% of total component volume.
              </li>
              <li>
                <strong className="text-slate-950">Q3 vulnerability:</strong> Any regional shipping slowdown limits assembly capacity.
              </li>
            </ul>
          </div>

          {/* Source Citation Pill + Action Chips inline */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 py-1 text-[11.5px] font-medium text-[#1c63d6]">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Chapter 3 · Page 48</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f6f9] px-3 py-1 text-[11.5px] font-medium text-slate-700 transition-colors hover:bg-slate-200/70"
            >
              <Shapes className="h-3.5 w-3.5 text-slate-600" />
              Generate Risk Artifact
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f6f9] px-3 py-1 text-[11.5px] font-medium text-slate-700 transition-colors hover:bg-slate-200/70"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
              Benchmark Alternatives
            </button>
          </div>

          {/* Utility feedback icons */}
          <div className="flex items-center gap-3 pt-1 text-neutral-400">
            <Copy className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-700" />
            <ThumbsUp className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-700" />
            <ThumbsDown className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-700" />
            <Share2 className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-700" />
            <RefreshCw className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-700" />
          </div>
        </div>
      </div>

      {/* Sara Composer */}
      <div className="mt-5">
        <div className="mx-auto max-w-3xl rounded-2xl bg-[#f5f6f8] p-2.5 sm:p-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
              title="Add attachment or action"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-400 sm:text-[13.5px]">
              Ask Sara anything or type / for skills and commands...
            </span>
            <Mic className="h-4 w-4 text-neutral-400" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white">
              <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.4} />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
