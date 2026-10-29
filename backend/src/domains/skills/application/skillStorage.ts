import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SkillFileEntry } from "./skillParser.js";
import { getSupabaseStorageAdmin } from "../../../platform/storage/supabaseStorage.js";

const SKILL_FILES_BUCKET = "openedup-skill-files";
const REMOTE_SKILL_PREFIX = "supabase://skills/";

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

export function createSkillStoragePath(skillId: string, version: number): string {
  if (process.env["VERCEL"] === "1" || process.env["DATABASE_URL"]?.trim()) {
    return `${REMOTE_SKILL_PREFIX}${skillId}/v${version}`;
  }
  return path.join(getSkillsStorageDir(), "skills", skillId, `v${version}`);
}

function remoteObjectPath(storagePath: string, relativePath: string): string {
  const prefix = storagePath.slice(REMOTE_SKILL_PREFIX.length);
  const segments = relativePath.replace(/\\/g, "/").split("/");
  if (
    !prefix ||
    prefix.startsWith("/") ||
    prefix.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Invalid skill storage path.");
  }
  return `skills/${prefix}/${segments.join("/")}`;
}

export async function persistSkillFiles(storagePath: string, files: SkillFileEntry[]): Promise<void> {
  if (!storagePath.startsWith(REMOTE_SKILL_PREFIX)) {
    writeSkillFilesToDisk(storagePath, files);
    return;
  }
  const bucket = getSupabaseStorageAdmin().storage.from(SKILL_FILES_BUCKET);
  for (const file of files) {
    const contentType = file.relativePath.toLowerCase().endsWith(".md")
      ? "text/markdown"
      : "application/octet-stream";
    const { error } = await bucket.upload(remoteObjectPath(storagePath, file.relativePath), file.content, {
      contentType,
      upsert: true,
    });
    if (error) throw new Error("Could not persist skill package content to Supabase Storage.");
  }
}

export async function readSkillFile(storagePath: string, relativePath: string): Promise<Buffer | null> {
  if (!storagePath.startsWith(REMOTE_SKILL_PREFIX)) {
    return readSkillFileFromDisk(storagePath, relativePath);
  }
  const { data, error } = await getSupabaseStorageAdmin()
    .storage.from(SKILL_FILES_BUCKET)
    .download(remoteObjectPath(storagePath, relativePath));
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
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
