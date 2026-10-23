import {
  type BestPracticeGroup,
  type BestPracticeImpact,
  type BestPracticeLink,
  type BestPracticeMetric,
  type BestPracticeNode,
  type BestPracticeSection,
  type BestPracticeStage,
  type BestPracticeStatus,
} from "./awsBestPracticeData";

export const API_SECURITY_METRICS: BestPracticeMetric[] = [
  {
    label: "OWASP Compliance",
    value: "API Top 10",
    detail: "Zero unmitigated critical vulnerabilities",
  },
  {
    label: "Token Leak Rate",
    value: "0.0%",
    detail: "Asymmetric JWTs with automated key rotation",
  },
  {
    label: "Audit & Linting",
    value: "Continuous",
    detail: "Spectral OpenAPI linting & DAST in CI/CD",
  },
  {
    label: "Abuse Mitigation",
    value: "< 50ms",
    detail: "Edge token-bucket rate limiting & WAF inspection",
  },
];

export const API_SECURITY_MARKERS: Array<{
  status: BestPracticeStatus;
  label: string;
}> = [
  { status: "personal", label: "Must-Have Baseline (P0)" },
  { status: "alternative", label: "Alternative / Trade-off" },
  { status: "optional", label: "Advanced / Hardened" },
];

export const API_SECURITY_RELATED_ROADMAPS: BestPracticeLink[] = [
  { label: "Backend Developer Roadmap", roadmapId: "backend" },
  { label: "DevSecOps Roadmap", roadmapId: "devsecops" },
  { label: "Cyber Security Roadmap", roadmapId: "cyber-security" },
  { label: "AWS Best Practices", roadmapId: "best-practice-aws" },
  { label: "Backend Performance Best Practices", roadmapId: "best-practice-backend-performance" },
];

export const API_SECURITY_CONTINUE_LEARNING: BestPracticeLink[] = [
  { label: "Backend Performance Best Practices", roadmapId: "best-practice-backend-performance" },
  { label: "AWS Best Practices", roadmapId: "best-practice-aws" },
  { label: "DevSecOps", roadmapId: "devsecops" },
  { label: "Cyber Security", roadmapId: "cyber-security" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BestPracticeStatus,
  impact?: BestPracticeImpact,
  roadmapId?: string,
  customId?: string
): BestPracticeNode => ({
  id: customId ?? slug(title),
  title,
  status,
  impact,
  roadmapId,
});

const g = (
  items: BestPracticeNode[],
  parent?: BestPracticeNode,
  customId?: string
): BestPracticeGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BestPracticeStage, "id" | "node"> & {
    status?: BestPracticeStatus;
    impact?: BestPracticeImpact;
    customId?: string;
    roadmapId?: string;
  } = {}
): BestPracticeStage => {
  const { status, impact, customId, roadmapId, ...rest } = options;
  return {
    id: customId ?? slug(title),
    node: n(title, status, impact, roadmapId, customId),
    ...rest,
  };
};

const AUTH_AND_AUTHZ: BestPracticeSection = {
  id: "auth-and-authz",
  title: "Authentication & Authorization (OWASP API1, API2, API5)",
  stages: [
    stage("Object & Function Access Governance", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Prevent BOLA / IDOR with Tenant Ownership Checks", "personal", "critical"),
            n("Prevent BFLA with Method & Role Matrix (RBAC/ABAC)", "personal", "critical"),
            n("Use Unpredictable UUIDv4 or NanoIDs for Resources", "personal", "high"),
          ],
          n("Access Controls")
        ),
      ],
      right: [
        g(
          [
            n("Adopt OAuth 2.0 & OpenID Connect (OIDC)", "personal", "critical"),
            n("Store Secrets in HSM / Cloud Secrets Manager", "personal", "critical"),
            n("Implement Step-Up Auth for Sensitive Actions", "personal", "high"),
          ],
          n("Identity Federation")
        ),
      ],
      noteAfter:
        "Never trust client-supplied entity IDs without validating that the authenticated principal has direct ownership and explicit permission.",
      projectIdea:
        "Write automated integration tests asserting that User B receives a 403/404 when querying User A's private resource endpoints.",
    }),
    stage("JWT Hygiene & Token Lifecycle", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Enforce Asymmetric Signing (RS256 / EdDSA)", "personal", "critical"),
            n("Explicitly Reject 'none' Algorithm & Weak Keys", "personal", "critical"),
            n("Validate 'iss', 'aud', and 'exp' Claims Rigorously", "personal", "critical"),
          ],
          n("Token Verification")
        ),
      ],
      right: [
        g(
          [
            n("Short Token Expiry TTLs (5–15 minutes)", "personal", "high"),
            n("Refresh Token Rotation with Revocation Blacklist", "personal", "high"),
            n("Automate JWKS Key Rotation without Downtime", "personal", "recommended"),
          ],
          n("Lifecycle & Revocation")
        ),
      ],
      noteAfter:
        "Keep access tokens stateless and short-lived. Store refresh tokens securely in HttpOnly, SameSite cookies or backend stores.",
    }),
  ],
};

