export type ReactSkillRoadmapStatus = "personal" | "alternative" | "optional";

export interface ReactSkillRoadmapNode {
  id: string;
  title: string;
  status?: ReactSkillRoadmapStatus;
  roadmapId?: string;
}

export interface ReactSkillRoadmapGroup {
  id: string;
  parent?: ReactSkillRoadmapNode;
  items: ReactSkillRoadmapNode[];
}

export interface ReactSkillRoadmapStage {
  id: string;
  node: ReactSkillRoadmapNode;
  left?: ReactSkillRoadmapGroup[];
  right?: ReactSkillRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ReactSkillRoadmapSection {
  id: string;
  title?: string;
  stages: ReactSkillRoadmapStage[];
}

export interface ReactSkillRoadmapLink {
  label: string;
  roadmapId: string;
}

export const REACT_MARKERS: Array<{
  status: ReactSkillRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const REACT_RELATED_ROADMAPS: ReactSkillRoadmapLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "TypeScript Roadmap", roadmapId: "skill-typescript" },
  { label: "Next.js Roadmap", roadmapId: "skill-nextjs" },
  { label: "React Native Roadmap", roadmapId: "skill-react-native" },
  { label: "HTML Roadmap", roadmapId: "skill-html" },
  { label: "CSS Roadmap", roadmapId: "skill-css" },
];

