import type { ChatRequest } from "@charan-interiors/contracts";
import { getUnsupportedInputMessage, modelSupportsInput } from "@charan-interiors/contracts";
import {
  generateMultiProviderChat,
  generateMultiProviderChatStream,
} from "../providers/llm.service.js";
import { runAgenticWorkspaceTools } from "./tools.service.js";
import { executeSkills } from "./skillRegistry.js";
import { getSkillRepository } from "../../skills/http/skill.controller.js";
import { buildSkillsPrompt } from "../../skills/application/promptBuilder.js";

export const CHAT_GENERATION_TIMEOUT_MS = 90_000;

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
  const { messages, model, customModel, customProvider, effort, images } = payload;

  const imagePages = (
    payload as {
      imagePages?: import("../providers/llm.service.js").LlmGenerateParams["imagePages"];
    }
  ).imagePages;
  const hasImages = Boolean(images?.length || imagePages?.length);
  if (hasImages && !modelSupportsInput(model, "image")) {
    throw new Error(getUnsupportedInputMessage(model, "image"));
  }

  // Run agentic workspace inspection tools (rules, chapters, attached files)
  const toolTraces = options?.toolTraces ?? runAgenticWorkspaceTools(payload);
  const skills = executeSkills(payload);

  let progressiveSkillsPrompt = "";
  try {
    const skillRepo = getSkillRepository();
    const visibleSkills = skillRepo.listVisible("dev-user", null, { scope: "builtin" });
    progressiveSkillsPrompt = buildSkillsPrompt(visibleSkills);
  } catch {
    /* fallback gracefully if database is unseeded */
  }

  const { text, modelUsed, providerUsed } = await generateMultiProviderChat({
    modelId: model,
    customModel,
    customProvider,
    messages,
    systemInstruction: [
      toolTraces.enrichedSystemInstruction,
      skills.instructions,
      progressiveSkillsPrompt,
    ]
      .filter(Boolean)
      .join("\n\n"),
    effort,
    images,
    imagePages,
    injectedApiKey: options?.injectedApiKey,
    injectedBaseUrl: options?.injectedBaseUrl,
    signal: options?.signal,
  });

  const elapsedMs = Date.now() - startTime;
  const thinkingSeconds = Math.max(1, Math.round(elapsedMs / 1000));

  return {
    content: text,
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
  const { messages, model, customModel, customProvider, effort, images } = payload;

  const imagePages = (
    payload as {
      imagePages?: import("../providers/llm.service.js").LlmGenerateParams["imagePages"];
    }
  ).imagePages;
  const hasImages = Boolean(images?.length || imagePages?.length);
  if (hasImages && !modelSupportsInput(model, "image")) {
    throw new Error(getUnsupportedInputMessage(model, "image"));
  }

  const toolTraces = options?.toolTraces ?? runAgenticWorkspaceTools(payload);
  const skills = executeSkills(payload);

  let progressiveSkillsPrompt = "";
  try {
    const skillRepo = getSkillRepository();
    const visibleSkills = skillRepo.listVisible("dev-user", null, { scope: "builtin" });
    progressiveSkillsPrompt = buildSkillsPrompt(visibleSkills);
  } catch {
    /* fallback gracefully if database is unseeded */
  }

  const generated = await generateMultiProviderChatStream(
    {
      modelId: model,
      customModel,
      customProvider,
      messages,
      systemInstruction: [
        toolTraces.enrichedSystemInstruction,
        skills.instructions,
        progressiveSkillsPrompt,
      ]
        .filter(Boolean)
        .join("\n\n"),
      effort,
      images,
      imagePages,
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
