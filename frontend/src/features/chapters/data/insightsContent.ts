import type { LucideIcon } from "lucide-react";
import { BookOpen, Network, RefreshCcw, Youtube } from "lucide-react";

export interface InsightCapability {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const insightCapabilities: InsightCapability[] = [
  {
    id: "pdf",
    title: "PDF by module and subject",
    description:
      "Every reading was mapped to its exact module and subject, so the right document was one selection away instead of buried in a shared drive.",
    icon: BookOpen,
  },
  {
    id: "video",
    title: "Smart YouTube integration",
    description:
      "Each topic pulled in a relevant lecture beside the reading, giving a second explanation without opening another tab.",
    icon: Youtube,
  },
  {
    id: "branch",
    title: "Branch-specific content",
    description:
      "The library was organised by branch, so students saw their own syllabus rather than a generic catalogue.",
    icon: Network,
  },
  {
    id: "speed",
    title: "Real-time response",
    description:
      "A Flask and AJAX pipeline returned curated material instantly — no page reload, no spinner, no waiting between choices.",
    icon: RefreshCcw,
  },
];

export interface InsightMetric {
  id: string;
  value: string;
  label: string;
  detail: string;
}

export const insightMetrics: InsightMetric[] = [
  {
    id: "requests",
    value: "5,500+",
    label: "Resource requests",
    detail: "Times students accessed Sara v1",
  },
  {
    id: "users",
    value: "1,200+",
    label: "Unique users",
    detail: "Distinct accounts detected",
  },
  {
    id: "networks",
    value: "1,700+",
    label: "Unique networks",
    detail: "IP addresses that reached Sara",
  },
  {
    id: "peak",
    value: "556",
    label: "Peak interactions",
    detail: "Single day — 21 April 2023",
  },
  {
    id: "session",
    value: "3m 20s",
    label: "Average session",
    detail: "Time spent per visit",
  },
  {
    id: "retention",
    value: "62%",
    label: "Daily active users",
    detail: "Sustained for two weeks",
  },
];

export interface WorkflowStep {
  id: string;
  label: string;
  value: string;
  description: string;
}

export const workflowSteps: WorkflowStep[] = [
  {
    id: "branch",
    label: "Branch",
    value: "Computer Science",
    description: "Pick the branch you study in.",
  },
  {
    id: "subject",
    label: "Subject",
    value: "Data Structures",
    description: "Choose the subject for the semester.",
  },
  {
    id: "mode",
    label: "Learning mode",
    value: "Read a PDF",
    description: "Read a document or watch a lecture.",
  },
  {
    id: "module",
    label: "Module",
    value: "Module 3",
    description: "Land on the exact module.",
  },
];

export interface InsightNextItem {
  id: string;
  from: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}

export const insightNextItems: InsightNextItem[] = [
  {
    id: "documents",
    from: "v1 library",
    title: "Every document, not just the syllabus",
    description:
      "The module library became chapters you can read, search, and question — with the source always one click away.",
    href: "/features",
    linkLabel: "See documents",
  },
  {
    id: "answers",
    from: "curated links",
    title: "Answers with the source attached",
    description:
      "Hand-picked resources became a conversation that cites the page it used and keeps your files in context.",
    href: "/features",
    linkLabel: "See chat",
  },
  {
    id: "agents",
    from: "one workflow",
    title: "Work that runs to completion",
    description:
      "A single find-a-resource flow grew into agents that plan, edit, test, and hand you a diff to review.",
    href: "/coding-agents",
    linkLabel: "See agents",
  },
];

export interface InsightVersion {
  id: string;
  version: string;
  name: string;
  tagline: string;
  summary: string;
  features: string[];
  accent?: "blue" | "neutral" | "muted";
  throughline: string;
  github?: string;
}

export const insightVersions: InsightVersion[] = [
  {
    id: "v3",
    version: "Version 3",
    name: "Sara cortex",
    tagline: "An adaptive orchestration engine for personalized education.",
    summary:
      "A system that builds the course around you: synthesised roadmaps, grounded sources, and an interactive study session.",
    features: [
      "Generative roadmaps",
      "Cortex sandbox",
      "Neural concept maps",
      "Smartboard media",
    ],
    accent: "neutral",
    throughline: "From a chatbot to an engine.",
    github: "https://github.com/Lokeshgandreddy81/Vidhyalaya",
  },
  {
    id: "v2",
    version: "Version 2",
    name: "Sara library",
    tagline: "The right reading in front of a student in seconds.",
    summary:
      "A curated library by branch, subject, and module, returned with no page reloads.",
    features: [
      "PDFs by module",
      "YouTube integration",
      "Branch-specific",
      "Real-time responses",
    ],
    accent: "neutral",
    throughline: "From a chatbot to a library.",
    github: "https://github.com/Lokeshgandreddy81/Sara",
  },
  {
    id: "v1",
    version: "Version 1",
    name: "Sara chatbot",
    tagline: "A conversational layer over your documents.",
    summary:
      "Chat that keeps sources attached and turns PDFs into chapters.",
    features: [
      "Multi-model chat",
      "Source citations",
      "PDF chapters",
      "YouTube redirects",
    ],
    accent: "muted",
    throughline: "From an idea to a chatbot.",
  },
];