import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Zap,
  ShieldCheck,
  Scale,
  ChevronDown,
  RotateCcw,
  Columns,
} from "lucide-react";
import { AIModelBenchmark, CreatorId, WeightsType, ReasoningType } from "../types";
import { CreatorLogo, getCreatorName } from "../ui/CreatorLogo";

export interface LeaderboardTableProps {
  models: AIModelBenchmark[];
  selectedModelId?: string | null;
  onSelectModel?: (model: AIModelBenchmark) => void;
  onCompareModels?: (modelIds: string[]) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export type TableSortField =
  | "name"
  | "creator"
  | "weightsType"
  | "contextWindow"
  | "intelligenceIndex"
  | "mmluPro"
  | "gpqaDiamond"
  | "sweBenchVerified"
  | "outputSpeed"
  | "ttftLatency"
  | "blendedPrice"
  | "inputOutputPrice";

export type TableSortDirection = "asc" | "desc";

interface ColumnDef {
  id: TableSortField;
  label: string;
  shortLabel?: string;
  tooltip: string;
  align: "left" | "center" | "right";
  isCore: boolean; // Shown in compact mode
  minWidth?: string;
}

const TABLE_COLUMNS: ColumnDef[] = [
  {
    id: "name",
    label: "Model & Architecture",
    shortLabel: "Model",
    tooltip: "Model identifier, creator, release date, and reasoning architecture",
    align: "left",
    isCore: true,
    minWidth: "280px",
  },
  {
    id: "weightsType",
    label: "License / Weights",
    shortLabel: "License",
    tooltip: "Model weights accessibility (Open Weights vs Proprietary)",
    align: "center",
    isCore: true,
    minWidth: "130px",
  },
  {
    id: "contextWindow",
    label: "Context",
    shortLabel: "Context",
    tooltip: "Maximum context window capacity in thousands of tokens",
    align: "right",
    isCore: true,
    minWidth: "95px",
  },
  {
    id: "intelligenceIndex",
    label: "Intelligence Index",
    shortLabel: "Intelligence",
    tooltip: "Artificial Analysis composite intelligence score (0–100 scale)",
    align: "right",
    isCore: true,
    minWidth: "150px",
  },
  {
    id: "mmluPro",
    label: "MMLU-Pro",
    shortLabel: "MMLU-Pro",
    tooltip: "Multi-task language understanding reasoning benchmark (0–100%)",
    align: "right",
    isCore: true,
    minWidth: "105px",
  },
  {
    id: "gpqaDiamond",
    label: "GPQA Diamond",
    shortLabel: "GPQA",
    tooltip:
      "Graduate-level expert biology, chemistry, and physics reasoning without web access (%)",
    align: "right",
    isCore: false,
    minWidth: "115px",
  },
  {
    id: "sweBenchVerified",
    label: "SWE-bench",
    shortLabel: "SWE-bench",
    tooltip:
      "Real-world GitHub software engineering issue resolution benchmark (SWE-bench Verified %)",
    align: "right",
    isCore: false,
    minWidth: "110px",
  },
  {
    id: "outputSpeed",
    label: "Output Speed",
    shortLabel: "Speed",
    tooltip: "Median output generation throughput in tokens per second",
    align: "right",
    isCore: true,
    minWidth: "120px",
  },
  {
    id: "ttftLatency",
    label: "TTFT Latency",
    shortLabel: "TTFT",
    tooltip: "Time to first token (TTFT) latency in seconds",
    align: "right",
    isCore: false,
    minWidth: "110px",
  },
  {
    id: "blendedPrice",
    label: "Blended Price",
    shortLabel: "Blended",
    tooltip:
      "Estimated blended token price per 1M tokens based on standard 3:1 input/output ratio ($ USD)",
    align: "right",
    isCore: true,
    minWidth: "125px",
  },
  {
    id: "inputOutputPrice",
    label: "Input / Output",
    shortLabel: "In / Out",
    tooltip: "Input token price and output token price per 1M tokens ($ USD)",
    align: "right",
    isCore: false,
    minWidth: "135px",
  },
];

/**
 * Formats context window token count into compact human-readable string (e.g. 200K, 1M, 128K)
 */
function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`;
  }
  return `${tokens}`;
}

/**
 * Formats price into USD currency string with intelligent decimal precision
 */
function formatPrice(usd: number): string {
  if (usd <= 0) return "--";
  if (usd < 0.1) return `$${usd.toFixed(3)}`;
  if (usd < 10) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Formats ISO date (YYYY-MM-DD or YYYY-MM) to short readable month and year (e.g. Feb 2025)
 */
function formatReleaseDate(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length >= 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} '${year.slice(2)}`;
    }
  }
  return isoDate;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onCompareModels,
  searchInputRef,
}) => {
  // --- Filter states ---
  const [searchQuery, setSearchQuery] = useState("");
  const [weightsFilter, setWeightsFilter] = useState<"all" | WeightsType>("all");
  const [reasoningFilter, setReasoningFilter] = useState<"all" | ReasoningType>("all");
  const [creatorFilter, setCreatorFilter] = useState<"all" | CreatorId>("all");

  // --- Column visibility states ---
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [customHiddenColumns, setCustomHiddenColumns] = useState<Set<TableSortField>>(new Set());

  // --- Sorting states ---
  // Default sort: Intelligence Index descending
  const [sortField, setSortField] = useState<TableSortField>("intelligenceIndex");
  const [sortDirection, setSortDirection] = useState<TableSortDirection>("desc");

  // --- Comparison selection states (max 3 models) ---
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  // Unique creators in the dataset
  const availableCreators = useMemo(() => {
    const creatorsMap = new Map<CreatorId, { id: CreatorId; name: string; count: number }>();
    models.forEach((m) => {
      const existing = creatorsMap.get(m.creator);
      if (existing) {
        existing.count += 1;
      } else {
        creatorsMap.set(m.creator, {
          id: m.creator,
          name: m.creatorDisplayName || getCreatorName(m.creator),
          count: 1,
        });
      }
    });
    return Array.from(creatorsMap.values()).sort((a, b) => b.count - a.count);
  }, [models]);

  // Handle sort header click
  const handleSort = (field: TableSortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      // Default to desc for performance metrics, asc for name/creator/price/latency
      const defaultDesc = [
        "intelligenceIndex",
        "mmluPro",
        "gpqaDiamond",
        "sweBenchVerified",
        "outputSpeed",
        "contextWindow",
      ].includes(field);

      setSortField(field);
      setSortDirection(defaultDesc ? "desc" : "asc");
    }
  };

  // Toggle selection for comparison (max 3 models)
  const handleToggleCompare = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompareIds((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= 3) {
        // Replace the last selected model or prevent
        return prev;
      }
      return [...prev, modelId];
    });
  };

  // Clear comparison selection
  const handleClearCompare = () => {
    setSelectedCompareIds([]);
  };

  // Launch comparison
  const handleLaunchCompare = () => {
    if (onCompareModels && selectedCompareIds.length >= 2) {
      onCompareModels(selectedCompareIds);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setWeightsFilter("all");
    setReasoningFilter("all");
    setCreatorFilter("all");
  };

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    weightsFilter !== "all" ||
    reasoningFilter !== "all" ||
    creatorFilter !== "all";

  // Toggle custom column visibility
  const toggleColumnVisibility = (colId: TableSortField) => {
    if (colId === "name") return; // Cannot hide primary name column
    setCustomHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) {
        next.delete(colId);
      } else {
        next.add(colId);
      }
      return next;
    });
  };

  // Filter models
  const filteredModels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return models.filter((model) => {
      // Search query filter
      if (query) {
        const matchName = model.name.toLowerCase().includes(query);
        const matchId = model.id.toLowerCase().includes(query);
        const matchCreator = model.creatorDisplayName.toLowerCase().includes(query);
        const matchTags = model.tags?.some((t) => t.toLowerCase().includes(query));
        const matchSummary = model.summary?.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchCreator && !matchTags && !matchSummary) {
          return false;
        }
      }

      // Weights filter
      if (weightsFilter !== "all") {
        if (weightsFilter === "open-weights" && model.weightsType !== "open-weights") {
          return false;
        }
        if (weightsFilter === "proprietary" && model.weightsType !== "proprietary") {
          return false;
        }
        if (
          weightsFilter === "commercial-restricted" &&
          model.weightsType !== "commercial-restricted"
        ) {
          return false;
        }
      }

      // Reasoning filter
      if (reasoningFilter !== "all") {
        if (reasoningFilter === "extended-thinking" && !model.isReasoningModel) {
          return false;
        }
        if (reasoningFilter === "standard" && model.isReasoningModel) {
          return false;
        }
      }

      // Creator filter
      if (creatorFilter !== "all" && model.creator !== creatorFilter) {
        return false;
      }

      return true;
    });
  }, [models, searchQuery, weightsFilter, reasoningFilter, creatorFilter]);

  // Sort models
  const sortedModels = useMemo(() => {
    const list = [...filteredModels];

    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "creator":
          valA = a.creatorDisplayName.toLowerCase();
          valB = b.creatorDisplayName.toLowerCase();
          break;
        case "weightsType":
          valA = a.weightsType;
          valB = b.weightsType;
          break;
        case "contextWindow":
          valA = a.contextWindowTokens;
          valB = b.contextWindowTokens;
          break;
        case "intelligenceIndex":
          valA = a.quality.intelligenceIndex;
          valB = b.quality.intelligenceIndex;
          break;
        case "mmluPro":
          valA = a.quality.mmluPro;
          valB = b.quality.mmluPro;
          break;
        case "gpqaDiamond":
          valA = a.quality.gpqaDiamond;
          valB = b.quality.gpqaDiamond;
          break;
        case "sweBenchVerified":
          valA = a.quality.sweBenchVerified;
          valB = b.quality.sweBenchVerified;
          break;
        case "outputSpeed":
          valA = a.performance.outputSpeedTokensPerSec.median;
          valB = b.performance.outputSpeedTokensPerSec.median;
          break;
        case "ttftLatency":
          valA = a.performance.ttftSeconds.median;
          valB = b.performance.ttftSeconds.median;
          break;
        case "blendedPrice":
          valA = a.pricing.blendedPricePer1M;
          valB = b.pricing.blendedPricePer1M;
          break;
        case "inputOutputPrice":
          valA = a.pricing.inputPricePer1M + a.pricing.outputPricePer1M;
          valB = b.pricing.inputPricePer1M + b.pricing.outputPricePer1M;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        const cmp = valA.localeCompare(valB);
        return sortDirection === "asc" ? cmp : -cmp;
      }

      const numA = Number(valA);
      const numB = Number(valB);
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

    return list;
  }, [filteredModels, sortField, sortDirection]);

  // Active columns to render based on compact mode and custom visibility
  const visibleColumns = useMemo(() => {
    return TABLE_COLUMNS.filter((col) => {
      if (customHiddenColumns.has(col.id)) return false;
      if (isCompactMode && !col.isCore && col.id !== "name") return false;
      return true;
    });
  }, [isCompactMode, customHiddenColumns]);

  return (
    <div className="w-full flex flex-col font-sans select-none bg-white">
      {/* ========================================================
          1. TOP FILTER TOOLBAR
          ======================================================== */}
      <div className="w-full border-b border-slate-200 bg-white p-4 space-y-3">
        {/* Main controls row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model, creator, or capability tag..."
              className="w-full h-9 pl-9 pr-8 text-xs rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white focus:border-[#0047FF] focus:ring-2 focus:ring-[#0047FF]/15 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Creator Filter Dropdown */}
            <div className="relative">
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value as "all" | CreatorId)}
                aria-label="Filter by creator"
                className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus:border-[#0047FF] focus:ring-2 focus:ring-[#0047FF]/15 outline-none transition-all cursor-pointer appearance-none pr-8"
              >
                <option value="all">All Creators ({availableCreators.length})</option>
                {availableCreators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Weights Filter Dropdown */}
            <div className="relative">
              <select
                value={weightsFilter}
                onChange={(e) => setWeightsFilter(e.target.value as "all" | WeightsType)}
                aria-label="Filter by weights"
                className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus:border-[#0047FF] focus:ring-2 focus:ring-[#0047FF]/15 outline-none transition-all cursor-pointer appearance-none pr-8"
              >
                <option value="all">All Weights</option>
                <option value="open-weights">Open Weights</option>
                <option value="proprietary">Proprietary</option>
                <option value="commercial-restricted">Restricted</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Reasoning Filter Pills */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setReasoningFilter("all")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  reasoningFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setReasoningFilter("extended-thinking")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  reasoningFilter === "extended-thinking"
                    ? "bg-white text-[#0047FF] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles size={11} />
                <span>Thinking</span>
              </button>
              <button
                type="button"
                onClick={() => setReasoningFilter("standard")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  reasoningFilter === "standard"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Standard
              </button>
            </div>

            {/* Column Visibility / Compact Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsCompactMode((prev) => !prev)}
              title={isCompactMode ? "Expand all columns" : "Switch to compact view"}
              className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isCompactMode
                  ? "border-[#0047FF] bg-[#0047FF]/5 text-[#0047FF]"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <Columns size={13} />
              <span>{isCompactMode ? "Compact" : "Expanded"}</span>
            </button>

            {/* Custom Column Picker Popover Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnPicker((prev) => !prev)}
                title="Customize visible columns"
                className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={14} />
              </button>

              {/* Column Picker Dropdown */}
              {showColumnPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-xl p-3 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-900">Configure Columns</span>
                      <button
                        type="button"
                        onClick={() => setCustomHiddenColumns(new Set())}
                        className="text-[11px] text-[#0047FF] hover:underline cursor-pointer"
                      >
                        Reset All
                      </button>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {TABLE_COLUMNS.map((col) => {
                        const isChecked = !customHiddenColumns.has(col.id);
                        const isMandatory = col.id === "name";
                        return (
                          <label
                            key={col.id}
                            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                              isMandatory ? "opacity-60 cursor-not-allowed" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isMandatory}
                              onChange={() => toggleColumnVisibility(col.id)}
                              className="rounded border-slate-300 text-[#0047FF] focus:ring-[#0047FF] w-3.5 h-3.5"
                            />
                            <span className="text-slate-700 font-medium">{col.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Clear filters button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-2.5 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 bg-white text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset all active filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter & quick helper banner */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-slate-900 font-semibold">{sortedModels.length}</strong> of{" "}
              {models.length} AI models
            </span>
            {isFiltered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#0047FF] text-[11px] font-medium">
                Filtered view
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            <span>Click any column header to sort</span>
            <span>•</span>
            <span>Select 2 or 3 models to compare</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. SORTABLE LEADERBOARD TABLE (STICKY HEADER & 1ST COL)
          ======================================================== */}
      <div className="relative w-full overflow-x-auto border-b border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
              {/* Sticky Top-Left Corner: Model / Rank / Checkbox */}
              <th
                scope="col"
                className="sticky top-0 left-0 z-30 bg-slate-50/95 backdrop-blur-xs py-3.5 pl-4 pr-3 text-left font-bold border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] min-w-[300px]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 flex items-center justify-center text-slate-400"
                    title="Select up to 3 models to compare"
                  >
                    <Scale size={13} />
                  </div>
                  <span className="w-6 text-center text-[11px] font-bold text-slate-400 uppercase">
                    #
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="group inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-[#0047FF] transition-colors cursor-pointer"
                  >
                    <span>Model Name</span>
                    {sortField === "name" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp size={13} className="text-[#0047FF]" />
                      ) : (
                        <ArrowDown size={13} className="text-[#0047FF]" />
                      )
                    ) : (
                      <ArrowUpDown
                        size={12}
                        className="text-slate-400 opacity-40 group-hover:opacity-100"
                      />
                    )}
                  </button>
                </div>
              </th>

              {/* Dynamic Sortable Headers */}
              {visibleColumns
                .filter((col) => col.id !== "name")
                .map((col) => {
                  const isActive = sortField === col.id;
                  const alignClass =
                    col.align === "right"
                      ? "text-right justify-end"
                      : col.align === "center"
                        ? "text-center justify-center"
                        : "text-left justify-start";

                  return (
                    <th
                      key={col.id}
                      scope="col"
                      style={{ minWidth: col.minWidth || "110px" }}
                      className={`sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xs py-3.5 px-3 font-semibold transition-colors ${
                        isActive ? "text-[#0047FF] bg-blue-50/40" : "text-slate-700"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(col.id)}
                        title={col.tooltip}
                        className={`group w-full inline-flex items-center gap-1.5 cursor-pointer font-semibold ${alignClass}`}
                      >
                        <span className="truncate">{col.label}</span>
                        {isActive ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={13} className="text-[#0047FF] shrink-0" />
                          ) : (
                            <ArrowDown size={13} className="text-[#0047FF] shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown
                            size={12}
                            className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0"
                          />
                        )}
                      </button>
                    </th>
                  );
                })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedModels.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="py-16 text-center text-slate-500 bg-white"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={24} className="text-slate-300" />
                    <p className="font-semibold text-sm text-slate-800">No matching models found</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Try adjusting your search query, creator filter, or license constraints.
                    </p>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-[#0047FF] text-white text-xs font-medium hover:bg-[#2966FF] transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedModels.map((model, index) => {
                const rank = index + 1;
                const isSelected = selectedModelId === model.id;
                const isCompared = selectedCompareIds.includes(model.id);
                const isCompareLimitReached = selectedCompareIds.length >= 3 && !isCompared;

                return (
                  <tr
                    key={model.id}
                    onClick={() => onSelectModel && onSelectModel(model)}
                    className={`group transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-l-4 border-l-[#0047FF]"
                        : isCompared
                          ? "bg-blue-50/30"
                          : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* ====================================================
                        STICKY 1ST COLUMN: Checkbox, Rank, Logo, Name & Badges
                        ==================================================== */}
                    <td
                      className={`sticky left-0 z-10 py-3 pl-4 pr-3 border-r border-slate-200 transition-colors shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] ${
                        isSelected
                          ? "bg-blue-50/95 backdrop-blur-xs"
                          : isCompared
                            ? "bg-blue-50/60"
                            : "bg-white group-hover:bg-slate-50/90"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Compare Selection Checkbox */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 flex items-center justify-center shrink-0"
                        >
                          <input
                            type="checkbox"
                            checked={isCompared}
                            disabled={isCompareLimitReached}
                            onChange={(e) =>
                              handleToggleCompare(model.id, e as unknown as React.MouseEvent)
                            }
                            title={
                              isCompareLimitReached
                                ? "Maximum 3 models can be compared simultaneously"
                                : isCompared
                                  ? "Remove from comparison"
                                  : "Select to compare"
                            }
                            className={`rounded border-slate-300 text-[#0047FF] focus:ring-[#0047FF] w-4 h-4 cursor-pointer ${
                              isCompareLimitReached ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                          />
                        </div>

                        {/* Rank index */}
                        <span
                          className={`w-6 text-center text-xs font-bold tabular-nums shrink-0 ${
                            rank <= 3
                              ? "text-[#0047FF]"
                              : rank <= 10
                                ? "text-slate-700"
                                : "text-slate-400"
                          }`}
                        >
                          {rank}
                        </span>

                        {/* Creator Logo */}
                        <div className="shrink-0">
                          <CreatorLogo creator={model.creator} size={20} />
                        </div>

                        {/* Model Name, Badges & Subtitle */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 group-hover:text-[#0047FF] transition-colors truncate text-xs">
                              {model.name}
                            </span>

                            {/* Release Date Badge */}
                            {model.releaseDate && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                                {formatReleaseDate(model.releaseDate)}
                              </span>
                            )}

                            {/* Extended Thinking Badge */}
                            {model.isReasoningModel && (
                              <span
                                title="Extended reasoning model"
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#BEDBFF]/30 text-[#0047FF] border border-[#BEDBFF]/60 inline-flex items-center gap-0.5 shrink-0"
                              >
                                <Sparkles size={9} />
                                <span>Thinking</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{model.creatorDisplayName}</span>
                            {model.totalParametersB && (
                              <>
                                <span>•</span>
                                <span>{model.totalParametersB}B params</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ====================================================
                        COLUMN: License / Weights
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "weightsType") && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {model.weightsType === "open-weights" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck size={11} />
                            <span>Open Weights</span>
                          </span>
                        ) : model.weightsType === "commercial-restricted" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span>Restricted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Proprietary</span>
                          </span>
                        )}
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: Context Window
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "contextWindow") && (
                      <td className="py-3 px-3 text-right font-medium text-slate-700 tabular-nums whitespace-nowrap">
                        {formatContextWindow(model.contextWindowTokens)}
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: Intelligence Index (Composite 0-100)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "intelligenceIndex") && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Mini visual score bar */}
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full bg-[#0047FF]"
                              style={{
                                width: `${Math.min(100, Math.max(0, model.quality.intelligenceIndex))}%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-slate-900 tabular-nums text-xs">
                            {model.quality.intelligenceIndex.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: MMLU-Pro (%)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "mmluPro") && (
                      <td className="py-3 px-3 text-right font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {model.quality.mmluPro.toFixed(1)}%
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: GPQA Diamond (%)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "gpqaDiamond") && (
                      <td className="py-3 px-3 text-right text-slate-700 tabular-nums whitespace-nowrap">
                        {model.quality.gpqaDiamond
                          ? `${model.quality.gpqaDiamond.toFixed(1)}%`
                          : "—"}
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: SWE-bench Verified (%)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "sweBenchVerified") && (
                      <td className="py-3 px-3 text-right text-slate-700 tabular-nums whitespace-nowrap">
                        {model.quality.sweBenchVerified
                          ? `${model.quality.sweBenchVerified.toFixed(1)}%`
                          : "—"}
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: Output Speed (Tokens/sec)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "outputSpeed") && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Zap size={11} className="text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-900 tabular-nums text-xs">
                            {Math.round(model.performance.outputSpeedTokensPerSec.median)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">t/s</span>
                        </div>
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: TTFT Latency (seconds)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "ttftLatency") && (
                      <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            model.performance.ttftSeconds.median < 0.5
                              ? "text-emerald-700 font-semibold"
                              : "text-slate-700"
                          }`}
                        >
                          {model.performance.ttftSeconds.median.toFixed(2)}s
                        </span>
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: Blended Price ($ / 1M tokens)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "blendedPrice") && (
                      <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            model.pricing.blendedPricePer1M <= 0
                              ? "text-slate-400 font-normal"
                              : model.pricing.blendedPricePer1M <= 0.5
                                ? "text-emerald-700"
                                : "text-slate-900"
                          }`}
                        >
                          {formatPrice(model.pricing.blendedPricePer1M)}
                        </span>
                        {model.pricing.blendedPricePer1M > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal ml-0.5">/1M</span>
                        )}
                      </td>
                    )}

                    {/* ====================================================
                        COLUMN: Input / Output Price ($ / 1M)
                        ==================================================== */}
                    {visibleColumns.some((c) => c.id === "inputOutputPrice") && (
                      <td className="py-3 px-3 text-right text-slate-600 tabular-nums whitespace-nowrap text-[11px]">
                        <span>${model.pricing.inputPricePer1M.toFixed(2)}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span>${model.pricing.outputPricePer1M.toFixed(2)}</span>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================
          3. FLOATING ACTION BAR FOR COMPARISON (BOTTOM)
          ======================================================== */}
      {selectedCompareIds.length > 0 && (
        <div className="sticky bottom-4 z-40 mx-auto max-w-2xl w-full px-4 mt-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap flex items-center gap-1.5 pl-1">
                <Scale size={14} className="text-[#0047FF]" />
                <span>Compare:</span>
              </span>

              {selectedCompareIds.map((id) => {
                const model = models.find((m) => m.id === id);
                if (!model) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0047FF] border border-blue-200 shrink-0"
                  >
                    <CreatorLogo creator={model.creator} size={14} />
                    <span className="truncate max-w-[130px]">{model.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleCompare(id, e)}
                      className="text-[#0047FF] hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                      title="Remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}

              {selectedCompareIds.length < 3 && (
                <span className="text-[11px] text-slate-400 italic whitespace-nowrap px-1">
                  ({3 - selectedCompareIds.length} more slot available)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                type="button"
                onClick={handleClearCompare}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={selectedCompareIds.length < 2}
                onClick={handleLaunchCompare}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  selectedCompareIds.length >= 2
                    ? "bg-[#0047FF] hover:bg-[#2966FF] text-white active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Scale size={13} />
                <span>Compare Models ({selectedCompareIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
