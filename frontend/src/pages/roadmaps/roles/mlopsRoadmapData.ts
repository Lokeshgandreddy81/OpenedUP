export type MlopsRoadmapStatus = "personal" | "alternative" | "optional";

export interface MlopsRoadmapNode {
  id: string;
  title: string;
  status?: MlopsRoadmapStatus;
  roadmapId?: string;
}

export interface MlopsRoadmapGroup {
  id: string;
  parent?: MlopsRoadmapNode;
  items: MlopsRoadmapNode[];
}

export interface MlopsRoadmapStage {
  id: string;
  node: MlopsRoadmapNode;
  left?: MlopsRoadmapGroup[];
  right?: MlopsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface MlopsRoadmapSection {
  id: string;
  title?: string;
  stages: MlopsRoadmapStage[];
}

export interface MlopsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const MLOPS_MARKERS: Array<{
  status: MlopsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const MLOPS_RELATED_ROADMAPS: MlopsRoadmapLink[] = [
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Machine Learning Roadmap", roadmapId: "machine-learning" },
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Data Engineer Roadmap", roadmapId: "data-engineer" },
  { label: "System Design Roadmap", roadmapId: "skill-system-design" },
];

export const MLOPS_CONTINUE_LEARNING: MlopsRoadmapLink[] = [
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "Inference Engineering", roadmapId: "inference-engineering" },
  { label: "DevSecOps", roadmapId: "devsecops" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "System Design", roadmapId: "skill-system-design" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: MlopsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): MlopsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: MlopsRoadmapNode[],
  parent?: MlopsRoadmapNode,
  customId?: string
): MlopsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<MlopsRoadmapStage, "id" | "node"> & {
    status?: MlopsRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): MlopsRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// --- SECTION 1: FOUNDATIONS & SOFTWARE ENGINEERING ---
const FOUNDATIONS: MlopsRoadmapSection = {
  id: "mlops-foundations",
  title: "MLOps Foundations & Software Engineering",
  stages: [
    stage("Programming Languages", {
      left: [
        g(
          [
            n("Python", "personal", "skill-python"),
            n("Bash / Shell Scripting", "personal", "skill-shell"),
            n("SQL", "personal", "skill-sql"),
            n("Go / C++", "optional"),
          ],
          n("Languages")
        ),
      ],
      right: [
        g(
          [
            n("Object-Oriented Programming (OOP)"),
            n("Type Annotations & Pydantic"),
            n("Modular Code Architecture"),
            n("Package Managers (Poetry, UV, Conda)"),
          ],
          n("Python Standards")
        ),
      ],
      noteAfter:
        "Python is the primary language in MLOps, paired with Bash for automation and SQL for querying feature tables and warehouse data.",
    }),
    stage("Software Engineering Best Practices", {
      roadmapId: "skill-git-github",
      left: [
        g(
          [
            n("Git & Branching Strategies", "personal", "skill-git-github"),
            n("Pull Requests & Code Reviews", "personal", "skill-code-review"),
            n("Semantic Versioning (SemVer)"),
            n("Pre-commit Hooks & Linters (Ruff, Black)"),
          ],
          n("Source Control & Quality")
        ),
      ],
      right: [
        g(
          [
            n("PyTest Testing Framework", "personal"),
            n("Unit & Integration Testing"),
            n("Mocking & Test Fixtures"),
            n("Deterministic Seeds & Reprodicibility"),
          ],
          n("Testing & Quality Assurance")
        ),
      ],
    }),
    stage("Linux & Compute Systems", {
      roadmapId: "skill-linux",
      left: [
        g(
          [
            n("Linux Navigation & Commands", "personal", "skill-linux"),
            n("Process Management (systemd, top, htop)"),
            n("File Systems & Permissions"),
            n("Cron & Scheduled Tasks"),
          ],
          n("Linux OS Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("SSH Keys & Remote Servers"),
            n("NVIDIA Drivers & CUDA"),
            n("nvidia-smi & GPU Utilization"),
            n("NCCL for Multi-GPU"),
          ],
          n("GPU Hardware & Acceleration")
        ),
      ],
      projectIdea:
        "Project Idea: Build a modular Python CLI that trains a baseline model, runs PyTest fixtures with 90%+ code coverage, and enforces code formatting with pre-commit hooks.",
    }),
  ],
};

// --- SECTION 2: CONTAINERIZATION & CLOUD INFRASTRUCTURE ---
const CONTAINERS_AND_INFRASTRUCTURE: MlopsRoadmapSection = {
  id: "containers-infrastructure",
  title: "Containerization & Cloud Infrastructure",
  stages: [
    stage("Containers & Containerization", {
      roadmapId: "skill-docker",
      left: [
        g(
          [
            n("Docker Fundamentals", "personal", "skill-docker"),
            n("Multi-stage Dockerfiles"),
            n("NVIDIA Container Toolkit (nvidia-docker)", "personal"),
            n("Image Optimization & Minimal Base Images"),
          ],
          n("Docker Best Practices")
        ),
      ],
      right: [
        g(
          [
            n("Docker Compose for Local Stacks", "personal"),
            n("Container Registry (Docker Hub, ECR, GCR)"),
            n("Container Vulnerability Scanning"),
          ],
          n("Ecosystem & Tooling")
        ),
      ],
    }),
    stage("Container Orchestration", {
      roadmapId: "skill-kubernetes",
      left: [
        g(
          [
            n("Kubernetes Core (Pods, Deployments, Services)", "personal", "skill-kubernetes"),
            n("ConfigMaps & Secrets"),
            n("Persistent Volumes & Storage Classes"),
            n("Kubernetes Ingress & Gateway API"),
          ],
          n("K8s Foundations")
        ),
      ],
      right: [
        g(
          [
            n("Helm Charts & Package Management", "personal"),
            n("K8s GPU Resource Allocation"),
            n("Horizontal Pod Autoscaler (HPA)"),
            n("KEDA (Kubernetes Event-driven Autoscaling)"),
          ],
          n("K8s for Machine Learning")
        ),
      ],
    }),
    stage("Cloud Computing & Infrastructure as Code", {
      roadmapId: "skill-aws",
      left: [
        g(
          [
            n("AWS (S3, EC2, EKS, SageMaker)", "personal", "skill-aws"),
            n("Google Cloud Platform (GCS, GKE, Vertex AI)", "alternative"),
            n("Microsoft Azure (Blob, AKS, Azure ML)", "alternative"),
            n("IAM & Cloud Security Policies"),
          ],
          n("Cloud Platforms")
        ),
      ],
      right: [
        g(
          [
            n("Terraform for Cloud Provisioning", "personal", "skill-terraform"),
            n("Ansible Configuration Management"),
            n("Pulumi (Python/TypeScript IaC)", "alternative"),
          ],
          n("Infrastructure as Code")
        ),
      ],
      projectIdea:
        "Project Idea: Use Terraform to provision an AWS EKS cluster configured with NVIDIA GPU daemonsets and automated S3 bucket storage for ML artifacts.",
    }),
  ],
};

// --- SECTION 3: DATA MANAGEMENT, VERSIONING & FEATURE STORES ---
const DATA_MANAGEMENT: MlopsRoadmapSection = {
  id: "data-management",
  title: "Data Versioning, Validation & Feature Stores",
  stages: [
    stage("Data Versioning & Management", {
      left: [
        g(
          [
            n("DVC (Data Version Control)", "personal"),
            n("Remote Storage Backends (S3, GCS, MinIO)"),
            n("Data Pipelines (.dvc files & stages)"),
            n("LakeFS / Pachyderm", "alternative"),
          ],
          n("Data Versioning Tools")
        ),
      ],
      right: [
        g(
          [
            n("Delta Lake / Apache Iceberg", "alternative"),
            n("Data Lineage & Provenance"),
            n("Dataset Hash Tracking"),
          ],
          n("Data Lakehouses & Lineage")
        ),
      ],
      noteAfter:
        "Version data and code together. DVC connects Git commits to immutable data hashes stored in cloud object storage, ensuring 100% reproducible training runs.",
    }),
    stage("Feature Stores", {
      left: [
        g(
          [
            n("Feast (Open Source)", "personal"),
            n("Hopsworks", "alternative"),
            n("Tecton (Enterprise)", "optional"),
            n("AWS SageMaker Feature Store", "optional"),
          ],
          n("Feature Store Solutions")
        ),
      ],
      right: [
        g(
          [
            n("Online Store (Low-Latency Redis, DynamoDB)", "personal", "skill-redis"),
            n("Offline Store (Parquet, Snowflake, BigQuery)"),
            n("Point-in-Time Correctness (Time-Travel Joins)"),
            n("Eliminating Train-Serve Skew"),
          ],
          n("Architecture & Concepts")
        ),
      ],
    }),
    stage("Data Quality & Validation", {
      left: [
        g(
          [
            n("Great Expectations", "personal"),
            n("Pandera (Schema Validation)", "personal"),
            n("Soda Core / Deequ", "alternative"),
          ],
          n("Data Validation Engines")
        ),
      ],
      right: [
        g(
          [
            n("Missing Value & Null Checks"),
            n("Distribution & Schema Enforcements"),
            n("Automated Data Profiling"),
            n("CI Data Integrity Gatekeepers"),
          ],
          n("Validation Checks")
        ),
      ],
      projectIdea:
        "Project Idea: Ingest a raw tabular dataset, validate schema and bounds using Pandera/Great Expectations, and register the features into a local Feast feature store with Redis and Parquet.",
    }),
  ],
};

// --- SECTION 4: MODEL DEVELOPMENT & EXPERIMENT TRACKING ---
const EXPERIMENT_TRACKING_AND_PIPELINES: MlopsRoadmapSection = {
  id: "experiment-tracking-pipelines",
  title: "Experiment Tracking & Pipeline Orchestration",
  stages: [
    stage("Experiment Tracking & Model Registry", {
      left: [
        g(
          [
            n("MLflow (Tracking & Artifacts)", "personal"),
            n("Weights & Biases (W&B)", "personal"),
            n("Comet ML", "alternative"),
            n("Neptune.ai", "alternative"),
          ],
          n("Experiment Tracking")
        ),
      ],
      right: [
        g(
          [
            n("Hyperparameter Logging"),
            n("Metric Curves (Loss, AUC, F1)"),
            n("Model Artifacts & Checkpoints"),
            n("MLflow Model Registry (Staging/Prod)", "personal"),
          ],
          n("Registry & Versioning")
        ),
      ],
      noteAfter:
        "Every experiment run must log code commit, hyperparameters, dataset version, and output artifacts to make ML research audit-ready and deployable.",
    }),
    stage("Pipeline Orchestration & Workflow Engines", {
      left: [
        g(
          [
            n("Kubeflow Pipelines (KFP)", "personal"),
            n("Apache Airflow", "personal"),
            n("Prefect", "alternative"),
            n("Dagster", "alternative"),
            n("Argo Workflows", "alternative"),
          ],
          n("Workflow Orchestrators")
        ),
      ],
      right: [
        g(
          [
            n("Directed Acyclic Graphs (DAGs)"),
            n("Pipeline Caching & Step Reusability"),
            n("Automated Retraining Triggers"),
            n("Resource Allocation per Task"),
          ],
          n("Pipeline Concepts")
        ),
      ],
    }),
    stage("Distributed Training & Optimization", {
      left: [
        g(
          [
            n("Ray Train & Ray Core", "personal"),
            n("PyTorch DistributedDataParallel (DDP)", "personal"),
            n("DeepSpeed / Megatron-LM", "alternative"),
            n("Horovod", "optional"),
          ],
          n("Distributed Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Data Parallelism vs Model Parallelism"),
            n("Gradient Accumulation"),
            n("Mixed Precision Training (FP16 / BF16)"),
          ],
          n("Scalability Techniques")
        ),
      ],
      projectIdea:
        "Project Idea: Build an end-to-end Airflow or Kubeflow pipeline that extracts data, trains an XGBoost/PyTorch model, logs all runs to MLflow, and auto-promotes qualifying models to the Model Registry.",
    }),
  ],
};

