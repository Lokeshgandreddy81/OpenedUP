export type HtmlRoadmapStatus = "personal" | "alternative" | "optional";

export interface HtmlRoadmapNode {
  id: string;
  title: string;
  status?: HtmlRoadmapStatus;
  roadmapId?: string;
}

export interface HtmlRoadmapGroup {
  id: string;
  parent?: HtmlRoadmapNode;
  items: HtmlRoadmapNode[];
}

export interface HtmlRoadmapStage {
  id: string;
  node: HtmlRoadmapNode;
  left?: HtmlRoadmapGroup[];
  right?: HtmlRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface HtmlRoadmapSection {
  id: string;
  title?: string;
  stages: HtmlRoadmapStage[];
}

export interface HtmlRoadmapLink {
  label: string;
  roadmapId: string;
}

export const HTML_MARKERS: Array<{
  status: HtmlRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const HTML_RELATED_ROADMAPS: HtmlRoadmapLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "CSS Roadmap", roadmapId: "skill-css" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "React Roadmap", roadmapId: "skill-react" },
  { label: "SEO Roadmap", roadmapId: "seo" },
  { label: "Design System", roadmapId: "skill-design-system" },
];

export const HTML_CONTINUE_LEARNING: HtmlRoadmapLink[] = [
  { label: "CSS Roadmap", roadmapId: "skill-css" },
  { label: "JavaScript Developer", roadmapId: "skill-javascript" },
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "TypeScript Roadmap", roadmapId: "skill-typescript" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: HtmlRoadmapStatus,
  roadmapId?: string,
  customId?: string
): HtmlRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: HtmlRoadmapNode[],
  parent?: HtmlRoadmapNode,
  customId?: string
): HtmlRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<HtmlRoadmapStage, "id" | "node"> & {
    status?: HtmlRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): HtmlRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. HTML FUNDAMENTALS
const HTML_FUNDAMENTALS: HtmlRoadmapSection = {
  id: "html-fundamentals",
  title: "HTML Fundamentals",
  stages: [
    stage("Document Structure & Elements", {
      status: "personal",
      left: [
        g(
          [
            n("<!DOCTYPE html> Declaration", "personal"),
            n('<html lang="en"> Root Element', "personal"),
            n("<head> vs <body> Architecture"),
            n('<meta charset="UTF-8"> Encoding'),
            n("Viewport Meta Tag for Responsive Design", "personal"),
          ],
          n("Document Skeleton")
        ),
      ],
      right: [
        g(
          [
            n("Elements, Tags & Void Elements (<br>, <hr>, <img>)", "personal"),
            n("Global Attributes (id, class, title, hidden)", "personal"),
            n("Data Attributes (data-*) for Custom State"),
            n("tabindex (0, -1, positive values)"),
            n("contenteditable & spellcheck"),
          ],
          n("Elements & Attributes")
        ),
      ],
      noteAfter:
        "Every valid web page begins with the <!DOCTYPE html> doctype preamble to ensure browsers render in standard mode rather than quirks mode.",
    }),
    stage("Text Formatting, Links & Lists", {
      left: [
        g(
          [
            n("Heading Hierarchy <h1> through <h6>", "personal"),
            n("<p>, <br>, <hr> Structural Separators"),
            n("<strong> vs <b> (Semantic vs Visual)"),
            n("<em> vs <i> (Stress Emphasis vs Voice)"),
            n("<code>, <pre>, <kbd>, <samp> for Code"),
            n("<time> with datetime Attribute", "personal"),
          ],
          n("Text & Formatting")
        ),
      ],
      right: [
        g(
          [
            n("<a> Anchor Tag & href Attribute", "personal"),
            n("Relative vs Absolute URLs"),
            n('target="_blank" & rel="noopener noreferrer"', "personal"),
            n("Anchor Jump Links (#section-id)"),
            n("Unordered <ul>, Ordered <ol>, and List Items <li>"),
            n("Description Lists (<dl>, <dt>, <dd>)"),
          ],
          n("Links & Lists")
        ),
      ],
      projectIdea:
        "Personal Bio & Resume Site: Build a multi-page semantic website using links, lists, time elements, and text hierarchy",
    }),
    stage("Tables & Tabular Data", {
      left: [
        g(
          [
            n("<table>, <tr>, <th>, <td> Core Structure", "personal"),
            n("<thead>, <tbody>, <tfoot> Semantic Grouping", "personal"),
            n("scope Attribute on Header Cells (col, row)", "personal"),
          ],
          n("Table Architecture")
        ),
      ],
      right: [
        g(
          [
            n("colspan & rowspan Grid Cell Spanning"),
            n("<caption> Element for Accessible Summaries", "personal"),
            n("<colgroup> and <col> Column Styling"),
            n("Responsive Table Scroll Wrappers"),
          ],
          n("Advanced Tabular Data")
        ),
      ],
    }),
  ],
};

