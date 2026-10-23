import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Zap,
  Coins,
  Clock,
  Gauge,
  Sliders,
  Award,
  Flame,
  ArrowRight,
  TrendingDown,
  Check,
  Search,
  RotateCcw,
} from "lucide-react";
import type { AIModelBenchmark, WeightsType } from "../types";

export interface ModelRecommenderProps {
  models: AIModelBenchmark[];
  onSelectModel?: (model: AIModelBenchmark) => void;
  onCompareModel?: (model: AIModelBenchmark) => void;
}

// Preset Workload Ratios
type WorkloadRatioPreset = "standard" | "reading" | "generation" | "custom";

interface RatioConfig {
  id: WorkloadRatioPreset;
  label: string;
  description: string;
  inputPercent: number; // e.g. 75 for 3:1
  outputPercent: number; // e.g. 25
}

const RATIO_PRESETS: RatioConfig[] = [
  {
    id: "standard",
    label: "Standard 3:1",
    description: "75% Input, 25% Output (Chat, RAG, General Agents)",
    inputPercent: 75,
    outputPercent: 25,
  },
  {
    id: "reading",
    label: "Reading Heavy 10:1",
    description: "91% Input, 9% Output (Document QA, Summarization, Retrieval)",
    inputPercent: 91,
    outputPercent: 9,
  },
  {
    id: "generation",
    label: "Generation Heavy 1:3",
    description: "25% Input, 75% Output (Code Generation, Writing, Deep CoT)",
    inputPercent: 25,
    outputPercent: 75,
  },
];

// Enterprise Archetype Presets
interface ArchetypePreset {
  id: string;
  title: string;
  icon: string;
  weights: {
    quality: number;
    speed: number;
    cost: number;
    latency: number;
  };
}

const ARCHETYPES: ArchetypePreset[] = [
  {
    id: "balanced",
    title: "Balanced Generalist",
    icon: "🎯",
    weights: { quality: 75, speed: 50, cost: 60, latency: 40 },
  },
  {
    id: "reasoning",
    title: "Deep Reasoning & Coding",
    icon: "🧠",
    weights: { quality: 100, speed: 25, cost: 35, latency: 20 },
  },
  {
    id: "realtime",
    title: "Real-time Voice & Streaming",
    icon: "⚡",
    weights: { quality: 50, speed: 95, cost: 40, latency: 100 },
  },
  {
    id: "budget",
    title: "High-Volume / Budget",
    icon: "💰",
    weights: { quality: 45, speed: 40, cost: 100, latency: 30 },
  },
  {
    id: "enterprise",
    title: "Enterprise Agentic",
    icon: "🏢",
    weights: { quality: 90, speed: 60, cost: 50, latency: 60 },
  },
];

