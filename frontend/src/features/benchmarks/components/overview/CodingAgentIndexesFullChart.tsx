import React, { useState, useMemo, useRef } from "react";
import { Info, Plus } from "lucide-react";
import {
  ALL_CODING_AGENT_MODELS,
  DEFAULT_CODING_AGENT_MODEL_IDS,
  type CodingAgentModelItem,
} from "../data/codingAgentBenchmarks";
import { ColorByControl, ModelsFilterControl } from "../ui/ChartCardControls";

export interface CodingAgentIndexesFullChartProps {
  variant?: "overview" | "performance";
}

type MetricTab =
  "index" | "cost" | "time" | "scoreByBenchmark" | "deepSwe" | "terminalBench" | "sweAtlas";

const BENCHMARK_SERIES: {
  key: "deepSwe" | "terminalBench" | "sweAtlas";
  label: string;
  color: string;
}[] = [
  { key: "deepSwe", label: "DeepSWE v1.1", color: "#736CD3" },
  { key: "terminalBench", label: "Terminal-Bench 4.0", color: "#2E90FA" },
  { key: "sweAtlas", label: "SWE-Atlas-QnA", color: "#F97316" },
];

const BENCHMARK_MAX = 90;
const GROUPED_BAR_GAP = 3;

const metricValueFor = (item: CodingAgentModelItem, tab: MetricTab): number => {
  switch (tab) {
    case "cost":
      return item.costUsd || 1;
    case "time":
      return item.executionTimeMinutes;
    case "deepSwe":
      return item.deepSweRate ?? 0;
    case "terminalBench":
      return item.terminalBenchRate ?? 0;
    case "sweAtlas":
      return item.sweAtlasRate ?? 0;
    default:
      return item.indexScore;
  }
};

