export type BestPracticeStatus = "personal" | "alternative" | "optional";
export type BestPracticeImpact = "critical" | "high" | "recommended" | "audit";

export interface BestPracticeNode {
  id: string;
  title: string;
  status?: BestPracticeStatus;
  impact?: BestPracticeImpact;
  roadmapId?: string;
}

export interface BestPracticeGroup {
  id: string;
  parent?: BestPracticeNode;
  items: BestPracticeNode[];
}

export interface BestPracticeStage {
  id: string;
  node: BestPracticeNode;
  left?: BestPracticeGroup[];
  right?: BestPracticeGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface BestPracticeSection {
  id: string;
  title?: string;
  stages: BestPracticeStage[];
}

export interface BestPracticeLink {
  label: string;
  roadmapId: string;
}

export interface BestPracticeMetric {
  label: string;
  value: string;
  detail: string;
}

export const FRONTEND_PERFORMANCE_METRICS: BestPracticeMetric[] = [
  { label: "LCP Target", value: "< 2.5s", detail: "Largest Contentful Paint 75th percentile" },
  { label: "INP Target", value: "< 200ms", detail: "Interaction to Next Paint responsive gate" },
  { label: "CLS Target", value: "< 0.1", detail: "Cumulative Layout Shift visual stability" },
  { label: "Lighthouse Budget", value: "> 95", detail: "Performance score budget in CI" },
];

export const FRONTEND_PERFORMANCE_MARKERS: Array<{
  status: BestPracticeStatus;
  label: string;
}> = [
  { status: "personal", label: "Core Vitals (P0)" },
  { status: "alternative", label: "Trade-off / Alternative" },
  { status: "optional", label: "Advanced Tuning" },
];

export const FRONTEND_PERFORMANCE_RELATED_ROADMAPS: BestPracticeLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "React Roadmap", roadmapId: "react" },
  { label: "JavaScript Roadmap", roadmapId: "javascript" },
  { label: "TypeScript Roadmap", roadmapId: "typescript" },
  { label: "Backend Performance", roadmapId: "best-practice-backend-performance" },
];

export const FRONTEND_PERFORMANCE_CONTINUE_LEARNING: BestPracticeLink[] = [
  { label: "Backend Performance Best Practices", roadmapId: "best-practice-backend-performance" },
  { label: "Code Review Best Practices", roadmapId: "best-practice-code-review" },
  { label: "API Security Best Practices", roadmapId: "best-practice-api-security" },
  { label: "AWS Best Practices", roadmapId: "best-practice-aws" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BestPracticeStatus,
  impact?: BestPracticeImpact,
  roadmapId?: string,
  customId?: string
): BestPracticeNode => ({
  id: customId ?? slug(title),
  title,
  status,
  impact,
  roadmapId,
});

const g = (
  items: BestPracticeNode[],
  parent?: BestPracticeNode,
  customId?: string
): BestPracticeGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BestPracticeStage, "id" | "node"> & {
    status?: BestPracticeStatus;
    impact?: BestPracticeImpact;
    customId?: string;
    roadmapId?: string;
  } = {}
): BestPracticeStage => {
  const { status, impact, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, impact, roadmapId, customId),
    ...rest,
  };
};

const CORE_WEB_VITALS: BestPracticeSection = {
  id: "core-web-vitals",
  title: "Core Web Vitals & Real User Monitoring (RUM)",
  stages: [
    stage("Core Web Vitals & Field Telemetry", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Largest Contentful Paint (LCP) < 2.5s", "personal", "critical"),
            n("Interaction to Next Paint (INP) < 200ms", "personal", "critical"),
            n("Cumulative Layout Shift (CLS) < 0.1", "personal", "critical"),
          ],
          n("Google Web Vitals Thresholds")
        ),
      ],
      right: [
        g(
          [
            n("Real User Monitoring (RUM) via web-vitals lib", "personal", "high"),
            n("Performance Budgets in CI (Bundlesize / Lighthouse CI)", "personal", "high"),
            n("Synthetic Monitoring & SpeedCurve / Calibre alerts", "personal", "recommended"),
          ],
          n("Continuous Telemetry")
        ),
      ],
      noteAfter:
        "Field data (Chrome UX Report / web-vitals library) reflects real 75th percentile user experiences across varied networks and device capabilities.",
      projectIdea:
        "Integrate the web-vitals npm package into your frontend analytics pipeline with INP and LCP attribution breakdown.",
    }),
  ],
};

const ASSET_OPTIMIZATION: BestPracticeSection = {
  id: "asset-optimization",
  title: "Asset Optimization & Modern Media",
  stages: [
    stage("Modern Media & Typography Loading", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("Next-Gen Formats: AVIF and WebP with fallback", "personal", "high"),
            n("Responsive Images with srcset and sizes attribute", "personal", "high"),
            n("SVGO optimization & modern vector sprite sheets", "personal", "recommended"),
          ],
          n("Image & Vector Delivery")
        ),
      ],
      right: [
        g(
          [
            n("Preload Critical Webfonts (font-display: swap)", "personal", "critical"),
            n("Self-host Variable Fonts in WOFF2 format", "personal", "high"),
            n("Lazy-load Below-the-Fold images (loading='lazy')", "personal", "high"),
          ],
          n("Font & Loading Strategy")
        ),
      ],
      noteAfter:
        "Always specify explicit width and height attributes (or aspect-ratio in CSS) on images and video wrappers to eliminate CLS layout shifts.",
    }),
  ],
};

