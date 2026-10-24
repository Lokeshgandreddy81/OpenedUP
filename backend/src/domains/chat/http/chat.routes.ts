import { Router } from "express";
import {
  ChapterChatRequestSchema,
  ChatRequestSchema,
  WorkspaceRulesRequestSchema,
} from "@charan-interiors/contracts";
import {
  handleChat,
  handleChatStream,
  handleChapterChat,
  handleChapterChatStream,
  handleGetSkills,
  handleGetRules,
  handleSaveRules,
} from "./chat.controller.js";
import { validateBody } from "../../../platform/http/middleware/validate.js";

export const chatRouter = Router();

chatRouter.post("/chat", validateBody(ChatRequestSchema), handleChat);
chatRouter.post("/chat/stream", validateBody(ChatRequestSchema), handleChatStream);
chatRouter.post("/chat/chapter", validateBody(ChapterChatRequestSchema), handleChapterChat);
chatRouter.post(
  "/chat/chapter/stream",
  validateBody(ChapterChatRequestSchema),
  handleChapterChatStream
);
chatRouter.get("/chat/skills", handleGetSkills);
chatRouter.get("/chat/rules", handleGetRules);
chatRouter.post("/chat/rules", validateBody(WorkspaceRulesRequestSchema), handleSaveRules);
