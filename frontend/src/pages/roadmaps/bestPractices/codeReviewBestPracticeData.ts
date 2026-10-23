export type BestPracticeStatus = "personal" | "alternative" | "optional";
export type BestPracticeImpact = "critical" | "high" | "recommended" | "audit";

export interface BestPracticeNode {
  id: string;
  title: string;
  status?: BestPracticeStatus;
  impact?: BestPracticeImpact;
  roadmapId?: string;
}

export interface BestPracticeGroup {
  id: string;
  parent?: BestPracticeNode;
  items: BestPracticeNode[];
}

export interface BestPracticeStage {
  id: string;
  node: BestPracticeNode;
  left?: BestPracticeGroup[];
  right?: BestPracticeGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface BestPracticeSection {
  id: string;
  title?: string;
  stages: BestPracticeStage[];
}

export interface BestPracticeLink {
  label: string;
  roadmapId: string;
}

export interface BestPracticeMetric {
  label: string;
  value: string;
  detail: string;
}

export const CODE_REVIEW_METRICS: BestPracticeMetric[] = [
  { label: "PR Size Gate", value: "< 400 LOC", detail: "Ensures deep review & low defect escape" },
  { label: "Turnaround SLA", value: "< 24 Hours", detail: "Unblocks peers & preserves momentum" },
  {
    label: "CI Automation Gate",
    value: "100% Green",
    detail: "Lint, test & security scans pass first",
  },
  {
    label: "Conventional Prefix",
    value: "nit / chore",
    detail: "Clear blocking vs non-blocking intent",
  },
];

export const CODE_REVIEW_MARKERS: Array<{
  status: BestPracticeStatus;
  label: string;
}> = [
  { status: "personal", label: "Core Review Standard (P0)" },
  { status: "alternative", label: "Trade-off / Contextual" },
  { status: "optional", label: "Team Maturity Practice" },
];

export const CODE_REVIEW_RELATED_ROADMAPS: BestPracticeLink[] = [
  { label: "Code Review Skill", roadmapId: "skill-code-review" },
  { label: "Git & GitHub", roadmapId: "skill-git" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Engineering Management", roadmapId: "engineering-manager" },
  { label: "QA & Testing", roadmapId: "qa" },
];

export const CODE_REVIEW_CONTINUE_LEARNING: BestPracticeLink[] = [
  { label: "Frontend Performance Best Practices", roadmapId: "best-practice-frontend-performance" },
  { label: "Backend Performance Best Practices", roadmapId: "best-practice-backend-performance" },
  { label: "API Security Best Practices", roadmapId: "best-practice-api-security" },
  { label: "AWS Best Practices", roadmapId: "best-practice-aws" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BestPracticeStatus,
  impact?: BestPracticeImpact,
  roadmapId?: string,
  customId?: string
): BestPracticeNode => ({
  id: customId ?? slug(title),
  title,
  status,
  impact,
  roadmapId,
});

const g = (
  items: BestPracticeNode[],
  parent?: BestPracticeNode,
  customId?: string
): BestPracticeGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BestPracticeStage, "id" | "node"> & {
    status?: BestPracticeStatus;
    impact?: BestPracticeImpact;
    customId?: string;
    roadmapId?: string;
  } = {}
): BestPracticeStage => {
  const { status, impact, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, impact, roadmapId, customId),
    ...rest,
  };
};

const PR_PREPARATION_AND_SIZING: BestPracticeSection = {
  id: "pr-preparation-and-sizing",
  title: "Pull Request Preparation & Sizing",
  stages: [
    stage("Bite-Sized Diffs & PR Context", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Small PRs under 400 lines of code (LOC)", "personal", "critical"),
            n("Atomic commits with clear semantic git messages", "personal", "high"),
            n("Stacked PRs / Feature flags for large features", "personal", "high"),
          ],
          n("Diff Granularity")
        ),
      ],
      right: [
        g(
          [
            n("Comprehensive PR description: Context & 'Why'", "personal", "critical"),
            n("Include visual proof: UI screenshots, recordings, or API cURL", "personal", "high"),
            n("Self-review your own diff before requesting review", "personal", "critical"),
          ],
          n("Author Preparation")
        ),
      ],
      noteAfter:
        "Research shows review effectiveness drops dramatically after 400 LOC. Break multi-file architectural changes into chained, stacked PRs.",
      projectIdea:
        "Adopt a PR template enforcing problem context, test instructions, breaking change checklists, and screenshot attachments.",
    }),
  ],
};

