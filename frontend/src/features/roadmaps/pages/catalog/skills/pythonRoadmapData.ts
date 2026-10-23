export type PythonRoadmapStatus = "personal" | "alternative" | "optional";

export interface PythonRoadmapNode {
  id: string;
  title: string;
  status?: PythonRoadmapStatus;
  roadmapId?: string;
}

export interface PythonRoadmapGroup {
  id: string;
  parent?: PythonRoadmapNode;
  items: PythonRoadmapNode[];
}

export interface PythonRoadmapStage {
  id: string;
  node: PythonRoadmapNode;
  left?: PythonRoadmapGroup[];
  right?: PythonRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface PythonRoadmapSection {
  id: string;
  title?: string;
  stages: PythonRoadmapStage[];
}

export interface PythonRoadmapLink {
  label: string;
  roadmapId: string;
}

export const PYTHON_MARKERS: Array<{
  status: PythonRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const PYTHON_RELATED_ROADMAPS: PythonRoadmapLink[] = [
  { label: "Python for Data Analysis", roadmapId: "skill-python-data-analysis" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "AI Engineer Roadmap", roadmapId: "ai-engineer" },
  { label: "Django Roadmap", roadmapId: "skill-django" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "API Design Roadmap", roadmapId: "skill-api-design" },
];

export const PYTHON_CONTINUE_LEARNING: PythonRoadmapLink[] = [
  { label: "Python for Data Analysis", roadmapId: "skill-python-data-analysis" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "AI & Data Scientist", roadmapId: "ai-and-data-scientist" },
  { label: "Django Roadmap", roadmapId: "skill-django" },
  { label: "Machine Learning", roadmapId: "machine-learning" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: PythonRoadmapStatus,
  roadmapId?: string,
  customId?: string
): PythonRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: PythonRoadmapNode[],
  parent?: PythonRoadmapNode,
  customId?: string
): PythonRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<PythonRoadmapStage, "id" | "node"> & {
    status?: PythonRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): PythonRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. PYTHON FUNDAMENTALS
const PYTHON_FUNDAMENTALS: PythonRoadmapSection = {
  id: "python-fundamentals",
  title: "Python Fundamentals",
  stages: [
    stage("Introduction & Setup", {
      left: [
        g(
          [n("VS Code", "personal"), n("PyCharm", "alternative"), n("Neovim / Vim", "optional")],
          n("Editors & IDEs")
        ),
      ],
      right: [
        g(
          [
            n("CPython (Standard)", "personal"),
            n("PyPy (JIT Accelerated)", "alternative"),
            n("Interactive REPL / IPython", "personal"),
          ],
          n("Python Runtimes")
        ),
      ],
      noteAfter:
        "Python is a high-level, general-purpose interpreted language known for its emphasis on code readability (PEP 20 - The Zen of Python). It powers web development, automation, scientific computing, data science, and modern AI systems.",
    }),
    stage("Variables & Data Types", {
      left: [
        g(
          [
            n("integers (int)"),
            n("floating point (float)"),
            n("booleans (bool: True, False)"),
            n("strings (str, Unicode)"),
            n("NoneType (None)"),
          ],
          n("Primitive Types")
        ),
      ],
      right: [
        g(
          [
            n("Dynamic Typing & Re-binding"),
            n("Type Casting (int(), float(), str())"),
            n("Mutable vs Immutable Objects"),
            n("Identity (is) vs Equality (==)"),
          ],
          n("Variables & Identity")
        ),
      ],
    }),
    stage("Control Flow", {
      left: [
        g(
          [
            n("if, elif, else branches"),
            n("Ternary conditional expressions"),
            n("Truthy & Falsy evaluation"),
          ],
          n("Conditionals")
        ),
      ],
      right: [
        g(
          [
            n("for ... in loops"),
            n("while loops"),
            n("break, continue, and else in loops"),
            n("Structural Pattern Matching (match-case)", "personal"),
          ],
          n("Loops & Matching")
        ),
      ],
    }),
    stage("Functions & Scope", {
      left: [
        g(
          [
            n("def keyword & return statements"),
            n("Positional & Keyword Arguments"),
            n("Arbitrary Arguments (*args, **kwargs)"),
            n("Default parameter gotchas (mutable defaults)"),
          ],
          n("Function Basics")
        ),
      ],
      right: [
        g(
          [
            n("LEGB Scope (Local, Enclosing, Global, Built-in)"),
            n("global & nonlocal keywords"),
            n("Lambda functions"),
            n("Docstrings & PEP 257"),
          ],
          n("Scope & Closures")
        ),
      ],
    }),
    stage("Exception Handling", {
      left: [
        g(
          [
            n("try, except, else, finally blocks"),
            n("Catching specific exceptions"),
            n("raise statement"),
            n("Built-in Exception Hierarchy (BaseException)"),
          ],
          n("Handling Errors")
        ),
      ],
      right: [
        g(
          [
            n("Custom Exception Classes"),
            n("Exception Chaining (raise ... from)"),
            n("warnings module"),
          ],
          n("Advanced Exception Patterns")
        ),
      ],
      projectIdea:
        "Build a robust CLI expense tracking application that validates user inputs, catches file I/O errors, and writes formatted logs.",
    }),
  ],
};

// 2. DATA STRUCTURES & ALGORITHMS
const DATA_STRUCTURES_AND_ALGORITHMS: PythonRoadmapSection = {
  id: "data-structures-and-algorithms",
  title: "Data Structures & Algorithms",
  stages: [
    stage("Built-in Collections", {
      left: [
        g(
          [
            n("Lists (Dynamic arrays, indexing, slicing)"),
            n("Tuples (Immutable sequences, unpacking)"),
            n("Strings as immutable sequences"),
            n("range() generator objects"),
          ],
          n("Sequence Types")
        ),
      ],
      right: [
        g(
          [
            n("Dictionaries (Key-value hash maps, dict methods)"),
            n("Sets & Frozensets (Hash sets, set operations)"),
            n("Time Complexity of Python Built-ins", undefined, "skill-dsa"),
          ],
          n("Mapping & Set Types")
        ),
      ],
    }),
    stage("Comprehensions & Iterators", {
      left: [
        g(
          [
            n("List Comprehensions", "personal"),
            n("Dictionary Comprehensions"),
            n("Set Comprehensions"),
            n("Nested Comprehensions"),
          ],
          n("Comprehensions")
        ),
      ],
      right: [
        g(
          [
            n("Iterators & Iterables (__iter__, __next__)"),
            n("Generator Functions (yield keyword)", "personal"),
            n("Generator Expressions (lazy evaluation)"),
            n("itertools module (chain, cycle, islice)"),
          ],
          n("Generators & Iteration")
        ),
      ],
    }),
    stage("Collections Module & Specialized Structures", {
      left: [
        g(
          [
            n("collections.defaultdict", "personal"),
            n("collections.Counter", "personal"),
            n("collections.deque (Double-ended queue)", "personal"),
            n("collections.OrderedDict", "optional"),
          ],
          n("collections Module")
        ),
      ],
      right: [
        g(
          [
            n("collections.namedtuple"),
            n("dataclasses module (Python 3.7+)", "personal"),
            n("heapq (Priority queue algorithm)"),
            n("bisect (Array bisection / binary search)"),
          ],
          n("Specialized Structures")
        ),
      ],
      projectIdea:
        "Implement an in-memory Least Recently Used (LRU) Cache using collections.deque and dictionaries with automatic key expiration.",
    }),
  ],
};

// 3. OBJECT-ORIENTED & ADVANCED PYTHON
const OOP_AND_ADVANCED_PYTHON: PythonRoadmapSection = {
  id: "oop-and-advanced-python",
  title: "Object-Oriented & Advanced Python",
  stages: [
    stage("Classes & Inheritance", {
      left: [
        g(
          [
            n("class syntax & __init__ constructor"),
            n("Instance vs Class Attributes"),
            n("@classmethod & @staticmethod", "personal"),
            n("Private & protected conventions (_ vs __ name mangling)"),
          ],
          n("OOP Foundations")
        ),
      ],
      right: [
        g(
          [
            n("Single & Multiple Inheritance"),
            n("super() & MRO (Method Resolution Order)"),
            n("Duck Typing & Polymorphism"),
            n("abc module (Abstract Base Classes)"),
          ],
          n("Inheritance & Abstraction")
        ),
      ],
    }),
    stage("Dunder Methods & Data Model", {
      left: [
        g(
          [
            n("__str__ vs __repr__ (Representation)"),
            n("__eq__, __hash__, __lt__ (Comparisons)"),
            n("__len__, __getitem__, __setitem__ (Sequences)"),
            n("__call__ (Callable class instances)"),
          ],
          n("Magic / Dunder Methods")
        ),
      ],
      right: [
        g(
          [
            n("Properties (@property, @setter, @deleter)"),
            n("Descriptor Protocol (__get__, __set__, __delete__)"),
            n("__getattr__ vs __getattribute__"),
            n("__slots__ (Memory & attribute optimization)"),
          ],
          n("Descriptors & Attribute Access")
        ),
      ],
    }),
    stage("Decorators & Context Managers", {
      left: [
        g(
          [
            n("Function Decorators syntax (@decorator)", "personal"),
            n("Decorators with arguments (closure factories)"),
            n("functools.wraps (Metadata preservation)", "personal"),
            n("Class-based Decorators"),
          ],
          n("Decorators")
        ),
      ],
      right: [
        g(
          [
            n("with statement & context protocol"),
            n("__enter__ and __exit__ methods"),
            n("contextlib.contextmanager generator utility", "personal"),
            n("contextlib.ExitStack"),
          ],
          n("Context Managers")
        ),
      ],
    }),
    stage("Metaclasses & Type Hinting", {
      left: [
        g(
          [
            n("type as a class factory"),
            n("Custom Metaclasses (__new__, __init__)"),
            n("__init_subclass__ hook (Python 3.6+)", "personal"),
            n("inspect module (Runtime introspection)"),
          ],
          n("Metaprogramming")
        ),
      ],
      right: [
        g(
          [
            n("Type Annotations (PEP 484)", "personal"),
            n("typing module (Union, Optional, Any, Callable)"),
            n("Generics (TypeVar, Generic[T])"),
            n("Pydantic for schema validation", "personal"),
          ],
          n("Type Hinting")
        ),
      ],
      projectIdea:
        "Build a lightweight ORM query builder model layer utilizing descriptors, metaclasses, and static type hinting to serialize to SQLite.",
    }),
  ],
};

// 4. STANDARD LIBRARY & UTILITIES
const STANDARD_LIBRARY_AND_UTILITIES: PythonRoadmapSection = {
  id: "standard-library-and-utilities",
  title: "Standard Library & Utilities",
  stages: [
    stage("Filesystem & System Utilities", {
      left: [
        g(
          [
            n("pathlib.Path (Modern object-oriented paths)", "personal"),
            n("os & os.path modules", "alternative"),
            n("shutil (Copying, moving, archiving files)"),
            n("sys (argv, exit, path, platform)"),
          ],
          n("Filesystem & OS")
        ),
      ],
      right: [
        g(
          [
            n("argparse (Standard CLI argument parser)", "personal"),
            n("click / typer (Ergonomic CLI frameworks)", "alternative"),
            n("subprocess (Spawning processes, run, Popen)"),
            n("tempfile & glob modules"),
          ],
          n("CLI & Subprocesses")
        ),
      ],
    }),
    stage("Data Serialization & Text Processing", {
      left: [
        g(
          [
            n("json module (loads, dumps, load, dump)", "personal"),
            n("csv module (reader, writer, DictReader)"),
            n("pickle (Python object serialization)"),
            n("tomllib & PyYAML (Config formats)"),
          ],
          n("Serialization & Configs")
        ),
      ],
      right: [
        g(
          [
            n("re module (Regular expressions, pattern matching)", "personal"),
            n("Formatted String Literals (f-strings)"),
            n("string module & template strings"),
            n("unicodedata & encodings (UTF-8)"),
          ],
          n("Regex & Text Tools")
        ),
      ],
    }),
    stage("Date, Time & Functional Tools", {
      left: [
        g(
          [
            n("datetime module (date, time, datetime)", "personal"),
            n("zoneinfo (IANA Time zone support)", "personal"),
            n("timedelta arithmetic & strftime/strptime"),
            n("calendar & time modules"),
          ],
          n("Date & Time Handling")
        ),
      ],
      right: [
        g(
          [
            n("functools.partial & lru_cache", "personal"),
            n("functools.reduce & cmp_to_key"),
            n("itertools (product, permutations, combinations)"),
            n("math, cmath & statistics modules"),
          ],
          n("Functional & Math Tools")
        ),
      ],
      projectIdea:
        "Build a server log analyzer that recursively traverses directories with pathlib, parses timestamped JSON/Apache logs via re, and outputs statistical summaries.",
    }),
  ],
};

// 5. VIRTUAL ENVIRONMENTS & PACKAGING
const VIRTUAL_ENVIRONMENTS_AND_PACKAGING: PythonRoadmapSection = {
  id: "virtual-environments-and-packaging",
  title: "Virtual Environments & Packaging",
  stages: [
    stage("Virtual Environments & Dependency Managers", {
      left: [
        g(
          [
            n("venv (Standard library virtualenv)", "personal"),
            n("virtualenv", "alternative"),
            n("conda / miniconda environments", "alternative"),
          ],
          n("Virtual Environments")
        ),
      ],
      right: [
        g(
          [
            n("uv (Ultra-fast Rust package manager)", "personal"),
            n("poetry (Dependency & packaging manager)", "personal"),
            n("pip & pip-tools (requirements.txt)", "alternative"),
            n("pipx (Isolated CLI application runner)", "optional"),
          ],
          n("Package & Dependency Managers")
        ),
      ],
      noteAfter:
        "Isolating dependencies per project is essential in Python. Modern tools like uv and poetry manage lockfiles, deterministic resolution, and virtual environments seamlessly.",
    }),
    stage("Packaging, Builds & PyPI Distribution", {
      left: [
        g(
          [
            n("pyproject.toml (PEP 517/518/621 standard)", "personal"),
            n("setup.py & setup.cfg (Legacy setup tools)", "alternative"),
            n("Build backends: hatchling, flit, setuptools"),
          ],
          n("Package Configuration")
        ),
      ],
      right: [
        g(
          [
            n("Building Wheels (.whl) & Source distributions (.tar.gz)"),
            n("Twine / uv publish (Publishing to PyPI)", "personal"),
            n("TestPyPI staging workflow"),
            n("Semantic Versioning (SemVer)"),
          ],
          n("Distribution & PyPI")
        ),
      ],
      projectIdea:
        "Create an open-source Python utility package configured via pyproject.toml, build a distributable Wheel with uv/hatch, and publish it to TestPyPI.",
    }),
  ],
};

// 6. CONCURRENCY & ASYNCHRONOUS PROGRAMMING
const CONCURRENCY_AND_ASYNC: PythonRoadmapSection = {
  id: "concurrency-and-async",
  title: "Concurrency & Asynchronous Programming",
  stages: [
    stage("Concurrency Models & The GIL", {
      left: [
        g(
          [
            n("Global Interpreter Lock (GIL) mechanics"),
            n("CPU-bound vs I/O-bound bottlenecks"),
            n("Free-threaded Python (PEP 703 / Python 3.13+)", "optional"),
          ],
          n("Python Runtime & GIL")
        ),
      ],
      right: [
        g(
          [
            n("threading module"),
            n("concurrent.futures.ThreadPoolExecutor", "personal"),
            n("Thread Safety & Synchronization (Lock, RLock, Semaphore)"),
            n("Race Conditions & Deadlocks"),
          ],
          n("Multithreading")
        ),
      ],
    }),
    stage("Multiprocessing & Asynchronous I/O", {
      left: [
        g(
          [
            n("multiprocessing module"),
            n("concurrent.futures.ProcessPoolExecutor", "personal"),
            n("IPC, Queues & Pipes"),
            n("Shared memory (multiprocessing.shared_memory)"),
          ],
          n("Multiprocessing")
        ),
      ],
      right: [
        g(
          [
            n("asyncio event loop architecture"),
            n("async def & await syntax", "personal"),
            n("asyncio.gather, TaskGroup (Python 3.11+)", "personal"),
            n("httpx / aiohttp (Asynchronous HTTP clients)", "personal"),
          ],
          n("asyncio (Async I/O)")
        ),
      ],
      projectIdea:
        "Develop an asynchronous web crawler with asyncio and httpx that fetches URLs concurrently with rate-limiting, error retries, and worker pools.",
    }),
  ],
};

// 7. TESTING & CODE QUALITY
const TESTING_AND_CODE_QUALITY: PythonRoadmapSection = {
  id: "testing-and-code-quality",
  title: "Testing & Code Quality",
  stages: [
    stage("Testing Frameworks", {
      left: [
        g(
          [
            n("pytest (De facto standard test runner)", "personal"),
            n("pytest fixtures & autouse fixtures", "personal"),
            n("Parametrized tests (@pytest.mark.parametrize)"),
            n("unittest (Built-in framework)", "alternative"),
          ],
          n("Test Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Mocking & Monkeypatching (pytest-mock, unittest.mock)"),
            n("coverage.py / pytest-cov (Code coverage reports)", "personal"),
            n("Hypothesis (Property-based testing)"),
            n("Integration & End-to-End Testing"),
          ],
          n("Mocking & Test Strategies")
        ),
      ],
    }),
    stage("Code Quality, Linting & Formatting", {
      left: [
        g(
          [
            n("ruff (Blazing fast linter & code formatter)", "personal"),
            n("black (The uncompromising Python code formatter)", "alternative"),
            n("flake8 & pylint", "optional"),
            n("isort (Import sorting)", "alternative"),
          ],
          n("Linters & Formatters")
        ),
      ],
      right: [
        g(
          [
            n("mypy (Static type checker)", "personal"),
            n("pre-commit hooks configuration", "personal"),
            n("GitHub Actions CI pipeline for Python", undefined, "skill-git-github"),
            n("Security scanning with bandit & pip-audit"),
          ],
          n("Static Analysis & CI/CD")
        ),
      ],
      projectIdea:
        "Set up a production-ready Python repository scaffold with pytest suites, ruff linting/formatting, mypy type verification, and pre-commit Git hooks.",
    }),
  ],
};

export const PYTHON_SECTIONS: PythonRoadmapSection[] = [
  PYTHON_FUNDAMENTALS,
  DATA_STRUCTURES_AND_ALGORITHMS,
  OOP_AND_ADVANCED_PYTHON,
  STANDARD_LIBRARY_AND_UTILITIES,
  VIRTUAL_ENVIRONMENTS_AND_PACKAGING,
  CONCURRENCY_AND_ASYNC,
  TESTING_AND_CODE_QUALITY,
];
