export type AngularRoadmapStatus = "personal" | "alternative" | "optional";

export interface AngularRoadmapNode {
  id: string;
  title: string;
  status?: AngularRoadmapStatus;
  roadmapId?: string;
}

export interface AngularRoadmapGroup {
  id: string;
  parent?: AngularRoadmapNode;
  items: AngularRoadmapNode[];
}

export interface AngularRoadmapStage {
  id: string;
  node: AngularRoadmapNode;
  left?: AngularRoadmapGroup[];
  right?: AngularRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AngularRoadmapSection {
  id: string;
  title?: string;
  stages: AngularRoadmapStage[];
}

export interface AngularRoadmapLink {
  label: string;
  roadmapId: string;
}

export const ANGULAR_MARKERS: Array<{
  status: AngularRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const ANGULAR_RELATED_ROADMAPS: AngularRoadmapLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "TypeScript Roadmap", roadmapId: "skill-typescript" },
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "Vue Roadmap", roadmapId: "skill-vue" },
  { label: "Node.js Roadmap", roadmapId: "skill-nodejs" },
];

export const ANGULAR_CONTINUE_LEARNING: AngularRoadmapLink[] = [
  { label: "TypeScript", roadmapId: "skill-typescript" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "React", roadmapId: "skill-react" },
  { label: "Vue.js", roadmapId: "skill-vue" },
  { label: "Node.js", roadmapId: "skill-nodejs" },
  { label: "GraphQL", roadmapId: "skill-graphql" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AngularRoadmapStatus,
  roadmapId?: string,
  customId?: string
): AngularRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AngularRoadmapNode[],
  parent?: AngularRoadmapNode,
  customId?: string
): AngularRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AngularRoadmapStage, "id" | "node"> & {
    status?: AngularRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): AngularRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: AngularRoadmapSection = {
  id: "angular-foundations",
  stages: [
    stage("Introduction to Angular", {
      left: [
        g(
          [
            n("JavaScript Roadmap", "personal", "skill-javascript"),
            n("TypeScript Basics", "personal", "skill-typescript"),
          ],
          n("Prerequisites")
        ),
      ],
      right: [
        g(
          [
            n("Angular and History"),
            n("Angular Architecture"),
            n("Setting up a New Project", "personal"),
          ],
          n("Getting Started")
        ),
      ],
      noteAfter:
        "Angular is a full-featured, opinionated TypeScript web application platform backed by Google. It provides a standardized architecture, command-line tooling, and strong type safety.",
      projectIdea: "First Angular App: Interactive Task Tracker",
    }),
    stage("Components", {
      status: "personal",
      left: [
        g([n("Creating Components", "personal")], n("Component Anatomy")),
        g(
          [
            n("Selector"),
            n("Template"),
            n("Styles"),
            n("Standalone", "personal"),
            n("Imports"),
            n("Provider"),
            n("viewProvider"),
            n("Encapsulation"),
            n("changeDetection"),
          ],
          n("Metadata")
        ),
      ],
      right: [
        g(
          [
            n("Parent-Child Interaction", "personal"),
            n("ViewChild"),
            n("ContentChild"),
            n("Component Lifecycle", "personal"),
            n("Dynamic Components"),
          ],
          n("Communication & Lifecycle")
        ),
      ],
    }),
    stage("Modules", {
      status: "alternative",
      right: [
        g(
          [
            n("Module Architecture"),
            n("Creating Modules"),
            n("Feature Modules"),
            n("Lazy Loading Modules"),
            n("Dependencies"),
          ],
          n("NgModules (Legacy & Interop)")
        ),
      ],
      noteAfter:
        "Standalone components are the modern default in Angular (v14+). Understanding NgModules remains important for maintaining established enterprise codebases and integrating third-party libraries.",
    }),
  ],
};

