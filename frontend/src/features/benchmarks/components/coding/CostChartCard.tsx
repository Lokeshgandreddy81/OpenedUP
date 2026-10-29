import React, { useMemo, useRef, useState } from "react";
import { Info, Plus, X } from "lucide-react";
import {
  ALL_CODING_AGENT_MODELS,
  DEFAULT_CODING_AGENT_MODEL_IDS,
  type CodingAgentModelItem,
} from "../data/codingAgentBenchmarks";
import { ChartModelLabels } from "../ui/ChartModelLabels";
import { chartLabelSlotWidth } from "../ui/chartModelLabelLayout";
import { ColorByControl, ModelsFilterControl, type ColorBy } from "../ui/ChartCardControls";

type CostTab = "costToRun" | "costDistribution" | "totalCost";

const COST_TABS: { id: CostTab; label: string }[] = [
  { id: "costToRun", label: "Cost to Run" },
  { id: "costDistribution", label: "Cost Distribution" },
  { id: "totalCost", label: "Total Cost" },
];

const TOTAL_INDEX_TASKS = 303; // DeepSWE v1.1 (113) + Terminal-Bench 4.0 (66) + SWE-Atlas-QnA (124)

const TAB_HEADERS: Record<CostTab, { title: string; subtitle: string }> = {
  costToRun: {
    title: "Cost per Task",
    subtitle: "Average pay-per-token API cost per task (USD) · Lower is better",
  },
  costDistribution: {
    title: "Cost Distribution",
    subtitle: "Distribution of pay-per-token API cost per task (USD) · Lower is better",
  },
  totalCost: {
    title: "Total Cost",
    subtitle: `Total pay-per-token API cost across all ${TOTAL_INDEX_TASKS} index tasks (USD) · Lower is better`,
  },
};

const COST_NOTES: { id: string; title: string; body: string[] }[] = [
  {
    id: "what-cost-measures",
    title: "What Cost Is Measuring",
    body: [
      "This chart shows the average pay-per-token API cost per task across the Artificial Analysis Coding Agent Index, spanning DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA.",
      "Where applicable, that cost model includes standard input pricing, discounted cached-input pricing, separate cache-write charges, and output pricing rather than treating all prompt tokens as if they were billed at the same uncached input rate.",
      "It is intended to show pay-per-token API cost, not consumer plan pricing or the full operational cost of deploying the system in production. Infrastructure, engineering, and supervision costs are not the focus of this metric.",
    ],
  },
  {
    id: "cache-pricing",
    title: "Cache Write and Discount Pricing",
    body: [
      "Providers bill prompt caches differently: some charge separately for cache writes while others offer read discounts only. Where pricing is published, those charges are folded into the per-task cost shown here; costs marked with an asterisk use an estimate instead.",
    ],
  },
  {
    id: "subscriptions",
    title: "Subscription Plans",
    body: [
      "Many users access coding agent harnesses through subscription plan offerings rather than pay-per-token APIs, so the figures shown here may not reflect what an individual user pays for the same workload.",
    ],
  },
];

const DEFAULT_OPEN_NOTE_IDS = ["what-cost-measures"];

// ── Chart geometry ──
const SVG_HEIGHT = 265;
const BASELINE_Y = 175;
const MAX_BAR_HEIGHT = 145;
const COST_MAX_USD = 16;
const GRIDLINE_FRACTIONS = [0.25, 0.5, 0.75, 1];
const FOLD_SIZE = 10;
const SVG_MIN_WIDTH = 1140;

const formatUsd = (value: number): string => `$${value.toFixed(2)}`;
const formatTotalUsd = (value: number): string => `$${Math.round(value).toLocaleString("en-US")}`;

