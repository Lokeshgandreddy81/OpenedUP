/**
 * Artificial Analysis AI Model Benchmark & Pareto Analysis Types
 *
 * Strict TypeScript interfaces and type definitions covering model architectures,
 * benchmark evaluations (MMLU-Pro, GPQA Diamond, SWE-bench Verified, etc.),
 * performance metrics (TTFT, output speed, reasoning duration),
 * blended pricing models, inference providers, and Pareto multi-objective analysis.
 */

// --- Model Creators & Categorization ---

export type CreatorId =
  | "anthropic"
  | "openai"
  | "google"
  | "meta"
  | "deepseek"
  | "mistral"
  | "xai"
  | "spacexai"
  | "kimi"
  | "cohere"
  | "alibaba"
  | "microsoft"
  | "nvidia"
  | "bytedance"
  | "tencent"
  | "xiaomi"
  | "stepfun"
  | "upstage"
  | "ai21"
  | "ai2"
  | "baidu"
  | "ibm"
  | "minimax"
  | "reka"
  | "tii"
  | "perplexity"
  | "cerebras"
  | "groq"
  | "fireworks"
  | "togetherai"
  | "blackforestlabs"
  | "ideogram"
  | "runway"
  | "cartesia"
  | "elevenlabs"
  | (string & {});

export type WeightsType = "proprietary" | "open-weights" | "commercial-restricted";

export type ReasoningType = "standard" | "extended-thinking";

export type Modality = "text" | "vision" | "audio";

// --- Benchmark Quality Metrics ---

export interface QualityMetrics {
  /** Composite Artificial Analysis Intelligence Index (0 to 100) */
  intelligenceIndex: number;
  /** MMLU-Pro multi-task language understanding accuracy (0 to 100) */
  mmluPro: number;
  /** GPQA Diamond expert graduate-level QA accuracy (0 to 100) */
  gpqaDiamond: number;
  /** SWE-bench Verified real-world software engineering resolve rate (0 to 100) */
  sweBenchVerified: number;
  /** Humanity's Last Exam complex multidisciplinary reasoning accuracy (0 to 100).
   *  Only evaluated frontier models carry a score; 0 means not evaluated. */
  humanitiesLastExam: number;
  /** LMSYS Chatbot Arena Elo rating (e.g. 1250 - 1450) */
  chatbotArenaElo: number;
  /** Omniscience factual accuracy score (0 to 100) */
  omniscienceAccuracy: number;
  /** Omniscience hallucination-free rate (0 to 100) */
  omniscienceNonHallucination: number;
  /** MATH-500 competition-level mathematics accuracy (0 to 100) */
  math500: number;
  /** AA-Briefcase v1.1 agentic knowledge work score (0 to 100). The Briefcase Elo
   *  rescaled to (Elo-500)/2000; only evaluated frontier models carry a score. */
  briefcaseV11: number;
  /** GDPval-AA v2.1 agentic real-world work tasks score (0 to 100). The GDPval Elo
   *  rescaled to (Elo-500)/2000; only evaluated frontier models carry a score. */
  gdpvalAa: number;
  /** Terminal-Bench 4.0 agentic coding & terminal use pass rate (0 to 100).
   *  Only evaluated frontier models carry a score. */
  terminalBench40: number;
  /** FrontierCode 1.1 agentic software engineering in open-source repositories
   *  score (0 to 100). Only evaluated frontier models carry a score. */
  frontierCode11: number;
  /** AA-AnalystAgent quantitative analysis on spreadsheets & documents score
   *  (0 to 100). Only evaluated frontier models carry a score. */
  analystAgentAa: number;
  /** ITBench-AA Kubernetes incident root-cause analysis score (0 to 100).
   *  Only evaluated frontier models carry a score. */
  itBenchAa: number;
  /** AutomationBench-AA agentic SaaS workflow success rate (0 to 100) */
  automationBenchAa: number;
}

// --- Benchmark Performance Metrics ---

export interface PerformanceMetrics {
  /** Output generation speed in tokens per second */
  outputSpeedTokensPerSec: {
    median: number;
    p90?: number;
  };
  /** Time to first token (TTFT) in seconds */
  ttftSeconds: {
    median: number;
    p90?: number;
  };
  /** End-to-end latency for a 500-token response in seconds */
  endToEnd500TokensSec: number;
  /** Median reasoning / thinking phase duration in seconds (for reasoning models) */
  reasoningDurationMedianSec?: number;
}

// --- Benchmark Pricing Metrics ---

export interface PricingMetrics {
  /** USD blended price per 1M tokens based on standard 3:1 input/output token ratio */
  blendedPricePer1M: number;
  /** Input token price per 1M tokens in USD */
  inputPricePer1M: number;
  /** Output token price per 1M tokens in USD */
  outputPricePer1M: number;
  /** Prompt cache hit / cached input token price per 1M tokens in USD */
  cacheHitPricePer1M: number;
  /** Estimated standardized task execution cost in USD */
  costPerTaskUsd: number;
}

