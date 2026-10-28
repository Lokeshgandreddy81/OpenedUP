export type ModeId = "chat" | "study" | "build";

export interface ModeContent {
  id: ModeId;
  label: string;
  title: string;
  description: string;
  bullets: string[];
}

export const modes: ModeContent[] = [
  {
    id: "chat",
    label: "Chat",
    title: "Think out loud.",
    description:
      "Ask anything and keep the thread moving. Switch models, compare answers, and bring files into the conversation without starting over.",
    bullets: [
      "Move between frontier and open-weight models mid-thread",
      "Keep chats, files, and sources in one context",
      "Check every answer against the source",
    ],
  },
  {
    id: "study",
    label: "Study",
    title: "Turn documents into understanding.",
    description:
      "Drop in a report, paper, or contract. Sara breaks it into chapters you can read, search, and question, with the original text always one click away.",
    bullets: [
      "Automatic chapters, summaries, and key passages",
      "Ask questions scoped to a single chapter",
      "Keep the source document as the reference",
    ],
  },
  {
    id: "build",
    label: "Build",
    title: "Go from idea to shipped.",
    description:
      "Hand Sara a goal and let agents plan, edit, test, and review the work. Follow each step, inspect the diff, and merge only what you trust.",
    bullets: [
      "Agents plan, edit, and run tests in your codebase",
      "Review every diff before it lands",
      "Trace each decision in the execution log",
    ],
  },
];

export type CapabilityId =
  | "chat"
  | "documents"
  | "audit"
  | "agents"
  | "benchmarks"
  | "plugins";

export interface CapabilityContent {
  id: CapabilityId;
  title: string;
  description: string;
}

export const capabilities: CapabilityContent[] = [
  {
    id: "chat",
    title: "Chat",
    description: "Compare models and keep threads, files, and sources in one context.",
  },
  {
    id: "documents",
    title: "Chapters",
    description: "Break long PDFs into searchable chapters linked to the source.",
  },
  {
    id: "audit",
    title: "Artifacts",
    description: "Reconcile receipts and review totals traced back to every file.",
  },
  {
    id: "agents",
    title: "Coding agents",
    description: "Plan, edit, test, and review codebase changes from one thread.",
  },
  {
    id: "benchmarks",
    title: "Benchmarks",
    description: "Compare models with live leaderboards and arena breakdowns.",
  },
  {
    id: "plugins",
    title: "Plugins & skills",
    description: "Connect your tools so Sara can act across your stack.",
  },
];

export type TrustCardId = "keys" | "files";

export interface TrustCardContent {
  id: TrustCardId;
  title: string;
  description: string;
  points: string[];
}

export const trustCards: TrustCardContent[] = [
  {
    id: "keys",
    title: "Your keys, your models",
    description:
      "Bring your own API keys. They stay encrypted at rest and are used only for your requests.",
    points: [
      "Encrypted before storage",
      "Never shared across workspaces",
      "Revoke or replace anytime",
    ],
  },
  {
    id: "files",
    title: "Your files stay yours",
    description:
      "Documents stay inside your workspace and are never used to train models.",
    points: [
      "Scoped to your workspace",
      "Never used for training",
      "Instant source deletion",
    ],
  },
];
