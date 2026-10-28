import React from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  GitPullRequest,
  Loader2,
  PanelLeft,
  PenSquare,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { ChatGPTLogo } from "./LandingNavbar";

export const LandingMultiAgentWorkflow: React.FC = () => (
  <div className="mt-24 sm:mt-32 grid grid-cols-1 lg:grid-cols-[1fr_270px] xl:grid-cols-[1fr_290px] gap-8 lg:gap-16 xl:gap-24 items-end">
    <div
      className="order-2 lg:order-1 relative w-full lg:w-[93%] lg:mr-auto min-h-[520px] sm:min-h-0 sm:aspect-[488/312] rounded-[8px] sm:rounded-[10px] overflow-hidden select-none shadow-[0_20px_50px_rgba(47,145,253,0.25),0_6px_16px_rgba(47,145,253,0.12)]"
      style={{
        background:
          "linear-gradient(135deg, #2f91fd 0%, #3d93fe 25%, #62a2fc 60%, #8eaefd 85%, #9ebefd 100%)",
      }}
    >
      <div
        className="absolute left-[7.5%] sm:left-[8%] top-[13.5%] sm:top-[14%] right-0 bottom-0 rounded-tl-[12px] sm:rounded-tl-[16px] border-t border-l border-black/[0.08] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
          maskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
        }}
      >
        <div className="flex h-10 sm:h-11 shrink-0 items-center border-b border-neutral-200/70 bg-[#fafafa]/95 px-3.5 sm:px-4">
          <div className="flex items-center gap-2 w-14">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400 ml-2 sm:ml-3 mr-4">
            <ChevronLeft className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-600" />
            <ChevronRight className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-600" />
          </div>
          <div className="flex-1 text-center font-sans text-[12px] sm:text-[13px] font-medium text-neutral-800 truncate pr-24">
            Refine merge conflict UI
          </div>
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-[210px] sm:w-[250px] shrink-0 bg-[#fbfbfb] border-r border-neutral-200/70 flex flex-col p-3.5 sm:p-4 overflow-hidden text-[10.5px] sm:text-[11px]">
            <div className="flex items-center justify-between pb-2 text-neutral-800 font-medium">
              <div className="flex items-center gap-1.5 cursor-pointer">
                <ChatGPTLogo className="h-3.5 w-3.5 text-neutral-900 shrink-0" />
                <span className="text-[12.5px] sm:text-[13px] font-semibold text-neutral-900">
                  Sara
                </span>
                <span className="text-[9px] text-neutral-500">▾</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <SlidersHorizontal className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
                <Search className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
                <PanelLeft className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
              </div>
            </div>
            <button className="mt-2 flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium text-[11px] py-1 px-1.5 rounded hover:bg-neutral-200/50 transition-colors">
              <PenSquare className="h-3.5 w-3.5 text-neutral-600" />
              <span>New chat</span>
            </button>
            <div className="mt-3.5">
              <span className="text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                Pinned
              </span>
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center gap-1.5 px-1.5 py-1 text-neutral-700 font-medium text-[10.5px]">
                  <Folder className="h-3 w-3 text-neutral-500" />
                  <span className="truncate">sara-core</span>
                </div>
                <div className="pl-5 pr-1.5 py-0.5 text-neutral-600 truncate text-[10px] hover:text-neutral-900 cursor-pointer">
                  Search experience improvements
                </div>
                <div className="px-1.5 py-1 text-neutral-700 truncate text-[10.5px] hover:bg-neutral-200/40 rounded cursor-pointer">
                  Refactor pull request review workflow
                </div>
                <div className="flex items-center justify-between px-1.5 py-1 text-neutral-700 truncate text-[10.5px] hover:bg-neutral-200/40 rounded cursor-pointer">
                  <span className="truncate">Audit new permissions</span>
                  <div className="flex items-center gap-1 text-neutral-400 shrink-0">
                    <ArrowUpRight className="h-2.5 w-2.5" />
                    <GitPullRequest className="h-2.5 w-2.5" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 bg-[#ebebeb] rounded-md text-neutral-950 font-medium text-[10.5px]">
                  <span className="truncate">Refine merge conflict UI</span>
                  <div className="flex items-center gap-1 text-neutral-600 shrink-0">
                    <ArrowUpRight className="h-2.5 w-2.5" />
                    <GitPullRequest className="h-2.5 w-2.5" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3.5">
              <span className="text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                Recents
              </span>
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center justify-between px-1.5 py-1 text-neutral-600 text-[10px] hover:bg-neutral-200/40 rounded cursor-pointer">
                  <span className="truncate">Account recovery changes</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2f91fd]" />
                    <Clock className="h-2.5 w-2.5 text-neutral-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-1.5 py-1 text-neutral-600 text-[10px] hover:bg-neutral-200/40 rounded cursor-pointer">
                  <span className="truncate">Manage release readiness</span>
                  <Loader2 className="h-2.5 w-2.5 text-neutral-400 animate-spin shrink-0" />
                </div>
                <div className="flex items-center justify-between px-1.5 py-1 text-neutral-600 text-[10px] hover:bg-neutral-200/40 rounded cursor-pointer">
                  <span className="truncate">Analyze Code Review plugin usage</span>
                  <Loader2 className="h-2.5 w-2.5 text-neutral-400 animate-spin shrink-0" />
                </div>
                <div className="px-1.5 py-1 text-neutral-400 text-[10px] truncate">
                  Notifications experience
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white px-5 sm:px-6 pt-24 sm:pt-28 pb-4 flex flex-col justify-start overflow-hidden">
            <div className="flex flex-col items-end">
              <div className="max-w-[270px] sm:max-w-[320px] rounded-2xl rounded-tr-xs bg-[#f4f4f5] px-4 py-3 text-[11px] sm:text-[11.5px] leading-relaxed text-neutral-800 shadow-xs -mr-1 sm:-mr-2">
                can you make comment ux in the diff composer borderless, ie drop the border, go full
                width, and add quick cancel/send buttons
              </div>
            </div>
            <div className="mt-12 sm:mt-14 text-[10px] sm:text-[10.5px] text-neutral-400">
              9:04 AM
            </div>
            <div className="mt-2 space-y-3 text-[11px] sm:text-[11.5px] text-neutral-700 leading-relaxed max-w-[480px]">
              <p>
                Updated in Dev: the diff composer is full width and borderless, with animated
                cancel/send icon buttons. I verified typing, cancel, and draft preservation.
              </p>
              <p className="text-neutral-500">
                Committed as{" "}
                <span className="font-mono text-neutral-800 font-medium">ba67351a</span>. The update
                to{" "}
                <span className="inline-flex items-center gap-1 text-[#2f91fd] font-medium">
                  <GitPullRequest className="h-3 w-3 inline" /> PR #1539494
                </span>{" "}
                is ready for staging and auto-review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="order-1 lg:order-2 max-w-[290px] lg:self-end lg:-translate-x-4 lg:pb-1.5">
      <h3
        className="text-[30px] sm:text-[36px] md:text-[40px] font-normal sm:font-medium tracking-[-0.03em] text-neutral-950 leading-[1.14]"
        style={{ fontWeight: 500 }}
      >
        Designed for multi-agent
        <br className="hidden sm:inline" /> workflows
      </h3>
      <p className="mt-6 text-[14px] sm:text-[15px] text-neutral-600 leading-[1.65] max-w-[280px]">
        Sara coordinates specialized agents in parallel — running tests, verifying pull requests,
        and inspecting live environments simultaneously. Steer goals in real-time, inspect
        reproducible execution logs, and merge verified results with complete confidence.
      </p>
    </div>
  </div>
);
