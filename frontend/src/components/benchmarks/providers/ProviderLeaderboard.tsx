import React, { useState, useMemo } from "react";
import {
  Zap,
  Gauge,
  Server,
  Coins,
  ShieldCheck,
  Cpu,
  Globe,
  Clock,
  ArrowUpDown,
  Flame,
  Award,
  ExternalLink,
  ChevronDown,
  Search,
  Sparkles,
  Activity,
  Info,
  TrendingDown,
  Layers,
  Check,
  BarChart2,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  BENCHMARK_PROVIDERS,
  PROVIDER_METADATA,
  getProvidersForModel,
  ModelProviderMatch,
} from "../data/benchmarkProviders";
import { BENCHMARK_MODELS, getModelById } from "../data/benchmarkModels";
import type { ProviderId } from "../types";
import { CreatorLogo } from "../ui/CreatorLogo";

export interface ProviderLeaderboardProps {
  onSelectModel?: (modelId: string) => void;
  initialModelId?: string;
}

type SortField = "speed" | "ttft" | "price" | "uptime";
type ViewMode = "grid" | "table";

function getProviderLogoKey(id: string): string {
  switch (id) {
    case "cerebras":
      return "wafer";
    case "groq":
      return "gmi";
    case "aws-bedrock":
      return "aws";
    case "azure-openai":
      return "microsoft";
    case "gcp-vertex":
      return "google";
    case "together":
      return "togetherai";
    case "fireworks":
      return "fireworks";
    default:
      return id;
  }
}

// Curated popular models with wide provider support from Artificial Analysis
const POPULAR_MODELS = [
  {
    id: "claude-opus-5-5-max-with-fallback",
    label: "Claude Opus 5.5",
    tag: "Intelligence King",
    providersCount: 2,
  },
  { id: "gpt-6-astra-max", label: "GPT-6 Astra", tag: "Frontier Reasoning", providersCount: 2 },
  {
    id: "deepseek-v4-1-flash-max",
    label: "DeepSeek V4.1 Flash",
    tag: "Fast Frontier",
    providersCount: 5,
  },
  {
    id: "gemini-4-argon-high",
    label: "Gemini 4 Argon",
    tag: "Multimodal Leader",
    providersCount: 2,
  },
  { id: "qwen3-8-max-0902", label: "Qwen3.8 Max", tag: "Open Giant", providersCount: 5 },
  { id: "muse-wonder-max", label: "Muse Wonder", tag: "Open Weights", providersCount: 5 },
];

