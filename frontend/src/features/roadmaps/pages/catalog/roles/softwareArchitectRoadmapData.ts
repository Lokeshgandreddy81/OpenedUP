export type SoftwareArchitectRoadmapStatus = "personal" | "alternative" | "optional";

export interface SoftwareArchitectRoadmapNode {
  id: string;
  title: string;
  status?: SoftwareArchitectRoadmapStatus;
  roadmapId?: string;
}

export interface SoftwareArchitectRoadmapGroup {
  id: string;
  parent?: SoftwareArchitectRoadmapNode;
  items: SoftwareArchitectRoadmapNode[];
}

export interface SoftwareArchitectRoadmapStage {
  id: string;
  node: SoftwareArchitectRoadmapNode;
  left?: SoftwareArchitectRoadmapGroup[];
  right?: SoftwareArchitectRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface SoftwareArchitectRoadmapSection {
  id: string;
  title?: string;
  stages: SoftwareArchitectRoadmapStage[];
}

export interface SoftwareArchitectRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SOFTWARE_ARCHITECT_MARKERS: Array<{
  status: SoftwareArchitectRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SOFTWARE_ARCHITECT_RELATED_ROADMAPS: SoftwareArchitectRoadmapLink[] = [
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
  { label: "System Design Roadmap", roadmapId: "skill-system-design" },
  { label: "Software Design & Architecture", roadmapId: "skill-design-architecture" },
];

export const SOFTWARE_ARCHITECT_CONTINUE_LEARNING: SoftwareArchitectRoadmapLink[] = [
  { label: "Backend", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Software Design & Architecture", roadmapId: "skill-design-architecture" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: SoftwareArchitectRoadmapStatus,
  roadmapId?: string,
  customId?: string
): SoftwareArchitectRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: SoftwareArchitectRoadmapNode[],
  parent?: SoftwareArchitectRoadmapNode,
  customId?: string
): SoftwareArchitectRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<SoftwareArchitectRoadmapStage, "id" | "node"> & {
    status?: SoftwareArchitectRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): SoftwareArchitectRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: SoftwareArchitectRoadmapSection = {
  id: "foundations",
  title: "Foundations & Basics",
  stages: [
    stage("Understand the Basics", {
      left: [
        g([n("What is Software Architecture"), n("What is a Software Architect")]),
        g(
          [n("Application Architecture"), n("Solution Architecture"), n("Enterprise Architecture")],
          n("Levels of Architecture")
        ),
      ],
      right: [
        g(
          [
            n(
              "Describes how an application is built including its components, how they interact with each other, environment in which they operate and so on."
            ),
          ],
          n("Software Architecture")
        ),
        g(
          [
            n(
              "A software expert who makes high level software design choices, including technical standards, tools, design principles, platforms to be used, etc."
            ),
          ],
          n("Software Architect")
        ),
      ],
    }),
  ],
};

const RESPONSIBILITIES_AND_SKILLS: SoftwareArchitectRoadmapSection = {
  id: "responsibilities-and-skills",
  title: "Responsibilities & Skills",
  stages: [
    stage("Responsibilities", {
      left: [
        g([
          n("Tech Decisions"),
          n("Design & Architecture Decisions"),
          n("Requirements Elicitation"),
          n("Documentation", undefined, undefined, "resp-documentation"),
          n("Enforcing Standards"),
          n("Collaborate with Others"),
          n("Consult & Coach Developers"),
        ]),
      ],
      right: [
        g(
          [
            n("Design & Architecture"),
            n("Decision Making"),
            n("Simplifying Things"),
            n("How to Code"),
            n("Documentation", undefined, undefined, "skills-documentation"),
            n("Communication"),
            n("Estimate and Evaluate"),
            n("Balance"),
            n("Consult & Coach"),
            n("Marketing Skills"),
          ],
          n("Important Skills to Learn")
        ),
      ],
    }),
  ],
};

const TECHNICAL_SKILLS: SoftwareArchitectRoadmapSection = {
  id: "technical-skills",
  title: "Technical Skills & Tools",
  stages: [
    stage("Technical Skills", {
      left: [
        g(
          [
            n("Java / Kotlin / Scala / Swift"),
            n("Python", undefined, "skill-python"),
            n("Ruby"),
            n("Go", undefined, "skill-go"),
            n("JavaScript / TypeScript", undefined, "skill-typescript"),
            n(".NET Framework Based"),
          ],
          n("Programming Languages")
        ),
      ],
      right: [
        g(
          [
            n("Git", undefined, "skill-git-github"),
            n("GitHub", undefined, "skill-git-github"),
            n("Slack"),
            n("Trello"),
            n("Atlassian Tools"),
          ],
          n("Tools")
        ),
      ],
    }),
  ],
};

const PATTERNS_AND_ARCHITECTURE: SoftwareArchitectRoadmapSection = {
  id: "patterns-and-architecture",
  title: "Patterns & Architecture",
  stages: [
    stage("Patterns & Design Principles", {
      left: [
        g([
          n("MVC, MVP, MVVM"),
          n("CQRS, Eventual Consistency"),
          n("OOP"),
          n("Actors"),
          n("ACID, CAP Theorem"),
          n("SOLID"),
          n("TDD"),
          n("DDD"),
        ]),
      ],
    }),
    stage("Architecture", {
      right: [
        g([
          n("Microservices"),
          n("Serverless"),
          n("Client / Server"),
          n("Layered"),
          n("Distributed Systems"),
          n("Service Oriented"),
        ]),
      ],
    }),
  ],
};

const SECURITY: SoftwareArchitectRoadmapSection = {
  id: "security",
  title: "Security",
  stages: [
    stage("Security", {
      right: [g([n("Hashing Algorithms"), n("PKI"), n("OWASP"), n("Auth Strategies")])],
    }),
  ],
};

const DATA_AND_APIS: SoftwareArchitectRoadmapSection = {
  id: "data-and-apis",
  title: "Data & APIs",
  stages: [
    stage("Working with Data", {
      left: [g([n("Apache Spark"), n("Hadoop"), n("Datawarehouse Principles")], n("Analytics"))],
      right: [
        g([
          n("Hadoop, Spark, MapReduce"),
          n("ETL, Datawarehouses"),
          n("SQL Databases", undefined, "skill-sql"),
          n("NoSQL Databases"),
        ]),
      ],
    }),
    stage("APIs & Integrations", {
      right: [
        g([
          n("gRPC"),
          n("ESB, SOAP"),
          n("REST"),
          n("GraphQL", undefined, "skill-graphql"),
          n("BPM, BPEL"),
          n("Messaging Queues"),
        ]),
      ],
    }),
  ],
};

const APPLICATION_PLATFORMS: SoftwareArchitectRoadmapSection = {
  id: "application-platforms",
  title: "Web & Mobile Platforms",
  stages: [
    stage("Web, Mobile", {
      left: [
        g([
          n("Reactive Programming"),
          n("Functional Programming"),
          n("React, Vue, Angular"),
          n("SPA, SSR, SSG"),
          n("Microfrontends"),
          n("W3C and WHATWG"),
        ]),
      ],
    }),
  ],
};

const FRAMEWORKS_AND_MANAGEMENT: SoftwareArchitectRoadmapSection = {
  id: "frameworks-and-management",
  title: "Frameworks & Methodologies",
  stages: [
    stage("Frameworks", {
      left: [g([n("BABOK"), n("IAF"), n("UML"), n("TOGAF")])],
    }),
    stage("Management", {
      left: [
        g([n("PMI"), n("ITIL"), n("RUP"), n("Prince2")], n("Certifications")),
        g([n("LeSS"), n("SaFE"), n("XP"), n("Kanban"), n("Scrum")], n("Agile Model")),
      ],
    }),
  ],
};

const OPERATIONS_AND_INFRASTRUCTURE: SoftwareArchitectRoadmapSection = {
  id: "operations-and-infrastructure",
  title: "Networks & Operations",
  stages: [
    stage("Networks", {
      left: [g([n("OSI"), n("TCP/IP Model"), n("HTTP, HTTPS"), n("Proxies"), n("Firewalls")])],
    }),
    stage("Operations Knowledge", {
      right: [
        g([
          n("Infrastructure as Code"),
          n("Cloud Providers"),
          n("Serverless Concepts"),
          n("Linux / Unix", undefined, "skill-linux"),
          n("Service Mesh"),
          n("CI / CD"),
          n("Containers"),
          n("Cloud Design Patterns"),
          n("Visit DevOps Roadmap", undefined, "devops"),
        ]),
      ],
    }),
  ],
};

const ENTERPRISE_SOFTWARE: SoftwareArchitectRoadmapSection = {
  id: "enterprise-software",
  title: "Enterprise Software",
  stages: [
    stage("Enterprise Software", {
      left: [
        g([
          n("MS Dynamics"),
          n("SAP ERP, HANA, Business Objects"),
          n("EMC DMS"),
          n("IBM BPM"),
          n("Salesforce"),
        ]),
      ],
    }),
  ],
};

export const SOFTWARE_ARCHITECT_SECTIONS: SoftwareArchitectRoadmapSection[] = [
  FOUNDATIONS,
  RESPONSIBILITIES_AND_SKILLS,
  TECHNICAL_SKILLS,
  PATTERNS_AND_ARCHITECTURE,
  SECURITY,
  DATA_AND_APIS,
  APPLICATION_PLATFORMS,
  FRAMEWORKS_AND_MANAGEMENT,
  OPERATIONS_AND_INFRASTRUCTURE,
  ENTERPRISE_SOFTWARE,
];
