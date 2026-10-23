export type CppRoadmapStatus = "personal" | "alternative" | "optional";

export interface CppRoadmapNode {
  id: string;
  title: string;
  status?: CppRoadmapStatus;
  roadmapId?: string;
}

export interface CppRoadmapGroup {
  id: string;
  parent?: CppRoadmapNode;
  items: CppRoadmapNode[];
}

export interface CppRoadmapStage {
  id: string;
  node: CppRoadmapNode;
  left?: CppRoadmapGroup[];
  right?: CppRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface CppRoadmapSection {
  id: string;
  title?: string;
  stages: CppRoadmapStage[];
}

export interface CppRoadmapLink {
  label: string;
  roadmapId: string;
}

export const CPP_MARKERS: Array<{
  status: CppRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const CPP_RELATED_ROADMAPS: CppRoadmapLink[] = [
  { label: "Rust Roadmap", roadmapId: "skill-rust" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "Java Roadmap", roadmapId: "skill-java" },
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
  { label: "C Programming", roadmapId: "skill-c-programming" },
];

export const CPP_CONTINUE_LEARNING: CppRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Rust Developer", roadmapId: "skill-rust" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
  { label: "DevOps Engineer", roadmapId: "devops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: CppRoadmapStatus,
  roadmapId?: string,
  customId?: string
): CppRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: CppRoadmapNode[],
  parent?: CppRoadmapNode,
  customId?: string
): CppRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<CppRoadmapStage, "id" | "node"> & {
    status?: CppRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): CppRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status ?? "personal", roadmapId, customId),
    ...rest,
  };
};

// 1. GETTING STARTED & ENVIRONMENT
const GETTING_STARTED: CppRoadmapSection = {
  id: "getting-started",
  title: "Getting Started & Environment",
  stages: [
    stage("Introduction to Language", {
      left: [
        g(
          [
            n("What is C++?", "personal"),
            n("Why use C++", "personal"),
            n("C vs C++", "personal", "skill-c-programming"),
          ],
          n("Language Overview")
        ),
      ],
      right: [
        g(
          [
            n("Compiled vs Interpreted", "personal"),
            n("Multi-Paradigm Paradigm", "personal"),
            n("Zero-Cost Abstractions", "personal"),
          ],
          n("Core Philosophy")
        ),
      ],
      noteAfter:
        "C++ is a compiled, general-purpose programming language that provides fine-grained hardware control, high execution speed, and rich abstractions.",
    }),
    stage("Setting up your Environment", {
      left: [
        g(
          [n("Installing C++", "personal"), n("Running your First Program", "personal")],
          n("Toolchain Setup")
        ),
      ],
      right: [
        g(
          [n("Code Editors / IDEs", "personal"), n("VS Code / CLion / Visual Studio", "personal")],
          n("Development Environment")
        ),
      ],
      projectIdea: "Project Idea: Number Guessing Game & Simple Expense Tracker CLI",
    }),
  ],
};

// 2. LANGUAGE FUNDAMENTALS & CONTROL FLOW
const FUNDAMENTALS_AND_FLOW: CppRoadmapSection = {
  id: "fundamentals-and-flow",
  title: "Language Fundamentals & Control Flow",
  stages: [
    stage("Basic Operations", {
      left: [
        g(
          [n("Arithmetic Operators", "personal"), n("Logical Operators", "personal")],
          n("Fundamental Operators")
        ),
      ],
      right: [
        g(
          [n("Bitwise Operators", "alternative"), n("Compound & Assignment Operators", "personal")],
          n("Low-Level Operators")
        ),
      ],
    }),
    stage("Control Flow & Statements", {
      left: [g([n("if else / switch / goto", "personal")], n("Conditional Branches"))],
      right: [
        g(
          [n("for / while / do while loops", "personal"), n("Range-based for loops", "personal")],
          n("Loop Constructs")
        ),
      ],
    }),
    stage("Functions", {
      left: [
        g(
          [n("Function Overloading", "personal"), n("Operator Overloading", "alternative")],
          n("Overloading Mechanisms")
        ),
      ],
      right: [
        g(
          [n("Lambdas", "alternative"), n("Static Polymorphism", "personal")],
          n("Callable Objects")
        ),
      ],
      projectIdea: "Project Idea: Temperature Converter & Mathematical Calculator CLI",
    }),
  ],
};

