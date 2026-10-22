import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  X,
  Sparkles,
  Zap,
  Clock,
  Coins,
  ShieldCheck,
  Check,
  Trophy,
  ChevronDown,
  Search,
  ExternalLink,
  Cpu,
  Eye,
  EyeOff,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { AIModelBenchmark, CreatorId } from "../types";
import { CreatorLogo, getCreatorName, getCreatorColor } from "../ui/CreatorLogo";

export interface ModelComparatorProps {
  models: AIModelBenchmark[];
  initialModelIds?: string[];
  onSelectModel?: (model: AIModelBenchmark) => void;
}

// Colors for up to 5 comparison slots
const SLOT_LABELS = ["A", "B", "C", "D", "E"] as const;
type SlotKey = (typeof SLOT_LABELS)[number];

const SLOT_CONFIGS: Record<
  SlotKey,
  {
    slot: SlotKey;
    label: string;
    strokeColor: string;
    fillColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accentBorder: string;
    dotClass: string;
  }
> = {
  A: {
    slot: "A",
    label: "Model A",
    strokeColor: "#0047FF",
    fillColor: "rgba(0,71,255,0.18)",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-transparent",
    accentBorder: "border-transparent",
    dotClass: "bg-slate-400",
  },
  B: {
    slot: "B",
    label: "Model B",
    strokeColor: "#10B981",
    fillColor: "rgba(16,185,129,0.18)",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-transparent",
    accentBorder: "border-transparent",
    dotClass: "bg-slate-400",
  },
  C: {
    slot: "C",
    label: "Model C",
    strokeColor: "#F59E0B",
    fillColor: "rgba(245,158,11,0.18)",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-transparent",
    accentBorder: "border-transparent",
    dotClass: "bg-slate-400",
  },
  D: {
    slot: "D",
    label: "Model D",
    strokeColor: "#8B5CF6",
    fillColor: "rgba(139,92,246,0.18)",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-transparent",
    accentBorder: "border-transparent",
    dotClass: "bg-slate-400",
  },
  E: {
    slot: "E",
    label: "Model E",
    strokeColor: "#EC4899",
    fillColor: "rgba(236,72,153,0.18)",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-transparent",
    accentBorder: "border-transparent",
    dotClass: "bg-slate-400",
  },
};

const SLOT_CONFIG_LIST = Object.values(SLOT_CONFIGS);

// 6 Radar dimensions definition
interface RadarDimension {
  id: string;
  name: string;
  shortLabel: string;
  metricLabel: string;
  calculateScore: (model: AIModelBenchmark) => number; // 0 to 100
  formatRawValue: (model: AIModelBenchmark) => string;
}

