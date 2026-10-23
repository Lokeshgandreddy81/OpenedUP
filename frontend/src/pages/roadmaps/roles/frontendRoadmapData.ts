export type FrontendRoadmapStatus = "personal" | "alternative" | "optional";

export interface FrontendRoadmapNode {
  id: string;
  title: string;
  status?: FrontendRoadmapStatus;
  roadmapId?: string;
}

export interface FrontendRoadmapGroup {
  id: string;
  parent?: FrontendRoadmapNode;
  items: FrontendRoadmapNode[];
}

export interface FrontendRoadmapStage {
  id: string;
  node: FrontendRoadmapNode;
  left?: FrontendRoadmapGroup[];
  right?: FrontendRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface FrontendRoadmapSection {
  id: string;
  title?: string;
  stages: FrontendRoadmapStage[];
}

export interface FrontendRoadmapLink {
  label: string;
  roadmapId: string;
}

export const FRONTEND_MARKERS: Array<{
  status: FrontendRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const FRONTEND_RELATED_ROADMAPS: FrontendRoadmapLink[] = [
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "TypeScript Roadmap", roadmapId: "skill-typescript" },
  { label: "Node.js Roadmap", roadmapId: "skill-nodejs" },
];

export const FRONTEND_CONTINUE_LEARNING: FrontendRoadmapLink[] = [
  { label: "Nodejs", roadmapId: "skill-nodejs" },
  { label: "Fullstack", roadmapId: "full-stack" },
  { label: "Backend", roadmapId: "backend" },
  { label: "Design System", roadmapId: "skill-design-system" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: FrontendRoadmapStatus,
  roadmapId?: string
): FrontendRoadmapNode => ({
  id: slug(title),
  title,
  status,
  roadmapId,
});

const g = (items: FrontendRoadmapNode[], parent?: FrontendRoadmapNode): FrontendRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<FrontendRoadmapStage, "id" | "node"> & {
    status?: FrontendRoadmapStatus;
  } = {}
): FrontendRoadmapStage => {
  const { status, ...rest } = options;

  return {
    id: slug(title),
    node: n(title, status),
    ...rest,
  };
};

const FOUNDATIONS: FrontendRoadmapSection = {
  id: "foundations",
  stages: [
    stage("Internet", {
      right: [
        g([
          n("How does the internet work?", "personal"),
          n("What is HTTP?", "personal"),
          n("What is Domain Name?", "personal"),
          n("What is hosting?", "personal"),
          n("DNS and how it works?", "personal"),
          n("Browsers and how they work?", "personal"),
        ]),
      ],
    }),
    stage("HTML"),
    stage("CSS"),
    stage("JavaScript", {
      noteAfter:
        "HTML, CSS and JavaScript are the backbone of web development. Make sure to practice by building lots of projects.",
      projectIdea: "Beginner Project Ideas",
    }),
    stage("Version Control", {
      left: [g([n("Git", "personal")])],
    }),
    stage("VCS Hosting", {
      left: [g([n("GitHub", "personal"), n("GitLab", "alternative")])],
    }),
    stage("Package Managers", {
      right: [
        g([
          n("npm", "personal"),
          n("pnpm", "alternative"),
          n("yarn", "alternative"),
          n("Bun", "alternative"),
        ]),
      ],
    }),
    stage("CSS Frameworks", {
      right: [g([n("Tailwind", "personal")])],
      noteAfter:
        "At this point, you should be able to build modern vanilla JS frontend applications.",
      projectIdea: "Intermediate Project Ideas",
    }),
    stage("Learn a Framework", {
      left: [
        g([
          n("React", "personal"),
          n("Vue.js", "alternative"),
          n("Angular", "alternative"),
          n("Svelte", "alternative"),
          n("Solid JS", "alternative"),
        ]),
      ],
    }),
  ],
};

const AI_IN_DEVELOPMENT: FrontendRoadmapSection = {
  id: "ai-in-development",
  title: "AI in Development",
  stages: [
    stage("Learn the Basics", {
      right: [
        g([
          n("How LLMs work"),
          n("AI vs Traditional Coding"),
          n("Applications"),
          n("Code Reviews"),
          n("Refactoring"),
          n("Docs Generation"),
        ]),
      ],
    }),
    stage("AI Assisted Coding", {
      left: [
        g([
          n("Claude Code", "personal"),
          n("Cursor", "alternative"),
          n("Copilot", "alternative"),
          n("Antigravity", "alternative"),
        ]),
      ],
    }),
    stage("Prompting Techniques", {
      left: [
        g([
          n("Prompt Engineering", undefined, "skill-prompt-engineering"),
          n("AI Agents Roadmap", undefined, "skill-ai-agents"),
        ]),
      ],
    }),
    stage("Agents"),
    stage("MCP"),
    stage("Skills"),
    stage("Implementing AI", {
      left: [g([n("Gemini"), n("OpenAI"), n("Anthropic")])],
    }),
  ],
};

const ADVANCED_FRONTEND: FrontendRoadmapSection = {
  id: "advanced-frontend",
  title: "Advanced Frontend",
  stages: [
    stage("Linters & Formatters", {
      right: [g([n("Prettier", "personal"), n("ESLint", "personal"), n("Biome", "alternative")])],
    }),
    stage("Module Bundlers", {
      left: [
        g([
          n("Vite", "personal"),
          n("esbuild", "personal"),
          n("SWC", "alternative"),
          n("Rollup", "alternative"),
          n("Parcel", "alternative"),
          n("Rolldown"),
        ]),
      ],
    }),
    stage("Auth Strategies"),
    stage("Testing", {
      left: [
        g([
          n("Vitest", "personal"),
          n("Playwright", "personal"),
          n("Jest", "alternative"),
          n("Cypress", "alternative"),
        ]),
      ],
      noteAfter:
        "At this point you should have the expertise of an intermediate level frontend developer. Keep practicing and sharpening your skills.",
      projectIdea: "Advanced Project Ideas",
    }),
    stage("Web APIs"),
    stage("Web Security", {
      right: [
        g([
          n("CORS", "personal"),
          n("HTTPS", "personal"),
          n("CSP", "personal"),
          n("OWASP Risks", "personal"),
        ]),
      ],
    }),
    stage("React", {
      status: "personal",
      left: [
        g([n("Angular", "alternative")]),
        g([n("Nuxt.js")], n("Vue.js", "alternative")),
        g([n("Svelte")], n("SvelteKit", "alternative")),
      ],
      right: [
        g([
          n("Next.js", "personal"),
          n("Tanstack Start", "personal"),
          n("Astro", "alternative"),
          n("react-router", "alternative"),
        ]),
      ],
    }),
    stage("SSR"),
    stage("SSG", {
      right: [
        g([
          n("Astro", "personal"),
          n("Next.js", "alternative"),
          n("Eleventy", "alternative"),
          n("Vuepress", "alternative"),
          n("Nuxt.js", "alternative"),
        ]),
      ],
    }),
    stage("Type Checkers", {
      right: [g([n("TypeScript", undefined, "skill-typescript")])],
    }),
    stage("Deployment", {
      left: [
        g([
          n("GitHub Pages", "personal"),
          n("Cloudflare", "personal"),
          n("Vercel", "alternative"),
          n("Netlify", "alternative"),
          n("Railway", "alternative"),
          n("Render", "alternative"),
        ]),
      ],
    }),
    stage("Design Systems"),
    stage("Performance", {
      left: [
        g([
          n("Lighthouse", "personal"),
          n("DevTools Usage", "personal"),
          n("Service Workers", "personal"),
          n("Streamed Responses", "personal"),
          n("Cache-Control", "personal"),
        ]),
      ],
    }),
    stage("Web Components", {
      right: [
        g([
          n("HTML Templates", "optional"),
          n("Custom Elements", "optional"),
          n("Shadow DOM", "optional"),
        ]),
      ],
    }),
    stage("GraphQL", {
      status: "personal",
      right: [g([n("Apollo", "personal"), n("Relay Modern", "alternative")])],
    }),
    stage("Accessibility"),
    stage("PWAs", { status: "optional" }),
    stage("Mobile Apps", {
      status: "optional",
      right: [
        g([n("React Native", "personal"), n("Flutter", "alternative"), n("Ionic", "alternative")]),
      ],
    }),
    stage("Desktop Apps", {
      left: [g([n("Electron", "personal"), n("Tauri", "personal"), n("Flutter", "alternative")])],
    }),
  ],
};

export const FRONTEND_SECTIONS: FrontendRoadmapSection[] = [
  FOUNDATIONS,
  AI_IN_DEVELOPMENT,
  ADVANCED_FRONTEND,
];
