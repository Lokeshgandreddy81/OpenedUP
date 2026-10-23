export type MongoDbRoadmapStatus = "personal" | "alternative" | "optional";

export interface MongoDbRoadmapNode {
  id: string;
  title: string;
  status?: MongoDbRoadmapStatus;
  roadmapId?: string;
}

export interface MongoDbRoadmapGroup {
  id: string;
  parent?: MongoDbRoadmapNode;
  items: MongoDbRoadmapNode[];
}

export interface MongoDbRoadmapStage {
  id: string;
  node: MongoDbRoadmapNode;
  left?: MongoDbRoadmapGroup[];
  right?: MongoDbRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface MongoDbRoadmapSection {
  id: string;
  title?: string;
  stages: MongoDbRoadmapStage[];
}

export interface MongoDbRoadmapLink {
  label: string;
  roadmapId: string;
}

export const MONGODB_MARKERS: Array<{
  status: MongoDbRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const MONGODB_RELATED_ROADMAPS: MongoDbRoadmapLink[] = [
  { label: "Postgresql Dba Roadmap", roadmapId: "postgresql-dba" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Nodejs Roadmap", roadmapId: "skill-nodejs" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
];

export const MONGODB_CONTINUE_LEARNING: MongoDbRoadmapLink[] = [
  { label: "Postgresql Dba Roadmap", roadmapId: "postgresql-dba" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Nodejs Roadmap", roadmapId: "skill-nodejs" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: MongoDbRoadmapStatus,
  roadmapId?: string,
  customId?: string
): MongoDbRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: MongoDbRoadmapNode[],
  parent?: MongoDbRoadmapNode,
  customId?: string
): MongoDbRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<MongoDbRoadmapStage, "id" | "node"> & {
    status?: MongoDbRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): MongoDbRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: MongoDbRoadmapSection = {
  id: "phase-1",
  title:
    "Phase 1 \u2014 Find the detailed version of this roadmap along with other similar roadmaps",
  stages: [
    stage("Find the detailed version of this roadmap along with other similar roadmaps", {
      status: "personal",
      left: [g([n("Related Roadmaps"), n("BSON vs JSON")])],
      right: [g([n("SQL vs NoSQL")])],
    }),
    stage("MongoDB Basics", {
      status: "personal",
      left: [
        g([
          n("Embedded Objects & Arrays"),
          n("String"),
          n("Double"),
          n("Object"),
          n("Array"),
          n("Undefined"),
          n("Binary Data"),
          n("Boolean"),
          n("Object ID"),
          n("Null"),
          n("Date"),
          n("Data Model & Data Types"),
        ]),
      ],
      right: [
        g([
          n("What is MongoDB?"),
          n("When to use MongoDB?"),
          n("What is MongoDB Atlas?"),
          n("MongoDB Terminology"),
          n("Counting Documents"),
        ]),
      ],
    }),
    stage("Data Model & Data Types", {
      status: "personal",
      left: [
        g([n("Regular Expression"), n("Symbol"), n("JavaScript"), n("Collections & Methods")]),
      ],
      right: [g([n("insert() and relevant"), n("find() and relevant")])],
    }),
    stage("Collections & Methods", {
      status: "personal",
      left: [
        g([
          n("Int32/Int"),
          n("Int64 / Long"),
          n("Decimal128"),
          n("Timestamp"),
          n("Max Key"),
          n("Min Key"),
          n("Useful concepts"),
        ]),
      ],
      right: [
        g([
          n("update() and relevant"),
          n("delete() and relevant"),
          n("bulkWrite() and relevant"),
          n("validate()"),
        ]),
      ],
    }),
  ],
};

const SECTION_2: MongoDbRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Useful concepts",
  stages: [
    stage("Useful concepts", {
      status: "personal",
      left: [
        g([
          n("Read / Write Concerns"),
          n("Cursors"),
          n("Retryable Reads / Writes"),
          n("Performance Optimization"),
        ]),
      ],
      right: [
        g([
          n("Array Operators"),
          n("Projection Operators"),
          n("$project"),
          n("$include"),
          n("$in"),
          n("$nin"),
          n("$all"),
          n("$exclude"),
          n("$slice"),
          n("$elemMatch"),
          n("$size"),
          n("Query Operators"),
        ]),
      ],
    }),
    stage("Query Operators", {
      status: "personal",
    }),
    stage("Creating Indexes", {
      status: "personal",
      left: [
        g([n("Single Field"), n("Compound"), n("Text"), n("Expiring"), n("Geospatial Indexes")]),
      ],
      right: [
        g([
          n("Comparison Operators"),
          n("Element Operators"),
          n("$eq"),
          n("$gt"),
          n("$lt"),
          n("$exists"),
          n("$type"),
          n("$lte"),
          n("$gte"),
          n("$ne"),
          n("$regex"),
        ]),
      ],
    }),
    stage("Performance Optimization", {
      status: "personal",
      left: [g([n("Atlas Search Indexes"), n("Query Optimization"), n("Aggregation")])],
      right: [
        g([
          n("$and"),
          n("$or"),
          n("$not"),
          n("$nor"),
          n("Logical Operators"),
          n("Pipelines, Stages and Operators"),
          n("Common Operators"),
          n("$match"),
          n("$group"),
          n("$sort"),
        ]),
      ],
    }),
  ],
};

const SECTION_3: MongoDbRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Aggregation",
  stages: [
    stage("Aggregation", {
      status: "personal",
      left: [g([n("Language Drivers"), n("MongoDB Connectors"), n("Transactions")])],
      right: [g([n("$project"), n("$skip"), n("$limit"), n("$unwind"), n("$lookup"), n("$sum")])],
    }),
    stage("Transactions", {
      status: "personal",
      left: [g([n("Kafka"), n("Spark"), n("Elastic Search"), n("Developer Tools")])],
      right: [g([n("Replicasets")])],
    }),
    stage("Developer Tools", {
      status: "personal",
      left: [g([n("Backup & Recovery"), n("mongodump"), n("mongorestore"), n("Scaling MongoDB")])],
      right: [g([n("Sharded Clusters"), n("Tuning Configuration")])],
    }),
    stage("Scaling MongoDB", {
      status: "personal",
      left: [
        g([
          n("Role-based Access Control"),
          n("X.509 Certificate Auth"),
          n("Kerberos Authentication"),
          n("MongoDB Security"),
        ]),
      ],
      right: [g([n("Indexing"), n("Query Optimization"), n("Encryption")])],
    }),
  ],
};

const SECTION_4: MongoDbRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 MongoDB Security",
  stages: [
    stage("MongoDB Security", {
      status: "personal",
      left: [
        g([
          n("LDAP Proxy Auth"),
          n("MongoDB Audit"),
          n("For ecosystem and more, check these other tracks involving GraphQL"),
          n("Frontend Roadmap"),
        ]),
      ],
      right: [
        g([
          n("Encryption at Rest"),
          n("Queryable Encryption"),
          n("Client-Side Field Level"),
          n("TLS / SSL Encryption"),
          n("Backend Roadmap"),
        ]),
      ],
    }),
  ],
};

export const MONGODB_SECTIONS: MongoDbRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
