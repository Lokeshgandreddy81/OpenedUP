import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, Zap, Clock, Check, Trophy, ChevronDown, Search } from "lucide-react";
import { AIModelBenchmark } from "../types";
import { CreatorLogo } from "../ui/CreatorLogo";
import { getCreatorColor } from "../ui/creatorBranding";

export interface ModelComparatorProps {
  models: AIModelBenchmark[];
  initialModelIds?: string[];
}

// Colors for up to 5 comparison slots
const SLOT_LABELS = ["A", "B", "C", "D", "E"] as const;
type SlotKey = (typeof SLOT_LABELS)[number];

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

export const ModelComparator: React.FC<ModelComparatorProps> = ({ models, initialModelIds }) => {
  // Determine smart initial selections
  const defaultModelA = useMemo(() => {
    if (initialModelIds?.[0]) {
      const found = models.find((m) => m.id === initialModelIds[0]);
      if (found) return found;
    }
    // Default to Claude Opus 5.5, Claude Sonnet 5.5, or highest intelligence model
    return (
      models.find((m) => m.id === "claude-opus-5-5-max-with-fallback") ||
      models.find((m) => m.id === "claude-sonnet-5-5-max-with-fallback") ||
      models[0]
    );
  }, [models, initialModelIds]);

  const defaultModelB = useMemo(() => {
    if (initialModelIds?.[1]) {
      const found = models.find((m) => m.id === initialModelIds[1]);
      if (found) return found;
    }
    // Default to GPT-6 Astra, GPT-6.1 Sol, or DeepSeek V4.1
    return (
      models.find((m) => m.id === "gpt-6-astra-max") ||
      models.find((m) => m.id === "gpt-6-1-sol-max") ||
      models.find((m) => m.id === "deepseek-v4-1-flash-max") ||
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
    const next: AIModelBenchmark[] = [];
    const seenIds = new Set<string>();
    for (const id of initialModelIds.slice(0, 5)) {
      const found = models.find((model) => model.id === id);
      if (found && !seenIds.has(found.id)) {
        next.push(found);
        seenIds.add(found.id);
      }
    }

    // The parent owns the requested selection. Rebuild it instead of merging it
    // into the old list, so shortened selections cannot leave stale models behind.
    for (const fallback of [defaultModelA, defaultModelB, ...models]) {
      if (next.length >= 2) break;
      if (fallback && !seenIds.has(fallback.id)) {
        next.push(fallback);
        seenIds.add(fallback.id);
      }
    }
    setSelectedModels(next);
  }, [defaultModelA, defaultModelB, initialModelIds, models]);

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
      };
    });
  }, [selectedModels]);

  // Model Picker Modal states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTargetOriginalIdx, setPickerTargetOriginalIdx] = useState<number | null>(null);
  const [pickerAddMode, setPickerAddMode] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const [pickerSort, setPickerSort] = useState<"index" | "price" | "speed">("index");
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    if (!isPickerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsPickerOpen(false);
        setIsSortOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPickerOpen]);

  // Keep every selected model paired with its matrix slot for rendering and winner checks.
  const activeModels = useMemo(() => {
    return selectedModels.map((model, i) => ({
      slot: SLOT_LABELS[i] as SlotKey,
      model,
    }));
  }, [selectedModels]);

  // The first three models also feed the comparison matrix columns.
  const modelA = selectedModels[0];
  const modelB = selectedModels[1];
  const modelC = selectedModels[2] ?? null;

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
  const calculateWinner = (values: { slot: SlotKey; val: number }[], direction: "higher" | "lower") => {
    const sortedValues = [...values].sort((a, b) =>
      direction === "higher" ? b.val - a.val : a.val - b.val
    );

    const winner = sortedValues[0];
    const runnerUp = sortedValues[1];
    if (!winner || !runnerUp) {
      return { winnerSlot: winner?.slot, winnerVal: winner?.val ?? 0, deltaLabel: "", isTie: true };
    }

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
    <div className="w-full bg-white flex flex-col font-sans select-none overflow-x-hidden min-w-0">
      {/* ========================================================
          1. MODEL SELECTION DOCK (senior UIUX redesign)
          ======================================================== */}
      <div className="w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-serif text-[26px] sm:text-[32px] font-normal text-neutral-900 tracking-tight leading-tight">
                Model Comparator
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {selectedModels.length > 2 && (
                <button
                  type="button"
                  onClick={() => setSelectedModels((prev) => prev.slice(0, 2))}
                  className="h-9 px-3 rounded-xl bg-transparent hover:bg-slate-100/60 text-slate-700 hover:text-slate-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-transparent"
                  title="Keep only the first two models"
                >
                  <X size={12} strokeWidth={1.75} />
                  <span>Clear extras</span>
                </button>
              )}
              {canAddModel && (
                <button
                  type="button"
                  onClick={openAddPicker}
                  className="h-10 px-4 rounded-xl bg-[#0047FF] hover:bg-[#0039CC] text-white text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#0047FF]/20"
                >
                  <Plus size={14} strokeWidth={1.75} />
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
          <div className="w-full overflow-x-auto no-scrollbar pb-2">
            <div
              className="grid gap-3 sm:gap-5 max-w-4xl mx-auto mt-4 sm:mt-[5%]"
              style={{
                gridTemplateColumns: `repeat(${selectedModels.length}, minmax(${selectedModels.length > 2 ? "140px" : "120px"}, 1fr))`,
              }}
            >
            {displayModels.map(({ model, slotLabel, originalIdx }) => {
              const isEdge = originalIdx === 0 || originalIdx === 1;
              return (
                <div
                  key={`${slotLabel}-${model.id}`}
                  className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-transparent border border-transparent transition-all hover:bg-slate-50/60 aspect-square"
                >
                  <CreatorLogo creator={model.creator} size={48} />
                  <ChevronDown
                    size={14}
                    strokeWidth={1.75}
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
                    <div className="text-[10.5px] text-slate-500 flex flex-col items-center gap-0.5 mt-2 tabular-nums">
                      <span className="font-semibold text-slate-600">
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
                      aria-label={`Remove ${model.name} from comparison`}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                      title="Remove this model"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {canAddModel && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openAddPicker}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-none bg-transparent hover:bg-slate-50/60 text-slate-600 hover:text-[#0047FF] text-[11px] font-semibold transition-all cursor-pointer border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={pickerAddMode ? "Add a model to compare" : "Change model"}
              data-benchmark-modal="open"
              className="pointer-events-auto w-[94vw] sm:w-[80vw] md:w-[70vw] h-[85vh] sm:h-[75vh] max-w-[720px] max-h-[85vh] rounded-3xl border border-transparent bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="relative px-4 sm:px-5 py-4 border-b border-transparent text-center">
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
                  aria-label="Close model picker"
                  title="Close"
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search + sort */}
              <div className="px-4 sm:px-5 py-3 border-b border-transparent space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSortOpen((v) => !v)}
                      className="h-10 px-3 text-[11px] font-semibold rounded-xl border border-neutral-200/80 bg-white cursor-pointer outline-none flex items-center justify-center gap-1.5 hover:bg-neutral-50"
                    >
                      {pickerSort === "index"
                        ? "Intelligence"
                        : pickerSort === "price"
                          ? "Price"
                          : "Speed"}
                      <ChevronDown size={12} strokeWidth={1.75} />
                    </button>
                    {isSortOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[61]"
                          onClick={() => setIsSortOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 z-[62] min-w-[110px] rounded-xl border border-neutral-200/80 bg-white shadow-lg overflow-hidden py-1">
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
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0 hidden sm:inline">
                    {filteredPickerModels.length} models
                  </span>
                </div>
              </div>

              {/* Model list */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
        <div className="w-full overflow-x-auto no-scrollbar rounded-2xl">
          <div
            className="min-w-[560px] sm:min-w-0 rounded-2xl border border-transparent bg-white overflow-hidden shadow-xs"
            style={{ "--cols": activeModels.length + 1 } as React.CSSProperties}
          >
          {/* Table Header: Models & Slots */}
          <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] bg-transparent border-b border-transparent text-[12px] font-bold text-slate-800 p-3.5">
            <div className={`text-slate-500 uppercase tracking-wider text-[13px] font-bold`}>
              Benchmark
            </div>

            {activeModels.map(({ slot, model }) => (
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.quality.intelligenceIndex })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.quality.mmluPro })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.quality.gpqaDiamond })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.quality.sweBenchVerified })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.quality.math500 })),
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

            {activeModels.map(({ slot, model }) => (
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.performance.outputSpeedTokensPerSec.median })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.performance.ttftSeconds.median })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.performance.endToEnd500TokensSec })),
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

            {activeModels.map(({ slot, model }) => (
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.pricing.blendedPricePer1M })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.pricing.inputPricePer1M })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.pricing.outputPricePer1M })),
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
                activeModels.map(({ slot, model }) => ({ slot, val: model.contextWindowTokens })),
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
    </div>
  );
};
