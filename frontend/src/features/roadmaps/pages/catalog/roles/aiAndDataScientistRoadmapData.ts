export type AiAndDataScientistRoadmapStatus = "personal" | "alternative" | "optional";

export interface AiAndDataScientistRoadmapNode {
  id: string;
  title: string;
  status?: AiAndDataScientistRoadmapStatus;
  roadmapId?: string;
}

export interface AiAndDataScientistRoadmapGroup {
  id: string;
  parent?: AiAndDataScientistRoadmapNode;
  items: AiAndDataScientistRoadmapNode[];
}

export interface AiAndDataScientistRoadmapStage {
  id: string;
  node: AiAndDataScientistRoadmapNode;
  left?: AiAndDataScientistRoadmapGroup[];
  right?: AiAndDataScientistRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AiAndDataScientistRoadmapSection {
  id: string;
  title?: string;
  stages: AiAndDataScientistRoadmapStage[];
}

export interface AiAndDataScientistRoadmapLink {
  label: string;
  roadmapId: string;
}

export const AI_AND_DATA_SCIENTIST_MARKERS: Array<{
  status: AiAndDataScientistRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const AI_AND_DATA_SCIENTIST_RELATED_ROADMAPS: AiAndDataScientistRoadmapLink[] = [
  { label: "Data Analyst", roadmapId: "data-analyst" },
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "Machine Learning", roadmapId: "machine-learning" },
  { label: "Python for Data Analysis", roadmapId: "skill-python-data-analysis" },
  { label: "Python", roadmapId: "skill-python" },
];

export const AI_AND_DATA_SCIENTIST_CONTINUE_LEARNING: AiAndDataScientistRoadmapLink[] = [
  { label: "AI Agents", roadmapId: "skill-ai-agents" },
  { label: "Prompt Engineering", roadmapId: "skill-prompt-engineering" },
  { label: "MLOps", roadmapId: "mlops" },
  { label: "Claude Code", roadmapId: "skill-claude-code" },
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AiAndDataScientistRoadmapStatus,
  roadmapId?: string
): AiAndDataScientistRoadmapNode => ({
  id: slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AiAndDataScientistRoadmapNode[],
  parent?: AiAndDataScientistRoadmapNode
): AiAndDataScientistRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AiAndDataScientistRoadmapStage, "id" | "node"> & {
    status?: AiAndDataScientistRoadmapStatus;
  } = {}
): AiAndDataScientistRoadmapStage => {
  const { status, ...rest } = options;

  return {
    id: slug(title),
    node: n(title, status),
    ...rest,
  };
};

const MATHEMATICS_AND_STATISTICS: AiAndDataScientistRoadmapSection = {
  id: "math-and-statistics",
  title: "1. Mathematical Foundations & Statistics",
  stages: [
    stage("Mathematics", {
      status: "personal",
      left: [
        g(
          [
            n("Vectors, Matrices & Transformations", "personal"),
            n("Matrix Multiplication & Inversion", "personal"),
            n("Eigenvalues and Eigenvectors", "personal"),
            n("Singular Value Decomposition (SVD)", "optional"),
          ],
          n("Linear Algebra", "personal")
        ),
        g(
          [
            n("Differential & Integral Calculus", "personal"),
            n("Partial Derivatives & Chain Rule", "personal"),
            n("Gradients, Jacobians & Hessians", "personal"),
            n("Optimization & Gradient Descent", "personal"),
          ],
          n("Calculus & Optimization", "personal")
        ),
      ],
      projectIdea: "Implement Gradient Descent & SVD from scratch using pure Python and NumPy",
    }),
    stage("Statistics", {
      status: "personal",
      right: [
        g(
          [
            n("Descriptive Statistics (Mean, Variance, IQR)", "personal"),
            n("Probability Axioms & Bayes' Theorem", "personal"),
            n("Central Limit Theorem (CLT)", "personal"),
            n("Probability Distributions (Normal, Binomial, Poisson)", "personal"),
          ],
          n("Descriptive & Probability", "personal")
        ),
        g(
          [
            n("Hypothesis Testing, P-values & Alpha Levels", "personal"),
            n("Confidence Intervals & Type I/II Errors", "personal"),
            n("A/B Testing & Sample Sizing", "personal"),
            n("Increasing Test Sensitivity (CUPED)", "optional"),
            n("Ratio Metrics, Deltas & Bootstrapping", "optional"),
          ],
          n("Inference & Experimentation", "personal")
        ),
      ],
      noteAfter:
        "Rigorous statistical testing and experiment design are fundamental differentiators between data scientists and software developers.",
    }),
    stage("Econometrics", {
      status: "optional",
      left: [
        g(
          [
            n("Pre-requisites of Econometrics", "optional"),
            n("Ordinary Least Squares (OLS) & Assumptions", "optional"),
            n("Time Series Analysis (Stationarity, ARIMA)", "optional"),
            n("Fitting Probability Distributions", "optional"),
          ],
          n("Econometrics & Timeseries", "optional")
        ),
      ],
    }),
  ],
};

const CODING_AND_TOOLING: AiAndDataScientistRoadmapSection = {
  id: "coding-tooling",
  title: "2. Programming, Data Structures & SQL",
  stages: [
    stage("Coding", {
      status: "personal",
      left: [
        g(
          [
            n("Learn Python Syntax, Functions & Types", "personal", "skill-python"),
            n("Object-Oriented Programming (OOP)", "personal"),
            n("Virtual Environments (venv, conda, poetry)", "personal"),
          ],
          n("Python Language Mastery", "personal", "skill-python")
        ),
        g(
          [
            n("Arrays, Hash Maps, Linked Lists, Trees", "personal", "skill-dsa"),
            n("Sorting, Searching & Graph Traversal", "personal", "skill-dsa"),
            n("Time & Space Complexity (Big-O)", "personal", "skill-dsa"),
          ],
          n("Data Structures & Algorithms", "personal", "skill-dsa")
        ),
      ],
      right: [
        g(
          [
            n("SELECT, Filtering, Grouping & Sorting", "personal", "skill-sql"),
            n("JOINS (Inner, Left, Cross, Self)", "personal", "skill-sql"),
            n("Window Functions (ROW_NUMBER, RANK, LEAD/LAG)", "personal", "skill-sql"),
            n("Subqueries, CTEs & Aggregations", "personal", "skill-sql"),
          ],
          n("SQL & Database Querying", "personal", "skill-sql")
        ),
        g([n("Git Branching, Commits & PRs", "personal", "skill-git-github")], n("Version Control", "personal", "skill-git-github")),
      ],
      projectIdea: "Build an automated SQL-to-Pandas analytics ETL pipeline querying relational databases",
    }),
  ],
};

const DATA_WRANGLING_AND_EDA: AiAndDataScientistRoadmapSection = {
  id: "eda-and-wrangling",
  title: "3. Exploratory Data Analysis & Feature Engineering",
  stages: [
    stage("Exploratory Data Analysis", {
      status: "personal",
      right: [
        g(
          [
            n("NumPy: Multidimensional Arrays & Vectorization", "personal"),
            n("Pandas: DataFrames, Filtering, Slicing & Merging", "personal", "skill-python-data-analysis"),
            n("Handling Missing Values & Outlier Detection", "personal"),
            n("Data Imputation & Type Casting", "personal"),
          ],
          n("Data Wrangling & Cleaning", "personal")
        ),
      ],
      left: [
        g(
          [
            n("Matplotlib & Seaborn Statistical Charts", "personal"),
            n("Interactive Plotly Dashboards", "personal"),
            n("Categorical Encoding (One-Hot, Target, Ordinal)", "personal"),
            n("Feature Scaling (StandardScaler, MinMaxScaler)", "personal"),
            n("Feature Extraction & Correlation Analysis", "personal"),
          ],
          n("Visualization & Feature Engineering", "personal")
        ),
      ],
      projectIdea: "Perform end-to-end EDA on a complex multi-million row dataset with automated outlier reports",
    }),
  ],
};

const MACHINE_LEARNING_PILLAR: AiAndDataScientistRoadmapSection = {
  id: "machine-learning",
  title: "4. Classical Machine Learning & Validation",
  stages: [
    stage("Machine Learning", {
      status: "personal",
      right: [
        g(
          [
            n("Linear & Polynomial Regression", "personal"),
            n("Logistic Regression for Binary/Multi-class", "personal"),
            n("Decision Trees & Random Forests", "personal"),
            n("Gradient Boosting (XGBoost, LightGBM, CatBoost)", "personal"),
            n("Support Vector Machines (SVM) & KNN", "optional"),
          ],
          n("Supervised Learning", "personal")
        ),
      ],
      left: [
        g(
          [
            n("K-Means & Hierarchical Clustering", "personal"),
            n("DBSCAN Density-Based Clustering", "optional"),
            n("Principal Component Analysis (PCA)", "personal"),
            n("t-SNE & UMAP Dimensionality Reduction", "optional"),
          ],
          n("Unsupervised Learning", "personal")
        ),
        g(
          [
            n("Train/Val/Test Splits & K-Fold Cross-Validation", "personal"),
            n("Precision, Recall, F1-Score & ROC-AUC", "personal"),
            n("Bias-Variance Tradeoff & Regularization (L1/L2)", "personal"),
            n("Hyperparameter Optimization (Optuna, GridSearch)", "personal"),
          ],
          n("Model Evaluation & Tuning", "personal")
        ),
      ],
      projectIdea: "Train an ensemble Gradient Boosting model (XGBoost + LightGBM) with Optuna hyperparameter tuning",
    }),
  ],
};

const DEEP_LEARNING_PILLAR: AiAndDataScientistRoadmapSection = {
  id: "deep-learning",
  title: "5. Deep Learning, Computer Vision & NLP",
  stages: [
    stage("Deep Learning", {
      status: "personal",
      left: [
        g(
          [
            n("Perceptrons & Multi-Layer Perceptrons (MLP)", "personal"),
            n("Activation Functions (ReLU, GELU, Sigmoid, Softmax)", "personal"),
            n("Backpropagation & Gradient Optimization", "personal"),
            n("Optimizers (SGD, Adam, AdamW, Schedulers)", "personal"),
            n("Loss Functions (Cross-Entropy, MSE, Triplet)", "personal"),
          ],
          n("Neural Network Architecture", "personal")
        ),
        g(
          [
            n("PyTorch Tensors, Autograd & DataLoader", "personal"),
            n("Building Custom nn.Module Architectures", "personal"),
            n("TensorFlow & Keras (Alternative)", "alternative"),
            n("GPU Hardware Acceleration (CUDA)", "personal"),
          ],
          n("Frameworks & Hardware", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Convolutional Layers, Pooling & Kernels", "personal"),
            n("Transfer Learning (ResNet, EfficientNet, ConvNeXt)", "personal"),
            n("Object Detection (YOLO, Faster R-CNN)", "optional"),
          ],
          n("Computer Vision (CV)", "personal")
        ),
        g(
          [
            n("Tokenization & Word Embeddings", "personal"),
            n("RNNs, LSTMs & Sequence Modeling", "optional"),
            n("Transformer Architecture & Self-Attention", "personal"),
            n("Pretrained Language Models (BERT, RoBERTa)", "personal"),
          ],
          n("Natural Language Processing (NLP)", "personal")
        ),
      ],
      projectIdea: "Build and train a custom PyTorch Vision or Text Transformer classifier with transfer learning",
    }),
  ],
};

const MODERN_AI_AND_LLMS: AiAndDataScientistRoadmapSection = {
  id: "modern-ai",
  title: "6. Modern Generative AI, RAG & LLMs",
  stages: [
    stage("AI Engineering", {
      status: "personal",
      right: [
        g(
          [
            n("Large Language Models (GPT-4, Claude 3.7, Gemini 2.5)", "personal"),
            n("Prompt Engineering & System Prompt Design", "personal", "skill-prompt-engineering"),
            n("Structured JSON Outputs & Schema Enforcement", "personal"),
          ],
          n("Foundation Models & Prompting", "personal")
        ),
        g(
          [
            n("Chunking, Embeddings & Semantic Search", "personal"),
            n("Vector Databases (Chroma, Pinecone, Qdrant)", "personal"),
            n("Hybrid Search & Cross-Encoder Reranking", "personal"),
            n("Advanced RAG (GraphRAG, Multi-Hop)", "optional"),
          ],
          n("Retrieval-Augmented Generation (RAG)", "personal")
        ),
      ],
      left: [
        g(
          [
            n("AI Agent Architectures & ReAct Loops", "personal", "skill-ai-agents"),
            n("Tool Calling & Function Calling APIs", "personal"),
            n("LangChain, LangGraph & LlamaIndex", "personal"),
            n("Model Context Protocol (MCP) Tools", "personal"),
          ],
          n("Agentic Workflows", "personal", "skill-ai-agents")
        ),
        g(
          [
            n("Parameter-Efficient Fine-Tuning (LoRA, QLoRA)", "personal"),
            n("Direct Preference Optimization (DPO & RLHF)", "optional"),
            n("Model Quantization & Local Inference (vLLM, Ollama)", "personal"),
          ],
          n("Model Adaptation & Fine-Tuning", "personal")
        ),
      ],
      projectIdea: "Deploy an enterprise RAG agent with hybrid search reranking and local tool calling capabilities",
    }),
  ],
};

const MLOPS_AND_DELIVERY: AiAndDataScientistRoadmapSection = {
  id: "mlops-delivery",
  title: "7. MLOps, Model Deployment & Delivery",
  stages: [
    stage("MLOps", {
      status: "personal",
      right: [
        g(
          [
            n("Model Serving with FastAPI & Uvicorn", "personal"),
            n("Docker Containerization for ML Services", "personal", "skill-docker"),
            n("Experiment Tracking with MLflow & W&B", "personal"),
            n("Model Registries & Semantic Versioning", "personal"),
          ],
          n("Serving & Experiment Tracking", "personal")
        ),
        g(
          [
            n("CI/CD Automation (GitHub Actions)", "personal"),
            n("Data Drift & Concept Drift Monitoring", "personal"),
            n("Model Performance & Latency Telemetry", "personal"),
          ],
          n("Pipelines & Observability", "personal")
        ),
      ],
      noteAfter:
        "Production data science requires deploying resilient API services with strict drift monitoring and telemetry.",
    }),
    stage("Vibe Coding", {
      status: "personal",
      left: [
        g(
          [
            n("AI Coding Assistants (Cursor, Claude Code, Copilot)", "personal", "skill-claude-code"),
            n("Rapid Prototyping UIs (Streamlit, Gradio)", "personal"),
            n("Automated Code Generation & Unit Testing", "personal"),
          ],
          n("AI-Assisted Development", "personal")
        ),
      ],
      projectIdea: "Ship an end-to-end full-stack AI data application using Streamlit/FastAPI with automated CI/CD",
    }),
  ],
};

export const AI_AND_DATA_SCIENTIST_SECTIONS: AiAndDataScientistRoadmapSection[] = [
  MATHEMATICS_AND_STATISTICS,
  CODING_AND_TOOLING,
  DATA_WRANGLING_AND_EDA,
  MACHINE_LEARNING_PILLAR,
  DEEP_LEARNING_PILLAR,
  MODERN_AI_AND_LLMS,
  MLOPS_AND_DELIVERY,
];
