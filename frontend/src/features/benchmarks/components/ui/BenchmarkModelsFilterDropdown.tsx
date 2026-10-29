import React, { useMemo, useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Filter, Plus, Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { CreatorLogo } from "./CreatorLogo";
import type { CreatorId } from "../types";

export interface BenchmarkFilterModelItem {
  id: string;
  name: string;
  creator?: string;
  color?: string;
  badge?: string;
}

export interface BenchmarkModelsFilterDropdownProps {
  items: BenchmarkFilterModelItem[];
  selectedIds: string[];
  onChangeSelection: (ids: string[]) => void;
  totalCount?: number;
  unitLabel?: string;
  defaultIds?: string[];
  sortOrder?: "asc" | "desc" | "default";
  onToggleSort?: () => void;
  onAddFromProvider?: () => void;
  showProviderAction?: boolean;
}

const PROVIDERS = [
  { id: "vertex", name: "Google Cloud Vertex AI", tag: "TPU / GPU" },
  { id: "azure", name: "Azure OpenAI Service", tag: "Cloud" },
  { id: "bedrock", name: "AWS Bedrock", tag: "Enterprise" },
  { id: "groq", name: "Groq Cloud", tag: "LPU Ultra-fast" },
  { id: "cerebras", name: "Cerebras Inference", tag: "CS-3 Wafer" },
  { id: "together", name: "Together AI", tag: "Open Source" },
  { id: "fireworks", name: "Fireworks AI", tag: "Compound AI" },
  { id: "deepinfra", name: "DeepInfra", tag: "Serverless" },
];

export const BenchmarkModelsFilterDropdown: React.FC<BenchmarkModelsFilterDropdownProps> = ({
  items,
  selectedIds,
  onChangeSelection,
  totalCount,
  unitLabel = "models",
  defaultIds,
  sortOrder,
  onToggleSort,
  onAddFromProvider,
  showProviderAction = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [query, setQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const count = totalCount ?? items.length;

  // Handle outside click to close popovers
  useEffect(() => {
    if (!isOpen && !isOptionsOpen && !isProviderOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsOptionsOpen(false);
        setIsProviderOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsOptionsOpen(false);
        setIsProviderOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isOptionsOpen, isProviderOpen]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.creator && m.creator.toLowerCase().includes(q))
    );
  }, [items, query]);

  const toggleModel = (id: string) => {
    onChangeSelection(
      selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]
    );
  };

  const handleSelectAll = () => {
    onChangeSelection(items.map((m) => m.id));
  };

  const handleClearAll = () => {
    onChangeSelection([]);
  };

  const handleResetDefault = () => {
    if (defaultIds && defaultIds.length > 0) {
      onChangeSelection(defaultIds);
    } else {
      onChangeSelection(items.map((m) => m.id));
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col items-end gap-2.5 shrink-0 relative">
      <div className="flex items-center gap-2">
        {/* Main Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setIsOptionsOpen(false);
              setIsProviderOpen(false);
            }}
            className={`h-9 min-w-[270px] sm:min-w-[290px] flex items-center justify-between gap-3 rounded-lg border px-3 text-[13px] transition-colors cursor-pointer shadow-2xs ${
              isOpen
                ? "border-neutral-400 bg-neutral-100 text-neutral-900 font-medium"
                : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            <span>
              {selectedIds.length} of {count} {unitLabel}
            </span>
            <ChevronsUpDown size={14} className="text-neutral-500" />
          </button>

          {/* Filter Popover Dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-84 bg-white border border-neutral-200/90 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-2 max-h-[380px] animate-in fade-in zoom-in-95 duration-100 select-none">
              {/* Header */}
              <div className="flex items-center justify-between text-xs px-1 text-neutral-500 pb-2 border-b border-neutral-100">
                <span className="font-semibold text-neutral-800 text-[12px]">
                  Filter {unitLabel} ({selectedIds.length})
                </span>
                <div className="flex items-center gap-2">
                  {defaultIds && (
                    <>
                      <button
                        type="button"
                        onClick={handleResetDefault}
                        className="text-[11.5px] text-blue-600 hover:underline cursor-pointer font-medium"
                      >
                        Default
                      </button>
                      <span className="text-neutral-300">·</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11.5px] text-blue-600 hover:underline cursor-pointer font-medium"
                  >
                    All
                  </button>
                  <span className="text-neutral-300">·</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11.5px] text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${unitLabel}...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-800 placeholder-neutral-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Scrollable Model Items */}
              <div className="overflow-y-auto max-h-[240px] flex flex-col gap-0.5 divide-y divide-neutral-50 no-scrollbar pr-0.5">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-400">
                    No {unitLabel} match your search
                  </div>
                ) : (
                  filteredItems.map((m) => {
                    const isSelected = selectedIds.includes(m.id);
                    const cleanName = m.name.replace(/\n/g, " ");

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleModel(m.id)}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-neutral-50 rounded text-xs text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                          {m.creator ? (
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              <CreatorLogo creator={m.creator as CreatorId} size={15} />
                            </div>
                          ) : m.color ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: m.color }}
                            />
                          ) : null}

                          <span className="font-medium text-neutral-900 truncate text-[11.5px]">
                            {cleanName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {m.badge && (
                            <span className="text-[10px] font-mono text-neutral-500 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded">
                              {m.badge}
                            </span>
                          )}
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-neutral-900 border-neutral-900 text-white"
                                : "border-neutral-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check size={11} strokeWidth={2.5} />}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter Icon Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsOptionsOpen(false);
            setIsProviderOpen(false);
          }}
          title="Filter models"
          aria-label="Filter models"
          className={`h-8 px-2.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
            isOpen
              ? "border-neutral-400 bg-neutral-100 text-neutral-900"
              : "border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
          }`}
        >
          <Filter size={15} />
        </button>

        {/* Chart Options / Sliders Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (onToggleSort) {
                onToggleSort();
              } else {
                setIsOptionsOpen((prev) => !prev);
                setIsOpen(false);
                setIsProviderOpen(false);
              }
            }}
            title={sortOrder ? `Sort: ${sortOrder}` : "Chart options"}
            aria-label="Chart settings"
            className={`h-8 px-2.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              isOptionsOpen
                ? "border-neutral-400 bg-neutral-100 text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Options Menu Popover */}
          {isOptionsOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-neutral-200/90 rounded-xl shadow-xl z-50 p-2.5 flex flex-col gap-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100">
              <span className="text-[11px] font-semibold text-neutral-500 px-2 py-1 uppercase tracking-wider">
                Display Options
              </span>
              <button
                type="button"
                onClick={() => {
                  handleSelectAll();
                  setIsOptionsOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded text-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <Check size={13} className="text-neutral-400" />
                <span>Show all {unitLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetDefault();
                  setIsOptionsOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded text-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <ArrowUpDown size={13} className="text-neutral-400" />
                <span>Reset to default selection</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Model from Specific Provider Button (where enabled) */}
      {(showProviderAction || onAddFromProvider) && (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (onAddFromProvider) {
                onAddFromProvider();
              } else {
                setIsProviderOpen((prev) => !prev);
                setIsOpen(false);
                setIsOptionsOpen(false);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-medium transition-colors cursor-pointer ${
              isProviderOpen
                ? "border-neutral-400 bg-neutral-100 text-neutral-900 font-semibold"
                : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center shrink-0">
              <Plus size={10} />
            </span>
            Add model from specific provider
          </button>

          {/* Provider Selection Popover */}
          {isProviderOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-neutral-200/90 rounded-xl shadow-xl z-50 p-2.5 flex flex-col gap-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100">
              <span className="text-[11px] font-semibold text-neutral-500 px-2 py-1 uppercase tracking-wider">
                Select Inference Provider
              </span>
              <div className="max-h-52 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      // Select all models or notify
                      handleSelectAll();
                      setIsProviderOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-50 rounded text-neutral-800 flex items-center justify-between cursor-pointer group"
                  >
                    <span className="font-medium group-hover:text-blue-600 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                      {p.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
