import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, BarChart3, Layers, Code2, GitCompare } from "lucide-react";
import type { AIModelBenchmark, BenchmarkCategory } from "./types";
import { BENCHMARK_MODELS, getModelById } from "./data/benchmarkModels";
import { ModelComparator } from "./comparator/ModelComparator";
import { ProviderLeaderboard } from "./providers/ProviderLeaderboard";
import { ModelDetailModal } from "./modal/ModelDetailModal";
import { CodingAgentsView } from "./coding/CodingAgentsView";
import { LLMLeaderboardView } from "./leaderboard/LLMLeaderboardView";
import { ModelsOverviewView } from "./overview/ModelsOverviewView";
import { BenchmarkCatalogView } from "./catalog/BenchmarkCatalogView";

export interface BenchmarksViewProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle?: string;
}

export const BenchmarksView: React.FC<BenchmarksViewProps> = ({
  isOpen,
  onClose,
  docTitle = "Document",
}) => {
  const [activeTab, setActiveTab] = useState<BenchmarkCategory>("overview");
  const [selectedModel, setSelectedModel] = useState<AIModelBenchmark | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerModelId, setProviderModelId] = useState<string>("llama-3-3-70b-instruct");

  const [compareModelIds, setCompareModelIds] = useState<string[]>([
    "claude-3-7-sonnet-thinking",
    "gpt-4o",
    "deepseek-r1",
  ]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Navigation (Esc to close, / to search)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isModalOpen) {
          setIsModalOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === "/" && !isModalOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isModalOpen, onClose]);

  // Model selection handler
  const handleSelectModel = (model: AIModelBenchmark) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  // Compare models handler
  const handleCompareModels = (modelIds: string[]) => {
    setCompareModelIds(modelIds);
    setActiveTab("compare");
  };

  // Compare single model trigger
  const handleCompareSingle = (model: AIModelBenchmark) => {
    setCompareModelIds((prev) => {
      if (prev.includes(model.id)) return prev;
      return [prev[0] || "claude-3-7-sonnet-thinking", model.id];
    });
    setActiveTab("compare");
  };

  // Navigate to providers with specific model selected
  const handleNavigateToProviders = (modelId: string) => {
    setProviderModelId(modelId);
    setActiveTab("providers");
  };

  if (!isOpen) return null;

  const categories: {
    id: BenchmarkCategory;
    label: string;
    icon: React.FC<{ size?: number; className?: string }>;
    badge?: string;
  }[] = [
    { id: "overview", label: "Models", icon: BarChart3 },
    { id: "benchmarks", label: "Benchmarks", icon: BarChart3 },
    { id: "coding-agents", label: "Coding Agents", icon: Code2, badge: "Index v1.5" },
    {
      id: "leaderboard",
      label: "LLM Leaderboard",
      icon: Layers,
      badge: `${BENCHMARK_MODELS.length}`,
    },
    { id: "compare", label: "Compare", icon: GitCompare },
  ];

  const isLeaderboardSection = ["leaderboard", "providers", "compare"].includes(activeTab);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Artificial Analysis Benchmarks"
      className="fixed inset-0 z-50 bg-[#FBFBFC] flex flex-col font-sans select-none overflow-hidden text-neutral-900 animate-in fade-in duration-150"
    >
      {/* ========================================================
          TOP NAVIGATION HEADER (Artificial Analysis Official Bar)
          ======================================================== */}
      <header className="w-full h-14 bg-white border-b border-transparent px-4 md:px-6 relative flex items-center justify-between shrink-0 z-20">
        {/* Left: Back to document */}
        <div className="flex items-center z-10">
          <button
            type="button"
            onClick={onClose}
            title="Back to Document (Esc)"
            aria-label="Back to document"
            className="text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Center: Main Navigation Tabs (Desktop) */}
        <nav
          aria-label="Benchmark Views"
          className="hidden lg:flex items-center gap-0.5 text-[12.5px] font-medium text-neutral-700 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
        >
          {/* Models */}
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "font-semibold text-neutral-900 bg-neutral-100"
                : "hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Models
          </button>

          {/* Benchmarks */}
          <button
            type="button"
            onClick={() => setActiveTab("benchmarks")}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              activeTab === "benchmarks"
                ? "font-semibold text-neutral-900 bg-neutral-100"
                : "hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Benchmarks
          </button>

          {/* Coding Agents */}
          <button
            type="button"
            onClick={() => setActiveTab("coding-agents")}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              activeTab === "coding-agents"
                ? "font-semibold text-neutral-900 bg-neutral-100"
                : "hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Coding Agents
          </button>

          {/* Leaderboard */}
          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              activeTab === "leaderboard"
                ? "font-semibold text-neutral-900 bg-neutral-100"
                : "hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Leaderboard
          </button>

          {/* Compare */}
          <button
            type="button"
            onClick={() => setActiveTab("compare")}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              activeTab === "compare"
                ? "font-semibold text-neutral-900 bg-neutral-100"
                : "hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Compare
          </button>
        </nav>
      </header>

      {/* Mobile Responsive Pill Bar */}
      <div className="flex h-11 lg:hidden items-center px-3 bg-white border-b border-transparent gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-black text-white font-semibold shadow-2xs"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80"
              }`}
            >
              <Icon size={12} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Viewport Content Area */}
      <main className="flex-1 w-full overflow-y-auto no-scrollbar relative p-4 md:p-8 flex flex-col gap-10 bg-white">
        {/* VIEW: BENCHMARKS (evaluation catalog with score charts) */}
        {activeTab === "benchmarks" && <BenchmarkCatalogView onSelectModel={handleSelectModel} />}

        {/* VIEW: MODELS (Overview charts) */}
        {activeTab === "overview" && <ModelsOverviewView />}

        {/* VIEW: CODING AGENTS (Artificial Analysis Coding Agent Index) */}
        {activeTab === "coding-agents" && (
          <CodingAgentsView
            onSelectModel={(modelId) => {
              const m = getModelById(modelId);
              if (m) handleSelectModel(m);
            }}
            onBackToOverview={() => setActiveTab("overview")}
          />
        )}

        {/* LEADERBOARD SECTIONS (LLM, Providers, Head-to-Head Compare) */}
        {isLeaderboardSection && (
          <div
            className={`flex flex-col gap-6 w-full animate-in fade-in duration-150 ${
              activeTab === "leaderboard"
                ? ""
                : activeTab === "compare"
                  ? "w-[70%] mx-auto"
                  : "max-w-7xl mx-auto"
            }`}
          >
            {/* Active Leaderboard View Body */}
            {activeTab === "leaderboard" && (
              <LLMLeaderboardView
                models={BENCHMARK_MODELS}
                selectedModelId={selectedModel?.id}
                onSelectModel={(model) => {
                  setSelectedModel(model);
                  setActiveTab("overview");
                }}
                onNavigateToModels={(model) => {
                  setSelectedModel(model);
                  setActiveTab("overview");
                }}
                onCompareModels={handleCompareModels}
                onCompareSingle={handleCompareSingle}
                searchInputRef={searchInputRef}
              />
            )}

            {activeTab === "providers" && (
              <ProviderLeaderboard
                initialModelId={providerModelId}
                onSelectModel={(modelId) => {
                  const found = getModelById(modelId);
                  if (found) handleSelectModel(found);
                }}
              />
            )}

            {activeTab === "compare" && (
              <ModelComparator
                models={BENCHMARK_MODELS}
                initialModelIds={compareModelIds}
                onSelectModel={handleSelectModel}
              />
            )}
          </div>
        )}
      </main>

      {/* Model Detail Inspector Modal / Drawer */}
      <ModelDetailModal
        model={selectedModel}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCompare={handleCompareSingle}
        onNavigateToProviders={handleNavigateToProviders}
      />
    </div>
  );
};
