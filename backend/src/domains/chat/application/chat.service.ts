import type { ChatRequest } from "@charan-interiors/contracts";
import {
  getModelMeta,
  getUnsupportedInputMessage,
  modelSupportsInput,
  PROVIDER_CATALOG,
} from "@charan-interiors/contracts";
import {
  generateMultiProviderChat,
  generateMultiProviderChatStream,
} from "../providers/llm.service.js";
import { runAgenticWorkspaceTools } from "./tools.service.js";
import { executeSkills } from "./skillRegistry.js";
import { getSkillRepository } from "../../skills/http/skill.controller.js";
import { buildSkillsPrompt } from "../../skills/application/promptBuilder.js";
import { readSkillFile } from "../../skills/application/skillStorage.js";
import { runAnthropicToolLoop } from "../../skills/application/anthropicToolLoop.js";
import { initSandbox } from "../../skills/application/sandboxManager.js";
import { SANDBOX_TOOLS, executeSandboxTool } from "../../skills/application/sandboxTools.js";
import { SKILL_TOOL_DEFINITION } from "../../skills/application/skillToolHandler.js";
import type { SkillRecord } from "../../skills/repositories/skillRepository.js";

export const CHAT_GENERATION_TIMEOUT_MS = 90_000;

export interface ProcessChatOptions {
  injectedApiKey?: string | undefined;
  injectedBaseUrl?: string | undefined;
  customProvider?: ChatRequest["customProvider"];
  toolTraces?: ReturnType<typeof runAgenticWorkspaceTools>;
  signal?: AbortSignal;
  userId?: string | null;
  orgId?: string | null;
}

