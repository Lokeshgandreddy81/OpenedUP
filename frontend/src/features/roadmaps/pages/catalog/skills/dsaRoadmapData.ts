export type DsaRoadmapStatus = "personal" | "alternative" | "optional";

export interface DsaRoadmapNode {
  id: string;
  title: string;
  status?: DsaRoadmapStatus;
  roadmapId?: string;
}

export interface DsaRoadmapGroup {
  id: string;
  parent?: DsaRoadmapNode;
  items: DsaRoadmapNode[];
}

export interface DsaRoadmapStage {
  id: string;
  node: DsaRoadmapNode;
  left?: DsaRoadmapGroup[];
  right?: DsaRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DsaRoadmapSection {
  id: string;
  title?: string;
  stages: DsaRoadmapStage[];
}

export interface DsaRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DSA_MARKERS: Array<{
  status: DsaRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DSA_RELATED_ROADMAPS: DsaRoadmapLink[] = [
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "LeetCode Practice", roadmapId: "skill-leetcode" },
  { label: "C++ Programming", roadmapId: "skill-cpp" },
  { label: "Java Programming", roadmapId: "skill-java" },
  { label: "Python Programming", roadmapId: "skill-python" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Design and Architecture", roadmapId: "skill-design-architecture" },
];

export const DSA_CONTINUE_LEARNING: DsaRoadmapLink[] = [
  { label: "LeetCode Challenge", roadmapId: "skill-leetcode" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "Design & Architecture", roadmapId: "skill-design-architecture" },
  { label: "System Design", roadmapId: "skill-system-design" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DsaRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DsaRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DsaRoadmapNode[],
  parent?: DsaRoadmapNode,
  customId?: string
): DsaRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DsaRoadmapStage, "id" | "node"> & {
    status?: DsaRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): DsaRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. ASYMPTOTIC ANALYSIS & COMPLEXITY
const ASYMPTOTIC_ANALYSIS: DsaRoadmapSection = {
  id: "asymptotic-analysis-and-complexity",
  title: "Asymptotic Analysis & Big-O Notation",
  stages: [
    stage("Big-O Notation", {
      status: "personal",
      left: [
        g(
          [
            n("Worst Case — Big O (O)", "personal"),
            n("Average Case — Big Theta (Θ)"),
            n("Best Case — Big Omega (Ω)"),
            n("Little o and Little Omega (o, ω)", "optional"),
          ],
          n("Asymptotic Bounds")
        ),
      ],
      right: [
        g(
          [
            n("Time Complexity", "personal"),
            n("Space Complexity", "personal"),
            n("Auxiliary Space vs Input Space"),
            n("Amortized Analysis", "alternative"),
          ],
          n("Resource Complexities")
        ),
      ],
      noteAfter:
        "Asymptotic analysis models resource consumption growth as input size grows to infinity, abstracting away machine hardware differences.",
    }),
    stage("Complexity Classes", {
      left: [
        g(
          [
            n("Constant Time — O(1)", "personal"),
            n("Logarithmic Time — O(log n)", "personal"),
            n("Linear Time — O(n)", "personal"),
            n("Linearithmic Time — O(n log n)", "personal"),
          ],
          n("Sub-linear & Linear Growth")
        ),
      ],
      right: [
        g(
          [
            n("Quadratic Time — O(n²)", "personal"),
            n("Cubic Time — O(n³)"),
            n("Exponential Time — O(2ⁿ)"),
            n("Factorial Time — O(n!)"),
          ],
          n("Polynomial & Non-Polynomial")
        ),
      ],
    }),
  ],
};

// 2. CORE DATA STRUCTURES
const CORE_DATA_STRUCTURES: DsaRoadmapSection = {
  id: "core-data-structures",
  title: "Core Data Structures",
  stages: [
    stage("Arrays & Dynamic Arrays", {
      status: "personal",
      left: [
        g(
          [
            n("Static Arrays (Fixed Size)", "personal"),
            n("Dynamic Arrays (Vector / ArrayList)", "personal"),
            n("Memory Contiguity & CPU Caching"),
            n("Amortized O(1) Push Back"),
          ],
          n("Array Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Two Pointers Technique", "personal"),
            n("Sliding Window Technique", "personal"),
            n("Prefix Sum & Difference Arrays"),
            n("Kadane's Algorithm (Max Subarray)"),
          ],
          n("Essential Array Techniques")
        ),
      ],
    }),
    stage("Linked Lists", {
      left: [
        g(
          [
            n("Singly Linked List", "personal"),
            n("Doubly Linked List", "personal"),
            n("Circular Linked List"),
            n("Skip Lists", "optional"),
          ],
          n("Linked List Variants")
        ),
      ],
      right: [
        g(
          [
            n("Floyd's Tortoise and Hare (Cycle Detection)", "personal"),
            n("In-place List Reversal", "personal"),
            n("Dummy / Sentinel Nodes Technique"),
            n("Fast and Slow Pointer Median Finding"),
          ],
          n("Core List Algorithms")
        ),
      ],
    }),
    stage("Stacks & Queues", {
      status: "personal",
      left: [
        g(
          [
            n("Stack Invariant (LIFO)", "personal"),
            n("Array & Node Implementations"),
            n("Monotonic Stack", "personal"),
            n("Balanced Parentheses & RPN Evaluator"),
          ],
          n("Stack Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Queue Invariant (FIFO)", "personal"),
            n("Circular Buffer Queue"),
            n("Deque (Double-Ended Queue)", "personal"),
            n("Monotonic Deque (Sliding Window Maximum)"),
          ],
          n("Queue & Deque Primitives")
        ),
      ],
      projectIdea: "BUILD A BROWSER HISTORY ENGINE AND UNDO/REDO BUFFER USING STACKS",
    }),
    stage("Hash Tables & Hashing", {
      status: "personal",
      left: [
        g(
          [
            n("Hash Function Properties & Uniformity", "personal"),
            n("Hash Collisions & Birthday Paradox"),
            n("Load Factor & Dynamic Rehashing", "personal"),
            n("Bloom Filters", "optional"),
          ],
          n("Hashing Mechanics")
        ),
      ],
      right: [
        g(
          [
            n("Separate Chaining (Lists / Red-Black Trees)", "personal"),
            n("Open Addressing (Linear Probing)"),
            n("Quadratic Probing & Double Hashing"),
            n("Robin Hood Hashing & Cuckoo Hashing", "optional"),
          ],
          n("Collision Resolution Strategies")
        ),
      ],
      noteAfter:
        "Hash tables provide average O(1) lookups, insertions, and deletions, making them the most frequently utilized associative data structure.",
    }),
  ],
};

// 3. TREE DATA STRUCTURES
const TREE_DATA_STRUCTURES: DsaRoadmapSection = {
  id: "tree-data-structures",
  title: "Tree Data Structures",
  stages: [
    stage("Binary Trees & BST", {
      status: "personal",
      left: [
        g(
          [
            n("Binary Tree Node & Edge Properties"),
            n("Depth, Height & Diameter", "personal"),
            n("Traversals: Inorder, Preorder, Postorder", "personal"),
            n("Level-order Traversal (BFS)", "personal"),
          ],
          n("Binary Tree Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("BST Invariant Property", "personal"),
            n("BST Search, Insert & Delete O(h)", "personal"),
            n("Lowest Common Ancestor (LCA)", "personal"),
            n("Inorder Successor & Predecessor"),
          ],
          n("Binary Search Tree (BST)")
        ),
      ],
    }),
    stage("Self-Balancing Trees & Heaps", {
      status: "personal",
      left: [
        g(
          [
            n("AVL Trees (Balance Factor & Rotations)", "personal"),
            n("Red-Black Trees (Color Invariants)", "personal"),
            n("B-Trees and B+ Trees (Database Indexing)", "optional"),
            n("Treap & Splay Trees", "optional"),
          ],
          n("Balanced Search Trees")
        ),
      ],
      right: [
        g(
          [
            n("Min-Heap & Max-Heap Properties", "personal"),
            n("Binary Heap in Array Representation", "personal"),
            n("Heapify in O(n) & Push/Pop in O(log n)", "personal"),
            n("Priority Queue & Top-K Elements Pattern", "personal"),
          ],
          n("Heaps & Priority Queues")
        ),
      ],
      noteAfter:
        "Self-balancing trees preserve O(log n) guarantees against skewed degradation, while heaps optimize continuous priority retrieval in O(1).",
    }),
    stage("Tries & Advanced Trees", {
      left: [
        g(
          [
            n("Trie (Prefix Tree) Structure", "personal"),
            n("Word Insertion & Prefix Search O(L)", "personal"),
            n("Bitwise Trie (XOR Maximum)", "optional"),
            n("Compressed Trie (Radix Tree / Patricia)"),
          ],
          n("Trie & String Trees")
        ),
      ],
      right: [
        g(
          [
            n("Segment Tree (Range Queries & Updates)", "personal"),
            n("Lazy Propagation in Segment Trees"),
            n("Fenwick Tree (Binary Indexed Tree / BIT)", "personal"),
            n("Disjoint Set Union (DSU / Union-Find)", "personal"),
          ],
          n("Range Query & Disjoint Structures")
        ),
      ],
      projectIdea:
        "BUILD AN AUTOCOMPLETE SYSTEM & RANGE-SUM QUERY ENGINE USING TRIES AND SEGMENT TREES",
    }),
  ],
};

// 4. FUNDAMENTAL ALGORITHMS
const FUNDAMENTAL_ALGORITHMS: DsaRoadmapSection = {
  id: "fundamental-algorithms",
  title: "Fundamental Algorithms",
  stages: [
    stage("Searching & Binary Search", {
      status: "personal",
      left: [
        g(
          [
            n("Linear Search — O(n)"),
            n("Binary Search — O(log n)", "personal"),
            n("Binary Search on Sorted Arrays", "personal"),
            n("Lower Bound & Upper Bound (Bisect)", "personal"),
          ],
          n("Discrete Searching")
        ),
      ],
      right: [
        g(
          [
            n("Binary Search on Answer Space", "personal"),
            n("Search in Rotated Sorted Array"),
            n("Peak Index & Mountain Arrays"),
            n("Ternary Search (Unimodal Functions)", "optional"),
          ],
          n("Advanced Binary Search Patterns")
        ),
      ],
    }),
    stage("Sorting Algorithms", {
      status: "personal",
      left: [
        g(
          [
            n("QuickSort (Lomuto & Hoare Partition)", "personal"),
            n("MergeSort (Stable O(n log n))", "personal"),
            n("HeapSort (In-place O(n log n))", "personal"),
            n("Insertion, Selection & Bubble Sort"),
          ],
          n("Comparison-Based Sorts")
        ),
      ],
      right: [
        g(
          [
            n("Counting Sort (Non-comparison)", "personal"),
            n("Radix Sort (Digit by Digit)"),
            n("Bucket Sort (Uniform Distribution)"),
            n("Quickselect (O(n) Median / Order Statistic)", "personal"),
          ],
          n("Linear-Time Sorts & Selection")
        ),
      ],
      noteAfter:
        "Comparison sorts have a lower bound of Ω(n log n). Non-comparison sorting bypasses this by leveraging integer representations.",
    }),
    stage("Recursion & Backtracking", {
      status: "personal",
      left: [
        g(
          [
            n("Call Stack & Base Cases", "personal"),
            n("Recurrence Relations & Recursion Trees", "personal"),
            n("Tail Call Optimization"),
            n("Stack Overflow Prevention"),
          ],
          n("Recursion Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Generate Subsets & Power Set", "personal"),
            n("Permutations & Combinations", "personal"),
            n("N-Queens & Sudoku Solver", "personal"),
            n("Pruning & Branch-and-Bound", "personal"),
          ],
          n("Backtracking Strategies")
        ),
      ],
      projectIdea: "IMPLEMENT A SUDOKU SOLVER WITH BACKTRACKING AND CONSTRAINT PROPAGATION",
    }),
  ],
};

