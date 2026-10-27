import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import AdmZip from "adm-zip";

export const MAX_SKILL_MD_BYTES = 200 * 1024; // 200 KB
export const MAX_PACKAGE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_PACKAGE_FILE_COUNT = 500; // max entries in zip archive
export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 1024;
export const SKILL_NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class SkillValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillValidationError";
  }
}

export interface ParsedAgentDef {
  name: string;
  description: string;
  tools: string[];
  systemPrompt: string;
}

export interface ParsedSkillMd {
  name: string;
  description: string;
  body: string;
  rawFrontmatter: string;
  icon?: string | null | undefined;
  author?: string | null | undefined;
  categories?: string[] | undefined;
  toolsRequired?: string[] | undefined;
  changelog?: string | null | undefined;
}

export interface SkillFileEntry {
  relativePath: string;
  sizeBytes: number;
  sha256: string;
  content: Buffer;
}

export interface ParsedSkillPackage {
  name: string;
  description: string;
  instructions: string;
  files: SkillFileEntry[];
  totalSizeBytes: number;
  icon?: string | null | undefined;
  author?: string | null | undefined;
  categories?: string[] | undefined;
  toolsRequired?: string[] | undefined;
  changelog?: string | null | undefined;
  agents?: ParsedAgentDef[] | undefined;
}

export interface RawFileInput {
  relativePath: string;
  content: Buffer;
  isSymlink?: boolean;
}

/**
 * Validates a relative file path inside a skill package to prevent path traversal.
 */
export function validateRelativePath(rawPath: string): string {
  if (typeof rawPath !== "string" || !rawPath.trim()) {
    throw new SkillValidationError("Invalid empty file path in skill package.");
  }

  // Reject null bytes, control characters, Windows drive letters, and tilde home paths
  // eslint-disable-next-line no-control-regex
  if (/[\0\x00-\x1F]/.test(rawPath)) {
    throw new SkillValidationError(`Path contains null or control characters: ${rawPath}`);
  }
  if (/^[a-zA-Z]:/.test(rawPath) || rawPath.startsWith("~")) {
    throw new SkillValidationError(`Path traversal attempt detected: ${rawPath}`);
  }

  // Normalize path using POSIX style
  const normalized = path.posix.normalize(rawPath.replace(/\\/g, "/"));

  // Reject absolute paths and parent directory traversals
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("../") ||
    normalized === ".." ||
    normalized.split("/").includes("..")
  ) {
    throw new SkillValidationError(`Path traversal attempt detected: ${rawPath}`);
  }

  // Strip leading dot-slash if present
  const cleanPath = normalized.replace(/^\.\//, "");
  if (!cleanPath) {
    throw new SkillValidationError("Resolved path is empty.");
  }

  return cleanPath;
}

/**
 * Parses and validates the contents of a SKILL.md file.
 */
