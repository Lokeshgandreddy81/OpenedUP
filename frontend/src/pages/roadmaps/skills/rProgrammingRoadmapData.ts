export type RProgrammingRoadmapStatus = "personal" | "alternative" | "optional";

export interface RProgrammingRoadmapNode {
  id: string;
  title: string;
  status?: RProgrammingRoadmapStatus;
  roadmapId?: string;
}

export interface RProgrammingRoadmapGroup {
  id: string;
  parent?: RProgrammingRoadmapNode;
  items: RProgrammingRoadmapNode[];
}

export interface RProgrammingRoadmapStage {
  id: string;
  node: RProgrammingRoadmapNode;
  left?: RProgrammingRoadmapGroup[];
  right?: RProgrammingRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface RProgrammingRoadmapSection {
  id: string;
  title?: string;
  stages: RProgrammingRoadmapStage[];
}

export interface RProgrammingRoadmapLink {
  label: string;
  roadmapId: string;
}

export const R_PROGRAMMING_MARKERS: Array<{
  status: RProgrammingRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const R_PROGRAMMING_RELATED_ROADMAPS: RProgrammingRoadmapLink[] = [
  { label: "Python for Data Analysis", roadmapId: "skill-python-data-analysis" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "AI and Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "SQL Roadmap", roadmapId: "skill-sql" },
];

export const R_PROGRAMMING_CONTINUE_LEARNING: RProgrammingRoadmapLink[] = [
  { label: "Python Data Analysis", roadmapId: "skill-python-data-analysis" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Data Analyst", roadmapId: "data-analyst" },
  { label: "Machine Learning", roadmapId: "machine-learning" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: RProgrammingRoadmapStatus,
  roadmapId?: string,
  customId?: string
): RProgrammingRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: RProgrammingRoadmapNode[],
  parent?: RProgrammingRoadmapNode,
  customId?: string
): RProgrammingRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<RProgrammingRoadmapStage, "id" | "node"> & {
    status?: RProgrammingRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): RProgrammingRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const R_FOUNDATIONS: RProgrammingRoadmapSection = {
  id: "r-foundations",
  title: "R Syntax & Data Structures",
  stages: [
    stage("R Environment & Basic Types", {
      status: "personal",
      left: [
        g(
          [
            n("RStudio & Posit IDE Setup", "personal"),
            n("Variables & Assignment (<- and =)", "personal"),
            n("Atomic Data Types (numeric, character, logical, factor)", "personal"),
          ],
          n("Core Syntax")
        ),
      ],
      right: [
        g([
          n("Atomic Vectors & Vectorized Operations", "personal"),
          n("Matrices & Arrays (2D and multi-dimensional)"),
          n("Lists & Heterogeneous Collections", "personal"),
          n("Data Frames & Tibbles", "personal"),
        ]),
      ],
    }),
  ],
};

const CONTROL_AND_FUNCTIONAL: RProgrammingRoadmapSection = {
  id: "control-and-functional",
  title: "Control Flow & Functional Programming",
  stages: [
    stage("Functions & Flow Control", {
      status: "personal",
      left: [
        g([
          n("Conditionals (if, else, ifelse, switch)", "personal"),
          n("Loops (for, while, repeat, break, next)"),
          n("Writing Custom Functions & Return Values", "personal"),
        ]),
      ],
      right: [
        g([
          n("The Apply Family (apply, lapply, sapply, vapply)", "personal"),
          n("Functional Programming with purrr (map, pmap, keep)", "personal"),
          n("Scoping Rules & Environments"),
        ]),
      ],
    }),
  ],
};

const TIDYVERSE_WRANGLING: RProgrammingRoadmapSection = {
  id: "tidyverse-wrangling",
  title: "Data Manipulation & The Tidyverse",
  stages: [
    stage("Data Wrangling with dplyr & tidyr", {
      status: "personal",
      left: [
        g(
          [
            n("The Pipe Operator (|> and %>%) ", "personal"),
            n("dplyr: select(), filter(), arrange()", "personal"),
            n("dplyr: mutate(), summarize(), group_by()", "personal"),
          ],
          n("Core dplyr")
        ),
      ],
      right: [
        g([
          n("tidyr: pivot_longer() & pivot_wider()", "personal"),
          n("Handling Missing Values (NA, complete.cases, na.omit)"),
          n("Joining Data Frames (inner_join, left_join, full_join)", "personal"),
          n("Data Import with readr, readxl, and data.table", "personal"),
        ]),
      ],
    }),
  ],
};

const DATA_VISUALIZATION: RProgrammingRoadmapSection = {
  id: "data-visualization",
  title: "Data Visualization with ggplot2",
  stages: [
    stage("Grammar of Graphics & Plotting", {
      status: "personal",
      left: [
        g(
          [
            n("Aesthetic Mapping (aes(x, y, color, size))", "personal"),
            n("Geometric Objects (geom_point, geom_line, geom_col)", "personal"),
            n("Distributions (geom_histogram, geom_density, geom_boxplot)", "personal"),
          ],
          n("ggplot2 Core")
        ),
      ],
      right: [
        g([
          n("Faceting (facet_wrap, facet_grid)", "personal"),
          n("Coordinate Systems & Scales (scale_color_viridis, coord_flip)"),
          n("Themes & Publication Ready Styling (theme_minimal, cowplot)", "personal"),
          n("Interactive Visualizations with plotly in R"),
        ]),
      ],
    }),
  ],
};

const STATS_AND_REPORTING: RProgrammingRoadmapSection = {
  id: "stats-and-reporting",
  title: "Statistical Modeling & Reporting",
  stages: [
    stage("Statistical Analysis & Modeling", {
      status: "personal",
      left: [
        g(
          [
            n("Summary Statistics & Probability Distributions (rnorm, dnorm)", "personal"),
            n("Hypothesis Testing (t.test, wilcox.test, chisq.test, cor.test)", "personal"),
            n("Linear Regression (lm(), summary(), predict())", "personal"),
            n("Logistic Regression & GLM (glm() with binomial family)"),
          ],
          n("Statistical Inference")
        ),
      ],
      right: [
        g([
          n("Reproducible Research with Quarto & R Markdown", "personal"),
          n("Building Interactive Web Apps with Shiny", "personal"),
          n("Package Development & devtools in R"),
        ]),
      ],
    }),
  ],
};

export const R_PROGRAMMING_SECTIONS: RProgrammingRoadmapSection[] = [
  R_FOUNDATIONS,
  CONTROL_AND_FUNCTIONAL,
  TIDYVERSE_WRANGLING,
  DATA_VISUALIZATION,
  STATS_AND_REPORTING,
];
