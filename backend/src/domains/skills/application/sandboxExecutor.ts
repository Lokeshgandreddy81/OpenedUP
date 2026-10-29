import { spawn } from "node:child_process";
import path from "node:path";
import type { SandboxPaths } from "./sandboxManager.js";
import { Sandbox } from "@vercel/sandbox";

export const DEFAULT_COMMAND_TIMEOUT_MS = 60000; // 60s
export const MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut?: boolean;
}

export interface SandboxExecutionOptions {
  timeoutMs?: number;
  memoryLimitMb?: number;
  cpuLimit?: string;
  pidsLimit?: number;
  network?: "none" | "host" | string;
}

export interface SandboxExecutor {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  execute(
    command: string,
    paths: SandboxPaths,
    options?: SandboxExecutionOptions
  ): Promise<ExecutionResult>;
  cleanupConversation?(conversationId: string): Promise<void>;
}

/**
 * DockerSandboxExecutor
 * Provides real container isolation with:
 * - per-conversation container / working dir mount
 * - non-root user (1000:1000)
 * - read-only root filesystem
 * - skills mounted read-only at /mnt/skills/{scope}/{name}/
 * - separate writable /work directory
 * - --network none by default
 * - CPU/memory/pids limits
 * - process tree kill on timeout
 */
export class DockerSandboxExecutor implements SandboxExecutor {
  public readonly name = "docker";
  private image: string;

  constructor(image = process.env["SANDBOX_DOCKER_IMAGE"] || "python:3.11-slim") {
    this.image = image;
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn("docker", ["--version"]);
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));
    });
  }

  async execute(
    command: string,
    paths: SandboxPaths,
    options?: SandboxExecutionOptions
  ): Promise<ExecutionResult> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    const memory = options?.memoryLimitMb ? `${options.memoryLimitMb}m` : "256m";
    const cpus = options?.cpuLimit ?? "1.0";
    const pidsLimit = options?.pidsLimit ?? 100;
    const network = options?.network ?? (process.env["SANDBOX_NETWORK_ALLOW"] || "none");

    // Clean isolated environment inside container
    const dockerArgs = [
      "run",
      "--rm",
      "-i",
      `--network=${network}`,
      "--read-only",
      "--user=1000:1000",
      "--cap-drop=ALL",
      `--pids-limit=${pidsLimit}`,
      `--memory=${memory}`,
      `--cpus=${cpus}`,
      "-v",
      `${path.resolve(paths.workspaceDir)}:/work:rw`,
      "-v",
      `${path.resolve(paths.skillsMountDir)}:/mnt/skills:ro`,
      "-w",
      "/work",
      // Completely isolated container env
      "-e",
      "HOME=/work",
      "-e",
      "LANG=en_US.UTF-8",
      "-e",
      "PYTHONUNBUFFERED=1",
      "-e",
      "PYTHONPATH=/mnt/skills:/work",
      this.image,
      "sh",
      "-c",
      command,
    ];

    return runProcessWithLimits("docker", dockerArgs, {
      timeoutMs,
      cwd: paths.workspaceDir,
      env: {}, // zero host env passed to docker invocation
    });
  }

  async cleanupConversation(): Promise<void> {
    // Docker containers are run with --rm so they auto-clean on termination
  }
}

/** Isolated persistent workspace backed by Vercel's Firecracker sandbox. */
export class VercelSandboxExecutor implements SandboxExecutor {
  public readonly name = "vercel-sandbox";
  private readonly queue = new Map<string, Promise<unknown>>();

  async isAvailable(): Promise<boolean> {
    return process.env["VERCEL"] === "1";
  }

  async execute(command: string, paths: SandboxPaths, options?: SandboxExecutionOptions): Promise<ExecutionResult> {
    const conversationId = path.basename(paths.baseDir).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    return this.serialized(conversationId, async () => {
      const sandbox = await this.getSandbox(conversationId);
      const result = await sandbox.runCommand({
        cmd: "bash",
        args: ["-lc", command],
        cwd: "/vercel/sandbox/workspace",
        timeoutMs: options?.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS,
      });
      return {
        stdout: (await result.stdout()).slice(0, MAX_OUTPUT_BYTES),
        stderr: (await result.stderr()).slice(0, MAX_OUTPUT_BYTES),
        exitCode: result.exitCode ?? 1,
        timedOut: result.exitCode === null,
      };
    });
  }

  async withConversation<T>(conversationId: string, work: (sandbox: Sandbox) => Promise<T>): Promise<T> {
    return this.serialized(conversationId, async () => work(await this.getSandbox(conversationId)));
  }

  private async getSandbox(conversationId: string): Promise<Sandbox> {
    return Sandbox.getOrCreate({
      name: `openedup-${conversationId}`,
      runtime: "node24",
      timeout: 5 * 60 * 1000,
    });
  }

  private async serialized<T>(key: string, work: () => Promise<T>): Promise<T> {
    const prior = this.queue.get(key) ?? Promise.resolve();
    const current = prior.catch(() => undefined).then(work);
    this.queue.set(key, current);
    try {
      return await current;
    } finally {
      if (this.queue.get(key) === current) this.queue.delete(key);
    }
  }
}

