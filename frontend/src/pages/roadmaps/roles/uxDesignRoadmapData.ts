export type UxDesignNodeKind = "topic" | "subtopic";

export interface UxDesignRoadmapNode {
  id: string;
  title: string;
}

export interface UxDesignRoadmapBranch {
  id: string;
  node?: UxDesignRoadmapNode;
  label?: string;
  items: UxDesignRoadmapNode[];
}

export interface UxDesignRoadmapStage {
  id: string;
  node: UxDesignRoadmapNode;
  leftTitle?: string;
  rightTitle?: string;
  left?: UxDesignRoadmapBranch[];
  right?: UxDesignRoadmapBranch[];
}

const n = (id: string, title: string): UxDesignRoadmapNode => ({ id, title });

const b = (
  id: string,
  items: UxDesignRoadmapNode[],
  options: { node?: UxDesignRoadmapNode; label?: string } = {}
): UxDesignRoadmapBranch => ({
  id,
  node: options.node,
  label: options.label,
  items,
});

export const UX_DESIGN_LEGEND: Array<{
  kind: UxDesignNodeKind;
  label: string;
}> = [
  { kind: "topic", label: "Key topics to learn" },
  { kind: "subtopic", label: "Subtopics" },
];

export interface UxDesignRoadmapLink {
  label: string;
  roadmapId: string;
}

export const UX_DESIGN_RELATED_ROADMAPS: UxDesignRoadmapLink[] = [
  { label: "Product Design", roadmapId: "product-design" },
  { label: "AI Product Builders", roadmapId: "skill-ai-product-builders" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "Design System", roadmapId: "skill-design-system" },
];

export const UX_DESIGN_CONTINUE_LEARNING: UxDesignRoadmapLink[] = [
  { label: "Product Design", roadmapId: "product-design" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "Design System", roadmapId: "skill-design-system" },
  { label: "AI Product Builders", roadmapId: "skill-ai-product-builders" },
];

