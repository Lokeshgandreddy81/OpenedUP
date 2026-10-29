import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  BenchmarkBarCard,
  type BenchmarkChartItem,
  type MetricCardConfig,
} from "../overview/ModelsOverviewView";
import { CodingAgentIndexesFullChart } from "../overview/CodingAgentIndexesFullChart";
import { TokenUsageChartCard } from "./TokenUsageChartCard";
import { CostChartCard } from "./CostChartCard";
import { ExecutionTimeChartCard } from "./ExecutionTimeChartCard";
import { SafetyRefusalChartCard } from "./SafetyRefusalChartCard";
import { ALL_CODING_AGENT_MODELS, type CodingAgentModelItem } from "../data/codingAgentBenchmarks";

export interface CodingAgentsViewProps {
  onSelectModel?: (modelId: string) => void;
  onBackToOverview?: () => void;
}

const FEATURED_MODELS: CodingAgentModelItem[] = [...ALL_CODING_AGENT_MODELS]
  .filter((model) => model.isDefault15 && model.costUsd !== null && !model.splitColor)
  .sort((a, b) => b.indexScore - a.indexScore)
  .slice(0, 10);

const rankChartItems = (
  metric: (model: CodingAgentModelItem) => { value: number; label: string },
  ascending: boolean
): BenchmarkChartItem[] =>
  [...FEATURED_MODELS]
    .sort((a, b) => {
      const valueA = metric(a).value;
      const valueB = metric(b).value;
      return ascending ? valueA - valueB : valueB - valueA;
    })
    .map((model) => ({
      name: `${model.agentName}\n${model.modelLines.join("\n")}`,
      creator: model.creatorId,
      color: model.modelColor,
      ...metric(model),
    }));

const CODING_AGENT_METRIC_CARDS: {
  index: MetricCardConfig;
  time: MetricCardConfig;
  cost: MetricCardConfig;
} = {
  index: {
    title: "Coding Agent Index",
    subtitle: "Artificial Analysis Coding Agent Index v1.5",
    accentColor: "#736CD3",
    metricLabel: "Higher is better",
    items: rankChartItems(
      (model) => ({ value: model.indexScore, label: `${model.indexScore}` }),
      false
    ),
  },
  time: {
    title: "Time per Task",
    subtitle: "Average agent wall time per task",
    accentColor: "#EAB308",
    metricLabel: "Lower is better",
    items: rankChartItems(
      (model) => ({ value: model.executionTimeMinutes, label: model.timeDisplay }),
      true
    ),
  },
  cost: {
    title: "Cost per Task",
    subtitle: "Average API cost per task (USD)",
    accentColor: "#F97316",
    metricLabel: "Lower is better",
    items: rankChartItems(
      (model) => ({ value: model.costUsd ?? 0, label: model.costDisplay ?? "" }),
      true
    ),
  },
};

interface CodingAgentSection {
  id: string;
  label: string;
  isNew?: boolean;
}

const CODING_AGENT_SECTIONS: CodingAgentSection[] = [
  { id: "performance", label: "Performance" },
  { id: "token-usage", label: "Token Usage" },
  { id: "cost", label: "Cost" },
  { id: "execution-time", label: "Execution Time" },
  { id: "safety-refusals", label: "Safety Refusals", isNew: true },
];

const DEFAULT_SECTION_ID = "performance";

interface CodingAgentSectionHeadingProps {
  title: string;
  subtitle: string;
}

const CodingAgentSectionHeading: React.FC<CodingAgentSectionHeadingProps> = ({
  title,
  subtitle,
}) => (
  <div>
    <div className="flex items-center gap-2.5">
      <span className="w-3.5 h-3.5 bg-neutral-900 rounded-[2px] inline-block" />
      <h2 className="font-serif text-[28px] font-normal text-neutral-900 tracking-tight leading-none">
        {title}
      </h2>
    </div>
    <p className="text-[13px] text-neutral-500 mt-2.5 max-w-3xl leading-relaxed">{subtitle}</p>
  </div>
);

