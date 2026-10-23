export type NextJsRoadmapStatus = "personal" | "alternative" | "optional";

export interface NextJsRoadmapNode {
  id: string;
  title: string;
  status?: NextJsRoadmapStatus;
  roadmapId?: string;
}

export interface NextJsRoadmapGroup {
  id: string;
  parent?: NextJsRoadmapNode;
  items: NextJsRoadmapNode[];
}

export interface NextJsRoadmapStage {
  id: string;
  node: NextJsRoadmapNode;
  left?: NextJsRoadmapGroup[];
  right?: NextJsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface NextJsRoadmapSection {
  id: string;
  title?: string;
  stages: NextJsRoadmapStage[];
}

export interface NextJsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const NEXTJS_MARKERS: Array<{
  status: NextJsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const NEXTJS_RELATED_ROADMAPS: NextJsRoadmapLink[] = [
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Typescript Roadmap", roadmapId: "typescript" },
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
  { label: "Nodejs Roadmap", roadmapId: "skill-nodejs" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
];

export const NEXTJS_CONTINUE_LEARNING: NextJsRoadmapLink[] = [
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Typescript Roadmap", roadmapId: "typescript" },
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
  { label: "Nodejs Roadmap", roadmapId: "skill-nodejs" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: NextJsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): NextJsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: NextJsRoadmapNode[],
  parent?: NextJsRoadmapNode,
  customId?: string
): NextJsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<NextJsRoadmapStage, "id" | "node"> & {
    status?: NextJsRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): NextJsRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: NextJsRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 React Frameworks",
  stages: [
    stage("React Frameworks", {
      status: "personal",
      left: [
        g([
          n("Why Next.js"),
          n("Next.js"),
          n("Remix"),
          n("SSR"),
          n("SPA"),
          n("CSR"),
          n("SSG"),
          n("Rendering Strategies"),
          n("Related Roadmaps"),
        ]),
      ],
      right: [
        g([
          n("JavaScript Basics"),
          n("Why Frontend Frameworks"),
          n("Why React"),
          n("SPA vs SSR"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("Introduction", {
      status: "personal",
      left: [g([n("React Frameworks")])],
    }),
    stage("create-next-app", {
      status: "personal",
      left: [g([n("Getting Started")])],
      right: [g([n("Routing")])],
    }),
    stage("Next.js Routing Basics", {
      status: "personal",
    }),
    stage("Getting Started", {
      status: "personal",
      left: [g([n("Parallel Routes")])],
      right: [g([n("Pages"), n("App")])],
    }),
    stage("Rendering Strategies", {
      status: "personal",
    }),
    stage("Routing Terminology", {
      status: "personal",
      left: [g([n("Intercepting Routes")])],
      right: [g([n("Why use App Router?")])],
    }),
    stage("Types of routers", {
      status: "personal",
      left: [g([n("Routing Terminology")])],
    }),
    stage("Rendering Pages", {
      status: "personal",
      right: [g([n("Use cases")])],
    }),
    stage("Layouts and Templates", {
      status: "personal",
      right: [g([n("Route Matcher")])],
    }),
  ],
};

const SECTION_2: NextJsRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Loading and Streaming",
  stages: [
    stage("Loading and Streaming", {
      status: "personal",
      right: [g([n("Using Cookies")])],
    }),
    stage("Routing Patterns", {
      status: "personal",
      left: [g([n("Static vs Dynamic"), n("API Endpoints")])],
      right: [g([n("Setting Headers")])],
    }),
    stage("Error States", {
      status: "personal",
      left: [g([n("Routing Patterns")])],
    }),
    stage("API Endpoints", {
      status: "personal",
      left: [g([n("Caching"), n("Streaming"), n("Reditects"), n("Structuring Routes")])],
    }),
    stage("Structuring Routes", {
      status: "personal",
      left: [g([n("Proxy")])],
    }),
    stage("Proxy", {
      status: "personal",
      left: [g([n("Internationalization")])],
      right: [g([n("Client"), n("Server")])],
    }),
    stage("Internationalization", {
      status: "personal",
      left: [g([n("Working with data")])],
    }),
    stage("Working with data", {
      status: "personal",
      left: [g([n("Parallel vs Sequential")])],
      right: [g([n("Memoization in Fetch"), n("Fetching Locations")])],
    }),
    stage("Fetching Locations", {
      status: "personal",
      right: [g([n("Caching Data")])],
    }),
    stage("Handling Sensitive Data", {
      status: "personal",
      left: [g([n("Preloading Data"), n("Rendering")])],
      right: [g([n("React Cache"), n("Revalidating Cached Data")])],
    }),
  ],
};

const SECTION_3: NextJsRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Data Fetching Patterns",
  stages: [
    stage("Data Fetching Patterns", {
      status: "personal",
      left: [g([n("Handling Sensitive Data")])],
    }),
    stage("Caching Data", {
      status: "personal",
      left: [g([n("Data Fetching Patterns")])],
    }),
    stage("Server Actions", {
      status: "personal",
      left: [g([n("Node.js")])],
      right: [g([n("Edge"), n("Revalidation Errors")])],
    }),
    stage("Runtimes and Types", {
      status: "personal",
      right: [g([n("Ways to Write CSS"), n("CSS Modules")])],
    }),
    stage("Client Rendered", {
      status: "personal",
      left: [g([n("Images")])],
      right: [g([n("Tailwind CSS")])],
    }),
    stage("Server Rendered", {
      status: "personal",
      left: [g([n("Videos")])],
      right: [g([n("Sass")])],
    }),
    stage("Runtimes", {
      status: "personal",
      left: [g([n("Runtimes and Types")])],
      right: [g([n("CSS in JS"), n("Writing CSS")])],
    }),
    stage("Composition", {
      status: "personal",
      left: [g([n("Fonts")])],
      right: [g([n("Runtimes")])],
    }),
    stage("Writing CSS", {
      status: "personal",
      left: [g([n("Metadata"), n("Package Bundling")])],
      right: [g([n("TypeScript"), n("Optimizations")])],
    }),
    stage("Optimizations", {
      status: "personal",
      left: [g([n("Lazy Loading"), n("Analytics")])],
      right: [g([n("ESLint"), n("Prettier"), n("Configuring")])],
    }),
  ],
};

const SECTION_4: NextJsRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Configuring",
  stages: [
    stage("Configuring", {
      status: "personal",
      left: [g([n("Instrumentation"), n("OpenTelemetry"), n("Static Assets"), n("Scripts")])],
      right: [g([n("Setting things Up")])],
    }),
    stage("Environment Variables", {
      status: "personal",
      left: [g([n("Third Party Libraries")])],
    }),
    stage("Markdown and MDX", {
      status: "personal",
      left: [g([n("Memory Usage")])],
      right: [g([n("Testing")])],
    }),
    stage("Deployment", {
      status: "personal",
      left: [
        g([
          n("Node.js Server"),
          n("Docker Container"),
          n("Preparing for Production"),
          n("Deployment Options"),
        ]),
      ],
      right: [g([n("Testing Frameworks"), n("Vitest"), n("Jest")])],
    }),
    stage("Deployment Options", {
      status: "personal",
      left: [g([n("Static Export"), n("Adapters"), n("Visit the following related roadmaps")])],
      right: [g([n("Playwright"), n("Cypress")])],
    }),
    stage("Visit the following related roadmaps", {
      status: "personal",
      left: [g([n("React")])],
      right: [g([n("Frontend"), n("JavaScript")])],
    }),
  ],
};

export const NEXTJS_SECTIONS: NextJsRoadmapSection[] = [SECTION_1, SECTION_2, SECTION_3, SECTION_4];