export const ProviderLeaderboard: React.FC<ProviderLeaderboardProps> = ({
  onSelectModel,
  initialModelId,
}) => {
  // Selected model ID for benchmarking comparison
  const [selectedModelId, setSelectedModelId] = useState<string>(
    initialModelId || "claude-opus-5-5-max-with-fallback"
  );

  React.useEffect(() => {
    if (initialModelId) {
      setSelectedModelId(initialModelId);
    }
  }, [initialModelId]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("speed");
  const [sortAscending, setSortAscending] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedProviderDetail, setSelectedProviderDetail] = useState<ProviderId | null>(null);

  // Active model metadata
  const selectedModel = useMemo(() => {
    return getModelById(selectedModelId) || BENCHMARK_MODELS[0];
  }, [selectedModelId]);

  // All distinct models available across all inference providers
  const allAvailableModels = useMemo(() => {
    const modelSet = new Set<string>();
    BENCHMARK_PROVIDERS.forEach((provider) => {
      provider.modelSupport.forEach((sup) => modelSet.add(sup.modelId));
    });
    return Array.from(modelSet).map((id) => {
      const benchmarkModel = getModelById(id);
      return {
        id,
        name: benchmarkModel?.name ?? id,
        creator: benchmarkModel?.creatorDisplayName ?? "Open Weights",
        intelligence: benchmarkModel?.quality.intelligenceIndex ?? 0,
      };
    });
  }, []);

  // Provider matches for the active model
  const providerMatches: ModelProviderMatch[] = useMemo(() => {
    const rawMatches = getProvidersForModel(selectedModelId);

    // Apply search filter if query exists
    const filtered = rawMatches.filter((m) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        m.provider.name.toLowerCase().includes(query) ||
        m.metadata.hardwareDescription.toLowerCase().includes(query) ||
        m.metadata.tagline.toLowerCase().includes(query)
      );
    });

    // Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "speed":
          comparison = b.support.medianTps - a.support.medianTps;
          break;
        case "ttft":
          comparison = a.support.medianTtft - b.support.medianTtft; // lower latency is better
          break;
        case "price":
          comparison = a.support.blendedPricePer1M - b.support.blendedPricePer1M; // lower price is better
          break;
        case "uptime":
          comparison = b.support.uptimePercent - a.support.uptimePercent;
          break;
      }
      return sortAscending ? -comparison : comparison;
    });
  }, [selectedModelId, searchQuery, sortField, sortAscending]);

  // Statistics for comparative scaling
  const maxTps = useMemo(() => {
    if (providerMatches.length === 0) return 1;
    return Math.max(...providerMatches.map((m) => m.support.medianTps));
  }, [providerMatches]);

  const minPrice = useMemo(() => {
    if (providerMatches.length === 0) return 0;
    return Math.min(...providerMatches.map((m) => m.support.blendedPricePer1M));
  }, [providerMatches]);

  const maxPrice = useMemo(() => {
    if (providerMatches.length === 0) return 0;
    return Math.max(...providerMatches.map((m) => m.support.blendedPricePer1M));
  }, [providerMatches]);

  const fastestProvider = useMemo(() => {
    if (providerMatches.length === 0) return null;
    return [...providerMatches].sort((a, b) => b.support.medianTps - a.support.medianTps)[0];
  }, [providerMatches]);

  const cheapestProvider = useMemo(() => {
    if (providerMatches.length === 0) return null;
    return [...providerMatches].sort(
      (a, b) => a.support.blendedPricePer1M - b.support.blendedPricePer1M
    )[0];
  }, [providerMatches]);

  const handleSelectModel = (id: string) => {
    setSelectedModelId(id);
    if (onSelectModel) {
      onSelectModel(id);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      // For price and ttft, default ascending (cheaper/faster is first)
      if (field === "price" || field === "ttft") {
        setSortAscending(true);
      } else {
        setSortAscending(false);
      }
    }
  };

  return (
    <div className="w-full space-y-8 select-none text-slate-900 font-sans">
      {/* 1. Header & Overview Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0047FF] border border-blue-200">
              <Server size={13} className="text-[#0047FF]" />
              <span>Independent Inference Benchmarks</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Inference Providers Leaderboard
            </h1>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Empirical throughput speed (tok/s), time-to-first-token (TTFT), blended token pricing,
              and enterprise SLAs benchmarked across premier cloud AI accelerators.
            </p>
          </div>

          {/* Quick Benchmark Stats Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/90 backdrop-blur-xs border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Providers Evaluated
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                8 <span className="text-xs font-medium text-slate-400">Hosts</span>
              </div>
              <div className="text-[11px] text-[#0047FF] font-medium mt-0.5">
                Cerebras, Groq, Cloud
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs border border-amber-200/70 rounded-xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Flame size={12} className="text-amber-600" />
                Peak Speed King
              </div>
              <div className="text-2xl font-black text-amber-900 mt-1 tabular-nums">
                1,420 <span className="text-xs font-medium text-amber-700">tk/s</span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5 truncate">
                Cerebras CS-3
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs border border-emerald-200/70 rounded-xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Award size={12} className="text-emerald-600" />
                Value Champion
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1 tabular-nums">
                $0.23 <span className="text-xs font-medium text-emerald-700">/ 1M</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
                DeepInfra Cluster
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs border border-blue-200/70 rounded-xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} className="text-blue-600" />
                Enterprise SLA
              </div>
              <div className="text-2xl font-black text-blue-900 mt-1 tabular-nums">
                99.99% <span className="text-xs font-medium text-blue-700">SLA</span>
              </div>
              <div className="text-[11px] text-blue-700 font-medium mt-0.5 truncate">
                AWS & Azure Tier-1
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Model Selector & Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Hosted Model:
            </span>
            <span className="text-xs text-slate-500">
              ({providerMatches.length} providers serving this architecture)
            </span>
          </div>

          {/* Search within provider list & View Switcher */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search provider / hardware..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] w-48 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#0047FF] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table view"
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-[#0047FF] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Selection Chips for Popular Models */}
        <div className="flex flex-wrap items-center gap-2">
          {POPULAR_MODELS.map((m) => {
            const isSelected = selectedModelId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectModel(m.id)}
                className={`group px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-[#0047FF] text-white border-[#0047FF] shadow-sm shadow-blue-500/20 ring-2 ring-blue-500/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{m.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium tracking-wide ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                  }`}
                >
                  {m.providersCount} Providers
                </span>
              </button>
            );
          })}

          {/* Dropdown for All Evaluated Models */}
          <div className="relative inline-block">
            <select
              value={selectedModelId}
              onChange={(e) => handleSelectModel(e.target.value)}
              className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2 pr-8 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF]"
            >
              <option disabled value="">
                More Hosted Models...
              </option>
              {allAvailableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.creator})
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
          </div>
        </div>

        {/* Active Model Snapshot Card */}
        {selectedModel && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs p-1">
                <CreatorLogo creator={selectedModel.creator} size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{selectedModel.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                    {selectedModel.creatorDisplayName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100/70 border border-emerald-200 text-emerald-800">
                    {selectedModel.weightsType === "open-weights" ? "Open Weights" : "Proprietary"}
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5 flex items-center gap-2 text-[11px]">
                  <span>
                    Context: {(selectedModel.contextWindowTokens / 1000).toFixed(0)}k tokens
                  </span>
                  <span>•</span>
                  <span>
                    Quality Index:{" "}
                    <strong className="text-slate-800">
                      {selectedModel.quality.intelligenceIndex}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>SWE-bench: {selectedModel.quality.sweBenchVerified}%</span>
                </div>
              </div>
            </div>

            {/* Quick Fast / Cheap Provider Callout */}
            <div className="flex items-center gap-2 ml-auto">
              {fastestProvider && (
                <div className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] flex items-center gap-1.5 shadow-2xs">
                  <Flame size={12} className="text-amber-600" />
                  <span className="text-slate-600">Fastest:</span>
                  <strong className="text-slate-900 font-bold">
                    {fastestProvider.provider.name} ({fastestProvider.support.medianTps} tok/s)
                  </strong>
                </div>
              )}
              {cheapestProvider && (
                <div className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] flex items-center gap-1.5 shadow-2xs">
                  <Award size={12} className="text-emerald-600" />
                  <span className="text-slate-600">Cheapest:</span>
                  <strong className="text-slate-900 font-bold">
                    {cheapestProvider.provider.name} ($
                    {cheapestProvider.support.blendedPricePer1M.toFixed(2)}/1M)
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Sorting Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Sort by:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleSort("speed")}
              className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                sortField === "speed"
                  ? "bg-blue-50 text-[#0047FF] border-blue-200 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Zap size={12} />
              <span>Throughput Speed</span>
              {sortField === "speed" && (
                <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleSort("ttft")}
              className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                sortField === "ttft"
                  ? "bg-blue-50 text-[#0047FF] border-blue-200 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Clock size={12} />
              <span>Latency (TTFT)</span>
              {sortField === "ttft" && (
                <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleSort("price")}
              className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                sortField === "price"
                  ? "bg-blue-50 text-[#0047FF] border-blue-200 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Coins size={12} />
              <span>Blended Price</span>
              {sortField === "price" && (
                <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleSort("uptime")}
              className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                sortField === "uptime"
                  ? "bg-blue-50 text-[#0047FF] border-blue-200 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck size={12} />
              <span>Uptime SLA</span>
              {sortField === "uptime" && (
                <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{providerMatches.length}</strong> inference
          providers
        </div>
      </div>

      {/* 4. Comparison Cards Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {providerMatches.map((match, idx) => {
            const { provider, metadata, support } = match;
            const speedRatio = (support.medianTps / maxTps) * 100;
            const isSpeedKing = fastestProvider?.provider.id === provider.id;
            const isValueChamp = cheapestProvider?.provider.id === provider.id;
            const isEnterprise =
              provider.id === "aws-bedrock" ||
              provider.id === "azure-openai" ||
              provider.id === "gcp-vertex";

            // Price delta calculation vs maxPrice
            const savingsPercent =
              maxPrice > 0
                ? Math.round(((maxPrice - support.blendedPricePer1M) / maxPrice) * 100)
                : 0;

            return (
              <div
                key={provider.id}
                className={`relative rounded-2xl border transition-all duration-200 bg-white flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isSpeedKing
                    ? "border-amber-300 ring-2 ring-amber-400/20"
                    : isValueChamp
                      ? "border-emerald-300 ring-2 ring-emerald-400/20"
                      : isEnterprise
                        ? "border-blue-300 ring-2 ring-blue-400/20"
                        : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Top Highlighting Badge Ribbon */}
                {(isSpeedKing || isValueChamp || isEnterprise) && (
                  <div className="px-4 py-1.5 flex items-center justify-between text-[11px] font-bold tracking-wide uppercase">
                    {isSpeedKing && (
                      <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-t-lg -mt-1.5 -mx-4 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Flame size={13} className="fill-white" />
                          Speed King
                        </span>
                        <span className="normal-case font-semibold text-[10px]">
                          {support.medianTps} tok/s (#1 Fastest)
                        </span>
                      </div>
                    )}
                    {!isSpeedKing && isValueChamp && (
                      <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1 rounded-t-lg -mt-1.5 -mx-4 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Award size={13} />
                          Value Champion
                        </span>
                        <span className="normal-case font-semibold text-[10px]">
                          ${support.blendedPricePer1M.toFixed(2)}/1M (Lowest Cost)
                        </span>
                      </div>
                    )}
                    {!isSpeedKing && !isValueChamp && isEnterprise && (
                      <div className="w-full bg-gradient-to-r from-[#0047FF] to-blue-600 text-white px-3 py-1 rounded-t-lg -mt-1.5 -mx-4 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={13} />
                          Enterprise Grade
                        </span>
                        <span className="normal-case font-semibold text-[10px]">
                          {support.uptimePercent}% Uptime SLA
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 space-y-4 flex-1">
                  {/* Provider Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CreatorLogo creator={getProviderLogoKey(provider.id)} size={18} />
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {provider.name}
                        </h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 tabular-nums">
                          Rank #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 leading-snug">
                        {metadata.tagline}
                      </p>
                    </div>

                    <a
                      href={metadata.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Visit ${provider.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0047FF] hover:bg-blue-50 transition-colors shrink-0"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  {/* Hardware Specification Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                    <Cpu size={15} className="text-[#0047FF] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider text-slate-500">
                        Hardware Architecture
                      </div>
                      <div className="font-medium text-slate-800 leading-snug">
                        {provider.hardwareType}
                      </div>
                    </div>
                  </div>

                  {/* Output Speed Section with Comparative Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                        <Zap size={13} className="text-amber-500" />
                        Throughput Speed:
                      </span>
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-base tabular-nums">
                          {support.medianTps}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 ml-1">tok/s</span>
                        <span className="text-[10px] text-slate-400 block">
                          Peak: {support.p90Tps} tok/s
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Comparative Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSpeedKing
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-[#0047FF] to-[#2966FF]"
                        }`}
                        style={{ width: `${Math.max(speedRatio, 6)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>0 tok/s</span>
                      <span>
                        {speedRatio >= 99
                          ? "Fastest benchmark"
                          : `${speedRatio.toFixed(0)}% of peak`}
                      </span>
                      <span>{maxTps} tok/s max</span>
                    </div>
                  </div>

                  {/* Latency & Pricing Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    {/* Time To First Token (TTFT) */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock size={12} className="text-blue-500" />
                        Time to First Token
                      </div>
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        {support.medianTtft}s
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {support.medianTtft < 0.4
                          ? "Ultra-responsive"
                          : support.medianTtft < 0.8
                            ? "Fast streaming"
                            : "Standard queue"}
                      </div>
                    </div>

                    {/* Blended Price per 1M */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Coins size={12} className="text-emerald-500" />
                        Blended Price / 1M
                      </div>
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        ${support.blendedPricePer1M.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        {savingsPercent > 0 ? `-${savingsPercent}% vs ceiling` : "Baseline ceiling"}
                      </div>
                    </div>
                  </div>

                  {/* SLA & Regional Coverage Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold text-slate-700">
                        {support.uptimePercent}% SLA
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1 text-slate-500 truncate max-w-[170px]"
                      title={metadata.regions.join(", ")}
                    >
                      <Globe size={11} className="shrink-0 text-slate-400" />
                      <span className="truncate">{metadata.regions.length} Regions</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProviderDetail(provider.id)}
                    className="text-xs font-semibold text-[#0047FF] hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all models ({provider.modelSupport.length})</span>
                  </button>

                  <a
                    href={metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>Deploy</span>
                    <ExternalLink size={11} className="text-slate-400" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. Full Comparison Table View */
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Provider & Hardware</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSort("speed")}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-500" />
                      <span>Speed (tok/s)</span>
                      {sortField === "speed" && (
                        <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSort("ttft")}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-500" />
                      <span>Latency (TTFT)</span>
                      {sortField === "ttft" && (
                        <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSort("price")}
                  >
                    <div className="flex items-center gap-1.5">
                      <Coins size={13} className="text-emerald-500" />
                      <span>Blended / 1M</span>
                      {sortField === "price" && (
                        <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSort("uptime")}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-blue-600" />
                      <span>SLA Uptime</span>
                      {sortField === "uptime" && (
                        <ArrowUpDown size={11} className={sortAscending ? "rotate-180" : ""} />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Regions</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providerMatches.map((match, idx) => {
                  const { provider, metadata, support } = match;
                  const speedRatio = (support.medianTps / maxTps) * 100;
                  const isSpeedKing = fastestProvider?.provider.id === provider.id;
                  const isValueChamp = cheapestProvider?.provider.id === provider.id;
                  const isEnterprise =
                    provider.id === "aws-bedrock" ||
                    provider.id === "azure-openai" ||
                    provider.id === "gcp-vertex";

                  return (
                    <tr key={provider.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Provider & Hardware */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 p-1">
                            <CreatorLogo creator={getProviderLogoKey(provider.id)} size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {provider.name}
                              </span>
                              {isSpeedKing && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Speed King
                                </span>
                              )}
                              {isValueChamp && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Value Champ
                                </span>
                              )}
                              {isEnterprise && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                  Enterprise
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {provider.hardwareType}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Throughput Speed */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 min-w-[130px]">
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-slate-900 text-sm tabular-nums">
                              {support.medianTps}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">tok/s</span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              (p90: {support.p90Tps})
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#0047FF] h-full rounded-full"
                              style={{ width: `${Math.max(speedRatio, 5)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* TTFT */}
                      <td className="py-4 px-4 font-bold text-slate-900 tabular-nums">
                        {support.medianTtft}s
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 tabular-nums text-sm">
                          ${support.blendedPricePer1M.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">per 1M tokens</div>
                      </td>

                      {/* SLA */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {support.uptimePercent}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{metadata.enterpriseSla}</div>
                      </td>

                      {/* Regions */}
                      <td className="py-4 px-4 text-slate-600 text-[11px] max-w-[180px]">
                        <div className="truncate" title={metadata.regions.join(", ")}>
                          {metadata.regions.join(", ")}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <a
                          href={metadata.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#0047FF] hover:text-white text-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Deploy</span>
                          <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Hardware Comparison & Methodology Summary */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-[#0047FF] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Artificial Analysis Empirical Benchmark Methodology
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              All benchmarks are evaluated through independent client test harness instances
              distributed across AWS us-east-1 and GCP us-central1. Output throughput measures true
              generated completion tokens divided by duration (excluding initial TTFT). Time to
              First Token (TTFT) measures standard response latency over persistent HTTP/2
              connection pooling with 500-token prompt payloads. Pricing incorporates standardized
              3:1 input-to-output token distribution ratios.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Provider Full Model Suite Drawer / Modal */}
      {selectedProviderDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
          onClick={() => setSelectedProviderDetail(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            {(() => {
              const prov = BENCHMARK_PROVIDERS.find((p) => p.id === selectedProviderDetail);
              const meta = prov ? PROVIDER_METADATA[prov.id] : null;
              if (!prov || !meta) return null;

              return (
                <>
                  <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <CreatorLogo creator={getProviderLogoKey(prov.id)} size={24} />
                        <h3 className="text-xl font-bold text-slate-900">{prov.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0047FF]">
                          {prov.modelSupport.length} Evaluated Models
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{meta.tagline}</p>
                      <div className="text-xs text-slate-700 font-semibold mt-2 flex items-center gap-1.5">
                        <Cpu size={13} className="text-[#0047FF]" />
                        <span>{prov.hardwareType}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProviderDetail(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Model List */}
                  <div className="p-6 overflow-y-auto space-y-3 flex-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Benchmarked Models on this Provider:
                    </div>
                    {prov.modelSupport.map((sup) => {
                      const modelObj = getModelById(sup.modelId);
                      return (
                        <div
                          key={sup.modelId}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white flex items-center justify-between gap-3 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {modelObj?.name ?? sup.modelId}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                {modelObj?.creatorDisplayName ?? "Open Weights"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>TTFT: {sup.medianTtft}s</span>
                              <span>•</span>
                              <span>Uptime: {sup.uptimePercent}%</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900 tabular-nums">
                              {sup.medianTps}{" "}
                              <span className="text-xs font-semibold text-slate-500">tok/s</span>
                            </div>
                            <div className="text-xs font-bold text-emerald-600 tabular-nums">
                              ${sup.blendedPricePer1M.toFixed(2)}{" "}
                              <span className="text-[10px] font-normal text-slate-500">/ 1M</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      SLA: <strong>{meta.enterpriseSla}</strong>
                    </div>
                    <a
                      href={meta.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0047FF] text-white hover:bg-[#2966FF] transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Visit Official Documentation</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
