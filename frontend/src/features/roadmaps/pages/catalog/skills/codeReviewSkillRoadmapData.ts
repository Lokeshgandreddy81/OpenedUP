export type CodeReviewSkillRoadmapStatus = "personal" | "alternative" | "optional";

export interface CodeReviewSkillRoadmapNode {
  id: string;
  title: string;
  status?: CodeReviewSkillRoadmapStatus;
  roadmapId?: string;
}

export interface CodeReviewSkillRoadmapGroup {
  id: string;
  parent?: CodeReviewSkillRoadmapNode;
  items: CodeReviewSkillRoadmapNode[];
}

export interface CodeReviewSkillRoadmapStage {
  id: string;
  node: CodeReviewSkillRoadmapNode;
  left?: CodeReviewSkillRoadmapGroup[];
  right?: CodeReviewSkillRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface CodeReviewSkillRoadmapSection {
  id: string;
  title?: string;
  stages: CodeReviewSkillRoadmapStage[];
}

export interface CodeReviewSkillRoadmapLink {
  label: string;
  roadmapId: string;
}

export interface CodeReviewSkillRoadmapResource {
  label: string;
  badge?: string;
  url: string;
}

export const CODE_REVIEW_SKILL_MARKERS: Array<{
  status: CodeReviewSkillRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const CODE_REVIEW_SKILL_RELATED_ROADMAPS: CodeReviewSkillRoadmapLink[] = [
  { label: "Git & GitHub", roadmapId: "skill-git-github" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "QA Engineer", roadmapId: "qa" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Engineering Manager", roadmapId: "engineering-manager" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "DevSecOps", roadmapId: "devsecops" },
];

export const CODE_REVIEW_SKILL_CONTINUE_LEARNING: CodeReviewSkillRoadmapLink[] = [
  { label: "Git & GitHub", roadmapId: "skill-git-github" },
  { label: "Software Architecture", roadmapId: "software-architect" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "QA & Testing", roadmapId: "qa" },
  { label: "Engineering Leadership", roadmapId: "engineering-manager" },
];

export const CODE_REVIEW_SKILL_RESOURCES: CodeReviewSkillRoadmapResource[] = [
  {
    label: "@gunnarmorling (Original Author)",
    badge: "Original Author",
    url: "https://www.morling.dev/blog/the-code-review-pyramid/",
  },
  {
    label: "Code Review Best Practices",
    badge: "Also Visit",
    url: "https://roadmap.sh/best-practices/code-review",
  },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: CodeReviewSkillRoadmapStatus,
  roadmapId?: string,
  customId?: string
): CodeReviewSkillRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: CodeReviewSkillRoadmapNode[],
  parent?: CodeReviewSkillRoadmapNode,
  customId?: string
): CodeReviewSkillRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<CodeReviewSkillRoadmapStage, "id" | "node"> & {
    status?: CodeReviewSkillRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): CodeReviewSkillRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// SECTION 1: Automate Here (Smaller Effort for Changes Later On)
const AUTOMATE_HERE: CodeReviewSkillRoadmapSection = {
  id: "automate-here",
  title: "Automate Here (Smaller Effort for Changes Later On)",
  stages: [
    stage("Code Styles", {
      status: "personal",
      left: [
        g(
          [
            n("Prettier & Formatting", "personal"),
            n("ESLint & Static Analysis", "personal"),
            n("Language Linters (Clippy, Ruff, Flake8)", "alternative"),
          ],
          n("Linters & Formatters")
        ),
      ],
      right: [
        g(
          [
            n("Pre-commit Hooks & Husky", "personal", "skill-git-github"),
            n("Naming Conventions & Consistency", "personal"),
            n("Automated CI Checks", "personal", "devops"),
          ],
          n("Automation & Conventions")
        ),
      ],
      noteAfter:
        "Automate formatting and linting completely. Never debate quotes, indentation, or style rules in human code reviews.",
    }),
    stage("Tests", {
      status: "personal",
      left: [
        g(
          [
            n("Fast Unit Test Suites", "personal", "qa"),
            n("Integration & Contract Tests", "personal"),
            n("E2E Regression Testing", "alternative"),
          ],
          n("Automated Test Suites")
        ),
      ],
      right: [
        g(
          [
            n("Edge Cases & Boundary Values", "personal"),
            n("Test Determinism & Flakiness Prevention", "personal"),
            n("Meaningful Assertions Quality", "personal"),
          ],
          n("Reviewing Test Quality")
        ),
      ],
      noteAfter:
        "Verify automated tests run reliably in CI. Focus human review on missing test scenarios, error paths, and test readability.",
      projectIdea:
        "Set up automated CI workflow enforcing 100% lint passes and test suites on pull requests",
    }),
  ],
};

// SECTION 2: Focus on These (Higher Effort for Changes Later On)
const FOCUS_ON_THESE: CodeReviewSkillRoadmapSection = {
  id: "focus-on-these",
  title: "Focus on These (Higher Effort for Changes Later On)",
  stages: [
    stage("Documentation", {
      status: "personal",
      left: [
        g(
          [
            n("Self-Documenting Code & Clarity", "personal"),
            n("Comments Explaining 'Why' not 'What'", "personal"),
            n("Docstrings & Public TSDoc", "alternative"),
          ],
          n("In-Code Documentation")
        ),
      ],
      right: [
        g(
          [
            n("Comprehensive PR Descriptions", "personal"),
            n("Architecture Decision Records (ADRs)", "personal", "software-architect"),
            n("OpenAPI & Contract Specs", "personal", "skill-api-design"),
          ],
          n("Context & System Documentation")
        ),
      ],
      noteAfter:
        "Good documentation captures the rationale behind trade-offs and decisions, preventing knowledge loss across the team.",
    }),
    stage("Implementation Semantics", {
      status: "personal",
      left: [
        g(
          [
            n("Business Logic Correctness", "personal"),
            n("Error Handling & Failure Modes", "personal"),
            n("Security & Vulnerability Analysis", "personal", "devsecops"),
          ],
          n("Correctness & Security")
        ),
      ],
      right: [
        g(
          [
            n("Algorithmic Efficiency & Big-O", "personal", "skill-dsa"),
            n("Concurrency & Race Conditions", "personal"),
            n("Code Simplicity & Maintainability", "personal"),
          ],
          n("Performance & Simplicity")
        ),
      ],
      noteAfter:
        "Scrutinize business rules, data corruption edge cases, concurrency hazards, and architectural simplicity before approving.",
      projectIdea:
        "Perform a comprehensive security, concurrency, and performance review on an open PR",
    }),
    stage("API Semantics", {
      status: "personal",
      left: [
        g(
          [
            n("Backward Compatibility Guarantees", "personal"),
            n("Non-Breaking Schema Changes", "personal"),
            n("Sensible Defaults & Nullability", "alternative"),
          ],
          n("Contract Evolution")
        ),
      ],
      right: [
        g(
          [
            n("Consistency with Existing Endpoints", "personal", "skill-api-design"),
            n("Domain Boundaries & DTOs", "personal", "software-architect"),
            n("Error Schemas & Idempotency", "personal"),
          ],
          n("Interface Design & DX")
        ),
      ],
      noteAfter:
        "API design is the foundation of the pyramid. Bad API choices are the hardest and most costly to modify once published to production.",
    }),
  ],
};

// SECTION 3: Review Workflow & Culture
const WORKFLOW_AND_CULTURE: CodeReviewSkillRoadmapSection = {
  id: "workflow-and-culture",
  title: "Review Etiquette, Culture & Workflow",
  stages: [
    stage("Review Etiquette", {
      status: "personal",
      left: [
        g(
          [
            n("Distinguish Nits vs Blockers", "personal"),
            n("Ask Questions Over Demands", "personal"),
            n("Fast Turnaround Within 24h", "personal"),
          ],
          n("For Reviewers")
        ),
      ],
      right: [
        g(
          [
            n("Keep PRs Small (< 400 Lines)", "personal"),
            n("Self-Review Before Requesting", "personal"),
            n("Receptive to Constructive Feedback", "personal"),
          ],
          n("For PR Authors")
        ),
      ],
      noteAfter:
        "High-performing engineering teams treat code review as a collaborative learning opportunity and continuous knowledge sharing.",
      projectIdea:
        "Adopt Conventional Comments (e.g. nit:, question:, suggestion:, blocker:) across the team",
    }),
    stage("Modern Review Tooling", {
      status: "personal",
      left: [
        g(
          [
            n("GitHub Pull Requests", "personal", "skill-git-github"),
            n("GitLab Merge Requests", "alternative"),
            n("PR Checklists & Templates", "personal"),
          ],
          n("Review Platforms")
        ),
      ],
      right: [
        g(
          [
            n("AI-Assisted Code Reviews", "personal", "skill-ai-agents"),
            n("Automated Security SAST Scanners", "personal", "devsecops"),
            n("Ephemeral Preview Environments", "alternative", "devops"),
          ],
          n("Modern Automation")
        ),
      ],
      noteAfter:
        "Based on Gunnar Morling's Code Review Pyramid and modern engineering best practices.",
    }),
  ],
};

export const CODE_REVIEW_SKILL_SECTIONS: CodeReviewSkillRoadmapSection[] = [
  AUTOMATE_HERE,
  FOCUS_ON_THESE,
  WORKFLOW_AND_CULTURE,
];
