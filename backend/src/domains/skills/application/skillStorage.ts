import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SkillFileEntry } from "./skillParser.js";

export class SkillIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillIntegrityError";
  }
}

export function getSkillsStorageDir(): string {
  const custom = process.env["SKILLS_STORAGE_DIR"]?.trim();
  if (custom) return custom;
  const dbPath = process.env["CHAT_DB_PATH"]?.trim();
  if (dbPath && dbPath !== ":memory:") {
    return path.join(path.dirname(dbPath), "skills");
  }
  return path.join(os.homedir(), ".local", "share", "openedup", "skills");
}

/**
 * Resolves the immutable on-disk directory for a specific skill and version.
 * e.g., `<root>/<scope>/<name>/v<version>`
 */
export function resolveSkillVersionDir(scope: string, name: string, version: number): string {
  const root = getSkillsStorageDir();
  return path.join(root, scope, name, `v${version}`);
}

/**
 * Writes skill files immutably to the disk target directory.
 */
export function writeSkillFilesToDisk(targetDir: string, files: SkillFileEntry[]): void {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const file of files) {
    const fullPath = path.join(targetDir, file.relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content);
  }
}

/**
 * Reads a specific file from disk for a skill.
 */
export function readSkillFileFromDisk(storagePath: string, relativePath: string): Buffer | null {
  const fullPath = path.join(storagePath, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}

/**
 * Reads a skill file from disk and verifies its sha256 checksum.
 * Throws SkillIntegrityError if the file on disk was modified or tampered with.
 */
export function readSkillFileWithVerification(
  storagePath: string,
  relativePath: string,
  expectedSha256: string
): Buffer {
  const content = readSkillFileFromDisk(storagePath, relativePath);
  if (!content) {
    throw new Error(`Skill file not found on disk: ${relativePath}`);
  }

  const actualSha256 = crypto.createHash("sha256").update(content).digest("hex");
  if (actualSha256 !== expectedSha256) {
    throw new SkillIntegrityError(
      `File integrity verification failed for ${relativePath}: hash mismatch (expected ${expectedSha256}, got ${actualSha256})`
    );
  }

  return content;
}

/**
 * Verifies that all files in a skill package match their recorded sha256 checksums.
 */
export function verifySkillPackageIntegrity(
  storagePath: string,
  files: Array<{ relativePath: string; sha256: string }>
): boolean {
  for (const file of files) {
    readSkillFileWithVerification(storagePath, file.relativePath, file.sha256);
  }
  return true;
}
