export type GraphQlRoadmapStatus = "personal" | "alternative" | "optional";

export interface GraphQlRoadmapNode {
  id: string;
  title: string;
  status?: GraphQlRoadmapStatus;
  roadmapId?: string;
}

export interface GraphQlRoadmapGroup {
  id: string;
  parent?: GraphQlRoadmapNode;
  items: GraphQlRoadmapNode[];
}

export interface GraphQlRoadmapStage {
  id: string;
  node: GraphQlRoadmapNode;
  left?: GraphQlRoadmapGroup[];
  right?: GraphQlRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface GraphQlRoadmapSection {
  id: string;
  title?: string;
  stages: GraphQlRoadmapStage[];
}

export interface GraphQlRoadmapLink {
  label: string;
  roadmapId: string;
}

export const GRAPHQL_MARKERS: Array<{
  status: GraphQlRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const GRAPHQL_RELATED_ROADMAPS: GraphQlRoadmapLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Node.js Roadmap", roadmapId: "skill-nodejs" },
  { label: "React Developer", roadmapId: "skill-react" },
  { label: "TypeScript Roadmap", roadmapId: "skill-typescript" },
  { label: "System Design", roadmapId: "skill-system-design" },
];

export const GRAPHQL_CONTINUE_LEARNING: GraphQlRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "System Design", roadmapId: "skill-system-design" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: GraphQlRoadmapStatus,
  roadmapId?: string,
  customId?: string
): GraphQlRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: GraphQlRoadmapNode[],
  parent?: GraphQlRoadmapNode,
  customId?: string
): GraphQlRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<GraphQlRoadmapStage, "id" | "node"> & {
    status?: GraphQlRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): GraphQlRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. GRAPHQL FOUNDATIONS
const GRAPHQL_FOUNDATIONS: GraphQlRoadmapSection = {
  id: "graphql-foundations",
  title: "GraphQL Foundations",
  stages: [
    stage("REST vs GraphQL", {
      status: "personal",
      left: [
        g(
          [
            n("Single HTTP Endpoint (POST /graphql)", "personal"),
            n("Elimination of Over-fetching", "personal"),
            n("Elimination of Under-fetching (Waterfall requests)"),
            n("Client-Specified Data Shapes"),
          ],
          n("Why GraphQL?")
        ),
      ],
      right: [
        g(
          [
            n("Strong Contract & Self-Documenting API"),
            n("GraphQL Specification vs Libraries"),
            n("Network Transport (HTTP, WebSockets, SSE)"),
            n("JSON-formatted Responses (data & errors)"),
          ],
          n("Architectural Concepts")
        ),
      ],
      noteAfter:
        "GraphQL turns client-server communication into a strongly typed conversation: clients request the exact fields they need, reducing round trips and payload sizes.",
    }),
    stage("Schema Definition Language (SDL)", {
      status: "personal",
      left: [
        g(
          [
            n("type, query, mutation & subscription Root Types", "personal"),
            n("Schema-First Development Pattern", "personal"),
            n("Code-First (TypeGraphQL, Pothos, Nexus)", "alternative"),
            n('Schema Comments & Docstrings (""" Markdown """)'),
          ],
          n("SDL Syntax")
        ),
      ],
      right: [
        g(
          [
            n("GraphQL Playground & GraphiQL Explorer", "personal"),
            n("Apollo Studio Sandbox", "alternative"),
            n("Introspection Query Mechanics (__schema, __type)"),
          ],
          n("Exploration & Tooling")
        ),
      ],
      projectIdea:
        "Schema Blueprint: Design a production e-commerce SDL schema with products, orders, and customer reviews",
    }),
  ],
};

