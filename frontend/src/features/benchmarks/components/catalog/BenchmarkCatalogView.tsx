import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, Check, ChevronsUpDown } from "lucide-react";
import type { AIModelBenchmark } from "../types";
import { BENCHMARK_MODELS } from "../data/benchmarkModels";
import { BENCHMARK_EVALUATIONS, type BenchmarkEvaluation } from "../data/benchmarkEvaluations";
import { EvaluationChartCard } from "./EvaluationChartCard";

export interface BenchmarkCatalogViewProps {
  models?: AIModelBenchmark[];
  onSelectModel: (model: AIModelBenchmark) => void;
}

type OpenMenu = "evaluations" | "models" | null;

const MODEL_LIMIT_OPTIONS = [10, 20, 40, 0];

export const BenchmarkCatalogView: React.FC<BenchmarkCatalogViewProps> = ({
  models = BENCHMARK_MODELS,
  onSelectModel,
}) => {
  const [visibleEvalIds, setVisibleEvalIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(BENCHMARK_EVALUATIONS.map((evaluation) => [evaluation.id, true]))
  );
  const [modelLimit, setModelLimit] = useState(20);
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openMenu]);

  const evaluations = useMemo(() => {
    const filtered = BENCHMARK_EVALUATIONS.filter((evaluation) => visibleEvalIds[evaluation.id]);
    return sortAlphabetical ? [...filtered].sort((a, b) => a.name.localeCompare(b.name)) : filtered;
  }, [visibleEvalIds, sortAlphabetical]);

  const chartRows = useMemo(() => {
    const rows: BenchmarkEvaluation[][] = [];
    for (let i = 0; i < evaluations.length && i < 6; i += 2) {
      rows.push(evaluations.slice(i, i + 2));
    }
    for (let i = 6; i < evaluations.length; i++) {
      rows.push(evaluations.slice(i, i + 1));
    }
    return rows;
  }, [evaluations]);

  const toggleEvaluation = (id: string) => {
    setVisibleEvalIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const resetFilters = () => {
    setVisibleEvalIds(
      Object.fromEntries(BENCHMARK_EVALUATIONS.map((evaluation) => [evaluation.id, true]))
    );
    setSortAlphabetical(false);
  };

  const modelLimitLabel =
    modelLimit > 0 ? `Top ${modelLimit} of ${models.length} models` : `All ${models.length} models`;

  return (
    <div className="mx-auto flex w-full max-w-[1480px] select-text flex-col gap-8 animate-in fade-in duration-150">
      {/* ========================================================
          SECTION HEADER
          ======================================================== */}
      <header>
        <h2 className="flex items-center gap-3 font-serif text-3xl font-normal tracking-tight text-neutral-900">
          <span className="h-5 w-5 shrink-0 bg-black" aria-hidden="true" />
          Benchmarks
        </h2>
      </header>

      {/* ========================================================
          EVALUATIONS CARD
          ======================================================== */}
      <section
        aria-label="Benchmark evaluations"
        className="rounded-lg border border-transparent bg-white p-6 md:p-8"
      >
        <div className="grid grid-cols-12 gap-6 lg:gap-12">
          {/* Left: title, description, category chips */}
          <div className="col-span-12 flex min-w-0 flex-col lg:col-span-8">
            <h3 className="font-serif text-xl leading-none text-neutral-950">Evaluations</h3>
            <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-neutral-500">
              Benchmark scores measured independently · Higher is better
            </p>

            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-neutral-500">
              <span
                className="inline-block h-3.5 w-3.5 shrink-0 overflow-hidden rounded-xs border border-neutral-300/40"
                style={{
                  backgroundColor: "#B0B3B8",
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.7) 2px, rgba(255,255,255,0.7) 4px), repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
                }}
              />
              <span>No publicly available API</span>
            </div>
          </div>

          {/* Right: evaluations + models selectors */}
          <div className="col-span-12 flex flex-col gap-2 lg:col-span-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === "evaluations" ? null : "evaluations")}
                aria-expanded={openMenu === "evaluations"}
                aria-haspopup="true"
                className="flex h-9 w-full items-center justify-between gap-3 rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-800 transition-colors hover:border-neutral-400 cursor-pointer"
              >
                <span>
                  {evaluations.length} of {BENCHMARK_EVALUATIONS.length} evaluations
                </span>
                <ChevronsUpDown size={13} className="shrink-0 text-neutral-500" />
              </button>

              {openMenu === "evaluations" && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    aria-hidden="true"
                    onClick={() => setOpenMenu(null)}
                  />
                  <div className="absolute inset-x-0 z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-xl animate-in fade-in duration-100">
                    <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        Shown evaluations
                      </span>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-[11px] font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                    {BENCHMARK_EVALUATIONS.map((evaluation) => {
                      const isOn = visibleEvalIds[evaluation.id];
                      return (
                        <button
                          key={evaluation.id}
                          type="button"
                          role="checkbox"
                          aria-checked={isOn}
                          onClick={() => toggleEvaluation(evaluation.id)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-neutral-50 cursor-pointer"
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                              isOn
                                ? "border-neutral-900 bg-neutral-900"
                                : "border-neutral-300 bg-white"
                            }`}
                          >
                            {isOn && <Check size={11} strokeWidth={1.75} className="text-white" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-800">
                            {evaluation.name}
                          </span>
                          <span className="shrink-0 text-[10px] text-neutral-400">
                            {evaluation.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setOpenMenu(openMenu === "models" ? null : "models")}
                  aria-expanded={openMenu === "models"}
                  aria-haspopup="true"
                  className="flex h-9 w-full items-center justify-between gap-3 rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-800 transition-colors hover:border-neutral-400 cursor-pointer"
                >
                  <span>{modelLimitLabel}</span>
                  <ChevronsUpDown size={13} className="shrink-0 text-neutral-500" />
                </button>

                {openMenu === "models" && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      aria-hidden="true"
                      onClick={() => setOpenMenu(null)}
                    />
                    <div className="absolute inset-x-0 z-40 mt-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl animate-in fade-in duration-100">
                      {MODEL_LIMIT_OPTIONS.map((limit) => {
                        const isSelected = modelLimit === limit;
                        return (
                          <button
                            key={limit}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => {
                              setModelLimit(limit);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-neutral-50 cursor-pointer"
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                isSelected ? "border-neutral-900" : "border-neutral-300"
                              }`}
                            >
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-neutral-900" />
                              )}
                            </span>
                            <span className="text-xs font-medium text-neutral-800">
                              {limit > 0 ? `Top ${limit} models` : `All ${models.length} models`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSortAlphabetical((current) => !current)}
                aria-pressed={sortAlphabetical}
                title="Sort evaluations A–Z"
                aria-label="Sort evaluations alphabetically"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
                  sortAlphabetical
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                }`}
              >
                <ArrowDownAZ size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Chart grid */}
        {evaluations.length > 0 ? (
          <div className="mt-10 flex flex-col gap-10">
            {chartRows.map((row, rowIndex) => (
              <div
                key={row.map((evaluation) => evaluation.id).join("-")}
                className={`grid grid-cols-1 ${
                  row.length === 1 ? "w-full" : "gap-x-12 gap-y-12 lg:grid-cols-2"
                } ${rowIndex > 0 ? "border-t border-transparent pt-10" : ""}`}
              >
                {row.map((evaluation) => (
                  <EvaluationChartCard
                    key={evaluation.id}
                    evaluation={evaluation}
                    models={models}
                    modelLimit={modelLimit}
                    onSelectModel={onSelectModel}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-lg border border-dashed border-neutral-300 px-6 py-16 text-center">
            <p className="font-serif text-xl text-neutral-900">
              No evaluations match these filters
            </p>
            <p className="mt-2 text-sm text-neutral-500">Re-enable evaluations to see scores.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-100 cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
