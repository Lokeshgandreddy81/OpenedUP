import React from "react";
import { Brain, Zap, Clock, Coins, ExternalLink } from "lucide-react";
import { AIModelBenchmark } from "../types";
import { CreatorLogo } from "./CreatorLogo";
import { getCreatorName } from "./creatorBranding";
import { WeightsBadge, ReasoningBadge } from "./BenchmarkBadge";

export interface BenchmarkTooltipContentProps {
  model: AIModelBenchmark;
  showSummary?: boolean;
  onSelect?: (model: AIModelBenchmark) => void;
  className?: string;
}

/**
 * Rich card content displaying model architecture, speed, quality, and pricing.
 * Can be embedded directly or used inside floating overlays and scatter tooltips.
 */
export const BenchmarkTooltipContent: React.FC<BenchmarkTooltipContentProps> = ({
  model,
  showSummary = true,
  onSelect,
  className = "",
}) => {
  const formatContext = (tokens: number): string => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
    }
    return `${Math.round(tokens / 1_000)}k`;
  };

  return (
    <div
      className={`w-72 sm:w-80 p-3.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl text-slate-800 transition-all ${className}`}
    >
      {/* Header: Creator, Model Name & Badges */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <CreatorLogo creator={model.creator} size={20} showBackground className="shadow-2xs" />
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-900 truncate leading-tight">
              {model.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <span>{getCreatorName(model.creator)}</span>
              <span>•</span>
              <span>{model.releaseDate.slice(0, 7)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <WeightsBadge weightsType={model.weightsType} size="xs" />
        {model.isReasoningModel && (
          <ReasoningBadge
            reasoningType={model.reasoningType}
            isReasoningModel={model.isReasoningModel}
            size="xs"
          />
        )}
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
          {formatContext(model.contextWindowTokens)} ctx
        </span>
      </div>

      {/* Key Metrics Grid (2x2) */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 text-xs">
        {/* Intelligence Index */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Brain size={12} className="text-[#0047FF]" />
            <span>Intelligence</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-bold text-base text-slate-900 tabular-nums">
              {model.quality.intelligenceIndex?.toFixed(1) ?? "—"}
            </span>
            <span className="text-[10px] text-slate-400">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-400 truncate">
            MMLU-Pro: {model.quality.mmluPro == null ? "Not reported" : `${model.quality.mmluPro}%`}
          </span>
        </div>

        {/* Speed */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Zap size={12} className="text-amber-500" />
            <span>Output Speed</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-bold text-base text-slate-900 tabular-nums">
              {model.performance.outputSpeedTokensPerSec.median}
            </span>
            <span className="text-[10px] text-slate-400">tk/s</span>
          </div>
          <span className="text-[10px] text-slate-400 truncate">
            P90: {model.performance.outputSpeedTokensPerSec.p90 ?? "—"} tk/s
          </span>
        </div>

        {/* Latency (TTFT) */}
        <div className="flex flex-col border-t border-slate-200/50 pt-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Clock size={12} className="text-sky-500" />
            <span>Time To First Token</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-bold text-base text-slate-900 tabular-nums">
              {model.performance.ttftSeconds.median > 0
                ? `${model.performance.ttftSeconds.median.toFixed(2)}s`
                : "—"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate">
            500 tok:{" "}
            {model.performance.endToEnd500TokensSec > 0
              ? `${model.performance.endToEnd500TokensSec.toFixed(1)}s`
              : "—"}
          </span>
        </div>

        {/* Blended Price */}
        <div className="flex flex-col border-t border-slate-200/50 pt-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Coins size={12} className="text-emerald-600" />
            <span>Blended Price</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-bold text-base text-slate-900 tabular-nums text-emerald-700">
              $
              {model.pricing.blendedPricePer1M < 0.1
                ? model.pricing.blendedPricePer1M.toFixed(3)
                : model.pricing.blendedPricePer1M.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">/ 1M</span>
          </div>
          <span className="text-[10px] text-slate-400 truncate">
            In: ${model.pricing.inputPricePer1M} | Out: ${model.pricing.outputPricePer1M}
          </span>
          {model.pricing.sourceBlendedPricePer1M != null &&
            model.pricing.sourceBlendedPriceBasis && (
              <span className="text-[10px] text-slate-400 truncate">
                AA blend: ${model.pricing.sourceBlendedPricePer1M.toFixed(2)} / 1M ·{" "}
                {model.pricing.sourceBlendedPriceBasis}
              </span>
            )}
        </div>
      </div>

      {/* Model Summary */}
      {showSummary && model.summary && (
        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 mb-2.5">
          {model.summary}
        </p>
      )}

      {/* Tags row */}
      {model.tags && model.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100">
          {model.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
            >
              #{tag}
            </span>
          ))}
          {model.tags.length > 4 && (
            <span className="text-[10px] text-slate-400 font-medium">
              +{model.tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Interactive Action Button if onSelect provided */}
      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(model)}
          className="mt-3 w-full py-1.5 px-3 rounded-lg bg-[#0047FF] hover:bg-[#2966FF] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98 shadow-xs"
        >
          <span>Select Model</span>
          <ExternalLink size={12} />
        </button>
      )}
    </div>
  );
};

export interface BenchmarkTooltipProps {
  model: AIModelBenchmark | null;
  x?: number;
  y?: number;
  visible?: boolean;
  onSelect?: (model: AIModelBenchmark) => void;
  className?: string;
}

/**
 * Floating positioned tooltip for scatter charts and canvas visualizers
 */
export const BenchmarkTooltip: React.FC<BenchmarkTooltipProps> = ({
  model,
  x = 0,
  y = 0,
  visible = true,
  onSelect,
  className = "",
}) => {
  if (!visible || !model) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: x + 12,
        top: y + 12,
        pointerEvents: onSelect ? "auto" : "none",
        zIndex: 9999,
      }}
      className={`animate-in fade-in zoom-in-95 duration-100 ${className}`}
    >
      <BenchmarkTooltipContent model={model} onSelect={onSelect} />
    </div>
  );
};
