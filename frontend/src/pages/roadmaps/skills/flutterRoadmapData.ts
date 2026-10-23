export type FlutterRoadmapStatus = "personal" | "alternative" | "optional";

export interface FlutterRoadmapNode {
  id: string;
  title: string;
  status?: FlutterRoadmapStatus;
  roadmapId?: string;
}

export interface FlutterRoadmapGroup {
  id: string;
  parent?: FlutterRoadmapNode;
  items: FlutterRoadmapNode[];
}

export interface FlutterRoadmapStage {
  id: string;
  node: FlutterRoadmapNode;
  left?: FlutterRoadmapGroup[];
  right?: FlutterRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface FlutterRoadmapSection {
  id: string;
  title?: string;
  stages: FlutterRoadmapStage[];
}

export interface FlutterRoadmapLink {
  label: string;
  roadmapId: string;
}

export const FLUTTER_MARKERS: Array<{
  status: FlutterRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const FLUTTER_RELATED_ROADMAPS: FlutterRoadmapLink[] = [
  { label: "Android Developer Roadmap", roadmapId: "android" },
  { label: "iOS Developer Roadmap", roadmapId: "ios" },
  { label: "React Native Roadmap", roadmapId: "skill-react-native" },
  { label: "Frontend Developer Roadmap", roadmapId: "frontend" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
  { label: "API Design Roadmap", roadmapId: "skill-api-design" },
];

export const FLUTTER_CONTINUE_LEARNING: FlutterRoadmapLink[] = [
  { label: "Android Developer", roadmapId: "android" },
  { label: "iOS Developer", roadmapId: "ios" },
  { label: "React Native", roadmapId: "skill-react-native" },
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
  status?: FlutterRoadmapStatus,
  roadmapId?: string,
  customId?: string
): FlutterRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: FlutterRoadmapNode[],
  parent?: FlutterRoadmapNode,
  customId?: string
): FlutterRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<FlutterRoadmapStage, "id" | "node"> & {
    status?: FlutterRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): FlutterRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. DART FUNDAMENTALS
const DART_FUNDAMENTALS: FlutterRoadmapSection = {
  id: "dart-fundamentals",
  title: "Dart Fundamentals",
  stages: [
    stage("Dart Basics & Syntax", {
      left: [
        g(
          [
            n("Variables & Built-in Types (int, double, String, bool)"),
            n("Collections (List, Set, Map)"),
            n("Operators & Control Flow (if, switch, loops)"),
            n("Functions, Named Parameters & Arrow Syntax"),
          ],
          n("Language Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Sound Null Safety (?, !)", "personal"),
            n("Late Variables (late keyword)"),
            n("Null-aware Operators (?., ??, ??=)"),
            n("Type Inference & Generics"),
          ],
          n("Null Safety & Types")
        ),
      ],
    }),
    stage("Object-Oriented Dart & Mixins", {
      left: [
        g(
          [
            n("Classes & Constructors (Named, Factory, const)"),
            n("Inheritance & Abstract Classes"),
            n("Interfaces & implements"),
            n("Getters, Setters & Encapsulation"),
          ],
          n("OOP Concepts")
        ),
      ],
      right: [
        g(
          [
            n("Mixins (with keyword)", "personal"),
            n("Extension Methods (extension on)"),
            n("Enhanced Enums with members"),
            n("Records & Pattern Matching (Dart 3)", "personal"),
          ],
          n("Advanced Features")
        ),
      ],
    }),
    stage("Asynchronous Dart", {
      left: [
        g(
          [
            n("Futures API & Event Loop"),
            n("async / await primitives", "personal"),
            n("Error handling with try / catch / finally"),
            n("Completer & Future.wait"),
          ],
          n("Futures & Async")
        ),
      ],
      right: [
        g(
          [
            n("Single vs Broadcast Streams"),
            n("StreamController & StreamSink"),
            n("Generators (async* & yield)"),
            n("Stream Transformers & RxDart", "optional"),
          ],
          n("Streams & Reactive Data")
        ),
      ],
      noteAfter:
        "Mastering Dart's asynchronous model (Futures, event loops, and Streams) is crucial for managing Flutter's reactive UI updates and network operations.",
      projectIdea:
        "Build a pure Dart CLI tool or weather client utilizing Streams, async/await, and JSON parsing",
    }),
  ],
};

// 2. FLUTTER CORE & WIDGET TREE
const FLUTTER_CORE_AND_WIDGET_TREE: FlutterRoadmapSection = {
  id: "flutter-core-and-widget-tree",
  title: "Flutter Core & Widget Tree",
  stages: [
    stage("Flutter Architecture & Setup", {
      left: [
        g(
          [
            n("Flutter SDK Installation & flutter doctor"),
            n("VS Code & Android Studio Tooling"),
            n("Hot Reload vs Hot Restart"),
            n("Flutter DevTools Overview"),
          ],
          n("Environment & Tooling")
        ),
      ],
      right: [
        g(
          [
            n("Flutter Engine (C++, Skia / Impeller)"),
            n("Dart VM & AOT/JIT Compilation"),
            n("Platform Channels (MethodChannel) basics"),
            n("Rendering Pipeline (Build -> Layout -> Paint)"),
          ],
          n("Under the Hood")
        ),
      ],
    }),
    stage("The Widget Tree & Lifecycle", {
      left: [
        g(
          [
            n("Stateless vs Stateful Widgets"),
            n("Widget Lifecycle (initState, didUpdateWidget, dispose)", "personal"),
            n("Everything is a Widget Philosophy"),
            n("setState & Local Rebuilds"),
          ],
          n("Widget Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Widget Tree vs Element Tree vs RenderObject Tree"),
            n("BuildContext & Its Role in the Tree", "personal"),
            n("ValueKey & ObjectKey"),
            n("UniqueKey & GlobalKey"),
          ],
          n("Element & Render Tree")
        ),
      ],
    }),
    stage("InheritedWidget & Context", {
      left: [
        g(
          [
            n("InheritedWidget Fundamentals"),
            n("dependOnInheritedWidgetOfExactType", "personal"),
            n("Propagating Data Down the Widget Tree"),
            n("Avoiding Unnecessary Subtree Rebuilds"),
          ],
          n("Data Propagation")
        ),
      ],
      right: [
        g(
          [
            n("Theme.of(context) & Material Colors"),
            n("MediaQuery.of(context) & Screen Metrics"),
            n("Navigator.of(context) & Overlay"),
            n("ScaffoldMessenger.of(context)"),
          ],
          n("Context Lookup")
        ),
      ],
      noteAfter:
        "Flutter widgets are immutable blueprints. Elements manage lifecycle and hold onto RenderObjects which calculate geometry, layout constraints, and drawing.",
    }),
  ],
};

