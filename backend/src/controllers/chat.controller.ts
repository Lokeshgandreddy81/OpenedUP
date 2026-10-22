import type { Request, Response, NextFunction } from "express";
import type { ChatRequest } from "@charan-interiors/shared";
import { processChat } from "../services/chat.service.js";
import { logEvent } from "../utils/logger.js";

export async function handleChat(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const startTime = Date.now();
  try {
    const payload = req.body as ChatRequest;
    const result = await processChat(payload);
    res.json(result);
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Failed to process chat";
    logEvent("ERROR /api/chat", { message, elapsedMs });
    res.status(500).json({ error: message, requestId: req.id });
  }
}
