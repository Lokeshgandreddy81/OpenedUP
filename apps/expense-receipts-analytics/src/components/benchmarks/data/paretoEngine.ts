/**
 * Pareto Analysis & Multi-Objective Optimization Engine
 *
 * Provides algorithmic evaluation of AI model benchmarks to determine non-dominated
 * Pareto frontiers across multi-dimensional trade-offs (e.g. Quality vs Price,
 * Latency vs Throughput, Speed vs Intelligence).
 */

import {
  AIModelBenchmark,
  MetricDirection,
  ParetoFrontierResult,
  ParetoOptions,
  ParetoPoint,
  ScatterMetric,
} from "../types";

const EPSILON = 1e-9;

/**
 * Returns the natural multi-objective optimization direction for a benchmark metric.
 *
 * - 'intelligence' -> 'maximize' (higher intelligence index is superior)
 * - 'speed'        -> 'maximize' (higher token throughput is superior)
 * - 'contextWindow'-> 'maximize' (larger context window is superior)
 * - 'price'        -> 'minimize' (lower blended cost per 1M tokens is superior)
 * - 'latency'      -> 'minimize' (lower time to first token is superior)
 */
export function getDefaultMetricDirection(metric: ScatterMetric): MetricDirection {
  switch (metric) {
    case "price":
    case "latency":
      return "minimize";
    case "intelligence":
    case "speed":
    case "contextWindow":
      return "maximize";
    default: {
      const _exhaustiveCheck: never = metric;
      return "maximize";
    }
  }
}

/**
 * Checks if higher values are naturally better for a given metric.
 */
export function isHigherBetter(metric: ScatterMetric): boolean {
  return getDefaultMetricDirection(metric) === "maximize";
}

/**
 * Checks if lower values are naturally better for a given metric.
 */
export function isLowerBetter(metric: ScatterMetric): boolean {
  return getDefaultMetricDirection(metric) === "minimize";
}

/**
 * Extracts the numerical value corresponding to a ScatterMetric from an AIModelBenchmark.
 */
export function getMetricValue(model: AIModelBenchmark, metric: ScatterMetric): number {
  if (!model) return 0;

  switch (metric) {
    case "intelligence":
      return model.quality?.intelligenceIndex ?? 0;
    case "speed":
      return model.performance?.outputSpeedTokensPerSec?.median ?? 0;
    case "latency":
      return model.performance?.ttftSeconds?.median ?? 0;
    case "price":
      return model.pricing?.blendedPricePer1M ?? 0;
    case "contextWindow":
      return model.contextWindowTokens ?? 0;
    default: {
      const _exhaustiveCheck: never = metric;
      return 0;
    }
  }
}

/**
 * Returns a human-friendly display label for a benchmark metric.
 */
export function getMetricLabel(metric: ScatterMetric): string {
  switch (metric) {
    case "intelligence":
      return "Intelligence Index";
    case "speed":
      return "Output Speed";
    case "latency":
      return "Time to First Token (TTFT)";
    case "price":
      return "Blended Price";
    case "contextWindow":
      return "Context Window";
    default:
      return metric;
  }
}

/**
 * Returns the standard unit string for a benchmark metric.
 */
export function getMetricUnit(metric: ScatterMetric): string {
  switch (metric) {
    case "intelligence":
      return "index (0-100)";
    case "speed":
      return "tokens/sec";
    case "latency":
      return "sec";
    case "price":
      return "$/1M tokens";
    case "contextWindow":
      return "tokens";
    default:
      return "";
  }
}

/**
 * Formats a metric value into a clean, human-readable string with units.
 */
export function formatMetricValue(value: number, metric: ScatterMetric): string {
  if (!Number.isFinite(value)) return "N/A";

  switch (metric) {
    case "intelligence":
      return Number.isInteger(value) ? `${value}` : `${value.toFixed(1)}`;
    case "speed":
      return value >= 10
        ? `${Math.round(value).toLocaleString()} tok/s`
        : `${value.toFixed(1)} tok/s`;
    case "latency":
      return value < 0.1 ? `${value.toFixed(3)}s` : `${value.toFixed(2)}s`;
    case "price":
      if (value === 0) return "Free";
      if (value < 0.01) return `$${value.toFixed(4)}`;
      if (value < 1) return `$${value.toFixed(3)}`;
      return `$${value.toFixed(2)}`;
    case "contextWindow":
      if (value >= 1_000_000) {
        const millions = value / 1_000_000;
        return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M tok`;
      }
      if (value >= 1_000) {
        const thousands = value / 1_000;
        return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(0)}k tok`;
      }
      return `${value.toLocaleString()} tok`;
    default:
      return `${value}`;
  }
}

/**
 * Compares two scalar values according to an optimization direction.
 * Returns true if valA is at least as good as valB.
 */
function isAtLeastAsGood(valA: number, valB: number, dir: MetricDirection): boolean {
  return dir === "maximize" ? valA >= valB - EPSILON : valA <= valB + EPSILON;
}

/**
 * Compares two scalar values according to an optimization direction.
 * Returns true if valA is strictly superior to valB.
 */
function isStrictlyBetter(valA: number, valB: number, dir: MetricDirection): boolean {
  return dir === "maximize" ? valA > valB + EPSILON : valA < valB - EPSILON;
}

