export type KotlinRoadmapStatus = "personal" | "alternative" | "optional";

export interface KotlinRoadmapNode {
  id: string;
  title: string;
  status?: KotlinRoadmapStatus;
  roadmapId?: string;
}

export interface KotlinRoadmapGroup {
  id: string;
  parent?: KotlinRoadmapNode;
  items: KotlinRoadmapNode[];
}

export interface KotlinRoadmapStage {
  id: string;
  node: KotlinRoadmapNode;
  left?: KotlinRoadmapGroup[];
  right?: KotlinRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface KotlinRoadmapSection {
  id: string;
  title?: string;
  stages: KotlinRoadmapStage[];
}

export interface KotlinRoadmapLink {
  label: string;
  roadmapId: string;
}

export const KOTLIN_MARKERS: Array<{
  status: KotlinRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const KOTLIN_RELATED_ROADMAPS: KotlinRoadmapLink[] = [
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Golang Roadmap", roadmapId: "golang" },
  { label: "Rust Roadmap", roadmapId: "skill-rust" },
  { label: "Java Roadmap", roadmapId: "skill-java" },
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
  { label: "Typescript Roadmap", roadmapId: "typescript" },
  { label: "Php Roadmap", roadmapId: "skill-php" },
  { label: "Nodejs Roadmap", roadmapId: "skill-nodejs" },
  { label: "Android Roadmap", roadmapId: "android" },
];

export const KOTLIN_CONTINUE_LEARNING: KotlinRoadmapLink[] = [
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Golang Roadmap", roadmapId: "golang" },
  { label: "Rust Roadmap", roadmapId: "skill-rust" },
  { label: "Java Roadmap", roadmapId: "skill-java" },
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: KotlinRoadmapStatus,
  roadmapId?: string,
  customId?: string
): KotlinRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: KotlinRoadmapNode[],
  parent?: KotlinRoadmapNode,
  customId?: string
): KotlinRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<KotlinRoadmapStage, "id" | "node"> & {
    status?: KotlinRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): KotlinRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: KotlinRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Introduction to Kotlin",
  stages: [
    stage("Introduction to Kotlin", {
      status: "personal",
      left: [
        g([
          n("Collection-specific Operations"),
          n("Language Basics"),
          n("Setting up the Environment"),
          n("Type Checks & Casts"),
          n("Type Inference"),
          n("Related Roadmaps"),
        ]),
      ],
      right: [
        g([
          n("History of Kotlin"),
          n("Why use Kotlin"),
          n("Java Interoperability"),
          n("Basic Types"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("Code Organization", {
      status: "personal",
      left: [g([n("val vs var")])],
      right: [
        g([
          n("Integers"),
          n("Floats"),
          n("Unsigned Integers"),
          n("Characters"),
          n("Strings"),
          n("Booleans"),
          n("Arrays"),
        ]),
      ],
    }),
    stage("main Function", {
      status: "personal",
    }),
    stage("Variables", {
      status: "personal",
      left: [g([n("Data types")])],
      right: [g([n("Lists"), n("Sets"), n("Maps")])],
    }),
    stage("Data types", {
      status: "personal",
      left: [g([n("Comments")])],
    }),
    stage("Comments", {
      status: "personal",
      left: [g([n("print & println"), n("String Templates"), n("Collections")])],
      right: [g([n("read-only vs mutable"), n("Iterators")])],
    }),
    stage("Collections", {
      status: "personal",
      right: [g([n("Label Loops")])],
    }),
    stage("Ranges", {
      status: "personal",
      right: [g([n("break & continue")])],
    }),
    stage("Progressions", {
      status: "personal",
      left: [g([n("if")])],
      right: [g([n("when"), n("for"), n("while")])],
    }),
    stage("Printing data", {
      status: "personal",
      left: [g([n("Control Flow")])],
    }),
    stage("Sequences", {
      status: "personal",
      left: [g([n("Printing data")])],
    }),
    stage("Conditional Expressions", {
      status: "personal",
      left: [g([n("parameters")])],
      right: [g([n("Throwing Exceptions"), n("Loops")])],
    }),
    stage("Loops", {
      status: "personal",
      right: [g([n("Exceptions")])],
    }),
  ],
};

const SECTION_2: KotlinRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Functions",
  stages: [
    stage("Functions", {
      status: "personal",
      left: [g([n("return"), n("varargs"), n("Standard functions")])],
      right: [g([n("Catching Exceptions")])],
    }),
    stage("Exceptions", {
      status: "personal",
    }),
    stage("Standard functions", {
      status: "personal",
      right: [g([n("Higher-order Functions\ufeff"), n("Lambda Functions")])],
    }),
    stage("Local Functions", {
      status: "personal",
      left: [g([n("Transformations")])],
      right: [g([n("Anonymous Functions")])],
    }),
    stage("Member Functions", {
      status: "personal",
      left: [g([n("Filtering")])],
    }),
    stage("Tail-recursive Functions", {
      status: "personal",
      left: [g([n("plus & minus Operators")])],
    }),
    stage("Function Types", {
      status: "personal",
      left: [g([n("Grouping")])],
      right: [g([n("Classes & Objects")])],
    }),
    stage("Extension Functions", {
      status: "personal",
      left: [g([n("Retrieving Collection Parts"), n("Collection Operations")])],
    }),
    stage("Collection Operations", {
      status: "personal",
      left: [
        g([n("Retrieving single elements"), n("Ordering"), n("Lists"), n("Aggregate Operations")]),
      ],
      right: [g([n("Sets"), n("Maps")])],
    }),
    stage("Defining Classess", {
      status: "personal",
      left: [
        g([
          n("Properties"),
          n("Constructors"),
          n("What is Null Safety?"),
          n("Nested & Inner Classes"),
          n("Nullable vs Non-nullable"),
          n("Object Declarations"),
        ]),
      ],
      right: [g([n("Methods")])],
    }),
    stage("Creating Instances", {
      status: "personal",
      left: [g([n("Nullability Check Operators")])],
    }),
    stage("Class Members", {
      status: "personal",
      left: [g([n("Safe Casts")])],
    }),
    stage("Visibility Modifiers", {
      status: "personal",
      right: [g([n("More on Classes & Objects"), n("Abstract Class"), n("Interfaces")])],
    }),
  ],
};

const SECTION_3: KotlinRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Null Safety",
  stages: [
    stage("Null Safety", {
      status: "personal",
      left: [g([n("Async Programming")])],
    }),
    stage("Property Delegates", {
      status: "personal",
      left: [g([n("Null Safety")])],
      right: [g([n("Data Classes"), n("Sealed Class")])],
    }),
    stage("Async Programming", {
      status: "personal",
      left: [g([n("Coroutines")])],
      right: [g([n("Enum Class"), n("Inline Class"), n("Class Generics"), n("Type Aliases")])],
    }),
    stage("Coroutines Behavior", {
      status: "personal",
      left: [g([n("Test Library")])],
    }),
    stage("Asynchronous Flow", {
      status: "personal",
      left: [g([n("Coroutines")])],
    }),
    stage("Packages & Ecosystem", {
      status: "personal",
      left: [g([n("Serialization"), n("Understanding Packages")])],
      right: [g([n("Default Imports"), n("Importing Packages")])],
    }),
    stage("Coroutines Best practices", {
      status: "personal",
      left: [g([n("Packages & Ecosystem")])],
      right: [g([n("KDoc")])],
    }),
    stage("Kotlin Libraries", {
      status: "personal",
      left: [g([n("I/O Library"), n("Date & Time"), n("Documentation")])],
      right: [g([n("Opt-in Requirements"), n("Dokka"), n("TeamCity")])],
    }),
    stage("Standard Library", {
      status: "personal",
      left: [g([n("Kotlin Libraries")])],
    }),
    stage("Documentation", {
      status: "personal",
      left: [g([n("JVM Metadata"), n("Gradle Pluggins"), n("Gradle"), n("Build Tools")])],
      right: [g([n("Maven")])],
    }),
    stage("Build Tools", {
      status: "personal",
      left: [g([n("Build Tool API"), n("Creating Files"), n("Writing & Reading Files")])],
      right: [g([n("CI/CD Tools")])],
    }),
    stage("CI/CD Tools", {
      status: "personal",
      right: [g([n("IDEs")])],
    }),
    stage("I/O", {
      status: "personal",
      left: [g([n("Buffered Streams"), n("Kotlin Platforms")])],
      right: [g([n("IntelliJ IDEA"), n("Android Studio"), n("Kotline Notebook")])],
    }),
  ],
};

const SECTION_4: KotlinRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 IDEs",
  stages: [
    stage("IDEs", {
      status: "personal",
      left: [g([n("I/O")])],
    }),
    stage("Kotlin Platforms", {
      status: "personal",
      left: [g([n("Compose Multiplatform"), n("Kotlin Multiplatform")])],
      right: [g([n("C Interoperability"), n("Swift/Objective-C Interop.")])],
    }),
    stage("Kotlin Multiplatform", {
      status: "personal",
      left: [g([n("Java from Kotlin"), n("Kotlin from Java"), n("Kotlin/Java")])],
    }),
    stage("Kotlin/Java", {
      status: "personal",
      left: [g([n("Spring Boot")])],
      right: [g([n("Kotlin/Native")])],
    }),
    stage("Kotlin/WASM", {
      status: "personal",
      left: [g([n("Android Jetpack")])],
    }),
    stage("Kotlin/JavaScript", {
      status: "personal",
      left: [g([n("Android Studio"), n("Android Development")])],
      right: [g([n("Ktor"), n("Spring")])],
    }),
    stage("Kotlin Applications", {
      status: "personal",
      left: [g([n("Android SDK")])],
      right: [g([n("Quarkus"), n("Vert.x")])],
    }),
    stage("Kotlin Scripting", {
      status: "personal",
      left: [g([n("Kotlin Applications")])],
    }),
    stage("Server-side Apps", {
      status: "personal",
      left: [g([n("Kotlin Notebooks"), n("Kotlin DataFrame"), n("Kandy")])],
      right: [g([n("Popular Frameworks"), n("Koog")])],
    }),
    stage("AI Development", {
      status: "personal",
      left: [g([n("Android"), n("Java"), n("Visit the following roadmaps to keep learning")])],
      right: [g([n("Full Stack")])],
    }),
  ],
};

export const KOTLIN_SECTIONS: KotlinRoadmapSection[] = [SECTION_1, SECTION_2, SECTION_3, SECTION_4];
