import crypto from "node:crypto";
import type { Request, Response } from "express";
import {
  SkillRepository,
  type SkillScope,
  type SkillRecord,
  type SkillApprovalStatus,
} from "../repositories/skillRepository.js";
import {
  parseSkillZip,
  parseSkillPackage,
  SkillValidationError,
  type RawFileInput,
  type ParsedSkillPackage,
} from "../application/skillParser.js";
import { validateSkillDraft } from "../application/skillValidator.js";
import { initSandbox, cleanupSandbox, executeBash } from "../application/sandboxManager.js";
import { handleSkillToolCall } from "../application/skillToolHandler.js";
import {
  createSkillStoragePath,
  persistSkillFiles,
  readSkillFile,
} from "../application/skillStorage.js";
import { getRequestIdentity } from "../../../platform/auth/identity.js";
import { checkUploadRateLimit } from "../application/rateLimits.js";
import {
  deleteUserUploads,
  downloadGeneratedFile,
  downloadUserUpload,
} from "../../../platform/storage/supabaseStorage.js";
import { ConversationRepository } from "../../conversations/repositories/conversationRepository.js";

let activeRepository: SkillRepository | null = null;

function normalizeRawFiles(value: unknown): RawFileInput[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new SkillValidationError("Skill files must be an array.");
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new SkillValidationError("Each skill file must include a path and text content.");
    }
    const file = entry as Record<string, unknown>;
    if (typeof file["relativePath"] !== "string" || typeof file["content"] !== "string") {
      throw new SkillValidationError("Each skill file must include a path and text content.");
    }
    return {
      relativePath: file["relativePath"],
      content: Buffer.from(file["content"], "utf8"),
    };
  });
}

export function getSkillRepository(): SkillRepository {
  activeRepository ??= new SkillRepository();
  return activeRepository;
}

export function setSkillRepository(repo: SkillRepository | null): void {
  activeRepository = repo;
}

function canViewSkill(skill: SkillRecord, userId: string, orgId: string | null): boolean {
  if (skill.ownerId === userId) return true;
  if (skill.approvalStatus !== "approved") return false;
  if (skill.scope === "builtin" || skill.scope === "directory") return true;
  if (skill.scope === "org" && orgId && skill.orgId === orgId) return true;
  return false;
}

function canEditSkill(skill: SkillRecord, userId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (skill.scope !== "builtin" && skill.ownerId === userId) return true;
  return false;
}

