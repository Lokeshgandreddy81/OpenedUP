export type ElasticsearchRoadmapStatus = "personal" | "alternative" | "optional";

export interface ElasticsearchRoadmapNode {
  id: string;
  title: string;
  status?: ElasticsearchRoadmapStatus;
  roadmapId?: string;
}

export interface ElasticsearchRoadmapGroup {
  id: string;
  parent?: ElasticsearchRoadmapNode;
  items: ElasticsearchRoadmapNode[];
}

export interface ElasticsearchRoadmapStage {
  id: string;
  node: ElasticsearchRoadmapNode;
  left?: ElasticsearchRoadmapGroup[];
  right?: ElasticsearchRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ElasticsearchRoadmapSection {
  id: string;
  title?: string;
  stages: ElasticsearchRoadmapStage[];
}

export interface ElasticsearchRoadmapLink {
  label: string;
  roadmapId: string;
}

export const ELASTICSEARCH_MARKERS: Array<{
  status: ElasticsearchRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const ELASTICSEARCH_RELATED_ROADMAPS: ElasticsearchRoadmapLink[] = [
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Data Engineer Roadmap", roadmapId: "data-engineer" },
  { label: "System Design Roadmap", roadmapId: "skill-system-design" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
];

export const ELASTICSEARCH_CONTINUE_LEARNING: ElasticsearchRoadmapLink[] = [
  { label: "Data Engineer", roadmapId: "data-engineer" },
  { label: "Backend", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Docker", roadmapId: "skill-docker" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ElasticsearchRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ElasticsearchRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ElasticsearchRoadmapNode[],
  parent?: ElasticsearchRoadmapNode,
  customId?: string
): ElasticsearchRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ElasticsearchRoadmapStage, "id" | "node"> & {
    status?: ElasticsearchRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ElasticsearchRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. ARCHITECTURE & CORE CONCEPTS
const ARCHITECTURE_AND_CORE_CONCEPTS: ElasticsearchRoadmapSection = {
  id: "architecture-and-core-concepts",
  title: "Architecture & Core Concepts",
  stages: [
    stage("Cluster Topology & Node Roles", {
      status: "personal",
      left: [
        g(
          [
            n("Cluster state & Master elections"),
            n("Master-eligible nodes (cluster metadata coordination)"),
            n("Data nodes (hot, warm, cold, frozen data tiers)"),
            n("Ingest nodes (pre-indexing ingest pipelines)"),
            n("Coordinating-only nodes (query scatter-gather)"),
          ],
          n("Node Roles & Responsibilities")
        ),
      ],
      right: [
        g(
          [
            n("Primary shards (hash routing: hash(_routing) % num_shards)"),
            n("Replica shards (failover redundancy & read throughput)"),
            n("Shard allocation awareness & cluster balancing"),
            n("Split & Shrink APIs for resizing indices"),
          ],
          n("Shards & Replication")
        ),
      ],
      noteAfter:
        "Elasticsearch indices are divided into logical shards, each backed by an independent Apache Lucene instance running on the host JVM.",
    }),
    stage("Lucene Foundations & Storage Internals", {
      status: "personal",
      left: [
        g(
          [
            n("Inverted Index structure (terms to posting lists)"),
            n("Term dictionary & Term index (FST - Finite State Transducer)"),
            n("Doc Values (columnar storage for sorting & aggs)"),
            n("Points (BKD trees for multidimensional range queries)"),
          ],
          n("Lucene Data Structures")
        ),
      ],
      right: [
        g(
          [
            n("Document immutability (updates create new docs + tombstone)"),
            n("_source field (stored original JSON document)"),
            n("Translog (transaction log for crash durability)"),
            n("Refresh (writes in-memory buffer to OS page cache)"),
            n("Flush (fsync segments to disk & truncate translog)"),
            n("Segment merging & force-merge API"),
          ],
          n("Segment Lifecycle & Durability")
        ),
      ],
      projectIdea:
        "Spin up a multi-node Elasticsearch cluster with distinct master and data tier roles",
    }),
  ],
};

// 2. TEXT ANALYSIS & INDEX MAPPING
const TEXT_ANALYSIS_AND_INDEX_MAPPING: ElasticsearchRoadmapSection = {
  id: "text-analysis-and-index-mapping",
  title: "Text Analysis & Index Mapping",
  stages: [
    stage("Text Analysis Pipeline", {
      status: "personal",
      left: [
        g(
          [
            n("Character Filters (html_strip, mapping, pattern_replace)"),
            n("Tokenizers (standard, whitespace, ngram, edge_ngram, uax_url_email)"),
            n("Token Filters (lowercase, stop words, stemmer, synonym, shingle)"),
            n("_analyze API for real-time token testing"),
          ],
          n("Analysis Components")
        ),
      ],
      right: [
        g(
          [
            n("Built-in Analyzers (standard, simple, whitespace, stop, language)"),
            n("Custom Analyzers (combining char filters, tokenizer & token filters)"),
            n("Normalizers for keyword fields (case-insensitive keyword matching)"),
            n("Search analyzer vs Index analyzer differences"),
          ],
          n("Custom Analyzers & Normalizers")
        ),
      ],
    }),
    stage("Index Mapping & Schema Design", {
      status: "personal",
      left: [
        g(
          [
            n("Dynamic Mapping (Automatic field deduction risks)"),
            n("Explicit Mapping (Strict schema enforcement with dynamic: strict)"),
            n("Dynamic Templates for pattern-based field mapping"),
            n("Field mappings immutability & Reindex API"),
          ],
          n("Mapping Strategies")
        ),
      ],
      right: [
        g(
          [
            n("text (analyzed for full-text) vs keyword (exact matching)"),
            n("Numeric types (long, integer, scaled_float) & boolean"),
            n("Date & date_nanos formats with timezone parsing"),
            n("object type vs nested type (preventing object flattening)"),
            n("join field type (parent-child relationships)"),
            n("geo_point and geo_shape for geospatial indexing"),
          ],
          n("Elasticsearch Field Types")
        ),
      ],
      noteAfter:
        "Prefer `keyword` for exact matches, sorting, and aggregations; use `text` with custom analyzers only when full-text linguistic search is needed.",
      projectIdea:
        "Design an explicit mapping with custom edge_ngram autocomplete and synonym analyzers",
    }),
  ],
};

// 3. QUERY DSL & SEARCH
const QUERY_DSL_AND_SEARCH: ElasticsearchRoadmapSection = {
  id: "query-dsl-and-search",
  title: "Query DSL & Search",
  stages: [
    stage("Full-Text & Term-Level Queries", {
      status: "personal",
      left: [
        g(
          [
            n("term and terms queries (Exact match, bypasses analysis)"),
            n("exists and ids queries"),
            n("match query (Analyzes input and matches terms)"),
            n("match_phrase and match_phrase_prefix (Order & slop)"),
            n("multi_match (best_fields, most_fields, cross_fields, phrase)"),
          ],
          n("Query Primitives")
        ),
      ],
      right: [
        g(
          [
            n("bool query structure (must, filter, should, must_not)"),
            n("Query context (calculates _score) vs Filter context (cached, no score)"),
            n("minimum_should_match tuning"),
            n("constant_score query for fast filtered results"),
            n("boosting and negative boosting queries"),
          ],
          n("Compound & Boolean Queries")
        ),
      ],
    }),
    stage("Relevance Scoring & Advanced Search", {
      status: "personal",
      left: [
        g(
          [
            n("BM25 Similarity algorithm (TF, IDF, document length normalization)"),
            n("Field-level boosting (field^2.0)"),
            n("Explain API (_explain) for score breakdown"),
            n("function_score & script_score (decay functions, field value factor)"),
          ],
          n("Relevance & BM25 Scoring")
        ),
      ],
      right: [
        g(
          [
            n("range query (gt, gte, lt, lte on numbers and dates)"),
            n("fuzzy query (Levenshtein distance & prefix_length)"),
            n("prefix, wildcard, and regexp queries"),
            n("nested query & inner_hits for querying nested objects"),
            n("Search pagination (from/size vs search_after vs scroll API)"),
            n("Highlighting search hits (_highlight)"),
          ],
          n("Advanced Queries & Pagination")
        ),
      ],
      noteAfter:
        "Always execute non-scoring constraints (IDs, status codes, date ranges) inside `bool.filter` blocks so Elasticsearch can utilize node-level query bitset caches.",
      projectIdea:
        "Build an e-commerce search engine with multi-match boosting, fuzzy typo tolerance, and nested variant filtering",
    }),
  ],
};

// 4. AGGREGATIONS
const AGGREGATIONS: ElasticsearchRoadmapSection = {
  id: "aggregations",
  title: "Aggregations",
  stages: [
    stage("Metric & Bucket Aggregations", {
      status: "personal",
      left: [
        g(
          [
            n("Single-value metrics: avg, sum, min, max, value_count"),
            n("Multi-value metrics: stats, extended_stats"),
            n("cardinality aggregation (HyperLogLog++ precision_threshold)"),
            n("percentiles and percentile_ranks"),
            n("top_hits aggregation for grouping representative docs"),
          ],
          n("Metric Aggregations")
        ),
      ],
      right: [
        g(
          [
            n("terms aggregation (size, shard_size, min_doc_count)"),
            n("date_histogram (fixed_interval vs calendar_interval)"),
            n("histogram and range / date_range buckets"),
            n("filters aggregation (multi-bucket custom filtering)"),
            n("composite aggregation (paginating multi-dimensional buckets)"),
          ],
          n("Bucket Aggregations")
        ),
      ],
    }),
    stage("Pipeline Aggregations & Nesting", {
      left: [
        g(
          [
            n("Parent pipeline aggs (cumulative_sum, derivative, moving_fn)"),
            n("Sibling pipeline aggs (avg_bucket, max_bucket, min_bucket)"),
            n("bucket_script (arithmetic calculations across bucket metrics)"),
            n("bucket_sort for sorting and paginating bucket results"),
          ],
          n("Pipeline Aggregations")
        ),
      ],
      right: [
        g(
          [
            n("Multi-level nested bucket aggregations"),
            n("reverse_nested aggregation"),
            n("Global aggregation for unaffected cluster metrics"),
            n("doc_values vs fielddata in heap memory"),
          ],
          n("Advanced Aggregation Architectures")
        ),
      ],
      noteAfter:
        "When running `terms` aggregations on large distributed datasets, tune `shard_size` to reduce term estimation error across individual shard results.",
      projectIdea:
        "Build a real-time analytics dashboard calculating moving averages, 95th percentiles, and cumulative revenue",
    }),
  ],
};

// 5. VECTOR SEARCH & DENSE VECTORS
const VECTOR_SEARCH_AND_DENSE_VECTORS: ElasticsearchRoadmapSection = {
  id: "vector-search-and-dense-vectors",
  title: "Vector Search & Dense Vectors",
  stages: [
    stage("Dense Vector Indexing & HNSW", {
      status: "personal",
      left: [
        g(
          [
            n("dense_vector field type & dimensions configuration"),
            n("Vector indexing: index: true with HNSW"),
            n("Similarity metrics: cosine, dot_product, l2_norm, max_inner_product"),
            n("int8 scalar quantization & byte vectors for memory compression"),
          ],
          n("Dense Vector Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Hierarchical Navigable Small World (HNSW) graph algorithm"),
            n("m parameter (max connections per node in graph)"),
            n("ef_construction parameter (indexing exploration depth)"),
            n("kNN query top-level parameter (field, query_vector, k, num_candidates)"),
            n("Pre-filtering vs post-filtering in approximate kNN"),
          ],
          n("Approximate kNN & Graph Tuning")
        ),
      ],
    }),
    stage("Hybrid Search & Semantic Ranking", {
      status: "personal",
      left: [
        g(
          [
            n("Reciprocal Rank Fusion (RRF) algorithm"),
            n("Combining BM25 full-text rank + kNN vector rank"),
            n("rrf: { rank_constant, window_size } tuning"),
            n("Linear score combinations with query boosting"),
          ],
          n("Hybrid Search & RRF")
        ),
      ],
      right: [
        g(
          [
            n("ELSER (Elastic Learned Sparse EncodeR) sparse vector model"),
            n("text_expansion query for sparse vector retrieval"),
            n("Deploying PyTorch models via Eland into Elasticsearch"),
            n("Semantic search retrieval-augmented generation (RAG) pipelines"),
          ],
          n("Learned Sparse Retrieval & ML")
        ),
      ],
      noteAfter:
        "Hybrid search leveraging RRF merges the exact keyword precision of BM25 with the conceptual semantic awareness of dense vector embeddings.",
      projectIdea:
        "Implement a hybrid search retrieval engine combining OpenAI embeddings, kNN vector search, BM25, and RRF",
    }),
  ],
};

// 6. OPERATIONS, PERFORMANCE & SCALING
const OPERATIONS_AND_SCALING: ElasticsearchRoadmapSection = {
  id: "operations-and-scaling",
  title: "Operations, Performance & Scaling",
  stages: [
    stage("Index Lifecycle Management (ILM) & Data Streams", {
      status: "personal",
      left: [
        g(
          [
            n("ILM Phases: Hot -> Warm -> Cold -> Frozen -> Delete"),
            n("Rollover API triggers (max_age, max_primary_shard_size, max_docs)"),
            n("Index templates (Composable index templates & component templates)"),
            n("Searchable Snapshots in Cold and Frozen tiers"),
          ],
          n("Index Lifecycle Management (ILM)")
        ),
      ],
      right: [
        g(
          [
            n("Data Streams for time-series logs and events"),
            n("Backing indices management in data streams"),
            n("@timestamp requirement and append-only ingestion"),
            n("Elasticsearch cross-cluster search (CCS) & cross-cluster replication (CCR)"),
          ],
          n("Data Streams & Multi-Cluster")
        ),
      ],
    }),
    stage("Performance Tuning, Snapshots & Kibana", {
      status: "personal",
      left: [
        g(
          [
            n("Bulk API indexing optimization (_bulk)"),
            n("Tuning refresh_interval (-1 during initial ingestion)"),
            n("JVM heap sizing (Set heap <= 30GB to keep compressed OOPs active)"),
            n("Optimal shard sizing rule (10GB - 50GB per shard)"),
            n("Thread pools tuning (write, search, get)"),
          ],
          n("Cluster & Ingestion Performance")
        ),
      ],
      right: [
        g(
          [
            n("Snapshot repositories (AWS S3, Google Cloud Storage, Shared NFS)"),
            n("Snapshot Lifecycle Management (SLM) policies"),
            n("Restoring indices and indices point-in-time recovery"),
            n("Kibana Dev Tools, Discover, Lens, and Dashboard visualization"),
            n("Elasticsearch Stack Monitoring (metricbeat & APM)"),
          ],
          n("Snapshots, Backup & Kibana")
        ),
      ],
      noteAfter:
        "Never allocate more than 31GB of JVM heap to an Elasticsearch node. Beyond ~31GB, JVM compressed object pointers (Compressed OOPs) disable, drastically increasing memory overhead.",
      projectIdea:
        "Configure an ILM policy with hot-warm data tiers, automated rollover, and automated S3 snapshot backups",
    }),
  ],
};

export const ELASTICSEARCH_SECTIONS: ElasticsearchRoadmapSection[] = [
  ARCHITECTURE_AND_CORE_CONCEPTS,
  TEXT_ANALYSIS_AND_INDEX_MAPPING,
  QUERY_DSL_AND_SEARCH,
  AGGREGATIONS,
  VECTOR_SEARCH_AND_DENSE_VECTORS,
  OPERATIONS_AND_SCALING,
];
