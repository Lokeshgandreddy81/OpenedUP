export type DesignSystemRoadmapStatus = "personal" | "alternative" | "optional";

export interface DesignSystemRoadmapNode {
  id: string;
  title: string;
  status?: DesignSystemRoadmapStatus;
  roadmapId?: string;
}

export interface DesignSystemRoadmapGroup {
  id: string;
  parent?: DesignSystemRoadmapNode;
  items: DesignSystemRoadmapNode[];
}

export interface DesignSystemRoadmapStage {
  id: string;
  node: DesignSystemRoadmapNode;
  left?: DesignSystemRoadmapGroup[];
  right?: DesignSystemRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DesignSystemRoadmapSection {
  id: string;
  title?: string;
  stages: DesignSystemRoadmapStage[];
}

export interface DesignSystemRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DESIGN_SYSTEM_MARKERS: Array<{
  status: DesignSystemRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DESIGN_SYSTEM_RELATED_ROADMAPS: DesignSystemRoadmapLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "UX Design Roadmap", roadmapId: "ux-design" },
  { label: "Product Design Roadmap", roadmapId: "product-design" },
  { label: "CSS Roadmap", roadmapId: "skill-css" },
  { label: "HTML Roadmap", roadmapId: "skill-html" },
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "TypeScript Roadmap", roadmapId: "skill-typescript" },
];

export const DESIGN_SYSTEM_CONTINUE_LEARNING: DesignSystemRoadmapLink[] = [
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "UX Design", roadmapId: "ux-design" },
  { label: "Product Design", roadmapId: "product-design" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DesignSystemRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DesignSystemRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DesignSystemRoadmapNode[],
  parent?: DesignSystemRoadmapNode,
  customId?: string
): DesignSystemRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DesignSystemRoadmapStage, "id" | "node"> & {
    status?: DesignSystemRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): DesignSystemRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. DESIGN SYSTEM FOUNDATIONS
