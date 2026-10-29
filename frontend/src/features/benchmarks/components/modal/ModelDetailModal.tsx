import React, { useEffect, useState } from "react";
import { X, Sparkles, Zap, Gauge, Coins, Server, Layers, Clock, ArrowUpRight } from "lucide-react";
import type { AIModelBenchmark } from "../types";
import { getProvidersForModel } from "../data/benchmarkProviders";
import { CreatorLogo } from "../ui/CreatorLogo";

export interface ModelDetailModalProps {
  model: AIModelBenchmark | null;
  isOpen: boolean;
  onClose: () => void;
  onCompare?: (model: AIModelBenchmark) => void;
  onNavigateToProviders?: (modelId: string) => void;
}

type ModalTab = "overview" | "benchmarks" | "performance" | "pricing" | "providers";

export const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
  model,
  isOpen,
  onClose,
  onCompare,
  onNavigateToProviders,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab when model changes
  useEffect(() => {
    setActiveTab("overview");
  }, [model?.id]);

  if (!isOpen || !model) return null;

  const providers = getProvidersForModel(model.id);

  const tabs: {
    id: ModalTab;
    label: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }[] = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "benchmarks", label: "Benchmarks", icon: Sparkles },
    { id: "performance", label: "Speed & Latency", icon: Zap },
    { id: "pricing", label: "Pricing & Tokens", icon: Coins },
    { id: "providers", label: `Providers (${providers.length})`, icon: Server },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${model.name} details`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/50 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <CreatorLogo creator={model.creator} size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{model.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {model.creatorDisplayName}
                </span>
                {model.weightsType === "open-weights" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Open Weights
                  </span>
                ) : model.weightsType === "commercial-restricted" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    Restricted License
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Proprietary
                  </span>
                )}
                {model.isReasoningModel && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#BEDBFF]/30 text-[#0047FF] border border-[#BEDBFF] flex items-center gap-1">
                    <Sparkles size={11} />
                    Extended Thinking
                  </span>
                )}
                {model.qualityIndexVersion && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Sara Analysis {model.qualityIndexVersion}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl line-clamp-2">{model.summary}</p>
              {(model.officialUrl || model.benchmarkSourceUrl) && (
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-medium">
                  {model.officialUrl && (
                    <a
                      href={model.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Google announcement
                    </a>
                  )}
                  {model.benchmarkSourceUrl && (
                    <a
                      href={model.benchmarkSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Sara Analysis benchmarks
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onCompare && (
              <button
                type="button"
                onClick={() => {
                  onCompare(model);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
              >
                Compare
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
            >
              <X size={17} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div
          role="tablist"
          aria-label="Model detail tabs"
          className="flex items-center px-6 border-b border-slate-100 gap-2 bg-white shrink-0 overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap rounded-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
                  isActive
                    ? "border-[#0047FF] text-[#0047FF] font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar text-xs">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Intelligence Index
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                    {model.quality.intelligenceIndex ?? "—"}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Output Speed
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                    {model.performance.outputSpeedTokensPerSec.median}
                    <span className="text-xs text-slate-400 font-normal"> tok/s</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Latency (TTFT)
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                    {model.performance.ttftSeconds.median}
                    <span className="text-xs text-slate-400 font-normal"> s</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Blended Cost
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                    ${model.pricing.blendedPricePer1M.toFixed(2)}
                    <span className="text-xs text-slate-400 font-normal"> / 1M</span>
                  </div>
                  {model.pricing.sourceBlendedPricePer1M != null &&
                    model.pricing.sourceBlendedPriceBasis && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        Sara Analysis blend: ${model.pricing.sourceBlendedPricePer1M.toFixed(2)} /
                        1M · {model.pricing.sourceBlendedPriceBasis}
                      </div>
                    )}
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  Technical Specifications
                </h3>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-500">Context Window</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {model.contextWindowTokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-500">Max Output Length</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {model.maxOutputTokens == null
                        ? "Not published"
                        : `${model.maxOutputTokens.toLocaleString()} tokens`}
                    </span>
                  </div>
                  {model.totalParametersB && (
                    <div className="px-4 py-2.5 flex justify-between">
                      <span className="text-slate-500">Total Parameters</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {model.totalParametersB}B parameters
                      </span>
                    </div>
                  )}
                  {model.activeParametersB && (
                    <div className="px-4 py-2.5 flex justify-between">
                      <span className="text-slate-500">Active Parameters (Inference)</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {model.activeParametersB}B active parameters
                      </span>
                    </div>
                  )}
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-500">Supported Modalities</span>
                    <span className="font-medium text-slate-900 capitalize">
                      {model.modalities.join(", ")}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-500">Release Date</span>
                    <span className="font-medium text-slate-900">{model.releaseDate}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
                  Tags & Categories
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {model.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "benchmarks" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#0047FF]" />
                  <span className="font-semibold text-slate-900">
                    Sara Analysis Intelligence Index
                    {model.qualityIndexVersion ? ` ${model.qualityIndexVersion}` : ""}
                  </span>
                </div>
                <span className="text-base font-bold text-[#0047FF] tabular-nums">
                  {model.quality.intelligenceIndex ?? "—"} / 100
                </span>
              </div>

              {/* Detailed Evaluation Progress Bars */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    label: "SWE-bench Verified (Software Engineering)",
                    val: model.quality.sweBenchVerified,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "GPQA Diamond (PhD-level Science & Math)",
                    val: model.quality.gpqaDiamond,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "MMLU-Pro (Multi-discipline Reasoning)",
                    val: model.quality.mmluPro,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "Terminal-Bench 4.0 (Terminal & Agentic Coding)",
                    val: model.quality.terminalBench40,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "FrontierCode 2.0 (Repository Engineering)",
                    val: model.quality.frontierCode20 ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "HLE-Diamond (Reasoning & Knowledge)",
                    val: model.quality.hleDiamond ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "Terminal-Bench-Science 0.1",
                    val: model.quality.terminalBenchScience01 ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "CritPt v2 (Hard Subset)",
                    val: model.quality.critPtV2HardSubset ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "GDP.pdf (All-pass score)",
                    val: model.quality.gdpPdfAllPass ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "AA-Omniscience v1.1 Index",
                    val: model.quality.aaOmniscienceIndex ?? null,
                    max: 100,
                    unit: "",
                  },
                  {
                    label: "SEC-bench Pro (Vulnerability Discovery)",
                    val: model.quality.secBenchPro ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "ExploitGym (Exploit Validation)",
                    val: model.quality.exploitGym ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "CWE-bench (Root-Cause Patching)",
                    val: model.quality.cweBench ?? null,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "FrontierCode 1.1 (Repository Engineering)",
                    val: model.quality.frontierCode11,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "AA-Briefcase v1.1 (Agentic Knowledge Work)",
                    val: model.quality.briefcaseV11,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "GDPval-AA v2.1 (Real-world Work Tasks)",
                    val: model.quality.gdpvalAa,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "AutomationBench-AA (SaaS Workflow Automation)",
                    val: model.quality.automationBenchAa,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "AA-AnalystAgent (Quantitative & Document Analysis)",
                    val: model.quality.analystAgentAa,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "ITBench-AA (Kubernetes Incident Root Cause)",
                    val: model.quality.itBenchAa,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "Humanity's Last Exam (Complex Knowledge)",
                    val: model.quality.humanitiesLastExam,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "MATH 500 (Competition Math)",
                    val: model.quality.math500,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "Omniscience (Factuality & Accuracy)",
                    val: model.quality.omniscienceAccuracy,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "Non-Hallucination Rate",
                    val: model.quality.omniscienceNonHallucination,
                    max: 100,
                    unit: "%",
                  },
                  {
                    label: "LMSYS Chatbot Arena Elo",
                    val: model.quality.chatbotArenaElo,
                    max: 1600,
                    unit: "Elo",
                  },
                ]
                  .filter((item) => item.val !== null && item.val > 0)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg border border-slate-100 bg-white"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {item.val} {item.unit}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0047FF] transition-all duration-300"
                          style={{ width: `${Math.min(100, ((item.val ?? 0) / item.max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Zap size={14} />
                    <span className="text-[11px] font-semibold uppercase">Median Speed</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {model.performance.outputSpeedTokensPerSec.median}
                    <span className="text-xs text-slate-400 font-normal"> tok/s</span>
                  </div>
                  {model.performance.outputSpeedTokensPerSec.p90 && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      p90: {model.performance.outputSpeedTokensPerSec.p90} tok/s
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Gauge size={14} />
                    <span className="text-[11px] font-semibold uppercase">Latency (TTFT)</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {model.performance.ttftSeconds.median}
                    <span className="text-xs text-slate-400 font-normal"> s</span>
                  </div>
                  {model.performance.ttftSeconds.p90 && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      p90: {model.performance.ttftSeconds.p90} s
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Clock size={14} />
                    <span className="text-[11px] font-semibold uppercase">500-Token Time</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {model.performance.endToEnd500TokensSec > 0
                      ? model.performance.endToEnd500TokensSec
                      : "—"}
                    <span className="text-xs text-slate-400 font-normal"> s</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">End-to-end response</div>
                </div>
              </div>

              {model.isReasoningModel && model.performance.reasoningDurationMedianSec && (
                <div className="p-4 rounded-xl border border-[#BEDBFF] bg-[#EBF2FF]/60">
                  <div className="flex items-center gap-2 text-[#0047FF] font-semibold mb-1">
                    <Sparkles size={15} />
                    <span>Thinking Duration</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    This model spends an average of{" "}
                    <span className="font-semibold text-slate-900">
                      {model.performance.reasoningDurationMedianSec}s
                    </span>{" "}
                    in extended reasoning deliberation before providing an answer.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Input (Standard)
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                    ${model.pricing.inputPricePer1M.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">per 1M tokens</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Output (Generation)
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                    ${model.pricing.outputPricePer1M.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">per 1M tokens</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Cache Hit Read
                  </span>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5 tabular-nums">
                    ${model.pricing.cacheHitPricePer1M.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">per 1M tokens</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Blended 3:1 Price
                  </span>
                  <div className="text-lg font-bold text-[#0047FF] mt-0.5 tabular-nums">
                    ${model.pricing.blendedPricePer1M.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">per 1M tokens</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-semibold text-slate-900 mb-1">Cost per Intelligence Task</h4>
                <p className="text-slate-500 text-xs mb-3">
                  Weighted average cost to complete a full Intelligence Index task suite.
                </p>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  ${model.pricing.costPerTaskUsd.toFixed(4)} USD
                </div>
              </div>
            </div>
          )}

          {activeTab === "providers" && (
            <div className="space-y-3">
              {providers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {model.noPublicApi
                    ? "No public inference API or provider benchmark data is available for this model yet."
                    : "No third-party inference providers are listed for this model yet."}
                </div>
              ) : (
                providers.map((match) => (
                  <div
                    key={match.provider.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {match.provider.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {match.provider.hardwareType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Uptime: {match.support.uptimePercent}%</span>
                        <span>•</span>
                        <span>Latency: {match.support.medianTtft}s</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                          {match.support.medianTps} tok/s
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ${match.support.blendedPricePer1M.toFixed(2)} / 1M
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {providers.length > 0 && onNavigateToProviders && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToProviders(model.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0047FF] hover:bg-[#2966FF] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-98"
                  >
                    <span>Open in Provider Leaderboard</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Data independently verified against published evaluation results</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