export const REACT_CONTINUE_LEARNING: ReactSkillRoadmapLink[] = [
  { label: "Next.js", roadmapId: "skill-nextjs" },
  { label: "React Native", roadmapId: "skill-react-native" },
  { label: "TypeScript", roadmapId: "skill-typescript" },
  { label: "Frontend Performance", roadmapId: "best-practice-frontend-performance" },
  { label: "GraphQL", roadmapId: "skill-graphql" },
  { label: "Node.js", roadmapId: "skill-nodejs" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ReactSkillRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ReactSkillRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ReactSkillRoadmapNode[],
  parent?: ReactSkillRoadmapNode,
  customId?: string
): ReactSkillRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ReactSkillRoadmapStage, "id" | "node"> & {
    status?: ReactSkillRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ReactSkillRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. PREREQUISITES & REACT FUNDAMENTALS
const REACT_FUNDAMENTALS: ReactSkillRoadmapSection = {
  id: "react-fundamentals",
  title: "Prerequisites & React Fundamentals",
  stages: [
    stage("Prerequisites", {
      left: [
        g(
          [
            n("HTML Semantics & DOM", undefined, "skill-html"),
            n("CSS Box Model & Flexbox", undefined, "skill-css"),
            n("Modern JavaScript (ES6+)", "personal", "skill-javascript"),
            n("TypeScript Essentials", "personal", "skill-typescript"),
          ],
          n("Web Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Destructuring & Spread Operator"),
            n("Arrow Functions & Closures"),
            n("Array Methods (map, filter, reduce)"),
            n("Async / Await & Promises"),
            n("Event Loop & Microtasks"),
          ],
          n("JavaScript Primitives for React")
        ),
      ],
    }),
    stage("JSX & Component Basics", {
      left: [
        g(
          [
            n("Embedding Expressions in JSX"),
            n("Conditional Rendering (&&, ? :)"),
            n("Rendering Lists & Key Prop"),
            n("React Fragments (<></>)"),
            n("JSX Transformation (createElement)"),
          ],
          n("JSX Syntax & Rules")
        ),
      ],
      right: [
        g(
          [
            n("Functional Components", "personal"),
            n("Class Components (Legacy)", "alternative"),
            n("Pure Components & Immutability"),
          ],
          n("Component Paradigms")
        ),
      ],
      noteAfter:
        "React uses a declarative component model where UI is a pure projection of state and props.",
    }),
    stage("Props, State & Lifecycle", {
      left: [
        g(
          [
            n("Passing & Reading Props"),
            n("Children Prop & Slots"),
            n("Default & Optional Props"),
            n("Prop Drilling Trade-offs"),
          ],
          n("Props Management")
        ),
      ],
      right: [
        g(
          [
            n("Component Local State"),
            n("State Batching & Queuing"),
            n("Lifting State Up"),
            n("Mounting, Updating & Unmounting"),
          ],
          n("State & Lifecycle Dynamics")
        ),
      ],
      projectIdea:
        "Project Idea: Build an interactive task tracker with hierarchical sub-tasks and filtering.",
    }),
  ],
};

// 2. BUILT-IN REACT HOOKS
const BUILT_IN_REACT_HOOKS: ReactSkillRoadmapSection = {
  id: "built-in-react-hooks",
  title: "Built-in React Hooks",
  stages: [
    stage("Core State & Effects Hooks", {
      left: [
        g(
          [
            n("useState (State declarations)", "personal"),
            n("useReducer (Complex transitions)", "alternative"),
            n("useContext (Theme & auth scoping)"),
          ],
          n("State & Context Hooks")
        ),
      ],
      right: [
        g(
          [
            n("useEffect (Side effects & cleanup)", "personal"),
            n("useLayoutEffect (DOM measurement)", "optional"),
            n("useInsertionEffect (CSS-in-JS)", "optional"),
          ],
          n("Effect & Lifecycle Hooks")
        ),
      ],
      noteAfter:
        "Always observe the Rules of Hooks: call hooks only at the top level and only from React function components or custom hooks.",
    }),
    stage("Performance & Reference Hooks", {
      left: [
        g(
          [
            n("useRef (Mutable refs & DOM access)", "personal"),
            n("useImperativeHandle (Exposing ref API)", "optional"),
          ],
          n("Reference Hooks")
        ),
      ],
      right: [
        g(
          [
            n("useMemo (Expensive computations)", "personal"),
            n("useCallback (Stable function identity)", "personal"),
          ],
          n("Memoization Hooks")
        ),
      ],
    }),
    stage("Concurrent & Transition Hooks", {
      left: [
        g(
          [
            n("useTransition (Non-blocking updates)", "personal"),
            n("useDeferredValue (Deferred state updates)", "alternative"),
            n("useId (Unique accessibility IDs)"),
          ],
          n("Concurrent Features (React 18+)")
        ),
      ],
      right: [
        g(
          [
            n("useSyncExternalStore (Subscribing to stores)", "optional"),
            n("useOptimistic (React 19 optimistic UI)", "optional"),
            n("useActionState / useFormStatus", "optional"),
          ],
          n("Modern React 19 Additions")
        ),
      ],
      projectIdea:
        "Project Idea: Real-time searchable data table with useTransition and deferred rendering.",
    }),
  ],
};

// 3. COMPONENT ARCHITECTURE & PATTERNS
const COMPONENT_ARCHITECTURE_AND_PATTERNS: ReactSkillRoadmapSection = {
  id: "component-architecture-and-patterns",
  title: "Component Architecture & Patterns",
  stages: [
    stage("Design Principles", {
      left: [
        g(
          [
            n("Composition vs Inheritance", "personal"),
            n("Container / Presentational Pattern", "alternative"),
            n("Compound Components Pattern", "personal"),
          ],
          n("Architectural Paradigms")
        ),
      ],
      right: [
        g(
          [
            n("Controlled Components (Single source of truth)", "personal"),
            n("Uncontrolled Components (FormData / refs)", "alternative"),
            n("Polymorphic Components (as prop)"),
          ],
          n("Form & Input Patterns")
        ),
      ],
    }),
    stage("Reusability & Abstraction", {
      left: [
        g(
          [
            n("Custom Hooks (Logic extraction)", "personal"),
            n("Render Props Pattern", "alternative"),
            n("Higher-Order Components (HOC)", "optional"),
          ],
          n("Logic Sharing Techniques")
        ),
      ],
      right: [
        g(
          [
            n("Slot & Layout Composition"),
            n("Feature-Sliced Design (FSD)"),
            n("Atomic Design (Atoms, Molecules, Organisms)"),
          ],
          n("Directory & Code Organization")
        ),
      ],
      noteAfter:
        "Favor Custom Hooks and Component Composition over Higher-Order Components for clearer stack traces and TypeScript type inference.",
      projectIdea:
        "Project Idea: Develop a headless, accessible Modal & Accordion component library using Compound Components.",
    }),
  ],
};

// 4. STATE MANAGEMENT
const STATE_MANAGEMENT: ReactSkillRoadmapSection = {
  id: "state-management",
  title: "State Management",
  stages: [
    stage("Client State Solutions", {
      left: [
        g(
          [
            n("Zustand (Minimal & fast)", "personal"),
            n("Redux Toolkit (Enterprise standard)", "alternative"),
            n("Jotai / Recoil (Atomic primitives)", "alternative"),
            n("MobX (Reactive observables)", "optional"),
          ],
          n("Global Client Stores")
        ),
      ],
      right: [
        g(
          [
            n("React Context API (Low frequency updates)"),
            n("Selective Subscriptions & Selectors"),
            n("Immer (Immutable updates)"),
          ],
          n("State Architecture")
        ),
      ],
    }),
    stage("Server State & Caching", {
      left: [
        g(
          [
            n("TanStack Query / React Query", "personal"),
            n("SWR (Stale-While-Revalidate)", "alternative"),
            n("RTK Query", "optional"),
          ],
          n("Server State Managers")
        ),
      ],
      right: [
        g(
          [
            n("Query Invalidation & Mutation"),
            n("Optimistic Updates"),
            n("Infinite Queries & Pagination"),
            n("Window Focus Refetching & Stale Time"),
          ],
          n("Caching Patterns")
        ),
      ],
      noteAfter:
        "Separate server state (caching, synchronization) from client UI state (modals, active tabs) to dramatically reduce codebase complexity.",
      projectIdea:
        "Project Idea: E-commerce shopping cart with Zustand for cart drawer and TanStack Query for catalog & inventory.",
    }),
  ],
};

// 5. ROUTING & DATA FETCHING
const ROUTING_AND_DATA_FETCHING: ReactSkillRoadmapSection = {
  id: "routing-and-data-fetching",
  title: "Routing & Data Fetching",
  stages: [
    stage("Client-Side Routing", {
      left: [
        g(
          [
            n("React Router v6/v7 (Data APIs & loaders)", "personal"),
            n("TanStack Router (Type-safe routing)", "alternative"),
          ],
          n("Router Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Nested Routes & Outlets"),
            n("Dynamic URL Params & Query Strings"),
            n("Protected Routes & Guards"),
            n("Route Loaders & Actions"),
          ],
          n("Routing Primitives")
        ),
      ],
    }),
    stage("Resilience & Async Loading", {
      left: [
        g(
          [
            n("React Error Boundaries", "personal"),
            n("react-error-boundary library", "personal"),
            n("Fallback UI & Reset Strategies"),
          ],
          n("Error Handling")
        ),
      ],
      right: [
        g(
          [
            n("React Suspense for Data Fetching"),
            n("Suspense Boundaries"),
            n("Skeleton Loaders & Shimmer Effects"),
          ],
          n("Async Streaming & Suspense")
        ),
      ],
      projectIdea:
        "Project Idea: Multi-step checkout wizard with nested routes, type-safe query parameters, and custom error boundaries.",
    }),
  ],
};

