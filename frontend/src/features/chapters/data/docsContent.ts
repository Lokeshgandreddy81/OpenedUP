export interface DocStep {
  id: string;
  number: string;
  title: string;
  description: string;
  details?: string;
}

export interface CodeSnippet {
  language: "bash" | "typescript" | "python" | "json";
  label: string;
  code: string;
  description?: string;
}

export interface QuickstartTab {
  id: string;
  label: string;
  badge?: string;
  description: string;
  request: CodeSnippet;
  response: CodeSnippet;
}

export const gettingStartedSteps: DocStep[] = [
  {
    id: "step-prerequisites",
    number: "01",
    title: "Install",
    description: "Clone the repository and run npm ci.",
  },
  {
    id: "step-keys",
    number: "02",
    title: "Add a model key",
    description: "Save a key in Customize or send it with your API request.",
  },
  {
    id: "step-first-request",
    number: "03",
    title: "Start a chat",
    description: "Open Chat or call POST /api/chat with a model and message.",
  },
  {
    id: "step-spend-audit",
    number: "04",
    title: "Add a document",
    description: "Upload a PDF or receipt to ask questions or review expenses.",
  },
];

export const quickstartExamples: Record<string, QuickstartTab[]> = {
  chat: [
    {
      id: "curl",
      label: "cURL",
      badge: "REST",
      description: "Send a conversational query to /api/chat with a user-supplied BYOK header.",
      request: {
        language: "bash",
        label: "cURL Request",
        code: `curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -H "x-provider-key: sk-ant-api03-..." \\
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "effort": "Medium",
    "messages": [
      {
        "role": "user",
        "content": "Compare the Q3 financial results against chapter 4 risk factors."
      }
    ]
  }'`,
      },
      response: {
        language: "json",
        label: "HTTP 200 Response",
        code: `{
  "message": {
    "role": "assistant",
    "content": "Based on chapter 4 risk disclosures, Q3 financial performance exceeded margin guidance by 4.2%, though supply chain exposure remains elevated in the APAC region."
  },
  "model": "claude-3-7-sonnet-20250219",
  "provider": "anthropic",
  "usage": {
    "promptTokens": 1420,
    "completionTokens": 38
  }
}`,
      },
    },
    {
      id: "typescript",
      label: "TypeScript",
      badge: "Node.js",
      description: "Strictly-typed chat client using native Fetch and @charan-interiors/contracts schemas.",
      request: {
        language: "typescript",
        label: "client.ts",
        code: `import type { ChatRequest, ChatResponse } from "@charan-interiors/contracts";

async function runChatQuery(): Promise<ChatResponse> {
  const payload: ChatRequest = {
    model: "claude-3-7-sonnet-20250219",
    effort: "High",
    messages: [
      {
        role: "user",
        content: "Analyze discrepancies between the invoice and approved statement."
      }
    ]
  };

  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-provider-key": process.env.ANTHROPIC_API_KEY!
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(\`Chat dispatch failed with status \${response.status}\`);
  }

  return response.json();
}`,
      },
      response: {
        language: "json",
        label: "Parsed Output",
        code: `{
  "message": {
    "role": "assistant",
    "content": "Reconciliation identified 2 variance items: Invoice #1042 carries an unapproved $420 handling surcharge not reflected on statement lines."
  }
}`,
      },
    },
    {
      id: "python",
      label: "Python",
      badge: "3.9+",
      description: "Python client interacting with the Sara document intelligence gateway.",
      request: {
        language: "python",
        label: "query.py",
        code: `import os
import requests

def dispatch_chat():
    endpoint = "http://localhost:3000/api/chat"
    headers = {
        "Content-Type": "application/json",
        "x-provider-key": os.environ["GEMINI_API_KEY"]
    }
    payload = {
        "model": "gemini-2.5-pro",
        "effort": "Medium",
        "messages": [
            {"role": "user", "content": "Summarize key commitments from the supplier contract."}
        ]
    }
    response = requests.post(endpoint, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    return response.json()

print(dispatch_chat()["message"]["content"])`,
      },
      response: {
        language: "json",
        label: "Response",
        code: `{
  "message": {
    "role": "assistant",
    "content": "Summary of Supplier Commitments:\\n1. SLA guarantee of 99.95% uptime.\\n2. Net-30 payment terms.\\n3. 14-day defect remedy period."
  }
}`,
      },
    },
    {
      id: "docker",
      label: "Docker CLI",
      badge: "Containers",
      description: "Spin up the complete multi-container stack with Compose.",
      request: {
        language: "bash",
        label: "Terminal",
        code: `# 1. Configure environment encryption key
cp .env.example .env
export BYOK_ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "BYOK_ENCRYPTION_KEY=\${BYOK_ENCRYPTION_KEY}" >> .env

# 2. Build and launch services
docker compose up --build -d

# 3. Verify health probe
curl -s http://localhost:8080/healthz | jq`,
      },
      response: {
        language: "json",
        label: "Health Output",
        code: `{
  "status": "ok",
  "uptime": 4.12,
  "timestamp": "2026-10-28T10:25:30.000Z"
}`,
      },
    },
  ],
  chapters: [
    {
      id: "chapters-curl",
      label: "cURL",
      badge: "PDF Segmentation",
      description: "Segment a PDF document into hierarchical chapters with automated page gap repair.",
      request: {
        language: "bash",
        label: "cURL Request",
        code: `curl -X POST http://localhost:3000/api/parse-pdf-chapters \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileName": "annual_financial_report.pdf",
    "mimeType": "application/pdf",
    "model": "gemini-2.5-flash",
    "base64Data": "JVBERi0xLjQKJcfs..."
  }'`,
      },
      response: {
        language: "json",
        label: "HTTP 200 Result",
        code: `{
  "documentTitle": "Annual Financial Report FY25",
  "totalPages": 84,
  "chapters": [
    {
      "id": "chap-1",
      "chapterNumber": 1,
      "title": "Executive Summary & Revenue Breakdown",
      "startPage": 1,
      "endPage": 12,
      "summary": "Covers consolidated gross billings, ARR growth of 34%, and geographic revenue distribution.",
      "keyTopics": ["ARR", "Gross Billings", "Segment Margin"]
    },
    {
      "id": "chap-2",
      "chapterNumber": 2,
      "title": "Operating Expenses & Spend Ledger",
      "startPage": 13,
      "endPage": 29,
      "summary": "Detailed line-item audit of cloud infrastructure, personnel, and contractor disbursements.",
      "keyTopics": ["OpEx", "Cloud Infrastructure", "Vendor Reconciliation"]
    }
  ]
}`,
      },
    },
  ],
};

