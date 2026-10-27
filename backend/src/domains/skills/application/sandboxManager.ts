import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SkillRecord } from "../repositories/skillRepository.js";
import {
  getSandboxExecutor,
  type SandboxExecutor,
  DEFAULT_COMMAND_TIMEOUT_MS,
} from "./sandboxExecutor.js";
import { checkBashRateLimit, recordBashCpuUsage } from "./rateLimits.js";

export const COMMAND_TIMEOUT_MS = DEFAULT_COMMAND_TIMEOUT_MS; // 60s
export const MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB
export const MAX_READ_BYTES = 5 * 1024 * 1024; // 5MB

export interface SandboxPaths {
  baseDir: string;
  workspaceDir: string;
  skillsMountDir: string;
  attachmentsDir: string;
}

export interface BashResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class SandboxSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxSecurityError";
  }
}

/**
 * Returns base sandbox storage directory.
 */
export function getSandboxBaseDir(conversationId: string): string {
  const custom = process.env["SANDBOX_BASE_DIR"]?.trim();
  const root = custom || path.join(os.homedir(), ".local", "share", "openedup", "sandboxes");
  return path.join(root, conversationId);
}

/**
 * Initializes and ensures the isolated sandbox directories exist for a conversation.
 */
export function initSandbox(
  conversationId: string,
  enabledSkills: SkillRecord[] = []
): SandboxPaths {
  const baseDir = getSandboxBaseDir(conversationId);
  const workspaceDir = path.join(baseDir, "workspace");
  const skillsMountDir = path.join(baseDir, "mnt", "skills");
  const attachmentsDir = path.join(baseDir, "attachments");

  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.mkdirSync(skillsMountDir, { recursive: true });
  fs.mkdirSync(attachmentsDir, { recursive: true });

  // Mount enabled skill directories read-only at /mnt/skills/{scope}/{name}/
  for (const skill of enabledSkills) {
    const targetMount = path.join(skillsMountDir, skill.scope, skill.name);
    fs.mkdirSync(targetMount, { recursive: true });

    if (skill.storagePath && fs.existsSync(skill.storagePath)) {
      copyDirRecursiveReadOnly(skill.storagePath, targetMount);
    }
  }

  try {
    fs.chmodSync(skillsMountDir, 0o555); // Read-only mount root
  } catch {
    // ignore
  }

  return {
    baseDir,
    workspaceDir,
    skillsMountDir,
    attachmentsDir,
  };
}

function copyDirRecursiveReadOnly(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursiveReadOnly(srcPath, destPath);
      try {
        fs.chmodSync(destPath, 0o555); // Read & execute only
      } catch {
        // ignore chmod issues on non-posix
      }
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      try {
        fs.chmodSync(destPath, 0o444); // Read-only
      } catch {
        // ignore chmod issues
      }
    }
  }
}

/**
 * Resolves and validates a file path inside the sandbox.
 * Rejects path traversals escaping the sandbox boundaries.
 */
