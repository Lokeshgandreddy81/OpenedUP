export type AiEngineerRoadmapStatus = "personal" | "alternative" | "optional";

export interface AiEngineerRoadmapNode {
  id: string;
  title: string;
  status?: AiEngineerRoadmapStatus;
  roadmapId?: string;
}

export interface AiEngineerRoadmapGroup {
  id: string;
  parent?: AiEngineerRoadmapNode;
  items: AiEngineerRoadmapNode[];
}

export interface AiEngineerRoadmapStage {
  id: string;
  node: AiEngineerRoadmapNode;
  left?: AiEngineerRoadmapGroup[];
  right?: AiEngineerRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AiEngineerRoadmapSection {
  id: string;
  title?: string;
  stages: AiEngineerRoadmapStage[];
}

export interface AiEngineerRoadmapLink {
  label: string;
  roadmapId: string;
}

export const AI_ENGINEER_MARKERS: Array<{
  status: AiEngineerRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const AI_ENGINEER_RELATED_ROADMAPS: AiEngineerRoadmapLink[] = [
  { label: "Vibe Coding", roadmapId: "skill-vibe-coding" },
  { label: "Claude Code", roadmapId: "skill-claude-code" },
  { label: "Prompt Engineering", roadmapId: "skill-prompt-engineering" },
  { label: "Inference Engineering", roadmapId: "inference-engineering" },
  { label: "Forward Deployed Engineer", roadmapId: "forward-deployed-engineer" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "Backend", roadmapId: "backend" },
  { label: "Full Stack", roadmapId: "full-stack" },
];

export const AI_ENGINEER_CONTINUE_LEARNING: AiEngineerRoadmapLink[] = [
  { label: "Forward Deployed Eng.", roadmapId: "forward-deployed-engineer" },
  { label: "Prompt Engineering", roadmapId: "skill-prompt-engineering" },
  { label: "Inference Engineering", roadmapId: "inference-engineering" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (title: string): AiEngineerRoadmapNode => ({
  id: slug(title),
  title,
});

const g = (
  items: AiEngineerRoadmapNode[],
  parent?: AiEngineerRoadmapNode
): AiEngineerRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AiEngineerRoadmapStage, "id" | "node"> = {}
): AiEngineerRoadmapStage => ({
  id: slug(title),
  node: n(title),
  ...options,
});

const INTRODUCTION: AiEngineerRoadmapSection = {
  id: "introduction",
  title: "Introduction",
  stages: [
    stage("Introduction", {
      right: [
        g([
          n("What is an AI Engineer?"),
          n("AI Engineer vs ML Engineer"),
          n("Impact on Product Development"),
          n("Roles and Responsiblities"),
        ]),
      ],
    }),
  ],
};

const WORKING_WITH_LLMS: AiEngineerRoadmapSection = {
  id: "working-with-llms",
  title: "Working With LLMs",
  stages: [
    stage("Prompt Engineering", {
      left: [
        g(
          [n("Tokens"), n("Context"), n("Repetition Penalties"), n("Sampling Parameters")],
          n("Core LLM Elements")
        ),
        g(
          [n("Anthropic Claude"), n("Google Gemini"), n("OpenAI (GPT, o-series)"), n("Meta Llama")],
          n("Prompt Anatomy")
        ),
        g([], n("Closed Models ")),
        g([], n("Open Source Models ")),
        g([], n("Platforms & Ecosystem")),
        g([], n("APIs & SDKs")),
      ],
      right: [
        g(
          [
            n("Large Language Model (LLM)"),
            n("Inference"),
            n("Training"),
            n("Vector DBs"),
            n("RAGs"),
            n("Prompt Engineering"),
            n("AI Agents"),
            n("AI vs AGI"),
            n("Pre-trained Models"),
            n("Fine-tuning"),
            n("Inference Engineering"),
            n("Embeddings"),
            n("Temperature"),
            n(" RAG & Dynamic Filters"),
            n("Context Compaction"),
            n("Context Isolation"),
            n("Context Window"),
            n("Context Engineering"),
          ],
          n("Common Terminology")
        ),
        g(
          [
            n("ReAct"),
            n("Top-K"),
            n("Top-P"),
            n("Input Format"),
            n("System Prompting"),
            n("Context"),
            n("Role & Behavior"),
            n("Constraints"),
            n("Structured Output"),
            n("Function Calling"),
            n("Prompt Caching"),
            n("Streaming Responses"),
            n("Context vs Prompt Eng."),
          ],
          n("Fundamentals")
        ),
      ],
    }),
    stage("How LLMs Work", {
      left: [g([n("Mistral"), n("Cohere")])],
      right: [
        g([
          n("Few-Shot"),
          n("Context Sources"),
          n("MCP"),
          n("Context Security"),
          n("What is a Context Layer?"),
        ]),
      ],
    }),
    stage("AI Safety and Ethics", {
      left: [
        g(
          [n("Prompt Injection Attacks"), n("DeepSeek"), n("Gemma"), n("Qwen")],
          n("Prompting Techniques")
        ),
      ],
      right: [g([n("CoT"), n("Zero-Shot"), n("Context Evaluation")], n("Context Eng. Techniques"))],
    }),
    stage("Context Engineering", {
      left: [g([n("Bias and Fairness"), n("Security and Privacy Concerns")])],
      right: [g([n("Memory Systems")])],
    }),
    stage("LM Studio", {
      left: [g([], n("Understanding AI Safety Issues")), g([], n("Model Interaction"))],
      right: [g([n("Closed vs Open Source Models")])],
    }),
  ],
};

const AI_MODELS: AiEngineerRoadmapSection = {
  id: "ai-models",
  title: "AI Models",
  stages: [
    stage("Type of Models", {
      left: [
        g(
          [
            n("Conducting adversarial testing"),
            n("Content Moderation APIs"),
            n("Adding end-user IDs in prompts"),
            n("Robust prompt engineering"),
            n("Know your Customers / Usecases"),
            n("Constraining outputs and inputs"),
            n("Self-Hosted Models"),
          ],
          n("Safety Best Practices")
        ),
      ],
      right: [
        g(
          [
            n("Hugging Face Hub"),
            n("Hugging Face Inference SDK"),
            n("Transformers.js"),
            n("Context Failure Modes"),
            n("modus"),
            n("DataHub"),
          ],
          n("Tools & Context Warehouses")
        ),
        g(
          [
            n("Hugging Face Tasks"),
            n("Multi-agent Context Sharing"),
            n("Long-Context Processing"),
            n("State & Historical Context"),
          ],
          n("Hugging Face")
        ),
      ],
    }),
    stage("What are Embeddings", {
      left: [g([n("Cohere"), n("Gemini Embedding")])],
      right: [g([n("OpenAI Response API"), n("PostHog"), n("Atlan")], n("Ollama"))],
    }),
    stage("Choosing the Right Model ", {
      left: [g([n("Open AI Embeddings API"), n("Sentence Transformers")])],
      right: [
        g([
          n("Google Gemini APi"),
          n("Semantic Search"),
          n("Recommendation Systems"),
          n("Anomaly Detection"),
          n("Data Classification"),
          n("RAG Usecases"),
          n("RAG vs Fine-tuning"),
        ]),
      ],
    }),
  ],
};

const USE_CASES_FOR_EMBEDDINGS: AiEngineerRoadmapSection = {
  id: "use-cases-for-embeddings",
  title: "Use Cases for Embeddings",
  stages: [],
};

const PROPRIETARY_MODELS: AiEngineerRoadmapSection = {
  id: "proprietary-models",
  title: "Proprietary Models",
  stages: [],
};

const OPEN_SOURCE_MODELS: AiEngineerRoadmapSection = {
  id: "open-source-models",
  title: "Open Source Models",
  stages: [],
};

const EMBEDDINGS_VECTOR_DATABASES: AiEngineerRoadmapSection = {
  id: "embeddings-vector-databases",
  title: "Embeddings & Vector Databases",
  stages: [
    stage("What are RAGs?", {
      left: [
        g([n("Jina"), n("Models on Hugging Face")], n("Vector Databases")),
        g([n("Purpose and Functionality")], n("OpenRouter")),
        g([n("Chroma"), n("Pinecone")], n("Popular Vector DBs (pick one)")),
      ],
      right: [
        g([n("Chunking"), n("Embedding"), n("Vector Database")], n("Implementing RAG")),
        g(
          [n("Retrieval Process"), n("Generation"), n("Tools & Function Calling")],
          n("Ways of Implementing RAG")
        ),
      ],
    }),
    stage("Embedding Models", {
      left: [
        g([
          n("Weaviate"),
          n("FAISS"),
          n("LanceDB"),
          n("Qdrant"),
          n("Supabase"),
          n("MongoDB Atlas"),
          n("Agents Usecases"),
          n("ReAct Prompting"),
          n("Claude Messages API"),
          n("OpenAI-compatible APIs"),
        ]),
      ],
      right: [
        g(
          [
            n("Using SDKs Directly"),
            n("Langchain"),
            n("Llama Index"),
            n("Manual Implementation"),
            n("Haystack"),
            n("RAGFlow"),
            n("MCP Host"),
            n("MCP Client"),
            n("Data Layer"),
            n("Transport Layer"),
          ],
          n("Building AI Agents")
        ),
        g([], n("Core Components")),
      ],
    }),
    stage("AI Agents", {
      left: [
        g(
          [n("Indexing Embeddings"), n("Performing Similarity Search")],
          n("Implementing Vector Search")
        ),
      ],
      right: [
        g([
          n("OpenAI AgentKit & Agent SDK"),
          n("Claude Agent SDK"),
          n("MCP Server"),
          n("Building an MCP Server"),
          n("Building an MCP Client"),
          n("Connect to Local Server"),
          n("Connect to Remote Server"),
          n("Vertex AI Agent Builder"),
          n("Google ADK"),
        ]),
      ],
    }),
    stage("Model Context Protocol (MCP)"),
    stage("Multimodal AI", {
      left: [g([n("Multimodal AI Usecases"), n("Image Understanding")])],
      right: [g([n("OpenAI Vision API"), n("DALL-E API")])],
    }),
  ],
};

const RAGS: AiEngineerRoadmapSection = {
  id: "rags",
  title: "RAGs",
  stages: [
    stage("Development Tools", {
      left: [
        g(
          [
            n("Image Generation"),
            n("Video Understanding"),
            n("Audio Processing"),
            n("Text-to-Speech"),
            n("Speech-to-Text"),
            n("Multi-agents"),
          ],
          n("Multimodal AI Tasks")
        ),
      ],
      right: [
        g(
          [
            n("Whisper API"),
            n("Hugging Face Models"),
            n("LangChain for Multimodal Apps"),
            n("LlamaIndex for Multimodal Apps"),
          ],
          n("Implementing Multimodal AI")
        ),
      ],
    }),
  ],
};

const AI_AGENTS: AiEngineerRoadmapSection = {
  id: "ai-agents",
  title: "AI Agents",
  stages: [],
};

const AI_SAFETY_AND_ETHICS: AiEngineerRoadmapSection = {
  id: "ai-safety-and-ethics",
  title: "AI Safety and Ethics",
  stages: [],
};

const EVALUATION_OBSERVABIITY: AiEngineerRoadmapSection = {
  id: "evaluation-observabiity",
  title: "Evaluation & Observabiity",
  stages: [
    stage("LLM Observability", {
      right: [
        g([n("Tracing & logging"), n("Cost/latency monitoring"), n("Production monitoring")]),
      ],
    }),
    stage("LLM Evaluations", {
      left: [g([n("Deterministic Evals")], n("Evaluation Types"))],
      right: [
        g([n("LangSmith"), n("Langfuse"), n("Helicone"), n("Arize AI")], n("Observability Tools")),
      ],
    }),
    stage("Regression Testing", {
      left: [
        g(
          [n("Claude Code"), n("Gemini"), n("Codex"), n("OpenCode"), n("Cursor"), n("Replit")],
          n("AI Assisted Coding Tools")
        ),
        g(
          [
            n("Model-Based Evals"),
            n("Human Evals"),
            n("Evaluation Metrics"),
            n("DeepEval"),
            n("RAGAS"),
          ],
          n("Evaluation Tools")
        ),
      ],
      right: [g([n("NanoBanana API")])],
    }),
  ],
};

const OTHER_AI_APPLICATIONS: AiEngineerRoadmapSection = {
  id: "other-ai-applications",
  title: "Other AI Applications",
  stages: [],
};

export const AI_ENGINEER_SECTIONS: AiEngineerRoadmapSection[] = [
  INTRODUCTION,
  WORKING_WITH_LLMS,
  AI_MODELS,
  USE_CASES_FOR_EMBEDDINGS,
  PROPRIETARY_MODELS,
  OPEN_SOURCE_MODELS,
  EMBEDDINGS_VECTOR_DATABASES,
  RAGS,
  AI_AGENTS,
  AI_SAFETY_AND_ETHICS,
  EVALUATION_OBSERVABIITY,
  OTHER_AI_APPLICATIONS,
];
