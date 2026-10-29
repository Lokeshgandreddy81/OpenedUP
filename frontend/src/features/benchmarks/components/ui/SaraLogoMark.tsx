import React from "react";

export interface SaraLogoMarkProps {
  size?: number | string;
  color?: string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

/**
 * Pixel-perfect vector representation of the Sara brand mark.
 * Supports any custom fill color, responsive sizing, and zero-flicker rendering.
 */
const LANDING_PETAL =
  "M 21.39 -42.00 C 25.60 -41.83, 21.81 -35.60, 20.35 -31.04 " +
  "C 18.89 -26.48, 18.06 -23.64, 14.09 -19.22 " +
  "C 10.12 -14.80, 4.10 -12.37, 0.52 -8.96 " +
  "C -3.06 -5.55, -2.02 -1.72, -3.83 -2.17 " +
  "C -5.64 -2.62, -7.55 -7.43, -8.52 -11.22 " +
  "C -9.49 -15.01, -9.12 -18.14, -8.70 -21.13 " +
  "C -8.28 -24.12, -8.03 -24.01, -6.43 -26.17 " +
  "C -4.83 -28.33, -6.26 -28.74, -0.70 -31.91 " +
  "C 4.86 -35.08, 17.18 -42.17, 21.39 -42.00 Z";

export const SaraLogoMark: React.FC<SaraLogoMarkProps> = ({
  size = 16,
  color = "currentColor",
  className = "",
  "aria-hidden": ariaHidden = true,
}) => {
  const px = typeof size === "number" ? `${size}px` : size;

  return (
    <svg
      viewBox="-40 -40 80 80"
      width={px}
      height={px}
      className={`shrink-0 overflow-visible inline-block align-middle ${className}`}
      style={{ display: "inline-block" }}
      role="img"
      aria-label="Sara logo"
      aria-hidden={ariaHidden}
    >
      <g transform="scale(0.85) rotate(-12.5)" fill={color}>
        <path d={LANDING_PETAL} />
        <path d={LANDING_PETAL} transform="rotate(90)" />
        <path d={LANDING_PETAL} transform="rotate(180)" />
        <path d={LANDING_PETAL} transform="rotate(270)" />
      </g>
    </svg>
  );
};
