export type MachineLearningRoadmapStatus = "personal" | "alternative" | "optional";

export interface MachineLearningRoadmapNode {
  id: string;
  title: string;
  status?: MachineLearningRoadmapStatus;
  roadmapId?: string;
}

export interface MachineLearningRoadmapGroup {
  id: string;
  parent?: MachineLearningRoadmapNode;
  items: MachineLearningRoadmapNode[];
}

export interface MachineLearningRoadmapStage {
  id: string;
  node: MachineLearningRoadmapNode;
  left?: MachineLearningRoadmapGroup[];
  right?: MachineLearningRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface MachineLearningRoadmapSection {
  id: string;
  title?: string;
  stages: MachineLearningRoadmapStage[];
}

export interface MachineLearningRoadmapLink {
  label: string;
  roadmapId: string;
}

export const MACHINE_LEARNING_MARKERS: Array<{
  status: MachineLearningRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const MACHINE_LEARNING_RELATED_ROADMAPS: MachineLearningRoadmapLink[] = [
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "AI and Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "AI Agents Roadmap", roadmapId: "skill-ai-agents" },
  { label: "Data Analyst Roadmap", roadmapId: "data-analyst" },
  { label: "Data Engineer Roadmap", roadmapId: "data-engineer" },
];

export const MACHINE_LEARNING_CONTINUE_LEARNING: MachineLearningRoadmapLink[] = [
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "MLOps", roadmapId: "mlops" },
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "AI Agents", roadmapId: "skill-ai-agents" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: MachineLearningRoadmapStatus,
  roadmapId?: string,
  customId?: string
): MachineLearningRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: MachineLearningRoadmapNode[],
  parent?: MachineLearningRoadmapNode,
  customId?: string
): MachineLearningRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<MachineLearningRoadmapStage, "id" | "node"> & {
    status?: MachineLearningRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): MachineLearningRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const INTRODUCTION: MachineLearningRoadmapSection = {
  id: "introduction",
  stages: [
    stage("Introduction", {
      right: [
        g([
          n("What is an ML Engineer?"),
          n("ML Engineer vs AI Engineer"),
          n("Skills and Responsibilities"),
        ]),
      ],
    }),
  ],
};

const MATHEMATICAL_FOUNDATIONS: MachineLearningRoadmapSection = {
  id: "mathematical-foundations",
  title: "Mathematical Foundations",
  stages: [
    stage("Linear Algebra", {
      left: [
        g(
          [
            n("Derivatives, Partial Derivatives"),
            n("Chain rule of derivation"),
            n("Gradient, Jacobian, Hessian"),
          ],
          n("Calculus")
        ),
        g([], n("Discrete Mathematics")),
      ],
      right: [
        g([
          n("Matrix & Matrix Operations"),
          n("Scalars, Vectors, Tensors"),
          n("Singular Value Decomposition"),
          n("Determinants, inverse of Matrix"),
          n("Eigenvalues, Diagonalization"),
        ]),
      ],
    }),
    stage("Statistics", {
      left: [
        g([
          n("Basic concepts"),
          n("Descriptive Statistics"),
          n("Graphs & Charts"),
          n("Inferential Statistics"),
        ]),
      ],
      right: [
        g(
          [
            n("Basics of Probability"),
            n("Bayes Theorem"),
            n("Random Variances, PDFs"),
            n("Types of Distribution"),
          ],
          n("Probability")
        ),
      ],
    }),
  ],
};

const PROGRAMMING_FUNDAMENTALS: MachineLearningRoadmapSection = {
  id: "programming-fundamentals",
  title: "Programming Fundamentals",
  stages: [
    stage("Python", {
      roadmapId: "skill-python",
      right: [
        g(
          [
            n("Variables and Data Types"),
            n("Data Structures"),
            n("Loops"),
            n("Conditionals"),
            n("Exceptions"),
            n("Functions, Builtin Functions"),
          ],
          n("Basic Syntax")
        ),
      ],
    }),
    stage("Object Oriented Programming", {
      left: [g([n("Numpy"), n("Pandas"), n("Matplotlib"), n("Seaborn")], n("Essential libraries"))],
    }),
  ],
};

const DATA_COLLECTION: MachineLearningRoadmapSection = {
  id: "data-collection",
  title: "Data Collection",
  stages: [
    stage("Data Sources", {
      left: [
        g([n("Databases (SQL, No-SQL)"), n("Internet"), n("APIs"), n("Mobile Apps"), n("IoT")]),
      ],
    }),
  ],
};

const DATA_CLEANING: MachineLearningRoadmapSection = {
  id: "data-cleaning",
  title: "Data Cleaning",
  stages: [
    stage("Data Formats", {
      left: [g([n("CSV"), n("Excel"), n("JSON"), n("Parquet"), n("Other Data Formats")])],
      right: [
        g(
          [
            n("Data Cleaning", undefined, undefined, "sub-data-cleaning"),
            n("Feature Engineering"),
            n("Feature Scaling & Normalization"),
            n("Dimensionality Reduction", undefined, undefined, "sub-prep-dim-reduction"),
            n("Feature Selection"),
          ],
          n("Preprocessing Techniques")
        ),
      ],
    }),
  ],
};

