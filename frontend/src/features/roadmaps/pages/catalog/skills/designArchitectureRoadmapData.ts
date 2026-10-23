export type DesignArchitectureRoadmapStatus = "personal" | "alternative" | "optional";

export interface DesignArchitectureRoadmapNode {
  id: string;
  title: string;
  status?: DesignArchitectureRoadmapStatus;
  roadmapId?: string;
}

export interface DesignArchitectureRoadmapGroup {
  id: string;
  parent?: DesignArchitectureRoadmapNode;
  items: DesignArchitectureRoadmapNode[];
}

export interface DesignArchitectureRoadmapStage {
  id: string;
  node: DesignArchitectureRoadmapNode;
  left?: DesignArchitectureRoadmapGroup[];
  right?: DesignArchitectureRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DesignArchitectureRoadmapSection {
  id: string;
  title?: string;
  stages: DesignArchitectureRoadmapStage[];
}

export interface DesignArchitectureRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DESIGN_ARCHITECTURE_MARKERS: Array<{
  status: DesignArchitectureRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DESIGN_ARCHITECTURE_RELATED_ROADMAPS: DesignArchitectureRoadmapLink[] = [
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Code Review", roadmapId: "skill-code-review" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
  { label: "Docker", roadmapId: "skill-docker" },
  { label: "Kubernetes", roadmapId: "skill-kubernetes" },
];

export const DESIGN_ARCHITECTURE_CONTINUE_LEARNING: DesignArchitectureRoadmapLink[] = [
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Code Review", roadmapId: "skill-code-review" },
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DesignArchitectureRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DesignArchitectureRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DesignArchitectureRoadmapNode[],
  parent?: DesignArchitectureRoadmapNode,
  customId?: string
): DesignArchitectureRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DesignArchitectureRoadmapStage, "id" | "node"> & {
    status?: DesignArchitectureRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): DesignArchitectureRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. PROGRAMMING PARADIGMS & FUNDAMENTALS
const PARADIGMS_AND_FUNDAMENTALS: DesignArchitectureRoadmapSection = {
  id: "paradigms-and-fundamentals",
  title: "Programming Paradigms & Fundamentals",
  stages: [
    stage("Programming Paradigms", {
      status: "personal",
      left: [
        g(
          [
            n("Encapsulation & Data Hiding", "personal"),
            n("Inheritance vs Composition", "personal"),
            n("Polymorphism (Subtyping & Parametric)", "personal"),
            n("Abstraction & Interface Contracts"),
          ],
          n("Object-Oriented Programming (OOP)")
        ),
      ],
      right: [
        g(
          [
            n("Pure Functions & Immutability", "personal"),
            n("First-Class & Higher-Order Functions", "personal"),
            n("Declarative vs Imperative Flow"),
            n("Procedural & Structured Programming", "alternative"),
          ],
          n("Functional & Procedural Paradigms")
        ),
      ],
    }),
    stage("Core Design Principles", {
      status: "personal",
      left: [
        g(
          [
            n("Single Responsibility Principle (SRP)", "personal"),
            n("Open/Closed Principle (OCP)", "personal"),
            n("Liskov Substitution Principle (LSP)", "personal"),
            n("Interface Segregation Principle (ISP)", "personal"),
            n("Dependency Inversion Principle (DIP)", "personal"),
          ],
          n("SOLID Principles")
        ),
      ],
      right: [
        g(
          [
            n("DRY (Don't Repeat Yourself)", "personal"),
            n("KISS (Keep It Simple, Stupid)", "personal"),
            n("YAGNI (You Aren't Gonna Need It)", "personal"),
            n("Law of Demeter (Principle of Least Knowledge)"),
            n("Separation of Concerns (SoC)", "personal"),
          ],
          n("Pragmatic Software Principles")
        ),
      ],
      noteAfter:
        "Principles guide code cleanliness, maintainability, and extensibility, guarding against brittle codebases that resist change and scale poorly.",
    }),
  ],
};

// 2. CREATIONAL DESIGN PATTERNS
const CREATIONAL_PATTERNS: DesignArchitectureRoadmapSection = {
  id: "creational-patterns",
  title: "Creational Design Patterns",
  stages: [
    stage("Factory Patterns", {
      status: "personal",
      left: [
        g(
          [
            n("Simple Factory Idiom"),
            n("Factory Method Pattern", "personal"),
            n("Polymorphic Instantiation"),
            n("Parameter-Driven Creators"),
          ],
          n("Factory Method Mechanics")
        ),
      ],
      right: [
        g(
          [
            n("Abstract Factory Pattern", "personal"),
            n("Families of Related Objects", "personal"),
            n("Cross-Platform UI Toolkits Example"),
            n("Decoupling Concrete Implementations"),
          ],
          n("Abstract Factory Mechanics")
        ),
      ],
    }),
    stage("Instance Construction & Cloning", {
      status: "personal",
      left: [
        g(
          [
            n("Singleton Pattern", "alternative"),
            n("Thread Safety & Double-Checked Locking"),
            n("Bill Pugh Singleton & Enum Singleton"),
            n("Inversion of Control (IoC) Singletons", "personal"),
          ],
          n("Singleton & Global State")
        ),
      ],
      right: [
        g(
          [
            n("Builder Pattern", "personal"),
            n("Fluent Interface / Method Chaining", "personal"),
            n("Director vs Step Builder"),
            n("Prototype Pattern (Shallow vs Deep Copy)", "alternative"),
          ],
          n("Builder & Prototype")
        ),
      ],
      projectIdea: "BUILD A MODULAR CROSS-PLATFORM UI / DOCUMENT EXPORT FACTORY AND BUILDER ENGINE",
      noteAfter:
        "Creational patterns abstract the instantiation process, decoupling a system from how its objects are created, composed, and represented.",
    }),
  ],
};

// 3. STRUCTURAL DESIGN PATTERNS
const STRUCTURAL_PATTERNS: DesignArchitectureRoadmapSection = {
  id: "structural-patterns",
  title: "Structural Design Patterns",
  stages: [
    stage("Adapters & Proxies", {
      status: "personal",
      left: [
        g(
          [
            n("Adapter Pattern (Class vs Object Adapter)", "personal"),
            n("Legacy API Wrappers & Third-Party Integration"),
            n("Two-Way Adapters", "optional"),
          ],
          n("Adapter Mechanics")
        ),
      ],
      right: [
        g(
          [
            n("Proxy Pattern", "personal"),
            n("Virtual Proxy (Lazy Loading)", "personal"),
            n("Protection / Auth Proxy"),
            n("Remote Proxy & Caching Proxy"),
          ],
          n("Proxy Patterns")
        ),
      ],
    }),
    stage("Composition & Interfaces", {
      status: "personal",
      left: [
        g(
          [
            n("Decorator Pattern (Dynamic Behavior)", "personal"),
            n("Composable Middleware & Streams", "personal"),
            n("Decorator vs Subclassing Explosion"),
          ],
          n("Decorator & Wrapping")
        ),
      ],
      right: [
        g(
          [
            n("Facade Pattern (Simplified Subsystems)", "personal"),
            n("Composite Pattern (Tree Hierarchies)", "personal"),
            n("Bridge Pattern (Decouple Abstraction & Implementation)", "alternative"),
            n("Flyweight Pattern (Memory Optimization)", "optional"),
          ],
          n("System Abstraction & Composition")
        ),
      ],
      noteAfter:
        "Structural patterns assemble classes and objects into larger structures while keeping these structures flexible and efficient.",
      projectIdea:
        "DEVELOP AN EXTENSIBLE HTTP CLIENT MIDDLEWARE PIPELINE USING DECORATORS AND PROXIES",
    }),
  ],
};

// 4. BEHAVIORAL DESIGN PATTERNS
const BEHAVIORAL_PATTERNS: DesignArchitectureRoadmapSection = {
  id: "behavioral-patterns",
  title: "Behavioral Design Patterns",
  stages: [
    stage("Strategy & Observer", {
      status: "personal",
      left: [
        g(
          [
            n("Strategy Pattern", "personal"),
            n("Interchangeable Algorithms at Runtime", "personal"),
            n("Dependency Injection of Strategies", "personal"),
            n("Payment / Compression / Routing Handlers"),
          ],
          n("Strategy Mechanics")
        ),
      ],
      right: [
        g(
          [
            n("Observer Pattern", "personal"),
            n("Subject & Observer Registration", "personal"),
            n("Push vs Pull Notification Models"),
            n("Pub-Sub Event Buses & Event Emitters", "personal"),
          ],
          n("Observer & Pub-Sub")
        ),
      ],
    }),
    stage("Command, State & Template Method", {
      status: "personal",
      left: [
        g(
          [
            n("Command Pattern", "personal"),
            n("Encapsulated Requests & Actions", "personal"),
            n("Undo / Redo Operation Stacks"),
            n("Task Queues & Transactional Commands"),
          ],
          n("Command & Action Queue")
        ),
      ],
      right: [
        g(
          [
            n("State Pattern (Finite State Machines)", "personal"),
            n("State Transitions without Conditionals"),
            n("Template Method Pattern (Hook Methods)", "personal"),
            n("Inversion of Control (Hollywood Principle)"),
          ],
          n("State & Template Behaviors")
        ),
      ],
    }),
    stage("Coordination & Responsibility", {
      left: [
        g(
          [
            n("Chain of Responsibility Pattern", "personal"),
            n("Request Processing Pipeline / Middleware", "personal"),
            n("Short-circuiting vs Propagating"),
            n("Mediator Pattern (Decentralized Decoupling)", "personal"),
          ],
          n("Pipelines & Mediation")
        ),
      ],
      right: [
        g(
          [
            n("Iterator Pattern (Traversals & Generators)", "personal"),
            n("Visitor Pattern (Double Dispatch)", "optional"),
            n("Memento Pattern (State Snapshots)", "optional"),
            n("Interpreter Pattern (Domain Specific Grammar)", "optional"),
          ],
          n("Traversal & Domain Patterns")
        ),
      ],
      projectIdea:
        "BUILD A WORKFLOW EXECUTION ENGINE WITH CHAIN OF RESPONSIBILITY AND COMMAND PATTERNS",
    }),
  ],
};

// 5. ARCHITECTURAL PATTERNS & STYLES
const ARCHITECTURAL_PATTERNS: DesignArchitectureRoadmapSection = {
  id: "architectural-patterns",
  title: "Architectural Patterns & Styles",
  stages: [
    stage("Monolithic & Layered Architecture", {
      status: "personal",
      left: [
        g(
          [
            n("Monolithic Architecture (Single Deployable)", "personal"),
            n("Modular Monolith (Bounded Modules)", "personal"),
            n("Shared Database & In-Process Communication"),
            n("Monolith First Strategy"),
          ],
          n("Monolith Architectures")
        ),
      ],
      right: [
        g(
          [
            n("Layered / N-Tier Architecture", "personal"),
            n("Presentation / API Layer", "personal"),
            n("Business Logic / Domain Layer", "personal"),
            n("Data Access / Persistence Layer", "personal"),
          ],
          n("Layered / Tiered Structures")
        ),
      ],
    }),
    stage("Domain-Centric Architectures", {
      status: "personal",
      left: [
        g(
          [
            n("Clean Architecture (Uncle Bob)", "personal"),
            n("The Dependency Rule (Inward Direction)", "personal"),
            n("Entities & Use Cases (Interactors)", "personal"),
            n("Interface Adapters & Framework Isolation"),
          ],
          n("Clean Architecture")
        ),
      ],
      right: [
        g(
          [
            n("Hexagonal Architecture (Ports & Adapters)", "personal"),
            n("Primary / Inbound Ports & Driver Adapters", "personal"),
            n("Secondary / Outbound Ports & Driven Adapters", "personal"),
            n("Onion Architecture & Domain-Driven Design (DDD)"),
          ],
          n("Hexagonal & Onion Styles")
        ),
      ],
      noteAfter:
        "Domain-centric architectures decouple business rules from external technologies like UI, databases, and third-party frameworks to ensure maximum testability.",
    }),
    stage("Distributed & Event-Driven Architecture", {
      status: "personal",
      left: [
        g(
          [
            n("Microservices Architecture", "personal"),
            n("Database per Service & Loose Coupling", "personal"),
            n("API Gateway Pattern & BFF (Backend-For-Frontend)", "personal"),
            n("Service Discovery & Mesh"),
          ],
          n("Microservices Architecture")
        ),
      ],
      right: [
        g(
          [
            n("Event-Driven Architecture (EDA)", "personal"),
            n("CQRS (Command Query Responsibility Segregation)", "personal"),
            n("Event Sourcing (Append-Only Event Stream)", "personal"),
            n("Saga Pattern (Choreography vs Orchestration)", "personal"),
          ],
          n("Event-Driven & CQRS")
        ),
      ],
      projectIdea:
        "ARCHITECT AN E-COMMERCE ORDER DISPATCH ENGINE WITH CQRS, SAGA AND EVENT SOURCING",
    }),
  ],
};

// 6. SYSTEM QUALITY ATTRIBUTES & GOVERNANCE
const QUALITY_ATTRIBUTES_AND_GOVERNANCE: DesignArchitectureRoadmapSection = {
  id: "quality-attributes-and-governance",
  title: "System Quality Attributes & Governance",
  stages: [
    stage("Quality Attributes (-ilities)", {
      status: "personal",
      left: [
        g(
          [
            n("Scalability (Horizontal vs Vertical)", "personal"),
            n("Reliability, Availability & SLA / SLO / SLI", "personal"),
            n("Fault Tolerance & Resiliency Patterns"),
            n("Circuit Breaker, Retry & Rate Limiting", "personal"),
          ],
          n("Scalability & Resilience")
        ),
      ],
      right: [
        g(
          [
            n("Maintainability & High Cohesion / Low Coupling", "personal"),
            n("Testability & Test Pyramid"),
            n("Security (Defense-in-Depth & Zero Trust)", "personal"),
            n("Performance & Latency Optimization"),
          ],
          n("Maintainability & Security")
        ),
      ],
    }),
    stage("Architecture Governance & Evolution", {
      status: "personal",
      left: [
        g(
          [
            n("Architecture Decision Records (ADRs)", "personal"),
            n("C4 Model (Context, Container, Component, Code)", "personal"),
            n("Technical Debt Management & Refactoring", "personal"),
            n("Fitness Functions (Evolutionary Architecture)"),
          ],
          n("Documentation & Governance")
        ),
      ],
      right: [
        g(
          [
            n("Strangler Fig Pattern (Legacy Migration)", "personal"),
            n("Anti-Corruption Layer (ACL)", "personal"),
            n("Canary & Blue-Green Deployment Strategies"),
            n("Observability & Distributed Tracing (OpenTelemetry)", "personal"),
          ],
          n("System Evolution & Migration")
        ),
      ],
      noteAfter:
        "Documenting architectural decisions (ADRs) and continuously testing architectural fitness functions guarantees sustainable system evolution.",
      projectIdea:
        "AUTHOR FORMAL ADRS AND DESIGN A C4 ARCHITECTURE MODEL FOR A DISTRIBUTED ENTERPRISE APPLICATION",
    }),
  ],
};

export const DESIGN_ARCHITECTURE_SECTIONS: DesignArchitectureRoadmapSection[] = [
  PARADIGMS_AND_FUNDAMENTALS,
  CREATIONAL_PATTERNS,
  STRUCTURAL_PATTERNS,
  BEHAVIORAL_PATTERNS,
  ARCHITECTURAL_PATTERNS,
  QUALITY_ATTRIBUTES_AND_GOVERNANCE,
];
