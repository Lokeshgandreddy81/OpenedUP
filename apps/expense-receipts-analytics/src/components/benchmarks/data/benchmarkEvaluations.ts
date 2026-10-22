import type { AIModelBenchmark } from "../types";

export type EvaluationCategory =
  | "Knowledge"
  | "Science"
  | "Reasoning"
  | "Mathematics"
  | "Coding"
  | "Factuality"
  | "Agentic"
  | "Preference";

export interface BenchmarkEvaluation {
  /** Stable identifier for the evaluation */
  id: string;
  /** Display name shown as the chart title */
  name: string;
  /** Capability domain used for filtering */
  category: EvaluationCategory;
  /** Short description shown under the chart title */
  subtitle: string;
  /** Score unit rendered with each value */
  unit: "percent" | "elo";
  /** Optional pill rendered next to the chart title (e.g. "Updated") */
  badge?: string;
  /** Extracts the evaluation score from a model */
  metric: (model: AIModelBenchmark) => number;
}

export const BENCHMARK_EVALUATIONS: BenchmarkEvaluation[] = [
  {
    id: "aa-briefcase-v1-1",
    name: "AA-Briefcase v1.1",
    category: "Agentic",
    subtitle: "Agentic knowledge work, (Elo-500)/2000",
    unit: "percent",
    badge: "Updated",
    metric: (model) => model.quality.briefcaseV11,
  },
  {
    id: "omniscience-accuracy",
    name: "AA-Omniscience Accuracy",
    category: "Knowledge",
    subtitle: "Knowledge",
    unit: "percent",
    metric: (model) => model.quality.omniscienceAccuracy,
  },
  {
    id: "omniscience-non-hallucination",
    name: "AA-Omniscience Non-Hallucination Rate",
    category: "Factuality",
    subtitle: "1 - hallucination rate",
    unit: "percent",
    metric: (model) => model.quality.omniscienceNonHallucination,
  },
  {
    id: "automationbench-aa",
    name: "AutomationBench-AA",
    category: "Agentic",
    subtitle: "Agentic SaaS workflows",
    unit: "percent",
    metric: (model) => model.quality.automationBenchAa,
  },
  {
    id: "gdpval-aa-v2-1",
    name: "GDPval-AA v2.1",
    category: "Agentic",
    subtitle: "Agentic real-world work tasks, (Elo-500)/2000",
    unit: "percent",
    badge: "Updated",
    metric: (model) => model.quality.gdpvalAa,
  },
  {
    id: "humanitys-last-exam",
    name: "Humanity's Last Exam",
    category: "Reasoning",
    subtitle: "Reasoning & knowledge",
    unit: "percent",
    metric: (model) => model.quality.humanitiesLastExam,
  },
  {
    id: "terminal-bench-4-0",
    name: "Terminal-Bench 4.0",
    category: "Coding",
    subtitle: "Agentic coding & terminal use",
    unit: "percent",
    metric: (model) => model.quality.terminalBench40,
  },
  {
    id: "frontiercode-1-1",
    name: "FrontierCode 1.1",
    category: "Coding",
    subtitle: "Agentic software engineering in open-source repositories",
    unit: "percent",
    badge: "NEW",
    metric: (model) => model.quality.frontierCode11,
  },
  {
    id: "aa-analyst-agent",
    name: "AA-AnalystAgent",
    category: "Agentic",
    subtitle: "Quantitative analysis on spreadsheets & documents",
    unit: "percent",
    metric: (model) => model.quality.analystAgentAa,
  },
  {
    id: "itbench-aa",
    name: "ITBench-AA",
    category: "Agentic",
    subtitle: "Kubernetes incident root-cause analysis",
    unit: "percent",
    metric: (model) => model.quality.itBenchAa,
  },
];

export const EVALUATION_CATEGORIES: EvaluationCategory[] = [
  "Knowledge",
  "Reasoning",
  "Factuality",
  "Agentic",
];

export function formatEvaluationValue(evaluation: BenchmarkEvaluation, value: number): string {
  return evaluation.unit === "elo" ? `${Math.round(value)}` : `${Math.round(value)}%`;
}
