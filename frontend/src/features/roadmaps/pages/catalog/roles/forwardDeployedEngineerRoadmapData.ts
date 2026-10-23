export type ForwardDeployedEngineerRoadmapStatus = "personal" | "alternative" | "optional";

export interface ForwardDeployedEngineerRoadmapNode {
  id: string;
  title: string;
  status?: ForwardDeployedEngineerRoadmapStatus;
  roadmapId?: string;
  projectIdea?: boolean;
}

export interface ForwardDeployedEngineerRoadmapGroup {
  id: string;
  parent?: ForwardDeployedEngineerRoadmapNode;
  items: ForwardDeployedEngineerRoadmapNode[];
}

export interface ForwardDeployedEngineerRoadmapStage {
  id: string;
  node: ForwardDeployedEngineerRoadmapNode;
  left?: ForwardDeployedEngineerRoadmapGroup[];
  right?: ForwardDeployedEngineerRoadmapGroup[];
  noteAfter?: string;
}

export interface ForwardDeployedEngineerRoadmapSection {
  id: string;
  title?: string;
  stages: ForwardDeployedEngineerRoadmapStage[];
}

export interface ForwardDeployedEngineerRoadmapLink {
  label: string;
  roadmapId: string;
}

export const FDE_MARKERS: Array<{
  status: ForwardDeployedEngineerRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const FDE_RELATED_ROADMAPS: ForwardDeployedEngineerRoadmapLink[] = [
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
  { label: "System Design Roadmap", roadmapId: "skill-system-design" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Data Engineer Roadmap", roadmapId: "data-engineer" },
];

export const FDE_GLOSSARY = [
  "Delta",
  "Last-Mile Integration",
  "Day 2 Operations",
  "Productized Consulting",
  "Embedded Engineering",
  "UAT",
];

export const FDE_CONTINUE_LEARNING: ForwardDeployedEngineerRoadmapLink[] = [
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "Full Stack", roadmapId: "full-stack" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Data Engineer", roadmapId: "data-engineer" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ForwardDeployedEngineerRoadmapStatus,
  roadmapId?: string,
  projectIdea?: boolean
): ForwardDeployedEngineerRoadmapNode => ({
  id: slug(title),
  title,
  status,
  roadmapId,
  projectIdea,
});

const g = (
  items: ForwardDeployedEngineerRoadmapNode[],
  parent?: ForwardDeployedEngineerRoadmapNode
): ForwardDeployedEngineerRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ForwardDeployedEngineerRoadmapStage, "id" | "node"> & {
    status?: ForwardDeployedEngineerRoadmapStatus;
  } = {}
): ForwardDeployedEngineerRoadmapStage => {
  const { status, ...rest } = options;

  return {
    id: slug(title),
    node: n(title, status),
    ...rest,
  };
};

const INTRODUCTION: ForwardDeployedEngineerRoadmapSection = {
  id: "introduction",
  stages: [
    stage("Introduction", {
      right: [g([n("From X to FDE"), n("Roles & Responsabilities"), n("FDE Tiers")])],
      noteAfter:
        "FDE is not a beginner role, you will most probably be already a Full-Stack Developer stepping into an FDE role.",
    }),
  ],
};

const COMPUTER_SCIENCE_BASICS: ForwardDeployedEngineerRoadmapSection = {
  id: "computer-science-basics",
  title: "Computer Science Basics",
  stages: [
    stage("Learn a Language", {
      right: [
        g([
          n("Python"),
          n("JavaScript / TypeScript"),
          n("Java / Scala"),
          n("Go"),
          n("Rust"),
          n("C++"),
        ]),
      ],
      noteAfter: "Python is the go-to language for FDEs.",
    }),
    stage("DSA & System Design", {
      left: [
        g([
          n("DSA Roadmap", undefined, "skill-dsa"),
          n("System Design Roadmap", undefined, "skill-system-design"),
        ]),
      ],
      noteAfter:
        "DSA is the first gate in FDE interviews. You won't get to show your AI skills if you don't pass this round.",
    }),
    stage("Git & GitHub", {
      right: [g([n("Git & GitHub Roadmap", undefined, "skill-git-github")])],
    }),
    stage("Linux Skills", {
      right: [
        g([
          n("Linux Roadmap", undefined, "skill-linux"),
          n("Shell & Bash Roadmap", undefined, "skill-shell"),
        ]),
      ],
      noteAfter:
        "FDEs need to be proficient in full-stack development, have high agency and be able to deliver full apps for customers.",
    }),
  ],
};

const FULL_STACK_DEVELOPMENT: ForwardDeployedEngineerRoadmapSection = {
  id: "full-stack-development",
  title: "Full Stack Development",
  stages: [
    stage("Frontend Skills", {
      right: [
        g([
          n("CSS"),
          n("HTML"),
          n("JavaScript"),
          n("React"),
          n("Frontend Project Ideas", undefined, undefined, true),
          n("Frontend Roadmap", undefined, "frontend"),
        ]),
      ],
    }),
    stage("Backend Skills", {
      left: [
        g([
          n("Node.js"),
          n("PostgreSQL"),
          n("NoSQL DBs"),
          n("GraphQL"),
          n("APIs Design"),
          n("Backend Project Ideas", undefined, undefined, true),
          n("Backend Roadmap", undefined, "backend"),
        ]),
      ],
    }),
  ],
};

const DATA_ENGINEERING: ForwardDeployedEngineerRoadmapSection = {
  id: "data-engineering",
  title: "Data Engineering",
  stages: [
    stage("Data Engineering Skills", {
      right: [
        g([
          n("Data Modeling"),
          n("Data Pipelines"),
          n("Data Warehouses"),
          n("Spark"),
          n("Airflow"),
          n("Data Engineer Roadmap", undefined, "data-engineer"),
        ]),
      ],
      noteAfter:
        "A large share of FDE work starts with a data audit. If you can't untangle a customer's schema, you can't build on top of it.",
    }),
  ],
};

const AI_ENGINEERING: ForwardDeployedEngineerRoadmapSection = {
  id: "ai-engineering",
  title: "AI Engineering",
  stages: [
    stage("AI Engineering Skills", {
      left: [
        g([
          n("LLM Fundamentals"),
          n("Prompt Engineering"),
          n("Context Engineering"),
          n("RAGs"),
          n("Vector DBs"),
          n("Choosing Model Providers"),
          n("Prompt Management"),
          n("AI Engineer Roadmap", undefined, "ai-engineer"),
        ]),
      ],
      noteAfter:
        "AI Engineering is the core skill of the FDE role at AI labs and AI-native companies.",
    }),
    stage("AI Agents", {
      left: [g([n("AI Agents Roadmap", undefined, "skill-ai-agents")])],
      right: [
        g([
          n("Agent Architectures"),
          n("Tools & Functions"),
          n("Memory & State"),
          n("MCP"),
          n("Multi-Agents"),
        ]),
      ],
    }),
    stage("Vibe Coding", {
      left: [g([n("Claude Code"), n("Gemini"), n("OpenClaw")], n("AI-Assisted Coding Tools"))],
      right: [
        g([
          n("Codex"),
          n("Cursor"),
          n("OpenCode"),
          n("Vibe Coding Roadmap", undefined, "skill-vibe-coding"),
        ]),
      ],
    }),
    stage("Integration Engineering", {
      right: [g([n("Working with Legacy Systems")])],
    }),
  ],
};

const DEVOPS_AND_CLOUD_SKILLS: ForwardDeployedEngineerRoadmapSection = {
  id: "devops-cloud-skills",
  title: "DevOps & Cloud Skills",
  stages: [
    stage("Cloud Platforms", {
      left: [g([n("AWS"), n("Terraform")])],
      right: [g([n("GCP"), n("Azure")])],
      noteAfter:
        "FDE are fluent in least one major cloud platform and know how to deploy infrastructure as code.",
    }),
    stage("Containers", {
      right: [g([n("Docker"), n("Kubernetes")])],
    }),
    stage("DevOps Skills", {
      left: [g([n("DevOps Roadmap", undefined, "devops")])],
      noteAfter:
        "FDEs are responsible for proving to customers that what they built won't break or go rogue in production.",
    }),
  ],
};

const PRODUCTION_AI_SYSTEMS: ForwardDeployedEngineerRoadmapSection = {
  id: "production-ai-systems",
  title: "Production AI Systems",
  stages: [
    stage("Observability", {
      right: [
        g([
          n("Inference Optimization"),
          n("Inference Engineering", undefined, "inference-engineering"),
          n("Building Eval Pipelines"),
          n("Debugging Agent Logic"),
        ]),
      ],
    }),
    stage("Security", {
      left: [
        g([
          n("DevSecOps"),
          n("API Security"),
          n("Authentication"),
          n("AI Governance"),
          n("Data Privacy & Compliance"),
        ]),
      ],
    }),
    stage("MLOps", {
      left: [g([n("MLOps Roadmap", undefined, "mlops")])],
    }),
  ],
};

const CUSTOMER_DELIVERY_AND_FIELD_SKILLS: ForwardDeployedEngineerRoadmapSection = {
  id: "customer-delivery-field-skills",
  title: "Customer Delivery & Field Skills",
  stages: [
    stage("Discovery & Scoping", {
      left: [
        g([n("Requirements Gathering"), n("Scoping & Sequencing"), n("Scope, Speed, Quality")]),
      ],
    }),
    stage("Business Acumen", {
      right: [
        g([
          n("Enterprise Workflow"),
          n("ROI & AI Impact"),
          n("Stakeholder Management"),
          n("Product Feedback Loop"),
          n("Time-to-Value"),
        ]),
      ],
    }),
    stage("Communication", {
      left: [g([n("Technical Writing"), n("Executive Reporting")])],
    }),
  ],
};

export const FDE_SECTIONS: ForwardDeployedEngineerRoadmapSection[] = [
  INTRODUCTION,
  COMPUTER_SCIENCE_BASICS,
  FULL_STACK_DEVELOPMENT,
  DATA_ENGINEERING,
  AI_ENGINEERING,
  DEVOPS_AND_CLOUD_SKILLS,
  PRODUCTION_AI_SYSTEMS,
  CUSTOMER_DELIVERY_AND_FIELD_SKILLS,
];
