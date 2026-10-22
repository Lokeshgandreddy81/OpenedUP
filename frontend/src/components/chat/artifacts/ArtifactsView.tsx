import React, { useState } from "react";
import { Search, Plus, ChevronDown } from "lucide-react";

export type ArtifactCategory = "All" | "Code" | "Documents";
export type ArtifactSubTab = "Yours" | "Shared";

export interface ArtifactsViewProps {
  onClose?: () => void;
  onNavigateToChat?: (prompt?: string) => void;
}

const SlidersFilterIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = "text-neutral-800",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="2" x2="3" y2="14" />
    <circle cx="3" cy="5" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="2" x2="8" y2="14" />
    <circle cx="8" cy="11" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <line x1="13" y1="2" x2="13" y2="14" />
    <circle cx="13" cy="7" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const ArtifactsView: React.FC<ArtifactsViewProps> = () => {
  const [activeCategory, setActiveCategory] = useState<ArtifactCategory>("All");
  const [subTab, setSubTab] = useState<ArtifactSubTab>("Yours");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-y-auto">
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-7 md:pt-8 pb-8 flex flex-col">
        {/* Title in Editorial Serif font matching Customize */}
        <h1 className="text-[28px] md:text-[30px] font-serif text-neutral-900 font-normal tracking-tight">
          Artifacts
        </h1>

        {/* Navigation & Controls Toolbar spanning full width */}
        <div className="mt-5 md:mt-6 flex items-center justify-between w-full">
          {/* Left: Category tabs & segment toggle */}
          <div className="flex items-center gap-2">
            {/* Category tabs: All, Code, Documents */}
            <div className="flex items-center gap-1">
              {(["All", "Code", "Documents"] as ArtifactCategory[]).map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[13.5px] transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#ECECF1] text-neutral-900 font-medium px-3.5 py-1 rounded-lg"
                        : "text-neutral-500 hover:text-neutral-800 font-normal px-2.5 py-1 rounded-lg"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Vertical separator */}
            <div className="w-[1px] h-4 bg-neutral-200 mx-3 shrink-0" />

            {/* Sub-tab segmented control: Yours | Shared */}
            <div className="bg-[#F1F1F4] p-0.5 rounded-lg inline-flex items-center">
              {(["Yours", "Shared"] as ArtifactSubTab[]).map((tab) => {
                const isActive = subTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSubTab(tab)}
                    className={`text-[12.5px] transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-neutral-900 font-medium px-3 py-1 rounded-md shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800 font-normal px-2.5 py-1 rounded-md"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Filter icon, + Add button */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-2.5 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artifacts"
                className="h-8 pl-8 pr-3 w-52 sm:w-60 md:w-64 text-[13px] text-neutral-900 placeholder-neutral-400 bg-white border border-neutral-200/90 rounded-lg outline-none focus:border-neutral-400 transition-colors"
              />
            </div>

            {/* Filter Sliders Button */}
            <button
              type="button"
              aria-label="Filter"
              title="Filter"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors cursor-pointer"
            >
              <SlidersFilterIcon size={15} className="text-neutral-800" />
            </button>

            {/* + Add Button with Chevron Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen((v) => !v)}
                className="h-8 bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Plus size={14} strokeWidth={2} />
                <span>Add</span>
                <ChevronDown size={13} strokeWidth={2} className="text-white/80" />
              </button>

              {isAddMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-neutral-200/80 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-[13px] text-neutral-700 select-none"
                >
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    New document
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    New code artifact
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    Import artifact
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean empty canvas matching the pristine layout - no addons */}
        <div className="flex-1 w-full min-h-[400px]" />
      </div>
    </div>
  );
};