// --- SECTION 5: MODEL PACKAGING, OPTIMIZATION & SERVING ---
const MODEL_PACKAGING_AND_SERVING: MlopsRoadmapSection = {
  id: "packaging-serving",
  title: "Model Packaging, Optimization & Serving",
  stages: [
    stage("Model Serialization & Interchange", {
      left: [
        g(
          [
            n("ONNX (Open Neural Network Exchange)", "personal"),
            n("TorchScript / PyTorch JIT"),
            n("HuggingFace Safetensors", "personal"),
            n("TensorFlow SavedModel", "optional"),
          ],
          n("Interchange Formats")
        ),
      ],
      right: [
        g(
          [
            n("Framework Interoperability"),
            n("Zero-Copy Deserialization"),
            n("Security: Avoiding Pickle Vulnerabilities"),
          ],
          n("Format Considerations")
        ),
      ],
    }),
    stage("Model Optimization & Acceleration", {
      left: [
        g(
          [
            n("TensorRT (NVIDIA GPUs)", "personal"),
            n("OpenVINO (Intel Hardware)", "alternative"),
            n("ONNX Runtime Optimization", "personal"),
          ],
          n("Inference Engines")
        ),
      ],
      right: [
        g(
          [
            n("Post-Training Quantization (INT8 / FP8)"),
            n("Structured & Unstructured Pruning"),
            n("Knowledge Distillation"),
            n("Graph Operator Fusion"),
          ],
          n("Optimization Techniques")
        ),
      ],
    }),
    stage("Microservices & Inference APIs", {
      roadmapId: "skill-api-design",
      left: [
        g(
          [
            n("FastAPI (Asynchronous REST API)", "personal"),
            n("BentoML (ML Service Framework)", "personal"),
            n("Ray Serve (Scalable Inference)", "alternative"),
            n("gRPC for High-Throughput APIs", "personal"),
          ],
          n("API Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Request Validation via Pydantic"),
            n("Dynamic Request Batching"),
            n("Async Workers & Concurrency"),
            n("Health Check & Liveness Probes"),
          ],
          n("Service Capabilities")
        ),
      ],
    }),
    stage("High-Performance Serving & LLM Engines", {
      roadmapId: "inference-engineering",
      left: [
        g(
          [
            n("Triton Inference Server", "personal"),
            n("TorchServe", "alternative"),
            n("TF Serving", "optional"),
          ],
          n("Production Inference Servers")
        ),
      ],
      right: [
        g(
          [
            n("vLLM (PagedAttention & KV-cache)", "personal"),
            n("TGI (Text Generation Inference)", "alternative"),
            n("Ollama / llama.cpp (Local Serving)", "optional"),
            n("Multi-Model Serving & Concurrency"),
          ],
          n("LLM Serving Engines")
        ),
      ],
    }),
    stage("Deployment Patterns & Cloud Endpoints", {
      left: [
        g(
          [
            n("Canary Deployments", "personal"),
            n("Blue/Green Deployments", "personal"),
            n("Shadow / Dark Launching"),
            n("A/B Testing Model Variants"),
          ],
          n("Deployment Strategies")
        ),
      ],
      right: [
        g(
          [
            n("AWS SageMaker Endpoints"),
            n("Google Cloud Vertex AI Prediction"),
            n("Azure Machine Learning Endpoints"),
            n("KServe on Kubernetes", "personal"),
          ],
          n("Managed Endpoints")
        ),
      ],
      projectIdea:
        "Project Idea: Export a PyTorch model to ONNX, quantize to INT8, deploy it inside Triton Inference Server with dynamic batching, and implement a Canary rollout using Kubernetes Ingress.",
    }),
  ],
};

