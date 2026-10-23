export type ProductDesignRoadmapStatus = "personal" | "alternative" | "optional";

export interface ProductDesignRoadmapNode {
  id: string;
  title: string;
  status?: ProductDesignRoadmapStatus;
  roadmapId?: string;
}

export interface ProductDesignRoadmapGroup {
  id: string;
  parent?: ProductDesignRoadmapNode;
  items: ProductDesignRoadmapNode[];
}

export interface ProductDesignRoadmapStage {
  id: string;
  node: ProductDesignRoadmapNode;
  left?: ProductDesignRoadmapGroup[];
  right?: ProductDesignRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ProductDesignRoadmapSection {
  id: string;
  title?: string;
  stages: ProductDesignRoadmapStage[];
}

export interface ProductDesignRoadmapLink {
  label: string;
  roadmapId: string;
}

export const PRODUCT_DESIGN_MARKERS: Array<{
  status: ProductDesignRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const PRODUCT_DESIGN_RELATED_ROADMAPS: ProductDesignRoadmapLink[] = [
  { label: "UX Design Roadmap", roadmapId: "ux-design" },
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Design System", roadmapId: "skill-design-system" },
];

export const PRODUCT_DESIGN_CONTINUE_LEARNING: ProductDesignRoadmapLink[] = [
  { label: "UX Design", roadmapId: "ux-design" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "Design System", roadmapId: "skill-design-system" },
  { label: "AI Product Builders", roadmapId: "skill-ai-product-builders" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ProductDesignRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ProductDesignRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ProductDesignRoadmapNode[],
  parent?: ProductDesignRoadmapNode,
  customId?: string
): ProductDesignRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ProductDesignRoadmapStage, "id" | "node"> & {
    status?: ProductDesignRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ProductDesignRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: ProductDesignRoadmapSection = {
  id: "foundations",
  stages: [
    stage("Introduction", {
      right: [g([n("Product Design vs UX"), n("Product Design vs UI")])],
    }),
    stage("Defining Success", {
      left: [
        g([
          n("Goal Setting"),
          n("Product Vision"),
          n("Value Proposition"),
          n("Product-Market Fit"),
          n("Success Metrics"),
        ]),
      ],
    }),
    stage("Design Principles", {
      right: [
        g([
          n("User-Centered Design"),
          n("Functionality over Polish"),
          n("Consistency & Coherence"),
          n("Collaboration by Design"),
          n("Iteration over Perfection"),
        ]),
      ],
    }),
  ],
};

const DISCOVER: ProductDesignRoadmapSection = {
  id: "discover",
  title: "Discover",
  stages: [
    stage("Gathering Information", {
      left: [g([n("Contextual Inquiry"), n("Surveys"), n("Heatmaps"), n("Session Recordings")])],
    }),
    stage("Mapping Context", {
      right: [g([n("Journey Mapping"), n("Task Analysis")])],
    }),
    stage("Organizing Research", {
      right: [g([n("Synthesizing Research"), n("Research Repository")])],
    }),
  ],
};

const DEFINE: ProductDesignRoadmapSection = {
  id: "define",
  title: "Define",
  stages: [
    stage("Framing the Problem", {
      left: [
        g([
          n("Personas"),
          n("Empathy Maps"),
          n("Jobs-to-be-Done"),
          n("Problem Statements"),
          n("How Might We Questions"),
        ]),
      ],
    }),
    stage("Prioritizing Opportunities", {
      right: [
        g([
          n("Product Sense"),
          n("Business & User Needs"),
          n("Opportunity Solution Trees"),
          n("Priorization Frameworks"),
        ]),
      ],
    }),
  ],
};

const STRATEGY_AND_PLANNING: ProductDesignRoadmapSection = {
  id: "strategy-and-planning",
  title: "Strategy & Planning",
  stages: [
    stage("Business Alignment", {
      left: [g([n("Business Understanding"), n("Product Strategy"), n("Business Metrics & OKRs")])],
    }),
    stage("Aligning Teams", {
      left: [
        g([n("Stakeholder Alignment"), n("Agile UX, Lean UX"), n("Design Workshops & Sprints")]),
      ],
    }),
    stage("Managing Risk", {
      right: [g([n("Assumption Mapping"), n("Risk Identification")])],
    }),
  ],
};

const DESIGN_THE_EXPERIENCE: ProductDesignRoadmapSection = {
  id: "design-the-experience",
  title: "Design the Experience",
  stages: [
    stage("UX Design", {
      roadmapId: "ux-design",
    }),
    stage("Information Architecture", {
      left: [g([n("Site Maps"), n("Navigation"), n("Content Organization")])],
      right: [g([n("User Flows"), n("Task Flows")])],
    }),
    stage("Ideation", {
      left: [
        g([n("Brainstorming"), n("Mind Maps"), n("Sketching"), n("Wireframing"), n("Prototyping")]),
      ],
    }),
  ],
};

const VALIDATE: ProductDesignRoadmapSection = {
  id: "validate",
  title: "Validate",
  stages: [
    stage("Testing Designs", {
      right: [g([n("Usability Testing"), n("Accessibility Testing")])],
    }),
    stage("Measuring Quality", {
      right: [g([n("UX Benchmarking"), n("Expert Review")])],
    }),
    stage("Improving Designs", {
      left: [g([n("Critiques & Reviews")])],
    }),
  ],
};

const BUILD_THE_INTERFACE: ProductDesignRoadmapSection = {
  id: "build-the-interface",
  title: "Build the Interface",
  stages: [
    stage("Visual Foundations", {
      right: [g([n("Color"), n("Layout & Grid"), n("Icons"), n("Visual Hierarchy")])],
    }),
    stage("Interface Design", {
      left: [g([n("Components"), n("UI Patterns"), n("Design Tokens"), n("Interface States")])],
    }),
    stage("Motion & Interaction", {
      right: [g([n("Micro-interactions"), n("Motion Principles")])],
    }),
    stage("Content Design", {
      left: [g([n("UX Writing"), n("Voice & Tone"), n("Microcopy")])],
    }),
    stage("Designing Responsibly", {
      right: [g([n("Inclusive Design"), n("Ethical Design")])],
    }),
    stage("AI-Assisted Design", {
      left: [g([n("AI Product Builders", undefined, "skill-ai-product-builders")])],
    }),
  ],
};

const WORKING_WITH_ENGINEERING: ProductDesignRoadmapSection = {
  id: "working-with-engineering",
  title: "Working with Engineering",
  stages: [
    stage("Technical Constraints", {
      right: [
        g([
          n("Stack & Platform Constraints"),
          n("API & Data Limitations"),
          n("Performance Constraints"),
        ]),
      ],
    }),
    stage("Feasibility Assessment"),
    stage("Design Handoff", {
      left: [g([n("Specs"), n("Edge Cases & States")])],
      right: [g([n("Figma Dev Mode"), n("Zeplin")], n("Handoff Tools"))],
    }),
    stage("Launch Readiness"),
    stage("Developer Collaboration"),
  ],
};

const SHIP_AND_SCALE: ProductDesignRoadmapSection = {
  id: "ship-and-scale",
  title: "Ship & Scale",
  stages: [
    stage("Design Systems", {
      right: [g([n("Design System", undefined, "skill-design-system")])],
    }),
    stage("Operating at Scale", {
      left: [g([n("DesignOps")])],
    }),
    stage("Multi-platform Design"),
  ],
};

const MEASURE_AND_ITERATE: ProductDesignRoadmapSection = {
  id: "measure-and-iterate",
  title: "Measure & Iterate",
  stages: [
    stage("Product Performance", {
      right: [g([n("Product Analytics"), n("HEART Framework")])],
    }),
    stage("Experimentation", {
      left: [g([n("A/B Testing"), n("Feature Flags")])],
    }),
    stage("Continuous Improvement"),
  ],
};

export const PRODUCT_DESIGN_SECTIONS: ProductDesignRoadmapSection[] = [
  FOUNDATIONS,
  DISCOVER,
  DEFINE,
  STRATEGY_AND_PLANNING,
  DESIGN_THE_EXPERIENCE,
  VALIDATE,
  BUILD_THE_INTERFACE,
  WORKING_WITH_ENGINEERING,
  SHIP_AND_SCALE,
  MEASURE_AND_ITERATE,
];
