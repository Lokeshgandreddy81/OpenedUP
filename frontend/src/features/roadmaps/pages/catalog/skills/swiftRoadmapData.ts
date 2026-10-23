export type SwiftRoadmapStatus = "personal" | "alternative" | "optional";

export interface SwiftRoadmapNode {
  id: string;
  title: string;
  status?: SwiftRoadmapStatus;
  roadmapId?: string;
}

export interface SwiftRoadmapGroup {
  id: string;
  parent?: SwiftRoadmapNode;
  items: SwiftRoadmapNode[];
}

export interface SwiftRoadmapStage {
  id: string;
  node: SwiftRoadmapNode;
  left?: SwiftRoadmapGroup[];
  right?: SwiftRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface SwiftRoadmapSection {
  id: string;
  title?: string;
  stages: SwiftRoadmapStage[];
}

export interface SwiftRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SWIFT_MARKERS: Array<{
  status: SwiftRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SWIFT_RELATED_ROADMAPS: SwiftRoadmapLink[] = [
  { label: "iOS Developer Roadmap", roadmapId: "ios" },
  { label: "React Native Roadmap", roadmapId: "skill-react-native" },
  { label: "Flutter Roadmap", roadmapId: "skill-flutter" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
];

export const SWIFT_CONTINUE_LEARNING: SwiftRoadmapLink[] = [
  { label: "iOS Developer", roadmapId: "ios" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "DSA", roadmapId: "skill-dsa" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: SwiftRoadmapStatus,
  roadmapId?: string,
  customId?: string
): SwiftRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: SwiftRoadmapNode[],
  parent?: SwiftRoadmapNode,
  customId?: string
): SwiftRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<SwiftRoadmapStage, "id" | "node"> & {
    status?: SwiftRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): SwiftRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. SWIFT FUNDAMENTALS
const SWIFT_FUNDAMENTALS: SwiftRoadmapSection = {
  id: "swift-fundamentals",
  title: "Swift Fundamentals",
  stages: [
    stage("Variables, Constants & Types", {
      left: [
        g(
          [
            n("let (Immutable Constants)", "personal"),
            n("var (Mutable Variables)"),
            n("Type Inference & Type Annotation"),
            n("Primitive Types (Int, Double, Float, Bool, String)"),
            n("String Interpolation & Multiline Strings"),
          ],
          n("Variables & Declaration")
        ),
      ],
      right: [
        g(
          [
            n("if / else if / else"),
            n("switch & Advanced Pattern Matching"),
            n("guard Statements (Early Return)", "personal"),
            n("Loops: for-in, while, repeat-while"),
            n("Range Operators (1...5, 0..<count)"),
          ],
          n("Control Flow & Conditionals")
        ),
      ],
      noteAfter:
        "Swift strongly favors immutability by default: use 'let' unless you know a value must mutate.",
    }),
    stage("Optionals & Safety", {
      left: [
        g(
          [
            n("Optional Types (Type?)", "personal"),
            n("Optional Binding (if let, guard let)", "personal"),
            n("Nil-Coalescing Operator (??)"),
            n("Forced Unwrapping (!) & Safety Hazards"),
            n("Implicitly Unwrapped Optionals"),
          ],
          n("Handling Optionals")
        ),
      ],
      right: [
        g(
          [
            n("Optional Chaining (?.)", "personal"),
            n("Error Handling: do-catch Blocks"),
            n("throwing functions (throws / async throws)"),
            n("try, try?, and try!"),
            n("Custom Error Enums"),
          ],
          n("Optional Chaining & Errors")
        ),
      ],
    }),
  ],
};

// 2. DATA STRUCTURES & COLLECTIONS
const DATA_STRUCTURES_AND_COLLECTIONS: SwiftRoadmapSection = {
  id: "swift-data-structures-and-collections",
  title: "Swift Data Structures & Collections",
  stages: [
    stage("Collections & Tuples", {
      left: [
        g(
          [
            n("Arrays ([Element])", "personal"),
            n("Dictionaries ([Key: Value])"),
            n("Sets (Set<Element>)"),
            n("Higher-Order Functions (map, filter, reduce, compactMap, flatMap)", "personal"),
          ],
          n("Standard Collections")
        ),
      ],
      right: [
        g(
          [
            n("Tuples (Named & Unnamed)"),
            n("Swift Enums with Associated Values", "personal"),
            n("Raw Representable Enums (Int, String)"),
            n("CaseIterable & Comparable Enums"),
          ],
          n("Tuples & Enums")
        ),
      ],
    }),
    stage("Structs vs Classes", {
      left: [
        g(
          [
            n("Value Semantics & Copy-on-Write", "personal"),
            n("Memberwise Initializers"),
            n("mutating methods in Structs"),
            n("Structs as First-Class Citizens in Swift"),
          ],
          n("Structs (Value Types)")
        ),
      ],
      right: [
        g(
          [
            n("Reference Semantics & Identity (===)"),
            n("Inheritance & Subclassing"),
            n("Designated vs Convenience Initializers"),
            n("deinit & ARC (Automatic Reference Counting)"),
            n("weak and unowned References (Retain Cycle Prevention)", "personal"),
          ],
          n("Classes (Reference Types)")
        ),
      ],
      noteAfter:
        "Structs are preferred in Swift for state modeling due to predictability and thread safety, reserving classes for shared mutable state and inheritance.",
    }),
  ],
};

// 3. PROTOCOLS & GENERICS
const PROTOCOLS_AND_GENERICS: SwiftRoadmapSection = {
  id: "protocols-and-generics",
  title: "Protocols & Generics",
  stages: [
    stage("Protocol-Oriented Programming", {
      left: [
        g(
          [
            n("Defining Protocols & Contract Requirements"),
            n("Property & Method Requirements"),
            n("Protocol Inheritance & Conformance"),
            n("Protocol Composition (& syntax)"),
          ],
          n("Protocol Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Protocol Extensions & Default Implementations", "personal"),
            n("Conditional Conformance (extension Array where Element: Equatable)"),
            n("some (Opaque Return Types)", "personal"),
            n("any (Existential Types & Performance cost)"),
          ],
          n("Extensions & Opaque Types")
        ),
      ],
    }),
    stage("Generics & Associated Types", {
      left: [
        g(
          [
            n("Generic Functions & Generic Types (<T>)", "personal"),
            n("Type Constraints (<T: Numeric>)"),
            n("Generic where Clauses"),
            n("Standard Generic Collections"),
          ],
          n("Generic Programming")
        ),
      ],
      right: [
        g(
          [
            n("associatedtype in Protocols"),
            n("Primary Associated Types (Protocol<Element>)"),
            n("Type Erasure (AnyView, AnyCancellable)"),
          ],
          n("Associated Types & Erasure")
        ),
      ],
      projectIdea:
        "Project Idea: Build a generic networking repository pattern using protocols, async/await, and Codable decoders",
    }),
  ],
};

// 4. MODERN SWIFT CONCURRENCY
const MODERN_SWIFT_CONCURRENCY: SwiftRoadmapSection = {
  id: "modern-swift-concurrency",
  title: "Modern Swift Concurrency",
  stages: [
    stage("Async/Await & Structured Concurrency", {
      left: [
        g(
          [
            n("async / await Syntax", "personal"),
            n("Async Properties & Async Sequences"),
            n("Async Let Bindings (async let x = ...)"),
            n("Bridging Callback APIs with withCheckedContinuation"),
          ],
          n("Async Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Task { } and Task.detached"),
            n("Task Priority & Sleep (Task.sleep)"),
            n("Cooperative Cancellation (Task.isCancelled)"),
            n("withTaskGroup & withThrowingTaskGroup (Concurrent Fan-out)", "personal"),
          ],
          n("Tasks & Task Groups")
        ),
      ],
    }),
    stage("Actors & Thread Safety", {
      left: [
        g(
          [
            n("actor Keyword & Isolation", "personal"),
            n("Actor Reentrancy & Suspension Points"),
            n("@MainActor (UI Thread Safety Annotation)", "personal"),
            n("Global Actors"),
          ],
          n("Actor Model")
        ),
      ],
      right: [
        g(
          [
            n("Sendable Protocol & Conformance", "personal"),
            n("@Sendable Closures"),
            n("Swift 6 Strict Concurrency Checking"),
            n("Data Race Safety by Compiler Guarantee"),
          ],
          n("Data-Race Safety & Sendable")
        ),
      ],
      noteAfter:
        "Modern Swift concurrency replaces GCD (Grand Central Dispatch) and completion handlers with compile-time checked thread safety.",
    }),
  ],
};

// 5. SWIFTUI CORE DECLARATIVE UI
const SWIFTUI_CORE_DECLARATIVE_UI: SwiftRoadmapSection = {
  id: "swiftui-core-declarative-ui",
  title: "SwiftUI Core Declarative UI",
  stages: [
    stage("View Protocol & Primitives", {
      left: [
        g(
          [
            n("View Protocol & body property", "personal"),
            n("some View Opaque Return Type"),
            n("View Modifiers & Order of Execution", "personal"),
            n("Custom Reusable View Modifiers (.modifier)"),
          ],
          n("Declarative View Hierarchy")
        ),
      ],
      right: [
        g(
          [
            n("Text, Image & SF Symbols"),
            n("Button, TextField & SecureField"),
            n("Toggle, Slider & Picker"),
            n("#Preview Macro (Xcode Previews)", "personal"),
          ],
          n("Core Controls & Previews")
        ),
      ],
    }),
    stage("State Management & Data Flow", {
      left: [
        g(
          [
            n("@State (Local View State)", "personal"),
            n("@Binding (Two-Way Parent-Child Binding)", "personal"),
            n("Binding Constant (.constant)"),
            n("Single Source of Truth Principle"),
          ],
          n("Local View State")
        ),
      ],
      right: [
        g(
          [
            n("@Observable Macro (Swift 5.9+ / iOS 17+)", "personal"),
            n("@Environment & Custom EnvironmentKeys", "personal"),
            n("Legacy @StateObject & @ObservedObject (Combine)"),
            n("Legacy @EnvironmentObject"),
          ],
          n("Shared & App-Wide State")
        ),
      ],
      projectIdea:
        "Project Idea: Build a Habit Tracker app with reactive checkboxes, progress rings, and shared observable state",
    }),
  ],
};

// 6. SWIFTUI LAYOUTS & NAVIGATION
const SWIFTUI_LAYOUTS_AND_NAVIGATION: SwiftRoadmapSection = {
  id: "swiftui-layouts-and-navigation",
  title: "SwiftUI Layouts & Navigation",
  stages: [
    stage("Layout Containers & Grids", {
      left: [
        g(
          [
            n("VStack, HStack, ZStack", "personal"),
            n("Spacer & Divider"),
            n("Padding, Alignment & Frame"),
            n("GeometryReader (Coordinate Space & Sizing)"),
          ],
          n("Stack Layouts & Sizing")
        ),
      ],
      right: [
        g(
          [
            n("ScrollView & ScrollViewReader"),
            n("List & ForEach (Identifiable collections)", "personal"),
            n("LazyVStack & LazyHStack"),
            n("LazyVGrid & LazyHGrid"),
            n("Grid & GridRow (iOS 16+)"),
          ],
          n("Scrollable Lists & Grids")
        ),
      ],
    }),
    stage("Navigation & Modal Presentation", {
      left: [
        g(
          [
            n("NavigationStack (iOS 16+ Value-Based)", "personal"),
            n("navigationDestination(for:)", "personal"),
            n("NavigationPath (Programmatic Deep Linking)"),
            n("NavigationSplitView (iPad & macOS Support)"),
          ],
          n("Navigation Systems")
        ),
      ],
      right: [
        g(
          [
            n(".sheet(isPresented:)", "personal"),
            n(".fullScreenCover"),
            n(".alert and ConfirmationDialogs"),
            n(".popover & Custom Overlays"),
          ],
          n("Sheets & Modals")
        ),
      ],
      noteAfter:
        "Modern NavigationStack replaces the deprecated NavigationView with type-safe, programmatic routing and clean state restoration.",
    }),
  ],
};

// 7. DATA PERSISTENCE & NETWORKING
const DATA_PERSISTENCE_AND_NETWORKING: SwiftRoadmapSection = {
  id: "data-persistence-and-networking",
  title: "Data Persistence & Networking",
  stages: [
    stage("URLSession & Codable Networking", {
      left: [
        g(
          [
            n("URLSession.shared.data(from:)", "personal"),
            n("URLRequest & HTTP Methods (GET, POST, PUT, DELETE)"),
            n("HTTP Headers & Bearer Token Authentication"),
            n("HTTPURLResponse & Status Code Validation"),
          ],
          n("Modern Networking")
        ),
      ],
      right: [
        g(
          [
            n("Codable (Encodable & Decodable)", "personal"),
            n("JSONDecoder & JSONEncoder"),
            n("keyDecodingStrategy (.convertFromSnakeCase)"),
            n("dateDecodingStrategy (.iso8601)"),
            n("Custom CodingKeys Enum"),
          ],
          n("JSON Serialization")
        ),
      ],
    }),
    stage("Data Persistence (SwiftData & Core Data)", {
      left: [
        g(
          [
            n("@Model Macro (SwiftData)", "personal"),
            n("ModelContainer & ModelContext"),
            n("@Query Macro in SwiftUI", "personal"),
            n("#Predicate & SortDescriptor"),
            n("SwiftData Relationships & Cascading"),
          ],
          n("SwiftData (Modern Persistence)")
        ),
      ],
      right: [
        g(
          [
            n("@AppStorage (UserDefaults)"),
            n("Keychain Services (Secure Tokens)"),
            n("Core Data (NSPersistentContainer, NSFetchRequest)"),
            n("File Manager & Disk Storage"),
          ],
          n("Alternative & Keychain Storage")
        ),
      ],
      projectIdea:
        "Project Idea: Build an offline-first Movie Discovery app fetching from TMDb API, caching movies in SwiftData with favorites list",
    }),
  ],
};

export const SWIFT_SECTIONS: SwiftRoadmapSection[] = [
  SWIFT_FUNDAMENTALS,
  DATA_STRUCTURES_AND_COLLECTIONS,
  PROTOCOLS_AND_GENERICS,
  MODERN_SWIFT_CONCURRENCY,
  SWIFTUI_CORE_DECLARATIVE_UI,
  SWIFTUI_LAYOUTS_AND_NAVIGATION,
  DATA_PERSISTENCE_AND_NETWORKING,
];