const DESIGN_SYSTEM_FOUNDATIONS: DesignSystemRoadmapSection = {
  id: "design-system-foundations",
  title: "Design System Foundations",
  stages: [
    stage("Foundational Overview", {
      left: [
        g(
          [
            n("What is a Design System?", "personal"),
            n("Core Design Principles"),
            n("Brand Identity & Voice"),
            n("Atomic Design Methodology"),
          ],
          n("Concepts & Principles")
        ),
      ],
      right: [
        g(
          [
            n("HTML Semantics", undefined, "skill-html"),
            n("Modern CSS & Flexbox/Grid", undefined, "skill-css"),
            n("Figma UI Fundamentals"),
          ],
          n("Prerequisites")
        ),
      ],
      noteAfter:
        "A design system is a comprehensive set of standards, reusable UI components, and guided documentation that aligns design and code at scale.",
    }),
    stage("Design Tokens", {
      status: "personal",
      left: [
        g(
          [
            n("Global / Base Tokens (Colors, Raw Values)", "personal"),
            n("Alias / Semantic Tokens (Primary, Surface, Text)", "personal"),
            n("Component-Specific Tokens (Button-bg, Card-radius)"),
            n("Dark Mode & Theming Tiers"),
          ],
          n("Token Architecture & Hierarchy")
        ),
      ],
      right: [
        g(
          [
            n("W3C DTCG Format Specification", "personal"),
            n("Style Dictionary (Token Transform)", "personal"),
            n("Token Studio for Figma"),
            n("Tokens in JSON / YAML"),
          ],
          n("Token Formats & Tooling")
        ),
      ],
      projectIdea: "Milestone: Build a Multi-Brand Design Token Architecture with Style Dictionary",
    }),
    stage("Typography", {
      left: [
        g(
          [
            n("Font Families (Primary, Display, Mono)"),
            n("Modular Type Scale (1.25 Major Third / 1.125 Major Second)", "personal"),
            n("Line Heights & Relative Leading"),
            n("Font Weights & Hierarchy"),
          ],
          n("Type System Scales")
        ),
      ],
      right: [
        g(
          [
            n("Fluid Typography with clamp()", "personal"),
            n("Web Font Loading & Subsetting (WOFF2)"),
            n("Text Truncation & Line Clamping"),
            n("Font Metrics Override & FOUT/FOIT Prevention"),
          ],
          n("Responsive & Performance")
        ),
      ],
    }),
    stage("Color Palettes", {
      status: "personal",
      left: [
        g(
          [
            n("Primary, Secondary & Neutral Palettes", "personal"),
            n("Semantic Colors (Success, Warning, Danger, Info)", "personal"),
            n("Color Scales (50 to 950 steps)"),
            n("Surface, Background & Border Tokens"),
          ],
          n("Palette Architecture")
        ),
      ],
      right: [
        g(
          [
            n("APCA & WCAG Contrast Rules (4.5:1 / 3:1)", "personal"),
            n("OKLCH & HSL Color Spaces", "alternative"),
            n("Color Blindness Simulation & Auditing"),
            n("High Contrast Mode Themes"),
          ],
          n("Accessibility & Contrast")
        ),
      ],
    }),
    stage("Spacing & Grid", {
      left: [
        g(
          [
            n("8-Point / 4-Point Spatial Grid", "personal"),
            n("Spacing Tokens (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)"),
            n("Negative Spacing Tokens"),
            n("Layout Container Widths"),
          ],
          n("Spatial Systems")
        ),
      ],
      right: [
        g(
          [
            n("Responsive Breakpoints (Mobile, Tablet, Desktop, Wide)"),
            n("12-Column Responsive Grid"),
            n("Flexbox Layout Primitives (Stack, Inline, Box)"),
            n("CSS Grid Template Primitives"),
          ],
          n("Grid & Layout Primitives")
        ),
      ],
    }),
    stage("Elevation & Shadows", {
      left: [
        g(
          [
            n("Elevation Levels (Flat, Raised, Floating, Overlay)", "personal"),
            n("Composite Shadows (Ambient + Directional)", "personal"),
            n("Inner Inset Shadows & Borders"),
            n("Dark Mode Elevation with Surface Tints"),
          ],
          n("Elevation Layers")
        ),
      ],
      right: [
        g(
          [
            n("Z-Index Scale (Dropdowns, Sticky, Modals, Tooltips, Toasts)", "personal"),
            n("Backdrop Blur & Frost Glass Effects"),
            n("Focus Ring Shadows & Outlines"),
          ],
          n("Z-Index & Surface Treatments")
        ),
      ],
      noteAfter:
        "Elevation gives depth cues to users; pairing shadow depth with surface luminosity changes creates realistic lighting across both light and dark themes.",
    }),
  ],
};

