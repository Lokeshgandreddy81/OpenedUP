import { Router } from "express";
import {
  AppendConversationMessageRequestSchema,
  CreateConversationRequestSchema,
  UpdateConversationRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";
import {
  appendConversationMessage,
  createConversation,
  deleteConversation,
  deleteMessagesFrom,
  getConversation,
  listConversations,
  updateConversation,
} from "./conversation.controller.js";

export const conversationRouter = Router();
conversationRouter.get("/", asyncHandler(listConversations));
conversationRouter.post("/", validateBody(CreateConversationRequestSchema), asyncHandler(createConversation));
conversationRouter.get("/:id", asyncHandler(getConversation));
conversationRouter.patch("/:id", validateBody(UpdateConversationRequestSchema), asyncHandler(updateConversation));
conversationRouter.delete("/:id", asyncHandler(deleteConversation));
conversationRouter.delete("/:id/messages/:messageId", asyncHandler(deleteMessagesFrom));
conversationRouter.post(
  "/:id/messages",
  validateBody(AppendConversationMessageRequestSchema),
  asyncHandler(appendConversationMessage)
);
