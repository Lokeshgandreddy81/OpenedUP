import React, { useState } from "react";
import { ArrowUpRight, ChevronsUpDown, Filter, Plus, SlidersHorizontal } from "lucide-react";
import { CreatorLogo } from "../ui/CreatorLogo";
import { CAPABILITY_INDEXES } from "../data/capabilityIndexes";

const CHART_HEIGHT = 330;

const HATCH_PATTERN =
  "repeating-linear-gradient(45deg, transparent, transparent 3.5px, rgba(255,255,255,0.32) 3.5px, rgba(255,255,255,0.32) 7px), repeating-linear-gradient(-45deg, transparent, transparent 3.5px, rgba(0,0,0,0.3) 3.5px, rgba(0,0,0,0.3) 7px)";

const IconChip: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors cursor-pointer"
  >
    {children}
  </button>
);

export const CapabilityIndexesSection: React.FC = () => {
  const [activeId, setActiveId] = useState(CAPABILITY_INDEXES[0].id);

  const index = CAPABILITY_INDEXES.find((i) => i.id === activeId) ?? CAPABILITY_INDEXES[0];
  const maxValue = Math.max(...index.models.map((m) => m.value));
  const scaleMax = maxValue * 1.08;
  const hasNoPublicApi = index.models.some((m) => m.pattern);

  return (
    <section className="w-full flex flex-col gap-6">
      {/* Section Heading */}
      <div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 bg-black inline-block shrink-0" aria-hidden="true" />
          <h2 className="font-serif text-[30px] sm:text-[32px] leading-none text-neutral-900 tracking-tight">
            Capability Indexes
          </h2>
        </div>
        <p className="text-[14.5px] text-neutral-800 mt-3.5">
          Measures the performance of models on specific capabilities and industries
        </p>
      </div>

      {/* Index Card */}
      <div className="rounded-lg border border-transparent bg-white overflow-hidden">
        {/* Domain Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-3 border-b border-transparent overflow-x-auto no-scrollbar">
          {CAPABILITY_INDEXES.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60"
                }`}
              >
                {tab.tabLabel}
              </button>
            );
          })}
        </div>

        <div className="px-6 pt-6 pb-6">
          {/* Header: Title + Controls */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-[24px] text-neutral-900 tracking-tight leading-tight">
                  {index.title}
                </h3>
                <ArrowUpRight size={16} className="text-neutral-400 shrink-0" />
              </div>
              <p className="text-[12.5px] text-neutral-500 mt-2 max-w-[640px] leading-relaxed">
                {index.evaluations} <span className="text-neutral-400 px-0.5">·</span> Higher is
                better
              </p>
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 min-w-[290px] flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span>
                    {index.models.length} of {index.totalModels} models
                  </span>
                  <ChevronsUpDown size={14} className="text-neutral-500" />
                </button>
                <IconChip title="Filter models">
                  <Filter size={15} />
                </IconChip>
                <IconChip title="Chart options">
                  <SlidersHorizontal size={15} />
                </IconChip>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-[12.5px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center shrink-0">
                  <Plus size={10} />
                </span>
                Add model from specific provider
              </button>
            </div>
          </div>

          {/* Legend Row */}
          <div className="flex items-center justify-between gap-3 mt-8 text-[12.5px] text-neutral-800">
            <div className="flex items-center gap-1.5">
              {hasNoPublicApi && (
                <>
                  <span
                    className="w-3.5 h-3.5 rounded-xs border border-neutral-300/40 relative overflow-hidden inline-block shrink-0"
                    style={{
                      backgroundColor: "#B0B3B8",
                      backgroundImage: HATCH_PATTERN,
                    }}
                  />
                  <span>No publicly available API</span>
                </>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="relative mt-5 overflow-x-auto no-scrollbar">
            <div className="min-w-[1600px] pl-24 pr-8">
              <div
                className="relative flex items-end justify-between gap-3"
                style={{ height: `${CHART_HEIGHT}px` }}
              >
                {index.models.map((model, idx) => {
                  const barHeightPx = Math.max(
                    30,
                    Math.round((model.value / scaleMax) * (CHART_HEIGHT - 8))
                  );
                  return (
                    <div
                      key={`${model.creator}-${idx}`}
                      className="flex-1 h-full flex flex-col items-center justify-end"
                    >
                      <div
                        className="w-full max-w-[42px] rounded-t-[3px] flex justify-center pt-2.5 overflow-hidden select-none"
                        style={{
                          height: `${barHeightPx}px`,
                          backgroundColor: model.color,
                          ...(model.pattern ? { backgroundImage: HATCH_PATTERN } : {}),
                        }}
                      >
                        <span className="text-[12px] font-medium text-white/95 leading-none">
                          {model.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom baseline */}
              <div className="w-full border-b border-neutral-200/60" />

              {/* Creator Brand Logo Row */}
              <div className="flex items-center justify-between gap-3 pt-3.5">
                {index.models.map((model, idx) => (
                  <div
                    key={`${model.creator}-logo-${idx}`}
                    className="flex-1 flex justify-center items-center"
                    title={`${model.name} (${model.creator})`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <CreatorLogo creator={model.creator} size={19} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Angled Model Labels */}
              <div className="flex justify-between gap-3 pt-1.5 h-[150px]">
                {index.models.map((model, idx) => (
                  <div
                    key={`${model.creator}-label-${idx}`}
                    className="flex-1 relative flex justify-center items-start"
                  >
                    <div
                      className="absolute right-1/2 top-1 origin-top-right -rotate-45 text-right text-[11px] text-neutral-700 font-medium leading-[1.35] select-none"
                      style={{ width: "84px" }}
                      title={model.name}
                    >
                      {model.name}
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
