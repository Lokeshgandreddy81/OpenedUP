import React, { useMemo } from "react";
import {
  Brain,
  Zap,
  Clock,
  Coins,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { AIModelBenchmark } from "../types";
import { CreatorLogo } from "../ui/CreatorLogo";


export type HighlightCategoryId = "intelligence" | "speed" | "latency" | "price" | "context";

export interface BenchmarkHighlightsProps {
  models: AIModelBenchmark[];
  onSelectModel?: (model: AIModelBenchmark) => void;
  selectedModelId?: string | null;
  onCategoryClick?: (category: HighlightCategoryId) => void;
  activeCategory?: HighlightCategoryId | null;
  className?: string;
}

interface HighlightCardData {
  categoryId: HighlightCategoryId;
  categoryLabel: string;
  categoryTag: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBgColor: string;
  iconTextColor: string;
  primaryStatValue: string;
  primaryStatUnit: string;
  primaryStatBadge?: string;
  model: AIModelBenchmark | null;
  modelDisplayName: string;
  creatorDisplayName: string;
  subtitle: string;
  accentBorderColor: string;
  accentBgHover: string;
}

export const BenchmarkHighlights: React.FC<BenchmarkHighlightsProps> = ({
  models,
  onSelectModel,
  selectedModelId,
  onCategoryClick,
  activeCategory,
  className = "",
}) => {
  // Compute best-in-class models from the dataset
  const cardsData = useMemo<HighlightCardData[]>(() => {
    if (!models || models.length === 0) return [];

    // 1. Intelligence Leader: Claude 3.7 Sonnet or o3 (highest intelligenceIndex)
    const sortedQuality = [...models].sort(
      (a, b) => b.quality.intelligenceIndex - a.quality.intelligenceIndex
    );
    // Prefer Claude 3.7 Sonnet if present or top quality model
    const intelligenceModel =
      models.find((m) => m.id === "claude-3-7-sonnet-thinking") || sortedQuality[0];
    const intelligenceRunnerUp = sortedQuality.find((m) => m.id !== intelligenceModel?.id);

    // 2. Throughput Speed Champion: Llama 3.1 8B / Llama 3.2 3B / Cerebras
    const sortedSpeed = [...models].sort(
      (a, b) =>
        b.performance.outputSpeedTokensPerSec.median - a.performance.outputSpeedTokensPerSec.median
    );
    const speedModel =
      models.find((m) => m.id === "llama-3-1-8b-instruct") ||
      models.find((m) => m.id === "llama-3-2-3b") ||
      sortedSpeed[0];

    // 3. Latency Benchmark: Lowest TTFT (0.35s - 0.42s)
    const sortedLatency = [...models].sort(
      (a, b) => a.performance.ttftSeconds.median - b.performance.ttftSeconds.median
    );
    const latencyModel = sortedLatency[0];
    const latencyRunnerUp = sortedLatency[1];

    // 4. Cost Efficiency Star: DeepSeek-V3 / Llama 3.2 3B / Gemini 2.0 Flash
    const sortedCost = [...models].sort(
      (a, b) => a.pricing.blendedPricePer1M - b.pricing.blendedPricePer1M
    );
    // Find frontier value star (DeepSeek-V3 or Gemini 2.0 Flash or cheapest)
    const costModel =
      models.find((m) => m.id === "deepseek-v3") ||
      models.find((m) => m.id === "gemini-2-0-flash") ||
      sortedCost[0];
    const ultraBudgetModel = sortedCost[0];

    // 5. Context Window Titan: Gemini 2.0 Pro (2,000,000 tokens)
    const sortedContext = [...models].sort((a, b) => b.contextWindowTokens - a.contextWindowTokens);
    const contextModel = sortedContext[0];
    const contextRunnerUp = sortedContext[1];

    const cards: HighlightCardData[] = [
      // 1. Intelligence
      {
        categoryId: "intelligence",
        categoryLabel: "Intelligence Leader",
        categoryTag: "Quality Frontier",
        icon: Brain,
        iconBgColor: "bg-[#BEDBFF]/30 border-[#BEDBFF]",
        iconTextColor: "text-[#0047FF]",
        primaryStatValue: `${intelligenceModel?.quality.intelligenceIndex.toFixed(1) ?? "58.2"}`,
        primaryStatUnit: "Intelligence Index",
        primaryStatBadge: "MMLU-Pro 88.5%",
        model: intelligenceModel,
        modelDisplayName: intelligenceModel?.name ?? "Claude 3.7 Sonnet",
        creatorDisplayName: intelligenceModel?.creatorDisplayName ?? "Anthropic",
        subtitle: intelligenceRunnerUp
          ? `Runner up: ${intelligenceRunnerUp.name} (${intelligenceRunnerUp.quality.intelligenceIndex.toFixed(1)})`
          : "GPQA Diamond & SWE-bench benchmark leader",
        accentBorderColor: "border-[#BEDBFF]",
        accentBgHover: "hover:border-[#0047FF]/50",
      },

      // 2. Speed
      {
        categoryId: "speed",
        categoryLabel: "Throughput Speed Champion",
        categoryTag: "Hardware Accelerated",
        icon: Zap,
        iconBgColor: "bg-sky-50 border-sky-100",
        iconTextColor: "text-[#0284C7]",
        primaryStatValue: "1,420+",
        primaryStatUnit: "tokens / sec",
        primaryStatBadge: "Cerebras CS-3 & Groq",
        model: speedModel,
        modelDisplayName: `${speedModel?.name ?? "Llama 3.1 8B"} (Cerebras / Groq)`,
        creatorDisplayName: "Cerebras • Groq • Meta",
        subtitle: `Standard API median: ${speedModel?.performance.outputSpeedTokensPerSec.median ?? 320} tk/s • Peak: 1,850 tk/s`,
        accentBorderColor: "border-sky-200/90",
        accentBgHover: "hover:border-sky-300",
      },

      // 3. Latency
      {
        categoryId: "latency",
        categoryLabel: "Latency Benchmark",
        categoryTag: "Real-time TTFT",
        icon: Clock,
        iconBgColor: "bg-sky-50 border-sky-100",
        iconTextColor: "text-sky-600",
        primaryStatValue: `${latencyModel?.performance.ttftSeconds.median.toFixed(2) ?? "0.35"}s`,
        primaryStatUnit: "Time To First Token",
        primaryStatBadge: "Sub-400ms",
        model: latencyModel,
        modelDisplayName: latencyModel?.name ?? "Llama 3.2 3B",
        creatorDisplayName: latencyModel?.creatorDisplayName ?? "Meta",
        subtitle: latencyRunnerUp
          ? `Runner up: ${latencyRunnerUp.name} (${latencyRunnerUp.performance.ttftSeconds.median.toFixed(2)}s)`
          : "Instant conversational stream initiation",
        accentBorderColor: "border-sky-200/90",
        accentBgHover: "hover:border-sky-300",
      },

      // 4. Cost Efficiency
      {
        categoryId: "price",
        categoryLabel: "Cost Efficiency Star",
        categoryTag: "Blended 3:1 Ratio",
        icon: Coins,
        iconBgColor: "bg-emerald-50 border-emerald-100",
        iconTextColor: "text-emerald-600",
        primaryStatValue: `$${costModel?.pricing.blendedPricePer1M.toFixed(2) ?? "0.21"}`,
        primaryStatUnit: "per 1M tokens",
        primaryStatBadge: "98% vs Frontier",
        model: costModel,
        modelDisplayName: costModel?.name ?? "DeepSeek-V3",
        creatorDisplayName: costModel?.creatorDisplayName ?? "DeepSeek",
        subtitle:
          ultraBudgetModel && ultraBudgetModel.id !== costModel?.id
            ? `Ultra-budget: ${ultraBudgetModel.name} ($${ultraBudgetModel.pricing.blendedPricePer1M.toFixed(2)}/1M)`
            : "Gemini 2.0 Flash: $0.14/1M • Llama 3.2: $0.04/1M",
        accentBorderColor: "border-emerald-200/90",
        accentBgHover: "hover:border-emerald-300",
      },

      // 5. Context Window Titan
      {
        categoryId: "context",
        categoryLabel: "Context Window Titan",
        categoryTag: "2M+ Token Window",
        icon: Layers,
        iconBgColor: "bg-blue-50 border-blue-100",
        iconTextColor: "text-[#2966FF]",
        primaryStatValue: "2,097,152",
        primaryStatUnit: "tokens (~1.5M words)",
        primaryStatBadge: "60k Lines Code",
        model: contextModel,
        modelDisplayName: contextModel?.name ?? "Gemini 2.0 Pro",
        creatorDisplayName: contextModel?.creatorDisplayName ?? "Google",
        subtitle: contextRunnerUp
          ? `Runner up: ${contextRunnerUp.name} (${(contextRunnerUp.contextWindowTokens / 1_000_000).toFixed(1)}M tok)`
          : "Full codebase & hours of audio/video in single context",
        accentBorderColor: "border-blue-200/90",
        accentBgHover: "hover:border-blue-300",
      },
    ];

    return cards;
  }, [models]);

  if (cardsData.length === 0) {
    return null;
  }

  const handleCardClick = (card: HighlightCardData) => {
    if (card.model && onSelectModel) {
      onSelectModel(card.model);
    }
    if (onCategoryClick) {
      onCategoryClick(card.categoryId);
    }
  };

  return (
    <section aria-label="Benchmark KPI Highlights" className={`w-full ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#BEDBFF]/30 text-[#0047FF] border border-[#BEDBFF] text-[11px] font-semibold">
              <Sparkles size={11} className="text-[#0047FF]" />
              Executive Market Brief
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Artificial Analysis Index</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
            Frontier AI Benchmark Highlights
          </h2>
        </div>

        <p className="text-xs text-slate-500 max-w-sm hidden md:block text-right">
          Interactive KPI leaders across Intelligence, Output Speed, Time-to-First-Token, Blended
          Cost, and Context.
        </p>
      </div>

      {/* 5 KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {cardsData.map((card) => {
          const Icon = card.icon;
          const isSelected =
            (card.model && selectedModelId === card.model.id) || activeCategory === card.categoryId;

          return (
            <div
              key={card.categoryId}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(card)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(card);
                }
              }}
              aria-pressed={isSelected}
              className={`group relative bg-white rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none text-left shadow-xs hover:shadow-md ${
                isSelected
                  ? "border-[#0047FF] ring-2 ring-[#0047FF]/25 bg-blue-50/15"
                  : `border-slate-200/80 hover:border-[#BEDBFF] hover:bg-slate-50/40`
              }`}
            >
              {/* Top row: Icon + Category Tag */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBgColor}`}
                  >
                    <Icon size={16} className={card.iconTextColor} />
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 truncate">
                    {card.categoryTag}
                  </span>
                </div>

                {/* Category Title */}
                <h3 className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  {card.categoryLabel}
                </h3>

                {/* Primary Metric Number */}
                <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight tabular-nums leading-none">
                    {card.primaryStatValue}
                  </span>
                </div>

                {/* Stat Unit + Badge */}
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-500">
                    {card.primaryStatUnit}
                  </span>
                  {card.primaryStatBadge && (
                    <span className="inline-flex items-center text-[10px] font-semibold text-[#0047FF] bg-[#BEDBFF]/35 px-1.5 py-0.2 rounded border border-[#BEDBFF]/60">
                      {card.primaryStatBadge}
                    </span>
                  )}
                </div>

                {/* Visual Micro Progress Bar / Spark Indicator */}
                <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      card.categoryId === "intelligence"
                        ? "bg-[#0047FF]"
                        : card.categoryId === "speed"
                          ? "bg-[#0284C7]"
                          : card.categoryId === "latency"
                            ? "bg-sky-500"
                            : card.categoryId === "price"
                              ? "bg-emerald-500"
                              : "bg-[#2966FF]"
                    }`}
                    style={{
                      width:
                        card.categoryId === "intelligence"
                          ? `${card.model?.quality.intelligenceIndex || 58.2}%`
                          : card.categoryId === "speed"
                            ? "95%"
                            : card.categoryId === "latency"
                              ? "88%"
                              : card.categoryId === "price"
                                ? "98%"
                                : "100%",
                    }}
                  />
                </div>
              </div>

              {/* Bottom: Model Name + Creator Logo + Subtitle */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                {card.model && (
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CreatorLogo creator={card.model.creator} size={15} className="shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#0047FF] transition-colors">
                        {card.modelDisplayName}
                      </span>
                    </div>

                    <ArrowUpRight
                      size={13}
                      className="text-slate-400 group-hover:text-[#0047FF] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                )}

                {/* Runner-up / Subtitle detail */}
                <p className="text-[11px] text-slate-400 group-hover:text-slate-500 leading-snug line-clamp-2 transition-colors">
                  {card.subtitle}
                </p>

                {/* Micro Action Hint */}
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100/60">
                  <span className="group-hover:text-[#0047FF] transition-colors font-medium">
                    Plot on curve →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (card.model && onSelectModel) {
                        onSelectModel(card.model);
                      }
                    }}
                    className="hover:underline hover:text-slate-700"
                  >
                    Inspect specs
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