// 2. CORE OPERATIONS
const CORE_OPERATIONS: GraphQlRoadmapSection = {
  id: "core-operations",
  title: "Core Operations",
  stages: [
    stage("Queries & Mutations", {
      status: "personal",
      left: [
        g(
          [
            n("Query Operation Syntax & Operation Names", "personal"),
            n("Field Selection & Nested Sub-fields"),
            n("Field Aliases (alias: originalField)", "personal"),
            n("Field Arguments (limit, offset, filter)"),
          ],
          n("Read Operations (Queries)")
        ),
      ],
      right: [
        g(
          [
            n("Mutation Operation Syntax", "personal"),
            n("Atomic & Sequential Execution Guarantee"),
            n("Returning Modified Entity from Mutation", "personal"),
            n("Handling Business Logic Validation Errors"),
          ],
          n("Write Operations (Mutations)")
        ),
      ],
      noteAfter:
        "While query fields execute in parallel, mutation fields always execute sequentially from top to bottom to maintain database consistency.",
    }),
    stage("Fragments, Variables & Directives", {
      left: [
        g(
          [
            n("Reusable Named Fragments (fragment UserFields on User)", "personal"),
            n("Inline Fragments (on ConcreteType for Unions/Interfaces)", "personal"),
            n("Fragment Colocation on Components"),
          ],
          n("Fragments")
        ),
      ],
      right: [
        g(
          [
            n("Parameterized Queries ($id: ID!, $limit: Int = 10)", "personal"),
            n("Dynamic Variables JSON Payload"),
            n("@include(if: Boolean) Directive"),
            n("@skip(if: Boolean) Directive"),
            n("@deprecated(reason: String) Schema Directive", "personal"),
          ],
          n("Variables & Directives")
        ),
      ],
    }),
    stage("Subscriptions & Real-Time", {
      status: "personal",
      left: [
        g(
          [
            n("Subscription Root Type Definition", "personal"),
            n("Event-Driven Architecture with PubSub"),
            n("WebSockets (graphql-ws Protocol)", "personal"),
            n("Server-Sent Events (graphql-sse Protocol)", "alternative"),
          ],
          n("Real-Time Subscriptions")
        ),
      ],
      right: [
        g(
          [
            n("Connection Lifecycle & Keep-Alives"),
            n("Connection Authentication & Auth Tokens"),
            n("Redis PubSub for Horizontal Scalability", "personal"),
          ],
          n("Scalability & Infrastructure")
        ),
      ],
      projectIdea:
        "Real-Time Collaboration App: Build a live chat/presence system with GraphQL subscriptions and Redis PubSub",
    }),
  ],
};

// 3. SCHEMA & TYPE SYSTEM
const SCHEMA_AND_TYPE_SYSTEM: GraphQlRoadmapSection = {
  id: "schema-and-type-system",
  title: "Schema & Type System",
  stages: [
    stage("Type System & Scalars", {
      status: "personal",
      left: [
        g(
          [
            n("Default Scalars: Int, Float, String, Boolean, ID", "personal"),
            n("Non-Null Modifier (!)", "personal"),
            n("List Modifier ([T]) & Combinations ([String!]!)"),
            n("Custom Scalars (DateTime, JSON, EmailAddress)", "personal"),
            n("graphql-scalars Utility Library"),
          ],
          n("Scalars & Modifiers")
        ),
      ],
      right: [
        g(
          [
            n("Object Types & Field Definitions", "personal"),
            n("Enums (enum Role { ADMIN USER GUEST })", "personal"),
            n("Input Object Types (input CreateUserInput)", "personal"),
            n("Input vs Object Type Distinct Separation"),
          ],
          n("Complex Types")
        ),
      ],
      noteAfter:
        "Input types cannot contain interfaces or unions and can only be used as field arguments. Object types represent what the server returns.",
    }),
    stage("Abstract Types: Interfaces & Unions", {
      left: [
        g(
          [
            n("Interface Contracts (interface Node { id: ID! })", "personal"),
            n("Multiple Interface Implementation"),
            n("__resolveType Type Resolution Resolver", "personal"),
            n("Inline Fragments for Field Access (... on User)"),
          ],
          n("Interfaces")
        ),
      ],
      right: [
        g(
          [
            n("Union Types (union SearchResult = User | Post)", "personal"),
            n("Heterogeneous Results without Common Fields"),
            n("Error Handling as Union Pattern (Result | Error)", "personal"),
            n("Exhaustive Type Matching in Clients"),
          ],
          n("Unions & Result Types")
        ),
      ],
      projectIdea:
        "Type-Safe Search Engine: Search API returning polymorphic results (Articles, Users, Comments) via Unions",
    }),
  ],
};

