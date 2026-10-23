export type LaravelRoadmapStatus = "personal" | "alternative" | "optional";

export interface LaravelRoadmapNode {
  id: string;
  title: string;
  status?: LaravelRoadmapStatus;
  roadmapId?: string;
}

export interface LaravelRoadmapGroup {
  id: string;
  parent?: LaravelRoadmapNode;
  items: LaravelRoadmapNode[];
}

export interface LaravelRoadmapStage {
  id: string;
  node: LaravelRoadmapNode;
  left?: LaravelRoadmapGroup[];
  right?: LaravelRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface LaravelRoadmapSection {
  id: string;
  title?: string;
  stages: LaravelRoadmapStage[];
}

export interface LaravelRoadmapLink {
  label: string;
  roadmapId: string;
}

export const LARAVEL_MARKERS: Array<{
  status: LaravelRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const LARAVEL_RELATED_ROADMAPS: LaravelRoadmapLink[] = [
  { label: "Php Roadmap", roadmapId: "skill-php" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
  { label: "System Design Roadmap", roadmapId: "system-design" },
  { label: "Software Architect Roadmap", roadmapId: "software-architect" },
];

export const LARAVEL_CONTINUE_LEARNING: LaravelRoadmapLink[] = [
  { label: "Php Roadmap", roadmapId: "skill-php" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Full Stack Roadmap", roadmapId: "full-stack" },
  { label: "System Design Roadmap", roadmapId: "system-design" },
  { label: "Software Architect Roadmap", roadmapId: "software-architect" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: LaravelRoadmapStatus,
  roadmapId?: string,
  customId?: string
): LaravelRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: LaravelRoadmapNode[],
  parent?: LaravelRoadmapNode,
  customId?: string
): LaravelRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<LaravelRoadmapStage, "id" | "node"> & {
    status?: LaravelRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): LaravelRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: LaravelRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Installing Laravel",
  stages: [
    stage("Installing Laravel", {
      status: "personal",
      left: [
        g([
          n("PHP Roadmap"),
          n("Laravel Herd"),
          n("Yor First App"),
          n("What is Laravel?"),
          n("Related Roadmaps"),
        ]),
      ],
      right: [
        g([
          n("Why Web Frameworks?"),
          n("Laravel for Full Stack"),
          n("Laravel for Frontend"),
          n("Inertia"),
          n("Livewire"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("What is Laravel?", {
      status: "personal",
    }),
    stage("Create a new project", {
      status: "personal",
      left: [g([n("Project Structure"), n("App"), n("Bootstrap"), n("Config"), n("Database")])],
      right: [g([n("Breeze"), n("Jetstream"), n("Starter Kits")])],
    }),
    stage("Starter Kits", {
      status: "personal",
    }),
    stage("Request\u2013Response Flow", {
      status: "personal",
      left: [g([n("Public"), n("Resources"), n("Routes"), n("Storage")])],
    }),
    stage("Routing & Controllers", {
      status: "personal",
      left: [g([n("Tests"), n("Vendor")])],
      right: [g([n("Route model binding"), n("Rate limiting"), n("Basic Routes")])],
    }),
    stage("Basic Routes", {
      status: "personal",
      right: [g([n("CORS"), n("Caching")])],
    }),
    stage("View Routes", {
      status: "personal",
    }),
    stage("Redirect Routes", {
      status: "personal",
      right: [g([n("Advanced Routing")])],
    }),
    stage("Route parameters", {
      status: "personal",
    }),
  ],
};

const SECTION_2: LaravelRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Named routes",
  stages: [
    stage("Named routes", {
      status: "personal",
      right: [g([n("Views & Blade")])],
    }),
    stage("Basic controllers", {
      status: "personal",
    }),
    stage("Route groups", {
      status: "personal",
    }),
    stage("Resource controllers", {
      status: "personal",
      left: [g([n("Global vs Route"), n("CRUD Operations")])],
    }),
    stage("Single-action controllers", {
      status: "personal",
      left: [g([n("Relationships")])],
    }),
    stage("Dependency injection", {
      status: "personal",
      left: [g([n("Casts, Accessors"), n("Middleware")])],
    }),
    stage("Blade Templating", {
      status: "personal",
      left: [g([n("Query scopes")])],
      right: [g([n("if, else"), n("loops")])],
    }),
    stage("Databases & Eloquent", {
      status: "personal",
      left: [g([n("Configuration")])],
    }),
    stage("Configuration", {
      status: "personal",
      left: [g([n("Eloquent ORM")])],
    }),
    stage("Blade + Livewire", {
      status: "personal",
      left: [g([n("Databases & Eloquent")])],
    }),
  ],
};

const SECTION_3: LaravelRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Query Builder",
  stages: [
    stage("Query Builder", {
      status: "personal",
      left: [g([n("Files")])],
      right: [g([n("Views")])],
    }),
    stage("Migrations, seeders", {
      status: "personal",
      left: [g([n("JSON")])],
      right: [g([n("Redirects")])],
    }),
    stage("Requests & Responses", {
      status: "personal",
      left: [g([n("Streamed Responses")])],
      right: [g([n("Retrieving data & files")])],
    }),
    stage("Pagination", {
      status: "personal",
      left: [g([n("Gates"), n("Policies"), n("Requests & Responses")])],
    }),
    stage("Retrieving data & files", {
      status: "personal",
      right: [g([n("Creating Responses")])],
    }),
    stage("Creating Responses", {
      status: "personal",
      right: [g([n("Forms"), n("Manual validation")])],
    }),
    stage("Authorization", {
      status: "personal",
      left: [g([n("Logging & Debugging")])],
      right: [
        g([
          n("Error messages"),
          n("With Starter Kits"),
          n("Validation"),
          n("Manual Authentication"),
          n("Sanctum"),
          n("Passport"),
        ]),
      ],
    }),
    stage("Authentication", {
      status: "personal",
      left: [g([n("Authorization")])],
    }),
    stage("Encryption & Hashing", {
      status: "personal",
      right: [g([n("Error Handling"), n("Handling Exceptions")])],
    }),
    stage("Logging Basics", {
      status: "personal",
      left: [g([n("Pest")])],
      right: [
        g([
          n("Telescope"),
          n("Debugbar"),
          n("Message Customization"),
          n("HTTP Exceptions"),
          n("PHPUnit"),
        ]),
      ],
    }),
  ],
};

const SECTION_4: LaravelRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Log Stacks & Messages",
  stages: [
    stage("Log Stacks & Messages", {
      status: "personal",
      left: [g([n("Testing")])],
      right: [g([n("Advanced Features"), n("Debugging basics")])],
    }),
    stage("Unit & Feature tests", {
      status: "personal",
      left: [g([n("CLIs"), n("Artisan"), n("Sail")])],
      right: [g([n("Configuration")])],
    }),
    stage("Queues & Jobs", {
      status: "personal",
      left: [g([n("Code Style"), n("Pint"), n("Performance")])],
      right: [g([n("Optimization"), n("Health Route")])],
    }),
    stage("Events & Listeners", {
      status: "personal",
      left: [g([n("Octane")])],
      right: [g([n("Deployment Options")])],
    }),
    stage("Notifications", {
      status: "personal",
      left: [g([n("Monitoring")])],
      right: [g([n("Laravel Cloud")])],
    }),
    stage("Task Schedulling", {
      status: "personal",
      left: [g([n("Pulse")])],
      right: [g([n("Laravel Forge")])],
    }),
    stage("Localization", {
      status: "personal",
      left: [g([n("Tools and Packages")])],
    }),
    stage("Package Management", {
      status: "personal",
      right: [g([n("Deployment")])],
    }),
    stage("Deployment", {
      status: "personal",
      left: [g([n("PHP"), n("Visit the following roadmaps to keep learning")])],
      right: [g([n("Backend"), n("Full Stack")])],
    }),
  ],
};

export const LARAVEL_SECTIONS: LaravelRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
