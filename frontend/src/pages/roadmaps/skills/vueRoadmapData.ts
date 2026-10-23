export type VueRoadmapStatus = "personal" | "alternative" | "optional";

export interface VueRoadmapNode {
  id: string;
  title: string;
  status?: VueRoadmapStatus;
  roadmapId?: string;
}

export interface VueRoadmapGroup {
  id: string;
  parent?: VueRoadmapNode;
  items: VueRoadmapNode[];
}

export interface VueRoadmapStage {
  id: string;
  node: VueRoadmapNode;
  left?: VueRoadmapGroup[];
  right?: VueRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface VueRoadmapSection {
  id: string;
  title?: string;
  stages: VueRoadmapStage[];
}

export interface VueRoadmapLink {
  label: string;
  roadmapId: string;
}

export const VUE_MARKERS: Array<{
  status: VueRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const VUE_RELATED_ROADMAPS: VueRoadmapLink[] = [
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "Angular Roadmap", roadmapId: "skill-angular" },
  { label: "Node.js Roadmap", roadmapId: "skill-nodejs" },
];

export const VUE_CONTINUE_LEARNING: VueRoadmapLink[] = [
  { label: "Frontend", roadmapId: "frontend" },
  { label: "JavaScript", roadmapId: "skill-javascript" },
  { label: "React", roadmapId: "skill-react" },
  { label: "TypeScript", roadmapId: "skill-typescript" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: VueRoadmapStatus,
  roadmapId?: string,
  customId?: string
): VueRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: VueRoadmapNode[],
  parent?: VueRoadmapNode,
  customId?: string
): VueRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

export const VUE_SECTIONS: VueRoadmapSection[] = [
  {
    id: "core-vue",
    title: "Core Vue Architecture",
    stages: [
      {
        id: "components",
        node: n("Components", "personal"),
        right: [
          g([
            n("Single File Components (SFC)", "personal"),
            n("create-vue", "personal"),
            n("Component Registration"),
            n("Props & Events"),
            n("v-model Binding"),
            n("Attribute Inheritance"),
          ]),
        ],
      },
      {
        id: "templates",
        node: n("Templates"),
        left: [
          g(
            [n("Interpolation"), n("v-once"), n("v-pre"), n("v-cloak"), n("Optimizing Renders")],
            n("Template Syntax")
          ),
        ],
      },
      {
        id: "directives",
        node: n("Directives", "personal"),
        right: [
          g(
            [
              n("v-if / v-else / v-else-if"),
              n("v-show"),
              n("v-for (Lists)"),
              n("v-bind"),
              n("v-on (@)"),
              n("v-model"),
              n("v-slot (#)"),
              n("v-html / v-text"),
            ],
            n("Built-in Directives")
          ),
        ],
      },
      {
        id: "api-styles",
        node: n("API Styles", "personal"),
        left: [
          g([n("Composition API (<script setup>)", "personal"), n("Options API", "alternative")]),
        ],
      },
      {
        id: "app-configs",
        node: n("App Configurations"),
        right: [g([n("Error / Warn Handler"), n("Global Properties"), n("Performance Tracing")])],
      },
    ],
  },
  {
    id: "interactivity",
    title: "Interactivity & Reactivity",
    stages: [
      {
        id: "lifecycle",
        node: n("Lifecycle Hooks", "personal"),
        left: [g([n("onMounted / onUnmounted"), n("onUpdated"), n("onErrorCaptured")])],
      },
      {
        id: "event-handling",
        node: n("Event Handling"),
        right: [
          g([
            n("Binding Events"),
            n("Inline / Method Handlers"),
            n("Event Modifiers (.prevent, .stop)"),
            n("Key & Mouse Modifiers"),
          ]),
        ],
      },
      {
        id: "forms-handling",
        node: n("Forms Handling", "personal"),
        left: [g([n("Input Bindings"), n("v-model"), n("Modifiers (.lazy, .number, .trim)")])],
      },
      {
        id: "computed-properties",
        node: n("Computed Properties", "personal"),
        right: [
          g([
            n("computed() vs methods"),
            n("watch() & watchEffect()", "personal"),
            n("Provide / Inject"),
            n("Custom Directives"),
            n("Slots & Scoped Slots"),
            n("VueUse Utility Collection", "personal"),
          ]),
        ],
      },
    ],
  },
  {
    id: "ecosystem",
    title: "Routing, State & Fullstack",
    stages: [
      {
        id: "routing",
        node: n("Routing", "personal"),
        left: [
          g([
            n("Vue Router (Official)", "personal"),
            n("Nested Routes"),
            n("Navigation Guards"),
            n("Route Meta Fields"),
          ]),
        ],
      },
      {
        id: "state-management",
        node: n("State Management", "personal"),
        right: [
          g([
            n("Pinia (Official Recommendation)", "personal"),
            n("State, Getters, Actions"),
            n("Plugins & Persistence"),
          ]),
        ],
      },
      {
        id: "forms-validation",
        node: n("Forms Ecosystem"),
        left: [g([n("VeeValidate", "personal"), n("FormKit", "alternative"), n("Vuelidate")])],
      },
      {
        id: "ssr-ssg",
        node: n("SSR & SSG Frameworks", "personal"),
        right: [
          g([
            n("Nuxt.js (Fullstack / SSR)", "personal"),
            n("VitePress (SSG & Docs)", "personal"),
            n("Quasar (Cross-platform)", "alternative"),
          ]),
        ],
      },
      {
        id: "api-calls",
        node: n("API & Data Fetching"),
        left: [
          g([
            n("TanStack Query (Vue Query)", "personal"),
            n("Axios", "alternative"),
            n("Native Fetch"),
            n("Apollo Client (GraphQL)", "optional"),
          ]),
        ],
      },
      {
        id: "testing-styling",
        node: n("Testing & Styling"),
        right: [
          g(
            [n("Vitest", "personal"), n("Vue Testing Library"), n("Playwright / Cypress (E2E)")],
            n("Testing")
          ),
          g([n("Tailwind CSS", "personal"), n("Vuetify"), n("Element Plus")], n("UI Libraries")),
        ],
      },
      {
        id: "mobile-apps",
        node: n("Mobile Apps", "optional"),
        left: [g([n("Capacitor", "personal"), n("NativeScript-Vue", "alternative")])],
      },
    ],
  },
];
