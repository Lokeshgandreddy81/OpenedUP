import {
  type BestPracticeGroup,
  type BestPracticeImpact,
  type BestPracticeLink,
  type BestPracticeMetric,
  type BestPracticeNode,
  type BestPracticeSection,
  type BestPracticeStage,
  type BestPracticeStatus,
} from "./awsBestPracticeData";

export const BACKEND_PERFORMANCE_METRICS: BestPracticeMetric[] = [
  { label: "p99 Latency SLA", value: "< 150ms", detail: "End-to-end API response time budget" },
  { label: "Cache Hit Ratio", value: "95%+", detail: "Multi-tier L1 memory & L2 Redis cluster" },
  {
    label: "DB Saturation",
    value: "< 40%",
    detail: "Optimized connection pools & covering indexes",
  },
  {
    label: "Query Speedup",
    value: "10x - 50x",
    detail: "N+1 query eradication and eager batching",
  },
];

export const BACKEND_PERFORMANCE_MARKERS: Array<{
  status: BestPracticeStatus;
  label: string;
}> = [
  { status: "personal", label: "Must-Have Baseline (P0)" },
  { status: "alternative", label: "Alternative / Trade-off" },
  { status: "optional", label: "Advanced Optimization" },
];

export const BACKEND_PERFORMANCE_RELATED_ROADMAPS: BestPracticeLink[] = [
  { label: "Backend Developer Roadmap", roadmapId: "backend" },
  { label: "PostgreSQL DBA Roadmap", roadmapId: "postgresql-dba" },
  { label: "System Design Roadmap", roadmapId: "system-design" },
  { label: "API Security Best Practices", roadmapId: "best-practice-api-security" },
  { label: "AWS Best Practices", roadmapId: "best-practice-aws" },
];

export const BACKEND_PERFORMANCE_CONTINUE_LEARNING: BestPracticeLink[] = [
  { label: "API Security Best Practices", roadmapId: "best-practice-api-security" },
  { label: "AWS Best Practices", roadmapId: "best-practice-aws" },
  { label: "System Design", roadmapId: "system-design" },
  { label: "PostgreSQL DBA", roadmapId: "postgresql-dba" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BestPracticeStatus,
  impact?: BestPracticeImpact,
  roadmapId?: string,
  customId?: string
): BestPracticeNode => ({
  id: customId ?? slug(title),
  title,
  status,
  impact,
  roadmapId,
});

const g = (
  items: BestPracticeNode[],
  parent?: BestPracticeNode,
  customId?: string
): BestPracticeGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BestPracticeStage, "id" | "node"> & {
    status?: BestPracticeStatus;
    impact?: BestPracticeImpact;
    customId?: string;
    roadmapId?: string;
  } = {}
): BestPracticeStage => {
  const { status, impact, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, impact, roadmapId, customId),
    ...rest,
  };
};

