export type PostgreSqlRoadmapStatus = "personal" | "alternative" | "optional";

export interface PostgreSqlRoadmapNode {
  id: string;
  title: string;
  status?: PostgreSqlRoadmapStatus;
  roadmapId?: string;
}

export interface PostgreSqlRoadmapGroup {
  id: string;
  parent?: PostgreSqlRoadmapNode;
  items: PostgreSqlRoadmapNode[];
}

export interface PostgreSqlRoadmapStage {
  id: string;
  node: PostgreSqlRoadmapNode;
  left?: PostgreSqlRoadmapGroup[];
  right?: PostgreSqlRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface PostgreSqlRoadmapSection {
  id: string;
  title?: string;
  stages: PostgreSqlRoadmapStage[];
}

export interface PostgreSqlRoadmapLink {
  label: string;
  roadmapId: string;
}

export const POSTGRESQL_MARKERS: Array<{
  status: PostgreSqlRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const POSTGRESQL_RELATED_ROADMAPS: PostgreSqlRoadmapLink[] = [
  { label: "SQL Roadmap", roadmapId: "sql" },
  { label: "MongoDB Roadmap", roadmapId: "mongodb" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
];

export const POSTGRESQL_CONTINUE_LEARNING: PostgreSqlRoadmapLink[] = [
  { label: "MongoDB", roadmapId: "mongodb" },
  { label: "Backend", roadmapId: "backend" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "SQL", roadmapId: "sql" },
  { label: "Full Stack", roadmapId: "full-stack" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: PostgreSqlRoadmapStatus,
  roadmapId?: string,
  customId?: string
): PostgreSqlRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: PostgreSqlRoadmapNode[],
  parent?: PostgreSqlRoadmapNode,
  customId?: string
): PostgreSqlRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<PostgreSqlRoadmapStage, "id" | "node"> & {
    status?: PostgreSqlRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): PostgreSqlRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS_SECTION: PostgreSqlRoadmapSection = {
  id: "relational-foundations",
  title: "Relational & Database Foundations",
  stages: [
    stage("Introduction", {
      right: [
        g([
          n("What are Relational Databases?"),
          n("RDBMS Benefits and Limitations"),
          n("PostgreSQL vs Other RDBMS"),
          n("PostgreSQL vs NoSQL Databases"),
        ]),
      ],
    }),
    stage("Basic RDBMS Concepts", {
      left: [
        g(
          [
            n("Databases"),
            n("Schemas"),
            n("Tables"),
            n("Columns"),
            n("Rows"),
            n("Data Types", undefined, undefined, "object-model-data-types"),
            n("Queries"),
          ],
          n("Object Model")
        ),
        g(
          [n("Domains"), n("Attributes"), n("Tuples"), n("Relations"), n("Constraints"), n("NULL")],
          n("Relational Model")
        ),
      ],
      right: [
        g(
          [
            n("ACID"),
            n("MVCC"),
            n("Transactions", undefined, undefined, "rdbms-transactions"),
            n("Write-ahead Log", undefined, undefined, "rdbms-wal"),
            n("Query Processing"),
          ],
          n("High Level Database Concepts")
        ),
      ],
    }),
  ],
};

const SETUP_AND_SQL_SECTION: PostgreSqlRoadmapSection = {
  id: "installation-and-sql",
  title: "Installation, Management & SQL",
  stages: [
    stage("Installation and Setup", {
      left: [
        g(
          [
            n("Package Managers", "personal"),
            n("Using Docker", "personal"),
            n("Using systemd", "personal", undefined, "using-systemd"),
            n("Using pg_ctl", "alternative", undefined, "using-pg-ctl"),
            n("Using pg_ctlcluster", "alternative", undefined, "using-pg-ctlcluster"),
            n("Deployment in Cloud", "optional"),
            n("Connect using psql", "personal", undefined, "connect-using-psql"),
          ],
          n("Managing Postgres")
        ),
      ],
      noteAfter:
        "Understand PostgreSQL cluster architecture and process lifecycle before moving to advanced administration.",
    }),
    stage("Learn SQL", {
      roadmapId: "sql",
      status: "personal",
      right: [
        g(
          [
            n("For Schemas"),
            n("ForTables"),
            n("Data Types", undefined, undefined, "ddl-data-types"),
          ],
          n("DDL Queries")
        ),
        g(
          [
            n("Querying Data"),
            n("Filtering Data"),
            n("Modifying Data"),
            n("Joining Tables"),
            n("Import / Export Using COPY", undefined, undefined, "import-export-copy"),
          ],
          n("DML Queries")
        ),
        g(
          [
            n("Transactions", undefined, undefined, "sql-transactions"),
            n("Subqueries"),
            n("Grouping"),
            n("Set Operations"),
            n("CTE"),
            n("Lateral Join"),
          ],
          n("Advanced Topics")
        ),
      ],
      projectIdea: "Design and Benchmark a Normalized PostgreSQL Schema",
    }),
  ],
};

const CONFIGURATION_AND_SECURITY_SECTION: PostgreSqlRoadmapSection = {
  id: "configuration-and-security",
  title: "Configuration & Security",
  stages: [
    stage("Configuring", {
      left: [
        g(
          [
            n("Resource Usage", "personal"),
            n("Write-ahead Log", "personal", undefined, "conf-wal"),
            n("Checkpoints / Background Writer", "personal"),
            n("Query Planner", "personal"),
            n("Vacuums", "personal"),
            n("Replication", "personal", undefined, "conf-replication"),
          ],
          n("Following postgres.conf configuration")
        ),
        g([n("Reporting Logging & Statistics"), n("Adding Extra Extensions")]),
      ],
      right: [
        g(
          [n("Default Privileges"), n("Grant / Revoke"), n("Object Privileges")],
          n("Privilege Management")
        ),
      ],
    }),
    stage("Security", {
      right: [
        g(
          [
            n("Authentication Models", "personal"),
            n("Roles", "personal"),
            n("pg_hba.conf", "personal"),
            n("Row-Level Security", "personal"),
            n("SSL Settings", "personal"),
            n("SELinux", "alternative"),
            n("Advanced Topics", "optional", undefined, "security-advanced-topics"),
          ],
          n("Authentication & Access Control")
        ),
      ],
      noteAfter:
        "Always enforce least privilege with dedicated service roles, tight pg_hba.conf CIDRs, and SSL encryption.",
    }),
  ],
};

const INFRASTRUCTURE_AND_AUTOMATION_SECTION: PostgreSqlRoadmapSection = {
  id: "infrastructure-and-automation",
  title: "Infrastructure, Backups & High Availability",
  stages: [
    stage("Infrastructure Skills", {
      left: [
        g([n("PostgreSQL Anonymizer", "personal")], n("Anonymization")),
        g(
          [
            n("Using pg_upgrade", "personal", undefined, "using-pg-upgrade"),
            n("Using Logical Replication", "alternative", undefined, "upgrade-logical-replication"),
          ],
          n("Upgrade Procedures")
        ),
      ],
      right: [
        g(
          [
            n("pg_dump", "personal"),
            n("pg_dumpall", "alternative"),
            n("pg_restore", "personal"),
            n("pg_basebackup", "personal"),
          ],
          n("Builtin Tools")
        ),
        g(
          [
            n("pgbackrest", "personal"),
            n("WAL-G", "alternative"),
            n("barman", "alternative"),
            n("pg_probackup", "alternative"),
          ],
          n("3rd Party")
        ),
        g([n("Backup Validation Procedures", "personal")]),
      ],
      noteAfter:
        "An untested backup is not a backup. Routinely validate and automate WAL archiving and point-in-time recovery (PITR).",
    }),
    stage("Learn to Automate", {
      left: [
        g([n("Shell Scripts", "personal"), n("Any Programming Language", "personal")]),
        g(
          [
            n("Ansible", "personal"),
            n("Salt", "alternative"),
            n("Puppet", "alternative"),
            n("Chef", "alternative"),
          ],
          n("Configuration Management")
        ),
        g([n("DevOps Roadmap", "personal", "devops")]),
        g(
          [
            n("Simple Stateful Setup", "personal"),
            n("Helm", "personal"),
            n("Operators", "personal"),
          ],
          n("Kubernetes Deployment")
        ),
      ],
      right: [
        g(
          [n("Patroni", "personal"), n("Patroni Alternatives", "alternative")],
          n("Cluster Management")
        ),
        g(
          [
            n("Streaming Replication", "personal"),
            n("Logical Replication", "personal", undefined, "ha-logical-replication"),
          ],
          n("Replication")
        ),
        g(
          [n("PgBouncer", "personal"), n("PgBouncer Alternatives", "alternative")],
          n("Connection Pooling")
        ),
        g(
          [
            n("HAProxy", "personal"),
            n("KeepAlived", "alternative"),
            n("Consul", "personal"),
            n("Etcd", "personal"),
          ],
          n("Load Balancing / Discovery")
        ),
        g(
          [
            n("Prometheus", "personal"),
            n("Zabbix", "alternative"),
            n("temBoard", "alternative"),
            n("check_pgactivity", "personal"),
            n("check_pgbackrest", "personal"),
            n("Resource Usage / Provisioning / Capacity Planning", "personal"),
          ],
          n("Monitoring")
        ),
      ],
      projectIdea: "Setup an HA Cluster with Patroni, etcd, HAProxy, and PgBouncer",
    }),
  ],
};

const APPLICATION_SKILLS_AND_INTERNALS_SECTION: PostgreSqlRoadmapSection = {
  id: "application-skills-and-internals",
  title: "Application Architecture, Tuning & Internals",
  stages: [
    stage("Application Skills", {
      left: [
        g(
          [
            n("Practical Patterns / Antipatterns", "personal"),
            n("Migration Related Tools", "personal"),
          ],
          n("Migrations")
        ),
        g(
          [
            n("Patterns / Antipatterns", "personal", undefined, "queue-patterns"),
            n("PgQ", "alternative"),
          ],
          n("Queues")
        ),
      ],
      right: [
        g(
          [
            n("Bulk Loading / Processing Data", "personal"),
            n("Data Partitioning", "personal"),
            n("Sharding Patterns", "alternative"),
            n("Normalization / Normal Forms", "personal"),
          ],
          n("Data and Processing")
        ),
      ],
    }),
    stage("Low Level Internals", {
      left: [
        g(
          [
            n("Processes & Memory Architecture", "personal"),
            n("Vacuum Processing", "personal"),
            n("Buffer Management", "personal"),
            n("Lock Management", "personal"),
            n("Physical Storage and File Layout", "personal"),
            n("System Catalog", "personal"),
          ],
          n("Core Engine Internals")
        ),
      ],
      right: [
        g(
          [
            n("PL/pgSQL", "personal"),
            n("Procedures and Functions", "personal"),
            n("Triggers", "personal"),
            n("Recursive CTE", "personal"),
            n("Aggregate and Window functions", "personal"),
          ],
          n("Advanced SQL")
        ),
        g(
          [
            n("Per-User, Per-Database Setting", "personal"),
            n("Storage Parameters", "personal"),
            n("OLTP", "personal"),
            n("OLAP", "personal"),
            n("HTAP", "alternative"),
            n("Workload-Dependant Tuning", "personal"),
          ],
          n("Fine-grained Tuning")
        ),
      ],
      noteAfter:
        "Understand PostgreSQL shared buffers, WAL writers, and autovacuum heuristics to prevent table bloat and wraparound issues.",
    }),
  ],
};

const TROUBLESHOOTING_OPTIMIZATION_AND_DEV_SECTION: PostgreSqlRoadmapSection = {
  id: "troubleshooting-and-dev",
  title: "Troubleshooting, Query Optimization & Open Source",
  stages: [
    stage("Troubleshooting Techniques", {
      left: [
        g(
          [n("pg_stat_activity", "personal"), n("pg_stat_statements", "personal")],
          n("Posgres System Views")
        ),
        g(
          [n("USE", "personal"), n("RED", "personal"), n("Golden Signals", "personal")],
          n("Techniques")
        ),
        g([n("pgcenter", "personal")], n("Posgres Tools")),
      ],
      right: [
        g(
          [
            n("EXPLAIN", "personal"),
            n("PEV2", "personal"),
            n("Depesz", "alternative"),
            n("Tensor", "alternative"),
            n("explain.dalibo.com", "alternative"),
          ],
          n("Query Analysis")
        ),
        g(
          [
            n("perf-tools", "personal"),
            n("gdb", "alternative"),
            n("strace", "personal"),
            n("Core Dumps", "optional"),
            n("ebpf", "alternative"),
          ],
          n("Profiling Tools")
        ),
        g(
          [n("top", "personal"), n("sysstat", "personal"), n("iotop", "personal")],
          n("Operating System Tools")
        ),
        g(
          [
            n("pgBadger", "personal"),
            n("pgCluu", "alternative"),
            n("awk", "personal"),
            n("grep", "personal"),
            n("sed", "personal"),
          ],
          n("Log Analysis")
        ),
      ],
      noteAfter:
        "Enable pg_stat_statements from day one. It provides query runtime distributions, cache hit ratios, and temp file usage.",
    }),
    stage("SQL Optimization Techniques", {
      left: [
        g([
          n("SQL Query Patterns / Anti-patterns", "personal"),
          n("Schema Design Patterns / Anti-patterns", "personal"),
        ]),
      ],
      right: [
        g(
          [
            n("B-Tree", "personal"),
            n("BRIN", "alternative"),
            n("GiST", "alternative"),
            n("Hash", "alternative"),
            n("SP-GiST", "alternative"),
            n("GIN", "personal"),
          ],
          n("Indexes and their Usecases")
        ),
      ],
    }),
    stage("Get Involved in Development", {
      right: [
        g([
          n("Mailing Lists", "personal"),
          n("Reviewing Patches", "personal"),
          n("Writing Patches", "alternative"),
        ]),
      ],
    }),
  ],
};

export const POSTGRESQL_SECTIONS: PostgreSqlRoadmapSection[] = [
  FOUNDATIONS_SECTION,
  SETUP_AND_SQL_SECTION,
  CONFIGURATION_AND_SECURITY_SECTION,
  INFRASTRUCTURE_AND_AUTOMATION_SECTION,
  APPLICATION_SKILLS_AND_INTERNALS_SECTION,
  TROUBLESHOOTING_OPTIMIZATION_AND_DEV_SECTION,
];
