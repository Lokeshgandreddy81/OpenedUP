import { Router } from "express";
import { ChatRequestSchema } from "@charan-interiors/shared";
import { handleChat } from "../controllers/chat.controller.js";
import { validateBody } from "../middleware/validate.js";

export const chatRouter = Router();

chatRouter.post("/chat", validateBody(ChatRequestSchema), handleChat);