const DATABASE_OPTIMIZATION: BestPracticeSection = {
  id: "database-optimization",
  title: "Database Query & Index Optimization",
  stages: [
    stage("N+1 Prevention & Query Execution Plans", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Eliminate N+1 Queries with Eager Loading & DataLoader", "personal", "critical"),
            n("Profile Queries using EXPLAIN (ANALYZE, BUFFERS)", "personal", "critical"),
            n("Prevent Full Table Scans on Filtered Columns", "personal", "high"),
          ],
          n("Query Hygiene")
        ),
      ],
      right: [
        g(
          [
            n("Design Compound & Covering Indexes (INDEX ONLY SCAN)", "personal", "critical"),
            n("Use Partial / Filtered Indexes for Sparse Flags", "personal", "high"),
            n("Avoid Wildcard SELECT * (Project Needed Columns)", "personal", "recommended"),
          ],
          n("Indexing Strategy")
        ),
      ],
      noteAfter:
        "An unindexed foreign key or unbatched ORM relation loop can degrade throughput by 100x under concurrent traffic.",
      projectIdea:
        "Run EXPLAIN ANALYZE on top 5 slowest queries in production and introduce covering indexes to achieve Index Only Scans.",
    }),
    stage("Connection Pooling & Database Scaling", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Configure Connection Poolers (HikariCP / PgBouncer)", "personal", "critical"),
            n("Right-Size Pool Limits to Match DB Core Count", "personal", "high"),
            n("Set Aggressive Idle & Max Lifetime Timeouts", "personal", "high"),
          ],
          n("Connection Pooling")
        ),
      ],
      right: [
        g(
          [
            n("Read Replicas with Read/Write Connection Splitting", "personal", "high"),
            n(
              "Implement Table Partitioning for High-Volume Time-Series",
              "personal",
              "recommended"
            ),
            n("Sharding & Distributed DBs (Vitess / CockroachDB)", "optional", "recommended"),
          ],
          n("Scaling & Partitioning")
        ),
      ],
      noteAfter:
        "More database connections do NOT equate to higher throughput; unbounded pools cause CPU context switching and connection thrashing.",
    }),
  ],
};

const CACHING_STRATEGIES: BestPracticeSection = {
  id: "caching-strategies",
  title: "Caching Strategies & Architecture",
  stages: [
    stage("Multi-Tier Caching & Invalidation Patterns", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Cache-Aside (Lazy Loading) for High Read Ratios", "personal", "critical"),
            n("Write-Through & Write-Behind for High Write Throughput", "alternative", "high"),
            n("L1 In-Memory Cache (Caffeine/LRU) + L2 Redis Cluster", "personal", "high"),
          ],
          n("Caching Topologies")
        ),
      ],
      right: [
        g(
          [
            n("Event-Driven Invalidation (CDC / PubSub)", "personal", "high"),
            n("Deterministic Cache Keys & Semantic Namespacing", "personal", "recommended"),
            n(
              "Mitigate Cache Stampede with Mutex Locks / Probabilistic Early Expiry",
              "personal",
              "critical"
            ),
          ],
          n("Invalidation & Stampede")
        ),
      ],
      noteAfter:
        "Always specify randomized TTL jitters (e.g. ±10%) on cached entries to prevent simultaneous expiration thundering herds.",
      projectIdea:
        "Implement singleflight / distributed lock on hot keys to prevent backend database spikes during cache misses.",
    }),
  ],
};

const ASYNC_PROCESSING: BestPracticeSection = {
  id: "async-processing",
  title: "Asynchronous Processing & Decoupling",
  stages: [
    stage("Background Worker Queues & Event-Driven Design", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Offload Non-Blocking I/O to Background Queues", "personal", "critical"),
            n("Deploy Distributed Task Workers (BullMQ, Celery, Sidekiq)", "personal", "critical"),
            n("Idempotent Consumer Processing with De-duplication Keys", "personal", "critical"),
          ],
          n("Task Queues")
        ),
      ],
      right: [
        g(
          [
            n("Event-Driven Streaming (Apache Kafka, RabbitMQ, SQS)", "personal", "high"),
            n("Dead Letter Queues (DLQ) with Exponential Backoff Retries", "personal", "critical"),
            n("Transactional Outbox Pattern for Guaranteed Delivery", "personal", "high"),
          ],
          n("Streaming & Resilience")
        ),
      ],
      noteAfter:
        "Keep HTTP request/response loops strictly sub-50ms by deferring emails, image transformations, and webhooks to background workers.",
      projectIdea:
        "Refactor any synchronous external third-party API call inside request handlers into an asynchronous queued job.",
    }),
  ],
};

