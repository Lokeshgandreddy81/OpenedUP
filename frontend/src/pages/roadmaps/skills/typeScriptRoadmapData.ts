export type TypeScriptRoadmapStatus = "personal" | "alternative" | "optional";

export interface TypeScriptRoadmapNode {
  id: string;
  title: string;
  status?: TypeScriptRoadmapStatus;
  roadmapId?: string;
}

export interface TypeScriptRoadmapGroup {
  id: string;
  parent?: TypeScriptRoadmapNode;
  items: TypeScriptRoadmapNode[];
}

export interface TypeScriptRoadmapStage {
  id: string;
  node: TypeScriptRoadmapNode;
  left?: TypeScriptRoadmapGroup[];
  right?: TypeScriptRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface TypeScriptRoadmapSection {
  id: string;
  title?: string;
  stages: TypeScriptRoadmapStage[];
}

export interface TypeScriptRoadmapLink {
  label: string;
  roadmapId: string;
}

export const TYPESCRIPT_MARKERS: Array<{
  status: TypeScriptRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const TYPESCRIPT_RELATED_ROADMAPS: TypeScriptRoadmapLink[] = [
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "Node.js Roadmap", roadmapId: "skill-nodejs" },
  { label: "React Roadmap", roadmapId: "skill-react" },
];

export const TYPESCRIPT_CONTINUE_LEARNING: TypeScriptRoadmapLink[] = [
  { label: "Frontend", roadmapId: "frontend" },
  { label: "JavaScript", roadmapId: "skill-javascript" },
  { label: "React", roadmapId: "skill-react" },
  { label: "Node.js", roadmapId: "skill-nodejs" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: TypeScriptRoadmapStatus,
  roadmapId?: string,
  customId?: string
): TypeScriptRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: TypeScriptRoadmapNode[],
  parent?: TypeScriptRoadmapNode,
  customId?: string
): TypeScriptRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

export const TYPESCRIPT_SECTIONS: TypeScriptRoadmapSection[] = [
  {
    id: "getting-started",
    title: "Getting Started & Types",
    stages: [
      {
        id: "intro-ts",
        node: n("Introduction to TypeScript", "personal"),
        right: [
          g([
            n("TypeScript vs JavaScript"),
            n("TS and JS Interoperability"),
            n("Installation and Configuration"),
            n("tsconfig.json"),
            n("Compiler Options"),
            n("Running TypeScript"),
            n("tsc"),
            n("ts-node"),
            n("TS Playground"),
          ]),
        ],
      },
      {
        id: "ts-types",
        node: n("TypeScript Types", "personal"),
        left: [
          g(
            [n("boolean"), n("number"), n("string"), n("void"), n("undefined"), n("null")],
            n("Primitive Types")
          ),
          g([n("Interface"), n("Class"), n("Enum"), n("Array"), n("Tuple")], n("Object Types")),
        ],
        right: [
          g([n("Object"), n("unknown"), n("any")], n("Top Types")),
          g([n("never")], n("Bottom Types")),
          g(
            [
              n("as const"),
              n("as [type]"),
              n("as any"),
              n("Non-null Assertion"),
              n("satisfies keyword"),
            ],
            n("Assertions")
          ),
        ],
      },
      {
        id: "type-inference",
        node: n("Type Inference"),
      },
      {
        id: "type-compatibility",
        node: n("Type Compatibility"),
      },
    ],
  },
  {
    id: "type-system",
    title: "Type Composition & Guards",
    stages: [
      {
        id: "combining-types",
        node: n("Combining Types", "personal"),
        left: [
          g([n("Union Types"), n("Intersection Types"), n("Type Aliases"), n("keyof Operator")]),
        ],
      },
      {
        id: "type-guards",
        node: n("Type Guards / Narrowing", "personal"),
        right: [
          g([n("typeof"), n("instanceof"), n("Equality"), n("Truthiness"), n("Type Predicates")]),
        ],
      },
      {
        id: "functions",
        node: n("TypeScript Functions"),
        left: [g([n("Typing Functions"), n("Function Overloading")])],
      },
      {
        id: "interfaces",
        node: n("TypeScript Interfaces", "personal"),
        right: [
          g([
            n("Types vs Interfaces"),
            n("Extending Interfaces"),
            n("Interface Declaration"),
            n("Hybrid Types"),
          ]),
        ],
      },
    ],
  },
  {
    id: "oop-advanced",
    title: "OOP & Generics",
    stages: [
      {
        id: "classes",
        node: n("Classes"),
        left: [
          g([
            n("Constructor Params"),
            n("Constructor Overloading"),
            n("Access Modifiers"),
            n("Abstract Classes"),
            n("Inheritance vs Polymorphism"),
            n("Method Overriding"),
          ]),
        ],
      },
      {
        id: "generics",
        node: n("Generics", "personal"),
        right: [g([n("Generic Types"), n("Generic Constraints")])],
      },
      {
        id: "decorators",
        node: n("Decorators", "optional"),
      },
    ],
  },
  {
    id: "utility-types",
    title: "Utility & Advanced Types",
    stages: [
      {
        id: "utility",
        node: n("Utility Types", "personal"),
        left: [
          g([
            n("Partial"),
            n("Pick"),
            n("Omit"),
            n("Readonly"),
            n("Record"),
            n("Exclude"),
            n("Extract"),
            n("NonNullable"),
            n("Parameters"),
            n("ReturnType"),
            n("InstanceType"),
            n("Awaited"),
          ]),
        ],
      },
      {
        id: "advanced-types",
        node: n("Advanced Types"),
        right: [
          g([
            n("Mapped Types"),
            n("Conditional Types"),
            n("Literal Types"),
            n("Template Literal Types"),
            n("Recursive Types"),
          ]),
        ],
      },
    ],
  },
  {
    id: "modules-ecosystem",
    title: "Modules & Ecosystem",
    stages: [
      {
        id: "ts-modules",
        node: n("TypeScript Modules"),
        left: [
          g([
            n("Namespaces"),
            n("Ambient Modules"),
            n("External Modules"),
            n("Namespace Augmentation"),
            n("Global Augmentation"),
          ]),
        ],
      },
      {
        id: "ecosystem",
        node: n("Ecosystem", "personal"),
        right: [
          g([
            n("Formatting (Prettier)"),
            n("Linting (ESLint / typescript-eslint)"),
            n("Useful Packages (zod, ts-pattern)"),
            n("Build Tools (tsc, esbuild, swc, vite)"),
          ]),
        ],
      },
    ],
  },
];
