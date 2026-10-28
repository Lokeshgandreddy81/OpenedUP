import React from "react";

export interface TosaraThinkingAnimationProps {
  size?: "inline" | "compact" | "hero" | number;
  fixedStage?: number;
  className?: string;
  color?: string;
}

// Aerodynamic pinwheel petal, C4 symmetric, centered at (0, 0)
// This is the SPIN shape — wider base, energetic
const P =
  "M 9.5 -31.5 C 10.5 -31.4, 12.5 -31.2, 13.2 -29.8 C 14.0 -28.2, 14.0 -25.8, 13.8 -24.0 " +
  "C 13.5 -21.8, 13.0 -19.8, 12.2 -18.0 C 11.2 -16.0, 10.0 -14.5, 8.8 -13.0 " +
  "C 7.5 -11.4, 6.3 -10.2, 4.8 -9.0 C 3.2 -7.7, 1.8 -6.5, 0.5 -5.5 " +
  "C -0.8 -4.5, -2.2 -3.2, -3.5 -3.5 C -4.6 -3.8, -5.2 -5.5, -5.8 -7.0 " +
  "C -6.5 -8.6, -7.0 -10.2, -6.8 -12.0 C -6.7 -14.0, -6.2 -16.0, -5.4 -18.0 " +
  "C -4.4 -20.2, -3.4 -21.8, -2.0 -23.5 C -0.5 -25.2, 1.2 -26.6, 2.8 -28.0 " +
  "C 4.5 -29.3, 5.9 -29.9, 7.2 -30.5 C 8.4 -31.1, 8.6 -31.6, 9.5 -31.5 Z";

// LANDING petal — pixel-perfect extracted from the Tosara logo mark
// 10 control points, C4 symmetric, centered at (0, 0)
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

// Four petals at 90° each — total pinwheel
const Petals = ({ fill }: { fill: string }) => (
  <g fill={fill}>
    <path d={P} />
    <path d={P} transform="rotate(90 0 0)" />
    <path d={P} transform="rotate(180 0 0)" />
    <path d={P} transform="rotate(270 0 0)" />
  </g>
);

// Dual tapered Saturn ring arcs, centered at (0, 0)
// Sweeps: 165° half-arcs (two arcs 180° apart) with tapered ends
const RingArcs = ({ fill }: { fill: string }) => (
  <g fill={fill}>
    {/* Arc 1: -15° to 150° */}
    <path
      d="M 41.1 -10.7 C 42.2 -6.8 43.5 -1.4 43.5 0 C 43.5 8 42 16 39 23.5 C 36 31 31 37.5 25 41.5 C 19 45.5 12 44.5 6 43 C 0 41.5 -7 38.5 -12 35 C -17 31.5 -22 26.5 -26 21 C -30 15.5 -33 9 -34.5 3 C -36 -3 -36 -8.5 -35.5 -10.7 C -35 -12.9 -35.3 -12.5 -34.5 -10 C -33.7 -7.5 -31 -1 -29 3.5 C -27 8 -24 14.5 -20 19.5 C -16 24.5 -11 29.5 -6 32.5 C -1 35.5 5 37.5 11 38.5 C 17 39.5 23 38 28 35 C 33 32 37 27 39.5 22 C 42 17 43 10.5 43 4 C 43 -2.5 42 -7 41.1 -10.7 Z"
      opacity={0.88}
    />
    {/* Arc 2: opposite side (180° rotation) */}
    <path
      d="M 41.1 -10.7 C 42.2 -6.8 43.5 -1.4 43.5 0 C 43.5 8 42 16 39 23.5 C 36 31 31 37.5 25 41.5 C 19 45.5 12 44.5 6 43 C 0 41.5 -7 38.5 -12 35 C -17 31.5 -22 26.5 -26 21 C -30 15.5 -33 9 -34.5 3 C -36 -3 -36 -8.5 -35.5 -10.7 C -35 -12.9 -35.3 -12.5 -34.5 -10 C -33.7 -7.5 -31 -1 -29 3.5 C -27 8 -24 14.5 -20 19.5 C -16 24.5 -11 29.5 -6 32.5 C -1 35.5 5 37.5 11 38.5 C 17 39.5 23 38 28 35 C 33 32 37 27 39.5 22 C 42 17 43 10.5 43 4 C 43 -2.5 42 -7 41.1 -10.7 Z"
      transform="rotate(180 0 0)"
      opacity={0.88}
    />
  </g>
);

export const TosaraThinkingAnimation: React.FC<TosaraThinkingAnimationProps> = ({
  size = "inline",
  fixedStage,
  className = "",
  color = "currentColor",
}) => {
  const px =
    typeof size === "number" ? size : size === "inline" ? 14 : size === "compact" ? 22 : 32;

  // ── Static resting mark (after thinking completes) ──────────────────────────
  // Shows the exact Tosara logo pinwheel — pixel-perfect from the brand mark.
  // Rotated -12.5° to match the canonical logo orientation (petals at diagonal axes).
  if (fixedStage === 8) {
    return (
      <svg
        viewBox="-40 -40 80 80"
        width={px}
        height={px}
        className={`shrink-0 overflow-visible ${className}`}
        style={{ display: "block" }}
        role="img"
        aria-label="Done thinking"
      >
        {/* The Tosara 4-petal pinwheel mark in canonical orientation */}
        <g transform="scale(0.85) rotate(-12.5)" fill={color}>
          <path d={LANDING_PETAL} />
          <path d={LANDING_PETAL} transform="rotate(90)" />
          <path d={LANDING_PETAL} transform="rotate(180)" />
          <path d={LANDING_PETAL} transform="rotate(270)" />
        </g>
      </svg>
    );
  }

  // ── Live Saturn-spin thinking indicator ─────────────────────────────────────
  //
  // The trick for true Saturn rotation in CSS:
  //
  //   RING: We wrap the arcs in TWO nested <g>:
  //     Outer <g> — permanent tilt:  rotate(-28deg) scaleY(0.62)
  //                                  This NEVER changes — it's the planet's axial tilt.
  //     Inner <g> — CSS spin:        animation: ring-spin 0.52s linear infinite
  //                                  transform-origin: 0 0  (SVG origin, already at center)
  //
  //   CORE: One <g> with CSS spin at 0.3s linear infinite
  //
  // Why this works: CSS `transform` on the inner <g> is applied FIRST (spin),
  // then the outer <g> tilt is applied — giving true axially-tilted orbital revolution.

  return (
    <svg
      viewBox="-40 -40 80 80"
      width={px}
      height={px}
      className={`shrink-0 overflow-visible ${className}`}
      style={{ display: "block" }}
      role="img"
      aria-label="Thinking"
    >
      {/* ── Saturn Ring ── */}
      {/* Outer g: permanent celestial tilt (static, never animates) */}
      <g style={{ transform: "rotate(-28deg) scaleY(0.62)", transformOrigin: "0 0" }}>
        {/* Inner g: the fast orbital spin on the tilted plane */}
        <g
          style={{
            transformOrigin: "0 0",
            animation: "tosaraRingOrbit 0.52s linear infinite",
          }}
        >
          <RingArcs fill={color} />
        </g>
      </g>

      {/* ── Core Pinwheel ── */}
      {/* Spins on the polar planetary axis — faster than the ring */}
      <g
        style={{
          transformOrigin: "0 0",
          animation: "tosaraCoreBlast 0.30s linear infinite",
        }}
      >
        <Petals fill={color} />
      </g>
    </svg>
  );
};
