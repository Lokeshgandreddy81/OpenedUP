import type { ComputedRow } from "@charan-interiors/contracts";

interface CurriculumItem {
  title: string;
  summary: string;
  keyTopics: string[];
}

const CURATED_ROADMAPS: Record<string, CurriculumItem[]> = {
  frontend: [
    {
      title: "Internet & Web Fundamentals",
      summary:
        "Understand how the web works: DNS, HTTP/HTTPS, browser rendering pipeline, client-server model, and web hosting.",
      keyTopics: [
        "How Browsers Work",
        "DNS & Domain Names",
        "HTTP/1.1 vs HTTP/2 & HTTP/3",
        "Hosting & SSL/TLS",
      ],
    },
    {
      title: "HTML5 Semantic Structure & Accessibility",
      summary:
        "Build accessible, semantic markup with modern HTML elements, form validation, SEO meta tags, and WCAG accessibility standards.",
      keyTopics: [
        "Semantic Elements",
        "Forms & Input Types",
        "WCAG & ARIA Roles",
        "SEO Best Practices",
      ],
    },
    {
      title: "CSS3 Layouts, Grid & Modern Styling",
      summary:
        "Master responsive styling, CSS Box Model, Flexbox, CSS Grid, media queries, CSS variables, and modern animation techniques.",
      keyTopics: [
        "Flexbox Architecture",
        "CSS Grid Systems",
        "Responsive Breakpoints",
        "Custom Properties (CSS Variables)",
        "Transitions & Keyframe Animations",
      ],
    },
    {
      title: "JavaScript Essentials & ES6+ Features",
      summary:
        "Deep dive into core JavaScript language mechanisms: scoping, closures, prototypes, event delegation, and modern ESNext features.",
      keyTopics: [
        "Closures & Lexical Scope",
        "Prototypes & Inheritance",
        "Destructuring & Spread",
        "Modules (ESM vs CJS)",
        "Event Delegation",
      ],
    },
    {
      title: "Asynchronous JavaScript & Web APIs",
      summary:
        "Harness asynchronous control flows: Promises, async/await, Fetch API, DOM manipulation, Storage APIs, and Event Loop internals.",
      keyTopics: [
        "Promises & Async/Await",
        "Event Loop & Microtasks",
        "Fetch API & Error Handling",
        "Local/Session Storage & IndexedDB",
      ],
    },
    {
      title: "Package Managers & Modern Build Tooling",
      summary:
        "Configure modern frontend toolchains: npm/pnpm/yarn, Vite, ESBuild, Rollup, TypeScript compiler, and code quality linters.",
      keyTopics: [
        "npm & Lockfiles",
        "Vite & Hot Module Replacement",
        "TypeScript in Frontend",
        "ESLint & Prettier",
      ],
    },
    {
      title: "React Component Architecture & Hooks",
      summary:
        "Build component-driven user interfaces using functional components, props, state, custom hooks, and React reconciliation.",
      keyTopics: [
        "Components & JSX",
        "useState & useEffect",
        "Custom Hooks",
        "Reconciliation & Virtual DOM",
        "Context API",
      ],
    },
    {
      title: "State Management & Server Cache",
      summary:
        "Scale application state across local and global stores: client state with Zustand/Redux and server cache with TanStack Query.",
      keyTopics: [
        "Zustand & Lightweight State",
        "Redux Toolkit Patterns",
        "TanStack React Query",
        "Optimistic UI Updates",
      ],
    },
    {
      title: "Modern Frameworks & SSR/SSG",
      summary:
        "Explore full-stack React meta-frameworks with server-side rendering, static generation, server components, and edge routing.",
      keyTopics: [
        "Next.js App Router",
        "Server Components vs Client Components",
        "Static Site Generation (SSG)",
        "Incremental Static Regeneration",
      ],
    },
    {
      title: "Frontend Testing, Performance & Security",
      summary:
        "Ensure production reliability: unit tests with Vitest, component tests with Testing Library, E2E with Playwright, and Core Web Vitals.",
      keyTopics: [
        "Vitest & Jest Dom",
        "Testing Library Philosophy",
        "Playwright E2E Tests",
        "Core Web Vitals & Lighthouse",
        "CORS, XSS & CSP Defense",
      ],
    },
  ],

  backend: [
    {
      title: "Operating Systems, Linux & Sockets",
      summary:
        "Understand operating system fundamentals: processes, threads, POSIX syscalls, memory management, and socket networking.",
      keyTopics: [
        "Linux Shell & Permissions",
        "Processes vs Threads",
        "TCP/IP & UDP Protocols",
        "File Systems & Streams",
      ],
    },
    {
      title: "Backend Runtime & Language Mastery",
      summary:
        "Master a robust backend runtime (Node.js/TypeScript, Go, Python, or Java) including concurrency, garbage collection, and event handling.",
      keyTopics: [
        "Event-Driven I/O",
        "Concurrency & Worker Threads",
        "Package Ecosystem",
        "Type Safety & Interfaces",
      ],
    },
    {
      title: "Relational Databases & SQL Schema Design",
      summary:
        "Design relational data schemas, write complex queries, manage ACID transactions, and optimize database access.",
      keyTopics: [
        "PostgreSQL Schema Design",
        "Indexes (B-tree, Hash, GIN)",
        "ACID Transactions & Isolation",
        "Foreign Keys & Constraints",
      ],
    },
    {
      title: "NoSQL Stores, Caching & Key-Value Engines",
      summary:
        "Incorporate specialized databases: document stores, in-memory caches, and key-value systems for high-throughput workloads.",
      keyTopics: [
        "Redis Caching Strategies",
        "Cache Invalidation & TTL",
        "Document Databases (MongoDB)",
        "Key-Value Stores",
      ],
    },
    {
      title: "RESTful API Architecture & Validation",
      summary:
        "Design resilient REST APIs with predictable routing, status codes, input validation (Zod), and consistent JSON error formats.",
      keyTopics: [
        "REST Best Practices",
        "Zod & JSON Schema Validation",
        "Middleware Pipelines",
        "Pagination & Filtering Standards",
      ],
    },
    {
      title: "Authentication, Authorization & Security",
      summary:
        "Secure endpoints using modern auth patterns: JWTs, refresh tokens, session cookies, OAuth2/OIDC, and Role-Based Access Control.",
      keyTopics: [
        "JWT & Token Revocation",
        "OAuth 2.0 & OpenID Connect",
        "Password Hashing (Argon2/bcrypt)",
        "Role-Based Access Control (RBAC)",
      ],
    },
    {
      title: "Microservices & Message Brokers",
      summary:
        "Decouple services with asynchronous event architectures, message queues, and pub/sub messaging patterns.",
      keyTopics: [
        "Message Queues (RabbitMQ)",
        "Event Streaming (Kafka)",
        "Pub/Sub Architectures",
        "Idempotency & Dead Letter Queues",
      ],
    },
    {
      title: "Containers & Deployment Automation",
      summary:
        "Package backend services with multi-stage Docker containers, Docker Compose, and CI/CD pipelines.",
      keyTopics: [
        "Multi-Stage Dockerfiles",
        "Docker Compose Orchestration",
        "GitHub Actions CI/CD",
        "Environment Configuration & Secrets",
      ],
    },
    {
      title: "Observability, Logging & SRE",
      summary:
        "Monitor production services with structured logging, distributed tracing, metrics collection, and alerting.",
      keyTopics: [
        "Structured Logging (Pino)",
        "Prometheus & Metrics",
        "OpenTelemetry & Tracing",
        "Health Checks (Liveness/Readiness)",
      ],
    },
  ],

  "full-stack": [
    {
      title: "Web Foundation & Protocols",
      summary:
        "Master the full request-response lifecycle from browser client to server and database.",
      keyTopics: [
        "HTTP/HTTPS Protocol",
        "DNS & TLS Handshake",
        "Client-Server Model",
        "JSON Data Interchange",
      ],
    },
    {
      title: "Modern Frontend UI Development",
      summary:
        "Build interactive client interfaces using modern JavaScript/TypeScript, React, and Tailwind CSS.",
      keyTopics: [
        "React 19 & Component Trees",
        "Tailwind CSS Layouts",
        "Responsive Design",
        "Client-Side Routing",
      ],
    },
    {
      title: "Server Runtimes & API Creation",
      summary:
        "Create scalable backend services with Node.js/Express or FastAPI with type-safe schemas.",
      keyTopics: [
        "Express/FastAPI Servers",
        "RESTful Routing",
        "Request Validation",
        "Middleware Chains",
      ],
    },
    {
      title: "Database Modeling & Data Persistence",
      summary:
        "Model data relationships with PostgreSQL, relational schemas, ORMs/query builders, and migrations.",
      keyTopics: ["PostgreSQL", "Prisma / Drizzle ORM", "Schema Migrations", "Database Indexing"],
    },
    {
      title: "Full-Stack Authentication & State Flow",
      summary:
        "Connect frontend authentication states to backend auth guards using secure session tokens and cookies.",
      keyTopics: [
        "Cookie & Session Auth",
        "JWT Bearer Tokens",
        "Protected Frontend Routes",
        "Auth Middleware",
      ],
    },
    {
      title: "Full-Stack Deployment & CI/CD",
      summary:
        "Automate build, test, and production deployment across cloud providers with Docker and automated workflows.",
      keyTopics: [
        "Docker Containerization",
        "Reverse Proxies (Nginx)",
        "Cloud Hosting (Vercel/Railway)",
        "Automated E2E Testing",
      ],
    },
  ],

  devops: [
    {
      title: "Linux Administration & Shell Scripting",
      summary:
        "Core system administration: process supervision, systemd services, shell scripting, and network configuration.",
      keyTopics: [
        "Bash/Zsh Scripting",
        "Systemd Services",
        "File Permissions & SSH",
        "Network Diagnostics (curl, netstat)",
      ],
    },
    {
      title: "Containerization with Docker",
      summary:
        "Build production container images with multi-stage builds, layer caching, and rootless security.",
      keyTopics: [
        "Docker Engine",
        "Optimized Dockerfiles",
        "Container Networking",
        "Docker Compose Multi-Container",
      ],
    },
    {
      title: "Continuous Integration & Deployment (CI/CD)",
      summary:
        "Automate delivery pipelines with automated testing, linting, security scanning, and deployment gates.",
      keyTopics: [
        "GitHub Actions Workflows",
        "Automated Testing Gates",
        "Artifact Storage",
        "Zero-Downtime Deployments",
      ],
    },
    {
      title: "Infrastructure as Code (IaC)",
      summary:
        "Provision reproducible cloud infrastructure declaratively using Terraform and cloud provider APIs.",
      keyTopics: [
        "Terraform Modules & State",
        "Cloud Provider Resources (AWS/GCP)",
        "Drift Detection",
        "Immutable Infrastructure",
      ],
    },
    {
      title: "Kubernetes Container Orchestration",
      summary:
        "Deploy and manage containerized applications at scale using Kubernetes pods, deployments, and services.",
      keyTopics: [
        "Pods, Deployments & Services",
        "Ingress Controllers",
        "ConfigMaps & Secrets",
        "Horizontal Pod Autoscaling",
      ],
    },
    {
      title: "Observability, Telemetry & SRE",
      summary:
        "Maintain reliability with monitoring, alerting, Prometheus metrics, Grafana dashboards, and incident response.",
      keyTopics: [
        "Prometheus Metrics",
        "Grafana Dashboards",
        "Alertmanager",
        "SLOs, SLIs & Error Budgets",
      ],
    },
  ],

  "ai-engineer": [
    {
      title: "Python & Scientific Computing",
      summary:
        "Build robust foundations in Python, NumPy vectorization, Pandas data structures, and tensor math.",
      keyTopics: [
        "Python Types & Packaging",
        "NumPy Vectorization",
        "Pandas DataFrames",
        "Linear Algebra Basics",
      ],
    },
    {
      title: "LLM Fundamentals & Foundation Models",
      summary:
        "Understand transformer architectures, attention mechanisms, tokenization, embeddings, and frontier APIs.",
      keyTopics: [
        "Self-Attention & Transformers",
        "Tokenization & Context Windows",
        "OpenAI & Gemini APIs",
        "Temperature & Sampling",
      ],
    },
    {
      title: "Prompt Engineering & Structured Outputs",
      summary:
        "Elicit reliable model behavior through few-shot prompting, chain-of-thought, system instructions, and JSON schemas.",
      keyTopics: [
        "Few-Shot & CoT Prompting",
        "Constrained Decoding (JSON Mode)",
        "System Prompts",
        "Evaluation Benchmarks",
      ],
    },
    {
      title: "Embeddings & Vector Databases",
      summary:
        "Index unstructured text into dense vector spaces and query similarity using modern vector databases.",
      keyTopics: [
        "Text Embeddings",
        "Cosine Similarity",
        "Vector Indexes (HNSW)",
        "Vector Stores (Chroma, Pinecone, pgvector)",
      ],
    },
    {
      title: "Retrieval-Augmented Generation (RAG)",
      summary:
        "Ground model responses in proprietary data: chunking strategies, hybrid search, re-ranking, and context synthesis.",
      keyTopics: [
        "Document Chunking & Slicing",
        "Semantic & Keyword Search",
        "Re-ranking Models",
        "Hallucination Mitigation",
      ],
    },
    {
      title: "AI Agents & Tool Calling",
      summary:
        "Build autonomous agents capable of multi-step reasoning, function execution, tool usage, and human-in-the-loop oversight.",
      keyTopics: [
        "Function / Tool Calling",
        "ReAct Agent Pattern",
        "Planning & Memory",
        "Guardrails & Safety Filters",
      ],
    },
  ],

  "skill-react": [
    {
      title: "React Fundamentals & Component Model",
      summary:
        "Core concepts of React: JSX syntax, component trees, props passing, and pure rendering functions.",
      keyTopics: [
        "JSX Transpilation",
        "Functional Components",
        "Props & Children",
        "Conditional Rendering",
      ],
    },
    {
      title: "State & Lifecycle with Hooks",
      summary:
        "Manage component reactivity with useState, useEffect lifecycle control, and useRef DOM access.",
      keyTopics: [
        "useState & Batching",
        "useEffect & Cleanup",
        "useRef for Mutable Values",
        "Controlled vs Uncontrolled",
      ],
    },
    {
      title: "Performance & Memoization Hooks",
      summary:
        "Optimize rendering cycles using useMemo, useCallback, React.memo, and Profiler diagnostics.",
      keyTopics: [
        "useCallback for Event Handlers",
        "useMemo for Computations",
        "React.memo Component Memoization",
        "Avoiding Re-renders",
      ],
    },
    {
      title: "Context API & Global State",
      summary:
        "Share state across complex trees without prop drilling using React Context and modern state managers.",
      keyTopics: [
        "createContext & useContext",
        "Splitting Context Providers",
        "Zustand Integration",
        "Custom Hook Encapsulation",
      ],
    },
    {
      title: "React 19 & Server Architecture",
      summary:
        "Modern React features: Server Components, useActionState, useOptimistic, Actions, and asset preloading.",
      keyTopics: [
        "React Server Components (RSC)",
        "Actions & useActionState",
        "useOptimistic",
        "Suspense & Concurrent Mode",
      ],
    },
  ],

  "skill-python": [
    {
      title: "Python Syntax & Built-in Types",
      summary:
        "Language fundamentals: numbers, strings, lists, dictionaries, sets, tuples, and control flow structures.",
      keyTopics: [
        "Data Types & Mutability",
        "List & Dict Comprehensions",
        "Control Flow & Pattern Matching",
        "Functions & Scope",
      ],
    },
    {
      title: "Object-Oriented & Functional Python",
      summary:
        "Advanced language patterns: classes, dunder methods, inheritance, decorators, generators, and iterators.",
      keyTopics: [
        "Classes & Dunder Methods",
        "Decorators & Wrappers",
        "Generators & yield",
        "Type Annotations & mypy",
      ],
    },
    {
      title: "Virtual Environments & Package Management",
      summary:
        "Manage project dependencies cleanly using venv, uv, pip, pyproject.toml, and isolated environments.",
      keyTopics: [
        "Virtual Environments (venv/uv)",
        "pip & pyproject.toml",
        "Standard Library Gems",
        "Package Publishing",
      ],
    },
    {
      title: "Concurrency, AsyncIO & Web Backends",
      summary:
        "Write high-performance asynchronous Python with asyncio, event loops, FastAPI, and asynchronous databases.",
      keyTopics: [
        "async / await Syntax",
        "asyncio Event Loop",
        "FastAPI Framework",
        "Multiprocessing vs Threading",
      ],
    },
  ],

  "best-practice-aws": [
    {
      title: "Security & Identity Architecture (IAM)",
      summary:
        "Apply principle of least privilege, role-based delegation, MFA enforcement, and credential rotation.",
      keyTopics: [
        "Least Privilege IAM Policies",
        "IAM Roles vs Users",
        "Service Control Policies (SCPs)",
        "AWS Secrets Manager",
      ],
    },
    {
      title: "VPC & Network Segmentation",
      summary:
        "Design isolated cloud topologies with private subnets, NAT gateways, Security Groups, and VPC Endpoints.",
      keyTopics: [
        "Public vs Private Subnets",
        "Security Groups vs NACLs",
        "VPC Endpoints & PrivateLink",
        "Transit Gateways",
      ],
    },
    {
      title: "Reliability & Multi-AZ High Availability",
      summary:
        "Architect self-healing systems across Multiple Availability Zones with Application Load Balancers and Auto Scaling.",
      keyTopics: [
        "Multi-AZ Deployments",
        "Auto Scaling Groups",
        "Application Load Balancers",
        "Disaster Recovery Strategies",
      ],
    },
    {
      title: "Cost Optimization & Observability",
      summary:
        "Monitor compute and storage utilization with AWS Cost Explorer, CloudWatch alarms, and S3 lifecycle rules.",
      keyTopics: [
        "CloudWatch Metrics & Alarms",
        "S3 Tiering & Lifecycle",
        "Reserved Instances & Savings Plans",
        "AWS Budgets",
      ],
    },
  ],

  "best-practice-api-security": [
    {
      title: "Authentication & Cryptographic Tokens",
      summary:
        "Implement hardened token workflows, short-lived access tokens, refresh token rotation, and secure cookie storage.",
      keyTopics: [
        "JWT Signing & Alg None Prevention",
        "Refresh Token Rotation",
        "HttpOnly, Secure Cookies",
        "OAuth2 PKCE Flow",
      ],
    },
    {
      title: "Input Validation, Sanitization & Schemas",
      summary:
        "Prevent injection and payload attacks by strictly enforcing input schemas with Zod and content sanitization.",
      keyTopics: [
        "Strict Schema Validation (Zod)",
        "SQL Injection Prevention",
        "NoSQL Injection Mitigation",
        "Payload Size Limits",
      ],
    },
    {
      title: "Rate Limiting & Abuse Prevention",
      summary:
        "Protect endpoints against DDoS, credential stuffing, and brute force with distributed rate limiting and token buckets.",
      keyTopics: [
        "Token Bucket / Leaky Bucket",
        "Redis Rate Limiting",
        "IP Reputation & Bot Filters",
        "Circuit Breakers",
      ],
    },
    {
      title: "Transport Security, Headers & Auditing",
      summary:
        "Enforce TLS 1.3, configure security headers (HSTS, CSP), and maintain immutable security audit logs.",
      keyTopics: [
        "Strict-Transport-Security (HSTS)",
        "Content Security Policy (CSP)",
        "CORS Restrictions",
        "Tamper-Proof Audit Logging",
      ],
    },
  ],
};

