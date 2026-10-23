import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Zap,
  DollarSign,
  Gauge,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Tag,
  Eye,
  GitCompare,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Filter,
} from "lucide-react";
import {
  AIModelBenchmark,
  CreatorId,
  ScatterMetric,
  WeightsType,
  ParetoPoint,
} from "../types";
import {
  calculateParetoFrontier,
  getMetricValue,
  formatMetricValue,
  getMetricLabel,
  getMetricUnit,
  findKneePoint,
  isHigherBetter,
} from "../data/paretoEngine";
import {
  CreatorLogo,
  getCreatorColor,
  getCreatorName,
} from "../ui/CreatorLogo";
import { WeightsBadge, ReasoningBadge } from "../ui/BenchmarkBadge";

// ==========================================
// PROPS & CONFIGURATION
// ==========================================

export interface BenchmarkScatterPlotProps {
  models: AIModelBenchmark[];
  selectedModelId?: string | null;
  onSelectModel?: (model: AIModelBenchmark) => void;
  onCompareModel?: (model: AIModelBenchmark) => void;
  className?: string;
  activePresetId?: PresetId;
  onPresetChange?: (preset: PresetId) => void;
}

export type PresetId =
  "quality-vs-price" | "quality-vs-speed" | "speed-vs-latency" | "context-vs-quality" | "custom";

export interface ChartPreset {
  id: PresetId;
  name: string;
  badgeLabel: string;
  description: string;
  yMetric: ScatterMetric;
  xMetric: ScatterMetric;
  defaultScale: "linear" | "log";
  icon: React.FC<{ size?: number; className?: string }>;
}

export const CHART_PRESETS: ChartPreset[] = [
  {
    id: "quality-vs-price",
    name: "Quality vs. Price",
    badgeLabel: "Quality / Price",
    description:
      "Intelligence Index vs. Blended Price ($/1M tokens). Spotlights high-performing models at lowest cost.",
    yMetric: "intelligence",
    xMetric: "price",
    defaultScale: "log",
    icon: DollarSign,
  },
  {
    id: "quality-vs-speed",
    name: "Quality vs. Speed",
    badgeLabel: "Quality / Speed",
    description:
      "Intelligence Index vs. Output Speed (tokens/s). Balances deep reasoning with rapid completion throughput.",
    yMetric: "intelligence",
    xMetric: "speed",
    defaultScale: "linear",
    icon: Zap,
  },
  {
    id: "speed-vs-latency",
    name: "Speed vs. Latency",
    badgeLabel: "Speed / Latency",
    description:
      "Output Speed (tokens/s) vs. TTFT Latency (seconds). Highlights models with instantaneous response and high generation rate.",
    yMetric: "speed",
    xMetric: "latency",
    defaultScale: "linear",
    icon: Gauge,
  },
  {
    id: "context-vs-quality",
    name: "Context vs. Quality",
    badgeLabel: "Context / Quality",
    description:
      "Intelligence Index vs. Context Window (tokens). Evaluates model reasoning capability across massive token limits.",
    yMetric: "intelligence",
    xMetric: "contextWindow",
    defaultScale: "log",
    icon: Layers,
  },
];

const METRIC_OPTIONS: { value: ScatterMetric; label: string; unit: string }[] = [
  { value: "intelligence", label: "Intelligence Index", unit: "0-100" },
  { value: "speed", label: "Output Speed", unit: "tokens/s" },
  { value: "latency", label: "TTFT Latency", unit: "seconds" },
  { value: "price", label: "Blended Price", unit: "$/1M tokens" },
  { value: "contextWindow", label: "Context Window", unit: "tokens" },
];

type LabelDisplayMode = "frontier" | "all" | "none";

// SVG Viewport constants
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 580;
const PADDING = {
  top: 48,
  right: 50,
  bottom: 64,
  left: 80,
};

const PLOT_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;
const PLOT_BOTTOM = SVG_HEIGHT - PADDING.bottom;

// ==========================================
// HELPER FUNCTIONS FOR SMOOTH PATHS
// ==========================================

