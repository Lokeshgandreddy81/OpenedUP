export type ApiDesignRoadmapStatus = "personal" | "alternative" | "optional";

export interface ApiDesignRoadmapNode {
  id: string;
  title: string;
  status?: ApiDesignRoadmapStatus;
  roadmapId?: string;
}

export interface ApiDesignRoadmapGroup {
  id: string;
  parent?: ApiDesignRoadmapNode;
  items: ApiDesignRoadmapNode[];
}

export interface ApiDesignRoadmapStage {
  id: string;
  node: ApiDesignRoadmapNode;
  left?: ApiDesignRoadmapGroup[];
  right?: ApiDesignRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ApiDesignRoadmapSection {
  id: string;
  title?: string;
  stages: ApiDesignRoadmapStage[];
}

export interface ApiDesignRoadmapLink {
  label: string;
  roadmapId: string;
}

export const API_DESIGN_MARKERS: Array<{
  status: ApiDesignRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const API_DESIGN_RELATED_ROADMAPS: ApiDesignRoadmapLink[] = [
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "GraphQL Roadmap", roadmapId: "skill-graphql" },
  { label: "Node.js Roadmap", roadmapId: "skill-nodejs" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Golang Roadmap", roadmapId: "skill-go" },
  { label: "Design System Roadmap", roadmapId: "skill-design-system" },
];

export const API_DESIGN_CONTINUE_LEARNING: ApiDesignRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "DevOps Engineer", roadmapId: "devops" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "API Security Best Practices", roadmapId: "best-practice-api-security" },
  { label: "Backend Performance Best Practices", roadmapId: "best-practice-backend-performance" },
  { label: "GraphQL", roadmapId: "skill-graphql" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ApiDesignRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ApiDesignRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ApiDesignRoadmapNode[],
  parent?: ApiDesignRoadmapNode,
  customId?: string
): ApiDesignRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ApiDesignRoadmapStage, "id" | "node"> & {
    status?: ApiDesignRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ApiDesignRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. FOUNDATIONS & PROTOCOLS
const FOUNDATIONS_AND_PROTOCOLS: ApiDesignRoadmapSection = {
  id: "foundations-and-protocols",
  title: "Foundations & Protocols",
  stages: [
    stage("Learn the Basics", {
      left: [
        g(
          [
            n("HTTP Versions"),
            n("HTTP Methods"),
            n("HTTP Status Codes"),
            n("HTTP Headers"),
            n("Cookies"),
            n("CORS"),
            n("HTTP Caching"),
          ],
          n("HTTP")
        ),
      ],
      right: [
        g(
          [
            n("What are APIs"),
            n("URL, Query & Path Parameters"),
            n("Content Negotiation"),
            n("Understand TCP / IP"),
            n("Basics of DNS"),
          ],
          n("Core Concepts")
        ),
      ],
      projectIdea:
        "Weather API: Build an API that fetches and returns weather data from a 3rd party API.",
    }),
    stage("Different API Styles", {
      left: [
        g(
          [
            n("RESTful APIs", "personal"),
            n("Simple JSON APIs", "alternative"),
            n("SOAP APIs", "optional"),
            n("gRPC APIs", "alternative"),
            n("GraphQL APIs", "alternative", "skill-graphql"),
          ],
          n("Architectural Styles")
        ),
      ],
      right: [
        g(
          [n("REST Principles"), n("URI Design"), n("Resource modeling"), n("Naming Conventions")],
          n("Design First")
        ),
      ],
    }),
  ],
};

// 2. DESIGNING RESTFUL & REAL-TIME APIS
const RESTFUL_AND_REALTIME_APIS: ApiDesignRoadmapSection = {
  id: "restful-and-realtime-apis",
  title: "Designing RESTful & Real-Time APIs",
  stages: [
    stage("Building JSON / RESTful APIs", {
      left: [g([n("Versioning Strategies"), n("HATEOAS", "optional")], n("API Architecture"))],
      right: [
        g(
          [
            n("CRUD Operations"),
            n("Filtering, Sorting & Search "),
            n("Pagination"),
            n("Idempotency"),
          ],
          n("Handling data & requests")
        ),
        g(
          [n("Rate Limiting"), n("Error Handling"), n("RFC 7807 -  Problem Details")],
          n("Traffic control & Error handling")
        ),
      ],
      projectIdea:
        "URL Shortening Service: Build a performant URL shortener API with slug generation and redirection.",
    }),
    stage("Real-time APIs", {
      left: [
        g(
          [
            n("Web Sockets", "personal"),
            n("Server Sent Events", "alternative"),
            n("Streaming Responses", "optional"),
          ],
          n("Real-Time Communication")
        ),
      ],
      projectIdea:
        "Real-time Leaderboard: Create a real-time leaderboard system for ranking and scoring.",
    }),
  ],
};

// 3. AUTHENTICATION & ACCESS CONTROL
const AUTHENTICATION_AND_ACCESS: ApiDesignRoadmapSection = {
  id: "authentication-and-access",
  title: "Authentication, Authorization & Access Control",
  stages: [
    stage("Authentication Methods", {
      left: [
        g(
          [
            n("Basic Auth", "optional"),
            n("Token Based Auth", "personal"),
            n("JWT ", "personal"),
            n("OAuth 2.0", "personal"),
            n("OIDC", "alternative"),
            n("Session Based Auth", "alternative"),
          ],
          n("API Authentication")
        ),
      ],
      projectIdea:
        "Blogging Platform API: Build a RESTful API for a blogging platform with user authentication and post management.",
    }),
    stage("Authorization Methods", {
      right: [
        g(
          [
            n("RBAC", "personal"),
            n("ABAC", "alternative"),
            n("PBAC", "optional"),
            n("DAC", "optional"),
            n("MAC", "optional"),
            n("ReBAC", "alternative"),
          ],
          n("Authorization Models")
        ),
      ],
    }),
    stage("API Keys & Management", {
      right: [
        g([n("Key Generation & Rotation"), n("Scopes & Permissions")], n("API Key Security")),
      ],
    }),
  ],
};

// 4. DOCUMENTATION & SECURITY
const DOCUMENTATION_AND_SECURITY: ApiDesignRoadmapSection = {
  id: "documentation-and-security",
  title: "Documentation & Security",
  stages: [
    stage("API Documentation Tools", {
      left: [
        g(
          [
            n("Swagger / Open API", "personal"),
            n("Postman", "personal"),
            n("Readme.com", "alternative"),
            n("Stoplight", "alternative"),
          ],
          n("Documentation Tools")
        ),
      ],
    }),
    stage("API Security", {
      right: [
        g(
          [
            n("Best Practices", "personal", "best-practice-api-security"),
            n("Common Vulnerabilities"),
          ],
          n("Security Foundations")
        ),
      ],
    }),
  ],
};

// 5. PERFORMANCE & INTEGRATION PATTERNS
const PERFORMANCE_AND_INTEGRATION: ApiDesignRoadmapSection = {
  id: "performance-and-integration",
  title: "Performance & Integration Architecture",
  stages: [
    stage("API Performance", {
      left: [
        g(
          [
            n("Performance Metrics"),
            n("Caching Strategies"),
            n("Load Balancing"),
            n("Rate Limiting / Throttling"),
            n("Profiling and Monitoring"),
            n("Performance Testing"),
            n("Error Handling / Retries"),
          ],
          n("Performance Engineering")
        ),
      ],
      right: [
        g(
          [n("API Performance Best Practices", "personal", "best-practice-backend-performance")],
          n("Guidelines")
        ),
      ],
    }),
    stage("API Integration Patterns", {
      right: [
        g(
          [
            n("Synchronous vs Asynchronous APIs"),
            n("Event Driven Architecture"),
            n("API Gateways"),
            n("Microservices Architecture"),
            n("Webhooks vs Polling"),
            n("BFF Pattern "),
            n("Batch Processing"),
          ],
          n("Integration Architecture")
        ),
        g(
          [n("Messaging Queues"), n("Kafka", "personal"), n("Rabbit MQ", "alternative")],
          n("Asynchronous Messaging")
        ),
      ],
    }),
  ],
};

// 6. TESTING, OBSERVABILITY & GOVERNANCE
const TESTING_OBSERVABILITY_GOVERNANCE: ApiDesignRoadmapSection = {
  id: "testing-observability-governance",
  title: "Testing, Observability & Governance",
  stages: [
    stage("API Testing", {
      left: [
        g(
          [
            n("Unit Testing", "personal"),
            n("Integration Testing", "personal"),
            n("Functional Testing", "alternative"),
            n("Load Testing", "optional"),
            n("Mocking APIs", "personal"),
            n("Contract Testing", "alternative"),
          ],
          n("Testing Strategies")
        ),
      ],
    }),
    stage("Observability", {
      right: [
        g(
          [
            n("Distributed Tracing"),
            n("Structured Logging"),
            n("API Metrics & Telemetry"),
            n("Health Checks & Alerts"),
          ],
          n("Monitoring & Telemetry")
        ),
      ],
    }),
    stage("API Lifecycle Management", {
      right: [
        g(
          [
            n("API Versioning & Deprecation"),
            n("Breaking Changes & Migration"),
            n("Developer Portal & DX"),
            n("API Governance & Style Guides"),
          ],
          n("Lifecycle & Governance")
        ),
      ],
    }),
    stage("Standards and Compliance", {
      left: [
        g([n("GDPR"), n("CCPA"), n("PII"), n("PCI DSS"), n("HIPAA")], n("Regulatory Compliance")),
      ],
    }),
  ],
};

export const API_DESIGN_SECTIONS: ApiDesignRoadmapSection[] = [
  FOUNDATIONS_AND_PROTOCOLS,
  RESTFUL_AND_REALTIME_APIS,
  AUTHENTICATION_AND_ACCESS,
  DOCUMENTATION_AND_SECURITY,
  PERFORMANCE_AND_INTEGRATION,
  TESTING_OBSERVABILITY_GOVERNANCE,
];
