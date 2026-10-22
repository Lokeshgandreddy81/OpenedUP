import React from "react";
import { TrendingUp, TrendingDown, Sparkles, Lock, GitBranch, ShieldAlert } from "lucide-react";
import { CreatorId, ReasoningType, WeightsType } from "../types";
import { CreatorLogo, getCreatorName } from "./CreatorLogo";

// ==========================================
// 1. GENERAL BENCHMARK BADGE
// ==========================================

export interface BenchmarkBadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "brand" | "success" | "warning" | "info" | "purple";
  size?: "xs" | "sm" | "md";
  icon?: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export const BenchmarkBadge: React.FC<BenchmarkBadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  icon,
  className = "",
  title,
  onClick,
}) => {
  const sizeStyles = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
  }[size];

  const variantStyles = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/60",
    brand: "bg-[#BEDBFF]/30 text-[#0047FF] border-[#BEDBFF] hover:bg-[#BEDBFF]/50",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100/60",
    warning: "bg-amber-50 text-amber-800 border-amber-200/70 hover:bg-amber-100/60",
    info: "bg-sky-50 text-sky-700 border-sky-200/70 hover:bg-sky-100/60",
    purple: "bg-[#BEDBFF]/25 text-[#0047FF] border-[#BEDBFF]/70 hover:bg-[#BEDBFF]/40",
  }[variant];

  const clickableStyles = onClick ? "cursor-pointer active:scale-95 transition-transform" : "";

  return (
    <span
      role={onClick ? "button" : undefined}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center font-medium rounded-md border ${sizeStyles} ${variantStyles} ${clickableStyles} shrink-0 select-none ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

// ==========================================
// 2. WEIGHTS BADGE
// ==========================================

export interface WeightsBadgeProps {
  weightsType: WeightsType;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export const WeightsBadge: React.FC<WeightsBadgeProps> = ({
  weightsType,
  size = "sm",
  className = "",
}) => {
  switch (weightsType) {
    case "open-weights":
      return (
        <BenchmarkBadge
          variant="success"
          size={size}
          className={className}
          icon={<GitBranch size={11} className="text-emerald-600" />}
          title="Open Weights model: publicly accessible weights for self-hosting"
        >
          Open Weights
        </BenchmarkBadge>
      );

    case "commercial-restricted":
      return (
        <BenchmarkBadge
          variant="warning"
          size={size}
          className={className}
          icon={<ShieldAlert size={11} className="text-amber-600" />}
          title="Commercial Restricted: license restrictions apply for commercial deployments"
        >
          Commercial Restricted
        </BenchmarkBadge>
      );

    case "proprietary":
    default:
      return (
        <BenchmarkBadge
          variant="neutral"
          size={size}
          className={className}
          icon={<Lock size={10} className="text-slate-500" />}
          title="Proprietary API: served exclusively via provider APIs"
        >
          Proprietary
        </BenchmarkBadge>
      );
  }
};

// ==========================================
// 3. REASONING BADGE
// ==========================================

export interface ReasoningBadgeProps {
  reasoningType?: ReasoningType;
  isReasoningModel?: boolean;
  size?: "xs" | "sm" | "md";
  hideIfStandard?: boolean;
  className?: string;
}

export const ReasoningBadge: React.FC<ReasoningBadgeProps> = ({
  reasoningType,
  isReasoningModel,
  size = "sm",
  hideIfStandard = false,
  className = "",
}) => {
  const isExtended = reasoningType === "extended-thinking" || isReasoningModel === true;

  if (!isExtended) {
    if (hideIfStandard) return null;
    return (
      <BenchmarkBadge
        variant="neutral"
        size={size}
        className={className}
        title="Standard generation without extended reasoning phase"
      >
        Standard
      </BenchmarkBadge>
    );
  }

  return (
    <BenchmarkBadge
      variant="warning"
      size={size}
      className={`bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border-amber-300/80 font-semibold shadow-xs ${className}`}
      icon={<Sparkles size={11} className="text-amber-600 animate-pulse" />}
      title="Extended Thinking: model employs explicit chain-of-thought test-time compute"
    >
      Extended Thinking
    </BenchmarkBadge>
  );
};

// ==========================================
// 4. CREATOR BADGE
// ==========================================

export interface CreatorBadgeProps {
  creator: CreatorId;
  displayName?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  onClick?: () => void;
}

export const CreatorBadge: React.FC<CreatorBadgeProps> = ({
  creator,
  displayName,
  size = "sm",
  className = "",
  onClick,
}) => {
  const name = displayName || getCreatorName(creator);
  const logoSize = size === "xs" ? 12 : size === "md" ? 16 : 14;

  return (
    <BenchmarkBadge
      variant="neutral"
      size={size}
      onClick={onClick}
      className={`bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-medium ${className}`}
      icon={<CreatorLogo creator={creator} size={logoSize} />}
      title={`Creator: ${name}`}
    >
      {name}
    </BenchmarkBadge>
  );
};

// ==========================================
// 5. METRIC DELTA BADGE
// ==========================================

export interface MetricDeltaBadgeProps {
  /** Delta numerical value, e.g. 15.2 for +15.2% or -24.0 */
  delta: number;
  /** Format method: percentage, raw points, or speed factor */
  format?: "percent" | "points" | "ratio" | "raw";
  /** Whether a positive delta indicates an improvement (true for speed/quality, false for latency/price) */
  isGoodWhenPositive?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
  title?: string;
}

export const MetricDeltaBadge: React.FC<MetricDeltaBadgeProps> = ({
  delta,
  format = "percent",
  isGoodWhenPositive = true,
  size = "sm",
  className = "",
  title,
}) => {
  const isPositive = delta > 0;
  const isZero = Math.abs(delta) < 0.001;

  // Determine if this change is considered favorable
  const isFavorable = isPositive ? isGoodWhenPositive : !isGoodWhenPositive;

  const formattedValue = (() => {
    const sign = isPositive ? "+" : "";
    switch (format) {
      case "percent":
        return `${sign}${delta.toFixed(1)}%`;
      case "points":
        return `${sign}${delta.toFixed(1)} pts`;
      case "ratio":
        return `${sign}${delta.toFixed(2)}×`;
      case "raw":
      default:
        return `${sign}${delta.toFixed(1)}`;
    }
  })();

  const colorStyles = isZero
    ? "bg-slate-100 text-slate-600 border-slate-200"
    : isFavorable
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
      : "bg-rose-50 text-rose-700 border-rose-200/70";

  const icon = isZero ? null : isPositive ? (
    <TrendingUp size={11} className="shrink-0" />
  ) : (
    <TrendingDown size={11} className="shrink-0" />
  );

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 font-semibold tabular-nums rounded-md border ${
        size === "xs"
          ? "text-[10px] px-1 py-0.2"
          : size === "md"
            ? "text-xs px-2 py-0.5"
            : "text-[11px] px-1.5 py-0.5"
      } ${colorStyles} shrink-0 select-none ${className}`}
    >
      {icon}
      <span>{formattedValue}</span>
    </span>
  );
};
