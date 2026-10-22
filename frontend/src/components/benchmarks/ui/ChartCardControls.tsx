import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, SlidersHorizontal } from "lucide-react";

export type ColorBy = "model" | "agent";

export interface ColorByControlProps {
  value: ColorBy;
  onChange: (value: ColorBy) => void;
}

export const ColorByControl: React.FC<ColorByControlProps> = ({ value, onChange }) => (
  <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
    <span className="text-[11.5px] text-neutral-400 font-normal">Color by</span>
    <div className="inline-flex p-0.5 bg-[#F1F3F5] rounded-lg border-0">
      {(["model", "agent"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-3 py-1 rounded-md text-[11.5px] capitalize transition-all cursor-pointer ${
            value === option
              ? "bg-white text-neutral-900 font-semibold shadow-2xs border-0"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

export interface FilterableModel {
  id: string;
  name: string;
  agentName: string;
  creatorName: string;
}

export interface ModelsFilterControlProps<M extends FilterableModel> {
  models: M[];
  selectedIds: string[];
  onChangeSelection: (ids: string[]) => void;
  defaultIds: string[];
  swatchColorFor: (model: M) => string;
  shownCount: number;
}

export const ModelsFilterControl = <M extends FilterableModel>({
  models,
  selectedIds,
  onChangeSelection,
  defaultIds,
  swatchColorFor,
  shownCount,
}: ModelsFilterControlProps<M>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredModels = useMemo(() => {
    if (!query.trim()) return models;
    const q = query.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.agentName.toLowerCase().includes(q) ||
        m.creatorName.toLowerCase().includes(q)
    );
  }, [models, query]);

  const toggleModel = (id: string) => {
    onChangeSelection(
      selectedIds.includes(id) ? selectedIds.filter((m) => m !== id) : [...selectedIds, id]
    );
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 bg-[#F1F3F5] hover:bg-neutral-200/70 transition-colors cursor-pointer border-0 shadow-2xs"
        >
          <span>
            {shownCount} of {models.length} models
          </span>
          <ChevronsUpDown size={12} className="text-neutral-400" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-neutral-200/80 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-2 max-h-[360px] animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between text-xs px-1 text-neutral-500 pb-1.5 border-b border-neutral-100">
              <span className="font-semibold text-neutral-800 text-[11.5px]">
                Filter Models ({selectedIds.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangeSelection(defaultIds)}
                  className="text-[11.5px] text-blue-600 hover:underline cursor-pointer font-medium"
                >
                  Default ({defaultIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSelection(models.map((m) => m.id))}
                  className="text-[11.5px] text-neutral-500 hover:underline cursor-pointer"
                >
                  All ({models.length})
                </button>
              </div>
            </div>

            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search model or agent..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div className="overflow-y-auto max-h-[220px] flex flex-col gap-0.5 divide-y divide-neutral-50 no-scrollbar">
              {filteredModels.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModel(m.id)}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-neutral-50 rounded text-xs text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: swatchColorFor(m) }}
                      />
                      <span className="font-medium text-neutral-900 truncate text-[11.5px]">
                        {m.agentName}
                      </span>
                      <span className="text-neutral-400 truncate text-[10.5px]">{m.name}</span>
                    </div>
                    {isSelected && <Check size={13} className="text-neutral-800 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter Sliders Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Filter models"
        className="p-1.5 rounded-lg text-neutral-600 bg-[#F1F3F5] hover:bg-neutral-200/70 transition-colors cursor-pointer border-0 shadow-2xs"
      >
        <SlidersHorizontal size={14} />
      </button>
    </div>
  );
};