// 3. LAYOUTS & UI DESIGN
const LAYOUTS_AND_UI_DESIGN: FlutterRoadmapSection = {
  id: "layouts-and-ui-design",
  title: "Layouts & UI Design",
  stages: [
    stage("Fundamental Layouts", {
      left: [
        g(
          [
            n("Row, Column & Flex", "personal"),
            n("Stack & Positioned"),
            n("Container, SizedBox & ConstrainedBox"),
            n("Padding, Center & Align"),
            n("Expanded vs Flexible"),
          ],
          n("Structural Layouts")
        ),
      ],
      right: [
        g(
          [
            n("ListView & ListView.builder", "personal"),
            n("GridView & GridView.builder"),
            n("SingleChildScrollView"),
            n("CustomScrollView & Slivers (SliverAppBar, SliverList)", "personal"),
          ],
          n("Scrolling & Lists")
        ),
      ],
    }),
    stage("Design Systems & Theming", {
      left: [
        g(
          [
            n("Material Design 3 (ThemeData, ColorScheme)", "personal"),
            n("Cupertino Widgets (iOS Design Language)", "alternative"),
            n("Custom ThemeExtensions for Design Tokens"),
            n("Dark & Light Mode Dynamic Theming"),
          ],
          n("Design Systems")
        ),
      ],
      right: [
        g(
          [
            n("MediaQuery & LayoutBuilder", "personal"),
            n("Responsive Breakpoints (Mobile, Tablet, Desktop)"),
            n("flutter_screenutil & Scaled Units", "optional"),
            n("Adaptive Widgets (Switch.adaptive, Slider.adaptive)"),
          ],
          n("Responsive & Adaptive UI")
        ),
      ],
    }),
    stage("Gestures & Animations", {
      left: [
        g(
          [
            n("GestureDetector (taps, drags, scales)"),
            n("InkWell & Material Ripple Effects"),
            n("Dismissible (swipe-to-dismiss)", "personal"),
            n("InteractiveViewer (pan & pinch zoom)"),
          ],
          n("Touch & Interaction")
        ),
      ],
      right: [
        g(
          [
            n("Implicit Animations (AnimatedContainer, AnimatedOpacity)", "personal"),
            n("Explicit Animations (AnimationController, CurvedAnimation)"),
            n("Hero Animations for Screen Transitions", "personal"),
            n("Lottie & Rive Vector Animations", "optional"),
          ],
          n("Animations")
        ),
      ],
      projectIdea:
        "Build an adaptive Material 3 E-Commerce Catalog or Food Delivery UI with smooth Hero transitions and Sliver headers",
    }),
  ],
};

