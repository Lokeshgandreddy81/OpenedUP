export type RedisRoadmapStatus = "personal" | "alternative" | "optional";

export interface RedisRoadmapNode {
  id: string;
  title: string;
  status?: RedisRoadmapStatus;
  roadmapId?: string;
}

export interface RedisRoadmapGroup {
  id: string;
  parent?: RedisRoadmapNode;
  items: RedisRoadmapNode[];
}

export interface RedisRoadmapStage {
  id: string;
  node: RedisRoadmapNode;
  left?: RedisRoadmapGroup[];
  right?: RedisRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface RedisRoadmapSection {
  id: string;
  title?: string;
  stages: RedisRoadmapStage[];
}

export interface RedisRoadmapLink {
  label: string;
  roadmapId: string;
}

export const REDIS_MARKERS: Array<{
  status: RedisRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const REDIS_RELATED_ROADMAPS: RedisRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "PostgreSQL Roadmap", roadmapId: "postgresql" },
  { label: "MongoDB Roadmap", roadmapId: "skill-mongodb" },
  { label: "Elasticsearch Roadmap", roadmapId: "skill-elasticsearch" },
  { label: "Backend Performance", roadmapId: "best-practice-backend-performance" },
];

export const REDIS_CONTINUE_LEARNING: RedisRoadmapLink[] = [
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Backend Performance", roadmapId: "best-practice-backend-performance" },
  { label: "PostgreSQL", roadmapId: "postgresql" },
  { label: "Elasticsearch", roadmapId: "skill-elasticsearch" },
  { label: "Docker", roadmapId: "skill-docker" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: RedisRoadmapStatus,
  roadmapId?: string,
  customId?: string
): RedisRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: RedisRoadmapNode[],
  parent?: RedisRoadmapNode,
  customId?: string
): RedisRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<RedisRoadmapStage, "id" | "node"> & {
    status?: RedisRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): RedisRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. ARCHITECTURE & CONCEPTS
const ARCHITECTURE_AND_CONCEPTS: RedisRoadmapSection = {
  id: "architecture-and-concepts",
  title: "Redis Architecture & Concepts",
  stages: [
    stage("Foundations & Internals", {
      left: [
        g(
          [
            n("In-Memory Storage Model (RAM primary store)", "personal"),
            n("Single-Threaded Event Loop (Reactor pattern)", "personal"),
            n("I/O Multiplexing (epoll, kqueue, select)", "personal"),
            n("Multi-threaded I/O (Redis 6+ socket reads/writes)"),
          ],
          n("Concurrency & Engine Model")
        ),
      ],
      right: [
        g(
          [
            n("RESP Protocol (REdis Serialization Protocol)", "personal"),
            n("jemalloc Memory Allocator"),
            n("Memory Fragmentation & active defragmentation"),
            n("Redis Configuration (redis.conf)"),
          ],
          n("Protocols & Memory Subsystem")
        ),
      ],
    }),
    stage("CLI & Operational Basics", {
      left: [
        g(
          [
            n("redis-cli Interactive Shell", "personal"),
            n("PING, ECHO & AUTH commands"),
            n("INFO & MONITOR commands (Debugging)"),
          ],
          n("CLI Operations")
        ),
      ],
      right: [
        g(
          [
            n("SCAN vs KEYS (Cursor-based non-blocking traversal)", "personal"),
            n("EXPIRE, TTL & PTTL keyspace management"),
            n("TYPE, OBJECT ENCODING & DEL / UNLINK"),
          ],
          n("Keyspace Command Basics")
        ),
      ],
      noteAfter:
        "Never run the blocking KEYS command on production Redis instances; always use non-blocking SCAN with MATCH and COUNT.",
    }),
  ],
};

