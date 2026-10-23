export type JavaScriptRoadmapStatus = "personal" | "alternative" | "optional";

export interface JavaScriptRoadmapNode {
  id: string;
  title: string;
  status?: JavaScriptRoadmapStatus;
  roadmapId?: string;
}

export interface JavaScriptRoadmapGroup {
  id: string;
  parent?: JavaScriptRoadmapNode;
  items: JavaScriptRoadmapNode[];
}

export interface JavaScriptRoadmapStage {
  id: string;
  node: JavaScriptRoadmapNode;
  left?: JavaScriptRoadmapGroup[];
  right?: JavaScriptRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface JavaScriptRoadmapSection {
  id: string;
  title?: string;
  stages: JavaScriptRoadmapStage[];
}

export interface JavaScriptRoadmapLink {
  label: string;
  roadmapId: string;
}

export const JAVASCRIPT_MARKERS: Array<{
  status: JavaScriptRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const JAVASCRIPT_RELATED_ROADMAPS: JavaScriptRoadmapLink[] = [
  { label: "Nodejs Roadmap", roadmapId: "skill-nodejs" },
  { label: "Typescript Roadmap", roadmapId: "typescript" },
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "Angular Roadmap", roadmapId: "skill-angular" },
  { label: "Vue Roadmap", roadmapId: "vue" },
];

export const JAVASCRIPT_CONTINUE_LEARNING: JavaScriptRoadmapLink[] = [
  { label: "Nodejs Roadmap", roadmapId: "skill-nodejs" },
  { label: "Typescript Roadmap", roadmapId: "typescript" },
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "React Roadmap", roadmapId: "skill-react" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: JavaScriptRoadmapStatus,
  roadmapId?: string,
  customId?: string
): JavaScriptRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: JavaScriptRoadmapNode[],
  parent?: JavaScriptRoadmapNode,
  customId?: string
): JavaScriptRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<JavaScriptRoadmapStage, "id" | "node"> & {
    status?: JavaScriptRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): JavaScriptRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: JavaScriptRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Introduction to JavaScript",
  stages: [
    stage("Introduction to JavaScript", {
      status: "personal",
      left: [
        g([
          n("What is JavaScript"),
          n("History of JavaScript"),
          n("JavaScript Versions"),
          n("How to run JavaScript"),
        ]),
      ],
      right: [
        g([
          n("var"),
          n("let"),
          n("const"),
          n("Variable Declarations"),
          n("Hoisting"),
          n("Variable Naming Rules"),
          n("Variable Scopes"),
          n("Object Prototype"),
          n("Block"),
          n("Function"),
          n("Global"),
          n("Prototypal Inheritance"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("All about Variables", {
      status: "personal",
      left: [g([n("string"), n("undefined"), n("Data Types")])],
    }),
    stage("Data Types", {
      status: "personal",
      left: [
        g([
          n("number"),
          n("bigint"),
          n("boolean"),
          n("null"),
          n("Symbol"),
          n("Primitive Types"),
          n("Type Conversion vs Coercion"),
          n("Type Casting"),
        ]),
      ],
      right: [
        g([
          n("Object"),
          n("Built-in Objects"),
          n("typeof operator"),
          n("JSON"),
          n("Map"),
          n("Structured Data"),
          n("Weak Map"),
          n("Set"),
          n("Keyed Collections"),
          n("Weak Set"),
        ]),
      ],
    }),
    stage("Type Casting", {
      status: "personal",
      left: [
        g([
          n("Implicit Type Casting"),
          n("Explicit Type Casting"),
          n("=="),
          n("==="),
          n("Object.is"),
          n("Value Comparison Operators"),
        ]),
      ],
      right: [
        g([
          n("Typed Arrays"),
          n("Indexed Collections"),
          n("Arrays"),
          n("for"),
          n("break / continue"),
          n("Data Structures"),
        ]),
      ],
    }),
    stage("Data Structures", {
      status: "personal",
      left: [g([n("Equality Comparisons")])],
    }),
    stage("Equality Comparisons", {
      status: "personal",
      left: [
        g([
          n("Equality Algorithms"),
          n("isLooselyEqual"),
          n("Conditional Operators"),
          n("isStrictlyEqual"),
        ]),
      ],
      right: [
        g([
          n("do...while"),
          n("for...of loop"),
          n("while"),
          n("for...in loop"),
          n("Loops and Iterations"),
        ]),
      ],
    }),
  ],
};

const SECTION_2: JavaScriptRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Loops and Iterations",
  stages: [
    stage("Loops and Iterations", {
      status: "personal",
      left: [
        g([
          n("Comma Operators"),
          n("SameValueZero"),
          n("Unary Operators"),
          n("SameValue"),
          n("Assignment Operators"),
          n("Comparison Operators"),
        ]),
      ],
      right: [
        g([n("if...else"), n("Switch"), n("Conditional Statements"), n("Exceptional Handling")]),
      ],
    }),
    stage("Expressions & Operators", {
      status: "personal",
      left: [
        g([
          n("Arithmetic Operators"),
          n("Bitwise Operators"),
          n("Logical Operators"),
          n("BigInt Operators"),
          n("String Operators"),
        ]),
      ],
      right: [
        g([
          n("Default Params"),
          n("Rest"),
          n("throw statement"),
          n("try/catch/finally"),
          n("Function Parameters"),
          n("Error Objects"),
        ]),
      ],
    }),
    stage("Control Flow", {
      status: "personal",
      left: [g([n("Expressions & Operators")])],
    }),
    stage("Functions", {
      status: "personal",
      left: [g([n("in a method")])],
      right: [
        g([
          n("Arrow Functions"),
          n("IIFEs"),
          n("Recursion"),
          n("arguments object"),
          n("Lexical Scoping"),
          n("Scope & Function Stack"),
          n("Closures"),
          n("Built-in Functions"),
        ]),
      ],
    }),
    stage("DOM APIs", {
      status: "personal",
      left: [g([n("in a function"), n("using it alone")])],
      right: [g([n("Callback Hell"), n("Event Loop"), n("Callbacks")])],
    }),
    stage("Strict Mode", {
      status: "personal",
      left: [g([n("in event handlers"), n("Function Borrowing"), n("in arrow functions")])],
      right: [g([n("Promises"), n("setTimeout"), n("async/await")])],
    }),
  ],
};

const SECTION_3: JavaScriptRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Using (this) keyword",
  stages: [
    stage("Using (this) keyword", {
      status: "personal",
      left: [g([n("Explicit Binding"), n("CommonJS"), n("call"), n("apply")])],
      right: [g([n("setInterval"), n("XMLHTTPRequest"), n("bind"), n("Asynchronous JavaScript")])],
    }),
    stage("Asynchronous JavaScript", {
      status: "personal",
    }),
    stage("Modules in JavaScript", {
      status: "personal",
      left: [g([n("ESM"), n("Memory Lifecycle"), n("Memory Management")])],
      right: [
        g([
          n("Fetch"),
          n("Debugging Issues"),
          n("Debugging Memory Leaks"),
          n("Debugging Performance"),
        ]),
      ],
    }),
    stage("Iterators and Generators", {
      status: "personal",
      left: [g([n("Modules in JavaScript")])],
    }),
    stage("Classes", {
      status: "personal",
      left: [g([n("Iterators and Generators")])],
    }),
    stage("Working with APIs", {
      status: "personal",
      right: [g([n("Classes")])],
    }),
  ],
};

const SECTION_4: JavaScriptRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Memory Management",
  stages: [
    stage("Memory Management", {
      status: "personal",
      left: [
        g([
          n("Garbage Collection"),
          n("Using Browser DevTools"),
          n("Frontend"),
          n("React"),
          n("TypeScript"),
        ]),
      ],
      right: [g([n("Node.js")])],
    }),
    stage("Using Browser DevTools", {
      status: "personal",
      left: [g([n("Have a look at the following related roadmaps")])],
    }),
  ],
};

export const JAVASCRIPT_SECTIONS: JavaScriptRoadmapSection[] = [
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
];
