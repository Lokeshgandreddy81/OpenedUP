export type KubernetesRoadmapStatus = "personal" | "alternative" | "optional";

export interface KubernetesRoadmapNode {
  id: string;
  title: string;
  status?: KubernetesRoadmapStatus;
  roadmapId?: string;
}

export interface KubernetesRoadmapGroup {
  id: string;
  parent?: KubernetesRoadmapNode;
  items: KubernetesRoadmapNode[];
}

export interface KubernetesRoadmapStage {
  id: string;
  node: KubernetesRoadmapNode;
  left?: KubernetesRoadmapGroup[];
  right?: KubernetesRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface KubernetesRoadmapSection {
  id: string;
  title?: string;
  stages: KubernetesRoadmapStage[];
}

export interface KubernetesRoadmapLink {
  label: string;
  roadmapId: string;
}

export const KUBERNETES_MARKERS: Array<{
  status: KubernetesRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const KUBERNETES_RELATED_ROADMAPS: KubernetesRoadmapLink[] = [
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Cloudflare Roadmap", roadmapId: "skill-cloudflare" },
  { label: "Backend Roadmap", roadmapId: "backend" },
];

export const KUBERNETES_CONTINUE_LEARNING: KubernetesRoadmapLink[] = [
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Cloudflare Roadmap", roadmapId: "skill-cloudflare" },
  { label: "Backend Roadmap", roadmapId: "backend" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: KubernetesRoadmapStatus,
  roadmapId?: string,
  customId?: string
): KubernetesRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: KubernetesRoadmapNode[],
  parent?: KubernetesRoadmapNode,
  customId?: string
): KubernetesRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<KubernetesRoadmapStage, "id" | "node"> & {
    status?: KubernetesRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): KubernetesRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: KubernetesRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Introduction",
  stages: [
    stage("Introduction", {
      status: "personal",
      left: [
        g([
          n("Deploying your First Application"),
          n("Choosing a Managed Provider"),
          n("Installing a Local Cluster"),
          n("Related Roadmaps"),
        ]),
      ],
      right: [
        g([
          n("Overview of Kubernetes"),
          n("Why use Kubernetes?"),
          n("Key Concepts and Terminologies"),
          n("Kubernetes Alternatives"),
          n("Pods"),
          n("ReplicaSets"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("Containers", {
      status: "personal",
      left: [g([n("Injecting Pod Config with ConfigMaps")])],
      right: [g([n("Deployments"), n("StatefulSets")])],
    }),
    stage("Setting up Kubernetes", {
      status: "personal",
      left: [g([n("Using Secrets for Sensitive Data"), n("Running Applications")])],
      right: [g([n("Jobs")])],
    }),
    stage("Running Applications", {
      status: "personal",
      left: [g([n("Services and Networking")])],
      right: [g([n("Gateway API")])],
    }),
  ],
};

const SECTION_2: KubernetesRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Configuration Management",
  stages: [
    stage("Configuration Management", {
      status: "personal",
      left: [
        g([
          n("External Access to Services"),
          n("Load Balancing"),
          n("Networking & Pod-to-Pod Communication"),
          n("Resource Management"),
        ]),
      ],
      right: [
        g([
          n("Role Based Access Control (RBAC)"),
          n("Network Security"),
          n("Container and Pod Security"),
        ]),
      ],
    }),
    stage("Services and Networking", {
      status: "personal",
      left: [g([n("Configuration Management")])],
    }),
    stage("Resource Management", {
      status: "personal",
      left: [
        g([
          n("Setting Resource Requests and Limits"),
          n("Assigning Quotas to Namespaces"),
          n("Monitoring & Optimizing Resource Usage"),
        ]),
      ],
      right: [
        g([
          n("Logs"),
          n("Metrics"),
          n("Traces"),
          n("Resource Health"),
          n("Observability Engines"),
          n("Security"),
        ]),
      ],
    }),
    stage("Security", {
      status: "personal",
      right: [g([n("Monitoring and Logging")])],
    }),
  ],
};

const SECTION_3: KubernetesRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Monitoring and Logging",
  stages: [
    stage("Monitoring and Logging", {
      status: "personal",
      right: [g([n("Autoscaling")])],
    }),
    stage("Storage and Volumes", {
      status: "personal",
      left: [g([n("CSI Drivers"), n("Stateful Applications")])],
      right: [
        g([
          n("Horizontal Pod Autoscaler (HPA)"),
          n("Basics"),
          n("Vertical Pod Autoscaler (VPA)"),
          n("Taints and Tolerations"),
          n("Cluster Autoscaling"),
          n("Topology Spread Constraints"),
        ]),
      ],
    }),
    stage("Scheduling", {
      status: "personal",
      left: [g([n("Storage and Volumes")])],
    }),
    stage("Autoscaling", {
      status: "personal",
      right: [g([n("Scheduling")])],
    }),
  ],
};

const SECTION_4: KubernetesRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Deployment Patterns",
  stages: [
    stage("Deployment Patterns", {
      status: "personal",
      left: [
        g([
          n("Creating Custom Controllers"),
          n("CI / CD Integration"),
          n("Custom Schedulers and Extenders"),
          n("GitOps"),
          n("Custom Resource Definitions (CRDs)"),
          n("Helm Charts"),
        ]),
      ],
      right: [
        g([
          n("Pod Priorities"),
          n("Evictions"),
          n("Should you manage your own Cluster?"),
          n("Installing the Control Plane"),
          n("Adding and Managing Worker Nodes"),
        ]),
      ],
    }),
    stage("Advanced Topics", {
      status: "personal",
      left: [
        g([
          n("Kubernetes Extensions and APIs"),
          n("Canary Deployments"),
          n("Blue-Green Deployments"),
          n("Rolling Updates / Rollbacks"),
          n("DevOps"),
        ]),
      ],
      right: [
        g([n("Multi-Cluster Management"), n("Cluster Operations"), n("Docker"), n("Backend")]),
      ],
    }),
    stage("Continue learning with following roadmaps", {
      status: "personal",
    }),
  ],
};

export const KUBERNETES_SECTIONS: KubernetesRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
