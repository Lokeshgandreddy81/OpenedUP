import React, { useMemo, useState } from "react";
import type { AIModelBenchmark } from "../types";
import { CreatorLogo } from "../ui/CreatorLogo";
import { getCreatorColor } from "../ui/creatorBranding";
import { formatEvaluationValue, type BenchmarkEvaluation } from "../data/benchmarkEvaluations";

export interface EvaluationChartCardProps {
  evaluation: BenchmarkEvaluation;
  models: AIModelBenchmark[];
  /** Maximum models shown per chart (0 = all) */
  modelLimit: number;
  onSelectModel: (model: AIModelBenchmark) => void;
}

export const EvaluationChartCard: React.FC<EvaluationChartCardProps> = ({
  evaluation,
  models,
  modelLimit,
  onSelectModel,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const ranked = useMemo(() => {
    const scored = models.filter((model) => evaluation.metric(model) > 0);
    return [...scored]
      .sort((a, b) => evaluation.metric(b) - evaluation.metric(a))
      .slice(0, modelLimit > 0 ? modelLimit : scored.length);
  }, [models, evaluation, modelLimit]);

  const maxValue = ranked.length > 0 ? evaluation.metric(ranked[0]) : 1;
  const scaleMax = maxValue * 1.12;

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${Math.max(ranked.length, 1)}, minmax(24px, 1fr))`,
  };

  const barHeightPercent = (value: number) => Math.max(0.5, (value / scaleMax) * 100);

  return (
    <figure className="flex min-w-0 flex-col">
      <figcaption className="flex items-center gap-1.5">
        <a
          href="https://artificialanalysis.ai/evaluations"
          target="_blank"
          rel="noreferrer"
          className="group/eval inline-flex items-center gap-1"
        >
          <h4 className="text-[15px] font-semibold tracking-tight text-neutral-900 transition-colors group-hover/eval:text-neutral-600">
            {evaluation.name}
          </h4>
        </a>
        {evaluation.badge && (
          <span className="ml-1 rounded-full bg-[#7C5CFF] px-2 py-[3px] text-[10px] font-semibold leading-none text-white">
            {evaluation.badge}
          </span>
        )}
      </figcaption>
      <p className="mt-0.5 text-xs text-neutral-500">{evaluation.subtitle}</p>

      <div className="mt-4 overflow-x-auto no-scrollbar pb-1">
        <div
          className="relative flex flex-col pt-14 pl-14"
          style={{ minWidth: `${56 + ranked.length * 24}px` }}
        >
          {/* Plot area */}
          <div className="relative grid h-[170px]" style={gridStyle}>
            <div className="pointer-events-none absolute inset-x-0 top-[25%] border-b border-dashed border-neutral-200" />
            <div className="pointer-events-none absolute inset-x-0 top-[50%] border-b border-dashed border-neutral-200" />
            <div className="pointer-events-none absolute inset-x-0 top-[75%] border-b border-dashed border-neutral-200" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 border-b border-neutral-200" />

            {ranked.map((model) => {
              const value = evaluation.metric(model);
              const formatted = formatEvaluationValue(evaluation, value);
              const heightPercent = barHeightPercent(value);
              const isHovered = hoveredId === model.id;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onSelectModel(model)}
                  onMouseEnter={() => setHoveredId(model.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(model.id)}
                  onBlur={() => setHoveredId(null)}
                  aria-label={`${model.name}: ${formatted}. Open model details.`}
                  className="group relative z-10 flex h-full cursor-pointer flex-col items-start justify-end focus-visible:outline-none"
                >
                  {isHovered && (
                    <span
                      className="pointer-events-none absolute left-[29%] z-30 -translate-x-1/2"
                      style={{ bottom: `calc(${heightPercent}% + 26px)` }}
                    >
                      <span className="flex flex-col items-center rounded-lg bg-[#0B1220] px-3 py-2 text-white shadow-xl ring-1 ring-white/10">
                        <span className="text-sm font-bold leading-none tabular-nums">
                          {formatted}
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5">
                          <CreatorLogo creator={model.creator} size={12} />
                          <span className="whitespace-nowrap text-[11px] font-medium leading-none text-white/90">
                            {model.name}
                          </span>
                        </span>
                      </span>
                    </span>
                  )}

                  <span
                    className={`mb-0.5 text-[10px] font-semibold leading-none tabular-nums ${
                      isHovered ? "text-neutral-900" : "text-neutral-600"
                    }`}
                  >
                    {formatted}
                  </span>

                  <span
                    className={`w-[58%] rounded-t-[2px] transition-all duration-150 ${
                      isHovered ? "brightness-110" : ""
                    }`}
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: getCreatorColor(model.creator),
                      ...(model.noPublicApi
                        ? {
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3.5px, rgba(255, 255, 255, 0.32) 3.5px, rgba(255, 255, 255, 0.32) 7px), repeating-linear-gradient(-45deg, transparent, transparent 3.5px, rgba(0, 0, 0, 0.3) 3.5px, rgba(0, 0, 0, 0.3) 7px)`,
                          }
                        : {}),
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Creator logos */}
          <div className="grid justify-items-start pt-2" style={gridStyle}>
            {ranked.map((model) => (
              <button
                key={`logo-${model.id}`}
                type="button"
                onClick={() => onSelectModel(model)}
                title={model.creatorDisplayName}
                aria-label={`Open ${model.name}`}
                className="flex cursor-pointer items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none"
              >
                <CreatorLogo creator={model.creator} size={14} />
              </button>
            ))}
          </div>

          {/* Angled model labels */}
          <div className="relative z-20 grid pt-2" style={gridStyle}>
            {ranked.map((model) => (
              <div
                key={`label-${model.id}`}
                className="relative h-[108px] cursor-pointer"
                onClick={() => onSelectModel(model)}
              >
                <span
                  title={model.name}
                  className="absolute right-full top-0 block w-[106px] origin-top-right -rotate-[58deg] text-right text-[10px] font-medium leading-tight text-neutral-600 transition-colors [text-wrap:balance] hover:text-neutral-900"
                >
                  {model.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
};