// --- SECTION 6: CI/CD FOR MACHINE LEARNING (CML / CT) ---
const CICD_FOR_MACHINE_LEARNING: MlopsRoadmapSection = {
  id: "cicd-for-ml",
  title: "CI/CD for Machine Learning & Continuous Training",
  stages: [
    stage("Continuous Integration (CI) for ML", {
      roadmapId: "devops",
      left: [
        g(
          [
            n("GitHub Actions", "personal"),
            n("GitLab CI/CD", "alternative"),
            n("Self-Hosted GPU Runners"),
            n("Automated Code & Data Checks"),
          ],
          n("CI Platforms")
        ),
      ],
      right: [
        g(
          [
            n("Data Quality Unit Tests"),
            n("Model Training Dry-Run on Dummy Data"),
            n("Docker Image Build & Push to Registry"),
            n("Dependency Security Scanning (Trivy)"),
          ],
          n("CI Automated Tasks")
        ),
      ],
    }),
    stage("Continuous Machine Learning (CML)", {
      left: [
        g(
          [
            n("CML (Continuous Machine Learning by Iterative)", "personal"),
            n("Automated Pull Request Reports", "personal"),
            n("Cloud GPU Provisioning in CI (cml runner)"),
          ],
          n("CML Framework")
        ),
      ],
      right: [
        g(
          [
            n("Automated Metric Comparison against Baseline"),
            n("PR Comments with Loss & Confusion Matrix plots"),
            n("Model Benchmark Gatekeeping"),
          ],
          n("Evaluation in Code Reviews")
        ),
      ],
      noteAfter:
        "CML connects Git pull requests with cloud ML compute: automatically train, generate performance plots, and post comparison tables directly into PR comments.",
    }),
    stage("Continuous Training (CT) Pipelines", {
      left: [
        g(
          [
            n("Trigger: Data Drift or Performance Drop", "personal"),
            n("Trigger: Schedule-based Retraining"),
            n("Trigger: Event-driven (New data in S3/Kafka)"),
          ],
          n("Retraining Triggers")
        ),
      ],
      right: [
        g(
          [
            n("Automated Backtesting on Holdout Sets"),
            n("Champion / Challenger Evaluation"),
            n("Automated Model Registration & Tagging"),
          ],
          n("Continuous Delivery to Production")
        ),
      ],
      projectIdea:
        "Project Idea: Configure a GitHub Action pipeline with CML that trains on a PR branch, produces an ROC-AUC comparison markdown table, and blocks merging if latency exceeds SLA.",
    }),
  ],
};

