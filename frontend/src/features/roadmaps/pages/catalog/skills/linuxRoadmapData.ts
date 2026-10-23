export type LinuxRoadmapStatus = "personal" | "alternative" | "optional";

export interface LinuxRoadmapNode {
  id: string;
  title: string;
  status?: LinuxRoadmapStatus;
  roadmapId?: string;
}

export interface LinuxRoadmapGroup {
  id: string;
  parent?: LinuxRoadmapNode;
  items: LinuxRoadmapNode[];
}

export interface LinuxRoadmapStage {
  id: string;
  node: LinuxRoadmapNode;
  left?: LinuxRoadmapGroup[];
  right?: LinuxRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface LinuxRoadmapSection {
  id: string;
  title?: string;
  stages: LinuxRoadmapStage[];
}

export interface LinuxRoadmapLink {
  label: string;
  roadmapId: string;
}

export const LINUX_MARKERS: Array<{
  status: LinuxRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const LINUX_RELATED_ROADMAPS: LinuxRoadmapLink[] = [
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Cyber Security Roadmap", roadmapId: "cyber-security" },
];

export const LINUX_CONTINUE_LEARNING: LinuxRoadmapLink[] = [
  { label: "Devops Roadmap", roadmapId: "devops" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Cyber Security Roadmap", roadmapId: "cyber-security" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: LinuxRoadmapStatus,
  roadmapId?: string,
  customId?: string
): LinuxRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: LinuxRoadmapNode[],
  parent?: LinuxRoadmapNode,
  customId?: string
): LinuxRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<LinuxRoadmapStage, "id" | "node"> & {
    status?: LinuxRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): LinuxRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const SECTION_1: LinuxRoadmapSection = {
  id: "phase-1",
  title:
    "Phase 1 \u2014 Find the detailed version of this roadmap along with other similar roadmaps",
  stages: [
    stage("Find the detailed version of this roadmap along with other similar roadmaps", {
      status: "personal",
      left: [g([n("Related Roadmaps")])],
      right: [g([n("Basic Commands")])],
    }),
    stage("Navigation Basics", {
      status: "personal",
      left: [g([n("Vim"), n("Nano"), n("Command Path"), n("Environment Variables")])],
      right: [
        g([
          n("Moving Files / Directories"),
          n("Creating & Deleting Files / Dirs"),
          n("Directory Hierarchy Overview"),
          n("stdout / stdin / stderr"),
          n("cut"),
          n("paste"),
          n("sort"),
          n("tr"),
          n("head"),
        ]),
      ],
    }),
    stage("Editing Files", {
      status: "personal",
      left: [g([n("Command Help"), n("Shell and Other Basics")])],
      right: [g([n("tail"), n("join"), n("split"), n("pipe")])],
    }),
    stage("Shell and Other Basics", {
      status: "personal",
      left: [
        g([n("Redirects"), n("Super User"), n("Shell / Bash Roadmap"), n("File Permissions")]),
      ],
      right: [
        g([n("tee"), n("nl"), n("wc"), n("expand"), n("unexpand"), n("uniq"), n("grep"), n("awk")]),
      ],
    }),
    stage("Working with Files", {
      status: "personal",
      left: [
        g([
          n("Archiving and Compressing"),
          n("Copying and Renaming"),
          n("Soft Links / Hard Links"),
        ]),
      ],
      right: [g([n("Text Processing")])],
    }),
  ],
};

const SECTION_2: LinuxRoadmapSection = {
  id: "phase-2",
  title: "Phase 2 \u2014 Text Processing",
  stages: [
    stage("Text Processing", {
      status: "personal",
      right: [g([n("Server Review")])],
    }),
    stage("Process Management", {
      status: "personal",
      left: [
        g([
          n("Background / Foreground Processes"),
          n("Listing / Finding Processes"),
          n("Create / Delete / Update"),
          n("Process Signals"),
          n("Users and Groups"),
          n("User Management"),
        ]),
      ],
      right: [
        g([
          n("Uptime and Load"),
          n("Authentication Logs"),
          n("Killing Processes"),
          n("Services Running"),
        ]),
      ],
    }),
    stage("Server Review", {
      status: "personal",
      left: [g([n("Process Management")])],
    }),
    stage("User Management", {
      status: "personal",
      left: [g([n("Process Priorities"), n("Managing Permissions")])],
      right: [g([n("Process Forking"), n("Available Memory / Disk")])],
    }),
    stage("Service Management (systemd)", {
      status: "personal",
      left: [
        g([
          n("Creating New Services"),
          n("Checking Service Logs"),
          n("Starting / Stopping Services"),
          n("Checking Service Status"),
          n("Package Management"),
        ]),
      ],
      right: [
        g([n("Inodes"), n("Filesystems"), n("Mounts"), n("LVM"), n("Adding Disks"), n("Swap")]),
      ],
    }),
  ],
};

const SECTION_3: LinuxRoadmapSection = {
  id: "phase-3",
  title: "Phase 3 \u2014 Package Management",
  stages: [
    stage("Package Management", {
      status: "personal",
      left: [
        g([
          n("Package Repositories"),
          n("Snap"),
          n("Finding & Installing Packages"),
          n("Listing Installed Packages"),
        ]),
      ],
      right: [g([n("Logs"), n("Boot Loaders"), n("Disks and Filesystems")])],
    }),
    stage("Disks and Filesystems", {
      status: "personal",
      right: [g([n("Booting Linux")])],
    }),
    stage("Booting Linux", {
      status: "personal",
      left: [g([n("Install / Remove / Upgrade Packages")])],
      right: [g([n("TCP/IP Stack"), n("Subnetting"), n("Ethernet & arp/rarp"), n("Networking")])],
    }),
    stage("Networking", {
      status: "personal",
      left: [
        g([
          n("Literals"),
          n("Variables"),
          n("Loops"),
          n("Conditionals"),
          n("Debugging"),
          n("Shell Programming"),
        ]),
      ],
      right: [
        g([
          n("DHCP"),
          n("IP Routing"),
          n("DNS Resolution"),
          n("Netfilter"),
          n("SSH"),
          n("File Transfer"),
        ]),
      ],
    }),
    stage("Shell Programming", {
      status: "personal",
      left: [g([n("ICMP"), n("ping"), n("traceroute"), n("netstat"), n("Troubleshooting")])],
      right: [g([n("ulimits"), n("cgroups"), n("Container Runtime")])],
    }),
  ],
};

const SECTION_4: LinuxRoadmapSection = {
  id: "phase-4",
  title: "Phase 4 \u2014 Troubleshooting",
  stages: [
    stage("Troubleshooting", {
      status: "personal",
      left: [g([n("Packet Analysis")])],
      right: [g([n("Docker"), n("Containerization")])],
    }),
    stage("Containerization", {
      status: "personal",
      left: [g([n("DevOps")])],
      right: [g([n("Docker"), n("Backend"), n("Network Engineer")])],
    }),
  ],
};

export const LINUX_SECTIONS: LinuxRoadmapSection[] = [SECTION_1, SECTION_2, SECTION_3, SECTION_4];
