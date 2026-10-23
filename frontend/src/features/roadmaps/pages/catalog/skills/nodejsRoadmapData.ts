export type NodeJsRoadmapStatus = "personal" | "alternative" | "optional";

export interface NodeJsRoadmapNode {
  id: string;
  title: string;
  status?: NodeJsRoadmapStatus;
  roadmapId?: string;
}

export interface NodeJsRoadmapGroup {
  id: string;
  parent?: NodeJsRoadmapNode;
  items: NodeJsRoadmapNode[];
}

export interface NodeJsRoadmapStage {
  id: string;
  node: NodeJsRoadmapNode;
  left?: NodeJsRoadmapGroup[];
  right?: NodeJsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface NodeJsRoadmapSection {
  id: string;
  title?: string;
  stages: NodeJsRoadmapStage[];
}

export interface NodeJsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const NODEJS_MARKERS: Array<{
  status: NodeJsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const NODEJS_RELATED_ROADMAPS: NodeJsRoadmapLink[] = [
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Typescript Roadmap", roadmapId: "typescript" },
  { label: "System Design Roadmap", roadmapId: "system-design" },
  { label: "Frontend Roadmap", roadmapId: "frontend" },
];

export const NODEJS_CONTINUE_LEARNING: NodeJsRoadmapLink[] = [
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Typescript Roadmap", roadmapId: "typescript" },
  { label: "System Design Roadmap", roadmapId: "system-design" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: NodeJsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): NodeJsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: NodeJsRoadmapNode[],
  parent?: NodeJsRoadmapNode,
  customId?: string
): NodeJsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<NodeJsRoadmapStage, "id" | "node"> & {
    status?: NodeJsRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): NodeJsRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: NodeJsRoadmapSection = {
  id: "phase-1",
  title:
    "Phase 1 \u2014 Find the detailed version of this roadmap along with other similar roadmaps",
  stages: [
    stage("Find the detailed version of this roadmap along with other similar roadmaps", {
      status: "personal",
      left: [g([n("What is Node.js?"), n("JavaScript Roadmap")])],
      right: [g([n("CommonJS")])],
    }),
    stage("Introduction to Node.js", {
      status: "personal",
      left: [
        g([
          n("Why use Node.js?"),
          n("History of Node.js"),
          n("Node.js vs Browser"),
          n("Running Node.js Code"),
          n("npx"),
          n("Global Installation"),
        ]),
      ],
      right: [g([n("ESM"), n("Creating & Importing"), n("[global] keyword"), n("Modules")])],
    }),
    stage("Modules", {
      status: "personal",
      left: [g([n("npm")])],
    }),
    stage("npm", {
      status: "personal",
      left: [
        g([
          n("Local Installation"),
          n("Semantic Versioning"),
          n("Installing Packages"),
          n("Updating Packages"),
          n("Promises"),
          n("Running Scripts"),
          n("async/await"),
        ]),
      ],
      right: [
        g([
          n("System Errors"),
          n("Event Emitter"),
          n("User Specified Errors"),
          n("Event Loop"),
          n("Assertion Errors"),
          n("Error Handling"),
        ]),
      ],
    }),
    stage("Error Handling", {
      status: "personal",
    }),
  ],
};

const SECTION_2: NodeJsRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Async Programming",
  stages: [
    stage("Async Programming", {
      status: "personal",
      left: [
        g([
          n("npm workspaces"),
          n("Callbacks"),
          n("Creating Packages"),
          n("setTimeout"),
          n("setInterval"),
          n("process.env"),
          n("setImmediate"),
          n("dotenv package"),
          n("process.nextTick"),
        ]),
      ],
      right: [
        g([
          n("JavaScript Errors"),
          n("Types of Errors"),
          n("Uncaught Exceptions"),
          n("Handling Async Errors"),
          n("Callstack / Stack Trace"),
          n("__dirname"),
        ]),
      ],
    }),
    stage("Command Line Apps", {
      status: "personal",
      left: [
        g([
          n("Environment Variables"),
          n("Writing Async Code"),
          n("process.stdin"),
          n("Exitting / Exit Codes"),
          n("Inquirer Package"),
          n("prompts package"),
          n("Taking Input"),
          n("stdout / stderr"),
          n("chalk package"),
        ]),
      ],
      right: [
        g([
          n("Using Debugger"),
          n("__filename"),
          n("process.cwd()"),
          n("path module"),
          n("fs module"),
          n("glob"),
          n("globby"),
          n("jsonwebtoken"),
          n("fs-extra"),
          n("chokidar"),
          n("passport.js"),
          n("Opensource Packages"),
        ]),
      ],
    }),
    stage("Working with Files", {
      status: "personal",
      left: [g([n("Command Line Apps")])],
    }),
    stage("Building & Consuming APIs", {
      status: "personal",
      left: [
        g([
          n("figlet package"),
          n("cli-progress"),
          n("Printing Output"),
          n("process.argv"),
          n("commander"),
          n("Command line args"),
        ]),
      ],
      right: [
        g([
          n("Authentication"),
          n("http module"),
          n("Express.js"),
          n("axios"),
          n("ky"),
          n("fastify"),
          n("--watch"),
          n("NestJS"),
          n("fetch"),
          n("nodemon"),
          n("Hono"),
          n("got package"),
          n("ejs"),
          n("Frameworks"),
          n("Making API Calls"),
        ]),
      ],
    }),
    stage("Monitor Changes (Dev)", {
      status: "personal",
      left: [g([n("Mongoose"), n("Prisma")])],
      right: [g([n("pug"), n("Vitest"), n("Jest"), n("marko")])],
    }),
  ],
};

const SECTION_3: NodeJsRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Template Engines",
  stages: [
    stage("Template Engines", {
      status: "personal",
      left: [g([n("Native Drivers"), n("NoSQL DBs"), n("pm2")])],
      right: [g([n("node:test"), n("Cypress"), n("Playwright")])],
    }),
    stage("Working with Databases", {
      status: "personal",
      left: [g([n("Drizzle"), n("TypeORM"), n("Knex")])],
      right: [g([n("Winston"), n("Morgan"), n("Testing")])],
    }),
    stage("Testing", {
      status: "personal",
      right: [g([n("Logging")])],
    }),
    stage("Logging", {
      status: "personal",
      left: [g([n("Sequelize"), n("Prisma"), n("Native Drivers"), n("Keep app Running")])],
      right: [g([n("Garbage Collection")])],
    }),
    stage("Keep app Running", {
      status: "personal",
      left: [g([n("Threads")])],
    }),
  ],
};

const SECTION_4: NodeJsRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Threads",
  stages: [
    stage("Threads", {
      status: "personal",
      left: [g([n("Child Process"), n("Relational"), n("Cluster"), n("Worker Threads")])],
      right: [g([n("Memory Leaks"), n("node --inspect"), n("Using APM"), n("Streams")])],
    }),
    stage("Streams", {
      status: "personal",
      right: [g([n("Debugging")])],
    }),
    stage("Debugging", {
      status: "personal",
      left: [g([n("Continue learning with following roadmap"), n("Visit Backend Roadmap")])],
      right: [g([n("Common Built-in Modules")])],
    }),
  ],
};

export const NODEJS_SECTIONS: NodeJsRoadmapSection[] = [SECTION_1, SECTION_2, SECTION_3, SECTION_4];