// --- SECTION 7: MONITORING & OBSERVABILITY ---
const MONITORING_AND_OBSERVABILITY: MlopsRoadmapSection = {
  id: "monitoring-observability",
  title: "Model Monitoring, Drift & Observability",
  stages: [
    stage("Data & Concept Drift Detection", {
      left: [
        g(
          [
            n("Data Drift (Covariate Shift)", "personal"),
            n("Concept Drift (Target Distribution Shift)", "personal"),
            n("Feature Drift & Prior Probability Shift"),
            n("Upstream Data Pipeline Breaches"),
          ],
          n("Drift Categories")
        ),
      ],
      right: [
        g(
          [
            n("Kolmogorov-Smirnov (KS) Test"),
            n("Population Stability Index (PSI)", "personal"),
            n("Wasserstein Distance (Earth Mover's)"),
            n("Jensen-Shannon Divergence"),
          ],
          n("Statistical Tests")
        ),
      ],
      noteAfter:
        "Production models degrade over time as the real world changes. Continuous statistical drift testing is essential to catch silent failures.",
    }),
    stage("Model Observability Platforms", {
      left: [
        g(
          [
            n("Evidently AI", "personal"),
            n("WhyLabs (whylogs)", "alternative"),
            n("Arize AI", "alternative"),
            n("Fiddler AI", "optional"),
          ],
          n("Specialized ML Observability")
        ),
      ],
      right: [
        g(
          [
            n("Automated Drift Reports & Dashboards"),
            n("Data Quality & Integrity Profiling"),
            n("Ground Truth Feedback Loops"),
            n("Real-Time Anomaly Alerts"),
          ],
          n("Monitoring Capabilities")
        ),
      ],
    }),
    stage("System Telemetry & Infrastructure Monitoring", {
      left: [
        g(
          [
            n("Prometheus Metrics Collection", "personal"),
            n("Grafana Dashboards", "personal"),
            n("OpenTelemetry (Tracing & Spans)", "personal"),
            n("ELK Stack / Vector / FluentBit for Logs"),
          ],
          n("System Observability")
        ),
      ],
      right: [
        g(
          [
            n("Inference Latency (p50, p95, p99)"),
            n("Throughput (Queries Per Second / QPS)"),
            n("GPU Utilization & VRAM Consumption"),
            n("Error Rates & 4xx / 5xx HTTP Responses"),
          ],
          n("Infrastructure KPIs")
        ),
      ],
      projectIdea:
        "Project Idea: Deploy an Evidently AI monitoring service alongside Prometheus and Grafana to track production inference payloads, calculating weekly PSI and alerting on Slack if drift occurs.",
    }),
  ],
};

