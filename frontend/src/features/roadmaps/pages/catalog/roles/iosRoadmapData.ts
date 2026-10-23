export type IosRoadmapStatus = "personal" | "alternative" | "optional";

export interface IosRoadmapNode {
  id: string;
  title: string;
  status?: IosRoadmapStatus;
  roadmapId?: string;
}

export interface IosRoadmapGroup {
  id: string;
  parent?: IosRoadmapNode;
  items: IosRoadmapNode[];
}

export interface IosRoadmapStage {
  id: string;
  node: IosRoadmapNode;
  left?: IosRoadmapGroup[];
  right?: IosRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface IosRoadmapSection {
  id: string;
  title?: string;
  stages: IosRoadmapStage[];
}

export interface IosRoadmapLink {
  label: string;
  roadmapId: string;
}

export const IOS_MARKERS: Array<{
  status: IosRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const IOS_RELATED_ROADMAPS: IosRoadmapLink[] = [
  { label: "Swift Roadmap", roadmapId: "skill-swift" },
  { label: "React Native Roadmap", roadmapId: "skill-react-native" },
  { label: "Flutter Roadmap", roadmapId: "skill-flutter" },
  { label: "Rust Roadmap", roadmapId: "skill-rust" },
  { label: "Git & GitHub Roadmap", roadmapId: "skill-git-github" },
];

export const IOS_CONTINUE_LEARNING: IosRoadmapLink[] = [
  { label: "Android", roadmapId: "android" },
  { label: "Flutter", roadmapId: "skill-flutter" },
  { label: "React Native", roadmapId: "skill-react-native" },
  { label: "GraphQL", roadmapId: "skill-graphql" },
  { label: "System Design", roadmapId: "skill-system-design" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: IosRoadmapStatus,
  roadmapId?: string,
  customId?: string
): IosRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: IosRoadmapNode[],
  parent?: IosRoadmapNode,
  customId?: string
): IosRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<IosRoadmapStage, "id" | "node"> & {
    status?: IosRoadmapStatus;
    roadmapId?: string;
    customId?: string;
  } = {}
): IosRoadmapStage => {
  const { status, roadmapId, customId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// --- SECTION 1: LANGUAGES & ARCHITECTURE ---
const LANGUAGES_AND_ARCHITECTURE: IosRoadmapSection = {
  id: "languages-and-architecture",
  title: "Pick a Language & Architecture",
  stages: [
    stage("Pick a Language", {
      left: [
        g([n("Cocoa Touch"), n("Core Services"), n("Core OS"), n("Media")], n("iOS Architecture")),
        g(
          [
            n("Core Graphics"),
            n("Core Animation", undefined, undefined, "arch-core-animation"),
            n("AVFoundation"),
            n("Core Image"),
            n("Core Audio"),
            n("Metal"),
          ],
          n("Media Frameworks", undefined, undefined, "media-frameworks")
        ),
      ],
      right: [
        g(
          [n("History and Why Swift?"), n("Benefits over Objective-C"), n("Swift Basics")],
          n("Swift (Recommended)", "personal", "skill-swift")
        ),
        g(
          [n("Objective-C Basics"), n("Interoperability with Swift")],
          n("Objective-C", "alternative")
        ),
      ],
      noteAfter:
        "Swift is the modern, type-safe, and recommended language for all new iOS applications. Objective-C knowledge is valuable for maintaining legacy codebases and interoperability.",
    }),
  ],
};

// --- SECTION 2: CORE CONCEPTS & VERSION CONTROL ---
const CORE_CONCEPTS: IosRoadmapSection = {
  id: "core-concepts",
  title: "Core Concepts & Version Control",
  stages: [
    stage("Core Programming Concepts", {
      right: [
        g(
          [
            n("OOP"),
            n("Functional Programming"),
            n("Memory Management"),
            n("ViewController Lifecycle"),
            n("Error Handling"),
            n("Concurrency (GCD, async/await)"),
          ],
          n("Programming Fundamentals")
        ),
      ],
    }),
    stage("Version Control", {
      roadmapId: "skill-git-github",
      left: [
        g([n("Git", "personal"), n("GitHub", "personal", "skill-git-github")], n("Source Control")),
      ],
      projectIdea:
        "Project Idea: Build a CLI or sample app while maintaining clean semantic Git commits, branching strategies, and pull requests on GitHub.",
    }),
  ],
};

// --- SECTION 3: XCODE & TOOLING ---
const XCODE_ENVIRONMENT: IosRoadmapSection = {
  id: "xcode-environment",
  title: "Xcode IDE & Environment",
  stages: [
    stage("Xcode", {
      left: [
        g([n("Installing"), n("Preferences"), n("New Project")], n("Setting Up")),
        g(
          [
            n("Interface overview"),
            n("Toolbar"),
            n("Navigators"),
            n("Editors"),
            n("Project Files"),
            n("Groups"),
          ],
          n("Navigating")
        ),
      ],
      right: [
        g([n("Breakpoints"), n("Debug Navigator"), n("Stepping")], n("Debugger")),
        g(
          [
            n("Interface Builder", undefined, undefined, "sub-ib"),
            n("IBOutlets"),
            n("IBActions"),
            n("Auto layout"),
          ],
          n("Interface Builder", undefined, undefined, "grp-interface-builder")
        ),
      ],
    }),
  ],
};

// --- SECTION 4: USER INTERFACE DEVELOPMENT ---
const USER_INTERFACE: IosRoadmapSection = {
  id: "user-interface",
  title: "User Interface Development (UIKit & SwiftUI)",
  stages: [
    stage("UIKit", {
      left: [
        g(
          [
            n("Components", undefined, undefined, "uikit-components"),
            n("Views", undefined, undefined, "uikit-views"),
            n("View Controllers", undefined, undefined, "uikit-view-controllers"),
            n("User Interactions", undefined, undefined, "uikit-user-interactions"),
          ],
          n("UIKit Basics")
        ),
      ],
      right: [
        g(
          [
            n("Basic Interfaces"),
            n("Storyboards"),
            n("Xibs"),
            n("Navigation", undefined, undefined, "uikit-navigation"),
            n("View Transitions", undefined, undefined, "uikit-view-transitions"),
          ],
          n("Building Simple UIs")
        ),
        g(
          [
            n("Views, View Controllers"),
            n("Navigation Controllers, Segues"),
            n("Navigation Stacks", undefined, undefined, "uikit-nav-stacks"),
          ],
          n("Advanced UIKit", undefined, undefined, "advanced-uikit")
        ),
      ],
    }),
    stage("SwiftUI", {
      status: "personal",
      left: [
        g(
          [
            n("Declarative Syntax"),
            n("Components", undefined, undefined, "swiftui-components"),
            n("State Management"),
            n("Data binding"),
          ],
          n("SwiftUI Basics")
        ),
      ],
      right: [
        g(
          [
            n("Building Interfaces"),
            n("Views and Modifiers"),
            n("Navigation", undefined, undefined, "swiftui-navigation"),
            n("View Transitions", undefined, undefined, "swiftui-view-transitions"),
          ],
          n("Simple UI Building")
        ),
        g(
          [
            n("Navigation Stacks", undefined, undefined, "swiftui-nav-stacks"),
            n("Navigation View"),
            n("NavigationLink"),
            n("Pushing Presenting"),
            n("Modals and Navigation"),
            n("Presenting / Dismissing views"),
          ],
          n("Interfaces and Navigation")
        ),
      ],
      projectIdea:
        "Project Idea: Build an interactive iOS app using SwiftUI declarative components, `@State` and `@Binding`, and smooth view transitions.",
    }),
    stage("UI Design", {
      right: [
        g(
          [n("HIG", "personal"), n("UI Design", undefined, undefined, "sub-ui-design")],
          n("Design Guidelines")
        ),
      ],
    }),
    stage("Core Animation", {
      left: [
        g([n("Basics / Creating Animations"), n("Lottie", "alternative")], n("Motion & Effects")),
      ],
    }),
  ],
};

// --- SECTION 5: ARCHITECTURE & REACTIVE PROGRAMMING ---
const ARCHITECTURE_AND_REACTIVE: IosRoadmapSection = {
  id: "architecture-and-reactive",
  title: "Architecture & Reactive Programming",
  stages: [
    stage("Architectural Patterns", {
      left: [
        g(
          [
            n("MVC"),
            n("MVP"),
            n("MVVM", "personal"),
            n("MVVM-C", "personal"),
            n("TCA", "alternative"),
            n("VIPER", "alternative"),
          ],
          n("Design Architecture")
        ),
      ],
      noteAfter:
        "MVVM and MVVM-C (Coordinator) are standard across modern iOS teams. The Composable Architecture (TCA) has gained strong community adoption for state-driven SwiftUI apps.",
    }),
    stage("Patterns and Techniques", {
      left: [g([n("Implementing Delegates")], n("Delegate Pattern"))],
      right: [
        g(
          [
            n("Closures"),
            n("Understanding and using Closures"),
            n("Capturing Values & Memory Mgmt."),
            n("Callback Hell"),
          ],
          n("Callbacks")
        ),
      ],
    }),
    stage("Reactive Programming", {
      left: [
        g(
          [n("Publishers / Subscribers"), n("Operators & Pipelines"), n("Combine and MVVM")],
          n("Combine", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Observables & observers"),
            n("Subjects"),
            n("Operators"),
            n("Schedulers"),
            n("RxSwift with MVVM"),
          ],
          n("RxSwift", "alternative")
        ),
      ],
    }),
  ],
};

// --- SECTION 6: DATA PERSISTENCE & STORAGE ---
const DATA_PERSISTENCE: IosRoadmapSection = {
  id: "data-persistence",
  title: "Data Persistence & Storage",
  stages: [
    stage("Data Persistence", {
      left: [
        g(
          [
            n("Core Data", "personal"),
            n("User Defaults"),
            n("Keychain", "personal"),
            n("File System"),
            n("SQLite", "alternative"),
          ],
          n("Storage Options")
        ),
      ],
      right: [
        g(
          [n("JSON / XML", undefined, undefined, "sub-json-xml"), n("Parsing"), n("Serializing")],
          n("Serialization", undefined, undefined, "grp-serialization")
        ),
      ],
      projectIdea:
        "Project Idea: Create an offline-first iOS notes or expense tracker utilizing Core Data/SwiftData, secure Keychain for credentials, and Codable JSON serialization.",
    }),
  ],
};

// --- SECTION 7: NETWORKING & CONCURRENCY ---
const NETWORKING_AND_CONCURRENCY: IosRoadmapSection = {
  id: "networking-and-concurrency",
  title: "Networking & Concurrency",
  stages: [
    stage("Networking", {
      left: [
        g(
          [n("HTTP / HTTPs"), n("REST", "personal"), n("GraphQL", "alternative", "skill-graphql")],
          n("Protocols & Formats")
        ),
      ],
      right: [
        g([n("URLSession", "personal"), n("Alamofire", "alternative")], n("Networking Clients")),
      ],
    }),
    stage("Concurrency and Multithreading", {
      left: [g([n("Async / Await", "personal"), n("Concurrency")], n("Modern Concurrency"))],
      right: [g([n("GCD", "personal"), n("Operation Queues")], n("Grand Central Dispatch"))],
    }),
  ],
};

// --- SECTION 8: DEPENDENCY MANAGEMENT & FRAMEWORKS ---
const DEPENDENCY_AND_FRAMEWORKS: IosRoadmapSection = {
  id: "dependency-and-frameworks",
  title: "Dependencies, Libraries & System Frameworks",
  stages: [
    stage("Dependency Manager", {
      left: [
        g(
          [
            n("Swift Package Manager", "personal"),
            n("CocoaPods", "alternative"),
            n("Carthage", "alternative"),
          ],
          n("Package Managers")
        ),
      ],
    }),
    stage("Frameworks & Library", {
      left: [
        g(
          [n("XCFramework", "personal"), n("Static Library"), n("Dynamic Library")],
          n("Library Types")
        ),
      ],
      right: [
        g(
          [
            n("Frameworks", undefined, undefined, "sub-frameworks"),
            n("ARKit"),
            n("HealthKit"),
            n("GameKit"),
            n("MapKit"),
            n("Core ML"),
          ],
          n("Common Services")
        ),
      ],
    }),
    stage("Accessibility", {
      right: [
        g(
          [
            n("Dynamic Type", "personal"),
            n("Voice Over", "personal"),
            n("Accessibility Inspector"),
          ],
          n("Accessibility Tools")
        ),
      ],
    }),
  ],
};

// --- SECTION 9: CODE QUALITY, DEBUGGING & TESTING ---
const QUALITY_AND_TESTING: IosRoadmapSection = {
  id: "quality-and-testing",
  title: "Code Quality, Debugging & Testing",
  stages: [
    stage("Code Quality Tools", {
      left: [
        g(
          [n("SwiftLint", "personal"), n("SwiftFormat", "personal"), n("Tailor", "alternative")],
          n("Linting & Formatting")
        ),
      ],
    }),
    stage("Debugging Techniques", {
      left: [
        g(
          [n("Xcode Debugger", "personal"), n("Profiling Instruments", "personal")],
          n("Diagnostics & Performance")
        ),
      ],
    }),
    stage("Testing", {
      right: [
        g(
          [
            n("Unit & UI Testing"),
            n("XCTest", "personal"),
            n("XCUITest", "personal"),
            n("Test Plan & Coverage"),
          ],
          n("Automated Testing")
        ),
      ],
      projectIdea:
        "Project Idea: Write automated unit and UI test suites using XCTest and XCUITest, ensuring high code coverage and configuring memory leak detection with Instruments.",
    }),
  ],
};

// --- SECTION 10: CI/CD, DISTRIBUTION & CONTINUOUS LEARNING ---
const CICD_DISTRIBUTION_AND_LEARNING: IosRoadmapSection = {
  id: "cicd-distribution-and-learning",
  title: "CI/CD, App Distribution & Continuous Learning",
  stages: [
    stage("CI / CD", {
      left: [
        g(
          [
            n("FastLane", "personal"),
            n("GitHub Actions", "personal"),
            n("Jenkins"),
            n("CircleCI"),
            n("GitLab"),
            n("Azure DevOps"),
          ],
          n("Automation & Pipelines")
        ),
      ],
    }),
    stage("App Store Distribution", {
      right: [
        g(
          [
            n("TestFlight", "personal"),
            n("App Store Distribution", undefined, undefined, "sub-app-store-dist"),
            n("App Store Optimization (ASO)"),
          ],
          n("App Distribution")
        ),
      ],
    }),
    stage("Continuous Learning", {
      right: [
        g(
          [
            n("Keeping Updated with WWDC", "personal"),
            n("Latest Swift Version"),
            n("Latest iOS SDK"),
            n("New Feature Announcements"),
          ],
          n("WWDC & Ecosystem")
        ),
      ],
    }),
  ],
};

export const IOS_SECTIONS: IosRoadmapSection[] = [
  LANGUAGES_AND_ARCHITECTURE,
  CORE_CONCEPTS,
  XCODE_ENVIRONMENT,
  USER_INTERFACE,
  ARCHITECTURE_AND_REACTIVE,
  DATA_PERSISTENCE,
  NETWORKING_AND_CONCURRENCY,
  DEPENDENCY_AND_FRAMEWORKS,
  QUALITY_AND_TESTING,
  CICD_DISTRIBUTION_AND_LEARNING,
];