// 2. SEMANTIC HTML5
const SEMANTIC_HTML5: HtmlRoadmapSection = {
  id: "semantic-html5",
  title: "Semantic HTML5",
  stages: [
    stage("Structural Landmark Elements", {
      status: "personal",
      left: [
        g(
          [
            n("<header> Element for Introductory Content", "personal"),
            n("<nav> Element for Major Navigation Links", "personal"),
            n("<main> Element (Single instance per page)", "personal"),
            n("<footer> Element for Author/Copyright Information", "personal"),
          ],
          n("Page Landmarks")
        ),
      ],
      right: [
        g(
          [
            n("<aside> for Sidebars and Tangential Content", "personal"),
            n("<article> for Self-Contained Compositions", "personal"),
            n("<section> for Thematic Grouping of Content", "personal"),
            n("<address> for Contact Information"),
          ],
          n("Content Sections")
        ),
      ],
      noteAfter:
        "Using semantic elements instead of generic <div> tags provides immediate accessibility landmarks for assistive technologies and boosts search engine rankings.",
    }),
    stage("Interactive & Grouping Semantics", {
      left: [
        g(
          [
            n("<figure> and <figcaption> Media Pair", "personal"),
            n("<details> & <summary> Native Accordion", "personal"),
            n("<dialog> Native Modal Element & showModal()", "personal"),
            n("<search> Landmark for Search Interfaces (HTML 2023+)", "personal"),
          ],
          n("Interactive Semantic Tags")
        ),
      ],
      right: [
        g(
          [
            n("Document Outline Algorithm & Rules"),
            n("Single <h1> per Page Best Practice", "personal"),
            n("Avoiding <div> Soup Anti-pattern"),
            n("HTML Validator (W3C Nu HTML Checker)", "personal"),
          ],
          n("Outline & Validation")
        ),
      ],
      projectIdea:
        "Accessible News Magazine Layout: Build a responsive news portal using header, nav, main, article, aside, and details without JavaScript",
    }),
  ],
};

// 3. FORMS & INPUT VALIDATION
const FORMS_AND_INPUT_VALIDATION: HtmlRoadmapSection = {
  id: "forms-and-input-validation",
  title: "Forms & Input Validation",
  stages: [
    stage("Form Elements & Controls", {
      status: "personal",
      left: [
        g(
          [
            n("<form> Tag (action, method, enctype)", "personal"),
            n("<label> with for Attribute / Wrapped Input", "personal"),
            n("<fieldset> & <legend> for Form Sections", "personal"),
            n('<button type="submit | button | reset">'),
          ],
          n("Form Container & Labels")
        ),
      ],
      right: [
        g(
          [
            n("<select>, <optgroup> & <option> Dropdowns", "personal"),
            n("<textarea> for Multi-line Text Input"),
            n("<datalist> for Autocomplete Input Suggestions", "personal"),
            n("<output> Element for Calculation Results"),
            n("<progress> and <meter> Elements"),
          ],
          n("Form Controls & Choice Inputs")
        ),
      ],
      noteAfter:
        "Every input control must have an associated <label> element with matching for and id attributes so screen reader users know what to enter.",
    }),
    stage("Modern Input Types", {
      status: "personal",
      left: [
        g(
          [
            n("text, password, hidden Inputs", "personal"),
            n("email, tel, url Inputs (Triggers mobile keyboards)", "personal"),
            n("number Input (min, max, step)", "personal"),
            n("search Input with Native Clear Icon"),
          ],
          n("Textual & Numeric Types")
        ),
      ],
      right: [
        g(
          [
            n("checkbox & radio (grouped by name)", "personal"),
            n("date, time, datetime-local Pickers"),
            n('color Picker (type="color")'),
            n('range Slider (type="range")'),
            n("file Input (accept, multiple, capture)"),
          ],
          n("Specialized Input Types")
        ),
      ],
    }),
    stage("Native Validation & Constraints", {
      left: [
        g(
          [
            n("required Attribute", "personal"),
            n("pattern Attribute (Regex matching)", "personal"),
            n("minlength & maxlength Attributes"),
            n("min, max & step Constraints"),
            n("novalidate Attribute to Bypass Native UI"),
          ],
          n("Validation Attributes")
        ),
      ],
      right: [
        g(
          [
            n(":valid and :invalid CSS Pseudo-classes", "personal"),
            n(":user-valid & :user-invalid Pseudo-classes", "personal"),
            n("Constraint Validation API (checkValidity())", "personal"),
            n("setCustomValidity() for Custom Error Messages"),
          ],
          n("Validation Styling & JS API")
        ),
      ],
      projectIdea:
        "Multi-Step Checkout Form: Build a validated checkout flow with native HTML5 validation, file upload preview, and custom error styling",
    }),
  ],
};

