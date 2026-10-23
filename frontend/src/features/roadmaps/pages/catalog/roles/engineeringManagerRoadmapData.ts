export type EngineeringManagerRoadmapStatus = "personal" | "alternative" | "optional";

export interface EngineeringManagerRoadmapNode {
  id: string;
  title: string;
  status?: EngineeringManagerRoadmapStatus;
  roadmapId?: string;
}

export interface EngineeringManagerRoadmapGroup {
  id: string;
  parent?: EngineeringManagerRoadmapNode;
  items: EngineeringManagerRoadmapNode[];
}

export interface EngineeringManagerRoadmapStage {
  id: string;
  node: EngineeringManagerRoadmapNode;
  left?: EngineeringManagerRoadmapGroup[];
  right?: EngineeringManagerRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface EngineeringManagerRoadmapSection {
  id: string;
  title?: string;
  stages: EngineeringManagerRoadmapStage[];
}

export interface EngineeringManagerRoadmapLink {
  label: string;
  roadmapId: string;
}

export const ENGINEERING_MANAGER_MARKERS: Array<{
  status: EngineeringManagerRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const ENGINEERING_MANAGER_RELATED_ROADMAPS: EngineeringManagerRoadmapLink[] = [
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Product Manager", roadmapId: "product-manager" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Code Review", roadmapId: "skill-code-review" },
];

export const ENGINEERING_MANAGER_CONTINUE_LEARNING: EngineeringManagerRoadmapLink[] = [
  { label: "Product Manager", roadmapId: "product-manager" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Developer Relations", roadmapId: "developer-relations" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: EngineeringManagerRoadmapStatus,
  roadmapId?: string,
  customId?: string
): EngineeringManagerRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: EngineeringManagerRoadmapNode[],
  parent?: EngineeringManagerRoadmapNode,
  customId?: string
): EngineeringManagerRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<EngineeringManagerRoadmapStage, "id" | "node"> & {
    status?: EngineeringManagerRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): EngineeringManagerRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const TRANSITION_AND_MINDSET: EngineeringManagerRoadmapSection = {
  id: "transition-and-mindset",
  title: "Transitioning from IC to EM",
  stages: [
    stage("Role & Mindset Shift", {
      status: "personal",
      left: [
        g(
          [
            n("Individual Contributor vs Manager Role", "personal"),
            n("The Multiplier Effect (Scaling through others)", "personal"),
            n("Letting go of coding as primary output"),
            n("Maker's Schedule vs Manager's Schedule"),
          ],
          n("Mindset Evolution")
        ),
      ],
      right: [
        g(
          [
            n("Tech Lead Manager (TLM)", "alternative"),
            n("People-focused Engineering Manager", "personal"),
            n("Process & Delivery-focused EM"),
            n("Director & VP Track Vision"),
          ],
          n("Management Archetypes")
        ),
      ],
      noteAfter:
        "The shift from IC to EM is not a promotion—it is a complete career change requiring empathy, communication, and indirect influence.",
    }),
    stage("Leadership Principles", {
      left: [
        g(
          [
            n("Servant Leadership", "personal"),
            n("Situational Leadership Theory"),
            n("Radical Candor (Care Personally, Challenge Directly)", "personal"),
            n("Managing Up, Down & Across the Org"),
          ],
          n("Core Leadership Models")
        ),
      ],
      right: [
        g(
          [
            n("High Output Management (Andy Grove)", "personal"),
            n("An Elegant Puzzle: Systems of Engineering"),
            n("The Manager's Path (Camille Fournier)", "personal"),
            n("Team Topologies & Accelerate"),
          ],
          n("Essential Literature")
        ),
      ],
    }),
  ],
};

const PEOPLE_MANAGEMENT: EngineeringManagerRoadmapSection = {
  id: "people-management",
  title: "People Management & 1:1s",
  stages: [
    stage("Effective 1-on-1s", {
      status: "personal",
      left: [
        g(
          [
            n("Weekly vs Bi-weekly cadence", "personal"),
            n("Agenda co-ownership & Report-first focus", "personal"),
            n("Active listening & open-ended inquiry"),
            n("Shared documentation & tracking commitments"),
          ],
          n("Meeting Structure")
        ),
      ],
      right: [
        g(
          [
            n("Unblocking day-to-day friction"),
            n("Wellbeing, energy & burnout check-ins", "personal"),
            n("Long-term career aspirations & growth"),
            n("Peer relationships & team feedback"),
          ],
          n("Agenda Themes")
        ),
      ],
      projectIdea:
        "Design a 6-month 1:1 question framework and growth template for your direct reports.",
    }),
    stage("Coaching & Career Growth", {
      left: [
        g(
          [
            n("Coaching vs Mentoring vs Directing", "personal"),
            n("Individual Development Plans (IDPs)", "personal"),
            n("Engineering Career Ladders & Competencies"),
            n("Identifying stretch projects & sponsorship"),
          ],
          n("Growth Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("SBI Model (Situation-Behavior-Impact)", "personal"),
            n("Continuous real-time feedback loops"),
            n("Receiving 360 upward feedback gracefully"),
            n("Managing defensive reactions effectively"),
          ],
          n("Feedback Loops")
        ),
      ],
    }),
  ],
};

const TEAM_DYNAMICS: EngineeringManagerRoadmapSection = {
  id: "team-dynamics",
  title: "Team Dynamics & Psychological Safety",
  stages: [
    stage("Psychological Safety & Trust", {
      status: "personal",
      left: [
        g(
          [
            n("Google's Project Aristotle & High-Performing Teams", "personal"),
            n("Blameless culture & psychological safety", "personal"),
            n("Vulnerability & admitting mistakes openly"),
            n("Constructive disagreement & healthy dissent"),
          ],
          n("Trust Building")
        ),
      ],
      right: [
        g(
          [
            n("Preventing developer burnout & compassion fatigue", "personal"),
            n("Team engagement & quarterly sentiment surveys"),
            n("Sustainable pacing & work-life boundaries"),
            n("Recognition, praise & celebrating wins"),
          ],
          n("Team Health")
        ),
      ],
    }),
    stage("Conflict & Inclusive Culture", {
      left: [
        g(
          [
            n("Crucial Conversations Framework", "personal"),
            n("Resolving peer interpersonal conflicts"),
            n("Mediation in architectural stalemates"),
            n("Addressing toxic behavior decisively"),
          ],
          n("Conflict Resolution")
        ),
      ],
      right: [
        g(
          [
            n("Diversity, Equity & Inclusion (DEI) advocacy", "personal"),
            n("Unconscious bias mitigation"),
            n("Managing distributed & remote teams"),
            n("Asynchronous communication documentation culture"),
          ],
          n("Inclusion & Remote Work")
        ),
      ],
    }),
  ],
};

const HIRING_AND_PERFORMANCE: EngineeringManagerRoadmapSection = {
  id: "hiring-and-performance",
  title: "Hiring, Onboarding & Performance",
  stages: [
    stage("Hiring & Onboarding", {
      status: "personal",
      left: [
        g(
          [
            n("Headcount planning & capacity forecasting", "personal"),
            n("Writing inclusive & clear job descriptions"),
            n("Standardized rubric-based interview loops", "personal"),
            n("Assessing culture add vs culture fit"),
          ],
          n("Interviewing & Sourcing")
        ),
      ],
      right: [
        g(
          [
            n("Realistic technical evaluations (pair coding)", "personal"),
            n("Candidate debriefs & calibration"),
            n("Structured 30-60-90 day onboarding plans", "personal"),
            n("Assigning onboarding buddies & first-week PRs"),
          ],
          n("Candidate & Onboarding Experience")
        ),
      ],
    }),
    stage("Performance Management", {
      left: [
        g(
          [
            n("Setting clear SMART goals & team OKRs", "personal"),
            n("Bi-annual & annual performance reviews", "personal"),
            n("Org-wide calibration sessions"),
            n("Promotion packages & compensation management"),
          ],
          n("Performance Evaluations")
        ),
      ],
      right: [
        g(
          [
            n("Early detection of performance dips"),
            n("Structuring Performance Improvement Plans (PIPs)", "personal"),
            n("Partnering with People / HR & Legal"),
            n("Compassionate offboarding & exit interviews"),
          ],
          n("Underperformance Handling")
        ),
      ],
      projectIdea:
        "Draft a comprehensive engineering leveling rubric and 30-60-90 day onboarding playbook.",
    }),
  ],
};

const DELIVERY_AND_METRICS: EngineeringManagerRoadmapSection = {
  id: "delivery-and-metrics",
  title: "Delivery & Engineering Metrics",
  stages: [
    stage("Delivery & Project Execution", {
      status: "personal",
      left: [
        g(
          [
            n("Scrum vs Kanban vs Shape Up", "personal"),
            n("Sprint planning & backlog refinement"),
            n("Estimation & story pointing trade-offs"),
            n("WIP limits & flow optimization"),
          ],
          n("Agile Methodologies")
        ),
      ],
      right: [
        g(
          [
            n("Dependency management across teams", "personal"),
            n("Risk mitigation & critical path analysis"),
            n("Continuous deployment & feature flagging", "personal"),
            n("Transparent progress reporting to leadership"),
          ],
          n("Execution Hygiene")
        ),
      ],
    }),
    stage("Engineering Metrics & Productivity", {
      status: "personal",
      left: [
        g(
          [
            n("Deployment Frequency (DF)", "personal"),
            n("Lead Time for Changes (LTTC)", "personal"),
            n("Change Failure Rate (CFR)", "personal"),
            n("Failed Deployment Recovery Time (MTTR)", "personal"),
          ],
          n("DORA Metrics")
        ),
      ],
      right: [
        g(
          [
            n("The SPACE Framework for productivity", "personal"),
            n("Cycle time & PR review latency"),
            n("Avoiding vanity metrics (LOC, commit counts)"),
            n("Developer Experience (DevEx) & build speeds"),
          ],
          n("SPACE & Holistic DevEx")
        ),
      ],
      noteAfter:
        "Metrics are conversations, not targets. Goodhart's law states that when a measure becomes a target, it ceases to be a good measure.",
    }),
  ],
};

const TECHNICAL_STRATEGY: EngineeringManagerRoadmapSection = {
  id: "technical-strategy",
  title: "Technical Strategy & Architecture Governance",
  stages: [
    stage("Technical Governance", {
      status: "personal",
      left: [
        g(
          [
            n("Crafting 1-3 year technical vision & roadmap", "personal"),
            n("Architecture Decision Records (ADRs)", "personal"),
            n("Tech debt prioritization (20% rule)", "personal"),
            n("Balancing feature delivery vs reliability"),
          ],
          n("Technical Strategy")
        ),
      ],
      right: [
        g(
          [
            n("Build vs Buy vs Open-Source evaluations", "personal"),
            n("Service Level Objectives (SLOs) & Error Budgets", "personal"),
            n("Incident response & on-call health"),
            n("Blameless Postmortems & Root Cause Analysis (RCA)", "personal"),
          ],
          n("Reliability & Architecture")
        ),
      ],
    }),
  ],
};

const LEADERSHIP_AND_COMMUNICATION: EngineeringManagerRoadmapSection = {
  id: "leadership-and-communication",
  title: "Cross-Functional Leadership & Executive Alignment",
  stages: [
    stage("Strategic Alignment & Influence", {
      status: "personal",
      left: [
        g(
          [
            n("The Product Triad (EM + PM + Product Designer)", "personal"),
            n("Translating technical debt into business value", "personal"),
            n("Saying 'No' constructively & scope negotiation"),
            n("Partnering with Sales, Support & Security"),
          ],
          n("Cross-Functional Partnership")
        ),
      ],
      right: [
        g(
          [
            n("Managing Up: Communicating with VPs and CTOs", "personal"),
            n("Quarterly budgeting, tooling & cloud cost optimization"),
            n("Strategic organizational restructuring & scaling"),
            n("High-impact executive presentations"),
          ],
          n("Executive Presence & Org Design")
        ),
      ],
      projectIdea:
        "Write an Architecture Decision Record (ADR) justifying a major tech debt paydown to non-technical stakeholders.",
    }),
  ],
};

export const ENGINEERING_MANAGER_SECTIONS: EngineeringManagerRoadmapSection[] = [
  TRANSITION_AND_MINDSET,
  PEOPLE_MANAGEMENT,
  TEAM_DYNAMICS,
  HIRING_AND_PERFORMANCE,
  DELIVERY_AND_METRICS,
  TECHNICAL_STRATEGY,
  LEADERSHIP_AND_COMMUNICATION,
];
