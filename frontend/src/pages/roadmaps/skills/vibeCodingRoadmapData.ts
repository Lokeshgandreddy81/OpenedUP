export type VibeCodingRoadmapStatus = "personal" | "alternative" | "optional";

export interface VibeCodingRoadmapNode {
  id: string;
  title: string;
  status?: VibeCodingRoadmapStatus;
  roadmapId?: string;
}

export interface VibeCodingRoadmapGroup {
  id: string;
  parent?: VibeCodingRoadmapNode;
  items: VibeCodingRoadmapNode[];
}

export interface VibeCodingRoadmapStage {
  id: string;
  node: VibeCodingRoadmapNode;
  left?: VibeCodingRoadmapGroup[];
  right?: VibeCodingRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface VibeCodingRoadmapSection {
  id: string;
  title?: string;
  stages: VibeCodingRoadmapStage[];
}

export interface VibeCodingRoadmapLink {
  label: string;
  roadmapId: string;
}

export const VIBE_CODING_MARKERS: Array<{
  status: VibeCodingRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const VIBE_CODING_RELATED_ROADMAPS: VibeCodingRoadmapLink[] = [
  { label: "Claude Code Roadmap", roadmapId: "skill-claude-code" },
  { label: "AI Agents Roadmap", roadmapId: "skill-ai-agents" },
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Prompt Engineering Roadmap", roadmapId: "skill-prompt-engineering" },
];

export const VIBE_CODING_CONTINUE_LEARNING: VibeCodingRoadmapLink[] = [
  { label: "Claude Code", roadmapId: "skill-claude-code" },
  { label: "AI Agents", roadmapId: "skill-ai-agents" },
  { label: "Prompt Engineering", roadmapId: "skill-prompt-engineering" },
  { label: "AI Engineer", roadmapId: "ai-engineer" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: VibeCodingRoadmapStatus,
  roadmapId?: string,
  customId?: string
): VibeCodingRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: VibeCodingRoadmapNode[],
  parent?: VibeCodingRoadmapNode,
  customId?: string
): VibeCodingRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

export const VIBE_CODING_SECTIONS: VibeCodingRoadmapSection[] = [
  {
    id: "mindset-and-tools",
    title: "Mindset & Tooling",
    stages: [
      {
        id: "what-is-vibe-coding",
        node: n("What is vibe coding?", "personal"),
      },
      {
        id: "vibe-coder-mindset",
        node: n("The vibe coder mindset", "personal"),
        right: [
          g(
            [
              n("Claude Code", "personal", "skill-claude-code"),
              n("Cursor", "personal"),
              n("Devin"),
              n("Gemini"),
              n("Copilot"),
              n("Codex"),
            ],
            n("AI Assisted Coding Tools")
          ),
          g([n("v0", "personal"), n("Lovable")], n("Frontend-Focused")),
        ],
      },
      {
        id: "plan-before-you-code",
        node: n("Plan before you Code", "personal"),
        left: [
          g(
            [
              n("Plan what you need to develop (MVP, Different Phases)"),
              n("Work step by step rather than trying to build everything at once"),
              n("Illustrate AI with examples (mockups, code samples, images)"),
            ],
            n("AI Tools can Help with Planning")
          ),
        ],
      },
      {
        id: "tech-stack-and-coding",
        node: n("Tech Stack and Coding", "personal"),
        right: [
          g(
            [
              n("Pick a popular tech stack rather than new/niche ones"),
              n("If you have style/coding preferences, document them for AI"),
              n("Ask AI to keep the code modular and aim for smaller files"),
            ],
            n("Establishing Standards Early")
          ),
          g([n("Regularly ask AI to review and refactor the codebase")], n("Refactoring Sessions")),
        ],
      },
    ],
  },
  {
    id: "prompting-and-context",
    title: "Prompting & Context Engineering",
    stages: [
      {
        id: "prompting-best-practices",
        node: n("Prompting Best Practices", "personal"),
        left: [
          g([
            n("Be specific about what you want, rather than high-level instructions"),
            n("Ask for one task at a time rather than five different items"),
            n("Tell AI what NOT to do based on previous mistakes"),
            n("Give AI mockups, reference files and materials"),
            n('Use "act as" framing when helpful (e.g. UX researcher)'),
            n("Use skills and custom instructions created by others"),
            n("Explicitly tell AI to 'think' or 'brainstorm' before complex problems"),
          ]),
        ],
        right: [
          g(
            [
              n("Regularly update your context document (e.g. CLAUDE.md)"),
              n("Keep Context Document Up to Date"),
            ],
            n("Context Retention")
          ),
        ],
      },
      {
        id: "context-management",
        node: n("Context", "personal"),
        left: [
          g(
            [
              n("If AI fails after 3 prompts, stop and start a fresh chat"),
              n("Leverage long context windows when available and necessary"),
              n("For unrelated tasks, proactively clean and start new sessions"),
              n("Ask AI to use subagents, if possible"),
            ],
            n("Clear Context Regularly")
          ),
        ],
      },
    ],
  },
  {
    id: "debugging-and-quality",
    title: "Debugging, Version Control & Security",
    stages: [
      {
        id: "debugging",
        node: n("Debugging", "personal"),
        right: [
          g(
            [
              n("If errors persist, ask AI to create a list of possible causes"),
              n("Prompt error messages directly and let AI diagnose"),
              n("Tell AI to add temporary logs to locate the bug faster"),
              n("Install and ask AI to use MCP (e.g. Playwright for browser)"),
            ],
            n("Let AI Debug, But Understand the Root Cause")
          ),
        ],
      },
      {
        id: "version-control",
        node: n("Master Version Control", "personal"),
        left: [
          g(
            [
              n("Start each new feature with a clean Git slate"),
              n("Use git commit regularly after every successful AI task"),
              n("If you need to revert, use Git rather than AI native revert"),
              n("Ask AI to handle your Git and GitHub CLI tasks"),
            ],
            n("Commit Often, With Clear Messages")
          ),
        ],
      },
      {
        id: "testing",
        node: n("Testing", "personal"),
        right: [
          g(
            [
              n("Consider Test-Driven Development (TDD) with AI"),
              n("Ask AI to write tests (E2E tests help build stable products)"),
              n("When finding a bug, ask AI to write a breaking test first"),
              n("Once tests pass, refactor regularly with confidence"),
            ],
            n("Force AI To Test by Default")
          ),
        ],
      },
      {
        id: "security",
        node: n("Security Best Practices", "personal"),
        left: [
          g(
            [
              n("Never hardcode secrets or credentials; use env variables"),
              n("Explicitly ask AI to perform a security audit of the application"),
              n("Implement Spec-Driven Development (SDD)"),
            ],
            n("Never Hardcode Your Secrets")
          ),
        ],
      },
    ],
  },
];
