export type FullStackRoadmapStatus = "personal" | "alternative" | "optional";

export interface FullStackRoadmapNode {
  id: string;
  title: string;
  status?: FullStackRoadmapStatus;
  roadmapId?: string;
  projectIdea?: boolean;
}

export interface FullStackRoadmapGroup {
  id: string;
  parent?: FullStackRoadmapNode;
  items: FullStackRoadmapNode[];
}

export interface FullStackRoadmapStage {
  id: string;
  node: FullStackRoadmapNode;
  left?: FullStackRoadmapGroup[];
  right?: FullStackRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface FullStackRoadmapSection {
  id: string;
  title?: string;
  stages: FullStackRoadmapStage[];
}

export interface FullStackRoadmapLink {
  label: string;
  roadmapId: string;
}

export const FULLSTACK_MARKERS: Array<{
  status: FullStackRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const FULLSTACK_RELATED_ROADMAPS: FullStackRoadmapLink[] = [
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
];

export const FULLSTACK_CONTINUE_LEARNING: FullStackRoadmapLink[] = [
  { label: "Frontend", roadmapId: "frontend" },
  { label: "Backend", roadmapId: "backend" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "AWS", roadmapId: "best-practice-aws" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: FullStackRoadmapStatus,
  roadmapId?: string,
  projectIdea?: boolean
): FullStackRoadmapNode => ({
  id: slug(title),
  title,
  status,
  roadmapId,
  projectIdea,
});

const g = (
  items: FullStackRoadmapNode[],
  parent?: FullStackRoadmapNode
): FullStackRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<FullStackRoadmapStage, "id" | "node"> & {
    status?: FullStackRoadmapStatus;
  } = {}
): FullStackRoadmapStage => {
  const { status, ...rest } = options;

  return {
    id: slug(title),
    node: n(title, status),
    ...rest,
  };
};

const FOUNDATIONS: FullStackRoadmapSection = {
  id: "foundations",
  stages: [
    stage("HTML", {
      projectIdea: "Checkpoint - Static Webpages",
    }),
    stage("CSS"),
    stage("JavaScript", {
      projectIdea: "Checkpoint - Interactivity",
    }),
    stage("npm", {
      right: [g([n("Checkpoint - External Packages", undefined, undefined, true)])],
    }),
    stage("Git", {
      left: [g([n("Checkpoint - Collaborative Work", undefined, undefined, true)])],
    }),
    stage("GitHub"),
    stage("Tailwind CSS"),
    stage("React", {
      noteAfter: "Feel free to skip these and revisit after learning Backend",
      projectIdea: "Checkpoint - Frontend Apps",
    }),
  ],
};

const BACKEND: FullStackRoadmapSection = {
  id: "backend",
  title: "Backend Starts here",
  stages: [
    stage("Node.js", {
      status: "personal",
      right: [g([n("Checkpoint — CLI Apps", undefined, undefined, true)])],
    }),
    stage("PostgreSQL", {
      right: [g([n("Checkpoint — Simple CRUD Apps", undefined, undefined, true)])],
    }),
    stage("RESTful APIs"),
    stage("JWT Auth"),
    stage("Redis", {
      projectIdea: "Checkpoint — Complete App",
    }),
  ],
};

const DEVOPS: FullStackRoadmapSection = {
  id: "devops",
  title: "DevOps starts here",
  stages: [
    stage("Linux Basics"),
    stage("Basic AWS Services", {
      right: [g([n("Route53"), n("SES"), n("EC2"), n("VPC"), n("S3")])],
    }),
    stage("Monit", {
      right: [g([n("Checkpoint — Deployment", undefined, undefined, true)])],
    }),
    stage("GitHub Actions"),
    stage("Checkpoint — Monitoring", {
      projectIdea: "Checkpoint — Monitoring",
    }),
    stage("Ansible", {
      left: [g([n("Checkpoint — Automation", undefined, undefined, true)])],
      right: [g([n("Checkpoint — CI / CD", undefined, undefined, true)])],
    }),
    stage("Terraform", {
      projectIdea: "Checkpoint — Infrastructure",
    }),
  ],
};

export const FULLSTACK_SECTIONS: FullStackRoadmapSection[] = [FOUNDATIONS, BACKEND, DEVOPS];
