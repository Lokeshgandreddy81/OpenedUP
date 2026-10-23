export type AspNetCoreRoadmapStatus = "personal" | "alternative" | "optional";

export interface AspNetCoreRoadmapNode {
  id: string;
  title: string;
  status?: AspNetCoreRoadmapStatus;
  roadmapId?: string;
}

export interface AspNetCoreRoadmapGroup {
  id: string;
  parent?: AspNetCoreRoadmapNode;
  items: AspNetCoreRoadmapNode[];
}

export interface AspNetCoreRoadmapStage {
  id: string;
  node: AspNetCoreRoadmapNode;
  left?: AspNetCoreRoadmapGroup[];
  right?: AspNetCoreRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AspNetCoreRoadmapSection {
  id: string;
  title?: string;
  stages: AspNetCoreRoadmapStage[];
}

export interface AspNetCoreRoadmapLink {
  label: string;
  roadmapId: string;
}

export const ASPNET_CORE_MARKERS: Array<{
  status: AspNetCoreRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const ASPNET_CORE_RELATED_ROADMAPS: AspNetCoreRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
  { label: "Software Design & Architecture", roadmapId: "skill-design-architecture" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "C++ Roadmap", roadmapId: "skill-cpp" },
  { label: "C Programming", roadmapId: "skill-c-programming" },
];

export const ASPNET_CORE_CONTINUE_LEARNING: AspNetCoreRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Software Design & Architecture", roadmapId: "skill-design-architecture" },
  { label: "Docker", roadmapId: "skill-docker" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AspNetCoreRoadmapStatus,
  roadmapId?: string,
  customId?: string
): AspNetCoreRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AspNetCoreRoadmapNode[],
  parent?: AspNetCoreRoadmapNode,
  customId?: string
): AspNetCoreRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AspNetCoreRoadmapStage, "id" | "node"> & {
    status?: AspNetCoreRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): AspNetCoreRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. PREREQUISITES & .NET BASICS
const PREREQUISITES_AND_FOUNDATIONS: AspNetCoreRoadmapSection = {
  id: "prerequisites-and-foundations",
  title: "Prerequisites & .NET Foundations",
  stages: [
    stage("Learn the Basics of C#", {
      right: [
        g([
          n("C#", "personal"),
          n(".NET", "personal"),
          n(".NET CLI", "personal"),
          n("StyleCop Rules", "personal"),
        ]),
      ],
    }),
    stage("General Development Skills", {
      left: [
        g(
          [
            n("Git - Version Control", "personal", "skill-git-github"),
            n("GitHub, GitLab, BitBucket", "personal"),
          ],
          n("Version Control")
        ),
        g(
          [
            n("HTTP / HTTPs Protocol", "personal"),
            n("Data Structures and Algorithms", "personal", "skill-dsa"),
          ],
          n("Core Primitives")
        ),
      ],
    }),
  ],
};

// 2. DATABASE FUNDAMENTALS
const DATABASE_FUNDAMENTALS: AspNetCoreRoadmapSection = {
  id: "database-fundamentals",
  title: "Database Fundamentals",
  stages: [
    stage("Database Fundamentals", {
      right: [
        g(
          [
            n("SQL Basics", "personal", "skill-sql"),
            n("Database Design Basics", "personal"),
            n("Stored Procedures", "personal"),
            n("Constraints", "personal"),
            n("Triggers", "alternative"),
          ],
          n("Relational Database Basics")
        ),
      ],
    }),
  ],
};

// 3. ASP.NET CORE BASICS & ORM
const ASPNET_CORE_CORE: AspNetCoreRoadmapSection = {
  id: "aspnet-core-core",
  title: "ASP.NET Core Fundamentals & ORM",
  stages: [
    stage("ASP.NET Core Basics", {
      left: [
        g(
          [
            n("MVC", "personal"),
            n("REST", "personal", "skill-api-design"),
            n("Minimal APIs", "personal"),
            n("Razor Pages", "alternative"),
            n("Razor Components", "optional"),
          ],
          n("Application Models")
        ),
        g(
          [
            n("Middlewares", "personal"),
            n("Filters and Attributes", "personal"),
            n("App Settings and Configs", "personal"),
          ],
          n("Core Architecture")
        ),
      ],
      noteAfter:
        "Understand the request pipeline, middleware flow, and configuration system before developing advanced web APIs.",
    }),
    stage("Object Relational Mapping", {
      left: [
        g(
          [n("Dapper", "alternative"), n("RepoDB", "alternative"), n("NHibernate", "alternative")],
          n("Micro-ORMs & Alternatives")
        ),
      ],
      right: [
        g(
          [
            n("Framework Basics", "personal"),
            n("Code First + Migrations", "personal"),
            n("Change Tracker API", "personal"),
            n("Lazy, Eager, Explicit Loading", "personal"),
          ],
          n("Entity Framework Core")
        ),
      ],
    }),
  ],
};