// 4. MULTIMEDIA & GRAPHICS
const MULTIMEDIA_AND_GRAPHICS: HtmlRoadmapSection = {
  id: "multimedia-and-graphics",
  title: "Multimedia & Graphics",
  stages: [
    stage("Responsive Images & Modern Formats", {
      status: "personal",
      left: [
        g(
          [
            n("<img> Element & Required alt Attribute", "personal"),
            n("Explicit width & height to Prevent Cumulative Layout Shift (CLS)", "personal"),
            n('loading="lazy" for Native Lazy Loading', "personal"),
            n('decoding="async" & fetchpriority="high"', "personal"),
          ],
          n("Core Image Optimization")
        ),
      ],
      right: [
        g(
          [
            n("<picture> Element Art Direction & Format Switching", "personal"),
            n("srcset and sizes Attributes for Resolution Switching", "personal"),
            n('<source type="image/avif"> and image/webp Fallbacks', "personal"),
            n("Modern Formats: AVIF, WebP, SVG"),
          ],
          n("Responsive Imagery")
        ),
      ],
      noteAfter:
        "Always specify width and height on <img> tags to reserve aspect ratio space and avoid Cumulative Layout Shift (CLS), a key Core Web Vital.",
    }),
    stage("Audio, Video & Media Tracks", {
      left: [
        g(
          [
            n("<video> Element & Multiple <source> Formats", "personal"),
            n("Video Attributes (controls, autoplay, muted, loop, playsinline)"),
            n("poster Attribute for Video Thumbnail Previews", "personal"),
            n("<audio> Element for Podcasts & Sound"),
          ],
          n("Media Playback")
        ),
      ],
      right: [
        g(
          [
            n("<track> Element for Subtitles & Captions", "personal"),
            n('kind="subtitles" vs kind="captions"', "personal"),
            n("WebVTT (.vtt) Format Syntax"),
            n("srclang & label Attributes"),
          ],
          n("Accessibility & Subtitles")
        ),
      ],
    }),
    stage("SVG & Canvas", {
      left: [
        g(
          [
            n("Inline <svg> vs <img> Embedded SVG", "personal"),
            n("viewBox Coordinate System", "personal"),
            n("<path>, <circle>, <rect>, <polygon>"),
            n("Styling SVG with CSS (fill, stroke, currentColor)", "personal"),
            n('SVG Accessibility (role="img", <title>, <desc>)'),
          ],
          n("Scalable Vector Graphics (SVG)")
        ),
      ],
      right: [
        g(
          [
            n("<canvas> Element & Coordinate Space", "personal"),
            n("2D Context (canvas.getContext('2d'))", "personal"),
            n("requestAnimationFrame Animation Loop"),
            n("WebGL & 3D Graphics Canvas Integration"),
          ],
          n("HTML5 Canvas")
        ),
      ],
      projectIdea:
        "Interactive Media Gallery: Responsive image grid with AVIF/WebP pictures, custom video player with WebVTT captions, and an interactive SVG chart",
    }),
  ],
};

