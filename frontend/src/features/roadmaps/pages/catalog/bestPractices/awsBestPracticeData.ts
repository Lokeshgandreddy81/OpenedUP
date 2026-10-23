export type BestPracticeStatus = "personal" | "alternative" | "optional";
export type BestPracticeImpact = "critical" | "high" | "recommended" | "audit";

export interface BestPracticeNode {
  id: string;
  title: string;
  status?: BestPracticeStatus;
  impact?: BestPracticeImpact;
  roadmapId?: string;
}

export interface BestPracticeGroup {
  id: string;
  parent?: BestPracticeNode;
  items: BestPracticeNode[];
}

export interface BestPracticeStage {
  id: string;
  node: BestPracticeNode;
  left?: BestPracticeGroup[];
  right?: BestPracticeGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface BestPracticeSection {
  id: string;
  title?: string;
  stages: BestPracticeStage[];
}

export interface BestPracticeLink {
  label: string;
  roadmapId: string;
}

export interface BestPracticeMetric {
  label: string;
  value: string;
  detail: string;
}

export const AWS_BEST_PRACTICE_METRICS: BestPracticeMetric[] = [
  { label: "Security Benchmark", value: "CIS 100%", detail: "Zero root credentials in daily use" },
  { label: "High Availability", value: "99.999%", detail: "Multi-AZ automated failover" },
  { label: "Cost Optimization", value: "-35%", detail: "Savings Plans & tiered S3 storage" },
  { label: "Audit Frequency", value: "Continuous", detail: "AWS Config & GuardDuty alerts" },
];

export const AWS_BEST_PRACTICE_MARKERS: Array<{
  status: BestPracticeStatus;
  label: string;
}> = [
  { status: "personal", label: "Must-Have Practice (P0)" },
  { status: "alternative", label: "Alternative / Trade-off" },
  { status: "optional", label: "Advanced Optimization" },
];

export const AWS_BEST_PRACTICE_RELATED_ROADMAPS: BestPracticeLink[] = [
  { label: "AWS Skill Roadmap", roadmapId: "skill-aws" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "DevSecOps Roadmap", roadmapId: "devsecops" },
  { label: "Cloudflare Roadmap", roadmapId: "skill-cloudflare" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Terraform Roadmap", roadmapId: "skill-terraform" },
];

export const AWS_BEST_PRACTICE_CONTINUE_LEARNING: BestPracticeLink[] = [
  { label: "API Security Best Practices", roadmapId: "best-practice-api-security" },
  { label: "Backend Performance Best Practices", roadmapId: "best-practice-backend-performance" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "DevSecOps", roadmapId: "devsecops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BestPracticeStatus,
  impact?: BestPracticeImpact,
  roadmapId?: string,
  customId?: string
): BestPracticeNode => ({
  id: customId ?? slug(title),
  title,
  status,
  impact,
  roadmapId,
});

const g = (
  items: BestPracticeNode[],
  parent?: BestPracticeNode,
  customId?: string
): BestPracticeGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BestPracticeStage, "id" | "node"> & {
    status?: BestPracticeStatus;
    impact?: BestPracticeImpact;
    customId?: string;
    roadmapId?: string;
  } = {}
): BestPracticeStage => {
  const { status, impact, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, impact, roadmapId, customId),
    ...rest,
  };
};

const IAM_SECURITY: BestPracticeSection = {
  id: "iam-security",
  title: "IAM & Identity Governance",
  stages: [
    stage("IAM Account Hygiene & Multi-Factor Auth", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Lock away Root Account with Hardware MFA", "personal", "critical"),
            n("Enforce Principle of Least Privilege", "personal", "critical"),
            n("Prefer IAM Roles over Long-lived Access Keys", "personal", "critical"),
          ],
          n("Identity Baseline")
        ),
      ],
      right: [
        g([
          n("Automate Credential Rotation (90-day cycles)", "personal", "high"),
          n("Service Control Policies (SCPs) with AWS Organizations", "personal", "high"),
          n("Use AWS IAM Identity Center (SSO)", "personal", "recommended"),
        ]),
      ],
      noteAfter:
        "Never hardcode AWS credentials in source code or CI scripts. Always inject IAM Roles or OIDC federated tokens.",
      projectIdea:
        "Run IAM Access Advisor and revoke unused permissions across all IAM roles and service accounts.",
    }),
  ],
};

