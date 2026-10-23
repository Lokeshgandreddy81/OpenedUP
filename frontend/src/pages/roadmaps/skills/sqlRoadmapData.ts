export type SqlRoadmapStatus = "personal" | "alternative" | "optional";

export interface SqlRoadmapNode {
  id: string;
  title: string;
  status?: SqlRoadmapStatus;
  roadmapId?: string;
}

export interface SqlRoadmapGroup {
  id: string;
  parent?: SqlRoadmapNode;
  items: SqlRoadmapNode[];
}

export interface SqlRoadmapStage {
  id: string;
  node: SqlRoadmapNode;
  left?: SqlRoadmapGroup[];
  right?: SqlRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface SqlRoadmapSection {
  id: string;
  title?: string;
  stages: SqlRoadmapStage[];
}

export interface SqlRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SQL_MARKERS: Array<{
  status: SqlRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SQL_RELATED_ROADMAPS: SqlRoadmapLink[] = [
  { label: "PostgreSQL Roadmap", roadmapId: "postgresql" },
  { label: "Backend Developer Roadmap", roadmapId: "backend" },
  { label: "Data Engineer Roadmap", roadmapId: "data-engineer" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
  { label: "MongoDB Roadmap", roadmapId: "skill-mongodb" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
];

export const SQL_CONTINUE_LEARNING: SqlRoadmapLink[] = [
  { label: "PostgreSQL", roadmapId: "postgresql" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Data Engineer", roadmapId: "data-engineer" },
  { label: "Data Analyst", roadmapId: "data-analyst" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: SqlRoadmapStatus,
  roadmapId?: string,
  customId?: string
): SqlRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: SqlRoadmapNode[],
  parent?: SqlRoadmapNode,
  customId?: string
): SqlRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<SqlRoadmapStage, "id" | "node"> & {
    status?: SqlRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): SqlRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. SQL BASICS & RELATIONAL CONCEPTS
const SQL_BASICS_AND_RELATIONAL_CONCEPTS: SqlRoadmapSection = {
  id: "sql-basics-and-relational-concepts",
  title: "SQL Basics & Relational Concepts",
  stages: [
    stage("Relational Concepts & RDBMS", {
      left: [
        g(
          [
            n("PostgreSQL", "personal", "postgresql"),
            n("MySQL", "alternative"),
            n("SQLite", "alternative"),
            n("Microsoft SQL Server"),
            n("Oracle Database"),
          ],
          n("Popular RDBMS Engines")
        ),
      ],
      right: [
        g(
          [
            n("Relational Data Model"),
            n("Tables, Rows & Columns"),
            n("Primary Keys"),
            n("Foreign Keys"),
            n("Unique & Candidate Keys"),
            n("Composite Keys"),
          ],
          n("Core Relational Architecture")
        ),
      ],
      noteAfter:
        "Understand relational theory, normalization (1NF, 2NF, 3NF), and how tables relate via primary and foreign key constraints.",
    }),
    stage("Data Types & Constraints", {
      left: [
        g(
          [
            n("Numeric (INT, BIGINT, NUMERIC, FLOAT)"),
            n("Strings (VARCHAR, CHAR, TEXT)"),
            n("Date & Time (DATE, TIME, TIMESTAMP)"),
            n("Boolean & Binary Data (BLOB)"),
            n("JSON & JSONB Data Types"),
          ],
          n("Standard SQL Data Types")
        ),
      ],
      right: [
        g(
          [
            n("NOT NULL Constraint"),
            n("UNIQUE Constraint"),
            n("CHECK Constraints"),
            n("DEFAULT Values"),
            n("Foreign Key ON DELETE / UPDATE (CASCADE, RESTRICT, SET NULL)"),
          ],
          n("Integrity Constraints")
        ),
      ],
    }),
  ],
};

// 2. DATA QUERYING
const DATA_QUERYING: SqlRoadmapSection = {
  id: "data-querying",
  title: "Data Querying",
  stages: [
    stage("Basic Retrieval & Filtering", {
      left: [
        g(
          [
            n("SELECT & SELECT *"),
            n("Column & Table Aliases (AS)"),
            n("WHERE Filtering"),
            n("Comparison Operators (=, !=, <, >, <=, >=)"),
            n("Logical Operators (AND, OR, NOT)"),
          ],
          n("Projection & Conditions")
        ),
      ],
      right: [
        g(
          [
            n("BETWEEN ... AND ..."),
            n("IN and NOT IN Operators"),
            n("Pattern Matching: LIKE, ILIKE & Wildcards (% and _)"),
            n("Null Checks: IS NULL & IS NOT NULL"),
            n("CASE WHEN ... THEN ... ELSE ... END"),
          ],
          n("Conditional & Pattern Matching")
        ),
      ],
    }),
    stage("Sorting, Paging & Uniqueness", {
      left: [
        g(
          [
            n("ORDER BY (ASC / DESC)"),
            n("Multi-Column Sorting"),
            n("NULLS FIRST / NULLS LAST"),
            n("LIMIT and OFFSET"),
            n("FETCH FIRST n ROWS ONLY"),
          ],
          n("Ordering & Pagination")
        ),
      ],
      right: [
        g(
          [
            n("DISTINCT Keyword"),
            n("DISTINCT ON Expressions"),
            n("SELECT INTO New Table"),
            n("COALESCE and NULLIF Functions"),
          ],
          n("Deduplication & Null Utilities")
        ),
      ],
      projectIdea:
        "Project Idea: Build an E-commerce product catalog search query with dynamic filtering, sorting, and pagination",
    }),
  ],
};

// 3. JOINS & SET OPERATIONS
const JOINS_AND_SET_OPERATIONS: SqlRoadmapSection = {
  id: "joins-and-set-operations",
  title: "Joins & Set Operations",
  stages: [
    stage("Relational Joins", {
      left: [
        g(
          [
            n("INNER JOIN", "personal"),
            n("LEFT (OUTER) JOIN", "personal"),
            n("RIGHT (OUTER) JOIN"),
            n("FULL (OUTER) JOIN"),
          ],
          n("Standard Outer & Inner Joins")
        ),
      ],
      right: [
        g(
          [
            n("CROSS JOIN (Cartesian Product)"),
            n("Self Joins (Hierarchical references)"),
            n("Natural Joins"),
            n("LATERAL Joins / CROSS APPLY"),
          ],
          n("Specialized & Lateral Joins")
        ),
      ],
      noteAfter:
        "Master INNER vs LEFT JOIN semantics and practice joining across 3+ tables with compound join conditions.",
    }),
    stage("Set Operations", {
      left: [
        g(
          [n("UNION (Deduplicated rows)"), n("UNION ALL (Preserves duplicates)", "personal")],
          n("Combining Result Sets")
        ),
      ],
      right: [
        g(
          [
            n("INTERSECT (Common rows)"),
            n("EXCEPT / MINUS (Row difference)"),
            n("Schema compatibility rules in set operations"),
          ],
          n("Difference & Intersection")
        ),
      ],
    }),
  ],
};

// 4. AGGREGATIONS & GROUPING
const AGGREGATIONS_AND_GROUPING: SqlRoadmapSection = {
  id: "aggregations-and-grouping",
  title: "Aggregations & Grouping",
  stages: [
    stage("Aggregate Functions & Grouping", {
      left: [
        g(
          [
            n("COUNT(*) vs COUNT(column)"),
            n("SUM and AVG"),
            n("MIN and MAX"),
            n("STRING_AGG / GROUP_CONCAT"),
            n("ARRAY_AGG (PostgreSQL)", undefined, "postgresql"),
          ],
          n("Built-in Aggregations")
        ),
      ],
      right: [
        g(
          [
            n("GROUP BY Clause"),
            n("HAVING Clause (Filter aggregated groups)"),
            n("Difference between WHERE and HAVING"),
            n("GROUPING SETS"),
            n("ROLLUP and CUBE"),
          ],
          n("Multi-Dimensional Grouping")
        ),
      ],
      projectIdea:
        "Project Idea: Write analytics queries generating monthly revenue, customer lifetime value, and churn summaries",
    }),
  ],
};

// 5. SUBQUERIES & COMMON TABLE EXPRESSIONS (CTES)
const SUBQUERIES_AND_CTES: SqlRoadmapSection = {
  id: "subqueries-and-ctes",
  title: "Subqueries & Common Table Expressions",
  stages: [
    stage("Subqueries & Predicates", {
      left: [
        g(
          [
            n("Scalar Subqueries"),
            n("Subqueries in SELECT clause"),
            n("Subqueries in FROM clause (Derived Tables)"),
            n("Subqueries in WHERE / HAVING"),
          ],
          n("Subquery Types")
        ),
      ],
      right: [
        g(
          [
            n("Correlated Subqueries"),
            n("EXISTS & NOT EXISTS", "personal"),
            n("IN vs EXISTS Performance"),
            n("ANY / SOME & ALL Predicates"),
          ],
          n("Correlated Queries & Predicates")
        ),
      ],
    }),
    stage("Common Table Expressions (CTEs)", {
      left: [
        g(
          [
            n("WITH Clause Syntax", "personal"),
            n("Chaining Multiple CTEs"),
            n("Readable query structuring with CTEs"),
            n("CTE vs Subquery readability"),
          ],
          n("Standard CTEs")
        ),
      ],
      right: [
        g(
          [
            n("Recursive CTEs (WITH RECURSIVE)", "personal"),
            n("Anchor member & Recursive union"),
            n("Hierarchical data (Org charts, file trees)"),
            n("Graph traversal in SQL"),
            n("Materialized vs Non-Materialized CTEs"),
          ],
          n("Recursive & Advanced CTEs")
        ),
      ],
      noteAfter:
        "Recursive CTEs allow querying arbitrary tree structures and graph paths directly in relational databases without application-level looping.",
    }),
  ],
};

// 6. ADVANCED SQL: WINDOW FUNCTIONS
const WINDOW_FUNCTIONS: SqlRoadmapSection = {
  id: "advanced-sql-window-functions",
  title: "Advanced SQL: Window Functions",
  stages: [
    stage("Ranking & Value Functions", {
      left: [
        g(
          [
            n("ROW_NUMBER()", "personal"),
            n("RANK()"),
            n("DENSE_RANK()", "personal"),
            n("NTILE(n) (Percentile bucketing)"),
          ],
          n("Ranking Functions")
        ),
      ],
      right: [
        g(
          [
            n("LAG(column, offset)", "personal"),
            n("LEAD(column, offset)", "personal"),
            n("FIRST_VALUE() & LAST_VALUE()"),
            n("NTH_VALUE()"),
          ],
          n("Value Navigation Functions")
        ),
      ],
    }),
    stage("Window Framing & Running Calculations", {
      left: [
        g(
          [
            n("OVER Clause"),
            n("PARTITION BY (Sub-window grouping)", "personal"),
            n("ORDER BY inside OVER clause"),
            n("Named WINDOW Specifications"),
          ],
          n("Window Definitions")
        ),
      ],
      right: [
        g(
          [
            n("Running Totals & Cumulative Sums", "personal"),
            n("Moving Averages"),
            n("ROWS BETWEEN Frame Specification"),
            n("RANGE BETWEEN Frame Specification"),
            n("UNBOUNDED PRECEDING to CURRENT ROW"),
          ],
          n("Framing & Running Totals")
        ),
      ],
      projectIdea:
        "Project Idea: Calculate daily active user streaks, top 3 selling products per category, and month-over-month growth rates",
    }),
  ],
};

// 7. DDL, DML & TRANSACTIONS
const DDL_DML_AND_TRANSACTIONS: SqlRoadmapSection = {
  id: "ddl-dml-and-transactions",
  title: "DDL, DML & Transactions",
  stages: [
    stage("Data Definition & Manipulation", {
      left: [
        g(
          [
            n("CREATE TABLE, VIEW, MATERIALIZED VIEW"),
            n("ALTER TABLE (ADD, DROP, RENAME column)"),
            n("DROP vs TRUNCATE vs DELETE"),
            n("CREATE SCHEMA & Search Paths"),
          ],
          n("Data Definition Language (DDL)")
        ),
      ],
      right: [
        g(
          [
            n("INSERT INTO (Single & Multi-Row)"),
            n("UPDATE with JOIN & WHERE"),
            n("DELETE with cascading implications"),
            n("UPSERT / MERGE / ON CONFLICT DO UPDATE", "personal"),
            n("RETURNING Clause (INSERT/UPDATE RETURNING)"),
          ],
          n("Data Manipulation Language (DML)")
        ),
      ],
    }),
    stage("Transactions & Concurrency Control", {
      left: [
        g(
          [
            n("ACID Properties (Atomicity, Consistency, Isolation, Durability)"),
            n("BEGIN / START TRANSACTION"),
            n("COMMIT & ROLLBACK"),
            n("SAVEPOINT & ROLLBACK TO SAVEPOINT"),
          ],
          n("ACID & Transaction Commands")
        ),
      ],
      right: [
        g(
          [
            n("Read Uncommitted"),
            n("Read Committed (Default in Postgres)"),
            n("Repeatable Read"),
            n("Serializable (Highest isolation)"),
            n("Concurrency Phenomena: Dirty Reads, Non-repeatable Reads, Phantom Reads"),
            n("Row-level Locking: SELECT ... FOR UPDATE"),
            n("Deadlock Detection & Resolution"),
          ],
          n("Isolation Levels & Locks")
        ),
      ],
      noteAfter:
        "Understand transaction isolation levels and row-level locks to prevent race conditions and lost updates in high-concurrency systems.",
    }),
  ],
};

// 8. INDEXING & QUERY OPTIMIZATION
const INDEXING_AND_QUERY_OPTIMIZATION: SqlRoadmapSection = {
  id: "indexing-and-query-optimization",
  title: "Indexing & Query Optimization",
  stages: [
    stage("Indexes & Storage Engines", {
      left: [
        g(
          [
            n("B-Tree Indexes (Default & Most Common)", "personal"),
            n("Hash Indexes"),
            n("GIN & GiST Indexes (Full-Text, Arrays, JSONB)", undefined, "postgresql"),
            n("BRIN Indexes (Block Range)"),
          ],
          n("Index Data Structures")
        ),
      ],
      right: [
        g(
          [
            n("Composite / Multi-Column Indexes"),
            n("Leftmost Prefix Rule"),
            n("Partial / Filtered Indexes (WHERE condition)", "personal"),
            n("Covering Indexes & Index-Only Scans"),
            n("Write overhead & Index bloat"),
          ],
          n("Index Design & Strategy")
        ),
      ],
    }),
    stage("Query Optimization & Execution Plans", {
      left: [
        g(
          [
            n("EXPLAIN & EXPLAIN ANALYZE", "personal"),
            n("Estimated Cost vs Actual Timing"),
            n("Sequential Scan (Seq Scan / Table Scan)"),
            n("Index Scan vs Index Only Scan vs Bitmap Scan"),
          ],
          n("Execution Plans & Profiling")
        ),
      ],
      right: [
        g(
          [
            n("Join Algorithms: Nested Loop, Hash Join, Merge Join"),
            n("SARGable Queries (Writing index-friendly WHERE clauses)"),
            n("Avoiding wildcard leading LIKE '%text'"),
            n("Connection Pooling (PgBouncer, HikariCP)"),
            n("Table Partitioning (Range, List, Hash)"),
          ],
          n("Optimization Techniques")
        ),
      ],
      projectIdea:
        "Project Idea: Benchmark and optimize a slow query from 1.5s down to 3ms using indexing, EXPLAIN ANALYZE, and rewrite techniques",
    }),
  ],
};

export const SQL_SECTIONS: SqlRoadmapSection[] = [
  SQL_BASICS_AND_RELATIONAL_CONCEPTS,
  DATA_QUERYING,
  JOINS_AND_SET_OPERATIONS,
  AGGREGATIONS_AND_GROUPING,
  SUBQUERIES_AND_CTES,
  WINDOW_FUNCTIONS,
  DDL_DML_AND_TRANSACTIONS,
  INDEXING_AND_QUERY_OPTIMIZATION,
];
