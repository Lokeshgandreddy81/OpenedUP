export type ServerSideGameDevRoadmapStatus = "personal" | "alternative" | "optional";

export interface ServerSideGameDevRoadmapNode {
  id: string;
  title: string;
  status?: ServerSideGameDevRoadmapStatus;
  roadmapId?: string;
}

export interface ServerSideGameDevRoadmapGroup {
  id: string;
  parent?: ServerSideGameDevRoadmapNode;
  items: ServerSideGameDevRoadmapNode[];
}

export interface ServerSideGameDevRoadmapStage {
  id: string;
  node: ServerSideGameDevRoadmapNode;
  left?: ServerSideGameDevRoadmapGroup[];
  right?: ServerSideGameDevRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ServerSideGameDevRoadmapSection {
  id: string;
  title?: string;
  stages: ServerSideGameDevRoadmapStage[];
}

export interface ServerSideGameDevRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SERVER_SIDE_GAME_DEV_MARKERS: Array<{
  status: ServerSideGameDevRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SERVER_SIDE_GAME_DEV_RELATED_ROADMAPS: ServerSideGameDevRoadmapLink[] = [
  { label: "Game Developer", roadmapId: "game-developer" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "C++ Roadmap", roadmapId: "skill-cpp" },
  { label: "Go Roadmap", roadmapId: "skill-go" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
];

export const SERVER_SIDE_GAME_DEV_CONTINUE_LEARNING: ServerSideGameDevRoadmapLink[] = [
  { label: "Game Developer", roadmapId: "game-developer" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Linux", roadmapId: "skill-linux" },
  { label: "System Design", roadmapId: "skill-system-design" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: ServerSideGameDevRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ServerSideGameDevRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ServerSideGameDevRoadmapNode[],
  parent?: ServerSideGameDevRoadmapNode,
  customId?: string
): ServerSideGameDevRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ServerSideGameDevRoadmapStage, "id" | "node"> & {
    status?: ServerSideGameDevRoadmapStatus;
    roadmapId?: string;
    customId?: string;
  } = {}
): ServerSideGameDevRoadmapStage => {
  const { status, roadmapId, customId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// --- SECTION 1: PROGRAMMING LANGUAGES & SYSTEMS FOUNDATIONS ---
const SYSTEMS_AND_LANGUAGES: ServerSideGameDevRoadmapSection = {
  id: "systems-and-languages",
  title: "1. Programming Languages & Systems Foundations",
  stages: [
    stage("Pick Server Languages", {
      left: [
        g(
          [
            n("Headless Simulation Loop (60Hz / 128Hz)", "personal"),
            n("Deterministic Physics Integration", "personal"),
            n("Zero-GC Memory Control", "personal"),
            n("Concurrency & Thread Affinity", "personal"),
          ],
          n("C++ (Dedicated Simulation Engine)", "personal", "skill-cpp")
        ),
        g(
          [
            n("Memory Safety without Garbage Collection"),
            n("High-throughput Async Actors (Tokio, Actix)"),
            n("Zero-copy Network Buffers"),
          ],
          n("Rust (Modern High-Concurrency)", "alternative", "skill-rust")
        ),
      ],
      right: [
        g(
          [
            n("Matchmaking & Fleet Services"),
            n("Goroutines & Lightweight Channels"),
            n("gRPC & Protobuf Microservices"),
          ],
          n("Go (Matchmaking & Platform APIs)", "personal", "skill-go")
        ),
        g(
          [
            n("C# / .NET (Unity Headless Dedicated Servers)", "alternative"),
            n("Node.js / TypeScript (Casual / Turn-Based)", "optional", "skill-nodejs"),
            n("Java / Kotlin (Legacy MMO Infrastructure)", "optional", "skill-java"),
          ],
          n("Managed Platforms", "optional")
        ),
      ],
      noteAfter:
        "Modern multiplayer architectures often split responsibilities: high-tick authoritative game loops are written in C++ or Rust, while matchmaking, lobbies, and social systems run on Go microservices.",
      projectIdea:
        "Build a high-performance multithreaded UDP echo server handling 50,000 packets/sec using non-blocking sockets and thread pools",
    }),
    stage("OS & Network Performance Tuning", {
      left: [
        g(
          [
            n("Linux sysctl Socket Buffer Tuning (rmem/wmem)", "personal"),
            n("I/O Multiplexing (epoll, kqueue, io_uring)", "personal"),
            n("CPU Pinning & NUMA Awareness"),
            n("Timer Precision (clock_gettime, nanosleep, HPET)"),
          ],
          n("Linux Kernel Optimization", "personal", "skill-linux")
        ),
      ],
      right: [
        g(
          [
            n("MTU (Maximum Transmission Unit) & Jumbo Frames"),
            n("IP Fragmentation Avoidance (Packets < 1200 bytes)", "personal"),
            n("Network Interface Card (NIC) Ring Buffers"),
            n("Socket Options (SO_REUSEPORT, TCP_NODELAY)"),
          ],
          n("OS Socket Subsystems", "personal")
        ),
      ],
      noteAfter:
        "A 128Hz tick server requires sub-millisecond timer resolution. Linux kernel parameters like SO_REUSEPORT and CPU pinning prevent scheduling jitter.",
    }),
  ],
};

// --- SECTION 2: NETWORKING PROTOCOLS & TRANSPORT LAYER ---
const NETWORKING_PROTOCOLS: ServerSideGameDevRoadmapSection = {
  id: "networking-protocols",
  title: "2. Networking Protocols & Transport Layer",
  stages: [
    stage("Core Transport Protocols", {
      left: [
        g(
          [
            n("Connectionless & Low Overhead (8-byte header)", "personal"),
            n("Zero Head-of-Line Blocking", "personal"),
            n("Unreliable & Unordered Delivery", "personal"),
            n("Fast Retransmissions on Demand"),
          ],
          n("UDP (Backbone of Real-Time Games)", "personal")
        ),
        g(
          [
            n("Reliable Stream Delivery", "personal"),
            n("Head-of-Line Blocking Latency Penalty"),
            n("Ideal for Lobbies, Chat, Leaderboards & Store", "personal"),
          ],
          n("TCP (Turn-Based & Out-of-Band)", "alternative")
        ),
      ],
      right: [
        g(
          [
            n("Multiplexed Streams over UDP", "personal"),
            n("0-RTT Connection Resumption", "personal"),
            n("Built-in TLS Encryption"),
            n("Browser-Compatible WebTransport"),
          ],
          n("QUIC & WebTransport", "personal")
        ),
        g(
          [
            n("WebSockets (Browser HTML5 Multiplayer)", "optional"),
            n("Socket.io (Fallbacks & Rooms)"),
            n("WebRTC DataChannels (P2P Mesh)"),
          ],
          n("Web-Based Networking", "optional")
        ),
      ],
      noteAfter:
        "TCP's guaranteed ordering creates catastrophic latency spikes when a single packet drops (Head-of-Line blocking). Fast-paced action games use UDP exclusively for gameplay.",
      projectIdea:
        "Implement a custom transport layer over raw UDP with sequence numbers, ACK bitfields, and bandwidth throttling",
    }),
    stage("Reliable UDP (RUDP) & Serialization", {
      left: [
        g(
          [
            n("ENet (Lightweight Reliable UDP C Library)", "personal"),
            n("SteamNetworkingSockets (Valve Open Source)", "personal"),
            n("RakNet / SLikeNet (Classic MMOs)"),
            n("LiteNetLib (C# Unity Standard)"),
          ],
          n("RUDP Libraries", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Bit-packing & Quantization (Float to Int)", "personal"),
            n("FlatBuffers (Zero-copy Serialization)", "personal"),
            n("Protocol Buffers (Protobuf for Microservices)", "personal"),
            n("Delta Compression (Replicate only diffs)", "personal"),
          ],
          n("Binary Serialization & Packing", "personal")
        ),
      ],
      noteAfter:
        "Never serialize full floats or strings in game packets! Quantize continuous floats into compact 8-bit or 16-bit integers and pack bits into raw byte buffers.",
    }),
  ],
};

// --- SECTION 3: SERVER ARCHITECTURE & TOPOLOGIES ---
const SERVER_ARCHITECTURE: ServerSideGameDevRoadmapSection = {
  id: "server-architecture",
  title: "3. Server Architecture & Topologies",
  stages: [
    stage("Network Topologies", {
      left: [
        g(
          [
            n("Server is the Sole Authority (Source of Truth)", "personal"),
            n("Clients Send Inputs, Server Broadcasts State", "personal"),
            n("Resistant to Cheating & Tampering", "personal"),
            n("Highest Hosting Cost & Bandwidth Consumption"),
          ],
          n("Dedicated Authoritative Server (Standard)", "personal")
        ),
        g(
          [
            n("NAT Punchthrough (STUN, TURN, ICE)"),
            n("Host Migration & Disconnect Handling"),
            n("Prone to Host Advantage & Cheat Injection"),
          ],
          n("Peer-to-Peer (P2P) & Listen Servers", "alternative")
        ),
      ],
      right: [
        g(
          [
            n("Lockstep Protocol (RTS Games, StarCraft)", "personal"),
            n("Input Sharing & Deterministic Simulation", "personal"),
            n("Rollback Netcode (GGPO for Fighting Games)", "personal"),
            n("Desync Detection & Frame Replay"),
          ],
          n("Deterministic Lockstep & Rollback", "personal")
        ),
      ],
      noteAfter:
        "Competitive FPS and Battle Royales use Dedicated Authoritative Servers. Fighting games use Rollback Netcode (GGPO) for zero-input-delay responsiveness.",
      projectIdea:
        "Build a 2-player deterministic Pong or fighting game simulation using GGPO-style rollback netcode over UDP",
    }),
    stage("Spatial Partitioning & Interest Management", {
      left: [
        g(
          [
            n("Grid-Based Spatial Hashing", "personal"),
            n("Quadtrees (2D) & Octrees (3D)", "personal"),
            n("Spatial Hashing & Cell Broadcasting"),
            n("Dynamic Area of Interest (AoI) Culling", "personal"),
          ],
          n("Spatial Partitioning", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Bandwidth Throttling & Priority Queues", "personal"),
            n("Distance-Based Tick Rate Degradation"),
            n("Relevancy Checks & View Frustum Culling"),
            n("Player Sharding & Seamless Zoning"),
          ],
          n("Interest Management & Bandwidth Control", "personal")
        ),
      ],
      noteAfter:
        "In a 100-player Battle Royale or MMO, sending every entity's position to all players requires N^2 messages. Spatial partitioning limits updates to nearby entities within the player's Area of Interest.",
    }),
  ],
};

// --- SECTION 4: SYNCHRONIZATION & LATENCY COMPENSATION ---
const LATENCY_COMPENSATION: ServerSideGameDevRoadmapSection = {
  id: "latency-compensation",
  title: "4. Synchronization & Latency Compensation",
  stages: [
    stage("Client-Side Prediction & Reconciliation", {
      left: [
        g(
          [
            n("Instant Local Input Execution (Zero Perceived Delay)", "personal"),
            n("Sequential Input History Buffer", "personal"),
            n("Client Simulation Prediction Loop", "personal"),
          ],
          n("Client-Side Prediction", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Server Authoritative State Snapshot Verification", "personal"),
            n("State Divergence Detection & Snap-Back", "personal"),
            n("Replaying Unacknowledged Inputs from Buffer", "personal"),
            n("Smooth Error Correction Blending"),
          ],
          n("Server Reconciliation", "personal")
        ),
      ],
      noteAfter:
        "Client prediction lets players move immediately upon pressing keys. When the server snapshot arrives, unacknowledged inputs are replayed to avoid jarring teleport glitches.",
      projectIdea:
        "Build a 2D physics demo simulating 200ms latency with client prediction, server reconciliation, and visual error correction",
    }),
    stage("Interpolation & Lag Compensation", {
      left: [
        g(
          [
            n("Entity Snapshot Buffer (Render Remote Players)", "personal"),
            n("Interpolation Delay (e.g. 100ms Interpolation Window)", "personal"),
            n("Hermite Splines & Linear Lerp"),
            n("Dead Reckoning / Extrapolation on Packet Drop", "personal"),
          ],
          n("Entity Interpolation & Extrapolation", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Server-Side Hitbox Rewind / Time Travel", "personal"),
            n("Verifying Raycast at Client's Historical Timestamp", "personal"),
            n("Maximum Lag Rewind Clamping (e.g. 250ms limit)"),
            n("Favoring the Shooter vs Defender Tradeoffs"),
          ],
          n("Lag Compensation (Hit Registration)", "personal")
        ),
      ],
      noteAfter:
        "Lag compensation rewinds historical hitboxes on the server to the exact millisecond the shooting client saw the target, solving the 'I shot him on my screen!' problem.",
    }),
  ],
};

// --- SECTION 5: MATCHMAKING, LOBBY & SESSION SYSTEMS ---
const MATCHMAKING_AND_LOBBIES: ServerSideGameDevRoadmapSection = {
  id: "matchmaking-and-lobbies",
  title: "5. Matchmaking, Lobbies & Session Systems",
  stages: [
    stage("Matchmaking Systems & Algorithms", {
      left: [
        g(
          [
            n("Elo Rating & Glicko-2 System", "personal"),
            n("Microsoft TrueSkill / TrueSkill 2", "personal"),
            n("Matchmaking Rating (MMR) & Hidden Ranking", "personal"),
            n("Ping & Regional Latency Clustering", "personal"),
          ],
          n("Skill-Based Matchmaking (SBMM)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Open Match (Cloud Native Matchmaker Engine)", "personal"),
            n("Matchmaking Ticket Lifecycle & Pools", "personal"),
            n("Relaxing Match Quality Over Queue Time"),
            n("Party & Squad Weight Balancing"),
          ],
          n("Matchmaking Architecture", "personal")
        ),
      ],
      noteAfter:
        "Matchmaking must balance two competing objectives: fair skill matchups and low wait times. Queues widen their MMR search criteria dynamically the longer a player waits.",
      projectIdea:
        "Implement an Open Match or custom ticket-based matchmaker grouping 10 players based on Elo rating and ping within 5 seconds",
    }),
    stage("Lobbies, Presence & Social Services", {
      left: [
        g(
          [
            n("Party Invitations, Join/Leave & Ready Check", "personal"),
            n("Player Presence Status (In-Lobby, In-Game, Offline)", "personal"),
            n("Cross-Platform Social Graph & Friends List"),
          ],
          n("Lobby & Presence Management", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Real-Time In-Game Text & Global Chat Channels", "personal"),
            n("Voice Chat Integration (Vivox, Discord SDK, WebRTC)", "personal"),
            n("Profanity Filtering & Chat Moderation Pipelines"),
          ],
          n("Chat & Communications", "personal")
        ),
      ],
      noteAfter:
        "Lobby and chat services run on decoupled stateless microservices communicating via Redis Pub/Sub or WebSockets.",
    }),
  ],
};

// --- SECTION 6: PERSISTENCE, STATE MANAGEMENT & DATABASES ---
const PERSISTENCE_AND_DATABASES: ServerSideGameDevRoadmapSection = {
  id: "persistence-and-databases",
  title: "6. Persistence, State Management & Databases",
  stages: [
    stage("In-Memory State & Fast Caching", {
      left: [
        g(
          [
            n("Redis Sorted Sets (Leaderboards & Ranks)", "personal", "skill-redis"),
            n("Redis Pub/Sub & Keyspace Notifications", "personal"),
            n("Distributed Locking & Mutexes (Redlock)"),
            n("KeyDB / Dragonfly High-Throughput In-Memory"),
          ],
          n("In-Memory Data Stores", "personal", "skill-redis")
        ),
      ],
      right: [
        g(
          [
            n("Session Token Validation & JWT", "personal"),
            n("Active Game Server Allocations & Heartbeats", "personal"),
            n("Temporary Match State & Reconnect Tokens"),
          ],
          n("Session Caching & State", "personal")
        ),
      ],
      noteAfter:
        "Redis Sorted Sets (ZADD, ZREVRANGE) provide O(log(N)) ranking queries for real-time global leaderboards with millions of entries.",
      projectIdea:
        "Design a real-time global leaderboard using Redis Sorted Sets with pagination, user rank lookups, and score decay",
    }),
    stage("Relational & NoSQL Storage", {
      left: [
        g(
          [
            n("PostgreSQL (Player Accounts & Currency Ledgers)", "personal", "postgresql"),
            n("ACID Transactions for Virtual Currency / Items", "personal"),
            n("Read Replicas & Connection Pooling (PgBouncer)"),
          ],
          n("Relational Databases", "personal", "postgresql")
        ),
      ],
      right: [
        g(
          [
            n("DynamoDB / MongoDB (Player Profiles & Loadouts)", "personal", "skill-mongodb"),
            n("Blob Storage for Match Replays (AWS S3, MinIO)", "personal"),
            n("Time-Series DB for Telemetry (ClickHouse, TimescaleDB)"),
          ],
          n("NoSQL & Blob Storage", "personal")
        ),
      ],
      noteAfter:
        "Virtual currency transactions and inventory purchases must strictly use ACID-compliant databases to prevent item duplication exploits.",
    }),
  ],
};

// --- SECTION 7: SCALABILITY & GAME SERVER ORCHESTRATION ---
const ORCHESTRATION_AND_SCALABILITY: ServerSideGameDevRoadmapSection = {
  id: "orchestration-and-scalability",
  title: "7. Scalability & Dedicated Server Orchestration",
  stages: [
    stage("Containerization & Orchestration", {
      left: [
        g(
          [
            n("Headless Linux Game Server Docker Builds", "personal", "skill-docker"),
            n("Minimizing Container Image Footprint", "personal"),
            n("Host Networking (hostNetwork: true in K8s)", "personal"),
            n("UDP Port Allocation Ranges per Node"),
          ],
          n("Docker & Linux Containers", "personal", "skill-docker")
        ),
      ],
      right: [
        g(
          [
            n(
              "Agones (Google Cloud & Kubernetes for Game Servers)",
              "personal",
              "skill-kubernetes"
            ),
            n("Agones SDK (Ready, Allocate, Health, Shutdown)", "personal"),
            n("Custom Resource Definitions (Fleet, GameServerAllocation)"),
            n("Graceful Termination & Drain Cycles"),
          ],
          n("Agones & Kubernetes", "personal", "skill-kubernetes")
        ),
      ],
      noteAfter:
        "Unlike stateless web apps, game servers are STATEFUL. You cannot kill an active match during auto-scaling; servers must be drained gracefully when the match finishes.",
      projectIdea:
        "Deploy a fleet of headless UDP game servers on local Minikube using Agones and request allocations via the Agones REST SDK",
    }),
    stage("Cloud Game Hosting Solutions", {
      left: [
        g(
          [
            n("AWS GameLift (FleetIQ & Managed Servers)", "personal", "skill-aws"),
            n("Azure PlayFab Multiplayer Servers (MPS)", "alternative"),
            n("Nakama (Open Source Game Server Platform)"),
          ],
          n("Managed Game Server Platforms", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Multi-Region Edge Deployments"),
            n("Warm Standby Instance Pools"),
            n("Spot / Preemptible Instance Cost Optimization"),
            n("Game Server Matchmaker Integration"),
          ],
          n("Fleet Scaling & Cost Control", "personal")
        ),
      ],
      noteAfter:
        "Maintaining warm standby servers across global edge regions ensures zero queue wait times during sudden player influxes.",
    }),
  ],
};

// --- SECTION 8: SECURITY, ANTI-CHEAT & DDOS MITIGATION ---
const SECURITY_AND_ANTI_CHEAT: ServerSideGameDevRoadmapSection = {
  id: "security-and-anti-cheat",
  title: "8. Game Security, Anti-Cheat & Reliability",
  stages: [
    stage("Server-Side Anti-Cheat & Validation", {
      left: [
        g(
          [
            n("Never Trust Client Data (Golden Rule)", "personal"),
            n("Server-Side Movement Validation (Speedhack check)", "personal"),
            n("Teleportation & Wallclip Prevention", "personal"),
            n("Weapon Fire Rate & Cooldown Checks", "personal"),
          ],
          n("Authoritative Sanity Checks", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Easy Anti-Cheat (EAC) & BattlEye", "personal"),
            n("Kernel-Level Drivers & Ring 0 Verification"),
            n("Machine Learning Aimbot & Recoil Detection"),
            n("Telemetry Anomaly & Behavior Scoring"),
          ],
          n("Client-Side Anti-Cheat Integration", "personal")
        ),
      ],
      noteAfter:
        "Client-side anti-cheat tools will eventually be bypassed. Robust server-side verification that simulates and validates every action is the only bulletproof defense.",
      projectIdea:
        "Write a server-side movement verification module that flags speed-hacking and noclip violations given player input vectors and delta times",
    }),
    stage("Network Security & DDoS Defense", {
      left: [
        g(
          [
            n("UDP Amplification & Reflection Defense", "personal"),
            n("Cloudflare Spectrum / AWS Shield for Gaming", "personal"),
            n("Valve Anti-DDoS (SDR - Steam Datagram Relay)", "personal"),
            n("Anycast BGP Routing to Scrubbing Centers"),
          ],
          n("DDoS Mitigation", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Cryptographic Handshake & Connection Tokens", "personal"),
            n("Replay Attack Prevention with Nonces & Timestamps", "personal"),
            n("Packet Rate Limiting & Leaky Bucket Algorithms", "personal"),
            n("Packet Tamper Detection (HMAC)"),
          ],
          n("Packet Security & Rate Limiting", "personal")
        ),
      ],
      noteAfter:
        "SDR (Steam Datagram Relay) masks game server IP addresses behind a global relay network, making direct IP DDoS attacks virtually impossible.",
    }),
  ],
};

// --- SECTION 9: OBSERVABILITY, TELEMETRY & LIVE-OPS ---
const OBSERVABILITY_AND_LIVEOPS: ServerSideGameDevRoadmapSection = {
  id: "observability-and-liveops",
  title: "9. Observability, Telemetry & Live Operations",
  stages: [
    stage("Metrics & Telemetry Pipelines", {
      left: [
        g(
          [
            n("Tick Rate & Frame Time Histogram (Ticks/sec)", "personal"),
            n("Round-Trip Time (RTT) & Jitter Percentiles (p95/p99)", "personal"),
            n("Packet Loss & Out-of-Order Packet Rates", "personal"),
            n("Prometheus Exporters & Grafana Dashboards", "personal"),
          ],
          n("Performance Metrics", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Game Economy Inflow/Outflow Balances", "personal"),
            n("Weapon Win-Rate & Kill/Death Distribution"),
            n("Crash Reporting & Core Dumps (Sentry, Backtrace)", "personal"),
            n("Distributed Tracing with OpenTelemetry"),
          ],
          n("Gameplay Analytics & Crash Diagnostics", "personal")
        ),
      ],
      noteAfter:
        "Monitoring the 99th percentile tick time is vital: even if the average tick time is 10ms, a p99 spike of 50ms causes noticeable rubberbanding for players.",
      projectIdea:
        "Set up Prometheus & Grafana to monitor game server tick rate, connected players, CPU usage, and UDP packet loss in real-time",
    }),
  ],
};

export const SERVER_SIDE_GAME_DEV_SECTIONS: ServerSideGameDevRoadmapSection[] = [
  SYSTEMS_AND_LANGUAGES,
  NETWORKING_PROTOCOLS,
  SERVER_ARCHITECTURE,
  LATENCY_COMPENSATION,
  MATCHMAKING_AND_LOBBIES,
  PERSISTENCE_AND_DATABASES,
  ORCHESTRATION_AND_SCALABILITY,
  SECURITY_AND_ANTI_CHEAT,
  OBSERVABILITY_AND_LIVEOPS,
];
