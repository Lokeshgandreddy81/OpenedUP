export type GoRoadmapStatus = "personal" | "alternative" | "optional";

export interface GoRoadmapNode {
  id: string;
  title: string;
  status?: GoRoadmapStatus;
  roadmapId?: string;
}

export interface GoRoadmapGroup {
  id: string;
  parent?: GoRoadmapNode;
  items: GoRoadmapNode[];
}

export interface GoRoadmapStage {
  id: string;
  node: GoRoadmapNode;
  left?: GoRoadmapGroup[];
  right?: GoRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface GoRoadmapSection {
  id: string;
  title?: string;
  stages: GoRoadmapStage[];
}

export interface GoRoadmapLink {
  label: string;
  roadmapId: string;
}

export const GO_MARKERS: Array<{
  status: GoRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const GO_RELATED_ROADMAPS: GoRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "PostgreSQL DBA", roadmapId: "postgresql" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
];

export const GO_CONTINUE_LEARNING: GoRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "DevOps Engineer", roadmapId: "devops" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: GoRoadmapStatus,
  roadmapId?: string,
  customId?: string
): GoRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (items: GoRoadmapNode[], parent?: GoRoadmapNode, customId?: string): GoRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<GoRoadmapStage, "id" | "node"> & {
    status?: GoRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): GoRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. GO SYNTAX & CORE BASICS
const GO_SYNTAX_AND_CORE_BASICS: GoRoadmapSection = {
  id: "go-syntax-and-core-basics",
  title: "Go Syntax & Core Basics",
  stages: [
    stage("Variables & Types", {
      status: "personal",
      left: [
        g(
          [
            n("Variable Declaration (var, :=)", "personal"),
            n("Constants & iota Enumerations"),
            n("Zero Values & Type Inference"),
            n("Type Conversion & Casting"),
          ],
          n("Declarations & Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Integers, Floats & Complex"),
            n("Booleans & Strings (UTF-8)"),
            n("Runes & Byte Slices"),
            n("Type Aliases & Custom Defined Types"),
          ],
          n("Primitive Data Types")
        ),
      ],
      noteAfter:
        "Go is statically typed and compiled. Master := short variable declarations and zero-value initialization guarantees.",
    }),
    stage("Control Flow & Functions", {
      left: [
        g(
          [
            n("if / else with Short Statements"),
            n("for Loops: Traditional, While-style, Infinite"),
            n("for range Iteration"),
            n("switch & Type Switches"),
          ],
          n("Flow Control")
        ),
      ],
      right: [
        g(
          [
            n("Multiple Return Values & Named Returns", "personal"),
            n("Variadic Functions (...T)"),
            n("Anonymous Functions & Closures"),
            n("defer Statement & Stack Execution", "personal"),
            n("init() Function Lifecycle"),
          ],
          n("Function Mechanics")
        ),
      ],
      projectIdea:
        "CLI Tool: Build a log file parser that categorizes errors using control flow and closures",
    }),
    stage("Modules & Package Management", {
      status: "personal",
      left: [
        g(
          [
            n("go mod init & go.mod File Structure", "personal"),
            n("go.sum & Checksum Database"),
            n("go get, go tidy, go vendor"),
            n("Semantic Versioning in Go Modules"),
          ],
          n("Dependency Management")
        ),
      ],
      right: [
        g(
          [
            n("Package Declaration & Imports"),
            n("Exported vs Unexported (Capitalization rule)"),
            n("Internal Packages (internal/)"),
            n("Standard Project Layout Structure"),
          ],
          n("Code Organization")
        ),
      ],
    }),
  ],
};

