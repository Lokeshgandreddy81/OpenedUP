import type { ChatRequest } from "@charan-interiors/shared";
import { generateWithModelFallback } from "./gemini.service.js";

export async function processChat(payload: ChatRequest): Promise<{
  content: string;
  thinkingTime: string;
  stepTitle: string;
  stepDescription: string;
  modelUsed: string;
}> {
  const startTime = Date.now();
  const { messages, context } = payload;

  const systemInstruction = `You are Unify AI, an ultra-clean, decisive, and exceptionally sharp document intelligence assistant.
Your purpose is to assist the user with document synthesis, research, prospecting, and analysis.
Context:
${context?.docTitle ? `Active Document: "${context.docTitle}"` : ""}
${
  context?.chapters && context.chapters.length > 0
    ? `Document Chapters Outline:\n${context.chapters
        .map(
          (
            c: { title: string; summary?: string | undefined; pageRange?: string | undefined },
            i: number
          ) => `${i + 1}. ${c.title}${c.summary ? `: ${c.summary}` : ""}`
        )
        .join("\n")}`
    : ""
}

Style Guidelines:
- Respond cleanly, concisely, and insightfully.
- Keep the structure neat: use bold subheadings, clean bullet points, or concise numbered steps where helpful.
- Avoid unnecessary fluff or overly robotic pleasantries. Be direct, authoritative, and helpful.`;

  const contents = messages
    .map(
      (m: { role: "user" | "assistant"; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
    )
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

  return {
    content: response.text || "No response received.",
    thinkingTime: `${thinkingSeconds}s`,
    stepTitle: "Narrowing target criteria",
    stepDescription: "Synthesizing signals and matching criteria across available sources.",
    modelUsed,
  };
}