export interface DocConcept {
  id: string;
  tag: string;
  title: string;
  badge: string;
  description: string;
  architectureNote: string;
  points: string[];
  endpoint?: string;
  proTip?: string;
}

export const docConcepts: DocConcept[] = [
  {
    id: "concept-chat",
    tag: "chat",
    title: "Chat across models",
    badge: "Core Workflow",
    description: "Keep a conversation going while switching providers and attaching files.",
    architectureNote:
      "Maintains thread state and project file attachments in decoupled storage while routing individual model inferences through the runtime-neutral BYOK provider dispatcher.",
    points: [
      "Hot-swap models mid-conversation (e.g. Claude 3.7 to DeepSeek-R1) without context reset.",
      "Streaming SSE responses with structured thinking/responding phase separation.",
      "Multi-modal attachment grounding: attach spreadsheets, PDFs, or photos into active context.",
    ],
    endpoint: "POST /api/chat",
    proTip: "Use the 'effort' parameter (Low, Medium, High, Max) to tune reasoning token budget on thinking models like Claude 3.7 and DeepSeek R1.",
  },
  {
    id: "concept-documents",
    tag: "documents",
    title: "Ask questions about PDFs",
    badge: "Patent-Pending Ingestion",
    description: "Split long PDFs into chapters and get answers with page citations.",
    architectureNote:
      "Local Python PyMuPDF engine extracts searchable text streams; if scanned, routes up to 8 rendered pages per request to vision models with zero-dependency pure JS pdf-lib fallback.",
    points: [
      "Automated chapter boundary detection with heading hierarchy normalization.",
      "Scoped question-answering constrained strictly to selected chapter evidence IDs.",
      "Zero hallucinations: answer syntheses cite exact page indices and verified evidence spans.",
    ],
    endpoint: "POST /api/parse-pdf-chapters",
    proTip: "Searchable PDFs are processed locally on your server/worker with zero external token expenditure.",
  },
  {
    id: "concept-audit",
    tag: "audit",
    title: "Review spending",
    badge: "Financial Engine",
    description: "Extract receipt details, compare expenses, and flag likely duplicates.",
    architectureNote:
      "Batched vision OCR processes up to 10 photos / 50MB per request. Duplicate detection executes fuzzy merchant-amount-date heuristic clustering with explanation traces.",
    points: [
      "Multi-photo vision OCR with currency, tax, date, and vendor normalization.",
      "Algorithmic duplicate detection linking suspicious expenses to original submission IDs.",
      "Every cell and chart element in the Treemap Ledger hyperlinks to source receipt images.",
    ],
    endpoint: "POST /api/read-receipts & /api/check-duplicates",
    proTip: "The audit ledger flags duplicate submissions across disparate formats (e.g., PDF receipt matching a paper smartphone photo).",
  },
  {
    id: "concept-agents",
    tag: "agents",
    title: "Use coding agents",
    badge: "Isolated Execution",
    description: "Let agents inspect and edit code in isolated containers, with skills for specialized tasks.",
    architectureNote:
      "Runs Docker containers per conversation with non-root UID 1000:1000, read-only root filesystems, --network none, and strict 60-second execution timeouts.",
    points: [
      "Read, write, edit, and bash tool harnesses with surgical diff generation.",
      "Complete execution audit logs recording command inputs, stdout, stderr, and exit codes.",
      "Dev fallback (unsafe-local) guarded by environment assertions and host credential stripping.",
    ],
    endpoint: "POST /api/chat (with skillIds)",
    proTip: "Agents execute within /work scratch mounts; changes only commit to version control when you approve them.",
  },
  {
    id: "concept-skills",
    tag: "skills",
    title: "3-Tier Progressive Skills Runtime",
    badge: "Context Efficiency",
    description:
      "Modular skill plugins that equip language models with domain capabilities, scripts, and harnesses without bloating baseline system prompts.",
    architectureNote:
      "Implements a 3-tier loading model: Level 1 (XML metadata ~30 tokens), Level 2 (on-demand SKILL.md instruction retrieval), Level 3 (isolated sandboxed execution).",
    points: [
      "Level 1: System prompt receives minimal XML catalog metadata (<available_skills>).",
      "Level 2: The model invokes the Skill tool to fetch full instructions only when triggered.",
      "Level 3: Bash, Read, and Write tools execute template scripts under /mnt/skills/:ro.",
    ],
    endpoint: "GET /api/chat/skills",
    proTip: "Explicitly selecting a skill in the chat composer pre-loads instructions on Turn 0 without model deliberation.",
  },
  {
    id: "concept-benchmarks",
    tag: "benchmarks",
    title: "Live Model Intelligence Benchmarks & Image Arena",
    badge: "Observability",
    description:
      "Real-time benchmark leaderboards tracking reasoning, code generation, instruction following, and multimodal image evaluation across frontier models.",
    architectureNote:
      "Aggregates hourly leaderboard telemetry, provider capability matrices, and pairwise Elo battle scores stored in cached JSON endpoints.",
    points: [
      "Live Elo leaderboard across Anthropic, OpenAI, Google, DeepSeek, and open-weights.",
      "Sub-category breakdowns: math reasoning, coding benchmarks, and multimodal OCR accuracy.",
      "Pairwise blind image arena ratings with side-by-side prompt comparisons.",
    ],
    endpoint: "GET /api/benchmarks",
  },
  {
    id: "concept-roadmaps",
    tag: "roadmaps",
    title: "Interactive 2D Topology Roadmaps & Learning Trees",
    badge: "Visualization",
    description:
      "Interactive 2D directed acyclic graph (DAG) topology canvas for developer learning paths, career trees, and system engineering milestones.",
    architectureNote:
      "Rendered via @xyflow/react and Dagre graph layout algorithms with local state persistence and topic completion checkoffs.",
    points: [
      "Curated engineering roadmaps: AI Engineer, DevSecOps, System Design, Cloudflare, etc.",
      "Interactive pan/zoom canvas with collapsible topic clusters and resource drawers.",
      "Track completed milestones with browser and account-synced persistence.",
    ],
    endpoint: "Route /roadmap",
  },
];

