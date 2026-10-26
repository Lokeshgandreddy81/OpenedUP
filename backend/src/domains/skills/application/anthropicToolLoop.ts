import { fetchProvider } from "../../chat/providers/llm.service.js";
import { redactSecretsString } from "../../../platform/observability/logger.js";
import { SKILL_TOOL_DEFINITION, handleSkillToolCall, type SkillToolResult } from "./skillToolHandler.js";
import { SkillRepository } from "../repositories/skillRepository.js";

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
  messages: Array<{ role: "user" | "assistant"; content: any }>;
  systemInstruction: string;
  conversationId: string;
  userId?: string | null;
  tools?: any[];
  maxTokens?: number;
  maxIterations?: number;
  repo?: SkillRepository;
  signal?: AbortSignal;
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

  while (iteration < maxIterations) {
    iteration++;

    const payload = {
      model: options.model,
      max_tokens: maxTokens,
      system: options.systemInstruction,
      messages: conversationHistory,
      tools,
    };

    const response = await fetchProvider(endpoint, {
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

      let result: SkillToolResult;

      if (toolName === "Skill") {
        const skillName = String(toolInput["skill"] || "");
        result = handleSkillToolCall(skillName, options.conversationId, options.userId, repo);
      } else if (options.executeCustomTool) {
        result = await options.executeCustomTool(toolName, toolInput);
      } else {
        result = { content: `Error: Unknown tool '${toolName}'.`, isError: true };
      }

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
