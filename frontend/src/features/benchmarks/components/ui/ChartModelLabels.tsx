import React from "react";
import type { CodingAgentModelItem } from "../data/codingAgentBenchmarks";
import {
  AGENT_LOGO_GAP,
  AGENT_LOGO_SIZE,
  AGENT_NAME_FONT_SIZE,
  BASELINE_Y,
  chartLabelLayout,
} from "./chartModelLabelLayout";

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