export async function listSkills(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const userId = identity.userId;
  const orgId = identity.orgId;
  const scopeQuery = req.query["scope"] as SkillScope | undefined;
  const searchQuery = req.query["q"] as string | undefined;

  const skills = await repo.listVisible(userId, orgId, {
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

export async function getSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const userId = identity.userId;
  const orgId = identity.orgId;
  const id = req.params["id"]!;

  const skill = await repo.get(id);
  if (!skill || !canViewSkill(skill, userId, orgId)) {
    res.status(404).json({ error: "Skill not found or access denied.", requestId: req.id });
    return;
  }

  const files = await repo.listFiles(id);

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

export async function listDirectorySkills(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const category = req.query["category"] as string | undefined;
  const q = req.query["q"] as string | undefined;

  const skills = await repo.listDirectorySkills({ category, query: q });
  const enriched = await Promise.all(
    skills.map(async (s) => ({
      ...s,
      categories: await repo.getSkillCategories(s.id),
      agentsCount: (await repo.listSkillAgents(s.id)).length,
    }))
  );

  res.json({ skills: enriched });
}

export async function listCategories(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const categories = await repo.listCategories();
  res.json({ categories });
}

export async function addDirectorySkillToLibrary(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const skillId = req.params["id"]!;

  try {
    const userCopy = await repo.addDirectorySkillToUserLibrary(skillId, identity.userId);
    res.status(201).json({ skill: userCopy });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message, requestId: req.id });
  }
}

export async function getSkillVersions(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const id = req.params["id"]!;

  const skill = await repo.get(id);
  if (!skill || !canViewSkill(skill, identity.userId, identity.orgId)) {
    res.status(404).json({ error: "Skill not found or access denied.", requestId: req.id });
    return;
  }

  const versions = await repo.listSkillVersions(id);
  res.json({ versions });
}

export async function getSkillContents(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const id = req.params["id"]!;

  const skill = await repo.get(id);
  if (!skill || !canViewSkill(skill, identity.userId, identity.orgId)) {
    res.status(404).json({ error: "Skill not found or access denied.", requestId: req.id });
    return;
  }

  const files = await repo.listFiles(id);
  const filesWithContent = await Promise.all(
    files.map(async (f) => {
      let textContent: string | null = null;
      const isText = /\.(md|py|js|ts|json|txt|yaml|yml|sh|env|csv|html|css)$/i.test(f.relativePath);
      if (isText && skill.storagePath) {
        const buffer = await readSkillFile(skill.storagePath, f.relativePath);
        if (buffer) {
          textContent = buffer.toString("utf8");
        }
      }
      return {
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
        isText,
        content: textContent,
      };
    })
  );

  const agents = await repo.listSkillAgents(id);
  const categories = await repo.getSkillCategories(id);

  res.json({
    skill: {
      ...skill,
      categories,
      agents,
      files: filesWithContent,
    },
  });
}

export async function createSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const userId = identity.userId;
  const orgId = identity.orgId;
  const isAdmin = identity.role === "admin";
  let tempUploadPath: string | null = null;
  const storagePath = typeof req.body?.storagePath === "string" ? req.body.storagePath : null;
  if (storagePath && userId) {
    res.once("finish", () => void deleteUserUploads(userId, [storagePath]));
  }

  try {
    const requestedScope = (req.body?.scope as SkillScope) || "user";
    if (
      (requestedScope === "builtin" ||
        (requestedScope === "org" && !isAdmin && req.body?.approvalStatus !== "draft")) &&
      !isAdmin
    ) {
      res.status(403).json({
        error: "Creating 'builtin' or 'org' skills requires administrator privileges.",
        requestId: req.id,
      });
      return;
    }

    const uploadRateStatus = checkUploadRateLimit(userId || req.ip || "global");
    if (!uploadRateStatus.allowed) {
      res.status(429).json({
        error: uploadRateStatus.message || "Upload rate limit exceeded.",
        retryAfter: uploadRateStatus.retryAfterSeconds,
        requestId: req.id,
      });
      return;
    }

    let parsed: ParsedSkillPackage;

    if (req.body?.skillMd) {
      const rawFiles: RawFileInput[] = [
        { relativePath: "SKILL.md", content: Buffer.from(String(req.body.skillMd), "utf8") },
        ...normalizeRawFiles(req.body.files),
      ];
      parsed = parseSkillPackage(rawFiles);
    } else {
      let zipBuffer: Buffer | null = null;

      if (storagePath) {
        if (!userId) throw new SkillValidationError("Sign in to upload a skill package.");
        zipBuffer = await downloadUserUpload(userId, storagePath, "skill-package");
      } else if (req.file?.path) {
        tempUploadPath = req.file.path;
        zipBuffer = fs.readFileSync(req.file.path);
      } else if (req.file?.buffer) {
        zipBuffer = req.file.buffer;
      } else if (typeof req.body?.zipBase64 === "string") {
        zipBuffer = Buffer.from(req.body.zipBase64, "base64");
      }

      if (!zipBuffer || zipBuffer.length === 0) {
        res.status(400).json({
          error:
            "Missing skill package. Upload a file (.zip, .md, .pdf), provide zipBase64, or provide skillMd.",
          requestId: req.id,
        });
        return;
      }

      const originalName = (req.file?.originalname || req.body?.fileName || "").toLowerCase();
      if (
        originalName.endsWith(".md") ||
        originalName.endsWith(".markdown") ||
        originalName.endsWith(".txt")
      ) {
        const textContent = zipBuffer.toString("utf8");
        const baseName =
          path
            .parse(req.file?.originalname || "custom-skill")
            .name.toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/^-+|-+$/g, "") || "custom-skill";
        const hasFm = textContent.trimStart().startsWith("---");
        const skillMd = hasFm
          ? textContent
          : `---\nname: ${baseName}\ndescription: Used for custom instructions from ${req.file?.originalname}\n---\n${textContent}`;
        parsed = parseSkillPackage([
          { relativePath: "SKILL.md", content: Buffer.from(skillMd, "utf8") },
        ]);
      } else {
        parsed = parseSkillZip(zipBuffer);
      }
    }

    // Check if skill with this name already exists in this scope
    const existing = await repo.getByNameAndScope(
      parsed.name,
      requestedScope,
      requestedScope === "user" ? userId : null,
      requestedScope === "org" ? orgId : null
    );

    if (existing) {
      // In user scope, if owned by user, smoothly update to next version instead of failing with 409
      if (existing.scope === "user" && canEditSkill(existing, userId, isAdmin)) {
        const nextVersion = existing.version + 1;
        const versionDir = createSkillStoragePath(existing.id, nextVersion);
        await persistSkillFiles(versionDir, parsed.files);

        const updated = await repo.update(existing.id, {
          description: parsed.description,
          storagePath: versionDir,
          version: nextVersion,
        });

        const fileRecords = await repo.replaceFiles(
          existing.id,
          parsed.files.map((f) => ({
            relativePath: f.relativePath,
            sizeBytes: f.sizeBytes,
            sha256: f.sha256,
          }))
        );

        if (parsed.categories?.length) {
          for (const catName of parsed.categories) {
            const catId = await repo.ensureCategory(catName);
            await repo.linkSkillCategory(existing.id, catId);
          }
        }

        if (parsed.agents?.length) {
          await repo.saveSkillAgents(
            existing.id,
            parsed.agents.map((ag) => ({
              name: ag.name,
              description: ag.description,
              tools: ag.tools,
              systemPrompt: ag.systemPrompt,
            }))
          );
        }

        res.json({
          skill: {
            ...updated,
            files: fileRecords,
          },
        });
        return;
      }

      res.status(409).json({
        error: `A skill named '${parsed.name}' already exists in ${requestedScope} scope. Use PUT to create a new version.`,
        requestId: req.id,
      });
      return;
    }

    const skillId = crypto.randomUUID();
    const versionDir = createSkillStoragePath(skillId, 1);
    await persistSkillFiles(versionDir, parsed.files);

    const requestedApprovalStatus = req.body?.approvalStatus as SkillApprovalStatus | undefined;
    const initialApprovalStatus: SkillApprovalStatus =
      requestedApprovalStatus === "pending_review"
        ? "pending_review"
        : requestedApprovalStatus === "draft"
          ? "draft"
          : requestedScope === "user" || isAdmin
            ? "approved"
            : "draft";

    const created = await repo.create({
      id: skillId,
      name: parsed.name,
      description: parsed.description,
      scope: requestedScope,
      ownerId: userId,
      orgId: requestedScope === "org" ? orgId : null,
      storagePath: versionDir,
      version: 1,
      isActive: true,
      icon: parsed.icon,
      author: parsed.author || userId,
      sourceLabel: requestedScope === "directory" ? "from Directory" : undefined,
      changelog: parsed.changelog || "Initial release",
      toolsRequired: parsed.toolsRequired || [],
      approvalStatus: initialApprovalStatus,
    });

    const fileRecords = await repo.addFiles(
      created.id,
      parsed.files.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );

    if (parsed.categories?.length) {
      for (const catName of parsed.categories) {
        const catId = await repo.ensureCategory(catName);
        await repo.linkSkillCategory(created.id, catId);
      }
    }

    if (parsed.agents?.length) {
      await repo.saveSkillAgents(
        created.id,
        parsed.agents.map((a) => ({
          name: a.name,
          description: a.description,
          tools: a.tools,
          systemPrompt: a.systemPrompt,
        }))
      );
    }

    await repo.recordSkillVersion(
      created.id,
      1,
      created.changelog || "Initial release",
      fileRecords
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
  } finally {
    if (tempUploadPath && fs.existsSync(tempUploadPath)) {
      try {
        fs.unlinkSync(tempUploadPath);
      } catch {
        /* ignore */
      }
    }
  }
}