// --- Core Benchmark Model Interface ---

export interface AIModelBenchmark {
  /** Unique model identifier (e.g. 'claude-3-7-sonnet', 'gpt-4o', 'deepseek-r1') */
  id: string;
  /** Human-readable model display name */
  name: string;
  /** Organization / Creator identifier */
  creator: CreatorId;
  /** Display name of the creator organization */
  creatorDisplayName: string;
  /** Release date in ISO YYYY-MM or YYYY-MM-DD */
  releaseDate: string;
  /** License and weights distribution model */
  weightsType: WeightsType;
  /** Maximum context window size in tokens */
  contextWindowTokens: number;
  /** Maximum output tokens generated in a single completion */
  maxOutputTokens: number;
  /** Total parameter count in billions (if disclosed or estimated) */
  totalParametersB?: number;
  /** Active / activated parameter count in billions (for MoE architectures) */
  activeParametersB?: number;
  /** Whether the model utilizes explicit chain-of-thought / extended reasoning */
  isReasoningModel: boolean;
  /** True when the model has no publicly available API (hatched bars in charts) */
  noPublicApi?: boolean;
  /** Operational reasoning type */
  reasoningType: ReasoningType;
  /** Input and output modalities supported */
  modalities: Modality[];
  /** Standardized quality & intelligence evaluation scores */
  quality: QualityMetrics;
  /** Latency and throughput benchmarks */
  performance: PerformanceMetrics;
  /** Token and task execution pricing metrics */
  pricing: PricingMetrics;
  /** Concise executive summary of model strengths, architecture, and focus */
  summary: string;
  /** Semantic classification tags (e.g. ['coding', 'multimodal', 'fast', 'budget']) */
  tags: string[];
  /** Official model card, documentation, or release announcement URL */
  officialUrl?: string;
}

// --- Inference Providers & Hosting ---

export type ProviderId =
  | "cerebras"
  | "groq"
  | "together"
  | "fireworks"
  | "deepinfra"
  | "aws-bedrock"
  | "azure-openai"
  | "gcp-vertex";

export interface ProviderModelSupport {
  modelId: string;
  medianTps: number;
  p90Tps: number;
  medianTtft: number;
  blendedPricePer1M: number;
  uptimePercent: number;
}

export interface InferenceProvider {
  id: ProviderId;
  name: string;
  hardwareType: string;
  modelSupport: ProviderModelSupport[];
}

// --- Pareto Frontier & Scatter Analysis ---

export type ScatterMetric = "intelligence" | "speed" | "latency" | "price" | "contextWindow";

export type MetricDirection = "maximize" | "minimize";

export interface ParetoPoint {
  model: AIModelBenchmark;
  x: number;
  y: number;
  isParetoFrontier: boolean;
}

export interface ParetoFrontierResult {
  /** All evaluated models projected as 2D scatter points */
  points: ParetoPoint[];
  /** Non-dominated Pareto optimal points sorted ascending along the X-axis */
  frontierPoints: ParetoPoint[];
  /** AI models situated on the Pareto frontier */
  optimalModels: AIModelBenchmark[];
}

export interface ParetoOptions {
  /** Invert optimization direction for the X-axis metric */
  invertX?: boolean;
  /** Invert optimization direction for the Y-axis metric */
  invertY?: boolean;
}

// --- UI Navigation, Filtering & Sorting ---

export type BenchmarkCategory =
  | "overview"
  | "benchmarks"
  | "coding-agents"
  | "leaderboard"
  | "compare";

export interface ImageModelBenchmark {
  id: string;
  name: string;
  creator: string;
  creatorId: string;
  arenaElo: number;
  eloConfidence: number; // e.g. 12
  resolution: string; // e.g. "1024x1024"
  speedSeconds: number; // e.g. 4.2
  costPerImageUsd: number; // e.g. 0.04
  license: "commercial" | "open-weights" | "proprietary";
  styleStrengths: string[];
  releaseDate: string;
  barColor: string;
  votesCount?: number;
}

export interface VideoModelBenchmark {
  id: string;
  name: string;
  creator: string;
  creatorId: string;
  arenaElo: number;
  eloConfidence: number;
  maxDurationSec: number;
  motionQualityScore: number;
  promptAlignmentScore: number;
  speedSeconds: number;
  costPerVideoUsd: number;
  license: "commercial" | "open-weights" | "proprietary";
  styleStrengths: string[];
  releaseDate: string;
  barColor: string;
  votesCount?: number;
}

