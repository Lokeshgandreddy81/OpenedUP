export type LeetCodeRoadmapStatus = "personal" | "alternative" | "optional";

export interface LeetCodeRoadmapNode {
  id: string;
  title: string;
  status?: LeetCodeRoadmapStatus;
  roadmapId?: string;
}

export interface LeetCodeRoadmapGroup {
  id: string;
  parent?: LeetCodeRoadmapNode;
  items: LeetCodeRoadmapNode[];
}

export interface LeetCodeRoadmapStage {
  id: string;
  node: LeetCodeRoadmapNode;
  left?: LeetCodeRoadmapGroup[];
  right?: LeetCodeRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface LeetCodeRoadmapSection {
  id: string;
  title?: string;
  stages: LeetCodeRoadmapStage[];
}

export interface LeetCodeRoadmapLink {
  label: string;
  roadmapId: string;
}

export const LEETCODE_MARKERS: Array<{
  status: LeetCodeRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const LEETCODE_RELATED_ROADMAPS: LeetCodeRoadmapLink[] = [
  { label: "Datastructures And Algorithms Roadmap", roadmapId: "datastructures-and-algorithms" },
];

export const LEETCODE_CONTINUE_LEARNING: LeetCodeRoadmapLink[] = [
  { label: "Datastructures And Algorithms Roadmap", roadmapId: "datastructures-and-algorithms" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: LeetCodeRoadmapStatus,
  roadmapId?: string,
  customId?: string
): LeetCodeRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: LeetCodeRoadmapNode[],
  parent?: LeetCodeRoadmapNode,
  customId?: string
): LeetCodeRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<LeetCodeRoadmapStage, "id" | "node"> & {
    status?: LeetCodeRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): LeetCodeRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: LeetCodeRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 What is LeetCode",
  stages: [
    stage("What is LeetCode", {
      status: "personal",
      left: [g([n("Interview Preparation Tips"), n("Related Roadmaps")])],
      right: [
        g([
          n("Python"),
          n("JavaScript"),
          n("Java"),
          n("Ruby"),
          n("C"),
          n("C++"),
          n("Go"),
          n("Rust"),
          n("Two Sum"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("What are coding patterns?", {
      status: "personal",
      right: [g([n("Valid Anagram")])],
    }),
    stage("Pick a language", {
      status: "personal",
      left: [g([n("Valid Palindrome")])],
      right: [g([n("Contains Duplicate"), n("Arrays & Hashing")])],
    }),
    stage("Arrays & Hashing", {
      status: "personal",
      left: [g([n("3Sum"), n("Container With Most Water"), n("Trapping Rain Water")])],
      right: [
        g([
          n("Group Anagrams"),
          n("Top K Frequent Elements"),
          n("More Exercises"),
          n("Two Pointers"),
        ]),
      ],
    }),
    stage("Two Pointers", {
      status: "personal",
      left: [g([n("Two Sum II"), n("More Exercises"), n("Binary Search")])],
      right: [g([n("Valid Parentheses"), n("Min Stack"), n("Daily Temperatures"), n("Stacks")])],
    }),
    stage("Stacks", {
      status: "personal",
      left: [
        g([n("Search in Rotated Array"), n("Minimum in Rotated Array"), n("Koko Eating Bananas")]),
      ],
      right: [
        g([
          n("Generate Parentheses"),
          n("Largest Rectangle in Hist."),
          n("More Exercises"),
          n("Binary Search"),
        ]),
      ],
    }),
  ],
};

const SECTION_2: LeetCodeRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Binary Search",
  stages: [
    stage("Binary Search", {
      status: "personal",
      left: [g([n("Median of Two Arrays"), n("More Exercises"), n("Reverse Linked List")])],
      right: [
        g([
          n("Best Time to Buy and Sell"),
          n("Substring Without Repetition"),
          n("Minimum Window Substring"),
          n("Sliding Window"),
        ]),
      ],
    }),
    stage("Sliding Window", {
      status: "personal",
      left: [g([n("Merge Two Sorted Lists"), n("Linked List Cycle"), n("Reorder List")])],
      right: [
        g([
          n("Character Replacement"),
          n("Sliding Window Maximum"),
          n("More Exercises"),
          n("Linked List"),
        ]),
      ],
    }),
    stage("Linked List", {
      status: "personal",
      left: [
        g([n("Merge K Sorted Lists"), n("More Exercises"), n("Kth Largest Element in an Array")]),
      ],
      right: [
        g([
          n("Binary Tree Level Order"),
          n("Maximum Depth of Binary Tree"),
          n("Lowest Common Ancestor"),
          n("Trees"),
        ]),
      ],
    }),
    stage("Trees", {
      status: "personal",
      left: [
        g([
          n("K Closest Points to Origin"),
          n("Task Scheduler"),
          n("Find Median from Data Stream"),
        ]),
      ],
      right: [
        g([
          n("Binary Tree Maximum Path Sum"),
          n("Serialize and Deserialize"),
          n("More Exercises"),
          n("Heap / Priority Queue"),
        ]),
      ],
    }),
    stage("Heap / Priority Queue", {
      status: "personal",
      left: [g([n("Merge K Sorted Lists"), n("More Exercises"), n("Implement Trie")])],
      right: [g([n("Subsets"), n("Combination Sum"), n("Permutations"), n("Backtracking")])],
    }),
    stage("Backtracking", {
      status: "personal",
      left: [
        g([n("Design Add and Search Words"), n("Word Search II"), n("Longest Common Prefix")]),
      ],
      right: [g([n("Word Search"), n("N-Queens"), n("More Exercises"), n("Tries")])],
    }),
  ],
};

const SECTION_3: LeetCodeRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Tries",
  stages: [
    stage("Tries", {
      status: "personal",
      left: [g([n("Replace Words"), n("More Exercises"), n("Network Delay Time")])],
      right: [
        g([
          n("Number of Islands"),
          n("Clone Graph"),
          n("Pacific Atlantic Water Flow"),
          n("Graphs"),
        ]),
      ],
    }),
    stage("Graphs", {
      status: "personal",
      left: [
        g([
          n("Min Cost to Connect All Points"),
          n("Cheapest Flights Within K Stops"),
          n("Swim in Rising Water"),
        ]),
      ],
      right: [
        g([n("Course Schedule"), n("Word Ladder"), n("More Exercises"), n("Advanced Graphs")]),
      ],
    }),
    stage("Advanced Graphs", {
      status: "personal",
      left: [
        g([
          n("Reconstruct Itinerary"),
          n("More Exercises"),
          n("Unique Paths"),
          n("1-D Dynamic Programming"),
        ]),
      ],
      right: [g([n("Climbing Stairs"), n("House Robber"), n("Coin Change")])],
    }),
    stage("1-D Dynamic Programming", {
      status: "personal",
      left: [
        g([
          n("Longest Common Subsequence"),
          n("Edit Distance"),
          n("Burst Balloons"),
          n("2-D Dynamic Programming"),
        ]),
      ],
      right: [g([n("Longest Increasing Subsequ."), n("Word Break"), n("More Exercises")])],
    }),
    stage("2-D Dynamic Programming", {
      status: "personal",
      left: [g([n("Regular Expression Matching"), n("More Exercises"), n("Merge Intervals")])],
      right: [g([n("Jump Game"), n("Jump Game II"), n("Gas Station"), n("Greedy")])],
    }),
    stage("Greedy", {
      status: "personal",
      left: [g([n("Insert Interval"), n("Non-overlapping Intervals"), n("Meeting Rooms")])],
      right: [
        g([
          n("Partition Labels"),
          n("Non-overlapping Intervals"),
          n("More Exercises"),
          n("Intervals"),
        ]),
      ],
    }),
  ],
};

const SECTION_4: LeetCodeRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Intervals",
  stages: [
    stage("Intervals", {
      status: "personal",
      left: [g([n("Min. Interval to Include Query"), n("More Exercises"), n("Rotate Image")])],
      right: [
        g([n("Single Number"), n("Number of 1 Bits"), n("Counting Bits"), n("Bit Manipulation")]),
      ],
    }),
    stage("Bit Manipulation", {
      status: "personal",
      left: [g([n("Spiral Matrix"), n("Set Matrix Zeroes"), n("Happy Number")])],
      right: [
        g([n("Reverse Bits"), n("Sum of Two Integers"), n("More Exercises"), n("Math & Geometry")]),
      ],
    }),
    stage("Math & Geometry", {
      status: "personal",
      left: [
        g([
          n("Pow(x, n)"),
          n("More Exercises"),
          n("Continue Learning with following relevant tracks"),
        ]),
      ],
    }),
    stage("Continue Learning with following relevant tracks", {
      status: "personal",
      left: [g([n("DSA"), n("Computer Science")])],
      right: [g([n("Backend"), n("Frontend")])],
    }),
  ],
};

export const LEETCODE_SECTIONS: LeetCodeRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
