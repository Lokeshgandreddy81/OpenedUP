import { Router } from "express";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";
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

const upload = multer({
  storage: multer.memoryStorage(),
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
skillRouter.get("/directory/skills", asyncHandler(listDirectorySkills));
skillRouter.get("/directory/categories", asyncHandler(listCategories));
skillRouter.post("/directory/skills/:id/add-to-library", asyncHandler(addDirectorySkillToLibrary));

// Skills CRUD & Analytics
skillRouter.get("/skills", asyncHandler(listSkills));
skillRouter.get("/skills/analytics", asyncHandler(getSkillsAnalytics));
skillRouter.post("/skills/validate", asyncHandler(validateDraft));
skillRouter.post("/skills/test-scratch", asyncHandler(testScratchSkill));
skillRouter.get("/skills/:id", asyncHandler(getSkill));
skillRouter.get("/skills/:id/versions", asyncHandler(getSkillVersions));
skillRouter.get("/skills/:id/contents", asyncHandler(getSkillContents));
skillRouter.post("/skills", skillUploadLimiter, upload.single("file"), asyncHandler(createSkill));
skillRouter.put("/skills/:id", skillUploadLimiter, upload.single("file"), asyncHandler(updateSkill));
skillRouter.delete("/skills/:id", asyncHandler(deleteSkill));

// Admin & Approval workflow
skillRouter.post("/skills/:id/submit-review", asyncHandler(submitForReview));
skillRouter.post("/skills/:id/approve", asyncHandler(approveSkill));
skillRouter.post("/skills/:id/reject", asyncHandler(rejectSkill));
skillRouter.get("/admin/skills/queue", asyncHandler(getAdminQueue));

// Conversation skills
skillRouter.get("/conversations/:id/skills", asyncHandler(getConversationSkills));
skillRouter.put("/conversations/:id/skills", asyncHandler(setConversationSkills));
skillRouter.post("/conversations/:id/skills/sync-project", asyncHandler(syncConversationProjectSkills));

// Project skills
skillRouter.get("/projects/:id/skills", asyncHandler(getProjectSkills));
skillRouter.put("/projects/:id/skills", asyncHandler(setProjectSkills));

// Downloadable conversation attachments
skillRouter.get("/conversations/:id/files/:filename", asyncHandler(downloadConversationFile));