const TEMPLATES_AND_ROUTING: AngularRoadmapSection = {
  id: "templates-and-routing",
  title: "Templates & Navigation",
  stages: [
    stage("Templates & Data Binding", {
      status: "personal",
      left: [
        g(
          [
            n("Interpolation"),
            n("Template Statements"),
            n("Data Binding"),
            n("Property Binding"),
            n("Attribute Binding"),
            n("Event Binding"),
            n("Two-way Binding", "personal"),
          ],
          n("Understand Binding")
        ),
      ],
      right: [
        g(
          [
            n("Control Flow", "personal"),
            n("@if", "personal"),
            n("@else"),
            n("@else if"),
            n("@switch"),
            n("@case"),
            n("@default"),
            n("@for", "personal"),
            n("@defer", "personal"),
            n("@let"),
            n("Template Ref Vars"),
            n("@Input & @Output", "personal"),
          ],
          n("Template Syntax & Control Flow")
        ),
      ],
    }),
    stage("Pipes & Directives", {
      status: "personal",
      left: [
        g(
          [
            n("Common Pipes", "personal"),
            n("Custom Pipes", "personal"),
            n("Pipes Precedence"),
            n("Change Detection"),
          ],
          n("Pipes")
        ),
      ],
      right: [
        g(
          [
            n("Structural Directives", "personal"),
            n("Attribute Directives", "personal"),
            n("Custom Directives"),
          ],
          n("Directives")
        ),
      ],
    }),
    stage("Routing", {
      status: "personal",
      right: [
        g(
          [
            n("Configuration", "personal"),
            n("Router Links"),
            n("Router Outlets"),
            n("Router Events"),
            n("Lazy Loading", "personal"),
            n("Guards", "personal"),
          ],
          n("Navigation & Guards")
        ),
      ],
      projectIdea: "Multi-Route Dashboard with Auth Guards",
    }),
  ],
};

const DATA_AND_STATE: AngularRoadmapSection = {
  id: "data-and-state",
  title: "Data Architecture & State",
  stages: [
    stage("Services & Remote Data", {
      status: "personal",
      left: [g([n("Dependency Injection", "personal")], n("Dependency Injection"))],
      right: [
        g(
          [
            n("Setting Up the Client", "personal"),
            n("Making Requests", "personal"),
            n("Writing Interceptors", "personal"),
          ],
          n("HTTP Client")
        ),
      ],
    }),
    stage("Forms", {
      status: "personal",
      left: [
        g(
          [
            n("Reactive Forms", "personal"),
            n("Typed Forms", "personal"),
            n("Template-driven Forms", "alternative"),
            n("Dynamic Forms"),
          ],
          n("Form Models")
        ),
      ],
      right: [
        g(
          [n("Custom Validators", "personal"), n("Control Value Accessor", "personal")],
          n("Validation & Custom Controls")
        ),
      ],
      projectIdea: "Complex Multi-Step Form with Typed Validation",
    }),
    stage("Reactivity: RxJS & Signals", {
      status: "personal",
      left: [
        g(
          [
            n("Inputs as Signals", "personal"),
            n("Queries as Signals", "personal"),
            n("Model Inputs", "personal"),
            n("RxJS Interop", "personal"),
          ],
          n("Signals")
        ),
      ],
      right: [
        g(
          [n("Observable Pattern", "personal"), n("Observable Lifecycle"), n("RxJS vs Promises")],
          n("RxJS Basics")
        ),
        g(
          [
            n("Filtering", "personal"),
            n("Rate Limiting", "personal"),
            n("Transformation", "personal"),
            n("Combination", "personal"),
          ],
          n("Operators")
        ),
      ],
    }),
    stage("State Management & Zones", {
      status: "personal",
      left: [g([n("NgRx", "personal"), n("NGXS", "alternative")], n("State Management"))],
      right: [g([n("Zoneless Applications", "personal")], n("Zones & Change Detection"))],
      noteAfter:
        "Modern Angular combines fine-grained Signals reactivity with zoneless change detection for optimal runtime performance and simplified state management.",
    }),
  ],
};

