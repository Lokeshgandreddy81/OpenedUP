export type InferenceEngineeringRoadmapStatus = "personal" | "alternative" | "optional";

export interface InferenceEngineeringRoadmapNode {
  id: string;
  title: string;
  status?: InferenceEngineeringRoadmapStatus;
  roadmapId?: string;
}

export interface InferenceEngineeringRoadmapGroup {
  id: string;
  parent?: InferenceEngineeringRoadmapNode;
  items: InferenceEngineeringRoadmapNode[];
}

export interface InferenceEngineeringRoadmapStage {
  id: string;
  node: InferenceEngineeringRoadmapNode;
  left?: InferenceEngineeringRoadmapGroup[];
  right?: InferenceEngineeringRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface InferenceEngineeringRoadmapSection {
  id: string;
  title?: string;
  stages: InferenceEngineeringRoadmapStage[];
}

export interface InferenceEngineeringRoadmapLink {
  label: string;
  roadmapId: string;
}

export const INFERENCE_ENGINEERING_MARKERS: Array<{
  status: InferenceEngineeringRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const INFERENCE_ENGINEERING_RELATED_ROADMAPS: InferenceEngineeringRoadmapLink[] = [
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "ML Roadmap", roadmapId: "machine-learning" },
  { label: "C++ Roadmap", roadmapId: "skill-cpp" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
];

export const INFERENCE_ENGINEERING_CONTINUE_LEARNING: InferenceEngineeringRoadmapLink[] = [
  { label: "AI Engineer", roadmapId: "ai-engineer" },
  { label: "Machine Learning", roadmapId: "machine-learning" },
  { label: "C++", roadmapId: "skill-cpp" },
  { label: "Docker", roadmapId: "skill-docker" },
  { label: "Kubernetes", roadmapId: "skill-kubernetes" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: InferenceEngineeringRoadmapStatus,
  roadmapId?: string
): InferenceEngineeringRoadmapNode => ({
  id: slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: InferenceEngineeringRoadmapNode[],
  parent?: InferenceEngineeringRoadmapNode
): InferenceEngineeringRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<InferenceEngineeringRoadmapStage, "id" | "node"> & {
    status?: InferenceEngineeringRoadmapStatus;
  } = {}
): InferenceEngineeringRoadmapStage => {
  const { status, ...rest } = options;

  return {
    id: slug(title),
    node: n(title, status),
    ...rest,
  };
};

const INTRODUCTION: InferenceEngineeringRoadmapSection = {
  id: "introduction",
  stages: [
    stage("Introduction", {
      left: [g([n("Time to First Token"), n("Tokens Per Second")], n("Basic Terminology"))],
      right: [
        g([
          n("Open vs Closed Models"),
          n("Inference vs. Training"),
          n("Shared vs. Dedicated Inf."),
          n("The Inference Stack"),
        ]),
      ],
    }),
  ],
};

const MODELS_AND_PERFORMANCE: InferenceEngineeringRoadmapSection = {
  id: "models-and-performance",
  title: "Models & Performance",
  stages: [
    stage("Neural Networks", {
      left: [
        g(
          [
            n("Inter-Token Latency"),
            n("Latency vs. Throughput"),
            n("Latency Percentiles"),
            n("End-to-End Metrics"),
          ],
          n("Basic Terminology")
        ),
      ],
      right: [g([n("Encoder-Decoder Arch.")])],
    }),
    stage("Large Language Models", {
      left: [
        g([n("Real-Time Factor")], n("Basic Terminology")),
        g([n("Prefill & Decode Phases"), n("Online vs. Offline Inf.")], n("Latency Metrics")),
      ],
      right: [
        g([
          n("Transformer Blocks"),
          n("Attention Mechanism"),
          n("KV Cache"),
          n("Mixture of Experts (MoE)"),
        ]),
      ],
    }),
    stage("Image & Video Models", {
      left: [
        g([n("Asynchronous Inference")], n("Latency Metrics")),
        g(
          [n("AI-Native Applications"), n("Consumer vs. B2B"), n("Reasoning Models")],
          n("Inference Phases")
        ),
      ],
      right: [
        g([
          n("Diffusion Models"),
          n("Image Generation Arch."),
          n("Few-Step Image Generation"),
          n("Video Generation Models"),
        ]),
      ],
    }),
    stage("Bottleneck Analysis", {
      left: [
        g(
          [n("Model Selection"), n("Model Evaluation"), n("Fine-Tuning")],
          n("Application Context")
        ),
      ],
      right: [
        g([
          n("Ops:Byte Ratio"),
          n("Arithmetic Intensity"),
          n("Roofline Model"),
          n("LLM Bottlenecks"),
        ]),
      ],
    }),
    stage("Attention Optimization", {
      left: [g([n("Distillation")], n("Application Context"))],
      right: [
        g([
          n("Image & Video Bottlenecks"),
          n("FlashAttention"),
          n("PagedAttention"),
          n("Attention Variants"),
        ]),
      ],
    }),
  ],
};

const HARDWARE: InferenceEngineeringRoadmapSection = {
  id: "hardware",
  title: "Hardware",
  stages: [
    stage("GPU Architecture", {
      left: [
        g(
          [n("Compute"), n("Memory"), n("Instances & Interconnects"), n("Sizing & Procurement")],
          n("Model Strategy")
        ),
      ],
      right: [g([n("Hopper"), n("Blackwell"), n("Grace & Vera")])],
    }),
    stage("GPU Models", {
      left: [g([n("Desktop Inference")], n("Model Strategy"))],
      right: [g([n("NVIDIA")])],
    }),
    stage("Local & Edge Inference", {
      left: [g([n("Mobile Inference")], n("Model Strategy"))],
      right: [g([n("Other Accelerators")])],
    }),
  ],
};

const SOFTWARE: InferenceEngineeringRoadmapSection = {
  id: "software",
  title: "Software",
  stages: [
    stage("CUDA", {
      left: [g([n("Kernel Selection & Fusion")], n("Model Strategy"))],
      right: [g([n("Writing Custom Kernels")])],
    }),
    stage("Frameworks & Libraries", {
      left: [g([n("safetensors"), n("TensorRT")], n("Model Strategy"))],
      right: [g([n("PyTorch")])],
    }),
    stage("Model Formats & Runtimes", {
      left: [g([n("ONNX Runtime")], n("Model Strategy"))],
      right: [g([n("Transformers & Diffusers"), n("vLLM"), n("SGLang")])],
    }),
    stage("Inference Engines", {
      left: [g([n("AIPerf"), n("Locust"), n("SGLang Genai-bench")], n("Model Strategy"))],
      right: [g([n("TensorRT-LLM"), n("NVIDIA Dynamo")])],
    }),
    stage("Benchmarking & Profiling", {
      left: [g([n("Performance Benchmarking")], n("Model Strategy"))],
      right: [g([n("Profiling Performance")])],
    }),
  ],
};

const INFERENCE_TECHNIQUES: InferenceEngineeringRoadmapSection = {
  id: "inference-techniques",
  title: "Inference Techniques",
  stages: [
    stage("Quantization", {
      left: [
        g(
          [n("Quantization-Aware Training"), n("Post-Training Quantization"), n("ModelOpt")],
          n("Quantization Approaches")
        ),
      ],
      right: [g([n("Measuring Quality Impact")])],
    }),
    stage("Speculative Decoding", {
      left: [g([n("Structured Outputs"), n("Constrained Decoding")], n("Quantization Approaches"))],
      right: [
        g([n("Draft-Target Decoding"), n("EAGLE"), n("N-gram")], n("Speculation Algorithms")),
      ],
    }),
    stage("Caching", {
      left: [
        g(
          [n("Caching Approaches"), n("KV Cache Storage"), n("Cache-Aware Routing")],
          n("Quantization Approaches")
        ),
      ],
      right: [g([n("Pipeline Parallelism")], n("Speculation Algorithms"))],
    }),
    stage("Model Parallelism", {
      left: [g([n("Long Context Handling")], n("Quantization Approaches"))],
      right: [g([n("Tensor Parallelism"), n("Expert Parallelism")], n("Speculation Algorithms"))],
    }),
    stage("Disaggregation", {
      left: [g([n("NVIDIA Dynamo")], n("Quantization Approaches"))],
      right: [g([n("Multi-Node Inference")], n("Speculation Algorithms"))],
    }),
  ],
};

const INFERENCE_BEYOND_LLMS: InferenceEngineeringRoadmapSection = {
  id: "inference-beyond-llms",
  title: "Inference Beyond LLMs",
  stages: [
    stage("Vision Language Models", {
      left: [g([n("BERT-style models")], n("Embedding Architectures"))],
      right: [
        g([n("Video Processing for VLMs"), n("Omni-Modal Models")], n("Speculation Algorithms")),
      ],
    }),
    stage("Embedding Models", {
      left: [g([n("LLM-based models")], n("Embedding Architectures"))],
      right: [g([n("Embedding Model Inference")], n("Speculation Algorithms"))],
    }),
    stage("Speech", {
      left: [g([n("Image Generation Inference")], n("Embedding Architectures"))],
      right: [
        g(
          [n("Voice Activity Detection"), n("Auto. Speech Recognition")],
          n("Speculation Algorithms")
        ),
      ],
    }),
    stage("Image & Video Generation", {
      left: [g([n("Video Generation Inference")], n("Embedding Architectures"))],
      right: [
        g(
          [n("Text-to-Speech (TTS)"), n("Streaming TTS"), n("Speech-to-Speech Models")],
          n("Speculation Algorithms")
        ),
      ],
    }),
  ],
};

const PRODUCTION: InferenceEngineeringRoadmapSection = {
  id: "production",
  title: "Production",
  stages: [
    stage("Containerization", {
      left: [g([n("Dependency Management"), n("NIMs")], n("Embedding Architectures"))],
    }),
    stage("Autoscaling", {
      right: [
        g(
          [n("Continuous Batching"), n("Cold Starts"), n("Routing & Load Balancing")],
          n("Speculation Algorithms")
        ),
      ],
    }),
    stage("Multi-Cloud", {
      left: [
        g(
          [n("GPU Procurement"), n("Capacity Management"), n("Geo-Aware Load Balancing")],
          n("Embedding Architectures")
        ),
      ],
      right: [
        g(
          [n("LoRA-Aware Routing"), n("Request Queueing"), n("Scale to Zero")],
          n("Speculation Algorithms")
        ),
      ],
    }),
    stage("Testing & Deployment", {
      left: [
        g(
          [
            n("Security and Compliance"),
            n("Zero-Downtime Deplo."),
            n("Cost Estimation"),
            n("Observability"),
          ],
          n("Embedding Architectures")
        ),
      ],
      right: [g([n("Indep. Component Scaling")], n("Speculation Algorithms"))],
    }),
  ],
};

export const INFERENCE_ENGINEERING_SECTIONS: InferenceEngineeringRoadmapSection[] = [
  INTRODUCTION,
  MODELS_AND_PERFORMANCE,
  HARDWARE,
  SOFTWARE,
  INFERENCE_TECHNIQUES,
  INFERENCE_BEYOND_LLMS,
  PRODUCTION,
];