const AUTOMATED_GATES: BestPracticeSection = {
  id: "automated-gates",
  title: "Automated Review Gates & CI Checks",
  stages: [
    stage("Automated Quality & Pre-Commit Gates", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Pre-commit hooks with Husky and lint-staged", "personal", "high"),
            n("Automate code formatting with Prettier / Biome", "personal", "critical"),
            n("Zero-tolerance lint gates: ESLint / Ruff / Clippy", "personal", "critical"),
          ],
          n("Local & Pre-Commit")
        ),
      ],
      right: [
        g(
          [
            n("Block PR on failing unit and integration tests", "personal", "critical"),
            n(
              "Automated SAST scans & secret detection (Gitleaks, Semgrep)",
              "personal",
              "critical"
            ),
            n("Automated dependency vulnerability audits (Dependabot, Snyk)", "personal", "high"),
          ],
          n("CI Pipeline Gates")
        ),
      ],
      noteAfter:
        "Never let human reviewers waste time debating formatting or syntax. Automate code style enforcement entirely through CI and pre-commit hooks.",
    }),
  ],
};

const REVIEWER_MINDSET: BestPracticeSection = {
  id: "reviewer-mindset",
  title: "Reviewer Mindset & Collaborative Communication",
  stages: [
    stage("Constructive Reviewing & Psychological Safety", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("Review for architecture, intent, and maintainability", "personal", "critical"),
            n("Distinguish blocking defects from subjective preferences", "personal", "critical"),
            n("Adopt Conventional Comments (nit:, suggestion:, chore:)", "personal", "high"),
          ],
          n("Review Intent & Taxonomy")
        ),
      ],
      right: [
        g(
          [
            n("Frame feedback as questions rather than demands", "personal", "high"),
            n("Offer praise and recognize elegant solutions", "personal", "recommended"),
            n("Hop on a quick huddle if review exceeds 2 rounds", "personal", "high"),
          ],
          n("Empathy & Collaboration")
        ),
      ],
      projectIdea:
        "Publish a team review charter adopting Conventional Comments prefixes (nit, suggestion, question, praise) to eradicate tone ambiguity.",
    }),
  ],
};

const VERIFICATION_AND_SECURITY: BestPracticeSection = {
  id: "verification-and-security",
  title: "Verification, Security & Correctness",
  stages: [
    stage("Defensive Verification & Edge Case Auditing", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Verify edge cases, nullability & error boundary states", "personal", "critical"),
            n("Inspect database migrations for backward compatibility", "personal", "critical"),
            n("Check concurrency, race conditions & idempotency", "personal", "high"),
          ],
          n("Correctness & Robustness")
        ),
      ],
      right: [
        g(
          [
            n("Security review: Injection, IDOR / BOLA & auth checks", "personal", "critical"),
            n("Verify telemetry: Structured logs, metrics & tracing", "personal", "high"),
            n("Validate API documentation and schema synchronization", "personal", "recommended"),
          ],
          n("Security & Observability")
        ),
      ],
      noteAfter:
        "Every backend state mutation or public endpoint must verify authorization at the record level, not just authentication at the perimeter.",
    }),
  ],
};

const TURNAROUND_AND_HYGIENE: BestPracticeSection = {
  id: "turnaround-and-hygiene",
  title: "Turnaround SLA & Merge Hygiene",
  stages: [
    stage("Prompt SLAs & Clean Branch Merging", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("Aim for first-pass review turnaround under 24 hours", "personal", "critical"),
            n("Prioritize unblocking team PRs at the start of your day", "personal", "high"),
            n("Fast follow-up PRs for non-critical improvements", "personal", "recommended"),
          ],
          n("Turnaround SLA")
        ),
      ],
      right: [
        g(
          [
            n("Clear merge strategies: Squash vs Semi-linear Rebase", "personal", "high"),
            n("Auto-delete merged feature branches", "personal", "high"),
            n("Linear git history and concise squash commit summaries", "personal", "recommended"),
          ],
          n("Repository Hygiene")
        ),
      ],
      projectIdea:
        "Set up PR turnaround telemetry via GitHub Actions or Slack reminders to identify PRs waiting over 24 hours for review.",
    }),
  ],
};

export const CODE_REVIEW_SECTIONS: BestPracticeSection[] = [
  PR_PREPARATION_AND_SIZING,
  AUTOMATED_GATES,
  REVIEWER_MINDSET,
  VERIFICATION_AND_SECURITY,
  TURNAROUND_AND_HYGIENE,
];
