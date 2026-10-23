export type DeveloperRelationsRoadmapStatus = "personal" | "alternative" | "optional";

export interface DeveloperRelationsRoadmapNode {
  id: string;
  title: string;
  status?: DeveloperRelationsRoadmapStatus;
  roadmapId?: string;
}

export interface DeveloperRelationsRoadmapGroup {
  id: string;
  parent?: DeveloperRelationsRoadmapNode;
  items: DeveloperRelationsRoadmapNode[];
}

export interface DeveloperRelationsRoadmapStage {
  id: string;
  node: DeveloperRelationsRoadmapNode;
  left?: DeveloperRelationsRoadmapGroup[];
  right?: DeveloperRelationsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DeveloperRelationsRoadmapSection {
  id: string;
  title?: string;
  stages: DeveloperRelationsRoadmapStage[];
}

export interface DeveloperRelationsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DEVELOPER_RELATIONS_MARKERS: Array<{
  status: DeveloperRelationsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DEVELOPER_RELATIONS_RELATED_ROADMAPS: DeveloperRelationsRoadmapLink[] = [
  { label: "Technical Writer", roadmapId: "technical-writer" },
  { label: "Product Manager", roadmapId: "product-manager" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Git & GitHub", roadmapId: "skill-git-github" },
];

export const DEVELOPER_RELATIONS_CONTINUE_LEARNING: DeveloperRelationsRoadmapLink[] = [
  { label: "Engineering Manager", roadmapId: "engineering-manager" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Product Manager", roadmapId: "product-manager" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Technical Writer", roadmapId: "technical-writer" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DeveloperRelationsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DeveloperRelationsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DeveloperRelationsRoadmapNode[],
  parent?: DeveloperRelationsRoadmapNode,
  customId?: string
): DeveloperRelationsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DeveloperRelationsRoadmapStage, "id" | "node"> & {
    status?: DeveloperRelationsRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): DeveloperRelationsRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: DeveloperRelationsRoadmapSection = {
  id: "foundations-and-landscape",
  title: "Foundations & The DevRel Landscape",
  stages: [
    stage("What is Developer Relations?", {
      status: "personal",
      left: [
        g(
          [
            n("Community: Connecting & nurturing developers", "personal"),
            n("Content: Educating & enabling builders", "personal"),
            n("Product & Code: SDKs, samples & feedback loops", "personal"),
            n("Advocacy vs Evangelism vs Developer Marketing"),
          ],
          n("The 3 Pillars of DevRel")
        ),
      ],
      right: [
        g(
          [
            n("Developer Advocate (DA)", "personal"),
            n("Developer Experience (DX) Engineer", "personal"),
            n("Developer Community Manager"),
            n("Developer Marketer & Technical Growth"),
          ],
          n("DevRel Personas & Roles")
        ),
      ],
      noteAfter:
        "DevRel sits at the intersection of Engineering, Product, and Marketing, acting as the bidirectional conduit between external developers and the internal organization.",
    }),
  ],
};

const DX_AND_ADVOCACY: DeveloperRelationsRoadmapSection = {
  id: "dx-and-advocacy",
  title: "Developer Experience (DX) & Product Evangelism",
  stages: [
    stage("Developer Experience (DX) & Onboarding", {
      status: "personal",
      left: [
        g(
          [
            n("Time to First 'Hello World' (TTFHW) optimization", "personal"),
            n("Conducting Developer Friction Audits", "personal"),
            n("Interactive sandboxes & Web playgrounds (StackBlitz/CodeSandbox)"),
            n("Instant sign-up & zero-friction API key provisioning"),
          ],
          n("Frictionless Onboarding")
        ),
      ],
      right: [
        g(
          [
            n("Idempotency, clear HTTP status codes & intuitive error messages", "personal"),
            n("Multi-language SDK generation (OpenAPI, Fern, Speakeasy)", "personal"),
            n("Copy-pasteable quickstarts & snippet testing"),
            n("CLI tools & modern terminal user experience"),
          ],
          n("API & SDK Ergonomics")
        ),
      ],
      projectIdea:
        "Conduct an end-to-end DX audit of a public developer platform and document TTFHW blockers with actionable recommendations.",
    }),
    stage("Developer Advocacy & Internal Feedback Loops", {
      status: "personal",
      left: [
        g(
          [
            n("Synthesizing external developer feedback for Product", "personal"),
            n("Structuring Voice of Developer (VoD) reports", "personal"),
            n("Filing detailed, actionable bug reports with repros"),
            n("Prioritizing community feature requests with Engineering"),
          ],
          n("Voice of the Developer")
        ),
      ],
      right: [
        g(
          [
            n("Being 'Customer Zero' for internal releases", "personal"),
            n("Running developer alpha/beta early access programs"),
            n("Developer Advisory Boards & Technical Councils"),
            n("Dogfooding upcoming SDKs, APIs & breaking changes"),
          ],
          n("Customer Zero & Early Access")
        ),
      ],
    }),
  ],
};

const TECHNICAL_CONTENT: DeveloperRelationsRoadmapSection = {
  id: "technical-content",
  title: "Technical Content Creation & Education",
  stages: [
    stage("Written Content & Documentation", {
      status: "personal",
      left: [
        g(
          [
            n("Step-by-step tutorials, how-to guides & cookbooks", "personal"),
            n("Architectural deep dives & real-world patterns", "personal"),
            n("Living documentation & automated snippet CI verification"),
            n("Technical SEO & keyword intent for developer queries"),
          ],
          n("Technical Writing")
        ),
      ],
      right: [
        g(
          [
            n("Production-ready starter kits & templates", "personal"),
            n("Clean, well-commented reference architectures", "personal"),
            n("GitHub repository hygiene (README, LICENSE, CI checks)"),
            n("Interactive notebooks & runnable full-stack demos"),
          ],
          n("Code Repositories & Sample Apps")
        ),
      ],
    }),
    stage("Multimedia, Video & Live Streaming", {
      left: [
        g(
          [
            n("Short-form developer video walkthroughs", "personal"),
            n("High-production YouTube tutorials & courses"),
            n("Audio quality & screencasting best practices"),
            n("Byte-sized social code tips & animated diagrams"),
          ],
          n("Video Production")
        ),
      ],
      right: [
        g(
          [
            n("Live coding & pair programming streams (YouTube / Twitch)", "personal"),
            n("Hosting technical podcast interviews with builders"),
            n("Live AMAs (Ask Me Anything) & office hours"),
            n("Gracefully handling unexpected bugs during live demos"),
          ],
          n("Interactive Streaming")
        ),
      ],
    }),
  ],
};

const COMMUNITY_BUILDING: DeveloperRelationsRoadmapSection = {
  id: "community-building",
  title: "Community Building & Engagement",
  stages: [
    stage("Developer Communities & Programs", {
      status: "personal",
      left: [
        g(
          [
            n("Discord vs Slack vs Discourse Forums architecture", "personal"),
            n("Enforcing Code of Conduct (CoC) & anti-harassment", "personal"),
            n("Automated welcoming bots & role-based access"),
            n("Community support SLAs & technical escalation paths"),
          ],
          n("Community Platforms & Moderation")
        ),
      ],
      right: [
        g(
          [
            n("Ambassador & Champions programs (e.g. GitHub Stars)", "personal"),
            n("Developer swag strategy & rewarding contributions"),
            n("Community member spotlights & showcase builds"),
            n("Student, hackathon & academic developer outreach"),
          ],
          n("Advocacy & Champion Programs")
        ),
      ],
    }),
    stage("Hackathons & Developer Events", {
      left: [
        g(
          [
            n("Organizing virtual & in-person hackathons", "personal"),
            n("Designing meaningful hackathon bounties & judging rubrics", "personal"),
            n("Mentoring participants & real-time troubleshooting"),
            n("Project showcases & transparent prize distributions"),
          ],
          n("Hackathon Management")
        ),
      ],
      right: [
        g(
          [
            n("Sponsoring & organizing local tech meetups", "personal"),
            n("Venue logistics & local community co-hosting"),
            n("Hands-on coding workshops & lab exercises"),
            n("Fostering organic local developer networks"),
          ],
          n("Meetups & User Groups")
        ),
      ],
      projectIdea:
        "Design a complete curriculum for a 2-hour interactive developer workshop including repository, presentation, and troubleshooting guide.",
    }),
  ],
};

const PUBLIC_SPEAKING: DeveloperRelationsRoadmapSection = {
  id: "public-speaking",
  title: "Public Speaking & Event Evangelism",
  stages: [
    stage("Conferences & Workshops", {
      status: "personal",
      left: [
        g(
          [
            n("Writing compelling Call for Proposals (CFPs)", "personal"),
            n("Technical keynote storytelling arcs & narrative tension", "personal"),
            n("Slide design: high visual impact, low text clutter"),
            n("Rehearsing timing & contingency plans for live demos"),
          ],
          n("CFPs & Talk Preparation")
        ),
      ],
      right: [
        g(
          [
            n("Engaging, non-salesy interactive booth demos", "personal"),
            n("Hallway track networking & building peer trust"),
            n("Live conference coverage & social engagement"),
            n("Post-event community follow-up & relationship tracking"),
          ],
          n("Event Presence & Hallway Track")
        ),
      ],
    }),
  ],
};

const DEVREL_METRICS: DeveloperRelationsRoadmapSection = {
  id: "devrel-metrics",
  title: "DevRel Metrics, Analytics & Business Value",
  stages: [
    stage("Measuring Impact & Community ROI", {
      status: "personal",
      left: [
        g(
          [
            n("The Orbit Model: Love, Reach, Gravity, Presence", "personal"),
            n("Orbit levels (L1 Observers to L4 Insiders)", "personal"),
            n("Tracking member journeys & progression"),
            n("Community health vs vanity subscriber counts"),
          ],
          n("The Orbit Model")
        ),
      ],
      right: [
        g(
          [
            n("Community Qualified Leads (CQLs) vs MQLs", "personal"),
            n("Developer activation rates & 30-day retention", "personal"),
            n("API consumption & SDK package download trends"),
            n("Demonstrating DevRel ROI & business impact to leadership"),
          ],
          n("Funnel & Business Metrics")
        ),
      ],
      noteAfter:
        "DevRel generates long-term compounding value. Connecting community growth to product adoption and developer sentiment demonstrates undeniable business impact.",
    }),
  ],
};

const OPEN_SOURCE_STRATEGY: DeveloperRelationsRoadmapSection = {
  id: "open-source-strategy",
  title: "Open Source Strategy & Ecosystem Expansion",
  stages: [
    stage("Open Source & Ecosystem Partnerships", {
      status: "personal",
      left: [
        g(
          [
            n("Open source licensing (MIT, Apache 2.0, BSD)", "personal"),
            n("Contributor License Agreements (CLAs) & DCO"),
            n("Writing CONTRIBUTING.md, issue templates & triage workflows", "personal"),
            n("Nurturing and recognizing external OSS maintainers"),
          ],
          n("Open Source Governance")
        ),
      ],
      right: [
        g(
          [
            n("Partner integrations & developer marketplace extensions", "personal"),
            n("Developer grant programs & venture ecosystem grants"),
            n("Participation in industry working groups (W3C, CNCF, Linux Foundation)"),
            n("Ecosystem interoperability & open standard evangelism"),
          ],
          n("Ecosystem Partnerships")
        ),
      ],
      projectIdea:
        "Create an open source contribution kit with automated GitHub actions, PR templates, and a clear contributor governance model.",
    }),
  ],
};

export const DEVELOPER_RELATIONS_SECTIONS: DeveloperRelationsRoadmapSection[] = [
  FOUNDATIONS,
  DX_AND_ADVOCACY,
  TECHNICAL_CONTENT,
  COMMUNITY_BUILDING,
  PUBLIC_SPEAKING,
  DEVREL_METRICS,
  OPEN_SOURCE_STRATEGY,
];
