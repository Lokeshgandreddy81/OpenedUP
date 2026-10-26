import React, { useMemo, useRef, useState } from "react";
import { Info, Plus, X } from "lucide-react";
import {
  ALL_CODING_AGENT_MODELS,
  DEFAULT_CODING_AGENT_MODEL_IDS,
  type CodingAgentModelItem,
} from "../data/codingAgentBenchmarks";
import { ChartModelLabels, chartLabelSlotWidth } from "../ui/ChartModelLabels";
import { ColorByControl, ModelsFilterControl, type ColorBy } from "../ui/ChartCardControls";

type TimeTab = "executionTime" | "turns";

const TIME_TABS: { id: TimeTab; label: string }[] = [
  { id: "executionTime", label: "Execution Time" },
  { id: "turns", label: "Turns" },
];

const TAB_HEADERS: Record<TimeTab, { title: string; subtitle: string }> = {
  executionTime: {
    title: "Time per Task",
    subtitle: "Average agent wall time per task · Lower is better",
  },
  turns: {
    title: "Turns per Task",
    subtitle: "Average number of agent turns per task · Lower is better",
  },
};

const TIME_NOTES: { id: string; title: string; body: string[] }[] = [
  {
    id: "what-execution-time-measures",
    title: "What Execution Time Is Measuring",
    body: [
      "This chart uses agent wall time: how long the agent process was actively running on each task.",
      "It does not include environment startup, verifier or judge time, or other harness overhead, so it is a cleaner comparison of how long the agent itself was working.",
      "Averages cover all 303 tasks in the index: DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA.",
    ],
  },
  {
    id: "what-turns-measure",
    title: "What Turns Are Measuring",
    body: [
      "A turn is one model invocation by the agent while working a task, covering planning, tool calls, and final responses. Harness-level retries and verifier steps are not counted, so turns reflect what the agent itself did.",
    ],
  },
  {
    id: "why-times-vary",
    title: "Why Times Vary",
    body: [
      "Provider load, API rate limits, tool latency, and task composition all affect wall time, and runs vary between trials, so small differences between models should not be over-interpreted.",
    ],
  },
];

const DEFAULT_OPEN_NOTE_IDS: Record<TimeTab, string[]> = {
  executionTime: ["what-execution-time-measures"],
  turns: ["what-turns-measure"],
};

// ── Chart geometry ──
const SVG_HEIGHT = 265;
const BASELINE_Y = 175;
const MAX_BAR_HEIGHT = 145;
const TIME_MAX_MINUTES = 100;
const TURNS_MAX = 100;
const GRIDLINE_FRACTIONS = [0.25, 0.5, 0.75, 1];
const SVG_MIN_WIDTH = 1140;

const formatTurns = (value: number): string => `${value}`;

export const ExecutionTimeChartCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TimeTab>("executionTime");
  const [colorBy, setColorBy] = useState<ColorBy>("model");
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(() => [
    ...DEFAULT_CODING_AGENT_MODEL_IDS,
  ]);
  const [hoveredModel, setHoveredModel] = useState<CodingAgentModelItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [openNoteIds, setOpenNoteIds] = useState<string[]>(() => [
    ...DEFAULT_OPEN_NOTE_IDS.executionTime,
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  const metricRows = useMemo(
    () =>
      ALL_CODING_AGENT_MODELS.filter((model) => selectedModelIds.includes(model.id))
        .map((model) =>
          activeTab === "turns"
            ? {
                model,
                value: model.turnsPerTask,
                label: formatTurns(model.turnsPerTask),
              }
            : {
                model,
                value: model.executionTimeMinutes,
                label: model.timeDisplay,
              }
        )
        .sort((a, b) => a.value - b.value),
    [activeTab, selectedModelIds]
  );

  const metricMax = activeTab === "turns" ? TURNS_MAX : TIME_MAX_MINUTES;
  const header = TAB_HEADERS[activeTab];

  const toggleNote = (noteId: string) => {
    setOpenNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const selectTab = (tab: TimeTab) => {
    setActiveTab(tab);
    setOpenNoteIds([...DEFAULT_OPEN_NOTE_IDS[tab]]);
  };

  const slotWidth = Math.max(
    chartLabelSlotWidth(metricRows.map((row) => row.model)),
    SVG_MIN_WIDTH / Math.max(1, metricRows.length)
  );
  const SVG_TOTAL_WIDTH = slotWidth * Math.max(1, metricRows.length);
  const barWidth = Math.min(46, Math.max(36, slotWidth - 28));

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
    labelFontSize: number
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

  return (
    <div className="w-full max-w-[1560px] mx-auto font-sans px-1">
      <div
        ref={containerRef}
        className="w-full bg-white rounded-2xl relative select-none"
      >
        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 px-6 sm:px-8 pt-4 pb-3 border-b border-transparent">
          {TIME_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
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
                shownCount={metricRows.length}
              />
            </div>
          </div>

          {/* ── Chart ── */}
          {metricRows.length === 0 ? (
            <div className="flex items-center justify-center h-[265px]">
              <p className="text-[13px] text-neutral-500">No models selected.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto no-scrollbar">
              {renderBarChart(metricRows, metricMax, "time-clip", 12.5)}

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
                    {activeTab === "turns" ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Turns per Task:</span>
                          <span className="font-bold text-neutral-900 font-mono text-sm">
                            {formatTurns(hoveredModel.turnsPerTask)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Execution Time:</span>
                          <span className="font-semibold text-neutral-800 font-mono">
                            {hoveredModel.timeDisplay}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Execution Time:</span>
                          <span className="font-bold text-neutral-900 font-mono text-sm">
                            {hoveredModel.timeDisplay}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Turns per Task:</span>
                          <span className="font-semibold text-neutral-800 font-mono">
                            {formatTurns(hoveredModel.turnsPerTask)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Coding Agent Index:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {hoveredModel.indexScore}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Cost per Task:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {hoveredModel.costDisplay ?? "N/A"}
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
                Wall time and turn counts can vary between runs due to provider load, API rate
                limits, and tool latency.
              </span>
            </div>

            {TIME_NOTES.map((note) => {
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
