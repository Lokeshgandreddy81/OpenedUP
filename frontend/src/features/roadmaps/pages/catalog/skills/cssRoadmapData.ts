export type CssRoadmapStatus = "personal" | "alternative" | "optional";

export interface CssRoadmapNode {
  id: string;
  title: string;
  status?: CssRoadmapStatus;
  roadmapId?: string;
}

export interface CssRoadmapGroup {
  id: string;
  parent?: CssRoadmapNode;
  items: CssRoadmapNode[];
}

export interface CssRoadmapStage {
  id: string;
  node: CssRoadmapNode;
  left?: CssRoadmapGroup[];
  right?: CssRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface CssRoadmapSection {
  id: string;
  title?: string;
  stages: CssRoadmapStage[];
}

export interface CssRoadmapLink {
  label: string;
  roadmapId: string;
}

export const CSS_MARKERS: Array<{
  status: CssRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const CSS_RELATED_ROADMAPS: CssRoadmapLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "HTML Roadmap", roadmapId: "skill-html" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "Full Stack Developer", roadmapId: "full-stack" },
  { label: "Design System", roadmapId: "skill-design-system" },
];

export const CSS_CONTINUE_LEARNING: CssRoadmapLink[] = [
  { label: "Frontend", roadmapId: "frontend" },
  { label: "HTML", roadmapId: "skill-html" },
  { label: "JavaScript", roadmapId: "skill-javascript" },
  { label: "Design System", roadmapId: "skill-design-system" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: CssRoadmapStatus,
  roadmapId?: string,
  customId?: string
): CssRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: CssRoadmapNode[],
  parent?: CssRoadmapNode,
  customId?: string
): CssRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<CssRoadmapStage, "id" | "node"> & {
    status?: CssRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): CssRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. FOUNDATIONS & BASICS
const FOUNDATIONS_AND_BASICS: CssRoadmapSection = {
  id: "foundations-and-basics",
  title: "Foundations & Basics",
  stages: [
    stage("Introduction", {
      right: [
        g(
          [
            n("HTML", undefined, "skill-html"),
            n("CSS", "personal"),
            n("JavaScript", undefined, "skill-javascript"),
          ],
          n("Frontend Development")
        ),
      ],
    }),
    stage("CSS Basics", {
      left: [
        g(
          [
            n("External CSS", "personal"),
            n("Internal CSS"),
            n("Inline CSS", "optional"),
            n("Cascading order"),
          ],
          n("Ways to Include CSS")
        ),
      ],
      right: [
        g(
          [
            n("Rules", "personal"),
            n("Properties & Values"),
            n("Selector & Declaration"),
            n("Comments"),
          ],
          n("Syntax Basics")
        ),
      ],
      noteAfter:
        "CSS (Cascading Style Sheets) styles and formats the presentation of Web pages. Understand the cascade algorithm, inheritance rules, and specificity before tackling complex layouts.",
    }),
  ],
};

// 2. SELECTORS & SPECIFICITY
const SELECTORS_AND_SPECIFICITY: CssRoadmapSection = {
  id: "selectors-and-specificity",
  title: "Selectors & Specificity",
  stages: [
    stage("Simple & Attribute Selectors", {
      left: [g([n("Attribute Selectors", "personal")], n("Attribute Selectors"))],
      right: [
        g(
          [n("element"), n("class", "personal"), n("id"), n("universal"), n("grouping")],
          n("Simple Selectors")
        ),
      ],
    }),
    stage("Combinator Selectors", {
      left: [
        g(
          [
            n("descendant (space)"),
            n("child (>)", "personal"),
            n("Next Sibling (+)"),
            n("Subsequent Sibling (~)"),
          ],
          n("Combinator Types")
        ),
      ],
      right: [
        g(
          [
            n("CSS Specificity Hierarchy", "personal"),
            n("Inline > ID > Class > Element"),
            n("!important rule usage"),
          ],
          n("Specificity Rules")
        ),
      ],
    }),
  ],
};