// --- SECTION 8: MODEL GOVERNANCE, SECURITY & RESPONSIBLE AI ---
const GOVERNANCE_SECURITY_AND_RESPONSIBLE_AI: MlopsRoadmapSection = {
  id: "governance-security",
  title: "Model Governance, Security & Responsible AI",
  stages: [
    stage("Model Lineage, Governance & Compliance", {
      left: [
        g(
          [
            n("Model Cards & FactSheets (System Documentation)", "personal"),
            n("End-to-End Lineage Tracking (Data to Deployment)"),
            n("Audit Logging & Reproducibility Proofs"),
            n("EU AI Act & Regulatory Compliance"),
          ],
          n("Governance Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Model Catalog & Metadata Search"),
            n("Access Control & Role-Based Permissions (RBAC)"),
            n("Retirement & Model Sunsetting Workflows"),
          ],
          n("Lifecycle Governance")
        ),
      ],
    }),
    stage("Machine Learning Security & Privacy", {
      roadmapId: "devsecops",
      left: [
        g(
          [
            n("Adversarial Robustness & Evasion Attacks"),
            n("Model Inversion & Membership Inference Defense"),
            n("Data Poisoning Prevention"),
            n("Prompt Injection & Jailbreak Defense (LLMs)", "personal"),
          ],
          n("ML Threat Defense")
        ),
      ],
      right: [
        g(
          [
            n("Differential Privacy (Opacus)"),
            n("Federated Learning"),
            n("Secrets Management (HashiCorp Vault, AWS Secrets)", "personal"),
            n("Vulnerability Scanning for Model Weights (PickleScan)"),
          ],
          n("Privacy & Security Tools")
        ),
      ],
    }),
    stage("Responsible AI, Fairness & Explainability", {
      left: [
        g(
          [
            n("SHAP (SHapley Additive exPlanations)", "personal"),
            n("LIME (Local Interpretable Model-agnostic Explanations)"),
            n("Integrated Gradients"),
          ],
          n("Explainable AI (XAI)")
        ),
      ],
      right: [
        g(
          [
            n("Fairlearn & AIF360", "personal"),
            n("Demographic Parity & Equalized Odds"),
            n("Disparate Impact Ratio Analysis"),
            n("Toxicity & Bias Mitigation in LLMs"),
          ],
          n("Bias & Fairness Audits")
        ),
      ],
      projectIdea:
        "Project Idea: Create an automated compliance pipeline that calculates SHAP values, evaluates Demographic Parity using Fairlearn, and outputs a signed Model Card PDF upon every release.",
    }),
  ],
};

export const MLOPS_SECTIONS: MlopsRoadmapSection[] = [
  FOUNDATIONS,
  CONTAINERS_AND_INFRASTRUCTURE,
  DATA_MANAGEMENT,
  EXPERIMENT_TRACKING_AND_PIPELINES,
  MODEL_PACKAGING_AND_SERVING,
  CICD_FOR_MACHINE_LEARNING,
  MONITORING_AND_OBSERVABILITY,
  GOVERNANCE_SECURITY_AND_RESPONSIBLE_AI,
];