const CODING_AGENT_FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is the Artificial Analysis Coding Agent Index?",
    a: "The Artificial Analysis Coding Agent Index is our composite score for coding-agent performance across the public benchmark suite on this page. It combines DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA to capture implementation, terminal workflow, repository-understanding, and broader software-engineering performance in a single headline metric.",
  },
  {
    q: "Which benchmarks are included in the index right now?",
    a: "The current public index (v1.5) includes DeepSWE v1.1 (113 tasks), Terminal-Bench 4.0 (66 tasks), and SWE-Atlas-QnA (124 tasks) — 303 tasks in total. These benchmarks are combined because they stress different parts of the coding-agent workflow rather than repeating the same task format.",
  },
  {
    q: "What kinds of tasks are these benchmarks actually testing?",
    a: "The benchmark suite mixes several software-engineering task styles: repository Q&A tasks that focus on reading a codebase, understanding architecture or behavior, and producing a correct technical answer (SWE-Atlas-QnA); implementation and bug-fix tasks that require code changes and a make-a-patch-that-works outcome (DeepSWE v1.1); and terminal workflow tasks that test navigating a shell-driven environment, executing tools correctly, and completing multi-step command-line workflows (Terminal-Bench 4.0). All three benchmarks use binary task outcomes.",
  },
  {
    q: "How do Q&A-style tasks differ from implementation-style tasks?",
    a: "Q&A-style tasks emphasize repository understanding, code reading, tracing behavior, and producing a correct technical explanation. Implementation-style tasks are closer to shipping a working change: the agent has to understand the task, navigate the repository, edit files correctly, and satisfy an evaluator or test-based outcome under execution constraints. Those are related capabilities, but they are not identical — an agent can be strong at repository reasoning and still be weaker at reliable patch execution, or vice versa, which is one reason the composite index should be read alongside the per-benchmark chart.",
  },
  {
    q: "How are agents scored on each benchmark?",
    a: "This page reports task-normalized average pass@1. For each benchmark, we first average the three evaluated attempts for each task, then average those task-level scores so every task has equal weight. All current component outcomes are binary, and an attempt can complete cleanly and still score zero when it does not satisfy its verifier. SWE-Atlas-QnA binary pass/fail scoring is aligned with Scale AI's Task Resolve Rate methodology.",
  },
  {
    q: "How is the overall index weighted?",
    a: "The index is computed from DeepSWE v1.1, Terminal-Bench 4.0, and SWE-Atlas-QnA with equal weight per benchmark — the public methodology is a simple average across the three benchmark scores. Benchmark methodology can evolve as coverage improves, so comparability is best interpreted within the published benchmark suite and its current component set rather than as a timeless absolute score.",
  },
  {
    q: "What does execution time mean?",
    a: "Execution time on this page refers to the average agent wall time per task — how long the agent process was actively running, not just raw model latency. It includes time spent reasoning, issuing tool calls, reading and writing files, executing shell steps, and waiting on model responses, but excludes environment startup, verifier or judge time, and other harness overhead. An agent can therefore have a fast underlying model and still be slower overall if its workflow is longer or more tool-heavy.",
  },
  {
    q: "What does token usage mean, and why does it matter?",
    a: "Token usage is the average observed token consumption per task across the benchmark suite, broken out into input, cache, and output tokens. Input tokens are the tokens sent into the model, including prompts, instructions, tool context, and task context. Cache tokens are prompt tokens reused through prompt caching when the provider exposes that telemetry. Output tokens are tokens generated by the model in its response. Token usage matters because it often drives cost and can indicate how much context an agent consumes to get work done — but token efficiency and cost are not identical, because providers price token categories differently and caching can materially change the bill.",
  },
  {
    q: "Why can a higher-index agent still be worse for my use case?",
    a: "A higher index score means stronger performance across the included benchmark mix, but it does not mean the agent is best for every workflow. The index is a balance across benchmark quality, not a direct measure of your specific latency, cost, tooling, or task-type priorities. Real-world choice still depends on whether your workflow looks more like repository Q&A, patching, or terminal execution, and on practical constraints such as IDE integration, model availability, and reliability.",
  },
  {
    q: "How realistic are these tasks, and what setup was used for each agent?",
    a: "These benchmarks measure coding-agent performance across repositories, tools, multi-step workflows, and evaluator-based outcomes. Results on this page reflect specific evaluated agent variants, not just generic product names: model choice, reasoning settings, and execution configuration can materially change outcomes, which is why a single agent family may appear in multiple variants in the results. Cost figures are based on current per-token API pricing and many users will access coding agent harnesses through subscription plans rather than pay-per-token.",
  },
];

const CodingAgentsFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({});
  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section className="w-full flex flex-col gap-6 mt-20 py-2 px-1">
      <h2 className="font-serif text-[22px] sm:text-[24px] font-normal text-neutral-900 tracking-tight leading-tight">
        Frequently Asked Questions
      </h2>

      <div className="border-t border-neutral-200 divide-y divide-neutral-200/80">
        {CODING_AGENT_FAQ_ITEMS.map((item, idx) => {
          const isOpen = Boolean(openFaq[idx]);
          return (
            <div key={idx} className="py-2 sm:py-3.5">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full min-h-[44px] flex items-center justify-between text-left text-xs sm:text-[13px] font-semibold text-neutral-900 hover:text-[#0047FF] transition-colors cursor-pointer"
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

export const CodingAgentsView: React.FC<CodingAgentsViewProps> = () => {
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTION_ID);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    document
      .getElementById(`coding-agent-${sectionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full max-w-[1560px] mx-auto pb-16 animate-in fade-in duration-150 px-2 sm:px-6">
      <div className="w-full flex flex-col gap-16">
        <div className="w-full lg:w-[55%] self-center">
          <BenchmarkBarCard config={CODING_AGENT_METRIC_CARDS.index} align="left" />
        </div>

        <div className="w-full border-b border-transparent" />

        <div className="w-full lg:w-[55%] self-center">
          <BenchmarkBarCard config={CODING_AGENT_METRIC_CARDS.time} align="right" />
        </div>

        <div className="w-full border-b border-transparent" />

        <div className="w-full lg:w-[55%] self-center">
          <BenchmarkBarCard config={CODING_AGENT_METRIC_CARDS.cost} align="left" />
        </div>
      </div>

      {/* Mobile section jump pills */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-2 py-2 mt-8 mb-2 sticky top-0 bg-white/95 backdrop-blur-xs z-10 -mx-2 px-2 border-b border-neutral-100">
        {CODING_AGENT_SECTIONS.map((section) => {
          const isActive = section.id === activeSection;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionClick(section.id)}
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full text-xs whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-neutral-900 text-white font-semibold shadow-2xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <span>{section.label}</span>
              {section.isNew && (
                <span
                  className={`text-[9px] font-bold px-1 rounded ${isActive ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"}`}
                >
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-6 lg:mt-20">
        {/* Section navigation */}
        <aside className="hidden lg:flex flex-col gap-0.5 w-[188px] shrink-0 sticky top-6 self-start">
          {CODING_AGENT_SECTIONS.map((section) => {
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section.id)}
                className={`flex items-center gap-2.5 px-1 py-1.5 text-left text-[13px] transition-colors cursor-pointer ${
                  isActive
                    ? "text-neutral-900 font-semibold"
                    : "text-neutral-500 font-medium hover:text-neutral-800"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-[2px] shrink-0 transition-colors ${
                    isActive ? "bg-neutral-900" : "bg-neutral-300"
                  }`}
                />
                <span>
                  {section.label}
                  {section.isNew && (
                    <span className="text-[10px] font-medium tracking-wide text-neutral-400 ml-1">
                      · NEW
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Sections column */}
        <div className="flex-1 min-w-0 flex flex-col gap-20">
          {/* Performance section */}
          <section id="coding-agent-performance" className="flex flex-col gap-6">
            <CodingAgentSectionHeading
              title="Performance"
              subtitle="Performance across the Artificial Analysis Coding Agent Index."
            />

            <CodingAgentIndexesFullChart variant="performance" />
          </section>

          {/* Token Usage section */}
          <section id="coding-agent-token-usage" className="flex flex-col gap-6">
            <CodingAgentSectionHeading
              title="Token Usage"
              subtitle="Token consumption across the Artificial Analysis Coding Agent Index, including total usage, token mix, efficiency, and per-benchmark breakdowns."
            />

            <TokenUsageChartCard />
          </section>

          {/* Cost section */}
          <section id="coding-agent-cost" className="flex flex-col gap-6">
            <CodingAgentSectionHeading
              title="Cost"
              subtitle="Cost across the Artificial Analysis Coding Agent Index based on current per-token API pricing, including cache write pricing and cache discounts where available. Many users will access coding agent harnesses through subscription plan offerings rather than pay-per-token."
            />

            <CostChartCard />
          </section>

          {/* Execution Time section */}
          <section id="coding-agent-execution-time" className="flex flex-col gap-6">
            <CodingAgentSectionHeading
              title="Execution Time"
              subtitle="Active agent runtime across the Artificial Analysis Coding Agent Index."
            />

            <ExecutionTimeChartCard />
          </section>

          {/* Safety Refusals section */}
          <section id="coding-agent-safety-refusals" className="flex flex-col gap-6">
            <CodingAgentSectionHeading
              title="Safety Refusals"
              subtitle="Safety refusal rates across the Artificial Analysis Coding Agent Index, broken down by benchmark."
            />

            <SafetyRefusalChartCard />
          </section>
        </div>
      </div>

      <CodingAgentsFaq />
    </div>
  );
};
