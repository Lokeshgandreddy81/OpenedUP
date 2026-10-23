export type AiAgentsRoadmapStatus = "personal" | "alternative" | "optional";

export interface AiAgentsRoadmapNode {
  id: string;
  title: string;
  status?: AiAgentsRoadmapStatus;
  roadmapId?: string;
}

export interface AiAgentsRoadmapGroup {
  id: string;
  parent?: AiAgentsRoadmapNode;
  items: AiAgentsRoadmapNode[];
}

export interface AiAgentsRoadmapStage {
  id: string;
  node: AiAgentsRoadmapNode;
  left?: AiAgentsRoadmapGroup[];
  right?: AiAgentsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AiAgentsRoadmapSection {
  id: string;
  title?: string;
  stages: AiAgentsRoadmapStage[];
}

export interface AiAgentsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const AI_AGENTS_MARKERS: Array<{
  status: AiAgentsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const AI_AGENTS_RELATED_ROADMAPS: AiAgentsRoadmapLink[] = [
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "AI and Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Prompt Engineering Roadmap", roadmapId: "skill-prompt-engineering" },
  { label: "Claude Code Roadmap", roadmapId: "skill-claude-code" },
  { label: "Vibe Coding Roadmap", roadmapId: "skill-vibe-coding" },
  { label: "MLOps Roadmap", roadmapId: "mlops" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
];

export const AI_AGENTS_CONTINUE_LEARNING: AiAgentsRoadmapLink[] = [
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Prompt Engineering", roadmapId: "skill-prompt-engineering" },
  { label: "Claude Code", roadmapId: "skill-claude-code" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AiAgentsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): AiAgentsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AiAgentsRoadmapNode[],
  parent?: AiAgentsRoadmapNode,
  customId?: string
): AiAgentsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AiAgentsRoadmapStage, "id" | "node"> & {
    status?: AiAgentsRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): AiAgentsRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. PREREQUISITES & LLM FUNDAMENTALS
const PREREQUISITES_AND_FUNDAMENTALS: AiAgentsRoadmapSection = {
  id: "prerequisites-and-fundamentals",
  title: "Prerequisites & LLM Fundamentals",
  stages: [
    stage("Pre-requisites", {
      left: [
        g(
          [
            n("Basic Backend Development", undefined, "backend"),
            n("Git and Terminal Usage", undefined, "skill-git-github"),
            n("REST API Knowledge", undefined, "skill-api-design"),
          ],
          n("Engineering Primitives")
        ),
      ],
      right: [
        g([n("Open Weight Models"), n("Closed Weight Models")], n("Model Families and Licenses")),
      ],
    }),
    stage("LLM Fundamentals", {
      left: [
        g(
          [
            n("Streamed vs Unstreamed Responses"),
            n("Reasoning vs Standard Models"),
            n("Fine-tuning vs Prompt Engineering"),
            n("Embeddings and Vector Search"),
            n("Understand the Basics of RAG"),
            n("Pricing of Common Models"),
          ],
          n("Understand the Basics")
        ),
      ],
      right: [
        g(
          [
            n("Tokenization"),
            n("Context Windows"),
            n("Temperature"),
            n("Top-p"),
            n("Frequency Penalty"),
            n("Presence Penalty"),
            n("Stopping Criteria"),
            n("Max Length"),
          ],
          n("Model Mechanics & Generation Controls")
        ),
      ],
    }),
  ],
};

// 2. AGENT ANATOMY & THE CORE LOOP
const AGENT_ANATOMY_AND_LOOP: AiAgentsRoadmapSection = {
  id: "agent-anatomy-and-loop",
  title: "Agent Anatomy & The Core Loop",
  stages: [
    stage("AI Agents 101", {
      left: [
        g(
          [
            n("Personal assistant"),
            n("Code generation"),
            n("Data analysis"),
            n("Web Scraping / Crawling"),
            n("NPC / Game AI"),
          ],
          n("Example Usecases")
        ),
      ],
      right: [
        g(
          [
            n("Perception / User Input"),
            n("Reason and Plan"),
            n("Acting / Tool Invocation"),
            n("Observation & Reflection"),
          ],
          n("Agent Loop")
        ),
      ],
      noteAfter:
        "An AI Agent is a continuous state loop: it perceives an input, reasons about next steps, acts using tools, and observes feedback until the goal is achieved.",
    }),
    stage("Prompt Engineering", {
      roadmapId: "skill-prompt-engineering",
      left: [
        g(
          [
            n("Be specific in what you want"),
            n("Provide additional context"),
            n("Use relevant technical terms"),
            n("Use Examples in your Prompt"),
            n("Specify Length, format etc"),
            n("Iterate and Test your Prompts"),
          ],
          n("Writing Good Prompts")
        ),
      ],
      right: [g([n("Chain of Thought (CoT)"), n("Tree-of-Thought")], n("Prompting Techniques"))],
    }),
  ],
};

// 3. TOOLS, ACTIONS & MCP
const TOOLS_ACTIONS_AND_MCP: AiAgentsRoadmapSection = {
  id: "tools-actions-and-mcp",
  title: "Tools, Actions & MCP",
  stages: [
    stage("Tools / Actions", {
      left: [
        g(
          [
            n("Name and Description"),
            n("Input / Output Schema"),
            n("Error Handling"),
            n("Usage Examples"),
          ],
          n("Tool Definition")
        ),
      ],
      right: [
        g(
          [
            n("Web Search"),
            n("Code Execution / REPL"),
            n("Database Queries"),
            n("API Requests"),
            n("Email / Slack / SMS"),
            n("File System Access"),
          ],
          n("Examples of Tools")
        ),
      ],
    }),
    stage("Model Context Protocol (MCP)", {
      left: [g([n("MCP Hosts"), n("MCP Client"), n("MCP Servers")], n("Core Components"))],
      right: [g([n("Local Desktop"), n("Remote / Cloud")], n("Deployment Modes"))],
      noteAfter:
        "Anthropic's open Model Context Protocol (MCP) standardizes how agents discover tools, authenticate, and access context securely.",
    }),
  ],
};

// 4. AGENT MEMORY & CONTEXT
const AGENT_MEMORY: AiAgentsRoadmapSection = {
  id: "agent-memory",
  title: "Agent Memory",
  stages: [
    stage("Agent Memory", {
      left: [
        g(
          [n("Short Term Memory"), n("Long Term Memory"), n("Episodic vs Semantic Memory")],
          n("Memory Types")
        ),
      ],
      right: [
        g(
          [
            n("Within Prompt"),
            n("RAG and Vector Databases"),
            n("User Profile Storage"),
            n("Summarization / Compression"),
            n("Forgetting / Aging Strategies"),
          ],
          n("Maintaining Memory")
        ),
      ],
    }),
  ],
};

// 5. AGENT ARCHITECTURES & PATTERNS
const AGENT_ARCHITECTURES: AiAgentsRoadmapSection = {
  id: "agent-architectures",
  title: "Agent Architectures",
  stages: [
    stage("Common Architectures", {
      left: [
        g(
          [n("ReAct (Reason + Act)"), n("RAG Agent"), n("Planner Executor"), n("DAG Agents")],
          n("Single Agent Patterns")
        ),
      ],
      right: [g([n("Multi-Agents"), n("Self-critique Agents")], n("Multi-Agent & Reflection"))],
      projectIdea: "Build an Autonomous Coding Research Swarm with Planner + Executor",
    }),
  ],
};

// 6. BUILDING & FRAMEWORKS
const BUILDING_AND_FRAMEWORKS: AiAgentsRoadmapSection = {
  id: "building-and-frameworks",
  title: "Building Agents",
  stages: [
    stage("Building Agents", {
      left: [
        g(
          [
            n("Direct LLM API calls"),
            n("Implementing the agent loop"),
            n("Parsing model output"),
            n("Error & Rate-limit handling"),
          ],
          n("Manual (from scratch)")
        ),
        g(
          [
            n("OpenAI Functions Calling"),
            n("OpenAI Assistant API"),
            n("Anthropic Tool Use"),
            n("Gemini Function Calling"),
          ],
          n("LLM Native Function Calling")
        ),
      ],
      right: [
        g(
          [
            n("LangChain"),
            n("LangGraph"),
            n("LlamaIndex"),
            n("CrewAI"),
            n("AutoGen"),
            n("Haystack"),
            n("Smol Depot"),
            n("Agno"),
          ],
          n("Building Using Frameworks")
        ),
      ],
    }),
  ],
};

// 7. EVALS, OBSERVABILITY & SECURITY
const EVALS_OBSERVABILITY_AND_SECURITY: AiAgentsRoadmapSection = {
  id: "evals-observability-and-security",
  title: "Evaluation, Observability & Security",
  stages: [
    stage("Evaluation and Testing", {
      left: [
        g(
          [
            n("Metrics to Track"),
            n("Unit Testing for Individual Tools"),
            n("Integration Testing for Flows"),
            n("Human in the Loop Evaluation"),
            n("DeepEval"),
            n("Ragas"),
          ],
          n("Evaluation and Testing")
        ),
      ],
      right: [
        g(
          [
            n("Structured logging & tracing"),
            n("LangSmith"),
            n("LangFuse"),
            n("Helicone"),
            n("openllmetry"),
          ],
          n("Observability Tools")
        ),
      ],
    }),
    stage("Security & Ethics", {
      left: [
        g(
          [
            n("Prompt Injection / Jailbreaks"),
            n("Tool sandboxing / Permissioning"),
            n("Data Privacy + PII Redaction"),
          ],
          n("Defensive Guardrails")
        ),
      ],
      right: [
        g([n("Bias & Toxicity Guardrails"), n("Safety + Red Team Testing")], n("Ethics & Safety")),
      ],
    }),
  ],
};

export const AI_AGENTS_SECTIONS: AiAgentsRoadmapSection[] = [
  PREREQUISITES_AND_FUNDAMENTALS,
  AGENT_ANATOMY_AND_LOOP,
  TOOLS_ACTIONS_AND_MCP,
  AGENT_MEMORY,
  AGENT_ARCHITECTURES,
  BUILDING_AND_FRAMEWORKS,
  EVALS_OBSERVABILITY_AND_SECURITY,
];
