import { fetchProvider } from "../../chat/providers/llm.service.js";
import { redactSecretsString } from "../../../platform/observability/logger.js";
import { SKILL_TOOL_DEFINITION, handleSkillToolCall, type SkillToolResult } from "./skillToolHandler.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { readSkillFileFromDisk } from "./skillStorage.js";
import { parseSkillMd } from "./skillParser.js";

export const MAX_TOOL_ITERATIONS = 20;

export interface ToolCallTrace {
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  isError: boolean;
}

export interface AnthropicToolLoopOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: Array<{ role: "user" | "assistant"; content: unknown }>;
  systemInstruction: string;
  conversationId: string;
  userId?: string | null;
  tools?: unknown[];
  maxTokens?: number;
  maxIterations?: number;
  repo?: SkillRepository;
  signal?: AbortSignal;
  fetchFn?: (url: string, init: RequestInit) => Promise<Response>;
  executeCustomTool?: (
    name: string,
    input: Record<string, unknown>
  ) => Promise<SkillToolResult> | SkillToolResult;
}

export interface AnthropicToolLoopResult {
  finalText: string;
  iterations: number;
  toolTraces: ToolCallTrace[];
  stopReason: string;
}

/**
 * Executes the standard Anthropic tool use loop:
 * call model -> if stop_reason is tool_use, execute tools, append tool_result, call again -> until end_turn.
 * Capped at 20 iterations.
 */
export async function runAnthropicToolLoop(
  options: AnthropicToolLoopOptions
): Promise<AnthropicToolLoopResult> {
  const cleanApiKey = options.apiKey.replace(/[^\x21-\x7E]/g, "");
  const endpoint = `${options.baseUrl.replace(/\/+$/, "")}/messages`;
  const maxIterations = options.maxIterations ?? MAX_TOOL_ITERATIONS;
  const tools = options.tools ?? [SKILL_TOOL_DEFINITION];
  const maxTokens = options.maxTokens ?? 4096;
  const repo = options.repo ?? new SkillRepository();

  const conversationHistory = [...options.messages];
  const toolTraces: ToolCallTrace[] = [];
  let iteration = 0;
  let finalText = "";
  let lastStopReason = "end_turn";

  // Force-load explicitly selected skills once into context as synthetic tool_use/tool_result pair
  const unpreloadedExplicitSkills = repo.getUnpreloadedExplicitSkills(options.conversationId);
  for (const skill of unpreloadedExplicitSkills) {
    let body = "";
    if (skill.storagePath) {
      const fileData = readSkillFileFromDisk(skill.storagePath, "SKILL.md");
      if (fileData) {
        body = parseSkillMd(fileData).body;
      }
    }
    if (!body) {
      body = skill.description;
    }

    const syntheticToolId = `synthetic-skill-${skill.name}-${Date.now()}`;
    conversationHistory.push({
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: syntheticToolId,
          name: "Skill",
          input: { skill: skill.name },
        },
      ],
    });
    conversationHistory.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: syntheticToolId,
          content: body,
        },
      ],
    });

    toolTraces.push({
      toolName: "Skill",
      input: { skill: skill.name, explicitlySelected: true },
      output: body,
      isError: false,
    });
    repo.logUsage(options.conversationId, skill.name, options.userId ?? null);
    repo.markSkillPreloaded(options.conversationId, skill.id);
  }

  const fetchImpl = options.fetchFn ?? fetchProvider;

  while (iteration < maxIterations) {
    iteration++;

    const payload = {
      model: options.model,
      max_tokens: maxTokens,
      system: options.systemInstruction,
      messages: conversationHistory,
      tools,
    };

    const response = await fetchImpl(endpoint, {
      method: "POST",
      ...(options.signal ? { signal: options.signal } : {}),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cleanApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      const safeErr = redactSecretsString(errBody || response.statusText);
      throw new Error(`Anthropic API error (${response.status}): ${safeErr}`);
    }

    const data = (await response.json()) as {
      stop_reason?: string;
      content?: Array<{
        type: string;
        text?: string;
        id?: string;
        name?: string;
        input?: Record<string, unknown>;
      }>;
    };

    lastStopReason = data.stop_reason || "end_turn";
    const contentBlocks = data.content || [];

    // Extract any text from this turn
    const textPieces = contentBlocks
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text!);

    if (textPieces.length > 0) {
      finalText = textPieces.join("\n");
    }

    // Check if the model called any tools
    const toolUseBlocks = contentBlocks.filter((b) => b.type === "tool_use");

    if (data.stop_reason !== "tool_use" || toolUseBlocks.length === 0) {
      // Completed turn
      break;
    }

    // Append assistant's turn with tool_use blocks to conversation history
    conversationHistory.push({
      role: "assistant",
      content: contentBlocks,
    });

    // Execute all requested tools
    const toolResults: Array<{
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }> = [];

    for (const block of toolUseBlocks) {
      const toolUseId = block.id || "toolu_unknown";
      const toolName = block.name || "";
      const toolInput = block.input || {};

      const toolStartTime = Date.now();
      let result: SkillToolResult;

      const skillName =
        toolName === "Skill"
          ? String(toolInput["skill"] || "unknown")
          : String(toolInput["skill"] || toolName);

      if (toolName === "Skill") {
        result = handleSkillToolCall(skillName, options.conversationId, options.userId, repo);
      } else if (options.executeCustomTool) {
        result = await options.executeCustomTool(toolName, toolInput);
      } else {
        result = { content: `Error: Unknown tool '${toolName}'.`, isError: true };
      }

      const durationMs = Date.now() - toolStartTime;
      const outcome: "success" | "error" = result.isError ? "error" : "success";

      // Structured logging for every Skill/Bash/Read/Write call
      console.log(
        JSON.stringify({
          level: "info",
          type: "structured_tool_log",
          conversationId: options.conversationId,
          skill: skillName,
          toolName,
          durationMs,
          outcome,
          timestamp: Date.now(),
        })
      );

      toolTraces.push({
        toolName,
        input: toolInput,
        output: result.content,
        isError: Boolean(result.isError),
      });

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUseId,
        content: result.content,
        ...(result.isError ? { is_error: true } : {}),
      });
    }

    // Append user turn containing tool results
    conversationHistory.push({
      role: "user",
      content: toolResults,
    });
  }

  return {
    finalText: finalText || "Task completed.",
    iterations: iteration,
    toolTraces,
    stopReason: lastStopReason,
  };
}
