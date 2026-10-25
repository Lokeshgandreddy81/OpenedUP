import type { ChatRequest } from "@charan-interiors/contracts";
import { getModelMeta } from "@charan-interiors/contracts";
import {
  generateMultiProviderChat,
  generateMultiProviderChatStream,
} from "../providers/llm.service.js";
import { runAgenticWorkspaceTools } from "./tools.service.js";
import { executeSkills } from "./skillRegistry.js";

export interface ProcessChatOptions {
  injectedApiKey?: string | undefined;
  injectedBaseUrl?: string | undefined;
  customProvider?: ChatRequest["customProvider"];
  toolTraces?: ReturnType<typeof runAgenticWorkspaceTools>;
  signal?: AbortSignal;
}

export async function processChat(
  payload: ChatRequest,
  options?: ProcessChatOptions
): Promise<{
  content: string;
  thinkingTime: string;
  stepTitle: string;
  stepDescription: string;
  thoughtDetails: string[];
  modelUsed: string;
  providerUsed: string;
}> {
  const startTime = Date.now();
  const { messages, model = "gemini-3.8-flash", customModel, customProvider, effort, images } = payload;

  const meta = getModelMeta(model);
  if (
    images?.length &&
    meta.inputModalities &&
    !meta.inputModalities.includes("image")
  ) {
    throw new Error(
      `${meta.name} does not support image analysis. Please select a multimodal vision model (such as Claude Opus/Fable, GPT-6, Gemini, Grok, Kimi K3.1, or Qwen 3.8 Max) to analyze images.`
    );
  }

  // Run agentic workspace inspection tools (rules, chapters, attached files)
  const toolTraces = options?.toolTraces ?? runAgenticWorkspaceTools(payload);
  const skills = executeSkills(payload);

  const { text, modelUsed, providerUsed } = await generateMultiProviderChat({
    modelId: model,
    customModel,
    customProvider,
    messages,
    systemInstruction: `${toolTraces.enrichedSystemInstruction}\n${skills.instructions}`,
    effort,
    images,
    injectedApiKey: options?.injectedApiKey,
    injectedBaseUrl: options?.injectedBaseUrl,
    signal: options?.signal,
  });

  const elapsedMs = Date.now() - startTime;
  const thinkingSeconds = Math.max(1, Math.round(elapsedMs / 1000));

  return {
    content: text || "No response received.",
    thinkingTime: `${thinkingSeconds}s`,
    stepTitle: toolTraces.stepTitle,
    stepDescription: toolTraces.stepDescription,
    thoughtDetails: [
      ...toolTraces.thoughtDetails,
      ...skills.traces,
      `Completed generation via ${providerUsed.toUpperCase()} (${modelUsed}) in ${thinkingSeconds}s.`,
    ],
    modelUsed,
    providerUsed,
  };
}

export async function processChatStream(
  payload: ChatRequest,
  options: ProcessChatOptions | undefined,
  onDelta: (delta: string) => void
) {
  const startTime = Date.now();
  const { messages, model = "gemini-3.8-flash", customModel, customProvider, effort, images } = payload;

  const meta = getModelMeta(model);
  if (
    images?.length &&
    meta.inputModalities &&
    !meta.inputModalities.includes("image")
  ) {
    throw new Error(
      `${meta.name} does not support image analysis. Please select a multimodal vision model (such as Claude Opus/Fable, GPT-6, Gemini, Grok, Kimi K3.1, or Qwen 3.8 Max) to analyze images.`
    );
  }

  const toolTraces = options?.toolTraces ?? runAgenticWorkspaceTools(payload);
  const skills = executeSkills(payload);
  const generated = await generateMultiProviderChatStream(
    {
      modelId: model,
      customModel,
      customProvider,
      messages,
      systemInstruction: `${toolTraces.enrichedSystemInstruction}\n${skills.instructions}`,
      effort,
      images,
      injectedApiKey: options?.injectedApiKey,
      injectedBaseUrl: options?.injectedBaseUrl,
      signal: options?.signal,
    },
    onDelta
  );
  const thinkingSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
  return {
    content: generated.text,
    thinkingTime: `${thinkingSeconds}s`,
    stepTitle: toolTraces.stepTitle,
    stepDescription: toolTraces.stepDescription,
    thoughtDetails: [
      ...toolTraces.thoughtDetails,
      ...skills.traces,
      `Completed streaming via ${generated.providerUsed.toUpperCase()} (${generated.modelUsed}) in ${thinkingSeconds}s.`,
    ],
    modelUsed: generated.modelUsed,
    providerUsed: generated.providerUsed,
  };
}
