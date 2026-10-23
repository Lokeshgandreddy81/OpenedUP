export type ClaudeCodeRoadmapStatus = "personal" | "alternative" | "optional";

export interface ClaudeCodeRoadmapNode {
  id: string;
  title: string;
  status?: ClaudeCodeRoadmapStatus;
  roadmapId?: string;
}

export interface ClaudeCodeRoadmapGroup {
  id: string;
  parent?: ClaudeCodeRoadmapNode;
  items: ClaudeCodeRoadmapNode[];
}

export interface ClaudeCodeRoadmapStage {
  id: string;
  node: ClaudeCodeRoadmapNode;
  left?: ClaudeCodeRoadmapGroup[];
  right?: ClaudeCodeRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ClaudeCodeRoadmapSection {
  id: string;
  title?: string;
  stages: ClaudeCodeRoadmapStage[];
}

export interface ClaudeCodeRoadmapLink {
  label: string;
  roadmapId: string;
}

export const CLAUDE_CODE_MARKERS: Array<{
  status: ClaudeCodeRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const CLAUDE_CODE_RELATED_ROADMAPS: ClaudeCodeRoadmapLink[] = [
  { label: "AI Agents Roadmap", roadmapId: "skill-ai-agents" },
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Prompt Engineering Roadmap", roadmapId: "skill-prompt-engineering" },
  { label: "Vibe Coding Roadmap", roadmapId: "skill-vibe-coding" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
  { label: "Shell / Bash Roadmap", roadmapId: "skill-shell" },
];

export const CLAUDE_CODE_CONTINUE_LEARNING: ClaudeCodeRoadmapLink[] = [
  { label: "Vibe Coding", roadmapId: "skill-vibe-coding" },
  { label: "AI Agents", roadmapId: "skill-ai-agents" },
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "Prompt Engineering", roadmapId: "skill-prompt-engineering" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ClaudeCodeRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ClaudeCodeRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ClaudeCodeRoadmapNode[],
  parent?: ClaudeCodeRoadmapNode,
  customId?: string
): ClaudeCodeRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ClaudeCodeRoadmapStage, "id" | "node"> & {
    status?: ClaudeCodeRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ClaudeCodeRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. GETTING STARTED & INTERFACES
const GETTING_STARTED_AND_INTERFACES: ClaudeCodeRoadmapSection = {
  id: "getting-started-interfaces",
  title: "Getting Started & Access Interfaces",
  stages: [
    stage("Introduction", {
      left: [
        g(
          [
            n("Claude CLI", "personal"),
            n("Desktop App", "alternative"),
            n("Editor Extensions", "alternative"),
            n("Mobile (Channels)", "alternative"),
            n("Community Tools", "optional"),
          ],
          n("Interface Options")
        ),
      ],
      right: [
        g(
          [
            n("What is Vibe Coding?", undefined, "skill-vibe-coding"),
            n("What is a Coding Agent?"),
            n("What is Agentic Loop?"),
            n("Setting up Claude"),
          ],
          n("Core Concepts")
        ),
      ],
      noteAfter:
        "Claude Code is Anthropic's agentic command-line interface that understands your codebase, runs terminal commands, edits files, and executes development workflows autonomously.",
    }),
    stage("Ways to use Claude", {
      left: [g([n("Common Usecases")], n("Application Scope"))],
      right: [
        g([n("Subscription", "personal"), n("API usage", "alternative")], n("Billing & Access")),
      ],
    }),
  ],
};

// 2. ARCHITECTURE & MODEL SELECTION
const ARCHITECTURE_AND_MODELS: ClaudeCodeRoadmapSection = {
  id: "architecture-and-models",
  title: "Architecture Primitives & Model Strategy",
  stages: [
    stage("Understand the Basics", {
      left: [
        g(
          [
            n("Ctrl+C"),
            n("Ctrl+R"),
            n("Esc"),
            n("Esc + Esc"),
            n("Shift+Tab"),
            n("Slash Commands (/)"),
            n("!"),
            n("\\"),
            n("@"),
          ],
          n("Shortcuts & Prefixes")
        ),
      ],
      right: [
        g(
          [
            n("CLAUDE.md"),
            n("Skills"),
            n("Context"),
            n("Modes"),
            n("Models"),
            n("Tools"),
            n("MCP"),
            n("Plugins"),
            n("Hooks"),
            n("Subagents"),
          ],
          n("Understand the Differences")
        ),
      ],
    }),
    stage("Using Claude Code", {
      left: [
        g(
          [
            n("claude"),
            n("claude -r"),
            n('claude "query"'),
            n("claude -p"),
            n("claude -c"),
            n("claude --add-dir"),
          ],
          n("claude Commands")
        ),
      ],
      right: [
        g(
          [n("Sonnet", "personal"), n("Opus", "alternative"), n("Haiku", "alternative")],
          n("When to use what model?")
        ),
      ],
      noteAfter:
        "Sonnet provides the sweet spot for rapid coding and architectural reasoning, Opus handles high-complexity tasks, and Haiku minimizes latency and token consumption.",
    }),
  ],
};

// 3. WORKFLOWS & BEST PRACTICES
const WORKFLOWS_AND_BEST_PRACTICES: ClaudeCodeRoadmapSection = {
  id: "workflows-and-best-practices",
  title: "Workflows & Session Operations",
  stages: [
    stage("Claude Workflow", {
      left: [
        g(
          [
            n("/help"),
            n("/usage"),
            n("/clear"),
            n("/cost"),
            n("/exit"),
            n("/export"),
            n("/status"),
            n("/rewind"),
            n("/plan"),
            n("/doctor"),
          ],
          n("Session Commands")
        ),
      ],
      right: [
        g(
          [n("Permission Modes"), n("Plan Mode", "personal"), n("Manage Sessions")],
          n("Session Execution")
        ),
      ],
      noteAfter:
        "Plan Mode enables deliberate exploration before file modification, allowing Claude to inspect dependencies and produce an execution outline prior to making changes.",
    }),
    stage("Usage Best Practices", {
      left: [g([n("/context"), n("/compact"), n("/init"), n("/memory")], n("Context & Memory"))],
      right: [g([n("Resume", "personal"), n("Rewind", "alternative")], n("History & Navigation"))],
    }),
  ],
};

// 4. CONFIGURATION, EXTENSIBILITY & HOOKS
const CONFIGURATION_EXTENSIBILITY_AND_HOOKS: ClaudeCodeRoadmapSection = {
  id: "configuration-extensibility-hooks",
  title: "Configuration, Skills & Hooks",
  stages: [
    stage("CLAUDE.md", {
      left: [
        g(
          [n("/config"), n("/permissions"), n("/model"), n("/agents"), n("/hooks"), n("/mcp")],
          n("Configuration")
        ),
      ],
      right: [g([n("How to Structure", "personal"), n("Locations")], n("Project Guidelines"))],
      noteAfter:
        "CLAUDE.md acts as persistent codebase memory across sessions. Place it at repository root or inside parent directories to guide architecture, conventions, and style.",
    }),
    stage("Skills", {
      left: [
        g(
          [
            n("SessionStart"),
            n("SessionEnd"),
            n("PreToolUse"),
            n("PostToolUse"),
            n("UserPromptSubmit"),
            n("Stop"),
          ],
          n("Hooks")
        ),
      ],
      right: [g([n("Creating Skills", "personal"), n("Skill Best Practices")], n("Custom Skills"))],
    }),
    stage("Subagents", {
      right: [g([n("Creating Subagents", "personal")], n("Specialized Delegation"))],
      projectIdea:
        "Build a specialized subagent for automated test auditing and documentation verification.",
    }),
    stage("Hooks", {
      right: [
        g(
          [n("Hook Events & Matchers"), n("Hook Types"), n("Hook Inputs & Outputs")],
          n("Hook Architecture")
        ),
      ],
    }),
    stage("Loops", {
      noteAfter:
        "Agentic loops cycle continuously through perception, planning, tool execution, and output validation until goals are proven complete.",
    }),
  ],
};

// 5. CONTEXT EFFICIENCY & TOKEN MANAGEMENT
const CONTEXT_EFFICIENCY_AND_TOKEN_MANAGEMENT: ClaudeCodeRoadmapSection = {
  id: "context-token-management",
  title: "Context & Token Optimization",
  stages: [
    stage("Manage Context", {
      right: [
        g(
          [
            n("Understand Claude Pricing"),
            n("Use /compact and /clear", "personal"),
            n("Be mindful of extensions"),
            n("Use subagents and hooks"),
            n("Thinking modes & Effort"),
            n("Prompt Caching", "personal"),
          ],
          n("Efficiency Best Practices")
        ),
      ],
      noteAfter:
        "Token management is essential for long sessions. Regularly utilize /compact to compress conversation history and leverage prompt caching to reduce token billing.",
    }),
  ],
};

// 6. ADVANCED AUTOMATION & PRODUCTION SCALING
const ADVANCED_AUTOMATION_AND_SCALING: ClaudeCodeRoadmapSection = {
  id: "advanced-automation-scaling",
  title: "Advanced Claude Code & Production Scaling",
  stages: [
    stage("Advanced Claude Code", {
      noteAfter:
        "Scale Claude Code into automated CI pipelines, scheduled autonomous maintenance jobs, and multi-agent development clusters.",
    }),
    stage("Customize Status Line"),
    stage("Connecting Tools with MCP", {
      left: [
        g([n("Skills for MCP", "personal"), n("Channels"), n("Tunnels")], n("MCP Connectivity")),
      ],
      roadmapId: "skill-ai-agents",
    }),
    stage("Scheduling Jobs"),
    stage("Model Configuration", {
      right: [g([n("Opusplan", "personal")], n("Complex Planning"))],
    }),
    stage("Output Styles"),
    stage("Plugins", {
      right: [g([n("Code Intelligence", "personal")], n("Extended Intelligence"))],
    }),
    stage("Scaling Claude", {
      left: [
        g(
          [n("Headless mode", "personal"), n("Git Worktrees", "personal"), n("Agent Team")],
          n("Parallel & Headless")
        ),
      ],
      noteAfter:
        "Use Git Worktrees to isolate independent task branches, and run headless mode (claude -p) for batch automation without blocking your main terminal.",
    }),
    stage("Security Best Practices", {
      right: [g([n("Claude Code Security", "personal")], n("Defensive Guardrails"))],
    }),
  ],
};

export const CLAUDE_CODE_SECTIONS: ClaudeCodeRoadmapSection[] = [
  GETTING_STARTED_AND_INTERFACES,
  ARCHITECTURE_AND_MODELS,
  WORKFLOWS_AND_BEST_PRACTICES,
  CONFIGURATION_EXTENSIBILITY_AND_HOOKS,
  CONTEXT_EFFICIENCY_AND_TOKEN_MANAGEMENT,
  ADVANCED_AUTOMATION_AND_SCALING,
];
