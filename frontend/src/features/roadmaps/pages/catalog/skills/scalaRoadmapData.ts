export type ScalaRoadmapStatus = "personal" | "alternative" | "optional";

export interface ScalaRoadmapNode {
  id: string;
  title: string;
  status?: ScalaRoadmapStatus;
  roadmapId?: string;
}

export interface ScalaRoadmapGroup {
  id: string;
  parent?: ScalaRoadmapNode;
  items: ScalaRoadmapNode[];
}

export interface ScalaRoadmapStage {
  id: string;
  node: ScalaRoadmapNode;
  left?: ScalaRoadmapGroup[];
  right?: ScalaRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ScalaRoadmapSection {
  id: string;
  title?: string;
  stages: ScalaRoadmapStage[];
}

export interface ScalaRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SCALA_MARKERS: Array<{
  status: ScalaRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SCALA_RELATED_ROADMAPS: ScalaRoadmapLink[] = [
  { label: "Java Roadmap", roadmapId: "skill-java" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Data Engineer", roadmapId: "data-engineer" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
];

export const SCALA_CONTINUE_LEARNING: ScalaRoadmapLink[] = [
  { label: "Data Engineer", roadmapId: "data-engineer" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "DevOps", roadmapId: "devops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ScalaRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ScalaRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ScalaRoadmapNode[],
  parent?: ScalaRoadmapNode,
  customId?: string
): ScalaRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ScalaRoadmapStage, "id" | "node"> & {
    status?: ScalaRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ScalaRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. SCALA BASICS
const SCALA_BASICS: ScalaRoadmapSection = {
  id: "scala-basics",
  title: "Scala Basics & Fundamentals",
  stages: [
    stage("Variables & Types", {
      status: "personal",
      left: [
        g(
          [
            n("val (Immutable Values)", "personal"),
            n("var (Mutable Variables)"),
            n("Type Inference"),
            n("lazy val (Lazy Evaluation)"),
          ],
          n("Variables & Declarations")
        ),
      ],
      right: [
        g(
          [
            n("Any, AnyVal & AnyRef"),
            n("Int, Double, Boolean, Char"),
            n("Unit (equivalent to void)"),
            n("Nothing & Null"),
          ],
          n("Type Hierarchy")
        ),
      ],
      noteAfter:
        "Favor immutability: use val by default in Scala, resorting to var only when strictly necessary.",
    }),
    stage("Expressions & String Interpolation", {
      left: [
        g(
          [
            n("Expressions vs Statements", "personal"),
            n("Blocks Returning Values"),
            n("if / else as Expressions"),
            n("Unit-returning side effects"),
          ],
          n("Expression-Oriented Programming")
        ),
      ],
      right: [
        g(
          [
            n('s"" String Interpolator', "personal"),
            n('f"" Formatted Interpolator'),
            n('raw"" Raw String Literals'),
            n('Multiline Strings ("""...""")'),
          ],
          n("String Interpolation")
        ),
      ],
      projectIdea:
        "CLI Tool: Build a text templating generator that computes values using Scala expressions and interpolators",
    }),
  ],
};

// 2. OOP & CASE CLASSES
const OOP_AND_CASE_CLASSES: ScalaRoadmapSection = {
  id: "oop-and-case-classes",
  title: "OOP & Case Classes",
  stages: [
    stage("Classes, Objects & Traits", {
      status: "personal",
      left: [
        g(
          [
            n("Primary & Auxiliary Constructors"),
            n("Field Visibility (private, protected)"),
            n("Companion Objects & apply()", "personal"),
            n("Singletons using object keyword"),
          ],
          n("Classes & Singletons")
        ),
      ],
      right: [
        g(
          [
            n("Traits as Interfaces with Implementations", "personal"),
            n("Mixin Composition (with keyword)"),
            n("Trait Linearization & Diamond Problem"),
            n("Abstract Classes vs Traits"),
          ],
          n("Traits & Mixins")
        ),
      ],
      noteAfter:
        "Companion objects hold static-like factory methods (`apply`), enabling object instantiation without the `new` keyword.",
    }),
    stage("Case Classes & Pattern Matching", {
      status: "personal",
      left: [
        g(
          [
            n("Case Classes & Immutable Fields", "personal"),
            n("Automatic equals, hashCode & toString"),
            n("Built-in copy() Method"),
            n("Case Objects & Enumerations"),
          ],
          n("Case Classes")
        ),
      ],
      right: [
        g(
          [
            n("match Expressions", "personal"),
            n("Pattern Guards (if conditions)"),
            n("Extractor Patterns & unapply"),
            n("Sealed Traits & Exhaustive Matching", "personal"),
          ],
          n("Pattern Matching & ADTs")
        ),
      ],
      projectIdea:
        "Domain Modeling: Create a financial transaction processor modeled using sealed traits and case classes",
    }),
  ],
};

// 3. FUNCTIONAL PROGRAMMING IN SCALA
const FUNCTIONAL_PROGRAMMING: ScalaRoadmapSection = {
  id: "functional-programming",
  title: "Functional Programming in Scala",
  stages: [
    stage("Pure Functions & Lambdas", {
      status: "personal",
      left: [
        g(
          [
            n("Referential Transparency", "personal"),
            n("Side-Effect Free Functions"),
            n("Anonymous Functions (Lambdas)"),
            n("Function1 ... Function22 Types"),
          ],
          n("Functions as First-Class Citizens")
        ),
      ],
      right: [
        g(
          [
            n("Higher-Order Functions (HOFs)", "personal"),
            n("Currying & Multiple Parameter Lists"),
            n("Partially Applied Functions"),
            n("By-Name Parameters (=> T)", "optional"),
          ],
          n("Higher-Order Mechanics")
        ),
      ],
      noteAfter:
        "Currying and multiple parameter lists unlock elegant DSL design and clean implicit parameter inference.",
    }),
    stage("Functional Error Handling", {
      status: "personal",
      left: [
        g(
          [
            n("Option (Some vs None)", "personal"),
            n("Eliminating NullPointerExceptions"),
            n("getOrElse, orElse, fold"),
            n("Pattern Matching on Options"),
          ],
          n("Option Type")
        ),
      ],
      right: [
        g(
          [
            n("Either (Left for errors, Right for values)", "personal"),
            n("Try (Success vs Failure)"),
            n("for-comprehensions with Monadic Types"),
            n("Handling Exceptions Functionally"),
          ],
          n("Either & Try")
        ),
      ],
      projectIdea:
        "Config Validator: Parse YAML/JSON configuration files with Either and Try, returning detailed error reports",
    }),
  ],
};

// 4. COLLECTIONS API
const COLLECTIONS_API: ScalaRoadmapSection = {
  id: "collections-api",
  title: "Collections API & Monadic Operations",
  stages: [
    stage("Core Collection Types", {
      status: "personal",
      left: [
        g(
          [
            n("scala.collection.immutable (Default)", "personal"),
            n("scala.collection.mutable"),
            n("Seq & IndexedSeq vs LinearSeq"),
            n("ArraySeq & Vector (Fast Random Access)", "personal"),
          ],
          n("Collection Hierarchy")
        ),
      ],
      right: [
        g(
          [
            n("List (Head & Tail Linked List)", "personal"),
            n("Set & Map (Immutable key-value)"),
            n("LazyList / Stream (Infinite Sequences)"),
            n("Queue & Stack Data Structures"),
          ],
          n("Standard Structures")
        ),
      ],
      noteAfter:
        "Scala collections emphasize immutable persistent data structures by default. Prefer Vector for index access and List for recursive head/tail processing.",
    }),
    stage("Monadic Operations & Transformations", {
      status: "personal",
      left: [
        g(
          [
            n("map & flatMap", "personal"),
            n("filter & filterNot"),
            n("for-comprehensions Desugaring", "personal"),
            n("collect with Partial Functions"),
          ],
          n("Transformations")
        ),
      ],
      right: [
        g(
          [
            n("foldLeft & foldRight", "personal"),
            n("reduce & reduceOption"),
            n("groupBy & partition"),
            n("zip, zipWithIndex & sliding"),
          ],
          n("Aggregations & Slicing")
        ),
      ],
      projectIdea:
        "Data Pipeline: Ingest a CSV dataset and build a metrics dashboard aggregator using foldLeft and groupBy",
    }),
  ],
};

// 5. TYPE SYSTEM & ADVANCED FEATURES
const TYPE_SYSTEM_AND_ADVANCED: ScalaRoadmapSection = {
  id: "type-system-and-advanced",
  title: "Type System & Advanced Features",
  stages: [
    stage("Generics, Bounds & Variance", {
      status: "personal",
      left: [
        g(
          [
            n("Type Parameters [T]", "personal"),
            n("Upper Bounds (T <: Animal)"),
            n("Lower Bounds (T >: Dog)"),
            n("Context Bounds (T: Ordering)"),
          ],
          n("Generics & Bounds")
        ),
      ],
      right: [
        g(
          [
            n("Invariance [T]"),
            n("Covariance [+T] (Producer)", "personal"),
            n("Contravariance [-T] (Consumer)"),
            n("Liskov Substitution Principle"),
          ],
          n("Variance Annotations")
        ),
      ],
      noteAfter:
        "Covariance [+T] means if Dog <: Animal, then List[Dog] <: List[Animal]. Functions are contravariant in arguments and covariant in return types.",
    }),
    stage("Implicits & Scala 3 Contextual Abstractions", {
      status: "personal",
      left: [
        g(
          [
            n("implicit parameters & defs (Scala 2)"),
            n("implicit conversions & classes"),
            n("Type Classes Pattern", "personal"),
            n("Simulating Extensions in Scala 2"),
          ],
          n("Scala 2 Implicits")
        ),
      ],
      right: [
        g(
          [
            n("given instances & using clauses", "personal"),
            n("extension methods (Scala 3)", "personal"),
            n("Union & Intersection Types (A | B, A & B)"),
            n("opaque type Aliases"),
          ],
          n("Scala 3 Innovations")
        ),
      ],
      projectIdea:
        "Type Class Library: Implement a custom JSON serialization library using Scala 3 given, using, and extension methods",
    }),
  ],
};

// 6. CONCURRENCY & BIG DATA ECOSYSTEM
const CONCURRENCY_AND_BIG_DATA: ScalaRoadmapSection = {
  id: "concurrency-and-big-data",
  title: "Concurrency & Big Data Ecosystem",
  stages: [
    stage("Futures, Promises & Reactive Systems", {
      status: "personal",
      left: [
        g(
          [
            n("scala.concurrent.Future", "personal"),
            n("Promise for Completing Tasks"),
            n("ExecutionContext & Thread Pools"),
            n("Future.sequence & Future.traverse", "personal"),
          ],
          n("Futures & Promises")
        ),
      ],
      right: [
        g(
          [
            n("Akka / Apache Pekko Actor System", "personal"),
            n("Actor Lifecycle & Supervision Strategies"),
            n("Ask & Tell Patterns (? and !)"),
            n("Pekko HTTP & Akka Streams"),
          ],
          n("Actor Model Concurrency")
        ),
      ],
      noteAfter:
        "The Actor model encapsulates state inside isolated actors communicating via asynchronous message passing.",
    }),
    stage("Functional Effects & Apache Spark", {
      status: "personal",
      left: [
        g(
          [
            n("Cats Effect (IO Monad)", "personal"),
            n("ZIO (Type-safe concurrent effects)", "personal"),
            n("Fibers & Cooperative Concurrency"),
            n("Resource Safety with Bracket / Resource"),
          ],
          n("Pure FP Effect Systems")
        ),
      ],
      right: [
        g(
          [
            n("Apache Spark Core & RDDs", "personal"),
            n("Spark DataFrames & Spark SQL", "personal"),
            n("Spark Structured Streaming"),
            n("Delta Lake & Kafka Integration"),
          ],
          n("Big Data Ecosystem")
        ),
      ],
      projectIdea:
        "Real-Time Streaming Engine: Ingest streaming metrics from Kafka and process them with Apache Spark and ZIO",
    }),
  ],
};

export const SCALA_SECTIONS: ScalaRoadmapSection[] = [
  SCALA_BASICS,
  OOP_AND_CASE_CLASSES,
  FUNCTIONAL_PROGRAMMING,
  COLLECTIONS_API,
  TYPE_SYSTEM_AND_ADVANCED,
  CONCURRENCY_AND_BIG_DATA,
];