export async function updateSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const userId = identity.userId;
  const isAdmin = identity.role === "admin";
  const id = req.params["id"]!;

  const existing = await repo.get(id);
  if (!existing) {
    res.status(404).json({ error: "Skill not found.", requestId: req.id });
    return;
  }

  if (!canEditSkill(existing, userId, isAdmin)) {
    res.status(403).json({ error: "Permission denied to edit this skill.", requestId: req.id });
    return;
  }

  let tempUploadPath: string | null = null;
  const storagePath = typeof req.body?.storagePath === "string" ? req.body.storagePath : null;
  if (storagePath && userId) {
    res.once("finish", () => void deleteUserUploads(userId, [storagePath]));
  }
  try {
    let parsed: ParsedSkillPackage;

    if (req.body?.skillMd) {
      const rawFiles: RawFileInput[] = [
        { relativePath: "SKILL.md", content: Buffer.from(String(req.body.skillMd), "utf8") },
        ...normalizeRawFiles(req.body.files),
      ];
      parsed = parseSkillPackage(rawFiles);
    } else {
      let zipBuffer: Buffer | null = null;
      if (storagePath) {
        if (!userId) throw new SkillValidationError("Sign in to upload a skill package.");
        zipBuffer = await downloadUserUpload(userId, storagePath, "skill-package");
      } else if (req.file?.path) {
        tempUploadPath = req.file.path;
        zipBuffer = fs.readFileSync(req.file.path);
      } else if (req.file?.buffer) {
        zipBuffer = req.file.buffer;
      } else if (typeof req.body?.zipBase64 === "string") {
        zipBuffer = Buffer.from(req.body.zipBase64, "base64");
      }

      if (!zipBuffer || zipBuffer.length === 0) {
        res.status(400).json({
          error:
            "Missing updated skill package. Upload a zip file, provide zipBase64, or provide skillMd.",
          requestId: req.id,
        });
        return;
      }

      parsed = parseSkillZip(zipBuffer);
    }
    if (parsed.name !== existing.name) {
      res.status(400).json({
        error: `Package skill name '${parsed.name}' does not match existing skill '${existing.name}'.`,
        requestId: req.id,
      });
      return;
    }

    const nextVersion = existing.version + 1;
    const versionDir = createSkillStoragePath(existing.id, nextVersion);
    await persistSkillFiles(versionDir, parsed.files);

    const updated = await repo.update(id, {
      description: parsed.description,
      storagePath: versionDir,
      version: nextVersion,
    });

    const fileRecords = await repo.replaceFiles(
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
  } finally {
    if (tempUploadPath && fs.existsSync(tempUploadPath)) {
      try {
        fs.unlinkSync(tempUploadPath);
      } catch {
        /* ignore */
      }
    }
  }
}

