import React, { useMemo, useRef, useState } from "react";
import { Info, Plus, X } from "lucide-react";
import {
  ALL_CODING_AGENT_MODELS,
  DEFAULT_CODING_AGENT_MODEL_IDS,
  type CodingAgentModelItem,
  type SafetyRefusalBreakdown,
} from "../data/codingAgentBenchmarks";
import { ChartModelLabels } from "../ui/ChartModelLabels";
import { chartLabelSlotWidth } from "../ui/chartModelLabelLayout";
import { ModelsFilterControl } from "../ui/ChartCardControls";

type SafetyTab = "index" | "deepSwe" | "terminalBench" | "sweAtlas";

const SAFETY_TABS: { id: SafetyTab; label: string }[] = [
  { id: "index", label: "Index" },
  { id: "deepSwe", label: "DeepSWE v1.1" },
  { id: "terminalBench", label: "Terminal-Bench 4.0" },
  { id: "sweAtlas", label: "SWE-Atlas-QnA" },
];

const TAB_HEADERS: Record<SafetyTab, { title: string; subtitle: string }> = {
  index: {
    title: "Safety Refusal Rate",
    subtitle:
      "Share of retained task attempts with a safety refusal (%) · Equal weight per benchmark · Lower is better",
  },
  deepSwe: {
    title: "Safety Refusal Rate: DeepSWE v1.1",
    subtitle: "Share of retained task attempts with a safety refusal (%) · Lower is better",
  },
  terminalBench: {
    title: "Safety Refusal Rate: Terminal-Bench 4.0",
    subtitle: "Share of retained task attempts with a safety refusal (%) · Lower is better",
  },
  sweAtlas: {
    title: "Safety Refusal Rate: SWE-Atlas-QnA",
    subtitle: "Share of retained task attempts with a safety refusal (%) · Lower is better",
  },
};

type SafetyCategory = keyof SafetyRefusalBreakdown;

const CATEGORY_ORDER: SafetyCategory[] = ["blocked", "fallbackOpus48", "fallbackOpus5"];

const STACK_ORDER: SafetyCategory[] = ["fallbackOpus48", "fallbackOpus5", "blocked"];

const CATEGORY_COLORS: Record<SafetyCategory, string> = {
  blocked: "#C1272D",
  fallbackOpus48: "#E2C4B5",
  fallbackOpus5: "#B5876E",
};

const CATEGORY_LABELS: Record<SafetyCategory, string> = {
  blocked: "Blocked",
  fallbackOpus48: "Fallback: Claude Opus 4.8",
  fallbackOpus5: "Fallback: Claude Opus 5",
};

const SAFETY_NOTES: { id: string; title: string; body: string[] }[] = [
  {
    id: "safety-refusal-outcomes",
    title: "Safety Refusal Outcomes",
    body: [
      "Rates show the share of retained task attempts that ended in a safety refusal rather than a normal response. Blocked attempts were declined outright, while fallback attempts were re-routed to Claude Opus 4.8 or Claude Opus 5 after the primary configuration refused.",
      "Values on the index view combine DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA with equal weight per benchmark.",
    ],
  },
  {
    id: "provider-configurable",
    title: "Provider-Configurable Behaviour",
    body: [
      "Safety and fallback behaviour is configured by each provider and harness and can change at any time, so these rates reflect behaviour recorded at the time of benchmarking rather than permanent properties of a model.",
    ],
  },
];

const DEFAULT_OPEN_NOTE_IDS = ["safety-refusal-outcomes"];

// ── Chart geometry ──
const SVG_HEIGHT = 265;
const BASELINE_Y = 175;
const MAX_BAR_HEIGHT = 145;
const MIN_BAR_HEIGHT = 18;
const MIN_SEGMENT_LABEL_HEIGHT = 13;
const GRIDLINE_FRACTIONS = [0.25, 0.5, 0.75, 1];
const SVG_MIN_WIDTH = 1140;

const SCALE_STEPS = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100];