const VPC_NETWORKING: BestPracticeSection = {
  id: "vpc-networking",
  title: "VPC Network Architecture & Edge Security",
  stages: [
    stage("Network Segmentation & Firewalls", {
      status: "personal",
      impact: "critical",
      left: [
        g([
          n("Delete Default VPC in all regions", "personal", "high"),
          n("Strict Public vs Private Subnet Separation", "personal", "critical"),
          n("NAT Gateways in Multi-AZ configuration", "personal", "high"),
        ]),
      ],
      right: [
        g([
          n("Security Groups: Minimal Whitelisted Ports", "personal", "critical"),
          n("VPC Flow Logs enabled for security forensics", "personal", "audit"),
          n("AWS WAF & Shield for API protection", "personal", "high"),
        ]),
      ],
      noteAfter:
        "Databases and internal microservices should NEVER be placed in public subnets with public IPv4 addresses.",
    }),
  ],
};

const S3_STORAGE: BestPracticeSection = {
  id: "s3-storage",
  title: "S3 Storage Hardening & Encryption",
  stages: [
    stage("S3 Bucket Security & Lifecycle", {
      status: "personal",
      impact: "critical",
      left: [
        g([
          n("Enable S3 Block Public Access Account-Wide", "personal", "critical"),
          n("Server-Side Encryption with KMS (SSE-KMS)", "personal", "critical"),
          n("Enforce HTTPS-only via aws:SecureTransport policy", "personal", "critical"),
        ]),
      ],
      right: [
        g([
          n("S3 Versioning & MFA Delete protection", "personal", "high"),
          n(
            "Lifecycle Policies: Glacier Instant Retrieval for cost saving",
            "personal",
            "recommended"
          ),
          n("S3 Object Lock for WORM compliance"),
        ]),
      ],
      projectIdea:
        "Audit all S3 buckets for open public read/write permissions using AWS Trusted Advisor and AWS Config.",
    }),
  ],
};

const COMPUTE_AND_RELIABILITY: BestPracticeSection = {
  id: "compute-and-reliability",
  title: "Compute Reliability & Disaster Recovery",
  stages: [
    stage("Compute Resilience & Database Failover", {
      status: "personal",
      impact: "high",
      left: [
        g([
          n("Auto Scaling Groups spanning 3 Availability Zones", "personal", "high"),
          n("Enforce IMDSv2 on all EC2 instances", "personal", "critical"),
          n("Use Distroless & Scanned ECR Container Images", "personal", "high"),
        ]),
      ],
      right: [
        g([
          n("RDS Multi-AZ Automated Replication", "personal", "critical"),
          n("Point-In-Time Recovery (PITR) for DynamoDB & RDS", "personal", "high"),
          n("Read Replicas to offload read-heavy workloads", "personal", "recommended"),
        ]),
      ],
    }),
  ],
};

const OBSERVABILITY_AND_COST: BestPracticeSection = {
  id: "observability-and-cost",
  title: "Continuous Monitoring, Threat Detection & FinOps",
  stages: [
    stage("Observability & FinOps Governance", {
      status: "personal",
      impact: "high",
      left: [
        g([
          n("CloudTrail Multi-Region Log Delivery", "personal", "critical"),
          n("Amazon GuardDuty continuous threat detection", "personal", "high"),
          n("AWS Security Hub CIS Benchmark scoring", "personal", "audit"),
        ]),
      ],
      right: [
        g([
          n("AWS Budgets & Cost Anomaly Detection alerts", "personal", "high"),
          n("Compute Savings Plans & Reserved Instances", "personal", "high"),
          n("CloudWatch Synthetic Canaries for API health", "personal", "recommended"),
        ]),
      ],
      projectIdea:
        "Configure automated Slack/PagerDuty alerts for root logins and budget overruns exceeding 80%.",
    }),
  ],
};

export const AWS_BEST_PRACTICE_SECTIONS: BestPracticeSection[] = [
  IAM_SECURITY,
  VPC_NETWORKING,
  S3_STORAGE,
  COMPUTE_AND_RELIABILITY,
  OBSERVABILITY_AND_COST,
];
