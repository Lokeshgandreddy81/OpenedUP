export const gettingStartedSteps = [
  {
    id: "install",
    number: "01",
    title: "Install",
    description: "Clone the repository and run npm ci.",
  },
  {
    id: "provider-key",
    number: "02",
    title: "Add a model key",
    description: "Save a key in Customize or send it with your API request.",
  },
  {
    id: "chat",
    number: "03",
    title: "Start a chat",
    description: "Open Chat or call POST /api/chat with a model and message.",
  },
  {
    id: "document",
    number: "04",
    title: "Add a document",
    description: "Upload a PDF or receipt to ask questions or review expenses.",
  },
];

export const docConcepts = [
  {
    id: "concept-chat",
    title: "Chat across models",
    description: "Keep a conversation going while switching providers and attaching files.",
  },
  {
    id: "concept-documents",
    title: "Ask questions about PDFs",
    description: "Split long PDFs into chapters and get answers with page citations.",
  },
  {
    id: "concept-audit",
    title: "Review spending",
    description: "Extract receipt details, compare expenses, and flag likely duplicates.",
  },
  {
    id: "concept-agents",
    title: "Use coding agents",
    description:
      "Let agents inspect and edit code in isolated containers, with skills for specialized tasks.",
  },
];

export const docProviders = ["Anthropic", "OpenAI", "Google Gemini", "DeepSeek"];

export const docApiEndpoints = [
  {
    method: "POST",
    path: "/api/chat",
    summary: "Multi-provider conversational chat",
  },
  {
    method: "POST",
    path: "/api/parse-pdf-chapters",
    summary: "Hierarchical PDF chapter segmentation",
  },
  {
    method: "POST",
    path: "/api/read-receipts",
    summary: "Batched multimodal receipt OCR",
  },
];

export const docEnvVars = [
  { name: "PORT", defaultValue: "3000" },
  { name: "BYOK_ENCRYPTION_KEY", defaultValue: "None" },
  { name: "SANDBOX_MODE", defaultValue: "docker" },
];

export const docFaqs = [
  {
    id: "faq-byok-model",
    question: "How do I connect a model provider?",
    answer:
      "Save your key in Customize or send it with x-provider-key. Saved keys are encrypted at rest and decrypted only for the request.",
  },
  {
    id: "faq-scanned-pdfs",
    question: "How are PDFs processed?",
    answer:
      "Text PDFs are parsed locally. Scanned pages use your selected vision model, with requests limited to eight pages at a time.",
  },
  {
    id: "faq-duplicate-logic",
    question: "How are duplicate expenses flagged?",
    answer:
      "Sara compares vendor, date, and amount details, then links likely duplicates to their source receipt.",
  },
];
