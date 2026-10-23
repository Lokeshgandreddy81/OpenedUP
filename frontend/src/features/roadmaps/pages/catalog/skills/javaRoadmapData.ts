export type JavaRoadmapStatus = "personal" | "alternative" | "optional";

export interface JavaRoadmapNode {
  id: string;
  title: string;
  status?: JavaRoadmapStatus;
  roadmapId?: string;
}

export interface JavaRoadmapGroup {
  id: string;
  parent?: JavaRoadmapNode;
  items: JavaRoadmapNode[];
}

export interface JavaRoadmapStage {
  id: string;
  node: JavaRoadmapNode;
  left?: JavaRoadmapGroup[];
  right?: JavaRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface JavaRoadmapSection {
  id: string;
  title?: string;
  stages: JavaRoadmapStage[];
}

export interface JavaRoadmapLink {
  label: string;
  roadmapId: string;
}

export const JAVA_MARKERS: Array<{
  status: JavaRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const JAVA_RELATED_ROADMAPS: JavaRoadmapLink[] = [
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Spring Boot Roadmap", roadmapId: "skill-spring-boot" },
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Golang Roadmap", roadmapId: "golang" },
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
];

export const JAVA_CONTINUE_LEARNING: JavaRoadmapLink[] = [
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Spring Boot Roadmap", roadmapId: "skill-spring-boot" },
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Golang Roadmap", roadmapId: "golang" },
  { label: "Javascript Roadmap", roadmapId: "skill-javascript" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: JavaRoadmapStatus,
  roadmapId?: string,
  customId?: string
): JavaRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: JavaRoadmapNode[],
  parent?: JavaRoadmapNode,
  customId?: string
): JavaRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<JavaRoadmapStage, "id" | "node"> & {
    status?: JavaRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): JavaRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: JavaRoadmapSection = {
  id: "phase-1",
  title: "Phase 1 \u2014 Learn the Basics",
  stages: [
    stage("Learn the Basics", {
      status: "personal",
      left: [
        g([
          n("Visit Backend Roadmap"),
          n("Basic Syntax"),
          n("Lifecycle of a Program"),
          n("Data Types"),
          n("Variables and Scopes"),
          n("Type Casting"),
          n("Object Oriented Programming"),
          n("This is Java specific roadmap and intentionally skips some backend topics."),
        ]),
      ],
      right: [
        g([
          n("Strings and Methods"),
          n("Math Operations"),
          n("Arrays"),
          n("Conditionals"),
          n("Loops"),
          n("Basics of OOP"),
          n("Find the detailed version of this roadmap along with other similar roadmaps"),
        ]),
      ],
    }),
    stage("Object Oriented Programming", {
      status: "personal",
      left: [
        g([
          n("Basics of OOP"),
          n("Classes and Objects"),
          n("Attributes and Methods"),
          n("Access Specifiers"),
          n("Object Lifecycle"),
          n("Static Keyword"),
          n("Method Chaining"),
        ]),
      ],
      right: [
        g([
          n("More about OOP"),
          n("Abstraction"),
          n("Inheritance"),
          n("Encapsulation"),
          n("Interfaces"),
          n("Exception Handling"),
        ]),
      ],
    }),
    stage("Exception Handling", {
      status: "personal",
      left: [
        g([
          n("Final Keyword"),
          n("Enums"),
          n("Record"),
          n("Nested Classes"),
          n("Initializer Block"),
        ]),
      ],
      right: [
        g([
          n("Method Overloading / Overriding"),
          n("Static vs Dynamic Binding"),
          n("Lambda Expressions"),
        ]),
      ],
    }),
    stage("Lambda Expressions", {
      status: "personal",
      left: [g([n("Packages"), n("Pass by Value / Pass by Reference")])],
    }),
    stage("Annotations", {
      status: "personal",
      right: [g([n("Collections")])],
    }),
    stage("Modules", {
      status: "personal",
      left: [g([n("volatile keyword")])],
      right: [g([n("Array vs ArrayList")])],
    }),
  ],
};

const SECTION_2: JavaRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Optionals",
  stages: [
    stage("Optionals", {
      status: "personal",
      left: [g([n("Java Memory Model")])],
      right: [g([n("Set"), n("Map")])],
    }),
    stage("Cryptography", {
      status: "personal",
      left: [g([n("Virtual Threads"), n("Threads")])],
      right: [g([n("Queue"), n("Dequeue"), n("Stack"), n("Iterator")])],
    }),
    stage("Dependency Injection", {
      status: "personal",
      right: [g([n("Generic Collections"), n("I/O Operations")])],
    }),
    stage("Date and Time", {
      status: "personal",
    }),
    stage("Networking", {
      status: "personal",
    }),
    stage("Regular Expressions", {
      status: "personal",
      left: [g([n("High Order Functions")])],
      right: [g([n("Spring Boot is recommended"), n("JDBC"), n("v")])],
    }),
  ],
};

const SECTION_3: JavaRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 I/O Operations",
  stages: [
    stage("I/O Operations", {
      status: "personal",
      left: [g([n("Maven")])],
      right: [g([n("EBean"), n("Spring (Spring Boot)")])],
    }),
    stage("Concurrency", {
      status: "personal",
      left: [g([n("Functional Interfaces"), n("Gradle")])],
      right: [g([n("Hibernate"), n("Quarkus"), n("Javalin")])],
    }),
    stage("File Operations", {
      status: "personal",
    }),
    stage("Database Access", {
      status: "personal",
      left: [
        g([
          n("Functional Composition"),
          n("Bazel"),
          n("Stream API"),
          n("Functional Programming"),
          n("Javadoc"),
          n("JUnit"),
          n("REST Assured"),
          n("Cucumber-JVM"),
        ]),
      ],
      right: [
        g([
          n("Spring Data JPA"),
          n("Play Framework"),
          n("Logback"),
          n("Log4j2"),
          n("Logging Frameworks"),
        ]),
      ],
    }),
    stage("Web Frameworks", {
      status: "personal",
      left: [g([n("Build Tools")])],
      right: [g([n("Database Access")])],
    }),
    stage("Documentation", {
      status: "personal",
      left: [
        g([
          n("TestNG"),
          n("JMeter"),
          n("Behavior Testing"),
          n("Mocking > Mockito"),
          n("Unit Testing"),
          n("Integration Testing"),
        ]),
      ],
      right: [g([n("SLF4J"), n("TinyLog"), n("Testing")])],
    }),
  ],
};

const SECTION_4: JavaRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Logging Frameworks",
  stages: [
    stage("Logging Frameworks", {
      status: "personal",
      right: [g([n("Documentation")])],
    }),
    stage("Testing", {
      status: "personal",
      right: [g([n("Backend Roadmap"), n("Visit Backend path and see what you missed")])],
    }),
  ],
};

export const JAVA_SECTIONS: JavaRoadmapSection[] = [SECTION_1, SECTION_2, SECTION_3, SECTION_4];
