import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Layers,
  Sparkles,
  TrendingUp,
  Zap,
  Clock,
  DollarSign,
} from "lucide-react";
import type { AIModelBenchmark } from "../types";
import { SquareGlyph } from "../ui/BrandGlyphs";
import { CreatorLogo, getCreatorColor } from "../ui/CreatorLogo";
import { BenchmarkScatterPlot, type PresetId } from "../charts/BenchmarkScatterPlot";

export interface AADimensionSectionsProps {
  models: AIModelBenchmark[];
  onSelectModel: (model: AIModelBenchmark) => void;
  onCompareModel?: (model: AIModelBenchmark) => void;
  compareModelIds?: string[];
}

export const AADimensionSections: React.FC<AADimensionSectionsProps> = ({
  models,
  onSelectModel,
  onCompareModel,
  compareModelIds = [],
}) => {
  // Metric tab states
  const [intelMetric, setIntelMetric] = useState<
    "intelligenceIndex" | "mmluPro" | "gpqaDiamond" | "sweBenchVerified" | "arenaElo"
  >("intelligenceIndex");
  const [speedMetric, setSpeedMetric] = useState<"throughput" | "ttft">("throughput");
  const [priceMetric, setPriceMetric] = useState<"blended" | "costPerTask">("blended");

  // Helper to format short model label
  const formatShortLabel = (name: string): string => {
    return name
      .replace(/Thinking|Instruct|Preview/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Intelligence Ranked Models (top 20)
  const intelRanked = useMemo(() => {
    return [...models]
      .filter((m) => {
        if (intelMetric === "intelligenceIndex") return m.quality.intelligenceIndex > 0;
        if (intelMetric === "mmluPro") return m.quality.mmluPro > 0;
        if (intelMetric === "gpqaDiamond") return m.quality.gpqaDiamond > 0;
        if (intelMetric === "sweBenchVerified") return m.quality.sweBenchVerified > 0;
        if (intelMetric === "arenaElo") return m.quality.chatbotArenaElo > 0;
        return true;
      })
      .sort((a, b) => {
        const valA =
          intelMetric === "intelligenceIndex"
            ? a.quality.intelligenceIndex
            : intelMetric === "mmluPro"
              ? a.quality.mmluPro
              : intelMetric === "gpqaDiamond"
                ? a.quality.gpqaDiamond
                : intelMetric === "sweBenchVerified"
                  ? a.quality.sweBenchVerified
                  : a.quality.chatbotArenaElo;
        const valB =
          intelMetric === "intelligenceIndex"
            ? b.quality.intelligenceIndex
            : intelMetric === "mmluPro"
              ? b.quality.mmluPro
              : intelMetric === "gpqaDiamond"
                ? b.quality.gpqaDiamond
                : intelMetric === "sweBenchVerified"
                  ? b.quality.sweBenchVerified
                  : b.quality.chatbotArenaElo;
        return valB - valA;
      })
      .slice(0, 20);
  }, [models, intelMetric]);

  const maxIntelVal = useMemo(() => {
    if (intelRanked.length === 0) return 100;
    const topVal =
      intelMetric === "arenaElo"
        ? Math.max(...intelRanked.map((m) => m.quality.chatbotArenaElo))
        : intelMetric === "sweBenchVerified"
          ? Math.max(...intelRanked.map((m) => m.quality.sweBenchVerified))
          : Math.max(...intelRanked.map((m) => m.quality.intelligenceIndex));
    return topVal * 1.1;
  }, [intelRanked, intelMetric]);

  // Speed Ranked Models (top 20)
  const speedRanked = useMemo(() => {
    return [...models]
      .filter((m) => m.performance.outputSpeedTokensPerSec.median > 0)
      .sort((a, b) => {
        if (speedMetric === "ttft") {
          return a.performance.ttftSeconds.median - b.performance.ttftSeconds.median;
        }
        return (
          b.performance.outputSpeedTokensPerSec.median -
          a.performance.outputSpeedTokensPerSec.median
        );
      })
      .slice(0, 20);
  }, [models, speedMetric]);

  const maxSpeedVal = useMemo(() => {
    if (speedRanked.length === 0) return 200;
    const topVal = Math.max(
      ...speedRanked.map((m) => m.performance.outputSpeedTokensPerSec.median)
    );
    return topVal * 1.1;
  }, [speedRanked]);

  // Price Ranked Models (top 20 lowest)
  const priceRanked = useMemo(() => {
    return [...models]
      .filter((m) => m.pricing.blendedPricePer1M > 0)
      .sort((a, b) => {
        if (priceMetric === "costPerTask") {
          return a.pricing.costPerTaskUsd - b.pricing.costPerTaskUsd;
        }
        return a.pricing.blendedPricePer1M - b.pricing.blendedPricePer1M;
      })
      .slice(0, 20);
  }, [models, priceMetric]);

  const maxPriceVal = useMemo(() => {
    if (priceRanked.length === 0) return 10;
    const topVal = Math.max(
      ...priceRanked.map((m) =>
        priceMetric === "costPerTask" ? m.pricing.costPerTaskUsd : m.pricing.blendedPricePer1M
      )
    );
    return topVal * 1.1;
  }, [priceRanked, priceMetric]);

  return (
    <div className="w-full flex flex-col gap-16 pt-4">
      {/* =========================================================================
          SECTION 1: INTELLIGENCE DEEP-DIVE
      ========================================================================== */}
      <section id="intelligence" className="flex flex-col gap-6 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <SquareGlyph dimension="intelligence" size="md" />
              <h2 className="font-serif text-3xl font-normal text-neutral-900 tracking-tight">
                Intelligence
              </h2>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              Independent evaluation across multi-task reasoning, software engineering, and
              graduate-level benchmarks.
            </p>
          </div>

          {/* Metric Sub-Tabs */}
          <div className="inline-flex items-center gap-1 bg-neutral-100 p-1 rounded-full border border-neutral-200/60 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setIntelMetric("intelligenceIndex")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                intelMetric === "intelligenceIndex"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Intelligence Index
            </button>
            <button
              type="button"
              onClick={() => setIntelMetric("sweBenchVerified")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                intelMetric === "sweBenchVerified"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              SWE-bench
            </button>
            <button
              type="button"
              onClick={() => setIntelMetric("mmluPro")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                intelMetric === "mmluPro"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              MMLU-Pro
            </button>
            <button
              type="button"
              onClick={() => setIntelMetric("gpqaDiamond")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                intelMetric === "gpqaDiamond"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              GPQA Diamond
            </button>
          </div>
        </div>

        {/* Wide Ranking Bar Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Top 20 Models ·{" "}
              {intelMetric === "sweBenchVerified"
                ? "SWE-bench Verified (%)"
                : intelMetric === "mmluPro"
                  ? "MMLU-Pro Accuracy (%)"
                  : intelMetric === "gpqaDiamond"
                    ? "GPQA Diamond (%)"
                    : "Artificial Analysis Intelligence Index"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">Higher is better</span>
          </div>

          {/* Bar Chart Viewport with 20 columns */}
          <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="min-w-[800px] flex flex-col">
              <div className="h-[180px] w-full grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 items-end relative border-b border-neutral-200 pb-0.5">
                <div className="absolute top-[25%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />
                <div className="absolute top-[50%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />
                <div className="absolute top-[75%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />

                {intelRanked.map((model) => {
                  const val =
                    intelMetric === "sweBenchVerified"
                      ? model.quality.sweBenchVerified
                      : intelMetric === "mmluPro"
                        ? model.quality.mmluPro
                        : intelMetric === "gpqaDiamond"
                          ? model.quality.gpqaDiamond
                          : model.quality.intelligenceIndex;
                  const heightPercent = Math.max(12, Math.min(95, (val / maxIntelVal) * 100));
                  const barColor = getCreatorColor(model.creator);

                  return (
                    <div
                      key={model.id}
                      onClick={() => onSelectModel(model)}
                      title={`${model.name}: ${val}`}
                      className="flex flex-col items-center justify-end h-full relative cursor-pointer group z-10"
                    >
                      <div
                        className="w-full rounded-t-[3px] transition-all duration-150 group-hover:brightness-110 flex items-start justify-center pt-1"
                        style={{ height: `${heightPercent}%`, backgroundColor: barColor }}
                      >
                        <span className="text-[9px] font-bold text-white leading-none drop-shadow-xs">
                          {Math.round(val)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Creator Logos Row */}
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 justify-items-center pt-2">
                {intelRanked.map((model) => (
                  <div
                    key={`logo-${model.id}`}
                    onClick={() => onSelectModel(model)}
                    className="cursor-pointer group flex items-center justify-center hover:scale-110 transition-transform"
                    title={model.creator}
                  >
                    <CreatorLogo creator={model.creator} size={14} />
                  </div>
                ))}
              </div>

              {/* Angled Model Labels */}
              <div className="h-28 w-full grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 overflow-visible relative pt-2">
                {intelRanked.map((model) => (
                  <div
                    key={`label-${model.id}`}
                    onClick={() => onSelectModel(model)}
                    className="relative flex justify-center cursor-pointer group"
                  >
                    <div className="absolute top-0 right-1/2 origin-top-right -rotate-[58deg] text-right pointer-events-auto">
                      <span
                        className="text-[10px] text-neutral-600 font-medium whitespace-nowrap leading-tight block group-hover:text-neutral-900 group-hover:font-semibold transition-colors"
                        title={model.name}
                      >
                        {formatShortLabel(model.name)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quality vs Price Pareto Scatter Plot */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="font-serif text-2xl font-normal text-neutral-900">
                Quality vs. Price Frontier
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pareto optimal models (top-left) deliver the highest intelligence index for the
                lowest cost.
              </p>
            </div>
          </div>

          <BenchmarkScatterPlot
            models={models}
            activePresetId="quality-vs-price"
            onSelectModel={onSelectModel}
            onCompareModel={onCompareModel}
          />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: SPEED & LATENCY DEEP-DIVE
      ========================================================================== */}
      <section id="speed" className="flex flex-col gap-6 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <SquareGlyph dimension="speed" size="md" />
              <h2 className="font-serif text-3xl font-normal text-neutral-900 tracking-tight">
                Speed & Latency
              </h2>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              Real-world measured output generation speed (tokens/sec) and time-to-first-token
              response latency.
            </p>
          </div>

          {/* Metric Sub-Tabs */}
          <div className="inline-flex items-center gap-1 bg-neutral-100 p-1 rounded-full border border-neutral-200/60">
            <button
              type="button"
              onClick={() => setSpeedMetric("throughput")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                speedMetric === "throughput"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Output Speed (Tokens/s)
            </button>
            <button
              type="button"
              onClick={() => setSpeedMetric("ttft")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                speedMetric === "ttft"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Time to First Token (TTFT)
            </button>
          </div>
        </div>

        {/* Wide Ranking Bar Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Top 20 Models ·{" "}
              {speedMetric === "ttft"
                ? "Median TTFT Latency (seconds)"
                : "Median Output Speed (tokens/sec)"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {speedMetric === "ttft" ? "Lower is better" : "Higher is better"}
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="min-w-[800px] flex flex-col">
              <div className="h-[180px] w-full grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 items-end relative border-b border-neutral-200 pb-0.5">
                <div className="absolute top-[25%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />
                <div className="absolute top-[50%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />
                <div className="absolute top-[75%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />

                {speedRanked.map((model) => {
                  const val =
                    speedMetric === "ttft"
                      ? model.performance.ttftSeconds.median
                      : model.performance.outputSpeedTokensPerSec.median;
                  const heightPercent =
                    speedMetric === "ttft"
                      ? Math.max(12, Math.min(95, (val / 1.5) * 100))
                      : Math.max(12, Math.min(95, (val / maxSpeedVal) * 100));
                  const barColor = getCreatorColor(model.creator);

                  return (
                    <div
                      key={model.id}
                      onClick={() => onSelectModel(model)}
                      title={`${model.name}: ${val}`}
                      className="flex flex-col items-center justify-end h-full relative cursor-pointer group z-10"
                    >
                      <div
                        className="w-full rounded-t-[3px] transition-all duration-150 group-hover:brightness-110 flex items-start justify-center pt-1"
                        style={{ height: `${heightPercent}%`, backgroundColor: barColor }}
                      >
                        <span className="text-[9px] font-bold text-white leading-none drop-shadow-xs">
                          {speedMetric === "ttft" ? `${val.toFixed(2)}s` : Math.round(val)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Creator Logos */}
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 justify-items-center pt-2">
                {speedRanked.map((model) => (
                  <div
                    key={`logo-${model.id}`}
                    onClick={() => onSelectModel(model)}
                    className="cursor-pointer group flex items-center justify-center hover:scale-110 transition-transform"
                    title={model.creator}
                  >
                    <CreatorLogo creator={model.creator} size={14} />
                  </div>
                ))}
              </div>

              {/* Angled Model Labels */}
              <div className="h-28 w-full grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 overflow-visible relative pt-2">
                {speedRanked.map((model) => (
                  <div
                    key={`label-${model.id}`}
                    onClick={() => onSelectModel(model)}
                    className="relative flex justify-center cursor-pointer group"
                  >
                    <div className="absolute top-0 right-1/2 origin-top-right -rotate-[58deg] text-right pointer-events-auto">
                      <span
                        className="text-[10px] text-neutral-600 font-medium whitespace-nowrap leading-tight block group-hover:text-neutral-900 group-hover:font-semibold transition-colors"
                        title={model.name}
                      >
                        {formatShortLabel(model.name)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Speed vs Latency Scatter Plot */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="font-serif text-2xl font-normal text-neutral-900">
                Speed vs. Latency Frontier
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Frontier providers (top-left) deliver high tokens/second with sub-second TTFT
                response times.
              </p>
            </div>
          </div>

          <BenchmarkScatterPlot
            models={models}
            activePresetId="speed-vs-latency"
            onSelectModel={onSelectModel}
            onCompareModel={onCompareModel}
          />
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: COST PER TASK & PRICING
      ========================================================================== */}
      <section id="cost" className="flex flex-col gap-6 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <SquareGlyph dimension="price" size="md" />
              <h2 className="font-serif text-3xl font-normal text-neutral-900 tracking-tight">
                Cost per Task & Pricing
              </h2>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              Standardized pricing per 1M blended tokens (3:1 input/output) and normalized cost per
              intelligence task.
            </p>
          </div>

          {/* Metric Sub-Tabs */}
          <div className="inline-flex items-center gap-1 bg-neutral-100 p-1 rounded-full border border-neutral-200/60">
            <button
              type="button"
              onClick={() => setPriceMetric("blended")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                priceMetric === "blended"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Blended Price ($/1M)
            </button>
            <button
              type="button"
              onClick={() => setPriceMetric("costPerTask")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                priceMetric === "costPerTask"
                  ? "bg-black text-white shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Cost per Task ($)
            </button>
          </div>
        </div>

        {/* Wide Ranking Bar Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Top 20 Models ·{" "}
              {priceMetric === "costPerTask"
                ? "Cost per Task (USD)"
                : "Blended Price per 1M Tokens (USD)"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">Lower is better</span>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="min-w-[800px] flex flex-col">
              <div className="h-[180px] w-full grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 items-end relative border-b border-neutral-200 pb-0.5">
                <div className="absolute top-[25%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />
                <div className="absolute top-[50%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />
                <div className="absolute top-[75%] left-0 right-0 border-b border-dashed border-neutral-150 pointer-events-none" />

                {priceRanked.map((model) => {
                  const val =
                    priceMetric === "costPerTask"
                      ? model.pricing.costPerTaskUsd
                      : model.pricing.blendedPricePer1M;
                  const heightPercent = Math.max(10, Math.min(88, (val / maxPriceVal) * 100));
                  const barColor = getCreatorColor(model.creator);

                  return (
                    <div
                      key={model.id}
                      onClick={() => onSelectModel(model)}
                      title={`${model.name}: $${val.toFixed(2)}`}
                      className="flex flex-col items-center justify-end h-full relative cursor-pointer group z-10"
                    >
                      <span className="text-[9px] font-bold text-neutral-800 leading-tight mb-1 whitespace-nowrap">
                        ${val.toFixed(2)}
                      </span>
                      <div
                        className="w-full rounded-t-[3px] transition-all duration-150 group-hover:brightness-110"
                        style={{ height: `${heightPercent}%`, backgroundColor: barColor }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Creator Logos */}
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 justify-items-center pt-2">
                {priceRanked.map((model) => (
                  <div
                    key={`logo-${model.id}`}
                    onClick={() => onSelectModel(model)}
                    className="cursor-pointer group flex items-center justify-center hover:scale-110 transition-transform"
                    title={model.creator}
                  >
                    <CreatorLogo creator={model.creator} size={14} />
                  </div>
                ))}
              </div>

              {/* Angled Model Labels */}
              <div className="h-28 w-full grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2 overflow-visible relative pt-2">
                {priceRanked.map((model) => (
                  <div
                    key={`label-${model.id}`}
                    onClick={() => onSelectModel(model)}
                    className="relative flex justify-center cursor-pointer group"
                  >
                    <div className="absolute top-0 right-1/2 origin-top-right -rotate-[58deg] text-right pointer-events-auto">
                      <span
                        className="text-[10px] text-neutral-600 font-medium whitespace-nowrap leading-tight block group-hover:text-neutral-900 group-hover:font-semibold transition-colors"
                        title={model.name}
                      >
                        {formatShortLabel(model.name)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