// 4. ARCHITECTURE & DATA INFRASTRUCTURE
const ARCHITECTURE_AND_INFRASTRUCTURE: AspNetCoreRoadmapSection = {
  id: "architecture-and-infrastructure",
  title: "Architecture & Data Infrastructure",
  stages: [
    stage("Dependency Injection", {
      right: [
        g(
          [n("Scoped", "personal"), n("Transient", "personal"), n("Singleton", "personal")],
          n("Life Cycles")
        ),
        g(
          [
            n("Microsoft.Extensions", "personal"),
            n("Scrutor", "alternative"),
            n("AutoFac", "optional"),
          ],
          n("DI Containers")
        ),
      ],
    }),
    stage("Caching", {
      left: [
        g(
          [n("Memory Cache", "personal"), n("Entity Framework 2nd Level Cache", "alternative")],
          n("In-Memory & Query Caching")
        ),
        g(
          [n("Redis", "personal", "skill-redis"), n("Memcached", "alternative")],
          n("Distributed Cache")
        ),
      ],
    }),
    stage("Databases", {
      left: [
        g(
          [
            n("SQL Server", "personal"),
            n("PostgreSQL", "alternative"),
            n("MariaDB", "optional"),
            n("MySQL", "optional"),
          ],
          n("Relational Databases")
        ),
        g(
          [
            n("MongoDB", "personal", "skill-mongodb"),
            n("Cassandra", "alternative"),
            n("LiteDB", "alternative"),
            n("CouchDB", "alternative"),
          ],
          n("NoSQL Databases")
        ),
      ],
      right: [
        g([n("Dynamo DB", "personal"), n("Cosmos DB", "alternative")], n("Cloud Databases")),
        g(
          [
            n("Elastic Search", "personal", "skill-elasticsearch"),
            n("Solr", "alternative"),
            n("Sphinx", "alternative"),
          ],
          n("Search Engines")
        ),
      ],
    }),
    stage("Log Frameworks", {
      right: [g([n("Serilog", "personal"), n("NLog", "optional")], n("Logging Frameworks"))],
    }),
  ],
};

// 5. APIS, COMMUNICATION & BACKGROUND WORK
const APIS_AND_COMMUNICATION: AspNetCoreRoadmapSection = {
  id: "apis-and-communication",
  title: "APIs, Communication & Background Tasks",
  stages: [
    stage("API Clients and Communication", {
      left: [
        g(
          [n("SignalR Core", "personal"), n("Web Sockets", "optional")],
          n("Real-Time Communication")
        ),
      ],
      right: [
        g([n("Gridlify", "personal"), n("Odata", "optional")], n("REST Querying")),
        g(
          [
            n("HotChocolate", "personal", "skill-graphql"),
            n("GraphQL .NET", "optional"),
            n("gRPC", "alternative"),
          ],
          n("GraphQL & RPC")
        ),
      ],
    }),
    stage("Object Mapping", {
      right: [
        g(
          [
            n("Manual Mapping", "personal"),
            n("Mapperly", "alternative"),
            n("AutoMapper", "alternative"),
          ],
          n("Object Mapping Libraries")
        ),
      ],
    }),
    stage("Task Scheduling", {
      left: [
        g(
          [
            n("Native Background Service", "personal"),
            n("Hangfire", "personal"),
            n("Quartz", "optional"),
            n("Coravel", "optional"),
          ],
          n("Background Processing")
        ),
      ],
      projectIdea:
        "Build a Background Worker with Hangfire & Redis for recurring asynchronous reports",
    }),
  ],
};