const MACHINE_LEARNING: MachineLearningRoadmapSection = {
  id: "machine-learning",
  title: "Machine Learning",
  stages: [
    stage("What is Machine Learning?"),
    stage("Types of Machine Learning", {
      left: [
        g([
          n("Supervised Learning", undefined, undefined, "type-supervised-learning"),
          n("Unsupervised Learning", undefined, undefined, "type-unsupervised-learning"),
          n("Semi-supervised Learning"),
          n("Reinforcement Learning", undefined, undefined, "type-reinforcement-learning"),
          n("Self-supervised Learning"),
        ]),
      ],
      right: [
        g(
          [
            n("Data Loading"),
            n("Train - Test Data"),
            n("Data Preparation"),
            n("Model Selection"),
            n("Tuning"),
            n("Prediction"),
          ],
          n("Scikit-learn", undefined, undefined, "scikit-learn-workflow")
        ),
      ],
    }),
  ],
};

const SUPERVISED_LEARNING: MachineLearningRoadmapSection = {
  id: "supervised-learning",
  title: "Supervised Learning",
  stages: [
    stage("What is Supervised Learning?"),
    stage("Classification", {
      left: [
        g([
          n("K-Nearest Neighbors (KNN)"),
          n("Logistic Regression"),
          n("Support Vector Machines"),
          n("Decision Trees, Random Forest"),
          n("Gradient Boosting Machines"),
        ]),
      ],
      right: [
        g(
          [
            n("Linear Regression"),
            n("Polynomial Regression"),
            n("Ridge"),
            n("Lasso"),
            n("ElasticNet Regularization"),
          ],
          n("Regression")
        ),
      ],
    }),
  ],
};

const UNSUPERVISED_LEARNING: MachineLearningRoadmapSection = {
  id: "unsupervised-learning",
  title: "Unsupervised Learning",
  stages: [
    stage("What is Unsupervised Learning?"),
    stage("Clustering", {
      left: [
        g(
          [
            n("Principal Component Analysis"),
            n("Autoencoders", undefined, undefined, "dim-reduction-autoencoders"),
          ],
          n("Dimensionality Reduction", undefined, undefined, "unsup-dim-reduction")
        ),
      ],
      right: [g([n("Exclusive"), n("Overlapping"), n("Hierarchical"), n("Probabilistic")])],
    }),
  ],
};

const REINFORCEMENT_LEARNING: MachineLearningRoadmapSection = {
  id: "reinforcement-learning",
  title: "Reinforcement Learning",
  stages: [
    stage("What is Reinforcement Learning?", {
      left: [
        g([n("Deep-Q Networks"), n("Policy Gradient"), n("Actor-Critic Methods"), n("Q-Learning")]),
      ],
    }),
  ],
};

const MODEL_EVALUATION: MachineLearningRoadmapSection = {
  id: "model-evaluation",
  title: "Model Evaluation",
  stages: [
    stage("What is Model Evaluation?"),
    stage("Why is it important?", {
      left: [g([n("K-Fold Cross Validation"), n("LOOCV")], n("Validation Techniques"))],
      right: [
        g(
          [
            n("Accuracy"),
            n("Precision"),
            n("Recall"),
            n("F1-Score"),
            n("ROC-AUC"),
            n("Log Loss"),
            n("Confusion Matrix"),
          ],
          n("Metrics to Evaluate")
        ),
      ],
    }),
  ],
};

const DEEP_LEARNING: MachineLearningRoadmapSection = {
  id: "deep-learning",
  title: "Deep Learning",
  stages: [
    stage("Neural Network (NN) Basics", {
      left: [
        g([
          n("Perceptron, Multi-layer Perceptrons"),
          n("Forward propagation"),
          n("Back Propagation"),
          n("Activation Functions"),
          n("Loss Functions"),
        ]),
      ],
      right: [
        g(
          [
            n("TensorFlow"),
            n("Keras"),
            n("PyTorch"),
            n("Scikit-learn", undefined, undefined, "dl-scikit-learn"),
          ],
          n("Deep Learning Libraries")
        ),
      ],
    }),
    stage("Deep Learning Architectures", {
      left: [
        g([n("RNN"), n("GRU"), n("LSTM")], n("Recurrent Neural Networks")),
        g(
          [n("Self-Attention"), n("Transformers"), n("Multi-head Attention")],
          n("Attention Mechanisms")
        ),
        g([
          n("Autoencoders", undefined, undefined, "generative-autoencoders"),
          n("Generative Adversarial Networks"),
        ]),
      ],
      right: [
        g(
          [n("Convolution"), n("Padding"), n("Pooling"), n("Strides")],
          n("Convolutional Neural Network")
        ),
        g(
          [
            n("Image & Video Recognition"),
            n("Image Classification"),
            n("Image Segmentation"),
            n("Recommendation Systems"),
          ],
          n("Applications of CNNs")
        ),
      ],
    }),
  ],
};

const ADVANCED_CONCEPTS_IN_ML: MachineLearningRoadmapSection = {
  id: "advanced-concepts-in-ml",
  title: "Advanced Concepts in ML",
  stages: [
    stage("Explainable AI"),
    stage("Natural Language Processing", {
      right: [
        g([
          n("Tokenization"),
          n("Lemmatization"),
          n("Stemming"),
          n("Embeddings"),
          n("Attention Models"),
        ]),
      ],
    }),
  ],
};

export const MACHINE_LEARNING_SECTIONS: MachineLearningRoadmapSection[] = [
  INTRODUCTION,
  MATHEMATICAL_FOUNDATIONS,
  PROGRAMMING_FUNDAMENTALS,
  DATA_COLLECTION,
  DATA_CLEANING,
  MACHINE_LEARNING,
  SUPERVISED_LEARNING,
  UNSUPERVISED_LEARNING,
  REINFORCEMENT_LEARNING,
  MODEL_EVALUATION,
  DEEP_LEARNING,
  ADVANCED_CONCEPTS_IN_ML,
];