const metricDisplayFor = (item: CodingAgentModelItem, tab: MetricTab): string => {
  switch (tab) {
    case "cost":
      return item.costDisplay || `$${item.costUsd}`;
    case "time":
      return item.timeDisplay;
    case "deepSwe":
      return `${(item.deepSweRate ?? 0).toFixed(1)}%`;
    case "terminalBench":
      return `${(item.terminalBenchRate ?? 0).toFixed(1)}%`;
    case "sweAtlas":
      return `${(item.sweAtlasRate ?? 0).toFixed(1)}%`;
    default:
      return `${item.indexScore}`;
  }
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const CodingAgentIndexesFullChart: React.FC<CodingAgentIndexesFullChartProps> = ({
  variant = "overview",
}) => {
  const isPerformance = variant === "performance";
  const [metricTab, setMetricTab] = useState<MetricTab>("index");
  const [colorBy, setColorBy] = useState<"model" | "agent">("model");
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(() => [
    ...DEFAULT_CODING_AGENT_MODEL_IDS,
  ]);
  const [hoveredModel, setHoveredModel] = useState<CodingAgentModelItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isMetricInfoOpen, setIsMetricInfoOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const tabs: { id: MetricTab; label: string }[] = isPerformance
    ? [
        { id: "index", label: "Index" },
        { id: "scoreByBenchmark", label: "Score by Benchmark" },
        { id: "deepSwe", label: "DeepSWE v1.1" },
        { id: "terminalBench", label: "Terminal-Bench 4.0" },
        { id: "sweAtlas", label: "SWE-Atlas-QnA" },
      ]
    : [
        { id: "index", label: "Coding Agent Index" },
        { id: "cost", label: "Cost" },
        { id: "time", label: "Execution Time" },
      ];

  const getHeaderInfo = () => {
    switch (metricTab) {
      case "index":
        return {
          title: "Artificial Analysis Coding Agent Index",
          hasArrow: !isPerformance,
          subtitle:
            "Artificial Analysis Coding Agent Index v1.5 incorporates 3 benchmarks: DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA · Higher is better",
        };
      case "cost":
        return {
          title: "Coding Agent Index Cost per Task",
          hasArrow: false,
          subtitle: "Average pay-per-token API cost per task (USD) · Lower is better",
        };
      case "time":
        return {
          title: "Time per Task",
          hasArrow: false,
          subtitle: "Average agent wall time per task · Lower is better",
        };
      case "scoreByBenchmark":
        return {
          title: "Score by Benchmark",
          hasArrow: false,
          subtitle:
            "Component benchmark scores across DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA · Higher is better",
        };
      case "deepSwe":
        return {
          title: "DeepSWE v1.1",
          hasArrow: false,
          subtitle: "Long-horizon software engineering tasks, 113 tasks · Higher is better",
        };
      case "terminalBench":
        return {
          title: "Terminal-Bench 4.0",
          hasArrow: false,
          subtitle: "Agentic terminal use, 66 tasks · Higher is better",
        };
      case "sweAtlas":
        return {
          title: "SWE-Atlas-QnA",
          hasArrow: false,
          subtitle: "Repository Q&A, 124 tasks · Higher is better",
        };
    }
  };

  const header = getHeaderInfo();
  const isGrouped = metricTab === "scoreByBenchmark";

  // Active models (15 default, or user filtered)
  const activeModels = useMemo(() => {
    const selected = ALL_CODING_AGENT_MODELS.filter((m) => selectedModelIds.includes(m.id));

    switch (metricTab) {
      case "index":
        return [...selected].sort((a, b) => b.indexScore - a.indexScore);
      case "cost":
        return [...selected]
          .filter((m) => m.costUsd !== null)
          .sort((a, b) => (a.costUsd || 0) - (b.costUsd || 0));
      case "time":
        return [...selected].sort((a, b) => a.executionTimeMinutes - b.executionTimeMinutes);
      case "scoreByBenchmark":
        return [...selected]
          .filter((m) => m.deepSweRate !== undefined)
          .sort((a, b) => b.indexScore - a.indexScore);
      case "deepSwe":
        return [...selected]
          .filter((m) => m.deepSweRate !== undefined)
          .sort((a, b) => (b.deepSweRate ?? 0) - (a.deepSweRate ?? 0));
      case "terminalBench":
        return [...selected]
          .filter((m) => m.terminalBenchRate !== undefined)
          .sort((a, b) => (b.terminalBenchRate ?? 0) - (a.terminalBenchRate ?? 0));
      case "sweAtlas":
        return [...selected]
          .filter((m) => m.sweAtlasRate !== undefined)
          .sort((a, b) => (b.sweAtlasRate ?? 0) - (a.sweAtlasRate ?? 0));
    }
  }, [metricTab, selectedModelIds]);

  const maxMetricValue = useMemo(() => {
    switch (metricTab) {
      case "index":
        return 75;
      case "cost":
        return 16.0;
      case "time":
        return 100;
      case "scoreByBenchmark":
      case "deepSwe":
      case "terminalBench":
      case "sweAtlas":
        return BENCHMARK_MAX;
    }
  }, [metricTab]);

  // ── Scaled Geometry Constants ──
  const SVG_TOTAL_WIDTH = Math.max(1140, activeModels.length * 76);
  const SVG_HEIGHT = 265;
  const BASELINE_Y = 175;
  const MAX_BAR_HEIGHT = 145;
  const slotWidth = SVG_TOTAL_WIDTH / Math.max(1, activeModels.length);
  const barWidth = Math.min(52, Math.max(42, slotWidth - 22));

  // ── Color-by control (Index card only) ──
  const colorByControl = <ColorByControl value={colorBy} onChange={setColorBy} />;

  const modelsFilter = (
    <ModelsFilterControl
      models={ALL_CODING_AGENT_MODELS}
      selectedIds={selectedModelIds}
      onChangeSelection={setSelectedModelIds}
      defaultIds={DEFAULT_CODING_AGENT_MODEL_IDS}
      swatchColorFor={(model) => (colorBy === "model" ? model.modelColor : model.agentColor)}
      shownCount={activeModels.length}
    />
  );

  return (
    <div className="w-full max-w-[1560px] mx-auto flex flex-col gap-3.5 font-sans px-1">
      {/* ── Outer Header: ■ Indexes and All indexes ↗ (overview variant only) ── */}
      {!isPerformance && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 bg-neutral-900 rounded-[2px] inline-block" />
            <h2 className="text-2xl font-bold font-sans text-neutral-900 tracking-tight">
              Indexes
            </h2>
          </div>
          <a
            href="#all-indexes"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-900 hover:text-neutral-700 transition-colors"
          >
            <span>All indexes</span>
            <span className="w-5 h-5 bg-neutral-900 text-white rounded-[2px] flex items-center justify-center text-[10px] font-bold">
              ↗
            </span>
          </a>
        </div>
      )}

      {/* ── Main Card ── */}
      <div
        ref={containerRef}
        className="w-full bg-white rounded-2xl relative select-none"
      >
        {/* Performance variant: full-width tab bar at card top */}
        {isPerformance && (
          <div className="flex items-center gap-1 px-6 sm:px-8 pt-4 pb-3 border-b border-transparent">
            {tabs.map((tab) => {
              const isActive = metricTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMetricTab(tab.id)}
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
        )}

        <div className="p-6 sm:p-8">
          {/* Overview variant: pill-style tab bar inside the card */}
          {!isPerformance && (
            <div className="flex items-center mb-4">
              <div className="inline-flex p-1 bg-[#F1F3F5] rounded-xl gap-1 border-0">
                {tabs.map((tab) => {
                  const isActive = metricTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMetricTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-neutral-900 font-semibold shadow-xs border-0"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Title, Subtitle & Action Controls Row ── */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
            <div className="flex flex-col max-w-2xl">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-[24px] sm:text-[26px] font-normal text-neutral-900 tracking-tight leading-tight">
                  {header.title}
                </h3>
                {header.hasArrow && <span className="text-neutral-400 text-sm font-sans">↗</span>}
              </div>
              <p className="text-[12.5px] text-neutral-500 mt-1 leading-normal">
                {header.subtitle}
              </p>
            </div>

            {isPerformance ? (
              <div className="flex flex-col items-end gap-2.5 shrink-0 self-start sm:self-auto">
                {isGrouped ? (
                  <div className="flex items-center gap-3">
                    {BENCHMARK_SERIES.map((series) => (
                      <span
                        key={series.key}
                        className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 whitespace-nowrap"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-[2px]"
                          style={{ backgroundColor: series.color }}
                        />
                        {series.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  colorByControl
                )}

                {modelsFilter}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                {colorByControl}
                {modelsFilter}
              </div>
            )}
          </div>

          {/* ── SVG Chart Area ── */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_TOTAL_WIDTH} ${SVG_HEIGHT}`}
              className="w-full h-auto overflow-visible select-none"
              style={{ minWidth: `${SVG_TOTAL_WIDTH}px`, maxHeight: "310px" }}
            >
              {/* Clip path definitions for Devin Fusion diagonal split */}
              <defs>
                {activeModels.map((item, idx) => {
                  if (!item.splitColor || colorBy !== "model" || isGrouped) return null;
                  const cx = idx * slotWidth + slotWidth / 2;
                  const bx = cx - barWidth / 2;
                  const val = metricValueFor(item, metricTab);
                  const bh = Math.max(
                    20,
                    Math.min(MAX_BAR_HEIGHT, (val / maxMetricValue) * MAX_BAR_HEIGHT)
                  );
                  const by = BASELINE_Y - bh;
                  return (
                    <clipPath key={`clip-${item.id}`} id={`clip-${item.id}`}>
                      <rect x={bx} y={by} width={barWidth} height={bh} rx={3} />
                    </clipPath>
                  );
                })}
              </defs>

              {/* Bars & Labels */}
              {activeModels.map((item, idx) => {
                const cx = idx * slotWidth + slotWidth / 2;
                const bx = cx - barWidth / 2;

                const val = metricValueFor(item, metricTab);
                const displayVal = metricDisplayFor(item, metricTab);

                const bh = Math.max(
                  20,
                  Math.min(MAX_BAR_HEIGHT, (val / maxMetricValue) * MAX_BAR_HEIGHT)
                );
                const by = BASELINE_Y - bh;
                const solidColor = colorBy === "model" ? item.modelColor : item.agentColor;
                const isDevinSplit = colorBy === "model" && !!item.splitColor;

                return (
                  <g key={item.id} className="transition-opacity duration-150">
                    {/* The Bar */}
                    {isGrouped ? (
                      <g>
                        {BENCHMARK_SERIES.map((series, seriesIndex) => {
                          const seriesValue = metricValueFor(item, series.key);
                          const seriesHeight = Math.max(
                            6,
                            Math.min(MAX_BAR_HEIGHT, (seriesValue / BENCHMARK_MAX) * MAX_BAR_HEIGHT)
                          );
                          const seriesWidth = (barWidth - GROUPED_BAR_GAP * 2) / 3;
                          const seriesX = bx + seriesIndex * (seriesWidth + GROUPED_BAR_GAP);
                          return (
                            <rect
                              key={series.key}
                              x={seriesX}
                              y={BASELINE_Y - seriesHeight}
                              width={seriesWidth}
                              height={seriesHeight}
                              rx={2}
                              fill={series.color}
                            />
                          );
                        })}
                      </g>
                    ) : isDevinSplit && item.splitColor ? (
                      <g clipPath={`url(#clip-${item.id})`}>
                        <polygon
                          points={`${bx},${by} ${bx + barWidth},${by} ${bx},${by + bh}`}
                          fill={item.splitColor.leftColor}
                        />
                        <polygon
                          points={`${bx + barWidth},${by} ${bx + barWidth},${by + bh} ${bx},${by + bh}`}
                          fill={item.splitColor.rightColor}
                        />
                      </g>
                    ) : (
                      <rect
                        x={bx}
                        y={by}
                        width={barWidth}
                        height={bh}
                        rx={3}
                        fill={solidColor}
                        className="transition-all duration-150 group-hover:opacity-90"
                      />
                    )}

                    {/* Value Text inside Bar */}
                    {!isGrouped && (
                      <text
                        x={cx}
                        y={by + bh / 2 + 5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize={13.5}
                        fontWeight={700}
                        className="select-none font-sans drop-shadow-xs pointer-events-none"
                      >
                        {displayVal}
                      </text>
                    )}

                    {/* ── Labels below Baseline (y = BASELINE_Y) ── */}

                    {/* Line 1: Agent Name */}
                    <text
                      x={cx}
                      y={BASELINE_Y + 19}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize={11.5}
                      fontWeight={600}
                      className="select-none font-sans pointer-events-none"
                    >
                      {item.agentName}
                    </text>

                    {/* Line 2: Model Name line 1 */}
                    <text
                      x={cx}
                      y={BASELINE_Y + 34}
                      textAnchor="middle"
                      fill="#334155"
                      fontSize={11}
                      fontWeight={500}
                      className="select-none font-sans pointer-events-none"
                    >
                      {item.modelLines[0] || ""}
                    </text>

                    {/* Line 3: Model Name line 2 */}
                    {item.modelLines[1] && (
                      <text
                        x={cx}
                        y={BASELINE_Y + 48}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize={10.5}
                        fontWeight={400}
                        className="select-none font-sans pointer-events-none"
                      >
                        {item.modelLines[1]}
                      </text>
                    )}

                    {/* Line 4: Model Name line 3 or Provider */}
                    {item.modelLines[2] ? (
                      <text
                        x={cx}
                        y={BASELINE_Y + 62}
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize={10}
                        fontWeight={400}
                        className="select-none font-sans pointer-events-none"
                      >
                        {item.modelLines[2]}
                      </text>
                    ) : (
                      (metricTab === "cost" || metricTab === "time") &&
                      item.providerDisplay && (
                        <text
                          x={cx}
                          y={item.modelLines[1] ? BASELINE_Y + 62 : BASELINE_Y + 48}
                          textAnchor="middle"
                          fill="#94A3B8"
                          fontSize={10}
                          fontWeight={400}
                          className="select-none font-sans pointer-events-none"
                        >
                          {item.providerDisplay}
                        </text>
                      )
                    )}

                    {/* Full column invisible hover hit area */}
                    <rect
                      x={idx * slotWidth}
                      y={0}
                      width={slotWidth}
                      height={SVG_HEIGHT}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        const clientRect = e.currentTarget.getBoundingClientRect();
                        if (rect) {
                          setTooltipPos({
                            x: clientRect.left - rect.left + clientRect.width / 2,
                            y: clientRect.top - rect.top + by,
                          });
                        }
                        setHoveredModel(item);
                      }}
                      onMouseLeave={() => {
                        setHoveredModel(null);
                        setTooltipPos(null);
                      }}
                    />
                  </g>
                );
              })}
            </svg>

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
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Coding Agent Index:</span>
                    <span className="font-bold text-neutral-900 font-mono text-sm">
                      {hoveredModel.indexScore}
                    </span>
                  </div>
                  {hoveredModel.costDisplay && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Cost per Task:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {hoveredModel.costDisplay}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Execution Time:</span>
                    <span className="font-semibold text-neutral-800 font-mono">
                      {hoveredModel.timeDisplay}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer: What This Metric Means (performance variant only) ── */}
          {isPerformance && (
            <div className="mt-6 pt-4 border-t border-transparent">
              <button
                type="button"
                onClick={() => setIsMetricInfoOpen((prev) => !prev)}
                className="flex items-center justify-between w-full cursor-pointer group"
              >
                <span className="flex items-center gap-2 text-[13px] font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                  <Info size={14} className="text-neutral-400" />
                  What This Metric Means
                </span>
                <Plus
                  size={15}
                  className={`text-neutral-400 transition-transform duration-150 ${
                    isMetricInfoOpen ? "rotate-45" : ""
                  }`}
                />
              </button>
              {isMetricInfoOpen && (
                <p className="text-[12.5px] text-neutral-500 leading-relaxed mt-3 animate-in fade-in duration-150">
                  The Artificial Analysis Coding Agent Index is a composite score built from DeepSWE
                  v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA. It is useful for quick comparison,
                  but it should be read alongside the per-eval breakdowns. Each benchmark score
                  averages pass@1 across three attempts per task, and the Index gives equal weight
                  to its 3 benchmark components.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
