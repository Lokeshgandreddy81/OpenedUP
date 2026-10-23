export type SystemDesignRoadmapStatus = "personal" | "alternative" | "optional";

export interface SystemDesignRoadmapNode {
  id: string;
  title: string;
  status?: SystemDesignRoadmapStatus;
  roadmapId?: string;
}

export interface SystemDesignRoadmapGroup {
  id: string;
  parent?: SystemDesignRoadmapNode;
  items: SystemDesignRoadmapNode[];
}

export interface SystemDesignRoadmapStage {
  id: string;
  node: SystemDesignRoadmapNode;
  left?: SystemDesignRoadmapGroup[];
  right?: SystemDesignRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface SystemDesignRoadmapSection {
  id: string;
  title?: string;
  stages: SystemDesignRoadmapStage[];
}

export interface SystemDesignRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SYSTEM_DESIGN_MARKERS: Array<{
  status: SystemDesignRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SYSTEM_DESIGN_RELATED_ROADMAPS: SystemDesignRoadmapLink[] = [
  { label: "Software Architect Roadmap", roadmapId: "software-architect" },
  { label: "Backend Developer Roadmap", roadmapId: "backend" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Design and Architecture", roadmapId: "skill-design-architecture" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
];

export const SYSTEM_DESIGN_CONTINUE_LEARNING: SystemDesignRoadmapLink[] = [
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Engineering Manager", roadmapId: "engineering-manager" },
  { label: "Design and Architecture", roadmapId: "skill-design-architecture" },
  { label: "DevOps", roadmapId: "devops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: SystemDesignRoadmapStatus,
  roadmapId?: string,
  customId?: string
): SystemDesignRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: SystemDesignRoadmapNode[],
  parent?: SystemDesignRoadmapNode,
  customId?: string
): SystemDesignRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<SystemDesignRoadmapStage, "id" | "node"> & {
    status?: SystemDesignRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): SystemDesignRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SYSTEM_DESIGN_FUNDAMENTALS: SystemDesignRoadmapSection = {
  id: "system-design-fundamentals",
  title: "System Design Fundamentals & Core Metrics",
  stages: [
    stage("Scalability & Trade-offs", {
      status: "personal",
      left: [
        g(
          [
            n("Horizontal vs Vertical Scaling", "personal"),
            n("Latency vs Throughput metrics", "personal"),
            n("Availability & High Availability (99.999% SLA)"),
          ],
          n("Core Principles")
        ),
      ],
      right: [
        g([
          n("CAP Theorem (Consistency, Availability, Partition Tolerance)", "personal"),
          n("PACELC Theorem"),
          n("Strong vs Eventual Consistency", "personal"),
          n("Back-of-the-envelope Capacity Estimation", "personal"),
        ]),
      ],
    }),
  ],
};

const NETWORKING_AND_TRAFFIC: SystemDesignRoadmapSection = {
  id: "networking-and-traffic",
  title: "Traffic Routing & Edge Architecture",
  stages: [
    stage("Traffic Management & CDNs", {
      status: "personal",
      left: [
        g([
          n("DNS & Geo-DNS Routing", "personal"),
          n("Load Balancers (Layer 4 vs Layer 7)", "personal"),
          n("Load Balancing Algorithms (Round Robin, Least Connections)"),
        ]),
      ],
      right: [
        g([
          n("Reverse Proxies (Nginx, Envoy, HAProxy)", "personal"),
          n("Content Delivery Networks (CDNs) & Edge Compute", "personal"),
          n("API Gateways & Rate Limiting", "personal"),
        ]),
      ],
    }),
  ],
};

const CACHING_STRATEGIES: SystemDesignRoadmapSection = {
  id: "caching-strategies",
  title: "Caching Architectures & Invalidation",
  stages: [
    stage("Distributed Caching Patterns", {
      status: "personal",
      left: [
        g([
          n("Cache-Aside (Lazy Loading)", "personal"),
          n("Write-Through & Write-Behind (Write-Back)", "personal"),
          n("Refresh-Ahead Caching"),
        ]),
      ],
      right: [
        g([
          n("In-Memory Caches (Redis, Memcached)", "personal"),
          n("Eviction Policies (LRU, LFU, FIFO, TTL)", "personal"),
          n("Mitigating Cache Stampede / Thundering Herd", "personal"),
          n("Cache Penetration & Cache Breakdown Defenses"),
        ]),
      ],
    }),
  ],
};

const DATABASE_AND_STORAGE: SystemDesignRoadmapSection = {
  id: "database-and-storage",
  title: "Databases, Replication & Sharding",
  stages: [
    stage("Data Partitioning & Consistency", {
      status: "personal",
      left: [
        g([
          n("Relational (RDBMS) vs NoSQL vs NewSQL", "personal"),
          n("ACID vs BASE properties", "personal"),
          n("Primary-Replica Replication & Replication Lag", "personal"),
        ]),
      ],
      right: [
        g([
          n("Database Sharding (Horizontal Partitioning)", "personal"),
          n("Consistent Hashing & Virtual Nodes", "personal"),
          n("Distributed Transactions & Two-Phase Commit (2PC)"),
          n("Saga Pattern for Microservices Transactions", "personal"),
        ]),
      ],
    }),
  ],
};

const ASYNC_AND_MESSAGING: SystemDesignRoadmapSection = {
  id: "async-and-messaging",
  title: "Asynchronous Processing & Event Streams",
  stages: [
    stage("Message Brokers & Event Streaming", {
      status: "personal",
      left: [
        g([
          n("Point-to-Point Message Queues (RabbitMQ, SQS)", "personal"),
          n("Log-Based Event Streaming (Apache Kafka)", "personal"),
          n("Pub/Sub Architectural Models", "personal"),
        ]),
      ],
      right: [
        g([
          n("Delivery Semantics (At-least-once, Exactly-once)", "personal"),
          n("Dead Letter Queues (DLQ) & Poison Messages", "personal"),
          n("Idempotent Consumer Pattern", "personal"),
          n("Event Sourcing & CQRS Pattern"),
        ]),
      ],
    }),
  ],
};

const RESILIENCY_AND_SECURITY: SystemDesignRoadmapSection = {
  id: "resiliency-and-security",
  title: "Resilience, Fault Tolerance & Observability",
  stages: [
    stage("Fault Tolerance & Distributed Systems", {
      status: "personal",
      left: [
        g([
          n("Circuit Breaker Pattern (Hystrix, Resilience4j)", "personal"),
          n("Rate Limiting Algorithms (Token Bucket, Leaky Bucket)", "personal"),
          n("Bulkhead & Graceful Degradation", "personal"),
        ]),
      ],
      right: [
        g([
          n("Distributed Tracing (OpenTelemetry, Jaeger)", "personal"),
          n("Metrics, Centralized Logging & Alerting (Prometheus, Grafana, ELK)", "personal"),
          n("Zero Trust Architecture & Mutual TLS (mTLS)", "personal"),
        ]),
      ],
    }),
  ],
};

export const SYSTEM_DESIGN_SECTIONS: SystemDesignRoadmapSection[] = [
  SYSTEM_DESIGN_FUNDAMENTALS,
  NETWORKING_AND_TRAFFIC,
  CACHING_STRATEGIES,
  DATABASE_AND_STORAGE,
  ASYNC_AND_MESSAGING,
  RESILIENCY_AND_SECURITY,
];
