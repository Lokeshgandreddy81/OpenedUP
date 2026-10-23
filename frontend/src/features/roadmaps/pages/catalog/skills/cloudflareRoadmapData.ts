export type CloudflareRoadmapStatus = "personal" | "alternative" | "optional";

export interface CloudflareRoadmapNode {
  id: string;
  title: string;
  status?: CloudflareRoadmapStatus;
  roadmapId?: string;
}

export interface CloudflareRoadmapGroup {
  id: string;
  parent?: CloudflareRoadmapNode;
  items: CloudflareRoadmapNode[];
}

export interface CloudflareRoadmapStage {
  id: string;
  node: CloudflareRoadmapNode;
  left?: CloudflareRoadmapGroup[];
  right?: CloudflareRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface CloudflareRoadmapSection {
  id: string;
  title?: string;
  stages: CloudflareRoadmapStage[];
}

export interface CloudflareRoadmapLink {
  label: string;
  roadmapId: string;
}

export const CLOUDFLARE_MARKERS: Array<{
  status: CloudflareRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const CLOUDFLARE_RELATED_ROADMAPS: CloudflareRoadmapLink[] = [
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Full Stack Developer", roadmapId: "full-stack" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "Node.js Roadmap", roadmapId: "skill-nodejs" },
  { label: "AWS Roadmap", roadmapId: "skill-aws" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
];

export const CLOUDFLARE_CONTINUE_LEARNING: CloudflareRoadmapLink[] = [
  { label: "AWS", roadmapId: "skill-aws" },
  { label: "Node.js", roadmapId: "skill-nodejs" },
  { label: "TypeScript", roadmapId: "skill-typescript" },
  { label: "DevOps", roadmapId: "devops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: CloudflareRoadmapStatus,
  roadmapId?: string,
  customId?: string
): CloudflareRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: CloudflareRoadmapNode[],
  parent?: CloudflareRoadmapNode,
  customId?: string
): CloudflareRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<CloudflareRoadmapStage, "id" | "node"> & {
    status?: CloudflareRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): CloudflareRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. PREREQUISITES & CORE DEVELOPMENT SKILLS
const PREREQUISITES_SECTION: CloudflareRoadmapSection = {
  id: "prerequisites-and-core-skills",
  title: "Prerequisites & Core Development Skills",
  stages: [
    stage("Prerequisites", {
      left: [
        g(
          [
            n("JavaScript Fundamentals", "personal", "skill-javascript"),
            n("Basic Command-line Knowledge", undefined, "skill-linux"),
            n("HTTP and Web Protocols"),
            n("Git Basics", undefined, "skill-git-github"),
          ],
          n("Prerequisites")
        ),
      ],
      right: [
        g(
          [
            n("Node.js and NPM", undefined, "skill-nodejs"),
            n("TypeScript Fundamentals", "personal", "skill-typescript"),
            n("Understand Serverless Architecture"),
          ],
          n("Core Development Skills")
        ),
      ],
    }),
  ],
};

// 2. WORKERS ARCHITECTURE & TOOLING
const WORKERS_SECTION: CloudflareRoadmapSection = {
  id: "workers-architecture-and-tooling",
  title: "Cloudflare Workers & Tooling",
  stages: [
    stage("Workers Core Concepts", {
      left: [
        g(
          [
            n("Workers Runtime Environment", "personal"),
            n("Edge Computing Fundamentals"),
            n("Request/Response Handling"),
            n("Fetch API and Runtime APIs"),
            n("Workers Lifecycle"),
            n("Service Bindings"),
          ],
          n("Runtime Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Caching Strategies"),
            n("Middleware Patterns"),
            n("Bindings"),
            n("Logging and Monitoring"),
          ],
          n("Execution & Observability")
        ),
      ],
      noteAfter:
        "Cloudflare Workers run on V8 isolates rather than containers or VMs, offering zero cold starts and sub-millisecond execution across global points of presence.",
    }),
    stage("Frameworks and Tools", {
      left: [
        g([n("Hono", "personal"), n("Itty Router", "alternative")], n("API Routers")),
        g([n("Any Frontend Framework", "optional")], n("Frontend Frameworks")),
      ],
      right: [
        g(
          [
            n("Wrangler", "personal"),
            n("Miniflare", "alternative"),
            n("DevTools Integration"),
            n("CI/CD Pipelines"),
          ],
          n("Building / Deploying")
        ),
      ],
      projectIdea: "Build and deploy a typed edge REST API with Hono, Miniflare and Wrangler",
    }),
  ],
};

// 3. EDGE STORAGE SOLUTIONS
const STORAGE_SECTION: CloudflareRoadmapSection = {
  id: "edge-storage-solutions",
  title: "Edge Storage Solutions",
  stages: [
    stage("Workers KV", {
      left: [
        g(
          [
            n("Key-value Operations", "personal"),
            n("Metadata Handling"),
            n("Bulk Operations"),
            n("Caching Patterns"),
          ],
          n("KV Operations")
        ),
      ],
      right: [
        g(
          [
            n("Global Read Replicas"),
            n("Eventual Consistency Model"),
            n("High-throughput Read Caching"),
          ],
          n("Storage Solutions")
        ),
      ],
      noteAfter:
        "Workers KV is a globally distributed, low-latency key-value data store designed for read-heavy workloads with eventual consistency.",
    }),
    stage("R2 Storage", {
      left: [
        g(
          [n("Zero Egress Fees", "personal"), n("S3-Compatible API"), n("Presigned URLs")],
          n("Cloudflare R2 Advantages")
        ),
      ],
      right: [
        g(
          [
            n("Object Storage", "personal"),
            n("Large File Handling"),
            n("Asset Management"),
            n("Bucket Operations"),
            n("Bucket Lifecycle"),
          ],
          n("Object Operations")
        ),
      ],
    }),
    stage("D1", {
      left: [
        g(
          [n("Schema Management", "personal"), n("Migrations"), n("Query Optimization")],
          n("Serverless SQL Database")
        ),
      ],
      right: [g([n("Drizzle", "personal"), n("Prisma", "alternative")], n("Frameworks & ORMs"))],
      projectIdea: "Build an edge CRUD application using D1 relational database and Drizzle ORM",
    }),
  ],
};

// 4. DURABLE EXECUTION & STATE COORDINATION
const DURABLE_EXECUTION_SECTION: CloudflareRoadmapSection = {
  id: "durable-execution-and-state",
  title: "Durable Execution & Coordination",
  stages: [
    stage("Durable Execution", {
      left: [
        g(
          [
            n("Message Processing", "personal"),
            n("Background Jobs"),
            n("Rate Limiting"),
            n("Dead Letter Queues"),
          ],
          n("Queues")
        ),
      ],
      right: [
        g(
          [
            n("Workflows", "personal"),
            n("Durable Multi-step Execution"),
            n("Automatic Retries & Sleeps"),
          ],
          n("Workflow Orchestration")
        ),
      ],
      noteAfter:
        "Cloudflare Queues enable guaranteed message delivery and asynchronous job processing, while Workflows provide long-running deterministic execution.",
    }),
    stage("Durable Objects", {
      left: [g([n("State Management", "personal"), n("Coordination")], n("Consistent State"))],
      right: [
        g(
          [
            n("Persistence", "personal"),
            n("Transactional Operations"),
            n("WebSockets & Realtime Hibernation"),
          ],
          n("Transactions & Realtime")
        ),
      ],
      projectIdea:
        "Build a collaborative real-time document editor using Durable Objects and WebSockets",
    }),
  ],
};

// 5. ADVANCED FEATURES & AI
const ADVANCED_FEATURES_SECTION: CloudflareRoadmapSection = {
  id: "advanced-features-and-ai",
  title: "Advanced Features & AI",
  stages: [
    stage("Workers AI", {
      left: [
        g(
          [
            n("Text Generation", "personal"),
            n("Image Processing"),
            n("Speech Recognition"),
            n("AI Model Integration"),
          ],
          n("Workers AI Models")
        ),
      ],
      right: [
        g(
          [n("Vector Embeddings", "personal"), n("Similarity Search"), n("AI-powered Search")],
          n("Vectorize")
        ),
      ],
    }),
    stage("Media and Realtime", {
      left: [
        g(
          [n("Video Delivery", "personal"), n("Live streaming"), n("Video Processing")],
          n("Stream")
        ),
        g([n("Image Optimization"), n("Dynamic Resizing")], n("Images")),
      ],
      right: [
        g([n("Calls (WebRTC)", "personal"), n("Tunnels (Cloudflare Tunnel)")], n("Connectivity")),
        g([n("Routing"), n("Processing"), n("Filtering")], n("Email Workers")),
        g([n("AI Gateway"), n("Browser Rendering")], n("Platform Services")),
      ],
      noteAfter:
        "Cloudflare AI Gateway brings caching, rate limiting, and observability to any LLM API, while Browser Rendering automates headless browser sessions at the edge.",
    }),
  ],
};

// 6. SECURITY, PERFORMANCE & DEVELOPMENT TOOLS
const SECURITY_AND_TOOLS_SECTION: CloudflareRoadmapSection = {
  id: "security-performance-and-tools",
  title: "Security, Performance & Integration",
  stages: [
    stage("Security & Performance", {
      left: [
        g(
          [
            n("Workers Security Model", "personal"),
            n("Isolates Architecture"),
            n("Web Security Headers"),
            n("Rate Limiting"),
            n("Edge SSL/TLS"),
            n("Bot Management"),
          ],
          n("Security Architecture")
        ),
      ],
      right: [
        g(
          [n("Cache API", "personal"), n("HTML Rewriting"), n("Tiered Caching & Purging")],
          n("Performance & Optimization")
        ),
      ],
    }),
    stage("Integration & Workflows", {
      left: [
        g(
          [
            n("Pages Functions", "personal"),
            n("Service Bindings"),
            n("Inter Worker Communication"),
            n("External API Integration"),
          ],
          n("Application Integration")
        ),
      ],
      right: [
        g(
          [
            n("Webhook Handling", "personal"),
            n("Event-driven Architectures"),
            n("Scheduled Cron Triggers"),
          ],
          n("Event-driven Patterns")
        ),
      ],
    }),
    stage("Development Tools", {
      left: [
        g(
          [n("Wrangler", "personal"), n("Miniflare", "alternative"), n("DevTools")],
          n("CLI & Local Emulation")
        ),
      ],
      right: [
        g(
          [n("Testing Frameworks", "personal"), n("Monitoring Tools"), n("Debugging Techniques")],
          n("Observability & Testing")
        ),
      ],
      projectIdea:
        "Setup an end-to-end CI/CD edge pipeline with automated testing, staging environments and Wrangler secrets",
    }),
  ],
};

export const CLOUDFLARE_SECTIONS: CloudflareRoadmapSection[] = [
  PREREQUISITES_SECTION,
  WORKERS_SECTION,
  STORAGE_SECTION,
  DURABLE_EXECUTION_SECTION,
  ADVANCED_FEATURES_SECTION,
  SECURITY_AND_TOOLS_SECTION,
];
