import { Router } from "express";
import multer from "multer";
import {
  listSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  getConversationSkills,
  setConversationSkills,
  getProjectSkills,
  setProjectSkills,
  downloadConversationFile,
} from "./skill.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max package size
  },
});

export const skillRouter = Router();

// Skills CRUD
skillRouter.get("/skills", listSkills);
skillRouter.get("/skills/:id", getSkill);
skillRouter.post("/skills", upload.single("file"), createSkill);
skillRouter.put("/skills/:id", upload.single("file"), updateSkill);
skillRouter.delete("/skills/:id", deleteSkill);

// Conversation skills
skillRouter.get("/conversations/:id/skills", getConversationSkills);
skillRouter.put("/conversations/:id/skills", setConversationSkills);

// Project skills
skillRouter.get("/projects/:id/skills", getProjectSkills);
skillRouter.put("/projects/:id/skills", setProjectSkills);

// Downloadable conversation attachments
skillRouter.get("/conversations/:id/files/:filename", downloadConversationFile);
