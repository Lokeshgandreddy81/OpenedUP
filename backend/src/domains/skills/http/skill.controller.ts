import type { Request, Response } from "express";
import { SkillRepository, type SkillScope, type SkillRecord } from "../repositories/skillRepository.js";
import {
  parseSkillZip,
  parseSkillPackage,
  SkillValidationError,
} from "../application/skillParser.js";
import {
  resolveSkillVersionDir,
  writeSkillFilesToDisk,
} from "../application/skillStorage.js";

let activeRepository: SkillRepository | null = null;

export function getSkillRepository(): SkillRepository {
  activeRepository ??= new SkillRepository();
  return activeRepository;
}

export function setSkillRepository(repo: SkillRepository | null): void {
  activeRepository = repo;
}

function resolvePrincipal(req: Request): { userId: string; orgId: string | null; isAdmin: boolean } {
  const userId = req.principal?.uid || "guest";
  const orgId = (req.headers["x-org-id"] as string) || null;
  const isAdminHeader = req.headers["x-is-admin"] === "true";
  const isDev = process.env["NODE_ENV"] !== "production";
  return {
    userId,
    orgId,
    isAdmin: isAdminHeader || (isDev && !req.principal),
  };
}

function canViewSkill(skill: SkillRecord, userId: string, orgId: string | null): boolean {
  if (skill.scope === "builtin") return true;
  if (skill.scope === "user" && skill.ownerId === userId) return true;
  if (skill.scope === "org" && orgId && skill.orgId === orgId) return true;
  return false;
}

function canEditSkill(skill: SkillRecord, userId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (skill.scope === "user" && skill.ownerId === userId) return true;
  return false;
}

export function listSkills(req: Request, res: Response): void {
  const repo = getSkillRepository();
  const { userId, orgId } = resolvePrincipal(req);
  const scopeQuery = req.query["scope"] as SkillScope | undefined;
  const searchQuery = req.query["q"] as string | undefined;

  const skills = repo.listVisible(userId, orgId, {
    scope: scopeQuery,
    query: searchQuery,
  });

  const responseItems = skills.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    scope: s.scope,
    version: s.version,
    ownerId: s.ownerId,
    orgId: s.orgId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  res.json({ skills: responseItems });
}

export function getSkill(req: Request, res: Response): void {
  const repo = getSkillRepository();
  const { userId, orgId } = resolvePrincipal(req);
  const id = req.params["id"]!;

  const skill = repo.get(id);
  if (!skill || !canViewSkill(skill, userId, orgId)) {
    res.status(404).json({ error: "Skill not found or access denied.", requestId: req.id });
    return;
  }

  const files = repo.listFiles(id);

  res.json({
    skill: {
      ...skill,
      files: files.map((f) => ({
        id: f.id,
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
        createdAt: f.createdAt,
      })),
    },
  });
}

export async function createSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const { userId, orgId, isAdmin } = resolvePrincipal(req);

  try {
    let zipBuffer: Buffer | null = null;

    if (req.file?.buffer) {
      zipBuffer = req.file.buffer;
    } else if (typeof req.body?.zipBase64 === "string") {
      zipBuffer = Buffer.from(req.body.zipBase64, "base64");
    }

    if (!zipBuffer || zipBuffer.length === 0) {
      res.status(400).json({
        error: "Missing skill package. Upload a zip file or provide zipBase64.",
        requestId: req.id,
      });
      return;
    }

    const requestedScope = (req.body?.scope as SkillScope) || "user";
    if (requestedScope !== "user" && !isAdmin) {
      res.status(403).json({
        error: "Creating 'builtin' or 'org' skills requires administrator privileges.",
        requestId: req.id,
      });
      return;
    }

    const parsed = parseSkillZip(zipBuffer);

    // Check if skill with this name already exists in this scope
    const existing = repo.getByNameAndScope(
      parsed.name,
      requestedScope,
      requestedScope === "user" ? userId : null,
      requestedScope === "org" ? orgId : null
    );

    if (existing) {
      res.status(409).json({
        error: `A skill named '${parsed.name}' already exists in ${requestedScope} scope. Use PUT to create a new version.`,
        requestId: req.id,
      });
      return;
    }

    const versionDir = resolveSkillVersionDir(requestedScope, parsed.name, 1);
    writeSkillFilesToDisk(versionDir, parsed.files);

    const created = repo.create({
      name: parsed.name,
      description: parsed.description,
      scope: requestedScope,
      ownerId: requestedScope === "user" ? userId : null,
      orgId: requestedScope === "org" ? orgId : null,
      storagePath: versionDir,
      version: 1,
      isActive: true,
    });

    const fileRecords = repo.addFiles(
      created.id,
      parsed.files.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );

    res.status(201).json({
      skill: {
        ...created,
        files: fileRecords,
      },
    });
  } catch (error: unknown) {
    if (error instanceof SkillValidationError) {
      res.status(400).json({ error: error.message, requestId: req.id });
      return;
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create skill.",
      requestId: req.id,
    });
  }
}