// 6. PERFORMANCE OPTIMIZATION
const PERFORMANCE_OPTIMIZATION: ReactSkillRoadmapSection = {
  id: "performance-optimization",
  title: "Performance Optimization",
  stages: [
    stage("Rendering & Bundle Optimization", {
      left: [
        g(
          [
            n("React.memo (Skip re-renders)", "personal"),
            n("Code Splitting (React.lazy + Suspense)", "personal"),
            n("Dynamic Imports & Tree Shaking"),
            n("Optimizing Context Re-renders"),
          ],
          n("Re-render & Bundle Control")
        ),
      ],
      right: [
        g(
          [
            n("TanStack Virtual (Large lists & grids)", "personal"),
            n("react-window / react-virtualized", "alternative"),
            n("Intersection Observer Lazy Loading"),
          ],
          n("List Virtualization")
        ),
      ],
    }),
    stage("Metrics & Profiling", {
      left: [
        g(
          [
            n("React DevTools Profiler", "personal"),
            n("Highlight Updates on Render"),
            n("Flamegraph & Ranked Charts"),
          ],
          n("Developer Tools")
        ),
      ],
      right: [
        g(
          [
            n("Core Web Vitals (LCP, INP, CLS)"),
            n("Bundle Analyzer (rollup-plugin-visualizer)"),
            n("Web Workers for Heavy Computation"),
          ],
          n("Production Vitals")
        ),
      ],
      noteAfter:
        "Avoid premature optimization. Profile first with React DevTools to pinpoint unneeded re-renders before applying React.memo or useCallback.",
      projectIdea:
        "Project Idea: Virtualized feed rendering 50,000 items with 60fps scrolling and memory profiling.",
    }),
  ],
};

// 7. TESTING & ECOSYSTEM
const TESTING_AND_ECOSYSTEM: ReactSkillRoadmapSection = {
  id: "testing-and-ecosystem",
  title: "Testing & Ecosystem",
  stages: [
    stage("Testing Strategies", {
      left: [
        g(
          [
            n("Vitest (Blazing fast test runner)", "personal"),
            n("Jest (Classic test runner)", "alternative"),
            n("React Testing Library (RTL)", "personal"),
          ],
          n("Unit & Integration Testing")
        ),
      ],
      right: [
        g(
          [
            n("Mock Service Worker (MSW)", "personal"),
            n("User Event (@testing-library/user-event)"),
            n("Playwright / Cypress (End-to-End)", "personal"),
          ],
          n("Mocking & E2E")
        ),
      ],
    }),
    stage("Frameworks & Tooling", {
      left: [
        g(
          [
            n("Next.js (App Router, SSR, RSC)", "personal", "skill-nextjs"),
            n("Remix / React Router v7", "alternative"),
            n("Vite (Modern SPA tooling)", "personal"),
            n("Astro (Content & Island architecture)", "alternative"),
          ],
          n("Meta-Frameworks & Bundlers")
        ),
      ],
      right: [
        g(
          [
            n("Tailwind CSS", "personal", "skill-css"),
            n("CSS Modules / PostCSS"),
            n("Storybook (UI Component Workshop)", "personal"),
            n("shadcn/ui / Radix UI Primitives", "personal"),
          ],
          n("UI Styling & Component Systems")
        ),
      ],
      projectIdea:
        "Project Idea: Full-stack production-ready SaaS dashboard built with Next.js, TanStack Query, Tailwind CSS, and tested with Vitest + RTL.",
    }),
  ],
};

export const REACT_SECTIONS: ReactSkillRoadmapSection[] = [
  REACT_FUNDAMENTALS,
  BUILT_IN_REACT_HOOKS,
  COMPONENT_ARCHITECTURE_AND_PATTERNS,
  STATE_MANAGEMENT,
  ROUTING_AND_DATA_FETCHING,
  PERFORMANCE_OPTIMIZATION,
  TESTING_AND_ECOSYSTEM,
];
