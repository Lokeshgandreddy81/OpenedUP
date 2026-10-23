export interface DevSecOpsRoadmapNode {
  id: string;
  title: string;
  roadmapId?: string;
}

export interface DevSecOpsRoadmapGroup {
  id: string;
  parent?: DevSecOpsRoadmapNode;
  items: DevSecOpsRoadmapNode[];
}

export interface DevSecOpsRoadmapStage {
  id: string;
  node: DevSecOpsRoadmapNode;
  left?: DevSecOpsRoadmapGroup[];
  right?: DevSecOpsRoadmapGroup[];
}

export interface DevSecOpsRoadmapSection {
  id: string;
  title?: string;
  stages: DevSecOpsRoadmapStage[];
}

export interface DevSecOpsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DEVSECOPS_RELATED_ROADMAPS: DevSecOpsRoadmapLink[] = [
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Cybersecurity Roadmap", roadmapId: "cyber-security" },
];

export const DEVSECOPS_CONTINUE_LEARNING: DevSecOpsRoadmapLink[] = [
  { label: "Cybersecurity", roadmapId: "cyber-security" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Network Engineer", roadmapId: "network-engineer" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (title: string, roadmapId?: string): DevSecOpsRoadmapNode => ({
  id: slug(title),
  title,
  roadmapId,
});

const g = (
  items: DevSecOpsRoadmapNode[],
  parent?: DevSecOpsRoadmapNode
): DevSecOpsRoadmapGroup => ({
  id: slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DevSecOpsRoadmapStage, "id" | "node"> = {}
): DevSecOpsRoadmapStage => ({
  id: slug(title),
  node: n(title),
  ...options,
});

const FOUNDATIONS: DevSecOpsRoadmapSection = {
  id: "foundations",
  title: "Learn the Foundations",
  stages: [
    stage("Introduction", {
      right: [g([n("DevSecOps vs DevOps")])],
    }),
    stage("Learn a Programming Language", {
      left: [g([n("Python"), n("Ruby"), n("Rust"), n("Go"), n("JavaScript / Node.js")])],
    }),
    stage("Scripting Knowledge", {
      right: [g([n("Bash"), n("PowerShell")]), g([n("Vim / Nano / Emacs")], n("Editors"))],
    }),
    stage("CIA Triad"),
    stage("Authentication"),
    stage("Authorization"),
    stage("OWASP Top 10"),
    stage("Encryption", {
      left: [g([n("Symmetric"), n("Asymmetric")])],
    }),
  ],
};

const MANAGING_THREATS: DevSecOpsRoadmapSection = {
  id: "managing-threats",
  title: "Managing Threats & Risks",
  stages: [
    stage("Networking Basics", {
      right: [
        g([
          n("Firewalls"),
          n("VLANs"),
          n("ACLs"),
          n("Network Segmentation"),
          n("DNS"),
          n("HTTP"),
          n("TLS"),
        ]),
      ],
    }),
    stage("Secure Coding", {
      right: [
        g([n("SQL Injection Prevention"), n("XSS Prevention"), n("Input Validation Patterns")]),
      ],
    }),
    stage("Monitoring", {
      left: [g([n("Burp Suite"), n("Nmap basics"), n("Wireshark basics")], n("DevSecOps Tools"))],
      right: [g([n("SIEM"), n("Alert Types"), n("Log Analysis")])],
    }),
    stage("Identity Basics", {
      right: [g([n("IAM"), n("Least Privilege"), n("Role Based Access")])],
    }),
    stage("Threat Modeling", {
      right: [
        g([n("STRIDE"), n("PASTA"), n("Threat Modeling Workflows"), n("Attack Surface Mapping")]),
      ],
    }),
    stage("Cloud Security", {
      left: [g([n("CSPM"), n("IAM"), n("Key Management Service")])],
    }),
    stage("Container Security", {
      left: [g([n("Docker"), n("Kubernetes"), n("Image Scanning")])],
      right: [
        g([n("SOAR Concepts"), n("Automated Patching")], n("Automating Security")),
        g([n("Nessus"), n("Nmap"), n("OpenVAS"), n("Qualys")], n("Vulnerability Scanning Tools")),
      ],
    }),
  ],
};

const SECURE_ARCHITECTURE: DevSecOpsRoadmapSection = {
  id: "secure-architecture",
  title: "Secure Architecture",
  stages: [
    stage("Incident Response", {
      left: [
        g([
          n("Defense in Depth Concepts"),
          n("Zero Trust Concepts"),
          n("Secure API Design"),
          n("Multi Region Security Planning"),
          n("Large Scale Identity Strategy"),
          n("IDS"),
          n("IPS"),
          n("DDoS Miligation Strategy"),
          n("Secure Network Zoning"),
          n("Supply Chain Security"),
          n("SBOMS"),
          n("Build Pipeline Hardening"),
          n("Dependency Risk Management"),
        ]),
      ],
      right: [g([n("IR Lifecycle"), n("Forensics"), n("Containment"), n("Root Cause Analysis")])],
    }),
    stage("Enterprise Operations", {
      left: [
        g(
          [
            n("SHA 256"),
            n("bcrypt"),
            n("Cryptographic Hashing"),
            n("PKI Design and Failover"),
            n("Certificate Lifecycle"),
          ],
          n("Advanced Crypto.")
        ),
      ],
      right: [g([n("SOAR Automation"), n("Endpoint Detection"), n("Response Strategy")])],
    }),
  ],
};

const GOVERNANCE: DevSecOpsRoadmapSection = {
  id: "governance",
  stages: [
    stage("Governance", {
      left: [g([n("Audit & Compliance Mapping"), n("Risk Quantification")])],
      right: [g([n("SOC 2"), n("ISO 27001"), n("NIST")], n("Cybersecurity Frameworks"))],
    }),
  ],
};

export const DEVSECOPS_SECTIONS: DevSecOpsRoadmapSection[] = [
  FOUNDATIONS,
  MANAGING_THREATS,
  SECURE_ARCHITECTURE,
  GOVERNANCE,
];
