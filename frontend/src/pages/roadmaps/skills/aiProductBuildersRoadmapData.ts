export type AiProductBuildersRoadmapStatus = "personal" | "alternative" | "optional";

export interface AiProductBuildersRoadmapNode {
  id: string;
  title: string;
  status?: AiProductBuildersRoadmapStatus;
  roadmapId?: string;
}

export interface AiProductBuildersRoadmapGroup {
  id: string;
  parent?: AiProductBuildersRoadmapNode;
  items: AiProductBuildersRoadmapNode[];
}

export interface AiProductBuildersRoadmapStage {
  id: string;
  node: AiProductBuildersRoadmapNode;
  left?: AiProductBuildersRoadmapGroup[];
  right?: AiProductBuildersRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AiProductBuildersRoadmapSection {
  id: string;
  title?: string;
  stages: AiProductBuildersRoadmapStage[];
}

export interface AiProductBuildersRoadmapLink {
  label: string;
  roadmapId: string;
}

export const AI_PRODUCT_BUILDERS_MARKERS: Array<{
  status: AiProductBuildersRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const AI_PRODUCT_BUILDERS_RELATED_ROADMAPS: AiProductBuildersRoadmapLink[] = [
  { label: "Claude Code Roadmap", roadmapId: "skill-claude-code" },
  { label: "Vibe Coding Roadmap", roadmapId: "skill-vibe-coding" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
  { label: "OpenClaw Roadmap", roadmapId: "skill-openclaw" },
  { label: "Forward Deployed Engineer Roadmap", roadmapId: "forward-deployed-engineer" },
];

export const AI_PRODUCT_BUILDERS_CONTINUE_LEARNING: AiProductBuildersRoadmapLink[] = [
  { label: "Vibe Coding", roadmapId: "skill-vibe-coding" },
  { label: "Claude Code", roadmapId: "skill-claude-code" },
  { label: "Full Stack", roadmapId: "full-stack" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Forward Deployed Engineer", roadmapId: "forward-deployed-engineer" },
  { label: "OpenClaw", roadmapId: "skill-openclaw" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AiProductBuildersRoadmapStatus,
  roadmapId?: string,
  customId?: string
): AiProductBuildersRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AiProductBuildersRoadmapNode[],
  parent?: AiProductBuildersRoadmapNode,
  customId?: string
): AiProductBuildersRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AiProductBuildersRoadmapStage, "id" | "node"> & {
    status?: AiProductBuildersRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): AiProductBuildersRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. PRODUCT DEFINITION & SCOPE
const DEFINITION_AND_SCOPE: AiProductBuildersRoadmapSection = {
  id: "definition-and-scope",
  title: "Product Definition & Scope",
  stages: [
    stage("Definition & Scope", {
      right: [
        g(
          [
            n("Problem Definition", "personal"),
            n("App Anatomy"),
            n("Feature Scoping", "personal"),
            n("Tech Stack & Constraints"),
          ],
          n("Scope & Feasibility")
        ),
      ],
      noteAfter:
        "The Product Development Cycle begins once your product scope, anatomy, and target constraints are established.",
    }),
  ],
};

// 2. PRODUCT DEVELOPMENT CYCLE
const PRODUCT_DEVELOPMENT_CYCLE: AiProductBuildersRoadmapSection = {
  id: "product-development-cycle",
  title: "Product Development Cycle",
  stages: [
    stage("1. Prototyping", {
      left: [
        g(
          [n("Choose a Prototype Tool"), n("Feedback & Validation", "personal")],
          n("Validation & Speed")
        ),
      ],
      right: [
        g(
          [
            n("Lovable", "personal"),
            n("v0", "personal"),
            n("Replit"),
            n("Claude Design"),
            n("Bolt", "alternative"),
            n("Hope", "alternative"),
          ],
          n("AI App Builders (Know Your Options)")
        ),
      ],
    }),
    stage("2. Generation", {
      left: [
        g(
          [
            n("Claude Code", "personal", "skill-claude-code"),
            n("Cursor", "personal"),
            n("Copilot"),
            n("Codex", "alternative"),
            n("Vibe Coding", undefined, "skill-vibe-coding"),
          ],
          n("AI-assisted Coding Tools")
        ),
      ],
      right: [
        g(
          [n("Claude Code", "personal", "skill-claude-code"), n("Gemini CLI"), n("Codex")],
          n("Technical CLI & Direct Tools")
        ),
      ],
    }),
    stage("3. Refinement", {
      left: [
        g(
          [
            n("HTML / CSS / JavaScript", undefined, "skill-javascript"),
            n("React", "personal", "skill-react"),
            n("Browsers / DevTools"),
            n("Node.js", undefined, "skill-nodejs"),
          ],
          n("Targeted Change (Learn by Need)")
        ),
      ],
      right: [
        g(
          [
            n("New Feature / Structural Change", "personal"),
            n("User Testing", "personal"),
            n("Unit Testing"),
            n("Integration Testing"),
            n("E2E Testing"),
          ],
          n("Testing & Feedback")
        ),
      ],
    }),
    stage("4. Collaboration", {
      right: [
        g(
          [
            n("GitHub", "personal", "skill-git-github"),
            n("GitLab", "alternative"),
            n("Bit Cloud"),
            n("Azure DevOps"),
          ],
          n("Change Management & CI")
        ),
      ],
      noteAfter:
        "Keep repeating the build-refine loop to continuously polish, test, and improve the product.",
    }),
  ],
};

// 3. DEPLOYMENT & INFRASTRUCTURE
const DEPLOYMENT_AND_INFRASTRUCTURE: AiProductBuildersRoadmapSection = {
  id: "deployment-and-infrastructure",
  title: "Deployment & Infrastructure",
  stages: [
    stage("5. Deployment", {
      left: [
        g(
          [
            n("Cloudflare", "personal", "skill-cloudflare"),
            n("Vercel", "personal"),
            n("Bit Cloud"),
          ],
          n("Serverless Providers")
        ),
        g(
          [n("DigitalOcean"), n("Railway", "personal"), n("Render", "alternative")],
          n("Platform as a Service (PaaS)")
        ),
      ],
      right: [
        g([n("AWS", undefined, "skill-aws"), n("Azure"), n("GCP")], n("Cloud Providers")),
        g(
          [
            n("PostgreSQL / MySQL", "personal", "postgresql"),
            n("MongoDB / Atlas", undefined, "skill-mongodb"),
            n("Supabase", "personal"),
          ],
          n("Connect to a Database")
        ),
      ],
      noteAfter:
        "Pick one deployment option that matches your scale, complexity, and operational requirements.",
    }),
  ],
};

export const AI_PRODUCT_BUILDERS_SECTIONS: AiProductBuildersRoadmapSection[] = [
  DEFINITION_AND_SCOPE,
  PRODUCT_DEVELOPMENT_CYCLE,
  DEPLOYMENT_AND_INFRASTRUCTURE,
];
