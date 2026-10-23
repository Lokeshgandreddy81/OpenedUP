export type ShellRoadmapStatus = "personal" | "alternative" | "optional";

export interface ShellRoadmapNode {
  id: string;
  title: string;
  status?: ShellRoadmapStatus;
  roadmapId?: string;
}

export interface ShellRoadmapGroup {
  id: string;
  parent?: ShellRoadmapNode;
  items: ShellRoadmapNode[];
}

export interface ShellRoadmapStage {
  id: string;
  node: ShellRoadmapNode;
  left?: ShellRoadmapGroup[];
  right?: ShellRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface ShellRoadmapSection {
  id: string;
  title?: string;
  stages: ShellRoadmapStage[];
}

export interface ShellRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SHELL_MARKERS: Array<{
  status: ShellRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SHELL_RELATED_ROADMAPS: ShellRoadmapLink[] = [
  { label: "Linux Roadmap", roadmapId: "skill-linux" },
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Git & GitHub", roadmapId: "skill-git-github" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Kubernetes Roadmap", roadmapId: "skill-kubernetes" },
];

export const SHELL_CONTINUE_LEARNING: ShellRoadmapLink[] = [
  { label: "Linux", roadmapId: "skill-linux" },
  { label: "DevOps", roadmapId: "devops" },
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
  status?: ShellRoadmapStatus,
  roadmapId?: string,
  customId?: string
): ShellRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: ShellRoadmapNode[],
  parent?: ShellRoadmapNode,
  customId?: string
): ShellRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<ShellRoadmapStage, "id" | "node"> & {
    status?: ShellRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): ShellRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. SHELL FUNDAMENTALS
const SHELL_FUNDAMENTALS: ShellRoadmapSection = {
  id: "shell-fundamentals",
  title: "Shell Fundamentals & Terminal Essentials",
  stages: [
    stage("Terminal Basics & Shell Types", {
      status: "personal",
      left: [
        g(
          [
            n("Terminal Emulator vs Shell", "personal"),
            n("Bourne Shell (sh) Standard"),
            n("Bourne-Again Shell (bash)", "personal"),
            n("Z Shell (zsh) & modern shells"),
          ],
          n("Shell Flavors & Environments")
        ),
      ],
      right: [
        g(
          [
            n("Startup Files: ~/.bashrc & ~/.bash_profile", "personal"),
            n("Login vs Non-Login Shells"),
            n("Interactive vs Non-Interactive Shells"),
            n("Prompt Customization (PS1, starship)"),
          ],
          n("Configuration & Profiles")
        ),
      ],
      noteAfter:
        "Bash is the ubiquitous default for Linux scripting and CI/CD pipelines, while Zsh is the default interactive shell on macOS.",
    }),
    stage("Navigation & File Operations", {
      status: "personal",
      left: [
        g(
          [
            n("pwd, cd & pushd / popd", "personal"),
            n("ls -la (Hidden files & detailed listing)"),
            n("Absolute vs Relative Paths"),
            n("Wildcards & Globbing (*, ?, [a-z])", "personal"),
          ],
          n("Directory Navigation")
        ),
      ],
      right: [
        g(
          [
            n("mkdir -p & touch", "personal"),
            n("cp -r, mv & rm -rf"),
            n("chmod (Octal & Symbolic Permissions)", "personal"),
            n("chown & chgrp ownership"),
          ],
          n("File Operations & Permissions")
        ),
      ],
      projectIdea:
        "CLI Exploration: Set up a structured directory hierarchy and practice bulk file manipulation with wildcards",
    }),
  ],
};

