export type AwsRoadmapStatus = "personal" | "alternative" | "optional";

export interface AwsRoadmapNode {
  id: string;
  title: string;
  status?: AwsRoadmapStatus;
  roadmapId?: string;
}

export interface AwsRoadmapGroup {
  id: string;
  parent?: AwsRoadmapNode;
  items: AwsRoadmapNode[];
}

export interface AwsRoadmapStage {
  id: string;
  node: AwsRoadmapNode;
  left?: AwsRoadmapGroup[];
  right?: AwsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AwsRoadmapSection {
  id: string;
  title?: string;
  stages: AwsRoadmapStage[];
}

export interface AwsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const AWS_MARKERS: Array<{
  status: AwsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const AWS_RELATED_ROADMAPS: AwsRoadmapLink[] = [
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Computer Science Roadmap", roadmapId: "skill-computer-science" },
  { label: "Cloudflare Roadmap", roadmapId: "skill-cloudflare" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "Backend Roadmap", roadmapId: "backend" },
];

export const AWS_CONTINUE_LEARNING: AwsRoadmapLink[] = [
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AwsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): AwsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AwsRoadmapNode[],
  parent?: AwsRoadmapNode,
  customId?: string
): AwsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AwsRoadmapStage, "id" | "node"> & {
    status?: AwsRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): AwsRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. STEP 1 - ESSENTIALS & FOUNDATIONS
const ESSENTIALS: AwsRoadmapSection = {
  id: "step-1-essentials",
  title: "Step 1 — Essentials",
  stages: [
    stage("Introduction", {
      status: "personal",
      left: [
        g(
          [
            n("What is Cloud Computing?", "personal"),
            n("IaaS vs PaaS vs SaaS", "personal"),
            n("Public vs Private vs Hybrid Cloud", "personal"),
          ],
          n("Cloud Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Introduction to AWS", "personal"),
            n("AWS Free Tier & Budgets", "optional"),
            n("AWS Management Console & CLI", "personal"),
          ],
          n("Getting Started with AWS")
        ),
      ],
    }),
    stage("AWS Architecture & Fundamentals", {
      status: "personal",
      left: [
        g(
          [
            n("AWS Global Infrastructure", "personal"),
            n("Regions & Availability Zones", "personal"),
            n("Edge Locations", "optional"),
          ],
          n("Global Infrastructure")
        ),
      ],
      right: [
        g(
          [
            n("Shared Responsibility Model", "personal"),
            n("Well Architected Framework", "personal"),
            n("Security and Compliance Overview", "optional"),
          ],
          n("Security & Architecture Pillars")
        ),
      ],
      noteAfter:
        "AWS has lots of services. You don't need to master all of them. This roadmap only covers an opinionated list of services to help you get started.",
    }),
  ],
};

// 2. STEP 2 - CORE SERVICES (EC2, VPC, IAM)
const CORE_SERVICES: AwsRoadmapSection = {
  id: "step-2-core-services",
  title: "Step 2 — Learn These Next",
  stages: [
    stage("EC2", {
      status: "personal",
      left: [
        g(
          [
            n("Instance Types", "personal"),
            n("CPU Credits", "optional"),
            n("Storage / Volumes", "personal"),
            n("Keypairs", "personal"),
          ],
          n("Instance Sizing & Storage")
        ),
      ],
      right: [
        g(
          [
            n("Elastic IP", "personal"),
            n("User Data Scripts", "personal"),
            n("Purchasing Options", "personal"),
          ],
          n("Configuration & Pricing")
        ),
      ],
    }),
    stage("VPC", {
      status: "personal",
      left: [
        g(
          [
            n("CIDR Blocks", "personal"),
            n("Public Subnet", "personal"),
            n("Private Subnet", "personal"),
            n("Subnets", "personal"),
          ],
          n("IP Addressing & Subnets")
        ),
      ],
      right: [
        g(
          [
            n("Route Tables", "personal"),
            n("Internet Gateway", "personal"),
            n("NAT Gateway", "personal"),
            n("Security Groups", "personal"),
          ],
          n("Gateways & Routing")
        ),
      ],
    }),
    stage("IAM", {
      status: "personal",
      left: [
        g(
          [n("Identity-based", "personal"), n("Resource-based", "personal")],
          n("Policies", "personal")
        ),
        g([n("Users / User Groups", "personal")], n("Access Management")),
      ],
      right: [
        g(
          [n("Instance Profiles", "personal"), n("Assuming Roles", "personal")],
          n("Roles", "personal")
        ),
      ],
      noteAfter:
        "Best way to learn? Make a simple app and use the services listed above for deployment.",
    }),
  ],
};