const DEV_ECOSYSTEM_AND_RENDERING: AngularRoadmapSection = {
  id: "dev-ecosystem-and-rendering",
  title: "Tooling & Rendering",
  stages: [
    stage("Developer Tools", {
      status: "personal",
      left: [
        g(
          [
            n("Angular CLI", "personal"),
            n("Local Setup"),
            n("Deployment"),
            n("Schematics"),
            n("Build Environments"),
            n("CLI Builders"),
            n("AoT Compilation", "personal"),
          ],
          n("CLI & Build Tooling")
        ),
      ],
      right: [
        g(
          [
            n("DevTools", "personal"),
            n("Language Service", "personal"),
            n("Libraries"),
            n("Using Libraries"),
            n("Creating Libraries"),
          ],
          n("DevTools & Libraries")
        ),
      ],
    }),
    stage("SSR & SSG", {
      status: "personal",
      left: [g([n("SSR", "personal"), n("SSG", "alternative")], n("Rendering Modes"))],
      right: [g([n("AnalogJS", "alternative")], n("Full-Stack Angular"))],
      noteAfter:
        "Angular provides native Server-Side Rendering (SSR) and Static Site Generation (SSG) with hydration. AnalogJS provides a file-based full-stack framework on top of Vite and Nitro.",
    }),
  ],
};

const PRODUCTION_AND_EXCELLENCE: AngularRoadmapSection = {
  id: "production-and-excellence",
  title: "Security, Quality & Performance",
  stages: [
    stage("Security", {
      status: "personal",
      left: [
        g(
          [
            n("Cross-site Scripting", "personal"),
            n("Sanitization", "personal"),
            n("Trusting Safe Values"),
            n("Enforce Trusted Types", "personal"),
          ],
          n("Cross-Site Scripting (XSS)")
        ),
      ],
      right: [
        g(
          [
            n("HTTP Vulnerabilities"),
            n("Cross-site Request Forgery", "personal"),
            n("HttpClient CSRF"),
            n("XSRF protection", "personal"),
            n("Cross-site Script Inclusion"),
          ],
          n("Network Vulnerabilities")
        ),
      ],
    }),
    stage("Accessibility", {
      status: "personal",
      right: [
        g(
          [
            n("Attributes", "personal"),
            n("UI Components", "personal"),
            n("Containers"),
            n("Routing"),
            n("Link Identification"),
          ],
          n("Accessibility (a11y)")
        ),
      ],
    }),
    stage("Performance", {
      status: "personal",
      right: [
        g(
          [
            n("Deferrable Views", "personal"),
            n("Image Optimization", "personal"),
            n("Zone Pollution"),
            n("Slow Computations"),
            n("Hydration", "personal"),
          ],
          n("Performance Optimizations")
        ),
      ],
    }),
    stage("Testing", {
      status: "personal",
      left: [
        g(
          [
            n("Testing Services", "personal"),
            n("Testing Pipes"),
            n("Testing Requests", "personal"),
            n("Testing Directives"),
            n("Services with Dependencies"),
          ],
          n("Unit & Integration Testing")
        ),
      ],
      right: [
        g(
          [
            n("Component Bindings"),
            n("Component Templates"),
            n("Debugging Tests"),
            n("Code Coverage", "personal"),
            n("End-to-End Testing", "personal"),
          ],
          n("Component & E2E Testing")
        ),
      ],
      projectIdea: "End-to-End Tested Angular Storefront",
    }),
    stage("Internationalization & Animation", {
      left: [
        g(
          [
            n("Localize Package", "personal"),
            n("Locales by ID"),
            n("Translation Files", "personal"),
            n("Multiple Locales"),
          ],
          n("Internationalization (i18n)")
        ),
      ],
      right: [
        g(
          [
            n("Transitions & Triggers", "personal"),
            n("Complex Sequences"),
            n("Reusable Animations"),
            n("Route Transitions", "personal"),
          ],
          n("Animations")
        ),
      ],
    }),
  ],
};

export const ANGULAR_SECTIONS: AngularRoadmapSection[] = [
  FOUNDATIONS,
  TEMPLATES_AND_ROUTING,
  DATA_AND_STATE,
  DEV_ECOSYSTEM_AND_RENDERING,
  PRODUCTION_AND_EXCELLENCE,
];
