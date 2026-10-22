import React from "react";
import type { CodingAgentModelItem } from "../data/codingAgentBenchmarks";
import { getCreatorColor, getCreatorName, resolveCreatorLogo } from "./CreatorLogo";

const BASELINE_Y = 175;
const AGENT_LOGO_SIZE = 12;
const AGENT_LOGO_GAP = 3;
const AGENT_NAME_FONT_SIZE = 11.5;
const AGENT_NAME_FONT_WEIGHT = 600;
const AGENT_NAME_FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";
const LABEL_GROUP_GAP = 6;
const MIN_SLOT_WIDTH = 76;
const MAX_SLOT_WIDTH = 98;

let agentNameMeasureContext: CanvasRenderingContext2D | null | undefined;

const measureAgentNameWidth = (agentName: string): number => {
  if (agentNameMeasureContext === undefined) {
    agentNameMeasureContext =
      typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    if (agentNameMeasureContext) {
      agentNameMeasureContext.font = `${AGENT_NAME_FONT_WEIGHT} ${AGENT_NAME_FONT_SIZE}px ${AGENT_NAME_FONT_FAMILY}`;
    }
  }
  if (!agentNameMeasureContext) {
    return agentName.length * AGENT_NAME_FONT_SIZE * 0.62;
  }
  return agentNameMeasureContext.measureText(agentName).width;
};

interface ChartLabelLayout {
  logo: string | null;
  fallbackInitial: string;
  fallbackColor: string;
  nameWidth: number;
  groupWidth: number;
}

const chartLabelLayout = (model: CodingAgentModelItem): ChartLabelLayout => {
  const logo = resolveCreatorLogo(model.creatorId);
  const nameWidth = measureAgentNameWidth(model.agentName);
  return {
    logo,
    fallbackInitial: getCreatorName(model.creatorId).charAt(0).toUpperCase(),
    fallbackColor: getCreatorColor(model.creatorId),
    nameWidth,
    groupWidth: nameWidth + AGENT_LOGO_SIZE + AGENT_LOGO_GAP,
  };
};

export const chartLabelSlotWidth = (models: CodingAgentModelItem[]): number =>
  Math.max(
    MIN_SLOT_WIDTH,
    Math.min(
      MAX_SLOT_WIDTH,
      models.reduce((widest, model) => Math.max(widest, chartLabelLayout(model).groupWidth), 0) +
        LABEL_GROUP_GAP
    )
  );

export interface ChartModelLabelsProps {
  model: CodingAgentModelItem;
  cx: number;
}

export const ChartModelLabels: React.FC<ChartModelLabelsProps> = ({ model, cx }) => {
  const { logo, fallbackInitial, fallbackColor, nameWidth, groupWidth } = chartLabelLayout(model);
  const groupLeft = cx - groupWidth / 2;
  const iconCenterX = groupLeft + AGENT_LOGO_SIZE / 2;
  const iconCenterY = BASELINE_Y + 9 + AGENT_LOGO_SIZE / 2;
  const agentTextX = groupLeft + AGENT_LOGO_SIZE + AGENT_LOGO_GAP + nameWidth / 2;

  return (
    <>
      {logo ? (
        <image
          href={logo}
          x={groupLeft}
          y={BASELINE_Y + 9}
          width={AGENT_LOGO_SIZE}
          height={AGENT_LOGO_SIZE}
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none"
        />
      ) : (
        <g className="pointer-events-none">
          <circle cx={iconCenterX} cy={iconCenterY} r={AGENT_LOGO_SIZE / 2} fill={fallbackColor} />
          <text
            x={iconCenterX}
            y={iconCenterY + 3}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={8}
            fontWeight={700}
            className="select-none font-sans pointer-events-none"
          >
            {fallbackInitial}
          </text>
        </g>
      )}

      {/* Line 1: Agent Name */}
      <text
        x={agentTextX}
        y={BASELINE_Y + 19}
        textAnchor="middle"
        fill="#0F172A"
        fontSize={AGENT_NAME_FONT_SIZE}
        fontWeight={600}
        className="select-none font-sans pointer-events-none"
      >
        {model.agentName}
      </text>

      {/* Model name lines */}
      {model.modelLines.map((line, lineIndex) => (
        <text
          key={`${line}-${lineIndex}`}
          x={cx}
          y={BASELINE_Y + 34 + 14 * lineIndex}
          textAnchor="middle"
          fill={lineIndex === 0 ? "#334155" : lineIndex === 1 ? "#64748B" : "#94A3B8"}
          fontSize={lineIndex === 0 ? 11 : lineIndex === 1 ? 10.5 : 10}
          fontWeight={lineIndex === 0 ? 500 : 400}
          className="select-none font-sans pointer-events-none"
        >
          {line}
        </text>
      ))}

      {/* Provider */}
      <text
        x={cx}
        y={BASELINE_Y + 34 + 14 * model.modelLines.length}
        textAnchor="middle"
        fill="#94A3B8"
        fontSize={10}
        fontWeight={400}
        className="select-none font-sans pointer-events-none"
      >
        ({model.creatorName})
      </text>
    </>
  );
};