// 3. TYPES & MEMORY ARCHITECTURE
const TYPES_AND_MEMORY: CppRoadmapSection = {
  id: "types-and-memory",
  title: "Types & Memory Management",
  stages: [
    stage("Data Types", {
      left: [
        g(
          [n("Static Typing", "alternative"), n("Fundamental & Primitive Types", "personal")],
          n("Static System")
        ),
      ],
      right: [
        g([n("Dynamic Typing", "alternative"), n("RTTI", "alternative")], n("Type Introspection")),
      ],
    }),
    stage("Pointers and References", {
      left: [
        g(
          [
            n("References", "personal"),
            n("Memory Model", "personal"),
            n("Lifetime of Objects", "personal"),
          ],
          n("Memory Semantics")
        ),
        g(
          [n("New/Delete Operators", "personal"), n("Memory Leakage", "personal")],
          n("Raw Pointers")
        ),
      ],
      right: [
        g(
          [n("unique_ptr", "personal"), n("shared_ptr", "personal"), n("weak_ptr", "alternative")],
          n("Smart Pointers")
        ),
      ],
      noteAfter:
        "Modern C++ emphasizes RAII (Resource Acquisition Is Initialization). Strongly prefer smart pointers (unique_ptr and shared_ptr) over raw new/delete to ensure deterministic cleanup and zero leaks.",
      projectIdea: "Project Idea: Custom Dynamic Array & Singly Linked List from Scratch",
    }),
  ],
};

// 4. ARCHITECTURE & OBJECT-ORIENTED PROGRAMMING
const ARCHITECTURE_AND_OOP: CppRoadmapSection = {
  id: "architecture-and-oop",
  title: "Architecture & Object-Oriented Programming",
  stages: [
    stage("Structuring Codebase", {
      left: [g([n("Scope", "personal"), n("Namespaces", "personal")], n("Scoping & Isolation"))],
      right: [
        g(
          [n("Headers / CPP Files", "personal"), n("Forward Declaration", "personal")],
          n("Compilation Units")
        ),
      ],
    }),
    stage("Structures and Classes", {
      left: [
        g(
          [
            n("Object Oriented Programming", "personal"),
            n("Dynamic Polymorphism", "personal"),
            n("Virtual Methods", "personal"),
            n("Virtual Tables", "personal"),
          ],
          n("Polymorphism & Dispatch")
        ),
      ],
      right: [
        g(
          [
            n("Multiple Inheritance", "alternative"),
            n("Diamond Inheritance", "alternative"),
            n("Rule of Zero, Five, Three", "alternative"),
          ],
          n("Inheritance & Lifecycle")
        ),
      ],
      projectIdea: "Project Idea: Banking System Simulator with Class Hierarchies",
    }),
  ],
};

// 5. ERROR HANDLING & LANGUAGE CONCEPTS
const ERROR_HANDLING_AND_CONCEPTS: CppRoadmapSection = {
  id: "error-handling-and-concepts",
  title: "Error Handling & Language Nuances",
  stages: [
    stage("Exception Handling", {
      left: [g([n("Exit Codes", "personal")], n("Process Level"))],
      right: [
        g([n("Exceptions", "personal"), n("Access Violations", "personal")], n("Exception Flow")),
      ],
    }),
    stage("Language Concepts", {
      left: [
        g(
          [
            n("auto (Automatic Type Deduction)", "personal"),
            n("Undefined Behavior (UB)", "alternative"),
            n("Argument Dependent Lookup (ADL)", "alternative"),
            n("Name Mangling", "optional"),
            n("Macros", "alternative"),
          ],
          n("Core Mechanics")
        ),
      ],
      right: [
        g(
          [
            n("static_cast", "personal"),
            n("dynamic_cast", "alternative"),
            n("const_cast", "personal"),
            n("reinterpret_cast", "alternative"),
          ],
          n("Type Casting")
        ),
      ],
      noteAfter:
        "Undefined Behavior (UB) allows aggressive compiler optimizations but can lead to silent data corruption or security bugs. Use static analysis, sanitizers, and safe casting.",
    }),
  ],
};

// 6. TEMPLATES & STANDARD LIBRARY (STL)
const TEMPLATES_AND_STL: CppRoadmapSection = {
  id: "templates-and-stl",
  title: "Templates & Standard Library (STL)",
  stages: [
    stage("Templates", {
      left: [
        g(
          [
            n("Full Template Specialization", "alternative"),
            n("Partial Template Specialization", "alternative"),
          ],
          n("Template Specialization")
        ),
      ],
      right: [
        g(
          [
            n("Variadic Templates", "alternative"),
            n("Type Traits", "alternative"),
            n("SFINAE", "alternative"),
          ],
          n("Template Metaprogramming")
        ),
      ],
    }),
    stage("Standard Library + STL", {
      left: [
        g(
          [n("Containers", "personal"), n("Iterators", "personal"), n("Algorithms", "personal")],
          n("Containers & Algorithms")
        ),
      ],
      right: [
        g(
          [
            n("iostream", "personal"),
            n("Date / Time", "personal"),
            n("Multithreading", "alternative"),
          ],
          n("I/O & Concurrency")
        ),
      ],
      noteAfter:
        "The STL is the heart of C++. Master core sequence and associative containers (std::vector, std::unordered_map), algorithms (std::sort, std::find), and <thread>/<mutex> for concurrency.",
      projectIdea: "Project Idea: In-Memory Key-Value Cache / Custom Threadpool Engine",
    }),
  ],
};