// 2. CORE DATA STRUCTURES
const CORE_DATA_STRUCTURES: RedisRoadmapSection = {
  id: "core-data-structures",
  title: "Core Data Structures",
  stages: [
    stage("Primary Data Types", {
      left: [
        g(
          [
            n("Strings: GET, SET, INCR, MGET/MSET", "personal"),
            n("SETNX (Atomic distributed lock primitive)", "personal"),
            n("Lists: LPUSH, RPUSH, LPOP, RPOP (Queues)", "personal"),
            n("Blocking list ops: BLPOP, BRPOP, RPOPLPUSH"),
          ],
          n("Strings & Lists")
        ),
      ],
      right: [
        g(
          [
            n("Hashes: HSET, HGET, HGETALL, HMSET", "personal"),
            n("HINCRBY (Atomic field counters)"),
            n("Sets: SADD, SMEMBERS, SISMEMBER", "personal"),
            n("Set operations: SINTER, SUNION, SDIFF"),
          ],
          n("Hashes & Sets")
        ),
      ],
    }),
    stage("Sorted Sets & Specialized Types", {
      left: [
        g(
          [
            n("Sorted Sets / ZSets: ZADD, ZSCORE, ZRANK", "personal"),
            n("ZRANGEBYSCORE & ZREVRANGEBYSCORE", "personal"),
            n("Skiplist & Ziplist internal representations"),
          ],
          n("Sorted Sets (ZSets)")
        ),
      ],
      right: [
        g(
          [
            n("Bitmaps: SETBIT, GETBIT, BITCOUNT, BITOP", "personal"),
            n("HyperLogLog: PFADD, PFCOUNT (Probabilistic cardinality)", "personal"),
            n("Geospatial: GEOADD, GEODIST, GEOSEARCH", "personal"),
          ],
          n("Bitmaps, HyperLogLog & Geo")
        ),
      ],
      projectIdea:
        "Project Idea: Build a gaming real-time global leaderboard using Sorted Sets with O(log(N)) score lookups and percentile rankings.",
    }),
  ],
};

// 3. ADVANCED DATA TYPES & MODULES
const ADVANCED_DATA_TYPES: RedisRoadmapSection = {
  id: "advanced-data-types",
  title: "Advanced Redis Data Types",
  stages: [
    stage("Redis Streams & JSON", {
      left: [
        g(
          [
            n("Redis Streams: XADD, XRANGE, XREVRANGE", "personal"),
            n("Stream IDs & Radix Tree storage", "personal"),
            n("Trimming: MAXLEN & XTRIM strategies"),
          ],
          n("Redis Streams Log Engine")
        ),
      ],
      right: [
        g(
          [
            n("RedisJSON: JSON.SET, JSON.GET, JSON.DEL", "personal"),
            n("JSONPath Expressions & nested updates", "personal"),
            n("Binary tree representation vs raw string JSON"),
          ],
          n("Document Storage (RedisJSON)")
        ),
      ],
    }),
    stage("Search & Probabilistic Modules", {
      left: [
        g(
          [
            n("RediSearch: FT.CREATE, FT.SEARCH", "personal"),
            n("Full-Text Indexing & Tokenization"),
            n("Vector Similarity Search (HNSW / Flat vectors for AI)", "personal"),
          ],
          n("Search & Vector Engine (RediSearch)")
        ),
      ],
      right: [
        g(
          [
            n("RedisBloom: Bloom Filters (BF.ADD, BF.EXISTS)", "personal"),
            n("Cuckoo Filters (CF.ADD, CF.DEL)"),
            n("Count-Min Sketch (CMS.INCRBY) & Top-K"),
            n("Redis TimeSeries (TS.CREATE, TS.ADD, TS.RANGE)", "optional"),
          ],
          n("Probabilistic & TimeSeries Modules")
        ),
      ],
      noteAfter:
        "RediSearch combined with RedisJSON turns Redis into a high-speed vector and full-text database ideal for AI RAG embeddings and semantic search.",
      projectIdea:
        "Project Idea: Build an AI semantic document search engine using RediSearch vector indexes with HNSW and OpenAI embeddings.",
    }),
  ],
};