export function parseSkillMd(rawContent: string | Buffer): ParsedSkillMd {
  const content = typeof rawContent === "string" ? rawContent : rawContent.toString("utf8");
  const byteLength = Buffer.byteLength(content, "utf8");

  if (byteLength > MAX_SKILL_MD_BYTES) {
    throw new SkillValidationError(
      `SKILL.md exceeds maximum allowed size of 200KB (actual: ${Math.round(byteLength / 1024)}KB).`
    );
  }

  if (!content.startsWith("---")) {
    throw new SkillValidationError("SKILL.md must begin with YAML frontmatter enclosed in '---'.");
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new SkillValidationError(
      "SKILL.md frontmatter is malformed. Ensure frontmatter is enclosed between '---' markers."
    );
  }

  const rawYaml = match[1] ?? "";
  const body = (match[2] ?? "").trim();

  let parsed: unknown;
  try {
    parsed = yaml.parse(rawYaml);
  } catch (err) {
    throw new SkillValidationError(`Failed to parse YAML frontmatter: ${(err as Error).message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SkillValidationError("Frontmatter must be a valid YAML mapping/object.");
  }

  const meta = parsed as Record<string, unknown>;

  // Validate 'name'
  if (typeof meta["name"] !== "string" || !meta["name"].trim()) {
    throw new SkillValidationError("Missing required 'name' field in frontmatter.");
  }
  const name = meta["name"].trim();
  if (name.length > MAX_NAME_LENGTH) {
    throw new SkillValidationError(
      `Skill name exceeds maximum length of ${MAX_NAME_LENGTH} characters.`
    );
  }
  if (!SKILL_NAME_REGEX.test(name)) {
    throw new SkillValidationError(
      `Invalid skill name "${name}". Name must be kebab-case (lowercase alphanumeric and single hyphens, e.g. 'csv-summary').`
    );
  }

  // Validate 'description'
  if (typeof meta["description"] !== "string" || !meta["description"].trim()) {
    throw new SkillValidationError("Missing required 'description' field in frontmatter.");
  }
  const description = meta["description"].trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new SkillValidationError(
      `Skill description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters (actual: ${description.length}).`
    );
  }

  // Optional metadata fields
  const icon = typeof meta["icon"] === "string" ? meta["icon"].trim() : null;
  const author = typeof meta["author"] === "string" ? meta["author"].trim() : null;
  const changelog = typeof meta["changelog"] === "string" ? meta["changelog"].trim() : null;

  let categories: string[] | undefined = undefined;
  if (Array.isArray(meta["categories"])) {
    categories = meta["categories"]
      .map(String)
      .map((c) => c.trim())
      .filter(Boolean);
  } else if (typeof meta["categories"] === "string") {
    categories = meta["categories"]
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  let toolsRequired: string[] | undefined = undefined;
  const rawTools = meta["tools"] ?? meta["tools_required"] ?? meta["connectors"];
  if (Array.isArray(rawTools)) {
    toolsRequired = rawTools
      .map(String)
      .map((t) => t.trim())
      .filter(Boolean);
  } else if (typeof rawTools === "string") {
    toolsRequired = rawTools
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return {
    name,
    description,
    body,
    rawFrontmatter: rawYaml,
    icon,
    author,
    categories,
    toolsRequired,
    changelog,
  };
}

/**
 * Validates security constraints for all files in a package.
 */
export function validatePackageFiles(rawFiles: RawFileInput[]): SkillFileEntry[] {
  let totalBytes = 0;
  const processedFiles: SkillFileEntry[] = [];
  const seenPaths = new Set<string>();

  for (const raw of rawFiles) {
    if (raw.isSymlink) {
      throw new SkillValidationError(
        `Symlinks are forbidden in skill packages: ${raw.relativePath}`
      );
    }

    const cleanPath = validateRelativePath(raw.relativePath);

    // Reject hidden system directories like .git
    const segments = cleanPath.split("/");
    if (segments.some((seg) => seg === ".git" || seg === ".svn" || seg === ".env")) {
      throw new SkillValidationError(`Prohibited system file/directory in package: ${cleanPath}`);
    }

    const sizeBytes = raw.content.length;
    totalBytes += sizeBytes;

    if (totalBytes > MAX_PACKAGE_BYTES) {
      throw new SkillValidationError(
        `Total skill package exceeds maximum allowed size of 20MB (exceeded at ${Math.round(totalBytes / 1024 / 1024)}MB).`
      );
    }

    // Binary restriction: disallow executable/binary files outside scripts/ and templates/
    const ext = path.extname(cleanPath).toLowerCase();
    const disallowedBinaryExts = [
      ".exe",
      ".dll",
      ".so",
      ".dylib",
      ".bin",
      ".elf",
      ".app",
      ".bat",
      ".cmd",
    ];
    const isInScriptsOrTemplates =
      cleanPath.startsWith("scripts/") || cleanPath.startsWith("templates/");
    if (disallowedBinaryExts.includes(ext) && !isInScriptsOrTemplates) {
      throw new SkillValidationError(
        `Binary files are only permitted inside scripts/ or templates/: ${cleanPath}`
      );
    }

    if (seenPaths.has(cleanPath)) {
      throw new SkillValidationError(`Duplicate file entry in skill package: ${cleanPath}`);
    }
    seenPaths.add(cleanPath);

    const sha256 = crypto.createHash("sha256").update(raw.content).digest("hex");

    processedFiles.push({
      relativePath: cleanPath,
      sizeBytes,
      sha256,
      content: raw.content,
    });
  }

  return processedFiles;
}

/**
 * Normalizes root directory: if all files in the package are wrapped under a single top-level folder
 * (e.g. `csv-summary/SKILL.md`), strip that top-level folder prefix so SKILL.md is at root.
 */
export function normalizePackageRoot(files: RawFileInput[]): RawFileInput[] {
  if (files.length === 0) return files;

  const firstSegments = files.map((f) => {
    const parts = f.relativePath.replace(/\\/g, "/").replace(/^\.\//, "").split("/");
    return parts.length > 1 ? parts[0] : null;
  });

  const rootPrefix = firstSegments[0];
  const allShareSingleRoot =
    rootPrefix !== null && firstSegments.every((seg) => seg === rootPrefix);

  if (!allShareSingleRoot || !rootPrefix) {
    return files;
  }

  // Check if stripping the root exposes SKILL.md
  const prefixLength = rootPrefix.length + 1;
  return files.map((f) => ({
    ...f,
    relativePath: f.relativePath.replace(/\\/g, "/").replace(/^\.\//, "").slice(prefixLength),
  }));
}

/**
 * Parses and validates an entire skill package from file inputs.
 */
export function parseSkillPackage(inputs: RawFileInput[]): ParsedSkillPackage {
  if (!inputs || inputs.length === 0) {
    throw new SkillValidationError("Skill package contains no files.");
  }

  // Normalize common root wrapper if uploaded as a zipped folder
  const normalizedInputs = normalizePackageRoot(inputs);

  // Validate all paths and file security
  const validatedFiles = validatePackageFiles(normalizedInputs);

  // Find SKILL.md at package root
  const skillMdFile = validatedFiles.find((f) => f.relativePath === "SKILL.md");
  if (!skillMdFile) {
    throw new SkillValidationError("Missing required 'SKILL.md' at the root of the skill package.");
  }

  const parsedMd = parseSkillMd(skillMdFile.content);
  const totalSizeBytes = validatedFiles.reduce((sum, f) => sum + f.sizeBytes, 0);

  // Parse optional agent definitions under agents/*.md
  const parsedAgents: ParsedAgentDef[] = [];
  const agentFiles = validatedFiles.filter(
    (f) => f.relativePath.startsWith("agents/") && f.relativePath.endsWith(".md")
  );

  for (const agentFile of agentFiles) {
    try {
      const content = agentFile.content.toString("utf8");
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      if (match) {
        const meta = yaml.parse(match[1] || "") as Record<string, unknown>;
        const body = (match[2] || "").trim();
        const agentName = String(meta["name"] || path.basename(agentFile.relativePath, ".md"));
        const agentDesc = String(meta["description"] || "");
        let tools: string[] = [];
        if (Array.isArray(meta["tools"])) {
          tools = meta["tools"]
            .map(String)
            .map((t) => t.trim())
            .filter(Boolean);
        } else if (typeof meta["tools"] === "string") {
          tools = meta["tools"]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
        parsedAgents.push({
          name: agentName,
          description: agentDesc,
          tools,
          systemPrompt: body,
        });
      }
    } catch {
      // ignore
    }
  }

  return {
    name: parsedMd.name,
    description: parsedMd.description,
    instructions: parsedMd.body,
    files: validatedFiles,
    totalSizeBytes,
    icon: parsedMd.icon,
    author: parsedMd.author,
    categories: parsedMd.categories,
    toolsRequired: parsedMd.toolsRequired,
    changelog: parsedMd.changelog,
    agents: parsedAgents,
  };
}

/**
 * Parses and validates a skill package from a zip buffer.
 */
export function parseSkillZip(zipBuffer: Buffer): ParsedSkillPackage {
  if (!zipBuffer || zipBuffer.length === 0) {
    throw new SkillValidationError("Empty zip archive supplied.");
  }

  let zip: AdmZip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (err) {
    throw new SkillValidationError(`Invalid zip archive: ${(err as Error).message}`);
  }

  const zipEntries = zip.getEntries();
  if (zipEntries.length > MAX_PACKAGE_FILE_COUNT) {
    throw new SkillValidationError(
      `Zip bomb detected: package contains ${zipEntries.length} entries, exceeding maximum of ${MAX_PACKAGE_FILE_COUNT}.`
    );
  }

  let preTotalUncompressed = 0;
  const seenEntryNames = new Set<string>();

  // Pre-extraction validation: check sizes, traversal, and duplicate entries before uncompressing
  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    // Check entryName for path traversal before extracting
    validateRelativePath(entry.entryName);

    if (seenEntryNames.has(entry.entryName)) {
      throw new SkillValidationError(`Duplicate entry in zip archive: ${entry.entryName}`);
    }
    seenEntryNames.add(entry.entryName);

    // Pre-extraction uncompressed size check (zip bomb prevention)
    const entrySize = entry.header?.size ?? 0;
    preTotalUncompressed += entrySize;
    if (preTotalUncompressed > MAX_PACKAGE_BYTES) {
      throw new SkillValidationError(
        `Zip bomb detected: uncompressed size exceeds ${MAX_PACKAGE_BYTES / 1024 / 1024}MB limit.`
      );
    }

    // Check for symlinks in zip entry attributes (Unix symlink attribute: 0120000)
    const isSymlink = ((entry.attr >>> 16) & 0o170000) === 0o120000;
    if (isSymlink) {
      throw new SkillValidationError(
        `Symlinks are forbidden in skill packages: ${entry.entryName}`
      );
    }
  }

  const rawFiles: RawFileInput[] = [];

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    const isSymlink = ((entry.attr >>> 16) & 0o170000) === 0o120000;
    const content = entry.getData();
    rawFiles.push({
      relativePath: entry.entryName,
      content,
      isSymlink,
    });
  }

  return parseSkillPackage(rawFiles);
}

/**
 * Parses and validates a skill package from a local directory.
 */
export async function parseSkillFolder(folderPath: string): Promise<ParsedSkillPackage> {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    throw new SkillValidationError(`Folder does not exist or is not a directory: ${folderPath}`);
  }

  const rawFiles: RawFileInput[] = [];

  function scanDir(dir: string, baseDir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        throw new SkillValidationError(
          `Symlinks are forbidden in skill packages: ${path.relative(baseDir, fullPath)}`
        );
      }
      if (entry.isDirectory()) {
        scanDir(fullPath, baseDir);
      } else if (entry.isFile()) {
        const relativePath = path.relative(baseDir, fullPath);
        const content = fs.readFileSync(fullPath);
        rawFiles.push({ relativePath, content });
      }
    }
  }

  scanDir(folderPath, folderPath);
  return parseSkillPackage(rawFiles);
}
