import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Plus,
  Minus,
  RotateCcw,
  Check,
} from "lucide-react";
import { AIModelBenchmark, WeightsType, ReasoningType } from "../types";
import { CreatorLogo } from "../ui/CreatorLogo";

export interface LLMLeaderboardViewProps {
  models: AIModelBenchmark[];
  selectedModelId?: string | null;
  onSelectModel?: (model: AIModelBenchmark) => void;
  onNavigateToModels?: (model: AIModelBenchmark) => void;
  onCompareSingle?: (model: AIModelBenchmark) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export type LLMSortField =
  | "name"
  | "contextWindow"
  | "creator"
  | "intelligenceIndex"
  | "blendedPrice"
  | "outputSpeed"
  | "ttftLatency"
  | "totalResponse500";

export type SortDirection = "asc" | "desc";

/**
 * Format context window token count into compact human string: 1M, 10M, 128K, 200K
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
 * Format blended price per 1M tokens ($X.XX or —)
 */
function formatPrice(usd: number): string {
  if (usd <= 0) return "—";
  if (usd < 0.1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Format latency TTFT into human readable format (e.g. 450 ms, 2.3 s, 9m 17s)
 */
function formatLatency(ttftSec: number): string {
  if (!ttftSec || ttftSec <= 0) return "—";
  if (ttftSec < 1) {
    return `${Math.round(ttftSec * 1000)} ms`;
  }
  if (ttftSec < 60) {
    return `${ttftSec.toFixed(1)} s`;
  }
  const min = Math.floor(ttftSec / 60);
  const sec = Math.round(ttftSec % 60);
  return `${min}m ${sec}s`;
}

/**
 * Format 500-token end-to-end response time into human readable format
 */
function format500TokenTime(model: AIModelBenchmark): string {
  const e2e = model.performance.endToEnd500TokensSec;
  if (e2e && e2e > 0) {
    return formatLatency(e2e);
  }
  return "—";
}

/**
 * Left-side accent color for model table rows
 */
function getModelAccentColor(model: AIModelBenchmark): string {
  switch (model.creator) {
    case "anthropic":
      return "#EA580C"; // Vivid terracotta / amber
    case "openai":
      return "#18181B"; // Pitch dark slate
    case "google":
      return "#10B981"; // Emerald
    case "meta":
      return "#2563EB"; // Royal Blue
    case "deepseek":
      return "#06B6D4"; // Electric Cyan
    case "mistral":
      return "#FF7000"; // Orange
    case "xai":
      return "#0F172A"; // Black
    case "cohere":
      return "#059669"; // Deep Green
    default:
      return "#0047FF"; // Purple
  }
}

interface FilterSelectOption<T extends string> {
  value: T;
  label: string;
}

interface FilterSelectProps<T extends string> {
  value: T;
  options: FilterSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

/**
 * Filter dropdown rendered in-page (no native <select> popup).
 * Opens instantly with no transitions or animations.
 */
function FilterSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: FilterSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="relative h-10 min-h-[40px] pl-3.5 pr-8 text-xs font-semibold rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50/50 outline-none cursor-pointer whitespace-nowrap transition-colors flex items-center"
      >
        {selected.label}
        <ChevronDown
          size={12}
          strokeWidth={1.75}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
      </button>

      {isOpen && (
        <>
          {/* Click catcher: closes the menu on any outside click (no overlay effect) */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            role="listbox"
            aria-label={ariaLabel}
            className="absolute left-0 top-full mt-1.5 z-50 min-w-full bg-white border border-neutral-200 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] py-1 overflow-hidden"
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                }}
                className={`w-full min-h-[38px] flex items-center justify-between gap-4 px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  o.value === value
                    ? "bg-neutral-100 text-neutral-950 font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <span>{o.label}</span>
                {o.value === value && (
                  <Check size={12} strokeWidth={1.75} className="text-[#0047FF]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const LLMLeaderboardView: React.FC<LLMLeaderboardViewProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onNavigateToModels,
  onCompareSingle,
  searchInputRef,
}) => {
  // Navigation / View state: "all" (Frontier & LLM 71) or "top10" (Top 10 List)
  const [activeLeaderboardMode, setActiveLeaderboardMode] = useState<"all" | "top10">("all");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [weightsFilter, setWeightsFilter] = useState<"all" | WeightsType>("all");
  const [sizeFilter, setSizeFilter] = useState<"all" | "frontier" | "large" | "medium" | "small">(
    "all"
  );
  const [priceFilter, setPriceFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [reasoningFilter, setReasoningFilter] = useState<"all" | ReasoningType>("all");
  const [statusFilter, setStatusFilter] = useState<"current" | "all">("current");

  // Sorting state (default: Intelligence Index descending)
  const [sortField, setSortField] = useState<LLMSortField>("intelligenceIndex");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Interactive FAQ & Definitions Accordion states
  const [openDefinitions, setOpenDefinitions] = useState<Record<string, boolean>>({
    blendedPrice: false,
    benchmarkMetrics: false,
  });

  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({
    0: false,
  });

  const toggleDefinition = (key: string) => {
    setOpenDefinitions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Sort handler
  const handleSort = (field: LLMSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      const defaultDesc = ["intelligenceIndex", "contextWindow", "outputSpeed"].includes(field);
      setSortField(field);
      setSortDirection(defaultDesc ? "desc" : "asc");
    }
  };

  // Filter models
  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return models.filter((m) => {
      // Search filter
      if (q) {
        const matchName = m.name.toLowerCase().includes(q);
        const matchCreator = m.creatorDisplayName.toLowerCase().includes(q);
        const matchId = m.id.toLowerCase().includes(q);
        const matchTags = m.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchCreator && !matchId && !matchTags) return false;
      }

      // Weights filter ("Open Weights" includes commercially-restricted open models)
      if (weightsFilter === "open-weights") {
        if (m.weightsType === "proprietary") return false;
      } else if (weightsFilter === "proprietary") {
        if (m.weightsType !== "proprietary") return false;
      }

      // Reasoning filter
      if (reasoningFilter !== "all") {
        if (reasoningFilter === "extended-thinking" && !m.isReasoningModel) return false;
        if (reasoningFilter === "standard" && m.isReasoningModel) return false;
      }

      // Price filter
      if (priceFilter !== "all") {
        const p = m.pricing.blendedPricePer1M;
        if (priceFilter === "low" && p >= 1.0) return false;
        if (priceFilter === "medium" && (p < 1.0 || p > 5.0)) return false;
        if (priceFilter === "high" && p <= 5.0) return false;
      }

      // Size filter
      if (sizeFilter !== "all") {
        const paramsB = m.totalParametersB || 0;
        if (sizeFilter === "frontier" && paramsB < 100) return false;
        if (sizeFilter === "large" && (paramsB < 70 || paramsB >= 100)) return false;
        if (sizeFilter === "medium" && (paramsB < 14 || paramsB >= 70)) return false;
        if (sizeFilter === "small" && paramsB >= 14) return false;
      }

      // Status filter
      if (statusFilter === "current") {
        if (m.noPublicApi) return false;
      }

      return true;
    });
  }, [models, searchQuery, weightsFilter, reasoningFilter, priceFilter, sizeFilter, statusFilter]);

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
        case "contextWindow":
          valA = a.contextWindowTokens;
          valB = b.contextWindowTokens;
          break;
        case "creator":
          valA = a.creatorDisplayName.toLowerCase();
          valB = b.creatorDisplayName.toLowerCase();
          break;
        case "intelligenceIndex":
          valA = a.quality.intelligenceIndex ?? -1;
          valB = b.quality.intelligenceIndex ?? -1;
          break;
        case "blendedPrice":
          valA = a.pricing.blendedPricePer1M;
          valB = b.pricing.blendedPricePer1M;
          break;
        case "outputSpeed":
          valA = a.performance.outputSpeedTokensPerSec.median;
          valB = b.performance.outputSpeedTokensPerSec.median;
          break;
        case "ttftLatency":
          valA = a.performance.ttftSeconds.median;
          valB = b.performance.ttftSeconds.median;
          break;
        case "totalResponse500":
          valA = a.performance.endToEnd500TokensSec || 0;
          valB = b.performance.endToEnd500TokensSec || 0;
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

    if (activeLeaderboardMode === "top10") {
      return list.slice(0, 10);
    }
    return list;
  }, [filteredModels, sortField, sortDirection, activeLeaderboardMode]);

  return (
    <div className="w-full min-h-screen bg-white text-neutral-900 font-sans flex flex-col selection:bg-[#0047FF]/15">
      {/* ========================================================
          1. HEADER SECTION (Newsreader Serif)
          ======================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-6 sm:pb-8">
        {/* Centered Title & Subtitle */}
        <div className="flex flex-col items-center text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-neutral-950 tracking-tight leading-tight">
            LLM Leaderboard
          </h1>
          <p className="mt-3 text-sm text-neutral-600 max-w-2xl leading-relaxed">
            Comparison of AI models from OpenAI, Anthropic, Google, DeepSeek &amp; others
          </p>
        </div>
      </section>

      {/* ========================================================
          3. TABLE CONTROLS & FILTER BAR (All in the Same Level)
          ======================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left / Middle Group: Search input + Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* 1. Search Bar */}
            <div className="relative w-full sm:w-64 md:w-72 shrink-0">
              <Search
                size={16}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter e.g. GPT, Meta"
                className="w-full h-10 min-h-[40px] pl-10 pr-9 text-xs rounded-xl border border-neutral-200 bg-white focus:bg-white focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200/50 text-neutral-900 placeholder:text-neutral-400 outline-none font-sans transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                  title="Clear filter"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* 2. Filter Dropdowns */}
            {/* Weights Filter */}
            <FilterSelect<"all" | WeightsType>
              value={weightsFilter}
              ariaLabel="Filter by weights"
              onChange={setWeightsFilter}
              options={[
                { value: "all", label: "Weights: All" },
                { value: "proprietary", label: "Weights: Proprietary" },
                { value: "open-weights", label: "Weights: Open Weights" },
              ]}
            />

            {/* Size Filter */}
            <FilterSelect<"all" | "frontier" | "large" | "medium" | "small">
              value={sizeFilter}
              ariaLabel="Filter by model size"
              onChange={setSizeFilter}
              options={[
                { value: "all", label: "Size: All" },
                { value: "frontier", label: "Size: Frontier / 100B+" },
                { value: "large", label: "Size: Large (70B)" },
                { value: "medium", label: "Size: Medium (14B–32B)" },
                { value: "small", label: "Size: Small (<10B)" },
              ]}
            />

            {/* Price Filter */}
            <FilterSelect<"all" | "low" | "medium" | "high">
              value={priceFilter}
              ariaLabel="Filter by blended price"
              onChange={setPriceFilter}
              options={[
                { value: "all", label: "Price: All" },
                { value: "low", label: "Price: Low (<$1.00)" },
                { value: "medium", label: "Price: Medium ($1.00–$5.00)" },
                { value: "high", label: "Price: Frontier (>$5.00)" },
              ]}
            />

            {/* Reasoning Filter */}
            <FilterSelect<"all" | ReasoningType>
              value={reasoningFilter}
              ariaLabel="Filter by reasoning type"
              onChange={setReasoningFilter}
              options={[
                { value: "all", label: "Reasoning: All" },
                { value: "extended-thinking", label: "Reasoning: Thinking / CoT" },
                { value: "standard", label: "Reasoning: Standard" },
              ]}
            />

            {/* Status Filter */}
            <FilterSelect<"current" | "all">
              value={statusFilter}
              ariaLabel="Filter by model status"
              onChange={setStatusFilter}
              options={[
                { value: "current", label: "Status: Current" },
                { value: "all", label: "Status: All" },
              ]}
            />

            {/* Reset Filter Button */}
            {(searchQuery ||
              weightsFilter !== "all" ||
              sizeFilter !== "all" ||
              priceFilter !== "all" ||
              reasoningFilter !== "all" ||
              statusFilter !== "current") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setWeightsFilter("all");
                  setSizeFilter("all");
                  setPriceFilter("all");
                  setReasoningFilter("all");
                  setStatusFilter("current");
                }}
                className="h-9 px-3 rounded-none border border-dashed border-neutral-300 text-xs font-bold text-neutral-600 flex items-center gap-1 cursor-pointer hover:border-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* 3. Mode Toggle Pills: All Models vs Top 10 (Right Corner) */}
          <div className="inline-flex items-center gap-1 bg-neutral-100 p-1 rounded-full border border-neutral-200/50 shadow-2xs select-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveLeaderboardMode("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 cursor-pointer transition-all duration-150 ${
                activeLeaderboardMode === "all"
                  ? "bg-[#0047FF] text-white shadow-xs"
                  : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60"
              }`}
            >
              <span>All Models</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium leading-none ${
                  activeLeaderboardMode === "all"
                    ? "bg-white/20 text-white"
                    : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {models.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLeaderboardMode("top10")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 cursor-pointer transition-all duration-150 ${
                activeLeaderboardMode === "top10"
                  ? "bg-[#0047FF] text-white shadow-xs"
                  : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60"
              }`}
            >
              <span>Top 10</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium leading-none ${
                  activeLeaderboardMode === "top10"
                    ? "bg-white/20 text-white"
                    : "bg-neutral-200 text-neutral-700"
                }`}
              >
                10
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. LEADERBOARD DATA TABLE
          ======================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="w-full overflow-x-auto rounded-2xl bg-white">
          <table className="w-full border-collapse text-left text-sm">
            {/* Table Header */}
            <thead>
              <tr className="bg-neutral-50/80 text-neutral-700 font-semibold select-none">
                {/* 1. Model Name */}
                <th
                  scope="col"
                  className="py-4 pl-5 pr-4 min-w-[300px] font-semibold text-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Model</span>
                    {sortField === "name" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-neutral-400" />
                    )}
                  </button>
                </th>

                {/* 2. Context Window */}
                <th
                  scope="col"
                  className="py-4 px-4 min-w-[130px] text-center font-semibold text-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("contextWindow")}
                    className="inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Context Window</span>
                    {sortField === "contextWindow" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-neutral-400" />
                    )}
                  </button>
                </th>

                {/* 3. Creator */}
                <th scope="col" className="py-4 px-4 min-w-[150px] font-semibold text-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleSort("creator")}
                    className="inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Creator</span>
                    {sortField === "creator" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-neutral-400" />
                    )}
                  </button>
                </th>

                {/* 4. Intelligence Index */}
                <th
                  scope="col"
                  className="py-4 px-4 min-w-[150px] text-center font-semibold text-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("intelligenceIndex")}
                    className="inline-flex flex-col items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span>Intelligence</span>
                      {sortField === "intelligenceIndex" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-neutral-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-normal text-neutral-400">Sara Analysis</span>
                  </button>
                </th>

                {/* 5. Blended Price */}
                <th
                  scope="col"
                  className="py-4 px-4 min-w-[130px] text-right font-semibold text-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("blendedPrice")}
                    className="inline-flex flex-col items-end cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span>Price</span>
                      {sortField === "blendedPrice" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-neutral-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-normal text-neutral-400">
                      cost per 1M tok
                    </span>
                  </button>
                </th>

                {/* 6. Output Speed */}
                <th
                  scope="col"
                  className="py-4 px-4 min-w-[120px] text-right font-semibold text-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("outputSpeed")}
                    className="inline-flex flex-col items-end cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span>Speed</span>
                      {sortField === "outputSpeed" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-neutral-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-normal text-neutral-400">Median (tok/s)</span>
                  </button>
                </th>

                {/* 7. Latency TTFT */}
                <th
                  scope="col"
                  className="py-4 px-4 min-w-[130px] text-right font-semibold text-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("ttftLatency")}
                    className="inline-flex flex-col items-end cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span>Latency</span>
                      {sortField === "ttftLatency" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-neutral-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-normal text-neutral-400">TTFT</span>
                  </button>
                </th>

                {/* 8. Time to First Response (500-Token Time) */}
                <th
                  scope="col"
                  className="py-4 px-4 min-w-[160px] text-right font-semibold text-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("totalResponse500")}
                    className="inline-flex flex-col items-end cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span>Time to 500 Tokens</span>
                      {sortField === "totalResponse500" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-neutral-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-normal text-neutral-400">
                      Total Response (ms)
                    </span>
                  </button>
                </th>

                {/* 9. Further Metrics */}
                <th
                  scope="col"
                  className="py-4 px-5 min-w-[160px] text-center font-semibold text-neutral-800"
                >
                  <span>Further Metrics</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {sortedModels.map((m) => {
                const isSelected = selectedModelId === m.id;
                const accentColor = getModelAccentColor(m);

                return (
                  <tr
                    key={m.id}
                    onClick={() => {
                      if (onNavigateToModels) {
                        onNavigateToModels(m);
                      } else {
                        onSelectModel?.(m);
                      }
                    }}
                    className={`group  cursor-pointer ${isSelected ? "bg-[#0047FF]/5" : "/70"}`}
                  >
                    {/* 1. Model Name with Left Colored Indicator Bar */}
                    <td className="py-4 pl-5 pr-3 font-medium text-neutral-900">
                      <div className="flex items-center gap-3">
                        {/* Colored accent indicator matching creator */}
                        <span
                          className="w-1 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span className="font-medium text-sm text-neutral-900 group-">
                          {m.name}
                        </span>
                        {m.qualityIndexVersion && (
                          <span
                            className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                            title={`This score uses Sara Analysis ${m.qualityIndexVersion}; scores from older index versions are not directly comparable.`}
                          >
                            {m.qualityIndexVersion}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Context Window */}
                    <td className="py-4 px-4 text-center text-sm font-mono text-neutral-600">
                      {formatContextWindow(m.contextWindowTokens)}
                    </td>

                    {/* 3. Creator */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-800 font-medium">
                        <CreatorLogo creator={m.creator} size={16} />
                        <span>{m.creatorDisplayName}</span>
                      </div>
                    </td>

                    {/* 4. Intelligence Index */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className="font-bold text-sm text-neutral-950 font-mono"
                        title={
                          m.qualityIndexVersion
                            ? `Sara Analysis ${m.qualityIndexVersion}`
                            : undefined
                        }
                      >
                        {m.quality.intelligenceIndex == null
                          ? "—"
                          : Math.round(m.quality.intelligenceIndex)}
                      </span>
                    </td>

                    {/* 5. Blended Price */}
                    <td className="py-4 px-4 text-right font-mono text-sm text-neutral-800">
                      {formatPrice(m.pricing.blendedPricePer1M)}
                    </td>

                    {/* 6. Output Speed */}
                    <td className="py-4 px-4 text-right font-mono text-sm text-neutral-800">
                      {m.performance.outputSpeedTokensPerSec.median > 0
                        ? Math.round(m.performance.outputSpeedTokensPerSec.median)
                        : "—"}
                    </td>

                    {/* 7. Latency TTFT */}
                    <td className="py-4 px-4 text-right font-mono text-sm text-neutral-700">
                      {formatLatency(m.performance.ttftSeconds.median)}
                    </td>

                    {/* 8. Time to First Response (500-Token Time) */}
                    <td className="py-4 px-4 text-right font-mono text-sm text-neutral-700">
                      {format500TokenTime(m)}
                    </td>

                    {/* 9. Further Metrics: Model ↗ and Compare */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToModels) {
                              onNavigateToModels(m);
                            } else {
                              onSelectModel?.(m);
                            }
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-600 bg-neutral-100/80   cursor-pointer flex items-center gap-0.5"
                        >
                          <span>Model</span>
                          <span className="text-[10px]">↗</span>
                        </button>

                        {onCompareSingle && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompareSingle(m);
                            }}
                            className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-600 bg-neutral-100   cursor-pointer flex items-center gap-0.5"
                            title="Compare in Head-to-Head Radar"
                          >
                            <span>Compare</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================
          5. KEY DEFINITIONS SECTION (ACCORDION)
          ======================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
        <h2 className="font-serif text-2xl font-normal text-neutral-950 tracking-tight mb-4">
          Key definitions
        </h2>

        <div className="space-y-2 border-t border-neutral-200 pt-3">
          {/* Definition 1: Blended Price */}
          <div className="border-b border-neutral-200/80 pb-3">
            <button
              type="button"
              onClick={() => toggleDefinition("blendedPrice")}
              className="w-full flex items-center justify-between py-2 text-left text-xs font-semibold text-neutral-900 cursor-pointer"
            >
              <span>Blended Price</span>
              {openDefinitions.blendedPrice ? (
                <Minus size={14} className="text-neutral-500" />
              ) : (
                <Plus size={14} className="text-neutral-500" />
              )}
            </button>
            {openDefinitions.blendedPrice && (
              <p className="text-xs text-neutral-600 leading-relaxed pt-1 pb-2">
                Blended price represents the estimated cost per 1M tokens based on a standard 3:1
                ratio of input to output tokens: (3 × Input Price + 1 × Output Price) / 4. This
                weighting reflects typical real-world LLM workloads where prompt input context is
                approximately 3× the generated completion size.
              </p>
            )}
          </div>

          {/* Definition 2: Benchmark Metrics */}
          <div className="border-b border-neutral-200/80 pb-3">
            <button
              type="button"
              onClick={() => toggleDefinition("benchmarkMetrics")}
              className="w-full flex items-center justify-between py-2 text-left text-xs font-semibold text-neutral-900 cursor-pointer"
            >
              <span>Benchmark Metrics</span>
              {openDefinitions.benchmarkMetrics ? (
                <Minus size={14} className="text-neutral-500" />
              ) : (
                <Plus size={14} className="text-neutral-500" />
              )}
            </button>
            {openDefinitions.benchmarkMetrics && (
              <div className="text-xs text-neutral-600 leading-relaxed pt-1 pb-2 space-y-1.5">
                <p>
                  <strong className="text-neutral-900">Intelligence Index:</strong> A standardized
                  composite score evaluating factual accuracy, multi-step reasoning, coding, and
                  mathematical logic.
                </p>
                <p>
                  <strong className="text-neutral-900">Output Speed:</strong> Median tokens
                  generated per second across 100+ concurrent requests.
                </p>
                <p>
                  <strong className="text-neutral-900">Latency (TTFT):</strong> Time to first token
                  in milliseconds from the receipt of the last input token.
                </p>
                <p>
                  <strong className="text-neutral-900">Time to 500 Tokens:</strong> Total elapsed
                  time required to complete a 500-token generation stream.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FREQUENTLY ASKED QUESTIONS (FAQ) SECTION (ACCORDION)
          ======================================================== */}
      <section id="faq" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-950 tracking-tight mb-6">
          Frequently Asked Questions
        </h2>

        <div className="border-t border-neutral-200 divide-y divide-neutral-200/80">
          {[
            {
              q: "Which AI model ranks 1st on the LLM Leaderboard?",
              a: "Gemini 4 Carbon (high) leads the newly released Sara Analysis Intelligence Index v5.0 with a score of 59. The new version uses nine revised evaluations; older scores in this leaderboard use v4.3.2 and are not directly comparable.",
            },
            {
              q: "What are the top models on the LLM Leaderboard?",
              a: "Gemini 4 Carbon (high) currently leads Sara Analysis v5.0 at 59. The v4.3.2 rankings still visible in this list use a different evaluation set; compare scores within the same version.",
            },
            {
              q: "Which AI model has the fastest output speed?",
              a: "Celeris-1 is the fastest at 1,442.8 tokens per second, followed by K2 Horizon 375B A23B (1,009.4 t/s) and Mercury 2.5 (776 t/s).",
            },
            {
              q: "Which AI model is the best all-rounder?",
              a: "For the optimal balance of intelligence, latency, and cost per task, Claude Sonnet 5.5 (max with fallback) and Claude Haiku 5.5 (max) represent the frontier sweet-spot for production deployments.",
            },
            {
              q: "Which is the best open weights model on the leaderboard?",
              a: "MiMo-V2.6-Pro is the highest-ranked open weights model in the legacy v4.3.2 index with a score of 46. The benchmark catalog also lists Gemini 4 Carbon’s separate v5.0 result; scores across versions are not directly comparable.",
            },
            {
              q: "What are the top open weights models on the leaderboard?",
              a: "The top open weights models by Intelligence Index are: 1. MiMo-V2.6-Pro (46), 2. GLM-5.3 (max) (45), and 3. Step 5 Preview (44).",
            },
            {
              q: "Which is the best reasoning model on the leaderboard?",
              a: "Gemini 4 Carbon (high) is the latest v5.0 index leader at 59. Its reasoning-focused design targets long-horizon engineering and cybersecurity workflows; v5.0 is a revised evaluation set.",
            },
            {
              q: "How do I filter models on the leaderboard?",
              a: "Use the toolbar filters above the table to slice by License / Weights (Open Weights vs. Proprietary), Model Size, Blended Price, and Reasoning Type.",
            },
            {
              q: "Where can I see more detailed metrics for a model?",
              a: 'Click "Model ↗" on any row or click the model name directly to open the deep inspection modal featuring full MMLU-Pro, SWE-bench Verified, GPQA Diamond, and cost breakdowns.',
            },
          ].map((item, idx) => {
            const isOpen = Boolean(openFaq[idx]);
            return (
              <div key={idx} className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-[13px] font-semibold text-neutral-900 cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <Minus size={14} className="text-neutral-500 shrink-0 ml-4" />
                  ) : (
                    <Plus size={14} className="text-neutral-500 shrink-0 ml-4" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed pt-2.5 pb-1 max-w-4xl">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