// 2. STREAMS, REDIRECTION & PIPES
const STREAMS_REDIRECTION_PIPES: ShellRoadmapSection = {
  id: "streams-redirection-pipes",
  title: "Streams, Redirection & Pipes",
  stages: [
    stage("Standard Streams & Redirection", {
      status: "personal",
      left: [
        g(
          [
            n("File Descriptors: stdin (0), stdout (1), stderr (2)", "personal"),
            n("Output Redirection (> overwrite, >> append)", "personal"),
            n("Input Redirection (< file)"),
            n("Redirecting stderr (2> file, 2>&1)", "personal"),
          ],
          n("I/O Redirection")
        ),
      ],
      right: [
        g(
          [
            n("Discarding Output to /dev/null", "personal"),
            n("Redirecting stdout and stderr (&> file)"),
            n("Custom File Descriptors (exec 3< file)"),
            n("Subshells & Redirection grouping"),
          ],
          n("Advanced Redirection")
        ),
      ],
      noteAfter:
        "2>&1 redirects standard error to the same location as standard output. Master this pattern for silent or consolidated logging.",
    }),
    stage("Pipes, Splitting & Here-Documents", {
      status: "personal",
      left: [
        g(
          [
            n("Pipe Operator (|)", "personal"),
            n("Pipeline Flow & Buffer Mechanics"),
            n("Exit Code in Pipelines (${PIPESTATUS[@]})", "personal"),
            n("tee Command (Duplicate stream to file & stdout)", "personal"),
          ],
          n("Pipes & tee")
        ),
      ],
      right: [
        g(
          [
            n("Here-Documents (<<EOF ... EOF)", "personal"),
            n('Here-Strings (<<< "data")'),
            n("Process Substitution (<(cmd) and >(cmd))", "personal"),
            n("Named Pipes (mkfifo)"),
          ],
          n("Heredocs & Process Substitution")
        ),
      ],
      projectIdea:
        "Log Router: Stream multi-service docker logs through pipes and tee into categorized output files and live terminal monitors",
    }),
  ],
};

// 3. TEXT PROCESSING UTILITIES
const TEXT_PROCESSING_UTILITIES: ShellRoadmapSection = {
  id: "text-processing-utilities",
  title: "Text Processing Utilities",
  stages: [
    stage("Search & Extraction Utilities", {
      status: "personal",
      left: [
        g(
          [
            n("grep, egrep & fgrep", "personal"),
            n("grep Flags: -i, -v, -r, -n, -E", "personal"),
            n("Context Flags: -A, -B, -C"),
            n("Regular Expressions in grep"),
          ],
          n("grep & Pattern Search")
        ),
      ],
      right: [
        g(
          [
            n("cut (-d delimiter, -f fields)", "personal"),
            n("tr (Translate & delete characters)"),
            n("head & tail (-n, -f for live follow)", "personal"),
            n("wc (Word, line, and byte count)"),
          ],
          n("Extraction & Inspection")
        ),
      ],
      noteAfter:
        "grep searches lines by pattern. Use `grep -E` for Extended Regular Expressions or `ripgrep` (rg) in modern developer setups.",
    }),
    stage("Stream Editing with sed & awk", {
      status: "personal",
      left: [
        g(
          [
            n("sed Substitution (s/pattern/replacement/g)", "personal"),
            n("In-place File Editing (sed -i)", "personal"),
            n("Address Ranges & Line Deletion (/pattern/d)"),
            n("Hold Space & Pattern Space"),
          ],
          n("sed Stream Editor")
        ),
      ],
      right: [
        g(
          [
            n("awk Fundamentals ($1, $2, $0)", "personal"),
            n("Built-in Variables: NR, NF, FS, OFS", "personal"),
            n("BEGIN and END Action Blocks"),
            n("Conditional Formatting & Arithmetic in awk", "personal"),
          ],
          n("awk Pattern Scanning & Processing")
        ),
      ],
      projectIdea:
        "Log Analyzer: Write a one-liner pipeline combining grep, sed, and awk to parse an Nginx access log and count HTTP 5xx errors by IP",
    }),
    stage("Sorting, Uniqueness & Batching", {
      status: "personal",
      left: [
        g(
          [
            n("sort (-n numeric, -r reverse, -k column)", "personal"),
            n("uniq (-c count, -d duplicates only)", "personal"),
            n("sort | uniq Idiom", "personal"),
            n("comm & diff file comparison"),
          ],
          n("Sorting & De-duplication")
        ),
      ],
      right: [
        g(
          [
            n("xargs Command Construction", "personal"),
            n("xargs -I {} Placeholder replacement", "personal"),
            n("xargs -P Parallel execution", "personal"),
            n("find -exec vs find -print0 | xargs -0"),
          ],
          n("xargs & Batch Processing")
        ),
      ],
      noteAfter:
        "Always pair `find -print0` with `xargs -0` when handling arbitrary filenames containing spaces or special characters.",
    }),
  ],
};

