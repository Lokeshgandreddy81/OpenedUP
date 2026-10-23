export type PhpRoadmapStatus = "personal" | "alternative" | "optional";

export interface PhpRoadmapNode {
  id: string;
  title: string;
  status?: PhpRoadmapStatus;
  roadmapId?: string;
}

export interface PhpRoadmapGroup {
  id: string;
  parent?: PhpRoadmapNode;
  items: PhpRoadmapNode[];
}

export interface PhpRoadmapStage {
  id: string;
  node: PhpRoadmapNode;
  left?: PhpRoadmapGroup[];
  right?: PhpRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface PhpRoadmapSection {
  id: string;
  title?: string;
  stages: PhpRoadmapStage[];
}

export interface PhpRoadmapLink {
  label: string;
  roadmapId: string;
}

export const PHP_MARKERS: Array<{
  status: PhpRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const PHP_RELATED_ROADMAPS: PhpRoadmapLink[] = [
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "System Design Roadmap", roadmapId: "system-design" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "Software Design Architecture Roadmap", roadmapId: "software-design-architecture" },
];

export const PHP_CONTINUE_LEARNING: PhpRoadmapLink[] = [
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "System Design Roadmap", roadmapId: "system-design" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "Software Design Architecture Roadmap", roadmapId: "software-design-architecture" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: PhpRoadmapStatus,
  roadmapId?: string,
  customId?: string
): PhpRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: PhpRoadmapNode[],
  parent?: PhpRoadmapNode,
  customId?: string
): PhpRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<PhpRoadmapStage, "id" | "node"> & {
    status?: PhpRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): PhpRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: PhpRoadmapSection = {
  id: "phase-1",
  title:
    "Phase 1 \u2014 Find the detailed version of this roadmap along with other similar roadmaps",
  stages: [
    stage("Find the detailed version of this roadmap along with other similar roadmaps", {
      status: "personal",
      left: [g([n("Related Roadmaps"), n("Constants")])],
      right: [g([n("Testing Tools")])],
    }),
    stage("Static Analysis", {
      status: "personal",
      left: [g([n("What is PHP?")])],
      right: [g([n("Evolution and History"), n("PHP Versions and Features"), n("PHPStan")])],
    }),
    stage("Style Tools", {
      status: "personal",
      right: [g([n("Static Analysis")])],
    }),
    stage("Introduction to PHP", {
      status: "personal",
      left: [g([n("Basic PHP Syntax"), n("Variables and Scope"), n("Development Environment")])],
      right: [g([n("WAMP"), n("XAMPP"), n("MAMP")])],
    }),
    stage("Development Environment", {
      status: "personal",
      left: [g([n("Data Types"), n("Casting Data Types")])],
      right: [g([n("LAMP"), n("Local Server"), n("Installing PHP")])],
    }),
    stage("Installing PHP", {
      status: "personal",
    }),
  ],
};

const SECTION_2: PhpRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Learn the Fundamentals",
  stages: [
    stage("Learn the Fundamentals", {
      status: "personal",
      left: [g([n("echo"), n("print"), n("var_dump"), n("print_r")])],
      right: [
        g([n("if/else"), n("switch"), n("match"), n("Null Coalescing Operator"), n("Arrays")]),
      ],
    }),
    stage("Arrays", {
      status: "personal",
      left: [
        g([
          n("Indexed Arrays"),
          n("Output and Debugging"),
          n("Associative Arrays"),
          n("Multi-dimensional Arrays"),
        ]),
      ],
      right: [g([n("Null Safe Operator"), n("Conditionals")])],
    }),
    stage("Conditionals", {
      status: "personal",
      left: [
        g([
          n("Function Declaration"),
          n("Parameters / Return Values"),
          n("Default / Optional Params"),
          n("Named Arguments"),
          n("Anonymous Functions"),
        ]),
      ],
      right: [g([n("File Handling"), n("Loops")])],
    }),
    stage("Functions", {
      status: "personal",
      left: [g([n("Callback Functions"), n("Arrow Functions")])],
    }),
    stage("Loops", {
      status: "personal",
      left: [g([n("Functions")])],
    }),
    stage("HTTP Methods", {
      status: "personal",
      left: [
        g([
          n("$_GET"),
          n("$_POST"),
          n("Recursion"),
          n("$_REQUEST"),
          n("Variadic Functions"),
          n("$_SERVER"),
        ]),
      ],
      right: [
        g([
          n("require"),
          n("require_once"),
          n("include"),
          n("include_once"),
          n("Include and Require Files"),
        ]),
      ],
    }),
  ],
};