// 2. DATA STRUCTURES IN GO
const DATA_STRUCTURES_IN_GO: GoRoadmapSection = {
  id: "data-structures-in-go",
  title: "Data Structures in Go",
  stages: [
    stage("Arrays, Slices & Maps", {
      status: "personal",
      left: [
        g(
          [
            n("Fixed-size Arrays vs Dynamic Slices", "personal"),
            n("Slice Internals: Pointer, Len, Cap"),
            n("make(), append() & Re-allocation"),
            n("copy() Function & Memory Leaks"),
            n("Three-index Slicing (slice[i:j:k])"),
          ],
          n("Slices Deep Dive")
        ),
      ],
      right: [
        g(
          [
            n("Map Declaration & make(map[K]V)", "personal"),
            n("Comma-ok Idiom for Key Existence"),
            n("delete() & Map Clearing"),
            n("Non-thread-safe Nature of Maps"),
            n("sync.Map for Concurrent Access", "alternative"),
          ],
          n("Hash Maps")
        ),
      ],
      noteAfter:
        "Slices are headers referencing underlying arrays. Appending beyond capacity creates a new allocation and copies elements.",
    }),
    stage("Structs & Pointers", {
      status: "personal",
      left: [
        g(
          [
            n("Struct Declaration & Instantiation"),
            n("Struct Field Tags (json, db, yaml)", "personal"),
            n("Anonymous Structs"),
            n("Constructor Pattern (NewStruct functions)"),
          ],
          n("Custom Structs")
        ),
      ],
      right: [
        g(
          [
            n("Pointer Operator (&) and Dereference (*)", "personal"),
            n("Pass-by-value vs Pointer Semantics"),
            n("new() vs make() Differences"),
            n("Escape Analysis & Stack vs Heap Allocation"),
          ],
          n("Pointer Mechanics")
        ),
      ],
      projectIdea:
        "In-Memory Key-Value Store: Implement an LRU cache struct using pointers, slices, and maps",
    }),
  ],
};

// 3. OBJECT-ORIENTED PATTERNS & INTERFACES
const OBJECT_ORIENTED_AND_INTERFACES: GoRoadmapSection = {
  id: "object-oriented-and-interfaces",
  title: "Object-Oriented Patterns & Interfaces",
  stages: [
    stage("Interfaces & Composition", {
      status: "personal",
      left: [
        g(
          [
            n("Implicit Interface Satisfaction", "personal"),
            n("Small Interfaces Philosophy (io.Reader, io.Writer)"),
            n("Empty Interface (any / interface{})"),
            n("Interface Values: (type, value) Tuple"),
            n("Nil Interface vs Interface Containing Nil", "optional"),
          ],
          n("Interface Contracts")
        ),
      ],
      right: [
        g(
          [
            n("Struct Embedding (Composition)", "personal"),
            n("Promoted Fields & Methods"),
            n("Method Sets: Value vs Pointer Receivers"),
            n("Composition over Inheritance in Go"),
          ],
          n("Polymorphism via Composition")
        ),
      ],
      noteAfter:
        "In Go, interfaces are implemented implicitly without an implements keyword. Accept interfaces, return concrete structs.",
    }),
    stage("Type Assertions & Generics", {
      left: [
        g(
          [
            n("Type Assertions (v, ok := x.(T))", "personal"),
            n("Type Switches (switch v := x.(type))"),
            n("Reflection (reflect Package Basics)", "optional"),
          ],
          n("Dynamic Typing & Inspection")
        ),
      ],
      right: [
        g(
          [
            n("Type Parameters ([T any])", "personal"),
            n("comparable Constraint"),
            n("Custom Type Constraints (constraints.Ordered)"),
            n("Type Approximations (~T operator)"),
            n("Generic Data Structures (Queues, Trees)"),
          ],
          n("Generics (Go 1.18+)")
        ),
      ],
      projectIdea:
        "Generic Collections Library: Create a type-safe generic RingBuffer and ConcurrentQueue",
    }),
  ],
};