export interface DocProvider {
  id: string;
  name: string;
  logo: string;
  models: string[];
  capabilities: {
    chat: boolean;
    streaming: boolean;
    vision: boolean;
    tools: boolean;
    reasoning: boolean;
  };
  authType: "Bearer" | "API-Key" | "Header";
  headerName: string;
  keyFormat: string;
  status: "Verified" | "Supported" | "Experimental";
}

export const docProviders: DocProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    logo: "Anthropic",
    models: ["claude-3-7-sonnet-20250219", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    capabilities: { chat: true, streaming: true, vision: true, tools: true, reasoning: true },
    authType: "Header",
    headerName: "x-api-key / x-provider-key",
    keyFormat: "sk-ant-api03-...",
    status: "Verified",
  },
  {
    id: "openai",
    name: "OpenAI",
    logo: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
    capabilities: { chat: true, streaming: true, vision: true, tools: true, reasoning: true },
    authType: "Bearer",
    headerName: "Authorization: Bearer / x-provider-key",
    keyFormat: "sk-proj-...",
    status: "Verified",
  },
  {
    id: "google",
    name: "Google Gemini",
    logo: "Google",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-exp"],
    capabilities: { chat: true, streaming: true, vision: true, tools: true, reasoning: true },
    authType: "API-Key",
    headerName: "x-goog-api-key / x-provider-key",
    keyFormat: "AIzaSy...",
    status: "Verified",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    logo: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner (R1)"],
    capabilities: { chat: true, streaming: true, vision: false, tools: true, reasoning: true },
    authType: "Bearer",
    headerName: "Authorization: Bearer / x-provider-key",
    keyFormat: "sk-...",
    status: "Verified",
  },
  {
    id: "kimi",
    name: "Moonshot Kimi",
    logo: "Moonshot",
    models: ["moonshot-v1-128k", "kimi-k1.5-preview"],
    capabilities: { chat: true, streaming: true, vision: true, tools: true, reasoning: true },
    authType: "Bearer",
    headerName: "Authorization: Bearer / x-provider-key",
    keyFormat: "sk-...",
    status: "Supported",
  },
  {
    id: "qwen",
    name: "Alibaba Qwen",
    logo: "Alibaba",
    models: ["qwen-2.5-72b-instruct", "qwen-2.5-coder-32b"],
    capabilities: { chat: true, streaming: true, vision: true, tools: true, reasoning: true },
    authType: "Bearer",
    headerName: "Authorization: Bearer / x-provider-key",
    keyFormat: "sk-...",
    status: "Supported",
  },
  {
    id: "xai",
    name: "xAI Grok",
    logo: "xAI",
    models: ["grok-2-1212", "grok-2-vision-1212"],
    capabilities: { chat: true, streaming: true, vision: true, tools: true, reasoning: false },
    authType: "Bearer",
    headerName: "Authorization: Bearer / x-provider-key",
    keyFormat: "xai-...",
    status: "Supported",
  },
  {
    id: "custom",
    name: "Custom / OpenAI-Compatible",
    logo: "Ollama",
    models: ["Local Ollama", "vLLM", "OpenRouter", "LM Studio"],
    capabilities: { chat: true, streaming: true, vision: true, tools: true, reasoning: true },
    authType: "Bearer",
    headerName: "x-provider-base-url & x-provider-key",
    keyFormat: "http://localhost:11434/v1",
    status: "Verified",
  },
];

