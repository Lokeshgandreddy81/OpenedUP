export type AiAndDataScientistRoadmapStatus = "personal" | "alternative" | "optional";

export interface AiAndDataScientistRoadmapNode {
  id: string;
  title: string;
  status?: AiAndDataScientistRoadmapStatus;
  roadmapId?: string;
}

export interface AiAndDataScientistRoadmapGroup {
  id: string;
  parent?: AiAndDataScientistRoadmapNode;
  items: AiAndDataScientistRoadmapNode[];
}

export interface AiAndDataScientistRoadmapStage {
  id: string;
  node: AiAndDataScientistRoadmapNode;
  left?: AiAndDataScientistRoadmapGroup[];
  right?: AiAndDataScientistRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AiAndDataScientistRoadmapSection {
  id: string;
  title?: string;
  stages: AiAndDataScientistRoadmapStage[];
}

export interface AiAndDataScientistRoadmapLink {
  label: string;
  roadmapId: string;
}

export const AI_AND_DATA_SCIENTIST_MARKERS: Array<{
  status: AiAndDataScientistRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const AI_AND_DATA_SCIENTIST_RELATED_ROADMAPS: AiAndDataScientistRoadmapLink[] = [
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Python for Data Analysis Roadmap", roadmapId: "skill-python-data-analysis" },
  { label: "R Programming Roadmap", roadmapId: "skill-r-programming" },
];

export const AI_AND_DATA_SCIENTIST_CONTINUE_LEARNING: AiAndDataScientistRoadmapLink[] = [
  { label: "Claude Code", roadmapId: "skill-claude-code" },
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "Data Analyst", roadmapId: "data-analyst" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AiAndDataScientistRoadmapStatus,
  roadmapId?: string
): AiAndDataScientistRoadmapNode => ({
  id: slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AiAndDataScientistRoadmapNode[],
  parent?: AiAndDataScientistRoadmapNode
): AiAndDataScientistRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AiAndDataScientistRoadmapStage, "id" | "node"> & {
    status?: AiAndDataScientistRoadmapStatus;
  } = {}
): AiAndDataScientistRoadmapStage => {
  const { status, ...rest } = options;

  return {
    id: slug(title),
    node: n(title, status),
    ...rest,
  };
};

const FOUNDATIONS: AiAndDataScientistRoadmapSection = {
  id: "foundations",
  stages: [
    stage("Mathematics", {
      left: [g([n("Linear Algebra, Calculus, Mathematical Analysis"), n("Differential Calculus")])],
    }),
    stage("Statistics", {
      right: [
        g([
          n("Statistics, CLT"),
          n("Hypothesis Testing"),
          n("Probability and Sampling"),
          n("AB Testing"),
          n("Increasing Test Sensitivity"),
          n("Ratio Metrics"),
        ]),
      ],
    }),
    stage("Econometrics", {
      left: [
        g([
          n("Pre-requisites of Econometrics"),
          n("Regression, Timeseries, Fitting Distributions"),
        ]),
      ],
    }),
    stage("Coding", {
      left: [
        g([
          n("Learn Python Programming Language"),
          n("Data Structures and Algorithms (Python)"),
          n("Learn SQL"),
        ]),
      ],
    }),
    stage("Exploratory Data Analysis", {
      right: [g([n("Data understanding, Data Analysis and Visualization")])],
    }),
    stage("Machine Learning", {
      right: [g([n("Classic ML (Sup., Unsup.), Advanced ML (Ensembles, NNs)")])],
    }),
    stage("Deep Learning", {
      left: [g([n("Fully Connected, CNN, RNN, LSTM, Transformers, TL")])],
    }),
    stage("MLOps", {
      right: [g([n("Deployment Models, CI/CD")])],
    }),
    stage("AI Engineering", {
      right: [g([n("Prompt Engineering, LLMs, RAG, Agents, Fine-tuning")])],
    }),
    stage("Vibe Coding", {
      left: [g([n("AI Coding Assitants, AI App Builders")])],
    }),
  ],
};

export const AI_AND_DATA_SCIENTIST_SECTIONS: AiAndDataScientistRoadmapSection[] = [FOUNDATIONS];
