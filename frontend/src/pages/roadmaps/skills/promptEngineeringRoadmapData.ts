export type PromptEngineeringRoadmapStatus = "personal" | "alternative" | "optional";

export interface PromptEngineeringRoadmapNode {
  id: string;
  title: string;
  status?: PromptEngineeringRoadmapStatus;
  roadmapId?: string;
}

export interface PromptEngineeringRoadmapGroup {
  id: string;
  parent?: PromptEngineeringRoadmapNode;
  items: PromptEngineeringRoadmapNode[];
}

export interface PromptEngineeringRoadmapStage {
  id: string;
  node: PromptEngineeringRoadmapNode;
  left?: PromptEngineeringRoadmapGroup[];
  right?: PromptEngineeringRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface PromptEngineeringRoadmapSection {
  id: string;
  title?: string;
  stages: PromptEngineeringRoadmapStage[];
}

export interface PromptEngineeringRoadmapLink {
  label: string;
  roadmapId: string;
}

export const PROMPT_ENGINEERING_MARKERS: Array<{
  status: PromptEngineeringRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const PROMPT_ENGINEERING_RELATED_ROADMAPS: PromptEngineeringRoadmapLink[] = [
  { label: "Ai Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Ai Agents Roadmap", roadmapId: "skill-ai-agents" },
  { label: "Ai Data Scientist Roadmap", roadmapId: "ai-data-scientist" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Mlops Roadmap", roadmapId: "mlops" },
  { label: "Claude Code Roadmap", roadmapId: "skill-claude-code" },
  { label: "Vibe Coding Roadmap", roadmapId: "vibe-coding" },
];

export const PROMPT_ENGINEERING_CONTINUE_LEARNING: PromptEngineeringRoadmapLink[] = [
  { label: "Ai Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Ai Agents Roadmap", roadmapId: "skill-ai-agents" },
  { label: "Ai Data Scientist Roadmap", roadmapId: "ai-data-scientist" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Mlops Roadmap", roadmapId: "mlops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: PromptEngineeringRoadmapStatus,
  roadmapId?: string,
  customId?: string
): PromptEngineeringRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: PromptEngineeringRoadmapNode[],
  parent?: PromptEngineeringRoadmapNode,
  customId?: string
): PromptEngineeringRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<PromptEngineeringRoadmapStage, "id" | "node"> & {
    status?: PromptEngineeringRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): PromptEngineeringRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: PromptEngineeringRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Introduction",
  stages: [
    stage("Introduction", {
      status: "personal",
      left: [
        g([
          n("Common Terminology"),
          n("LLM"),
          n("Tokens"),
          n("Context Window"),
          n("Hallucination"),
          n("Agents"),
          n("Related Roadmaps"),
        ]),
      ],
      right: [
        g([
          n("LLMs and how they work?"),
          n("What is a Prompt?"),
          n("What is Prompt Engineering?"),
          n("Models offered by ____"),
          n("OpenAI"),
          n("Google"),
          n("Anthropic"),
          n("Meta"),
          n("LLM Configuration"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("LLM Configuration", {
      status: "personal",
      left: [
        g([
          n("Prompt Injection"),
          n("Model Weights / Parameters"),
          n("Fine-Tuning vs Prompt Engg."),
        ]),
      ],
      right: [g([n("xAI"), n("Temperature"), n("Sampling Parameters")])],
    }),
    stage("Sampling Parameters", {
      status: "personal",
      left: [g([n("AI vs AGI"), n("RAG")])],
      right: [g([n("Top-K"), n("Top-P"), n("Max Tokens")])],
    }),
  ],
};

const SECTION_2: PromptEngineeringRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Output Control",
  stages: [
    stage("Output Control", {
      status: "personal",
      left: [g([n("Prompting Techniques")])],
      right: [g([n("Stop Sequences")])],
    }),
    stage("Structured Outputs", {
      status: "personal",
      left: [g([n("Step-back Prompting"), n("Zero-Shot Prompting")])],
      right: [g([n("Frequency Penalty"), n("Presence Penalty")])],
    }),
    stage("Repetition Penalties", {
      status: "personal",
      right: [g([n("Structured Outputs")])],
    }),
  ],
};

const SECTION_3: PromptEngineeringRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Automatic Prompt Engineering",
  stages: [
    stage("Automatic Prompt Engineering", {
      status: "personal",
      left: [
        g([
          n("Chain of Thought (CoT) Prompting"),
          n("One-Shot / Few-Shot Prompting"),
          n("Self-Consistency Prompting"),
          n("System / Role / Contextual"),
          n("System Prompting"),
          n("Tree of Thoughts (ToT) Prompting"),
          n("Role Prompting"),
          n("ReAct Prompting"),
          n("Contextual Prompting"),
          n("Prompt Tuning"),
        ]),
      ],
      right: [g([n("Use LLM to generate Prompts")])],
    }),
    stage("Prompting Best Practices", {
      status: "personal",
      left: [
        g([
          n("\u2014 Provide few-shot examples for structure or output style you need"),
          n("\u2014 Keep your prompts short and concise"),
          n("\u2014 Ask for structured output if it helps e.g. JSON, XML, Markdown, CSV etc"),
          n("\u2014 Use variables / placeholders in your prompts for easier configuration"),
          n("\u2014 Prioritize giving clearer instructions over adding constraints"),
          n("\u2014 Control the maximum output length"),
        ]),
      ],
      right: [g([n("AI Red Teaming Roadmap"), n("Improving Reliability")])],
    }),
    stage("AI Red Teaming", {
      status: "personal",
      left: [g([n("Prompting Best Practices")])],
    }),
  ],
};

const SECTION_4: PromptEngineeringRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Continue learning with following roadmaps",
  stages: [
    stage("Continue learning with following roadmaps", {
      status: "personal",
      left: [
        g([
          n("\u2014 Optimize for latency & cost in production pipelines"),
          n("\u2014 Document decisions, failures, and learnings for future devs"),
          n("\u2014 Delimit different sections with triple backticks or XML tags"),
          n("AI Engineer Roadmap"),
          n("\u2014 Experiment with input formats and writing styles"),
          n("\u2014 Tune sampling (temperature, top-k, top-p) for determinism vs creativity"),
          n("\u2014 Guard against prompt injection; sanitize user text"),
          n("\u2014 Automate evaluation; integrate unit tests for outputs"),
          n("\u2014 Document and track prompt versions"),
        ]),
      ],
      right: [
        g([
          n("Calibrating LLMs"),
          n("AI Agents Roadmap"),
          n("Prompt Debiasing"),
          n("Prompt Ensembling"),
          n("LLM Self Evaluation"),
        ]),
      ],
    }),
  ],
};

export const PROMPT_ENGINEERING_SECTIONS: PromptEngineeringRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