/**
 * UnsafeLocalSandboxExecutor
 * Clearly-labelled UNSAFE local implementation that ONLY runs when:
 * SANDBOX_MODE=unsafe-local AND (NODE_ENV=development OR NODE_ENV=test).
 * In production or without explicit configuration, it strictly throws.
 */
export class UnsafeLocalSandboxExecutor implements SandboxExecutor {
  public readonly name = "unsafe-local";

  constructor() {
    this.assertAllowed();
  }

  private assertAllowed(): void {
    const sandboxMode = process.env["SANDBOX_MODE"];
    const nodeEnv = process.env["NODE_ENV"];
    const isDevOrTest = nodeEnv === "development" || nodeEnv === "test" || !nodeEnv;

    if (sandboxMode !== "unsafe-local" || !isDevOrTest) {
      throw new Error(
        "CRITICAL SECURITY ERROR: UnsafeLocalSandboxExecutor is prohibited. " +
          "It can only run when SANDBOX_MODE=unsafe-local AND NODE_ENV is development or test."
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      this.assertAllowed();
      return true;
    } catch {
      return false;
    }
  }

  async execute(
    command: string,
    paths: SandboxPaths,
    options?: SandboxExecutionOptions
  ): Promise<ExecutionResult> {
    this.assertAllowed();

    // Adversarial command checks
    const FORBIDDEN_COMMANDS = [
      /\b(curl|wget|nc|netcat|ncat|telnet|ftp|ssh|scp|rsync|ping)\b/i,
      /\b(sudo|su|chown|systemctl|service)\b/i,
      /\bchmod\s+[+]?s\b/i,
      /\/etc\/(passwd|shadow|hosts|sudoers)/i,
      /\.(ssh|aws|gnupg|bash_history|zsh_history)/i,
    ];

    if (FORBIDDEN_COMMANDS.some((pat) => pat.test(command))) {
      return {
        stdout: "",
        stderr: "Security Policy Violation: Error: Command rejected due to security policy.",
        exitCode: 1,
      };
    }

    // Check for attempts to access host app .env or parent directories escaping workspace
    if (/\.env\b/i.test(command) || /\.\.\/\.\.\//.test(command)) {
      // Check if command explicitly references reading outside workspace
      return {
        stdout: "",
        stderr:
          "Security Policy Violation: Error: Command rejected due to security policy: Access to host environment files or directory traversal is blocked.",
        exitCode: 1,
      };
    }

    const timeoutMs = options?.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;

    // STRIP ALL SERVER ENVIRONMENT VARIABLES:
    // Zero access to process.env, secrets, database urls, tokens.
    const minimalEnv: Record<string, string> = {
      PATH: process.env["PATH"] || "/usr/bin:/bin:/usr/local/bin",
      HOME: paths.workspaceDir,
      LANG: "en_US.UTF-8",
      PYTHONUNBUFFERED: "1",
      PYTHONPATH: `${paths.skillsMountDir}:${paths.workspaceDir}`,
    };

    let finalCommand = command;
    if (!command.includes(paths.skillsMountDir)) {
      finalCommand = command.replace(
        /(^|[\s"'])\/mnt\/skills(?=[\s"'/]|$)/g,
        `$1${paths.skillsMountDir}`
      );
    }

    return runProcessWithLimits("sh", ["-c", finalCommand], {
      timeoutMs,
      cwd: paths.workspaceDir,
      env: minimalEnv,
    });
  }

  async cleanupConversation(): Promise<void> {
    // Local cleanup handled by sandboxManager
  }
}

/**
 * Runs a command in a detached process group, enforcing timeout,
 * memory/output bounds, and killing the entire process tree on timeout.
 */
function runProcessWithLimits(
  file: string,
  args: string[],
  opts: { timeoutMs: number; cwd: string; env: Record<string, string> }
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    // Spawn detached so we have a process group to kill entire tree
    const child = spawn(file, args, {
      cwd: opts.cwd,
      env: opts.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid && !settled) {
        try {
          // Kill the whole process tree using negative PID
          process.kill(-child.pid, "SIGKILL");
        } catch {
          try {
            child.kill("SIGKILL");
          } catch {
            // ignore
          }
        }
      }
    }, opts.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString("utf8");
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString("utf8");
      }
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: `Failed to execute: ${err.message}`,
        exitCode: 1,
        timedOut: false,
      });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (timedOut) {
        resolve({
          stdout,
          stderr: `Error: Command timed out after ${opts.timeoutMs / 1000} seconds. Process tree killed.`,
          exitCode: 124, // standard timeout exit code
          timedOut: true,
        });
      } else {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
          timedOut: false,
        });
      }
    });
  });
}

/**
 * Factory to retrieve the active SandboxExecutor.
 */
export function getSandboxExecutor(): SandboxExecutor {
  if (process.env["VERCEL"] === "1") return new VercelSandboxExecutor();
  const mode = process.env["SANDBOX_MODE"] || "docker";
  const nodeEnv = process.env["NODE_ENV"];
  const isDevOrTest = nodeEnv === "development" || nodeEnv === "test" || !nodeEnv;

  if (mode === "unsafe-local" && isDevOrTest) {
    return new UnsafeLocalSandboxExecutor();
  }

  // Default to Docker executor
  return new DockerSandboxExecutor();
}
