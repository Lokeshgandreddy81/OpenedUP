import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { createRateLimiter } from "../../../platform/http/middleware/rateLimiter.js";
import {
  listSkills,
  getSkill,
  listDirectorySkills,
  listCategories,
  addDirectorySkillToLibrary,
  getSkillVersions,
  getSkillContents,
  createSkill,
  updateSkill,
  deleteSkill,
  getConversationSkills,
  setConversationSkills,
  syncConversationProjectSkills,
  getProjectSkills,
  setProjectSkills,
  downloadConversationFile,
  submitForReview,
  approveSkill,
  rejectSkill,
  getAdminQueue,
  getSkillsAnalytics,
  validateDraft,
  testScratchSkill,
} from "./skill.controller.js";

const uploadDir = path.join(os.tmpdir(), "openedup-skill-uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${path.basename(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max package size
  },
});

// Rate limit skill uploads to 10 per minute per user/IP
const skillUploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Skill upload rate limit exceeded. Please wait a minute before uploading more skills.",
});

export const skillRouter = Router();

// Directory / Marketplace
skillRouter.get("/directory/skills", listDirectorySkills);
skillRouter.get("/directory/categories", listCategories);
skillRouter.post("/directory/skills/:id/add-to-library", addDirectorySkillToLibrary);

// Skills CRUD & Analytics
skillRouter.get("/skills", listSkills);
skillRouter.get("/skills/analytics", getSkillsAnalytics);
skillRouter.post("/skills/validate", validateDraft);
skillRouter.post("/skills/test-scratch", testScratchSkill);
skillRouter.get("/skills/:id", getSkill);
skillRouter.get("/skills/:id/versions", getSkillVersions);
skillRouter.get("/skills/:id/contents", getSkillContents);
skillRouter.post("/skills", skillUploadLimiter, upload.single("file"), createSkill);
skillRouter.put("/skills/:id", skillUploadLimiter, upload.single("file"), updateSkill);
skillRouter.delete("/skills/:id", deleteSkill);

// Admin & Approval workflow
skillRouter.post("/skills/:id/submit-review", submitForReview);
skillRouter.post("/skills/:id/approve", approveSkill);
skillRouter.post("/skills/:id/reject", rejectSkill);
skillRouter.get("/admin/skills/queue", getAdminQueue);

// Conversation skills
skillRouter.get("/conversations/:id/skills", getConversationSkills);
skillRouter.put("/conversations/:id/skills", setConversationSkills);
skillRouter.post("/conversations/:id/skills/sync-project", syncConversationProjectSkills);

// Project skills
skillRouter.get("/projects/:id/skills", getProjectSkills);
skillRouter.put("/projects/:id/skills", setProjectSkills);

// Downloadable conversation attachments
skillRouter.get("/conversations/:id/files/:filename", downloadConversationFile);