// 3. TYPOGRAPHY & TEXT STYLING
const TYPOGRAPHY_AND_TEXT: CssRoadmapSection = {
  id: "typography-and-text",
  title: "Typography & Text Styling",
  stages: [
    stage("Text Styling", {
      left: [
        g(
          [
            n("Font families"),
            n("Font Size", "personal"),
            n("Font Weight"),
            n("Font Style"),
            n("Font Shorthand"),
            n("Font Variant"),
            n("Google Fonts", "personal"),
          ],
          n("Fonts")
        ),
      ],
      right: [
        g(
          [
            n("Color", "personal"),
            n("Text Alignment"),
            n("Text Decoration"),
            n("Text Transform"),
            n("Text Spacing"),
            n("Line Height", "personal"),
            n("Text Shadows"),
            n("Direction"),
          ],
          n("Text Properties")
        ),
      ],
    }),
  ],
};

// 4. COLORS & BACKGROUNDS
const COLORS_AND_BACKGROUNDS: CssRoadmapSection = {
  id: "colors-and-backgrounds",
  title: "Colors & Backgrounds",
  stages: [
    stage("Colors & Background", {
      left: [
        g(
          [
            n("Background Color"),
            n("Background Image"),
            n("Background Gradient", "personal"),
            n("Background Position"),
            n("Background Attachment"),
          ],
          n("Background")
        ),
      ],
      right: [
        g(
          [
            n("hex (#rrggbb)", "personal"),
            n("rgb"),
            n("hsl", "alternative"),
            n("rgba, hsla"),
            n("Named Colors"),
            n("Opacity"),
          ],
          n("Colors")
        ),
      ],
      projectIdea:
        "PROJECT: BUILD A CLEAN PRICING CARD COMPONENT WITH COLOR ACCENTS, GRADIENTS, AND HOVER ELEVATION",
    }),
  ],
};

// 5. BOX MODEL & UNITS
const BOX_MODEL_AND_UNITS: CssRoadmapSection = {
  id: "box-model-and-units",
  title: "Box Model & CSS Units",
  stages: [
    stage("Box Model", {
      left: [
        g(
          [
            n("Width / Height"),
            n("Padding", "personal"),
            n("Border", "personal"),
            n("Margin"),
            n("Box Sizing (border-box)", "personal"),
            n("Outline"),
            n("Box Shadows"),
          ],
          n("Box Dimensions & Spacing")
        ),
      ],
      right: [
        g(
          [
            n("Absolute vs Relative", "personal"),
            n("Relative units (rem, em, %)", "personal"),
            n("Viewport units (vw, vh)"),
            n("Units with functions (calc, clamp)", "personal"),
          ],
          n("CSS Units")
        ),
      ],
    }),
  ],
};

// 6. DISPLAY & POSITIONING
const DISPLAY_AND_POSITIONING: CssRoadmapSection = {
  id: "display-and-positioning",
  title: "Display & Positioning",
  stages: [
    stage("Display", {
      left: [
        g(
          [
            n("inline"),
            n("block", "personal"),
            n("inline-block", "alternative"),
            n("none"),
            n("visibility"),
          ],
          n("Display Values")
        ),
      ],
      right: [
        g(
          [n("Lists"), n("Tables"), n("Images and Filters", "personal")],
          n("Content Presentation")
        ),
      ],
    }),
    stage("Position", {
      left: [
        g(
          [
            n("Static"),
            n("Relative"),
            n("Absolute", "personal"),
            n("Fixed"),
            n("Sticky", "personal"),
          ],
          n("Positioning Modes")
        ),
      ],
      right: [
        g(
          [
            n("Z-Index / Stacking Context", "personal"),
            n("Stacking Context Order"),
            n("Overflow (hidden, scroll, auto)"),
          ],
          n("Stacking & Layers")
        ),
      ],
      projectIdea: "PROJECT: CREATE AN ACCESSIBLE FLOATING TOOLTIP UI AND A STICKY NAVIGATION BAR",
    }),
  ],
};

// 7. PSEUDO CLASSES & PSEUDO ELEMENTS
const PSEUDO_SELECTORS: CssRoadmapSection = {
  id: "pseudo-selectors",
  title: "Pseudo Classes & Elements",
  stages: [
    stage("Pseudo Classes & Elements", {
      left: [
        g(
          [
            n("User actions (:hover, :focus, :active)", "personal"),
            n("Structural (:first-child, :last-child, :nth-child)", "personal"),
            n("State pseudo classes (:disabled, :checked)"),
            n("Functional (:not, :is, :where)"),
          ],
          n("Pseudo Classes")
        ),
      ],
      right: [
        g(
          [
            n("::before", "personal"),
            n("::after", "personal"),
            n("::placeholder"),
            n("::first-letter & ::first-line"),
            n("::selection"),
          ],
          n("Pseudo Elements")
        ),
      ],
    }),
  ],
};