export interface DocApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  description: string;
  authRequired: boolean;
  category: "Chat & QA" | "Documents & Receipts" | "Platform & Health" | "State & Sync";
  requestFields?: { name: string; type: string; required: boolean; description: string }[];
  responseCode: number;
}

export const docApiEndpoints: DocApiEndpoint[] = [
  {
    method: "POST",
    path: "/api/chat",
    summary: "Multi-provider conversational chat",
    description: "Dispatches a conversation turn to the configured BYOK provider model with optional context files, docTitle, and skillIds.",
    authRequired: true,
    category: "Chat & QA",
    requestFields: [
      { name: "messages", type: "ChatMessage[]", required: true, description: "Array of role (user/assistant) and content objects." },
      { name: "model", type: "string", required: true, description: "Canonical model ID (e.g. claude-3-7-sonnet-20250219)." },
      { name: "effort", type: "Low | Medium | High", required: false, description: "Reasoning token budget level for thinking models." },
      { name: "context", type: "ChatContext", required: false, description: "Attached project files, docTitle, or chapter references." },
      { name: "skillIds", type: "string[]", required: false, description: "Enabled skills (max 3 per request)." },
    ],
    responseCode: 200,
  },
  {
    method: "POST",
    path: "/api/chat/stream",
    summary: "Streaming multi-provider chat (SSE)",
    description: "Streams model tokens, thoughts, and completions via Server-Sent Events with heartbeat keepalive.",
    authRequired: true,
    category: "Chat & QA",
    responseCode: 200,
  },
  {
    method: "POST",
    path: "/api/chat/chapter/stream",
    summary: "Scoped PDF chapter question streaming",
    description: "Constrains question answering to verified evidence IDs inside the selected PDF chapter bounds, returning grounded citations.",
    authRequired: true,
    category: "Chat & QA",
    requestFields: [
      { name: "chapterId", type: "string", required: true, description: "Unique ID of the active document chapter." },
      { name: "chapterTitle", type: "string", required: true, description: "Human-readable chapter title." },
      { name: "startPage", type: "number", required: true, description: "1-indexed start page." },
      { name: "endPage", type: "number", required: true, description: "1-indexed end page." },
      { name: "evidence", type: "EvidenceChunk[]", required: true, description: "Array of id, pageNumber, and text snippets (max 8)." },
      { name: "question", type: "string", required: true, description: "User's analytical question." },
    ],
    responseCode: 200,
  },
  {
    method: "POST",
    path: "/api/parse-pdf-chapters",
    summary: "Hierarchical PDF chapter segmentation",
    description: "Parses PDF document structure into logical chapters with summaries and key topics using local PyMuPDF extraction.",
    authRequired: false,
    category: "Documents & Receipts",
    requestFields: [
      { name: "base64Data", type: "string", required: true, description: "Base64-encoded PDF binary buffer." },
      { name: "fileName", type: "string", required: true, description: "Document filename." },
      { name: "model", type: "string", required: true, description: "Verified image/OCR model for scanned fallback pages." },
    ],
    responseCode: 200,
  },
  {
    method: "POST",
    path: "/api/read-receipts",
    summary: "Batched multimodal receipt OCR",
    description: "Extracts normalized line-item totals, currencies, tax, and vendors from photos (max 10 photos / 50MB per request).",
    authRequired: true,
    category: "Documents & Receipts",
    requestFields: [
      { name: "photos", type: "PhotoPayload[]", required: true, description: "Array of globalIndex, mimeType, and base64Data." },
      { name: "model", type: "string", required: true, description: "Vision-capable model ID." },
    ],
    responseCode: 200,
  },
  {
    method: "POST",
    path: "/api/check-duplicates",
    summary: "Receipt duplicate reconciliation",
    description: "Cross-checks candidate receipts against known submissions to flag likely duplicates with confidence scores and explanation traces.",
    authRequired: true,
    category: "Documents & Receipts",
    requestFields: [
      { name: "rows", type: "ReceiptRow[]", required: true, description: "Candidate receipt rows to evaluate." },
      { name: "model", type: "string", required: true, description: "Catalog chat model ID for evaluation." },
    ],
    responseCode: 200,
  },
  {
    method: "GET",
    path: "/healthz",
    summary: "Liveness probe",
    description: "Returns HTTP 200 and process uptime when the API gateway server is responsive.",
    authRequired: false,
    category: "Platform & Health",
    responseCode: 200,
  },
  {
    method: "GET",
    path: "/readyz",
    summary: "Readiness probe",
    description: "Returns HTTP 200 when internal dependencies, Firebase config, and encryption services are ready.",
    authRequired: false,
    category: "Platform & Health",
    responseCode: 200,
  },
  {
    method: "GET",
    path: "/api/benchmarks",
    summary: "Model intelligence telemetry",
    description: "Returns cached benchmark scores, capability matrices, and Elo ratings for frontier LLMs.",
    authRequired: false,
    category: "Platform & Health",
    responseCode: 200,
  },
  {
    method: "GET",
    path: "/api/scheduled-tasks",
    summary: "List autonomous background schedules",
    description: "Returns active schedules with server-calculated next run times.",
    authRequired: false,
    category: "State & Sync",
    responseCode: 200,
  },
];

