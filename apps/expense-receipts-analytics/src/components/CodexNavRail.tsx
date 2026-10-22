import React from "react";
import { BookOpen, GitFork, MessageSquare, BarChart3 } from "lucide-react";

export type SidebarTab = "chapters" | "roadmap" | "chat" | "benchmarks";

interface CodexNavRailProps {
  activeTab: SidebarTab;
  isOpen: boolean;
  onSelectTab: (tab: SidebarTab) => void;
  onToggleOpen?: () => void;
  onExport?: () => void;
  userInitials?: string;
  totalChapters?: number;
  roadmapProgressPercent?: number;
}

export const CodexNavRail: React.FC<CodexNavRailProps> = ({
  activeTab,
  isOpen,
  onSelectTab,
  onToggleOpen,
  totalChapters = 0,
  roadmapProgressPercent = 0,
}) => {
  const handleTabClick = (tab: SidebarTab) => {
    onSelectTab(tab);
  };

  return (
    <aside
      aria-label="Codex navigation rail"
      className="w-12 h-full shrink-0 flex flex-col items-center justify-between py-3.5 select-none z-20 border-r border-transparent bg-white text-slate-700 transition-all duration-200"
    >
      {/* Top Section: Feature Icons (Chapters first, then Roadmap, Chat, Benchmarks) */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
        {/* 1. Chapters Icon (1st Feature) */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={() => handleTabClick("chapters")}
            aria-label="Chapters"
            title="Chapters (Table of contents)"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              activeTab === "chapters" && isOpen
                ? "bg-[#ECECF1] text-slate-900"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <BookOpen size={18} strokeWidth={1.8} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium tracking-wide shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-800">
            Chapters {totalChapters > 0 ? `(${totalChapters})` : ""}
          </div>
        </div>

        {/* 2. Roadmap Icon (2nd Feature) */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={() => handleTabClick("roadmap")}
            aria-label="Roadmap"
            title="Roadmap (Interactive learning path)"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              activeTab === "roadmap" && isOpen
                ? "bg-[#ECECF1] text-slate-900"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <GitFork size={18} strokeWidth={1.8} />
          </button>

          {/* Progress mini indicator dot on roadmap icon */}
          {roadmapProgressPercent > 0 && (
            <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-slate-400" />
          )}

          {/* Tooltip */}
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium tracking-wide shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-800">
            Roadmap {roadmapProgressPercent > 0 ? `(${roadmapProgressPercent}%)` : ""}
          </div>
        </div>

        {/* 3. Chat Icon (3rd Feature) */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={() => handleTabClick("chat")}
            aria-label="Chat"
            title="Chat (AI Assistant)"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              activeTab === "chat" && isOpen
                ? "bg-[#ECECF1] text-slate-900"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <MessageSquare size={18} strokeWidth={1.8} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium tracking-wide shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-800">
            Chat (AI Assistant)
          </div>
        </div>

        {/* 4. Benchmarks Icon (Inspired by artificialanalysis.ai) */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={() => handleTabClick("benchmarks")}
            aria-label="Benchmarks"
            title="Benchmarks (Artificial Analysis)"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              activeTab === "benchmarks" && isOpen
                ? "bg-[#ECECF1] text-slate-900"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <BarChart3 size={18} strokeWidth={1.8} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium tracking-wide shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-800">
            Benchmarks
          </div>
        </div>
      </div>
    </aside>
  );
};