export const ModelRecommender: React.FC<ModelRecommenderProps> = ({
  models,
  onSelectModel,
  onCompareModel,
}) => {
  // Preference Sliders Weights (0 - 100)
  const [weightQuality, setWeightQuality] = useState<number>(75);
  const [weightSpeed, setWeightSpeed] = useState<number>(50);
  const [weightCost, setWeightCost] = useState<number>(60);
  const [weightLatency, setWeightLatency] = useState<number>(40);

  // Workload Token Estimator Controls
  const [monthlyTokensMillions, setMonthlyTokensMillions] = useState<number>(20); // 20 Million tokens/month default
  const [selectedRatioPreset, setSelectedRatioPreset] = useState<WorkloadRatioPreset>("standard");
  const [customInputPercent, setCustomInputPercent] = useState<number>(75);

  // Filter & Search Controls
  const [filterWeights, setFilterWeights] = useState<"all" | WeightsType>("all");
  const [filterReasoning, setFilterReasoning] = useState<"all" | "reasoning" | "standard">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Input & Output token ratio fractions
  const { inputFraction, outputFraction } = useMemo(() => {
    if (selectedRatioPreset === "custom") {
      const inFrac = customInputPercent / 100;
      return { inputFraction: inFrac, outputFraction: 1 - inFrac };
    }
    const preset = RATIO_PRESETS.find((r) => r.id === selectedRatioPreset) ?? RATIO_PRESETS[0];
    return {
      inputFraction: preset.inputPercent / 100,
      outputFraction: preset.outputPercent / 100,
    };
  }, [selectedRatioPreset, customInputPercent]);

  // Total tokens in integer count
  const totalTokens = monthlyTokensMillions * 1_000_000;

  // Calculate estimated monthly workload cost for any model
  const calculateModelCost = (model: AIModelBenchmark): number => {
    const inputTokens = totalTokens * inputFraction;
    const outputTokens = totalTokens * outputFraction;
    const inputCost = (inputTokens / 1_000_000) * model.pricing.inputPricePer1M;
    const outputCost = (outputTokens / 1_000_000) * model.pricing.outputPricePer1M;
    return inputCost + outputCost;
  };

  // Find dynamic ranges for normalization across all models
  const modelRanges = useMemo(() => {
    if (models.length === 0) {
      return {
        minQuality: 0,
        maxQuality: 100,
        minSpeed: 1,
        maxSpeed: 500,
        minCost: 0.1,
        maxCost: 1000,
        minLatency: 0.1,
        maxLatency: 5,
      };
    }

    let minQuality = Infinity,
      maxQuality = -Infinity;
    let minSpeed = Infinity,
      maxSpeed = -Infinity;
    let minCost = Infinity,
      maxCost = -Infinity;
    let minLatency = Infinity,
      maxLatency = -Infinity;

    models.forEach((m) => {
      const q = m.quality.intelligenceIndex;
      const s = m.performance.outputSpeedTokensPerSec.median;
      const c = calculateModelCost(m);
      const l = m.performance.ttftSeconds.median;

      if (q < minQuality) minQuality = q;
      if (q > maxQuality) maxQuality = q;
      if (s < minSpeed) minSpeed = s;
      if (s > maxSpeed) maxSpeed = s;
      if (c < minCost) minCost = c;
      if (c > maxCost) maxCost = c;
      if (l < minLatency) minLatency = l;
      if (l > maxLatency) maxLatency = l;
    });

    return {
      minQuality,
      maxQuality,
      minSpeed,
      maxSpeed,
      minCost: Math.max(minCost, 0.01),
      maxCost: Math.max(maxCost, 0.1),
      minLatency: Math.max(minLatency, 0.05),
      maxLatency,
    };
  }, [models, totalTokens, inputFraction, outputFraction]);

  // Real-time Dynamic Optima Scoring Engine
  const scoredModels = useMemo(() => {
    const totalWeight = weightQuality + weightSpeed + weightCost + weightLatency;
    const safeTotalWeight = totalWeight > 0 ? totalWeight : 1;

    const { minQuality, maxQuality, minSpeed, maxSpeed, minCost, maxCost, minLatency, maxLatency } =
      modelRanges;

    const logMinCost = Math.log(minCost);
    const logMaxCost = Math.log(maxCost);
    const costRange = logMaxCost - logMinCost || 1;

    const qualityRange = maxQuality - minQuality || 1;
    const speedRange = maxSpeed - minSpeed || 1;
    const latencyRange = maxLatency - minLatency || 1;

    const list = models.map((model) => {
      const estimatedCost = calculateModelCost(model);

      // Normalized sub-scores in [0, 1]
      // 1. Quality (higher is better)
      const normQuality = Math.max(
        0,
        Math.min(1, (model.quality.intelligenceIndex - minQuality) / qualityRange)
      );

      // 2. Speed (higher throughput is better)
      const normSpeed = Math.max(
        0,
        Math.min(1, (model.performance.outputSpeedTokensPerSec.median - minSpeed) / speedRange)
      );

      // 3. Cost economy (lower monthly bill is better - logarithmic scaling for pricing orders of magnitude)
      const logCost = Math.log(Math.max(estimatedCost, 0.001));
      const normCost = Math.max(0, Math.min(1, 1 - (logCost - logMinCost) / costRange));

      // 4. Latency responsiveness (lower TTFT is better)
      const normLatency = Math.max(
        0,
        Math.min(1, 1 - (model.performance.ttftSeconds.median - minLatency) / latencyRange)
      );

      // Weighted Composite Score
      const compositeScore =
        (weightQuality * normQuality +
          weightSpeed * normSpeed +
          weightCost * normCost +
          weightLatency * normLatency) /
        safeTotalWeight;

      // Match percentage scaled to intuitive human range [45%, 99.5%]
      const matchPercentage = Math.round((0.45 + compositeScore * 0.545) * 1000) / 10;

      return {
        model,
        estimatedCost,
        normQuality,
        normSpeed,
        normCost,
        normLatency,
        compositeScore,
        matchPercentage,
      };
    });

    // Sort by composite score descending
    return list.sort((a, b) => b.compositeScore - a.compositeScore);
  }, [
    models,
    weightQuality,
    weightSpeed,
    weightCost,
    weightLatency,
    modelRanges,
    totalTokens,
    inputFraction,
    outputFraction,
  ]);

  // Filtered scored models according to user filters
  const filteredScoredModels = useMemo(() => {
    return scoredModels.filter((entry) => {
      const m = entry.model;

      // Weights filter
      if (filterWeights !== "all" && m.weightsType !== filterWeights) {
        return false;
      }

      // Reasoning filter
      if (filterReasoning === "reasoning" && !m.isReasoningModel) {
        return false;
      }
      if (filterReasoning === "standard" && m.isReasoningModel) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCreator = m.creatorDisplayName.toLowerCase().includes(q);
        const matchesTags = m.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCreator && !matchesTags) return false;
      }

      return true;
    });
  }, [scoredModels, filterWeights, filterReasoning, searchQuery]);

  // 1. Best Overall Match: Highest composite score
  const bestOverallMatch = useMemo(() => {
    return filteredScoredModels.length > 0 ? filteredScoredModels[0] : scoredModels[0] || null;
  }, [filteredScoredModels, scoredModels]);

  // 2. Best Budget Match: High efficiency alternative with lowest cost among models with solid quality
  const bestBudgetMatch = useMemo(() => {
    if (!bestOverallMatch) return null;
    const candidates = filteredScoredModels.filter(
      (entry) =>
        entry.model.id !== bestOverallMatch.model.id &&
        entry.estimatedCost < bestOverallMatch.estimatedCost &&
        entry.model.quality.intelligenceIndex >= 45
    );
    if (candidates.length === 0) return null;
    // Sort by lowest cost
    return [...candidates].sort((a, b) => a.estimatedCost - b.estimatedCost)[0];
  }, [filteredScoredModels, bestOverallMatch]);

  // 3. Maximum Speed Match: Highest throughput speed among competitive models
  const maxSpeedMatch = useMemo(() => {
    if (!bestOverallMatch) return null;
    const candidates = filteredScoredModels.filter(
      (entry) =>
        entry.model.id !== bestOverallMatch.model.id &&
        entry.model.performance.outputSpeedTokensPerSec.median >
          bestOverallMatch.model.performance.outputSpeedTokensPerSec.median
    );
    if (candidates.length === 0) return null;
    // Sort by highest throughput
    return [...candidates].sort(
      (a, b) =>
        b.model.performance.outputSpeedTokensPerSec.median -
        a.model.performance.outputSpeedTokensPerSec.median
    )[0];
  }, [filteredScoredModels, bestOverallMatch]);

  const applyArchetype = (preset: ArchetypePreset) => {
    setWeightQuality(preset.weights.quality);
    setWeightSpeed(preset.weights.speed);
    setWeightCost(preset.weights.cost);
    setWeightLatency(preset.weights.latency);
  };

  const resetPreferences = () => {
    setWeightQuality(75);
    setWeightSpeed(50);
    setWeightCost(60);
    setWeightLatency(40);
  };

  return (
    <div className="w-full space-y-8 select-none text-slate-900 font-sans">
      {/* 1. Header & Recommender Hero */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0047FF] border border-blue-200">
              <Sparkles size={13} className="text-[#0047FF]" />
              <span>Optima Multi-Objective Decision Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              "Optima" AI Model Recommender & Estimator
            </h1>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Dynamically evaluates multi-dimensional trade-offs between reasoning intelligence,
              token throughput, inference latency, and enterprise workload budgets across 38+
              frontier models.
            </p>
          </div>

          {/* Archetype Quick Presets Banner */}
          <div className="bg-white/90 backdrop-blur-xs border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2.5 shrink-0 max-w-md">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Workload Archetype Presets:</span>
              <button
                type="button"
                onClick={resetPreferences}
                className="text-[11px] text-[#0047FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => applyArchetype(arch)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-[#0047FF] hover:border-blue-200 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <span>{arch.icon}</span>
                  <span>{arch.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Preference Sliders & Token Estimator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Preference Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-[#0047FF]" />
              <h2 className="text-base font-bold text-slate-900">Objective Weight Preferences</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Adjust weights to tailor the Optima algorithm
            </span>
          </div>

          <div className="space-y-5">
            {/* Slider 1: Intelligence & Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  Intelligence & Reasoning Quality (WQ)
                </span>
                <span className="font-extrabold text-[#0047FF] text-sm tabular-nums">
                  {weightQuality}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weightQuality}
                onChange={(e) => setWeightQuality(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0047FF]"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Standard tasks</span>
                <span>SWE-bench, GPQA Diamond, Complex CoT</span>
              </div>
            </div>

            {/* Slider 2: Throughput Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  Generation Throughput Speed (WS)
                </span>
                <span className="font-extrabold text-amber-600 text-sm tabular-nums">
                  {weightSpeed}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weightSpeed}
                onChange={(e) => setWeightSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Relaxed turnaround</span>
                <span>Ultra-fast streaming (&gt;150 tok/s)</span>
              </div>
            </div>

            {/* Slider 3: Cost Economy & Budget */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins size={14} className="text-emerald-500" />
                  Cost Economy & Monthly Budget (WC)
                </span>
                <span className="font-extrabold text-emerald-600 text-sm tabular-nums">
                  {weightCost}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weightCost}
                onChange={(e) => setWeightCost(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Performance-first</span>
                <span>Maximum frugality (&lt;$0.30/1M tokens)</span>
              </div>
            </div>

            {/* Slider 4: Low Latency Responsiveness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-[#0047FF]" />
                  Low Latency Responsiveness (WL)
                </span>
                <span className="font-extrabold text-[#0047FF] text-sm tabular-nums">
                  {weightLatency}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weightLatency}
                onChange={(e) => setWeightLatency(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0047FF]"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Batch jobs</span>
                <span>Real-time voice & interactive UX (sub-second TTFT)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workload Token Volume Estimator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-[#0047FF]" />
                <h2 className="text-base font-bold text-slate-900">Workload Token Estimator</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Monthly volume</span>
            </div>

            {/* Monthly Volume Controls */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800">Monthly Token Volume:</label>
                <div className="flex items-center gap-1">
                  <span className="text-base font-extrabold text-slate-900 tabular-nums">
                    {monthlyTokensMillions.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Million tok/mo</span>
                </div>
              </div>

              {/* Slider for Volume */}
              <input
                type="range"
                min="1"
                max="250"
                step="1"
                value={monthlyTokensMillions}
                onChange={(e) => setMonthlyTokensMillions(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0047FF]"
              />

              {/* Quick Pills for Volume */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1, 5, 20, 50, 100, 200].map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setMonthlyTokensMillions(vol)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      monthlyTokensMillions === vol
                        ? "bg-[#0047FF] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {vol}M
                  </button>
                ))}
              </div>
            </div>

            {/* Input / Output Ratio Presets */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 block">
                Input vs Output Token Distribution:
              </label>

              <div className="space-y-2">
                {RATIO_PRESETS.map((preset) => {
                  const isSelected = selectedRatioPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedRatioPreset(preset.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-400/20 text-slate-900"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{preset.label}</span>
                          {isSelected && <Check size={13} className="text-[#0047FF]" />}
                        </div>
                        <div className="text-[11px] text-slate-500">{preset.description}</div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-700 shrink-0 ml-2">
                        {preset.inputPercent}% In / {preset.outputPercent}% Out
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Workload Summary Stat Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 mt-2">
            <div className="flex justify-between text-slate-600">
              <span>Estimated Input Tokens:</span>
              <strong className="text-slate-900 tabular-nums">
                {((totalTokens * inputFraction) / 1_000_000).toFixed(1)}M tokens
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Output Tokens:</span>
              <strong className="text-slate-900 tabular-nums">
                {((totalTokens * outputFraction) / 1_000_000).toFixed(1)}M tokens
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Recommendations Showcase (3 Cards) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Award size={20} className="text-[#0047FF]" />
              <span>Optima Top Recommendations Showcase</span>
            </h2>
            <p className="text-xs text-slate-500">
              Generated in real-time based on your custom objective weights and token workload.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Selected Workload:{" "}
            <strong className="text-slate-800">{monthlyTokensMillions}M tok/mo</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Best Overall Match */}
          {bestOverallMatch && (
            <div className="relative rounded-2xl border-2 border-[#0047FF] bg-gradient-to-b from-blue-50/50 via-white to-white p-6 shadow-md flex flex-col justify-between">
              {/* Header Badge */}
              <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#0047FF] text-white shadow-sm flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>#1 Best Overall Match</span>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                      {bestOverallMatch.model.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-600">
                        {bestOverallMatch.model.creatorDisplayName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-[#0047FF]">
                        {bestOverallMatch.model.weightsType === "open-weights"
                          ? "Open Weights"
                          : "Proprietary"}
                      </span>
                    </div>
                  </div>

                  {/* Match Percentage Pill */}
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-[#0047FF] tabular-nums">
                      {bestOverallMatch.matchPercentage}%
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Optima Match
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {bestOverallMatch.model.summary}
                </p>

                {/* Estimated Monthly Cost Display */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Estimated Monthly Cost:
                    </span>
                    <span className="text-xl font-black text-slate-900 tabular-nums">
                      ${bestOverallMatch.estimatedCost.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-slate-500 ml-1">/ month</span>
                  </div>
                  <div className="text-right text-[11px] text-slate-600">
                    <div>${bestOverallMatch.model.pricing.blendedPricePer1M.toFixed(2)} / 1M</div>
                    <div className="text-[10px] text-slate-400">Blended price</div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Quality Index</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {bestOverallMatch.model.quality.intelligenceIndex}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Speed</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {bestOverallMatch.model.performance.outputSpeedTokensPerSec.median} tok/s
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Latency</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {bestOverallMatch.model.performance.ttftSeconds.median}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-5">
                <button
                  type="button"
                  onClick={() => onSelectModel && onSelectModel(bestOverallMatch.model)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#0047FF] hover:bg-[#2966FF] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Select Model</span>
                  <ArrowRight size={13} />
                </button>
                {onCompareModel && (
                  <button
                    type="button"
                    onClick={() => onCompareModel(bestOverallMatch.model)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    Compare
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Card 2: Best Budget Match */}
          {bestBudgetMatch && (
            <div className="relative rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/40 via-white to-white p-6 shadow-xs flex flex-col justify-between">
              {/* Header Badge */}
              <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1.5">
                <Coins size={12} />
                <span>Best Budget Match</span>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                      {bestBudgetMatch.model.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-600">
                        {bestBudgetMatch.model.creatorDisplayName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                        High Efficiency
                      </span>
                    </div>
                  </div>

                  {/* Match Percentage Pill */}
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-emerald-600 tabular-nums">
                      {bestBudgetMatch.matchPercentage}%
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Optima Match
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {bestBudgetMatch.model.summary}
                </p>

                {/* Estimated Monthly Cost & Savings */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Estimated Monthly Cost:
                    </span>
                    <span className="text-xl font-black text-slate-900 tabular-nums">
                      ${bestBudgetMatch.estimatedCost.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-slate-500 ml-1">/ mo</span>
                  </div>
                  {bestOverallMatch && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-0.5 justify-end">
                        <TrendingDown size={13} />
                        Save $
                        {(bestOverallMatch.estimatedCost - bestBudgetMatch.estimatedCost).toFixed(
                          2
                        )}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        -
                        {(
                          ((bestOverallMatch.estimatedCost - bestBudgetMatch.estimatedCost) /
                            bestOverallMatch.estimatedCost) *
                          100
                        ).toFixed(0)}
                        % vs Overall Match
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Quality Index</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {bestBudgetMatch.model.quality.intelligenceIndex}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Speed</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {bestBudgetMatch.model.performance.outputSpeedTokensPerSec.median} tok/s
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Latency</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {bestBudgetMatch.model.performance.ttftSeconds.median}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-5">
                <button
                  type="button"
                  onClick={() => onSelectModel && onSelectModel(bestBudgetMatch.model)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Select Model</span>
                  <ArrowRight size={13} />
                </button>
                {onCompareModel && (
                  <button
                    type="button"
                    onClick={() => onCompareModel(bestBudgetMatch.model)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    Compare
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Maximum Speed Match */}
          {maxSpeedMatch && (
            <div className="relative rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-50/40 via-white to-white p-6 shadow-xs flex flex-col justify-between">
              {/* Header Badge */}
              <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-600 text-white shadow-sm flex items-center gap-1.5">
                <Flame size={12} />
                <span>Maximum Speed Match</span>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                      {maxSpeedMatch.model.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-600">
                        {maxSpeedMatch.model.creatorDisplayName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
                        Speed Champion
                      </span>
                    </div>
                  </div>

                  {/* Match Percentage Pill */}
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-amber-600 tabular-nums">
                      {maxSpeedMatch.matchPercentage}%
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Optima Match
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {maxSpeedMatch.model.summary}
                </p>

                {/* Speed Highlight Banner */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                      Output Throughput:
                    </span>
                    <span className="text-xl font-black text-slate-900 tabular-nums">
                      {maxSpeedMatch.model.performance.outputSpeedTokensPerSec.median}
                    </span>
                    <span className="text-xs font-bold text-slate-600 ml-1">tokens / sec</span>
                  </div>
                  {bestOverallMatch && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-700">
                        {(
                          maxSpeedMatch.model.performance.outputSpeedTokensPerSec.median /
                          bestOverallMatch.model.performance.outputSpeedTokensPerSec.median
                        ).toFixed(1)}
                        x Faster
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        TTFT: {maxSpeedMatch.model.performance.ttftSeconds.median}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Quality Index</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {maxSpeedMatch.model.quality.intelligenceIndex}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Monthly Cost</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      ${maxSpeedMatch.estimatedCost.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500 font-semibold">Blended / 1M</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      ${maxSpeedMatch.model.pricing.blendedPricePer1M.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-5">
                <button
                  type="button"
                  onClick={() => onSelectModel && onSelectModel(maxSpeedMatch.model)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Select Model</span>
                  <ArrowRight size={13} />
                </button>
                {onCompareModel && (
                  <button
                    type="button"
                    onClick={() => onCompareModel(maxSpeedMatch.model)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    Compare
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Complete Ranked Models Explorer Table */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
              Ranked Model Recommendations ({filteredScoredModels.length} models)
            </h2>
            <p className="text-xs text-slate-500">
              Full ranking evaluated against your dynamic Optima preference weights and token
              workload.
            </p>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] w-40 sm:w-48"
              />
            </div>

            {/* Weights Filter */}
            <select
              value={filterWeights}
              onChange={(e) => setFilterWeights(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20"
            >
              <option value="all">All Weights</option>
              <option value="open-weights">Open Weights Only</option>
              <option value="proprietary">Proprietary Only</option>
            </select>

            {/* Reasoning Filter */}
            <select
              value={filterReasoning}
              onChange={(e) => setFilterReasoning(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20"
            >
              <option value="all">All Architectures</option>
              <option value="reasoning">Reasoning Models (CoT)</option>
              <option value="standard">Standard Models</option>
            </select>
          </div>
        </div>

        {/* Ranked Table */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Model & Creator</th>
                  <th className="py-3 px-4">Optima Match</th>
                  <th className="py-3 px-4">Est. Monthly Cost</th>
                  <th className="py-3 px-4">Blended / 1M</th>
                  <th className="py-3 px-4">Quality Index</th>
                  <th className="py-3 px-4">Speed</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScoredModels.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 bg-white">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search size={22} className="text-slate-300" />
                        <p className="font-semibold text-sm text-slate-800">
                          No matching models found
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Try adjusting your search query, creator filter, or architecture
                          constraint.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setFilterWeights("all");
                            setFilterReasoning("all");
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-[#0047FF] text-white text-xs font-semibold hover:bg-[#2966FF] transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredScoredModels.map((entry, idx) => {
                    const { model, estimatedCost, matchPercentage } = entry;
                    const isTopPick = idx === 0;

                    return (
                      <tr
                        key={model.id}
                        className={`hover:bg-blue-50/30 transition-colors group ${
                          isTopPick ? "bg-blue-50/20" : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900 tabular-nums">
                          #{idx + 1}
                        </td>

                        {/* Model & Creator */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-[#0047FF] font-bold text-xs flex items-center justify-center shrink-0">
                              {model.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm">
                                  {model.name}
                                </span>
                                {model.isReasoningModel && (
                                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#BEDBFF]/30 text-[#0047FF] border border-[#BEDBFF]/50">
                                    Reasoning
                                  </span>
                                )}
                                {model.weightsType === "open-weights" && (
                                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                    Open
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {model.creatorDisplayName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Optima Match */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-[#0047FF] text-sm tabular-nums">
                                {matchPercentage}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Match</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#0047FF] h-full rounded-full transition-all duration-300"
                                style={{ width: `${matchPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Estimated Monthly Cost */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm tabular-nums">
                            ${estimatedCost.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {monthlyTokensMillions}M tokens
                          </div>
                        </td>

                        {/* Blended / 1M */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800 tabular-nums">
                          ${model.pricing.blendedPricePer1M.toFixed(2)}
                        </td>

                        {/* Quality Index */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 tabular-nums">
                            {model.quality.intelligenceIndex}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            SWE: {model.quality.sweBenchVerified}%
                          </div>
                        </td>

                        {/* Speed */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                          {model.performance.outputSpeedTokensPerSec.median} tok/s
                        </td>

                        {/* Latency */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700 tabular-nums">
                          {model.performance.ttftSeconds.median}s
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onCompareModel && (
                              <button
                                type="button"
                                onClick={() => onCompareModel(model)}
                                className="px-2 py-1 rounded-md text-[11px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                Compare
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onSelectModel && onSelectModel(model)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#0047FF] hover:bg-[#2966FF] text-white transition-colors cursor-pointer"
                            >
                              Select
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
