export type GitGithubRoadmapStatus = "personal" | "alternative" | "optional";

export interface GitGithubRoadmapNode {
  id: string;
  title: string;
  status?: GitGithubRoadmapStatus;
  roadmapId?: string;
}

export interface GitGithubRoadmapGroup {
  id: string;
  parent?: GitGithubRoadmapNode;
  items: GitGithubRoadmapNode[];
}

export interface GitGithubRoadmapStage {
  id: string;
  node: GitGithubRoadmapNode;
  left?: GitGithubRoadmapGroup[];
  right?: GitGithubRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface GitGithubRoadmapSection {
  id: string;
  title?: string;
  stages: GitGithubRoadmapStage[];
}

export interface GitGithubRoadmapLink {
  label: string;
  roadmapId: string;
}

export const GIT_GITHUB_MARKERS: Array<{
  status: GitGithubRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const GIT_GITHUB_RELATED_ROADMAPS: GitGithubRoadmapLink[] = [
  { label: "DevOps Roadmap", roadmapId: "devops" },
  { label: "Code Review Roadmap", roadmapId: "skill-code-review" },
  { label: "Linux Skills Roadmap", roadmapId: "skill-linux" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Frontend Developer Roadmap", roadmapId: "frontend" },
  { label: "Backend Developer Roadmap", roadmapId: "backend" },
];

export const GIT_GITHUB_CONTINUE_LEARNING: GitGithubRoadmapLink[] = [
  { label: "Code Review", roadmapId: "skill-code-review" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Linux", roadmapId: "skill-linux" },
  { label: "Docker", roadmapId: "skill-docker" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: GitGithubRoadmapStatus,
  roadmapId?: string,
  customId?: string
): GitGithubRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: GitGithubRoadmapNode[],
  parent?: GitGithubRoadmapNode,
  customId?: string
): GitGithubRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<GitGithubRoadmapStage, "id" | "node"> & {
    status?: GitGithubRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): GitGithubRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. VERSION CONTROL FUNDAMENTALS
const VERSION_CONTROL_FUNDAMENTALS: GitGithubRoadmapSection = {
  id: "version-control-fundamentals",
  title: "Version Control Fundamentals",
  stages: [
    stage("VCS Concepts & Architecture", {
      left: [
        g(
          [
            n("Centralized VCS (SVN, Perforce, CVS)"),
            n("Distributed VCS (Git, Mercurial)", "personal"),
            n("Cryptographic Hashing (SHA-1 / SHA-256)"),
            n("Snapshots vs File Diffs Architecture"),
          ],
          n("VCS vs DVCS")
        ),
      ],
      right: [
        g(
          [
            n("Blobs (Raw File Contents)"),
            n("Trees (Directory Structures & File Names)"),
            n("Commits (Snapshots, Author, Parent Hash)"),
            n("Annotated vs Lightweight Tags"),
          ],
          n("Git Internal Object Model")
        ),
      ],
    }),
    stage("The Three Trees & State Machine", {
      left: [
        g(
          [
            n("Working Directory (Untracked & modified files)"),
            n("Staging Area / Index (Curated commit buffer)", "personal"),
            n("Git Repository / HEAD (Committed snapshots)"),
            n("The Git Stash (Temporary WIP shelf)"),
          ],
          n("The Three Areas")
        ),
      ],
      right: [
        g(
          [
            n("Untracked -> Staged (git add)"),
            n("Staged -> Committed (git commit)", "personal"),
            n("Modified -> Staged (git add -p / -u)"),
            n("Committed -> Modified (Editing tracked files)"),
          ],
          n("File Lifecycle")
        ),
      ],
      noteAfter:
        "Git models history as a Directed Acyclic Graph (DAG) of immutable snapshots. The Staging Area acts as a deliberate curation workspace before committing.",
    }),
  ],
};

// 2. CORE GIT COMMANDS
const CORE_GIT_COMMANDS: GitGithubRoadmapSection = {
  id: "core-git-commands",
  title: "Core Git Commands",
  stages: [
    stage("Repository Setup & Configuration", {
      left: [
        g(
          [
            n("git init (Initialize local repository)"),
            n("git clone <repo-url> (Clone remote repository)", "personal"),
            n(".gitignore rules and patterns"),
            n(".gitattributes (Line endings CRLF vs LF)"),
          ],
          n("Init & Ignore")
        ),
      ],
      right: [
        g(
          [
            n("git config --global user.name & email", "personal"),
            n("SSH Keys vs Personal Access Tokens (PAT)"),
            n("GPG / SSH Commit Signing for Verified Badges"),
            n("Productive Shell Aliases (st, co, br)"),
          ],
          n("Configuration & Credentials")
        ),
      ],
    }),
    stage("Daily Snapshot Workflow", {
      left: [
        g(
          [
            n("git status (Inspect repository state)"),
            n("git add <file> & git add ."),
            n("git add -p (Interactive patch staging)", "personal"),
            n("git diff (Working directory vs Index)"),
            n("git diff --staged / --cached", "personal"),
          ],
          n("Staging & Diffing")
        ),
      ],
      right: [
        g(
          [
            n("git commit -m '<message>'", "personal"),
            n("Conventional Commits (feat, fix, refactor, docs)", "personal"),
            n("git log --oneline --graph --decorate --all", "personal"),
            n("git show <commit-hash>"),
          ],
          n("Commits & Log History")
        ),
      ],
    }),
    stage("Navigating & Restoring", {
      left: [
        g(
          [
            n("git switch <branch> (Modern branch switching)", "personal"),
            n("git switch -c <branch> (Create and switch)", "personal"),
            n("git restore <file> (Discard working modifications)", "personal"),
            n("git restore --staged <file> (Unstage file)", "personal"),
          ],
          n("Modern Git (2.23+)")
        ),
      ],
      right: [
        g(
          [
            n("git checkout <branch> (Legacy branch navigation)", "alternative"),
            n("git checkout -b <branch>"),
            n("git checkout -- <file>"),
            n("Understanding Detached HEAD state"),
          ],
          n("Legacy Checkout Commands")
        ),
      ],
      noteAfter:
        "Modern Git (2.23+) separates checkout into `git switch` (for branches) and `git restore` (for files), avoiding confusing overloaded syntax.",
      projectIdea:
        "Initialize a multi-branch repository, configure commit signing and .gitignore rules, and practice atomic commits with git add -p",
    }),
  ],
};

// 3. BRANCHING & MERGING
const BRANCHING_AND_MERGING: GitGithubRoadmapSection = {
  id: "branching-and-merging",
  title: "Branching & Merging",
  stages: [
    stage("Branching Mechanics & Workflows", {
      left: [
        g(
          [
            n("git branch <name> & git branch -d / -D"),
            n("git branch -a & git branch -vv"),
            n("Remote Tracking Branches (origin/main)"),
            n("Renaming branches (git branch -m)"),
          ],
          n("Branch Management")
        ),
      ],
      right: [
        g(
          [
            n("Trunk-Based Development (Short-lived feature branches)", "personal"),
            n("GitHub Flow (Main branch + Pull Requests)", "personal"),
            n("Git Flow (develop, release, hotfix branches)", "alternative"),
            n("Release Branching & Semantic Tags"),
          ],
          n("Branching Strategies")
        ),
      ],
    }),
    stage("Merging Strategies", {
      left: [
        g(
          [
            n("Fast-Forward Merge (git merge --ff)", "personal"),
            n("No Fast-Forward Merge (git merge --no-ff)"),
            n("3-Way Merge Commit (Common ancestor resolution)"),
            n("Squash Merging (git merge --squash)", "personal"),
          ],
          n("Fast-Forward vs 3-Way")
        ),
      ],
      right: [
        g(
          [
            n("git rebase <base-branch> (Replay commits)", "personal"),
            n("Linear History advantages"),
            n("Golden Rule: Never rebase public shared branches", "personal"),
            n("Merge vs Rebase trade-offs and team agreements"),
          ],
          n("Rebasing vs Merging")
        ),
      ],
    }),
    stage("Conflict Resolution", {
      left: [
        g(
          [
            n("Conflict Markers (<<<<<<<, =======, >>>>>>>)"),
            n("Resolving conflicts in VS Code / IDE"),
            n("git merge --abort & git rebase --abort", "personal"),
            n("git mergetool integration"),
          ],
          n("Resolving Conflicts")
        ),
      ],
      right: [
        g(
          [
            n("git rerere (Reuse Recorded Resolution)", "personal"),
            n("git checkout --ours / --theirs"),
            n("Diff3 conflict style (merge.conflictStyle diff3)", "personal"),
            n("git rebase --continue after conflict resolution"),
          ],
          n("Advanced Resolution Tools")
        ),
      ],
      noteAfter:
        "Trunk-based development with short-lived feature branches and frequent rebasing against main minimizes merge friction and CI bottlenecks.",
      projectIdea:
        "Simulate conflicting branches modifying the same lines of code, resolve them cleanly, and enable git rerere for automatic resolution",
    }),
  ],
};

// 4. UNDOING & REWRITING HISTORY
const UNDOING_AND_REWRITING_HISTORY: GitGithubRoadmapSection = {
  id: "undoing-and-rewriting-history",
  title: "Undoing & Rewriting History",
  stages: [
    stage("Undoing Uncommitted Changes", {
      left: [
        g(
          [
            n("git restore <file> (Discard working modifications)", "personal"),
            n("git clean -fd (Remove untracked files & directories)"),
            n("git checkout . (Legacy discard working changes)"),
          ],
          n("Discarding Modifications")
        ),
      ],
      right: [
        g(
          [
            n("git stash save 'wip feature'", "personal"),
            n("git stash pop & git stash apply"),
            n("git stash list & git stash show -p"),
            n("git stash drop & git stash clear"),
          ],
          n("Temporary Shelving (Stash)")
        ),
      ],
    }),
    stage("Modifying Commits", {
      left: [
        g(
          [
            n("git commit --amend (Update last commit message/files)", "personal"),
            n("git revert <commit-hash> (Safe public undo via inverse commit)", "personal"),
            n("Reverting Merge Commits (git revert -m 1)"),
          ],
          n("Amending & Safe Undos")
        ),
      ],
      right: [
        g(
          [
            n("git cherry-pick <commit-hash>", "personal"),
            n("git cherry-pick -n (Cherry-pick without commit)"),
            n("Backporting bug fixes to release branches"),
            n("Resolving cherry-pick conflicts"),
          ],
          n("Cherry Picking")
        ),
      ],
    }),
    stage("Resetting & Interactive Rebase", {
      left: [
        g(
          [
            n("git reset --soft HEAD~1 (Keep index & working tree)", "personal"),
            n("git reset --mixed HEAD~1 (Default: unstage, keep files)"),
            n("git reset --hard HEAD~1 (Discard commits, index, & files)"),
            n("Understanding risks of --hard on unpushed work"),
          ],
          n("Git Reset Modes")
        ),
      ],
      right: [
        g(
          [
            n("git rebase -i HEAD~N (Interactive rebase)", "personal"),
            n("Rebase commands: pick, reword, edit, squash, fixup, drop", "personal"),
            n("Squashing WIP commits before pull requests", "personal"),
            n("Splitting commits into smaller atomic units"),
          ],
          n("Interactive Rebase")
        ),
      ],
      noteAfter:
        "Use `git revert` for published remote commits, and reserve `git reset` or `git rebase -i` for local unpushed branches.",
      projectIdea:
        "Take a messy branch of 10 micro-commits and reorganize it into 3 clean, semantic commits using git rebase -i (fixup & reword)",
    }),
  ],
};

// 5. REMOTE COLLABORATION & PLUMBING
const REMOTE_COLLABORATION_AND_PLUMBING: GitGithubRoadmapSection = {
  id: "remote-collaboration-and-plumbing",
  title: "Remote Collaboration & Plumbing",
  stages: [
    stage("Remotes & Synchronization", {
      left: [
        g(
          [
            n("git remote add origin <url> & git remote -v"),
            n("git push -u origin <branch> (Set upstream)"),
            n("git push --force-with-lease (Safe force push)", "personal"),
            n("git push origin --delete <branch>"),
          ],
          n("Remote Repositories")
        ),
      ],
      right: [
        g(
          [
            n("git fetch origin (Download remote objects)"),
            n("git pull (fetch + merge)"),
            n("git pull --rebase (fetch + rebase onto local)", "personal"),
            n("git fetch --prune (Clean stale branches)"),
          ],
          n("Fetching & Pulling")
        ),
      ],
    }),
    stage("Recovery & History Inspection", {
      left: [
        g(
          [
            n("git reflog (Log of all HEAD references)", "personal"),
            n("Recovering dropped stashes & deleted branches", "personal"),
            n("Undoing accidental git reset --hard via reflog"),
            n("git fsck (Verify database integrity)"),
          ],
          n("The Reflog Safety Net")
        ),
      ],
      right: [
        g(
          [
            n("git blame -L <start>,<end> <file> (Line authorship)"),
            n("git log -S '<query>' (Pickaxe search)", "personal"),
            n("git bisect start / bad / good (Binary bug hunt)", "personal"),
            n("git log --grep='<term>' (Commit message search)"),
          ],
          n("Investigation & Bisect")
        ),
      ],
    }),
    stage("Worktrees & Git Plumbing", {
      left: [
        g(
          [
            n("git worktree add <path> <branch> (Multiple working trees)", "personal"),
            n("git submodule add <url> & submodule update --init"),
            n("Git Subtree (git subtree add / push)"),
          ],
          n("Multi-Repo & Worktrees")
        ),
      ],
      right: [
        g(
          [
            n("Git Hooks (pre-commit, commit-msg, pre-push)"),
            n("Husky & lint-staged automation", "personal"),
            n("Plumbing Commands (cat-file, hash-object, write-tree)"),
            n("git gc (Garbage collection & packfiles)"),
          ],
          n("Hooks & Internals")
        ),
      ],
      noteAfter:
        "`git reflog` tracks every pointer movement for HEAD. If you ever think you lost code in Git, reflog almost always lets you restore it.",
    }),
  ],
};

// 6. GITHUB ECOSYSTEM & AUTOMATION
const GITHUB_ECOSYSTEM_AND_AUTOMATION: GitGithubRoadmapSection = {
  id: "github-ecosystem-and-automation",
  title: "GitHub Ecosystem & Automation",
  stages: [
    stage("Pull Requests & Code Collaboration", {
      left: [
        g(
          [
            n("Forking vs Branch-based Collaboration"),
            n("Draft Pull Requests for Early Feedback"),
            n("PR Templates (.github/PULL_REQUEST_TEMPLATE.md)", "personal"),
            n("Linking Issues (Fixes #42, Closes #108)"),
          ],
          n("Pull Request Workflow")
        ),
      ],
      right: [
        g(
          [
            n("Code Review Comments & Suggestion Blocks", "personal", "skill-code-review"),
            n("Branch Protection Rules (Required reviews & CI)", "personal"),
            n("Repository Rulesets & Status Checks"),
            n("CODEOWNERS File for Automated Review Assignment"),
          ],
          n("Review & Governance")
        ),
      ],
    }),
    stage("GitHub Actions & CI/CD", {
      left: [
        g(
          [
            n("Workflow YAML Files (.github/workflows/*.yml)", "personal"),
            n("Triggers (push, pull_request, workflow_dispatch)"),
            n("Runners (ubuntu-latest, macos-latest, self-hosted)"),
            n("Jobs, Steps & Marketplace Actions (actions/checkout)", "personal"),
          ],
          n("Actions Fundamentals")
        ),
      ],
      right: [
        g(
          [
            n("Matrix Builds (Multiple OS & Language versions)"),
            n("Encrypted Secrets & Environment Variables", "personal"),
            n("Reusable Workflows & Composite Actions"),
            n("Automated Linting, Testing, and Continuous Delivery"),
          ],
          n("CI/CD Automation")
        ),
      ],
    }),
    stage("Releases, Packages & GitHub CLI", {
      left: [
        g(
          [
            n("Semantic Versioning (SemVer: Major.Minor.Patch)"),
            n("Annotated Git Tags (git tag -a v1.0.0 -m)", "personal"),
            n("GitHub Releases with auto-generated release notes"),
            n("GitHub Packages & Container Registry (GHCR)"),
          ],
          n("Releases & Distribution")
        ),
      ],
      right: [
        g(
          [
            n("GitHub CLI gh (gh pr create, gh run watch)", "personal"),
            n("GitHub Discussions & Issue Form Templates"),
            n("Dependabot Security Alerts & Automated PRs", "personal"),
            n("GitHub Pages for Documentation"),
          ],
          n("GitHub CLI & Productive Tools")
        ),
      ],
      noteAfter:
        "Adopting GitHub Actions with Branch Protection rules, CODEOWNERS, and the `gh` CLI automates code validation and streamlines developer workflows.",
      projectIdea:
        "Build a production-grade open source repository with GitHub Actions CI, Dependabot, CODEOWNERS, issue templates, and automated release notes",
    }),
  ],
};

export const GIT_GITHUB_SECTIONS: GitGithubRoadmapSection[] = [
  VERSION_CONTROL_FUNDAMENTALS,
  CORE_GIT_COMMANDS,
  BRANCHING_AND_MERGING,
  UNDOING_AND_REWRITING_HISTORY,
  REMOTE_COLLABORATION_AND_PLUMBING,
  GITHUB_ECOSYSTEM_AND_AUTOMATION,
];