// 2. CORE UI COMPONENTS
const CORE_UI_COMPONENTS: DesignSystemRoadmapSection = {
  id: "core-ui-components",
  title: "Core UI Components",
  stages: [
    stage("Buttons & Interactive Primitives", {
      status: "personal",
      left: [
        g(
          [
            n("Primary, Secondary, Tertiary & Ghost Variants", "personal"),
            n("Icon Buttons & Sizing Scales (sm, md, lg)"),
            n("Loading Spinner State & Disabled Behavior"),
            n("Split Buttons & Dropdown Triggers"),
          ],
          n("Button Architecture")
        ),
      ],
      right: [
        g(
          [
            n("Link vs Button Semantics", "personal"),
            n("Keyboard Interaction (Enter & Space)"),
            n("Focus Visible States & Active Cues"),
          ],
          n("Button Behaviors")
        ),
      ],
      projectIdea:
        "Milestone: Build a Production Button Component with all variants and state transitions",
    }),
    stage("Form Controls & Inputs", {
      status: "personal",
      left: [
        g(
          [
            n("Text Input with Leading/Trailing Adornments", "personal"),
            n("Textarea & Auto-resize Inputs"),
            n("Select Dropdown & Combobox Autocomplete", "personal"),
            n("Checkbox, Radio Groups & Segmented Controls"),
            n("Toggle Switch & Range Slider"),
          ],
          n("Input Elements")
        ),
      ],
      right: [
        g(
          [
            n("Floating vs Static Labels"),
            n("Helper Text, Error Messages & Field Validation"),
            n("Required Field Markers"),
            n("Input Masking (Phone, Currency, Dates)"),
          ],
          n("Field Labeling & Validation")
        ),
      ],
    }),
    stage("Overlays & Modals", {
      left: [
        g(
          [
            n("Modal Dialogs & Confirmation Prompts", "personal"),
            n("Drawers & Slide-over Sheets"),
            n("Alert Dialogs for Destructive Actions"),
            n("Popovers & Contextual Flyouts"),
          ],
          n("Modal & Sheet Containers")
        ),
      ],
      right: [
        g(
          [
            n("Focus Trap within Modals", "personal"),
            n("Escape Key to Close & Click Outside Dismiss"),
            n("Backdrop Scrim & Scroll Lock"),
            n("Initial Focus & Return Focus Management"),
          ],
          n("Overlay Accessibility")
        ),
      ],
    }),
    stage("Tooltips & Feedback", {
      left: [
        g(
          [
            n("Instant vs Delayed Tooltips", "personal"),
            n("Interactive Toggletips / Info Badges"),
            n("Toast Notifications & Snackbars"),
            n("Inline Banner Alerts & Callouts"),
          ],
          n("Feedback Elements")
        ),
      ],
      right: [
        g(
          [
            n("Floating UI / Popper Anchor Positioning", "personal"),
            n("Collision Detection & Flip Behavior"),
            n("ARIA Live Regions for Toasts"),
            n("Touch Device Fallbacks (Non-hover)"),
          ],
          n("Positioning & Screen Readers")
        ),
      ],
    }),
    stage("Navigation Primitives", {
      left: [
        g(
          [
            n("Navbar & App Shell Headers"),
            n("Responsive Sidebar Navigation & Collapsing"),
            n("Breadcrumbs Navigation", "personal"),
            n("Tabs & Segmented View Switchers", "personal"),
            n("Pagination & Infinite Scroll Indicators"),
          ],
          n("Navigation Components")
        ),
      ],
      right: [
        g(
          [
            n("ARIA role='tablist' & role='tabpanel'"),
            n("Arrow Key Navigation for Tabs (Home, End, Left, Right)"),
            n("Skip Navigation Links for Screen Readers", "personal"),
            n("Active Page Link aria-current='page'"),
          ],
          n("Navigational Semantics")
        ),
      ],
    }),
    stage("Data Display & Tables", {
      status: "personal",
      left: [
        g(
          [
            n("Data Tables with Sortable Headers", "personal"),
            n("Column Resizing & Virtualized Rows"),
            n("Table Row Selection & Bulk Actions"),
            n("Empty States & Loading Skeleton Rows"),
          ],
          n("Table Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Avatar & Avatar Groups"),
            n("Badges & Status Pills"),
            n("Card Layouts & Media Objects"),
            n("Accordion Panels & Collapsible Sections"),
          ],
          n("Display & Content Cards")
        ),
      ],
      noteAfter:
        "Tables and complex data displays require special attention to responsive layouts, mobile card fallbacks, and accessible table headers with `scope='col'` and `aria-sort`.",
    }),
  ],
};

