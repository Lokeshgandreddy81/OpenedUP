export type CProgrammingRoadmapStatus = "personal" | "alternative" | "optional";

export interface CProgrammingRoadmapNode {
  id: string;
  title: string;
  status?: CProgrammingRoadmapStatus;
  roadmapId?: string;
}

export interface CProgrammingRoadmapGroup {
  id: string;
  parent?: CProgrammingRoadmapNode;
  items: CProgrammingRoadmapNode[];
}

export interface CProgrammingRoadmapStage {
  id: string;
  node: CProgrammingRoadmapNode;
  left?: CProgrammingRoadmapGroup[];
  right?: CProgrammingRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface CProgrammingRoadmapSection {
  id: string;
  title?: string;
  stages: CProgrammingRoadmapStage[];
}

export interface CProgrammingRoadmapLink {
  label: string;
  roadmapId: string;
}

export const C_PROGRAMMING_MARKERS: Array<{
  status: CProgrammingRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const C_PROGRAMMING_RELATED_ROADMAPS: CProgrammingRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "C++ Roadmap", roadmapId: "skill-cpp" },
  { label: "Rust Roadmap", roadmapId: "skill-rust" },
  { label: "Go Roadmap", roadmapId: "skill-go" },
];

export const C_PROGRAMMING_CONTINUE_LEARNING: CProgrammingRoadmapLink[] = [
  { label: "Linux", roadmapId: "skill-linux" },
  { label: "C++", roadmapId: "skill-cpp" },
  { label: "Network Engineer", roadmapId: "network-engineer" },
  { label: "Backend", roadmapId: "backend" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: CProgrammingRoadmapStatus,
  roadmapId?: string,
  customId?: string
): CProgrammingRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: CProgrammingRoadmapNode[],
  parent?: CProgrammingRoadmapNode,
  customId?: string
): CProgrammingRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<CProgrammingRoadmapStage, "id" | "node"> & {
    status?: CProgrammingRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): CProgrammingRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. LEARN THE BASICS
const LEARN_THE_BASICS: CProgrammingRoadmapSection = {
  id: "learn-the-basics",
  title: "Learn the Basics",
  stages: [
    stage("Introduction", {
      right: [
        g(
          [n("Applications"), n("C vs Assembly"), n("C vs C++", undefined, "skill-cpp")],
          n("Why Learn C?")
        ),
      ],
      left: [
        g([n("Installing C (GCC / Clang)"), n("Running your First Program")], n("Getting Started")),
      ],
      noteAfter:
        "C is an efficient, general-purpose procedural programming language created by Dennis Ritchie in 1972 at Bell Labs. It underpins operating systems, embedded hardware, compilers, and game engines worldwide.",
    }),
    stage("Setting up", {
      left: [
        g(
          [n("VSCode", "personal"), n("vim / nvim", "alternative"), n("CLion", "optional")],
          n("Code Editors / IDEs")
        ),
      ],
      right: [
        g(
          [n("GCC / Clang", "personal"), n("TinyCC", "alternative"), n("MSVC", "optional")],
          n("Compilers")
        ),
      ],
    }),
    stage("Variables", {
      left: [
        g(
          [
            n("integers (int, short, long)"),
            n("float"),
            n("double"),
            n("char"),
            n("booleans (stdbool.h)"),
          ],
          n("Basic Types")
        ),
      ],
      right: [
        g(
          [
            n("Declaration vs Definition"),
            n("Initialization"),
            n("Printing Variables (printf / scanf)"),
          ],
          n("Variable Lifecycle")
        ),
      ],
    }),
    stage("Data Types", {
      left: [
        g(
          [n("Fixed-width integers (stdint.h)"), n("Extended Types (size_t, ptrdiff_t)")],
          n("Width & Representation")
        ),
      ],
      right: [
        g(
          [n("const", "personal"), n("volatile"), n("restrict"), n("_Atomic")],
          n("Type Qualifiers")
        ),
        g([n("Implicit Type Conversion"), n("Explicit Casting")], n("Type Conversion")),
      ],
    }),
    stage("Operators", {
      left: [
        g(
          [
            n("Arithmetic (+, -, *, /, %)"),
            n("Comparison (==, !=, <, >)"),
            n("Logical (&&, ||, !)"),
            n("Bitwise (&, |, ^, ~, <<, >>)"),
            n("Ternary (? :)"),
          ],
          n("Operator Categories")
        ),
      ],
    }),
    stage("Control Flow", {
      right: [
        g(
          [n("if else / switch"), n("for / while / do while loops"), n("break / continue")],
          n("Conditionals & Branching")
        ),
      ],
    }),
    stage("Functions", {
      left: [
        g(
          [
            n("main Function"),
            n("Recursive Functions"),
            n("Variable Scopes"),
            n("Variadic Functions (stdarg.h)"),
            n("Command-Line Arguments (argc, argv)"),
          ],
          n("Function Primitives")
        ),
      ],
      projectIdea:
        "Project: Implement a CLI Scientific Calculator or Unit Converter with recursive evaluation",
    }),
  ],
};

