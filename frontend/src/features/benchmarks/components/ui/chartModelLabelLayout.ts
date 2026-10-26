import type { CodingAgentModelItem } from "../data/codingAgentBenchmarks";
import { getCreatorColor, getCreatorName, resolveCreatorLogo } from "./creatorBranding";

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
  return agentNameMeasureContext
    ? agentNameMeasureContext.measureText(agentName).width
    : agentName.length * AGENT_NAME_FONT_SIZE * 0.62;
};

interface ChartLabelLayout {
  logo: string | null;
  fallbackInitial: string;
  fallbackColor: string;
  nameWidth: number;
  groupWidth: number;
}

export const chartLabelLayout = (model: CodingAgentModelItem): ChartLabelLayout => {
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

export { AGENT_LOGO_GAP, AGENT_LOGO_SIZE, AGENT_NAME_FONT_SIZE, BASELINE_Y };