// 3. COMPONENT ARCHITECTURE & ACCESSIBILITY
const COMPONENT_ARCHITECTURE_AND_ACCESSIBILITY: DesignSystemRoadmapSection = {
  id: "component-architecture-and-accessibility",
  title: "Component Architecture & Accessibility",
  stages: [
    stage("Accessibility Standards (WCAG & ARIA)", {
      status: "personal",
      left: [
        g(
          [
            n("WCAG 2.1 / 2.2 AA Conformance", "personal"),
            n("WCAG AAA Targets for Contrast & Typography"),
            n("POUR Principles (Perceivable, Operable, Understandable, Robust)"),
            n("Section 508 & EN 301 549 Compliance"),
          ],
          n("Accessibility Guidelines")
        ),
      ],
      right: [
        g(
          [
            n("WAI-ARIA 1.2 Roles & States", "personal"),
            n("ARIA Attributes (aria-expanded, aria-controls, aria-hidden)"),
            n("Accessible Names & aria-labelledby / aria-describedby", "personal"),
            n("Live Regions (aria-live='polite' | 'assertive')"),
          ],
          n("WAI-ARIA Authoring Practices")
        ),
      ],
      noteAfter:
        "First rule of ARIA: Do not use ARIA if a native HTML element or attribute with the semantics and behavior already exists.",
    }),
    stage("Keyboard Navigation & Focus Management", {
      status: "personal",
      left: [
        g(
          [
            n("Tab Order & Sequential Navigation (tabindex 0 vs -1)", "personal"),
            n("Roving Tabindex for Menus, Toolbars & Grids", "personal"),
            n("Focus Trapping in Modals & Dialogs"),
            n("Return Focus on Element Dismissal"),
          ],
          n("Focus Management")
        ),
      ],
      right: [
        g(
          [
            n(":focus-visible Outlines (Prevent mouse focus rings)", "personal"),
            n("High Contrast Focus Indicators (Minimum 3:1 contrast)"),
            n("Keyboard Shortcuts & Access Keys"),
            n("Target Size Minimums (WCAG 2.5.8 - 24x24px / 44x44px)", "personal"),
          ],
          n("Focus Styling & Touch Targets")
        ),
      ],
      projectIdea: "Milestone: Build a Fully Keyboard-Accessible Roving Tabindex Menu & Combobox",
    }),
    stage("Component API Design & Patterns", {
      left: [
        g(
          [
            n("Compound Components Pattern", "personal"),
            n("Slot & Children Composition Pattern", "personal"),
            n("Polymorphic Components ('as' / 'asChild' props)", "personal"),
            n("Controlled vs Uncontrolled State Patterns"),
          ],
          n("Composition Patterns")
        ),
      ],
      right: [
        g(
          [
            n("Consistent Prop Naming Conventions"),
            n("Strict TypeScript Prop Types & Generics", "personal", "skill-typescript"),
            n("Render Props & Custom Hook Primitives"),
            n("Ref Forwarding with forwardRef"),
          ],
          n("API Ergonomics")
        ),
      ],
    }),
    stage("Motion & Sensory Accessibility", {
      left: [
        g(
          [
            n("prefers-reduced-motion Media Queries", "personal"),
            n("Duration Tokens (100ms, 200ms, 300ms, 500ms)"),
            n("Easing Curves (Ease-in, Ease-out, Spring curves)"),
            n("FLIP Animation Technique"),
          ],
          n("Motion Tokens & Reduction")
        ),
      ],
      right: [
        g(
          [
            n("Screen Reader Audits (VoiceOver, NVDA, JAWS)", "personal"),
            n("Non-color Dependent State Indicators"),
            n("Zoom & 200% Text Scaling Support"),
          ],
          n("Assistive Technology Testing")
        ),
      ],
    }),
  ],
};

