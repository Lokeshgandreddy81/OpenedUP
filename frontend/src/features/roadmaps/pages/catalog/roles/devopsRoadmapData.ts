export type DevOpsRoadmapStatus = "personal" | "alternative" | "optional";

export interface DevOpsRoadmapNode {
  id: string;
  title: string;
  status?: DevOpsRoadmapStatus;
  roadmapId?: string;
}

export interface DevOpsRoadmapGroup {
  id: string;
  parent?: DevOpsRoadmapNode;
  items: DevOpsRoadmapNode[];
}

export interface DevOpsRoadmapStage {
  id: string;
  node: DevOpsRoadmapNode;
  left?: DevOpsRoadmapGroup[];
  right?: DevOpsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DevOpsRoadmapSection {
  id: string;
  title?: string;
  stages: DevOpsRoadmapStage[];
}

export interface DevOpsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DEVOPS_MARKERS: Array<{
  status: DevOpsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DEVOPS_RELATED_ROADMAPS: DevOpsRoadmapLink[] = [
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "AWS Roadmap", roadmapId: "skill-aws" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Go Roadmap", roadmapId: "skill-go" },
];

export const DEVOPS_CONTINUE_LEARNING: DevOpsRoadmapLink[] = [
  { label: "DevSecOps", roadmapId: "devsecops" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Network Engineer", roadmapId: "network-engineer" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "MLOps", roadmapId: "mlops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DevOpsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DevOpsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DevOpsRoadmapNode[],
  parent?: DevOpsRoadmapNode,
  customId?: string
): DevOpsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DevOpsRoadmapStage, "id" | "node"> & {
    status?: DevOpsRoadmapStatus;
    roadmapId?: string;
    customId?: string;
  } = {}
): DevOpsRoadmapStage => {
  const { status, roadmapId, customId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const PROGRAMMING_LANGUAGE: DevOpsRoadmapSection = {
  id: "programming-language",
  title: "1. Programming Language",
  stages: [
    stage("Pick a Language", {
      status: "personal",
      left: [
        g(
          [
            n("Basic Syntax & Data Structures", "personal"),
            n("OOP & Functional Concepts", "personal"),
            n("CLI Tools & Scripting", "personal"),
            n("Libraries: Requests, Click, Boto3", "personal"),
          ],
          n("Python", "personal", "skill-python")
        ),
        g([n("Ruby", "alternative"), n("Rust", "alternative")]),
      ],
      right: [
        g(
          [
            n("Syntax, Types & Interfaces", "personal"),
            n("Concurrency: Goroutines & Channels", "personal"),
            n("Standard Library: net/http & os", "personal"),
            n("Building CLI Utilities & Operators", "personal"),
          ],
          n("Go", "personal", "skill-go")
        ),
        g([
          n("Node.js", "alternative", "skill-nodejs"),
          n("C / C++", "optional", "skill-c-programming"),
        ]),
      ],
      noteAfter:
        "DevOps engineers write scripts and tooling to automate repetitive tasks, interact with cloud provider APIs, and build internal developer platforms.",
      projectIdea:
        "CLI Automation Tool: Build a command-line tool in Go or Python to query cloud infrastructure resources and generate automated audit reports.",
    }),
  ],
};

const OPERATING_SYSTEMS: DevOpsRoadmapSection = {
  id: "operating-systems",
  title: "2. Operating Systems & Linux Mastery",
  stages: [
    stage("Understand OS Concepts", {
      left: [
        g([
          n("Process Management", "personal"),
          n("Threads and Concurrency", "personal"),
          n("Sockets & IPC", "personal"),
          n("POSIX Standards", "optional"),
        ]),
      ],
      right: [
        g([
          n("Memory & Storage Management", "personal"),
          n("File Systems & Permissions", "personal"),
          n("I/O Management", "personal"),
          n("Virtualization Fundamentals", "alternative"),
        ]),
      ],
      noteAfter:
        "Mastering OS internals ensures you can diagnose high CPU/memory usage, zombie processes, disk I/O bottlenecks, and network socket exhaustion.",
    }),
    stage("Managing Servers & Linux", {
      status: "personal",
      roadmapId: "skill-linux",
      left: [
        g(
          [
            n("Ubuntu", "personal"),
            n("Debian", "alternative"),
            n("Alpine Linux", "personal"),
            n("RHEL / Rocky Linux", "alternative"),
          ],
          n("Linux Distributions", "personal")
        ),
        g([
          n("Unix: FreeBSD & OpenBSD", "alternative"),
          n("Windows Server & PowerShell", "alternative"),
        ]),
      ],
      right: [
        g(
          [
            n("Shell Scripting Fundamentals", "personal"),
            n("Text Tools: sed, awk, grep, cut", "personal"),
            n("CLI Tools: curl, jq, find, xargs, tmux", "personal"),
            n("Compiling from Source: gcc, make", "optional"),
          ],
          n("Bash & Terminal Mastery", "personal")
        ),
        g(
          [
            n("top, htop, vmstat, iostat", "personal"),
            n("netstat, ss, lsof, strace, free, df", "personal"),
          ],
          n("System Performance & Diagnostics", "personal")
        ),
      ],
      projectIdea:
        "Server Hardening Script: Write an automated Bash script that configures SSH keys, disables root login, enables UFW firewall, and installs security updates.",
    }),
  ],
};

const NETWORKING_AND_SERVERS: DevOpsRoadmapSection = {
  id: "networking-and-servers",
  title: "3. Networking, Security & Web Servers",
  stages: [
    stage("Networking & Security Protocols", {
      status: "personal",
      roadmapId: "network-engineer",
      left: [
        g(
          [
            n("OSI & TCP/IP 4-Layer Models", "personal"),
            n("DNS & Domain Resolution", "personal"),
            n("HTTP / HTTPS / HTTP/2 / HTTP/3", "personal"),
            n("WebSockets", "optional"),
            n("SSL / TLS & Certificates", "personal"),
          ],
          n("Core Protocols", "personal")
        ),
      ],
      right: [
        g(
          [
            n("SSH, Key Pairs & Bastion Hosts", "personal"),
            n("Firewalls: iptables, ufw, nftables", "personal"),
            n("IP Addressing, Subnets, CIDR & NAT", "personal"),
            n("Reverse Proxy & Forward Proxy", "personal"),
          ],
          n("Security & Access Control", "personal")
        ),
      ],
    }),
    stage("Web & Proxy Servers", {
      left: [g([n("Nginx", "personal"), n("Apache", "alternative"), n("Caddy", "alternative")])],
      right: [
        g([n("HAProxy", "personal"), n("Traefik", "alternative"), n("Envoy", "alternative")]),
      ],
    }),
  ],
};

const VERSION_CONTROL: DevOpsRoadmapSection = {
  id: "version-control",
  title: "4. Version Control Systems",
  stages: [
    stage("Version Control Systems", {
      status: "personal",
      roadmapId: "skill-git-github",
      left: [
        g(
          [
            n("Branching Strategies: Trunk-Based, GitFlow", "personal"),
            n("Rebasing, Merging & Cherry-Picking", "personal"),
            n("Commit Hygiene & Semantic Commits", "personal"),
            n("Signed Commits (GPG)", "optional"),
          ],
          n("Git Essentials", "personal")
        ),
      ],
      right: [
        g(
          [n("GitHub", "personal"), n("GitLab", "personal"), n("Bitbucket", "alternative")],
          n("VCS Hosting Platforms", "personal")
        ),
      ],
      noteAfter:
        "Trunk-based development with short-lived feature branches and automated checks is the foundation for high-velocity CI/CD delivery.",
    }),
  ],
};

const CONTAINERS: DevOpsRoadmapSection = {
  id: "containers",
  title: "5. Containers & Virtualization",
  stages: [
    stage("Containers", {
      status: "personal",
      roadmapId: "skill-docker",
      left: [
        g(
          [
            n("Dockerfile Best Practices", "personal"),
            n("Multi-Stage Builds", "personal"),
            n("Docker Compose", "personal"),
            n("Docker Networking & Volumes", "personal"),
            n("Distroless & Minimal Images", "personal"),
          ],
          n("Docker", "personal", "skill-docker")
        ),
      ],
      right: [
        g(
          [
            n("containerd", "personal"),
            n("Podman", "alternative"),
            n("CRI-O", "alternative"),
            n("LXC / LXD", "alternative"),
          ],
          n("Container Runtimes", "personal")
        ),
      ],
      projectIdea:
        "Production Container Image: Create a multi-stage Docker build for a microservice with a distroless runtime, non-root user, and health check.",
    }),
  ],
};

const CONFIG_AND_IAC: DevOpsRoadmapSection = {
  id: "config-and-iac",
  title: "6. Configuration Management & Infrastructure as Code",
  stages: [
    stage("Configuration Management", {
      left: [
        g(
          [
            n("Playbooks & Tasks", "personal"),
            n("Roles & Collections", "personal"),
            n("Inventory Management", "personal"),
            n("Ansible Vault for Secrets", "personal"),
            n("Idempotency Best Practices", "personal"),
          ],
          n("Ansible", "personal")
        ),
      ],
      right: [
        g([n("Puppet", "alternative"), n("Chef", "alternative"), n("SaltStack", "alternative")]),
      ],
      noteAfter:
        "Ansible remains the industry leader for server configuration management because it is agentless and works natively over SSH.",
    }),
    stage("Infrastructure as Code (IaC)", {
      left: [
        g(
          [
            n("State Management & Remote Backends", "personal"),
            n("Modules & Reusability", "personal"),
            n("Workspaces & Environments", "personal"),
            n("Providers & Resources", "personal"),
          ],
          n("Terraform", "personal")
        ),
        g([n("OpenTofu", "alternative"), n("Pulumi", "alternative")]),
      ],
      right: [
        g(
          [
            n("AWS CloudFormation & AWS CDK", "alternative"),
            n("Azure Bicep / ARM Templates", "alternative"),
            n("Google Cloud Deployment Manager", "alternative"),
          ],
          n("Cloud-Native IaC", "alternative")
        ),
      ],
      projectIdea:
        "Reusable VPC & Compute Module: Write modular Terraform or OpenTofu code to spin up a multi-AZ VPC with private/public subnets, NAT gateways, and auto-scaling VMs.",
    }),
  ],
};

const CICD_PIPELINES: DevOpsRoadmapSection = {
  id: "cicd-pipelines",
  title: "7. CI / CD Pipelines & Artifacts",
  stages: [
    stage("Continuous Integration & Delivery", {
      left: [
        g(
          [
            n("GitHub Actions", "personal"),
            n("GitLab CI", "personal"),
            n("Jenkins", "alternative"),
            n("CircleCI", "alternative"),
            n("Argo Workflows", "alternative"),
          ],
          n("CI/CD Platforms", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Automated Testing & Linting", "personal"),
            n("Ephemeral Runners & Caching", "personal"),
            n("Artifact Repositories: Nexus, Artifactory", "personal"),
            n("Container Registries: GHCR, ECR, GAR, Docker Hub", "personal"),
          ],
          n("Pipeline Capabilities & Artifacts", "personal")
        ),
      ],
      projectIdea:
        "Automated Release Pipeline: Build a GitHub Actions workflow that tests code, runs security linters, builds a container image, pushes to a registry, and tags releases.",
    }),
  ],
};

const ORCHESTRATION_AND_GITOPS: DevOpsRoadmapSection = {
  id: "orchestration-and-gitops",
  title: "8. Container Orchestration & GitOps",
  stages: [
    stage("Container Orchestration", {
      status: "personal",
      roadmapId: "skill-kubernetes",
      left: [
        g(
          [
            n("Pods, Deployments & ReplicaSets", "personal"),
            n("Services & Ingress Controllers", "personal"),
            n("ConfigMaps & Secrets", "personal"),
            n("PersistentVolumes & PVCs", "personal"),
            n("Namespaces, RBAC & ServiceAccounts", "personal"),
            n("Horizontal Pod Autoscaling (HPA)", "personal"),
          ],
          n("Kubernetes Architecture & Workloads", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Chart Templates & Values", "personal"),
            n("Helm Repositories & Dependencies", "personal"),
          ],
          n("Helm Charts & Packaging", "personal")
        ),
        g([
          n("Kustomize", "alternative"),
          n("Managed K8s: AWS EKS, Google GKE, Azure AKS", "personal"),
          n("Local Clusters: k3s, Kind, Minikube", "personal"),
          n("HashiCorp Nomad", "alternative"),
        ]),
      ],
      projectIdea:
        "Kubernetes Cluster Deployment: Deploy a microservices app onto a K3s or EKS cluster using Helm charts with autoscaling and ingress.",
    }),
    stage("GitOps & Delivery Strategies", {
      left: [
        g([n("ArgoCD", "personal"), n("Flux CD", "alternative")], n("GitOps Engines", "personal")),
      ],
      right: [
        g(
          [
            n("Blue-Green Deployments", "personal"),
            n("Canary Deployments", "personal"),
            n("Flagger & Argo Rollouts", "alternative"),
            n("Feature Flags & Rollbacks", "optional"),
          ],
          n("Progressive Delivery", "personal")
        ),
      ],
      projectIdea:
        "GitOps Kubernetes Deployment: Set up an ArgoCD application that tracks a Git repository and automatically synchronizes Helm releases to a local K3s or cloud cluster.",
    }),
  ],
};

const SERVICE_MESH_AND_CLOUD: DevOpsRoadmapSection = {
  id: "service-mesh-and-cloud",
  title: "9. Service Mesh & Cloud Providers",
  stages: [
    stage("Service Mesh", {
      left: [
        g(
          [n("Istio", "personal"), n("Linkerd", "alternative")],
          n("Service Mesh Engines", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Envoy Proxy", "personal"),
            n("Consul Connect", "alternative"),
            n("Capabilities: mTLS, Traffic Routing, Circuit Breaking", "personal"),
          ],
          n("Data Plane & Architecture", "personal")
        ),
      ],
    }),
    stage("Cloud Providers", {
      status: "personal",
      roadmapId: "skill-aws",
      left: [
        g(
          [
            n("IAM: Roles, Policies & Least Privilege", "personal"),
            n("Compute: EC2, Lambda, ECS, EKS", "personal"),
            n("Storage: S3, EBS, EFS", "personal"),
            n("Networking: VPC, Subnets, Route 53, ALB", "personal"),
            n("Database: RDS, Aurora, DynamoDB", "personal"),
          ],
          n("Amazon Web Services (AWS)", "personal", "skill-aws")
        ),
        g([n("Google Cloud Platform (GCP)", "alternative")]),
      ],
      right: [
        g([n("Microsoft Azure", "alternative")]),
        g(
          [
            n("High Availability & Multi-AZ", "personal"),
            n("Disaster Recovery: RPO & RTO", "personal"),
            n("Cloud Cost Optimization (FinOps)", "personal"),
            n("Serverless Patterns", "alternative"),
            n("Alternative Cloud: DigitalOcean, Hetzner, Linode", "optional"),
          ],
          n("Cloud Architecture & Reliability", "personal")
        ),
      ],
    }),
  ],
};

const OBSERVABILITY: DevOpsRoadmapSection = {
  id: "observability",
  title: "10. Observability: Metrics, Logs & Tracing",
  stages: [
    stage("Observability & Monitoring", {
      left: [
        g(
          [
            n("PromQL & Metric Types", "personal"),
            n("Alertmanager & Routing", "personal"),
            n("Exporters: Node Exporter, kube-state-metrics", "personal"),
          ],
          n("Prometheus", "personal")
        ),
        g([
          n("Grafana Dashboards", "personal"),
          n("Datadog", "alternative"),
          n("Zabbix / Nagios", "alternative"),
        ]),
        g(
          [n("OpenTelemetry", "personal"), n("Jaeger", "personal"), n("Zipkin", "alternative")],
          n("Distributed Tracing (APM)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Elasticsearch / OpenSearch", "personal"),
            n("Logstash / Fluent Bit / Fluentd", "personal"),
            n("Kibana", "personal"),
          ],
          n("Elastic Stack (ELK / EFK)", "personal", "skill-elasticsearch")
        ),
        g([
          n("Grafana Loki", "personal"),
          n("Vector", "alternative"),
          n("Cloud-Native Logs: CloudWatch, Google Cloud Logging", "alternative"),
        ]),
      ],
      projectIdea:
        "Observability Platform: Deploy Prometheus, Grafana, and Loki using Helm to monitor a Kubernetes cluster with custom dashboards and alerts for latency and error rates.",
    }),
  ],
};

const SECURITY_AND_RESILIENCE: DevOpsRoadmapSection = {
  id: "security-and-resilience",
  title: "11. Security, Secrets & Chaos Engineering",
  stages: [
    stage("DevSecOps & Secrets Management", {
      status: "personal",
      roadmapId: "devsecops",
      left: [
        g(
          [
            n("HashiCorp Vault", "personal"),
            n("Cloud Secret Managers: AWS / Azure / GCP", "personal"),
            n("SOPS (Secrets OPerationS)", "alternative"),
            n("Sealed Secrets & External Secrets Operator", "alternative"),
          ],
          n("Secrets Management", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Container Security: Trivy, Grype", "personal"),
            n("Static Code & SAST: SonarQube, Semgrep", "personal"),
            n("Dependency & SCA: Snyk, OWASP Dependency-Check", "personal"),
            n("Policy as Code: Open Policy Agent (OPA) & Kyverno", "personal"),
          ],
          n("Security Scanning & Policy", "personal")
        ),
      ],
    }),
    stage("Chaos Engineering & Reliability", {
      left: [g([n("Chaos Mesh", "personal"), n("LitmusChaos", "alternative")])],
      right: [
        g([
          n("Gremlin", "alternative"),
          n("Fault Injection Testing & GameDays", "personal"),
          n("Chaos Monkey", "optional"),
        ]),
      ],
      noteAfter:
        "Resilience engineering tests whether distributed systems recover gracefully from network partitions, node crashes, and dependency failures.",
    }),
  ],
};

export const DEVOPS_SECTIONS: DevOpsRoadmapSection[] = [
  PROGRAMMING_LANGUAGE,
  OPERATING_SYSTEMS,
  NETWORKING_AND_SERVERS,
  VERSION_CONTROL,
  CONTAINERS,
  CONFIG_AND_IAC,
  CICD_PIPELINES,
  ORCHESTRATION_AND_GITOPS,
  SERVICE_MESH_AND_CLOUD,
  OBSERVABILITY,
  SECURITY_AND_RESILIENCE,
];
