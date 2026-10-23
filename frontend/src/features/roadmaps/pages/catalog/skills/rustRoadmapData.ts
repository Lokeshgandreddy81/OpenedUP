export type RustRoadmapStatus = "personal" | "alternative" | "optional";

export interface RustRoadmapNode {
  id: string;
  title: string;
  status?: RustRoadmapStatus;
  roadmapId?: string;
}

export interface RustRoadmapGroup {
  id: string;
  parent?: RustRoadmapNode;
  items: RustRoadmapNode[];
}

export interface RustRoadmapStage {
  id: string;
  node: RustRoadmapNode;
  left?: RustRoadmapGroup[];
  right?: RustRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface RustRoadmapSection {
  id: string;
  title?: string;
  stages: RustRoadmapStage[];
}

export interface RustRoadmapLink {
  label: string;
  roadmapId: string;
}

export const RUST_MARKERS: Array<{
  status: RustRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const RUST_RELATED_ROADMAPS: RustRoadmapLink[] = [
  { label: "C Programming", roadmapId: "skill-c-programming" },
  { label: "C++ Roadmap", roadmapId: "skill-cpp" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
];

export const RUST_CONTINUE_LEARNING: RustRoadmapLink[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: RustRoadmapStatus,
  roadmapId?: string,
  customId?: string
): RustRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: RustRoadmapNode[],
  parent?: RustRoadmapNode,
  customId?: string
): RustRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<RustRoadmapStage, "id" | "node"> & {
    status?: RustRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): RustRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. RUST BASICS & SYNTAX
const RUST_BASICS_AND_SYNTAX: RustRoadmapSection = {
  id: "rust-basics-and-syntax",
  title: "Rust Basics & Syntax",
  stages: [
    stage("Introduction & Toolchain", {
      left: [
        g(
          [
            n("rustup (Toolchain Installer)", "personal"),
            n("rustc (The Rust Compiler)"),
            n("cargo (Build System & Package Manager)", "personal"),
            n("rust-analyzer (Language Server for IDEs)", "personal"),
          ],
          n("Toolchain Setup")
        ),
      ],
      right: [
        g(
          [
            n("Memory Safety without GC"),
            n("Zero-Cost Abstractions"),
            n("Fearless Concurrency"),
            n("Rich Type System & Modern Tooling"),
          ],
          n("Rust Philosophy")
        ),
      ],
      noteAfter:
        "Rust was designed by Graydon Hoare at Mozilla and debuted in 2010. It delivers C/C++ performance with guaranteed memory safety at compile-time without a garbage collector.",
    }),
    stage("Variables & Mutability", {
      left: [
        g(
          [
            n("Immutable by default (let x = 5;)", "personal"),
            n("Mutable variables (let mut x = 5;)", "personal"),
            n("Constants (const MAX_POINTS: u32 = 100_000;)"),
            n("Variable Shadowing (let x = x + 1;)"),
          ],
          n("Bindings & Mutability")
        ),
      ],
      right: [
        g(
          [
            n("Scalar Types (i8..i128, u8..u128, isize, usize)"),
            n("Floating-point (f32, f64)"),
            n("Boolean (bool: true / false)"),
            n("Character (char - 4 bytes Unicode)"),
            n("Compound Types (Tuples & Fixed Arrays [T; N])"),
          ],
          n("Primitive Data Types")
        ),
      ],
    }),
    stage("Functions & Control Flow", {
      left: [
        g(
          [
            n("Function Signatures (fn name(x: i32) -> i32)"),
            n("Expressions vs Statements (Implicit returns)", "personal"),
            n("Closures (|x| x + 1) with Move semantics"),
          ],
          n("Functions & Closures")
        ),
      ],
      right: [
        g(
          [
            n("if / else as expressions (let num = if c { 1 } else { 2 };)"),
            n("loop with break value returning"),
            n("while conditional loop"),
            n("for ... in collection iterator"),
          ],
          n("Control Flow")
        ),
      ],
      projectIdea:
        "Project: Implement a CLI guessing game or Roman numeral converter using expressions, loops, and terminal I/O",
    }),
  ],
};

// 2. OWNERSHIP, BORROWING & LIFETIMES
const OWNERSHIP_BORROWING_AND_LIFETIMES: RustRoadmapSection = {
  id: "ownership-borrowing-and-lifetimes",
  title: "Ownership, Borrowing & Lifetimes",
  stages: [
    stage("Ownership Rules", {
      left: [
        g(
          [
            n("Rule 1: Each value has an owner"),
            n("Rule 2: There can only be one owner at a time"),
            n("Rule 3: When owner goes out of scope, value is dropped"),
          ],
          n("The 3 Ownership Rules")
        ),
      ],
      right: [
        g(
          [
            n("Stack vs Heap allocation"),
            n("Move Semantics (Ownership transfer)"),
            n("Copy Trait (Deep copy for primitives)"),
            n("Clone Trait (Explicit deep clone)", "personal"),
            n("Drop Trait & RAII Resource Cleanup"),
          ],
          n("Memory Semantics")
        ),
      ],
      noteAfter:
        "Ownership is Rust's most unique feature. It enables deterministic memory management without manual malloc/free and without runtime garbage collector pauses.",
    }),
    stage("Borrowing & References", {
      left: [
        g(
          [
            n("Immutable References (&T)", "personal"),
            n("Mutable References (&mut T)", "personal"),
            n("Aliasing XOR Mutability rule"),
            n("Dangling reference prevention"),
          ],
          n("The Borrow Checker")
        ),
      ],
      right: [
        g(
          [
            n("String Slices (&str vs String)", "personal"),
            n("Array / Vector Slices (&[T])"),
            n("Fat Pointers (pointer + length)"),
            n("Zero-copy slice manipulation"),
          ],
          n("Slice Types")
        ),
      ],
    }),
    stage("Lifetimes", {
      left: [
        g(
          [
            n("Lifetime Syntax ('a, 'b)", "personal"),
            n("Lifetimes in Function Signatures (fn foo<'a>(x: &'a str))"),
            n("Lifetimes in Struct Definitions (struct Ref<'a>)"),
          ],
          n("Lifetime Annotations")
        ),
      ],
      right: [
        g(
          [
            n("The 3 Lifetime Elision Rules"),
            n("The Static Lifetime ('static)"),
            n("Anonymous Lifetimes ('_)"),
            n("Subtyping & Variance"),
          ],
          n("Advanced Lifetime Concepts")
        ),
      ],
      noteAfter:
        "Lifetimes ensure that references remain valid for as long as needed and never outlive the underlying data they point to, eliminating use-after-free bugs entirely.",
      projectIdea:
        "Project: Build a zero-copy string tokenizer and parser that returns slices (&str) of input text without heap allocations",
    }),
  ],
};

// 3. STRUCTS, ENUMS & PATTERN MATCHING
const STRUCTS_ENUMS_AND_PATTERNS: RustRoadmapSection = {
  id: "structs-enums-and-patterns",
  title: "Structs, Enums & Pattern Matching",
  stages: [
    stage("Structs & Implementation", {
      left: [
        g(
          [
            n("Named-field structs"),
            n("Tuple structs (struct Color(i32, i32, i32);)"),
            n("Unit-like structs (struct Marker;)"),
            n("Struct update syntax (..base)"),
          ],
          n("Struct Types")
        ),
      ],
      right: [
        g(
          [
            n("impl blocks"),
            n("Methods (&self, &mut self, self)"),
            n("Associated Functions (Self::new() constructor)", "personal"),
            n("Multiple impl blocks"),
          ],
          n("Methods & Associated Functions")
        ),
      ],
    }),
    stage("Enums & Null Safety", {
      left: [
        g(
          [
            n("Enums with Data (Tagged Unions)", "personal"),
            n("State machines modeled with Enums"),
            n("Option<T> (Some(v) vs None)", "personal"),
            n("No Null Pointer Exceptions in Safe Rust"),
          ],
          n("Algebraic Data Types")
        ),
      ],
      right: [
        g(
          [
            n("Result<T, E> (Ok(v) vs Err(e))", "personal"),
            n("Option / Result Combinators (map, and_then, unwrap_or)"),
            n("is_some, is_none, is_ok, is_err checks"),
          ],
          n("Option & Result Types")
        ),
      ],
    }),
    stage("Pattern Matching", {
      left: [
        g(
          [
            n("match keyword with exhaustiveness check", "personal"),
            n("Matching literals, ranges & multiple patterns (1 | 2)"),
            n("Match Guards (if condition)"),
            n("The catch-all pattern (_)"),
          ],
          n("Exhaustive Matching")
        ),
      ],
      right: [
        g(
          [
            n("if let expressions", "personal"),
            n("while let loops"),
            n("let else statements (early return)", "personal"),
            n("Destructuring Structs, Tuples, and Enums"),
          ],
          n("Pattern Destructuring")
        ),
      ],
      noteAfter:
        "Rust's pattern matching is exhaustive at compile-time: if you forget to handle a case in an enum, the compiler will refuse to build.",
      projectIdea:
        "Project: Create a JSON-like parser and evaluation engine representing dynamic values (Object, Array, String, Number, Bool, Null) via an Enum",
    }),
  ],
};

// 4. ERROR HANDLING
const ERROR_HANDLING: RustRoadmapSection = {
  id: "error-handling",
  title: "Error Handling",
  stages: [
    stage("Recoverable vs Unrecoverable", {
      left: [
        g(
          [
            n("panic! macro"),
            n("Stack Unwinding vs Aborting (panic = 'abort')"),
            n("assert!, assert_eq!, debug_assert!"),
            n("unreachable! and todo! markers"),
          ],
          n("Unrecoverable Errors")
        ),
      ],
      right: [
        g(
          [
            n("Result<T, E> handling", "personal"),
            n("The ? Operator for error propagation", "personal"),
            n("Custom Error Enums (impl std::error::Error)"),
            n("From trait conversions for errors"),
          ],
          n("Recoverable Errors")
        ),
      ],
      noteAfter:
        "The ? operator unpacks Ok(val) or returns Err(From::from(err)) immediately from the enclosing function, drastically reducing boilerplate error handling code.",
    }),
    stage("Modern Error Libraries", {
      left: [
        g(
          [
            n("thiserror crate (Library Error Derivation)", "personal"),
            n("#[derive(Error)] macro"),
            n('#[error("... {field}")] formatting'),
            n("#[from] source error wrapping"),
          ],
          n("Library Errors: thiserror")
        ),
      ],
      right: [
        g(
          [
            n("anyhow crate (Application Error Handling)", "personal"),
            n("anyhow::Result<T>"),
            n("bail! and ensure! macros"),
            n('.context("Failed to read file") chaining', "personal"),
          ],
          n("Application Errors: anyhow")
        ),
      ],
      projectIdea:
        "Project: Build a command-line file encryption utility with rich domain errors using thiserror for the library core and anyhow for the CLI driver",
    }),
  ],
};

// 5. GENERICS, TRAITS & ADVANCED TYPES
const GENERICS_TRAITS_AND_TYPES: RustRoadmapSection = {
  id: "generics-traits-and-types",
  title: "Generics, Traits & Advanced Types",
  stages: [
    stage("Generics & Trait Bounds", {
      left: [
        g(
          [
            n("Generic Functions, Structs, and Enums"),
            n("Monomorphization (Zero Runtime Overhead)", "personal"),
            n("Const Generics ([T; N])"),
          ],
          n("Generics")
        ),
      ],
      right: [
        g(
          [
            n("Trait Bounds (T: Display + Clone)", "personal"),
            n("where Clauses for complex bounds"),
            n("impl Trait syntax (parameters & return types)"),
          ],
          n("Trait Bounds")
        ),
      ],
    }),
    stage("Traits & Derive Macros", {
      left: [
        g(
          [
            n("trait definitions & default methods"),
            n("Standard Traits: Debug, Display, Clone, Copy, Default"),
            n("Comparison Traits: PartialEq, Eq, PartialOrd, Ord"),
            n("Marker Traits: Send and Sync"),
          ],
          n("Core Traits")
        ),
      ],
      right: [
        g(
          [
            n("#[derive(...)] attribute macro", "personal"),
            n("serde (Serialize & Deserialize)", "personal"),
            n("Operator Overloading via std::ops"),
            n("Drop Trait implementation"),
          ],
          n("Derive & Operator Overloading")
        ),
      ],
    }),
    stage("Dynamic Dispatch & Advanced Types", {
      left: [
        g(
          [
            n("Static Dispatch (T: Trait - inlined at compile time)"),
            n("Dynamic Dispatch (dyn Trait objects)", "personal"),
            n("Trait object safety rules"),
            n("Box<dyn Trait> and vtables"),
          ],
          n("Static vs Dynamic Dispatch")
        ),
      ],
      right: [
        g(
          [
            n("Associated Types (type Item;)"),
            n("Newtype Pattern & Type Aliases"),
            n("Deref and DerefMut Coercion"),
            n("Declarative (macro_rules!) & Procedural Macros"),
          ],
          n("Advanced Types & Macros")
        ),
      ],
      noteAfter:
        "Static dispatch via monomorphization generates specialized copies of code with zero runtime cost, while dynamic dispatch with dyn Trait allows runtime polymorphism via vtables.",
    }),
  ],
};

// 6. CONCURRENCY & ASYNC RUST
const CONCURRENCY_AND_ASYNC: RustRoadmapSection = {
  id: "concurrency-and-async",
  title: "Concurrency & Async Rust",
  stages: [
    stage("Fearless Concurrency", {
      left: [
        g(
          [
            n("std::thread::spawn", "personal"),
            n("Scoped Threads (std::thread::scope)"),
            n("Message Passing: std::sync::mpsc channels", "personal"),
            n("crossbeam channel (High performance)", "alternative"),
          ],
          n("Threads & Channels")
        ),
      ],
      right: [
        g(
          [
            n("Arc<T> (Atomic Reference Counting)", "personal"),
            n("Mutex<T> (Mutual Exclusion)", "personal"),
            n("RwLock<T> (Read-Write Lock)"),
            n("Atomics (std::sync::atomic)"),
          ],
          n("Shared State Concurrency")
        ),
      ],
      noteAfter:
        "The compiler guarantees that multi-threaded code won't have data races: types must implement Send to be moved across threads and Sync to be shared across threads.",
    }),
    stage("Async Rust & Tokio", {
      left: [
        g(
          [
            n("async fn and .await syntax", "personal"),
            n("Future Trait & Poll-based Model"),
            n("Pin and Unpin types"),
            n("Streams (Async Iterator)"),
          ],
          n("Async Foundations")
        ),
      ],
      right: [
        g(
          [
            n("Tokio Runtime (#[tokio::main])", "personal"),
            n("tokio::spawn lightweight tasks", "personal"),
            n("tokio::select! macro"),
            n("Async I/O, TCP sockets & timers"),
          ],
          n("Tokio Ecosystem")
        ),
      ],
      projectIdea:
        "Project: Build a high-throughput multi-threaded TCP chat server or async HTTP proxy with Tokio and Mutex/Arc",
    }),
  ],
};

// 7. CARGO & RUST ECOSYSTEM
const CARGO_AND_ECOSYSTEM: RustRoadmapSection = {
  id: "cargo-and-ecosystem",
  title: "Cargo & Rust Ecosystem",
  stages: [
    stage("Cargo & Crates", {
      left: [
        g(
          [
            n("Cargo.toml and Cargo.lock", "personal"),
            n("Crates.io dependency management", "personal"),
            n("Cargo Workspaces (Monorepo support)"),
            n("Feature flags (default-features & optional)"),
          ],
          n("Cargo Package Manager")
        ),
      ],
      right: [
        g(
          [
            n("cargo test (Unit, Integration & Doc tests)", "personal"),
            n("cargo clippy (Strict linter)", "personal"),
            n("rustfmt (Code formatting standard)", "personal"),
            n("Criterion (Benchmarking)"),
          ],
          n("Testing & Code Quality")
        ),
      ],
    }),
    stage("Web & Systems Ecosystem", {
      left: [
        g(
          [
            n("Axum (Ergonomic web framework)", "personal"),
            n("Actix-Web (High performance web framework)", "alternative"),
            n("SQLx (Compile-time checked SQL queries)", "personal"),
            n("Diesel (Compile-time ORM)", "alternative"),
          ],
          n("Web & Backend")
        ),
      ],
      right: [
        g(
          [
            n("Rayon (Data-parallelism)", "personal"),
            n("Clap (Command-line argument parser)", "personal"),
            n("Tracing (Structured logging)", "personal"),
            n("Wasm-bindgen / WebAssembly"),
          ],
          n("CLI & Utilities")
        ),
      ],
    }),
    stage("Unsafe Rust & FFI", {
      left: [
        g(
          [
            n("Raw Pointers (*const T, *mut T)"),
            n("unsafe blocks and functions"),
            n("Calling unsafe methods & Dereferencing"),
            n("Miri (Undefined behavior detection)", "personal"),
          ],
          n("Unsafe Rust")
        ),
      ],
      right: [
        g(
          [
            n("FFI (Foreign Function Interface)"),
            n('extern "C" ABI'),
            n("bindgen (Automatic C bindings)"),
            n("PyO3 (Rust extensions for Python)"),
          ],
          n("C Interop & Bindings")
        ),
      ],
      noteAfter:
        "Unsafe Rust is not 'bad code'—it is a superpower for writing OS kernels, allocators, and hardware drivers where the developer manually upholds safety invariants checked by tools like Miri.",
      projectIdea:
        "Project: Build a high-performance REST API with Axum, SQLx, Tokio, and Docker, covered by integration tests and Clippy in CI",
    }),
  ],
};

export const RUST_SECTIONS: RustRoadmapSection[] = [
  RUST_BASICS_AND_SYNTAX,
  OWNERSHIP_BORROWING_AND_LIFETIMES,
  STRUCTS_ENUMS_AND_PATTERNS,
  ERROR_HANDLING,
  GENERICS_TRAITS_AND_TYPES,
  CONCURRENCY_AND_ASYNC,
  CARGO_AND_ECOSYSTEM,
];