// 4. IMPLEMENTATION & TOOLING
const IMPLEMENTATION_AND_TOOLING: DesignSystemRoadmapSection = {
  id: "implementation-and-tooling",
  title: "Implementation & Tooling",
  stages: [
    stage("Design Hand-off & Token Syncing", {
      left: [
        g(
          [
            n("Figma Variables & Token Studio", "personal"),
            n("Figma Component Sets & Variants"),
            n("Design Token Sync via GitHub Webhooks / Actions", "personal"),
            n("Figma Code Connect / Dev Mode"),
          ],
          n("Figma & Design Tools")
        ),
      ],
      right: [
        g(
          [
            n("Automated Style Dictionary Build Pipeline", "personal"),
            n("CSS Custom Properties Generation (:root variables)"),
            n("TypeScript Types & Const Enums Generation"),
            n("iOS & Android Platform Token Exports"),
          ],
          n("Token Transformation Pipelines")
        ),
      ],
    }),
    stage("Component Catalogs & Workbenches", {
      status: "personal",
      left: [
        g(
          [
            n("Storybook (CSF 3 Format)", "personal"),
            n("Ladle (Fast Vite-native alternative)", "alternative"),
            n("Storybook Controls & Args"),
            n("Storybook Viewport & Dark Mode Addons"),
          ],
          n("Component Catalogs")
        ),
      ],
      right: [
        g(
          [
            n("MDX Documentation Pages in Storybook"),
            n("Interactive Component Playgrounds"),
            n("Mock Service Worker (MSW) in Stories"),
            n("Storybook Test Runner"),
          ],
          n("Storybook Addons & Testing")
        ),
      ],
      projectIdea:
        "Milestone: Deploy an Interactive Storybook 8 Showcase with Automated Chromatic CI",
    }),
    stage("Styling Strategies & CSS Architecture", {
      left: [
        g(
          [
            n("Tailwind CSS with Custom Theme Tokens", "personal"),
            n("CSS Modules & Modern Native CSS Nesting", "personal"),
            n("CSS-in-JS (Emotion / styled-components)", "alternative"),
            n("Zero-Runtime CSS (Vanilla Extract, Panda CSS)", "alternative"),
          ],
          n("Styling Solutions")
        ),
      ],
      right: [
        g(
          [
            n("CSS Custom Properties Architecture"),
            n("Class Variance Authority (CVA)", "personal"),
            n("Tailwind Merge & clsx Utilities", "personal"),
            n("CSS Layering (@layer base, components, utilities)"),
          ],
          n("Utility & Variant Management")
        ),
      ],
    }),
    stage("Headless & Unstyled UI Primitives", {
      status: "personal",
      left: [
        g(
          [
            n("Radix UI Primitives", "personal"),
            n("Zag.js (State Machine Based)", "personal"),
            n("Headless UI", "alternative"),
            n("React Aria Components (Adobe)", "alternative"),
            n("Ark UI (Chakra UI ecosystem)", "alternative"),
          ],
          n("Headless Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Decoupling Behavior from Appearance", "personal"),
            n("Portability across Frontend Frameworks"),
            n("Built-in Keyboard & ARIA Handlers"),
            n("Custom Styling on Headless Primitives"),
          ],
          n("Headless Benefits")
        ),
      ],
      noteAfter:
        "Building on headless primitives like Radix UI or Zag.js saves months of effort handling edge-case keyboard interactions, focus traps, and screen reader announcements.",
    }),
    stage("Monorepo Architecture & Packaging", {
      left: [
        g(
          [
            n("Turborepo / Nx Monorepo Setup", "personal"),
            n("pnpm Workspaces", "personal"),
            n("Package Separation: @tokens, @core, @icons, @docs"),
          ],
          n("Monorepo Infrastructure")
        ),
      ],
      right: [
        g(
          [
            n("tsup / Vite / Rollup Bundling", "personal"),
            n("Dual ESM & CJS Module Exports (package.json exports)", "personal"),
            n("Tree-Shaking & Bundle Size Budgets"),
            n("Changesets for Multi-Package Versioning", "personal"),
          ],
          n("Distribution & Bundling")
        ),
      ],
    }),
  ],
};

// 5. DOCUMENTATION & GOVERNANCE
const DOCUMENTATION_AND_GOVERNANCE: DesignSystemRoadmapSection = {
  id: "documentation-and-governance",
  title: "Documentation & Governance",
  stages: [
    stage("Documentation Hubs & Content", {
      status: "personal",
      left: [
        g(
          [
            n("Storybook Docs / MDX", "personal"),
            n("Zeroheight Platform", "alternative"),
            n("Docusaurus / Nextra Docs Portals", "alternative"),
            n("Figma-to-Docs Embeds"),
          ],
          n("Documentation Platforms")
        ),
      ],
      right: [
        g(
          [
            n("Anatomy Breakdowns with Diagrams", "personal"),
            n("Do's and Don'ts Usage Guides", "personal"),
            n("Interactive Live Code Editors"),
            n("Props Reference Tables with Defaults"),
          ],
          n("Component Documentation Standard")
        ),
      ],
    }),
    stage("Governance Models & Team Structures", {
      left: [
        g(
          [
            n("Centralized Core Design System Team"),
            n("Federated / Distributed Model"),
            n("Hybrid Governance Model (Recommended for Scale)", "personal"),
            n("Design System Council / Champions"),
          ],
          n("Organizational Models")
        ),
      ],
      right: [
        g(
          [
            n("RFC (Request for Comments) Process", "personal"),
            n("Component Intake Decision Tree"),
            n("Figma & GitHub Contribution Guidelines"),
            n("Design System SLA & Office Hours"),
          ],
          n("Contribution & Intake")
        ),
      ],
      projectIdea:
        "Milestone: Author a Design System RFC for introducing a new complex DatePicker component",
    }),
    stage("Versioning, Deprecation & Migration", {
      status: "personal",
      left: [
        g(
          [
            n("Semantic Versioning (MAJOR.MINOR.PATCH)", "personal"),
            n("Automated Changelogs with Changesets", "personal"),
            n("GitHub Releases & npm Tagging"),
          ],
          n("Release Management")
        ),
      ],
      right: [
        g(
          [
            n("Component Deprecation Strategy (Soft vs Hard deprecation)", "personal"),
            n("Runtime Console Deprecation Warnings"),
            n("Automated Codemods with jscodeshift / ast-grep", "personal"),
            n("Migration Guides & Step-by-Step Upgrades"),
          ],
          n("Deprecations & Codemods")
        ),
      ],
      noteAfter:
        "Never delete a deprecated component without providing at least one minor release containing warnings, a comprehensive migration guide, and automated codemods.",
    }),
  ],
};

