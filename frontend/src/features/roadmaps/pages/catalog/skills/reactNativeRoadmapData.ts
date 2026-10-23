export type ReactNativeRoadmapStatus = "personal" | "alternative" | "optional";

export interface ReactNativeRoadmapNode {
  id: string;
  title: string;
  status?: ReactNativeRoadmapStatus;
  roadmapId?: string;
}

export interface ReactNativeRoadmapGroup {
  id: string;
  parent?: ReactNativeRoadmapNode;
  items: ReactNativeRoadmapNode[];
}

export interface ReactNativeRoadmapStage {
  id: string;
  node: ReactNativeRoadmapNode;
  left?: ReactNativeRoadmapGroup[];
  right?: ReactNativeRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ReactNativeRoadmapSection {
  id: string;
  title?: string;
  stages: ReactNativeRoadmapStage[];
}

export interface ReactNativeRoadmapLink {
  label: string;
  roadmapId: string;
}

export const REACT_NATIVE_MARKERS: Array<{
  status: ReactNativeRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const REACT_NATIVE_RELATED_ROADMAPS: ReactNativeRoadmapLink[] = [
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "iOS Developer", roadmapId: "ios" },
  { label: "Android Developer", roadmapId: "android" },
  { label: "Flutter Roadmap", roadmapId: "skill-flutter" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "TypeScript Roadmap", roadmapId: "skill-typescript" },
];

export const REACT_NATIVE_CONTINUE_LEARNING: ReactNativeRoadmapLink[] = [
  { label: "iOS Development", roadmapId: "ios" },
  { label: "Android Development", roadmapId: "android" },
  { label: "React", roadmapId: "skill-react" },
  { label: "TypeScript", roadmapId: "skill-typescript" },
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
  status?: ReactNativeRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ReactNativeRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ReactNativeRoadmapNode[],
  parent?: ReactNativeRoadmapNode,
  customId?: string
): ReactNativeRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ReactNativeRoadmapStage, "id" | "node"> & {
    status?: ReactNativeRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ReactNativeRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. CORE & ARCHITECTURE
const CORE_AND_ARCHITECTURE: ReactNativeRoadmapSection = {
  id: "core-and-architecture",
  title: "React Native Core & Architecture",
  stages: [
    stage("Prerequisites", {
      left: [
        g(
          [
            n("React Component Model & Hooks", "personal", "skill-react"),
            n("TypeScript in Mobile Dev", "personal", "skill-typescript"),
            n("JavaScript Core (ES6+)", undefined, "skill-javascript"),
          ],
          n("Foundations")
        ),
      ],
      right: [
        g(
          [
            n("Mobile OS Concepts (iOS & Android)"),
            n("App Lifecycle (Active, Background, Inactive)"),
            n("Command Line Tools & Package Managers"),
          ],
          n("Mobile Fundamentals")
        ),
      ],
    }),
    stage("The Architecture & Runtimes", {
      left: [
        g(
          [
            n("Hermes JS Engine (Fast startup & low memory)", "personal"),
            n("V8 / JavaScriptCore (JSC)", "alternative"),
            n("Just-In-Time vs Ahead-Of-Time (AOT) bytecode"),
          ],
          n("JavaScript Engine")
        ),
      ],
      right: [
        g(
          [
            n("New Architecture: JSI (JavaScript Interface)", "personal"),
            n("Fabric Renderer (Concurrent Native UI)", "personal"),
            n("TurboModules (Lazy Native Modules)", "personal"),
            n("Codegen (Type-safe C++ bindings)"),
            n("Legacy Async Bridge (JSON Serialization)", "optional"),
          ],
          n("Native Interop & Architecture")
        ),
      ],
      noteAfter:
        "React Native's New Architecture replaces the asynchronous JSON bridge with JSI, allowing direct C++ synchronization and concurrent rendering.",
    }),
  ],
};

// 2. NATIVE COMPONENTS & LAYOUT
const NATIVE_COMPONENTS_AND_LAYOUT: ReactNativeRoadmapSection = {
  id: "native-components-and-layout",
  title: "Native Components & Layout",
  stages: [
    stage("Core UI Primitives", {
      left: [
        g(
          [
            n("View (Native container primitive)", "personal"),
            n("Text (Typography & nesting)", "personal"),
            n("Image & ImageBackground", "personal"),
            n("TextInput & KeyboardAvoidingView"),
            n("Pressable (Gesture response)", "personal"),
            n("TouchableOpacity / TouchableHighlight", "alternative"),
          ],
          n("Standard Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Modal (Native presentation dialogs)"),
            n("ActivityIndicator (Loading spinners)"),
            n("StatusBar control"),
            n("Switch & Slider"),
          ],
          n("Interactive Controls")
        ),
      ],
    }),
    stage("Flexbox & Styling", {
      left: [
        g(
          [
            n("Yoga Layout Engine (Flexbox default column)", "personal"),
            n("StyleSheet.create (Cached styles)", "personal"),
            n("Dimensions & useWindowDimensions"),
            n("SafeAreaView / react-native-safe-area-context", "personal"),
          ],
          n("Layout & Styling Engine")
        ),
      ],
      right: [
        g(
          [
            n("NativeWind / Tailwind for React Native", "personal"),
            n("Restyle (Shopify typed UI library)", "alternative"),
            n("Platform-specific extensions (.ios.js / .android.js)"),
            n("Platform.select & Platform.OS conditionals"),
          ],
          n("Modern Styling & Platform Specifics")
        ),
      ],
    }),
    stage("High-Performance Lists", {
      left: [
        g(
          [
            n("FlatList (Virtualization & windowing)", "personal"),
            n("SectionList (Grouped sections & headers)"),
            n("ScrollView (Small scrolling containers)"),
          ],
          n("Built-in Scroll Containers")
        ),
      ],
      right: [
        g(
          [
            n("FlashList by Shopify (Recycled cell rendering)", "personal"),
            n("List optimization: getItemLayout & maxToRenderPerBatch"),
            n("Pull-to-refresh (RefreshControl)"),
            n("End-reached pagination triggers"),
          ],
          n("Optimized List Solutions")
        ),
      ],
      projectIdea:
        "Project Idea: Instagram-style infinite media feed using FlashList with video playback and pull-to-refresh.",
    }),
  ],
};

// 3. NAVIGATION & ROUTING
const NAVIGATION_AND_ROUTING: ReactNativeRoadmapSection = {
  id: "navigation-and-routing",
  title: "Navigation & Routing",
  stages: [
    stage("React Navigation", {
      left: [
        g(
          [
            n("Native Stack Navigator (@react-navigation/native-stack)", "personal"),
            n("Bottom Tabs Navigator", "personal"),
            n("Drawer Navigator", "alternative"),
          ],
          n("Navigation Paradigms")
        ),
      ],
      right: [
        g(
          [
            n("Navigation Lifecycle (focus, blur, beforeRemove)"),
            n("Passing Type-Safe Route Params"),
            n("Header customization & transitions"),
            n("Custom Back Handler (Android Hardware Back)"),
          ],
          n("Navigator Control & Lifecycle")
        ),
      ],
    }),
    stage("File-Based Routing & Deep Linking", {
      left: [
        g(
          [
            n("Expo Router (File-based routes & tabs)", "personal"),
            n("Nested Layouts & Stack Slots", "personal"),
            n("Modal Presentation & Intercepting Routes"),
          ],
          n("File-Based Routing")
        ),
      ],
      right: [
        g(
          [
            n("Deep Linking Schemes (custom-scheme://)", "personal"),
            n("Universal Links (iOS) & App Links (Android)", "personal"),
            n("Linking API & URL parsing"),
            n("Push Notification deep link routing"),
          ],
          n("Universal & Deep Links")
        ),
      ],
      noteAfter:
        "Expo Router brings Next.js-like file-based routing and automatic deep link generation to native mobile apps.",
      projectIdea:
        "Project Idea: Multi-tab marketplace app with nested product stacks, modal checkout flow, and custom URL scheme handling.",
    }),
  ],
};

// 4. NATIVE DEVICE APIS & MODULES
const NATIVE_DEVICE_APIS: ReactNativeRoadmapSection = {
  id: "native-device-apis",
  title: "Native Device APIs & Modules",
  stages: [
    stage("Hardware & Permissions", {
      left: [
        g(
          [
            n("Expo Camera / react-native-vision-camera", "personal"),
            n("Location & GPS (expo-location)", "personal"),
            n("Sensors (Accelerometer, Gyroscope)"),
            n("Haptics Feedback (expo-haptics)", "personal"),
          ],
          n("Device Hardware")
        ),
      ],
      right: [
        g(
          [
            n("System Permissions Flow (iOS Info.plist & Android Manifest)", "personal"),
            n("Permission state handling (granted, denied, blocked)"),
            n("Biometrics (expo-local-authentication / FaceID)", "personal"),
          ],
          n("Permissions & Security")
        ),
      ],
    }),
    stage("Storage & Notifications", {
      left: [
        g(
          [
            n("react-native-mmkv (Ultra fast synchronous KV)", "personal"),
            n("AsyncStorage (Legacy async KV)", "alternative"),
            n("expo-secure-store (Keychain / Keystore tokens)", "personal"),
            n("WatermelonDB / OP-SQLite (Offline relational)", "alternative"),
          ],
          n("Offline Storage & Persistence")
        ),
      ],
      right: [
        g(
          [
            n("Expo Notifications (Push & Local)", "personal"),
            n("Apple Push Notification service (APNs)"),
            n("Firebase Cloud Messaging (FCM)", "personal"),
            n("Background Tasks & Headless JS"),
          ],
          n("Push & Background Notifications")
        ),
      ],
      projectIdea:
        "Project Idea: Secure fitness tracker recording GPS routes offline in MMKV and syncing when reconnected.",
    }),
  ],
};

// 5. NATIVE PERFORMANCE & DEBUGGING
const PERFORMANCE_AND_DEBUGGING: ReactNativeRoadmapSection = {
  id: "performance-and-debugging",
  title: "Native Performance & Debugging",
  stages: [
    stage("Debugging Tooling", {
      left: [
        g(
          [
            n("React Native DevTools (Hermes debugger)", "personal"),
            n("Reactotron (State & network inspection)", "personal"),
            n("Flipper (Native debugging suite)", "alternative"),
          ],
          n("Inspectors & Tooling")
        ),
      ],
      right: [
        g(
          [
            n("Fast Refresh & Hot Reloading internals"),
            n("Network Traffic Inspection"),
            n("Redux / Zustand state debugging"),
          ],
          n("Development Velocity")
        ),
      ],
    }),
    stage("Profiling & Fluid Animations", {
      left: [
        g(
          [
            n("React Native Reanimated (UI thread animations)", "personal"),
            n("react-native-gesture-handler (Native touch events)", "personal"),
            n("LayoutAnimation & Animated API", "alternative"),
          ],
          n("Declarative Gestures & Animations")
        ),
      ],
      right: [
        g(
          [
            n("Memory Leak Profiling (Instruments & Android Studio)", "personal"),
            n("Systrace & Hermes sampling profiler"),
            n("Image Caching (expo-image / FastImage)", "personal"),
            n("InteractionManager & requestAnimationFrame"),
          ],
          n("Frame Rate & Profiling")
        ),
      ],
      noteAfter:
        "Run animations on the native UI thread using Reanimated worklets to maintain smooth 60fps/120fps motion even during heavy JavaScript computation.",
      projectIdea:
        "Project Idea: Gesture-driven Tinder-like swipe deck running at 120fps with Reanimated 3 and Gesture Handler.",
    }),
  ],
};

// 6. DEPLOYMENT & APP STORES
const DEPLOYMENT_AND_APP_STORES: ReactNativeRoadmapSection = {
  id: "deployment-and-app-stores",
  title: "Deployment & App Stores",
  stages: [
    stage("Build Configurations & CI/CD", {
      left: [
        g(
          [
            n("EAS Build (Expo Application Services)", "personal"),
            n("Fastlane (Automated screenshot & release pipelines)", "alternative"),
            n("GitHub Actions for Mobile CI/CD"),
          ],
          n("Build Automation")
        ),
      ],
      right: [
        g(
          [
            n("iOS Xcode Schemes & Provisioning Profiles", "personal"),
            n("Android Gradle Flavors & Keystore Signing", "personal"),
            n("Expo Config Plugins (app.json / app.config.js)"),
            n("Native Pods & CocoaPods management"),
          ],
          n("Native Project Configuration")
        ),
      ],
    }),
    stage("App Store Distribution & Updates", {
      left: [
        g(
          [
            n("Apple App Store & TestFlight distribution", "personal"),
            n("Google Play Console & Internal Testing tracks", "personal"),
            n("Store Review Guidelines & Metadata"),
          ],
          n("Store Publishing")
        ),
      ],
      right: [
        g(
          [
            n("EAS Update (Over-the-Air OTA updates)", "personal"),
            n("Microsoft CodePush (OTA alternative)", "alternative"),
            n("Sentry / Bugsnag Crash Reporting", "personal"),
            n("App size reduction & Hermes bytecode splitting"),
          ],
          n("Post-Launch Maintenance")
        ),
      ],
      projectIdea:
        "Project Idea: Production automated CI/CD pipeline using EAS Build to deploy staging builds on pull requests.",
    }),
  ],
};

export const REACT_NATIVE_SECTIONS: ReactNativeRoadmapSection[] = [
  CORE_AND_ARCHITECTURE,
  NATIVE_COMPONENTS_AND_LAYOUT,
  NAVIGATION_AND_ROUTING,
  NATIVE_DEVICE_APIS,
  PERFORMANCE_AND_DEBUGGING,
  DEPLOYMENT_AND_APP_STORES,
];
