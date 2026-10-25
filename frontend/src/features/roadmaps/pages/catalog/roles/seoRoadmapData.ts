export type SeoRoadmapStatus = "personal" | "alternative" | "optional";

export interface SeoRoadmapNode {
  id: string;
  title: string;
  status?: SeoRoadmapStatus;
  roadmapId?: string;
}

export interface SeoRoadmapGroup {
  id: string;
  parent?: SeoRoadmapNode;
  items: SeoRoadmapNode[];
}

export interface SeoRoadmapStage {
  id: string;
  node: SeoRoadmapNode;
  left?: SeoRoadmapGroup[];
  right?: SeoRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface SeoRoadmapSection {
  id: string;
  title?: string;
  stages: SeoRoadmapStage[];
}

export interface SeoRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SEO_MARKERS: Array<{
  status: SeoRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SEO_RELATED_ROADMAPS: SeoRoadmapLink[] = [
  { label: "HTML Roadmap", roadmapId: "skill-html" },
  { label: "Next.js Roadmap", roadmapId: "skill-nextjs" },
  { label: "JavaScript Roadmap", roadmapId: "skill-javascript" },
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "Technical Writer", roadmapId: "technical-writer" },
  { label: "Data Analyst", roadmapId: "data-analyst" },
  { label: "Product Manager", roadmapId: "product-manager" },
];

export const SEO_CONTINUE_LEARNING: SeoRoadmapLink[] = [
  { label: "Frontend Developer", roadmapId: "frontend" },
  { label: "Next.js", roadmapId: "skill-nextjs" },
  { label: "Technical Writer", roadmapId: "technical-writer" },
  { label: "Data Analyst", roadmapId: "data-analyst" },
  { label: "Product Manager", roadmapId: "product-manager" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: SeoRoadmapStatus,
  roadmapId?: string,
  customId?: string
): SeoRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: SeoRoadmapNode[],
  parent?: SeoRoadmapNode,
  customId?: string
): SeoRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<SeoRoadmapStage, "id" | "node"> & {
    status?: SeoRoadmapStatus;
    roadmapId?: string;
    customId?: string;
  } = {}
): SeoRoadmapStage => {
  const { status, roadmapId, customId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const HOW_SEARCH_WORKS: SeoRoadmapSection = {
  id: "how-search-works",
  title: "1. Search Engines & AI Discovery",
  stages: [
    stage("How Search Engines Work", {
      left: [
        g(
          [
            n("Googlebot & Crawling Mechanics", "personal"),
            n("Document Parsing & The Indexing Pipeline", "personal"),
            n("Ranking Signals & Relevance Scoring", "personal"),
            n("Crawl Budget & Server Efficiency", "alternative"),
          ],
          n("Crawling, Indexing & Serving", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Intent: Informational, Transactional, Navigational", "personal"),
            n("Rich Snippets & People Also Ask (PAA)", "personal"),
            n("Knowledge Panels & Entity Recognition", "personal"),
            n("Local Pack & Map Results", "personal"),
          ],
          n("Search Intent & SERP Features", "personal")
        ),
      ],
      noteAfter:
        "Search engines discover pages through links and sitemaps, store content in an inverted index, and rank results based on relevance, quality, and authority signals.",
    }),
  ],
};

const GEO_AND_AI_SEARCH: SeoRoadmapSection = {
  id: "geo-and-ai-search",
  title: "2. Generative Engine Optimization (GEO)",
  stages: [
    stage("AI Overviews & Answer Engines", {
      left: [
        g(
          [
            n("Google AI Overviews (SGE)", "personal"),
            n("ChatGPT Search, Perplexity & Claude", "personal"),
            n("Lexical vs Vector Semantic Search", "personal"),
            n("Retrieval-Augmented Generation (RAG)", "personal"),
            n("Query Fan-Out & Multi-Step Expansion", "alternative"),
          ],
          n("AI Search Paradigms", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Direct Answer Formats & Summary Blocks", "personal"),
            n("Data Tables & Scannable Bullet Points", "personal"),
            n("Information Gain & Primary Research", "personal"),
            n("Brand Salience & Entity Association", "personal"),
            n("Tracking AI Citations & Answer Share", "personal"),
          ],
          n("GEO Optimization Strategies", "personal")
        ),
      ],
      noteAfter:
        "Generative Engine Optimization (GEO) optimizes content to be retrieved, synthesized, and cited within AI-generated conversational answers.",
      projectIdea:
        "GEO Content Optimization: Restructure an informational guide with concise direct-answer blocks, JSON-LD schema, comparison tables, and primary quotes to target Google AI Overviews and Perplexity citations.",
    }),
  ],
};

const TECHNICAL_SEO: SeoRoadmapSection = {
  id: "technical-seo",
  title: "3. Technical SEO & Architecture",
  stages: [
    stage("Site Architecture & URL Design", {
      left: [
        g(
          [
            n("Flat Architecture (Max 3 Clicks to Content)", "personal"),
            n("Clean, Human-Readable URL Slugs", "personal"),
            n("Internal Linking & Contextual Anchor Text", "personal"),
            n("Breadcrumb Hierarchies", "personal"),
          ],
          n("URL Structure & Taxonomy", "personal")
        ),
      ],
      right: [
        g(
          [
            n("XML Sitemaps & Sitemap Indexes", "personal"),
            n("robots.txt & Crawl Rules", "personal"),
            n("Canonical Tags (rel='canonical')", "personal"),
            n("Pagination & Infinite Scroll Handling", "personal"),
            n("Faceted Navigation & URL Parameters", "alternative"),
          ],
          n("Indexing Controls & Directives", "personal")
        ),
      ],
    }),
    stage("Core Web Vitals & Rendering", {
      status: "personal",
      roadmapId: "best-practice-frontend-performance",
      left: [
        g(
          [
            n("Largest Contentful Paint (LCP) < 2.5s", "personal"),
            n("Interaction to Next Paint (INP) < 200ms", "personal"),
            n("Cumulative Layout Shift (CLS) < 0.1", "personal"),
            n("PageSpeed Insights & Chrome UX Report (CrUX)", "personal"),
          ],
          n("Core Web Vitals (CWV)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Server-Side Rendering (SSR) & SSG", "personal", "skill-nextjs"),
            n("Client-Side Rendering (CSR) Hydration Pitfalls", "personal"),
            n("Mobile-First Indexing & Responsive Viewports", "personal"),
            n("HTTPS, HSTS & TLS Security", "personal"),
            n("HTTP Status Codes: 301, 302, 404, 410, 503", "personal"),
          ],
          n("Rendering & Server Performance", "personal")
        ),
      ],
      projectIdea:
        "Technical SEO Audit: Conduct a full crawl audit using Screaming Frog or Sitebulb to detect redirect chains, broken links, non-canonical indexing, and sub-optimal Core Web Vitals.",
    }),
  ],
};

const ON_PAGE_SEO: SeoRoadmapSection = {
  id: "on-page-seo",
  title: "4. On-Page SEO & Semantic HTML",
  stages: [
    stage("On-Page Optimization", {
      status: "personal",
      roadmapId: "skill-html",
      left: [
        g(
          [
            n("Title Tags (50-60 characters, front-loaded keyword)", "personal"),
            n("Compelling Meta Descriptions (CTR optimization)", "personal"),
            n("Open Graph & Twitter Social Meta Cards", "personal"),
            n("Robots Meta Directives (noindex, nofollow)", "personal"),
          ],
          n("HTML Head Meta Data", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Single H1 Tag per Page", "personal"),
            n("Logical H2, H3 Subheading Structure", "personal"),
            n("Image Alt Text & Responsive srcset", "personal"),
            n("Semantic Tags: article, section, nav, aside", "personal"),
            n("Contextual Internal Link Anchors", "personal"),
          ],
          n("Semantic Body Structure", "personal")
        ),
      ],
      noteAfter:
        "Semantic HTML provides clear structural hints that help search algorithms and screen readers understand document layout, topic hierarchy, and primary content.",
    }),
  ],
};

const STRUCTURED_DATA: SeoRoadmapSection = {
  id: "structured-data",
  title: "5. Structured Data & Entities",
  stages: [
    stage("Schema Markup & Knowledge Graphs", {
      left: [
        g(
          [
            n("Organization & LocalBusiness Schema", "personal"),
            n("Article, NewsArticle & BlogPosting Schema", "personal"),
            n("Product, Offer & AggregateRating Schema", "personal"),
            n("FAQPage & HowTo Schema", "personal"),
            n("BreadcrumbList Schema", "personal"),
          ],
          n("JSON-LD Structured Data", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Entities vs Keywords (Entity Salience)", "personal"),
            n("Wikidata, Wikipedia & sameAs Attributes", "personal"),
            n("Google Knowledge Vault Alignment", "personal"),
            n("Rich Results Test & Schema Validator", "personal"),
          ],
          n("Entity SEO & Knowledge Graph", "personal")
        ),
      ],
      noteAfter:
        "Structured data eliminates ambiguity for search engines and LLMs, mapping your brand, authors, and products directly into authoritative knowledge graphs.",
    }),
  ],
};

const KEYWORD_RESEARCH: SeoRoadmapSection = {
  id: "keyword-research",
  title: "6. Keyword Research & Topic Clustering",
  stages: [
    stage("Keyword Strategy & Topic Clusters", {
      left: [
        g(
          [
            n("Search Volume vs Keyword Difficulty (KD)", "personal"),
            n("Long-Tail Keyword Identification", "personal"),
            n("Competitor Content Gap Analysis", "personal"),
            n("PAA & Community Mining (Reddit, Quora)", "personal"),
            n("Tools: Ahrefs, Semrush, Google Keyword Planner", "personal"),
          ],
          n("Keyword Discovery & Analysis", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Pillar Pages: Authoritative Broad Guides", "personal"),
            n("Cluster Content: Specific Subtopic Articles", "personal"),
            n("Bidirectional Internal Linking Mesh", "personal"),
            n("Search Intent Matching: Answering the Core Need", "personal"),
          ],
          n("Topic Clusters & Pillar Architecture", "personal")
        ),
      ],
      projectIdea:
        "Topic Cluster Architecture: Plan a complete 10-article topic cluster around a commercial keyword, defining pillar structure, subtopics, search intents, and internal link maps.",
    }),
  ],
};

const CONTENT_QUALITY: SeoRoadmapSection = {
  id: "content-quality",
  title: "7. Content Quality & E-E-A-T",
  stages: [
    stage("E-E-A-T & Editorial Standards", {
      left: [
        g(
          [
            n("Experience: First-hand real-world testing & photos", "personal"),
            n("Expertise: Author bylines, bios & credentials", "personal"),
            n("Authoritativeness: Industry citations & awards", "personal"),
            n("Trust: Transparent editorial policies & reviews", "personal"),
          ],
          n("Google E-E-A-T Principles", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Information Gain: Proprietary Data & Studies", "personal"),
            n("Content Pruning & De-indexing Thin Pages", "personal"),
            n("Scheduled Content Refresh & Update Cadence", "personal"),
            n("Resolving Keyword Cannibalization", "personal"),
          ],
          n("Content Freshness & Quality Lifecycle", "personal")
        ),
      ],
      noteAfter:
        "E-E-A-T is not a single ranking factor, but a qualitative framework through which Google evaluates whether your site is safe, credible, and genuinely helpful to users.",
    }),
  ],
};

const OFF_PAGE_SEO: SeoRoadmapSection = {
  id: "off-page-seo",
  title: "8. Authority Building & Digital PR",
  stages: [
    stage("Backlinks & Digital PR", {
      left: [
        g(
          [
            n("Original Industry Data Studies & Surveys", "personal"),
            n("Free Interactive Tools & Calculators", "personal"),
            n("Expert Commentary (HARO / Connectively)", "personal"),
            n("Unlinked Brand Mention Reclamation", "personal"),
            n("Broken Link Building", "alternative"),
          ],
          n("Link Earning & Digital PR", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Domain Authority vs Topical Relevance", "personal"),
            n("Dofollow vs Nofollow, Sponsored, UGC Links", "personal"),
            n("Anchor Text Distribution & Natural Profiles", "personal"),
            n("Avoiding Link Farms, PBNs & Paid Link Penalties", "personal"),
          ],
          n("Link Quality & Compliance", "personal")
        ),
      ],
      projectIdea:
        "Original Research Link Asset: Compile a data-driven industry benchmark report with charts and actionable insights to pitch to journalists and industry blogs for top-tier editorial backlinks.",
    }),
  ],
};

const LOCAL_AND_INTERNATIONAL: SeoRoadmapSection = {
  id: "local-and-international",
  title: "9. Local & International SEO",
  stages: [
    stage("Local & Multilingual Search", {
      left: [
        g(
          [
            n("Google Business Profile (GBP) Optimization", "personal"),
            n("NAP Consistency (Name, Address, Phone)", "personal"),
            n("Local Business Citations & Directories", "personal"),
            n("Review Generation & Customer Sentiment", "personal"),
            n("Geo-Targeted Landing Pages", "personal"),
          ],
          n("Local Search & Map Packs", "personal")
        ),
      ],
      right: [
        g(
          [
            n("hreflang Tags & Language Alternate Targets", "personal"),
            n("ccTLDs vs Subdirectories vs Subdomains", "personal"),
            n("Regional Currency, Phone & Date Localization", "personal"),
            n("Geo-Targeting Configuration in GSC", "personal"),
          ],
          n("International SEO & Localization", "personal")
        ),
      ],
    }),
  ],
};

const ANALYTICS_AND_MONITORING: SeoRoadmapSection = {
  id: "analytics-and-monitoring",
  title: "10. Analytics & Performance Tracking",
  stages: [
    stage("Search Analytics & Measurement", {
      left: [
        g(
          [
            n("Impressions, Clicks, CTR & Average Position", "personal"),
            n("Page Indexing & Coverage Reports", "personal"),
            n("Core Web Vitals & Mobile Usability Reports", "personal"),
            n("URL Inspection & Live Testing Tool", "personal"),
            n("Crawl Stats & Server Response Times", "personal"),
          ],
          n("Google Search Console (GSC)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Google Analytics 4 (GA4): Organic Conversions", "personal"),
            n("Microsoft Clarity / Hotjar: Heatmaps & Recordings", "personal"),
            n("Daily Rank Tracking (Semrush / Ahrefs)", "personal"),
            n("AI Citation Tracking in Perplexity & ChatGPT", "personal"),
          ],
          n("Web Analytics & AI Visibility", "personal")
        ),
      ],
      projectIdea:
        "Organic Performance Dashboard: Build a Looker Studio dashboard connected to Google Search Console and GA4 tracking branded vs non-branded traffic, top landing pages, and CTR trends.",
    }),
  ],
};