export interface SpeechModelBenchmark {
  id: string;
  name: string;
  creator: string;
  creatorId: string;
  type: "tts" | "stt";
  arenaElo: number;
  eloConfidence: number;
  latencyMs: number;
  throughput: string;
  costFormatted: string;
  accuracyOrNaturalness: number;
  metricLabel: string;
  metricValue: string;
  license: "commercial" | "open-weights" | "proprietary";
  languagesCount: number;
  releaseDate: string;
  barColor: string;
  votesCount?: number;
}

export interface MultimodalBattlePrompt {
  id: string;
  category: "text-to-image" | "video-generation" | "text-to-speech";
  prompt: string;
  modelA: {
    id: string;
    name: string;
    creator: string;
    outputUrl?: string;
    sampleDescription: string;
  };
  modelB: {
    id: string;
    name: string;
    creator: string;
    outputUrl?: string;
    sampleDescription: string;
  };
}

export interface CodingAgentBenchmark {
  id: string;
  name: string;
  harnessName: string;
  modelId: string;
  modelName: string;
  creator: CreatorId;
  codingAgentIndex: number; // 0 to 100 composite
  deepSweResolvedRate: number; // 0 to 100
  terminalBenchPassRate: number; // 0 to 100
  sweAtlasQnaAccuracy: number; // 0 to 100
  sweBenchVerifiedRate: number; // 0 to 100
  executionTimeMinutes: number; // Wall-clock minutes
  costPerResolvedTaskUsd: number; // USD per task
  tokenUsagePerTask: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
  };
  passAt1: number;
  passAt3: number;
  verifiedEnvironment: string;
}

export interface BenchmarkFilterState {
  search: string;
  weightsType: "all" | WeightsType;
  reasoningType: "all" | ReasoningType;
  creator: "all" | CreatorId;
  maxPrice?: number;
  minSpeed?: number;
}

export type SortField =
  "name" | "creator" | "intelligence" | "speed" | "latency" | "price" | "contextWindow";

export type SortDirection = "asc" | "desc";

// --- Artificial Analysis Brand Design Tokens ---

export type MetricDimension = "intelligence" | "speed" | "latency" | "price" | "context";

export const BRAND_COLORS = {
  blue: "#0047FF",
  blueHover: "#2966FF",
  blueLight: "#BEDBFF",
  blueTint: "#EBF2FF",
  navy: "#001E80",
  purple: "#0047FF", // Mapped to our signature Electric Blue
  purpleDark: "#0038CC",
  yellow: "#0284C7",
  yellowLight: "#38BDF8",
  orange: "#10B981", // Mapped to Emerald for Cost & ROI
  orangeLight: "#34D399",
  mint: "#6EE7B7",
  mintDark: "#10B981",
  plum: "#001E80", // Mapped to Deep Midnight Navy
  plumDark: "#000F40",
  blueLightSurface: "#F0F4F8",
  sky: "#0284C7",
  emerald: "#10B981",
  black: "#0A0A0A",
  offWhite: "#F8FAFC",
} as const;

export interface DimensionConfig {
  id: MetricDimension;
  label: string;
  unit: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}

export const DIMENSION_CONFIGS: Record<MetricDimension, DimensionConfig> = {
  intelligence: {
    id: "intelligence",
    label: "Intelligence",
    unit: "Index (0-100)",
    colorHex: "#0047FF", // Our signature Electric Blue
    bgClass: "bg-[#0047FF]",
    textClass: "text-[#0047FF]",
    borderClass: "border-[#0047FF]",
    description:
      "Composite benchmark evaluation across MMLU-Pro, GPQA Diamond, SWE-bench Verified and Arena Elo",
  },
  speed: {
    id: "speed",
    label: "Speed",
    unit: "Tokens / Sec",
    colorHex: "#0284C7", // High-velocity Sky
    bgClass: "bg-[#0284C7]",
    textClass: "text-[#0284C7]",
    borderClass: "border-[#0284C7]",
    description:
      "Median throughput generation rate in output tokens per second under standard prompt loads",
  },
  latency: {
    id: "latency",
    label: "Latency",
    unit: "Seconds (TTFT)",
    colorHex: "#006EFF",
    bgClass: "bg-[#006EFF]",
    textClass: "text-[#006EFF]",
    borderClass: "border-[#006EFF]",
    description: "Median time to first token in seconds measured from final input token",
  },
  price: {
    id: "price",
    label: "Cost per Task",
    unit: "$ USD",
    colorHex: "#10B981", // Emerald for financial expense efficiency
    bgClass: "bg-[#10B981]",
    textClass: "text-[#059669]",
    borderClass: "border-[#10B981]",
    description: "Blended cost per 1M tokens (3:1 input/output) and standardized task cost",
  },
  context: {
    id: "context",
    label: "Context Window",
    unit: "Tokens",
    colorHex: "#0047FF",
    bgClass: "bg-[#0047FF]",
    textClass: "text-[#0047FF]",
    borderClass: "border-[#0047FF]",
    description: "Maximum context window capacity supported by model architecture",
  },
};
