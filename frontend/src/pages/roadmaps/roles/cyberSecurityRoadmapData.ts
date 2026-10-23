export type CyberSecurityRoadmapStatus = "personal" | "alternative" | "optional";

export interface CyberSecurityRoadmapNode {
  id: string;
  title: string;
  status?: CyberSecurityRoadmapStatus;
  roadmapId?: string;
}

export interface CyberSecurityRoadmapGroup {
  id: string;
  parent?: CyberSecurityRoadmapNode;
  items: CyberSecurityRoadmapNode[];
}

export interface CyberSecurityRoadmapStage {
  id: string;
  node: CyberSecurityRoadmapNode;
  left?: CyberSecurityRoadmapGroup[];
  right?: CyberSecurityRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface CyberSecurityRoadmapSection {
  id: string;
  title?: string;
  stages: CyberSecurityRoadmapStage[];
}

export interface CyberSecurityRoadmapLink {
  label: string;
  roadmapId: string;
}

export const CYBER_SECURITY_MARKERS: Array<{
  status: CyberSecurityRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const CYBER_SECURITY_RELATED_ROADMAPS: CyberSecurityRoadmapLink[] = [
  { label: "DevSecOps Roadmap", roadmapId: "devsecops" },
  { label: "Network Engineer Roadmap", roadmapId: "network-engineer" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
];

export const CYBER_SECURITY_CONTINUE_LEARNING: CyberSecurityRoadmapLink[] = [
  { label: "DevSecOps", roadmapId: "devsecops" },
  { label: "Network Engineer", roadmapId: "network-engineer" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Backend", roadmapId: "backend" },
  { label: "DevOps", roadmapId: "devops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: CyberSecurityRoadmapStatus,
  roadmapId?: string,
  customId?: string
): CyberSecurityRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: CyberSecurityRoadmapNode[],
  parent?: CyberSecurityRoadmapNode,
  customId?: string
): CyberSecurityRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<CyberSecurityRoadmapStage, "id" | "node"> & {
    status?: CyberSecurityRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): CyberSecurityRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const BASIC_IT_AND_SYSTEMS: CyberSecurityRoadmapSection = {
  id: "basic-it-and-systems",
  title: "Prerequisites & Fundamentals",
  stages: [
    stage("Basic IT & Hardware", {
      right: [
        g([
          n("CPU, RAM & Storage Architecture"),
          n("BIOS & UEFI Firmware"),
          n("Motherboard & Bus Interfaces"),
          n("Network Interface Cards (NIC)"),
          n("Filesystems (ext4, NTFS, APFS)"),
        ]),
      ],
    }),
    stage("Operating Systems", {
      left: [
        g(
          [
            n("Command Line & Bash Scripting", "personal"),
            n("File Permissions & Ownership (chmod/chown)"),
            n("Process Management & systemd"),
            n("Syslog & System Auditing (auditd)"),
            n("Kernel Basics & Modules"),
          ],
          n("Linux", "personal", "skill-linux")
        ),
      ],
      right: [
        g(
          [
            n("Active Directory & Domain Services"),
            n("Windows Registry & Group Policy (GPO)"),
            n("PowerShell Scripting", "personal"),
            n("Windows Event Logs & Sysmon"),
            n("User Account Control (UAC) & Privileges"),
          ],
          n("Windows", "personal")
        ),
        g([n("macOS Security & SIP", "alternative")]),
      ],
    }),
    stage("Computer Networking", {
      roadmapId: "network-engineer",
      left: [
        g([
          n("OSI 7-Layer Model vs TCP/IP Model", "personal"),
          n("Subnetting, CIDR & IP Routing"),
          n("IPv4 vs IPv6 Addressing"),
          n("DNS, DHCP & ARP Protocols"),
          n("TCP Handshake & UDP Characteristics"),
        ]),
      ],
      right: [
        g([
          n("HTTP / HTTPS & TLS/SSL Handshake", "personal"),
          n("SSH, Telnet, FTP & SFTP"),
          n("SMTP, IMAP & POP3"),
          n("NAT, Routing Tables & Default Gateways"),
          n("Packet Capture & Wireshark Basics", "personal"),
        ]),
      ],
      noteAfter:
        "A deep understanding of networking and operating systems is essential in cybersecurity — you cannot protect or exploit what you do not understand.",
      projectIdea:
        "Project: Build a virtualized lab with Ubuntu & Windows Server on an isolated host-only subnet, configuring static routing and DHCP.",
    }),
  ],
};

const SECURITY_FOUNDATIONS: CyberSecurityRoadmapSection = {
  id: "security-foundations",
  title: "Security Core Principles & Cryptography",
  stages: [
    stage("Core Security Principles", {
      left: [
        g([
          n("CIA Triad (Confidentiality, Integrity, Availability)", "personal"),
          n("AAA (Authentication, Authorization, Accounting)"),
          n("Non-Repudiation & Trust Boundaries"),
          n("Defense-in-Depth Strategy", "personal"),
          n("Principle of Least Privilege (PoLP)", "personal"),
        ]),
      ],
      right: [
        g([
          n("Zero Trust Architecture (Never Trust, Always Verify)", "personal"),
          n("Attack Surface Minimization"),
          n("Threat Vectors & Vulnerability Windows"),
          n("Security by Design & Default"),
          n("Social Engineering & Human Factors"),
        ]),
      ],
    }),
    stage("Cryptography & PKI", {
      left: [
        g(
          [
            n("AES (Advanced Encryption Standard)", "personal"),
            n("ChaCha20 & Poly1305"),
            n("DES / 3DES (Legacy & Weaknesses)"),
            n("Block Ciphers vs Stream Ciphers"),
            n("Cipher Modes (CBC, GCM, CTR)", "personal"),
          ],
          n("Symmetric Encryption", "personal")
        ),
        g(
          [
            n("SHA-256, SHA-384, SHA-512", "personal"),
            n("MD5 & SHA-1 (Collision Vulnerabilities)"),
            n("HMAC & Password Hashing (bcrypt, Argon2)", "personal"),
          ],
          n("Hash Functions", "personal")
        ),
      ],
      right: [
        g(
          [
            n("RSA (Rivest-Shamir-Adleman)"),
            n("ECC (Elliptic Curve Cryptography)", "personal"),
            n("Diffie-Hellman Key Exchange (ECDH)", "personal"),
            n("Digital Signatures & Verification"),
          ],
          n("Asymmetric Encryption", "personal")
        ),
        g(
          [
            n("X.509 Certificates & Certificate Authorities (CA)", "personal"),
            n("Public Key Infrastructure (PKI)"),
            n("Certificate Revocation (CRL, OCSP)"),
            n("Hardware Security Modules (HSM) & KMS"),
          ],
          n("PKI & Key Management")
        ),
      ],
      noteAfter:
        "Understand mathematical foundations of encryption, how TLS secures web traffic, and why modern password hashing requires salts and memory-hard functions.",
    }),
  ],
};

const DEFENSIVE_SECURITY: CyberSecurityRoadmapSection = {
  id: "defensive-security",
  title: "Defensive Security (Blue Team) & SOC",
  stages: [
    stage("Security Operations & SIEM", {
      left: [
        g([
          n("Security Operations Center (SOC) Workflows", "personal"),
          n("Alert Triage & Priority Scoring"),
          n("False Positive vs False Negative Tuning"),
          n("Log Parsing, Normalization & Syslog"),
          n("Incident Escalation Matrices"),
        ]),
      ],
      right: [
        g([
          n("Splunk Enterprise Security", "personal"),
          n("Elastic SIEM & ELK Stack", "alternative"),
          n("Microsoft Sentinel (Cloud-Native)", "alternative"),
          n("Wazuh (Open-Source EDR/XDR)", "optional"),
          n("Log Retention Policies & Compliance"),
        ]),
      ],
    }),
    stage("Network & Endpoint Defense", {
      left: [
        g(
          [
            n("Snort & Suricata (Signature-based)", "personal"),
            n("Zeek (Network Security Monitoring)", "personal"),
            n("Next-Gen Firewalls (Palo Alto, Fortinet)"),
            n("Web Application Firewalls (WAF)"),
            n("Network Segmentation & Microsegmentation"),
          ],
          n("Intrusion Detection (IDS/IPS)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("CrowdStrike Falcon & Microsoft Defender for Endpoint", "personal"),
            n("Sysinternals Suite (Process Explorer, Autoruns)", "personal"),
            n("Host-Based Intrusion Detection (OSSEC, Wazuh)"),
            n("Endpoint Baseline & Hardening CIS Benchmarks", "personal"),
            n("Honeypots & Deception Technologies"),
          ],
          n("Endpoint Detection & Response (EDR)")
        ),
      ],
    }),
    stage("Threat Intelligence & Hunting", {
      left: [
        g([
          n("MITRE ATT&CK Framework Mapping", "personal"),
          n("Cyber Kill Chain Methodology (Lockheed Martin)"),
          n("Indicators of Compromise (IoCs) & Pyramids of Pain", "personal"),
          n("OpenCTI & MISP Threat Sharing"),
          n("AlienVault OTX & AbuseIPDB"),
        ]),
      ],
      right: [
        g([
          n("Proactive Threat Hunting Hypotheses", "personal"),
          n("Writing YARA Rules for Malware Detection", "personal"),
          n("Writing Sigma Rules for Generic SIEM Queries", "personal"),
          n("Anomaly Detection & Behavioral Baselines"),
          n("DNS & Domain Reputational Analysis"),
        ]),
      ],
    }),
    stage("Incident Response & Digital Forensics", {
      left: [
        g(
          [
            n("NIST SP 800-61 Incident Handling Guide", "personal"),
            n("Preparation & Identification Phase"),
            n("Containment (Short-term vs Long-term)"),
            n("Eradication & Remediation"),
            n("Recovery & Post-Incident Lessons Learned"),
          ],
          n("IR Lifecycle", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Memory Dump Analysis with Volatility 3", "personal"),
            n("Disk Imaging & Autopsy / FTK Imager", "personal"),
            n("PCAP Network Forensics with Wireshark", "personal"),
            n("Timeline Creation & Prefetch/Shimcache Analysis"),
            n("Chain of Custody & Legal Evidence Handling"),
          ],
          n("Digital Forensics (DFIR)", "personal")
        ),
      ],
      noteAfter:
        "In incident response, speed and methodical preservation of evidence are paramount. Practice live analysis on simulated infected workstations.",
      projectIdea:
        "Project: Analyze a memory dump using Volatility to locate injected code, malicious processes, and establish an incident timeline.",
    }),
  ],
};

const OFFENSIVE_SECURITY: CyberSecurityRoadmapSection = {
  id: "offensive-security",
  title: "Offensive Security (Red Team) & Ethical Hacking",
  stages: [
    stage("Reconnaissance & Footprinting", {
      left: [
        g([
          n("OSINT (Open Source Intelligence)", "personal"),
          n("Google Dorking & Search Operators"),
          n("Shodan, Censys & SecurityTrails", "personal"),
          n("WHOIS, ASN & BGP Routing Lookups"),
          n("Subdomain Enumeration (Amass, Sublist3r)"),
        ]),
      ],
      right: [
        g([
          n("DNS Zone Transfers & Reverse Lookups"),
          n("Social Media & Employee OSINT"),
          n("Certificate Transparency Logs (crt.sh)"),
          n("Technology Stack Fingerprinting (Wappalyzer, WhatWeb)"),
          n("Active vs Passive Reconnaissance Strategies"),
        ]),
      ],
    }),
    stage("Scanning & Vulnerability Assessment", {
      left: [
        g(
          [
            n("Nmap Port Scanning & Host Discovery", "personal"),
            n("Nmap Scripting Engine (NSE)", "personal"),
            n("Masscan (High-speed Internet Scanning)"),
            n("Banner Grabbing & Service Version Detection"),
            n("SNMP, SMB & NetBIOS Enumeration"),
          ],
          n("Network Scanning", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Nessus Professional", "personal"),
            n("OpenVAS / Greenbone Community Edition", "alternative"),
            n("Common Vulnerabilities and Exposures (CVE)"),
            n("Common Vulnerability Scoring System (CVSS v3.1/v4.0)", "personal"),
            n("Prioritizing Vulnerability Remediation"),
          ],
          n("Vulnerability Scanners")
        ),
      ],
    }),
    stage("Penetration Testing & Exploitation", {
      left: [
        g([
          n("Metasploit Framework (msfconsole, payloads)", "personal"),
          n("Exploit Database (Exploit-DB) & Searchsploit"),
          n("Linux Privilege Escalation (LinPEAS, SUID, sudo)", "personal"),
          n("Windows Privilege Escalation (WinPEAS, Potato exploits)", "personal"),
          n("Password Cracking (Hashcat, John the Ripper)", "personal"),
        ]),
      ],
      right: [
        g([
          n("Credential Dumping (Mimikatz, Secretsdump)", "personal"),
          n("Lateral Movement (Pass-the-Hash, PsExec, WMI)"),
          n("Pivoting & Port Forwarding (Chisel, SSH tunnels)", "personal"),
          n("Persistence Mechanisms (Scheduled tasks, cron, backdoors)"),
          n("Writing Professional Penetration Testing Reports", "personal"),
        ]),
      ],
    }),
    stage("Web Application Security", {
      left: [
        g(
          [
            n("SQL Injection (SQLi) & NoSQL Injection", "personal"),
            n("Cross-Site Scripting (Reflected, Stored, DOM XSS)", "personal"),
            n("Cross-Site Request Forgery (CSRF)"),
            n("Server-Side Request Forgery (SSRF)", "personal"),
            n("Broken Object Level Authorization (BOLA/IDOR)", "personal"),
          ],
          n("OWASP Top 10", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Burp Suite Community / Professional", "personal"),
            n("OWASP ZAP (Zed Attack Proxy)", "alternative"),
            n("Postman & cURL for API Pentesting"),
            n("Directory Fuzzing (ffuf, Gobuster, dirsearch)", "personal"),
            n("SQLmap Automated SQL Injection Tool"),
          ],
          n("Web Pentesting Tools", "personal")
        ),
      ],
      noteAfter:
        "Web applications remain the number one initial attack vector. Practice ethical hacking strictly in authorized sandboxes and labs.",
      projectIdea:
        "Project: Complete all SQL Injection and XSS labs in the PortSwigger Web Security Academy with detailed documentation.",
    }),
  ],
};

const IAM_AND_INFRASTRUCTURE: CyberSecurityRoadmapSection = {
  id: "iam-and-infrastructure",
  title: "Identity, Access & Infrastructure Security",
  stages: [
    stage("Identity & Access Management", {
      left: [
        g([
          n("Multi-Factor Authentication (MFA / FIDO2 / WebAuthn)", "personal"),
          n("Single Sign-On (SSO) & SAML 2.0"),
          n("OAuth 2.0 & OpenID Connect (OIDC) Flows", "personal"),
          n("Active Directory & Entra ID (Azure AD)", "personal"),
          n("Kerberos Authentication & Ticket Granting"),
        ]),
      ],
      right: [
        g([
          n("Role-Based Access Control (RBAC)", "personal"),
          n("Attribute-Based Access Control (ABAC)"),
          n("Privileged Access Management (PAM - CyberArk, BeyondTrust)"),
          n("Just-in-Time (JIT) Privileged Access"),
          n("Credential Stuffing Defense & Password Managers"),
        ]),
      ],
    }),
    stage("Cloud Security", {
      left: [
        g([
          n("Shared Responsibility Model (IaaS, PaaS, SaaS)", "personal"),
          n("AWS IAM, Roles & Policy Evaluation Logic", "personal", "skill-aws"),
          n("Cloud Security Posture Management (CSPM)", "personal"),
          n("Cloud Workload Protection Platforms (CWPP)"),
          n("AWS Security Hub, GuardDuty & CloudTrail"),
        ]),
      ],
      right: [
        g([
          n("Azure Security Center & Microsoft Defender for Cloud"),
          n("GCP Security Command Center"),
          n("S3 Bucket & Cloud Storage Hardening", "personal"),
          n("Serverless Security (Lambda & Cloud Functions)"),
          n("Multi-Cloud Identity Federation"),
        ]),
      ],
    }),
    stage("Container & Kubernetes Security", {
      roadmapId: "skill-kubernetes",
      left: [
        g(
          [
            n("Rootless Containers & User Namespaces"),
            n("Container Image Scanning (Trivy, Grype)", "personal"),
            n("Base Image Hardening (Distroless, Alpine)", "personal"),
            n("Dockerfile Security Best Practices"),
          ],
          n("Container Security", "personal", "skill-docker")
        ),
      ],
      right: [
        g(
          [
            n("Kubernetes RBAC & Service Accounts", "personal"),
            n("Pod Security Standards (Privileged, Baseline, Restricted)", "personal"),
            n("Kubernetes Network Policies"),
            n("Runtime Security with Falco", "personal"),
            n("Secrets Management (HashiCorp Vault, Sealed Secrets)", "personal"),
          ],
          n("Kubernetes Hardening")
        ),
      ],
      noteAfter:
        "Modern cloud-native environments rely heavily on microservices. Misconfigured Kubernetes clusters and leaked IAM tokens are critical attack vectors.",
      projectIdea:
        "Project: Scan a production Docker image with Trivy, remediate all critical CVEs, and configure strict Kubernetes Pod Security Standards.",
    }),
  ],
};

const APP_SEC_AND_DEVSECOPS: CyberSecurityRoadmapSection = {
  id: "appsec-and-devsecops",
  title: "Application Security & DevSecOps",
  stages: [
    stage("Application Security (AppSec)", {
      roadmapId: "devsecops",
      left: [
        g([
          n("Secure Software Development Lifecycle (SSDLC)", "personal"),
          n("Threat Modeling (STRIDE, PASTA, DREAD)", "personal"),
          n("OWASP ASVS (Application Security Verification Standard)"),
          n("Cryptographic API Implementation Best Practices"),
          n("Input Validation & Parameterized Queries", "personal"),
        ]),
      ],
      right: [
        g([
          n("Static Application Security Testing (SAST - SonarQube, Semgrep)", "personal"),
          n("Dynamic Application Security Testing (DAST - ZAP, Burp)"),
          n("Software Composition Analysis (SCA - Snyk, Dependabot)", "personal"),
          n("Software Bill of Materials (SBOM - CycloneDX, SPDX)", "personal"),
          n("Interactive Application Security Testing (IAST)"),
        ]),
      ],
    }),
    stage("CI/CD Pipeline Security", {
      left: [
        g([
          n("Pre-commit Hooks & Secret Scanning (TruffleHog, Gitleaks)", "personal"),
          n("Branch Protection Rules & Signed Commits"),
          n("Automated Security Gates in CI Pipelines", "personal"),
          n("Dependency Pinning & Lockfile Integrity"),
        ]),
      ],
      right: [
        g([
          n("Infrastructure as Code (IaC) Scanning (Checkov, tfsec)", "personal"),
          n("Supply Chain Security & SLSA Framework", "personal"),
          n("Artifact Signing with Sigstore / Cosign"),
          n("Hardening GitHub Actions & Runner Security"),
        ]),
      ],
      projectIdea:
        "Project: Configure a GitHub Actions workflow with automated secret scanning, Semgrep SAST, and Trivy container scanning blocking vulnerable PRs.",
    }),
  ],
};

const GOVERNANCE_RISK_COMPLIANCE: CyberSecurityRoadmapSection = {
  id: "governance-risk-compliance",
  title: "Governance, Risk & Compliance (GRC)",
  stages: [
    stage("Security Frameworks & Standards", {
      left: [
        g([
          n(
            "NIST Cybersecurity Framework 2.0 (Govern, Identify, Protect, Detect, Respond, Recover)",
            "personal"
          ),
          n("NIST SP 800-53 Security Controls"),
          n("ISO/IEC 27001 & 27002 Certification Standards", "personal"),
          n("CIS Critical Security Controls (v8)", "personal"),
        ]),
      ],
      right: [
        g([
          n("Risk Assessment Methodologies (NIST SP 800-30)", "personal"),
          n("Risk Registers, Treatment & Residual Risk"),
          n("Third-Party Vendor Risk Management (TPRM)"),
          n("Business Continuity & Disaster Recovery Planning (BCDR)"),
        ]),
      ],
    }),
    stage("Compliance & Regulations", {
      left: [
        g([
          n("SOC 2 Type I and Type II Audits", "personal"),
          n("PCI-DSS (Payment Card Industry Data Security)", "personal"),
          n("HIPAA Security & Privacy Rules (Healthcare)"),
          n("FedRAMP Cloud Authorization"),
        ]),
      ],
      right: [
        g([
          n("GDPR (General Data Protection Regulation)", "personal"),
          n("CCPA / CPRA (California Privacy Act)"),
          n("Data Classification & Retention Policies"),
          n("Security Awareness Training & Phishing Simulations"),
        ]),
      ],
    }),
  ],
};

const PRACTICE_AND_CERTIFICATIONS: CyberSecurityRoadmapSection = {
  id: "practice-and-certifications",
  title: "Hands-on Practice & Certifications",
  stages: [
    stage("Practice Platforms & CTF", {
      left: [
        g([
          n("TryHackMe (Guided Learning Paths)", "personal"),
          n("Hack The Box (HTB Labs & Pro Labs)", "personal"),
          n("OverTheWire (Bandit & Natas Wargames)", "personal"),
          n("PortSwigger Web Security Academy", "personal"),
        ]),
      ],
      right: [
        g([
          n("Blue Team Labs Online (BTLO - Defensive)", "personal"),
          n("CyberDefenders (DFIR Challenges)", "alternative"),
          n("VulnHub (Offline Vulnerable VMs)", "optional"),
          n("Bug Bounty Programs (HackerOne, Bugcrowd)", "optional"),
        ]),
      ],
    }),
    stage("Industry Certifications", {
      left: [
        g(
          [
            n("CompTIA Security+ (Foundational)", "personal"),
            n("CompTIA Network+"),
            n("CompTIA CySA+ (Cybersecurity Analyst)", "personal"),
            n("BTL1 (Blue Team Level 1)", "alternative"),
          ],
          n("Entry & Intermediate")
        ),
      ],
      right: [
        g(
          [
            n("OSCP (Offensive Security Certified Professional)", "personal"),
            n("eJPT (Junior Penetration Tester)", "alternative"),
            n("CISSP (Certified Information Systems Security Professional)", "personal"),
            n("CISM / CRISC (Management & Risk)", "optional"),
          ],
          n("Advanced & Professional")
        ),
      ],
      noteAfter:
        "Certifications validate knowledge, but persistent hands-on lab practice, problem-solving curiosity, and deep curiosity are what make great cybersecurity professionals.",
    }),
  ],
};

export const CYBER_SECURITY_SECTIONS: CyberSecurityRoadmapSection[] = [
  BASIC_IT_AND_SYSTEMS,
  SECURITY_FOUNDATIONS,
  DEFENSIVE_SECURITY,
  OFFENSIVE_SECURITY,
  IAM_AND_INFRASTRUCTURE,
  APP_SEC_AND_DEVSECOPS,
  GOVERNANCE_RISK_COMPLIANCE,
  PRACTICE_AND_CERTIFICATIONS,
];
