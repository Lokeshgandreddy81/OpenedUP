export type DockerRoadmapStatus = "personal" | "alternative" | "optional";

export interface DockerRoadmapNode {
  id: string;
  title: string;
  status?: DockerRoadmapStatus;
  roadmapId?: string;
}

export interface DockerRoadmapGroup {
  id: string;
  parent?: DockerRoadmapNode;
  items: DockerRoadmapNode[];
}

export interface DockerRoadmapStage {
  id: string;
  node: DockerRoadmapNode;
  left?: DockerRoadmapGroup[];
  right?: DockerRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DockerRoadmapSection {
  id: string;
  title?: string;
  stages: DockerRoadmapStage[];
}

export interface DockerRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DOCKER_MARKERS: Array<{
  status: DockerRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DOCKER_RELATED_ROADMAPS: DockerRoadmapLink[] = [
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "DevSecOps Roadmap", roadmapId: "devsecops" },
  { label: "Backend Roadmap", roadmapId: "backend" },
  { label: "MLOps Roadmap", roadmapId: "mlops" },
];

export const DOCKER_CONTINUE_LEARNING: DockerRoadmapLink[] = [
  { label: "Kubernetes", roadmapId: "skill-kubernetes" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Linux", roadmapId: "skill-linux" },
  { label: "DevSecOps", roadmapId: "devsecops" },
  { label: "Terraform", roadmapId: "skill-terraform" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DockerRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DockerRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DockerRoadmapNode[],
  parent?: DockerRoadmapNode,
  customId?: string
): DockerRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DockerRoadmapStage, "id" | "node"> & {
    status?: DockerRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): DockerRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. CONTAINER FUNDAMENTALS
const CONTAINER_FUNDAMENTALS: DockerRoadmapSection = {
  id: "container-fundamentals",
  title: "Container Fundamentals",
  stages: [
    stage("Virtualization vs Containers", {
      status: "personal",
      left: [
        g(
          [
            n("Type-1 and Type-2 Hypervisors"),
            n("Guest OS Overhead & Boot Latency"),
            n("Shared Host Kernel Architecture"),
            n("Process-Level Isolation"),
          ],
          n("Virtual Machines vs Containers")
        ),
      ],
      right: [
        g(
          [
            n("OCI Image Specification"),
            n("OCI Runtime Specification (runc)"),
            n("OCI Distribution Specification"),
            n("containerd & CRI-O Runtimes"),
          ],
          n("Open Container Initiative (OCI)")
        ),
      ],
      noteAfter:
        "Containers are not lightweight virtual machines; they are isolated Linux host processes restricted by kernel namespaces and cgroups.",
    }),
    stage("Linux Kernel Primitives", {
      status: "personal",
      roadmapId: "skill-linux",
      left: [
        g(
          [
            n("PID Namespaces (Process isolation)"),
            n("NET Namespaces (Virtual interfaces & routing)"),
            n("MNT Namespaces (Filesystem mount points)"),
            n("IPC Namespaces (Inter-process memory)"),
            n("UTS Namespaces (Hostnames & NIS domain)"),
            n("USER Namespaces (Root remap & UID isolation)"),
          ],
          n("Kernel Namespaces")
        ),
      ],
      right: [
        g(
          [
            n("Cgroups v1 vs Cgroups v2 (unified hierarchy)"),
            n("Memory limits and OOM Killer triggers"),
            n("CPU shares, quotas & CFS periods"),
            n("Block I/O and PIDs limit controls"),
          ],
          n("Control Groups (cgroups)")
        ),
      ],
      projectIdea: "Explore namespaces and cgroups using unshare and /sys/fs/cgroup manually",
    }),
    stage("Container Architecture & Lifecycle", {
      left: [
        g(
          [
            n("Docker Engine & dockerd Daemon"),
            n("containerd Core Runtime"),
            n("containerd-shim Process Hand-off"),
            n("runc Low-Level OCI Runner"),
          ],
          n("Docker Engine Stack")
        ),
      ],
      right: [
        g(
          [
            n("Created state"),
            n("Running state"),
            n("Paused / Unpaused state"),
            n("Stopped / Exited state"),
            n("Dead / Removed state"),
          ],
          n("Container States & Lifecycle")
        ),
      ],
    }),
  ],
};

// 2. DOCKER CLI & BASIC OPERATIONS
const DOCKER_CLI_OPERATIONS: DockerRoadmapSection = {
  id: "docker-cli-operations",
  title: "Docker CLI & Basic Operations",
  stages: [
    stage("Container Execution & Control", {
      status: "personal",
      left: [
        g(
          [
            n("docker run (Interactive -it, Detached -d)"),
            n("docker create & docker start"),
            n("docker stop vs docker kill (SIGTERM vs SIGKILL)"),
            n("docker restart & restart policies"),
            n("docker rm & --rm flag for ephemeral containers"),
          ],
          n("Core Container Commands")
        ),
      ],
      right: [
        g(
          [
            n("docker exec -it for interactive shells"),
            n("docker logs (-f follow, --tail, --timestamps)"),
            n("docker ps (-a all, -q quiet, --filter)"),
            n("docker top & docker stats (live metrics)"),
            n("docker inspect (extract JSON metadata)"),
          ],
          n("Inspection & Debugging")
        ),
      ],
      noteAfter:
        "Mastering `docker exec`, `docker logs --tail`, and `docker inspect --format` is essential for diagnosing live container issues.",
    }),
    stage("Image Operations & Housekeeping", {
      left: [
        g(
          [
            n("docker pull & docker push (Registry interactions)"),
            n("docker images / docker image ls"),
            n("docker tag (Semantic versioning & registries)"),
            n("docker rmi / docker image rm"),
            n("docker history (Layer exploration)"),
          ],
          n("Image Management")
        ),
      ],
      right: [
        g(
          [
            n("docker system df (Disk space consumption)"),
            n("docker system prune -a --volumes"),
            n("docker builder prune (BuildKit cache sweep)"),
            n("Dangling images and dangling volumes"),
          ],
          n("Disk Cleanup & Maintenance")
        ),
      ],
      projectIdea: "Set up automated cron cleanup scripts for docker daemon storage",
    }),
  ],
};

// 3. DOCKERFILE & IMAGE OPTIMIZATION
const DOCKERFILE_AND_OPTIMIZATION: DockerRoadmapSection = {
  id: "dockerfile-and-optimization",
  title: "Dockerfile & Image Optimization",
  stages: [
    stage("Dockerfile Directives", {
      status: "personal",
      left: [
        g(
          [
            n("FROM & platform flags (--platform=linux/amd64)"),
            n("WORKDIR (Always declare absolute working dir)"),
            n("COPY vs ADD (Remote tar auto-extraction gotchas)"),
            n("RUN (Chaining commands with && to minimize layers)"),
            n("ENV vs ARG (Build-time vs runtime variables)"),
          ],
          n("Build Instructions")
        ),
      ],
      right: [
        g(
          [
            n("CMD vs ENTRYPOINT (Exec form vs Shell form)"),
            n("EXPOSE (Documentation vs actual port binding)"),
            n("USER (Switching away from root)"),
            n("VOLUME (Declaring mount points)"),
            n("HEALTHCHECK (Container health status checks)"),
          ],
          n("Runtime Instructions")
        ),
      ],
    }),
    stage("Image Optimization & Multi-Stage Builds", {
      status: "personal",
      left: [
        g(
          [
            n("Alpine Linux (Musl libc vs glibc nuances)", "alternative"),
            n("Debian/Ubuntu Slim Images", "personal"),
            n("Distroless Images (GoogleContainerTools)", "personal"),
            n("FROM scratch (Statically compiled Go/Rust)"),
          ],
          n("Base Image Selection")
        ),
      ],
      right: [
        g(
          [
            n("Multi-stage builds (Builder vs Final image)"),
            n("Layer caching order (Copy manifests before source)"),
            n(".dockerignore rules (.git, node_modules, logs)"),
            n("Docker BuildKit (DOCKER_BUILDKIT=1 & buildx)"),
            n("Cache mounts (--mount=type=cache)"),
          ],
          n("Layer Caching & Multi-Stage")
        ),
      ],
      noteAfter:
        "Always structure Dockerfile layers from least frequently changing (system dependencies) to most frequently changing (application source code) to maximize caching.",
      projectIdea:
        "Convert a bloated 1GB application image into a slim <50MB multi-stage production image",
    }),
  ],
};

// 4. STORAGE & NETWORKING
const STORAGE_AND_NETWORKING: DockerRoadmapSection = {
  id: "storage-and-networking",
  title: "Storage & Networking",
  stages: [
    stage("Persistent Storage & Volumes", {
      status: "personal",
      left: [
        g(
          [
            n("Named Volumes (Managed by Docker engine in /var/lib/docker)"),
            n("Bind Mounts (Direct host directory mapping for local dev)"),
            n("tmpfs Mounts (In-memory volatile storage for secrets)"),
            n("Volume drivers & Cloud storage plugins"),
          ],
          n("Storage Mount Types")
        ),
      ],
      right: [
        g(
          [
            n("Union Filesystem (UnionFS)"),
            n("overlay2 Storage Driver"),
            n("Copy-on-Write (CoW) strategy"),
            n("Read-only root filesystem (--read-only)"),
          ],
          n("Storage Mechanics & CoW")
        ),
      ],
    }),
    stage("Container Networking", {
      status: "personal",
      left: [
        g(
          [
            n("Bridge Network (Default docker0 vs custom bridge)"),
            n("Host Network (--net=host for raw network speed)"),
            n("Overlay Network (Multi-host Swarm/K8s clusters)"),
            n("Macvlan & IPvlan (Physical network device assignment)"),
            n("None Network (Complete network isolation)"),
          ],
          n("Network Drivers")
        ),
      ],
      right: [
        g(
          [
            n("Port mapping (-p host_port:container_port)"),
            n("Random host port assignment (-P)"),
            n("Embedded DNS server (127.0.0.11 on custom networks)"),
            n("Container-to-container name resolution"),
            n("iptables rules & packet routing by Docker"),
          ],
          n("Port Mapping & DNS Discovery")
        ),
      ],
      noteAfter:
        "Custom bridge networks provide automatic internal DNS resolution between containers by container name, whereas the default bridge network does not.",
      projectIdea: "Deploy an isolated multi-tier network with a reverse proxy, API, and database",
    }),
  ],
};

// 5. MULTI-CONTAINER ORCHESTRATION
const MULTI_CONTAINER_ORCHESTRATION: DockerRoadmapSection = {
  id: "multi-container-orchestration",
  title: "Multi-Container Orchestration",
  stages: [
    stage("Docker Compose Core", {
      status: "personal",
      left: [
        g(
          [
            n("docker compose up (-d detached, --build)"),
            n("docker compose down (-v remove volumes)"),
            n("docker compose ps & docker compose logs"),
            n("docker compose exec & run"),
            n("Docker Compose v2 (docker compose vs docker-compose v1)"),
          ],
          n("Compose CLI")
        ),
      ],
      right: [
        g(
          [
            n("Services block (image, build, command)"),
            n("Networks declaration & aliases"),
            n("Named Volumes declaration"),
            n("Secrets and Configs"),
            n("Multiple compose files (-f override pattern)"),
          ],
          n("Compose File Architecture")
        ),
      ],
    }),
    stage("Advanced Compose Patterns", {
      left: [
        g(
          [
            n(".env files & environment variable interpolation"),
            n("env_file directive for secrets management"),
            n("YAML anchors and extensions (& and <<: *anchor)"),
            n("Profiles (docker compose --profile debug up)"),
          ],
          n("Configuration & Profiles")
        ),
      ],
      right: [
        g(
          [
            n("depends_on with condition: service_healthy"),
            n("HEALTHCHECK test and intervals"),
            n("Restart policies (unless-stopped, on-failure)"),
            n("Resource reservations & limits in compose"),
          ],
          n("Healthchecks & Dependencies")
        ),
      ],
      noteAfter:
        "Using `depends_on` with `condition: service_healthy` ensures dependent microservices wait until upstream dependencies like databases are genuinely ready, not just started.",
      projectIdea:
        "Create a complete microservices stack with Redis, PostgreSQL, Node.js API, and Nginx using Docker Compose",
    }),
  ],
};

// 6. CONTAINER SECURITY & PRODUCTION BEST PRACTICES
const CONTAINER_SECURITY_AND_PRODUCTION: DockerRoadmapSection = {
  id: "container-security-and-production",
  title: "Container Security & Production Best Practices",
  stages: [
    stage("Least Privilege & Runtime Hardening", {
      status: "personal",
      roadmapId: "devsecops",
      left: [
        g(
          [
            n("Running as Non-Root User (USER 10001:10001)"),
            n("Dropping Linux capabilities (--cap-drop ALL)"),
            n("Granting minimal capabilities (--cap-add NET_BIND_SERVICE)"),
            n("Preventing privilege escalation (--security-opt no-new-privileges)"),
          ],
          n("Privilege Hardening")
        ),
      ],
      right: [
        g(
          [
            n("Read-only root filesystem (--read-only)"),
            n("Explicit tmpfs mounts for /tmp and /run"),
            n("Seccomp default & custom profiles"),
            n("AppArmor and SELinux enforcement"),
          ],
          n("Filesystem & Kernel Isolation")
        ),
      ],
    }),
    stage("Resource Limits & Vulnerability Scanning", {
      status: "personal",
      left: [
        g(
          [
            n("Memory limits (--memory and --memory-swap)"),
            n("CPU limits (--cpus or --cpu-quota)"),
            n("PID exhaustion prevention (--pids-limit)"),
            n("Log rotation drivers (json-file max-size/max-file)"),
          ],
          n("Resource Constraints & Quotas")
        ),
      ],
      right: [
        g(
          [
            n("Trivy CLI container image vulnerability scanner", "personal"),
            n("Snyk Container scanning in CI/CD pipelines", "alternative"),
            n("Docker Scout / Grype", "optional"),
            n("Docker Content Trust (DCT) & image signing with Cosign"),
            n("Software Bill of Materials (SBOM) generation (Syft)"),
          ],
          n("Vulnerability Scanning & SBOM")
        ),
      ],
      noteAfter:
        "Never run containers as root in production. Combine a non-root USER with --cap-drop ALL, --read-only rootfs, and rigorous CI vulnerability scanning with Trivy.",
      projectIdea:
        "Build a CI pipeline that builds, tests, scans with Trivy, and signs container images with Cosign",
    }),
  ],
};

export const DOCKER_SECTIONS: DockerRoadmapSection[] = [
  CONTAINER_FUNDAMENTALS,
  DOCKER_CLI_OPERATIONS,
  DOCKERFILE_AND_OPTIMIZATION,
  STORAGE_AND_NETWORKING,
  MULTI_CONTAINER_ORCHESTRATION,
  CONTAINER_SECURITY_AND_PRODUCTION,
];