const GOVERNANCE_AND_AUDITS: SeoRoadmapSection = {
  id: "governance-and-audits",
  title: "11. Audits, Governance & Strategy",
  stages: [
    stage("SEO Audits & Algorithm Governance", {
      left: [
        g(
          [
            n("Google Core Updates & Helpful Content System", "personal"),
            n("Spam Updates & Manual Action Recoveries", "personal"),
            n("Server Log File Analysis for Bot Crawls", "personal"),
            n("Diagnosing Traffic Drops & Algorithmic Impact", "personal"),
          ],
          n("Algorithm Updates & Penalty Recovery", "personal")
        ),
      ],
      right: [
        g(
          [
            n("End-to-End Technical & Content Audits", "personal"),
            n("Prioritization Frameworks (Impact vs Effort)", "personal"),
            n("SEO Product Requirement Documents (PRDs)", "personal"),
            n("Developer & Editorial Cross-Team Alignment", "personal"),
          ],
          n("SEO Strategy & Project Execution", "personal")
        ),
      ],
      noteAfter:
        "Sustainable SEO is an ongoing engineering and editorial discipline. The best SEOs partner closely with developers, product managers, and copywriters to build long-term search equity.",
    }),
  ],
};

export const SEO_SECTIONS: SeoRoadmapSection[] = [
  HOW_SEARCH_WORKS,
  GEO_AND_AI_SEARCH,
  TECHNICAL_SEO,
  ON_PAGE_SEO,
  STRUCTURED_DATA,
  KEYWORD_RESEARCH,
  CONTENT_QUALITY,
  OFF_PAGE_SEO,
  LOCAL_AND_INTERNATIONAL,
  ANALYTICS_AND_MONITORING,
  GOVERNANCE_AND_AUDITS,
];
