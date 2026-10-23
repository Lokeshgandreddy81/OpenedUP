export type BackendRoadmapStatus = "personal" | "alternative" | "optional";

export interface BackendRoadmapNode {
  id: string;
  title: string;
  status?: BackendRoadmapStatus;
  roadmapId?: string;
}

export interface BackendRoadmapGroup {
  id: string;
  parent?: BackendRoadmapNode;
  items: BackendRoadmapNode[];
}

export interface BackendRoadmapStage {
  id: string;
  node: BackendRoadmapNode;
  left?: BackendRoadmapGroup[];
  right?: BackendRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface BackendRoadmapSection {
  id: string;
  title?: string;
  stages: BackendRoadmapStage[];
}

export interface BackendRoadmapLink {
  label: string;
  roadmapId: string;
}

export const BACKEND_MARKERS: Array<{
  status: BackendRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const BACKEND_RELATED_ROADMAPS: BackendRoadmapLink[] = [
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Go Roadmap", roadmapId: "skill-go" },
  { label: "Databases Roadmap", roadmapId: "postgresql" },
];

export const BACKEND_CONTINUE_LEARNING: BackendRoadmapLink[] = [
  { label: "DevOps", roadmapId: "devops" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Full Stack", roadmapId: "full-stack" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BackendRoadmapStatus,
  roadmapId?: string
): BackendRoadmapNode => ({
  id: slug(title),
  title,
  status,
  roadmapId,
});

const g = (items: BackendRoadmapNode[], parent?: BackendRoadmapNode): BackendRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BackendRoadmapStage, "id" | "node"> & {
    status?: BackendRoadmapStatus;
  } = {}
): BackendRoadmapStage => {
  const { status, ...rest } = options;

  return {
    id: slug(title),
    node: n(title, status),
    ...rest,
  };
};

const FOUNDATIONS: BackendRoadmapSection = {
  id: "foundations",
  stages: [
    stage("Introduction", {
      right: [
        g([
          n("How does the internet work?", "personal"),
          n("What is HTTP?", "personal"),
          n("What is Domain Name?", "personal"),
          n("What is hosting?", "personal"),
          n("DNS and how it works?", "personal"),
          n("Browsers and how they work?", "personal"),
        ]),
      ],
    }),
    stage("Frontend Basics"),
    stage("Pick a Backend Language", {
      left: [
        g([
          n("JavaScript", "personal", "skill-javascript"),
          n("Python", "personal", "skill-python"),
          n("Java", "alternative", "skill-java"),
          n("Go", "personal", "skill-go"),
          n("Ruby", "alternative", "skill-ruby"),
          n("C#", "alternative", "skill-c-programming"),
          n("Rust", "alternative", "skill-rust"),
          n("PHP", "alternative", "skill-php"),
        ]),
      ],
      noteAfter: "Learn one language and build lots of projects before moving on",
      projectIdea: "Beginner Project Ideas",
    }),
    stage("Version Control Systems", {
      right: [g([n("Git", "personal", "skill-git-github")])],
    }),
    stage("Repo Hosting Services", {
      right: [g([n("GitHub", "personal", "skill-git-github"), n("GitLab", "alternative")])],
    }),
    stage("Relational Databases", {
      left: [
        g([
          n("PostgreSQL", "personal", "postgresql"),
          n("MySQL", "alternative"),
          n("MariaDB", "alternative"),
          n("SQLite", "alternative"),
          n("MS SQL", "alternative"),
          n("Oracle", "alternative"),
        ]),
      ],
      right: [
        g(
          [
            n("REST", "personal"),
            n("JSON APIs", "personal"),
            n("SOAP", "optional"),
            n("gRPC", "optional"),
            n("GraphQL", "optional", "skill-graphql"),
          ],
          n("API Styles")
        ),
      ],
    }),
    stage("Learn about APIs", {
      right: [g([n("Open API Specs", "optional")])],
    }),
    stage("Authentication", {
      right: [
        g([
          n("JWT", "personal"),
          n("OAuth", "personal"),
          n("Basic Authentication", "personal"),
          n("Token Authentication", "personal"),
          n("Cookie Based Auth", "personal"),
          n("OpenID", "optional"),
          n("SAML", "optional"),
        ]),
      ],
    }),
    stage("Caching", {
      left: [g([n("Redis", "personal", "skill-redis"), n("Memcached", "alternative")])],
      right: [g([n("HTTP Caching", "personal")])],
    }),
    stage("Learn about Web Servers", {
      left: [
        g([
          n("Nginx", "personal"),
          n("Apache", "alternative"),
          n("Caddy", "alternative"),
          n("MS IIS", "alternative"),
        ]),
      ],
      noteAfter:
        "At this point, you should know enough to get a job. Gain hands-on practice by building projects.",
      projectIdea: "Intermediate Project Ideas",
    }),
    stage("Web Security", {
      right: [
        g([
          n("HTTPS", "personal"),
          n("OWASP Risks", "personal"),
          n("CORS", "personal"),
          n("SSL/TLS", "personal"),
          n("CSP", "personal"),
          n("Server Security", "personal"),
        ]),
        g(
          [
            n("MD5", "personal"),
            n("SHA", "personal"),
            n("scrypt", "personal"),
            n("bcrypt", "personal"),
          ],
          n("Hashing Algorithms")
        ),
      ],
    }),
  ],
};

const AI_IN_DEVELOPMENT: BackendRoadmapSection = {
  id: "ai-in-development",
  title: "AI in Development",
  stages: [
    stage("Learn the Basics", {
      right: [
        g([
          n("How LLMs work"),
          n("AI vs Traditional Coding"),
          n("Embeddings"),
          n("Vectors"),
          n("RAGs"),
        ]),
      ],
    }),
    stage("AI Assisted Coding", {
      left: [
        g([
          n("Claude Code", "personal", "skill-claude-code"),
          n("Cursor", "alternative"),
          n("Copilot", "alternative"),
          n("Antigravity", "alternative"),
        ]),
      ],
    }),
    stage("Applications", {
      left: [g([n("Code Reviews"), n("Refactoring"), n("Documentation Generation")])],
    }),
    stage("Prompting Techniques", {
      right: [
        g([
          n("Prompt Engineering", undefined, "skill-prompt-engineering"),
          n("AI Agents Roadmap", undefined, "skill-ai-agents"),
        ]),
      ],
    }),
    stage("Integration Patterns", {
      left: [g([n("Streaming"), n("Structured Outputs"), n("Function Calling")])],
      right: [g([n("Gemini"), n("OpenAI"), n("Anthropic")], n("AI Providers"))],
    }),
  ],
};

const ADVANCED_BACKEND: BackendRoadmapSection = {
  id: "advanced-backend",
  title: "Advanced Backend",
  stages: [
    stage("CI / CD"),
    stage("Testing", {
      right: [
        g([
          n("Integration Testing", "personal"),
          n("Unit Testing", "personal"),
          n("Functional Testing", "personal"),
        ]),
      ],
    }),
    stage("More about Databases", {
      left: [
        g([
          n("Transactions", "personal"),
          n("ORMs", "optional"),
          n("ACID", "personal"),
          n("Normalization", "personal"),
          n("Failure Modes", "personal"),
          n("Profiling Performance", "personal"),
        ]),
      ],
    }),
    stage("Message Brokers", {
      right: [g([n("Kafka", "personal"), n("RabbitMQ", "alternative")])],
    }),
    stage("Containerization", {
      left: [g([n("Docker", "personal", "skill-docker"), n("LXC", "alternative")])],
    }),
    stage("Container Orchestration", {
      left: [g([n("Kubernetes", "personal", "skill-kubernetes")])],
    }),
    stage("Architectural Patterns", {
      left: [
        g([
          n("Monolith", "personal"),
          n("Microservices", "personal"),
          n("SOA", "personal"),
          n("Serverless", "personal"),
          n("Service Mesh", "personal"),
          n("Twelve Factor Apps", "personal"),
        ]),
      ],
    }),
    stage("Search Engines", {
      right: [g([n("Elasticsearch", "personal", "skill-elasticsearch"), n("Solr", "alternative")])],
    }),
    stage("Real-Time Data", {
      right: [
        g([
          n("Server Sent Events", "personal"),
          n("WebSockets", "personal"),
          n("Long / Short Polling", "personal"),
        ]),
      ],
    }),
    stage("Scaling Databases", {
      left: [
        g([
          n("Database Indexes", "personal"),
          n("Data Replication", "optional"),
          n("Sharding Strategies", "optional"),
          n("CAP Theorem", "optional"),
        ]),
      ],
      noteAfter: "You may never need most of these, just know what they are and when to use them",
    }),
    stage("NoSQL Databases", {
      left: [
        g([n("Firebase", "personal"), n("RethinkDB", "alternative")], n("Realtime")),
        g(
          [n("MongoDB", "personal", "skill-mongodb"), n("CouchDB", "alternative")],
          n("Document DBs")
        ),
        g([n("Redis", "personal", "skill-redis"), n("DynamoDB", "alternative")], n("Key-Value")),
        g(
          [
            n("ClickHouse", "personal"),
            n("Cassandra", "alternative"),
            n("ScyllaDB", "alternative"),
          ],
          n("Column DBs")
        ),
        g(
          [n("Neo4j", "personal"), n("AWS Neptune", "alternative"), n("DGraph", "alternative")],
          n("Graph DBs")
        ),
        g([n("Influx DB", "personal"), n("TimescaleDB", "alternative")], n("Time Series")),
      ],
    }),
    stage("Building For Scale", {
      right: [
        g(
          [
            n("Graceful Degradation", "personal"),
            n("Throttling", "personal"),
            n("Backpressure", "personal"),
            n("Loadshifting", "personal"),
            n("Circuit Breaker", "personal"),
          ],
          n("Mitigation Strategies")
        ),
        g(
          [
            n("Instrumentation", "personal"),
            n("Monitoring", "personal"),
            n("Telemetry", "personal"),
          ],
          n("Observability")
        ),
      ],
    }),
  ],
};

export const BACKEND_SECTIONS: BackendRoadmapSection[] = [
  FOUNDATIONS,
  AI_IN_DEVELOPMENT,
  ADVANCED_BACKEND,
];