export interface DocEnvVar {
  name: string;
  category: "Core Server" | "Auth & BYOK" | "Sandbox Isolation" | "Rate Limits & Quotas";
  required: "Required" | "Optional" | "Recommended" | "Required for saved keys";
  defaultValue?: string;
  description: string;
}

export const docEnvVars: DocEnvVar[] = [
  {
    name: "PORT",
    category: "Core Server",
    required: "Optional",
    defaultValue: "3000",
    description: "HTTP port on which the Express gateway listens.",
  },
  {
    name: "NODE_ENV",
    category: "Core Server",
    required: "Recommended",
    defaultValue: "development",
    description: "Runtime environment mode ('development', 'test', 'production'). Production strictly blocks dev auth fallbacks and unsafe-local sandboxes.",
  },
  {
    name: "FIREBASE_PROJECT_ID",
    category: "Auth & BYOK",
    required: "Optional",
    defaultValue: "openedup-dev",
    description: "Firebase project ID used to verify Firebase ID bearer tokens and bind credential vaults to authenticated user accounts.",
  },
  {
    name: "BYOK_ENCRYPTION_KEY",
    category: "Auth & BYOK",
    required: "Required for saved keys",
    defaultValue: "None",
    description: "Base64-encoded 32-byte cryptographic secret used for AES-256-GCM encryption of stored provider keys at rest.",
  },
  {
    name: "SANDBOX_MODE",
    category: "Sandbox Isolation",
    required: "Optional",
    defaultValue: "docker",
    description: "Runner engine for coding agent tools: 'docker' (hardened production default) or 'unsafe-local' (strictly restricted to dev/test).",
  },
  {
    name: "SANDBOX_IMAGE",
    category: "Sandbox Isolation",
    required: "Optional",
    defaultValue: "openedup-sandbox:latest",
    description: "Hardened Docker base image containing bash, python3, git, and developer tool chains for agent execution.",
  },
  {
    name: "SKILL_UPLOADS_PER_HOUR",
    category: "Rate Limits & Quotas",
    required: "Optional",
    defaultValue: "30",
    description: "Maximum allowable skill package archive uploads per hour per user/IP address.",
  },
  {
    name: "BASH_CALLS_PER_CONV_PER_MIN",
    category: "Rate Limits & Quotas",
    required: "Optional",
    defaultValue: "30",
    description: "Maximum rate of sandboxed Bash tool executions per conversation per minute.",
  },
  {
    name: "USER_DAILY_SANDBOX_CPU_SECONDS",
    category: "Rate Limits & Quotas",
    required: "Optional",
    defaultValue: "300",
    description: "Cumulative daily quota of sandbox CPU-seconds allocated to a user before throttling.",
  },
];

