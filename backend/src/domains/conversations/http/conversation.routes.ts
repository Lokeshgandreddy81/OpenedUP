import { Router } from "express";
import {
  AppendConversationMessageRequestSchema,
  CreateConversationRequestSchema,
  UpdateConversationRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import {
  appendConversationMessage,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  updateConversation,
} from "./conversation.controller.js";

export const conversationRouter = Router();
conversationRouter.get("/", listConversations);
conversationRouter.post("/", validateBody(CreateConversationRequestSchema), createConversation);
conversationRouter.get("/:id", getConversation);
conversationRouter.patch("/:id", validateBody(UpdateConversationRequestSchema), updateConversation);
conversationRouter.delete("/:id", deleteConversation);
conversationRouter.post(
  "/:id/messages",
  validateBody(AppendConversationMessageRequestSchema),
  appendConversationMessage
);
