import React from "react";
import { ArrowRight, Sliders, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { HaloGlow, SquareGlyph } from "../ui/BrandGlyphs";

export interface FeaturedCardsRowProps {
  onOpenOptima: () => void;
  onOpenRecommender: () => void;
  onSelectChangelogModel?: (modelId: string) => void;
}

export const FeaturedCardsRow: React.FC<FeaturedCardsRowProps> = ({
  onOpenOptima,
  onOpenRecommender,
  onSelectChangelogModel,
}) => {
  const changelogItems = [
    {
      id: "claude-3-7-sonnet-thinking",
      date: "Feb 2025",
      title: "Claude 3.7 Sonnet (Thinking)",
      detail: "Anthropic hybrid reasoning model benchmarked on SWE-bench & MMLU-Pro",
      tag: "Frontier",
    },
    {
      id: "deepseek-r1",
      date: "Jan 2025",
      title: "DeepSeek R1",
      detail: "Open-weights reasoning model benchmarked on MATH-500 and GPQA Diamond",
      tag: "Open-Weights",
    },
    {
      id: "gpt-4o",
      date: "Dec 2024",
      title: "Cerebras Llama 3.3 70B",
      detail: "Ultra-fast inference provider benchmark reaching 2,100 tokens/sec",
      tag: "Inference",
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
      {/* CARD 1: Optima Benchmark Builder (Pitch Black with Cobalt Aurora Glow Halos) */}
      <div className="relative bg-black text-white rounded-2xl p-6 overflow-hidden border border-neutral-800 flex flex-col justify-between group shadow-sm">
        {/* Cobalt & Cyan Aurora Blur Halos */}
        <HaloGlow primaryColor="#0047FF" secondaryColor="#5C8CFF" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
              <Sparkles size={11} className="text-[#5C8CFF]" />
              Optima
            </span>
            <span className="text-xs text-white/60 font-mono">Custom Engine</span>
          </div>

          <h3 className="font-serif text-3xl font-normal text-white tracking-tight leading-snug">
            Build custom benchmark
          </h3>
          <p className="text-sm text-neutral-300 mt-2.5 font-normal leading-relaxed">
            Weight quality, latency, throughput speed, and pricing based on your application's
            unique constraints.
          </p>

          {/* Interactive Weight Slider Preview */}
          <div className="mt-5 space-y-2 bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="flex items-center gap-1.5">
                <SquareGlyph dimension="intelligence" size="xs" /> Quality
              </span>
              <span className="font-mono text-white font-semibold">50%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-[#0047FF] rounded-full" />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-300 pt-1">
              <span className="flex items-center gap-1.5">
                <SquareGlyph dimension="speed" size="xs" /> Speed
              </span>
              <span className="font-mono text-white font-semibold">30%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[30%] h-full bg-[#0284C7] rounded-full" />
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6">
          <button
            type="button"
            onClick={onOpenOptima}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-100 transition-all cursor-pointer active:scale-98 shadow-sm"
          >
            <span>Launch Optima Benchmark Builder</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* CARD 2: Model Recommender (Our Signature Midnight Cobalt #001E80) */}
      <div className="relative bg-gradient-to-br from-[#001E80] via-[#002B99] to-[#001040] text-white rounded-2xl p-6 overflow-hidden border border-blue-700/50 flex flex-col justify-between group shadow-sm">
        {/* Subtle radial electric blue tint */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-35 bg-[#0047FF] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
              <Sliders size={11} className="text-[#BEDBFF]" />
              Recommender
            </span>
            <span className="text-xs text-blue-200/70 font-mono">Pareto Matching</span>
          </div>

          <h3 className="font-serif text-3xl font-normal text-white tracking-tight leading-snug">
            Model Recommender
          </h3>
          <p className="text-sm text-blue-100/90 mt-2.5 font-normal leading-relaxed">
            Answer 4 quick questions about your prompt sizes, reasoning needs, and budget to find
            your optimal model.
          </p>

          {/* Quick Choice Pills Preview */}
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 rounded-lg p-2.5 border border-white/10 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#6EE7B7] shrink-0" />
              <span className="truncate">Production Agents</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5 border border-white/10 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#6EE7B7] shrink-0" />
              <span className="truncate">Large Document QA</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5 border border-white/10 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#6EE7B7] shrink-0" />
              <span className="truncate">Realtime Latency</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5 border border-white/10 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#6EE7B7] shrink-0" />
              <span className="truncate">High-Volume Batch</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6">
          <button
            type="button"
            onClick={onOpenRecommender}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-[#001E80] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition-all cursor-pointer active:scale-98 shadow-sm"
          >
            <span>Get Personalized Recommendation</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* CARD 3: Changelog Timeline Widget */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0047FF]" />
              <h3 className="font-serif text-2xl font-normal text-neutral-900">Changelog</h3>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Live Benchmarks</span>
          </div>
          <p className="text-xs text-neutral-500 -mt-1 mb-5">
            Latest frontier models and inference providers evaluated by Artificial Analysis.
          </p>

          {/* Timeline Milestones */}
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-neutral-200">
            {changelogItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectChangelogModel?.(item.id)}
                className="relative pl-6 flex flex-col cursor-pointer group"
              >
                {/* Timeline Dot in our signature Electric Blue */}
                <span className="absolute left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#0047FF] ring-4 ring-blue-50 group-hover:scale-125 transition-transform" />

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-900 group-hover:text-[#0047FF] group-hover:underline transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                    {item.date}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-5 border-t border-neutral-100">
          <button
            type="button"
            onClick={onOpenOptima}
            className="w-full py-2 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 font-medium text-xs flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>View All Historical Benchmark Releases</span>
            <ChevronRight size={14} className="text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