// 4. CONCURRENCY IN GO
const CONCURRENCY_IN_GO: GoRoadmapSection = {
  id: "concurrency-in-go",
  title: "Concurrency in Go",
  stages: [
    stage("Goroutines & Channels", {
      status: "personal",
      left: [
        g(
          [
            n("go Keyword & Lightweight Coroutines", "personal"),
            n("M:N Go Runtime Scheduler (G, M, P)"),
            n("Unbuffered Channels (Synchronization)", "personal"),
            n("Buffered Channels (Queuing)"),
            n("Unidirectional Channels (chan<- vs <-chan)"),
          ],
          n("Core Concurrency")
        ),
      ],
      right: [
        g(
          [
            n("select Statement Multiplexing", "personal"),
            n("Non-blocking Channel Ops with default"),
            n("Closing Channels & Range over Channels"),
            n("Nil Channel Behavior"),
            n("Preventing Goroutine Leaks"),
          ],
          n("Channel Patterns")
        ),
      ],
      noteAfter:
        "Do not communicate by sharing memory; instead, share memory by communicating. Avoid launching goroutines without termination control.",
    }),
    stage("Synchronization Primitives", {
      left: [
        g(
          [
            n("sync.WaitGroup (Add, Done, Wait)", "personal"),
            n("sync.Mutex & sync.RWMutex", "personal"),
            n("sync.Once for Thread-Safe Lazy Loading"),
            n("sync/atomic Primitives (AddInt64, CompareAndSwap)"),
            n("sync.Pool for Object Reuse & GC Tuning"),
          ],
          n("sync Package")
        ),
      ],
      right: [
        g(
          [
            n("Race Detector (go test -race)", "personal"),
            n("Worker Pool Pattern"),
            n("Fan-Out, Fan-In Concurrency Pattern"),
            n("Pipeline Pattern with Channels"),
            n("Rate Limiting (golang.org/x/time/rate)"),
          ],
          n("Concurrency Patterns")
        ),
      ],
      projectIdea:
        "High-Throughput Web Crawler: Worker pool scraping links concurrently with rate limiting and cancellation",
    }),
    stage("Context Package", {
      status: "personal",
      left: [
        g(
          [
            n("context.Background() & context.TODO()", "personal"),
            n("context.WithCancel() & Cancellation Signals"),
            n("context.WithTimeout() & Deadline Handling", "personal"),
            n("context.WithValue() Best Practices"),
          ],
          n("Context Lifecycle")
        ),
      ],
      right: [
        g(
          [
            n("HTTP Request Cancellation Propagation"),
            n("Database Query Timeout Propagation"),
            n("Graceful Server Shutdowns"),
          ],
          n("Production Application")
        ),
      ],
    }),
  ],
};

// 5. STANDARD LIBRARY & NETWORKING
const STANDARD_LIBRARY_AND_NETWORKING: GoRoadmapSection = {
  id: "standard-library-and-networking",
  title: "Standard Library & Networking",
  stages: [
    stage("net/http & Web Primitives", {
      status: "personal",
      left: [
        g(
          [
            n("http.Server & ListenAndServe", "personal"),
            n("http.Handler & http.HandlerFunc"),
            n("http.ServeMux (Go 1.22+ routing enhancements)"),
            n("Custom Middleware Chaining"),
            n("http.Client & Transport Configuration"),
          ],
          n("HTTP Server & Client")
        ),
      ],
      right: [
        g(
          [
            n("encoding/json: Marshal & Unmarshal", "personal"),
            n("json.Decoder / json.Encoder for Streams"),
            n("Custom Marshaler (json.Marshaler)"),
            n("Handling Dynamic JSON payloads"),
          ],
          n("JSON Encoding & Decoding")
        ),
      ],
      noteAfter:
        "Go has one of the strongest standard libraries in modern computing. An entire production-grade HTTP API can be written with zero third-party dependencies.",
    }),
    stage("I/O, OS Primitives & CLI", {
      left: [
        g(
          [
            n("io.Reader, io.Writer & io.Copy", "personal"),
            n("os.File, os.Open, os.Create"),
            n("bufio Scanner & Buffered I/O"),
            n("filepath Package for Cross-Platform Paths"),
          ],
          n("I/O & File Operations")
        ),
      ],
      right: [
        g(
          [
            n("flag Package for Command-line Flags"),
            n("os.Getenv & Environment Variables"),
            n("os/signal for SIGTERM / SIGINT Interception", "personal"),
            n("spf13/cobra & viper for Advanced CLIs", "alternative"),
          ],
          n("System & OS Integration")
        ),
      ],
    }),
    stage("Testing & Benchmarking", {
      status: "personal",
      left: [
        g(
          [
            n("testing Package Conventions (*_test.go)", "personal"),
            n("Table-Driven Tests Pattern", "personal"),
            n("t.Run Subtests & Parallel Tests (t.Parallel)"),
            n("Test Fixtures & TestMain"),
            n("stretchr/testify (assert & require)", "alternative"),
          ],
          n("Unit Testing")
        ),
      ],
      right: [
        g(
          [
            n("Benchmark Functions (testing.B)", "personal"),
            n("b.ReportAllocs & Allocation Profiling"),
            n("go test -bench & -benchmem"),
            n("Fuzz Testing (go test -fuzz)"),
            n("Code Coverage (go test -cover)"),
          ],
          n("Benchmarking & Profiling")
        ),
      ],
      projectIdea:
        "Production REST API: Fully tested HTTP microservice with table-driven tests, race detection, and benchmarks",
    }),
  ],
};