export const UX_DESIGN_STAGES: UxDesignRoadmapStage[] = [
  {
    id: "human-decision-making",
    node: n("human-decision-making", "Human Decision Making"),
    left: [
      b(
        "frameworks",
        [
          n("bj-fogg-behavior-model", "BJ Fogg's Behavior Model"),
          n("create-action-funnel", "CREATE Action Funnel"),
          n("spectrum-thinking-interventions", "Spectrum of Thinking Interventions"),
          n("dual-process-theory", "Dual Process Theory"),
        ],
        { label: "Frameworks" }
      ),
    ],
    right: [
      b(
        "buzzwords",
        [
          n("nudge-theory", "Nudge Theory"),
          n("persuasive-technology", "Persuasive Technology"),
          n("behavioral-science", "Behavioral Science"),
          n("behavioral-economics", "Behavioral Economics"),
          n("behavior-design", "Behavior Design"),
        ],
        { label: "Buzzwords to lookout for" }
      ),
    ],
  },
  {
    id: "behavior-change-strategies",
    node: n("behavior-change-strategies", "Behavior Change Strategies"),
    left: [
      b("behavior-grid", [n("bj-fogg-behavior-grid", "BJ Fogg's Behavior Grid")], {
        label: "Classifying Behavior",
      }),
    ],
  },
  {
    id: "cheating",
    node: n("cheating", "Cheating"),
    right: [
      b("cheating-strategies", [
        n("defaulting", "Defaulting"),
        n("making-it-incidental", "Making it Incidental"),
        n("automate-repetition", "Automate the Act of Repetition"),
      ]),
    ],
  },
  {
    id: "make-or-change-habits",
    node: n("make-or-change-habits", "Make or Change Habits"),
    left: [
      b(
        "existing-behavior",
        [
          n("help-user-avoid-cue", "Help user Avoiding the Cue"),
          n("replace-routine", "Replace the Routine"),
          n("use-consciousness", "Use Consciousness to Interfere"),
          n("mindfulness-avoid-cue", "Mindfulness to Avoid Acting on the Cue"),
          n("crowd-out-old-habit", "Crowd Out Old Habit with New Behavior"),
        ],
        { node: n("existing-behavior-group", "Existing Behavior") }
      ),
      b(
        "new-behavior",
        [
          n("nir-eyal-hook-model", "Nir Eyal's Hook Model"),
          n("cue-routine-reward-model", "Cue Routine Reward Model"),
        ],
        { node: n("new-behavior-group", "New Behavior") }
      ),
    ],
  },
  {
    id: "support-conscious-action",
    node: n("support-conscious-action", "Support Conscious Action"),
  },
  {
    id: "educate-encourage-user",
    node: n("educate-encourage-user", "Educate & Encourage User"),
  },
  {
    id: "help-user-think-action",
    node: n("help-user-think-action", "Help User think about their Action"),
  },
  {
    id: "create-user-personas",
    node: n("create-user-personas", "Create User Personas"),
  },
  {
    id: "understanding-product",
    node: n("understanding-product", "Understanding the Product"),
    left: [b("define-target-users", [], { label: "Define Target Users" })],
    right: [
      b(
        "clarify-product",
        [
          n("target-outcome", "Target Outcome"),
          n("target-actor", "Target Actor"),
          n("target-action", "Target Action"),
        ],
        { label: "Clarify Product" }
      ),
      b("business-model-label", [], { label: "Business Model" }),
      b(
        "existing-business-model",
        [n("business-model-canvas", "Business Model Canvas"), n("lean-canvas", "Lean Canvas")],
        { node: n("existing-business-model-group", "Existing Business Model") }
      ),
      b(
        "new-business-model",
        [
          n("business-model-inspirator", "Business Model Inspirator"),
          n("competitor-analysis", "Competitor Analysis"),
          n("five-forces-model", "Five Forces Model"),
          n("swot-analysis", "SWOT Analysis"),
        ],
        { node: n("new-business-model-group", "New Business Model") }
      ),
    ],
  },
  {
    id: "conceptual-design",
    node: n("conceptual-design", "Conceptual Design"),
    left: [
      b("product-backlog", [n("user-stories", "User Stories")], {
        label: "Create Product Backlog",
      }),
      b(
        "things-to-lookout",
        [
          n("keep-short-simple", "In general, keep it short and simple"),
          n("easy-understand-complete", "Make it easy to understand and complete"),
          n("progress-visible", "Make progress visible to user"),
          n("progress-meaningful", "Make progress meaningful to reward user"),
          n("successful-completion-visible", "Make successful completion clearly visible"),
        ],
        { label: "Things to lookout for" }
      ),
      b(
        "deliverables",
        [
          n("customer-experience-map", "Customer Experience Map by Mel Edwards"),
          n("simple-flowchart", "Simple Flowchart"),
          n("event-driven-process-chain", "Event-driven Process Chain Model (EPC)"),
          n("bpmn", "Business Process Model & Notation (BPMN)"),
        ],
        { label: "Deliverables" }
      ),
    ],
  },
  {
    id: "prototyping",
    node: n("prototyping", "Prototyping"),
    leftTitle: "Wireframing",
    left: [
      b("wireframing-tools", [
        n("figma", "Figma"),
        n("sketch", "Sketch"),
        n("balsamiq", "Balsamiq"),
      ]),
      b("layout-rules", [n("good-layout-rules", "Good Layout Rules")]),
    ],
    rightTitle: "UX Patterns",
    right: [
      b(
        "attention-patterns",
        [
          n("call-to-action", "Call to Action"),
          n("how-to-tips", "How-to-Tips"),
          n("status-reports", "Status Reports"),
          n("reminders-planning", "Reminders & Planning Prompts"),
        ],
        { label: "When attention is fleeting and scarce" }
      ),
      b(
        "influence-patterns",
        [
          n("behavior-change-games", "Behavior Change Games"),
          n("decision-making-support", "Decision-Making Support"),
          n("gamification", "Gamification"),
          n("goal-trackers", "Goal Trackers"),
          n("reminders", "Reminders"),
          n("social-sharing", "Social Sharing"),
          n("tutorials", "Tutorials"),
          n("planners", "Planners"),
        ],
        { label: "with many chances to influence user" }
      ),
    ],
  },
  {
    id: "ux-best-practices",
    node: n("ux-best-practices", "UX Best Practices"),
    left: [
      b(
        "getting-attention",
        [
          n("tell-user-action", "Tell User what the Action is and ask for it"),
          n("clear-page-distractions", "Clear the Page of Distractions"),
          n("make-clear-where-act", "Make it Clear, Where to Act"),
        ],
        { label: "Getting Users Attention" }
      ),
      b(
        "positive-reaction",
        [
          n("professional-beautiful", "Make UI Professional and Beautiful"),
          n("strong-authority", "Deploy Strong Authority on Subject"),
          n("authentic-personal", "Be Authentic and Personal"),
          n("social-proof", "Deploy Social Proof"),
        ],
        { label: "Getting Positive Intuitive Reaction" }
      ),
      b(
        "conscious-evaluation",
        [
          n("prime-associations", "Prime User-Relevant Associations"),
          n("avoid-direct-payments", "Avoid Direct Payments"),
          n("avoid-choice-overload", "Avoid Choice Overload"),
          n("avoid-cognitive-overhead", "Avoid Cognitive Overhead"),
          n("leverage-loss-aversion", "Leverage Loss-Aversion"),
          n("peer-comparisons", "Use Peer Comparisons"),
          n("use-competition", "Use Competition"),
        ],
        { label: "Get a favorable Conscious Evaluation" }
      ),
      b(
        "urgency",
        [
          n("avoid-temporal-myopia", "Frame Text to Avoid Temporal Myopia"),
          n("prior-commitment", "Remind of Prior Commitment to Act"),
          n("commitment-friends", "Make Commitment to Friends"),
          n("reward-scarce", "Make Reward Scarce"),
        ],
        { label: "Creating Urgency to Act Now" }
      ),
      b(
        "make-easy",
        [
          n("implementation-intentions", "Elicit Implementation Intentions"),
          n("default-everything", "Default Everything"),
          n("lessen-burden", "Lessen the Burden of Action / Info"),
          n("peer-comparisons-easy", "Deploy Peer Comparisons"),
        ],
        { label: "Make sure Users can do it Easily" }
      ),
    ],
  },
  {
    id: "measuring-impact",
    node: n("measuring-impact", "Measuring the Impact"),
    left: [
      b(
        "testing-methods",
        [
          n("multivariate-testing", "Multivariate Testing"),
          n("incremental-ab-testing", "Incremental A/B Testing"),
        ],
        { label: "Testing" }
      ),
    ],
    right: [
      b("gather-lessons", [
        n("gather-lessons-prioritize", "Gather Lessons, Prioritize & Integrate"),
      ]),
    ],
  },
];
