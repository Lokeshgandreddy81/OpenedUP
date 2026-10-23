export type PowerBiRoadmapStatus = "personal" | "alternative" | "optional";

export interface PowerBiRoadmapNode {
  id: string;
  title: string;
  status?: PowerBiRoadmapStatus;
  roadmapId?: string;
}

export interface PowerBiRoadmapGroup {
  id: string;
  parent?: PowerBiRoadmapNode;
  items: PowerBiRoadmapNode[];
}

export interface PowerBiRoadmapStage {
  id: string;
  node: PowerBiRoadmapNode;
  left?: PowerBiRoadmapGroup[];
  right?: PowerBiRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface PowerBiRoadmapSection {
  id: string;
  title?: string;
  stages: PowerBiRoadmapStage[];
}

export interface PowerBiRoadmapLink {
  label: string;
  roadmapId: string;
}

export const POWER_BI_MARKERS: Array<{
  status: PowerBiRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const POWER_BI_RELATED_ROADMAPS: PowerBiRoadmapLink[] = [
  { label: "Bi Analyst Roadmap", roadmapId: "bi-analyst" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Python Data Analysis Roadmap", roadmapId: "python-data-analysis" },
  { label: "Ai Data Scientist Roadmap", roadmapId: "ai-data-scientist" },
];

export const POWER_BI_CONTINUE_LEARNING: PowerBiRoadmapLink[] = [
  { label: "Bi Analyst Roadmap", roadmapId: "bi-analyst" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Python Data Analysis Roadmap", roadmapId: "python-data-analysis" },
  { label: "Ai Data Scientist Roadmap", roadmapId: "ai-data-scientist" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: PowerBiRoadmapStatus,
  roadmapId?: string,
  customId?: string
): PowerBiRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: PowerBiRoadmapNode[],
  parent?: PowerBiRoadmapNode,
  customId?: string
): PowerBiRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<PowerBiRoadmapStage, "id" | "node"> & {
    status?: PowerBiRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): PowerBiRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: PowerBiRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Introduction",
  stages: [
    stage("Introduction", {
      status: "personal",
      left: [g([n("Installing Power BI"), n("Files"), n("Databases"), n("Related Roadmaps")])],
      right: [
        g([
          n("Licensing Tiers"),
          n("Power BI Ecosystem"),
          n("Connecting to Data"),
          n("Desktop"),
          n("Service"),
          n("Mobile"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("Data Source Types", {
      status: "personal",
      left: [g([n("Clouds"), n("APIs")])],
      right: [g([n("Import Mode"), n("DirectQuery"), n("Direct Lake"), n("Connection Modes")])],
    }),
    stage("Connection Modes", {
      status: "personal",
      left: [g([n("Data Cleaning"), n("Data Types & Casting"), n("Removing Duplicates")])],
      right: [g([n("Dual Storage Mode"), n("Data Transformation")])],
    }),
    stage("Power Query", {
      status: "personal",
      left: [
        g([
          n("Handling Errors"),
          n("Column & Value Transforms."),
          n("Changing Text"),
          n("Changing Numbers"),
          n("Changing Dates"),
        ]),
      ],
      right: [
        g([n("Applied Steps"), n("Data Profiling"), n("Advanced Editor"), n("M Language Basics")]),
      ],
    }),
    stage("M Language Basics", {
      status: "personal",
      left: [g([n("Conditional Columns"), n("Custom Columns"), n("Splitting Columns")])],
      right: [g([n("Data Modeling"), n("Facts & Dimensions")])],
    }),
    stage("Schema Design", {
      status: "personal",
      left: [
        g([
          n("Table Operations"),
          n("Joins"),
          n("Appending Tables"),
          n("Pivot & Transpose"),
          n("Query Performance"),
        ]),
      ],
      right: [
        g([
          n("Star vs Snowflake Schema"),
          n("Granularity"),
          n("Relationships and Cardinality"),
          n("Cross Filter Direction"),
          n("Relationships"),
        ]),
      ],
    }),
  ],
};

const SECTION_2: PowerBiRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Relationships",
  stages: [
    stage("Relationships", {
      status: "personal",
      left: [g([n("Parameters & Functions"), n("Query Folding"), n("Incremental Refresh")])],
      right: [
        g([
          n("Calculated Tables & Columns"),
          n("Hierarchies"),
          n("Aggregations"),
          n("Model Objects"),
        ]),
      ],
    }),
    stage("Model Objects", {
      status: "personal",
      left: [g([n("Performance Analyzer"), n("DAX vs. M Language")])],
      right: [g([n("DAX"), n("Function Families"), n("Model Optimization")])],
    }),
    stage("Model Optimization", {
      status: "personal",
      left: [g([n("DAX Syntax"), n("Columns vs Measures")])],
      right: [g([n("Aggregation Functions"), n("Logical Functions")])],
    }),
    stage("Fundamentals", {
      status: "personal",
      left: [g([n("Variables in DAX"), n("Row vs Filter Context"), n("CALCULATE Function")])],
      right: [
        g([
          n("Window Functions"),
          n("Iterator Functions"),
          n("Time Intelligence"),
          n("Context & Filtering"),
        ]),
      ],
    }),
    stage("Context & Filtering", {
      status: "personal",
      left: [g([n("Context Transition")])],
      right: [g([n("Table Manipulation"), n("Quick Measures"), n("Advanced DAX")])],
    }),
    stage("Advanced DAX", {
      status: "personal",
      left: [
        g([
          n("Bar & Column Charts"),
          n("Line & Area Charts"),
          n("Pie & Donut Charts"),
          n("Scatter & Bubble Charts"),
        ]),
      ],
      right: [
        g([
          n("Field Parameters"),
          n("Visual Calculations"),
          n("Calculation Groups"),
          n("Data Visualization"),
          n("DAX Performance"),
        ]),
      ],
    }),
  ],
};

const SECTION_3: PowerBiRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Visualization Basics",
  stages: [
    stage("Visualization Basics", {
      status: "personal",
      left: [
        g([
          n("Combination Charts"),
          n("Gauges, Cards, & KPIs"),
          n("Matrix & Table Visuals"),
          n("Maps"),
          n("Custom Visuals"),
          n("Formatting & Themes"),
        ]),
      ],
      right: [
        g([
          n("Design Principles"),
          n("Accessibility"),
          n("Drill-through & Drill-down"),
          n("Formatting & filtering"),
        ]),
      ],
    }),
    stage("Formatting & filtering", {
      status: "personal",
      left: [g([n("Conditional Formatting"), n("Sorting Data"), n("Slicers and Filters")])],
      right: [
        g([
          n("Bookmarks"),
          n("Buttons & Navigation"),
          n("Explore Feature"),
          n("Custom Tooltips"),
          n("Interactivity"),
        ]),
      ],
    }),
    stage("Interactivity", {
      status: "personal",
      left: [g([n("Decomposition Tree"), n("Key Influencers")])],
      right: [g([n("Cross-filtering")])],
    }),
    stage("Advanced Visuals", {
      status: "personal",
      left: [g([n("Small Multiples"), n("Q&A Visual")])],
      right: [g([n("Power BI Service"), n("Workspaces"), n("Dashboards vs Reports")])],
    }),
    stage("Publishing & Sharing", {
      status: "personal",
      left: [
        g([
          n("On-premises Data Gateway"),
          n("Refresh & Change Detection"),
          n("Subscriptions and Alerts"),
        ]),
      ],
      right: [
        g([
          n("Paginated Reports (RDL)"),
          n("Publishing Reports"),
          n("Sharing & Permissions"),
          n("Apps"),
          n("Data & Infrastructure"),
        ]),
      ],
    }),
    stage("Data & Infrastructure", {
      status: "personal",
      left: [g([n("Row-Level Security")])],
      right: [g([n("Security & Governance")])],
    }),
  ],
};

const SECTION_4: PowerBiRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Collaboration",
  stages: [
    stage("Collaboration", {
      status: "personal",
      left: [g([n("Object-Level Security"), n("Workspace Roles")])],
    }),
    stage("Access Control", {
      status: "personal",
      left: [g([n("Sensitivity Labels"), n("Data Loss Prevention")])],
      right: [
        g([
          n("Tenant Settings"),
          n("Audit Logs"),
          n("Certified Datasets"),
          n("Power BI Embedded"),
          n("Governance"),
        ]),
      ],
    }),
    stage("Governance", {
      status: "personal",
      left: [g([n("Power Automate"), n("Deployment Pipelines")])],
      right: [g([n("Automation & Integration"), n("REST API"), n("Power BI with Excel")])],
    }),
    stage("Workflow & Lifecycle", {
      status: "personal",
      right: [g([n("Python & R"), n("Microsoft Fabric"), n("Integrations")])],
    }),
    stage("Integrations", {
      status: "personal",
      left: [
        g([n("Visit the following roadmaps to keep learning"), n("Data Analyst"), n("BI Analyst")]),
      ],
      right: [g([n("Python for Data Analysis"), n("R")])],
    }),
  ],
};

export const POWER_BI_SECTIONS: PowerBiRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
