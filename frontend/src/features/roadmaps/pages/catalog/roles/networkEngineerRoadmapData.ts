export type NetworkEngineerRoadmapStatus = "personal" | "alternative" | "optional";

export interface NetworkEngineerRoadmapNode {
  id: string;
  title: string;
  status?: NetworkEngineerRoadmapStatus;
  roadmapId?: string;
}

export interface NetworkEngineerRoadmapGroup {
  id: string;
  parent?: NetworkEngineerRoadmapNode;
  items: NetworkEngineerRoadmapNode[];
}

export interface NetworkEngineerRoadmapStage {
  id: string;
  node: NetworkEngineerRoadmapNode;
  left?: NetworkEngineerRoadmapGroup[];
  right?: NetworkEngineerRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface NetworkEngineerRoadmapSection {
  id: string;
  title?: string;
  stages: NetworkEngineerRoadmapStage[];
}

export interface NetworkEngineerRoadmapLink {
  label: string;
  roadmapId: string;
}

export const NETWORK_ENGINEER_MARKERS: Array<{
  status: NetworkEngineerRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const NETWORK_ENGINEER_RELATED_ROADMAPS: NetworkEngineerRoadmapLink[] = [
  { label: "Cyber Security Roadmap", roadmapId: "cyber-security" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "AWS Roadmap", roadmapId: "skill-aws" },
  { label: "Cloudflare Roadmap", roadmapId: "skill-cloudflare" },
];

export const NETWORK_ENGINEER_CONTINUE_LEARNING: NetworkEngineerRoadmapLink[] = [
  { label: "Cyber Security", roadmapId: "cyber-security" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "DevSecOps", roadmapId: "devsecops" },
  { label: "Linux", roadmapId: "skill-linux" },
  { label: "AWS", roadmapId: "skill-aws" },
  { label: "Docker", roadmapId: "skill-docker" },
  { label: "Kubernetes", roadmapId: "skill-kubernetes" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: NetworkEngineerRoadmapStatus,
  roadmapId?: string,
  customId?: string
): NetworkEngineerRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: NetworkEngineerRoadmapNode[],
  parent?: NetworkEngineerRoadmapNode,
  customId?: string
): NetworkEngineerRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<NetworkEngineerRoadmapStage, "id" | "node"> & {
    status?: NetworkEngineerRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): NetworkEngineerRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// --- SECTION 1: NETWORKING FUNDAMENTALS & PROTOCOLS ---
const NETWORKING_FUNDAMENTALS: NetworkEngineerRoadmapSection = {
  id: "networking-fundamentals",
  title: "Networking Fundamentals & Protocols",
  stages: [
    stage("OSI & TCP/IP Reference Models", {
      left: [
        g(
          [
            n("Layer 7 - Application (HTTP, DNS, SSH)", "personal"),
            n("Layer 6 - Presentation (TLS/SSL, Formatting)", "personal"),
            n("Layer 5 - Session (RPC, NetBIOS)", "personal"),
            n("Layer 4 - Transport (TCP, UDP)", "personal"),
            n("Layer 3 - Network (IP, ICMP, Routing)", "personal"),
            n("Layer 2 - Data Link (Ethernet, MAC, Frames)", "personal"),
            n("Layer 1 - Physical (Bits, Cables, RF)", "personal"),
          ],
          n("7-Layer OSI Model", "personal")
        ),
      ],
      right: [
        g(
          [
            n("TCP/IP 4-Layer Architecture", "personal"),
            n("Data Encapsulation & PDU Formats", "personal"),
            n("Headers & Payload Breakdown", "personal"),
            n("MTU (Maximum Transmission Unit) & MSS", "personal"),
          ],
          n("TCP/IP & Encapsulation", "personal")
        ),
      ],
      noteAfter:
        "The OSI and TCP/IP models provide the mental map for diagnosing any network issue. Every packet moving across a network undergoes encapsulation and decapsulation at each hop.",
    }),
    stage("Transport & Core Application Protocols", {
      left: [
        g(
          [
            n("TCP Three-Way Handshake (SYN, SYN-ACK, ACK)", "personal"),
            n("TCP Flow Control & Sliding Window", "personal"),
            n("Congestion Control (CUBIC, BBR)", "optional"),
            n("UDP Datagrams & Low Latency Use Cases", "personal"),
            n("QUIC / HTTP/3 over UDP", "optional"),
          ],
          n("Transport Layer (L4)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("DNS (A, AAAA, CNAME, MX, Recursive Resolvers)", "personal"),
            n("DHCP (DORA Process, Option 43/60, Relays)", "personal"),
            n("NTP (Time Synchronization & Stratum)", "personal"),
            n("ICMP (Echo, Destination Unreachable, TTL Expired)", "personal"),
            n("ARP & Gratuitous ARP", "personal"),
          ],
          n("Core Network Services", "personal")
        ),
        g(
          [
            n("SSH & Telnet Remote Access", "personal"),
            n("TLS 1.3 Encryption & Handshakes", "personal"),
            n("SNMP (v2c vs v3 Authentication)", "personal"),
          ],
          n("Management Protocols", "personal")
        ),
      ],
    }),
  ],
};

// --- SECTION 2: IP ADDRESSING & SUBNETTING ---
const IP_ADDRESSING: NetworkEngineerRoadmapSection = {
  id: "ip-addressing",
  title: "IP Addressing & Subnetting",
  stages: [
    stage("IPv4 Architecture & Subnetting", {
      left: [
        g(
          [
            n("32-Bit Dotted Decimal Structure", "personal"),
            n("Classes A, B, C, D (Multicast), E", "personal"),
            n("RFC 1918 Private Ranges (10.x, 172.16.x, 192.168.x)", "personal"),
            n("Loopback (127.0.0.1) & APIPA (169.254.x.x)", "personal"),
          ],
          n("IPv4 Foundations", "personal")
        ),
      ],
      right: [
        g(
          [
            n("CIDR Notation (/8 to /32)", "personal"),
            n("Binary to Decimal Subnet Masks", "personal"),
            n("Variable Length Subnet Masking (VLSM)", "personal"),
            n("Network, Broadcast & Usable Host Calculation", "personal"),
            n("Supernetting & Route Summarization", "optional"),
          ],
          n("Subnet Math & VLSM", "personal")
        ),
        g(
          [
            n("Static NAT & Dynamic NAT", "personal"),
            n("PAT (Port Address Translation / NAT Overload)", "personal"),
            n("Carrier-Grade NAT (CGNAT)", "optional"),
          ],
          n("NAT & PAT", "personal")
        ),
      ],
      noteAfter:
        "Subnetting is the foundation of network engineering. You must be able to calculate usable hosts, broadcast addresses, and wildcard masks in your head or on scratch paper rapidly.",
      projectIdea:
        "Project Idea: Plan an enterprise corporate IPv4 addressing schema using VLSM to allocate subnets for HQ, 4 branch offices, DMZ, and guest Wi-Fi with minimum wasted space.",
    }),
    stage("IPv6 Architecture & Transition", {
      left: [
        g(
          [
            n("128-Bit Hexadecimal Format", "personal"),
            n("Global Unicast Addresses (2000::/3)", "personal"),
            n("Link-Local Addresses (fe80::/10)", "personal"),
            n("Unique Local (fc00::/7) & Multicast (ff00::/8)", "personal"),
            n("Subnetting IPv6 (/64 standard prefix)", "personal"),
          ],
          n("IPv6 Addressing", "personal")
        ),
      ],
      right: [
        g(
          [
            n("SLAAC (Stateless Address Autoconfiguration)", "personal"),
            n("Neighbor Discovery Protocol (NDP / RS & RA)", "personal"),
            n("Stateful vs Stateless DHCPv6", "personal"),
            n("Dual-Stack Implementation", "personal"),
            n("IPv6 Tunneling (6to4, Teredo, GRE)", "optional"),
          ],
          n("Configuration & Migration", "personal")
        ),
      ],
    }),
  ],
};

// --- SECTION 3: SWITCHING & LAYER 2 TECHNOLOGIES ---
const SWITCHING_LAYER2: NetworkEngineerRoadmapSection = {
  id: "switching-layer2",
  title: "Switching & Layer 2 Technologies",
  stages: [
    stage("Ethernet Switching & VLANs", {
      left: [
        g(
          [
            n("MAC Address Table Learning & Aging", "personal"),
            n("Frame Forwarding: Unicast, Unknown Unicast, Broadcast", "personal"),
            n("Collision Domains vs Broadcast Domains", "personal"),
            n("Full-Duplex vs Half-Duplex & CSMA/CD", "personal"),
          ],
          n("Switch Fundamentals", "personal")
        ),
      ],
      right: [
        g(
          [
            n("IEEE 802.1Q VLAN Tagging", "personal"),
            n("Access Ports vs Trunk Ports", "personal"),
            n("Native VLAN Security Considerations", "personal"),
            n("Inter-VLAN Routing (Router-on-a-Stick)", "personal"),
            n("Layer 3 Switches & SVI (Switch Virtual Interface)", "personal"),
            n("Private VLANs (Promiscuous, Community, Isolated)", "optional"),
          ],
          n("VLANs & Segmentation", "personal")
        ),
      ],
    }),
    stage("Spanning Tree & High Availability", {
      left: [
        g(
          [
            n("Layer 2 Broadcast Storms & Loops", "personal"),
            n("STP (802.1D) Root Bridge Election", "personal"),
            n("Port States (Blocking, Listening, Learning, Forwarding)", "personal"),
            n("Rapid STP (RSTP 802.1w)", "personal"),
            n("Multiple STP (MSTP 802.1s)", "optional"),
            n("BPDU Guard, Root Guard & Loop Guard", "personal"),
          ],
          n("Spanning Tree Protocol (STP)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("LACP (802.3ad) & Static EtherChannel", "personal"),
            n("Multi-Chassis EtherChannel (vPC / MLAG)", "personal"),
            n("HSRP (Hot Standby Router Protocol)", "personal"),
            n("VRRP (Virtual Router Redundancy Protocol)", "personal"),
            n("GLBP (Gateway Load Balancing Protocol)", "optional"),
          ],
          n("Link Aggregation & FHRP", "personal")
        ),
      ],
      noteAfter:
        "Spanning Tree prevents catastrophic switching loops, while LACP and First Hop Redundancy Protocols (HSRP/VRRP) deliver high availability across redundant enterprise cores.",
      projectIdea:
        "Project Idea: Configure a redundant multi-switch campus topology in GNS3 or Packet Tracer featuring Rapid-PVST+, LACP EtherChannels, and VRRP default gateways.",
    }),
  ],
};

// --- SECTION 4: ROUTING & LAYER 3 TECHNOLOGIES ---
const ROUTING_LAYER3: NetworkEngineerRoadmapSection = {
  id: "routing-layer3",
  title: "Routing & Layer 3 Technologies",
  stages: [
    stage("Routing Fundamentals & OSPF", {
      left: [
        g(
          [
            n("Routing Table Lookup & Longest Prefix Match", "personal"),
            n("Administrative Distance (AD) & Metric", "personal"),
            n("Static Routes & Floating Static Routes", "personal"),
            n("Default Gateway & 0.0.0.0/0 Quads", "personal"),
            n("Distance Vector vs Link-State Routing", "personal"),
          ],
          n("Routing Foundations", "personal")
        ),
      ],
      right: [
        g(
          [
            n("OSPFv2 (IPv4) & OSPFv3 (IPv6)", "personal"),
            n("Single Area vs Multi-Area Architecture (Area 0)", "personal"),
            n("Router IDs, Hello/Dead Timers, DR/BDR Election", "personal"),
            n("LSA Types (1, 2, 3, 4, 5, 7)", "personal"),
            n("Stub, Totally Stubby & NSSA Areas", "optional"),
            n("Dijkstra Shortest Path First (SPF) Algorithm", "personal"),
          ],
          n("OSPF (Interior Gateway)", "personal")
        ),
        g(
          [
            n("EIGRP (DUAL Algorithm, Feasible Successors)", "alternative"),
            n("IS-IS Protocol for Service Providers", "optional"),
          ],
          n("Other IGPs", "alternative")
        ),
      ],
    }),
    stage("Border Gateway Protocol (BGP)", {
      left: [
        g(
          [
            n("Autonomous Systems (AS) & ASN (16/32-bit)", "personal"),
            n("External BGP (eBGP) vs Internal BGP (iBGP)", "personal"),
            n("BGP Neighbor States & Peering Establishment", "personal"),
            n("Full Mesh iBGP vs Route Reflectors", "personal"),
            n("BGP Confederation", "optional"),
          ],
          n("BGP Architecture", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Path Selection Algorithm (Weight, Local_Pref, AS_Path, MED)", "personal"),
            n("Route Filtering (Prefix Lists, Route Maps)", "personal"),
            n("BGP Communities", "personal"),
            n("MPLS (Multiprotocol Label Switching)", "optional"),
            n("VRF (Virtual Routing and Forwarding)", "personal"),
            n("Route Redistribution & Mutual Redistribution", "personal"),
          ],
          n("Path Attributes & Advanced Routing", "personal")
        ),
      ],
      noteAfter:
        "BGP runs the global Internet and large-scale data center fabrics. Understanding BGP path attribute selection (Local Preference, AS-Path, MED) is essential for senior network roles.",
      projectIdea:
        "Project Idea: Emulate an ISP peering relationship with two upstream providers using eBGP, establishing route maps to prefer one link for outbound traffic using Local Preference.",
    }),
  ],
};

// --- SECTION 5: NETWORK SECURITY & ACCESS CONTROL ---
const NETWORK_SECURITY: NetworkEngineerRoadmapSection = {
  id: "network-security",
  title: "Network Security & Edge Defense",
  stages: [
    stage("Firewalls & Access Control", {
      roadmapId: "cyber-security",
      left: [
        g(
          [
            n("Standard vs Extended Access Control Lists (ACLs)", "personal"),
            n("Stateful Packet Inspection vs Stateless Filtering", "personal"),
            n("Next-Gen Firewalls (Palo Alto, Fortinet, Cisco Secure)", "personal"),
            n("Deep Packet Inspection (DPI) & Application ID", "personal"),
            n("Intrusion Detection & Prevention (IDS / IPS)", "personal"),
          ],
          n("Firewall Systems", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Port Security (Sticky MAC, Violation Modes)", "personal"),
            n("DHCP Snooping & Dynamic ARP Inspection (DAI)", "personal"),
            n("IP Source Guard", "personal"),
            n("AAA Framework (Authentication, Authorization, Accounting)", "personal"),
            n("RADIUS & TACACS+ Servers", "personal"),
            n("IEEE 802.1X Port-Based Network Access Control", "personal"),
          ],
          n("Switch & Access Hardening", "personal")
        ),
      ],
    }),
    stage("VPNs & Zero Trust Architecture", {
      roadmapId: "cyber-security",
      left: [
        g(
          [
            n("IPsec Architecture (AH vs ESP)", "personal"),
            n("IKEv1 vs IKEv2 Phase 1 & Phase 2", "personal"),
            n("Site-to-Site IPsec VPN Tunnels", "personal"),
            n("Remote Access SSL/TLS VPNs (AnyConnect, OpenVPN)", "personal"),
            n("WireGuard VPN Protocol", "alternative"),
            n("DMVPN (Dynamic Multipoint VPN)", "optional"),
          ],
          n("Virtual Private Networks", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Zero Trust Network Access (ZTNA)", "personal"),
            n("Micro-Segmentation Policies", "personal"),
            n("SASE (Secure Access Service Edge)", "personal"),
            n("Software-Defined Perimeter (SDP)", "optional"),
          ],
          n("Modern Zero Trust", "personal")
        ),
      ],
      noteAfter:
        "Perimeter security has shifted toward Zero Trust. Enterprise networks now combine strict 802.1X NAC, micro-segmentation, and Cloud SASE gateways alongside traditional firewalls.",
    }),
  ],
};

// --- SECTION 6: WIRELESS NETWORKING ---
const WIRELESS_NETWORKING: NetworkEngineerRoadmapSection = {
  id: "wireless-networking",
  title: "Wireless Networking (Wi-Fi)",
  stages: [
    stage("RF Fundamentals & 802.11 Standards", {
      left: [
        g(
          [
            n("Radio Frequency (RF) Propagation & Attenuation", "personal"),
            n("Frequency Bands: 2.4 GHz, 5 GHz, 6 GHz", "personal"),
            n("Channel Widths (20, 40, 80, 160 MHz)", "personal"),
            n("Non-Overlapping Channels (1, 6, 11 on 2.4GHz)", "personal"),
            n("RSSI, SNR & Noise Floor", "personal"),
            n("Antennas (Omni-directional vs Directional)", "optional"),
          ],
          n("RF Physics", "personal")
        ),
      ],
      right: [
        g(
          [
            n("802.11ac (Wi-Fi 5) & 256-QAM", "personal"),
            n("802.11ax (Wi-Fi 6 / 6E) & 1024-QAM", "personal"),
            n("802.11be (Wi-Fi 7) & 4096-QAM / 320 MHz", "optional"),
            n("OFDMA (Orthogonal Frequency Division Multiple Access)", "personal"),
            n("MU-MIMO (Multi-User MIMO) & Beamforming", "personal"),
            n("BSS Color & Target Wake Time (TWT)", "optional"),
          ],
          n("Wi-Fi Standards", "personal")
        ),
      ],
    }),
    stage("Enterprise Wireless Architecture", {
      left: [
        g(
          [
            n("Autonomous APs vs Controller-Based APs", "personal"),
            n("Wireless LAN Controllers (WLC) & CAPWAP", "personal"),
            n("Cloud-Managed Wi-Fi (Cisco Meraki, Aruba Central)", "personal"),
            n("Roaming Standards (802.11r, 802.11k, 802.11v)", "personal"),
          ],
          n("Wireless Architecture", "personal")
        ),
      ],
      right: [
        g(
          [
            n("WPA2 vs WPA3 Personal & Enterprise (SAE, 192-bit)", "personal"),
            n("EAP Types (EAP-TLS, PEAP, EAP-FAST)", "personal"),
            n("Guest Wi-Fi Captive Portals", "personal"),
            n("RF Site Surveys (Passive, Active, Predictive)", "personal"),
            n("Survey Tools (Ekahau, NetSpot)", "personal"),
          ],
          n("Security & Site Surveys", "personal")
        ),
      ],
      projectIdea:
        "Project Idea: Conduct a predictive wireless site survey in Ekahau or NetSpot for a multi-floor office, factoring in drywall attenuation, 5 GHz channel plans, and AP placement.",
    }),
  ],
};

// --- SECTION 7: MONITORING & TROUBLESHOOTING ---
const MONITORING_TROUBLESHOOTING: NetworkEngineerRoadmapSection = {
  id: "monitoring-troubleshooting",
  title: "Network Monitoring & Troubleshooting",
  stages: [
    stage("Packet Capture & Protocol Analysis", {
      left: [
        g(
          [
            n("Wireshark Capture Filters (BPF Syntax)", "personal"),
            n("Wireshark Display Filters", "personal"),
            n("tcpdump on Linux CLI", "personal"),
            n("Analyzing TCP Retransmissions & Zero Windows", "personal"),
            n("DNS & TLS Handshake Inspection", "personal"),
            n("SPAN / Port Mirroring & RSPAN", "personal"),
          ],
          n("Wireshark & Deep Packet Inspection", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Structured Troubleshooting (Top-down, Bottom-up, Divide & Conquer)", "personal"),
            n("ICMP Diagnostics (ping, traceroute / tracert, mtr)", "personal"),
            n("iperf3 Bandwidth & Throughput Testing", "personal"),
            n("Cisco IOS verification commands (show ip route, show int)", "personal"),
            n("Cable Testers, TDR & Transceiver Diagnostics", "optional"),
          ],
          n("Troubleshooting Methodology", "personal")
        ),
      ],
    }),
    stage("Network Telemetry & Observability", {
      left: [
        g(
          [
            n("SNMP v2c/v3 Polling & Traps", "personal"),
            n("NetFlow v5 / v9 & IPFIX", "personal"),
            n("sFlow Sampled Flow Tracking", "alternative"),
            n("Streaming Telemetry (gNMI / gRPC)", "optional"),
            n("Syslog Centralization & Severity Levels", "personal"),
          ],
          n("Telemetry Protocols", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Zabbix & Nagios", "personal"),
            n("PRTG Network Monitor", "alternative"),
            n("SolarWinds NPM", "alternative"),
            n("Datadog Network Performance Monitoring", "personal"),
            n("Prometheus & Grafana for Network Metrics", "personal"),
          ],
          n("NMS & Monitoring Platforms", "personal")
        ),
      ],
      noteAfter:
        "Mastering Wireshark packet captures elevates network engineers from guessing to proving the exact root cause of latency, drops, and broken sessions.",
      projectIdea:
        "Project Idea: Capture a slow web transaction in Wireshark, dissect the TCP stream, and diagnose whether the delay originates from DNS latency, packet loss, or server response times.",
    }),
  ],
};

// --- SECTION 8: NETWORK AUTOMATION & PROGRAMMABILITY ---
const NETWORK_AUTOMATION: NetworkEngineerRoadmapSection = {
  id: "network-automation",
  title: "Network Automation & Programmability",
  stages: [
    stage("Python Scripting & Network Libraries", {
      roadmapId: "skill-python",
      left: [
        g(
          [
            n("Python Fundamentals (Data types, loops, functions)", "personal"),
            n("Regular Expressions (re module for CLI parsing)", "personal"),
            n("Netmiko (Multi-vendor SSH automation)", "personal"),
            n("Paramiko (Low-level SSH)", "alternative"),
            n("Scrapli (High-speed screen scraper)", "optional"),
            n("Nornir (Pythonic automation framework)", "personal"),
          ],
          n("Python for Networking", "personal")
        ),
      ],
      right: [
        g(
          [
            n("JSON & YAML Serialization", "personal"),
            n("XML Data Representation", "personal"),
            n("YANG Data Modeling Language (RFC 6020)", "personal"),
            n("RESTCONF (HTTP REST for Network Config)", "personal"),
            n("NETCONF (SSH/XML Network Management)", "personal"),
          ],
          n("Data Models & APIs", "personal")
        ),
      ],
    }),
    stage("Infrastructure as Code & Linux", {
      roadmapId: "skill-linux",
      left: [
        g(
          [
            n("Ansible Core & Network Collections (cisco.ios, arista.eos)", "personal"),
            n("Ansible Playbooks & Jinja2 Templates", "personal"),
            n("Terraform for Cloud & Virtual Networks", "personal"),
            n("Git for Network Configurations (GitOps)", "personal"),
            n("CI/CD Pipelines for Network Changes", "optional"),
          ],
          n("Config Management & IaC", "personal")
        ),
      ],
      right: [
        g(
          [
            n("iproute2 (ip addr, ip route, ip link)", "personal"),
            n("iptables & nftables Firewalling", "personal"),
            n("Network Namespaces & Virtual Ethernet (veth)", "personal"),
            n("Linux Bridge & Bonding Interfaces", "personal"),
            n("DNS Resolver configuration (systemd-resolved)", "optional"),
          ],
          n("Linux Networking Essentials", "personal")
        ),
      ],
      noteAfter:
        "Modern enterprise network engineers manage fleet configs through Ansible playbooks, Jinja2 templating, and version-controlled Git repositories rather than manual CLI logins.",
      projectIdea:
        "Project Idea: Write an Ansible playbook with Jinja2 templates to push unified NTP, syslog, and ACL configurations across 20 simulated Cisco/Arista switches simultaneously.",
    }),
  ],
};

// --- SECTION 9: CLOUD & HYBRID NETWORKING ---
const CLOUD_NETWORKING: NetworkEngineerRoadmapSection = {
  id: "cloud-networking",
  title: "Cloud & Hybrid Networking",
  stages: [
    stage("Public Cloud Virtual Networks", {
      roadmapId: "skill-aws",
      left: [
        g(
          [
            n("AWS VPC (Virtual Private Cloud)", "personal"),
            n("Public vs Private Subnets", "personal"),
            n("Internet Gateways (IGW) & NAT Gateways", "personal"),
            n("Route Tables & VPC Peering", "personal"),
            n("Security Groups vs Network ACLs (NACLs)", "personal"),
            n("AWS Transit Gateway", "personal"),
          ],
          n("AWS Cloud Networking", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Azure Virtual Network (VNet)", "personal"),
            n("VNet Peering & Subnets", "personal"),
            n("Network Security Groups (NSGs)", "personal"),
            n("Azure Virtual WAN", "optional"),
            n("GCP VPC Network (Global VPCs)", "alternative"),
          ],
          n("Azure & Multi-Cloud", "personal")
        ),
      ],
    }),
    stage("Hybrid Connectivity & SD-WAN", {
      left: [
        g(
          [
            n("AWS Direct Connect (DX)", "personal"),
            n("Azure ExpressRoute", "personal"),
            n("Cloud-to-On-Premises IPsec VPN", "personal"),
            n("BGP over Direct Connect / ExpressRoute", "personal"),
          ],
          n("Hybrid Interconnects", "personal")
        ),
      ],
      right: [
        g(
          [
            n("SD-WAN Architecture (Control, Data, Orchestration planes)", "personal"),
            n("Cisco Catalyst SD-WAN (Viptela)", "personal"),
            n("VMware SD-WAN (VeloCloud)", "alternative"),
            n("Fortinet Secure SD-WAN", "alternative"),
            n("Overlay Networks, VXLAN & EVPN", "personal"),
          ],
          n("SD-WAN & Modern Overlays", "personal")
        ),
      ],
      noteAfter:
        "Hybrid networking connects corporate datacenters to AWS, Azure, and SaaS via private circuits (Direct Connect, ExpressRoute) and intelligent dynamic SD-WAN fabrics.",
      projectIdea:
        "Project Idea: Deploy an AWS Transit Gateway architecture connecting 3 VPCs with an on-premises simulation router over an IPsec VPN tunnel with dynamic BGP route propagation.",
    }),
  ],
};

export const NETWORK_ENGINEER_SECTIONS: NetworkEngineerRoadmapSection[] = [
  NETWORKING_FUNDAMENTALS,
  IP_ADDRESSING,
  SWITCHING_LAYER2,
  ROUTING_LAYER3,
  NETWORK_SECURITY,
  WIRELESS_NETWORKING,
  MONITORING_TROUBLESHOOTING,
  NETWORK_AUTOMATION,
  CLOUD_NETWORKING,
];
