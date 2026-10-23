export type OpenClawRoadmapStatus = "personal" | "alternative" | "optional";

export interface OpenClawRoadmapNode {
  id: string;
  title: string;
  status?: OpenClawRoadmapStatus;
  roadmapId?: string;
}

export interface OpenClawRoadmapGroup {
  id: string;
  parent?: OpenClawRoadmapNode;
  items: OpenClawRoadmapNode[];
}

export interface OpenClawRoadmapStage {
  id: string;
  node: OpenClawRoadmapNode;
  left?: OpenClawRoadmapGroup[];
  right?: OpenClawRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface OpenClawRoadmapSection {
  id: string;
  title?: string;
  stages: OpenClawRoadmapStage[];
}

export interface OpenClawRoadmapLink {
  label: string;
  roadmapId: string;
}

export const OPENCLAW_MARKERS: Array<{
  status: OpenClawRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const OPENCLAW_RELATED_ROADMAPS: OpenClawRoadmapLink[] = [
  { label: "Vibe Coding Roadmap", roadmapId: "vibe-coding" },
  { label: "Claude Code Roadmap", roadmapId: "skill-claude-code" },
  { label: "Ai Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Ai Agents Roadmap", roadmapId: "skill-ai-agents" },
];

export const OPENCLAW_CONTINUE_LEARNING: OpenClawRoadmapLink[] = [
  { label: "Vibe Coding Roadmap", roadmapId: "vibe-coding" },
  { label: "Claude Code Roadmap", roadmapId: "skill-claude-code" },
  { label: "Ai Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Ai Agents Roadmap", roadmapId: "skill-ai-agents" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: OpenClawRoadmapStatus,
  roadmapId?: string,
  customId?: string
): OpenClawRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: OpenClawRoadmapNode[],
  parent?: OpenClawRoadmapNode,
  customId?: string
): OpenClawRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<OpenClawRoadmapStage, "id" | "node"> & {
    status?: OpenClawRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): OpenClawRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: OpenClawRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Introduction",
  stages: [
    stage("Introduction", {
      status: "personal",
      left: [g([n("OpenClaw vs Claude Code"), n("Use cases"), n("Related Roadmaps")])],
      right: [
        g([
          n("Understand the Differences"),
          n("Gateway"),
          n("Agents"),
          n("Agent Loop"),
          n("Context Window"),
          n("Channels"),
          n("Skills"),
          n("Memory System"),
          n("Proactive Core"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("How OpenClaw Works", {
      status: "personal",
      left: [g([n("Choose your Installation Method")])],
    }),
    stage("Setting up OpenClaw", {
      status: "personal",
    }),
    stage("Local Machine", {
      status: "personal",
      left: [g([n("Why and Why not?"), n("Security Best Practices")])],
      right: [
        g([
          n("Why and Why not?"),
          n("Why and Why not?"),
          n("Security Best Practices"),
          n("Raspberry Pi"),
          n("Mac Mini"),
          n("Pick a Provider"),
        ]),
      ],
    }),
    stage("VPS/Cloud", {
      status: "personal",
    }),
    stage("Dedicated Hardware", {
      status: "personal",
    }),
  ],
};

const SECTION_2: OpenClawRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Installation",
  stages: [
    stage("Installation", {
      status: "personal",
      left: [
        g([
          n("Isolated Install"),
          n("Docker"),
          n("Anthropic"),
          n("OpenAI"),
          n("Gemini"),
          n("Ollama"),
        ]),
      ],
      right: [
        g([
          n("Telegram"),
          n("WhatsApp"),
          n("iMessage"),
          n("Slack"),
          n("Auth & Model Providers"),
          n("Discord"),
          n("Signal"),
          n("Adding First Channel"),
        ]),
      ],
    }),
    stage("Onboarding", {
      status: "personal",
      left: [g([n("AGENTS.md"), n("SOUL.md")])],
      right: [g([n("Workspace Settings")])],
    }),
    stage("Hooks", {
      status: "personal",
      left: [
        g([n("USER.md"), n("MEMORY.md"), n("memory/YYYY-MM-DD.md"), n("Other Workspace Files")]),
      ],
      right: [
        g([
          n("Gateway Settings"),
          n("Hook Structure"),
          n("Adding Daemon"),
          n("Event Types"),
          n("Open Claw in Action"),
        ]),
      ],
    }),
    stage("Webhooks", {
      status: "personal",
      left: [
        g([
          n("Command Cheatsheet"),
          n("onboard"),
          n("doctor"),
          n("doctor --deep"),
          n("security audit"),
        ]),
      ],
      right: [g([n("Securing Webhooks"), n("Interval & Active Hours")])],
    }),
    stage("Usage Best Practices", {
      status: "personal",
      left: [g([n("Setup & Health"), n("gateway")])],
      right: [g([n("HEARTBEAT.md"), n("Automating Tasks")])],
    }),
    stage("Heartbeats", {
      status: "personal",
    }),
  ],
};

const SECTION_3: OpenClawRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Automating Tasks",
  stages: [
    stage("Automating Tasks", {
      status: "personal",
      left: [g([n("gateway start | stop | restart"), n("Gateway")])],
      right: [g([n("Managing & Disabling Jobs"), n("Sessions")])],
    }),
    stage("Cron Jobs", {
      status: "personal",
      left: [g([n("channels list"), n("channels login")])],
      right: [g([n("Creating Skills"), n("Installing from ClawHub")])],
    }),
    stage("Sessions", {
      status: "personal",
      left: [g([n("channels add --channel"), n("channels remove --channel")])],
      right: [g([n("Security Risks"), n("Skills")])],
    }),
    stage("Skills", {
      status: "personal",
      left: [g([n("channels status --probe"), n("Channels"), n("models list | set | status")])],
      right: [
        g([n("Installing Plugins"), n("Creating Plugins"), n("Security Risks"), n("Plugins")]),
      ],
    }),
    stage("Plugins", {
      status: "personal",
      left: [g([n("models auth add"), n("models auth setup-token")])],
      right: [g([n("Routing Rules"), n("MCP")])],
    }),
    stage("MCP", {
      status: "personal",
      left: [g([n("Models"), n("cron list"), n("cron add")])],
      right: [g([n("Security checkist"), n("Multi-Agents")])],
    }),
  ],
};

const SECTION_4: OpenClawRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Multi-Agents",
  stages: [
    stage("Multi-Agents", {
      status: "personal",
      left: [
        g([
          n("memory index --all"),
          n('memory search "<query>"'),
          n("backup create"),
          n("Memory & Cron"),
        ]),
      ],
      right: [
        g([
          n("Deploy on an isolated VPS, VM, or dedicated device, not your PC"),
          n("Run OpenClaw as a non-root user"),
          n("Bind the gateway to localhost, not `0.0.0.0` and secure ports 18789 and 18793"),
          n("Set a strong gateway auth token before exposing any service"),
          n("Enable device pairing and maintain a minimal sender allowlist"),
        ]),
      ],
    }),
    stage("Visit the following roadmaps to keep learning", {
      status: "personal",
      left: [
        g([
          n("/new"),
          n("/status"),
          n("/model"),
          n("/context"),
          n("/compact"),
          n("/help"),
          n("/stop"),
          n("/reset"),
          n("/usage"),
          n("/think"),
          n("/fast"),
          n("/reasoning"),
          n("/config"),
          n("/allowlist"),
          n("/mcp"),
          n("/plugins"),
          n("Slash Commands (/)"),
        ]),
      ],
      right: [
        g([
          n("Never trust external content (emails, web pages) to prevent prompt injection"),
          n("Run `openclaw security audit --deep` after every config change"),
          n("Update OpenClaw regularly: many security fixes ship in patch releases"),
          n("Rotate all credentials immediately if a breach is suspected"),
          n("Claude Code"),
          n("Vibe Coding"),
          n("AI Engineer"),
          n("Never hardcode API keys: use environment variables"),
          n("Start in read-only mode and widen permissions deliberately"),
        ]),
      ],
    }),
  ],
};

export const OPENCLAW_SECTIONS: OpenClawRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