// 4. SERVER IMPLEMENTATION & RESOLVERS
const SERVER_IMPLEMENTATION_AND_RESOLVERS: GraphQlRoadmapSection = {
  id: "server-implementation-and-resolvers",
  title: "Server Implementation & Resolvers",
  stages: [
    stage("Resolver Tree & Execution", {
      status: "personal",
      left: [
        g(
          [
            n("Resolver Signature (parent, args, context, info)", "personal"),
            n("Resolver Execution Pipeline & AST Traversal"),
            n("Default Resolvers & Property Mapping"),
            n("Context Initialization (Auth, User Session, DB)"),
          ],
          n("Resolver Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Apollo Server", "personal"),
            n("GraphQL Yoga (The Guild / Envelop)", "personal"),
            n("Mercurius (Fastify GraphQL)", "alternative"),
            n("NestJS GraphQL Integration", "alternative"),
          ],
          n("Server Frameworks")
        ),
      ],
    }),
    stage("The N+1 Problem & DataLoader", {
      status: "personal",
      left: [
        g(
          [
            n("Understanding the N+1 Query Problem", "personal"),
            n("DataLoader Utility by Lee Byron", "personal"),
            n("Batching with Tick Execution Queue"),
            n("Per-Request Caching Lifecycle (Memory leaks prevention)"),
          ],
          n("DataLoader Deep Dive")
        ),
      ],
      right: [
        g(
          [
            n("Prime & Clear DataLoader Cache"),
            n("DataLoader with SQL IN Queries"),
            n("DataLoader for NoSQL / Microservice Fan-out"),
            n("Context-scoped DataLoader Factory Pattern", "personal"),
          ],
          n("Practical Database Optimization")
        ),
      ],
      noteAfter:
        "Never create a DataLoader as a global singleton. Always instantiate DataLoaders inside the per-request context so data doesn't leak between users.",
      projectIdea:
        "High-Performance Social Feed: Implement an authors-and-posts API that resolves 1,000 items in 2 SQL queries using DataLoader",
    }),
    stage("Federation & Microservices", {
      left: [
        g(
          [
            n("Apollo Federation v2", "personal"),
            n("Subgraphs & Supergraph Router", "personal"),
            n("@key Entity Directive & Representation"),
            n("@shareable & @override Directives"),
          ],
          n("Apollo Federation")
        ),
      ],
      right: [
        g(
          [
            n("Schema Stitching (Legacy / Flexible Alternative)", "alternative"),
            n("Rover CLI & Apollo Router (Rust engine)", "personal"),
            n("Contract Schemas & Field Visibility"),
          ],
          n("Gateway Architecture")
        ),
      ],
    }),
  ],
};

