import { Router } from "express";
import { chatRequestSchema, type ChatRequest } from "../schemas/chat.ts";
import { validateBody } from "../middleware/validateRequest.ts";
import { generateWithModelFallback } from "../services/geminiService.ts";
import { logEvent } from "../logger.ts";

export const chatRouter = Router();

chatRouter.post("/api/chat", validateBody(chatRequestSchema), async (req, res) => {
  const startTime = Date.now();
  try {
    const { messages, context } = req.body as ChatRequest;

    const systemInstruction = `You are Unify AI, an ultra-clean, decisive, and exceptionally sharp document intelligence assistant.
Your purpose is to assist the user with document synthesis, research, prospecting, and analysis.
Context:
${context?.docTitle ? `Active Document: "${context.docTitle}"` : ""}
${
  context?.chapters && context.chapters.length > 0
    ? `Document Chapters Outline:\n${context.chapters
        .map((c, i) => `${i + 1}. ${c.title}${c.summary ? `: ${c.summary}` : ""}`)
        .join("\n")}`
    : ""
}

Style Guidelines:
- Respond cleanly, concisely, and insightfully.
- Keep the structure neat: use bold subheadings, clean bullet points, or concise numbered steps where helpful.
- Avoid unnecessary fluff or overly robotic pleasantries. Be direct, authoritative, and helpful.`;

    const contents = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const { response, modelUsed } = await generateWithModelFallback({
      contents: `${contents}\n\nAssistant:`,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const elapsedMs = Date.now() - startTime;
    const thinkingSeconds = Math.max(1, Math.round(elapsedMs / 1000));

    res.json({
      content: response.text || "No response received.",
      thinkingTime: `${thinkingSeconds}s`,
      stepTitle: "Narrowing target criteria",
      stepDescription: "Synthesizing signals and matching criteria across available sources.",
      modelUsed,
    });
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Failed to process chat";
    logEvent("ERROR /api/chat", { message, elapsedMs });
    res.status(500).json({ error: message });
  }
});
