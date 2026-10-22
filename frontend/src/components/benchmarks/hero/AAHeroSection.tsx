import React from "react";
import { ArrowRight, ArrowUpRight, Gauge, Wallet } from "lucide-react";
import type { AIModelBenchmark } from "../types";
import { CreatorLogo, getCreatorColor } from "../ui/CreatorLogo";

export interface AAHeroSectionProps {
  models: AIModelBenchmark[];
  onSelectModel: (model: AIModelBenchmark) => void;
  onViewAllModels: () => void;
}

type MetricId = "intelligence" | "speed" | "taskCost";

interface MetricConfig {
  id: MetricId;
  title: string;
  description: string;
  better: "Higher is better" | "Lower is better";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: (model: AIModelBenchmark) => number;
  format: (value: number) => string;
  descending: boolean;
}

const RANKING_METRICS: MetricConfig[] = [
  {
    id: "intelligence",
    title: "Intelligence",
    description: "Artificial Analysis Intelligence Index",
    better: "Higher is better",
    icon: Gauge,
    value: (model) => model.quality.intelligenceIndex,
    format: (value) => value.toFixed(1),
    descending: true,
  },
  {
    id: "speed",
    title: "Output speed",
    description: "Tokens generated per second",
    better: "Higher is better",
    icon: Gauge,
    value: (model) => model.performance.outputSpeedTokensPerSec.median,
    format: (value) => `${Math.round(value)} t/s`,
    descending: true,
  },
  {
    id: "taskCost",
    title: "Cost per task",
    description: "Estimated cost per Intelligence Index task",
    better: "Lower is better",
    icon: Wallet,
    value: (model) => model.pricing.costPerTaskUsd,
    format: formatTaskCost,
    descending: false,
  },
];

function formatTaskCost(value: number): string {
  if (value < 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

function getRankedModels(
  models: AIModelBenchmark[],
  metric: MetricConfig,
  limit: number
): AIModelBenchmark[] {
  return [...models]
    .filter((model) => {
      const val = metric.value(model);
      if (!Number.isFinite(val)) return false;
      if (metric.id === "taskCost") return val > 0;
      return val >= 0;
    })
    .sort((a, b) =>
      metric.descending ? metric.value(b) - metric.value(a) : metric.value(a) - metric.value(b)
    )
    .slice(0, limit);
}

const RankingChart: React.FC<{
  metric: MetricConfig;
  models: AIModelBenchmark[];
  onSelectModel: (model: AIModelBenchmark) => void;
}> = ({ metric, models, onSelectModel }) => {
  const ranked = getRankedModels(models, metric, 10);
  const maxValue = Math.max(1, ...ranked.map(metric.value));
  const Icon = metric.icon;

  return (
    <section className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-normal text-neutral-900">{metric.title}</h2>
            <p className="truncate text-[11px] text-neutral-500">{metric.description}</p>
          </div>
        </div>
        <span className="shrink-0 pt-1 text-[10px] text-neutral-400">{metric.better}</span>
      </div>

      <div className="mt-5 overflow-x-auto no-scrollbar">
        <div className="min-w-[360px]">
          <div className="grid h-[176px] grid-cols-10 items-end gap-1 border-b border-neutral-200 pb-2">
            {ranked.map((model, index) => {
              const value = metric.value(model);
              const height = Math.max(12, (value / maxValue) * 100);
              const heightPx = Math.max(18, (height / 100) * 126);
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onSelectModel(model)}
                  className="group flex h-full min-w-0 flex-col items-center justify-end text-center"
                  title={`${model.name}: ${metric.format(value)}`}
                  aria-label={`View ${model.name}, ${metric.format(value)}`}
                >
                  <span className="mb-1 text-[9px] font-mono text-neutral-500 group-hover:text-neutral-900">
                    {metric.format(value)}
                  </span>
                  <span
                    className="flex w-full items-start justify-center rounded-t-[3px] pt-1.5 text-[9px] font-semibold text-white transition-[filter] group-hover:brightness-110"
                    style={{
                      height: `${heightPx}px`,
                      backgroundColor: getCreatorColor(model.creator),
                    }}
                  >
                    {index + 1}
                  </span>
                </button>
              );
            })}
            {ranked.length === 0 && (
              <p className="col-span-10 py-8 text-xs text-neutral-400">No model data available</p>
            )}
          </div>
          <div className="grid grid-cols-10 gap-1 pt-2">
            {ranked.map((model) => (
              <button
                key={`${model.id}-label`}
                type="button"
                onClick={() => onSelectModel(model)}
                className="group flex min-w-0 flex-col items-center gap-1 text-center"
                title={`View ${model.name}`}
              >
                <CreatorLogo creator={model.creator} size={15} />
                <span className="h-8 w-full overflow-hidden text-ellipsis text-[9px] leading-3 text-neutral-500 group-hover:text-neutral-900">
                  {model.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const AAHeroSection: React.FC<AAHeroSectionProps> = ({
  models,
  onSelectModel,
  onViewAllModels,
}) => {
  const creatorCount = new Set(models.map((model) => model.creator)).size;

  return (
    <div id="models-hero" className="w-full flex flex-col gap-7">
      <header className="flex flex-col gap-3 border-b border-neutral-200 pb-6 pt-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl font-normal leading-[1.1] tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
            Compare AI models by intelligence, speed &amp; price
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-[1.65] text-neutral-500 sm:text-sm">
            Explore independent model evaluations alongside measured output speed, response latency,
            token pricing and context capacity.
          </p>
          <p className="mt-2.5 text-[11px] text-neutral-400">
            {models.length} models · {creatorCount} creators · Select a model to inspect its metrics
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAllModels}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-neutral-200 px-4 py-2 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:self-auto"
        >
          Explore all models <ArrowRight size={13} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {RANKING_METRICS.map((metric) => (
          <RankingChart
            key={metric.id}
            metric={metric}
            models={models}
            onSelectModel={onSelectModel}
          />
        ))}
      </div>

      <a
        href="https://artificialanalysis.ai/methodology/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
      >
        How model benchmarks are measured <ArrowUpRight size={13} />
      </a>
    </div>
  );
};