// 2. CORE C
const CORE_C: CProgrammingRoadmapSection = {
  id: "core-c",
  title: "Core C",
  stages: [
    stage("Pointers & Memory", {
      right: [g([n("Memory Model"), n("Stack vs Heap"), n("Lifetime of Objects")], n("Memory"))],
      left: [
        g(
          [
            n("Pointer Basics & Syntax (&, *)"),
            n("Null Pointers (NULL)"),
            n("void Pointers (void*)"),
            n("Pointer Arithmetic"),
          ],
          n("Pointer Mechanics")
        ),
      ],
      noteAfter:
        "Mastering pointers is the defining hurdle in C. Pointers store direct hardware memory addresses, enabling manual resource control, zero-copy buffers, and reference passing.",
    }),
    stage("Arrays", {
      left: [
        g(
          [
            n("Single & Multi-dimensional Arrays"),
            n("Array Decay to Pointer"),
            n("Memory Layout & Bounds"),
          ],
          n("Array Fundamentals")
        ),
      ],
    }),
    stage("Strings", {
      right: [
        g(
          [
            n("Null-terminated char Arrays (\\0)"),
            n("string.h Utilities (strlen, strcpy, strcmp)"),
            n("Buffer Safety (strncpy, snprintf)"),
          ],
          n("C Strings")
        ),
      ],
    }),
    stage("User-Defined Types", {
      left: [g([n("Structs"), n("Typedef"), n("Unions"), n("Enums")], n("Compound Types"))],
    }),
    stage("Common Data Structures", {
      left: [
        g(
          [
            n("Dynamic Arrays"),
            n("Linked Lists (Singly & Doubly)"),
            n("Ring Buffers / FIFO Queues"),
            n("Hash Maps"),
          ],
          n("Data Structures")
        ),
      ],
      right: [
        g([n("malloc"), n("calloc"), n("realloc"), n("free")], n("Dynamic Allocation")),
        g([n("Memory Leakage"), n("Dangling Pointers")], n("Memory Pitfalls")),
      ],
    }),
    stage("Structuring Codebase", {
      left: [
        g(
          [
            n("Header Files (.h / .c separation)"),
            n("Linkage (Internal vs External)"),
            n("static Keyword"),
            n("extern Keyword"),
          ],
          n("Modularity & Scope")
        ),
      ],
      right: [g([n("Undefined Behavior (UB)"), n("Buffer Overflow")], n("Safety & Pitfalls"))],
    }),
    stage("Error Handling", {
      left: [
        g(
          [
            n("errno & strerror"),
            n("Exit Codes (EXIT_SUCCESS, EXIT_FAILURE)"),
            n("setjmp / longjmp"),
          ],
          n("Error Strategies")
        ),
      ],
    }),
    stage("File I/O", {
      left: [
        g(
          [
            n("Streams (stdin, stdout, stderr)"),
            n("File Pointers (FILE*, fopen, fclose)"),
            n("Binary vs Text Mode (fread, fwrite)"),
          ],
          n("I/O Operations")
        ),
      ],
    }),
    stage("Standard Library", {
      right: [
        g(
          [
            n("Input / Output (stdio.h)"),
            n("Data Utilities (stdlib.h)"),
            n("Text Processing (string.h, ctype.h)"),
            n("Math & Time (math.h, time.h)"),
            n("Diagnostics & Limits (assert.h, limits.h)"),
            n("OS & Signal Interfaces (signal.h)"),
          ],
          n("C Standard Library (libc)")
        ),
      ],
    }),
    stage("Build & Compilation", {
      left: [
        g(
          [
            n("Macros (#define, #undef)"),
            n("Conditional Compilation (#ifdef, #ifndef)"),
            n("Predefined Macros (__FILE__, __LINE__)"),
          ],
          n("Preprocessors")
        ),
        g(
          [n("Optimization Levels (-O0, -O2, -O3)"), n("Symbol Tables & Stripping")],
          n("Compiler Stages")
        ),
      ],
    }),
    stage("Debugging", {
      right: [
        g([n("GDB", "personal"), n("LLDB", "alternative"), n("WinDbg")], n("Debuggers")),
        g(
          [
            n("Valgrind (Memcheck)", "personal"),
            n("strace"),
            n("ASan & LSan (Address / Leak Sanitizers)"),
          ],
          n("Sanitizers & Profilers")
        ),
      ],
    }),
    stage("Testing", {
      right: [
        g(
          [
            n("assert.h"),
            n("Unity", "personal"),
            n("CMocka", "alternative"),
            n("Check", "optional"),
          ],
          n("Unit Testing Frameworks")
        ),
      ],
      projectIdea:
        "Project: Implement a generic dynamic array (vector) & hash map with comprehensive unit tests and zero Valgrind leaks",
    }),
  ],
};