// 5. CLIENT ECOSYSTEM
const CLIENT_ECOSYSTEM: GraphQlRoadmapSection = {
  id: "client-ecosystem",
  title: "Client Ecosystem",
  stages: [
    stage("Apollo Client & State Management", {
      status: "personal",
      left: [
        g(
          [
            n("Apollo Client Setup & HttpLink", "personal"),
            n("useQuery, useMutation, useSubscription Hooks", "personal"),
            n("Fetch Policies (cache-first, network-only, no-cache)"),
            n("Pagination Helpers (offsetLimitPagination, relayStylePagination)"),
          ],
          n("Apollo Client")
        ),
      ],
      right: [
        g(
          [
            n("Normalized InMemoryCache (__typename:id)", "personal"),
            n("Type Policies & Custom Field Read/Merge Functions", "personal"),
            n("Cache Direct Updates (cache.modify, cache.writeQuery)"),
            n("Reactive Variables (makeVar) for Local State"),
          ],
          n("Normalized Caching")
        ),
      ],
      noteAfter:
        "Normalized caching splits nested response trees into flat entity maps keyed by __typename + id. Updating an entity automatically updates all UI views displaying it.",
    }),
    stage("Alternative Clients & Codegen", {
      left: [
        g(
          [
            n("urql (Lightweight & Extensible Client)", "personal"),
            n("urql Exchanges Pipeline"),
            n("Relay (Facebook's Compiler-Driven Client)", "alternative"),
            n("Relay Cursor Connections Specification", "personal"),
          ],
          n("Client Alternatives")
        ),
      ],
      right: [
        g(
          [
            n("GraphQL Code Generator (@graphql-codegen/cli)", "personal"),
            n("TypeScript Types Generation from Schema", "personal"),
            n("Typed Document Nodes & Typed React Hooks"),
            n("Fragment Masking (Unmasking fragment data)", "personal"),
          ],
          n("Type-Safe Code Generation")
        ),
      ],
      projectIdea:
        "End-to-End Typed Dashboard: React + Vite application with codegen-generated hooks and Relay-style infinite cursor pagination",
    }),
  ],
};

// 6. SECURITY & PRODUCTION HARDENING
const SECURITY_AND_PRODUCTION_HARDENING: GraphQlRoadmapSection = {
  id: "security-and-production-hardening",
  title: "Security & Production Hardening",
  stages: [
    stage("Query Protection & Rate Limiting", {
      status: "personal",
      left: [
        g(
          [
            n("Query Depth Limiting (graphql-depth-limit)", "personal"),
            n("Query Complexity & Cost Analysis", "personal"),
            n("Disabling Introspection in Production", "personal"),
            n("Schema Field Suggestion Disabling"),
          ],
          n("Denial of Service Prevention")
        ),
      ],
      right: [
        g(
          [
            n("Persisted Queries & Query Allowlisting", "personal"),
            n("Automatic Persisted Queries (APQ) with Redis", "personal"),
            n("Field-Level Rate Limiting"),
            n("Request Payload Size Limits"),
          ],
          n("Production Hardening")
        ),
      ],
      noteAfter:
        "Unprotected GraphQL servers are susceptible to recursive depth attacks (e.g., author -> posts -> author -> posts). Enforce depth and complexity limits on day one.",
    }),
    stage("Auth & Observability", {
      left: [
        g(
          [
            n("Authentication in Context (JWT, Session)", "personal"),
            n("Field-Level Authorization (graphql-shield / Envelop)", "personal"),
            n("Role-Based & Attribute-Based Access Control (RBAC/ABAC)"),
            n("Directives for Authorization (@auth)"),
          ],
          n("Authentication & Authorization")
        ),
      ],
      right: [
        g(
          [
            n("Error Masking & Sanitization in Production", "personal"),
            n("Apollo Studio Field-Level Metrics"),
            n("OpenTelemetry Tracing for Resolvers"),
            n("Structured Logging & Query Fingerprinting"),
          ],
          n("Monitoring & Auditing")
        ),
      ],
      projectIdea:
        "Hardened GraphQL Gateway: Public gateway with persisted queries only, JWT auth, depth limits, and OpenTelemetry tracing",
    }),
  ],
};

export const GRAPHQL_SECTIONS: GraphQlRoadmapSection[] = [
  GRAPHQL_FOUNDATIONS,
  CORE_OPERATIONS,
  SCHEMA_AND_TYPE_SYSTEM,
  SERVER_IMPLEMENTATION_AND_RESOLVERS,
  CLIENT_ECOSYSTEM,
  SECURITY_AND_PRODUCTION_HARDENING,
];