function generateDefaultCurriculum(title: string): CurriculumItem[] {
  return [
    {
      title: `${title} Foundations & Core Principles`,
      summary: `Understand foundational concepts, architectural models, and core prerequisites necessary to master ${title}.`,
      keyTopics: [
        "Core Terminology",
        "Underlying Architecture",
        "Prerequisite Knowledge",
        "Mental Models",
      ],
    },
    {
      title: `Environment Setup & Tooling for ${title}`,
      summary: `Configure a production-ready developer environment, toolchains, dependency managers, and linters for ${title}.`,
      keyTopics: [
        "Development Environment",
        "CLI & Package Tools",
        "Configuration Best Practices",
        "IDE Setup",
      ],
    },
    {
      title: `Core Implementation & Practical Patterns`,
      summary: `Learn hands-on implementation patterns, canonical idioms, and day-to-day practical workflows in ${title}.`,
      keyTopics: [
        "Standard Workflows",
        "Idiomatic Patterns",
        "Component/Module Design",
        "Common Algorithms",
      ],
    },
    {
      title: `Ecosystem, Libraries & Integrations`,
      summary: `Survey essential third-party libraries, ecosystem tools, and integration points commonly paired with ${title}.`,
      keyTopics: [
        "Top Ecosystem Packages",
        "Integration Patterns",
        "APIs & Interoperability",
        "Data Formats",
      ],
    },
    {
      title: `Testing, Debugging & Quality Assurance`,
      summary: `Apply automated unit, integration, and end-to-end testing strategies to verify code correctness in ${title}.`,
      keyTopics: [
        "Unit Testing",
        "Mocking & Fixtures",
        "Integration Validation",
        "Debugging Techniques",
      ],
    },
    {
      title: `Performance Tuning & Optimization`,
      summary: `Diagnose bottlenecks, analyze memory and CPU consumption, and optimize throughput and latency in ${title}.`,
      keyTopics: [
        "Profiling & Metrics",
        "Memory Optimization",
        "Latency Reduction",
        "Caching Strategies",
      ],
    },
    {
      title: `Security, Hardening & Vulnerability Defense`,
      summary: `Identify common security risks, attack surfaces, authentication patterns, and defensive safeguards in ${title}.`,
      keyTopics: [
        "Threat Modeling",
        "Input Validation",
        "Credential Management",
        "Secure Defaults",
      ],
    },
    {
      title: `Production Deployment & Maintenance`,
      summary: `Deploy applications reliably using CI/CD pipelines, containerization, observability monitoring, and rollback strategies.`,
      keyTopics: [
        "CI/CD Pipelines",
        "Container Deployments",
        "Monitoring & Alerts",
        "Maintenance & Upgrades",
      ],
    },
  ];
}