// 4. BASH SCRIPTING FUNDAMENTALS
const BASH_SCRIPTING_FUNDAMENTALS: ShellRoadmapSection = {
  id: "bash-scripting-fundamentals",
  title: "Bash Scripting Fundamentals",
  stages: [
    stage("Script Anatomy & Shebang", {
      status: "personal",
      left: [
        g(
          [
            n("#!/usr/bin/env bash (Portable Shebang)", "personal"),
            n("chmod +x script.sh (Executable bit)", "personal"),
            n("Execution: ./script.sh vs source script.sh"),
            n("Single-line & Multi-line Comments"),
          ],
          n("Script Initialization")
        ),
      ],
      right: [
        g(
          [
            n('Variables: var="value" (No spaces!)', "personal"),
            n("Quoting: \"$var\" (double) vs '$var' (single)", "personal"),
            n("Command Substitution $(cmd)", "personal"),
            n("Arithmetic Expansion $((2 + 2))"),
          ],
          n("Variables & Expansions")
        ),
      ],
      noteAfter:
        'Always quote your variables `"$var"` to prevent unwanted word splitting and glob expansion.',
    }),
    stage("Arguments, Exit Codes & Testing", {
      status: "personal",
      left: [
        g(
          [
            n("Positional Parameters: $0, $1, $2", "personal"),
            n("$# (Argument count) & $$ (PID)"),
            n('"$@" (Preserves spaces) vs "$*"', "personal"),
            n("Exit Codes: exit 0 vs exit 1, $?", "personal"),
          ],
          n("Arguments & Status Codes")
        ),
      ],
      right: [
        g(
          [
            n("Test Command: test and [ ]", "alternative"),
            n("Modern Bash Test: [[ ]]", "personal"),
            n("String Tests (-z empty, -n non-empty, ==)", "personal"),
            n("Numeric (-eq, -ne, -lt, -gt) & File (-f, -d, -s)", "personal"),
          ],
          n("Conditionals & Test Operators")
        ),
      ],
      projectIdea:
        "CLI Scaffolder: Write a bash script that accepts flags, validates argument counts, tests for directory existence, and returns exit code 0/1",
    }),
  ],
};

// 5. CONTROL FLOW
const CONTROL_FLOW: ShellRoadmapSection = {
  id: "control-flow",
  title: "Control Flow & Iteration",
  stages: [
    stage("Conditional Branching", {
      status: "personal",
      left: [
        g(
          [
            n("if ... then ... elif ... else ... fi", "personal"),
            n("Logical AND (&&) & OR (||) inside [[ ]]", "personal"),
            n("Short-circuit Evaluation: cmd1 && cmd2"),
            n("Nested Conditions"),
          ],
          n("if-else Statements")
        ),
      ],
      right: [
        g(
          [
            n("case ... in ... esac", "personal"),
            n("Pattern Matching in case (val1 | val2)"),
            n("Wildcard Default Case (*))", "personal"),
            n("getopts for Command-Line Flag Parsing", "personal"),
          ],
          n("case & getopts")
        ),
      ],
      noteAfter:
        "Use `case` statements combined with `getopts` to build intuitive command-line interfaces with short options like `-h`, `-v`, `-f`.",
    }),
    stage("Loops & Iteration", {
      status: "personal",
      left: [
        g(
          [
            n('for item in "${list[@]}"', "personal"),
            n("for f in *.txt (Glob loops)"),
            n("Range Brace Expansion {1..10}"),
            n("C-Style for ((i=0; i<10; i++))"),
          ],
          n("for Loops")
        ),
      ],
      right: [
        g(
          [
            n("while [[ condition ]]; do ... done", "personal"),
            n("Reading File Line-by-Line (while IFS= read -r)", "personal"),
            n("until Loops (Loop until condition true)"),
            n("break & continue flow control"),
          ],
          n("while, until & Stream Reading")
        ),
      ],
      projectIdea:
        "Batch File Renamer: Build a loop-driven script that iterates through messy filenames, strips illegal characters, and generates preview dry-runs",
    }),
  ],
};