// 5. ACCESSIBILITY & SEO
const ACCESSIBILITY_AND_SEO: HtmlRoadmapSection = {
  id: "accessibility-and-seo",
  title: "Accessibility & SEO",
  stages: [
    stage("Web Accessibility (a11y) & ARIA", {
      status: "personal",
      left: [
        g(
          [
            n(
              "WCAG 2.2 Principles (POUR: Perceivable, Operable, Understandable, Robust)",
              "personal"
            ),
            n("Keyboard Navigation & Focus Trapping (skip-to-content links)", "personal"),
            n("Descriptive alt Text Guidelines for Images", "personal"),
            n("Color Contrast Ratios (AA & AAA Standards)"),
          ],
          n("Accessibility Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n('WAI-ARIA Roles (role="alert", role="dialog", role="region")', "personal"),
            n("ARIA Labels (aria-label, aria-labelledby, aria-describedby)", "personal"),
            n("ARIA States (aria-expanded, aria-hidden, aria-disabled)", "personal"),
            n("aria-live Regions (polite vs assertive)", "personal"),
            n("First Rule of ARIA: Don't use ARIA when semantic HTML exists"),
          ],
          n("WAI-ARIA Essentials")
        ),
      ],
      noteAfter:
        'The First Rule of ARIA: Do not use ARIA attributes if you can use native HTML elements with built-in accessibility semantics (e.g., use <button> instead of <div role="button">).',
    }),
    stage("SEO, Meta Tags & Social Sharing", {
      status: "personal",
      left: [
        g(
          [
            n("<title> Tag Best Practices (50-60 characters)", "personal"),
            n('<meta name="description"> (150-160 characters)', "personal"),
            n('<link rel="canonical"> to Prevent Duplicate Content', "personal"),
            n('<meta name="robots" content="index, follow">'),
            n("sitemap.xml and robots.txt Integration"),
          ],
          n("Search Engine Optimization")
        ),
      ],
      right: [
        g(
          [
            n("Open Graph Protocol (og:title, og:image, og:description, og:url)", "personal"),
            n("Twitter Card Meta Tags (twitter:card, twitter:image)", "personal"),
            n('Structured Data JSON-LD (<script type="application/ld+json">)', "personal"),
            n("Schema.org Types (Article, Product, BreadcrumbList, FAQPage)", "personal"),
          ],
          n("Social Media & Rich Snippets")
        ),
      ],
      projectIdea:
        "Production Landing Page Audit: Build an accessible product showcase achieving a 100/100 Lighthouse score across Performance, Accessibility, and SEO",
    }),
  ],
};

// 6. WEB COMPONENTS & MODERN APIS
const WEB_COMPONENTS_AND_MODERN_APIS: HtmlRoadmapSection = {
  id: "web-components-and-modern-apis",
  title: "Web Components & Modern APIs",
  stages: [
    stage("Web Components Standards", {
      status: "personal",
      left: [
        g(
          [
            n("<template> and <slot> Elements", "personal"),
            n("Custom Elements (customElements.define())", "personal"),
            n("Lifecycle Callbacks (connectedCallback, disconnectedCallback)", "personal"),
            n("observedAttributes & attributeChangedCallback"),
          ],
          n("Custom Elements & Templates")
        ),
      ],
      right: [
        g(
          [
            n("Shadow DOM (element.attachShadow({ mode: 'open' }))", "personal"),
            n("Scoped Styles inside Shadow Root", "personal"),
            n("CSS ::part() & ::slotted() Selectors"),
            n('Declarative Shadow DOM (<template shadowrootmode="open">)', "personal"),
          ],
          n("Shadow DOM Encapsulation")
        ),
      ],
      noteAfter:
        "Web Components are native browser standards that allow you to create framework-agnostic reusable UI widgets that work in React, Vue, Angular, or vanilla HTML.",
    }),
    stage("Storage & Native Web APIs", {
      left: [
        g(
          [
            n("localStorage & sessionStorage (5MB synchronous)", "personal"),
            n("IndexedDB for Large Structured Datastores", "personal"),
            n("Cookies (HttpOnly, Secure, SameSite) vs Storage"),
          ],
          n("Browser Storage")
        ),
      ],
      right: [
        g(
          [
            n("Progressive Web App Manifest (manifest.webmanifest)", "personal"),
            n("Service Worker Registration & Offline Caching", "personal"),
            n("Intersection Observer API for Viewport Detection", "personal"),
            n("Navigator APIs (Clipboard, Share, Geolocation)"),
          ],
          n("Modern Browser Capabilities")
        ),
      ],
      projectIdea:
        "Framework-Agnostic Web Component: Develop a <rating-stars> custom element with Shadow DOM, keyboard accessibility, and state persistence in localStorage",
    }),
  ],
};

export const HTML_SECTIONS: HtmlRoadmapSection[] = [
  HTML_FUNDAMENTALS,
  SEMANTIC_HTML5,
  FORMS_AND_INPUT_VALIDATION,
  MULTIMEDIA_AND_GRAPHICS,
  ACCESSIBILITY_AND_SEO,
  WEB_COMPONENTS_AND_MODERN_APIS,
];
