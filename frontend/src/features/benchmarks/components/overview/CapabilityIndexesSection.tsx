import React, { useState, useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { CreatorLogo } from "../ui/CreatorLogo";
import { CAPABILITY_INDEXES } from "../data/capabilityIndexes";
import { BenchmarkModelsFilterDropdown, BenchmarkFilterModelItem } from "../ui/BenchmarkModelsFilterDropdown";

const CHART_HEIGHT = 330;

export const CapabilityIndexesSection: React.FC = () => {
  const [activeId, setActiveId] = useState(CAPABILITY_INDEXES[0].id);
  const [selectedModelMap, setSelectedModelMap] = useState<Record<string, string[]>>({});

  const index = CAPABILITY_INDEXES.find((i) => i.id === activeId) ?? CAPABILITY_INDEXES[0];
  const allModelIds = useMemo(() => index.models.map((m) => m.name), [index]);
  const selectedIds = selectedModelMap[activeId] ?? allModelIds;

  const handleSelectIds = (ids: string[]) => {
    setSelectedModelMap((prev) => ({ ...prev, [activeId]: ids }));
  };

  const activeModels = useMemo(
    () => index.models.filter((m) => selectedIds.includes(m.name)),
    [index.models, selectedIds]
  );

  const filterItems: BenchmarkFilterModelItem[] = useMemo(
    () =>
      index.models.map((m) => ({
        id: m.name,
        name: m.name,
        creator: m.creator,
        color: m.color,
        badge: `${m.value}`,
      })),
    [index.models]
  );

  const maxValue = activeModels.length > 0 ? Math.max(...activeModels.map((m) => m.value)) : 60;
  const scaleMax = maxValue * 1.08;

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

            {/* Functional Filter & Provider Controls */}
            <BenchmarkModelsFilterDropdown
              items={filterItems}
              selectedIds={selectedIds}
              onChangeSelection={handleSelectIds}
              totalCount={index.totalModels}
              defaultIds={allModelIds}
              showProviderAction={true}
            />
          </div>

          {/* Bar Chart */}
          <div className="relative mt-8 overflow-x-auto no-scrollbar">
            {activeModels.length === 0 ? (
              <div className="py-20 text-center text-sm text-neutral-400">
                No models selected. Use the filter dropdown above to select models.
              </div>
            ) : (
              <div
                className="pl-24 pr-8"
                style={{ minWidth: `${Math.max(900, activeModels.length * 80)}px` }}
              >
                <div
                  className="relative flex items-end justify-between gap-3"
                  style={{ height: `${CHART_HEIGHT}px` }}
                >
                  {activeModels.map((model, idx) => {
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
                  {activeModels.map((model, idx) => (
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
                  {activeModels.map((model, idx) => (
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