/**
 * Builds a smooth Catmull-Rom cubic bezier curve through an array of 2D screen points.
 */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (!points || points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier with tension = 0.5
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export const BenchmarkScatterPlot: React.FC<BenchmarkScatterPlotProps> = ({
  models = [],
  selectedModelId = null,
  onSelectModel,
  onCompareModel,
  className = "",
  activePresetId,
  onPresetChange,
}) => {
  // --- Active Preset & Metric State ---
  const [activePreset, setActivePreset] = useState<PresetId>(activePresetId || "quality-vs-price");
  const [yMetric, setYMetric] = useState<ScatterMetric>("intelligence");
  const [xMetric, setXMetric] = useState<ScatterMetric>("price");
  const [scaleType, setScaleType] = useState<"linear" | "log">("log");
  const [isCustomAxisOpen, setIsCustomAxisOpen] = useState<boolean>(false);

  // Sync external presetId prop
  useEffect(() => {
    if (activePresetId && activePresetId !== activePreset) {
      const found = CHART_PRESETS.find((p) => p.id === activePresetId);
      if (found) {
        setActivePreset(found.id);
        setYMetric(found.yMetric);
        setXMetric(found.xMetric);
        setScaleType(found.defaultScale);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    }
  }, [activePresetId]);

  // --- Filtering State ---
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCreators, setSelectedCreators] = useState<Set<CreatorId>>(new Set());
  const [weightsFilter, setWeightsFilter] = useState<"all" | WeightsType>("all");
  const [reasoningFilter, setReasoningFilter] = useState<"all" | "extended-thinking" | "standard">(
    "all"
  );

  // --- Visualization Controls State ---
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [labelsMode, setLabelsMode] = useState<LabelDisplayMode>("frontier");

  // --- Hover & Interaction State ---
  const [hoveredModel, setHoveredModel] = useState<AIModelBenchmark | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState<boolean>(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Drag Pan State ---
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startPanX: number;
    startPanY: number;
  }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Initialize selected creators when models load
  useEffect(() => {
    if (models.length > 0 && selectedCreators.size === 0) {
      const allCreators = new Set<CreatorId>(models.map((m) => m.creator));
      setSelectedCreators(allCreators);
    }
  }, [models]);

  // Clean up tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Handle Preset Switching
  const handleSelectPreset = (preset: ChartPreset) => {
    setActivePreset(preset.id);
    setYMetric(preset.yMetric);
    setXMetric(preset.xMetric);
    setScaleType(preset.defaultScale);
    // Reset zoom & pan on preset switch for clean view
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsCustomAxisOpen(false);
    onPresetChange?.(preset.id);
  };

  // Custom Metric change
  const handleCustomMetricChange = (axis: "x" | "y", metric: ScatterMetric) => {
    if (axis === "x") {
      setXMetric(metric);
      if (metric === "price" || metric === "contextWindow") {
        setScaleType("log");
      } else {
        setScaleType("linear");
      }
    } else {
      setYMetric(metric);
    }
    setActivePreset("custom");
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Available creators in current dataset
  const availableCreators = useMemo(() => {
    const creatorMap = new Map<CreatorId, number>();
    for (const m of models) {
      creatorMap.set(m.creator, (creatorMap.get(m.creator) || 0) + 1);
    }
    return Array.from(creatorMap.entries()).map(([id, count]) => ({
      id,
      count,
      name: getCreatorName(id),
      color: getCreatorColor(id),
    }));
  }, [models]);

  // Creator toggle handlers
  const toggleCreator = (creatorId: CreatorId) => {
    setSelectedCreators((prev) => {
      const next = new Set(prev);
      if (next.has(creatorId)) {
        // Don't allow deselecting the last creator
        if (next.size > 1) {
          next.delete(creatorId);
        }
      } else {
        next.add(creatorId);
      }
      return next;
    });
  };

  const selectAllCreators = () => {
    const all = new Set<CreatorId>(models.map((m) => m.creator));
    setSelectedCreators(all);
  };

  // --- Filter Models ---
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = model.name.toLowerCase().includes(query);
        const matchesCreator = model.creatorDisplayName.toLowerCase().includes(query);
        const matchesTags = model.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesCreator && !matchesTags) return false;
      }

      // Creator
      if (selectedCreators.size > 0 && !selectedCreators.has(model.creator)) {
        return false;
      }

      // Weights
      if (weightsFilter !== "all") {
        if (weightsFilter === "open-weights" && model.weightsType !== "open-weights") {
          return false;
        }
        if (
          weightsFilter === "proprietary" &&
          model.weightsType !== "proprietary" &&
          model.weightsType !== "commercial-restricted"
        ) {
          return false;
        }
      }

      // Reasoning
      if (reasoningFilter !== "all") {
        const isExtended = model.isReasoningModel || model.reasoningType === "extended-thinking";
        if (reasoningFilter === "extended-thinking" && !isExtended) return false;
        if (reasoningFilter === "standard" && isExtended) return false;
      }

      return true;
    });
  }, [models, searchQuery, selectedCreators, weightsFilter, reasoningFilter]);

  // --- Pareto Analysis ---
  const paretoResult = useMemo(() => {
    return calculateParetoFrontier(filteredModels, xMetric, yMetric);
  }, [filteredModels, xMetric, yMetric]);

  const kneePoint = useMemo(() => {
    return findKneePoint(paretoResult.frontierPoints, xMetric, yMetric);
  }, [paretoResult.frontierPoints, xMetric, yMetric]);

  // --- Coordinate Mapping Engine ---
  const plotBounds = useMemo(() => {
    if (filteredModels.length === 0) {
      return {
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
        isLogX: false,
      };
    }

    const xVals = filteredModels.map((m) => getMetricValue(m, xMetric));
    const yVals = filteredModels.map((m) => getMetricValue(m, yMetric));

    let minY = Math.min(...yVals);
    let maxY = Math.max(...yVals);

    // Give Y a small aesthetic breathing room
    if (yMetric === "intelligence") {
      minY = Math.max(0, Math.floor(minY / 5) * 5 - 5);
      maxY = Math.min(100, Math.ceil(maxY / 5) * 5 + 5);
    } else {
      const yMargin = (maxY - minY) * 0.1 || 10;
      minY = Math.max(0, minY - yMargin);
      maxY = maxY + yMargin;
    }

    const isLogX = scaleType === "log";

    let minX: number;
    let maxX: number;

    if (isLogX) {
      // Find lowest strictly positive value
      const positiveX = xVals.filter((v) => v > 0);
      const minPositive = positiveX.length > 0 ? Math.min(...positiveX) : 0.01;
      const rawMaxX = Math.max(...xVals, 1);

      minX = minPositive * 0.7; // Lower floor
      maxX = rawMaxX * 1.35; // Upper ceiling
    } else {
      const rawMinX = Math.min(...xVals);
      const rawMaxX = Math.max(...xVals);
      const xMargin = (rawMaxX - rawMinX) * 0.08 || 5;
      minX = Math.max(0, rawMinX - xMargin);
      maxX = rawMaxX + xMargin;
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      isLogX,
    };
  }, [filteredModels, xMetric, yMetric, scaleType]);

  // Function to project raw data coordinate (x, y) to SVG screen space (screenX, screenY)
  const projectCoordinates = useCallback(
    (rawX: number, rawY: number) => {
      const { minX, maxX, minY, maxY, isLogX } = plotBounds;

      // 1. Calculate normalized X in [0, 1]
      let normX = 0;
      if (isLogX) {
        const logMinX = Math.log10(Math.max(1e-4, minX));
        const logMaxX = Math.log10(Math.max(1e-3, maxX));
        const logRange = logMaxX - logMinX || 1;
        const safeX = Math.max(minX, rawX);
        normX = (Math.log10(safeX) - logMinX) / logRange;
      } else {
        const rangeX = maxX - minX || 1;
        normX = (rawX - minX) / rangeX;
      }

      // 2. Calculate normalized Y in [0, 1]
      const rangeY = maxY - minY || 1;
      const normY = (rawY - minY) / rangeY;

      // 3. Apply Zoom and Pan in normalized viewport
      // Visible window in normalized space has size (1 / zoom)
      const visibleWindowSize = 1 / zoom;
      const visibleMinNormX = 0.5 - visibleWindowSize / 2 - pan.x;
      const visibleMinNormY = 0.5 - visibleWindowSize / 2 - pan.y;

      const screenNormX = (normX - visibleMinNormX) * zoom;
      const screenNormY = (normY - visibleMinNormY) * zoom;

      // 4. Map to screen SVG coordinates
      const screenX = PADDING.left + screenNormX * PLOT_WIDTH;
      const screenY = PLOT_BOTTOM - screenNormY * PLOT_HEIGHT;

      return { screenX, screenY };
    },
    [plotBounds, zoom, pan]
  );

  // Map Pareto points to Screen coordinates
  const pointsWithScreenCoords = useMemo(() => {
    return paretoResult.points.map((pt) => {
      const { screenX, screenY } = projectCoordinates(pt.x, pt.y);
      return {
        ...pt,
        screenX,
        screenY,
      };
    });
  }, [paretoResult.points, projectCoordinates]);

  // Frontier points mapped to screen coordinates and sorted along X
  const frontierScreenPoints = useMemo(() => {
    return pointsWithScreenCoords
      .filter((p) => p.isParetoFrontier)
      .sort((a, b) => a.screenX - b.screenX);
  }, [pointsWithScreenCoords]);

  // Smooth Frontier Paths
  const { frontierLinePath, frontierAreaPath } = useMemo(() => {
    if (frontierScreenPoints.length < 2) {
      return { frontierLinePath: "", frontierAreaPath: "" };
    }

    const linePath = buildSmoothPath(
      frontierScreenPoints.map((p) => ({ x: p.screenX, y: p.screenY }))
    );

    const firstPt = frontierScreenPoints[0];
    const lastPt = frontierScreenPoints[frontierScreenPoints.length - 1];

    // Closed polygon under the curve down to the bottom axis
    const areaPath = `${linePath} L ${lastPt.screenX.toFixed(1)},${PLOT_BOTTOM} L ${firstPt.screenX.toFixed(1)},${PLOT_BOTTOM} Z`;

    return { frontierLinePath: linePath, frontierAreaPath: areaPath };
  }, [frontierScreenPoints]);

  // --- Dynamic Gridlines & Ticks Generator ---
  const { xTicks, yTicks } = useMemo(() => {
    const { minX, maxX, minY, maxY, isLogX } = plotBounds;

    // Y Ticks (always linear)
    const yTickCount = 6;
    const yStep = (maxY - minY) / (yTickCount - 1);
    const calculatedYTicks: { val: number; screenY: number; label: string }[] = [];

    for (let i = 0; i < yTickCount; i++) {
      const val = minY + i * yStep;
      const { screenY } = projectCoordinates(minX, val);
      calculatedYTicks.push({
        val,
        screenY,
        label: formatMetricValue(val, yMetric),
      });
    }

    // X Ticks
    const calculatedXTicks: { val: number; screenX: number; label: string }[] = [];

    if (isLogX) {
      // Generate clean decade ticks + half-decade ticks
      const logMin = Math.floor(Math.log10(minX));
      const logMax = Math.ceil(Math.log10(maxX));
      const candidateTicks: number[] = [];

      for (let power = logMin; power <= logMax; power++) {
        const base = Math.pow(10, power);
        candidateTicks.push(base);
        if (power < logMax) {
          candidateTicks.push(base * 2);
          candidateTicks.push(base * 5);
        }
      }

      for (const val of candidateTicks) {
        if (val >= minX * 0.95 && val <= maxX * 1.05) {
          const { screenX } = projectCoordinates(val, minY);
          calculatedXTicks.push({
            val,
            screenX,
            label: formatMetricValue(val, xMetric),
          });
        }
      }
    } else {
      const xTickCount = 7;
      const xStep = (maxX - minX) / (xTickCount - 1);
      for (let i = 0; i < xTickCount; i++) {
        const val = minX + i * xStep;
        const { screenX } = projectCoordinates(val, minY);
        calculatedXTicks.push({
          val,
          screenX,
          label: formatMetricValue(val, xMetric),
        });
      }
    }

    return { xTicks: calculatedXTicks, yTicks: calculatedYTicks };
  }, [plotBounds, projectCoordinates, yMetric, xMetric]);

  // --- Zoom & Pan Event Handlers ---
  const handleZoomIn = () => {
    setZoom((z) => Math.min(z * 1.35, 6));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const nextZ = Math.max(z / 1.35, 1);
      if (nextZ === 1) setPan({ x: 0, y: 0 });
      return nextZ;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCycleLabelsMode = () => {
    setLabelsMode((prev) => {
      if (prev === "frontier") return "all";
      if (prev === "all") return "none";
      return "frontier";
    });
  };

  // Drag Panning Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || zoom <= 1) return;
    const dx = (e.clientX - dragStartRef.current.clientX) / PLOT_WIDTH / zoom;
    const dy = (e.clientY - dragStartRef.current.clientY) / PLOT_HEIGHT / zoom;

    setPan({
      x: Math.max(-0.6, Math.min(0.6, dragStartRef.current.startPanX + dx)),
      y: Math.max(-0.6, Math.min(0.6, dragStartRef.current.startPanY - dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Tooltip Hover Handlers
  const handlePointMouseEnter = (point: ParetoPoint & { screenX: number; screenY: number }) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setHoveredModel(point.model);
    setTooltipPos({ x: point.screenX, y: point.screenY });
  };

  const handlePointMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      if (!isHoveringTooltip) {
        setHoveredModel(null);
        setTooltipPos(null);
      }
    }, 180);
  };

  const handleTooltipMouseEnter = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setIsHoveringTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    setIsHoveringTooltip(false);
    setHoveredModel(null);
    setTooltipPos(null);
  };

  // Direction indicators for axes
  const yIsHigherBetter = isHigherBetter(yMetric);
  const xIsHigherBetter = isHigherBetter(xMetric);

  return (
    <div
      className={`flex flex-col w-full bg-white text-slate-900 font-sans select-none ${className}`}
    >
      {/* ========================================================
          1. HEADER & PRESETS BAR
      ======================================================== */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80">
            {CHART_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-[#0047FF] shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                  title={preset.description}
                >
                  <Icon size={14} className={isActive ? "text-[#0047FF]" : "text-slate-500"} />
                  <span>{preset.badgeLabel}</span>
                </button>
              );
            })}

            {/* Custom Axis Toggle */}
            <button
              type="button"
              onClick={() => setIsCustomAxisOpen(!isCustomAxisOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activePreset === "custom" || isCustomAxisOpen
                  ? "bg-white text-[#0047FF] shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
              title="Configure custom X & Y axes"
            >
              <SlidersHorizontal size={13} />
              <span>Custom</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${isCustomAxisOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Sweet Spot Badge & Stats Summary */}
          <div className="flex items-center gap-2.5 ml-auto">
            {kneePoint && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectModel?.(kneePoint.model)}
                onKeyDown={(e) => e.key === "Enter" && onSelectModel?.(kneePoint.model)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#EBF2FF] to-blue-50 border border-[#BEDBFF] text-xs font-semibold text-[#0047FF] hover:border-[#0047FF]/60 hover:shadow-xs transition-all cursor-pointer active:scale-95"
                title={`Knee point: Optimal multi-objective trade-off along the Pareto frontier`}
              >
                <Sparkles size={12} className="text-[#0047FF] animate-pulse" />
                <span className="text-slate-500 font-normal">Sweet Spot:</span>
                <span className="font-semibold text-slate-900 underline decoration-blue-300 underline-offset-2">
                  {kneePoint.model.name}
                </span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="font-semibold text-slate-800">{filteredModels.length}</span>
              <span>models</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-[#0047FF]">
                {paretoResult.frontierPoints.length}
              </span>
              <span>on frontier</span>
            </div>
          </div>
        </div>

        {/* Custom Axis Selection Popover Bar */}
        {isCustomAxisOpen && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Y-Axis:</span>
              <select
                value={yMetric}
                onChange={(e) => handleCustomMetricChange("y", e.target.value as ScatterMetric)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {METRIC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">X-Axis:</span>
              <select
                value={xMetric}
                onChange={(e) => handleCustomMetricChange("x", e.target.value as ScatterMetric)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {METRIC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs font-semibold text-slate-700">X Scale:</span>
              <button
                type="button"
                onClick={() => setScaleType("linear")}
                className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${
                  scaleType === "linear"
                    ? "bg-[#0047FF] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Linear
              </button>
              <button
                type="button"
                onClick={() => setScaleType("log")}
                className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${
                  scaleType === "log"
                    ? "bg-[#0047FF] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Logarithmic
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            2. SECONDARY FILTER BAR (Creators, Weights, Reasoning, Search)
        ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Creator Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Creators:
            </span>
            {availableCreators.map((creator) => {
              const isSelected = selectedCreators.has(creator.id);
              return (
                <button
                  key={creator.id}
                  type="button"
                  onClick={() => toggleCreator(creator.id)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white font-medium shadow-xs"
                      : "bg-slate-100/90 text-slate-500 hover:bg-slate-200/80 border border-transparent"
                  }`}
                  title={`${creator.name} (${creator.count} models)`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: creator.color }}
                  />
                  <span>{creator.name}</span>
                  <span
                    className={`tabular-nums text-[10px] ${
                      isSelected ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {creator.count}
                  </span>
                </button>
              );
            })}

            {selectedCreators.size < availableCreators.length && (
              <button
                type="button"
                onClick={selectAllCreators}
                className="text-[11px] text-[#0047FF] font-medium hover:underline ml-1 cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Quick Filters: Weights, Reasoning, Search */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Weights filter */}
            <select
              value={weightsFilter}
              onChange={(e) => setWeightsFilter(e.target.value as "all" | WeightsType)}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Weights: All</option>
              <option value="open-weights">Open Weights</option>
              <option value="proprietary">Proprietary</option>
            </select>

            {/* Reasoning filter */}
            <select
              value={reasoningFilter}
              onChange={(e) =>
                setReasoningFilter(e.target.value as "all" | "extended-thinking" | "standard")
              }
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Reasoning: All</option>
              <option value="extended-thinking">Extended Thinking</option>
              <option value="standard">Standard</option>
            </select>

            {/* Model Search Input */}
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 sm:w-40 h-7 pl-7 pr-6 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. MAIN INTERACTIVE SVG SCATTER PLOT
      ======================================================== */}
      <div className="relative w-full mt-3 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Floating Toolbar (Zoom In, Zoom Out, Reset, Labels, Scale) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title={`Reset View (${zoom > 1 ? `${zoom.toFixed(1)}x` : "1.0x"})`}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${
              zoom > 1 ? "text-[#0047FF] font-semibold" : ""
            }`}
          >
            <RotateCcw size={13} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

          {/* Toggle Labels Mode */}
          <button
            type="button"
            onClick={handleCycleLabelsMode}
            title={`Toggle Labels (Current: ${labelsMode})`}
            className={`flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              labelsMode === "all"
                ? "bg-blue-50 text-[#0047FF] font-semibold"
                : labelsMode === "frontier"
                  ? "text-slate-700 hover:bg-slate-100"
                  : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Tag size={12} />
            <span className="capitalize">{labelsMode}</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

          {/* Scale Indicator / Toggle */}
          <button
            type="button"
            onClick={() => setScaleType(scaleType === "log" ? "linear" : "log")}
            title="Toggle between Linear and Logarithmic scale for X-axis"
            className="h-7 px-2 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer uppercase tracking-wider"
          >
            {scaleType === "log" ? "Log X" : "Linear X"}
          </button>
        </div>

        {/* Drag Pan Overlay Instruction Hint when Zoomed */}
        {zoom > 1 && (
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[11px] font-medium backdrop-blur-xs animate-in fade-in">
            Click & drag canvas to pan ({zoom.toFixed(1)}×)
          </div>
        )}

        {/* Empty State when no models match filters */}
        {filteredModels.length === 0 ? (
          <div className="w-full h-[520px] flex flex-col items-center justify-center p-6 text-center">
            <Filter size={32} className="text-slate-300 mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              No models match selected filters
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Adjust your search keywords, creator toggles, or weights filters to populate the
              scatter analysis.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                selectAllCreators();
                setWeightsFilter("all");
                setReasoningFilter("all");
              }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-[#0047FF] text-white text-xs font-semibold hover:bg-[#2966FF] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Responsive SVG Chart Canvas */
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className={`w-full h-auto block select-none ${
              zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
            }`}
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Definitions (Gradients, Glow Filters, Clip Path) */}
            <defs>
              {/* Electric Blue Pareto Area Gradient */}
              <linearGradient id="paretoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0047FF" stopOpacity="0.18" />
                <stop offset="60%" stopColor="#2966FF" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#BEDBFF" stopOpacity="0.0" />
              </linearGradient>

              {/* Electric Blue Glow for Pareto Frontier Line */}
              <filter id="frontierGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Selected Model Pulsing Halo Glow */}
              <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Point Drop Shadow */}
              <filter id="pointShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
              </filter>

              {/* Plot Area Bounding Clip */}
              <clipPath id="plotAreaClip">
                <rect x={PADDING.left} y={PADDING.top} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
              </clipPath>
            </defs>

            {/* Background Canvas */}
            <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#FFFFFF" />

            {/* Subdued Plot Area Background */}
            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={PLOT_WIDTH}
              height={PLOT_HEIGHT}
              fill="#F8FAFC"
              fillOpacity="0.5"
            />

            {/* --- Horizontal Gridlines & Y-Axis Labels --- */}
            {yTicks.map((tick, idx) => {
              // Skip tick if out of bounds when zoomed
              if (tick.screenY < PADDING.top || tick.screenY > PLOT_BOTTOM) return null;
              return (
                <g key={`y-grid-${idx}`}>
                  <line
                    x1={PADDING.left}
                    y1={tick.screenY}
                    x2={SVG_WIDTH - PADDING.right}
                    y2={tick.screenY}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={PADDING.left - 12}
                    y={tick.screenY + 4}
                    textAnchor="end"
                    className="text-[11px] fill-slate-500 font-medium tabular-nums"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* --- Vertical Gridlines & X-Axis Labels --- */}
            {xTicks.map((tick, idx) => {
              if (tick.screenX < PADDING.left || tick.screenX > SVG_WIDTH - PADDING.right) {
                return null;
              }
              return (
                <g key={`x-grid-${idx}`}>
                  <line
                    x1={tick.screenX}
                    y1={PADDING.top}
                    x2={tick.screenX}
                    y2={PLOT_BOTTOM}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={tick.screenX}
                    y={PLOT_BOTTOM + 20}
                    textAnchor="middle"
                    className="text-[11px] fill-slate-500 font-medium tabular-nums"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* --- Axis Lines --- */}
            {/* Left Y Axis */}
            <line
              x1={PADDING.left}
              y1={PADDING.top}
              x2={PADDING.left}
              y2={PLOT_BOTTOM}
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Bottom X Axis */}
            <line
              x1={PADDING.left}
              y1={PLOT_BOTTOM}
              x2={SVG_WIDTH - PADDING.right}
              y2={PLOT_BOTTOM}
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />

            {/* --- Axis Titles & Optimization Direction Annotations --- */}
            {/* Y Axis Title */}
            <g
              transform={`translate(${PADDING.left - 48}, ${
                PADDING.top + PLOT_HEIGHT / 2
              }) rotate(-90)`}
            >
              <text
                textAnchor="middle"
                className="text-[12px] font-semibold fill-slate-700 tracking-wide"
              >
                {getMetricLabel(yMetric)} ({getMetricUnit(yMetric)}){" "}
                <tspan className="fill-[#0047FF] font-medium">
                  {yIsHigherBetter ? "▲ Higher is better" : "▼ Lower is better"}
                </tspan>
              </text>
            </g>

            {/* X Axis Title */}
            <text
              x={PADDING.left + PLOT_WIDTH / 2}
              y={PLOT_BOTTOM + 45}
              textAnchor="middle"
              className="text-[12px] font-semibold fill-slate-700 tracking-wide"
            >
              {getMetricLabel(xMetric)} ({getMetricUnit(xMetric)}){" "}
              <tspan className="fill-slate-400 font-normal">
                {scaleType === "log" ? "— Logarithmic Scale " : "— Linear Scale "}
              </tspan>
              <tspan className="fill-[#0047FF] font-medium">
                {xIsHigherBetter ? "► Higher is better" : "◄ Lower is better"}
              </tspan>
            </text>

            {/* ========================================================
                4. DATA RENDER LAYER (Inside Plot Area Clip)
            ======================================================== */}
            <g clipPath="url(#plotAreaClip)">
              {/* Pareto Frontier Envelope (Subtle Electric Blue Gradient Fill) */}
              {frontierAreaPath && (
                <path
                  d={frontierAreaPath}
                  fill="url(#paretoAreaGradient)"
                  className="transition-all duration-300 pointer-events-none"
                />
              )}

              {/* Pareto Frontier Connected Curve */}
              {frontierLinePath && (
                <path
                  d={frontierLinePath}
                  fill="none"
                  stroke="#0047FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#frontierGlow)"
                  className="transition-all duration-300 pointer-events-none"
                />
              )}

              {/* Subtle Dashed Target Guideline between Frontier Points */}
              {frontierScreenPoints.map((pt, idx) => {
                if (idx === 0) return null;
                return null;
              })}

              {/* Render Dominated Model Points (Standard layer) */}
              {pointsWithScreenCoords
                .filter(
                  (pt) =>
                    !pt.isParetoFrontier &&
                    pt.model.id !== selectedModelId &&
                    pt.model.id !== hoveredModel?.id
                )
                .map((pt) => {
                  const creatorColor = getCreatorColor(pt.model.creator);
                  return (
                    <g
                      key={`model-${pt.model.id}`}
                      className="cursor-pointer transition-transform duration-100 hover:scale-125"
                      onClick={() => onSelectModel?.(pt.model)}
                      onMouseEnter={() => handlePointMouseEnter(pt)}
                      onMouseLeave={handlePointMouseLeave}
                    >
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={5.5}
                        fill={creatorColor}
                        fillOpacity="0.88"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        filter="url(#pointShadow)"
                      />
                    </g>
                  );
                })}

              {/* Render Pareto Frontier Points (Frontier layer) */}
              {frontierScreenPoints
                .filter((pt) => pt.model.id !== selectedModelId && pt.model.id !== hoveredModel?.id)
                .map((pt) => {
                  const creatorColor = getCreatorColor(pt.model.creator);
                  const isKnee = kneePoint?.model.id === pt.model.id;

                  return (
                    <g
                      key={`frontier-${pt.model.id}`}
                      className="cursor-pointer transition-transform duration-150 hover:scale-125"
                      onClick={() => onSelectModel?.(pt.model)}
                      onMouseEnter={() => handlePointMouseEnter(pt)}
                      onMouseLeave={handlePointMouseLeave}
                    >
                      {/* Outer Electric Blue Frontier Ring */}
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={8.5}
                        fill="none"
                        stroke="#0047FF"
                        strokeWidth="1.8"
                        strokeOpacity="0.8"
                      />
                      {/* Inner Dot with Creator Color */}
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={5.5}
                        fill={creatorColor}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        filter="url(#pointShadow)"
                      />
                      {/* If Knee Point, special diamond / ring marker */}
                      {isKnee && (
                        <circle
                          cx={pt.screenX}
                          cy={pt.screenY}
                          r={12}
                          fill="none"
                          stroke="#0047FF"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}
                    </g>
                  );
                })}

              {/* Render Selected Model Point (Elevated Layer with Pulsing Rings) */}
              {pointsWithScreenCoords
                .filter((pt) => pt.model.id === selectedModelId)
                .map((pt) => {
                  const creatorColor = getCreatorColor(pt.model.creator);
                  return (
                    <g
                      key={`selected-${pt.model.id}`}
                      className="cursor-pointer"
                      onClick={() => onSelectModel?.(pt.model)}
                      onMouseEnter={() => handlePointMouseEnter(pt)}
                      onMouseLeave={handlePointMouseLeave}
                    >
                      {/* Outer Animated Pulsing Halo */}
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={18}
                        fill="#0047FF"
                        fillOpacity="0.12"
                      />
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={13}
                        fill="none"
                        stroke="#0047FF"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      {/* Core Dot */}
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={8}
                        fill={creatorColor}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        filter="url(#selectedGlow)"
                      />
                    </g>
                  );
                })}

              {/* Render Hovered Model Point (Topmost interactive focus) */}
              {pointsWithScreenCoords
                .filter((pt) => pt.model.id === hoveredModel?.id && pt.model.id !== selectedModelId)
                .map((pt) => {
                  const creatorColor = getCreatorColor(pt.model.creator);
                  return (
                    <g
                      key={`hovered-${pt.model.id}`}
                      className="cursor-pointer"
                      onClick={() => onSelectModel?.(pt.model)}
                    >
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={14}
                        fill="#0047FF"
                        fillOpacity="0.15"
                      />
                      <circle
                        cx={pt.screenX}
                        cy={pt.screenY}
                        r={8.5}
                        fill={creatorColor}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        filter="url(#pointShadow)"
                      />
                    </g>
                  );
                })}

              {/* --- Model Labels Layer --- */}
              {pointsWithScreenCoords.map((pt) => {
                const isSelected = pt.model.id === selectedModelId;
                const isHovered = pt.model.id === hoveredModel?.id;
                const isFrontier = pt.isParetoFrontier;

                const shouldShowLabel =
                  labelsMode === "all" ||
                  (labelsMode === "frontier" && isFrontier) ||
                  isSelected ||
                  isHovered;

                if (!shouldShowLabel) return null;

                // Position label slightly above or below the dot
                const labelY = pt.screenY - 11;

                return (
                  <text
                    key={`label-${pt.model.id}`}
                    x={pt.screenX}
                    y={labelY}
                    textAnchor="middle"
                    className={`text-[10px] pointer-events-none font-medium transition-all ${
                      isSelected
                        ? "fill-[#0047FF] font-bold text-[11px]"
                        : isHovered
                          ? "fill-slate-900 font-semibold"
                          : isFrontier
                            ? "fill-slate-800 font-semibold"
                            : "fill-slate-500 font-normal"
                    }`}
                  >
                    {pt.model.name.replace(/\(Thinking\)|\(Reasoning\)/i, "").trim()}
                  </text>
                );
              })}

              {/* Sweet Spot Floating SVG Tag */}
              {kneePoint &&
                (() => {
                  const kneeScreen = pointsWithScreenCoords.find(
                    (p) => p.model.id === kneePoint.model.id
                  );
                  if (!kneeScreen) return null;

                  return (
                    <g
                      transform={`translate(${kneeScreen.screenX}, ${kneeScreen.screenY - 26})`}
                      className="pointer-events-none"
                    >
                      <rect
                        x={-44}
                        y={-9}
                        width={88}
                        height={18}
                        rx={9}
                        fill="#0047FF"
                        className="shadow-sm"
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        className="text-[9px] font-bold tracking-wider"
                      >
                        ★ SWEET SPOT
                      </text>
                    </g>
                  );
                })()}
            </g>
          </svg>
        )}

        {/* ========================================================
            5. INTERACTIVE HOVER TOOLTIP CARD (Overlay)
        ======================================================== */}
        {hoveredModel && tooltipPos && (
          <div
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            style={{
              position: "absolute",
              left: `${(tooltipPos.x / SVG_WIDTH) * 100}%`,
              top: `${(tooltipPos.y / SVG_HEIGHT) * 100}%`,
              transform: `translate(${
                tooltipPos.x > SVG_WIDTH * 0.58 ? "-105%" : "15%"
              }, ${tooltipPos.y > SVG_HEIGHT * 0.65 ? "-85%" : "-20%"})`,
            }}
            className="z-30 w-72 p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl text-xs pointer-events-auto transition-all animate-in fade-in duration-150"
          >
            {/* Header: Creator Logo + Name + Release Date */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <CreatorLogo creator={hoveredModel.creator} size={16} />
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{hoveredModel.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    {hoveredModel.creatorDisplayName} • {hoveredModel.releaseDate}
                  </p>
                </div>
              </div>

              {/* Pareto Optimal Pill */}
              {paretoResult.optimalModels.some((m) => m.id === hoveredModel.id) && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0047FF] border border-blue-200 shrink-0 uppercase tracking-wider">
                  <Sparkles size={9} />
                  Pareto
                </span>
              )}
            </div>

            {/* Badges Row (Weights & Reasoning) */}
            <div className="flex items-center gap-1.5 py-2">
              <WeightsBadge weightsType={hoveredModel.weightsType} size="xs" />
              <ReasoningBadge
                reasoningType={hoveredModel.reasoningType}
                isReasoningModel={hoveredModel.isReasoningModel}
                size="xs"
                hideIfStandard
              />
            </div>

            {/* Primary Metrics Grid (Active Y & Active X) */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 my-1">
              <div>
                <span className="text-[10px] font-medium text-slate-400 block truncate">
                  {getMetricLabel(yMetric)}
                </span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatMetricValue(getMetricValue(hoveredModel, yMetric), yMetric)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 block truncate">
                  {getMetricLabel(xMetric)}
                </span>
                <span className="text-sm font-bold text-[#0047FF] tabular-nums">
                  {formatMetricValue(getMetricValue(hoveredModel, xMetric), xMetric)}
                </span>
              </div>
            </div>

            {/* Secondary Technical Specs */}
            <div className="space-y-1 py-1.5 text-[11px] text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Context Window:</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {formatMetricValue(hoveredModel.contextWindowTokens, "contextWindow")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Generation Speed:</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {formatMetricValue(
                    hoveredModel.performance?.outputSpeedTokensPerSec?.median ?? 0,
                    "speed"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">TTFT Latency:</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {formatMetricValue(hoveredModel.performance?.ttftSeconds?.median ?? 0, "latency")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Blended Price:</span>
                <span className="font-semibold text-emerald-700 tabular-nums">
                  {formatMetricValue(hoveredModel.pricing?.blendedPricePer1M ?? 0, "price")}
                </span>
              </div>
            </div>

            {/* Action Buttons: Inspect & Compare */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={() => onSelectModel?.(hoveredModel)}
                className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-[#0047FF] hover:bg-[#2966FF] text-white font-medium text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Eye size={12} />
                <span>Inspect Model</span>
              </button>

              {onCompareModel && (
                <button
                  type="button"
                  onClick={() => onCompareModel(hoveredModel)}
                  title="Add to model comparison"
                  className="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <GitCompare size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          6. FOOTER INSIGHTS & METHODOLOGY NOTE
      ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Info size={13} className="text-[#0047FF] shrink-0" />
          <span>
            <strong>Pareto Frontier Line:</strong> Models situated directly on the Electric Blue
            frontier represent mathematically non-dominated optimal trade-offs.
          </span>
        </div>

        {selectedModelId && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Selected Model:</span>
            <span className="font-semibold text-slate-900">
              {models.find((m) => m.id === selectedModelId)?.name || selectedModelId}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenchmarkScatterPlot;