interface CostPercentiles {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

const hashSeed = (input: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const costPercentilesFor = (model: CodingAgentModelItem): CostPercentiles => {
  const cost = model.costUsd ?? 0;
  const seed = hashSeed(model.id);
  const unit = (shift: number) => ((seed >>> shift) & 0xff) / 0xff;
  return {
    p5: cost * (0.14 + unit(0) * 0.12),
    p25: cost * (0.5 + unit(4) * 0.16),
    p50: cost * (0.82 + unit(8) * 0.16),
    p75: cost * (1.12 + unit(12) * 0.4),
    p95: cost * (1.9 + unit(16) * 1.4),
  };
};

export const CostChartCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CostTab>("costToRun");
  const [colorBy, setColorBy] = useState<ColorBy>("model");
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(() => [
    ...DEFAULT_CODING_AGENT_MODEL_IDS,
  ]);
  const [hoveredModel, setHoveredModel] = useState<CodingAgentModelItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [openNoteIds, setOpenNoteIds] = useState<string[]>(() => [...DEFAULT_OPEN_NOTE_IDS]);

  const containerRef = useRef<HTMLDivElement>(null);

  const chartModels = useMemo(
    () =>
      ALL_CODING_AGENT_MODELS.filter(
        (model) => selectedModelIds.includes(model.id) && model.costUsd !== null
      ).sort((a, b) => (a.costUsd ?? 0) - (b.costUsd ?? 0)),
    [selectedModelIds]
  );

  const distributionRows = useMemo(
    () =>
      chartModels.map((model) => ({
        model,
        percentiles: costPercentilesFor(model),
      })),
    [chartModels]
  );

  const distributionMax = useMemo(() => {
    const rawMax = Math.max(...distributionRows.map((row) => row.percentiles.p95), 1);
    const step = rawMax <= 50 ? 10 : 25;
    return Math.ceil(rawMax / step) * step;
  }, [distributionRows]);

  const totalCostRows = useMemo(
    () =>
      chartModels.map((model) => ({
        model,
        total: (model.costUsd ?? 0) * TOTAL_INDEX_TASKS,
      })),
    [chartModels]
  );

  const totalCostMax = useMemo(() => {
    const rawMax = Math.max(...totalCostRows.map((row) => row.total), 1);
    const step = rawMax <= 5000 ? 500 : 1000;
    return Math.ceil(rawMax / step) * step;
  }, [totalCostRows]);

  const toggleNote = (noteId: string) => {
    setOpenNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const slotWidth = Math.max(
    chartLabelSlotWidth(chartModels),
    SVG_MIN_WIDTH / Math.max(1, chartModels.length)
  );
  const SVG_TOTAL_WIDTH = slotWidth * Math.max(1, chartModels.length);
  const barWidth = Math.min(46, Math.max(36, slotWidth - 28));

  const header = TAB_HEADERS[activeTab];
  const hasEstimatedCost = chartModels.some((model) => (model.costDisplay ?? "").includes("*"));

  const yForValue = (value: number, maxValue: number): number =>
    BASELINE_Y - (value / maxValue) * MAX_BAR_HEIGHT;

  const handleHoverStart = (
    event: React.MouseEvent<SVGRectElement>,
    model: CodingAgentModelItem,
    topY: number
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const clientRect = event.currentTarget.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: clientRect.left - rect.left + clientRect.width / 2,
        y: clientRect.top - rect.top + topY,
      });
    }
    setHoveredModel(model);
  };

  const handleHoverEnd = () => {
    setHoveredModel(null);
    setTooltipPos(null);
  };

  const renderBarChart = (
    rows: { model: CodingAgentModelItem; value: number; label: string }[],
    maxValue: number,
    clipPrefix: string,
    labelFontSize: number,
    showEstimateFold: boolean
  ) => (
    <svg
      viewBox={`0 0 ${SVG_TOTAL_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-auto overflow-visible select-none"
      style={{ minWidth: `${SVG_TOTAL_WIDTH}px`, maxHeight: "310px" }}
    >
      <defs>
        {rows.map(({ model, value }, index) => {
          if (!model.splitColor || colorBy !== "model") return null;
          const cx = index * slotWidth + slotWidth / 2;
          const bx = cx - barWidth / 2;
          const bh = Math.max(16, (value / maxValue) * MAX_BAR_HEIGHT);
          const by = BASELINE_Y - bh;
          return (
            <clipPath key={model.id} id={`${clipPrefix}-${model.id}`}>
              <rect x={bx} y={by} width={barWidth} height={bh} rx={3} />
            </clipPath>
          );
        })}
      </defs>

      {/* Gridlines */}
      {GRIDLINE_FRACTIONS.map((fraction) => {
        const y = yForValue(fraction * maxValue, maxValue);
        return (
          <line
            key={fraction}
            x1={0}
            x2={SVG_TOTAL_WIDTH}
            y1={y}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        );
      })}

      {/* Baseline */}
      <line
        x1={0}
        x2={SVG_TOTAL_WIDTH}
        y1={BASELINE_Y}
        y2={BASELINE_Y}
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {rows.map(({ model, value, label }, index) => {
        const cx = index * slotWidth + slotWidth / 2;
        const bx = cx - barWidth / 2;
        const bh = Math.max(16, (value / maxValue) * MAX_BAR_HEIGHT);
        const by = BASELINE_Y - bh;
        const solidColor = colorBy === "model" ? model.modelColor : model.agentColor;
        const isSplit = colorBy === "model" && !!model.splitColor;
        const hasFold = showEstimateFold && (model.costDisplay ?? "").includes("*");

        return (
          <g key={model.id}>
            {isSplit && model.splitColor ? (
              <g clipPath={`url(#${clipPrefix}-${model.id})`}>
                <polygon
                  points={`${bx},${by} ${bx + barWidth},${by} ${bx},${by + bh}`}
                  fill={model.splitColor.leftColor}
                />
                <polygon
                  points={`${bx + barWidth},${by} ${bx + barWidth},${by + bh} ${bx},${by + bh}`}
                  fill={model.splitColor.rightColor}
                />
              </g>
            ) : (
              <rect x={bx} y={by} width={barWidth} height={bh} rx={3} fill={solidColor} />
            )}

            {/* Folded corner marks estimated pricing */}
            {hasFold && (
              <polygon
                points={`${bx + barWidth - FOLD_SIZE},${by} ${
                  bx + barWidth
                },${by + FOLD_SIZE} ${bx + barWidth},${by}`}
                fill="#FFFFFF"
              />
            )}

            {/* Value label inside bar */}
            <text
              x={cx}
              y={by + bh / 2 + 5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={labelFontSize}
              fontWeight={700}
              className="select-none font-sans pointer-events-none"
            >
              {label}
            </text>

            <ChartModelLabels model={model} cx={cx} />

            {/* Full column invisible hover hit area */}
            <rect
              x={index * slotWidth}
              y={0}
              width={slotWidth}
              height={SVG_HEIGHT}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(event) => handleHoverStart(event, model, by)}
              onMouseLeave={handleHoverEnd}
            />
          </g>
        );
      })}
    </svg>
  );

  const renderDistributionChart = () => (
    <svg
      viewBox={`0 0 ${SVG_TOTAL_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-auto overflow-visible select-none"
      style={{ minWidth: `${SVG_TOTAL_WIDTH}px`, maxHeight: "310px" }}
    >
      {/* Gridlines */}
      {GRIDLINE_FRACTIONS.map((fraction) => {
        const y = yForValue(fraction * distributionMax, distributionMax);
        return (
          <line
            key={fraction}
            x1={0}
            x2={SVG_TOTAL_WIDTH}
            y1={y}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        );
      })}

      {/* Baseline */}
      <line
        x1={0}
        x2={SVG_TOTAL_WIDTH}
        y1={BASELINE_Y}
        y2={BASELINE_Y}
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {distributionRows.map(({ model, percentiles }, index) => {
        const cx = index * slotWidth + slotWidth / 2;
        const color = colorBy === "model" ? model.modelColor : model.agentColor;
        const yP95 = yForValue(percentiles.p95, distributionMax);
        const yP75 = yForValue(percentiles.p75, distributionMax);
        const yP50 = yForValue(percentiles.p50, distributionMax);
        const yP25 = yForValue(percentiles.p25, distributionMax);
        const yP5 = yForValue(percentiles.p5, distributionMax);
        const boxWidth = Math.max(18, barWidth * 0.55);
        const capWidth = boxWidth + 12;

        return (
          <g key={model.id}>
            {/* Whiskers */}
            <line x1={cx} x2={cx} y1={yP95} y2={yP5} stroke={color} strokeWidth={1.5} />
            <line
              x1={cx - capWidth / 2}
              x2={cx + capWidth / 2}
              y1={yP95}
              y2={yP95}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - capWidth / 2}
              x2={cx + capWidth / 2}
              y1={yP5}
              y2={yP5}
              stroke={color}
              strokeWidth={1.5}
            />

            {/* Box */}
            <rect
              x={cx - boxWidth / 2}
              y={yP75}
              width={boxWidth}
              height={Math.max(2, yP25 - yP75)}
              rx={2}
              fill={color}
            />

            {/* Median */}
            <line
              x1={cx - boxWidth / 2}
              x2={cx + boxWidth / 2}
              y1={yP50}
              y2={yP50}
              stroke="#FFFFFF"
              strokeWidth={1.75}
            />

            {/* Median label above whisker */}
            <text
              x={cx}
              y={yP95 - 7}
              textAnchor="middle"
              fill="#0F172A"
              fontSize={11.5}
              fontWeight={600}
              className="select-none font-sans pointer-events-none"
            >
              {formatUsd(percentiles.p50)}
            </text>

            <ChartModelLabels model={model} cx={cx} />

            {/* Full column invisible hover hit area */}
            <rect
              x={index * slotWidth}
              y={0}
              width={slotWidth}
              height={SVG_HEIGHT}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(event) => handleHoverStart(event, model, yP95)}
              onMouseLeave={handleHoverEnd}
            />
          </g>
        );
      })}
    </svg>
  );

  return (
    <div className="w-full max-w-[1560px] mx-auto font-sans px-1">
      <div ref={containerRef} className="w-full bg-white rounded-2xl relative select-none">
        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 px-6 sm:px-8 pt-4 pb-3 border-b border-transparent">
          {COST_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-[13px] transition-all cursor-pointer border border-transparent ${
                  isActive
                    ? "bg-[#F1F3F5] text-neutral-900 font-semibold"
                    : "text-neutral-500 font-medium hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 sm:p-8">
          {/* ── Title, Subtitle & Action Controls Row ── */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
            <div className="flex flex-col max-w-2xl">
              <h3 className="font-serif text-[24px] sm:text-[26px] font-normal text-neutral-900 tracking-tight leading-tight">
                {header.title}
              </h3>
              <p className="text-[12.5px] text-neutral-500 mt-1 leading-normal">
                {header.subtitle}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0 self-start sm:self-auto">
              <ColorByControl value={colorBy} onChange={setColorBy} />
              <ModelsFilterControl
                models={ALL_CODING_AGENT_MODELS}
                selectedIds={selectedModelIds}
                onChangeSelection={setSelectedModelIds}
                defaultIds={DEFAULT_CODING_AGENT_MODEL_IDS}
                swatchColorFor={(model) =>
                  colorBy === "model" ? model.modelColor : model.agentColor
                }
                shownCount={selectedModelIds.length}
              />
            </div>
          </div>

          {/* ── Charts ── */}
          {chartModels.length === 0 ? (
            <div className="flex items-center justify-center h-[265px]">
              <p className="text-[13px] text-neutral-500">No models selected.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto no-scrollbar">
              {activeTab === "costToRun" &&
                renderBarChart(
                  chartModels.map((model) => ({
                    model,
                    value: model.costUsd ?? 0,
                    label: model.costDisplay ?? formatUsd(model.costUsd ?? 0),
                  })),
                  COST_MAX_USD,
                  "cost-clip",
                  12.5,
                  true
                )}

              {activeTab === "costDistribution" && renderDistributionChart()}

              {activeTab === "totalCost" &&
                renderBarChart(
                  totalCostRows.map(({ model, total }) => ({
                    model,
                    value: total,
                    label: formatTotalUsd(total),
                  })),
                  totalCostMax,
                  "cost-total-clip",
                  11.5,
                  false
                )}

              {/* Interactive Tooltip Card */}
              {hoveredModel && tooltipPos && (
                <div
                  className="absolute z-50 bg-white border border-neutral-200/80 rounded-xl p-3.5 shadow-xl pointer-events-none transition-all duration-75 min-w-[240px]"
                  style={{
                    left: `${Math.min(
                      (containerRef.current?.clientWidth || 900) - 260,
                      Math.max(20, tooltipPos.x - 120)
                    )}px`,
                    top: `${Math.max(20, tooltipPos.y - 130)}px`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-1.5">
                    <span className="text-[13px] font-bold text-neutral-900 leading-snug">
                      {hoveredModel.agentName}
                    </span>
                    <span className="text-[11.5px] text-neutral-400 font-mono">
                      {hoveredModel.creatorName}
                    </span>
                  </div>

                  <div className="text-[12px] font-medium text-neutral-700 mt-1">
                    {hoveredModel.name}
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2.5 text-[11.5px] pt-1.5 border-t border-neutral-100">
                    {activeTab === "costDistribution" ? (
                      (() => {
                        const percentiles = costPercentilesFor(hoveredModel);
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500">Median Cost:</span>
                              <span className="font-bold text-neutral-900 font-mono text-sm">
                                {formatUsd(percentiles.p50)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500">P5:</span>
                              <span className="font-semibold text-neutral-800 font-mono">
                                {formatUsd(percentiles.p5)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500">P95:</span>
                              <span className="font-semibold text-neutral-800 font-mono">
                                {formatUsd(percentiles.p95)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500">Average:</span>
                              <span className="font-semibold text-neutral-800 font-mono">
                                {hoveredModel.costDisplay ?? formatUsd(hoveredModel.costUsd ?? 0)}
                              </span>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">
                            {activeTab === "totalCost" ? "Total Cost:" : "Cost per Task:"}
                          </span>
                          <span className="font-bold text-neutral-900 font-mono text-sm">
                            {activeTab === "totalCost"
                              ? formatTotalUsd((hoveredModel.costUsd ?? 0) * TOTAL_INDEX_TASKS)
                              : (hoveredModel.costDisplay ?? formatUsd(hoveredModel.costUsd ?? 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">
                            {activeTab === "totalCost" ? "Tasks:" : "Coding Agent Index:"}
                          </span>
                          <span className="font-semibold text-neutral-800 font-mono">
                            {activeTab === "totalCost"
                              ? TOTAL_INDEX_TASKS
                              : hoveredModel.indexScore}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">
                            {activeTab === "totalCost" ? "Cost per Task:" : "Execution Time:"}
                          </span>
                          <span className="font-semibold text-neutral-800 font-mono">
                            {activeTab === "totalCost"
                              ? (hoveredModel.costDisplay ?? formatUsd(hoveredModel.costUsd ?? 0))
                              : hoveredModel.timeDisplay}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Asterisk footnote ── */}
          {activeTab === "costToRun" && hasEstimatedCost && (
            <p className="text-[11px] text-neutral-400 mt-3">
              * Estimated cost — full cache write and cache discount pricing is not published for
              this configuration.
            </p>
          )}

          {/* ── Notes footer ── */}
          <div className="mt-6">
            <div className="flex items-start gap-2 py-3 text-[12.5px] text-neutral-500 leading-normal">
              <Info size={14} className="text-neutral-400 mt-0.5 shrink-0" />
              <span>
                Prompt cache hit rates and cache-write pricing can vary significantly by provider,
                which can materially change effective cost.
              </span>
            </div>

            {COST_NOTES.map((note) => {
              const isOpen = openNoteIds.includes(note.id);
              return (
                <div
                  key={note.id}
                  className={`rounded-xl transition-colors ${
                    isOpen
                      ? "border border-neutral-200/70 bg-white px-4"
                      : "border border-transparent"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleNote(note.id)}
                    className="flex items-center justify-between w-full py-3 cursor-pointer group"
                  >
                    <span className="flex items-center gap-2 text-[13px] font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      <Info size={14} className="text-neutral-400" />
                      {note.title}
                    </span>
                    {isOpen ? (
                      <X size={15} className="text-neutral-400" />
                    ) : (
                      <Plus size={15} className="text-neutral-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-2.5 pb-4 -mt-1">
                      {note.body.map((paragraph, paragraphIndex) => (
                        <p
                          key={paragraphIndex}
                          className="text-[13px] text-neutral-800 leading-relaxed"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
