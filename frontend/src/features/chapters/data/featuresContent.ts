export type CapabilityId = "chat" | "documents" | "audit" | "agents" | "benchmarks" | "plugins";

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
    description: "Documents stay inside your workspace and are never used to train models.",
    points: ["Scoped to your workspace", "Never used for training", "Instant source deletion"],
  },
];
