export type AiRedTeamingRoadmapStatus = "personal" | "alternative" | "optional";

export interface AiRedTeamingRoadmapNode {
  id: string;
  title: string;
  status?: AiRedTeamingRoadmapStatus;
  roadmapId?: string;
}

export interface AiRedTeamingRoadmapGroup {
  id: string;
  parent?: AiRedTeamingRoadmapNode;
  items: AiRedTeamingRoadmapNode[];
}

export interface AiRedTeamingRoadmapStage {
  id: string;
  node: AiRedTeamingRoadmapNode;
  left?: AiRedTeamingRoadmapGroup[];
  right?: AiRedTeamingRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AiRedTeamingRoadmapSection {
  id: string;
  title?: string;
  stages: AiRedTeamingRoadmapStage[];
}

export interface AiRedTeamingRoadmapLink {
  label: string;
  roadmapId: string;
}

export const AI_RED_TEAMING_MARKERS: Array<{
  status: AiRedTeamingRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const AI_RED_TEAMING_RELATED_ROADMAPS: AiRedTeamingRoadmapLink[] = [
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Prompt Engineering Roadmap", roadmapId: "skill-prompt-engineering" },
  { label: "AI Agents Roadmap", roadmapId: "skill-ai-agents" },
  { label: "Cyber Security Roadmap", roadmapId: "cyber-security" },
  { label: "DevSecOps Roadmap", roadmapId: "devsecops" },
];

export const AI_RED_TEAMING_CONTINUE_LEARNING: AiRedTeamingRoadmapLink[] = [
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Cyber Security", roadmapId: "cyber-security" },
  { label: "AI Agents", roadmapId: "skill-ai-agents" },
  { label: "Prompt Engineering", roadmapId: "skill-prompt-engineering" },
  { label: "Data Analyst", roadmapId: "data-analyst" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AiRedTeamingRoadmapStatus,
  roadmapId?: string,
  customId?: string
): AiRedTeamingRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AiRedTeamingRoadmapNode[],
  parent?: AiRedTeamingRoadmapNode,
  customId?: string
): AiRedTeamingRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AiRedTeamingRoadmapStage, "id" | "node"> & {
    status?: AiRedTeamingRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): AiRedTeamingRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. INTRODUCTION & FOUNDATIONAL KNOWLEDGE
const FOUNDATIONS: AiRedTeamingRoadmapSection = {
  id: "foundations",
  title: "Introduction & Foundational Knowledge",
  stages: [
    stage("Introduction", {
      status: "personal",
      right: [
        g(
          [
            n("AI Security Fundamentals", "personal"),
            n("Why Red Team AI Systems?"),
            n("Ethical Considerations"),
            n("Role of Red Teams"),
          ],
          n("Security Foundations")
        ),
      ],
      noteAfter:
        'Special thanks to "Learn Prompting" (learnprompting.org) for collaborating on the AI red teaming framework and industry curriculum.',
    }),
    stage("Foundational Knowledge", {
      left: [
        g(
          [
            n("Supervised Learning"),
            n("Unsupervised Learning"),
            n("Reinforcement Learning"),
            n("Neural Networks"),
            n("Generative Models"),
            n("Large Language Models"),
            n("Prompt Engineering", undefined, "skill-prompt-engineering"),
          ],
          n("AI / ML Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Confidentiality, Integrity, Availability"),
            n("Threat Modeling", "personal"),
            n("Risk Management"),
            n("Vulnerability Assessment", undefined, "cyber-security"),
          ],
          n("Cybersecurity Principles")
        ),
      ],
    }),
  ],
};

// 2. ATTACKING AI SYSTEMS: PROMPT HACKING & MODEL VULNERABILITIES
const ATTACKING_AI_SYSTEMS: AiRedTeamingRoadmapSection = {
  id: "attacking-ai-systems",
  title: "Prompt Hacking & Model Vulnerabilities",
  stages: [
    stage("Prompt Hacking", {
      status: "personal",
      right: [
        g(
          [
            n("Jailbreak Techniques", "personal"),
            n("Safety Filter Bypasses"),
            n("Prompt Injection"),
            n("Direct Prompt Injection"),
            n("Indirect Prompt Injection"),
            n("Countermeasures"),
          ],
          n("Adversarial Prompting")
        ),
      ],
      projectIdea: "Build an automated prompt injection and safety bypass evaluation suite",
    }),
    stage("Model Vulnerabilities", {
      left: [
        g([n("Model Weight Stealing"), n("Unauthorized Access")], n("Model Extraction")),
        g(
          [n("Data Poisoning", "personal"), n("Adversarial Examples"), n("Model Inversion")],
          n("Model Manipulation")
        ),
        g(
          [n("Adversarial Training"), n("Robust Model Design"), n("Continuous Monitoring")],
          n("Defense Strategies")
        ),
      ],
      projectIdea: "Implement an adversarial perturbation pipeline to test model robustness",
    }),
  ],
};

// 3. SYSTEM & INFRASTRUCTURE SECURITY
const SYSTEM_AND_INFRASTRUCTURE: AiRedTeamingRoadmapSection = {
  id: "system-and-infrastructure",
  title: "System Security & Testing Methodologies",
  stages: [
    stage("System Security", {
      left: [
        g([n("Insecure Deserialization"), n("Remote Code Execution")], n("Code Injection")),
        g(
          [
            n("API Protection", undefined, "skill-api-design"),
            n("Authentication"),
            n("Authorization"),
          ],
          n("Infrastructure Security")
        ),
      ],
      right: [
        g(
          [
            n("Black Box Testing"),
            n("White Box Testing"),
            n("Grey Box Testing"),
            n("Automated vs Manual"),
            n("Continuous Testing"),
          ],
          n("Testing Methodologies")
        ),
      ],
      noteAfter:
        "AI systems integrate with enterprise infrastructure; red teamers must audit both model interfaces and the execution environments that host them.",
    }),
  ],
};

// 4. TOOLS, FRAMEWORKS & PROFESSIONAL PRACTICE
const TOOLS_AND_PRACTICE: AiRedTeamingRoadmapSection = {
  id: "tools-and-practice",
  title: "Tools, Frameworks & Professional Practice",
  stages: [
    stage("Tools and Frameworks", {
      right: [
        g(
          [
            n("Testing Platforms", "personal"),
            n("Monitoring Solutions"),
            n("Benchmark Datasets"),
            n("Custom Testing Scripts"),
            n("Reporting Tools"),
          ],
          n("Ecosystem Tooling")
        ),
      ],
    }),
    stage("Professional Development", {
      left: [
        g([n("Conferences"), n("Research Groups"), n("Forums")], n("Community Engagement")),
        g(
          [n("Lab Environments"), n("CTF Challenges", "personal"), n("Red Team Simulations")],
          n("Practical Experience")
        ),
        g([n("Specialized Courses"), n("Industry Credentials")], n("Certifications")),
      ],
      projectIdea:
        "Participate in an AI CTF challenge and publish a responsible vulnerability report",
    }),
  ],
};

// 5. APPLICATIONS & FUTURE HORIZONS
const APPLICATIONS_AND_FUTURE: AiRedTeamingRoadmapSection = {
  id: "applications-and-future",
  title: "Real-world Applications & Future Directions",
  stages: [
    stage("Real-world Applications", {
      status: "personal",
      left: [
        g(
          [
            n("LLM Security Testing", "personal"),
            n("Agentic AI Security", undefined, "skill-ai-agents"),
            n("Responsible Disclosure"),
          ],
          n("Security Practice")
        ),
      ],
      projectIdea: "Conduct a simulated red team assessment on an autonomous AI agent workflow",
    }),
    stage("Future Directions", {
      right: [
        g(
          [
            n("Emerging Threats"),
            n("Advanced Techniques"),
            n("Research Opportunities"),
            n("Industry Standards"),
          ],
          n("Next Horizons")
        ),
      ],
    }),
  ],
};

export const AI_RED_TEAMING_SECTIONS: AiRedTeamingRoadmapSection[] = [
  FOUNDATIONS,
  ATTACKING_AI_SYSTEMS,
  SYSTEM_AND_INFRASTRUCTURE,
  TOOLS_AND_PRACTICE,
  APPLICATIONS_AND_FUTURE,
];