// 5. GRAPH DATA STRUCTURES & ALGORITHMS
const GRAPH_STRUCTURES_AND_ALGORITHMS: DsaRoadmapSection = {
  id: "graph-structures-and-algorithms",
  title: "Graph Data Structures & Representations",
  stages: [
    stage("Graph Representations & Traversals", {
      status: "personal",
      left: [
        g(
          [
            n("Adjacency Matrix vs Adjacency List", "personal"),
            n("Edge List Representation"),
            n("Directed vs Undirected Graphs"),
            n("Weighted, Cyclic & Bipartite Graphs"),
          ],
          n("Graph Representations")
        ),
      ],
      right: [
        g(
          [
            n("Breadth-First Search (BFS) O(V + E)", "personal"),
            n("Depth-First Search (DFS) O(V + E)", "personal"),
            n("Connected Components & Flood Fill", "personal"),
            n("Cycle Detection (Directed & Undirected)", "personal"),
          ],
          n("Core Graph Traversals")
        ),
      ],
    }),
    stage("Topological Sort & Connectivity", {
      left: [
        g(
          [
            n("Directed Acyclic Graph (DAG) Properties", "personal"),
            n("Kahn's Algorithm (In-degree Queue)", "personal"),
            n("DFS-Based Topological Sort", "personal"),
            n("Course Schedule / Task Dependency Resolution"),
          ],
          n("Topological Sorting")
        ),
      ],
      right: [
        g(
          [
            n("Kosaraju's Algorithm for SCC", "optional"),
            n("Tarjan's Strongly Connected Components", "personal"),
            n("Bridges & Articulation Points (Tarjan)"),
            n("Bipartite Graph Verification (2-Coloring)", "personal"),
          ],
          n("Strong Connectivity & Cuts")
        ),
      ],
    }),
    stage("Shortest Path & Spanning Trees", {
      status: "personal",
      left: [
        g(
          [
            n("Dijkstra's Algorithm (Priority Queue)", "personal"),
            n("Bellman-Ford Algorithm (Negative Weights)", "personal"),
            n("Floyd-Warshall (All-Pairs O(V³))"),
            n("A* Search Algorithm (Heuristic)", "optional"),
          ],
          n("Shortest Path Algorithms")
        ),
      ],
      right: [
        g(
          [
            n("Minimum Spanning Tree (MST) Concept", "personal"),
            n("Kruskal's Algorithm (with DSU)", "personal"),
            n("Prim's Algorithm (with Min-Heap)", "personal"),
            n("Cut Property & Cycle Property"),
          ],
          n("Minimum Spanning Trees")
        ),
      ],
      noteAfter:
        "Dijkstra solves single-source shortest path in non-negative weighted graphs in O((V + E) log V). Bellman-Ford can detect negative cycles.",
      projectIdea: "BUILD A ROAD GPS ROUTE PLANNER WITH DIJKSTRA AND A* HEURISTICS",
    }),
  ],
};