// 4. STATE MANAGEMENT
const STATE_MANAGEMENT: FlutterRoadmapSection = {
  id: "state-management",
  title: "State Management",
  stages: [
    stage("State Management Paradigms", {
      left: [
        g(
          [
            n("Ephemeral vs App State"),
            n("When to use setState vs Architecture"),
            n("Unidirectional Data Flow"),
            n("Separation of UI from Business Logic"),
          ],
          n("Architecture & Flow")
        ),
      ],
      right: [
        g(
          [
            n("ValueNotifier & ValueListenableBuilder", "personal"),
            n("ChangeNotifier"),
            n("StreamBuilder & Reactive Streams"),
          ],
          n("Reactive Primitives")
        ),
      ],
    }),
    stage("Popular State Management Solutions", {
      left: [
        g(
          [
            n("Riverpod (Compile-safe, testable provider evolution)", "personal"),
            n("BLoC / Cubit (Stream-based event architecture)", "personal"),
            n("Provider (Recommended InheritedWidget wrapper)", "alternative"),
          ],
          n("Industry Standard Solutions")
        ),
      ],
      right: [
        g(
          [
            n("GetX (High-productivity reactive state)", "alternative"),
            n("MobX (Observable state & code generation)", "optional"),
            n("Signals for Dart (Fine-grained reactivity)", "optional"),
          ],
          n("Alternative Solutions")
        ),
      ],
      noteAfter:
        "Riverpod and BLoC/Cubit are industry standards for robust, testable, and enterprise-scale Flutter applications, offering strong typing and predictable state transitions.",
      projectIdea:
        "Build a full-featured Shopping Cart or Task Manager using Riverpod or BLoC with filtering, persistence, and unit tests",
    }),
  ],
};

// 5. ROUTING, NAVIGATION & NETWORKING
const ROUTING_NAVIGATION_AND_NETWORKING: FlutterRoadmapSection = {
  id: "routing-navigation-and-networking",
  title: "Routing, Navigation & Networking",
  stages: [
    stage("Routing & Navigation", {
      left: [
        g(
          [
            n("GoRouter (Declarative, URL-driven routing)", "personal"),
            n("Navigator 2.0 (Router & RouteInformationParser)"),
            n("Deep Linking & Universal Links (iOS & Android)", "personal"),
            n("StatefulShellRoute (Bottom navigation persistence)"),
          ],
          n("Declarative Routing")
        ),
      ],
      right: [
        g(
          [
            n("Navigator 1.0 (push, pop, pushNamed)", "alternative"),
            n("Route Guards & Authentication Redirection"),
            n("Passing typed arguments & result returns"),
            n("AutoRoute (Code-generation alternative)", "optional"),
          ],
          n("Imperative & Navigation Guards")
        ),
      ],
    }),
    stage("Networking & API Integration", {
      left: [
        g(
          [
            n("Dio Client (Interceptors, caching, retry policies)", "personal"),
            n("http package (Official lightweight client)", "alternative"),
            n("GraphQL Flutter client", "optional", "skill-graphql"),
            n("WebSockets for real-time bidirectional streams"),
          ],
          n("HTTP Clients")
        ),
      ],
      right: [
        g(
          [
            n("json_serializable & build_runner", "personal"),
            n("Freezed (Immutable models, copyWith & union types)", "personal"),
            n("Retrofit for Dart API clients"),
            n("Error Handling & HTTP Status Code Interceptors"),
          ],
          n("Serialization & Modeling")
        ),
      ],
      noteAfter:
        "GoRouter provides seamless deep-linking and stateful nested navigation across mobile and web, while Dio paired with Freezed models ensures type-safe network serialization.",
    }),
  ],
};