// 4. PERSISTENCE & DURABILITY
const PERSISTENCE_AND_DURABILITY: RedisRoadmapSection = {
  id: "persistence-and-durability",
  title: "Persistence & Durability",
  stages: [
    stage("Snapshotting & Append Logs", {
      left: [
        g(
          [
            n("RDB (Redis Database Snapshots)", "personal"),
            n("BGSAVE & fork() copy-on-write semantics", "personal"),
            n("save configuration triggers (save 900 1)"),
            n("RDB trade-offs: Compact file vs data loss window"),
          ],
          n("RDB Snapshots")
        ),
      ],
      right: [
        g(
          [
            n("AOF (Append-Only File)", "personal"),
            n("appendfsync options: always, everysec, no", "personal"),
            n("BGREWRITEAOF & automated log compaction", "personal"),
            n("AOF fsync trade-offs: Durability vs write throughput"),
          ],
          n("Append-Only Log (AOF)")
        ),
      ],
    }),
    stage("Hybrid Persistence & Recovery", {
      left: [
        g(
          [
            n("Hybrid Persistence (RDB preamble + AOF tail)", "personal"),
            n("aof-use-rdb-preamble configuration", "personal"),
          ],
          n("Hybrid Durability")
        ),
      ],
      right: [
        g(
          [
            n("Disaster Recovery: S3 snapshot replication", "personal"),
            n("Corrupt AOF repair (redis-check-aof)"),
            n("Point-in-time recovery workflows"),
          ],
          n("Backup & Disaster Recovery")
        ),
      ],
      noteAfter:
        "Hybrid persistence (RDB preamble with AOF changes) delivers fast server restarts alongside near-zero data loss.",
    }),
  ],
};

// 5. MESSAGING & PUB/SUB
const MESSAGING_AND_PUBSUB: RedisRoadmapSection = {
  id: "messaging-and-pubsub",
  title: "Messaging & Pub/Sub",
  stages: [
    stage("Publish / Subscribe Pattern", {
      left: [
        g(
          [
            n("PUBLISH & SUBSCRIBE commands", "personal"),
            n("Pattern Matching: PSUBSCRIBE / PUNSUBSCRIBE", "alternative"),
            n("Sharded Pub/Sub: SPUBLISH / SSUBSCRIBE (Redis 7+)", "personal"),
          ],
          n("Pub/Sub Messaging")
        ),
      ],
      right: [
        g(
          [
            n("At-most-once delivery limitations"),
            n("No message retention or backpressure buffer"),
            n("Use cases: Real-time chat, WebSocket broadcasts"),
          ],
          n("Pub/Sub Characteristics")
        ),
      ],
    }),
    stage("Consumer Groups with Streams", {
      left: [
        g(
          [
            n("XGROUP CREATE & Consumer Group setup", "personal"),
            n("XREADGROUP (Distributed worker load balancing)", "personal"),
            n("XACK (Explicit message acknowledgment)", "personal"),
          ],
          n("Consumer Group Mechanics")
        ),
      ],
      right: [
        g(
          [
            n("Pending Entries List (PEL) & XPENDING inspection", "personal"),
            n("Message recovery: XCLAIM & XAUTOCLAIM", "personal"),
            n("Dead letter queue patterns with Streams"),
            n("At-least-once delivery guarantee"),
          ],
          n("Fault Tolerance & Guaranteed Delivery")
        ),
      ],
      projectIdea:
        "Project Idea: Resilient asynchronous job queue using Redis Streams with Consumer Groups, auto-claim retries, and dead-letter handling.",
    }),
  ],
};

// 6. HIGH AVAILABILITY & CLUSTERING
const HIGH_AVAILABILITY_AND_CLUSTERING: RedisRoadmapSection = {
  id: "high-availability-and-clustering",
  title: "High Availability & Clustering",
  stages: [
    stage("Replication & Failover", {
      left: [
        g(
          [
            n("Primary-Replica Asynchronous Replication", "personal"),
            n("Partial resynchronization (PSYNC & repl-backlog)", "personal"),
            n("Full synchronization diskless replication"),
            n("Read scaling with Read-Only Replicas"),
          ],
          n("Replication Architecture")
        ),
      ],
      right: [
        g(
          [
            n("Redis Sentinel: Health checks & quorum", "personal"),
            n("Automated master failover election", "personal"),
            n("Configuration provider for client discovery"),
            n("Split-brain prevention (min-replicas-to-write)"),
          ],
          n("High Availability with Sentinel")
        ),
      ],
    }),
    stage("Redis Cluster (Horizontal Sharding)", {
      left: [
        g(
          [
            n("16,384 Hash Slots Architecture", "personal"),
            n("CRC16 Hashing Algorithm (slot = CRC16(key) % 16384)", "personal"),
            n("Hash Tags: {user100}:profile for multi-key ops", "personal"),
          ],
          n("Cluster Topology & Sharding")
        ),
      ],
      right: [
        g(
          [
            n("Client Redirection: MOVED & ASK errors", "personal"),
            n("Online Resharding & slot migration"),
            n("Gossip Protocol (Cluster node state exchange)"),
            n("Cluster replica failover and epoch consensus"),
          ],
          n("Cluster Operations & Scaling")
        ),
      ],
      noteAfter:
        "Redis Cluster shards keys across 16,384 slots. When grouping related keys on the same shard for atomic transactions, enclose the routing key in hash tags {user:123}.",
      projectIdea:
        "Project Idea: Configure a 6-node Redis Cluster (3 primaries + 3 replicas) with Sentinel failover testing using Docker Compose.",
    }),
  ],
};