export async function deleteSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const userId = identity.userId;
  const isAdmin = identity.role === "admin";
  const id = req.params["id"]!;

  const existing = await repo.get(id);
  if (!existing) {
    res.status(404).json({ error: "Skill not found.", requestId: req.id });
    return;
  }

  if (!canEditSkill(existing, userId, isAdmin)) {
    res.status(403).json({ error: "Permission denied to delete this skill.", requestId: req.id });
    return;
  }

  await repo.delete(id);
  res.status(204).end();
}

export async function getConversationSkills(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const conversationId = req.params["id"]!;
  const projectId = req.query["projectId"] as string | undefined;

  const skills = await repo.getConversationSkills(conversationId);
  const metaList = await Promise.all(
    skills.map(async (s) => {
      const meta = await repo.getConversationSkillMeta(conversationId, s.id);
      return {
        ...s,
        explicitlySelected: meta?.explicitlySelected ?? false,
        source: meta?.source ?? "direct",
      };
    })
  );

  let hasProjectUpdate = false;
  if (projectId) {
    const projectSkills = await repo.getProjectSkills(projectId);
    const projectSkillIds = new Set(projectSkills.map((s) => s.id));
    const currentProjectSkills = metaList.filter((s) => s.source === "project");
    const currentProjectSkillIds = new Set(currentProjectSkills.map((s) => s.id));

    if (
      projectSkillIds.size !== currentProjectSkillIds.size ||
      [...projectSkillIds].some((id) => !currentProjectSkillIds.has(id))
    ) {
      hasProjectUpdate = true;
    }
  }

  res.json({ skills: metaList, hasProjectUpdate });
}

export async function syncConversationProjectSkills(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const conversationId = req.params["id"]!;
  const projectId = (req.body?.projectId || req.query["projectId"]) as string;

  if (!projectId) {
    res
      .status(400)
      .json({ error: "projectId is required to sync project skills.", requestId: req.id });
    return;
  }

  // Remove existing skills that came from project
  await repo.removeProjectSourcedConversationSkills(conversationId);

  // Inherit latest project skills
  const updated = await repo.inheritProjectSkills(conversationId, projectId, identity.userId);
  res.json({ skills: updated, synced: true });
}

export async function setConversationSkills(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const userId = identity.userId;
  const orgId = identity.orgId;
  const conversationId = req.params["id"]!;
  const skillIds = (req.body?.skill_ids as string[]) || (req.body?.skillIds as string[]) || [];

  if (!Array.isArray(skillIds)) {
    res.status(400).json({ error: "skill_ids must be an array of string IDs.", requestId: req.id });
    return;
  }

  // Verify that the user has permission to see EACH skill
  for (const skillId of skillIds) {
    const skill = await repo.get(skillId);
    if (!skill || !canViewSkill(skill, userId, orgId)) {
      res.status(403).json({
        error: `Cannot enable skill '${skillId}': skill not found or access denied.`,
        requestId: req.id,
      });
      return;
    }
  }

  const explicitlySelected =
    req.body?.explicitly_selected !== undefined ? Boolean(req.body.explicitly_selected) : true;
  const enabled = await repo.setConversationSkills(conversationId, skillIds, userId, {
    explicitlySelected,
  });
  res.json({ skills: enabled });
}