export async function updateSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const { userId, isAdmin } = resolvePrincipal(req);
  const id = req.params["id"]!;

  const existing = repo.get(id);
  if (!existing) {
    res.status(404).json({ error: "Skill not found.", requestId: req.id });
    return;
  }

  if (!canEditSkill(existing, userId, isAdmin)) {
    res.status(403).json({ error: "Permission denied to edit this skill.", requestId: req.id });
    return;
  }

  try {
    let zipBuffer: Buffer | null = null;
    if (req.file?.buffer) {
      zipBuffer = req.file.buffer;
    } else if (typeof req.body?.zipBase64 === "string") {
      zipBuffer = Buffer.from(req.body.zipBase64, "base64");
    }

    if (!zipBuffer || zipBuffer.length === 0) {
      res.status(400).json({
        error: "Missing updated skill package. Upload a zip file or provide zipBase64.",
        requestId: req.id,
      });
      return;
    }

    const parsed = parseSkillZip(zipBuffer);
    if (parsed.name !== existing.name) {
      res.status(400).json({
        error: `Package skill name '${parsed.name}' does not match existing skill '${existing.name}'.`,
        requestId: req.id,
      });
      return;
    }

    const nextVersion = existing.version + 1;
    const versionDir = resolveSkillVersionDir(existing.scope, existing.name, nextVersion);
    writeSkillFilesToDisk(versionDir, parsed.files);

    const updated = repo.update(id, {
      description: parsed.description,
      storagePath: versionDir,
      version: nextVersion,
    });

    const fileRecords = repo.replaceFiles(
      id,
      parsed.files.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );

    res.json({
      skill: {
        ...updated,
        files: fileRecords,
      },
    });
  } catch (error: unknown) {
    if (error instanceof SkillValidationError) {
      res.status(400).json({ error: error.message, requestId: req.id });
      return;
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update skill.",
      requestId: req.id,
    });
  }
}

export function deleteSkill(req: Request, res: Response): void {
  const repo = getSkillRepository();
  const { userId, isAdmin } = resolvePrincipal(req);
  const id = req.params["id"]!;

  const existing = repo.get(id);
  if (!existing) {
    res.status(404).json({ error: "Skill not found.", requestId: req.id });
    return;
  }

  if (!canEditSkill(existing, userId, isAdmin)) {
    res.status(403).json({ error: "Permission denied to delete this skill.", requestId: req.id });
    return;
  }

  repo.delete(id);
  res.status(204).end();
}

export function getConversationSkills(req: Request, res: Response): void {
  const repo = getSkillRepository();
  const conversationId = req.params["id"]!;
  const skills = repo.getConversationSkills(conversationId);
  res.json({ skills });
}

export function setConversationSkills(req: Request, res: Response): void {
  const repo = getSkillRepository();
  const { userId, orgId } = resolvePrincipal(req);
  const conversationId = req.params["id"]!;
  const skillIds = (req.body?.skill_ids as string[]) || (req.body?.skillIds as string[]) || [];

  if (!Array.isArray(skillIds)) {
    res.status(400).json({ error: "skill_ids must be an array of string IDs.", requestId: req.id });
    return;
  }

  // Verify that the user has permission to see EACH skill
  for (const skillId of skillIds) {
    const skill = repo.get(skillId);
    if (!skill || !canViewSkill(skill, userId, orgId)) {
      res.status(403).json({
        error: `Cannot enable skill '${skillId}': skill not found or access denied.`,
        requestId: req.id,
      });
      return;
    }
  }

  const enabled = repo.setConversationSkills(conversationId, skillIds, userId);
  res.json({ skills: enabled });
}

export function getProjectSkills(req: Request, res: Response): void {
  const repo = getSkillRepository();
  const projectId = req.params["id"]!;
  const skills = repo.getProjectSkills(projectId);
  res.json({ skills });
}

export function setProjectSkills(req: Request, res: Response): void {
  const repo = getSkillRepository();
  const { userId, orgId } = resolvePrincipal(req);
  const projectId = req.params["id"]!;
  const skillIds = (req.body?.skill_ids as string[]) || (req.body?.skillIds as string[]) || [];

  if (!Array.isArray(skillIds)) {
    res.status(400).json({ error: "skill_ids must be an array of string IDs.", requestId: req.id });
    return;
  }

  // Verify that the user has permission to see EACH skill
  for (const skillId of skillIds) {
    const skill = repo.get(skillId);
    if (!skill || !canViewSkill(skill, userId, orgId)) {
      res.status(403).json({
        error: `Cannot enable skill '${skillId}': skill not found or access denied.`,
        requestId: req.id,
      });
      return;
    }
  }

  const enabled = repo.setProjectSkills(projectId, skillIds);
  res.json({ skills: enabled });
}