// 7. IDIOMS & MODERN STANDARDS
const IDIOMS_AND_STANDARDS: CppRoadmapSection = {
  id: "idioms-and-standards",
  title: "Idioms & Modern Standards",
  stages: [
    stage("Idioms", {
      left: [
        g(
          [
            n("RAII", "personal"),
            n("Non-Copyable / Non-Moveable", "alternative"),
            n("Copy and Swap", "alternative"),
            n("Copy on Write", "alternative"),
          ],
          n("Resource Idioms")
        ),
      ],
      right: [
        g(
          [n("Erase-Remove", "alternative"), n("Pimpl", "alternative"), n("CRTP", "alternative")],
          n("Design Patterns")
        ),
      ],
    }),
    stage("Standards", {
      left: [g([n("C++ 11 / 14", "personal"), n("C++ 17", "personal")], n("Modern Foundations"))],
      right: [
        g(
          [n("C++ 20", "alternative"), n("C++ 23", "alternative"), n("C++ 0x", "optional")],
          n("Contemporary Standards")
        ),
      ],
    }),
  ],
};

// 8. TOOLING, COMPILERS & BUILD SYSTEMS
const TOOLING_AND_COMPILERS: CppRoadmapSection = {
  id: "tooling-and-compilers",
  title: "Tooling, Compilers & Build Systems",
  stages: [
    stage("Debuggers", {
      left: [g([n("GDB", "optional"), n("WinDBg", "optional")], n("Interactive Debuggers"))],
      right: [
        g(
          [n("Debugging Symbols", "personal"), n("Understanding Debugger Messages", "personal")],
          n("Diagnostic Skills")
        ),
      ],
    }),
    stage("Compilers", {
      left: [
        g(
          [n("Compiler Stages", "personal"), n("Compilers and Features", "optional")],
          n("Compilation Pipeline")
        ),
      ],
      right: [
        g(
          [
            n("GCC", "personal"),
            n("C/lang++ / LLVM", "personal"),
            n("MSVS C++", "personal"),
            n("MinGW", "optional"),
            n("Intel C++", "optional"),
          ],
          n("Major Compilers")
        ),
      ],
    }),
    stage("Build Systems", {
      left: [g([n("CMAKE", "alternative")], n("Industry Standard"))],
      right: [g([n("Makefile", "optional"), n("Ninja", "optional")], n("Build Generators"))],
    }),
    stage("Package Managers", {
      left: [g([n("vcpkg", "optional"), n("Conan", "optional")], n("Cross-Platform Managers"))],
      right: [g([n("Spack", "optional"), n("NuGet", "optional")], n("Ecosystem Packaging"))],
    }),
  ],
};

// 9. ECOSYSTEM, LIBRARIES & TESTING
const LIBRARIES_AND_ECOSYSTEM: CppRoadmapSection = {
  id: "libraries-and-ecosystem",
  title: "Libraries, Ecosystem & Testing",
  stages: [
    stage("Working with Libraries", {
      left: [
        g(
          [n("Library Inclusion", "personal"), n("Licensing", "personal")],
          n("Dependency Integration")
        ),
        g(
          [
            n("Boost", "alternative"),
            n("fmt", "optional"),
            n("spdlog", "optional"),
            n("protobuf", "optional"),
            n("gRPC", "optional"),
            n("pybind11", "optional"),
            n("POCO", "optional"),
            n("ranges_v3", "optional"),
          ],
          n("Libraries")
        ),
      ],
      right: [
        g(
          [n("OpenCV", "optional"), n("Tensorflow", "optional"), n("opencl", "optional")],
          n("Domain Libraries")
        ),
        g(
          [
            n("gtest / gmock", "alternative"),
            n("Catch2", "optional"),
            n("Qt", "optional"),
            n("PyTorch C++", "optional"),
            n("Orbit Profiler", "optional"),
          ],
          n("Frameworks & Testing")
        ),
      ],
      projectIdea:
        "Project Idea: High-Performance Database Backup & Restore Utility / Caching Server",
    }),
  ],
};

export const CPP_SECTIONS: CppRoadmapSection[] = [
  GETTING_STARTED,
  FUNDAMENTALS_AND_FLOW,
  TYPES_AND_MEMORY,
  ARCHITECTURE_AND_OOP,
  ERROR_HANDLING_AND_CONCEPTS,
  TEMPLATES_AND_STL,
  IDIOMS_AND_STANDARDS,
  TOOLING_AND_COMPILERS,
  LIBRARIES_AND_ECOSYSTEM,
];