const NETWORK_AND_SERIALIZATION: BestPracticeSection = {
  id: "network-and-serialization",
  title: "Network & Serialization Efficiency",
  stages: [
    stage("Protocols, Compression & Payload Sizing", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("gRPC & Protocol Buffers for Low-Latency Microservices", "alternative", "high"),
            n("HTTP/2 & HTTP/3 Multiplexing with Persistent Connections", "personal", "high"),
            n("Keep-Alive Connection Reuse across HTTP Clients", "personal", "critical"),
          ],
          n("Transport Protocols")
        ),
      ],
      right: [
        g(
          [
            n("Enable Gzip / Brotli Compression for Large Payloads", "personal", "high"),
            n("Cursor-Based Pagination over Offset-Based Pagination", "personal", "critical"),
            n("Sparse Fieldsets & Field Projection (Avoid Bloat)", "personal", "recommended"),
          ],
          n("Payload Optimization")
        ),
      ],
      noteAfter:
        "Offset pagination (OFFSET 100000) forces the database to scan and discard rows. Always prefer keyset/cursor pagination.",
    }),
  ],
};

const CONCURRENCY_AND_MEMORY: BestPracticeSection = {
  id: "concurrency-and-memory",
  title: "Concurrency, Threading & Memory Profiling",
  stages: [
    stage("Non-Blocking I/O & Runtime Resource Profiling", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("Async Non-Blocking Event Loops (Node.js, Tokio, Netty)", "personal", "critical"),
            n("Worker Thread Pool Sizing (CPU-bound vs I/O-bound)", "personal", "high"),
            n("Avoid Event Loop Starvation with Chunked Iterations", "personal", "critical"),
          ],
          n("Runtime Concurrency")
        ),
      ],
      right: [
        g(
          [
            n("Continuous CPU Profiling (Flamegraphs & pprof)", "personal", "high"),
            n("Detect Heap Memory Leaks & GC Pause Optimization", "personal", "high"),
            n("Stream Large Files & Data (Avoid Buffer Allocations)", "personal", "critical"),
          ],
          n("Memory & Garbage Collection")
        ),
      ],
      noteAfter:
        "Never buffer multi-megabyte file uploads or CSV exports directly into process memory; stream directly through pipes.",
      projectIdea:
        "Generate a CPU flamegraph under load testing to identify hot functions consuming >20% execution cycles.",
    }),
  ],
};

const OBSERVABILITY_AND_SLAS: BestPracticeSection = {
  id: "observability-and-slas",
  title: "Observability & Performance SLAs",
  stages: [
    stage("APM Tracing, Golden Signals & Latency Budgets", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Distributed APM Tracing (OpenTelemetry, Datadog)", "personal", "critical"),
            n(
              "Monitor 4 Golden Signals: Latency, Traffic, Errors, Saturation",
              "personal",
              "critical"
            ),
            n("Correlate Spans Across Microservice Boundaries", "personal", "high"),
          ],
          n("Distributed Tracing")
        ),
      ],
      right: [
        g(
          [
            n("Enforce p95 & p99 Latency Budgets in CI Performance Tests", "personal", "high"),
            n("Automated Canary Deployments with Rollback on Regression", "personal", "high"),
            n("Continuous Synthetic Health & SLA Probes", "personal", "audit"),
          ],
          n("SLAs & Benchmarking")
        ),
      ],
      noteAfter:
        "Averages hide extreme tail latency pain. Always track 95th and 99th percentiles when evaluating system responsiveness.",
      projectIdea:
        "Define a Grafana or Datadog alert triggering whenever p99 latency exceeds 200ms for more than 3 consecutive minutes.",
    }),
  ],
};

export const BACKEND_PERFORMANCE_SECTIONS: BestPracticeSection[] = [
  DATABASE_OPTIMIZATION,
  CACHING_STRATEGIES,
  ASYNC_PROCESSING,
  NETWORK_AND_SERIALIZATION,
  CONCURRENCY_AND_MEMORY,
  OBSERVABILITY_AND_SLAS,
];

export const BACKEND_PERFORMANCE_STAGES: BestPracticeStage[] = BACKEND_PERFORMANCE_SECTIONS.flatMap(
  (sec) => sec.stages
);
