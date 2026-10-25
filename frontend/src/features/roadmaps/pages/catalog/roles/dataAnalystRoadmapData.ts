export type DataAnalystRoadmapStatus = "personal" | "alternative" | "optional";

export interface DataAnalystRoadmapNode {
  id: string;
  title: string;
  status?: DataAnalystRoadmapStatus;
  roadmapId?: string;
}

export interface DataAnalystRoadmapGroup {
  id: string;
  parent?: DataAnalystRoadmapNode;
  items: DataAnalystRoadmapNode[];
}

export interface DataAnalystRoadmapStage {
  id: string;
  node: DataAnalystRoadmapNode;
  left?: DataAnalystRoadmapGroup[];
  right?: DataAnalystRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DataAnalystRoadmapSection {
  id: string;
  title?: string;
  stages: DataAnalystRoadmapStage[];
}

export interface DataAnalystRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DATA_ANALYST_MARKERS: Array<{
  status: DataAnalystRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DATA_ANALYST_RELATED_ROADMAPS: DataAnalystRoadmapLink[] = [
  { label: "SQL Roadmap", roadmapId: "skill-sql" },
  { label: "Python Data Analysis Roadmap", roadmapId: "skill-python-data-analysis" },
  { label: "Power BI Roadmap", roadmapId: "skill-power-bi" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "PostgreSQL Roadmap", roadmapId: "postgresql" },
  { label: "R Programming Roadmap", roadmapId: "skill-r-programming" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
];

export const DATA_ANALYST_CONTINUE_LEARNING: DataAnalystRoadmapLink[] = [
  { label: "BI Analyst", roadmapId: "bi-analyst" },
  { label: "Data Engineer", roadmapId: "data-engineer" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Machine Learning", roadmapId: "machine-learning" },
  { label: "Product Manager", roadmapId: "product-manager" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DataAnalystRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DataAnalystRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DataAnalystRoadmapNode[],
  parent?: DataAnalystRoadmapNode,
  customId?: string
): DataAnalystRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DataAnalystRoadmapStage, "id" | "node"> & {
    status?: DataAnalystRoadmapStatus;
    roadmapId?: string;
    customId?: string;
  } = {}
): DataAnalystRoadmapStage => {
  const { status, roadmapId, customId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: DataAnalystRoadmapSection = {
  id: "foundations",
  title: "1. Data Analytics Fundamentals",
  stages: [
    stage("What is Data Analytics?", {
      left: [
        g(
          [
            n("Descriptive: What happened?", "personal"),
            n("Diagnostic: Why did it happen?", "personal"),
            n("Predictive: What will happen?", "alternative"),
            n("Prescriptive: What should we do?", "alternative"),
          ],
          n("Types of Data Analytics", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Problem Definition & Business Context", "personal"),
            n("Data Extraction & Ingestion", "personal"),
            n("Data Cleaning & Transformation", "personal"),
            n("Exploratory Analysis & Insights", "personal"),
            n("Storytelling & Stakeholder Reporting", "personal"),
          ],
          n("The Data Analytics Lifecycle", "personal")
        ),
      ],
      noteAfter:
        "Data analysts turn raw numbers into actionable business decisions by diagnosing patterns, tracking key metrics, and communicating findings clearly.",
    }),
  ],
};

const STATISTICS: DataAnalystRoadmapSection = {
  id: "statistics",
  title: "2. Mathematics & Statistics",
  stages: [
    stage("Descriptive & Inferential Statistics", {
      left: [
        g(
          [
            n("Mean, Median, Mode", "personal"),
            n("Variance & Standard Deviation", "personal"),
            n("Percentiles, Quartiles & IQR", "personal"),
            n("Correlation & Covariance", "personal"),
            n("Skewness & Kurtosis", "alternative"),
          ],
          n("Descriptive Statistics", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Normal, Binomial & Poisson Distributions", "personal"),
            n("Hypothesis Testing & P-Values", "personal"),
            n("Confidence Intervals & Margin of Error", "personal"),
            n("Z-Tests, T-Tests & ANOVA", "personal"),
            n("Chi-Square Independence Test", "personal"),
          ],
          n("Inferential Statistics & Probability", "personal")
        ),
      ],
      noteAfter:
        "Solid statistics prevents false positives and ensures data analysts draw statistically sound conclusions rather than chasing random noise.",
      projectIdea:
        "A/B Test Evaluation: Analyze marketing campaign conversion rates across two variants using hypothesis testing and confidence intervals to determine statistical significance.",
    }),
  ],
};

const SPREADSHEETS: DataAnalystRoadmapSection = {
  id: "spreadsheets",
  title: "3. Spreadsheets (Excel & Google Sheets)",
  stages: [
    stage("Spreadsheet Mastery", {
      left: [
        g(
          [
            n("XLOOKUP, VLOOKUP, INDEX & MATCH", "personal"),
            n("Logical: IF, IFS, SUMIFS, COUNTIFS", "personal"),
            n("Text & Date Manipulation Formulas", "personal"),
            n("Conditional Formatting & Validation", "personal"),
          ],
          n("Microsoft Excel", "personal")
        ),
        g([n("Google Sheets", "alternative")]),
      ],
      right: [
        g(
          [
            n("Pivot Tables & Calculated Fields", "personal"),
            n("Pivot Charts, Slicers & Timelines", "personal"),
            n("Power Query for Data Ingestion", "personal"),
            n("What-If Analysis: Goal Seek & Solver", "alternative"),
            n("Macros & VBA / Google Apps Script", "optional"),
          ],
          n("Pivot Tables & Advanced Modeling", "personal")
        ),
      ],
      projectIdea:
        "Executive Sales Dashboard in Excel: Build an interactive business dashboard with dynamic slicers, Pivot Tables, and automated monthly KPI scorecards.",
    }),
  ],
};

const SQL_AND_DATABASES: DataAnalystRoadmapSection = {
  id: "sql-and-databases",
  title: "4. SQL & Relational Databases",
  stages: [
    stage("SQL Fundamentals", {
      status: "personal",
      roadmapId: "skill-sql",
      left: [
        g(
          [
            n("SELECT, DISTINCT, WHERE, ORDER BY", "personal"),
            n("Filtering: AND, OR, BETWEEN, IN, LIKE", "personal"),
            n("Aggregations: COUNT, SUM, AVG, MIN, MAX", "personal"),
            n("Grouping & Filtering: GROUP BY & HAVING", "personal"),
          ],
          n("Core SQL Querying", "personal")
        ),
      ],
      right: [
        g(
          [
            n("PostgreSQL", "personal", "postgresql"),
            n("MySQL", "alternative"),
            n("Microsoft SQL Server", "alternative"),
            n("SQLite", "alternative"),
            n("Data Warehouses: BigQuery, Snowflake", "personal"),
          ],
          n("Database Systems & Warehouses", "personal")
        ),
      ],
    }),
    stage("Advanced SQL & Analytical Queries", {
      left: [
        g(
          [
            n("INNER, LEFT, RIGHT, FULL OUTER JOIN", "personal"),
            n("Self Joins & Cross Joins", "alternative"),
            n("UNION, UNION ALL, INTERSECT", "personal"),
            n("Subqueries: Scalar & Correlated", "personal"),
          ],
          n("Relational Joins & Set Operations", "personal")
        ),
      ],
      right: [
        g(
          [
            n("ROW_NUMBER, RANK, DENSE_RANK", "personal"),
            n("LEAD, LAG, FIRST_VALUE, LAST_VALUE", "personal"),
            n("NTILE & Running Cumulative Totals", "personal"),
            n("Common Table Expressions (CTEs)", "personal"),
            n("Conditional Branching: CASE WHEN", "personal"),
          ],
          n("Window Functions & CTEs", "personal")
        ),
      ],
      noteAfter:
        "Window functions and CTEs are the hallmark of advanced SQL for data analysis, enabling complex ranking, running totals, and cohort segmentation.",
      projectIdea:
        "Customer Cohort Retention Analysis in SQL: Write complex SQL queries with CTEs and window functions to compute monthly customer retention curves and churn rates.",
    }),
  ],
};

const PROGRAMMING_LANGUAGES: DataAnalystRoadmapSection = {
  id: "programming-languages",
  title: "5. Programming Languages (Python or R)",
  stages: [
    stage("Pick a Programming Language", {
      left: [
        g(
          [
            n("Data Types, Lists, Dicts, Sets", "personal"),
            n("Loops, Conditionals, Comprehensions", "personal"),
            n("Functions, Modules & Exception Handling", "personal"),
            n("Jupyter Notebooks & Google Colab", "personal"),
          ],
          n("Python for Analytics", "personal", "skill-python")
        ),
        g(
          [
            n("R Syntax, Vectors & Factors", "alternative"),
            n("Data Frames & Tibbles", "alternative"),
            n("RStudio & R Markdown", "alternative"),
          ],
          n("R Programming", "alternative", "skill-r-programming")
        ),
      ],
      right: [
        g(
          [
            n("NumPy: Arrays & Vectorization", "personal"),
            n("Pandas: DataFrames & Series", "personal", "skill-python-data-analysis"),
            n("Indexing, Slicing & Filtering", "personal"),
            n("GroupBy, Aggregations & Pivot Tables", "personal"),
            n("Merging, Joining & Reshaping Data", "personal"),
            n("R Tidyverse: dplyr & tidyr", "alternative"),
          ],
          n("Data Manipulation Libraries", "personal")
        ),
      ],
      noteAfter:
        "Python is the dominant industry standard for data analysis due to its massive ecosystem, seamless database connectivity, and machine learning capabilities.",
    }),
  ],
};

const DATA_WRANGLING: DataAnalystRoadmapSection = {
  id: "data-wrangling",
  title: "6. Data Collection, Cleaning & Preparation",
  stages: [
    stage("Data Collection & Wrangling", {
      left: [
        g(
          [
            n("Flat Files: CSV, Excel, JSON, Parquet", "personal"),
            n("Connecting to SQL Databases (SQLAlchemy)", "personal"),
            n("Consuming REST APIs (Requests library)", "personal"),
            n("Web Scraping with BeautifulSoup", "alternative"),
          ],
          n("Data Ingestion & Sourcing", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Handling Missing Data & Imputation", "personal"),
            n("Detecting & Removing Duplicates", "personal"),
            n("Data Type Casting & Parsing Dates", "personal"),
            n("String Cleaning & Regex Matching", "personal"),
            n("Outlier Detection: IQR & Z-Score", "personal"),
          ],
          n("Data Cleaning & Transformation", "personal")
        ),
      ],
      projectIdea:
        "Automated Data Cleaning Pipeline: Write a Python script with Pandas to clean messy multi-source sales data, standardizing dates, imputing nulls, and flagging outliers.",
    }),
  ],
};

const EDA: DataAnalystRoadmapSection = {
  id: "eda",
  title: "7. Exploratory Data Analysis (EDA)",
  stages: [
    stage("Exploratory Data Analysis", {
      left: [
        g(
          [
            n("Summary Statistics: describe(), info()", "personal"),
            n("Categorical Frequency Distributions", "personal"),
            n("Skewness & Anomaly Identification", "personal"),
            n("Cardinality & Uniqueness Checks", "personal"),
          ],
          n("Statistical Profiling", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Correlation Matrices & Heatmaps", "personal"),
            n("Scatter Plots & Feature Interactions", "personal"),
            n("Distribution Plots: Histograms & Box Plots", "personal"),
            n("Time-Series Trends & Seasonality", "personal"),
          ],
          n("Multivariate Relationship Analysis", "personal")
        ),
      ],
      projectIdea:
        "Exploratory Analysis of E-Commerce Transactions: Perform end-to-end EDA on transactions to discover buyer demographics, peak purchasing hours, and high-margin products.",
    }),
  ],
};

const DATA_VISUALIZATION: DataAnalystRoadmapSection = {
  id: "data-visualization",
  title: "8. Data Visualization & Storytelling",
  stages: [
    stage("Data Visualization", {
      left: [
        g(
          [
            n("Matplotlib: Subplots & Line/Bar Charts", "personal"),
            n("Seaborn: Statistical Plots & Heatmaps", "personal"),
            n("Plotly: Interactive Dashboards", "alternative"),
          ],
          n("Python Plotting Libraries", "personal")
        ),
        g(
          [
            n("ggplot2: Grammar of Graphics", "alternative"),
            n("Aesthetics, Geoms & Faceting", "alternative"),
          ],
          n("R Visualization", "alternative")
        ),
      ],
      right: [
        g(
          [
            n("Selecting the Right Chart Type", "personal"),
            n("Maximizing Data-to-Ink Ratio", "personal"),
            n("Color Theory, Palettes & Contrast", "personal"),
            n("Callouts, Annotations & Key Milestones", "personal"),
            n("Accessibility & Clear Executive Takeaways", "personal"),
          ],
          n("Visual Storytelling Best Practices", "personal")
        ),
      ],
      noteAfter:
        "Effective visualization is about communication, not complexity. Good analysts guide stakeholders directly to the 'so what?' behind the metrics.",
    }),
  ],
};

const BUSINESS_INTELLIGENCE: DataAnalystRoadmapSection = {
  id: "business-intelligence",
  title: "9. Business Intelligence (BI) & Dashboards",
  stages: [
    stage("BI Platforms & Modeling", {
      left: [
        g(
          [
            n("Power Query ETL & M Transformations", "personal"),
            n("Data Modeling: Star Schema & Relationships", "personal"),
            n("DAX Formulas: Measures & Calculated Columns", "personal"),
            n("Interactive Reports, Slicers & Tooltips", "personal"),
            n("Power BI Service & Scheduled Refreshes", "personal"),
          ],
          n("Microsoft Power BI", "personal", "skill-power-bi")
        ),
      ],
      right: [
        g(
          [
            n("Worksheets, Dashboards & Stories", "alternative"),
            n("Calculated Fields & LOD Expressions", "alternative"),
            n("Parameters, Filters & Actions", "alternative"),
            n("Tableau Server & Tableau Cloud", "alternative"),
          ],
          n("Tableau", "alternative")
        ),
        g([
          n("Google Looker Studio", "alternative"),
          n("Looker & LookML", "alternative"),
          n("Metabase", "alternative"),
        ]),
      ],
      projectIdea:
        "Executive KPI Dashboard in Power BI: Build an automated executive dashboard tracking ARR, churn rate, CAC, and LTV with interactive drill-down filters.",
    }),
  ],
};

const VERSION_CONTROL_AND_PORTFOLIO: DataAnalystRoadmapSection = {
  id: "version-control-and-portfolio",
  title: "10. Version Control & Portfolio Engineering",
  stages: [
    stage("Git & Project Reproducibility", {
      status: "personal",
      roadmapId: "skill-git-github",
      left: [
        g(
          [
            n("Git Basics: clone, branch, commit, push", "personal"),
            n("Managing Jupyter Notebooks with Git", "personal"),
            n("Pull Requests & Code Reviews", "personal"),
          ],
          n("Version Control with Git", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Clear README & Project Documentation", "personal"),
            n("requirements.txt & Virtual Environments", "personal"),
            n("Publishing Portfolios on GitHub & Kaggle", "personal"),
            n("Hosting Public Dashboards (Tableau Public / Streamlit)", "personal"),
          ],
          n("Reproducibility & Portfolio", "personal")
        ),
      ],
    }),
  ],
};

const APPLIED_ANALYTICS_AND_STRATEGY: DataAnalystRoadmapSection = {
  id: "applied-analytics-and-strategy",
  title: "11. Applied Analytics & Business Acumen",
  stages: [
    stage("Applied Machine Learning Basics", {
      status: "optional",
      roadmapId: "machine-learning",
      left: [
        g(
          [
            n("Linear Regression for Forecasting", "personal"),
            n("Logistic Regression for Classification", "personal"),
            n("K-Means Clustering for Customer Segmentation", "personal"),
            n("Decision Trees & Random Forests", "alternative"),
            n("Model Evaluation: R², RMSE, Precision/Recall", "personal"),
          ],
          n("Predictive Modeling Fundamentals", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Data Preprocessing: StandardScaler, OneHotEncoder", "personal"),
            n("Train-Test Splits & Cross-Validation", "personal"),
            n("Scikit-Learn Model Pipelines", "personal"),
          ],
          n("Scikit-Learn Toolkit", "personal")
        ),
      ],
    }),
    stage("Business Strategy & Communication", {
      left: [
        g(
          [
            n("Financial: Revenue, GMV, COGS, EBITDA", "personal"),
            n("SaaS: ARR, MRR, Churn Rate, LTV, CAC", "personal"),
            n("Product: DAU/MAU, Retention Rate, NPS", "personal"),
          ],
          n("Key Business Metrics & KPIs", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Translating Business Questions into Queries", "personal"),
            n("Structuring Executive Slide Decks", "personal"),
            n("Root Cause Analysis & Anomaly Investigation", "personal"),
            n("Delivering Clear Actionable Recommendations", "personal"),
          ],
          n("Stakeholder Management & Strategy", "personal")
        ),
      ],
      noteAfter:
        "The most valuable data analysts are trusted strategic partners who help business leaders make confident, data-backed decisions.",
    }),
  ],
};

export const DATA_ANALYST_SECTIONS: DataAnalystRoadmapSection[] = [
  FOUNDATIONS,
  STATISTICS,
  SPREADSHEETS,
  SQL_AND_DATABASES,
  PROGRAMMING_LANGUAGES,
  DATA_WRANGLING,
  EDA,
  DATA_VISUALIZATION,
  BUSINESS_INTELLIGENCE,
  VERSION_CONTROL_AND_PORTFOLIO,
  APPLIED_ANALYTICS_AND_STRATEGY,
];