export function getCatalogRoadmapChapters(roadmapId: string, roadmapTitle: string): ComputedRow[] {
  const normalizedId = roadmapId.toLowerCase().trim();
  const strippedId = normalizedId.replace(/^skill-/, "").replace(/^best-practice-/, "");

  const items: CurriculumItem[] =
    CURATED_ROADMAPS[normalizedId] ||
    CURATED_ROADMAPS[strippedId] ||
    generateDefaultCurriculum(roadmapTitle);

  return items.map((item, idx) => {
    const rowNum = idx + 1;
    const startP = idx * 10 + 1;
    const endP = startP + 9;

    return {
      id: `catalog-row-${roadmapId}-${rowNum}`,
      row: rowNum,
      photo_index: 1,
      box_2d: [100, 100, 900, 900],
      merchant: item.title,
      date: null,
      time: null,
      item_count: item.keyTopics.length,
      printed_total: null,
      handwritten_tip: null,
      final_total: null,
      currency: "USD",
      tax: null,
      tax_label: null,
      category: "Other",
      card_last4: null,
      confidence: {
        merchant: 1,
        date: 1,
        printed_total: 1,
        handwritten_tip: 1,
        currency: 1,
        tax: 1,
      },
      flags: [],
      // Chapter metadata
      chapter_number: rowNum,
      chapter_title: item.title,
      summary: item.summary,
      key_topics: item.keyTopics,
      start_page: startP,
      end_page: endP,
      word_count: 1400,
      is_explicit_chapter: true,
      // ComputedRow attributes
      code_calculated_total: 0,
      tip_mismatch: false,
      effective_currency: "USD",
      is_foreign: false,
      converted_main_total: null,
      all_flags: [],
      needs_check: false,
      primary_flag_label: null,
    };
  });
}
