export type TechnicalWriterRoadmapStatus = "personal" | "alternative" | "optional";

export interface TechnicalWriterRoadmapNode {
  id: string;
  title: string;
  status?: TechnicalWriterRoadmapStatus;
  roadmapId?: string;
}

export interface TechnicalWriterRoadmapGroup {
  id: string;
  parent?: TechnicalWriterRoadmapNode;
  items: TechnicalWriterRoadmapNode[];
}

export interface TechnicalWriterRoadmapStage {
  id: string;
  node: TechnicalWriterRoadmapNode;
  left?: TechnicalWriterRoadmapGroup[];
  right?: TechnicalWriterRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface TechnicalWriterRoadmapSection {
  id: string;
  title?: string;
  stages: TechnicalWriterRoadmapStage[];
}

export interface TechnicalWriterRoadmapLink {
  label: string;
  roadmapId: string;
}

export const TECHNICAL_WRITER_MARKERS: Array<{
  status: TechnicalWriterRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const TECHNICAL_WRITER_RELATED_ROADMAPS: TechnicalWriterRoadmapLink[] = [
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
  { label: "API Design Roadmap", roadmapId: "skill-api-design" },
  { label: "Developer Relations", roadmapId: "developer-relations" },
];

export const TECHNICAL_WRITER_CONTINUE_LEARNING: TechnicalWriterRoadmapLink[] = [
  { label: "Developer Relations", roadmapId: "developer-relations" },
  { label: "Product Manager", roadmapId: "product-manager" },
  { label: "UX Design", roadmapId: "ux-design" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "QA", roadmapId: "qa" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: TechnicalWriterRoadmapStatus,
  roadmapId?: string,
  customId?: string
): TechnicalWriterRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: TechnicalWriterRoadmapNode[],
  parent?: TechnicalWriterRoadmapNode,
  customId?: string
): TechnicalWriterRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<TechnicalWriterRoadmapStage, "id" | "node"> & {
    status?: TechnicalWriterRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): TechnicalWriterRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: TechnicalWriterRoadmapSection = {
  id: "foundations",
  title: "Core Foundations & Principles",
  stages: [
    stage("Writing Fundamentals", {
      left: [
        g([
          n("Clarity, Conciseness & Precision", "personal"),
          n("Active Voice vs Passive Voice"),
          n("Eliminating Jargon & Ambiguity"),
          n("Consistent Terminology & Tone"),
          n("Plain Language Principles"),
        ]),
      ],
      right: [
        g([
          n("Task-Oriented Writing", "personal"),
          n("Chunking & Progressive Disclosure"),
          n("Scannability: Headings, Lists & Bold Terms"),
          n("Writing Compelling Introductions"),
          n("Crafting Helpful Error Messages"),
        ]),
      ],
    }),
    stage("Audience & Needs Analysis", {
      left: [
        g([
          n("Reader Personas (Devs, SysAdmins, End Users)", "personal"),
          n("Assessing Prior Knowledge & Tech Literacy"),
          n("Identifying User Goals & Friction Points"),
          n("Mapping the User Onboarding Journey", "personal"),
        ]),
      ],
      right: [
        g([
          n("Interviewing Target Users"),
          n("Support Ticket & Community Forum Mining"),
          n("Telemetry & Search Log Analysis"),
          n("Writing for Global & Multilingual Audiences", "personal"),
        ]),
      ],
    }),
    stage("Information Architecture", {
      left: [
        g(
          [
            n("Tutorials: Learning-oriented lessons", "personal"),
            n("How-To Guides: Goal-oriented problem solving", "personal"),
            n("Reference: Information-oriented technical specs", "personal"),
            n("Explanation: Understanding-oriented background", "personal"),
          ],
          n("Diátaxis Framework", "personal")
        ),
      ],
      right: [
        g([
          n("Taxonomy & Navigation Hierarchies", "personal"),
          n("Table of Contents & Sidebar Structure"),
          n("Cross-Referencing & Related Links Strategy"),
          n("Search Engine Optimization (SEO) for Docs"),
          n("Breadcrumbs & URL Design"),
        ]),
      ],
      noteAfter:
        "The Diátaxis documentation framework is the gold standard for modern tech documentation — strictly separate tutorials, how-tos, reference, and explanation.",
      projectIdea:
        "Project: Take an existing open-source tool's README and restructure it into the 4 Diátaxis quadrants.",
    }),
  ],
};

const TECHNICAL_SKILLS_AND_MARKUP: TechnicalWriterRoadmapSection = {
  id: "technical-skills-and-markup",
  title: "Technical Skills & Authoring Formats",
  stages: [
    stage("Markup Languages", {
      left: [
        g(
          [
            n("GitHub Flavored Markdown (GFM)", "personal"),
            n("CommonMark Specification"),
            n("Frontmatter (YAML Metadata)", "personal"),
            n("MDX (JSX in Markdown)", "personal"),
          ],
          n("Markdown", "personal")
        ),
      ],
      right: [
        g([
          n("AsciiDoc (Enterprise & Book Authoring)", "alternative"),
          n("HTML5 Semantic Tags & Elements", "personal"),
          n("CSS Basics for Doc Styling"),
          n("reStructuredText (Sphinx / Python Docs)", "alternative"),
        ]),
      ],
    }),
    stage("Technical & Dev Literacy", {
      left: [
        g([
          n("Command Line & Terminal Navigation", "personal"),
          n("JSON & YAML Data Structures", "personal"),
          n("Reading Code Snippets (JavaScript, Python)", "personal"),
          n("Browser Developer Tools (Network, Console)"),
        ]),
      ],
      right: [
        g([
          n("Package Managers (npm, pip, cargo)"),
          n("Regular Expressions (RegEx) for Mass Edits", "personal"),
          n("Docker Basics for Running Local Services", "optional", "skill-docker"),
          n("Environment Variables & Config Files"),
        ]),
      ],
    }),
    stage("Visuals & Technical Diagrams", {
      left: [
        g(
          [
            n("Mermaid.js (Flowcharts, Sequences, State)", "personal"),
            n("PlantUML & Graphviz", "alternative"),
            n("C4 Model for Architecture Diagrams", "personal"),
            n("Entity Relationship (ER) Diagrams"),
          ],
          n("Diagrams-as-Code", "personal")
        ),
      ],
      right: [
        g([
          n("Screenshot Annotation Best Practices", "personal"),
          n("Clean Terminal & UI Recording (asciinema, CleanShot)"),
          n("Animated GIFs vs Short Videos"),
          n("SVG Image Optimization & Alt Text", "personal"),
        ]),
      ],
      noteAfter:
        "Code-based diagrams like Mermaid.js enable versioning diagrams alongside text directly in Git, making visual updates effortless.",
      projectIdea:
        "Project: Design an architecture and sequence diagram in Mermaid.js describing an OAuth 2.0 authorization code flow.",
    }),
  ],
};

const DOCS_AS_CODE: TechnicalWriterRoadmapSection = {
  id: "docs-as-code",
  title: "Docs-as-Code & Version Control",
  stages: [
    stage("Git & Version Control", {
      roadmapId: "skill-git-github",
      left: [
        g([
          n("Git Basics: clone, branch, commit, push, pull", "personal"),
          n("Git Rebase & Resolving Merge Conflicts", "personal"),
          n("Conventional Commits & Semantic Messages"),
          n("Git Stash & Cherry-Pick"),
        ]),
      ],
      right: [
        g([
          n("GitHub / GitLab Pull Request Workflows", "personal"),
          n("Code Review Etiquette for Docs PRs", "personal"),
          n("Trunk-Based Development & Branching Rules"),
          n("Forking & Contributing to Open Source"),
        ]),
      ],
    }),
    stage("Static Site Generators", {
      left: [
        g(
          [
            n("Docusaurus (React-based)", "personal"),
            n("VitePress (Vue-based)", "alternative"),
            n("Starlight / Astro", "alternative"),
            n("Nextra (Next.js)", "optional"),
          ],
          n("Node / Modern SSGs", "personal")
        ),
      ],
      right: [
        g(
          [
            n("MkDocs & Material for MkDocs", "personal"),
            n("Hugo (Fast Go-based SSG)", "alternative"),
            n("Sphinx (Python Documentation)", "alternative"),
            n("GitBook & Read the Docs Hosted Platforms", "optional"),
          ],
          n("Python / Go SSGs")
        ),
      ],
    }),
    stage("Doc Automation & CI/CD", {
      left: [
        g(
          [
            n("Vale (Syntax-aware Prose Linter)", "personal"),
            n("markdownlint (Markdown Formatting)", "personal"),
            n("cspell (Technical Spell Checking)", "personal"),
            n("alex / textlint (Catching insensitive prose)"),
          ],
          n("Linters & Quality Gates", "personal")
        ),
      ],
      right: [
        g([
          n("GitHub Actions for Docs Build & Deploy", "personal"),
          n("Automated Dead Link Checking (lychee, markdown-link-check)", "personal"),
          n("Preview Deployments (Vercel, Netlify, Cloudflare Pages)", "personal"),
          n("Doc Testing: Testing Code Snippets in CI"),
        ]),
      ],
      noteAfter:
        "Docs-as-code treats documentation with the same rigor as code: version-controlled, reviewed via pull requests, and verified with automated CI linters.",
      projectIdea:
        "Project: Set up a documentation site using Docusaurus or Material for MkDocs with GitHub Actions running Vale and link checking.",
    }),
  ],
};

const API_DOCUMENTATION: TechnicalWriterRoadmapSection = {
  id: "api-documentation",
  title: "API & Developer Documentation",
  stages: [
    stage("API Fundamentals", {
      roadmapId: "skill-api-design",
      left: [
        g([
          n("RESTful Architecture Principles", "personal"),
          n("HTTP Methods: GET, POST, PUT, DELETE, PATCH", "personal"),
          n("HTTP Status Codes (200, 201, 400, 401, 403, 404, 429, 500)", "personal"),
          n("Request Headers, Body & Query Parameters"),
          n("JSON Request & Response Schemas", "personal"),
        ]),
      ],
      right: [
        g([
          n("Authentication: Bearer Tokens & API Keys", "personal"),
          n("OAuth 2.0 Client Credentials & Auth Codes"),
          n("Rate Limiting, Throttling & Headers (Retry-After)", "personal"),
          n("Pagination Patterns (Cursor vs Offset)"),
          n("Idempotency Keys & Retry Logic"),
        ]),
      ],
    }),
    stage("OpenAPI & Interactive Specs", {
      left: [
        g(
          [
            n("OpenAPI Specification (OAS 3.0 & 3.1)", "personal"),
            n("Writing OAS YAML Schemas", "personal"),
            n("Components, Paths & SecuritySchemes", "personal"),
            n("Reusing Schemas with $ref"),
          ],
          n("OpenAPI / Swagger", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Swagger UI & Redoc", "personal"),
            n("Mintlify & ReadMe Platforms", "personal"),
            n("Postman Collections & Environments", "personal"),
            n("Documenting Webhooks & Event Payloads", "personal"),
            n("GraphQL Documentation & Schemas", "optional", "skill-graphql"),
          ],
          n("API Doc Portals & Tools")
        ),
      ],
    }),
    stage("Code Samples & SDK Docs", {
      left: [
        g([
          n("Writing Multi-Language Code Snippets (curl, Python, JS)", "personal"),
          n("Copy-Paste Runnable Code Policy", "personal"),
          n("Quickstart Guides: First Request in 5 Minutes", "personal"),
          n("Interactive API Playgrounds & Sandboxes"),
        ]),
      ],
      right: [
        g([
          n("SDK Installation & Initialization Guides", "personal"),
          n("Error Handling & Troubleshooting Guides", "personal"),
          n("Mock Servers & Testing Credentials"),
          n("Changelog & Breaking API Changes Policy", "personal"),
        ]),
      ],
      noteAfter:
        "Developer documentation succeeds or fails on the quality of its code snippets. Ensure every sample is syntax-highlighted, runnable, and includes realistic sample responses.",
      projectIdea:
        "Project: Author an OpenAPI 3.1 specification for a microservice and publish interactive docs using Redoc or Mintlify.",
    }),
  ],
};

const EDITORIAL_AND_COLLABORATION: TechnicalWriterRoadmapSection = {
  id: "editorial-and-collaboration",
  title: "Review, Editing & SME Collaboration",
  stages: [
    stage("Working with SMEs", {
      left: [
        g([
          n("Conducting Effective SME Interviews", "personal"),
          n("Writing Preparation Questionnaires"),
          n("Extracting Implicit Knowledge"),
          n("Managing Technical Reviews & Pushback", "personal"),
        ]),
      ],
      right: [
        g([
          n("Documenting Unreleased Features in Sprints"),
          n("Joining Architecture & Product Design Reviews"),
          n("Unblocking Stalled Reviews & Escalation"),
          n("Building Trust with Engineering Teams", "personal"),
        ]),
      ],
    }),
    stage("Style Guides & Standards", {
      left: [
        g(
          [
            n("Google Developer Documentation Style Guide", "personal"),
            n("Microsoft Writing Style Guide", "personal"),
            n("The Chicago Manual of Style (CMOS)", "alternative"),
            n("AP Stylebook (for Press & Public comms)", "optional"),
          ],
          n("Industry Style Guides", "personal")
        ),
      ],
      right: [
        g([
          n("Creating a Company Style Guide", "personal"),
          n("Approved Terminology & Glossary Management", "personal"),
          n("Brand Voice & Tone Guidelines"),
          n("Codifying Rules into Custom Vale Styles", "personal"),
        ]),
      ],
    }),
    stage("Editing & Review Processes", {
      left: [
        g([
          n("Developmental & Structural Editing", "personal"),
          n("Technical Accuracy Reviews with Engineers", "personal"),
          n("Copyediting & Mechanical Editing"),
          n("Proofreading & Final Polish"),
        ]),
      ],
      right: [
        g([
          n("Peer Reviews among Technical Writers", "personal"),
          n("Usability Testing Docs with Beta Users", "personal"),
          n("Managing Style Exceptions & Deprecations"),
          n("Editorial Checklists before Publishing"),
        ]),
      ],
      noteAfter:
        "Adopt an industry style guide (like Google's or Microsoft's) as your foundation, then build lightweight project-specific overrides on top.",
    }),
  ],
};

const PUBLISHING_METRICS_AND_GOVERNANCE: TechnicalWriterRoadmapSection = {
  id: "publishing-metrics-and-governance",
  title: "Publishing, Maintenance & Metrics",
  stages: [
    stage("Content Maintenance & Lifecycle", {
      left: [
        g([
          n("Content Audits & Information Pruning", "personal"),
          n("Versioning Docs Across Product Releases", "personal"),
          n("Deprecation Notices & Migration Guides", "personal"),
          n("Release Notes & Changelog Best Practices (Keep a Changelog)", "personal"),
        ]),
      ],
      right: [
        g([
          n("Handling Documentation Debt"),
          n("Automated Content Expiry Alerts"),
          n("Archiving Legacy Products & Versions"),
          n("Managing Community Contributions & Hackathons"),
        ]),
      ],
    }),
    stage("Accessibility & Localization", {
      left: [
        g(
          [
            n("Accessible Alt Text for Screenshots & Diagrams", "personal"),
            n("Accessible Tables & Meaningful Link Text", "personal"),
            n("WCAG Contrast & Readability Guidelines"),
            n("Screen Reader Navigation Considerations"),
          ],
          n("Accessibility (a11y)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Writing for Translation: Avoiding Idioms & Slang", "personal"),
            n("Internationalization (i18n) Frameworks"),
            n("Localization (l10n) Pipelines (Crowdin, Transifex)"),
            n("Cultural Sensitivities & Regional Formatting"),
          ],
          n("Localization (l10n)")
        ),
      ],
    }),
    stage("Metrics & Continuous Improvement", {
      left: [
        g([
          n("Search Query Analysis & Zero-Result Searches", "personal"),
          n("Pageviews, Dwell Time & Scroll Depth"),
          n("User Feedback Widgets ('Was this page helpful?')", "personal"),
          n("Collecting Qualitative User Comments"),
        ]),
      ],
      right: [
        g([
          n("Support Ticket Deflection Analysis", "personal"),
          n("API Time-to-First-Call (TTFC) Metric", "personal"),
          n("Documentation CSAT / NPS Surveys"),
          n("Data-Driven Content Optimization Roadmap"),
        ]),
      ],
      noteAfter:
        "Great documentation is an evolving product, not a one-off deliverable. Use analytics and customer feedback loops to iterate continually.",
      projectIdea:
        "Project: Implement an in-doc feedback widget ('Was this helpful? Yes / No') and analyze the top 5 documentation pain points.",
    }),
  ],
};

export const TECHNICAL_WRITER_SECTIONS: TechnicalWriterRoadmapSection[] = [
  FOUNDATIONS,
  TECHNICAL_SKILLS_AND_MARKUP,
  DOCS_AS_CODE,
  API_DOCUMENTATION,
  EDITORIAL_AND_COLLABORATION,
  PUBLISHING_METRICS_AND_GOVERNANCE,
];