// 6. FUNCTIONS & SCRIPT ARCHITECTURE
const FUNCTIONS_AND_ARCHITECTURE: ShellRoadmapSection = {
  id: "functions-and-architecture",
  title: "Functions & Script Architecture",
  stages: [
    stage("Function Definitions & Scoping", {
      status: "personal",
      left: [
        g(
          [
            n("my_func() { ... } Definition", "personal"),
            n("Passing Arguments to Functions ($1, $2)", "personal"),
            n("Function Return Codes (return 0..255)"),
            n("Returning Strings via stdout echo"),
          ],
          n("Function Mechanics")
        ),
      ],
      right: [
        g(
          [
            n("local keyword (Prevent global contamination)", "personal"),
            n("readonly Variables & Constants"),
            n("Variable Default Fallback: ${VAR:-default}", "personal"),
            n("String Manipulation: ${var#prefix}, ${var%suffix}"),
          ],
          n("Local Scope & Parameter Expansion")
        ),
      ],
      noteAfter:
        "Always declare function variables with `local` to avoid accidentally overriding global state.",
    }),
    stage("Strict Mode & Resilient Error Handling", {
      status: "personal",
      left: [
        g(
          [
            n("Strict Mode: set -euo pipefail", "personal"),
            n("set -e (Exit immediately on error)", "personal"),
            n("set -u (Treat unset variables as error)", "personal"),
            n("set -o pipefail (Fail on pipe errors)", "personal"),
          ],
          n("Unofficial Bash Strict Mode")
        ),
      ],
      right: [
        g(
          [
            n("trap 'cleanup' EXIT ERR INT", "personal"),
            n("Graceful Temp File Removal on Exit", "personal"),
            n("Debugging with bash -x / set -x", "personal"),
            n("Modular Script Sourcing (source ./lib.sh)", "personal"),
          ],
          n("Traps, Cleanup & Debugging")
        ),
      ],
      projectIdea:
        "Production Backup Script: Write an automated backup script featuring `set -euo pipefail`, timestamped logs, temp directory `trap` cleanups, and S3 upload",
    }),
  ],
};

// 7. ENVIRONMENT, JOB CONTROL & AUTOMATION
const ENVIRONMENT_AND_AUTOMATION: ShellRoadmapSection = {
  id: "environment-and-automation",
  title: "Environment, Job Control & Automation",
  stages: [
    stage("Environment Variables & Process Control", {
      status: "personal",
      left: [
        g(
          [
            n('export VAR="value"', "personal"),
            n("env, printenv & inspecting variables"),
            n('Manipulating PATH (PATH="$HOME/bin:$PATH")', "personal"),
            n("Subprocess Inheritance of Environment"),
          ],
          n("Environment Configuration")
        ),
      ],
      right: [
        g(
          [
            n("Background Operator (&)", "personal"),
            n("nohup (Immunity to hangups)", "personal"),
            n("Job Inspection: jobs, fg, bg"),
            n("disown (Detach job from shell session)"),
          ],
          n("Job & Process Management")
        ),
      ],
      noteAfter:
        "The `export` keyword makes a variable available to all child processes spawned from the current shell.",
    }),
    stage("Signals & Scheduled Automation", {
      status: "personal",
      left: [
        g(
          [
            n("POSIX Signals: SIGTERM (15), SIGKILL (9)", "personal"),
            n("SIGHUP (1), SIGINT (2) - Ctrl+C"),
            n("kill, kill -9, pkill, killall", "personal"),
            n("Checking Process Status (ps aux, top, htop)"),
          ],
          n("Signals & Process Termination")
        ),
      ],
      right: [
        g(
          [
            n("cron & crontab -e", "personal"),
            n("Cron Syntax (* * * * * schedule)", "personal"),
            n("at Command (One-time scheduled tasks)"),
            n("systemd Timers & Services (Modern cron)", "personal"),
          ],
          n("Scheduled Automation")
        ),
      ],
      projectIdea:
        "Health Check Daemon: Implement a background monitor script that tracks CPU/memory thresholds, sends alerts, and self-schedules via cron",
    }),
  ],
};

export const SHELL_SECTIONS: ShellRoadmapSection[] = [
  SHELL_FUNDAMENTALS,
  STREAMS_REDIRECTION_PIPES,
  TEXT_PROCESSING_UTILITIES,
  BASH_SCRIPTING_FUNDAMENTALS,
  CONTROL_FLOW,
  FUNCTIONS_AND_ARCHITECTURE,
  ENVIRONMENT_AND_AUTOMATION,
];
