import React from "react";

export interface FilterPillItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  count?: number;
  badge?: string;
  description?: string;
}

export interface FilterPillGroupProps<T extends string = string> {
  items: FilterPillItem<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  size?: "sm" | "md" | "lg";
  variant?: "segmented" | "pills";
  className?: string;
  ariaLabel?: string;
}

export function FilterPillGroup<T extends string = string>({
  items,
  selectedId,
  onSelect,
  size = "md",
  variant = "segmented",
  className = "",
  ariaLabel = "Filter options",
}: FilterPillGroupProps<T>) {
  const sizeClasses = {
    sm: {
      container: "p-0.5 gap-0.5 rounded-lg",
      button: "px-2.5 py-1 text-xs gap-1.5",
      iconSize: 13,
      badge: "text-[10px] px-1 py-0.2",
    },
    md: {
      container: "p-1 gap-1 rounded-xl",
      button: "px-3 py-1.5 text-xs gap-1.5",
      iconSize: 14,
      badge: "text-[10px] px-1.5 py-0.5",
    },
    lg: {
      container: "p-1 gap-1.5 rounded-xl",
      button: "px-4 py-2 text-sm gap-2",
      iconSize: 16,
      badge: "text-xs px-2 py-0.5",
    },
  }[size];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % items.length;
      onSelect(items[nextIndex].id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      onSelect(items[prevIndex].id);
    }
  };

  if (variant === "pills") {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`flex flex-wrap items-center gap-1.5 ${className}`}
      >
        {items.map((item, index) => {
          const isSelected = item.id === selectedId;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={isSelected}
              onClick={() => onSelect(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              title={item.description || item.label}
              className={`inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 select-none cursor-pointer ${
                sizeClasses.button
              } ${
                isSelected
                  ? "bg-[#0047FF] text-white shadow-xs font-semibold ring-2 ring-[#0047FF]/20"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              {Icon && (
                <Icon
                  size={sizeClasses.iconSize}
                  className={isSelected ? "text-white" : "text-slate-500"}
                />
              )}
              <span>{item.label}</span>
              {typeof item.count === "number" && (
                <span
                  className={`tabular-nums rounded-full font-semibold ${sizeClasses.badge} ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.count}
                </span>
              )}
              {item.badge && (
                <span
                  className={`rounded font-bold uppercase tracking-wider ${sizeClasses.badge} ${
                    isSelected ? "bg-white text-[#0047FF]" : "bg-[#BEDBFF]/40 text-[#0047FF]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented control style (default)
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-slate-100/90 border border-slate-200/90 shadow-2xs ${sizeClasses.container} ${className}`}
    >
      {items.map((item, index) => {
        const isSelected = item.id === selectedId;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onSelect(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            title={item.description || item.label}
            className={`relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer ${
              sizeClasses.button
            } ${
              isSelected
                ? "bg-white text-[#0047FF] shadow-xs font-semibold border border-slate-200/70 ring-1 ring-[#0047FF]/15"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent"
            }`}
          >
            {Icon && (
              <Icon
                size={sizeClasses.iconSize}
                className={`shrink-0 transition-colors ${
                  isSelected ? "text-[#0047FF]" : "text-slate-500"
                }`}
              />
            )}
            <span className="truncate">{item.label}</span>

            {typeof item.count === "number" && (
              <span
                className={`tabular-nums rounded-full font-semibold shrink-0 ${sizeClasses.badge} ${
                  isSelected ? "bg-[#BEDBFF]/60 text-[#0047FF]" : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {item.count}
              </span>
            )}

            {item.badge && (
              <span
                className={`rounded font-bold uppercase tracking-wider shrink-0 ${
                  sizeClasses.badge
                } ${isSelected ? "bg-[#0047FF] text-white" : "bg-slate-200 text-slate-700"}`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