// 6. LOCAL PERSISTENCE & DATABASE
const LOCAL_PERSISTENCE_AND_DATABASE: FlutterRoadmapSection = {
  id: "local-persistence-and-database",
  title: "Local Persistence & Database",
  stages: [
    stage("Key-Value & Document Storage", {
      left: [
        g(
          [
            n("SharedPreferences (Flags & user preferences)"),
            n("Flutter Secure Storage (Keychain / Keystore encryption)", "personal"),
            n("Storing Auth JWTs & Tokens Securely"),
          ],
          n("Preferences & Security")
        ),
      ],
      right: [
        g(
          [
            n("Hive / Isar (Fast pure-Dart NoSQL database)", "personal"),
            n("Offline response caching policies"),
            n("Hydrated BLoC / Persistent Riverpod storage"),
          ],
          n("Fast NoSQL & Caching")
        ),
      ],
    }),
    stage("Relational & Object Databases", {
      left: [
        g(
          [
            n("Drift (Type-safe, reactive SQLite with Dart queries)", "personal"),
            n("sqflite (Direct SQLite bindings)", "alternative"),
            n("Database Migrations & Schema Versioning"),
          ],
          n("SQL Databases")
        ),
      ],
      right: [
        g(
          [
            n("ObjectBox (High-performance embedded object DB)", "optional"),
            n("Realm Flutter (MongoDB Realm SDK)", "optional"),
            n("Firebase Cloud Firestore (Real-time sync)", "alternative"),
          ],
          n("Object & Cloud Databases")
        ),
      ],
      projectIdea:
        "Build an Offline-First Notes or Personal Finance Tracker with Drift SQLite database, encrypted credentials, and full-text search",
    }),
  ],
};

// 7. TESTING, PERFORMANCE & PUBLISHING
const TESTING_PERFORMANCE_AND_PUBLISHING: FlutterRoadmapSection = {
  id: "testing-performance-and-publishing",
  title: "Testing, Performance & Publishing",
  stages: [
    stage("Testing & Code Quality", {
      left: [
        g(
          [
            n("Unit Tests (flutter_test, mocktail, mockito)", "personal"),
            n("Widget Tests (testWidgets, Finder, pumpWidget)", "personal"),
            n("Integration Tests (integration_test on real device)"),
            n("Golden UI Tests (Visual regression testing)", "optional"),
          ],
          n("Testing Pyramid")
        ),
      ],
      right: [
        g(
          [
            n("dart analyze & dart format"),
            n("Very Good Analysis / Custom Lint rules", "personal"),
            n("analysis_options.yaml configuration"),
            n("Pre-commit Git hooks for code quality", undefined, "skill-git-github"),
          ],
          n("Linter & Code Standards")
        ),
      ],
    }),
    stage("Performance & Profiling", {
      left: [
        g(
          [
            n("Flutter DevTools (CPU Profiler & Memory Inspector)", "personal"),
            n("Identifying Jank & 60/120 FPS Dropped Frames"),
            n("Using const constructors to minimize rebuilds"),
            n("RepaintBoundary & CustomPainter optimization"),
          ],
          n("Profiling & Rendering")
        ),
      ],
      right: [
        g(
          [
            n("Image caching, rasterization & SVG rendering"),
            n("App Size Analysis (--analyze-size)"),
            n("Code Obfuscation & Symbol Stripping"),
            n("ProGuard / R8 optimization for Android"),
          ],
          n("App Size & Memory")
        ),
      ],
    }),
    stage("Deployment & Publishing", {
      left: [
        g(
          [
            n("Fastlane (Automated build, certificates & signing)", "personal"),
            n("GitHub Actions CI/CD for Flutter", "personal", "skill-git-github"),
            n("Shorebird (CodePush OTA updates for Flutter)", "optional"),
          ],
          n("CI/CD Automation")
        ),
      ],
      right: [
        g(
          [
            n("Google Play Console (AAB bundles, internal track, rollout)"),
            n("Apple App Store Connect (Certificates, Provisioning, TestFlight)"),
            n("Web deployment (Wasm & CanvasKit)"),
            n("Desktop packaging (macOS, Windows, Linux)"),
          ],
          n("Store Distribution")
        ),
      ],
      noteAfter:
        "Consistent profiling with Flutter DevTools and automated release delivery with Fastlane and GitHub Actions are key to maintaining five-star app store ratings.",
      projectIdea:
        "Ship an end-to-end production Flutter app with automated Fastlane deployment pipeline, GitHub Actions CI, and 85%+ test coverage",
    }),
  ],
};

export const FLUTTER_SECTIONS: FlutterRoadmapSection[] = [
  DART_FUNDAMENTALS,
  FLUTTER_CORE_AND_WIDGET_TREE,
  LAYOUTS_AND_UI_DESIGN,
  STATE_MANAGEMENT,
  ROUTING_NAVIGATION_AND_NETWORKING,
  LOCAL_PERSISTENCE_AND_DATABASE,
  TESTING_PERFORMANCE_AND_PUBLISHING,
];