export interface DocFaq {
  id: string;
  category: "Keys & BYOK" | "Documents & OCR" | "Sandbox & Security" | "Spend & Receipts" | "Troubleshooting";
  question: string;
  answer: string;
  tip?: string;
}

export const docFaqs: DocFaq[] = [
  {
    id: "faq-byok-model",
    category: "Keys & BYOK",
    question: "How do I connect a model provider?",
    answer:
      "Save your key in Customize or send it with x-provider-key. Saved keys are encrypted at rest and decrypted only for the request.",
    tip: "Local Ollama or vLLM instances can be added as a custom provider.",
  },
  {
    id: "faq-privacy-training",
    category: "Keys & BYOK",
    question: "Is my proprietary data or uploaded document content used to train AI models?",
    answer:
      "Never. All document parsing, chapter segmentation, and data indexing occurs locally within your server or browser. Requests sent to frontier LLMs via your own API keys are governed by your direct enterprise API agreements with Anthropic, OpenAI, or Google—which standardly contract that enterprise API data is never used to train foundational models.",
  },
  {
    id: "faq-scanned-pdfs",
    category: "Documents & OCR",
    question: "How are PDFs processed?",
    answer:
      "Text PDFs are parsed locally. Scanned pages use your selected vision model, with requests limited to eight pages at a time.",
    tip: "Install PyMuPDF for local PDF parsing.",
  },
  {
    id: "faq-duplicate-logic",
    category: "Spend & Receipts",
    question: "How are duplicate expenses flagged?",
    answer:
      "Sara compares vendor, date, and amount details, then links likely duplicates to their source receipt.",
  },
  {
    id: "faq-sandbox-isolation",
    category: "Sandbox & Security",
    question: "How are coding agents kept secure during automated tool execution?",
    answer:
      "Agent tools (Bash, Read, Write) run inside ephemeral Docker containers configured with --network none, --read-only root filesystem, non-root user UID 1000:1000, 512MB RAM cap, 1.0 CPU limit, and a strict 60-second execution timeout. Skills are mounted as read-only volumes at /mnt/skills/:ro, and agent writes are isolated to a transient /work scratch directory.",
  },
  {
    id: "faq-err-401",
    category: "Troubleshooting",
    question: "Why am I seeing 'Error 401: No credential configured for provider'?",
    answer:
      "This indicates that the chosen chat or vision model requires a valid API key that has not yet been saved in Customize or supplied in the 'x-provider-key' request header. Open the Customize drawer, paste your API key for the corresponding provider, and click Save.",
  },
  {
    id: "faq-docker-permissions",
    category: "Troubleshooting",
    question: "How do I fix Docker socket permission errors when running sandbox agents?",
    answer:
      "Ensure your host user belongs to the 'docker' user group (e.g., 'sudo usermod -aG docker $USER') or that your Docker Desktop daemon is running with permissions to mount /var/run/docker.sock into the backend container.",
  },
];

