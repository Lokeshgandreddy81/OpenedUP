export type PythonDataAnalysisRoadmapStatus = "personal" | "alternative" | "optional";

export interface PythonDataAnalysisRoadmapNode {
  id: string;
  title: string;
  status?: PythonDataAnalysisRoadmapStatus;
  roadmapId?: string;
}

export interface PythonDataAnalysisRoadmapGroup {
  id: string;
  parent?: PythonDataAnalysisRoadmapNode;
  items: PythonDataAnalysisRoadmapNode[];
}

export interface PythonDataAnalysisRoadmapStage {
  id: string;
  node: PythonDataAnalysisRoadmapNode;
  left?: PythonDataAnalysisRoadmapGroup[];
  right?: PythonDataAnalysisRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface PythonDataAnalysisRoadmapSection {
  id: string;
  title?: string;
  stages: PythonDataAnalysisRoadmapStage[];
}

export interface PythonDataAnalysisRoadmapLink {
  label: string;
  roadmapId: string;
}

export const PYTHON_DATA_ANALYSIS_MARKERS: Array<{
  status: PythonDataAnalysisRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const PYTHON_DATA_ANALYSIS_RELATED_ROADMAPS: PythonDataAnalysisRoadmapLink[] = [
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Machine Learning Roadmap", roadmapId: "machine-learning" },
  { label: "Data Engineer Roadmap", roadmapId: "data-engineer" },
  { label: "R Programming", roadmapId: "skill-r-programming" },
  { label: "PostgreSQL DBA", roadmapId: "postgresql" },
];

export const PYTHON_DATA_ANALYSIS_CONTINUE_LEARNING: PythonDataAnalysisRoadmapLink[] = [
  { label: "Data Analyst", roadmapId: "data-analyst" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Machine Learning", roadmapId: "machine-learning" },
  { label: "Python", roadmapId: "skill-python" },
  { label: "Data Engineer", roadmapId: "data-engineer" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: PythonDataAnalysisRoadmapStatus,
  roadmapId?: string,
  customId?: string
): PythonDataAnalysisRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: PythonDataAnalysisRoadmapNode[],
  parent?: PythonDataAnalysisRoadmapNode,
  customId?: string
): PythonDataAnalysisRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<PythonDataAnalysisRoadmapStage, "id" | "node"> & {
    status?: PythonDataAnalysisRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): PythonDataAnalysisRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. ENVIRONMENT & SETUP
const ENVIRONMENT_AND_SETUP: PythonDataAnalysisRoadmapSection = {
  id: "environment-and-setup",
  title: "Environment & Setup",
  stages: [
    stage("Notebook Environments", {
      left: [
        g(
          [
            n("JupyterLab", "personal"),
            n("Jupyter Notebooks", "alternative"),
            n("VS Code Jupyter Extension", "personal"),
          ],
          n("Local Interactive Notebooks")
        ),
      ],
      right: [
        g(
          [
            n("Google Colab (Free GPU/TPU access)", "personal"),
            n("Kaggle Notebooks", "alternative"),
            n("Deepnote / Hex", "optional"),
          ],
          n("Cloud Notebooks")
        ),
      ],
      noteAfter:
        "Interactive notebook environments provide cell-by-cell execution, inline visualization rendering, and markdown narrative, making them the standard workbench for modern data analysis and exploratory modeling.",
    }),
    stage("Distributions & Environments", {
      left: [
        g(
          [
            n("Miniconda (Minimal conda installer)", "personal"),
            n("Anaconda (Batteries-included data science)", "alternative"),
            n("Mamba / Micromamba (Fast C++ conda solver)", "personal"),
          ],
          n("Conda Distributions")
        ),
      ],
      right: [
        g(
          [
            n("uv (Ultra-fast Python environment manager)", "personal"),
            n("Virtual environments (venv + pip)", "alternative"),
            n("Managing kernel specs (ipykernel install)"),
          ],
          n("Modern Python Env Tools")
        ),
      ],
      projectIdea:
        "Configure a reproducible data science environment using Miniconda/uv, setting up dedicated Jupyter kernels and locked dependencies.",
    }),
  ],
};

// 2. DATA MANIPULATION WITH NUMPY
const DATA_MANIPULATION_WITH_NUMPY: PythonDataAnalysisRoadmapSection = {
  id: "data-manipulation-with-numpy",
  title: "Data Manipulation with NumPy",
  stages: [
    stage("NDArrays & Core Array Mechanics", {
      left: [
        g(
          [
            n("np.ndarray creation (zeros, ones, arange, linspace)", "personal"),
            n("Array Attributes (ndim, shape, size, dtype)"),
            n("Memory layouts: C-contiguous vs Fortran-contiguous"),
            n("Data types: int32, float64, bool, complex"),
          ],
          n("Array Creation & Structure")
        ),
      ],
      right: [
        g(
          [
            n("Basic Slicing & Strided Indexing"),
            n("Boolean Masking & Filtering", "personal"),
            n("Fancy / Integer Array Indexing"),
            n("np.where and conditional selection"),
          ],
          n("Indexing & Slicing")
        ),
      ],
      noteAfter:
        "NumPy is the backbone of scientific computing in Python, providing memory-contiguous C-level arrays and vectorized SIMD execution that outperforms traditional Python loops by orders of magnitude.",
    }),
    stage("Vectorization & Operations", {
      left: [
        g(
          [
            n("Element-wise Arithmetic (+, -, *, /, //, **)"),
            n("Broadcasting Rules & Dimensional Alignment", "personal"),
            n("Universal Functions (ufuncs: sin, exp, sqrt)"),
            n("In-place operations (+=, *=) to save memory"),
          ],
          n("Vectorized Operations")
        ),
      ],
      right: [
        g(
          [
            n("Aggregations (np.sum, np.mean, np.median, np.std)"),
            n("Axis-based Reductions (axis=0 vs axis=1)", "personal"),
            n("Reshaping, Flattening (.ravel() vs .flatten())"),
            n("Stacking & Concatenation (np.vstack, np.hstack, np.concatenate)"),
          ],
          n("Aggregations & Reshaping")
        ),
      ],
    }),
    stage("Linear Algebra & Numerical Routines", {
      left: [
        g(
          [
            n("Matrix Multiplication (np.matmul, @ operator)", "personal"),
            n("Dot products & Inner/outer products"),
            n("np.linalg: inv, det, matrix_rank"),
            n("Eigenvalues & Eigenvectors (np.linalg.eig)"),
            n("Singular Value Decomposition (np.linalg.svd)"),
          ],
          n("Linear Algebra (np.linalg)")
        ),
      ],
      right: [
        g(
          [
            n("np.random (Random sampling, distributions)", "personal"),
            n("np.random.default_rng() (Modern Generator API)"),
            n("Sorting & Partitioning (np.sort, np.argsort)"),
            n("Handling NaNs (np.isnan, np.nanmean)"),
          ],
          n("Random & Numerical Routines")
        ),
      ],
      projectIdea:
        "Build a pure NumPy image transformation engine that loads raw pixel arrays, performs vectorized convolutions, contrast stretching, and channel blending.",
    }),
  ],
};

// 3. DATA WRANGLING WITH PANDAS
const DATA_WRANGLING_WITH_PANDAS: PythonDataAnalysisRoadmapSection = {
  id: "data-wrangling-with-pandas",
  title: "Data Wrangling with Pandas",
  stages: [
    stage("Series, DataFrames & Data Access", {
      left: [
        g(
          [
            n("pd.Series (1D labeled indexed array)"),
            n("pd.DataFrame (2D labeled tabular structure)"),
            n("Index objects & RangeIndex"),
            n("MultiIndex (Hierarchical indexing)", "personal"),
          ],
          n("Pandas Data Structures")
        ),
      ],
      right: [
        g(
          [
            n(".loc (Label-based selection)", "personal"),
            n(".iloc (Integer position-based selection)", "personal"),
            n("Boolean Indexing & .query() expressions", "personal"),
            n("Avoiding SettingWithCopyWarning (.copy())"),
          ],
          n("Indexing & Selection")
        ),
      ],
      noteAfter:
        "Pandas provides high-performance, flexible data structures for tabular and time-series data, offering SQL-like operations and spreadsheet ergonomics inside Python.",
    }),
    stage("Reading & Writing Data Formats", {
      left: [
        g(
          [
            n("CSV & TSV (pd.read_csv, to_csv)", "personal"),
            n("Excel Spreadsheets (pd.read_excel, openpyxl)"),
            n("JSON & REST API responses (pd.read_json)"),
            n("SQL Databases (pd.read_sql, SQLAlchemy)"),
          ],
          n("Standard File Formats")
        ),
      ],
      right: [
        g(
          [
            n("Apache Parquet (pd.read_parquet)", "personal"),
            n("Feather / Arrow IPC format"),
            n("Chunking large files (chunksize parameter)"),
            n("HDF5 & Pickle formats (fast intermediate dumps)"),
          ],
          n("High-Performance Formats")
        ),
      ],
    }),
    stage("Grouping, Merging & Reshaping", {
      left: [
        g(
          [
            n("df.groupby() mechanics & Split-Apply-Combine", "personal"),
            n("Aggregation methods (.agg(['mean', 'sum', 'count']))", "personal"),
            n("Transformation (.transform())"),
            n("Group filtering (.filter())"),
          ],
          n("GroupBy & Aggregation")
        ),
      ],
      right: [
        g(
          [
            n("Merging & Joins: pd.merge (inner, left, right, outer)", "personal"),
            n("Concatenation: pd.concat along rows & columns"),
            n("Pivoting: df.pivot, df.pivot_table, df.melt", "personal"),
            n("Crosstabs: pd.crosstab"),
            n("Method Chaining with .pipe() and .assign()", "personal"),
          ],
          n("Merging, Reshaping & Chaining")
        ),
      ],
      projectIdea:
        "Analyze a multi-table retail database by merging customer, order, and product records, computing customer lifetime value cohorts with groupby, and pivoting quarterly revenues.",
    }),
  ],
};

// 4. DATA CLEANING & PREPROCESSING
const DATA_CLEANING_AND_PREPROCESSING: PythonDataAnalysisRoadmapSection = {
  id: "data-cleaning-and-preprocessing",
  title: "Data Cleaning & Preprocessing",
  stages: [
    stage("Missing Values & Data Deduplication", {
      left: [
        g(
          [
            n("Detecting nulls (isna(), notna(), isnull())", "personal"),
            n("Dropping missing entries (dropna(axis, thresh))"),
            n("Fill strategies (fillna: mean, median, mode, bfill, ffill)", "personal"),
            n("Advanced imputation (IterativeImputer, KNNImputer)"),
          ],
          n("Handling Missing Data")
        ),
      ],
      right: [
        g(
          [
            n("Identifying duplicates (duplicated(subset, keep))"),
            n("Dropping duplicate rows (drop_duplicates())", "personal"),
            n("Fuzzy string matching for duplicate entities (thefuzz)"),
            n("Handling structural inconsistencies across sources"),
          ],
          n("Deduplication & Consistency")
        ),
      ],
    }),
    stage("Type Conversion & String Manipulation", {
      left: [
        g(
          [
            n("Data Type Casting (.astype())", "personal"),
            n("pd.to_numeric with errors='coerce'", "personal"),
            n("Categorical Dtype (Memory optimization)", "personal"),
            n("Downcasting numeric types (float64 to float32)"),
          ],
          n("Type Conversion & Memory")
        ),
      ],
      right: [
        g(
          [
            n("Vectorized String Methods (.str.strip, .str.lower)"),
            n("Regex Extraction (.str.extract, .str.contains)", "personal"),
            n("Splitting & Expanding (.str.split(expand=True))"),
            n("String replacement and encoding cleanup"),
          ],
          n("String Processing (.str)")
        ),
      ],
    }),
    stage("Datetime Operations & Outlier Detection", {
      left: [
        g(
          [
            n("pd.to_datetime with format strings & errors", "personal"),
            n("Datetime Properties (.dt.year, .dt.month, .dt.day_name)", "personal"),
            n("Time-series resampling (.resample('M', 'W'))", "personal"),
            n("Rolling windows (.rolling(window=7).mean())"),
            n("Timezone conversions (.tz_localize, .tz_convert)"),
          ],
          n("Datetime & Time Series (.dt)")
        ),
      ],
      right: [
        g(
          [
            n("IQR Rule (Interquartile Range boxplot method)", "personal"),
            n("Z-Score / Standard deviation clipping"),
            n("Winsorization & percentile trimming"),
            n("Domain validation rules & schema checks"),
          ],
          n("Outlier Detection & Cleaning")
        ),
      ],
      projectIdea:
        "Build a comprehensive data cleaning pipeline for uncurated real estate listings: clean text addresses with regex, parse erratic dates, impute missing prices, and clip extreme outliers.",
    }),
  ],
};

// 5. EXPLORATORY DATA ANALYSIS (EDA) & STATISTICS
const EDA_AND_STATISTICS: PythonDataAnalysisRoadmapSection = {
  id: "eda-and-statistics",
  title: "Exploratory Data Analysis (EDA) & Statistics",
  stages: [
    stage("Summary Statistics & Distributions", {
      left: [
        g(
          [
            n("Summary tables (df.describe(), info(), shape)", "personal"),
            n("Central tendency (Mean, Median, Mode, Trimmed Mean)"),
            n("Dispersion (Variance, Std Dev, IQR, Range)"),
            n("Skewness & Kurtosis assessment"),
          ],
          n("Descriptive Statistics")
        ),
      ],
      right: [
        g(
          [
            n("Normal / Gaussian Distribution", "personal"),
            n("Binomial & Poisson Distributions"),
            n("Central Limit Theorem (CLT)"),
            n("Probability Density Functions (PDF / CDF)"),
          ],
          n("Probability Distributions")
        ),
      ],
      noteAfter:
        "EDA is the exploratory detective phase of data science. It transforms raw numeric matrices into meaningful intuition regarding patterns, anomalies, distributions, and relationship structures.",
    }),
    stage("Correlation & Hypothesis Testing", {
      left: [
        g(
          [
            n("Pearson Correlation (Linear relationship)", "personal"),
            n("Spearman Rank Correlation (Monotonic relationship)", "personal"),
            n("Kendall Tau Correlation"),
            n("Covariance Matrices & Multicollinearity"),
            n("Simpson's Paradox awareness"),
          ],
          n("Correlation & Association")
        ),
      ],
      right: [
        g(
          [
            n("Hypothesis testing workflow (Null hypothesis H0, p-values)", "personal"),
            n("Student's t-test (One-sample, Two-sample, Paired)", "personal"),
            n("Chi-Square Test of Independence (scipy.stats.chi2_contingency)", "personal"),
            n("ANOVA (Analysis of Variance) & F-test"),
            n("Non-parametric tests (Mann-Whitney U, Kruskal-Wallis)"),
          ],
          n("Statistical Hypothesis Testing")
        ),
      ],
      projectIdea:
        "Conduct an in-depth A/B test analysis on e-commerce user checkout flows, calculating p-values, confidence intervals, and verifying statistical significance across user segments.",
    }),
  ],
};

// 6. DATA VISUALIZATION
const DATA_VISUALIZATION: PythonDataAnalysisRoadmapSection = {
  id: "data-visualization",
  title: "Data Visualization",
  stages: [
    stage("Static Plots: Matplotlib & Seaborn", {
      left: [
        g(
          [
            n("Matplotlib Object-Oriented API (fig, ax)", "personal"),
            n("Line plots, Scatter plots, Bar charts, Histograms"),
            n("Subplots & GridSpec multi-panel figures", "personal"),
            n("Customizing legends, titles, ticks, and annotations"),
          ],
          n("Matplotlib Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Distribution plots (sns.histplot, sns.kdeplot)", "personal"),
            n("Categorical plots (sns.boxplot, sns.violinplot, sns.barplot)", "personal"),
            n("Pair plots & Joint plots (sns.pairplot)", "personal"),
            n("Correlation Heatmaps (sns.heatmap with annot=True)", "personal"),
          ],
          n("Seaborn Statistical Plots")
        ),
      ],
    }),
    stage("Interactive Charts & Data Dashboards", {
      left: [
        g(
          [
            n("Plotly Express (px.scatter, px.line, px.bar, px.choropleth)", "personal"),
            n("Plotly Graph Objects (go.Figure layouts & traces)", "personal"),
            n("Interactive Tooltips, Zooming & Hover Templates"),
            n("Animations & Slider Timelines"),
          ],
          n("Plotly Interactive Visuals")
        ),
      ],
      right: [
        g(
          [
            n("Streamlit (Rapid analytical web apps)", "personal"),
            n("Dash by Plotly (Enterprise data dashboards)", "alternative"),
            n("Altair / Vega-Lite (Declarative charting)", "optional"),
            n("Exporting Vector SVGs and publication-quality figures"),
          ],
          n("Dashboards & Presentation")
        ),
      ],
      projectIdea:
        "Build an interactive macroeconomic indicator dashboard with Plotly and Streamlit featuring country choropleths, time series sliders, and correlation heatmaps.",
    }),
  ],
};

// 7. ADVANCED DATA ANALYSIS & PERFORMANCE
const ADVANCED_DATA_ANALYSIS_AND_PERFORMANCE: PythonDataAnalysisRoadmapSection = {
  id: "advanced-data-analysis-and-performance",
  title: "Advanced Data Analysis & Performance",
  stages: [
    stage("Next-Gen DataFrame Engines", {
      left: [
        g(
          [
            n("Polars (Blazing fast Rust-based DataFrame library)", "personal"),
            n("Polars LazyFrame & Query Plan Optimization", "personal"),
            n("Polars Expressions (pl.col, pl.when, pl.concat_list)"),
            n("Polars multi-threaded streaming execution"),
          ],
          n("Polars Engine")
        ),
      ],
      right: [
        g(
          [
            n("DuckDB (In-process analytical OLAP database)", "personal"),
            n("Querying Pandas / Polars DataFrames with SQL", "personal"),
            n("Dask DataFrame (Out-of-core computing on larger-than-RAM data)", "alternative"),
            n("PySpark (Distributed big data clusters)", "optional"),
          ],
          n("DuckDB & Distributed Computing")
        ),
      ],
      noteAfter:
        "When datasets exceed memory or pandas single-threaded performance hits ceilings, Polars, DuckDB, and Apache Arrow provide 10x-50x speedups with vectorized Rust/C++ execution engines.",
    }),
    stage("Columnar Storage & Memory Optimization", {
      left: [
        g(
          [
            n("Apache Parquet (Columnar storage, predicate pushdown)", "personal"),
            n("Apache Arrow memory format & PyArrow", "personal"),
            n("Snappy, ZSTD, and GZIP compression codecs"),
            n("Partitioned directory layouts (year=2024/month=10/)"),
          ],
          n("Columnar Storage & Arrow")
        ),
      ],
      right: [
        g(
          [
            n("Direct SQL queries on Parquet without loading to RAM", "personal"),
            n("Memory profiling (memory_profiler, tracemalloc)"),
            n("Benchmarking Pandas vs Polars vs DuckDB"),
            n("Numba JIT compilation for custom Python loops (@jit)", "personal"),
          ],
          n("Optimization & Profiling")
        ),
      ],
      projectIdea:
        "Benchmark querying and aggregating 50 million rows across Pandas, Polars, and DuckDB using partitioned Parquet files, reporting query latencies and peak RAM footprints.",
    }),
  ],
};

export const PYTHON_DATA_ANALYSIS_SECTIONS: PythonDataAnalysisRoadmapSection[] = [
  ENVIRONMENT_AND_SETUP,
  DATA_MANIPULATION_WITH_NUMPY,
  DATA_WRANGLING_WITH_PANDAS,
  DATA_CLEANING_AND_PREPROCESSING,
  EDA_AND_STATISTICS,
  DATA_VISUALIZATION,
  ADVANCED_DATA_ANALYSIS_AND_PERFORMANCE,
];