export async function getProjectSkills(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const projectId = req.params["id"]!;
  const skills = await repo.getProjectSkills(projectId);
  res.json({ skills });
}

import path from "node:path";
import fs from "node:fs";
import { getSandboxBaseDir } from "../application/sandboxManager.js";

export async function setProjectSkills(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const userId = identity.userId;
  const orgId = identity.orgId;
  const projectId = req.params["id"]!;
  const skillIds = (req.body?.skill_ids as string[]) || (req.body?.skillIds as string[]) || [];

  if (!Array.isArray(skillIds)) {
    res.status(400).json({ error: "skill_ids must be an array of string IDs.", requestId: req.id });
    return;
  }

  // Verify that the user has permission to see EACH skill
  for (const skillId of skillIds) {
    const skill = await repo.get(skillId);
    if (!skill || !canViewSkill(skill, userId, orgId)) {
      res.status(403).json({
        error: `Cannot enable skill '${skillId}': skill not found or access denied.`,
        requestId: req.id,
      });
      return;
    }
  }

  const enabled = await repo.setProjectSkills(projectId, skillIds);
  res.json({ skills: enabled });
}

export async function downloadConversationFile(req: Request, res: Response): Promise<void> {
  const conversationId = req.params["id"]!;
  const filename = path.basename(req.params["filename"]!);

  if (process.env["VERCEL"] === "1") {
    const identity = getRequestIdentity(req);
    const conversation = await new ConversationRepository().get(identity.userId, conversationId);
    if (!conversation) {
      res.status(404).json({ error: "File not found.", requestId: req.id });
      return;
    }
    const stored = await downloadGeneratedFile(identity.userId, conversationId, filename);
    if (!stored) {
      res.status(404).json({ error: "File not found.", requestId: req.id });
      return;
    }
    res.redirect(302, stored.signedUrl);
    return;
  }

  const baseDir = getSandboxBaseDir(conversationId);
  const attachmentPath = path.join(baseDir, "attachments", filename);
  const workspacePath = path.join(baseDir, "workspace", filename);

  const targetPath = fs.existsSync(attachmentPath)
    ? attachmentPath
    : fs.existsSync(workspacePath)
      ? workspacePath
      : null;

  if (!targetPath) {
    res.status(404).json({ error: "File not found.", requestId: req.id });
    return;
  }

  res.download(targetPath, filename);
}

export async function submitForReview(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const id = req.params["id"]!;
  const targetScope = req.body?.targetScope as SkillScope | undefined;

  const skill = await repo.get(id);
  if (!skill) {
    res.status(404).json({ error: "Skill not found.", requestId: req.id });
    return;
  }

  // Only the author or an admin can submit for review
  if (skill.ownerId !== identity.userId && identity.role !== "admin") {
    res.status(403).json({
      error: "Forbidden: only the author or an administrator can submit this skill for review.",
      requestId: req.id,
    });
    return;
  }

  if (skill.approvalStatus === "approved") {
    res.status(400).json({ error: "Skill is already approved.", requestId: req.id });
    return;
  }

  const updated = await repo.updateApprovalStatus(id, "pending_review", null, targetScope);
  res.json({ skill: updated });
}

export async function approveSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const id = req.params["id"]!;

  if (identity.role !== "admin") {
    res.status(403).json({
      error: "Forbidden: administrator privileges required to approve skills.",
      requestId: req.id,
    });
    return;
  }

  const skill = await repo.get(id);
  if (!skill) {
    res.status(404).json({ error: "Skill not found.", requestId: req.id });
    return;
  }

  const updated = await repo.updateApprovalStatus(id, "approved", null);
  res.json({ skill: updated });
}

export async function rejectSkill(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);
  const id = req.params["id"]!;
  const reason = (req.body?.reason as string) || "Skill rejected by administrator.";

  if (identity.role !== "admin") {
    res.status(403).json({
      error: "Forbidden: administrator privileges required to reject skills.",
      requestId: req.id,
    });
    return;
  }

  const skill = await repo.get(id);
  if (!skill) {
    res.status(404).json({ error: "Skill not found.", requestId: req.id });
    return;
  }

  const updated = await repo.updateApprovalStatus(id, "rejected", reason);
  res.json({ skill: updated });
}

