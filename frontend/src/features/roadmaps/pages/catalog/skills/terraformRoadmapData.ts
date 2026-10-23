export type TerraformRoadmapStatus = "personal" | "alternative" | "optional";

export interface TerraformRoadmapNode {
  id: string;
  title: string;
  status?: TerraformRoadmapStatus;
  roadmapId?: string;
}

export interface TerraformRoadmapGroup {
  id: string;
  parent?: TerraformRoadmapNode;
  items: TerraformRoadmapNode[];
}

export interface TerraformRoadmapStage {
  id: string;
  node: TerraformRoadmapNode;
  left?: TerraformRoadmapGroup[];
  right?: TerraformRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface TerraformRoadmapSection {
  id: string;
  title?: string;
  stages: TerraformRoadmapStage[];
}

export interface TerraformRoadmapLink {
  label: string;
  roadmapId: string;
}

export const TERRAFORM_MARKERS: Array<{ status: TerraformRoadmapStatus; label: string }> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const TERRAFORM_RELATED_ROADMAPS: TerraformRoadmapLink[] = [
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "AWS Roadmap", roadmapId: "skill-aws" },
  { label: "Git & GitHub", roadmapId: "skill-git-github" },
  { label: "Cloudflare", roadmapId: "skill-cloudflare" },
  { label: "Backend", roadmapId: "backend" },
];

export const TERRAFORM_CONTINUE_LEARNING: TerraformRoadmapLink[] = [
  { label: "DevOps", roadmapId: "devops" },
  { label: "AWS", roadmapId: "skill-aws" },
  { label: "Docker", roadmapId: "skill-docker" },
  { label: "Kubernetes", roadmapId: "skill-kubernetes" },
];

const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const n = (
  title: string,
  status?: TerraformRoadmapStatus,
  roadmapId?: string
): TerraformRoadmapNode => ({ id: slug(title), title, status, roadmapId });
const g = (
  items: TerraformRoadmapNode[],
  parent?: TerraformRoadmapNode
): TerraformRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});
const s = (
  title: string,
  opts: Omit<TerraformRoadmapStage, "id" | "node"> & { status?: TerraformRoadmapStatus } = {}
): TerraformRoadmapStage => {
  const { status, ...rest } = opts;
  return { id: slug(title), node: n(title, status), ...rest };
};

export const TERRAFORM_SECTIONS: TerraformRoadmapSection[] = [
  {
    id: "foundations",
    stages: [
      s("Introduction", {
        right: [
          g([
            n("What is Terraform?"),
            n("Usecases and Benefits"),
            n("Installing Terraform"),
            n("CaC vs IaC"),
          ]),
        ],
      }),
      s("Project Initialization"),
      s("Providers", {
        right: [g([n("Terraform Registry"), n("Configuring Providers"), n("Versions")])],
      }),
      s("Hashicorp Config. Language (HCL)", {
        right: [g([n("What is Infrastructure as Code?"), n("What is HCL?"), n("Basic Syntax")])],
        noteAfter: "Getting Started",
      }),
    ],
  },
  {
    id: "core-concepts",
    title: "Core Concepts",
    stages: [
      s("Resources", {
        right: [
          g([n("Resource Behavior"), n("Resource Lifecycle"), n("Resource Meta Arguments")]),
          g(
            [n("depends_on"), n("count"), n("for_each"), n("provider"), n("lifecycle")],
            n("Meta Arguments")
          ),
        ],
      }),
      s("Variables", {
        right: [
          g([
            n("Input Variables"),
            n("Type Constraints"),
            n("Environment Variables"),
            n("Variable Definition File"),
            n("Validation Rules"),
            n("Local Values"),
          ]),
        ],
      }),
      s("Outputs", {
        right: [g([n("Output Syntax"), n("Sensitive Outputs"), n("Preconditions")])],
      }),
      s("Format & Validate", {
        right: [g([n("terraform fmt"), n("terraform validate"), n("TFLint")])],
      }),
    ],
  },
  {
    id: "deployment",
    title: "Deployment & State",
    stages: [
      s("Deployment", {
        right: [g([n("terraform plan"), n("terraform apply")])],
      }),
      s("Inspect / Modify State", {
        right: [g([n("graph"), n("list"), n("output")])],
      }),
      s("Clean Up", {
        right: [g([n("terraform destroy")])],
        noteAfter: "State Management",
      }),
      s("State", {
        right: [
          g([
            n("Remote State"),
            n("State Locking"),
            n("Import Existing Resources"),
            n("Splitting State Files"),
            n("Versioning"),
            n("Sensitive Data"),
          ]),
        ],
      }),
      s("Best Practices for State", {
        right: [
          g(
            [
              n("-replace option in apply"),
              n("show"),
              n("rm"),
              n("mv"),
              n("state pull / push"),
              n("state replace-provider"),
              n("state force-unlock"),
            ],
            n("Basic / Advanced Commands")
          ),
        ],
      }),
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    stages: [
      s("Modules", {
        right: [
          g([
            n("Root vs Child Modules"),
            n("Published Modules Usage"),
            n("Creating Local Modules"),
            n("Inputs / Outputs"),
            n("Modules Best Practices"),
          ]),
        ],
      }),
      s("Provisioners", {
        right: [
          g([
            n("When to Use?"),
            n("Creation / Destroy Time"),
            n("file provisioner"),
            n("local-exec provisioner"),
            n("remote-exec provisioner"),
            n("Custom Provisioners"),
          ]),
        ],
      }),
      s("Data Sources"),
      s("Template Files"),
      s("Workspaces"),
    ],
  },
  {
    id: "cicd-testing",
    title: "CI/CD & Testing",
    stages: [
      s("CI / CD Integration", {
        right: [g([n("GitHub Actions"), n("Circle CI"), n("GitLab CI"), n("Jenkins")])],
      }),
      s("Testing", {
        right: [
          g([
            n("Unit Testing"),
            n("Contract Testing"),
            n("Integration Testing"),
            n("End to End Testing"),
            n("Testing Modules"),
          ]),
        ],
      }),
    ],
  },
  {
    id: "scaling-security",
    title: "Scaling & Security",
    stages: [
      s("Scaling Terraform", {
        right: [
          g([
            n("Splitting Large State"),
            n("Parallelism"),
            n("Deployment Workflow"),
            n("Terragrunt"),
            n("Infracost"),
            n("Secret Management"),
            n("Compliance / Sentinel"),
            n("Trivy"),
            n("KICS"),
          ]),
        ],
      }),
      s("Security", {
        right: [g([n("Terrascan"), n("Checkov")])],
      }),
      s("HCP", {
        right: [
          g([
            n("What and when to use HCP?"),
            n("Enterprise Features"),
            n("Authentication"),
            n("Workspaces"),
            n("VCS Integration"),
            n("Run Tasks"),
          ]),
        ],
      }),
    ],
  },
];
