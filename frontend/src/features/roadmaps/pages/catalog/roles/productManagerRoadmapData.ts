export type ProductManagerRoadmapStatus = "personal" | "alternative" | "optional";

export interface ProductManagerRoadmapNode {
  id: string;
  title: string;
  status?: ProductManagerRoadmapStatus;
  roadmapId?: string;
}

export interface ProductManagerRoadmapGroup {
  id: string;
  parent?: ProductManagerRoadmapNode;
  items: ProductManagerRoadmapNode[];
}

export interface ProductManagerRoadmapStage {
  id: string;
  node: ProductManagerRoadmapNode;
  left?: ProductManagerRoadmapGroup[];
  right?: ProductManagerRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ProductManagerRoadmapSection {
  id: string;
  title?: string;
  stages: ProductManagerRoadmapStage[];
}

export interface ProductManagerRoadmapLink {
  label: string;
  roadmapId: string;
}

export const PRODUCT_MANAGER_MARKERS: Array<{
  status: ProductManagerRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const PRODUCT_MANAGER_RELATED_ROADMAPS: ProductManagerRoadmapLink[] = [
  { label: "Engineering Manager Roadmap", roadmapId: "engineering-manager" },
  { label: "UX Design Roadmap", roadmapId: "ux-design" },
  { label: "Product Design Roadmap", roadmapId: "product-design" },
  { label: "BI Analyst Roadmap", roadmapId: "bi-analyst" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Prompt Engineering Roadmap", roadmapId: "skill-prompt-engineering" },
];

export const PRODUCT_MANAGER_CONTINUE_LEARNING: ProductManagerRoadmapLink[] = [
  { label: "Engineering Manager", roadmapId: "engineering-manager" },
  { label: "AI Product Builder", roadmapId: "skill-ai-product-builders" },
  { label: "BI Analyst", roadmapId: "bi-analyst" },
  { label: "UX Design", roadmapId: "ux-design" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ProductManagerRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ProductManagerRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ProductManagerRoadmapNode[],
  parent?: ProductManagerRoadmapNode,
  customId?: string
): ProductManagerRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ProductManagerRoadmapStage, "id" | "node"> & {
    status?: ProductManagerRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ProductManagerRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FUNDAMENTALS: ProductManagerRoadmapSection = {
  id: "fundamentals",
  stages: [
    stage("Product Management Foundations", {
      status: "personal",
      left: [
        g(
          [
            n("Product vs Project vs Program"),
            n("The Product Triad (Product, Tech, Design)"),
            n("Product Lifecycle Stages (0-to-1 vs Growth)"),
          ],
          n("Core Concepts")
        ),
      ],
      right: [
        g([
          n("Product Thinking & Problem Solving", "personal"),
          n("Business Acumen & Commercial Awareness"),
          n("Technical Fluency for PMs"),
        ]),
      ],
    }),
  ],
};

const DISCOVERY_AND_RESEARCH: ProductManagerRoadmapSection = {
  id: "discovery-and-research",
  title: "Product Discovery & User Research",
  stages: [
    stage("User Research & Insights", {
      status: "personal",
      left: [
        g(
          [
            n("Customer Interview Techniques"),
            n("Survey Design & Quantitative Feedback"),
            n("User Personas & Empathy Maps"),
          ],
          n("Qualitative Research")
        ),
      ],
      right: [
        g([
          n("Jobs To Be Done (JTBD) Framework", "personal"),
          n("Customer Journey Mapping"),
          n("Continuous Discovery Habits"),
        ]),
      ],
    }),
    stage("Market & Competitive Strategy", {
      left: [
        g([
          n("TAM, SAM, SOM Sizing"),
          n("Competitive Benchmarking Matrix"),
          n("SWOT & Five Forces Analysis"),
        ]),
      ],
      right: [
        g([n("Blue Ocean Strategy"), n("Value Proposition Design"), n("Business Model Canvas")]),
      ],
    }),
  ],
};

const STRATEGY_AND_PRIORITIZATION: ProductManagerRoadmapSection = {
  id: "strategy-and-prioritization",
  title: "Strategy, Metrics & Prioritization",
  stages: [
    stage("Product Strategy & Vision", {
      status: "personal",
      left: [
        g([
          n("North Star Metric Definition", "personal"),
          n("Input vs Output Metrics"),
          n("Strategic Pillars & Bet Formulation"),
        ]),
      ],
      right: [
        g([
          n("OKRs & Goal Setting", "personal"),
          n("Product Vision Statement"),
          n("Aligning Strategy with Business Goals"),
        ]),
      ],
    }),
    stage("Prioritization Frameworks", {
      status: "personal",
      left: [
        g([
          n("RICE Scoring (Reach, Impact, Confidence, Effort)", "personal"),
          n("MoSCoW Method (Must, Should, Could, Won't)"),
          n("Value vs Complexity Matrix"),
        ]),
      ],
      right: [
        g([
          n("Kano Model (Delighters vs Basics)"),
          n("Opportunity Solution Trees"),
          n("Cost of Delay (WSJF)"),
        ]),
      ],
    }),
  ],
};

const EXECUTION_AND_DELIVERY: ProductManagerRoadmapSection = {
  id: "execution-and-delivery",
  title: "Execution, Roadmapping & Agile Delivery",
  stages: [
    stage("Roadmap Planning & Specs", {
      status: "personal",
      left: [
        g([
          n("Outcome-based vs Feature Roadmaps", "personal"),
          n("Theme-based Roadmap Formatting (Now, Next, Later)"),
          n("Communicating the Roadmap to Stakeholders"),
        ]),
      ],
      right: [
        g([
          n("Writing Effective PRDs (Product Requirement Docs)", "personal"),
          n("User Story Mapping & Epics"),
          n("Acceptance Criteria (Gherkin/BDD)"),
        ]),
      ],
    }),
    stage("Agile Execution & Backlog Management", {
      left: [
        g([
          n("Scrum vs Kanban vs Shape Up"),
          n("Sprint Planning & Backlog Grooming"),
          n("Sprint Demos & Retrospectives"),
        ]),
      ],
      right: [
        g([
          n("Technical Debt Allocation (20% rule)"),
          n("Managing Blockers & Dependencies"),
          n("Definition of Ready vs Done"),
        ]),
      ],
    }),
  ],
};

const ANALYTICS_AND_EXPERIMENTATION: ProductManagerRoadmapSection = {
  id: "analytics-and-experimentation",
  title: "Product Analytics & Experimentation",
  stages: [
    stage("Metrics & KPI Frameworks", {
      status: "personal",
      left: [
        g([
          n("Pirate Metrics (AARRR: Acquisition to Referral)", "personal"),
          n("Customer Lifetime Value (LTV) & CAC"),
          n("Churn Rate & Retention Cohorts"),
        ]),
      ],
      right: [
        g([
          n("Feature Adoption & Engagement Depth"),
          n("NPS, CSAT & CES Customer Scoring"),
          n("Active Users (DAU, WAU, MAU ratios)"),
        ]),
      ],
    }),
    stage("Experimentation & A/B Testing", {
      left: [
        g([
          n("Formulating Falsifiable Hypotheses"),
          n("Statistical Significance & Sample Sizes"),
          n("Multivariate vs Split Testing"),
        ]),
      ],
      right: [
        g([
          n("Analytics Platforms (Amplitude, Mixpanel, GA4)", "personal"),
          n("Event Tracking Plan & Taxonomy"),
          n("Feature Flagging & Phased Rollouts"),
        ]),
      ],
    }),
  ],
};

const GTM_AND_LEADERSHIP: ProductManagerRoadmapSection = {
  id: "gtm-and-leadership",
  title: "Go-To-Market & Leadership Skills",
  stages: [
    stage("Go-To-Market (GTM) & Launch", {
      status: "personal",
      left: [
        g([
          n("Positioning & Messaging Frameworks"),
          n("Pricing & Packaging Models (Freemium, Tiered)"),
          n("Internal Enablement (Sales, CS, Marketing)"),
        ]),
      ],
      right: [
        g([
          n("Alpha / Beta Pilot Programs", "personal"),
          n("Launch Checklist & Post-Launch Reviews"),
          n("Feedback Loops & Rapid Iteration"),
        ]),
      ],
    }),
    stage("Stakeholder Alignment & Influence", {
      left: [
        g([
          n("Influence Without Authority", "personal"),
          n("Managing Up to Executives"),
          n("Conflict Resolution & Consensus Building"),
        ]),
      ],
      right: [
        g([
          n("AI in Product Management (AI PRDs, Synthetic Personas)", "personal"),
          n("Evaluating AI & LLM Feature Feasibility"),
          n("Ethical & Responsible Product Design"),
        ]),
      ],
    }),
  ],
};

export const PRODUCT_MANAGER_SECTIONS: ProductManagerRoadmapSection[] = [
  FUNDAMENTALS,
  DISCOVERY_AND_RESEARCH,
  STRATEGY_AND_PRIORITIZATION,
  EXECUTION_AND_DELIVERY,
  ANALYTICS_AND_EXPERIMENTATION,
  GTM_AND_LEADERSHIP,
];
