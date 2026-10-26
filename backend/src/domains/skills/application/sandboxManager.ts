import { exec, execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { SkillRecord } from "../repositories/skillRepository.js";

const execAsync = promisify(exec);

export const COMMAND_TIMEOUT_MS = 60000; // 60s
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
    return { fullPath, isSkillMount: true };
  }

  // Otherwise, path resolves inside workspace
  const cleanRel = normalized.replace(/^\//, "");
  const fullPath = path.resolve(paths.workspaceDir, cleanRel);

  if (!fullPath.startsWith(path.resolve(paths.workspaceDir))) {
    throw new SandboxSecurityError("Path traversal escape from workspace detected.");
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
 * Runs in the sandbox workspace directory with timeout and environment scrubbing.
 */
export async function executeBash(
  command: string,
  paths: SandboxPaths,
  options?: { timeoutMs?: number }
): Promise<{ content: string; isError?: boolean }> {
  if (!command || !command.trim()) {
    return { content: "Error: Empty command.", isError: true };
  }

  // Disallow obvious host filesystem escapes
  if (
    command.includes("/etc/passwd") ||
    command.includes("/etc/shadow") ||
    command.includes(".ssh")
  ) {
    return { content: "Error: Command rejected due to security policy.", isError: true };
  }

  // Sanitize environment variables: do not expose host secrets, API keys, or database configs
  const cleanEnv: NodeJS.ProcessEnv = {
    PATH: process.env["PATH"] || "/usr/bin:/bin:/usr/local/bin",
    HOME: paths.workspaceDir,
    LANG: "en_US.UTF-8",
    PYTHONUNBUFFERED: "1",
    // Provide python path to find skill scripts if needed
    PYTHONPATH: `${paths.skillsMountDir}:${paths.workspaceDir}`,
  };

  const timeoutMs = options?.timeoutMs ?? COMMAND_TIMEOUT_MS;

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: paths.workspaceDir,
      env: cleanEnv,
      timeout: timeoutMs,
      maxBuffer: MAX_OUTPUT_BYTES,
    });

    const output = [
      stdout ? stdout.trim() : "",
      stderr ? `STDERR:\n${stderr.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return { content: output || "(Command produced no output)" };
  } catch (err: any) {
    if (err.killed || err.signal === "SIGTERM") {
      return {
        content: `Error: Command timed out after ${timeoutMs / 1000} seconds.`,
        isError: true,
      };
    }
    const msg = [
      err.stdout ? err.stdout.trim() : "",
      err.stderr ? err.stderr.trim() : "",
      err.message ? err.message : "",
    ]
      .filter(Boolean)
      .join("\n");

    return { content: `Command failed:\n${msg}`, isError: true };
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
): { content: string; isError?: boolean; attachment?: { downloadUrl: string; fileName: string; sizeBytes: number } } {
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
    const destPath = path.join(paths.attachmentsDir, fileName);
    fs.copyFileSync(fullPath, destPath);

    const downloadUrl = `/api/conversations/${encodeURIComponent(conversationId)}/files/${encodeURIComponent(fileName)}`;

    return {
      content: `File prepared for user: ${fileName} (${stat.size} bytes). Download URL: ${downloadUrl}`,
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