export async function resolveChatSkillsContext(
  payload: ChatRequest,
  options?: ProcessChatOptions
): Promise<{
  progressiveSkillsPrompt: string;
  conversationSkills: SkillRecord[];
}> {
  try {
    const skillRepo = getSkillRepository();
    const userId = options?.userId ?? "dev-user";
    const orgId = options?.orgId ?? null;
    const conversationSkills = payload.conversationId
      ? await skillRepo.getConversationSkills(payload.conversationId, userId, orgId)
      : [];
    const visibleSkills = await skillRepo.listVisible(userId, orgId);
    const visibleById = new Map(visibleSkills.map((skill) => [skill.id, skill]));
    const requestedIds = payload.packageSkillIds ?? [];
    const skillsForPrompt = requestedIds.length
      ? requestedIds.flatMap((id) => {
          const skill = visibleById.get(id);
          return skill ? [skill] : [];
        })
      : conversationSkills;
    const skillInstructions = await Promise.all(
      skillsForPrompt.map(async (skill) => {
        if (!skill.storagePath) return { skill, content: "" };
        const content = await readSkillFile(skill.storagePath, "SKILL.md");
        return {
          skill,
          content: content?.toString("utf8").slice(0, 60_000) ?? "",
        };
      })
    );
    return {
      progressiveSkillsPrompt: buildSkillsPrompt(skillInstructions),
      conversationSkills,
    };
  } catch {
    return { progressiveSkillsPrompt: "", conversationSkills: [] };
  }
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
  const { progressiveSkillsPrompt, conversationSkills } = await resolveChatSkillsContext(
    payload,
    options
  );
  const systemInstruction = [
    toolTraces.enrichedSystemInstruction,
    skills.instructions,
    progressiveSkillsPrompt,
  ]
    .filter(Boolean)
    .join("\n\n");

  const meta = getModelMeta(model);
  const effectiveProvider = model === "custom-model" ? customProvider || "custom" : meta.provider;

  if (
    effectiveProvider === "anthropic" &&
    !hasImages &&
    payload.conversationId &&
    conversationSkills.length > 0 &&
    options?.injectedApiKey
  ) {
    const skillRepo = getSkillRepository();
    const sandboxPaths = SANDBOX_TOOLS.length
      ? initSandbox(payload.conversationId, conversationSkills)
      : undefined;
    const loopResult = await runAnthropicToolLoop({
      apiKey: options.injectedApiKey,
      baseUrl: options.injectedBaseUrl || PROVIDER_CATALOG.anthropic.defaultBaseUrl,
      model: customModel?.trim() || meta.upstreamModelId,
      messages,
      systemInstruction,
      conversationId: payload.conversationId,
      userId: options?.userId ?? "dev-user",
      orgId: options?.orgId ?? null,
      tools: [SKILL_TOOL_DEFINITION, ...SANDBOX_TOOLS],
      repo: skillRepo,
      ...(options.signal ? { signal: options.signal } : {}),
      executeCustomTool: (name, input) =>
        executeSandboxTool(
          name,
          input,
          payload.conversationId!,
          sandboxPaths,
          skillRepo,
          options?.userId,
          options?.orgId
        ),
    });
    const elapsedMs = Date.now() - startTime;
    const thinkingSeconds = Math.max(1, Math.round(elapsedMs / 1000));
    const modelUsed = customModel?.trim() || meta.upstreamModelId;
    return {
      content: loopResult.finalText,
      thinkingTime: `${thinkingSeconds}s`,
      stepTitle: toolTraces.stepTitle,
      stepDescription: toolTraces.stepDescription,
      thoughtDetails: [
        ...toolTraces.thoughtDetails,
        ...skills.traces,
        ...loopResult.toolTraces.map(
          (t) => `Executed tool ${t.toolName} (${t.isError ? "error" : "ok"}).`
        ),
        `Completed generation via ANTHROPIC (${modelUsed}) in ${thinkingSeconds}s.`,
      ],
      modelUsed,
      providerUsed: "anthropic",
    };
  }

  const { text, modelUsed, providerUsed } = await generateMultiProviderChat({
    modelId: model,
    customModel,
    customProvider,
    messages,
    systemInstruction,
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
  const { progressiveSkillsPrompt, conversationSkills } = await resolveChatSkillsContext(
    payload,
    options
  );
  const systemInstruction = [
    toolTraces.enrichedSystemInstruction,
    skills.instructions,
    progressiveSkillsPrompt,
  ]
    .filter(Boolean)
    .join("\n\n");

  const meta = getModelMeta(model);
  const effectiveProvider = model === "custom-model" ? customProvider || "custom" : meta.provider;

  if (
    effectiveProvider === "anthropic" &&
    !hasImages &&
    payload.conversationId &&
    conversationSkills.length > 0 &&
    options?.injectedApiKey
  ) {
    const skillRepo = getSkillRepository();
    const sandboxPaths = SANDBOX_TOOLS.length
      ? initSandbox(payload.conversationId, conversationSkills)
      : undefined;
    const loopResult = await runAnthropicToolLoop({
      apiKey: options.injectedApiKey,
      baseUrl: options.injectedBaseUrl || PROVIDER_CATALOG.anthropic.defaultBaseUrl,
      model: customModel?.trim() || meta.upstreamModelId,
      messages,
      systemInstruction,
      conversationId: payload.conversationId,
      userId: options?.userId ?? "dev-user",
      orgId: options?.orgId ?? null,
      tools: [SKILL_TOOL_DEFINITION, ...SANDBOX_TOOLS],
      repo: skillRepo,
      ...(options.signal ? { signal: options.signal } : {}),
      executeCustomTool: (name, input) =>
        executeSandboxTool(
          name,
          input,
          payload.conversationId!,
          sandboxPaths,
          skillRepo,
          options.userId,
          options.orgId
        ),
    });
    if (loopResult.finalText) {
      onDelta(loopResult.finalText);
    }
    const thinkingSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const modelUsed = customModel?.trim() || meta.upstreamModelId;
    return {
      content: loopResult.finalText,
      thinkingTime: `${thinkingSeconds}s`,
      stepTitle: toolTraces.stepTitle,
      stepDescription: toolTraces.stepDescription,
      thoughtDetails: [
        ...toolTraces.thoughtDetails,
        ...skills.traces,
        ...loopResult.toolTraces.map(
          (t) => `Executed tool ${t.toolName} (${t.isError ? "error" : "ok"}).`
        ),
        `Completed streaming via ANTHROPIC (${modelUsed}) in ${thinkingSeconds}s.`,
      ],
      modelUsed,
      providerUsed: "anthropic",
    };
  }

  const generated = await generateMultiProviderChatStream(
    {
      modelId: model,
      customModel,
      customProvider,
      messages,
      systemInstruction,
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
