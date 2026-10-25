export type AndroidRoadmapStatus = "personal" | "alternative" | "optional";

export interface AndroidRoadmapNode {
  id: string;
  title: string;
  status?: AndroidRoadmapStatus;
  roadmapId?: string;
}

export interface AndroidRoadmapGroup {
  id: string;
  parent?: AndroidRoadmapNode;
  items: AndroidRoadmapNode[];
}

export interface AndroidRoadmapStage {
  id: string;
  node: AndroidRoadmapNode;
  left?: AndroidRoadmapGroup[];
  right?: AndroidRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface AndroidRoadmapSection {
  id: string;
  title?: string;
  stages: AndroidRoadmapStage[];
}

export interface AndroidRoadmapLink {
  label: string;
  roadmapId: string;
}

export const ANDROID_MARKERS: Array<{
  status: AndroidRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const ANDROID_RELATED_ROADMAPS: AndroidRoadmapLink[] = [
  { label: "Kotlin Roadmap", roadmapId: "skill-kotlin" },
  { label: "Java Roadmap", roadmapId: "skill-java" },
  { label: "Flutter Roadmap", roadmapId: "skill-flutter" },
  { label: "React Native Roadmap", roadmapId: "skill-react-native" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
];

export const ANDROID_CONTINUE_LEARNING: AndroidRoadmapLink[] = [
  { label: "Flutter", roadmapId: "skill-flutter" },
  { label: "React Native", roadmapId: "skill-react-native" },
  { label: "iOS", roadmapId: "ios" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "GraphQL", roadmapId: "skill-graphql" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: AndroidRoadmapStatus,
  roadmapId?: string,
  customId?: string
): AndroidRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: AndroidRoadmapNode[],
  parent?: AndroidRoadmapNode,
  customId?: string
): AndroidRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<AndroidRoadmapStage, "id" | "node"> & {
    status?: AndroidRoadmapStatus;
    roadmapId?: string;
    customId?: string;
  } = {}
): AndroidRoadmapStage => {
  const { status, roadmapId, customId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: AndroidRoadmapSection = {
  id: "foundations",
  title: "1. Language & Development Environment",
  stages: [
    stage("Pick a Language", {
      status: "personal",
      left: [
        g(
          [
            n("Basic Syntax & Types", "personal"),
            n("Null Safety", "personal"),
            n("OOP in Kotlin", "personal"),
            n("Functions & Lambdas", "personal"),
            n("Data & Sealed Classes", "personal"),
            n("Extension Functions", "personal"),
            n("Coroutines Basics", "personal"),
          ],
          n("Kotlin", "personal", "skill-kotlin")
        ),
      ],
      right: [
        g(
          [
            n("Basic Syntax & Types", "alternative"),
            n("OOP Concepts", "alternative"),
            n("Collections Framework", "alternative"),
            n("Generics", "alternative"),
            n("Concurrency & Threads", "alternative"),
          ],
          n("Java", "alternative", "skill-java")
        ),
      ],
      noteAfter:
        "Kotlin is Google's designated primary language for modern Android development. Focus heavily on Kotlin unless you are supporting legacy codebases.",
    }),
    stage("Android Studio & Tooling", {
      status: "personal",
      left: [
        g(
          [
            n("Project Structure & Manifest", "personal"),
            n("Android Emulator & Physical Device", "personal"),
            n("Logcat & Debugger", "personal"),
            n("SDK Manager & AVD Manager", "personal"),
            n("Layout Inspector", "personal"),
          ],
          n("Android Studio", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Gradle Basics", "personal"),
            n("build.gradle.kts (Kotlin DSL)", "personal"),
            n("Dependencies Management", "personal"),
            n("Build Types (debug / release)", "personal"),
            n("Product Flavors", "optional"),
          ],
          n("Build System (Gradle)", "personal")
        ),
      ],
      projectIdea: "Project Idea: Build a Simple Unit Converter or Calculator App",
    }),
    stage("Version Control", {
      left: [
        g(
          [
            n("Git Basics (commit, branch, merge)", "personal"),
            n("GitHub / GitLab", "personal"),
            n(".gitignore for Android", "personal"),
          ],
          n("Git", "personal", "skill-git-github")
        ),
      ],
    }),
  ],
};

const APP_COMPONENTS_AND_UI: AndroidRoadmapSection = {
  id: "app-components-and-ui",
  title: "2. App Components & UI Architecture",
  stages: [
    stage("App Components", {
      status: "personal",
      left: [
        g(
          [
            n("Activity", "personal"),
            n("Services", "alternative"),
            n("Broadcast Receivers", "optional"),
            n("Content Providers", "optional"),
          ],
          n("Core Components", "personal")
        ),
        g(
          [
            n("Explicit Intents", "personal"),
            n("Implicit Intents", "personal"),
            n("Intent Filters", "optional"),
            n("Passing Data with Bundles", "personal"),
          ],
          n("Intents", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Activity Lifecycle Callbacks", "personal"),
            n("State Changes (Foreground / Background)", "personal"),
            n("Tasks and Back Stack", "personal"),
            n("Configuration Changes", "personal"),
            n("SavedInstanceState & Process Death", "personal"),
          ],
          n("Lifecycle & Tasks", "personal")
        ),
      ],
    }),
    stage("Building User Interfaces", {
      status: "personal",
      left: [
        g(
          [
            n("Composable Functions", "personal"),
            n("State & Recomposition", "personal"),
            n("Layouts (Column, Row, Box)", "personal"),
            n("LazyColumn & LazyRow", "personal"),
            n("Modifiers", "personal"),
            n("Material 3 Components", "personal"),
            n("Theming & Typography", "personal"),
            n("Side Effects (LaunchedEffect)", "personal"),
          ],
          n("Jetpack Compose (Modern)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("ConstraintLayout", "personal"),
            n("LinearLayout & FrameLayout", "alternative"),
            n("RecyclerView & ViewHolder", "personal"),
            n("ViewBinding & DataBinding", "alternative"),
            n("Custom Views & Canvas", "optional"),
            n("XML Styles and Attributes", "alternative"),
          ],
          n("Views & XML (Legacy)", "alternative")
        ),
      ],
      noteAfter:
        "Jetpack Compose is the modern declarative UI toolkit for native Android. Master Compose for all new work while understanding XML Layouts and RecyclerView for existing projects.",
      projectIdea: "Project Idea: Build a Task Management / Habit Tracker App with Jetpack Compose",
    }),
    stage("Navigation", {
      status: "personal",
      left: [
        g(
          [
            n("Navigation Compose", "personal"),
            n("NavHost & NavController", "personal"),
            n("Type-Safe Destinations", "personal"),
            n("Deep Linking", "optional"),
          ],
          n("Compose Navigation", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Fragment Lifecycle", "alternative"),
            n("FragmentManager & Transactions", "alternative"),
            n("Jetpack Navigation Component", "personal"),
            n("SafeArgs Plugin", "personal"),
          ],
          n("Fragment Navigation (XML)", "alternative")
        ),
      ],
    }),
  ],
};

const ASYNC_NETWORKING_STORAGE: AndroidRoadmapSection = {
  id: "async-networking-storage",
  title: "3. Concurrency, Networking & Data Persistence",
  stages: [
    stage("Asynchronous Programming", {
      status: "personal",
      left: [
        g(
          [
            n("CoroutineScope & CoroutineContext", "personal"),
            n("Dispatchers (Main, IO, Default)", "personal"),
            n("suspend functions", "personal"),
            n("Structured Concurrency", "personal"),
            n("Job & Deferred (async / await)", "personal"),
            n("Coroutine Exception Handling", "personal"),
          ],
          n("Kotlin Coroutines", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Flow Basics (Cold Streams)", "personal"),
            n("StateFlow & SharedFlow (Hot Streams)", "personal"),
            n("Flow Operators (map, filter, combine)", "personal"),
            n("Lifecycle-Aware Collection", "personal"),
            n("RxJava / RxKotlin (Legacy)", "alternative"),
          ],
          n("Reactive Programming", "personal")
        ),
      ],
    }),
    stage("Networking & APIs", {
      status: "personal",
      left: [
        g(
          [
            n("Retrofit (REST Client)", "personal"),
            n("OkHttp & Interceptors", "personal"),
            n("Ktor Client", "alternative"),
            n("Apollo-Android (GraphQL)", "optional", "skill-graphql"),
          ],
          n("HTTP Clients", "personal")
        ),
      ],
      right: [
        g(
          [
            n("kotlinx.serialization", "personal"),
            n("Moshi", "alternative"),
            n("Gson (Legacy)", "alternative"),
            n("Coil (Image Loading)", "personal"),
            n("Glide (Image Loading)", "alternative"),
          ],
          n("Serialization & Media", "personal")
        ),
      ],
      projectIdea: "Project Idea: Build a Weather App or GitHub Repositories Explorer",
    }),
    stage("Local Storage", {
      status: "personal",
      left: [
        g(
          [
            n("Room Database", "personal"),
            n("Entities, DAOs, Database", "personal"),
            n("TypeConverters", "personal"),
            n("Database Migrations", "personal"),
            n("Flow Integration with Room", "personal"),
            n("SQLDelight", "alternative"),
          ],
          n("Relational Database", "personal", "skill-sql")
        ),
      ],
      right: [
        g(
          [
            n("Preferences DataStore", "personal"),
            n("Proto DataStore", "optional"),
            n("SharedPreferences (Legacy)", "alternative"),
            n("Internal & External Storage", "personal"),
            n("Scoped Storage", "personal"),
          ],
          n("Preferences & Files", "personal")
        ),
      ],
      noteAfter:
        "Combine Retrofit for remote data, Room for local caching, and Coroutines/Flow for reactive updates to build offline-first Android apps.",
    }),
  ],
};

const ARCHITECTURE_AND_INJECTION: AndroidRoadmapSection = {
  id: "architecture-and-injection",
  title: "4. Architecture & Dependency Injection",
  stages: [
    stage("App Architecture", {
      status: "personal",
      left: [
        g(
          [
            n("Separation of Concerns", "personal"),
            n("Single Source of Truth", "personal"),
            n("Unidirectional Data Flow (UDF)", "personal"),
            n("UI Layer (UI State & UI Events)", "personal"),
            n("Data Layer (Repositories & Data Sources)", "personal"),
            n("Domain Layer (Use Cases)", "optional"),
          ],
          n("Guide to App Architecture", "personal")
        ),
      ],
      right: [
        g(
          [
            n("MVVM (Model-View-ViewModel)", "personal"),
            n("MVI (Model-View-Intent)", "alternative"),
            n("Repository Pattern", "personal"),
            n("Factory Pattern", "optional"),
            n("Observer Pattern", "optional"),
          ],
          n("Patterns & Models", "personal")
        ),
      ],
    }),
    stage("Android Jetpack", {
      status: "personal",
      left: [
        g(
          [
            n("ViewModel", "personal"),
            n("LiveData (Legacy / View-based)", "alternative"),
            n("Lifecycle & LifecycleOwner", "personal"),
            n("WorkManager (Deferred Tasks)", "personal"),
            n("Paging 3 Library", "optional"),
          ],
          n("Architecture Components", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Hilt (Google Recommended)", "personal"),
            n("Dagger 2", "alternative"),
            n("Koin (Kotlin DSL)", "alternative"),
            n("Dependency Inversion Principle", "personal"),
          ],
          n("Dependency Injection", "personal")
        ),
      ],
      projectIdea:
        "Project Idea: Build an Offline-First News Reader with MVVM, Hilt, Room, and Retrofit",
    }),
  ],
};

const TESTING_QUALITY_SECURITY: AndroidRoadmapSection = {
  id: "testing-quality-security",
  title: "5. Testing, Code Quality & Security",
  stages: [
    stage("Testing", {
      status: "personal",
      left: [
        g(
          [
            n("JUnit 4 / JUnit 5", "personal"),
            n("MockK (Kotlin Mocking)", "personal"),
            n("Mockito", "alternative"),
            n("Turbine (Flow Testing)", "personal"),
            n("TestDispatcher & Coroutines Test", "personal"),
            n("Truth Assertions", "optional"),
          ],
          n("Unit Testing (JVM)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Compose Testing (composeTestRule)", "personal"),
            n("Espresso (View Testing)", "alternative"),
            n("UI Automator", "optional"),
            n("Robolectric", "optional"),
            n("Hilt in Instrumented Tests", "personal"),
          ],
          n("UI & Instrumentation Tests", "personal")
        ),
      ],
    }),
    stage("Code Quality & Profiling", {
      status: "personal",
      left: [
        g(
          [
            n("Android Lint", "personal"),
            n("Ktlint", "personal"),
            n("Detekt (Kotlin Code Analysis)", "personal"),
            n("SonarQube", "optional"),
          ],
          n("Static Analysis & Quality", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Android Studio Profiler (CPU, Memory)", "personal"),
            n("LeakCanary (Memory Leaks)", "personal"),
            n("Timber (Logging)", "personal"),
            n("Chucker (Network Inspector)", "personal"),
            n("Macrobenchmark & Baseline Profiles", "optional"),
          ],
          n("Debugging & Profiling", "personal")
        ),
      ],
    }),
    stage("Security & Hardening", {
      status: "personal",
      left: [
        g(
          [
            n("Android Keystore System", "personal"),
            n("EncryptedSharedPreferences", "personal"),
            n("Network Security Configuration", "personal"),
            n("Certificate Pinning (SSL)", "personal"),
            n("BiometricPrompt API", "optional"),
          ],
          n("App Security", "personal")
        ),
      ],
      right: [
        g(
          [
            n("R8 Code Shrinker", "personal"),
            n("ProGuard Obfuscation Rules", "personal"),
            n("Resource Shrinking", "personal"),
            n("Play Integrity API", "optional"),
            n("Secrets Gradle Plugin", "personal"),
          ],
          n("Obfuscation & Shrinking", "personal")
        ),
      ],
    }),
  ],
};

const SERVICES_AND_DISTRIBUTION: AndroidRoadmapSection = {
  id: "services-and-distribution",
  title: "6. Common Services & Play Store Distribution",
  stages: [
    stage("Firebase & Cloud Services", {
      status: "personal",
      left: [
        g(
          [
            n("Firebase Authentication", "personal"),
            n("Cloud Firestore / Realtime Database", "alternative"),
            n("Cloud Messaging (FCM Push)", "personal"),
            n("Firebase Crashlytics", "personal"),
            n("Firebase Remote Config", "optional"),
          ],
          n("Firebase Ecosystem", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Google Maps SDK", "optional"),
            n("Location Services & FusedLocationProvider", "personal"),
            n("Google Play Services", "personal"),
            n("CameraX API", "optional"),
            n("Google Mobile Ads (AdMob)", "optional"),
          ],
          n("Device & Google APIs", "personal")
        ),
      ],
    }),
    stage("Publishing & App Distribution", {
      status: "personal",
      left: [
        g(
          [
            n("Android App Bundle (AAB)", "personal"),
            n("Upload Keystore & App Signing", "personal"),
            n("Google Play App Signing", "personal"),
            n("Play Feature Delivery", "optional"),
          ],
          n("Build Outputs & Signing", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Google Play Console", "personal"),
            n("Release Tracks (Internal, Closed, Open, Prod)", "personal"),
            n("Firebase App Distribution", "personal"),
            n("Android Vitals & Crash Monitoring", "personal"),
            n("Store Listing & Screenshots", "personal"),
          ],
          n("Distribution Channels", "personal")
        ),
      ],
      noteAfter:
        "Package your application into an Android App Bundle (.aab), configure ProGuard/R8, test thoroughly using internal testing tracks, and monitor live performance and crashes using Android Vitals and Crashlytics.",
      projectIdea:
        "Project Idea: Build and publish a complete production Android app to Google Play Store",
    }),
  ],
};

export const ANDROID_SECTIONS: AndroidRoadmapSection[] = [
  FOUNDATIONS,
  APP_COMPONENTS_AND_UI,
  ASYNC_NETWORKING_STORAGE,
  ARCHITECTURE_AND_INJECTION,
  TESTING_QUALITY_SECURITY,
  SERVICES_AND_DISTRIBUTION,
];
