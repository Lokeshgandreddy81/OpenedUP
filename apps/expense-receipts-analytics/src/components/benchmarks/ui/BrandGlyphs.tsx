import React from "react";
import type { MetricDimension } from "../types";
import { DIMENSION_CONFIGS, BRAND_COLORS } from "../types";

export interface SquareGlyphProps {
  dimension?: MetricDimension;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-2.5 h-2.5 rounded-[2px]",
  sm: "w-3.5 h-3.5 rounded-[3px]",
  md: "w-4 h-4 rounded-[4px]",
  lg: "w-5 h-5 rounded-[5px]",
};

/**
 * Signature Artificial Analysis square dimension indicator.
 * Appears beside dimension headers (Purple for Intelligence, Yellow for Speed, Orange for Cost).
 */
export const SquareGlyph: React.FC<SquareGlyphProps> = ({
  dimension,
  color,
  size = "sm",
  className = "",
}) => {
  const dimensionConfig = dimension ? DIMENSION_CONFIGS[dimension] : null;
  const bgStyle = color
    ? { backgroundColor: color }
    : dimensionConfig
      ? { backgroundColor: dimensionConfig.colorHex }
      : undefined;
  const defaultBgClass = !color && !dimensionConfig ? "bg-[#0047FF]" : "";

  return (
    <span
      className={`inline-block shrink-0 ${SIZE_MAP[size]} ${defaultBgClass} ${className}`}
      style={bgStyle}
      aria-hidden="true"
    />
  );
};

export interface BrandCapsuleProps {
  children: React.ReactNode;
  variant?: "black" | "neutral" | "subtle" | "plum";
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * Capsule pill element matching Artificial Analysis's rounded-full container system.
 */
export const BrandCapsule: React.FC<BrandCapsuleProps> = ({
  children,
  variant = "black",
  className = "",
  onClick,
  active = false,
}) => {
  const variantStyles = {
    black:
      active || variant === "black"
        ? "bg-black text-white hover:bg-neutral-800 shadow-xs"
        : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
    neutral: active
      ? "bg-black text-white shadow-xs"
      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
    subtle: active
      ? "bg-[#F0F4F8] text-slate-900 font-semibold border border-slate-300"
      : "bg-[#F0F4F8]/70 text-slate-600 hover:text-slate-900 hover:bg-[#F0F4F8]",
    plum: "bg-[#001E80] text-white hover:bg-[#002B99]",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${variantStyles[variant]} ${className}`}
    >
      {children}
    </Component>
  );
};

/**
 * Authentic Artificial Analysis brand capsule pill matching the top navigation bar.
 */
export const AACapsuleLogo: React.FC<{
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}> = ({ className = "", onClick, compact = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center ${
        compact ? "gap-2 px-3 py-1.5 text-xs" : "gap-2.5 px-4 py-2 text-sm"
      } bg-black hover:bg-neutral-800 text-white rounded-full shadow-xs transition-colors cursor-pointer active:scale-98 ${className}`}
      aria-label="Artificial Analysis Home"
    >
      {/* Official Artificial Analysis Geometric Brandmark */}
      <svg
        width={compact ? "13" : "15"}
        height={compact ? "13" : "15"}
        viewBox="0 0 16 16"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white shrink-0"
        aria-hidden="true"
      >
        <path
          d="M13.982 16h1.996v-3.997h-3.992V16zM7.984 0 3.992 3.997H0v3.998h5.988L9.98 3.997h2.006V0zM7.984 7.995l-3.992 4.008H0V16h5.988l3.992-3.997h2.006V7.995zM15.978 7.995V3.997h-3.992v3.998h3.992"
          fill="currentColor"
        />
      </svg>
      <span className="font-semibold tracking-tight text-white select-none whitespace-nowrap">
        Artificial Analysis
      </span>
    </button>
  );
};

/**
 * Radial aura glow effect for hero cards (e.g. Optima purple/mint halos).
 */
export const HaloGlow: React.FC<{
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}> = ({ primaryColor = "#0047FF", secondaryColor = "#5C8CFF", className = "" }) => {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40 mix-blend-screen"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-35 mix-blend-screen"
        style={{ backgroundColor: secondaryColor }}
      />
    </div>
  );
};
