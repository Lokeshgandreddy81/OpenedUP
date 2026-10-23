export type BiAnalystRoadmapStatus = "personal" | "alternative" | "optional";

export interface BiAnalystRoadmapNode {
  id: string;
  title: string;
  status?: BiAnalystRoadmapStatus;
  roadmapId?: string;
}

export interface BiAnalystRoadmapGroup {
  id: string;
  parent?: BiAnalystRoadmapNode;
  items: BiAnalystRoadmapNode[];
}

export interface BiAnalystRoadmapStage {
  id: string;
  node: BiAnalystRoadmapNode;
  left?: BiAnalystRoadmapGroup[];
  right?: BiAnalystRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface BiAnalystRoadmapSection {
  id: string;
  title?: string;
  stages: BiAnalystRoadmapStage[];
}

export interface BiAnalystRoadmapLink {
  label: string;
  roadmapId: string;
}

export const BI_ANALYST_MARKERS: Array<{
  status: BiAnalystRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const BI_ANALYST_RELATED_ROADMAPS: BiAnalystRoadmapLink[] = [
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Data Engineer Roadmap", roadmapId: "data-engineer" },
  { label: "SQL Roadmap", roadmapId: "skill-sql" },
  { label: "PostgreSQL Roadmap", roadmapId: "postgresql" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
];

export const BI_ANALYST_CONTINUE_LEARNING: BiAnalystRoadmapLink[] = [
  { label: "Data Analyst", roadmapId: "data-analyst" },
  { label: "Data Engineer", roadmapId: "data-engineer" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Python Data Analysis", roadmapId: "skill-python-data-analysis" },
  { label: "PostgreSQL", roadmapId: "postgresql" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BiAnalystRoadmapStatus,
  roadmapId?: string,
  customId?: string
): BiAnalystRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: BiAnalystRoadmapNode[],
  parent?: BiAnalystRoadmapNode,
  customId?: string
): BiAnalystRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BiAnalystRoadmapStage, "id" | "node"> & {
    status?: BiAnalystRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): BiAnalystRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// --- SECTION 1: BUSINESS ACUMEN & PROBLEM FRAMING ---
const BUSINESS_ACUMEN: BiAnalystRoadmapSection = {
  id: "business-acumen",
  title: "Business Acumen & Problem Framing",
  stages: [
    stage("Business Understanding & Domains", {
      left: [
        g(
          [
            n("E-Commerce & Retail Metrics", "personal"),
            n("SaaS & Subscription Economics", "personal"),
            n("Finance & P&L Statements", "alternative"),
            n("Supply Chain & Logistics", "optional"),
            n("Healthcare & Operations", "optional"),
          ],
          n("Domain Knowledge", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Stakeholder Interviews", "personal"),
            n("Translating Questions to Data Specs", "personal"),
            n("Product Requirement Documents (PRDs)", "optional"),
            n("ROI Calculation for BI Projects", "optional"),
          ],
          n("Stakeholder Management", "personal")
        ),
      ],
      noteAfter:
        "Top-performing BI Analysts succeed through deep domain fluency and stakeholder collaboration just as much as technical query execution.",
    }),
    stage("Problem Framing & Hypothesis Testing", {
      left: [
        g(
          [
            n("Root Cause Analysis (5 Whys)", "personal"),
            n("Issue Trees & MECE Framework", "personal"),
            n("Hypothesis-Driven Exploration", "personal"),
            n("A/B Testing Evaluation & Lift", "optional"),
          ],
          n("Analytical Frameworks", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Exploratory Data Analysis (EDA)", "personal"),
            n("Cohort Analysis", "personal"),
            n("Funnel Drop-off Analysis", "personal"),
            n("Customer Segmentation (RFM)", "optional"),
          ],
          n("Diagnostic Analytics", "personal")
        ),
      ],
      projectIdea:
        "Project Idea: Conduct a comprehensive SaaS churn diagnosis analyzing customer cohorts, usage frequency drop-offs, and MRR contractions to pinpoint leading churn indicators.",
    }),
  ],
};

// --- SECTION 2: DIMENSIONAL DATA MODELING ---
const DATA_MODELING: BiAnalystRoadmapSection = {
  id: "data-modeling",
  title: "Data Modeling & Architecture",
  stages: [
    stage("Dimensional Modeling Principles", {
      roadmapId: "postgresql",
      left: [
        g(
          [
            n("Kimball vs Inmon Methodologies", "personal"),
            n("Normalized (3NF) vs Dimensional", "personal"),
            n("Business Process Identification", "personal"),
            n("Declaring the Grain", "personal"),
          ],
          n("Methodologies", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Star Schema", "personal"),
            n("Snowflake Schema", "alternative"),
            n("Galaxy / Constellation Schema", "optional"),
            n("Data Vault 2.0 (Hubs & Links)", "optional"),
          ],
          n("Schema Topologies", "personal")
        ),
      ],
    }),
    stage("Facts & Dimensions Engineering", {
      left: [
        g(
          [
            n("Conformed Dimensions", "personal"),
            n("Degenerate Dimensions", "personal"),
            n("Role-Playing Dimensions", "personal"),
            n("Junk & Outrigger Dimensions", "optional"),
            n("Slowly Changing Dimensions (SCD 1, 2, 3)", "personal"),
          ],
          n("Dimension Types", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Transactional Fact Tables", "personal"),
            n("Periodic Snapshot Facts", "personal"),
            n("Accumulating Snapshot Facts", "personal"),
            n("Factless Fact Tables", "optional"),
            n("Additive vs Non-Additive Facts", "personal"),
          ],
          n("Fact Tables", "personal")
        ),
      ],
      noteAfter:
        "Dimensional modeling forms the backbone of performant BI reporting. A clear declaration of the grain prevents double-counting and query inaccuracies.",
      projectIdea:
        "Project Idea: Design a production-grade Star Schema for an omnichannel e-commerce store with Orders, Inventory snapshots, and Customer SCD Type 2 dimensions.",
    }),
  ],
};

// --- SECTION 3: ADVANCED SQL FOR BI ---
const ADVANCED_SQL: BiAnalystRoadmapSection = {
  id: "advanced-sql",
  title: "Advanced SQL for Analytics",
  stages: [
    stage("Core & Analytical SQL", {
      roadmapId: "skill-sql",
      left: [
        g(
          [
            n("Multi-table INNER, LEFT, FULL JOINs", "personal"),
            n("Self Joins & Anti Joins", "personal"),
            n("GROUP BY & Aggregation Filters", "personal"),
            n("Subqueries & Correlated Subqueries", "personal"),
          ],
          n("Relational Foundations", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Common Table Expressions (CTEs)", "personal"),
            n("Recursive CTEs (Hierarchies)", "personal"),
            n("PIVOT & UNPIVOT Operations", "alternative"),
            n("ROLLUP & CUBE Multilevel Aggs", "optional"),
            n("Date & Timestamp Manipulation", "personal"),
          ],
          n("Complex Querying", "personal")
        ),
      ],
    }),
    stage("Window Functions & Optimization", {
      roadmapId: "skill-sql",
      left: [
        g(
          [
            n("ROW_NUMBER(), RANK(), DENSE_RANK()", "personal"),
            n("LAG() & LEAD() for Month-over-Month", "personal"),
            n("Running Totals (SUM OVER ROWS)", "personal"),
            n("NTILE() & Moving Averages", "personal"),
            n("FIRST_VALUE() & LAST_VALUE()", "optional"),
          ],
          n("Window Functions", "personal")
        ),
      ],
      right: [
        g(
          [
            n("EXPLAIN & Execution Plans", "personal"),
            n("Indexes (B-Tree, Bitmap, GIN)", "personal"),
            n("Partition Pruning & Cluster Keys", "personal"),
            n("Minimizing Cartesian Explosions", "personal"),
            n("Query Cost & Memory Spills", "optional"),
          ],
          n("Query Optimization", "personal")
        ),
      ],
      noteAfter:
        "Window functions are the single most tested skill for BI Analysts during technical interviews. Master running sums, YoY comparisons, and ranked partitions.",
    }),
  ],
};

// --- SECTION 4: DATA WAREHOUSES & LAKEHOUSES ---
const DATA_WAREHOUSES: BiAnalystRoadmapSection = {
  id: "data-warehouses",
  title: "Cloud Data Warehouses & Lakehouses",
  stages: [
    stage("Cloud Data Warehouses", {
      left: [
        g(
          [
            n("Snowflake", "personal"),
            n("Google BigQuery", "personal"),
            n("Amazon Redshift", "alternative"),
            n("Azure Synapse / Fabric", "alternative"),
            n("ClickHouse for Real-Time BI", "optional"),
          ],
          n("Modern Warehouses", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Separation of Compute & Storage", "personal"),
            n("Columnar Storage & Compression", "personal"),
            n("Virtual Warehouses & Auto-scaling", "personal"),
            n("Clustering Keys & Micro-partitions", "personal"),
            n("Materialized Views & Caching", "optional"),
          ],
          n("Architecture & Mechanics", "personal")
        ),
      ],
    }),
    stage("Data Lakes & Open Formats", {
      left: [
        g(
          [
            n("Databricks & Lakehouse Platform", "personal"),
            n("Apache Iceberg", "personal"),
            n("Delta Lake", "alternative"),
            n("Apache Hudi", "optional"),
          ],
          n("Lakehouse Formats", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Amazon S3 & Google Cloud Storage", "personal"),
            n("Parquet & ORC Columnar Formats", "personal"),
            n("External Tables & Query Federation", "optional"),
            n("Data Catalog Integration (AWS Glue)", "optional"),
          ],
          n("Storage & Access", "personal")
        ),
      ],
      noteAfter:
        "Snowflake and BigQuery lead modern cloud data warehousing, while open table formats like Apache Iceberg and Databricks Delta Lake dominate modern enterprise lakehouses.",
    }),
  ],
};

// --- SECTION 5: ETL / ELT PROCESSES & DBT ---
const ETL_ELT_PROCESSES: BiAnalystRoadmapSection = {
  id: "etl-elt-processes",
  title: "ETL / ELT Processes & Transformations",
  stages: [
    stage("Data Ingestion & ELT Architecture", {
      left: [
        g(
          [
            n("Fivetran", "personal"),
            n("Airbyte", "personal"),
            n("Stitch Data", "alternative"),
            n("Cloud Pub/Sub & Streaming Ingest", "optional"),
          ],
          n("Automated Ingestion", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Extract-Load-Transform (ELT) Paradigm", "personal"),
            n("Raw Stage vs Cleansed vs Analytics Marts", "personal"),
            n("Change Data Capture (CDC)", "personal"),
            n("Full Refresh vs Incremental Loads", "personal"),
          ],
          n("Pipeline Concepts", "personal")
        ),
      ],
    }),
    stage("dbt (Data Build Tool) & Modeling", {
      left: [
        g(
          [
            n("dbt Core & dbt Cloud", "personal"),
            n("Jinja & SQL Macros", "personal"),
            n("Modular SQL Models (Staging, Int, Marts)", "personal"),
            n("Incremental Models & Materializations", "personal"),
            n("dbt Snapshots (Automated SCD Type 2)", "personal"),
          ],
          n("dbt Framework", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Schema Tests (not_null, unique, relationships)", "personal"),
            n("Singular Custom SQL Tests", "personal"),
            n("Automated Documentation & Lineage DAGs", "personal"),
            n("dbt Packages (dbt_utils, codegen)", "optional"),
            n("Orchestration via Airflow or Dagster", "alternative"),
          ],
          n("Testing & Governance", "personal")
        ),
      ],
      projectIdea:
        "Project Idea: Build an end-to-end dbt project transforming raw Stripe and Shopify webhook tables into dimensional Mart models with generic tests, documentation, and lineage graphs.",
    }),
  ],
};

// --- SECTION 6: BI & VISUALIZATION PLATFORMS ---
const BI_AND_VISUALIZATION: BiAnalystRoadmapSection = {
  id: "bi-and-visualization",
  title: "BI Platforms & Semantic Layers",
  stages: [
    stage("Enterprise BI Tools", {
      left: [
        g(
          [
            n("Power BI Desktop & Service", "personal"),
            n("DAX (Data Analysis Expressions)", "personal"),
            n("Power Query (M Language)", "personal"),
            n("Row-Level Security (RLS) in Power BI", "personal"),
            n("Power BI Dataflows & Datamarts", "optional"),
          ],
          n("Microsoft Power BI", "personal")
        ),
        g(
          [
            n("Tableau Desktop & Cloud", "personal"),
            n("LOD Expressions (FIXED, INCLUDE, EXCLUDE)", "personal"),
            n("Calculated Fields & Table Calculations", "personal"),
            n("Tableau Prep Builder", "alternative"),
          ],
          n("Tableau", "personal")
        ),
      ],
      right: [
        g(
          [
            n("LookML Modeling (Views, Explores, Models)", "personal"),
            n("Liquid Templating & Looker Filters", "personal"),
            n("Looker Dashboards & Looks", "personal"),
            n("Looker Content Governance", "optional"),
          ],
          n("Google Looker", "personal")
        ),
        g(
          [
            n("Metabase", "alternative"),
            n("Apache Superset", "alternative"),
            n("Hex (Collaborative Notebooks)", "optional"),
            n("Evidence.dev (Code-based BI)", "optional"),
          ],
          n("Open-Source & Code-First BI", "alternative")
        ),
      ],
      noteAfter:
        "Mastering at least one major platform deeply (Power BI DAX or Tableau LODs or LookML) is mandatory. Power BI dominates corporate environments, while Looker and Tableau lead in modern tech.",
    }),
    stage("Semantic Layers & Headless BI", {
      left: [
        g(
          [
            n("Single Source of Metric Truth", "personal"),
            n("Consistent KPI Calculation Across Tools", "personal"),
            n("Decoupling Metrics from Dashboards", "personal"),
            n("Caching & High-Concurrency APIs", "optional"),
          ],
          n("Semantic Layer Concepts", "personal")
        ),
      ],
      right: [
        g(
          [
            n("dbt Semantic Layer (MetricFlow)", "personal"),
            n("Cube.js Headless BI", "personal"),
            n("Looker Modeler / BI Engine", "alternative"),
            n("Omni / Lightdash", "optional"),
          ],
          n("Modern Semantic Tools", "personal")
        ),
      ],
    }),
  ],
};

// --- SECTION 7: DASHBOARD UX & STORYTELLING ---
const DASHBOARD_UX: BiAnalystRoadmapSection = {
  id: "dashboard-ux",
  title: "Dashboard UX, Visual Design & Storytelling",
  stages: [
    stage("Visual Perception & UX Principles", {
      left: [
        g(
          [
            n("Gestalt Principles of Grouping", "personal"),
            n("Visual Hierarchy & Scanning (F & Z Patterns)", "personal"),
            n("5-Second Rule for KPI Comprehension", "personal"),
            n("Accessible Color Palettes (WCAG, Color Blind)", "personal"),
            n("Reducing Cognitive Load & ChartJunk", "personal"),
          ],
          n("Design Fundamentals", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Time-Series Trends (Line & Area)", "personal"),
            n("Part-to-Whole (Bar, Waterfall vs Donut)", "personal"),
            n("Distribution (Histograms, Boxplots)", "personal"),
            n("Correlation (Scatter Plots, Heatmaps)", "optional"),
            n("Geospatial & Choropleth Maps", "optional"),
          ],
          n("Chart Selection Guide", "personal")
        ),
      ],
    }),
    stage("Executive Storytelling & Interactivity", {
      left: [
        g(
          [
            n("Executive Summary First (What, Why, Next)", "personal"),
            n("Contextual Benchmarking & Targets", "personal"),
            n("Annotating Anomalies & Inflection Points", "personal"),
            n("Action-Oriented Insights over Raw Metrics", "personal"),
          ],
          n("Data Storytelling", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Drill-Down & Drill-Through Hierarchies", "personal"),
            n("Cross-Filtering & Dynamic Highlighting", "personal"),
            n("Dynamic Parameters & Scenario Modeling", "personal"),
            n("Automated Anomaly Alerts & Push Reports", "optional"),
            n("Mobile Responsive Layouts", "personal"),
          ],
          n("Interactive Experience", "personal")
        ),
      ],
      noteAfter:
        "The best dashboards don't just present charts—they guide the user's attention from high-level operational health directly into the drivers behind the numbers.",
      projectIdea:
        "Project Idea: Create an Executive C-Suite Dashboard tracking Gross Margin, Customer Acquisition Cost (CAC), and Net Revenue Retention with drill-down views by sales rep and region.",
    }),
  ],
};

// --- SECTION 8: METRICS DEFINITION & GOVERNANCE ---
const METRICS_AND_GOVERNANCE: BiAnalystRoadmapSection = {
  id: "metrics-and-governance",
  title: "Metrics Definition & Data Governance",
  stages: [
    stage("KPI Frameworks & Metrics Trees", {
      left: [
        g(
          [
            n("North Star Metric Selection", "personal"),
            n("OKR Alignment (Objectives & Key Results)", "personal"),
            n("Leading vs Lagging Indicators", "personal"),
            n("Metric Decomposition Trees", "personal"),
          ],
          n("KPI Frameworks", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Revenue Metrics (ARR, MRR, GMV, ARPU)", "personal"),
            n("Growth & Acquisition (CAC, Payback, ROI)", "personal"),
            n("Engagement & Retention (DAU/MAU, Churn, NRR)", "personal"),
            n("Operational Efficiency (Fulfillment SLA, CSAT)", "optional"),
          ],
          n("Core Business Metrics", "personal")
        ),
      ],
    }),
    stage("Data Governance & Quality Management", {
      left: [
        g(
          [
            n("Centralized Data Dictionaries", "personal"),
            n("Enterprise Data Catalogs (Atlan, Alation)", "optional"),
            n("Automated Data Observability (Monte Carlo)", "optional"),
            n("Data Quality SLA Monitoring", "personal"),
          ],
          n("Governance & Catalogs", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Role-Based Access Control (RBAC)", "personal"),
            n("Row-Level Security (RLS) Implementation", "personal"),
            n("PII Masking & Compliance (GDPR, CCPA, HIPAA)", "personal"),
            n("Version Control with Git for BI Models", "personal"),
            n("CI/CD Deployment Pipelines for BI Artifacts", "optional"),
          ],
          n("Security & Operations", "personal")
        ),
      ],
      noteAfter:
        "Without rigorous governance and metric definitions, two teams will compute the same KPI in different ways and produce conflicting boardroom numbers.",
      projectIdea:
        "Project Idea: Author an official organizational Data Dictionary and Metric Spec defining 'Active Customer' and 'Monthly Recurring Revenue' with row-level security policies.",
    }),
  ],
};

export const BI_ANALYST_SECTIONS: BiAnalystRoadmapSection[] = [
  BUSINESS_ACUMEN,
  DATA_MODELING,
  ADVANCED_SQL,
  DATA_WAREHOUSES,
  ETL_ELT_PROCESSES,
  BI_AND_VISUALIZATION,
  DASHBOARD_UX,
  METRICS_AND_GOVERNANCE,
];