/**
 * Calculates the multi-objective Pareto frontier across two metrics.
 *
 * Mathematical Formulation:
 * A model B dominates model A (B ≻ A) if:
 * 1. B is at least as good as A on metric X (B ⪰_X A)
 * 2. B is at least as good as A on metric Y (B ⪰_Y A)
 * 3. B is strictly better than A on at least one metric (B ≻_X A or B ≻_Y A)
 *
 * Non-dominated models constitute the Pareto frontier.
 *
 * @param models The collection of AI models to analyze
 * @param xMetric The metric plotted along the X-axis
 * @param yMetric The metric plotted along the Y-axis
 * @param options Optional inversion toggles for X or Y optimization goals
 * @returns ParetoFrontierResult containing all scatter points, sorted frontier points, and optimal models
 */
export function calculateParetoFrontier(
  models: AIModelBenchmark[],
  xMetric: ScatterMetric,
  yMetric: ScatterMetric,
  options?: ParetoOptions
): ParetoFrontierResult {
  if (!models || models.length === 0) {
    return {
      points: [],
      frontierPoints: [],
      optimalModels: [],
    };
  }

  // 1. Determine natural directions for X and Y, with optional override
  const defaultDirX = getDefaultMetricDirection(xMetric);
  const defaultDirY = getDefaultMetricDirection(yMetric);

  const dirX: MetricDirection = options?.invertX
    ? defaultDirX === "maximize"
      ? "minimize"
      : "maximize"
    : defaultDirX;

  const dirY: MetricDirection = options?.invertY
    ? defaultDirY === "maximize"
      ? "minimize"
      : "maximize"
    : defaultDirY;

  // 2. Map all models to 2D ParetoPoints
  const points: ParetoPoint[] = models.map((model) => ({
    model,
    x: getMetricValue(model, xMetric),
    y: getMetricValue(model, yMetric),
    isParetoFrontier: false,
  }));

  // 3. Multi-objective dominance check
  for (let i = 0; i < points.length; i++) {
    const ptA = points[i];

    // Points with non-finite coordinates cannot be on the frontier
    if (!Number.isFinite(ptA.x) || !Number.isFinite(ptA.y)) {
      ptA.isParetoFrontier = false;
      continue;
    }

    let isDominated = false;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const ptB = points[j];

      if (!Number.isFinite(ptB.x) || !Number.isFinite(ptB.y)) {
        continue;
      }

      // Check if point B dominates point A
      const bAtLeastAsGoodX = isAtLeastAsGood(ptB.x, ptA.x, dirX);
      const bAtLeastAsGoodY = isAtLeastAsGood(ptB.y, ptA.y, dirY);
      const bStrictlyBetterX = isStrictlyBetter(ptB.x, ptA.x, dirX);
      const bStrictlyBetterY = isStrictlyBetter(ptB.y, ptA.y, dirY);

      if (bAtLeastAsGoodX && bAtLeastAsGoodY && (bStrictlyBetterX || bStrictlyBetterY)) {
        isDominated = true;
        break; // A is dominated by B, no need to check further candidates
      }
    }

    ptA.isParetoFrontier = !isDominated;
  }

  // 4. Extract and sort frontier points along the X-axis ascending to form a continuous line
  const frontierPoints = points
    .filter((pt) => pt.isParetoFrontier)
    .sort((a, b) => {
      if (Math.abs(a.x - b.x) > EPSILON) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

  const optimalModels = frontierPoints.map((pt) => pt.model);

  return {
    points,
    frontierPoints,
    optimalModels,
  };
}

/**
 * Calculates the "knee" point (sweet spot) on the Pareto frontier.
 *
 * The knee point represents the model offering the best overall compromise
 * between competing objectives, calculated by normalizing frontier coordinates
 * to [0, 1] relative to their ideal targets and minimizing the Euclidean distance
 * to the ideal point (1, 1).
 */
export function findKneePoint(
  frontierPoints: ParetoPoint[],
  xMetric: ScatterMetric,
  yMetric: ScatterMetric,
  options?: ParetoOptions
): ParetoPoint | undefined {
  if (!frontierPoints || frontierPoints.length === 0) return undefined;
  if (frontierPoints.length === 1) return frontierPoints[0];

  const defaultDirX = getDefaultMetricDirection(xMetric);
  const defaultDirY = getDefaultMetricDirection(yMetric);
  const dirX = options?.invertX
    ? defaultDirX === "maximize"
      ? "minimize"
      : "maximize"
    : defaultDirX;
  const dirY = options?.invertY
    ? defaultDirY === "maximize"
      ? "minimize"
      : "maximize"
    : defaultDirY;

  const xVals = frontierPoints.map((p) => p.x);
  const yVals = frontierPoints.map((p) => p.y);

  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  let bestPoint = frontierPoints[0];
  let minDistance = Infinity;

  // The ideal point in normalized [0, 1] space is 1.0 on both axes
  for (const pt of frontierPoints) {
    // Normalized score: 1.0 means ideal, 0.0 means least desirable
    const normX = dirX === "maximize" ? (pt.x - minX) / rangeX : (maxX - pt.x) / rangeX;
    const normY = dirY === "maximize" ? (pt.y - minY) / rangeY : (maxY - pt.y) / rangeY;

    // Euclidean distance to ideal point (1, 1)
    const dist = Math.hypot(1 - normX, 1 - normY);

    if (dist < minDistance) {
      minDistance = dist;
      bestPoint = pt;
    }
  }

  return bestPoint;
}