// 6. WEB FRAMEWORKS & MICROSERVICES
const WEB_FRAMEWORKS_AND_MICROSERVICES: GoRoadmapSection = {
  id: "web-frameworks-and-microservices",
  title: "Web Frameworks & Microservices",
  stages: [
    stage("Web Routing & Frameworks", {
      status: "personal",
      left: [
        g(
          [
            n("Gin Web Framework", "personal"),
            n("Echo Framework", "alternative"),
            n("Fiber (fasthttp based)", "alternative"),
            n("chi Lightweight Idiomatic Router", "personal"),
          ],
          n("Web Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Request Binding & Validation (validator.v10)", "personal"),
            n("CORS & Security Headers Middleware"),
            n("JWT Authentication Middleware"),
            n("Error Handling & Centralized Response Formatter"),
          ],
          n("API Infrastructure")
        ),
      ],
    }),
    stage("Databases, SQL & ORMs", {
      left: [
        g(
          [
            n("database/sql & Connection Pooling", "personal"),
            n("sqlx: Extensions for Struct Scanning", "personal"),
            n("pgx (High-performance PostgreSQL Driver)", "personal"),
            n("Database Migrations (golang-migrate, goose)"),
          ],
          n("Relational Databases")
        ),
      ],
      right: [
        g(
          [
            n("GORM (Feature-rich Go ORM)", "alternative"),
            n("sqlc (Compile-time Type-Safe SQL from queries)", "personal"),
            n("Redis Client (go-redis)", "personal"),
            n("MongoDB Driver (mongo-go-driver)", "optional"),
          ],
          n("ORMs & Data Stores")
        ),
      ],
      noteAfter:
        "While GORM is beginner-friendly, idiomatic Go teams often favor sqlc or sqlx for explicit SQL control and compile-time type safety.",
    }),
    stage("gRPC, Microservices & Production", {
      status: "personal",
      left: [
        g(
          [
            n("Protocol Buffers (.proto Syntax)", "personal"),
            n("protoc & protoc-gen-go Compiler"),
            n("gRPC Server & Client Implementation", "personal"),
            n("gRPC Streaming (Unary, Client, Server, Bidirectional)"),
            n("gRPC Interceptors for Auth & Tracing"),
          ],
          n("gRPC & RPC Protocols")
        ),
      ],
      right: [
        g(
          [
            n("Structured Logging with slog (standard in Go 1.21+)", "personal"),
            n("uber-go/zap for Blazing Fast Logging", "alternative"),
            n("Prometheus Metrics & Health Checks"),
            n("OpenTelemetry Distributed Tracing"),
            n("Multi-stage Docker Builds for Tiny Images (scratch/alpine)", "personal"),
          ],
          n("Production Observability & Deployment")
        ),
      ],
      projectIdea:
        "Distributed Task Queue: gRPC worker service with PostgreSQL persistence, Redis pub/sub, slog logging, and Docker deployment",
    }),
  ],
};

export const GO_SECTIONS: GoRoadmapSection[] = [
  GO_SYNTAX_AND_CORE_BASICS,
  DATA_STRUCTURES_IN_GO,
  OBJECT_ORIENTED_AND_INTERFACES,
  CONCURRENCY_IN_GO,
  STANDARD_LIBRARY_AND_NETWORKING,
  WEB_FRAMEWORKS_AND_MICROSERVICES,
];