export interface DocReference {
  id: string;
  label: string;
  description: string;
  badge: string;
  href: string;
}

export const docReferences: DocReference[] = [
  {
    id: "openapi",
    label: "OpenAPI 3.1.0 Specification",
    description: "Full machine-readable HTTP API contract for chat, PDF segmentation, spend audit, and health probes.",
    badge: "Contract",
    href: "https://github.com/Lokeshgandreddy81/OpenedUP/blob/main/packages/docs/api/openapi.yaml",
  },
  {
    id: "architecture",
    label: "Architecture Boundaries & Guidelines",
    description: "Monorepo layout, domain separation, strict TypeScript contracts, and cross-boundary import rules.",
    badge: "Design",
    href: "https://github.com/Lokeshgandreddy81/OpenedUP/blob/main/packages/docs/ARCHITECTURE.md",
  },
  {
    id: "byok-catalog",
    label: "BYOK Catalog & Adapter Guide",
    description: "Model provenance, rate limits, multimodal vision support, and provider dispatcher specifications.",
    badge: "Specification",
    href: "https://github.com/Lokeshgandreddy81/OpenedUP/blob/main/specs/byok-catalog-adapters/README.md",
  },
  {
    id: "github",
    label: "GitHub Repository",
    description: "Official OpenedUP source code repository, releases, issue tracker, and discussions.",
    badge: "Source Code",
    href: "https://github.com/Lokeshgandreddy81/OpenedUP",
  },
];