const JS_EXECUTION: BestPracticeSection = {
  id: "js-execution",
  title: "JavaScript Execution & Bundle Optimization",
  stages: [
    stage("Bundle Splitting & Main Thread Responsiveness", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Route-based Code Splitting (React.lazy / dynamic import)", "personal", "critical"),
            n("Tree-shaking with ESM & sideEffects: false", "personal", "high"),
            n("Audit Dependencies (bundlephobia & depcheck)", "personal", "high"),
          ],
          n("Bundle Strategy")
        ),
      ],
      right: [
        g(
          [
            n("Avoid Long Tasks (> 50ms) blocking Main Thread", "personal", "critical"),
            n(
              "Yield to main thread with scheduler.yield() / requestIdleCallback",
              "personal",
              "high"
            ),
            n("Offload compute to Web Workers (Comlink)", "alternative", "recommended"),
          ],
          n("Execution & Scheduling")
        ),
      ],
      projectIdea:
        "Run Webpack Bundle Analyzer or Vite visualizer to identify and split vendor chunks larger than 100kB gzipped.",
    }),
  ],
};

const CSS_AND_RENDERING: BestPracticeSection = {
  id: "css-and-rendering",
  title: "CSS & Rendering Pipeline Performance",
  stages: [
    stage("CSS Delivery & Layout Shift Elimination", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("Critical CSS inlining for above-the-fold render", "personal", "high"),
            n("Avoid Layout Thrashing / Forced Synchronous Layouts", "personal", "critical"),
            n("content-visibility: auto for offscreen components", "personal", "recommended"),
          ],
          n("Rendering Engine Tuning")
        ),
      ],
      right: [
        g(
          [
            n("GPU-composited transforms (translate3d, scale, opacity)", "personal", "high"),
            n("Use will-change sparingly on animating layers", "alternative", "recommended"),
            n("Purge unused CSS with PurgeCSS / Tailwind JIT", "personal", "high"),
          ],
          n("Compositing & Layer Management")
        ),
      ],
      noteAfter:
        "Avoid reading DOM geometry (e.g. offsetTop, getBoundingClientRect) immediately after mutating styles to avoid Forced Synchronous Reflow.",
    }),
  ],
};

const DOM_VIRTUALIZATION: BestPracticeSection = {
  id: "dom-virtualization",
  title: "DOM Virtualization & State Efficiency",
  stages: [
    stage("DOM Tree Depth & React Re-render Hygiene", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("Virtual Scrolling with TanStack Virtual / react-window", "personal", "critical"),
            n("Keep DOM tree depth < 32 nodes & total elements < 1500", "personal", "high"),
            n("Windowing long dropdown menus and data grids", "personal", "high"),
          ],
          n("DOM Virtualization")
        ),
      ],
      right: [
        g(
          [
            n("Memoize costly calculations with useMemo & useCallback", "personal", "high"),
            n("Atomic state management to isolate re-render scope", "personal", "high"),
            n("React Compiler / memo for component pure trees", "optional", "recommended"),
          ],
          n("State Reactivity Scope")
        ),
      ],
      projectIdea:
        "Profile your heaviest UI view using React DevTools Profiler to catch cascading re-renders and unnecessary parent-child updates.",
    }),
  ],
};

const CACHING_AND_EDGE: BestPracticeSection = {
  id: "caching-and-edge",
  title: "Caching, Service Workers & Edge Delivery",
  stages: [
    stage("Edge Delivery & HTTP Caching Protocols", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Cache-Control: immutable for content-hashed assets", "personal", "critical"),
            n("stale-while-revalidate for dynamic API endpoints", "personal", "high"),
            n("Global CDN delivery with HTTP/2 or HTTP/3 (QUIC)", "personal", "critical"),
          ],
          n("HTTP & Edge Caching")
        ),
      ],
      right: [
        g(
          [
            n("Service Worker precaching with Workbox", "personal", "high"),
            n("Offline fallback shell with CacheFirst strategy", "personal", "recommended"),
            n("Brotli (br) compression over Gzip for static assets", "personal", "high"),
          ],
          n("PWA & Network Resiliency")
        ),
      ],
      noteAfter:
        "Static hashed JavaScript and CSS bundles should be cached with 'max-age=31536000, immutable', while index.html should use 'no-cache'.",
    }),
  ],
};

export const FRONTEND_PERFORMANCE_SECTIONS: BestPracticeSection[] = [
  CORE_WEB_VITALS,
  ASSET_OPTIMIZATION,
  JS_EXECUTION,
  CSS_AND_RENDERING,
  DOM_VIRTUALIZATION,
  CACHING_AND_EDGE,
];