const DATA_VALIDATION: BestPracticeSection = {
  id: "data-validation",
  title: "Data Validation & Sanitization (OWASP API3, API6, API7)",
  stages: [
    stage("Schema Enforcement & Mass Assignment Defense", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Strict DTO Whitelisting (Reject Unknown Keys)", "personal", "critical"),
            n("Prevent Mass Assignment into Sensitive DB Columns", "personal", "critical"),
            n("Enforce Strict Schema Contracts (Zod / JSON Schema)", "personal", "high"),
          ],
          n("Input Filtering")
        ),
      ],
      right: [
        g(
          [
            n("Sanitize Response Payloads (Prevent Data Leakage)", "personal", "critical"),
            n("Block Sensitive Metadata & Stack Traces in Errors", "personal", "critical"),
            n("Validate Content-Type and Reject Ambiguous Formats", "personal", "high"),
          ],
          n("Output Defense")
        ),
      ],
      noteAfter: "Never bind raw HTTP request bodies directly to ORM models or database entities.",
      projectIdea:
        "Configure Zod or class-validator with forbidNonWhitelisted: true across all API controller boundary models.",
    }),
    stage("Injection Flaws & Server-Side Vulnerabilities", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Parameterized Queries for SQL & ORM Binds", "personal", "critical"),
            n("NoSQL Injection Defense (Sanitize Operator Objects)", "personal", "critical"),
            n("Safe Command Execution (Avoid shell=True / exec)", "personal", "critical"),
          ],
          n("Injection Prevention")
        ),
      ],
      right: [
        g(
          [
            n("SSRF Defense: Restrict Outbound URLs & Loopback IPs", "personal", "critical"),
            n("XML External Entity (XXE) Prevention (Disable DTDs)", "personal", "high"),
            n("Protect Regex against ReDoS (Safe regex engines)", "personal", "high"),
          ],
          n("Network & Parser Defense")
        ),
      ],
      noteAfter:
        "Prevent Server-Side Request Forgery (SSRF) by validating user-provided webhooks against internal IP ranges (127.0.0.1, 169.254.169.254, 10.0.0.0/8).",
    }),
  ],
};

const RATE_LIMITING: BestPracticeSection = {
  id: "rate-limiting",
  title: "Rate Limiting & Resource Protection (OWASP API4)",
  stages: [
    stage("Traffic Throttling & Resource Boundaries", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Implement Token Bucket / Leaky Bucket Algorithms", "personal", "high"),
            n("Multi-Tier Limiting: By IP, User ID & API Key", "personal", "critical"),
            n("Return Standard 429 Too Many Requests + Retry-After", "personal", "high"),
          ],
          n("Throttling Policies")
        ),
      ],
      right: [
        g(
          [
            n("Enforce Max Request Payload Limits (e.g. 1MB)", "personal", "high"),
            n("GraphQL Query Depth & Cost Complexity Limiting", "personal", "high"),
            n("Strict Request Timeout & Connection Dropping Policies", "personal", "recommended"),
          ],
          n("Resource Caps")
        ),
      ],
      noteAfter:
        "Protect expensive computational and database queries with strict pagination limits (max page size) and cost-based rate limits.",
      projectIdea:
        "Set up Redis-backed rate limiting per tenant API key with automated alerts when quotas exceed 90%.",
    }),
  ],
};

const TRANSPORT_SECURITY: BestPracticeSection = {
  id: "transport-security",
  title: "Transport & Network Security (OWASP API8, API9)",
  stages: [
    stage("Network Encryption & Gateway Architecture", {
      status: "personal",
      impact: "critical",
      left: [
        g(
          [
            n("Enforce TLS 1.3 & Disable Deprecated Ciphers", "personal", "critical"),
            n("HTTP Strict Transport Security (HSTS) with Preload", "personal", "critical"),
            n(
              "Strict CORS Configuration (Never use Access-Control-Allow-Origin: *)",
              "personal",
              "critical"
            ),
          ],
          n("Edge Encryption")
        ),
      ],
      right: [
        g(
          [
            n("Deploy Managed API Gateway / Reverse Proxy", "personal", "critical"),
            n("Mutual TLS (mTLS) for Service-to-Service Zero Trust", "personal", "high"),
            n("Web Application Firewall (WAF) Rule Enforcement", "personal", "high"),
          ],
          n("Perimeter Defense")
        ),
      ],
      noteAfter:
        "CORS is a browser security mechanism, not a backend security boundary. Always authenticate API endpoints regardless of CORS policies.",
    }),
  ],
};

const LOGGING_AND_AUDIT: BestPracticeSection = {
  id: "logging-and-audit",
  title: "Logging, Monitoring & Automated CI/CD Audit (OWASP API10)",
  stages: [
    stage("Audit Hygiene & Continuous Security Testing", {
      status: "personal",
      impact: "high",
      left: [
        g(
          [
            n("Redact PII, Passwords, Tokens & Cardholder Data in Logs", "personal", "critical"),
            n("Centralized SIEM Log Ingestion with Immutable Audit Trail", "personal", "audit"),
            n("Real-Time Security Alerting for Unusual Failure Spikes", "personal", "high"),
          ],
          n("Security Telemetry")
        ),
      ],
      right: [
        g(
          [
            n("Automate OpenAPI Specification Linting with Spectral", "personal", "high"),
            n("SAST / DAST Vulnerability Scanners in CI/CD Pipeline", "personal", "audit"),
            n("Retire Zombie & Shadow APIs with Continuous Cataloging", "personal", "high"),
          ],
          n("Continuous Compliance")
        ),
      ],
      noteAfter:
        "Ensure application logs contain structured correlation IDs without leaking secret credentials or user personal data.",
      projectIdea:
        "Add a pre-commit / CI hook that runs Spectral OpenAPI linting and GitLeaks to catch unencrypted secrets before merge.",
    }),
  ],
};

export const API_SECURITY_SECTIONS: BestPracticeSection[] = [
  AUTH_AND_AUTHZ,
  DATA_VALIDATION,
  RATE_LIMITING,
  TRANSPORT_SECURITY,
  LOGGING_AND_AUDIT,
];

export const API_SECURITY_STAGES: BestPracticeStage[] = API_SECURITY_SECTIONS.flatMap(
  (sec) => sec.stages
);