// 7. CACHING STRATEGIES & PERFORMANCE
const CACHING_AND_PERFORMANCE: RedisRoadmapSection = {
  id: "caching-and-performance",
  title: "Caching Strategies & Performance",
  stages: [
    stage("Caching Patterns & Stampede Defense", {
      left: [
        g(
          [
            n("Cache-Aside (Lazy loading)", "personal"),
            n("Write-Through Caching", "alternative"),
            n("Write-Behind / Write-Back Caching", "alternative"),
            n("Read-Through Caching", "optional"),
          ],
          n("Caching Patterns")
        ),
      ],
      right: [
        g(
          [
            n("Cache Stampede / Thundering Herd Prevention", "personal"),
            n("Distributed Mutex (SET resource_id token NX EX)", "personal"),
            n("Probabilistic Early Expiration (XFetch algorithm)", "personal"),
            n("Negative Caching & Null Object Pattern"),
          ],
          n("Cache Stampede & Resilience")
        ),
      ],
    }),
    stage("Eviction Policies & Memory Tuning", {
      left: [
        g(
          [
            n("allkeys-lru (Least Recently Used across all keys)", "personal"),
            n("volatile-lru (LRU with expire set)", "alternative"),
            n("allkeys-lfu (Least Frequently Used)", "personal"),
            n("volatile-ttl (Shortest TTL first)"),
            n("noeviction (Return error on OOM)"),
          ],
          n("Eviction Policies (maxmemory-policy)")
        ),
      ],
      right: [
        g(
          [
            n("maxmemory Limit & allocation overhead", "personal"),
            n("MEMORY USAGE & MEMORY STATS commands", "personal"),
            n("Lazy Freeing (lazyfree-lazy-eviction, UNLINK)"),
            n("Active Memory Defragmentation"),
          ],
          n("Memory Optimization")
        ),
      ],
    }),
    stage("Pipelining, Transactions & Scripting", {
      left: [
        g(
          [
            n("Pipelining (Batch commands, reduce network RTT)", "personal"),
            n("Transactions: MULTI, EXEC, DISCARD", "personal"),
            n("Optimistic Locking with WATCH", "personal"),
          ],
          n("Pipelining & Transactions")
        ),
      ],
      right: [
        g(
          [
            n("Lua Scripting: EVAL, EVALSHA (Atomic execution)", "personal"),
            n("Redis Functions (Redis 7+ isolated modules)", "personal"),
            n("Slow Log (SLOWLOG GET, execution time profiling)", "personal"),
            n("redis-benchmark throughput testing"),
          ],
          n("Scripting & Benchmarking")
        ),
      ],
      noteAfter:
        "Pipelining collapses hundreds of round-trips into a single network packet, boosting throughput by an order of magnitude for bulk operations.",
      projectIdea:
        "Project Idea: High-throughput API rate-limiter built with Redis Lua scripting using the Sliding Window Log algorithm.",
    }),
  ],
};

export const REDIS_SECTIONS: RedisRoadmapSection[] = [
  ARCHITECTURE_AND_CONCEPTS,
  CORE_DATA_STRUCTURES,
  ADVANCED_DATA_TYPES,
  PERSISTENCE_AND_DURABILITY,
  MESSAGING_AND_PUBSUB,
  HIGH_AVAILABILITY_AND_CLUSTERING,
  CACHING_AND_PERFORMANCE,
];
