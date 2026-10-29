import type { Request, Response } from "express";
import type {
  AppendConversationMessageRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
} from "@charan-interiors/contracts";
import { ConversationRepository } from "../repositories/conversationRepository.js";

const conversations = new ConversationRepository();

export async function listConversations(req: Request, res: Response): Promise<void> {
  res.json({ conversations: await conversations.list(req.principal!.uid) });
}

export async function getConversation(req: Request, res: Response): Promise<void> {
  const conversation = await conversations.get(req.principal!.uid, req.params["id"]!);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found.", requestId: req.id });
    return;
  }
  res.json({ conversation });
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateConversationRequest;
  const requestBody = req.body as CreateConversationRequest & {
    projectId?: unknown;
    project_id?: unknown;
  };
  const requestedProjectId = requestBody.projectId ?? requestBody.project_id;
  const projectId = typeof requestedProjectId === "string" ? requestedProjectId : undefined;
  res.status(201).json({
    conversation: await conversations.create(req.principal!.uid, body.title, body.model, projectId),
  });
}

export async function updateConversation(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateConversationRequest;
  if (!await conversations.update(req.principal!.uid, req.params["id"]!, body)) {
    res.status(404).json({ error: "Conversation not found.", requestId: req.id });
    return;
  }
  res.json({ conversation: await conversations.get(req.principal!.uid, req.params["id"]!) });
}

export async function deleteConversation(req: Request, res: Response): Promise<void> {
  await conversations.delete(req.principal!.uid, req.params["id"]!);
  res.status(204).end();
}

export async function deleteMessagesFrom(req: Request, res: Response): Promise<void> {
  if (
    !await conversations.deleteMessagesFrom(
      req.principal!.uid,
      req.params["id"]!,
      req.params["messageId"]!
    )
  ) {
    res.status(404).json({ error: "Conversation message not found.", requestId: req.id });
    return;
  }
  res.status(204).end();
}

export async function appendConversationMessage(req: Request, res: Response): Promise<void> {
  const body = req.body as AppendConversationMessageRequest;
  const message = await conversations.appendMessage(req.principal!.uid, req.params["id"]!, {
    ...body,
    metadata: body.metadata ?? {},
  });
  if (!message) {
    res.status(404).json({ error: "Conversation not found.", requestId: req.id });
    return;
  }
  res.status(201).json({ message });
}