export async function getAdminQueue(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const identity = getRequestIdentity(req);

  if (identity.role !== "admin") {
    res.status(403).json({
      error: "Forbidden: administrator privileges required to view admin review queue.",
      requestId: req.id,
    });
    return;
  }

  const queue = await repo.listPendingApproval();
  res.json({ queue });
}

export async function getSkillsAnalytics(req: Request, res: Response): Promise<void> {
  const repo = getSkillRepository();
  const days = req.query["days"] ? parseInt(String(req.query["days"]), 10) : 30;

  const analytics = await repo.getAnalytics(Number.isFinite(days) ? days : 30);
  res.json({ analytics });
}

export function validateDraft(req: Request, res: Response): void {
  const draft = req.body;
  const result = validateSkillDraft(draft);
  res.json(result);
}

export async function testScratchSkill(req: Request, res: Response): Promise<void> {
  const identity = getRequestIdentity(req);
  const prompt = String(req.body?.prompt || "Run test");
  const draft = req.body?.draft;

  if (!draft || !draft.skillMd) {
    res.status(400).json({ error: "Missing skillMd in draft.", requestId: req.id });
    return;
  }

  const scratchConvId = `scratch-${crypto.randomUUID()}`;
  const validation = validateSkillDraft(draft);
  if (!validation.valid) {
    res.status(400).json({
      error: "Validation failed for draft skill",
      errors: validation.errors,
      requestId: req.id,
    });
    return;
  }

  const rawFiles: RawFileInput[] = [
    { relativePath: "SKILL.md", content: Buffer.from(String(draft.skillMd), "utf8") },
    ...normalizeRawFiles(draft.files),
  ];

  const parsed = parseSkillPackage(rawFiles);
  const scratchSkillId = crypto.randomUUID();
  const scratchSkillDir = createSkillStoragePath(scratchSkillId, 1);
  await persistSkillFiles(scratchSkillDir, parsed.files);
  const scratchRepo = getSkillRepository();
  const created = await scratchRepo.create({
    id: scratchSkillId,
    name: parsed.name,
    description: parsed.description,
    scope: "user",
    ownerId: identity.userId,
    storagePath: scratchSkillDir,
    version: 1,
    isActive: true,
  });

  await scratchRepo.setConversationSkills(scratchConvId, [created.id], identity.userId, {
    explicitlySelected: true,
  });
  const sandboxPaths = initSandbox(scratchConvId, [created]);

  try {
    const traces: Array<{
      toolName: string;
      input: Record<string, unknown>;
      output: string;
      isError: boolean;
    }> = [];

    // Step 1: Preload Skill instructions
    const skillResult = await handleSkillToolCall(
      created.name,
      scratchConvId,
      identity.userId,
      scratchRepo
    );
    traces.push({
      toolName: "Skill",
      input: { skill: created.name },
      output: skillResult.content.slice(0, 500) + (skillResult.content.length > 500 ? "..." : ""),
      isError: Boolean(skillResult.isError),
    });

    // Step 2: Check if there is an executable script in scripts/
    const scriptFile = parsed.files.find((f) => f.relativePath.startsWith("scripts/"));
    let bashOutput = "(No scripts executed)";
    if (scriptFile) {
      const scriptExt = path.extname(scriptFile.relativePath);
      const runner = scriptExt === ".py" ? "python3" : "sh";
      const cmd = `${runner} /mnt/skills/user/${created.name}/${scriptFile.relativePath}`;
      const runRes = await executeBash(cmd, sandboxPaths, {
        timeoutMs: 15000,
        conversationId: scratchConvId,
        userId: identity.userId,
      });
      bashOutput = runRes.content;
      traces.push({
        toolName: "Bash",
        input: { command: cmd },
        output: runRes.content,
        isError: Boolean(runRes.isError),
      });
    }

    res.json({
      success: true,
      scratchConversationId: scratchConvId,
      toolTraces: traces,
      finalText: `Skill '${created.name}' successfully tested with prompt: "${prompt}".\nOutput:\n${bashOutput}`,
      iterations: traces.length,
    });
  } finally {
    cleanupSandbox(scratchConvId);
    await scratchRepo.delete(created.id);
  }
}
