export type RubyRoadmapStatus = "personal" | "alternative" | "optional";

export interface RubyRoadmapNode {
  id: string;
  title: string;
  status?: RubyRoadmapStatus;
  roadmapId?: string;
}

export interface RubyRoadmapGroup {
  id: string;
  parent?: RubyRoadmapNode;
  items: RubyRoadmapNode[];
}

export interface RubyRoadmapStage {
  id: string;
  node: RubyRoadmapNode;
  left?: RubyRoadmapGroup[];
  right?: RubyRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface RubyRoadmapSection {
  id: string;
  title?: string;
  stages: RubyRoadmapStage[];
}

export interface RubyRoadmapLink {
  label: string;
  roadmapId: string;
}

export const RUBY_MARKERS: Array<{
  status: RubyRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const RUBY_RELATED_ROADMAPS: RubyRoadmapLink[] = [
  { label: "Ruby on Rails Roadmap", roadmapId: "skill-ruby-on-rails" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Full Stack Developer", roadmapId: "full-stack" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "PostgreSQL DBA", roadmapId: "postgresql" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
];

export const RUBY_CONTINUE_LEARNING: RubyRoadmapLink[] = [
  { label: "Ruby on Rails", roadmapId: "skill-ruby-on-rails" },
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
  status?: RubyRoadmapStatus,
  roadmapId?: string,
  customId?: string
): RubyRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: RubyRoadmapNode[],
  parent?: RubyRoadmapNode,
  customId?: string
): RubyRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<RubyRoadmapStage, "id" | "node"> & {
    status?: RubyRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): RubyRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. RUBY FUNDAMENTALS
const RUBY_FUNDAMENTALS: RubyRoadmapSection = {
  id: "ruby-fundamentals",
  title: "Ruby Fundamentals",
  stages: [
    stage("Introduction & Setup", {
      left: [
        g(
          [
            n("rbenv", "personal"),
            n("asdf", "alternative"),
            n("RVM", "optional"),
            n("IRB / Pry REPL", "personal"),
          ],
          n("Version Managers & REPL")
        ),
      ],
      right: [
        g(
          [
            n("Designed for Programmer Happiness"),
            n("Everything is an Object"),
            n("Dynamic & Interpreted"),
            n("Pure Object-Oriented Language"),
          ],
          n("Ruby Philosophy")
        ),
      ],
      noteAfter:
        "Created by Yukihiro 'Matz' Matsumoto in 1995, Ruby emphasizes human-friendly syntax, productivity, and the principle that every piece of data is an object.",
    }),
    stage("Variables & Types", {
      left: [
        g(
          [
            n("Local Variables (name)"),
            n("Instance Variables (@name)"),
            n("Class Variables (@@name)"),
            n("Global Variables ($name)"),
            n("Constants (UPPERCASE)"),
          ],
          n("Variable Scopes")
        ),
      ],
      right: [
        g(
          [
            n("Symbols (:symbol)", "personal"),
            n("Strings vs Symbols (immutability & memory)"),
            n("Integers & Floats"),
            n("Booleans (true / false)"),
            n("NilClass (nil is an object)"),
          ],
          n("Core Data Types")
        ),
      ],
    }),
    stage("Control Flow", {
      left: [
        g(
          [
            n("if / elsif / else"),
            n("unless statement"),
            n("Ternary Operator (?:)"),
            n("case / when with === matching"),
            n("Modifier syntax (puts x if condition)"),
          ],
          n("Conditionals")
        ),
      ],
      right: [
        g(
          [
            n("while and until"),
            n("for loop"),
            n("loop do with break / next / redo"),
            n("times, upto, downto iterators"),
          ],
          n("Loops & Iterators")
        ),
      ],
      projectIdea:
        "Project: Build a command-line calculator or text-based adventure game using core flow control and types",
    }),
  ],
};

// 2. COLLECTIONS & ENUMERABLE
const COLLECTIONS_AND_ENUMERABLE: RubyRoadmapSection = {
  id: "collections-and-enumerable",
  title: "Collections & Enumerable",
  stages: [
    stage("Arrays & Hashes", {
      left: [
        g(
          [
            n("Zero-indexed & Negative indexing"),
            n("Push, Pop, Shift, Unshift (<<)"),
            n("Array slicing & flattening"),
            n("Set operations (&, |, -)"),
            n("%w / %i literal syntax"),
          ],
          n("Arrays")
        ),
      ],
      right: [
        g(
          [
            n("Key-Value pairs & Symbol keys"),
            n("Hash default values (Hash.new)"),
            n("transform_keys & transform_values"),
            n("merge / merge!"),
            n("Digging nested keys (dig)"),
          ],
          n("Hashes")
        ),
      ],
    }),
    stage("Enumerable Module", {
      left: [
        g(
          [
            n("each and each_with_index"),
            n("map / collect", "personal"),
            n("select / filter & reject", "personal"),
            n("reduce / inject", "personal"),
            n("each_with_object", "personal"),
          ],
          n("Core Iterators")
        ),
      ],
      right: [
        g(
          [
            n("find / detect"),
            n("any?, all?, none?, one?"),
            n("group_by & partition"),
            n("sort & sort_by"),
            n("Lazy Enumerators (Enumerator::Lazy)"),
          ],
          n("Search, Grouping & Lazy")
        ),
      ],
      noteAfter:
        "The Enumerable mixin is one of Ruby's greatest strengths, providing dozens of traversal, search, and transformation methods simply by implementing #each.",
    }),
  ],
};

// 3. BLOCKS, PROCS & LAMBDAS
const BLOCKS_PROCS_AND_LAMBDAS: RubyRoadmapSection = {
  id: "blocks-procs-and-lambdas",
  title: "Blocks, Procs & Lambdas",
  stages: [
    stage("Blocks & Yield", {
      left: [
        g(
          [
            n("do...end vs { ... } conventions"),
            n("yield keyword"),
            n("yield with arguments"),
            n("block_given? check"),
          ],
          n("Implicit Blocks")
        ),
      ],
      right: [
        g(
          [
            n("&block argument parameter"),
            n("Symbol to Proc shorthand (&:method)", "personal"),
            n("Passing blocks between methods"),
          ],
          n("Block Conversions")
        ),
      ],
    }),
    stage("Procs vs Lambdas", {
      left: [
        g(
          [
            n("Proc.new & proc method"),
            n("Lambda literal syntax (->() {})", "personal"),
            n("First-class functions in Ruby"),
            n("Closures & Lexical Scoping"),
          ],
          n("Callable Objects")
        ),
      ],
      right: [
        g(
          [
            n("Arity Checking (strict vs lenient)"),
            n("Return Semantics (enclosing method vs local)"),
            n("Method objects (method(:foo))"),
            n("Currying & Composition (>> / <<)"),
          ],
          n("Key Differences")
        ),
      ],
      noteAfter:
        "Procs and Lambdas both encapsulate code blocks, but Lambdas enforce strict arity (like regular methods) and return control back to the caller rather than jumping out of the enclosing method.",
      projectIdea:
        "Project: Implement a custom DSL or query builder relying on blocks, yield, and instance_eval",
    }),
  ],
};

// 4. OOP & METAPROGRAMMING
const OOP_AND_METAPROGRAMMING: RubyRoadmapSection = {
  id: "oop-and-metaprogramming",
  title: "OOP & Metaprogramming",
  stages: [
    stage("Classes & Objects", {
      left: [
        g(
          [
            n("class definitions & initialize"),
            n("attr_reader, attr_writer, attr_accessor"),
            n("self keyword"),
            n("Public, Private, Protected visibility"),
          ],
          n("Class Primitives")
        ),
      ],
      right: [
        g(
          [
            n("Single Inheritance (< Superclass)"),
            n("super keyword & arguments"),
            n("Class methods vs Instance methods"),
            n("Operator Overloading (def +(other))"),
          ],
          n("Inheritance & Polymorphism")
        ),
      ],
    }),
    stage("Modules & Mixins", {
      left: [
        g(
          [
            n("include (adds to ancestor chain)", "personal"),
            n("extend (adds to singleton class)", "personal"),
            n("prepend (overrides class methods)"),
            n("Composition over Inheritance"),
          ],
          n("Mixins")
        ),
      ],
      right: [
        g(
          [
            n("Namespacing (Module::Class)"),
            n("module_function"),
            n("ActiveSupport::Concern pattern", undefined, "skill-ruby-on-rails"),
          ],
          n("Namespaces & Utilities")
        ),
      ],
    }),
    stage("Metaprogramming", {
      left: [
        g(
          [
            n("send and public_send", "personal"),
            n("method_missing & respond_to_missing?", "personal"),
            n("define_method dynamically", "personal"),
            n("const_get, const_set, const_defined?"),
          ],
          n("Dynamic Methods & Dispatch")
        ),
      ],
      right: [
        g(
          [
            n("Singleton Class (eigenclass / metaclass)"),
            n("class_eval and instance_eval"),
            n("Method Lookup Chain"),
            n("Binding & eval"),
          ],
          n("Reflection & Evaluation")
        ),
      ],
      noteAfter:
        "The Ruby method lookup chain resolves in strict order: Prepended Modules -> Class -> Included Modules -> Superclass -> Object -> Kernel -> BasicObject.",
    }),
  ],
};

// 5. ERROR HANDLING & ADVANCED RUBY
const ERROR_HANDLING_AND_ADVANCED: RubyRoadmapSection = {
  id: "error-handling-and-advanced",
  title: "Error Handling & Advanced Ruby",
  stages: [
    stage("Exception Handling", {
      left: [
        g(
          [
            n("begin, rescue, ensure, else"),
            n("Raising exceptions (raise StandardError)"),
            n("Custom exception classes (< StandardError)"),
            n("retry statement"),
          ],
          n("Handling Exceptions")
        ),
      ],
      right: [
        g(
          [
            n("StandardError vs Exception hierarchy"),
            n("Catch and Throw (control jump)"),
            n("Exception causality & backtrace"),
          ],
          n("Exception Hierarchy")
        ),
      ],
    }),
    stage("Concurrency & Modern Ruby", {
      left: [
        g(
          [
            n("Threads (Thread.new)"),
            n("Global VM Lock (GVL / GIL)"),
            n("Mutex and ConditionVariable"),
            n("Queue & SizedQueue"),
          ],
          n("Threading & Synchronization")
        ),
      ],
      right: [
        g(
          [
            n("Fibers & Async Fiber Scheduler"),
            n("Ractors (Parallel Actor Model)"),
            n("Pattern Matching (in / case syntax)"),
            n("Number Block Parameters (_1, _2)"),
          ],
          n("Ruby 3+ Features")
        ),
      ],
      projectIdea:
        "Project: Build a multi-threaded web crawler or background job processor using Threads, Queue, and Fibers",
    }),
  ],
};

// 6. RUBY ECOSYSTEM & TOOLING
const RUBY_ECOSYSTEM_AND_TOOLING: RubyRoadmapSection = {
  id: "ruby-ecosystem-and-tooling",
  title: "Ruby Ecosystem & Tooling",
  stages: [
    stage("Package Management", {
      left: [
        g(
          [
            n("RubyGems (gem install)", "personal"),
            n("Gemfile and Gemfile.lock"),
            n("bundle exec command"),
            n("Creating your own Gem (.gemspec)"),
          ],
          n("Bundler & RubyGems")
        ),
      ],
      right: [
        g(
          [
            n("Rake Tasks & Rakefile", "personal"),
            n("Thor CLI builder"),
            n("dotenv for environment management"),
            n("ERB templating engine"),
          ],
          n("Build Tools & Utilities")
        ),
      ],
    }),
    stage("Testing & Code Quality", {
      left: [
        g(
          [
            n("RSpec (describe, it, expect)", "personal"),
            n("Minitest (built into Ruby)", "alternative"),
            n("FactoryBot for test data", "personal"),
            n("WebMock / VCR for HTTP stubs"),
          ],
          n("Testing Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("RuboCop (Linter & Formatter)", "personal"),
            n("Sorbet (Static Type Checker)"),
            n("RBS & TypeProf (Ruby 3 types)"),
            n("SimpleCov (Code Coverage)"),
          ],
          n("Static Analysis & Types")
        ),
      ],
      noteAfter:
        "The Ruby community is famous for its test-driven development (TDD) culture. Writing RSpec tests and enforcing RuboCop standards are industry norms.",
      projectIdea:
        "Project: Package and publish an open-source Ruby Gem with full RSpec suite, RuboCop checks, and automated CI",
    }),
  ],
};

export const RUBY_SECTIONS: RubyRoadmapSection[] = [
  RUBY_FUNDAMENTALS,
  COLLECTIONS_AND_ENUMERABLE,
  BLOCKS_PROCS_AND_LAMBDAS,
  OOP_AND_METAPROGRAMMING,
  ERROR_HANDLING_AND_ADVANCED,
  RUBY_ECOSYSTEM_AND_TOOLING,
];