const formatPercent = (value: number): string => {
  if (value <= 0) return "0.0%";
  const fixed = value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${fixed.includes(".") ? fixed : `${fixed}.0`}%`;
};

const refusalTotal = (breakdown: SafetyRefusalBreakdown): number =>
  breakdown.blocked + breakdown.fallbackOpus48 + breakdown.fallbackOpus5;

export interface SafetyRefusalChartCardProps {
  initialTab?: SafetyTab;
}

export const SafetyRefusalChartCard: React.FC<SafetyRefusalChartCardProps> = ({
  initialTab = "index",
}) => {
  const [activeTab, setActiveTab] = useState<SafetyTab>(initialTab);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(() => [
    ...DEFAULT_CODING_AGENT_MODEL_IDS,
  ]);
  const [hoveredModel, setHoveredModel] = useState<CodingAgentModelItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [openNoteIds, setOpenNoteIds] = useState<string[]>(() => [...DEFAULT_OPEN_NOTE_IDS]);

  const containerRef = useRef<HTMLDivElement>(null);

  const metricRows = useMemo(
    () =>
      ALL_CODING_AGENT_MODELS.flatMap((model) => {
        const rates = model.safetyRefusals;
        if (!rates || !selectedModelIds.includes(model.id)) return [];
        const breakdown = rates[activeTab];
        return [{ model, breakdown, total: refusalTotal(breakdown) }];
      }).sort((a, b) => b.total - a.total),
    [activeTab, selectedModelIds]
  );

  const scaleMax = useMemo(() => {
    const rawMax = Math.max(...metricRows.map((row) => row.total), 0.1);
    return SCALE_STEPS.find((step) => rawMax <= step) ?? 100;
  }, [metricRows]);

  const visibleCategories = CATEGORY_ORDER.filter((category) =>
    metricRows.some((row) => row.breakdown[category] > 0)
  );

  const header = TAB_HEADERS[activeTab];

  const toggleNote = (noteId: string) => {
    setOpenNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const slotWidth = Math.max(
    chartLabelSlotWidth(metricRows.map((row) => row.model)),
    SVG_MIN_WIDTH / Math.max(1, metricRows.length)
  );
  const SVG_TOTAL_WIDTH = slotWidth * Math.max(1, metricRows.length);
  const barWidth = Math.min(46, Math.max(36, slotWidth - 28));

  const yForValue = (value: number): number => BASELINE_Y - (value / scaleMax) * MAX_BAR_HEIGHT;

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

  const hoveredBreakdown = hoveredModel?.safetyRefusals?.[activeTab] ?? null;

  return (
    <div className="w-full max-w-[1560px] mx-auto font-sans px-1">
      <div
        ref={containerRef}
        className="w-full bg-white rounded-2xl relative select-none"
      >
        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 px-6 sm:px-8 pt-4 pb-3 border-b border-transparent">
          {SAFETY_TABS.map((tab) => {
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
              <ModelsFilterControl
                models={ALL_CODING_AGENT_MODELS}
                selectedIds={selectedModelIds}
                onChangeSelection={setSelectedModelIds}
                defaultIds={DEFAULT_CODING_AGENT_MODEL_IDS}
                swatchColorFor={(model) => model.modelColor}
                shownCount={metricRows.length}
              />
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-4">
              {visibleCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1.5 text-[12px] text-neutral-600"
                >
                  {category === "blocked" ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
                      <defs>
                        <pattern
                          id="safety-blocked-legend-hatch"
                          width="5"
                          height="5"
                          patternUnits="userSpaceOnUse"
                        >
                          <rect width="5" height="5" fill={CATEGORY_COLORS.blocked} />
                          <path d="M-1 6 L6 -1" stroke="#F1C5C1" strokeWidth="1.6" />
                        </pattern>
                      </defs>
                      <rect
                        width="10"
                        height="10"
                        rx="2.5"
                        fill="url(#safety-blocked-legend-hatch)"
                      />
                    </svg>
                  ) : (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }}
                    />
                  )}
                  {CATEGORY_LABELS[category]}
                </span>
              ))}
            </div>
          </div>

          {/* ── Chart ── */}
          {metricRows.length === 0 ? (
            <div className="flex items-center justify-center h-[265px]">
              <p className="text-[13px] text-neutral-500">No models selected.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto no-scrollbar">
              <svg
                viewBox={`0 0 ${SVG_TOTAL_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-auto overflow-visible select-none"
                style={{ minWidth: `${SVG_TOTAL_WIDTH}px`, maxHeight: "310px" }}
              >
                <defs>
                  <pattern
                    id="safety-blocked-hatch"
                    width="7"
                    height="7"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="7" height="7" fill={CATEGORY_COLORS.blocked} />
                    <path d="M-2 8 L8 -2" stroke="#F1C5C1" strokeWidth="2" />
                  </pattern>
                </defs>

                {/* Gridlines */}
                {GRIDLINE_FRACTIONS.map((fraction) => {
                  const y = yForValue(fraction * scaleMax);
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

                {metricRows.map(({ model, breakdown, total }, index) => {
                  const cx = index * slotWidth + slotWidth / 2;
                  const bx = cx - barWidth / 2;
                  const totalHeight =
                    total > 0 ? Math.max(MIN_BAR_HEIGHT, (total / scaleMax) * MAX_BAR_HEIGHT) : 0;
                  const topY = BASELINE_Y - totalHeight;

                  const segments = STACK_ORDER.map((category) => ({
                    category,
                    value: breakdown[category],
                  })).filter((segment) => segment.value > 0);

                  let cursor = BASELINE_Y;

                  return (
                    <g key={model.id}>
                      {segments.map((segment, segmentIndex) => {
                        const height = total > 0 ? (segment.value / total) * totalHeight : 0;
                        const y = cursor - height;
                        cursor = y;
                        const isTop = segmentIndex === segments.length - 1;

                        return (
                          <g key={segment.category}>
                            <rect
                              x={bx}
                              y={y}
                              width={barWidth}
                              height={height}
                              rx={isTop ? 2.5 : 0}
                              fill={
                                segment.category === "blocked"
                                  ? "url(#safety-blocked-hatch)"
                                  : CATEGORY_COLORS[segment.category]
                              }
                            />
                            {height >= MIN_SEGMENT_LABEL_HEIGHT && (
                              <text
                                x={cx}
                                y={y + height / 2 + 4}
                                textAnchor="middle"
                                fill="#FFFFFF"
                                fontSize={11.5}
                                fontWeight={700}
                                className="select-none font-sans pointer-events-none"
                              >
                                {formatPercent(segment.value)}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Total label above bar */}
                      <text
                        x={cx}
                        y={topY - 8}
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize={11.5}
                        fontWeight={600}
                        className="select-none font-sans pointer-events-none"
                      >
                        {formatPercent(total)}
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
                        onMouseEnter={(event) => handleHoverStart(event, model, topY)}
                        onMouseLeave={handleHoverEnd}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Tooltip Card */}
              {hoveredModel && tooltipPos && hoveredBreakdown && (
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
                      <span className="text-neutral-500">Safety Refusal Rate:</span>
                      <span className="font-bold text-neutral-900 font-mono text-sm">
                        {formatPercent(refusalTotal(hoveredBreakdown))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Blocked:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {formatPercent(hoveredBreakdown.blocked)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Fallback Opus 4.8:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {formatPercent(hoveredBreakdown.fallbackOpus48)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Fallback Opus 5:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {formatPercent(hoveredBreakdown.fallbackOpus5)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Coding Agent Index:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {hoveredModel.indexScore}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Notes footer ── */}
          <div className="mt-6">
            <div className="flex items-start gap-2 py-3 text-[12.5px] text-neutral-500 leading-normal">
              <Info size={14} className="text-neutral-400 mt-0.5 shrink-0" />
              <span>
                Safety and fallback behaviour is provider-configurable and may change over time;
                these rates reflect behaviour recorded at the time of benchmarking.
              </span>
            </div>

            {SAFETY_NOTES.map((note) => {
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