// 6. TESTING & AUTOMATION
const TESTING_AND_AUTOMATION: DesignSystemRoadmapSection = {
  id: "testing-and-automation",
  title: "Testing & Automation",
  stages: [
    stage("Visual Regression Testing", {
      status: "personal",
      left: [
        g(
          [
            n("Chromatic for Storybook (Git-integrated)", "personal"),
            n("Percy / Applitools", "alternative"),
            n("Playwright Screenshot Visual Comparisons", "personal"),
            n("Cross-Browser & Cross-Device Snapshot Testing"),
          ],
          n("Visual Diffs")
        ),
      ],
      right: [
        g(
          [
            n("Thresholds & Pixel Anti-Aliasing Handling"),
            n("Dark Mode & Hover State Snapshots"),
            n("Responsive Breakpoint Snapshots"),
            n("PR Approval Gatekeeping"),
          ],
          n("Visual Quality Gates")
        ),
      ],
      projectIdea: "Milestone: Setup Chromatic Visual Regression Gates on Pull Requests",
    }),
    stage("Component Unit & Integration Testing", {
      left: [
        g(
          [
            n("Vitest / Jest Test Runners", "personal"),
            n("React Testing Library (User-Event)", "personal"),
            n("Playwright / Cypress Component Testing", "personal"),
            n("Keyboard Event Simulation Tests"),
          ],
          n("Component Testing")
        ),
      ],
      right: [
        g(
          [
            n("Testing ARIA State Changes"),
            n("Form Validation & Submission Testing"),
            n("Testing Controlled vs Uncontrolled Props"),
            n("Coverage Thresholds for UI Libraries"),
          ],
          n("Test Scenarios")
        ),
      ],
    }),
    stage("Accessibility Automated Audits", {
      status: "personal",
      left: [
        g(
          [
            n("axe-core Test Suite Integration", "personal"),
            n("jest-axe / vitest-axe Automated Matchers", "personal"),
            n("Storybook a11y Addon (axe-powered)", "personal"),
            n("Lighthouse CI Audits"),
          ],
          n("Automated a11y Audits")
        ),
      ],
      right: [
        g(
          [
            n("Manual Screen Reader Audits (JAWS, NVDA, VoiceOver)", "personal"),
            n("Keyboard-Only User Testing Sessions"),
            n("Color Contrast Automated Regression Tests"),
            n("Accessibility Issue Severity Triage"),
          ],
          n("Manual & Triage Practices")
        ),
      ],
    }),
    stage("CI/CD Pipeline & Delivery", {
      left: [
        g(
          [
            n("GitHub Actions Workflow Matrix", "personal"),
            n("Automated Token Build on Commit"),
            n("Storybook Build & Cloud Deployment (Vercel / Cloudflare)"),
            n("Bundlephobia / size-limit PR Bot", "personal"),
          ],
          n("Continuous Integration")
        ),
      ],
      right: [
        g(
          [
            n("Automated npm Publishing via Changesets", "personal"),
            n("Provenance & 2FA npm Publishing Security"),
            n("Telemetry for Component Adoption Tracking"),
            n("Design System Adoption Dashboards"),
          ],
          n("Continuous Delivery & Metrics")
        ),
      ],
      noteAfter:
        "Tracking design system adoption across consumer apps with static analysis or telemetry proves business ROI and highlights unadopted legacy components.",
    }),
  ],
};

export const DESIGN_SYSTEM_SECTIONS: DesignSystemRoadmapSection[] = [
  DESIGN_SYSTEM_FOUNDATIONS,
  CORE_UI_COMPONENTS,
  COMPONENT_ARCHITECTURE_AND_ACCESSIBILITY,
  IMPLEMENTATION_AND_TOOLING,
  DOCUMENTATION_AND_GOVERNANCE,
  TESTING_AND_AUTOMATION,
];
