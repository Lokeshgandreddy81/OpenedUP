import type { Request, Response } from "express";
import type {
  AppendConversationMessageRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
} from "@charan-interiors/contracts";
import { ConversationRepository } from "../repositories/conversationRepository.js";

const conversations = new ConversationRepository();

export function listConversations(req: Request, res: Response): void {
  res.json({ conversations: conversations.list(req.principal!.uid) });
}

export function getConversation(req: Request, res: Response): void {
  const conversation = conversations.get(req.principal!.uid, req.params["id"]!);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found.", requestId: req.id });
    return;
  }
  res.json({ conversation });
}

export function createConversation(req: Request, res: Response): void {
  const body = req.body as CreateConversationRequest;
  res.status(201).json({
    conversation: conversations.create(req.principal!.uid, body.title, body.model),
  });
}

export function updateConversation(req: Request, res: Response): void {
  const body = req.body as UpdateConversationRequest;
  if (!conversations.update(req.principal!.uid, req.params["id"]!, body)) {
    res.status(404).json({ error: "Conversation not found.", requestId: req.id });
    return;
  }
  res.json({ conversation: conversations.get(req.principal!.uid, req.params["id"]!) });
}

export function deleteConversation(req: Request, res: Response): void {
  conversations.delete(req.principal!.uid, req.params["id"]!);
  res.status(204).end();
}

export function appendConversationMessage(req: Request, res: Response): void {
  const body = req.body as AppendConversationMessageRequest;
  const message = conversations.appendMessage(req.principal!.uid, req.params["id"]!, {
    ...body,
    metadata: body.metadata ?? {},
  });
  if (!message) {
    res.status(404).json({ error: "Conversation not found.", requestId: req.id });
    return;
  }
  res.status(201).json({ message });
}
