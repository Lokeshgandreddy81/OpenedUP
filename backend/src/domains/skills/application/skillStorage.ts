import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SkillFileEntry } from "./skillParser.js";

export function getSkillsStorageDir(): string {
  const custom = process.env["SKILLS_STORAGE_DIR"]?.trim();
  if (custom) return custom;
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
export function writeSkillFilesToDisk(
  targetDir: string,
  files: SkillFileEntry[]
): void {
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
export function readSkillFileFromDisk(
  storagePath: string,
  relativePath: string
): Buffer | null {
  const fullPath = path.join(storagePath, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}
