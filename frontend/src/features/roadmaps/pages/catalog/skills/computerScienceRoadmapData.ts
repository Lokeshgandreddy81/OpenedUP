export type ComputerScienceRoadmapStatus = "personal" | "alternative" | "optional";

export interface ComputerScienceRoadmapNode {
  id: string;
  title: string;
  status?: ComputerScienceRoadmapStatus;
  roadmapId?: string;
}

export interface ComputerScienceRoadmapGroup {
  id: string;
  parent?: ComputerScienceRoadmapNode;
  items: ComputerScienceRoadmapNode[];
}

export interface ComputerScienceRoadmapStage {
  id: string;
  node: ComputerScienceRoadmapNode;
  left?: ComputerScienceRoadmapGroup[];
  right?: ComputerScienceRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ComputerScienceRoadmapSection {
  id: string;
  title?: string;
  stages: ComputerScienceRoadmapStage[];
}

export interface ComputerScienceRoadmapLink {
  label: string;
  roadmapId: string;
}

export const COMPUTER_SCIENCE_MARKERS: Array<{
  status: ComputerScienceRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const COMPUTER_SCIENCE_RELATED_ROADMAPS: ComputerScienceRoadmapLink[] = [
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
  { label: "System Design Roadmap", roadmapId: "skill-system-design" },
  { label: "Software Design & Architecture", roadmapId: "skill-design-architecture" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "Network Engineer Roadmap", roadmapId: "network-engineer" },
  { label: "Cyber Security Roadmap", roadmapId: "cyber-security" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "API Design Roadmap", roadmapId: "skill-api-design" },
];

export const COMPUTER_SCIENCE_CONTINUE_LEARNING: ComputerScienceRoadmapLink[] = [
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Software Architecture", roadmapId: "skill-design-architecture" },
  { label: "LeetCode Practice", roadmapId: "skill-leetcode" },
  { label: "Linux Fundamentals", roadmapId: "skill-linux" },
  { label: "DevOps Engineering", roadmapId: "devops" },
  { label: "Network Engineer", roadmapId: "network-engineer" },
  { label: "Cyber Security", roadmapId: "cyber-security" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ComputerScienceRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ComputerScienceRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ComputerScienceRoadmapNode[],
  parent?: ComputerScienceRoadmapNode,
  customId?: string
): ComputerScienceRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ComputerScienceRoadmapStage, "id" | "node"> & {
    status?: ComputerScienceRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ComputerScienceRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. FOUNDATIONS & PROGRAMMING
const FOUNDATIONS_AND_PROGRAMMING: ComputerScienceRoadmapSection = {
  id: "foundations-and-programming",
  title: "Programming & Language Foundations",
  stages: [
    stage("Pick a Language", {
      status: "personal",
      left: [
        g(
          [
            n("C", "personal", "skill-c-programming", "lang-c"),
            n("C++", "alternative", "skill-cpp", "lang-cpp"),
            n("Rust", "alternative", "skill-rust", "lang-rust"),
            n("Go", "optional", "skill-go", "lang-go"),
          ],
          n("Systems Languages")
        ),
      ],
      right: [
        g(
          [
            n("Python", "personal", "skill-python", "lang-python"),
            n("Java", "optional", "skill-java", "lang-java"),
            n("C#", "optional", undefined, "lang-csharp"),
          ],
          n("Application Languages")
        ),
      ],
      noteAfter:
        "Start with a language that gives you a strong mental model of memory and pointers (like C or C++), alongside a versatile scripting language like Python.",
    }),
  ],
};

// 2. DATA STRUCTURES
const DATA_STRUCTURES_SECTION: ComputerScienceRoadmapSection = {
  id: "data-structures",
  title: "Data Structures",
  stages: [
    stage("Data Structures", {
      status: "personal",
      left: [
        g(
          [
            n("Array", "personal"),
            n("Linked List", "personal"),
            n("Stack", "personal"),
            n("Queue", "personal"),
            n("Hash Table", "personal"),
          ],
          n("Linear Data Structures")
        ),
        g(
          [
            n("Tree", "personal"),
            n("Binary Tree", "personal"),
            n("Binary Search Tree", "personal"),
            n("Full Binary Tree", "optional"),
            n("Complete Binary Tree", "optional"),
            n("Balanced Tree", "alternative", undefined, "balanced-tree"),
            n("Unbalanced Tree", "optional"),
          ],
          n("Trees")
        ),
      ],
      right: [
        g(
          [
            n("Graph", "personal"),
            n("Directed Graph", "personal"),
            n("Undirected Graph", "personal"),
            n("Spanning Tree", "optional"),
          ],
          n("Graphs")
        ),
        g(
          [n("Adjacency Matrix", "personal"), n("Adjacency List", "personal")],
          n("Representation")
        ),
        g([n("Heap", "personal")], n("Priority Queues & Heaps")),
      ],
      noteAfter:
        "Master core data structures and their memory layout, pointer manipulation, and asymptotic access characteristics.",
      projectIdea:
        "Implement dynamic arrays, doubly linked lists, and a hash map with collision resolution from scratch.",
    }),
  ],
};

// 3. ALGORITHMS & ASYMPTOTIC NOTATION
const ALGORITHMS_AND_COMPLEXITY: ComputerScienceRoadmapSection = {
  id: "algorithms-and-complexity",
  title: "Algorithms & Asymptotic Analysis",
  stages: [
    stage("Asymptotic Notation", {
      status: "personal",
      left: [
        g(
          [
            n("Big O", "personal"),
            n("Big-Theta", "personal"),
            n("Big Omega", "personal"),
            n("Small O", "optional"),
            n("Small Omega", "optional"),
          ],
          n("Asymptotic Bounds")
        ),
      ],
      right: [
        g(
          [
            n("Constant", "personal"),
            n("Logarithmic", "personal"),
            n("Linear", "personal"),
            n("Polynomial", "personal"),
            n("Exponential", "alternative"),
            n("Factorial", "alternative"),
          ],
          n("Common Runtimes")
        ),
      ],
      noteAfter:
        "Understand time and space complexity tradeoffs using mathematical limits and runtime growth curves.",
    }),
    stage("Common Algorithms", {
      status: "personal",
      left: [
        g(
          [
            n("Quick Sort", "personal"),
            n("Merge Sort", "personal"),
            n("Heap Sort", "alternative"),
            n("Insertion Sort", "optional"),
            n("Bubble Sort", "optional"),
            n("Selection Sort", "optional"),
          ],
          n("Sorting")
        ),
        g(
          [
            n("Binary Search", "personal"),
            n("Linear Search", "optional"),
            n("Tail Recursion", "personal"),
            n("Non-Tail Recursion", "optional"),
          ],
          n("Searching & Recursion")
        ),
        g(
          [
            n("Pre-Order Traversal", "personal"),
            n("In-Order Traversal", "personal"),
            n("Post Order Traversal", "personal"),
            n("Breadth First Search", "personal", undefined, "tree-bfs"),
            n("Depth First Search", "personal", undefined, "tree-dfs"),
          ],
          n("Tree Traversals")
        ),
      ],
      right: [
        g(
          [
            n("Breadth First Search", "personal", undefined, "graph-bfs"),
            n("Depth First Search", "personal", undefined, "graph-dfs"),
            n("Dijkstra's Algorithm", "personal", undefined, "graph-dijkstra"),
            n("Bellman Ford's Algorithm", "alternative"),
            n("A* Algorithm", "alternative"),
          ],
          n("Graph Algorithms")
        ),
        g(
          [
            n("Dijkstra's Algorithm", "personal", undefined, "greedy-dijkstra"),
            n("Kruskal's Algorithm", "personal"),
            n("Prim's Algorithm", "personal"),
            n("Huffman Coding", "alternative"),
            n("Ford-Fulkerson Algorithm", "optional"),
          ],
          n("Greedy Algorithms")
        ),
        g(
          [
            n("Solving N Queen Problem", "personal"),
            n("Finding Hamiltonian Paths", "alternative"),
            n("Maze Solving Problem", "alternative"),
            n("The Knight's Tour Problem", "optional"),
          ],
          n("Back Tracking")
        ),
        g(
          [n("LRU Cache", "personal"), n("LFU Cache", "alternative"), n("MFU Cache", "optional")],
          n("Caches")
        ),
      ],
      noteAfter:
        "Practice standard algorithmic patterns on LeetCode: sliding window, two pointers, greedy choices, dynamic programming, and backtracking.",
      projectIdea:
        "Build an interactive pathfinding and sorting algorithm visualizer with step-by-step playback.",
    }),
  ],
};

// 4. LOW-LEVEL ARCHITECTURE & STRING ALGORITHMS
const ARCHITECTURE_AND_STRINGS: ComputerScienceRoadmapSection = {
  id: "architecture-and-strings",
  title: "Computer Architecture & String Algorithms",
  stages: [
    stage("Low-Level Computational Primitives", {
      status: "personal",
      left: [
        g([n("Big Endian", "personal"), n("Little Endian", "personal")], n("Endianess")),
        g([n("ASCII", "personal"), n("Unicode", "personal")], n("Character Encodings")),
        g([n("Bitwise Operators", "personal")], n("Bit Manipulation")),
      ],
      right: [g([n("Floating Point Math", "personal")], n("Numerical Representation"))],
      noteAfter:
        "Appreciate IEEE 754 floating point precision issues, two's complement, and byte order differences across architectures.",
    }),
    stage("String Search & Manipulations", {
      status: "personal",
      left: [
        g(
          [
            n("Substring Search", "personal"),
            n("Brute Force Search", "optional"),
            n("Search Pattern in Text", "personal"),
            n("Suffix Arrays", "alternative"),
          ],
          n("Text & Pattern Processing")
        ),
      ],
      right: [
        g(
          [
            n("Knuth-Morris Pratt", "personal"),
            n("Boyer-Moore", "personal"),
            n("Robin-Karp", "alternative"),
            n("Rabin-Karp Algorithm", "alternative", undefined, "rabin-karp-full"),
          ],
          n("String Matching Algorithms")
        ),
      ],
      noteAfter:
        "String matching algorithms optimize text processing from naive O(N*M) down to linear O(N+M) time complexity.",
    }),
  ],
};

// 5. SOFTWARE DESIGN & MODELING
const SOFTWARE_DESIGN_SECTION: ComputerScienceRoadmapSection = {
  id: "software-design-and-modeling",
  title: "Software Design & Modeling",
  stages: [
    stage("Design Patterns & UML", {
      status: "personal",
      left: [
        g(
          [
            n("Class Diagrams", "personal"),
            n("Sequence Diagrams", "personal"),
            n("Usecase Diagrams", "optional"),
            n("Activity Diagrams", "optional"),
            n("Statemachine Diagrams", "optional"),
          ],
          n("Common UML Diagrams")
        ),
      ],
      right: [
        g(
          [
            n("GoF Design Patterns", "personal"),
            n("Architectural Patterns", "personal"),
            n("Dependency Injection", "personal"),
            n("Null Object Pattern", "optional"),
            n("Type Object Pattern", "optional"),
          ],
          n("Design Patterns")
        ),
      ],
      noteAfter:
        "Clean architecture and Gang of Four design patterns keep large codebases decoupled, testable, and maintainable.",
      projectIdea:
        "Design an extensible plugin architecture utilizing Factory, Observer, and Strategy patterns.",
    }),
  ],
};

// 6. THEORY OF COMPUTATION & MATHEMATICS
const THEORY_AND_COMPLEXITY: ComputerScienceRoadmapSection = {
  id: "theory-and-complexity",
  title: "Theory of Computation & Mathematics",
  stages: [
    stage("Basic Math Skills", {
      status: "personal",
      left: [
        g(
          [n("Probability", "personal"), n("Combinatorics", "personal")],
          n("Discrete Mathematics")
        ),
      ],
      right: [g([n("Tries", "personal")], n("Prefix Trees & Retrieval"))],
      noteAfter:
        "Discrete math, probability, and combinatorics provide the rigorous foundation required for algorithm analysis.",
    }),
    stage("Complexity Classes", {
      status: "personal",
      left: [
        g(
          [
            n("P", "personal"),
            n("NP", "personal"),
            n("P = NP", "personal"),
            n("NP Hard", "personal"),
            n("Co-NP", "optional"),
          ],
          n("Core Complexity Classes")
        ),
      ],
      right: [
        g(
          [
            n("Travelling Salesman Problem", "personal"),
            n("Knapsack Problem", "personal"),
            n("Longest Path Problem", "alternative"),
          ],
          n("NP Complete")
        ),
      ],
      noteAfter:
        "Understanding computational complexity and NP-completeness teaches you when to search for heuristics instead of exact solutions.",
    }),
  ],
};

// 7. NETWORKING, DATABASES & SYSTEMS
const SYSTEMS_AND_NETWORKING: ComputerScienceRoadmapSection = {
  id: "systems-databases-and-networking",
  title: "Systems, Databases & Networking",
  stages: [
    stage("Networking", {
      status: "personal",
      left: [
        g(
          [
            n("OSI Model", "personal"),
            n("TCP/IP Model", "personal"),
            n("DNS", "personal"),
            n("HTTP", "personal"),
            n("TLS & HTTPS", "personal"),
            n("Sockets", "personal"),
          ],
          n("Network Protocols & Models")
        ),
      ],
      right: [
        g(
          [n("Network Engineer Track", "optional", "network-engineer")],
          n("Specialized Networking")
        ),
      ],
      noteAfter:
        "Learn how packets travel through layers: from sockets and TCP handshakes to TLS encryption and application-layer protocols.",
    }),
    stage("Databases", {
      status: "personal",
      left: [
        g(
          [
            n("SQL vs NoSQL Databases", "personal"),
            n("Normalization / Denormalization", "personal"),
            n("Entity-Relationship Model", "personal"),
          ],
          n("Data Modeling")
        ),
        g(
          [n("DDL", "personal"), n("DML", "personal"), n("DQL", "personal"), n("DCL", "optional")],
          n("SQL Sublanguages")
        ),
      ],
      right: [
        g(
          [
            n("Locking", "personal"),
            n("ACID Model", "personal"),
            n("Transactions", "personal"),
            n("Indexes", "personal"),
            n("Views", "optional"),
            n("Stored Procedures", "optional"),
            n("BASE", "alternative"),
          ],
          n("Transactions & Internals")
        ),
        g(
          [
            n("CAP Theorem", "personal"),
            n("PACELC", "alternative"),
            n("Database Federation", "optional"),
            n("Replication", "personal"),
            n("Sharding", "personal"),
          ],
          n("Distributed Systems")
        ),
      ],
      noteAfter:
        "Relational ACID transactions versus distributed BASE guarantees determine how data stays consistent at scale.",
    }),
    stage("System Design", {
      status: "personal",
      roadmapId: "skill-system-design",
      left: [
        g(
          [
            n("Horizontal vs Vertical Scaling", "personal"),
            n("Load Balancing", "personal"),
            n("Clustering", "personal"),
            n("Caching", "personal"),
            n("CDN", "personal"),
            n("Queues", "personal"),
            n("Proxy", "personal"),
          ],
          n("Scalability & Resilience")
        ),
        g(
          [
            n("Architectural Styles", "personal"),
            n("REST", "personal"),
            n("GraphQL", "alternative"),
            n("gRPC", "alternative"),
            n("Cloud Design Patterns", "optional"),
          ],
          n("APIs & Integration")
        ),
      ],
      right: [
        g(
          [
            n("Long Polling", "optional"),
            n("Short Polling", "optional"),
            n("Web Sockets", "personal"),
            n("SSE", "alternative"),
          ],
          n("Real-Time Communication")
        ),
        g(
          [
            n("AVL Trees", "personal"),
            n("Red / Black Trees", "personal"),
            n("B-Tree", "personal"),
            n("2 3 Search Trees", "optional"),
            n("2 3 4 Trees", "optional"),
            n("K-ary / M-ary Tree", "optional"),
            n("K-D Trees", "optional"),
            n("Skip Lists", "alternative"),
          ],
          n("Balanced Search Trees")
        ),
      ],
      noteAfter:
        "System design combines load balancing, caching tiers, distributed messaging, and self-balancing index trees into production systems.",
      projectIdea:
        "Design and document an end-to-end distributed URL shortener or rate limiter handling 100K RPS.",
    }),
  ],
};

// 8. SECURITY & OPERATING SYSTEMS
const SECURITY_AND_OS: ComputerScienceRoadmapSection = {
  id: "security-and-os",
  title: "Security & Operating Systems",
  stages: [
    stage("Security", {
      status: "personal",
      roadmapId: "cyber-security",
      left: [
        g(
          [
            n("OWASP Top 10", "personal"),
            n("Public Key Cryptography", "personal"),
            n("Hashing / Encryption / Encoding", "personal"),
            n("Hashing Algorithms", "personal"),
          ],
          n("Cryptography & Web Security")
        ),
      ],
      right: [
        g([n("Cyber Security Track", "optional", "cyber-security")], n("Security Specialization")),
      ],
      noteAfter:
        "Security is non-negotiable: understand public-key infrastructure, cryptographic hashing, and application attack vectors.",
    }),
    stage("How Computers Work", {
      status: "personal",
      left: [
        g(
          [
            n("How CPU Executes Programs", "personal"),
            n("Registers and RAM", "personal"),
            n("Instructions and Programs", "personal"),
            n("CPU Cache", "personal"),
            n("How Computers Calculate", "personal"),
          ],
          n("Computer Hardware & Architecture")
        ),
      ],
      right: [g([n("CPU Interrupts", "personal")], n("Hardware Interrupts"))],
      noteAfter:
        "The fetch-decode-execute cycle, L1/L2/L3 cache hierarchies, and ALU calculations dictate real-world code execution speed.",
    }),
    stage("Processes and Threads", {
      status: "personal",
      left: [
        g(
          [
            n("Processes vs Threads", "personal"),
            n("Process Forking", "personal"),
            n("Memory Management", "personal"),
          ],
          n("OS Process Model")
        ),
      ],
      right: [
        g(
          [
            n("Lock / Mutex / Semaphore", "personal"),
            n("Concurrency in Multiple Cores", "personal"),
            n("Scheduling Algorithms", "personal"),
          ],
          n("Concurrency & Synchronization")
        ),
      ],
      noteAfter:
        "Concurrency primitives, race condition prevention, deadlock avoidance, and OS scheduling are critical for robust multi-threaded software.",
      projectIdea:
        "Build a multi-threaded thread pool or task scheduler with worker queues and mutex locks in C++ or Rust.",
    }),
  ],
};

export const COMPUTER_SCIENCE_SECTIONS: ComputerScienceRoadmapSection[] = [
  FOUNDATIONS_AND_PROGRAMMING,
  DATA_STRUCTURES_SECTION,
  ALGORITHMS_AND_COMPLEXITY,
  ARCHITECTURE_AND_STRINGS,
  SOFTWARE_DESIGN_SECTION,
  THEORY_AND_COMPLEXITY,
  SYSTEMS_AND_NETWORKING,
  SECURITY_AND_OS,
];
