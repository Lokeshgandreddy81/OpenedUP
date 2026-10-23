export type WordPressRoadmapStatus = "personal" | "alternative" | "optional";

export interface WordPressRoadmapNode {
  id: string;
  title: string;
  status?: WordPressRoadmapStatus;
  roadmapId?: string;
}

export interface WordPressRoadmapGroup {
  id: string;
  parent?: WordPressRoadmapNode;
  items: WordPressRoadmapNode[];
}

export interface WordPressRoadmapStage {
  id: string;
  node: WordPressRoadmapNode;
  left?: WordPressRoadmapGroup[];
  right?: WordPressRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface WordPressRoadmapSection {
  id: string;
  title?: string;
  stages: WordPressRoadmapStage[];
}

export interface WordPressRoadmapLink {
  label: string;
  roadmapId: string;
}

export const WORDPRESS_MARKERS: Array<{
  status: WordPressRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const WORDPRESS_RELATED_ROADMAPS: WordPressRoadmapLink[] = [
  { label: "Frontend Roadmap", roadmapId: "frontend" },
  { label: "PHP Roadmap", roadmapId: "skill-php" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "CSS Roadmap", roadmapId: "skill-css" },
  { label: "HTML Roadmap", roadmapId: "skill-html" },
];

export const WORDPRESS_CONTINUE_LEARNING: WordPressRoadmapLink[] = [
  { label: "PHP", roadmapId: "skill-php" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "JavaScript", roadmapId: "skill-javascript" },
  { label: "CSS", roadmapId: "skill-css" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: WordPressRoadmapStatus,
  roadmapId?: string,
  customId?: string
): WordPressRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: WordPressRoadmapNode[],
  parent?: WordPressRoadmapNode,
  customId?: string
): WordPressRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

export const WORDPRESS_SECTIONS: WordPressRoadmapSection[] = [
  {
    id: "prerequisites-setup",
    title: "Prerequisites & Local Environment",
    stages: [
      {
        id: "intro",
        node: n("Introduction", "personal"),
        left: [
          g([n("HTML"), n("CSS"), n("JavaScript")], n("Frontend Fundamentals")),
          g([n("PHP"), n("MySQL / MariaDB")], n("Backend Fundamentals")),
        ],
        right: [
          g([
            n("What is a CMS?"),
            n("How the Web Works & HTTP"),
            n("wordpress.org vs wordpress.com"),
          ]),
        ],
      },
      {
        id: "install-setup",
        node: n("Installation & Setup", "personal"),
        right: [
          g(
            [
              n("LocalWP", "personal"),
              n("Docker (docker-compose)", "alternative"),
              n("XAMPP / MAMP"),
              n("WP-CLI CLI Tools", "personal"),
            ],
            n("Local Development Stack")
          ),
        ],
      },
    ],
  },
  {
    id: "core-fundamentals",
    title: "WordPress Architecture & The Loop",
    stages: [
      {
        id: "file-structure",
        node: n("File Structure", "personal"),
        left: [
          g([
            n("wp-config.php"),
            n("wp-content (themes, plugins, uploads)"),
            n(".htaccess / Nginx rewrite rules"),
          ]),
        ],
      },
      {
        id: "the-loop",
        node: n("The Loop & Queries", "personal"),
        right: [
          g([
            n("have_posts() & the_post()"),
            n("WP_Query Class", "personal"),
            n("Template Tags (the_title, the_content)"),
            n("Pagination & Custom Queries"),
          ]),
        ],
      },
      {
        id: "hooks",
        node: n("Hooks: Actions & Filters", "personal"),
        left: [
          g([
            n("add_action() & do_action()"),
            n("add_filter() & apply_filters()"),
            n("Hook Priority & Arguments"),
            n("Common Hooks (init, wp_enqueue_scripts)"),
          ]),
        ],
      },
      {
        id: "enqueue",
        node: n("Style & Script Enqueueing", "personal"),
        right: [
          g([
            n("wp_enqueue_script()"),
            n("wp_enqueue_style()"),
            n("wp_localize_script() (Passing Data)"),
            n("Dependency Management & Versioning"),
          ]),
        ],
      },
      {
        id: "shortcodes",
        node: n("Shortcodes", "optional"),
      },
    ],
  },
  {
    id: "themes-and-blocks",
    title: "Themes, Block Editor & FSE",
    stages: [
      {
        id: "themes-overview",
        node: n("Themes Architecture", "personal"),
        left: [
          g([
            n("Block Themes (Full Site Editing)", "personal"),
            n("Classic Themes (PHP-based)", "alternative"),
            n("Child Themes", "personal"),
            n("Template Hierarchy"),
          ]),
        ],
      },
      {
        id: "classic-themes",
        node: n("Classic vs Block Themes"),
        right: [
          g(
            [
              n("functions.php & style.css"),
              n("Header, Footer & Sidebar Parts"),
              n("Customizer API & Widgets"),
            ],
            n("Classic")
          ),
          g(
            [
              n("theme.json Configuration", "personal"),
              n("Block Patterns & Template Parts"),
              n("Custom Gutenberg Blocks"),
            ],
            n("Block / FSE")
          ),
        ],
      },
      {
        id: "page-editors",
        node: n("Page Editors"),
        left: [
          g([
            n("Block Editor (Gutenberg)", "personal"),
            n("Third-Party Builders (Elementor, Bricks)", "alternative"),
          ]),
        ],
      },
      {
        id: "custom-data",
        node: n("Custom Post Types & Taxonomies", "personal"),
        right: [
          g([
            n("register_post_type()", "personal"),
            n("register_taxonomy()", "personal"),
            n("Advanced Custom Fields (ACF)", "personal"),
            n("Meta Boxes & Options API"),
          ]),
        ],
      },
    ],
  },
  {
    id: "plugin-development",
    title: "Plugin Development & Advanced PHP",
    stages: [
      {
        id: "plugins-core",
        node: n("Plugin Development", "personal"),
        left: [
          g([
            n("Plugin Header & Architecture"),
            n("Admin Menu & Settings API"),
            n("Activation & Deactivation Hooks"),
            n("Custom Database Tables ($wpdb)"),
            n("AJAX & WP Cron Jobs"),
            n("Transients API"),
          ]),
        ],
      },
      {
        id: "advanced-php",
        node: n("Advanced PHP & Modern Workflows", "personal"),
        right: [
          g([
            n("OOP in WordPress (PSR Standards)", "personal"),
            n("Composer & Autoloading"),
            n("Roots Stack (Bedrock, Sage)", "alternative"),
            n("WordPress Coding Standards (WPCS)"),
          ]),
        ],
      },
      {
        id: "rest-api-headless",
        node: n("WordPress REST API & Headless", "personal"),
        left: [
          g([
            n("register_rest_route() Custom Endpoints", "personal"),
            n("Authentication (JWT, App Passwords)"),
            n("WPGraphQL (GraphQL Alternative)", "alternative"),
            n("Headless Frontends (Next.js, Astro)"),
          ]),
        ],
      },
    ],
  },
  {
    id: "security-devops",
    title: "Security, Performance & Operations",
    stages: [
      {
        id: "security",
        node: n("Security & Hardening", "personal"),
        right: [
          g([
            n("Sanitization & Escaping (sanitize_text_field, esc_html)", "personal"),
            n("Nonces & CSRF Protection", "personal"),
            n("User Roles & Capabilities (current_user_can)"),
            n("Firewalls & Two-Factor Authentication"),
            n("Vulnerability Scanning"),
          ]),
        ],
      },
      {
        id: "performance",
        node: n("Performance Optimization", "personal"),
        left: [
          g([
            n("Object Caching (Redis / Memcached)", "personal"),
            n("Page Caching & CDN Integration"),
            n("Database Indexing & Query Monitor"),
            n("Core Web Vitals & Asset Minification"),
          ]),
        ],
      },
      {
        id: "devops-maintenance",
        node: n("DevOps & Maintenance", "personal"),
        right: [
          g([
            n("Automated Backups & Recovery", "personal"),
            n("Automated Deployments (CI/CD via GitHub Actions)"),
            n("Site Migrations & Staging Workflows"),
            n("Update Strategies for Core & Plugins"),
          ]),
        ],
      },
      {
        id: "specialized-topics",
        node: n("SEO, Multisite & Accessibility"),
        left: [
          g([
            n("Basics of SEO (Schema, Sitemap, OpenGraph)"),
            n("Multisite Network Setup"),
            n("Localization & i18n (__(), _e())"),
            n("Accessibility (WCAG 2.1 Compliance)"),
          ]),
        ],
      },
    ],
  },
];