const RADAR_DIMENSIONS: RadarDimension[] = [
  {
    id: "reasoning",
    name: "Reasoning",
    shortLabel: "Reasoning",
    metricLabel: "GPQA & MMLU-Pro",
    calculateScore: (m) => {
      // Blend GPQA Diamond (70%) and MMLU-Pro (30%)
      const gpqa = m.quality.gpqaDiamond || 50;
      const mmlu = m.quality.mmluPro || 50;
      const raw = gpqa * 0.65 + mmlu * 0.35;
      return Math.min(100, Math.max(15, raw));
    },
    formatRawValue: (m) =>
      `GPQA: ${m.quality.gpqaDiamond.toFixed(1)}% | MMLU: ${m.quality.mmluPro.toFixed(1)}%`,
  },
  {
    id: "coding",
    name: "Coding",
    shortLabel: "Coding",
    metricLabel: "SWE-bench Verified",
    calculateScore: (m) => {
      // SWE-bench verified score (top models are ~70-75%, normalize to 100)
      const swe = m.quality.sweBenchVerified || 35;
      return Math.min(100, Math.max(15, (swe / 75) * 100));
    },
    formatRawValue: (m) => `${m.quality.sweBenchVerified.toFixed(1)}% SWE-bench`,
  },
  {
    id: "factuality",
    name: "Factuality",
    shortLabel: "Factuality",
    metricLabel: "Omniscience Accuracy",
    calculateScore: (m) => {
      const acc = m.quality.omniscienceAccuracy || 80;
      const nonHalluc = m.quality.omniscienceNonHallucination || 80;
      return Math.min(100, Math.max(20, (acc + nonHalluc) / 2));
    },
    formatRawValue: (m) => `${m.quality.omniscienceAccuracy.toFixed(1)}% accuracy`,
  },
  {
    id: "speed",
    name: "Output Speed",
    shortLabel: "Speed",
    metricLabel: "Tokens / Second",
    calculateScore: (m) => {
      // Normalize median tokens/sec (0 to 250 t/s -> 0 to 100)
      const tps = m.performance.outputSpeedTokensPerSec.median;
      return Math.min(100, Math.max(15, (tps / 220) * 100));
    },
    formatRawValue: (m) => `${Math.round(m.performance.outputSpeedTokensPerSec.median)} tok/s`,
  },
  {
    id: "latency",
    name: "Low Latency",
    shortLabel: "Latency",
    metricLabel: "Time to 1st Token (TTFT)",
    calculateScore: (m) => {
      // Lower TTFT is better: 0.25s -> 100, 2.5s -> 20
      const ttft = m.performance.ttftSeconds.median;
      const normalized = 100 - ((ttft - 0.25) / 2.25) * 80;
      return Math.min(100, Math.max(15, normalized));
    },
    formatRawValue: (m) => `${m.performance.ttftSeconds.median.toFixed(2)}s TTFT`,
  },
  {
    id: "costEfficiency",
    name: "Cost Efficiency",
    shortLabel: "Cost",
    metricLabel: "Blended Price / 1M",
    calculateScore: (m) => {
      // Lower blended price is better: $0.15 -> 100, $15.00 -> 15
      const price = m.pricing.blendedPricePer1M;
      if (price <= 0.15) return 100;
      // Logarithmic decay
      const logRatio = Math.log10(1 + price) / Math.log10(1 + 15);
      const score = 100 - logRatio * 85;
      return Math.min(100, Math.max(15, score));
    },
    formatRawValue: (m) => `$${m.pricing.blendedPricePer1M.toFixed(2)} / 1M`,
  },
];

/**
 * Format context window into human readable tokens (200K, 1M, etc.)
 */
function formatContextTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M tokens`;
  }
  return `${Math.round(tokens / 1_000)}K tokens`;
}

export const ModelComparator: React.FC<ModelComparatorProps> = ({
  models,
  initialModelIds,
  onSelectModel,
}) => {
  // Determine smart initial selections
  const defaultModelA = useMemo(() => {
    if (initialModelIds?.[0]) {
      const found = models.find((m) => m.id === initialModelIds[0]);
      if (found) return found;
    }
    // Default to Claude 3.7 Sonnet or highest intelligence model
    return (
      models.find((m) => m.id === "claude-3-7-sonnet-thinking") ||
      models.find((m) => m.id === "claude-3-7-sonnet") ||
      models[0]
    );
  }, [models, initialModelIds]);

  const defaultModelB = useMemo(() => {
    if (initialModelIds?.[1]) {
      const found = models.find((m) => m.id === initialModelIds[1]);
      if (found) return found;
    }
    // Default to GPT-4o or DeepSeek-R1
    return (
      models.find((m) => m.id === "gpt-4o") ||
      models.find((m) => m.id === "deepseek-r1") ||
      models[1] ||
      models[0]
    );
  }, [models, initialModelIds]);

  // Array-based model state: index 0 = Model A (left), index 1 = Model B (right), indices 2-4 = extras in between
  const [selectedModels, setSelectedModels] = useState<AIModelBenchmark[]>(() => {
    const list: AIModelBenchmark[] = [defaultModelA, defaultModelB];
    if (initialModelIds) {
      for (let i = 2; i < Math.min(initialModelIds.length, 5); i++) {
        const found = models.find((m) => m.id === initialModelIds[i]);
        if (found) list.push(found);
      }
    }
    return list;
  });

  // Synchronize when incoming initialModelIds changes dynamically
  useEffect(() => {
    if (!initialModelIds) return;
    setSelectedModels((prev) => {
      const next = [...prev];
      initialModelIds.slice(0, 5).forEach((id, i) => {
        const found = models.find((m) => m.id === id);
        if (found) next[i] = found;
      });
      return next;
    });
  }, [initialModelIds, models]);

  const MAX_MODELS = 5;
  const canAddModel = selectedModels.length < MAX_MODELS;

  // Remove a middle model (never A or B)
  const removeModel = (idx: number) => {
    setSelectedModels((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update model at index
  const updateModel = (idx: number, model: AIModelBenchmark) => {
    setSelectedModels((prev) => prev.map((m, i) => (i === idx ? model : m)));
  };

  const openReplacePicker = (originalIdx: number) => {
    setPickerTargetOriginalIdx(originalIdx);
    setPickerAddMode(false);
    setPickerSearchQuery("");
    setIsPickerOpen(true);
  };

  const openAddPicker = () => {
    setPickerTargetOriginalIdx(null);
    setPickerAddMode(true);
    setPickerSearchQuery("");
    setIsPickerOpen(true);
  };

  const closePicker = () => {
    setIsPickerOpen(false);
  };

  const handlePickerSelect = (m: AIModelBenchmark) => {
    if (pickerAddMode) {
      if (selectedModels.some((s) => s.id === m.id)) return;
      if (!canAddModel) return;
      setSelectedModels((prev) => [...prev, m]);
      setIsPickerOpen(false);
    } else if (pickerTargetOriginalIdx !== null) {
      updateModel(pickerTargetOriginalIdx, m);
      setIsPickerOpen(false);
    }
  };

  // Ordered display: A (0), extras (2..n-1), B (1)
  const displayModels = useMemo(() => {
    const [a, b, ...extras] = selectedModels;
    const ordered = [a, ...extras, b];
    return ordered.map((model, displayIdx) => {
      // Map back to original index for updates/removes
      const originalIdx =
        displayIdx === 0 ? 0 : displayIdx === ordered.length - 1 ? 1 : displayIdx + 1;
      // Slot label: A for first, B for last, C/D/E for middle
      const slotLabel =
        displayIdx === 0
          ? "A"
          : displayIdx === ordered.length - 1
            ? "B"
            : (SLOT_LABELS[displayIdx + 1] as SlotKey);
      return {
        model,
        slotLabel,
        originalIdx,
        config:
          SLOT_CONFIG_LIST[
            displayIdx === 0 ? 0 : displayIdx === ordered.length - 1 ? 1 : displayIdx + 1
          ] ?? SLOT_CONFIG_LIST[0],
      };
    });
  }, [selectedModels]);

  // Visibility toggle for radar chart layers
  const [visibleSlots, setVisibleSlots] = useState<Record<SlotKey, boolean>>({
    A: true,
    B: true,
    C: true,
    D: true,
    E: true,
  });

  // Active hovered dimension on radar chart
  const [hoveredDimension, setHoveredDimension] = useState<RadarDimension | null>(null);

  // Model Picker Modal states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTargetOriginalIdx, setPickerTargetOriginalIdx] = useState<number | null>(null);
  const [pickerAddMode, setPickerAddMode] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const [pickerSort, setPickerSort] = useState<"index" | "price" | "speed">("index");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Legacy compat: keep activeModels for chart sections below
  const activeModels = useMemo(() => {
    return selectedModels.map((model, i) => ({
      slot: SLOT_LABELS[i] as SlotKey,
      model,
      config: SLOT_CONFIG_LIST[i] ?? SLOT_CONFIG_LIST[0],
    }));
  }, [selectedModels]);

  // Legacy compat for calculateWinner
  const modelA = selectedModels[0];
  const modelB = selectedModels[1];
  const modelC = selectedModels[2] ?? null;

  // ==========================================================
  // RADAR CHART MATH & GEOMETRY
  // ==========================================================
  const RADAR_RADIUS = 160;
  const RADAR_CENTER = 230; // 460x460 canvas center
  const NUM_AXES = RADAR_DIMENSIONS.length; // 6 axes

  // Calculate polygon points string for a given model
  const getRadarPolygonPoints = (model: AIModelBenchmark): string => {
    return RADAR_DIMENSIONS.map((dim, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / NUM_AXES;
      const score = dim.calculateScore(model);
      const r = (score / 100) * RADAR_RADIUS;
      const x = RADAR_CENTER + r * Math.cos(angle);
      const y = RADAR_CENTER + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  // Filtered + sorted models for picker modal
  const filteredPickerModels = useMemo(() => {
    const q = pickerSearchQuery.trim().toLowerCase();
    const list = q
      ? models.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.creatorDisplayName.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q)
        )
      : [...models];
    if (pickerSort === "index")
      list.sort((a, b) => b.quality.intelligenceIndex - a.quality.intelligenceIndex);
    else if (pickerSort === "price")
      list.sort((a, b) => a.pricing.blendedPricePer1M - b.pricing.blendedPricePer1M);
    else if (pickerSort === "speed")
      list.sort(
        (a, b) =>
          b.performance.outputSpeedTokensPerSec.median -
          a.performance.outputSpeedTokensPerSec.median
      );
    return list;
  }, [models, pickerSearchQuery, pickerSort]);

  // Winner comparison calculation helper
  const calculateWinner = (
    valA: number,
    valB: number,
    valC: number | undefined,
    direction: "higher" | "lower"
  ) => {
    const values = [
      { slot: "A", val: valA },
      { slot: "B", val: valB },
    ];
    if (valC !== undefined) {
      values.push({ slot: "C", val: valC });
    }

    if (direction === "higher") {
      values.sort((a, b) => b.val - a.val);
    } else {
      values.sort((a, b) => a.val - b.val);
    }

    const winner = values[0];
    const runnerUp = values[1];

    let deltaLabel = "";
    if (runnerUp.val !== 0) {
      if (direction === "higher") {
        const pct = ((winner.val - runnerUp.val) / runnerUp.val) * 100;
        deltaLabel = `+${pct.toFixed(1)}%`;
      } else {
        const pct = ((runnerUp.val - winner.val) / runnerUp.val) * 100;
        deltaLabel = `-${pct.toFixed(1)}%`;
      }
    }

    return {
      winnerSlot: winner.slot,
      winnerVal: winner.val,
      deltaLabel,
      isTie: Math.abs(winner.val - runnerUp.val) < 0.001,
    };
  };

  return (
    <div className="w-full bg-white flex flex-col font-sans select-none">
      {/* ========================================================
          1. MODEL SELECTION DOCK (senior UIUX redesign)
          ======================================================== */}
      <div className="w-full px-6 pt-8 pb-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="ml-[22%]">
              <h2 className="text-[25.68px] font-extrabold text-slate-900 tracking-tight leading-none">
                Model Comparator
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {selectedModels.length > 2 && (
                <button
                  type="button"
                  onClick={() => setSelectedModels((prev) => prev.slice(0, 2))}
                  className="h-8 px-3 rounded-none bg-transparent hover:bg-slate-100/60 text-slate-700 hover:text-slate-900 text-[10.9px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-transparent"
                  title="Keep only the first two models"
                >
                  <X size={12} />
                  <span>Clear extras</span>
                </button>
              )}
              {canAddModel && (
                <button
                  type="button"
                  onClick={openAddPicker}
                  className="h-9 px-4 rounded-none bg-[#0047FF] hover:bg-[#0039CC] text-white text-[11.5px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#0047FF]/20"
                >
                  <Plus size={14} />
                  <span>Add model</span>
                </button>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[12px] text-slate-700 font-semibold whitespace-nowrap">
              Select up to {MAX_MODELS} models to compare side-by-side
            </p>
          </div>

          {/* Primary models: perfectly centered equal halves */}
          <div
            className="grid gap-5 max-w-4xl mx-auto mt-[5%]"
            style={{ gridTemplateColumns: `repeat(${selectedModels.length}, minmax(0, 1fr))` }}
          >
            {displayModels.map(({ model, slotLabel, originalIdx, config }) => {
              const isEdge = originalIdx === 0 || originalIdx === 1;
              return (
                <div
                  key={`${slotLabel}-${model.id}`}
                  className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-transparent border border-transparent transition-all hover:bg-slate-50/60 aspect-square"
                >
                  <CreatorLogo creator={model.creator} size={48} />
                  <ChevronDown
                    size={14}
                    strokeWidth={3}
                    className="absolute top-2 right-2 text-slate-300 group-hover:text-slate-500 transition-colors"
                  />

                  <button
                    type="button"
                    onClick={() => openReplacePicker(originalIdx)}
                    className="w-full text-center cursor-pointer relative"
                    title="Click to change model"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-[#0047FF] transition-colors text-[15px] leading-tight">
                      {model.name}
                    </div>
                    <div className="text-[10.5px] text-slate-400 flex flex-col items-center gap-0.5 mt-2 tabular-nums">
                      <span className="font-semibold text-slate-500">
                        Idx {model.quality.intelligenceIndex.toFixed(1)}
                      </span>
                      <span>${model.pricing.blendedPricePer1M.toFixed(2)}/1M</span>
                      <span>
                        {Math.round(model.performance.outputSpeedTokensPerSec.median)} t/s
                      </span>
                    </div>
                  </button>

                  {!isEdge && (
                    <button
                      type="button"
                      onClick={() => removeModel(originalIdx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Remove this model"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {canAddModel && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openAddPicker}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-none bg-transparent hover:bg-slate-50/60 text-slate-500 hover:text-[#0047FF] text-[11px] font-semibold transition-all cursor-pointer border border-transparent"
              >
                <Plus size={14} />
                <span>Add a model</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Model Picker Modal */}
      {isPickerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={closePicker}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-[75vw] h-[75vw] max-w-[85vh] max-h-[85vh] rounded-3xl border border-transparent bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="relative px-5 py-4 border-b border-transparent text-center">
                <h3 className="text-[16px] font-extrabold text-slate-900">
                  {pickerAddMode ? "Add a model to compare" : "Change model"}
                </h3>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  {pickerAddMode
                    ? `Select an unused model (${selectedModels.length}/${MAX_MODELS} used)`
                    : "Pick a replacement for the selected slot"}
                </p>
                <button
                  type="button"
                  onClick={closePicker}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search + sort */}
              <div className="px-5 py-3 border-b border-transparent space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSortOpen((v) => !v)}
                      className="h-10 px-3 text-[10.5px] font-extrabold rounded-none border border-transparent bg-white cursor-pointer outline-none flex items-center justify-center gap-1.5"
                    >
                      {pickerSort === "index"
                        ? "Intelligence"
                        : pickerSort === "price"
                          ? "Price"
                          : "Speed"}
                      <ChevronDown size={12} strokeWidth={3} />
                    </button>
                    {isSortOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[61]"
                          onClick={() => setIsSortOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1 z-[62] min-w-[110px] rounded-none border border-transparent bg-white shadow-lg overflow-hidden">
                          {(["index", "price", "speed"] as const).map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setPickerSort(key);
                                setIsSortOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-[10.5px] font-extrabold cursor-pointer transition-none ${
                                pickerSort === key
                                  ? "bg-slate-100 text-slate-900"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {key === "index"
                                ? "Intelligence"
                                : key === "price"
                                  ? "Price"
                                  : "Speed"}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={pickerSearchQuery}
                      onChange={(e) => setPickerSearchQuery(e.target.value)}
                      placeholder="Search by name, creator, or id…"
                      autoFocus
                      className="w-full h-10 pl-9 pr-3 text-[12px] rounded-none border border-transparent bg-white focus:bg-white focus:border-transparent focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                    {filteredPickerModels.length} models
                  </span>
                </div>
              </div>

              {/* Model list */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredPickerModels.map((m) => {
                    const isSelected = selectedModels.some((s) => s.id === m.id);
                    const disabled = pickerAddMode && (isSelected || !canAddModel);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={disabled && !isSelected}
                        onClick={() => {
                          if (pickerAddMode && isSelected) return;
                          handlePickerSelect(m);
                        }}
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-2xl text-[10px] transition-all cursor-pointer aspect-square max-w-[50%] mx-auto ${
                          isSelected
                            ? "bg-slate-100 border border-transparent"
                            : "hover:bg-slate-50 border border-transparent"
                        } ${disabled && !isSelected ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <CreatorLogo creator={m.creator} size={16} />
                        <div className="w-full text-center min-w-0">
                          <div className="font-semibold text-slate-900 truncate text-[11px]">
                            {m.name}
                          </div>
                          <div className="text-[8.5px] text-slate-400 truncate">
                            {m.creatorDisplayName}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 tabular-nums text-[9px]">
                          <div className="font-bold text-slate-900">
                            {m.quality.intelligenceIndex.toFixed(1)}{" "}
                            <span className="text-slate-400 font-normal">Idx</span>
                          </div>
                          <div className="font-semibold text-slate-700">
                            ${m.pricing.blendedPricePer1M.toFixed(2)}{" "}
                            <span className="text-slate-400 font-normal">/1M</span>
                          </div>
                          <div className="font-semibold text-slate-700">
                            {Math.round(m.performance.outputSpeedTokensPerSec.median)}{" "}
                            <span className="text-slate-400 font-normal">t/s</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                            <Check size={11} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredPickerModels.length === 0 && (
                    <div className="py-12 text-center text-[11px] text-slate-400">
                      No models match your search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Radar section removed */}
      {/* ========================================================
          3. SIDE-BY-SIDE SPEC & PERFORMANCE COMPARISON MATRIX
          ======================================================== */}
      <div className="w-full p-6 max-w-[1800px] mx-auto space-y-12">
        <div className="text-center">
          <h3 className="text-[14.6px] font-bold text-slate-900 text-[14.4px] tracking-tight">
            Detailed Benchmark & Specification Matrix
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Side-by-side comparison with automated winner detection and percentage deltas.
          </p>
        </div>

        {/* Matrix Container */}
        <div
          className="rounded-2xl border border-transparent bg-white overflow-hidden shadow-xs"
          style={{ "--cols": activeModels.length + 1 } as React.CSSProperties}
        >
          {/* Table Header: Models & Slots */}
          <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] bg-transparent border-b border-transparent text-[12px] font-bold text-slate-800 p-3.5">
            <div className={`text-slate-500 uppercase tracking-wider text-[13px] font-bold`}>
              Benchmark
            </div>

            {activeModels.map(({ slot, model, config }) => (
              <div key={slot} className="flex items-center justify-center gap-2">
                <span
                  className="truncate px-2 py-1 rounded text-white text-[11px] font-bold"
                  style={{ backgroundColor: getCreatorColor(model.creator) }}
                >
                  {model.name}
                </span>
              </div>
            ))}
          </div>

          {/* ====================================================
              GROUP 1: INTELLIGENCE & QUALITY BENCHMARKS
              ==================================================== */}
          <div className="border-b border-transparent">
            <div className="px-4 py-2 bg-transparent text-[11px] font-bold text-slate-900 text-[14.4px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span></span>
            </div>

            {/* Row: Artificial Analysis Intelligence Index */}
            {(() => {
              const res = calculateWinner(
                modelA.quality.intelligenceIndex,
                modelB.quality.intelligenceIndex,
                modelC?.quality.intelligenceIndex,
                "higher"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-900 text-[14.4px]`}>
                    Intelligence Index
                    <div className="text-[10px] text-slate-400 font-normal">
                      Artificial Analysis composite (0-100)
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold text-[14px] ${
                          isWinner ? "text-slate-900" : "text-slate-800"
                        }`}
                      >
                        <span>{model.quality.intelligenceIndex.toFixed(1)}</span>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-slate-900 border border-transparent">
                            <Trophy size={10} />
                            <span>{res.deltaLabel}</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: MMLU-Pro */}
            {(() => {
              const res = calculateWinner(
                modelA.quality.mmluPro,
                modelB.quality.mmluPro,
                modelC?.quality.mmluPro,
                "higher"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-700 text-[14.4px]`}>
                    MMLU-Pro
                    <div className="text-[10px] text-slate-400 font-normal">
                      Multi-task reasoning accuracy (%)
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>{model.quality.mmluPro.toFixed(1)}%</span>
                        {isWinner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            {res.deltaLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: GPQA Diamond */}
            {(() => {
              const res = calculateWinner(
                modelA.quality.gpqaDiamond,
                modelB.quality.gpqaDiamond,
                modelC?.quality.gpqaDiamond,
                "higher"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-700 text-[14.4px]`}>
                    GPQA Diamond
                    <div className="text-[10px] text-slate-400 font-normal">
                      Graduate-level QA without web (%)
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>{model.quality.gpqaDiamond.toFixed(1)}%</span>
                        {isWinner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            {res.deltaLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: SWE-bench Verified */}
            {(() => {
              const res = calculateWinner(
                modelA.quality.sweBenchVerified,
                modelB.quality.sweBenchVerified,
                modelC?.quality.sweBenchVerified,
                "higher"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-700 text-[14.4px]`}>
                    SWE-bench Verified
                    <div className="text-[10px] text-slate-400 font-normal">
                      Real-world coding issues resolve (%)
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>{model.quality.sweBenchVerified.toFixed(1)}%</span>
                        {isWinner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            {res.deltaLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: MATH-500 */}
            {(() => {
              const res = calculateWinner(
                modelA.quality.math500,
                modelB.quality.math500,
                modelC?.quality.math500,
                "higher"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-700 text-[14.4px]`}>
                    MATH-500
                    <div className="text-[10px] text-slate-400 font-normal">
                      Competition mathematics accuracy (%)
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>{model.quality.math500.toFixed(1)}%</span>
                        {isWinner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            {res.deltaLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        <div
          className="rounded-2xl border border-transparent bg-white overflow-hidden shadow-xs"
          style={{ "--cols": activeModels.length + 1 } as React.CSSProperties}
        >
          {/* Table Header: Models & Slots */}
          <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] bg-transparent border-b border-transparent text-[12px] font-bold text-slate-800 p-3.5">
            <div className={`text-slate-500 uppercase tracking-wider text-[13px] font-bold`}>
              Benchmark
            </div>

            {activeModels.map(({ slot, model, config }) => (
              <div key={slot} className="flex items-center justify-center gap-2">
                <span
                  className="truncate px-2 py-1 rounded text-white text-[11px] font-bold"
                  style={{ backgroundColor: getCreatorColor(model.creator) }}
                >
                  {model.name}
                </span>
              </div>
            ))}
          </div>
          {/* ====================================================
              GROUP 2: SPEED & LATENCY BENCHMARKS
              ==================================================== */}
          <div className="border-b border-transparent">
            <div className="px-4 py-2 bg-transparent text-[11px] font-bold text-slate-900 text-[14.4px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>Throughput & Latency Performance</span>
            </div>

            {/* Row: Output Speed (Median) */}
            {(() => {
              const res = calculateWinner(
                modelA.performance.outputSpeedTokensPerSec.median,
                modelB.performance.outputSpeedTokensPerSec.median,
                modelC?.performance.outputSpeedTokensPerSec.median,
                "higher"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-900 text-[14.4px]`}>
                    Output Speed (Median)
                    <div className="text-[10px] text-slate-400 font-normal">
                      Tokens generated per second
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold text-[14px] ${
                          isWinner ? "text-slate-900" : "text-slate-800"
                        }`}
                      >
                        <span>
                          {Math.round(model.performance.outputSpeedTokensPerSec.median)} t/s
                        </span>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            <Zap size={10} />
                            <span>{res.deltaLabel}</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: TTFT Latency (seconds) */}
            {(() => {
              const res = calculateWinner(
                modelA.performance.ttftSeconds.median,
                modelB.performance.ttftSeconds.median,
                modelC?.performance.ttftSeconds.median,
                "lower"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-900 text-[14.4px]`}>
                    Time to First Token (TTFT)
                    <div className="text-[10px] text-slate-400 font-normal">
                      Median streaming response latency
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold text-[14px] ${
                          isWinner ? "text-slate-900" : "text-slate-800"
                        }`}
                      >
                        <span>{model.performance.ttftSeconds.median.toFixed(2)}s</span>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            <Clock size={10} />
                            <span>{res.deltaLabel}</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: 500-Token End-to-End Latency */}
            {(() => {
              const res = calculateWinner(
                modelA.performance.endToEnd500TokensSec,
                modelB.performance.endToEnd500TokensSec,
                modelC?.performance.endToEnd500TokensSec,
                "lower"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-700 text-[14.4px]`}>
                    500-Token Completion
                    <div className="text-[10px] text-slate-400 font-normal">
                      End-to-end duration for 500 tokens
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>{model.performance.endToEnd500TokensSec.toFixed(2)}s</span>
                        {isWinner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            {res.deltaLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        <div
          className="rounded-2xl border border-transparent bg-white overflow-hidden shadow-xs"
          style={{ "--cols": activeModels.length + 1 } as React.CSSProperties}
        >
          {/* Table Header: Models & Slots */}
          <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] bg-transparent border-b border-transparent text-[12px] font-bold text-slate-800 p-3.5">
            <div className={`text-slate-500 uppercase tracking-wider text-[13px] font-bold`}>
              Benchmark
            </div>

            {activeModels.map(({ slot, model, config }) => (
              <div key={slot} className="flex items-center justify-center gap-2">
                <span
                  className="truncate px-2 py-1 rounded text-white text-[11px] font-bold"
                  style={{ backgroundColor: getCreatorColor(model.creator) }}
                >
                  {model.name}
                </span>
              </div>
            ))}
          </div>
          {/* ====================================================
              GROUP 3: PRICING & TOKEN ECONOMICS
              ==================================================== */}
          <div className="border-b border-transparent">
            <div className="px-4 py-2 bg-transparent text-[11px] font-bold text-slate-900 text-[14.4px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>Token Pricing & Economics</span>
            </div>

            {/* Row: Blended Price per 1M */}
            {(() => {
              const res = calculateWinner(
                modelA.pricing.blendedPricePer1M,
                modelB.pricing.blendedPricePer1M,
                modelC?.pricing.blendedPricePer1M,
                "lower"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-900 text-[14.4px]`}>
                    Blended Price / 1M
                    <div className="text-[10px] text-slate-400 font-normal">
                      Standard 3:1 input/output token ratio
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold text-[14px] ${
                          isWinner ? "text-slate-900" : "text-slate-800"
                        }`}
                      >
                        <span>${model.pricing.blendedPricePer1M.toFixed(2)}</span>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-slate-900 border border-transparent">
                            <span>{res.deltaLabel} cheaper</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: Input Token Price */}
            {(() => {
              const res = calculateWinner(
                modelA.pricing.inputPricePer1M,
                modelB.pricing.inputPricePer1M,
                modelC?.pricing.inputPricePer1M,
                "lower"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-700 text-[14.4px]`}>
                    Input Price / 1M
                    <div className="text-[10px] text-slate-400 font-normal">
                      Prompt token execution cost
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>${model.pricing.inputPricePer1M.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: Output Token Price */}
            {(() => {
              const res = calculateWinner(
                modelA.pricing.outputPricePer1M,
                modelB.pricing.outputPricePer1M,
                modelC?.pricing.outputPricePer1M,
                "lower"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-700 text-[14.4px]`}>
                    Output Price / 1M
                    <div className="text-[10px] text-slate-400 font-normal">
                      Completion generation cost
                    </div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>${model.pricing.outputPricePer1M.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* ====================================================
              GROUP 4: ARCHITECTURE & TECHNICAL SPECIFICATIONS
              ==================================================== */}
          <div>
            <div className="px-4 py-2 bg-transparent text-[11px] font-bold text-slate-900 text-[14.4px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>Technical Specifications</span>
            </div>

            {/* Row: Context Window */}
            {(() => {
              const res = calculateWinner(
                modelA.contextWindowTokens,
                modelB.contextWindowTokens,
                modelC?.contextWindowTokens,
                "higher"
              );
              return (
                <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
                  <div className={`font-bold text-slate-900 text-[14.4px]`}>
                    Context Window
                    <div className="text-[10px] text-slate-400 font-normal">Max input capacity</div>
                  </div>
                  {activeModels.map(({ slot, model }) => {
                    const isWinner = res.winnerSlot === slot && !res.isTie;
                    return (
                      <div
                        key={slot}
                        className={` flex items-center justify-center gap-2 tabular-nums font-bold ${
                          isWinner ? "text-slate-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>{formatContextTokens(model.contextWindowTokens)}</span>
                        {isWinner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-slate-900 border border-transparent">
                            {res.deltaLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Row: License / Weights */}
            <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
              <div className={`font-bold text-slate-700 text-[14.4px]`}>
                License Model
                <div className="text-[10px] text-slate-400 font-normal">Weights distribution</div>
              </div>
              {activeModels.map(({ slot, model }) => (
                <div key={slot} className={` flex items-center justify-center gap-1.5`}>
                  {model.weightsType === "open-weights" ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-slate-900 border border-transparent">
                      Open Weights
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-transparent">
                      Proprietary
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Row: Parameters */}
            <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] border-b border-transparent hover:bg-slate-50/60 transition-colors items-center">
              <div className={`font-bold text-slate-700 text-[14.4px]`}>
                Parameters
                <div className="text-[10px] text-slate-400 font-normal">
                  Disclosed model weights
                </div>
              </div>
              {activeModels.map(({ slot, model }) => (
                <div
                  key={slot}
                  className={`flex items-center justify-center text-slate-700 font-medium tabular-nums`}
                >
                  {model.totalParametersB ? `${model.totalParametersB}B params` : "Undisclosed"}
                  {model.activeParametersB && (
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({model.activeParametersB}B active MoE)
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Row: Release Date */}
            <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] p-3 text-[12px] hover:bg-slate-50/60 transition-colors items-center">
              <div className={`font-bold text-slate-700 text-[14.4px]`}>
                Release Date
                <div className="text-[10px] text-slate-400 font-normal">Launch timeline</div>
              </div>
              {activeModels.map(({ slot, model }) => (
                <div
                  key={slot}
                  className={`flex items-center justify-center text-slate-700 font-medium tabular-nums`}
                >
                  {model.releaseDate}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