// 3. STEP 3 - SCALING, STORAGE & DATABASES
const SCALING_STORAGE_DATABASES: AwsRoadmapSection = {
  id: "step-3-scaling-storage-databases",
  title: "Step 3 — Pick These After",
  stages: [
    stage("Auto-Scaling", {
      status: "personal",
      left: [
        g(
          [
            n("AMIs", "personal"),
            n("Launch Templates", "personal"),
            n("Auto-Scaling Groups", "personal"),
          ],
          n("Templates & Groups")
        ),
      ],
      right: [
        g(
          [n("Scaling Policies", "personal"), n("Elastic Load Balancers", "personal")],
          n("Load Balancing & Policies")
        ),
      ],
    }),
    stage("S3", {
      status: "personal",
      left: [
        g(
          [n("Buckets / Objects", "personal"), n("Bucket / Object Lifecycle", "personal")],
          n("Object Storage")
        ),
      ],
      right: [
        g(
          [n("Standard", "personal"), n("S3-IA", "alternative"), n("Glacier", "alternative")],
          n("Storage Types", "personal")
        ),
      ],
    }),
    stage("Route53", {
      status: "personal",
      left: [
        g(
          [
            n("Hosted Zones", "personal"),
            n("Routing Policies", "personal"),
            n("Health Checks", "personal"),
          ],
          n("DNS & Traffic Routing")
        ),
      ],
      right: [
        g(
          [n("Metrics", "personal"), n("Events", "personal"), n("Logs", "personal")],
          n("Cloudwatch", "personal")
        ),
      ],
    }),
    stage("SES", {
      status: "optional",
      left: [
        g(
          [
            n("Sandbox / Sending Limits", "personal"),
            n("Identity Verification", "personal"),
            n("DKIM Setup", "personal"),
          ],
          n("Verification & Configuration")
        ),
      ],
      right: [
        g(
          [
            n("Feedback Handling", "personal"),
            n("Configuration Sets", "optional"),
            n("Sender Reputation", "personal"),
            n("Dedicated IP", "alternative"),
          ],
          n("Reputation & Delivery")
        ),
      ],
    }),
    stage("RDS", {
      status: "personal",
      left: [
        g(
          [n("DB Instances", "personal"), n("Backup / Restore", "personal")],
          n("Database Management")
        ),
      ],
      right: [
        g(
          [
            n("General Purpose", "personal"),
            n("Provisioned IOPS", "alternative"),
            n("Magnetic", "optional"),
          ],
          n("Storage Types", "personal")
        ),
      ],
    }),
    stage("DynamoDB", {
      status: "personal",
      left: [
        g(
          [
            n("Tables / Items / Attributes", "personal"),
            n("Primary Keys / Secondary Indexes", "personal"),
            n("Data Modeling", "personal"),
          ],
          n("Schema & Query Design")
        ),
      ],
      right: [
        g(
          [
            n("Streams", "personal"),
            n("Capacity Settings", "personal"),
            n("Limits", "optional"),
            n("Backup / Restore", "personal"),
            n("DynamoDB Local", "optional"),
          ],
          n("Operations & Performance")
        ),
      ],
    }),
    stage("ElastiCache & Cloudfront", {
      status: "personal",
      left: [g([n("Quotas", "optional")], n("ElastiCache", "personal"))],
      right: [
        g(
          [
            n("Distributions", "personal"),
            n("Policies", "personal"),
            n("Invalidations", "personal"),
          ],
          n("Cloudfront", "personal")
        ),
      ],
    }),
  ],
};

// 4. STEP 4 - CONTAINERS & SERVERLESS
const CONTAINERS_AND_SERVERLESS: AwsRoadmapSection = {
  id: "step-4-containers-and-serverless",
  title: "Step 4 — Containers & Serverless",
  stages: [
    stage("ECS & ECR", {
      status: "personal",
      left: [
        g(
          [
            n("Clusters / ECS Container Agents", "personal"),
            n("Tasks", "personal"),
            n("Services", "personal"),
          ],
          n("ECS Architecture")
        ),
      ],
      right: [
        g(
          [
            n("Launch Config / Autoscaling Groups", "personal"),
            n("Fargate", "personal"),
            n("ECR", "personal"),
          ],
          n("Container Registries & Fargate")
        ),
      ],
    }),
    stage("EKS", {
      status: "personal",
      roadmapId: "skill-kubernetes",
      left: [
        g(
          [n("Control Plane & Node Groups", "personal"), n("Fargate on EKS", "alternative")],
          n("Managed Kubernetes")
        ),
      ],
      right: [
        g(
          [
            n("Kubernetes Roadmap", "personal", "skill-kubernetes"),
            n("DevOps Roadmap", "personal", "devops"),
          ],
          n("Related Tracks")
        ),
      ],
    }),
    stage("Lambda", {
      status: "personal",
      left: [
        g(
          [
            n("Creating / Invoking Functions", "personal"),
            n("Layers", "personal"),
            n("Custom Runtimes", "alternative"),
            n("Versioning / Aliases", "personal"),
          ],
          n("Function Development")
        ),
      ],
      right: [
        g(
          [
            n("Event Bridge / Scheduled Execution", "personal"),
            n("Cold Start and Limitations", "optional"),
            n("API Gateway", "personal"),
            n("Lambda@Edge", "alternative"),
          ],
          n("Event Triggers & Edge Execution")
        ),
      ],
      projectIdea:
        "Project: Deploy a Serverless Fullstack App with S3, API Gateway, Lambda & DynamoDB",
    }),
  ],
};

export const AWS_SECTIONS: AwsRoadmapSection[] = [
  ESSENTIALS,
  CORE_SERVICES,
  SCALING_STORAGE_DATABASES,
  CONTAINERS_AND_SERVERLESS,
];