export function resolveSandboxPath(
  rawPath: string,
  paths: SandboxPaths,
  allowSkillsMount = true
): { fullPath: string; isSkillMount: boolean } {
  if (!rawPath || typeof rawPath !== "string") {
    throw new SandboxSecurityError("Invalid empty file path.");
  }

  // eslint-disable-next-line no-control-regex
  if (/[\0\x00-\x1F]/.test(rawPath)) {
    throw new SandboxSecurityError("Path contains null or control characters.");
  }

  const normalized = path.posix.normalize(rawPath.replace(/\\/g, "/"));

  // Check if referencing /mnt/skills/ or mnt/skills/
  if (normalized.startsWith("/mnt/skills/") || normalized.startsWith("mnt/skills/")) {
    if (!allowSkillsMount) {
      throw new SandboxSecurityError("Access to /mnt/skills is not permitted for this operation.");
    }
    const subPath = normalized.replace(/^\/?mnt\/skills\//, "");
    const fullPath = path.resolve(paths.skillsMountDir, subPath);

    if (!fullPath.startsWith(path.resolve(paths.skillsMountDir))) {
      throw new SandboxSecurityError("Path traversal escape from /mnt/skills detected.");
    }
    if (fs.existsSync(fullPath)) {
      const realTarget = fs.realpathSync(fullPath);
      const realMount = fs.realpathSync(paths.skillsMountDir);
      if (!realTarget.startsWith(realMount)) {
        throw new SandboxSecurityError("Symlink escape from /mnt/skills detected.");
      }
    }
    return { fullPath, isSkillMount: true };
  }

  // Otherwise, path resolves inside workspace
  const cleanRel = normalized.replace(/^\//, "");
  const fullPath = path.resolve(paths.workspaceDir, cleanRel);

  if (!fullPath.startsWith(path.resolve(paths.workspaceDir))) {
    throw new SandboxSecurityError("Path traversal escape from workspace detected.");
  }

  if (fs.existsSync(fullPath)) {
    const realTarget = fs.realpathSync(fullPath);
    const realWorkspace = fs.realpathSync(paths.workspaceDir);
    if (!realTarget.startsWith(realWorkspace)) {
      throw new SandboxSecurityError("Symlink escape from workspace detected.");
    }
  }

  return { fullPath, isSkillMount: false };
}

/**
 * Tool handler: Read
 */
export function executeRead(
  filePath: string,
  paths: SandboxPaths
): { content: string; isError?: boolean } {
  try {
    const { fullPath } = resolveSandboxPath(filePath, paths, true);

    if (!fs.existsSync(fullPath)) {
      return { content: `Error: File not found: ${filePath}`, isError: true };
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return { content: `Error: Path is not a file: ${filePath}`, isError: true };
    }

    if (stat.size > MAX_READ_BYTES) {
      return {
        content: `Error: File exceeds maximum readable size of 5MB: ${filePath}`,
        isError: true,
      };
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return { content };
  } catch (err: unknown) {
    return {
      content: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}

/**
 * Tool handler: Write
 */
export function executeWrite(
  filePath: string,
  content: string,
  paths: SandboxPaths
): { content: string; isError?: boolean } {
  try {
    const normalized = path.posix.normalize(filePath.replace(/\\/g, "/"));
    if (normalized.startsWith("/mnt/skills") || normalized.startsWith("mnt/skills")) {
      return {
        content: "Error: /mnt/skills is mounted read-only and cannot be modified.",
        isError: true,
      };
    }

    const { fullPath, isSkillMount } = resolveSandboxPath(filePath, paths, false);
    if (isSkillMount) {
      return {
        content: "Error: /mnt/skills is mounted read-only and cannot be modified.",
        isError: true,
      };
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");

    const size = Buffer.byteLength(content, "utf8");
    return { content: `Successfully wrote ${size} bytes to ${filePath}` };
  } catch (err: unknown) {
    return {
      content: `Error writing file: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}

/**
 * Tool handler: Bash
 * Runs in the sandbox workspace directory via SandboxExecutor with timeout,
 * process tree termination, and strict environment stripping.
 */
export async function executeBash(
  command: string,
  paths: SandboxPaths,
  options?: {
    timeoutMs?: number;
    executor?: SandboxExecutor;
    conversationId?: string;
    userId?: string | null;
  }
): Promise<{ content: string; isError?: boolean }> {
  if (options?.conversationId) {
    const rateCheck = checkBashRateLimit(options.conversationId, options.userId);
    if (!rateCheck.allowed) {
      return {
        content: rateCheck.message || "Rate limit exceeded for Bash tool calls.",
        isError: true,
      };
    }
  }

  if (!command || !command.trim()) {
    return { content: "Error: Empty command.", isError: true };
  }

  const executor = options?.executor ?? getSandboxExecutor();
  const timeoutMs = options?.timeoutMs ?? COMMAND_TIMEOUT_MS;
  const start = Date.now();

  const result = await executor.execute(command, paths, { timeoutMs });
  const durationMs = Date.now() - start;

  if (options?.userId) {
    recordBashCpuUsage(options.userId, durationMs);
  }

  const output = [
    result.stdout ? result.stdout.trim() : "",
    result.stderr ? `STDERR:\n${result.stderr.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (result.exitCode !== 0 || result.timedOut) {
    return {
      content: output || `Command exited with code ${result.exitCode}`,
      isError: true,
    };
  }

  return { content: output || "(Command produced no output)" };
}

function makeWritableRecursive(targetPath: string): void {
  try {
    const stat = fs.lstatSync(targetPath);
    if (stat.isSymbolicLink()) {
      try {
        fs.unlinkSync(targetPath);
      } catch {
        /* ignore */
      }
      return;
    }
    if (stat.isDirectory()) {
      try {
        fs.chmodSync(targetPath, 0o777);
      } catch {
        /* ignore */
      }
      const entries = fs.readdirSync(targetPath);
      for (const entry of entries) {
        makeWritableRecursive(path.join(targetPath, entry));
      }
    } else {
      try {
        fs.chmodSync(targetPath, 0o666);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Deletes the sandbox workspace and mounts for a conversation.
 */
export function cleanupSandbox(conversationId: string): void {
  const baseDir = getSandboxBaseDir(conversationId);
  if (fs.existsSync(baseDir)) {
    makeWritableRecursive(baseDir);
    fs.rmSync(baseDir, { recursive: true, force: true });
  }
}

/**
 * Scans sandboxes and cleans up any that are older than ttlMs.
 */
export function cleanupOldSandboxes(ttlMs = 24 * 60 * 60 * 1000): number {
  const custom = process.env["SANDBOX_BASE_DIR"]?.trim();
  const root = custom || path.join(os.homedir(), ".local", "share", "openedup", "sandboxes");
  if (!fs.existsSync(root)) return 0;

  const now = Date.now();
  let cleanedCount = 0;
  const entries = fs.readdirSync(root, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(root, entry.name);
    try {
      const stat = fs.statSync(dirPath);
      if (now - stat.mtimeMs > ttlMs) {
        makeWritableRecursive(dirPath);
        fs.rmSync(dirPath, { recursive: true, force: true });
        cleanedCount++;
      }
    } catch {
      // ignore
    }
  }

  return cleanedCount;
}

let janitorInterval: NodeJS.Timeout | null = null;

export function startSandboxJanitor(options?: { ttlMs?: number; intervalMs?: number }): void {
  if (janitorInterval) return;
  const ttlMs = options?.ttlMs ?? 24 * 60 * 60 * 1000;
  const intervalMs = options?.intervalMs ?? 60 * 60 * 1000;

  janitorInterval = setInterval(() => {
    cleanupOldSandboxes(ttlMs);
  }, intervalMs);
  janitorInterval.unref();
}

export function stopSandboxJanitor(): void {
  if (janitorInterval) {
    clearInterval(janitorInterval);
    janitorInterval = null;
  }
}

/**
 * Tool handler: SendUserFile
 * Makes a generated file available to the user as a downloadable chat attachment.
 */
export function executeSendUserFile(
  filePath: string,
  conversationId: string,
  paths: SandboxPaths,
  title?: string
): {
  content: string;
  isError?: boolean;
  attachment?: { downloadUrl: string; fileName: string; sizeBytes: number };
} {
  try {
    const { fullPath } = resolveSandboxPath(filePath, paths, false);

    if (!fs.existsSync(fullPath)) {
      return { content: `Error: File not found in workspace: ${filePath}`, isError: true };
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return { content: `Error: Path is not a file: ${filePath}`, isError: true };
    }

    const fileName = path.basename(fullPath);
    const displayTitle = title?.trim().slice(0, 120) || fileName;
    const destPath = path.join(paths.attachmentsDir, fileName);
    fs.copyFileSync(fullPath, destPath);

    const downloadUrl = `/api/conversations/${encodeURIComponent(conversationId)}/files/${encodeURIComponent(fileName)}`;

    return {
      content: `File prepared for user: ${displayTitle} (${fileName}, ${stat.size} bytes). Download URL: ${downloadUrl}`,
      attachment: {
        downloadUrl,
        fileName,
        sizeBytes: stat.size,
      },
    };
  } catch (err: unknown) {
    return {
      content: `Error sending file: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}