// 6. ADVANCED ALGORITHMIC PARADIGMS
const ADVANCED_ALGORITHMIC_PARADIGMS: DsaRoadmapSection = {
  id: "advanced-algorithmic-paradigms",
  title: "Advanced Algorithmic Paradigms",
  stages: [
    stage("Divide & Conquer & Greedy", {
      left: [
        g(
          [
            n("Master Theorem for Recurrences", "personal"),
            n("Binary Exponentiation O(log n)", "personal"),
            n("Strassen's Matrix Multiplication", "optional"),
            n("Karatsuba Integer Multiplication", "optional"),
          ],
          n("Divide & Conquer")
        ),
      ],
      right: [
        g(
          [
            n("Greedy Choice Property & Optimal Substructure", "personal"),
            n("Activity Selection / Interval Scheduling", "personal"),
            n("Huffman Coding (Data Compression)", "personal"),
            n("Fractional Knapsack Problem"),
          ],
          n("Greedy Algorithms")
        ),
      ],
    }),
    stage("Dynamic Programming (DP)", {
      status: "personal",
      left: [
        g(
          [
            n("Overlapping Subproblems & Optimal Substructure", "personal"),
            n("Memoization (Top-Down Approach)", "personal"),
            n("Tabulation (Bottom-Up Approach)", "personal"),
            n("Space Optimization & Rolling Arrays", "personal"),
          ],
          n("DP Foundations")
        ),
      ],
      right: [
        g(
          [
            n("0/1 Knapsack & Unbounded Knapsack", "personal"),
            n("Longest Common Subsequence (LCS)", "personal"),
            n("Longest Increasing Subsequence (LIS)", "personal"),
            n("Matrix Chain Multiplication & Interval DP"),
            n("Digit DP & Bitmask DP", "optional"),
          ],
          n("Core DP Patterns")
        ),
      ],
      noteAfter:
        "Dynamic programming trades memory for computational speed, storing answers to overlapping subproblems to prevent exponential recomputations.",
    }),
    stage("Bit Manipulation & Advanced Topics", {
      left: [
        g(
          [
            n("Bitwise Operators: AND, OR, XOR, NOT", "personal"),
            n("Left and Right Bit Shifts (<<, >>)", "personal"),
            n("Two's Complement & Sign Bit"),
            n("Check / Set / Clear / Toggle k-th Bit", "personal"),
          ],
          n("Bitwise Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Bitmasking for Combinatorics & Subsets", "personal"),
            n("Brian Kernighan's Algorithm (Count Set Bits)", "personal"),
            n("Meet in the Middle Technique", "optional"),
            n("Monotonic Queue & Matrix Exponentiation", "optional"),
          ],
          n("Bit Manipulation & Tricks")
        ),
      ],
      projectIdea: "CRACK THE LEETCODE 150 CORE PROBLEMS ACROSS ALL ALGORITHMIC PATTERNS",
    }),
  ],
};

export const DSA_SECTIONS: DsaRoadmapSection[] = [
  ASYMPTOTIC_ANALYSIS,
  CORE_DATA_STRUCTURES,
  TREE_DATA_STRUCTURES,
  FUNDAMENTAL_ALGORITHMS,
  GRAPH_STRUCTURES_AND_ALGORITHMS,
  ADVANCED_ALGORITHMIC_PARADIGMS,
];