// 3. ADVANCED C
const ADVANCED_C: CProgrammingRoadmapSection = {
  id: "advanced-c",
  title: "Advanced C",
  stages: [
    stage("Idioms & Design Patterns", {
      right: [
        g(
          [
            n("Function pointers & Callbacks"),
            n("Opaque Pointers (Encapsulation)"),
            n("Object-Oriented C (Vtables & Struct Embedding)"),
            n("RAII-Simulated Cleanup (__attribute__((cleanup)))"),
          ],
          n("C Idioms & Patterns")
        ),
      ],
      left: [
        g(
          [
            n("Linking (Static vs Dynamic, .a / .so / .dll)"),
            n("Application Binary Interface (ABI)"),
          ],
          n("Linking & ABI")
        ),
        g(
          [
            n("GNU Make", "personal"),
            n("CMake", "personal"),
            n("Ninja", "alternative"),
            n("Meson", "optional"),
          ],
          n("Build Systems")
        ),
      ],
    }),
    stage("Concurrency", {
      right: [
        g(
          [
            n("POSIX Threads (pthread_create, pthread_join)"),
            n("Mutexes & Condition Variables"),
            n("Inter-Process Communication (IPC)"),
          ],
          n("Threading & Synchronization")
        ),
      ],
      left: [g([n("vcpkg", "personal"), n("Conan", "alternative")], n("Package Managers"))],
    }),
    stage("Process Management", {
      left: [
        g(
          [
            n("fork / exec / waitpid"),
            n("Signals & Signal Handling"),
            n("UNIX Domain Sockets & Pipes"),
          ],
          n("POSIX System Calls")
        ),
      ],
      noteAfter:
        "Low-level process management, shared memory, and socket interfaces empower developers to build production-grade daemons, network services, and micro-kernels.",
    }),
    stage("C Standards", {
      right: [
        g(
          [
            n("C89 / C90 (ANSI C)"),
            n("C99 (VLAs, inline, stdint.h)", "personal"),
            n("C11 (Threads, generics, _Static_assert)"),
            n("C17 (Bug fixes & clarifications)"),
            n("C23 (constexpr, typeof, auto, nullptr)"),
          ],
          n("Language Evolution")
        ),
      ],
      projectIdea:
        "Project: Build a multi-threaded HTTP web server or custom UNIX command-line shell with job control from scratch",
    }),
  ],
};

export const C_PROGRAMMING_SECTIONS: CProgrammingRoadmapSection[] = [
  LEARN_THE_BASICS,
  CORE_C,
  ADVANCED_C,
];