// 6. TESTING & QUALITY ASSURANCE
const TESTING_AND_QUALITY: AspNetCoreRoadmapSection = {
  id: "testing-and-quality",
  title: "Testing & Quality Assurance",
  stages: [
    stage("Testing", {
      left: [
        g(
          [n("XUnit", "personal"), n("NUnit", "alternative"), n("MSTest", "optional")],
          n("Unit Testing Frameworks")
        ),
        g(
          [
            n("Shouldly", "personal"),
            n("Moq", "personal"),
            n("NSubstitute", "optional"),
            n("FakeItEasy", "optional"),
          ],
          n("Assertions & Mocking")
        ),
      ],
      right: [
        g(
          [
            n("WebApplicationFactory", "personal"),
            n("Test Containers", "personal"),
            n(".NET Aspire", "alternative"),
            n("Respawn", "optional"),
          ],
          n("Integration Testing")
        ),
        g(
          [
            n("Playwright", "personal"),
            n("Puppeteer", "alternative"),
            n("Cypress", "alternative"),
            n("RecNRoll", "personal"),
            n("Light BDD", "alternative"),
            n("AutoFixture", "personal"),
            n("Bogus", "alternative"),
          ],
          n("E2E, BDD & Test Data")
        ),
      ],
    }),
  ],
};

// 7. MICROSERVICES, CLOUD & CI/CD
const MICROSERVICES_AND_DEVOPS: AspNetCoreRoadmapSection = {
  id: "microservices-and-devops",
  title: "Microservices, Distributed Systems & CI/CD",
  stages: [
    stage("Microservices", {
      left: [
        g(
          [
            n("RabbitMQ", "personal"),
            n("Kafka", "alternative"),
            n("ActiveMQ", "optional"),
            n("NetMQ"),
          ],
          n("Message Brokers")
        ),
        g(
          [
            n("Mass Transit", "personal"),
            n("NServiceBus", "alternative"),
            n("Azure Service Bus", "optional"),
            n("EasyNetQ", "optional"),
          ],
          n("Message Bus")
        ),
      ],
      right: [
        g([n("Ocelot", "personal"), n("YARP", "personal")], n("API Gateway")),
        g(
          [
            n("Docker", "personal", "skill-docker"),
            n("Kubernetes", "personal", "skill-kubernetes"),
          ],
          n("Containerization")
        ),
        g(
          [
            n(".NET Aspire", "alternative"),
            n("Orleans", "alternative"),
            n("SteelToe", "optional"),
            n("Dapr", "optional"),
          ],
          n("Distributed Systems & Actors")
        ),
      ],
    }),
    stage("CI / CD", {
      left: [
        g(
          [
            n("GitHub Actions", "personal"),
            n("Azure Pipelines", "alternative"),
            n("GitLab CI/CD", "alternative"),
            n("Circle CI", "alternative"),
          ],
          n("CI / CD Pipelines")
        ),
      ],
      right: [
        g(
          [n("Software Design and Architecture", "personal", "skill-design-architecture")],
          n("Design & Architecture")
        ),
      ],
    }),
  ],
};

// 8. CLIENT-SIDE .NET & GOOD-TO-KNOW LIBRARIES
const CLIENT_SIDE_AND_ECOSYSTEM: AspNetCoreRoadmapSection = {
  id: "client-side-and-ecosystem",
  title: "Client-Side .NET & Ecosystem",
  stages: [
    stage("Template Engines & Frameworks", {
      left: [
        g(
          [n("Razor", "alternative"), n("Scriban", "optional"), n("Fluid", "optional")],
          n("Template Engines")
        ),
      ],
      right: [g([n("Blazor", "personal"), n(".NET MAUI", "alternative")], n("Frameworks"))],
    }),
    stage("Good-to-Know Libraries", {
      right: [
        g(
          [
            n("Scalar", "personal"),
            n("MediatR", "personal"),
            n("FluentValidation", "personal"),
            n("Polly", "alternative"),
            n("Marten", "optional"),
            n("Nuke", "optional"),
            n("Benchmark.NET", "alternative"),
            n("Distributed Lock", "alternative"),
          ],
          n("Essential Libraries")
        ),
      ],
      noteAfter:
        "Visit the Backend Developer path to explore complementary systems, networking concepts, and distributed storage.",
    }),
  ],
};

export const ASPNET_CORE_SECTIONS: AspNetCoreRoadmapSection[] = [
  PREREQUISITES_AND_FOUNDATIONS,
  DATABASE_FUNDAMENTALS,
  ASPNET_CORE_CORE,
  ARCHITECTURE_AND_INFRASTRUCTURE,
  APIS_AND_COMMUNICATION,
  TESTING_AND_QUALITY,
  MICROSERVICES_AND_DEVOPS,
  CLIENT_SIDE_AND_ECOSYSTEM,
];
