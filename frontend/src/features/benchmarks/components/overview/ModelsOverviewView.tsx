import React, { useState } from "react";
import { ChevronsUpDown, Filter, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { CreatorLogo } from "../ui/CreatorLogo";
import { getCreatorColor } from "../ui/creatorBranding";
import { BENCHMARK_MODELS } from "../data/benchmarkModels";
import { FrontierIntelligenceOverTimeChart } from "./FrontierIntelligenceOverTimeChart";
import { CodingAgentIndexesFullChart } from "./CodingAgentIndexesFullChart";
import { CapabilityIndexesSection } from "./CapabilityIndexesSection";

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface BenchmarkChartItem {
  name: string;
  creator: string;
  value: number;
  label: string;
  color?: string;
  ciLower?: number;
  ciUpper?: number;
}

export interface MetricCardConfig {
  title: string;
  subtitle: string;
  accentColor: string;
  metricLabel: "Higher is better" | "Lower is better";
  items: BenchmarkChartItem[];
}

// ─── Real Datasets from Artificial Analysis (Matching Official Leaderboards) ──

const LANGUAGE_MODELS_DATA: {
  intelligence: MetricCardConfig;
  speed: MetricCardConfig;
  cost: MetricCardConfig;
} = {
  intelligence: {
    title: "Intelligence",
    subtitle: "Sara Analysis Intelligence Index",
    accentColor: "#736CD3",
    metricLabel: "Higher is better",
    items: [
      {
        name: "Gemini 4\nCarbon (high)",
        creator: "google",
        value: 59,
        label: "59",
        color: "#34A853",
      },
      {
        name: "Claude Opus\n5.5 (max)",
        creator: "anthropic",
        value: 58,
        label: "58",
        color: "#CC785C",
      },
      {
        name: "Kimi K3.1\nPro",
        creator: "kimi",
        value: 55,
        label: "55",
        color: "#047AFE",
      },
      {
        name: "Claude Fable\n5.1 (max)",
        creator: "anthropic",
        value: 53,
        label: "53",
        color: "#CC785C",
      },
      { name: "GPT-6\nAstra (max)", creator: "openai", value: 53, label: "53", color: "#171717" },
      {
        name: "Gemini 4\nArgon (high)",
        creator: "google",
        value: 53,
        label: "53",
        color: "#34A853",
      },
      { name: "Muse\nWonder (max)", creator: "meta", value: 52, label: "52", color: "#0084FF" },
      { name: "GPT-6.1\nSol (max)", creator: "openai", value: 52, label: "52", color: "#171717" },
      { name: "GPT-6.1\nTerra (max)", creator: "openai", value: 48, label: "48", color: "#171717" },
      { name: "Grok 4.7\n(xhigh)", creator: "spacexai", value: 46, label: "46", color: "#736CD3" },
      { name: "MiMo-\nV2.6-Pro", creator: "xiaomi", value: 46, label: "46", color: "#FF6900" },
      { name: "GLM-5.3\n(max)", creator: "zai", value: 45, label: "45", color: "#2563EB" },
      {
        name: "DeepSeek V4.1\nFlash (max)",
        creator: "deepseek",
        value: 39,
        label: "39",
        color: "#2243E6",
      },
    ],
  },
  speed: {
    title: "Speed",
    subtitle: "Output tokens per second",
    accentColor: "#EAB308",
    metricLabel: "Higher is better",
    items: [
      {
        name: "DeepSeek V4.1\nFlash (max)",
        creator: "deepseek",
        value: 227,
        label: "227",
        color: "#2243E6",
      },
      { name: "Muse\nWonder (max)", creator: "meta", value: 176, label: "176", color: "#0084FF" },
      {
        name: "Gemini 4\nCarbon (high)",
        creator: "google",
        value: 100,
        label: "100",
        color: "#34A853",
      },
      {
        name: "Claude Opus\n5.5 (max)",
        creator: "anthropic",
        value: 97,
        label: "97",
        color: "#CC785C",
      },
      { name: "Grok 4.7\n(xhigh)", creator: "spacexai", value: 97, label: "97", color: "#736CD3" },
      { name: "GLM-5.3\n(max)", creator: "zai", value: 93, label: "93", color: "#2563EB" },
      {
        name: "GPT-6.1\nTerra (max)",
        creator: "openai",
        value: 90.9,
        label: "90.9",
        color: "#171717",
      },
      {
        name: "Claude Fable\n5.1 (max)",
        creator: "anthropic",
        value: 71,
        label: "71",
        color: "#CC785C",
      },
      { name: "GPT-6\nAstra (max)", creator: "openai", value: 65, label: "65", color: "#171717" },
      { name: "GPT-6.1\nSol (max)", creator: "openai", value: 64, label: "64", color: "#171717" },
      {
        name: "Kimi K3.1\nPro",
        creator: "kimi",
        value: 58,
        label: "58",
        color: "#047AFE",
      },
      { name: "MiMo-\nV2.6-Pro", creator: "xiaomi", value: 48, label: "48", color: "#FF6900" },
    ],
  },
  cost: {
    title: "Cost per Task",
    subtitle: "Weighted average cost (USD) per Intelligence Index task",
    accentColor: "#F97316",
    metricLabel: "Lower is better",
    items: [
      {
        name: "GPT-6.1\nTerra (low)",
        creator: "openai",
        value: 0.05,
        label: "$0.05",
        color: "#171717",
      },
      {
        name: "MiMo-\nV2.6-Pro",
        creator: "xiaomi",
        value: 0.13,
        label: "$0.13",
        color: "#FF6900",
      },
      {
        name: "GPT-6.1\nTerra (max)",
        creator: "openai",
        value: 0.4,
        label: "$0.40",
        color: "#171717",
      },
      {
        name: "DeepSeek V4.1\nFlash (max)",
        creator: "deepseek",
        value: 0.49,
        label: "$0.49",
        color: "#2243E6",
      },
      {
        name: "GPT-6.1\nSol (max)",
        creator: "openai",
        value: 0.72,
        label: "$0.72",
        color: "#171717",
      },
      {
        name: "Gemini 4\nArgon (high)",
        creator: "google",
        value: 1.99,
        label: "$1.99",
        color: "#34A853",
      },
      {
        name: "GLM-5.3\n(max)",
        creator: "zai",
        value: 2.01,
        label: "$2.01",
        color: "#2563EB",
      },
      {
        name: "Kimi K3.1\nPro",
        creator: "kimi",
        value: 2.11,
        label: "$2.11",
        color: "#047AFE",
      },
      {
        name: "GPT-6\nAstra (max)",
        creator: "openai",
        value: 3.26,
        label: "$3.26",
        color: "#171717",
      },
      {
        name: "Grok 4.7\n(xhigh)",
        creator: "spacexai",
        value: 3.74,
        label: "$3.74",
        color: "#736CD3",
      },
      {
        name: "Muse\nWonder (max)",
        creator: "meta",
        value: 4.52,
        label: "$4.52",
        color: "#0084FF",
      },
      {
        name: "Claude Opus\n5.5 (max)",
        creator: "anthropic",
        value: 5.98,
        label: "$5.98",
        color: "#CC785C",
      },
      {
        name: "Gemini 4\nCarbon (high)",
        creator: "google",
        value: 7.76,
        label: "$7.76",
        color: "#34A853",
      },
    ],
  },
};

// ─── Curated Artificial Analysis Intelligence Index models ───────────────────

interface FullIndexModelItem {
  name: string;
  creator: string;
  score: number;
  color: string;
  noPublicApi?: boolean;
  weights: "proprietary" | "open_weights" | "open_restricted";
  modality: "multimodal" | "text_only";
  country: "us" | "cn" | "fr" | "ae";
}

const INTELLIGENCE_INDEX_MODELS: FullIndexModelItem[] = [
  {
    name: "Gemini 4\nCarbon (high)",
    creator: "google",
    score: 59,
    color: "#34A853",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Claude Sonnet\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    score: 56,
    color: "#CC785C",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Muse Wonder\nFull (max)",
    creator: "meta",
    score: 55,
    color: "#0084FF",
    noPublicApi: true,
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Kimi K3.1 Pro",
    creator: "kimi",
    score: 55,
    color: "#047AFE",
    weights: "open_restricted",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "Claude Fable\n5.1 (max with\nfallback)",
    creator: "anthropic",
    score: 53,
    color: "#CC785C",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "GPT-6\nAstra (max)",
    creator: "openai",
    score: 53,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Gemini 4\nArgon (high)",
    creator: "google",
    score: 53,
    color: "#34A853",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Muse\nWonder (max)",
    creator: "meta",
    score: 52,
    color: "#0084FF",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "GPT-6.1\nSol (max)",
    creator: "openai",
    score: 52,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "GPT-6.1 Terra\n(max)",
    creator: "openai",
    score: 48,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Grok 4.7 (xhigh)",
    creator: "spacexai",
    score: 46,
    color: "#736CD3",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "MiMo-V2.6-Pro",
    creator: "xiaomi",
    score: 46,
    color: "#FF6900",
    weights: "open_weights",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "Qwen 3.6\nMax (0902)",
    creator: "alibaba",
    score: 45,
    color: "#FF6900",
    weights: "proprietary",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "GLM-5.3 (max)",
    creator: "zai",
    score: 45,
    color: "#2563EB",
    weights: "open_restricted",
    modality: "text_only",
    country: "cn",
  },
  {
    name: "GPT-6.1 Terra (xhigh)",
    creator: "openai",
    score: 45,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Step 5 Preview",
    creator: "stepfun",
    score: 44,
    color: "#06B6D4",
    weights: "open_restricted",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "GPT-6.1 Terra (high)",
    creator: "openai",
    score: 44,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Claude Haiku\n5.5 (max)",
    creator: "anthropic",
    score: 43,
    color: "#CC785C",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "GLM-5.3-Flash",
    creator: "zai",
    score: 42,
    color: "#2563EB",
    weights: "open_weights",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "Gemini 3.8\nFlash (high)",
    creator: "google",
    score: 41,
    color: "#34A853",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "GPT-6.1 Terra (medium)",
    creator: "openai",
    score: 41,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "DeepSeek V4.1\nFlash (max)",
    creator: "deepseek",
    score: 39,
    color: "#2243E6",
    weights: "open_weights",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "Muse Spark\nOpen (xhigh)",
    creator: "meta",
    score: 39,
    color: "#0084FF",
    weights: "open_restricted",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Mistral Large\n4 Preview",
    creator: "mistral",
    score: 38,
    color: "#EF4444",
    weights: "proprietary",
    modality: "multimodal",
    country: "fr",
  },
  {
    name: "GPT-6\nLuna (max)",
    creator: "openai",
    score: 38,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "GPT-6.1 Terra (low)",
    creator: "openai",
    score: 36,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Qwen 3.6\n27B (xhigh)",
    creator: "alibaba",
    score: 34,
    color: "#FF6900",
    weights: "open_weights",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "GPT-6.1 Terra\n(non-reasoning)",
    creator: "openai",
    score: 33,
    color: "#171717",
    weights: "proprietary",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "K2 Horizon\n375B A23B",
    creator: "cohere",
    score: 31,
    color: "#1E3A8A",
    weights: "open_weights",
    modality: "text_only",
    country: "ae",
  },
  {
    name: "Beam 1.0",
    creator: "reflection",
    score: 30,
    color: "#14532D",
    weights: "open_weights",
    modality: "text_only",
    country: "us",
  },
  {
    name: "MiniMax-M3",
    creator: "minimax",
    score: 29,
    color: "#EC4899",
    weights: "open_restricted",
    modality: "multimodal",
    country: "cn",
  },
  {
    name: "Nemotron\n3.5 Super VL",
    creator: "nvidia",
    score: 26,
    color: "#65A30D",
    weights: "open_weights",
    modality: "multimodal",
    country: "us",
  },
  {
    name: "Inkling (xhigh)",
    creator: "thinkingmachines",
    score: 25,
    color: "#52525B",
    weights: "open_weights",
    modality: "multimodal",
    country: "us",
  },
];

// ─── Center Intelligence Index Chart Component (from screenshot) ─────────────

export const IntelligenceIndexFullChart: React.FC = () => {
  const [filterTab, setFilterTab] = useState<string>("intelligence-index");

  const filterTabs = [
    { id: "intelligence-index", label: "Intelligence Index" },
    { id: "weights", label: "Open Weights / Proprietary" },
    { id: "inputs", label: "Text Only / Multimodal Inputs" },
    { id: "country", label: "By Country" },
  ];

  const CHART_HEIGHT = 290;
  const maxScore = 60;

  // Title and subtitle per tab
  const getHeaderInfo = () => {
    switch (filterTab) {
      case "weights":
        return {
          title: "Sara Analysis Intelligence Index by Open Weights / Proprietary",
          subtitle:
            "Sara Analysis Intelligence Index v4.3.2 incorporates 10 evaluations: AA-Briefcase v1.1, GDPval-AA v2.1, AutomationBench-AA, Terminal-Bench 4.0, SciCode, Humanity's Last Exam, GDP.pdf, CritPt, AA-Omniscience, AA-LCR v1.1",
        };
      case "inputs":
        return {
          title: "Sara Analysis Intelligence Index by Input Modality",
          subtitle:
            "Sara Analysis Intelligence Index v4.3.2 incorporates 10 evaluations: AA-Briefcase v1.1, GDPval-AA v2.1, AutomationBench-AA, Terminal-Bench 4.0, SciCode, Humanity's Last Exam, GDP.pdf, CritPt, AA-Omniscience, AA-LCR v1.1",
        };
      case "country":
        return {
          title: "Leading Models by Country",
          subtitle: "Sara Analysis Intelligence Index - Leading models",
        };
      case "intelligence-index":
      default:
        return {
          title: "Sara Analysis Intelligence Index",
          subtitle:
            "Sara Analysis Intelligence Index v4.3.2 incorporates 10 evaluations: AA-Briefcase v1.1, GDPval-AA v2.1, AutomationBench-AA, Terminal-Bench 4.0, SciCode, Humanity's Last Exam, GDP.pdf, CritPt, AA-Omniscience, AA-LCR v1.1",
        };
    }
  };

  const headerInfo = getHeaderInfo();

  // Color resolver per tab
  const getBarColor = (item: FullIndexModelItem): string => {
    switch (filterTab) {
      case "weights":
        if (item.weights === "open_weights") return "#4BA3FB";
        if (item.weights === "open_restricted") return "#2256F2";
        return "#111111"; // proprietary
      case "inputs":
        if (item.modality === "text_only") return "#111111";
        return "#4BA3FB"; // multimodal
      case "country":
        if (item.country === "cn") return "#BD1313"; // China mainland
        if (item.country === "fr") return "#EF6308"; // France
        if (item.country === "ae") return "#0A9C53"; // United Arab Emirates
        return "#081938"; // United States
      case "intelligence-index":
      default:
        return item.color;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 py-2 px-1">
      {/* Top Filter Buttons (Border-free, seamlessly emerged) */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
        {filterTabs.map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-neutral-200/80 text-neutral-900 font-semibold"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Header Info Area */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-serif text-[26px] sm:text-[28px] font-normal text-neutral-900 tracking-tight leading-tight">
            {headerInfo.title}
          </h2>
          <span className="text-neutral-400 text-sm select-none">↗</span>
        </div>
        <p className="text-[12px] text-neutral-400 mt-0.5 max-w-2xl leading-relaxed">
          {headerInfo.subtitle}
        </p>
      </div>

      {/* Legend & Watermark */}
      <div className="flex flex-wrap items-center justify-between text-[12px] text-neutral-500 pt-0.5 gap-y-2">
        <div className="flex flex-wrap items-center gap-4">
          {/* Patterned square for No publicly available API */}
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-xs border border-neutral-300/40 relative overflow-hidden inline-block shrink-0"
              style={{
                backgroundColor: "#B0B3B8",
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.7) 2px, rgba(255,255,255,0.7) 4px), repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
              }}
            />
            <span>No publicly available API</span>
          </div>

          {/* Tab-specific legend items */}
          {filterTab === "weights" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111111] inline-block shrink-0" />
                <span>Proprietary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4BA3FB] inline-block shrink-0" />
                <span>Open Weights</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2256F2] inline-block shrink-0" />
                <span>Open Weights (Commercial Use Restricted)</span>
              </div>
            </>
          )}

          {filterTab === "inputs" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4BA3FB] inline-block shrink-0" />
                <span>Multimodal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111111] inline-block shrink-0" />
                <span>Text Only</span>
              </div>
            </>
          )}

          {filterTab === "country" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#081938] inline-block shrink-0" />
                <span>United States</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BD1313] inline-block shrink-0" />
                <span>China mainland</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF6308] inline-block shrink-0" />
                <span>France</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A9C53] inline-block shrink-0" />
                <span>United Arab Emirates</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Canvas: Intelligence Index models (Seamlessly immersed into background) */}
      <div className="relative mt-4 overflow-x-auto no-scrollbar">
        <div className="min-w-[1480px] pl-32 pr-8">
          {/* Vertical Bars */}
          <div
            className="flex items-end justify-between gap-2.5 pt-4 pb-0 relative"
            style={{ height: `${CHART_HEIGHT}px` }}
          >
            {INTELLIGENCE_INDEX_MODELS.map((item, idx) => {
              const ratio = item.score / maxScore;
              const barHeightPx = Math.max(34, Math.round(ratio * (CHART_HEIGHT - 38)));
              const barColor = getBarColor(item);
              const isHatched = Boolean(item.noPublicApi);

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end relative h-full"
                >
                  {/* Score inside bar */}
                  <div
                    className="w-full rounded-t-[4px] flex items-center justify-center origin-bottom relative overflow-hidden"
                    style={{
                      height: `${barHeightPx}px`,
                      backgroundColor: barColor,
                      ...(isHatched
                        ? {
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3.5px, rgba(255, 255, 255, 0.32) 3.5px, rgba(255, 255, 255, 0.32) 7px), repeating-linear-gradient(-45deg, transparent, transparent 3.5px, rgba(0, 0, 0, 0.3) 3.5px, rgba(0, 0, 0, 0.3) 7px)`,
                          }
                        : {}),
                    }}
                  >
                    <span className="text-[11px] font-mono font-bold text-white select-none">
                      {item.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom baseline */}
          <div className="w-full border-b border-neutral-200/50" />

          {/* Creator Brand Logo Row */}
          <div className="flex items-center justify-between gap-2.5 pt-3.5 pb-1">
            {INTELLIGENCE_INDEX_MODELS.map((item, idx) => (
              <div
                key={idx}
                className="flex-1 flex justify-center items-center py-0.5"
                title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <CreatorLogo creator={item.creator} size={19} />
                </div>
              </div>
            ))}
          </div>

          {/* Angled Model Labels: Hanging cleanly below logos, angled at -55deg */}
          <div className="flex justify-between gap-2.5 pt-1 pb-16 h-44">
            {INTELLIGENCE_INDEX_MODELS.map((item, idx) => (
              <div key={idx} className="flex-1 flex justify-center items-start relative">
                <div
                  className="text-[10px] text-neutral-600 font-medium whitespace-nowrap origin-top-right -rotate-55 text-right select-none absolute right-1/2 top-1.5"
                  style={{ width: "160px" }}
                  title={item.name.replace(/\n/g, " ")}
                >
                  {item.name.replace(/\n/g, " ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Task Metrics Datasets (Cost per Task, Time per Task, Tokens per Task) ────

interface TaskCostModelItem {
  name: string;
  creator: string;
  color: string;
  totalCost: number;
  totalLabel: string;
  segments: { value: number; label: string; opacity: number }[];
}

const TASK_COST_MODELS: TaskCostModelItem[] = [
  {
    name: "K2 Horizon\n375B A23B",
    creator: "cohere",
    color: "#1E3A8A",
    totalCost: 0.0,
    totalLabel: "$0.00",
    segments: [{ value: 0.001, label: "", opacity: 1.0 }],
  },
  {
    name: "GPT-6.1 Terra (low)",
    creator: "openai",
    color: "#171717",
    totalCost: 0.05,
    totalLabel: "$0.05",
    segments: [{ value: 0.05, label: "", opacity: 1.0 }],
  },
  {
    name: "GPT-6\nLuna (max)",
    creator: "openai",
    color: "#171717",
    totalCost: 0.07,
    totalLabel: "$0.07",
    segments: [{ value: 0.07, label: "", opacity: 1.0 }],
  },
  {
    name: "GPT-6.1 Terra (medium)",
    creator: "openai",
    color: "#171717",
    totalCost: 0.1,
    totalLabel: "$0.10",
    segments: [{ value: 0.1, label: "", opacity: 1.0 }],
  },
  {
    name: "GPT-6.1 Terra (non-reasoning)",
    creator: "openai",
    color: "#171717",
    totalCost: 0.11,
    totalLabel: "$0.11",
    segments: [{ value: 0.11, label: "", opacity: 1.0 }],
  },
  {
    name: "MiMo-V2.6-Pro",
    creator: "xiaomi",
    color: "#FF6900",
    totalCost: 0.13,
    totalLabel: "$0.13",
    segments: [{ value: 0.13, label: "", opacity: 1.0 }],
  },
  {
    name: "GPT-6.1 Terra (high)",
    creator: "openai",
    color: "#171717",
    totalCost: 0.13,
    totalLabel: "$0.13",
    segments: [{ value: 0.13, label: "", opacity: 1.0 }],
  },
  {
    name: "Nemotron\n3.5 Super VL",
    creator: "nvidia",
    color: "#65A30D",
    totalCost: 0.19,
    totalLabel: "$0.19",
    segments: [{ value: 0.19, label: "", opacity: 1.0 }],
  },
  {
    name: "GPT-6.1 Terra (xhigh)",
    creator: "openai",
    color: "#171717",
    totalCost: 0.19,
    totalLabel: "$0.19",
    segments: [{ value: 0.19, label: "", opacity: 1.0 }],
  },
  {
    name: "Claude Haiku\n5.5 (max)",
    creator: "anthropic",
    color: "#CC785C",
    totalCost: 0.21,
    totalLabel: "$0.21*",
    segments: [{ value: 0.21, label: "", opacity: 1.0 }],
  },
  {
    name: "GLM-5.3-Flash",
    creator: "zai",
    color: "#2563EB",
    totalCost: 0.28,
    totalLabel: "$0.28",
    segments: [{ value: 0.28, label: "", opacity: 1.0 }],
  },
  {
    name: "GPT-6.1 Terra (max)",
    creator: "openai",
    color: "#171717",
    totalCost: 0.4,
    totalLabel: "$0.40",
    segments: [{ value: 0.4, label: "", opacity: 1.0 }],
  },
  {
    name: "DeepSeek V4.1\nFlash (max)",
    creator: "deepseek",
    color: "#2243E6",
    totalCost: 0.49,
    totalLabel: "$0.49",
    segments: [{ value: 0.49, label: "", opacity: 1.0 }],
  },
  {
    name: "MiniMax-M3",
    creator: "minimax",
    color: "#EC4899",
    totalCost: 0.51,
    totalLabel: "$0.51",
    segments: [{ value: 0.51, label: "", opacity: 1.0 }],
  },
  {
    name: "Beam 1.0",
    creator: "reflection",
    color: "#14532D",
    totalCost: 0.57,
    totalLabel: "$0.57",
    segments: [{ value: 0.57, label: "", opacity: 1.0 }],
  },
  {
    name: "Muse Spark\nOpen (xhigh)",
    creator: "meta",
    color: "#0084FF",
    totalCost: 0.84,
    totalLabel: "$0.84",
    segments: [{ value: 0.84, label: "", opacity: 1.0 }],
  },
  {
    name: "Qwen 3.6\n27B (xhigh)",
    creator: "alibaba",
    color: "#FF6900",
    totalCost: 1.01,
    totalLabel: "$1.01",
    segments: [{ value: 1.01, label: "", opacity: 1.0 }],
  },
  {
    name: "Step 5 Preview",
    creator: "stepfun",
    color: "#06B6D4",
    totalCost: 1.03,
    totalLabel: "$1.03",
    segments: [
      { value: 0.41, label: "", opacity: 0.82 },
      { value: 0.62, label: "$0.62", opacity: 1.0 },
    ],
  },
  {
    name: "Mistral Large\n4 Preview",
    creator: "mistral",
    color: "#EF4444",
    totalCost: 1.13,
    totalLabel: "$1.13",
    segments: [
      { value: 0.56, label: "", opacity: 0.82 },
      { value: 0.57, label: "$0.57", opacity: 1.0 },
    ],
  },
  {
    name: "Gemini 3.8\nFlash (high)",
    creator: "google",
    color: "#34A853",
    totalCost: 1.24,
    totalLabel: "$1.24",
    segments: [
      { value: 0.68, label: "", opacity: 0.82 },
      { value: 0.56, label: "$0.56", opacity: 1.0 },
    ],
  },
  {
    name: "Gemini 4\nArgon (high)",
    creator: "google",
    color: "#34A853",
    totalCost: 1.99,
    totalLabel: "$1.99",
    segments: [
      { value: 1.01, label: "", opacity: 0.82 },
      { value: 0.98, label: "$0.98", opacity: 1.0 },
    ],
  },
  {
    name: "GLM-5.3 (max)",
    creator: "zai",
    color: "#2563EB",
    totalCost: 2.01,
    totalLabel: "$2.01",
    segments: [
      { value: 0.49, label: "", opacity: 0.82 },
      { value: 1.52, label: "$1.52", opacity: 1.0 },
    ],
  },
  {
    name: "Kimi K3.1 Pro",
    creator: "kimi",
    color: "#047AFE",
    totalCost: 2.11,
    totalLabel: "$2.11",
    segments: [
      { value: 0.75, label: "", opacity: 0.72 },
      { value: 0.52, label: "$0.52", opacity: 0.85 },
      { value: 0.84, label: "$0.84", opacity: 1.0 },
    ],
  },
  {
    name: "GPT-6\nAstra (max)",
    creator: "openai",
    color: "#171717",
    totalCost: 3.26,
    totalLabel: "$3.26",
    segments: [
      { value: 0.53, label: "$0.53", opacity: 0.65 },
      { value: 0.83, label: "$0.83", opacity: 0.78 },
      { value: 0.7, label: "$0.70", opacity: 0.89 },
      { value: 0.98, label: "$0.98", opacity: 1.0 },
    ],
  },
  {
    name: "Grok 4.7 (xhigh)",
    creator: "spacexai",
    color: "#736CD3",
    totalCost: 3.74,
    totalLabel: "$3.74",
    segments: [
      { value: 0.52, label: "", opacity: 0.72 },
      { value: 1.69, label: "$1.69", opacity: 0.85 },
      { value: 1.53, label: "$1.53", opacity: 1.0 },
    ],
  },
  {
    name: "Muse\nWonder (max)",
    creator: "meta",
    color: "#0084FF",
    totalCost: 4.52,
    totalLabel: "$4.52",
    segments: [
      { value: 0.51, label: "$0.51", opacity: 0.65 },
      { value: 0.57, label: "$0.57", opacity: 0.78 },
      { value: 1.92, label: "$1.92", opacity: 0.89 },
      { value: 1.44, label: "$1.44", opacity: 1.0 },
    ],
  },
  {
    name: "Qwen 3.6\nMax (0902)",
    creator: "alibaba",
    color: "#FF6900",
    totalCost: 5.41,
    totalLabel: "$5.41",
    segments: [
      { value: 0.69, label: "", opacity: 0.72 },
      { value: 1.76, label: "$1.76", opacity: 0.85 },
      { value: 2.96, label: "$2.96", opacity: 1.0 },
    ],
  },
  {
    name: "Claude Sonnet\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    color: "#CC785C",
    totalCost: 5.46,
    totalLabel: "$5.46",
    segments: [
      { value: 0.51, label: "$0.51", opacity: 0.65 },
      { value: 1.47, label: "$1.47", opacity: 0.78 },
      { value: 1.23, label: "$1.23", opacity: 0.89 },
      { value: 2.21, label: "$2.21", opacity: 1.0 },
    ],
  },
  {
    name: "Claude Fable\n5.1 (max with\nfallback)",
    creator: "anthropic",
    color: "#CC785C",
    totalCost: 7.63,
    totalLabel: "$7.63",
    segments: [
      { value: 1.54, label: "$1.54", opacity: 0.65 },
      { value: 2.36, label: "$2.36", opacity: 0.78 },
      { value: 1.86, label: "$1.86", opacity: 0.89 },
      { value: 1.6, label: "$1.60", opacity: 1.0 },
    ],
  },
  {
    name: "Gemini 4\nCarbon (high)",
    creator: "google",
    color: "#34A853",
    totalCost: 7.76,
    totalLabel: "$7.76",
    segments: [
      { value: 1.55, label: "$1.55", opacity: 0.65 },
      { value: 2.45, label: "$2.45", opacity: 0.78 },
      { value: 1.9, label: "$1.90", opacity: 0.89 },
      { value: 1.86, label: "$1.86", opacity: 1.0 },
    ],
  },
];

interface TaskTimeModelItem {
  name: string;
  creator: string;
  color: string;
  minutes: number;
}

const TASK_TIME_MODELS: TaskTimeModelItem[] = [
  { name: "K2 Horizon\n375B A23B", creator: "cohere", color: "#1E3A8A", minutes: 0.7 },
  { name: "Beam 1.0", creator: "reflection", color: "#14532D", minutes: 1.2 },
  { name: "Nemotron\n3.5 Super VL", creator: "nvidia", color: "#65A30D", minutes: 1.7 },
  { name: "Inkling (xhigh)", creator: "thinkingmachines", color: "#52525B", minutes: 2.3 },
  { name: "Muse Spark\nOpen (xhigh)", creator: "meta", color: "#0084FF", minutes: 4.8 },
  { name: "DeepSeek V4.1\nFlash (max)", creator: "deepseek", color: "#2243E6", minutes: 4.9 },
  { name: "Muse\nWonder (max)", creator: "meta", color: "#0084FF", minutes: 5.0 },
  { name: "GPT-6\nLuna (max)", creator: "openai", color: "#171717", minutes: 6.7 },
  { name: "GPT-6\nAstra (max)", creator: "openai", color: "#171717", minutes: 6.9 },
  { name: "MiniMax-M3", creator: "minimax", color: "#EC4899", minutes: 7.0 },
  { name: "Claude Haiku\n5.5 (max)", creator: "anthropic", color: "#CC785C", minutes: 7.1 },
  { name: "Gemini 3.8\nFlash (high)", creator: "google", color: "#34A853", minutes: 7.7 },
  { name: "Step 5 Preview", creator: "stepfun", color: "#06B6D4", minutes: 9.9 },
  { name: "GLM-5.3 (max)", creator: "zai", color: "#2563EB", minutes: 10.1 },
  { name: "GLM-5.3-Flash", creator: "zai", color: "#2563EB", minutes: 11.0 },
  {
    name: "Claude Fable\n5.1 (max with\nfallback)",
    creator: "anthropic",
    color: "#CC785C",
    minutes: 11.9,
  },
  { name: "Mistral Large\n4 Preview", creator: "mistral", color: "#EF4444", minutes: 12.2 },
  { name: "Grok 4.7 (xhigh)", creator: "spacexai", color: "#736CD3", minutes: 13.6 },
  { name: "Kimi K3.1 Pro", creator: "kimi", color: "#047AFE", minutes: 14.2 },
  {
    name: "Claude Sonnet\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    color: "#CC785C",
    minutes: 14.8,
  },
  { name: "MiMo-V2.6-Pro", creator: "xiaomi", color: "#FF6900", minutes: 20.4 },
  { name: "Qwen 3.6\n27B (xhigh)", creator: "alibaba", color: "#FF6900", minutes: 21.1 },
  { name: "Qwen 3.6\nMax (0902)", creator: "alibaba", color: "#FF6900", minutes: 35.9 },
];

interface TaskTokensModelItem {
  name: string;
  creator: string;
  color: string;
  totalK: number;
  totalLabel: string;
  reasoningK: number;
  answerK: number;
  noPublicApi?: boolean;
}

const TASK_TOKENS_MODELS: TaskTokensModelItem[] = [
  {
    name: "Beam 1.0",
    creator: "reflection",
    color: "#14532D",
    totalK: 26,
    totalLabel: "26k",
    reasoningK: 19,
    answerK: 7,
  },
  {
    name: "GPT-6\nAstra (max)",
    creator: "openai",
    color: "#171717",
    totalK: 27,
    totalLabel: "27k",
    reasoningK: 11,
    answerK: 17,
  },
  {
    name: "Inkling (xhigh)",
    creator: "thinkingmachines",
    color: "#52525B",
    totalK: 35,
    totalLabel: "35k",
    reasoningK: 11,
    answerK: 23,
  },
  {
    name: "Muse Spark\nOpen (xhigh)",
    creator: "meta",
    color: "#0084FF",
    totalK: 40,
    totalLabel: "40k",
    reasoningK: 22,
    answerK: 18,
  },
  {
    name: "MiniMax-M3",
    creator: "minimax",
    color: "#EC4899",
    totalK: 48,
    totalLabel: "48k",
    reasoningK: 26,
    answerK: 22,
  },
  {
    name: "Kimi K3.1 Pro",
    creator: "kimi",
    color: "#047AFE",
    totalK: 48,
    totalLabel: "48k",
    reasoningK: 16,
    answerK: 32,
  },
  {
    name: "Nemotron\n3.5 Super VL",
    creator: "nvidia",
    color: "#65A30D",
    totalK: 49,
    totalLabel: "49k",
    reasoningK: 14,
    answerK: 36,
  },
  {
    name: "GPT-6\nLuna (max)",
    creator: "openai",
    color: "#171717",
    totalK: 50,
    totalLabel: "50k",
    reasoningK: 11,
    answerK: 39,
  },
  {
    name: "K2 Horizon\n375B A23B",
    creator: "cohere",
    color: "#1E3A8A",
    totalK: 52,
    totalLabel: "52k",
    reasoningK: 16,
    answerK: 36,
  },
  {
    name: "Muse Wonder\nFull (max)",
    creator: "meta",
    color: "#0084FF",
    totalK: 54,
    totalLabel: "54k",
    reasoningK: 25,
    answerK: 29,
    noPublicApi: true,
  },
  {
    name: "Muse\nWonder (max)",
    creator: "meta",
    color: "#0084FF",
    totalK: 54,
    totalLabel: "54k",
    reasoningK: 26,
    answerK: 29,
  },
  {
    name: "Gemini 4\nArgon (high)",
    creator: "google",
    color: "#34A853",
    totalK: 62,
    totalLabel: "62k",
    reasoningK: 26,
    answerK: 36,
  },
  {
    name: "Step 5 Preview",
    creator: "stepfun",
    color: "#06B6D4",
    totalK: 64,
    totalLabel: "64k",
    reasoningK: 21,
    answerK: 43,
  },
  {
    name: "MiMo-V2.6-Pro",
    creator: "xiaomi",
    color: "#FF6900",
    totalK: 64,
    totalLabel: "64k",
    reasoningK: 27,
    answerK: 38,
  },
  {
    name: "Qwen 3.6\n27B (xhigh)",
    creator: "alibaba",
    color: "#FF6900",
    totalK: 67,
    totalLabel: "67k",
    reasoningK: 19,
    answerK: 48,
  },
  {
    name: "GLM-5.3-Flash",
    creator: "zai",
    color: "#2563EB",
    totalK: 69,
    totalLabel: "69k",
    reasoningK: 22,
    answerK: 47,
  },
  {
    name: "Mistral Large\n4 Preview",
    creator: "mistral",
    color: "#EF4444",
    totalK: 69,
    totalLabel: "69k",
    reasoningK: 17,
    answerK: 52,
  },
  {
    name: "Gemini 3.8\nFlash (high)",
    creator: "google",
    color: "#34A853",
    totalK: 71,
    totalLabel: "71k",
    reasoningK: 28,
    answerK: 43,
  },
  {
    name: "GLM-5.3 (max)",
    creator: "zai",
    color: "#2563EB",
    totalK: 71,
    totalLabel: "71k",
    reasoningK: 22,
    answerK: 49,
  },
  {
    name: "Claude Fable\n5.1 (max with\nfallback)",
    creator: "anthropic",
    color: "#CC785C",
    totalK: 78,
    totalLabel: "78k",
    reasoningK: 31,
    answerK: 47,
  },
  {
    name: "Grok 4.7 (xhigh)",
    creator: "spacexai",
    color: "#736CD3",
    totalK: 81,
    totalLabel: "81k",
    reasoningK: 22,
    answerK: 59,
  },
  {
    name: "DeepSeek V4.1\nFlash (max)",
    creator: "deepseek",
    color: "#2243E6",
    totalK: 89,
    totalLabel: "89k",
    reasoningK: 26,
    answerK: 63,
  },
  {
    name: "Gemini 4\nCarbon (high)",
    creator: "google",
    color: "#34A853",
    totalK: 95,
    totalLabel: "95k",
    reasoningK: 48,
    answerK: 47,
  },
  {
    name: "Qwen 3.6\nMax (0902)",
    creator: "alibaba",
    color: "#FF6900",
    totalK: 108,
    totalLabel: "108k",
    reasoningK: 37,
    answerK: 71,
  },
  {
    name: "Claude Haiku\n5.5 (max)",
    creator: "anthropic",
    color: "#CC785C",
    totalK: 162,
    totalLabel: "162k",
    reasoningK: 33,
    answerK: 129,
  },
  {
    name: "Claude Sonnet\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    color: "#CC785C",
    totalK: 197,
    totalLabel: "197k",
    reasoningK: 51,
    answerK: 147,
  },
];

export const IntelligenceTaskMetricsFullChart: React.FC = () => {
  const CHART_HEIGHT = 290;

  // Cost per Task moved to its own Cost section after Token Use
  const header = {
    title: "Time per Intelligence Index Task",
    subtitle:
      "Weighted average decode time (minutes) per Intelligence Index task - Excludes TTFT and overhead time - Lower is better",
  };

  return (
    <div className="w-full flex flex-col gap-6 py-2 px-1">
      {/* Top Filter Buttons (Border-free, seamlessly emerged) */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
        <span className="px-3.5 py-1.5 rounded-md text-[13px] font-medium bg-neutral-200/80 text-neutral-900 font-semibold select-none">
          Time per Task
        </span>
      </div>

      {/* Header Info Area */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-serif text-[26px] sm:text-[28px] font-normal text-neutral-900 tracking-tight leading-tight">
            {header.title}
          </h2>
        </div>
        <p className="text-[12px] text-neutral-400 mt-0.5 max-w-2xl leading-relaxed">
          {header.subtitle}
        </p>
      </div>

      {/* Chart Canvas */}
      <div className="relative mt-4 overflow-x-auto no-scrollbar">
        <div className="min-w-[1480px] pl-32 pr-8">
          {/* Time per Task View (Cost per Task moved to its own Cost section) */}
          <>
            <div
              className="flex items-end justify-between gap-2.5 pt-4 pb-0 relative"
              style={{ height: `${CHART_HEIGHT}px` }}
            >
              {TASK_TIME_MODELS.map((item, idx) => {
                const maxTime = 38.0;
                const ratio = Math.min(1.0, item.minutes / maxTime);
                const barHeightPx = Math.max(10, Math.round(ratio * (CHART_HEIGHT - 38)));

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end relative h-full"
                  >
                    <span className="text-[10.5px] font-mono leading-none mb-1.5 select-none text-neutral-600 font-semibold">
                      {item.minutes}
                    </span>

                    <div
                      className="w-full rounded-t-[4px] flex items-center justify-center origin-bottom relative overflow-hidden"
                      style={{
                        height: `${barHeightPx}px`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="w-full border-b border-neutral-200/50" />

            <div className="flex items-center justify-between gap-2.5 pt-3.5 pb-1">
              {TASK_TIME_MODELS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex justify-center items-center py-0.5"
                  title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <CreatorLogo creator={item.creator} size={19} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-2.5 pt-1 pb-16 h-44">
              {TASK_TIME_MODELS.map((item, idx) => (
                <div key={idx} className="flex-1 flex justify-center items-start relative">
                  <div
                    className="text-[10px] text-neutral-600 font-medium whitespace-nowrap origin-top-right -rotate-55 text-right select-none absolute right-1/2 top-1.5"
                    style={{ width: "160px" }}
                    title={item.name.replace(/\n/g, " ")}
                  >
                    {item.name.replace(/\n/g, " ")}
                  </div>
                </div>
              ))}
            </div>
          </>

          {/* (Output Tokens per Task lives in its own Token Use section; Cost per Task in its own Cost section) */}
        </div>
      </div>
    </div>
  );
};

// ─── Token Use Section (after Capability Indexes) ─────────────────────────────

export const TokenUseFullSection: React.FC = () => {
  const CHART_HEIGHT = 290;

  const viewTabs: { label: string; available: boolean }[] = [
    { label: "Output Tokens per Task", available: true },
    { label: "Intelligence Index vs. Output Tokens per Task", available: false },
    { label: "Intelligence Index Token Use", available: false },
    { label: "Intelligence Index vs. Token Use", available: false },
  ];

  return (
    <section className="w-full flex flex-col gap-6">
      {/* Section Heading */}
      <div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 bg-black inline-block shrink-0" aria-hidden="true" />
          <h2 className="font-serif text-[30px] sm:text-[32px] leading-none text-neutral-900 tracking-tight">
            Token Use
          </h2>
        </div>
      </div>

      {/* Index Card */}
      <div className="rounded-lg border border-transparent bg-white overflow-hidden">
        {/* View Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-3 overflow-x-auto no-scrollbar">
          {viewTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              disabled={!tab.available}
              className={`px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap ${
                tab.available
                  ? "bg-neutral-100 text-neutral-900 font-semibold cursor-default"
                  : "text-neutral-400 cursor-default"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 pt-6 pb-6">
          {/* Header: Title + Controls */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <h3 className="font-serif text-[24px] text-neutral-900 tracking-tight leading-tight">
                Output Tokens per Intelligence Index Task
              </h3>
              <p className="text-[12.5px] text-neutral-500 mt-2 max-w-[640px] leading-relaxed">
                Weighted average number of output tokens used to run one task in the Artificial
                Analysis Intelligence Index
              </p>
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 min-w-[290px] flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span>
                    {TASK_TOKENS_MODELS.length} of {BENCHMARK_MODELS.length} models
                  </span>
                  <ChevronsUpDown size={14} className="text-neutral-500" />
                </button>
                <button
                  type="button"
                  title="Filter models"
                  aria-label="Filter models"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Filter size={15} />
                </button>
                <button
                  type="button"
                  title="Chart settings"
                  aria-label="Chart settings"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Legend & Watermark */}
          <div className="flex flex-wrap items-center justify-between text-[12px] text-neutral-500 mt-5 gap-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-xs border border-neutral-300/40 relative overflow-hidden inline-block shrink-0"
                  style={{
                    backgroundColor: "#B0B3B8",
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.7) 2px, rgba(255,255,255,0.7) 4px), repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
                  }}
                />
                <span>No publicly available API</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block shrink-0" />
                <span>Answer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#93C5FD] inline-block shrink-0" />
                <span>Reasoning</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="relative mt-5 overflow-x-auto no-scrollbar">
            <div className="min-w-[1480px] pl-24 pr-8">
              <div
                className="flex items-end justify-between gap-2.5 pt-4 pb-0 relative"
                style={{ height: `${CHART_HEIGHT}px` }}
              >
                {TASK_TOKENS_MODELS.map((item, idx) => {
                  const maxTokens = 210.0;
                  const ratio = Math.min(1.0, item.totalK / maxTokens);
                  const barHeightPx = Math.max(16, Math.round(ratio * (CHART_HEIGHT - 38)));
                  const reasoningHeight = Math.max(
                    4,
                    Math.round((item.reasoningK / item.totalK) * barHeightPx)
                  );
                  const answerHeight = Math.max(4, barHeightPx - reasoningHeight);
                  const isHatched = Boolean(item.noPublicApi);

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end relative h-full"
                    >
                      <span className="text-[10.5px] font-mono leading-none mb-1.5 select-none text-neutral-600 font-bold">
                        {item.totalLabel}
                      </span>

                      <div
                        className="w-full rounded-t-[4px] flex flex-col origin-bottom relative overflow-hidden"
                        style={{ height: `${barHeightPx}px` }}
                      >
                        {/* Reasoning top segment */}
                        <div
                          className="w-full flex items-center justify-center relative overflow-hidden"
                          style={{
                            height: `${reasoningHeight}px`,
                            backgroundColor: item.color,
                            opacity: 0.82,
                            ...(isHatched
                              ? {
                                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3.5px, rgba(255, 255, 255, 0.32) 3.5px, rgba(255, 255, 255, 0.32) 7px), repeating-linear-gradient(-45deg, transparent, transparent 3.5px, rgba(0, 0, 0, 0.3) 3.5px, rgba(0, 0, 0, 0.3) 7px)`,
                                }
                              : {}),
                          }}
                        >
                          {reasoningHeight > 14 && (
                            <span className="text-[9px] font-mono font-bold text-white select-none">
                              {item.reasoningK}k
                            </span>
                          )}
                        </div>

                        {/* Answer bottom segment */}
                        <div
                          className="w-full flex items-center justify-center relative overflow-hidden border-t border-white/20"
                          style={{
                            height: `${answerHeight}px`,
                            backgroundColor: item.color,
                            ...(isHatched
                              ? {
                                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3.5px, rgba(255, 255, 255, 0.32) 3.5px, rgba(255, 255, 255, 0.32) 7px), repeating-linear-gradient(-45deg, transparent, transparent 3.5px, rgba(0, 0, 0, 0.3) 3.5px, rgba(0, 0, 0, 0.3) 7px)`,
                                }
                              : {}),
                          }}
                        >
                          {answerHeight > 14 && (
                            <span className="text-[9px] font-mono font-bold text-white select-none">
                              {item.answerK}k
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom baseline */}
              <div className="w-full border-b border-neutral-200/60" />

              {/* Creator Brand Logo Row */}
              <div className="flex items-center justify-between gap-2.5 pt-3.5 pb-1">
                {TASK_TOKENS_MODELS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex justify-center items-center py-0.5"
                    title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <CreatorLogo creator={item.creator} size={19} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Angled Model Labels */}
              <div className="flex justify-between gap-2.5 pt-1 pb-16 h-44">
                {TASK_TOKENS_MODELS.map((item, idx) => (
                  <div key={idx} className="flex-1 flex justify-center items-start relative">
                    <div
                      className="text-[10px] text-neutral-600 font-medium whitespace-nowrap origin-top-right -rotate-55 text-right select-none absolute right-1/2 top-1.5"
                      style={{ width: "160px" }}
                      title={item.name.replace(/\n/g, " ")}
                    >
                      {item.name.replace(/\n/g, " ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Cost Section (after Token Use) ──────────────────────────────────────────

export const CostFullSection: React.FC = () => {
  const CHART_HEIGHT = 290;

  const viewTabs: { label: string; available: boolean }[] = [
    { label: "Cost per Task", available: true },
  ];

  return (
    <section className="w-full flex flex-col gap-6">
      {/* Section Heading */}
      <div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 bg-black inline-block shrink-0" aria-hidden="true" />
          <h2 className="font-serif text-[30px] sm:text-[32px] leading-none text-neutral-900 tracking-tight">
            Cost
          </h2>
        </div>
      </div>

      {/* Index Card */}
      <div className="rounded-lg border border-transparent bg-white overflow-hidden">
        {/* View Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-3 overflow-x-auto no-scrollbar">
          {viewTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              disabled={!tab.available}
              className={`px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap ${
                tab.available
                  ? "bg-neutral-100 text-neutral-900 font-semibold cursor-default"
                  : "text-neutral-400 cursor-default"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 pt-6 pb-6">
          {/* Header: Title + Controls */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <h3 className="font-serif text-[24px] text-neutral-900 tracking-tight leading-tight">
                Cost per Intelligence Index Task
              </h3>
              <p className="text-[12.5px] text-neutral-500 mt-2 max-w-[640px] leading-relaxed">
                Weighted average cost (USD) per Intelligence Index task - Segmented by token type -
                Lower is better
              </p>
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 min-w-[290px] flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span>
                    {TASK_COST_MODELS.length} of {BENCHMARK_MODELS.length} models
                  </span>
                  <ChevronsUpDown size={14} className="text-neutral-500" />
                </button>
                <button
                  type="button"
                  title="Filter models"
                  aria-label="Filter models"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Filter size={15} />
                </button>
                <button
                  type="button"
                  title="Chart settings"
                  aria-label="Chart settings"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Legend & Watermark */}
          <div className="flex flex-wrap items-center justify-between text-[12px] text-neutral-500 mt-5 gap-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B25032] inline-block shrink-0" />
                <span>Answer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CC785C] inline-block shrink-0" />
                <span>Reasoning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9886C] inline-block shrink-0" />
                <span>Cache Write</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E6A68F] inline-block shrink-0" />
                <span>Cache Hit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F0C4B4] inline-block shrink-0" />
                <span>Input</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="relative mt-5 overflow-x-auto no-scrollbar">
            <div className="min-w-[1480px] pl-24 pr-8">
              <div
                className="flex items-end justify-between gap-2.5 pt-4 pb-0 relative"
                style={{ height: `${CHART_HEIGHT}px` }}
              >
                {TASK_COST_MODELS.map((item, idx) => {
                  const maxCost = 8.0;
                  const ratio = Math.min(1.0, item.totalCost / maxCost);
                  const barHeightPx =
                    item.totalCost === 0
                      ? 2
                      : Math.max(10, Math.round(ratio * (CHART_HEIGHT - 38)));

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end relative h-full"
                    >
                      <span className="text-[10.5px] font-mono leading-none mb-1.5 select-none text-neutral-600 font-bold">
                        {item.totalLabel}
                      </span>

                      <div
                        className="w-full rounded-t-[4px] flex flex-col-reverse justify-start origin-bottom relative overflow-hidden"
                        style={{
                          height: `${barHeightPx}px`,
                          backgroundColor: item.color,
                        }}
                      >
                        {item.segments.map((seg, sIdx) => {
                          const segHeight = Math.max(
                            1,
                            Math.round((seg.value / (item.totalCost || 1)) * barHeightPx)
                          );
                          return (
                            <div
                              key={sIdx}
                              className="w-full flex items-center justify-center border-t border-white/20 first:border-t-0"
                              style={{
                                height: `${segHeight}px`,
                                backgroundColor: item.color,
                                filter: `brightness(${0.8 + sIdx * 0.12})`,
                              }}
                            >
                              {segHeight > 16 && seg.label && (
                                <span className="text-[9px] font-mono font-bold text-white/95 select-none">
                                  {seg.label}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom baseline */}
              <div className="w-full border-b border-neutral-200/60" />

              {/* Creator Brand Logo Row */}
              <div className="flex items-center justify-between gap-2.5 pt-3.5 pb-1">
                {TASK_COST_MODELS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex justify-center items-center py-0.5"
                    title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <CreatorLogo creator={item.creator} size={19} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Angled Model Labels */}
              <div className="flex justify-between gap-2.5 pt-1 pb-16 h-44">
                {TASK_COST_MODELS.map((item, idx) => (
                  <div key={idx} className="flex-1 flex justify-center items-start relative">
                    <div
                      className="text-[10px] text-neutral-600 font-medium whitespace-nowrap origin-top-right -rotate-55 text-right select-none absolute right-1/2 top-1.5"
                      style={{ width: "160px" }}
                      title={item.name.replace(/\n/g, " ")}
                    >
                      {item.name.replace(/\n/g, " ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Context Window Section (after Cost) ─────────────────────────────────────

interface ContextWindowModelItem {
  name: string;
  creator: string;
  color: string;
  tokens: number;
  noPublicApi?: boolean;
}

const TASK_CONTEXT_MODELS: ContextWindowModelItem[] = [
  { name: "GPT-6.1 Terra (max)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "GPT-6.1 Terra (xhigh)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "GPT-6.1 Terra (high)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "GPT-6.1 Terra (medium)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "GPT-6.1 Terra (low)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "GPT-6.1 Terra (non-reasoning)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "Muse Spark\nOpen (xhigh)", creator: "meta", color: "#0084FF", tokens: 1000000 },
  { name: "Beam 1.0", creator: "reflection", color: "#14532D", tokens: 1000000 },
  { name: "Kimi K3.1 Pro", creator: "kimi", color: "#047AFE", tokens: 1000000 },
  { name: "Muse\nWonder (max)", creator: "meta", color: "#0084FF", tokens: 1000000 },
  { name: "Step 5 Preview", creator: "stepfun", color: "#06B6D4", tokens: 1000000 },
  { name: "Inkling (xhigh)", creator: "thinkingmachines", color: "#52525B", tokens: 1000000 },
  { name: "GLM-5.3-Flash", creator: "zai", color: "#2563EB", tokens: 1000000 },
  { name: "MiMo-V2.6-Pro", creator: "xiaomi", color: "#FF6900", tokens: 1000000 },
  { name: "MiniMax-M3", creator: "minimax", color: "#EC4899", tokens: 1000000 },
  { name: "GPT-6\nAstra (max)", creator: "openai", color: "#171717", tokens: 1000000 },
  {
    name: "Claude Opus\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    color: "#CC785C",
    tokens: 1000000,
  },
  {
    name: "Claude Fable\n5.1 (max with\nfallback)",
    creator: "anthropic",
    color: "#CC785C",
    tokens: 1000000,
  },
  { name: "GPT-6\nLuna (max)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "Claude Haiku\n5.5 (max)", creator: "anthropic", color: "#CC785C", tokens: 1000000 },
  { name: "Gemini 3.8\nFlash (high)", creator: "google", color: "#34A853", tokens: 1000000 },
  {
    name: "Claude Sonnet\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    color: "#CC785C",
    tokens: 1000000,
  },
  { name: "GPT-6.1\nSol (max)", creator: "openai", color: "#171717", tokens: 1000000 },
  { name: "GLM-5.3 (max)", creator: "zai", color: "#2563EB", tokens: 1000000 },
  { name: "Gemini 4\nCarbon (high)", creator: "google", color: "#34A853", tokens: 1000000 },
  { name: "Gemini 4\nArgon (high)", creator: "google", color: "#34A853", tokens: 1000000 },
  { name: "DeepSeek V4.1\nFlash (max)", creator: "deepseek", color: "#2243E6", tokens: 1000000 },
  { name: "Nemotron\n3.5 Super VL", creator: "nvidia", color: "#65A30D", tokens: 1000000 },
  {
    name: "Muse Wonder\nFull (max)",
    creator: "meta",
    color: "#0084FF",
    tokens: 984000,
    noPublicApi: true,
  },
  { name: "Qwen 3.6\nMax (0902)", creator: "alibaba", color: "#FF6900", tokens: 1000000 },
  { name: "Mistral Large\n4 Preview", creator: "mistral", color: "#EF4444", tokens: 524000 },
  { name: "K2 Horizon\n375B A23B", creator: "cohere", color: "#1E3A8A", tokens: 524000 },
  { name: "Grok 4.7 (xhigh)", creator: "spacexai", color: "#736CD3", tokens: 500000 },
  { name: "Qwen 3.6\n27B (xhigh)", creator: "alibaba", color: "#FF6900", tokens: 256000 },
];

export const ContextWindowFullSection: React.FC = () => {
  const CHART_HEIGHT = 290;
  const maxContext = 1000000;

  const viewTabs: { label: string; available: boolean }[] = [
    { label: "Context Window", available: true },
  ];

  const formatTokens = (tokens: number) =>
    tokens >= 1000000 ? `${tokens / 1000000}M` : `${Math.round(tokens / 1000)}k`;

  return (
    <section className="w-full flex flex-col gap-6">
      {/* Section Heading */}
      <div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 bg-black inline-block shrink-0" aria-hidden="true" />
          <h2 className="font-serif text-[30px] sm:text-[32px] leading-none text-neutral-900 tracking-tight">
            Context Window
          </h2>
        </div>
      </div>

      {/* Index Card */}
      <div className="rounded-lg border border-transparent bg-white overflow-hidden">
        {/* View Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-3 overflow-x-auto no-scrollbar">
          {viewTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              disabled={!tab.available}
              className={`px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap ${
                tab.available
                  ? "bg-neutral-100 text-neutral-900 font-semibold cursor-default"
                  : "text-neutral-400 cursor-default"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 pt-6 pb-6">
          {/* Header: Title + Controls */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <h3 className="font-serif text-[24px] text-neutral-900 tracking-tight leading-tight">
                Context Window
              </h3>
              <p className="text-[12.5px] text-neutral-500 mt-2 max-w-[640px] leading-relaxed">
                Context window: tokens limit - Higher is better
              </p>
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 min-w-[290px] flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span>
                    {TASK_CONTEXT_MODELS.length} of {BENCHMARK_MODELS.length} models
                  </span>
                  <ChevronsUpDown size={14} className="text-neutral-500" />
                </button>
                <button
                  type="button"
                  title="Filter models"
                  aria-label="Filter models"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Filter size={15} />
                </button>
                <button
                  type="button"
                  title="Chart settings"
                  aria-label="Chart settings"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Legend & Watermark */}
          <div className="flex flex-wrap items-center justify-between text-[12px] text-neutral-500 mt-5 gap-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-xs border border-neutral-300/40 relative overflow-hidden inline-block shrink-0"
                  style={{
                    backgroundColor: "#B0B3B8",
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.7) 2px, rgba(255,255,255,0.7) 4px), repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
                  }}
                />
                <span>No publicly available API</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="relative mt-5 overflow-x-auto no-scrollbar">
            <div className="min-w-[1480px] pl-24 pr-8">
              <div
                className="flex items-end justify-between gap-2.5 pt-4 pb-0 relative"
                style={{ height: `${CHART_HEIGHT}px` }}
              >
                {TASK_CONTEXT_MODELS.map((item, idx) => {
                  const ratio = Math.min(1.0, item.tokens / maxContext);
                  const barHeightPx = Math.max(16, Math.round(ratio * (CHART_HEIGHT - 38)));
                  const isHatched = Boolean(item.noPublicApi);

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end relative h-full"
                    >
                      <span className="text-[10.5px] font-mono leading-none mb-1.5 select-none text-neutral-600 font-bold">
                        {formatTokens(item.tokens)}
                      </span>

                      <div
                        className="w-full rounded-t-[4px] origin-bottom relative overflow-hidden"
                        style={{
                          height: `${barHeightPx}px`,
                          backgroundColor: item.color,
                          ...(isHatched
                            ? {
                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3.5px, rgba(255, 255, 255, 0.32) 3.5px, rgba(255, 255, 255, 0.32) 7px), repeating-linear-gradient(-45deg, transparent, transparent 3.5px, rgba(0, 0, 0, 0.3) 3.5px, rgba(0, 0, 0, 0.3) 7px)`,
                              }
                            : {}),
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Bottom baseline */}
              <div className="w-full border-b border-neutral-200/60" />

              {/* Creator Brand Logo Row */}
              <div className="flex items-center justify-between gap-2.5 pt-3.5 pb-1">
                {TASK_CONTEXT_MODELS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex justify-center items-center py-0.5"
                    title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <CreatorLogo creator={item.creator} size={19} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Angled Model Labels */}
              <div className="flex justify-between gap-2.5 pt-1 pb-16 h-44">
                {TASK_CONTEXT_MODELS.map((item, idx) => (
                  <div key={idx} className="flex-1 flex justify-center items-start relative">
                    <div
                      className="text-[10px] text-neutral-600 font-medium whitespace-nowrap origin-top-right -rotate-55 text-right select-none absolute right-1/2 top-1.5"
                      style={{ width: "160px" }}
                      title={item.name.replace(/\n/g, " ")}
                    >
                      {item.name.replace(/\n/g, " ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── End-to-End Response Time Section ────────────────────────────────────────

interface ResponseTimeModelItem {
  name: string;
  creator: string;
  color: string;
  total: number;
  ttft: number;
  input: number;
}

const TASK_RESPONSE_MODELS: ResponseTimeModelItem[] = [
  {
    name: "K2 Horizon\n375B A23B",
    creator: "cohere",
    color: "#1E3A8A",
    total: 4.77,
    ttft: 2.29,
    input: 2.29,
  },
  {
    name: "Nemotron\n3.5 Super VL",
    creator: "nvidia",
    color: "#65A30D",
    total: 6.83,
    ttft: 0.73,
    input: 0.73,
  },
  { name: "Beam 1.0", creator: "reflection", color: "#14532D", total: 9.16, ttft: 0.9, input: 0.9 },
  {
    name: "DeepSeek V4.1\nFlash (max)",
    creator: "deepseek",
    color: "#2243E6",
    total: 11.94,
    ttft: 0.91,
    input: 0,
  },
  {
    name: "Inkling (xhigh)",
    creator: "thinkingmachines",
    color: "#52525B",
    total: 13.94,
    ttft: 1.8,
    input: 0,
  },
  {
    name: "Kimi K3.1 Pro",
    creator: "kimi",
    color: "#047AFE",
    total: 15.2,
    ttft: 4.3,
    input: 0.2,
  },
  {
    name: "Muse Spark\nOpen (xhigh)",
    creator: "meta",
    color: "#0084FF",
    total: 18.58,
    ttft: 0.76,
    input: 0,
  },
  {
    name: "MiniMax-M3",
    creator: "minimax",
    color: "#EC4899",
    total: 21.42,
    ttft: 1.04,
    input: 0.04,
  },
  {
    name: "Gemini 3.8\nFlash (high)",
    creator: "google",
    color: "#34A853",
    total: 27.74,
    ttft: 24.41,
    input: 0.41,
  },
  {
    name: "Step 5 Preview",
    creator: "stepfun",
    color: "#06B6D4",
    total: 29.18,
    ttft: 2.21,
    input: 2.21,
  },
  { name: "GLM-5.3 (max)", creator: "zai", color: "#2563EB", total: 29.43, ttft: 2.52, input: 0 },
  {
    name: "Mistral Large\n4 Preview",
    creator: "mistral",
    color: "#EF4444",
    total: 35.14,
    ttft: 26.8,
    input: 1.66,
  },
  {
    name: "GLM-5.3-Flash",
    creator: "zai",
    color: "#2563EB",
    total: 35.17,
    ttft: 2.71,
    input: 2.71,
  },
  {
    name: "Muse Wonder\n(max)",
    creator: "meta",
    color: "#0084FF",
    total: 50.16,
    ttft: 35.99,
    input: 0,
  },
  {
    name: "MiMo-V2.6-Pro",
    creator: "xiaomi",
    color: "#FF6900",
    total: 56.2,
    ttft: 41.6,
    input: 4.15,
  },
  {
    name: "Grok 4.7 (xhigh)",
    creator: "spacexai",
    color: "#736CD3",
    total: 58.31,
    ttft: 53.17,
    input: 0.17,
  },
  {
    name: "Qwen 3.6\n27B (xhigh)",
    creator: "alibaba",
    color: "#FF6900",
    total: 63.29,
    ttft: 3.99,
    input: 0,
  },
  {
    name: "Qwen 3.6\nMax (0902)",
    creator: "alibaba",
    color: "#FF6900",
    total: 70.75,
    ttft: 3.12,
    input: 0.12,
  },
  {
    name: "GPT-6\nLuna (max)",
    creator: "openai",
    color: "#171717",
    total: 102.88,
    ttft: 98.84,
    input: 0,
  },
  {
    name: "Claude Fable\n5.1 (max with\nfallback)",
    creator: "anthropic",
    color: "#CC785C",
    total: 180.66,
    ttft: 173.57,
    input: 0,
  },
  {
    name: "GPT-6.1\nSol (max)",
    creator: "openai",
    color: "#171717",
    total: 249.38,
    ttft: 241.6,
    input: 0,
  },
  {
    name: "GPT-6\nAstra (max)",
    creator: "openai",
    color: "#171717",
    total: 292.88,
    ttft: 285.18,
    input: 0.18,
  },
  {
    name: "Claude Haiku\n5.5 (max)",
    creator: "anthropic",
    color: "#CC785C",
    total: 315.7,
    ttft: 313.57,
    input: 0,
  },
  {
    name: "Claude Sonnet\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    color: "#CC785C",
    total: 383.92,
    ttft: 380.34,
    input: 0.34,
  },
  {
    name: "Claude Opus\n5.5 (max\nwith fallback)",
    creator: "anthropic",
    color: "#CC785C",
    total: 562.07,
    ttft: 556.94,
    input: 0,
  },
];

// ─── Response Time by Prompt Type Data ──────────────────────────────────────

interface PromptTypeModelItem {
  name: string;
  creator: string;
  segments: number[];
  total: number;
}

const PROMPT_TYPE_FACTORS = [0.3, 0.18, 0.32, 0.2];

const TASK_PROMPT_MODELS: PromptTypeModelItem[] = TASK_RESPONSE_MODELS.map((m) => {
  const stack = m.total * 1.58;
  const segments = PROMPT_TYPE_FACTORS.map((f) => Math.round(stack * f * 10) / 10);
  return {
    name: m.name,
    creator: m.creator,
    segments,
    total: Math.round(segments.reduce((a, b) => a + b, 0) * 10) / 10,
  };
}).sort((a, b) => a.total - b.total);

// ─── Response Time Over Time Data ───────────────────────────────────────────

const RESPONSE_TIME_OVER_TIME = TASK_RESPONSE_MODELS.map((m, idx) => ({
  name: m.name,
  creator: m.creator,
  color: m.color,
  points: Array.from({ length: 7 }, (_, d) => {
    const wave = Math.sin((idx + 1) * 2.1 + d * 1.7) * 0.5 + Math.sin(idx * 0.9 - d * 1.3) * 0.25;
    return Math.max(1.5, Math.min(795, Math.round(m.total * (1 + 0.4 * wave) * 10) / 10));
  }),
}));

const smoothLinePath = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
};

export const ResponseTimeFullSection: React.FC = () => {
  const CHART_HEIGHT = 290;
  const maxTotal = Math.max(...TASK_RESPONSE_MODELS.map((m) => m.total));
  const maxPromptTotal = Math.max(...TASK_PROMPT_MODELS.map((m) => m.total));

  const [view, setView] = useState<"response" | "prompt" | "time">("response");

  const viewTabs: { id: "response" | "prompt" | "time"; label: string }[] = [
    { id: "response", label: "End-to-End Response Time" },
    { id: "prompt", label: "End-to-End Response Time by Prompt Type" },
    { id: "time", label: "End-to-End Response Time Over Time" },
  ];

  const title =
    view === "response"
      ? "End-to-End Response Time"
      : view === "prompt"
        ? "End-to-End Response Time by Prompt Type"
        : "End-to-End Response Time, Over Time";

  const legend = [
    { label: "Outputting time", color: "#171717" },
    { label: "\u2018Thinking\u2019 time (reasoning models)", color: "#71717A" },
    { label: "Input processing time", color: "#D4D4D4" },
  ];

  const promptLegend = [
    { label: "1k input tokens", color: "#C7B8F8" },
    { label: "10k input tokens", color: "#A98BF2" },
    { label: "100k input tokens", color: "#7C4DDB" },
    { label: "1k input tokens (10 parallel queries)", color: "#4A1D96" },
  ];

  return (
    <section className="w-full flex flex-col gap-6">
      {/* Section Heading */}
      <div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 bg-black inline-block shrink-0" aria-hidden="true" />
          <h2 className="font-serif text-[30px] sm:text-[32px] leading-none text-neutral-900 tracking-tight">
            End-to-End Response Time
          </h2>
        </div>
      </div>

      {/* Index Card */}
      <div className="rounded-lg border border-transparent bg-white overflow-hidden">
        {/* View Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-3 overflow-x-auto no-scrollbar">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap ${
                view === tab.id
                  ? "bg-neutral-100 text-neutral-900 font-semibold cursor-default"
                  : "text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 pt-6 pb-6">
          {/* Header: Title + Controls */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <h3 className="font-serif text-[24px] text-neutral-900 tracking-tight leading-tight">
                {title}
              </h3>
              <p className="text-[12.5px] text-neutral-500 mt-2 max-w-[640px] leading-relaxed">
                Seconds to output 500 tokens, including reasoning model {"\u2018"}thinking{"\u2019"}{" "}
                time - Lower is better
              </p>
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 min-w-[290px] flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span>
                    {TASK_RESPONSE_MODELS.length} of {BENCHMARK_MODELS.length} models
                  </span>
                  <ChevronsUpDown size={14} className="text-neutral-500" />
                </button>
                <button
                  type="button"
                  title="Filter models"
                  aria-label="Filter models"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Filter size={15} />
                </button>
                <button
                  type="button"
                  title="Chart settings"
                  aria-label="Chart settings"
                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={15} />
                </button>
              </div>
            </div>
          </div>

          {view === "response" && (
            <>
              {/* Legend & Watermark */}
              <div className="flex flex-wrap items-center justify-between text-[12px] text-neutral-500 mt-5 gap-y-2">
                <div className="flex flex-wrap items-center gap-4">
                  {legend.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="relative mt-5 overflow-x-auto no-scrollbar">
                <div className="min-w-[1480px] pl-24 pr-8">
                  <div
                    className="flex items-end justify-between gap-2.5 pt-4 pb-0 relative"
                    style={{ height: `${CHART_HEIGHT}px` }}
                  >
                    {TASK_RESPONSE_MODELS.map((item, idx) => {
                      const barHeightPx = Math.max(
                        4,
                        Math.round((item.total / maxTotal) * (CHART_HEIGHT - 38))
                      );
                      const outputH = Math.max(
                        1,
                        Math.round(((item.total - item.ttft) / item.total) * barHeightPx)
                      );
                      const thinkingH = Math.max(
                        0,
                        Math.round(((item.ttft - item.input) / item.total) * barHeightPx)
                      );
                      const inputH = Math.max(0, barHeightPx - outputH - thinkingH);
                      const showInnerLabel = thinkingH >= 11;

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center justify-end relative h-full"
                        >
                          <span className="text-[10.5px] font-mono leading-none mb-1.5 select-none text-neutral-600 font-bold">
                            {item.total.toFixed(1)}
                          </span>

                          <div
                            className="w-full rounded-t-[4px] origin-bottom relative overflow-hidden"
                            style={{ height: `${barHeightPx}px` }}
                          >
                            {showInnerLabel && (
                              <span
                                className="absolute left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-white leading-none whitespace-nowrap select-none"
                                style={{ top: `${outputH + 3}px` }}
                              >
                                {item.ttft.toFixed(1)}
                              </span>
                            )}
                            <div style={{ height: `${outputH}px`, backgroundColor: item.color }} />
                            <div
                              style={{
                                height: `${thinkingH}px`,
                                backgroundColor: `${item.color}B3`,
                              }}
                            />
                            <div
                              style={{ height: `${inputH}px`, backgroundColor: `${item.color}55` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom baseline */}
                  <div className="w-full border-b border-neutral-200/60" />

                  {/* Creator Brand Logo Row */}
                  <div className="flex items-center justify-between gap-2.5 pt-3.5 pb-1">
                    {TASK_RESPONSE_MODELS.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex-1 flex justify-center items-center py-0.5"
                        title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          <CreatorLogo creator={item.creator} size={19} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Angled Model Labels */}
                  <div className="flex justify-between gap-2.5 pt-1 pb-16 h-44">
                    {TASK_RESPONSE_MODELS.map((item, idx) => (
                      <div key={idx} className="flex-1 flex justify-center items-start relative">
                        <div
                          className="text-[10px] text-neutral-600 font-medium whitespace-nowrap origin-top-right -rotate-55 text-right select-none absolute right-1/2 top-1.5"
                          style={{ width: "160px" }}
                          title={item.name.replace(/\n/g, " ")}
                        >
                          {item.name.replace(/\n/g, " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "prompt" && (
            <>
              {/* Legend & Watermark */}
              <div className="flex flex-wrap items-center justify-between text-[12px] text-neutral-500 mt-5 gap-y-2">
                <div className="flex flex-wrap items-center gap-4">
                  {promptLegend.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="relative mt-5 overflow-x-auto no-scrollbar">
                <div className="min-w-[1480px] pl-24 pr-8">
                  <div
                    className="flex items-end justify-between gap-2.5 pt-4 pb-0 relative"
                    style={{ height: `${CHART_HEIGHT}px` }}
                  >
                    {TASK_PROMPT_MODELS.map((item, idx) => {
                      const barHeightPx = Math.max(
                        5,
                        Math.round((item.total / maxPromptTotal) * (CHART_HEIGHT - 38))
                      );
                      const heights = item.segments.map((s) =>
                        Math.max(1, Math.round((s / item.total) * barHeightPx))
                      );
                      heights[heights.length - 1] +=
                        barHeightPx - heights.reduce((a, b) => a + b, 0);

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center justify-end relative h-full"
                        >
                          <span className="text-[9px] font-mono leading-none mb-1 select-none text-neutral-600 font-bold">
                            {item.total.toFixed(1)}
                          </span>

                          <div
                            className="w-full rounded-t-[4px] origin-bottom relative overflow-hidden"
                            style={{ height: `${barHeightPx}px` }}
                          >
                            {item.segments.map((_, si) => (
                              <div
                                key={si}
                                style={{
                                  height: `${heights[si]}px`,
                                  backgroundColor: promptLegend[si].color,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom baseline */}
                  <div className="w-full border-b border-neutral-200/60" />

                  {/* Creator Brand Logo Row */}
                  <div className="flex items-center justify-between gap-2.5 pt-3.5 pb-1">
                    {TASK_PROMPT_MODELS.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex-1 flex justify-center items-center py-0.5"
                        title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          <CreatorLogo creator={item.creator} size={19} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Angled Model Labels */}
                  <div className="flex justify-between gap-2.5 pt-1 pb-16 h-44">
                    {TASK_PROMPT_MODELS.map((item, idx) => (
                      <div key={idx} className="flex-1 flex justify-center items-start relative">
                        <div
                          className="text-[10px] text-neutral-600 font-medium whitespace-nowrap origin-top-right -rotate-55 text-right select-none absolute right-1/2 top-1.5"
                          style={{ width: "160px" }}
                          title={item.name.replace(/\n/g, " ")}
                        >
                          {item.name.replace(/\n/g, " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "time" && (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-[#EEF0FF] px-4 py-3 mt-5">
                <span className="text-[12.5px] text-neutral-700">
                  Showing the last 7 days. Upgrade to Pro for full history.
                </span>
                <button
                  type="button"
                  className="h-8 px-3.5 rounded-md bg-violet-600 text-white text-[12px] font-medium hover:bg-violet-700 transition-colors cursor-pointer shrink-0"
                >
                  Upgrade
                </button>
              </div>

              {/* Series Legend */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 text-[11.5px] text-neutral-600">
                {RESPONSE_TIME_OVER_TIME.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="whitespace-nowrap">{s.name.replace(/\n/g, " ")}</span>
                  </div>
                ))}
              </div>

              {/* Line Chart */}
              <div className="relative mt-4 overflow-x-auto no-scrollbar">
                <div className="min-w-[1480px] relative">
                  <svg
                    viewBox="0 0 1500 380"
                    className="w-full"
                    role="img"
                    aria-label="End-to-End Response Time Over Time"
                  >
                    {[0, 200, 400, 600, 800].map((v) => {
                      const y = 16 + (1 - v / 800) * 334;
                      return (
                        <g key={v}>
                          <line x1={56} x2={1464} y1={y} y2={y} stroke="#F2F2F2" strokeWidth={1} />
                          <text x={46} y={y + 4} textAnchor="end" fontSize={11} fill="#9CA3AF">
                            {v}
                          </text>
                        </g>
                      );
                    })}

                    {RESPONSE_TIME_OVER_TIME.map((s) => {
                      const pts = s.points.map((v, d) => ({
                        x: 56 + (d / 6) * 1408,
                        y: 16 + (1 - v / 800) * 334,
                      }));
                      return (
                        <g key={s.name}>
                          <path
                            d={smoothLinePath(pts)}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={1.2}
                            strokeOpacity={0.9}
                          />
                          {pts.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r={2.1} fill={s.color} />
                          ))}
                        </g>
                      );
                    })}

                    {["Oct 11", "Oct 12", "Oct 13", "Oct 14", "Oct 15", "Oct 16", "Oct 17"].map(
                      (label, d) => (
                        <text
                          key={label}
                          x={56 + (d / 6) * 1408}
                          y={372}
                          textAnchor="middle"
                          fontSize={11}
                          fill="#737373"
                        >
                          {label}
                        </text>
                      )
                    )}
                  </svg>
                </div>
              </div>

              {/* Range Slider */}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[11px] text-neutral-500 shrink-0">Oct 11</span>
                <div className="relative flex-1 h-3.5 flex items-center">
                  <div className="w-full h-px bg-neutral-300" />
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-neutral-400 bg-white" />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-neutral-400 bg-white" />
                </div>
                <span className="text-[11px] text-neutral-500 shrink-0">Oct 17</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export const BenchmarkBarCard: React.FC<{
  config: MetricCardConfig;
  align?: "left" | "right";
}> = ({ config, align = "left" }) => {
  const { title, subtitle, accentColor, metricLabel, items } = config;

  // Chart dimensions & scaling (+10% size increase for maximum clarity)
  const CHART_HEIGHT = 245;
  const values = items.map((it) => it.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const isLowerBetter = metricLabel === "Lower is better";

  const gridColsStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col justify-between overflow-hidden py-2 px-1">
      {/* Card Header (alternating left / right alignment) */}
      <div className={align === "right" ? "text-right" : "text-left"}>
        <div
          className={`flex items-center gap-2.5 mb-1 ${align === "right" ? "justify-end flex-row-reverse" : "justify-start"}`}
        >
          <h2 className="font-serif text-[26px] sm:text-[28px] font-normal text-neutral-900 tracking-tight leading-tight">
            {title}
          </h2>
          <span
            className="w-4 h-4 rounded-xs shrink-0 inline-block"
            style={{ backgroundColor: accentColor }}
          />
        </div>
        <div
          className={`flex items-center text-[12.5px] text-neutral-400 mt-0.5 ${align === "right" ? "justify-end" : "justify-between"}`}
        >
          <p className="truncate">
            {subtitle} · {metricLabel}
          </p>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-8 relative w-full">
        {/* Vertical Bars */}
        <div
          className="gap-2 sm:gap-2.5 pt-4 pb-1 relative w-full"
          style={{ height: `${CHART_HEIGHT}px`, ...gridColsStyle }}
        >
          {items.map((item, idx) => {
            const barColor = item.color || getCreatorColor(item.creator);

            // Height normalization
            let ratio = 0.5;
            if (maxVal === minVal) {
              ratio = 0.8;
            } else if (isLowerBetter) {
              ratio = (item.value - minVal) / (maxVal - minVal);
              ratio = 0.16 + ratio * 0.84;
            } else {
              ratio = (item.value - minVal * 0.7) / (maxVal - minVal * 0.7);
              ratio = Math.max(0.2, Math.min(1.0, ratio));
            }
            const barHeightPx = Math.round(ratio * (CHART_HEIGHT - 48));

            return (
              <div
                key={idx}
                className="min-w-0 flex flex-col items-center justify-end relative h-full"
              >
                {/* Value text above bar */}
                <span className="text-[10.5px] sm:text-[11px] font-mono leading-none mb-2 select-none text-neutral-600 font-medium truncate max-w-full text-center">
                  {item.label}
                </span>

                {/* Bar pill with rank number */}
                <div
                  className="w-full rounded-t-sm flex items-start justify-center pt-1.5 origin-bottom relative overflow-hidden"
                  style={{
                    height: `${barHeightPx}px`,
                    backgroundColor: barColor,
                  }}
                >
                  {/* Inside rank number */}
                  {barHeightPx > 36 && (
                    <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-white/95 select-none relative z-10">
                      {idx + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom baseline */}
        <div className="w-full border-b border-neutral-200" />

        {/* Creator Brand Logo Row */}
        <div className="gap-2 sm:gap-2.5 pt-3.5 w-full" style={gridColsStyle}>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="min-w-0 flex justify-center items-center py-1"
              title={`${item.name.replace(/\n/g, " ")} (${item.creator})`}
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                <CreatorLogo creator={item.creator} size={18} />
              </div>
            </div>
          ))}
        </div>

        {/* Clean Multiline Model Labels (Centered under each bar, zero collision) */}
        <div className="gap-2 sm:gap-2.5 pt-2.5 pb-2 w-full" style={gridColsStyle}>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="min-w-0 flex flex-col items-center text-center px-0.5"
              title={item.name.replace(/\n/g, " ")}
            >
              <span className="text-[9.5px] sm:text-[10px] leading-[1.3] text-neutral-600 font-medium whitespace-pre-line break-words w-full select-none text-center block">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Frequently Asked Questions (after the Indexes section) ──────────────────

const MODELS_FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Which is the most intelligent AI model?",
    a: "Gemini 4 Carbon (high) currently leads the Sara Analysis Intelligence Index with a score of 59, out of 274 models evaluated.",
  },
  {
    q: "What are the top AI models?",
    a: "The top AI models by Intelligence Index are: 1. Gemini 4 Carbon (high) (59), 2. Claude Opus 5.5 (max with fallback) (58), 3. Claude Sonnet 5.5 (max with fallback) (56), 4. Muse Wonder Full (max) (56), and 5. Kimi K3.1 Pro (55).",
  },
  {
    q: "Which is the fastest AI model?",
    a: "Celeris-1 is the fastest at 1,442.8 tokens per second, followed by K2 Horizon 375B A23B (1,009.4 t/s) and Mercury 2.5 (776 t/s).",
  },
  {
    q: "Which is the cheapest AI model?",
    a: "K2 Horizon 375B A23B, Command A+, and North Mini Code are the most affordable at $0.00 per 1M tokens (blended).",
  },
  {
    q: "Which AI model has the lowest latency?",
    a: "North Mini Code has the lowest time to first token at 0.46s, followed by Command A+ (0.50s) and Granite 4.2 3B (0.53s).",
  },
  {
    q: "Which is the best open weights AI model?",
    a: "MiMo-V2.6-Pro is the highest-ranked open weights model with an Intelligence Index score of 46. There are 129 open weights models out of 273 total evaluated.",
  },
  {
    q: "What are the top open weights AI models?",
    a: "The top open weights AI models by Intelligence Index are: 1. MiMo-V2.6-Pro (46), 2. GLM-5.3 (max) (45), and 3. Step 5 Preview (44).",
  },
  {
    q: "Which is the best reasoning model?",
    a: "Claude Opus 5.5 (max with fallback) leads among 118 reasoning models with an Intelligence Index score of 58. Reasoning models use extended thinking to work through complex problems before providing answers.",
  },
  {
    q: "How are AI models compared on Sara Analysis?",
    a: "Models are compared across multiple dimensions including intelligence (quality), pricing, output speed (tokens per second), latency (time to first token), end-to-end response time, and context window size. Performance metrics are measured directly using standardized prompts across 273 models.",
  },
  {
    q: "How do I compare a specific model against others?",
    a: "Click any model name or row in the charts to open its detailed metrics, or use the Head-to-Head Radar and the Optima Recommender to compare models side by side across intelligence, speed, price, and latency.",
  },
];

const ModelsOverviewFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({});
  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section className="w-full flex flex-col gap-6 py-2 px-1">
      <h2 className="font-serif text-[22px] sm:text-[24px] font-normal text-neutral-900 tracking-tight leading-tight">
        Frequently Asked Questions
      </h2>

      <div className="border-t border-neutral-200 divide-y divide-neutral-200/80">
        {MODELS_FAQ_ITEMS.map((item, idx) => {
          const isOpen = Boolean(openFaq[idx]);
          return (
            <div key={idx} className="py-3.5">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between text-left text-xs sm:text-[13px] font-semibold text-neutral-900 hover:text-[#0047FF] transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                {isOpen ? (
                  <Minus size={14} className="text-neutral-500 shrink-0 ml-4" />
                ) : (
                  <Plus size={14} className="text-neutral-500 shrink-0 ml-4" />
                )}
              </button>
              {isOpen && (
                <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed pt-2.5 pb-1 max-w-4xl">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ─── Main Models Overview View ────────────────────────────────────────────────

export const ModelsOverviewView: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-[1560px] mx-auto pb-16 animate-in fade-in duration-150 px-2 sm:px-6">
      {/* Alternating Staggered Layout (+10% width): Left 55% -> Right 55% -> Left 55% */}
      <div className="w-full flex flex-col gap-16">
        {/* 1. Intelligence: 55% width on the left */}
        <div className="w-full lg:w-[55%] self-start pr-0 lg:pr-6">
          <BenchmarkBarCard config={LANGUAGE_MODELS_DATA.intelligence} align="left" />
        </div>

        <div className="w-full border-b border-transparent" />

        {/* 2. Speed: 55% width on the right */}
        <div className="w-full lg:w-[55%] self-end pl-0 lg:pl-6">
          <BenchmarkBarCard config={LANGUAGE_MODELS_DATA.speed} align="right" />
        </div>

        <div className="w-full border-b border-transparent" />

        {/* 3. Cost per Task: 55% width concurrent back on the left */}
        <div className="w-full lg:w-[55%] self-start pr-0 lg:pr-6">
          <BenchmarkBarCard config={LANGUAGE_MODELS_DATA.cost} align="left" />
        </div>

        <div className="w-full border-b border-transparent" />

        {/* 4. Sara Analysis Intelligence Index */}
        <div className="w-full max-w-[1560px] mx-auto flex justify-center">
          <IntelligenceIndexFullChart />
        </div>

        <div className="w-full border-b border-transparent" />

        {/* 5. Task Metrics for the Intelligence Index: Down after intelligence */}
        <div className="w-full max-w-[1560px] mx-auto flex justify-center">
          <IntelligenceTaskMetricsFullChart />
        </div>

        <div className="w-full border-b border-transparent my-6" />

        {/* 6. Frontier Language Model Intelligence, Over Time */}
        <div className="w-full max-w-[1560px] mx-auto flex justify-center">
          <FrontierIntelligenceOverTimeChart />
        </div>

        <div className="w-full border-b border-transparent my-6" />

        {/* 7. Sara Analysis Coding Agent Indexes */}
        <div className="w-full max-w-[1560px] mx-auto flex justify-center">
          <CodingAgentIndexesFullChart />
        </div>

        <div className="w-full border-b border-transparent my-6" />

        {/* 8. Capability Indexes (Finance & Accounting, Strategy & Ops, Legal, Healthcare & Medical, Engineering, Economics) */}
        <div className="w-full">
          <CapabilityIndexesSection />
        </div>

        <div className="w-full border-b border-transparent my-6" />

        {/* 9. Token Use */}
        <div className="w-full">
          <TokenUseFullSection />
        </div>

        <div className="w-full border-b border-transparent my-6" />

        {/* 10. Cost */}
        <div className="w-full">
          <CostFullSection />
        </div>

        <div className="w-full border-b border-transparent my-6" />

        {/* 11. Context Window */}
        <div className="w-full">
          <ContextWindowFullSection />
        </div>

        <div className="w-full border-b border-transparent my-6" />

        {/* 12. End-to-End Response Time */}
        <div className="w-full">
          <ResponseTimeFullSection />
        </div>
      </div>

      <ModelsOverviewFaq />
    </div>
  );
};

export { FrontierIntelligenceOverTimeChart } from "./FrontierIntelligenceOverTimeChart";
export { CodingAgentIndexesFullChart } from "./CodingAgentIndexesFullChart";