const SECTION_3: PhpRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Form Processing",
  stages: [
    stage("Form Processing", {
      status: "personal",
      left: [
        g([
          n("CSV Processing"),
          n("JSON Processing"),
          n("HTTP / Request Handling"),
          n("XML Processing"),
          n("Super Global Variables"),
        ]),
      ],
      right: [
        g([
          n("Reading Files"),
          n("Writing Files"),
          n("File Permissions"),
          n("File Operations"),
          n("File Operations"),
          n("Cookies"),
          n("Sessions"),
          n("Input Validation"),
          n("SQL Injection"),
        ]),
      ],
    }),
    stage("State Management", {
      status: "personal",
      right: [g([n("CSRF Protection"), n("XSS Prevention")])],
    }),
    stage("File Uploads", {
      status: "personal",
      right: [g([n("State Management")])],
    }),
    stage("Working with Databases", {
      status: "personal",
      left: [
        g([
          n("Object-Relational Mapping (ORM)"),
          n("PDO"),
          n("MySQLi"),
          n("Database Transactions"),
          n("Database Connectivity"),
          n("Connection Pooling"),
        ]),
      ],
      right: [
        g([
          n("Auth Mechanisms"),
          n("Password Hashing"),
          n("Sanitization Techniques"),
          n("Basics of Security"),
        ]),
      ],
    }),
    stage("OOP Fundamentals", {
      status: "personal",
      left: [
        g([
          n("Performance Optimization"),
          n("Database Migrations"),
          n("Advanced Database Techniques"),
          n("Object Oriented Programming"),
          n("Polymorphism"),
          n("Abstract classes"),
          n("Interfaces"),
          n("More OOP Concepts"),
        ]),
      ],
      right: [
        g([
          n("Classes and Objects"),
          n("Constructor / Destructor"),
          n("Properties and Methods"),
          n("Access Specifiers"),
          n("Static Methods and Properties"),
          n("Inheritance"),
        ]),
      ],
    }),
    stage("More OOP Concepts", {
      status: "personal",
      left: [
        g([
          n("Traits"),
          n("Namespaces"),
          n("Magic methods"),
          n("Dependency injection"),
          n("Composer"),
          n("Type Declarations"),
        ]),
      ],
      right: [
        g([n("Frameworks & Tools"), n("Laravel"), n("Yii"), n("Symfony"), n("Popular Frameworks")]),
      ],
    }),
  ],
};

const SECTION_4: PhpRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 PHP-FIG",
  stages: [
    stage("PHP-FIG", {
      status: "personal",
      left: [
        g([
          n("Packagist"),
          n("Autoloading"),
          n("Package Management"),
          n("PSR Standards"),
          n("External Integrations"),
          n("cURL"),
          n("Guzzle"),
          n("Advanced PHP Topics"),
          n("Profiling Techniques"),
          n("Executing System Commands"),
          n("Caching Strategies"),
          n("Process Control"),
          n("Memory Management"),
          n("Environment Variables"),
        ]),
      ],
      right: [
        g([
          n("PHPUnit"),
          n("Pest"),
          n("PHPCodeSniffer"),
          n("PHP CS Fixer"),
          n("Psalm"),
          n("Phan"),
          n("Xdebug"),
          n("Zend Debugger"),
        ]),
      ],
    }),
    stage("Visit the following relevant tracks to learn more", {
      status: "personal",
      left: [
        g([
          n("PHP-FPM"),
          n("Visit DevOps Beginner Roadmap"),
          n("Performance Optimization"),
          n("Backend"),
          n("System Design"),
          n("Configuration Tuning"),
          n("Configuration Files"),
          n("Opcode Caching"),
          n("System Interactions"),
        ]),
      ],
      right: [
        g([
          n("Nginx"),
          n("Web Servers"),
          n("DevOps"),
          n("Laravel"),
          n("Debugging Tools"),
          n("Apache"),
        ]),
      ],
    }),
  ],
};

export const PHP_SECTIONS: PhpRoadmapSection[] = [SECTION_1, SECTION_2, SECTION_3, SECTION_4];