// 8. LAYOUT TECHNIQUES
const LAYOUT_TECHNIQUES: CssRoadmapSection = {
  id: "layout-techniques",
  title: "Layout Techniques",
  stages: [
    stage("Layouts", {
      left: [
        g(
          [
            n("Flow Layout"),
            n("Floating Elements", "optional"),
            n("Multicolumn layout", "optional"),
          ],
          n("Core & Legacy Layouts")
        ),
      ],
      right: [
        g(
          [
            n("Flexbox", "personal"),
            n("Grid", "personal"),
            n("Gap & Alignment Properties", "personal"),
          ],
          n("Modern Layout Systems")
        ),
      ],
      projectIdea: "PROJECT: BUILD AN IMAGE GRID LAYOUT WITH CSS GRID AND ADAPTIVE FLEXBOX COLUMNS",
    }),
  ],
};

// 9. ANIMATIONS & TRANSITIONS
const ANIMATIONS_AND_TRANSITIONS: CssRoadmapSection = {
  id: "animations-and-transitions",
  title: "Animations & Motion",
  stages: [
    stage("Transitions & Animations", {
      left: [
        g(
          [n("Transitions", "personal"), n("Transition timing & duration"), n("Transition delay")],
          n("Smooth Transitions")
        ),
      ],
      right: [
        g(
          [
            n("Transforms (2D & 3D)", "personal"),
            n("Keyframe Animations", "personal"),
            n("prefers-reduced-motion", "personal"),
          ],
          n("Animations")
        ),
      ],
    }),
  ],
};

// 10. RESPONSIVE WEB DESIGN & MODERN CSS
const RESPONSIVE_AND_MODERN: CssRoadmapSection = {
  id: "responsive-and-modern",
  title: "Responsive Design & Modern CSS",
  stages: [
    stage("Reponsiveness", {
      left: [
        g(
          [
            n("Media Queries", "personal"),
            n("Container Queries", "personal"),
            n("Responsive typography", "personal"),
          ],
          n("Responsive Techniques")
        ),
      ],
      right: [
        g(
          [
            n("CSS Variables", "personal"),
            n("CSS Functions", "personal"),
            n("Color mixing & relative colors", "alternative"),
          ],
          n("Modern CSS Features")
        ),
      ],
      projectIdea: "PROJECT: BUILD A THEME SWITCHER USING CSS VARIABLES AND PREFERS-COLOR-SCHEME",
    }),
  ],
};

// 11. BEST PRACTICES & METHODOLOGIES
const BEST_PRACTICES_AND_METHODOLOGIES: CssRoadmapSection = {
  id: "best-practices-and-methodologies",
  title: "Best Practices & Architecture",
  stages: [
    stage("Best Practices", {
      left: [
        g(
          [
            n("Performance", "personal"),
            n("Accessibility", "personal"),
            n("Specificity management"),
          ],
          n("Standards & Quality")
        ),
      ],
      right: [
        g(
          [
            n("BEM", "personal"),
            n("Sass", "personal"),
            n("PostCSS", "alternative"),
            n("CSS Modules", "alternative"),
            n("CSS-in-JS", "alternative"),
          ],
          n("Methodologies")
        ),
      ],
      noteAfter:
        "Modern CSS now natively provides nesting, custom properties, and container queries. Learn native CSS deeply before selecting preprocessors or external CSS architectures.",
    }),
  ],
};

export const CSS_SECTIONS: CssRoadmapSection[] = [
  FOUNDATIONS_AND_BASICS,
  SELECTORS_AND_SPECIFICITY,
  TYPOGRAPHY_AND_TEXT,
  COLORS_AND_BACKGROUNDS,
  BOX_MODEL_AND_UNITS,
  DISPLAY_AND_POSITIONING,
  PSEUDO_SELECTORS,
  LAYOUT_TECHNIQUES,
  ANIMATIONS_AND_TRANSITIONS,
  RESPONSIVE_AND_MODERN,
  BEST_PRACTICES_AND_METHODOLOGIES,
];
