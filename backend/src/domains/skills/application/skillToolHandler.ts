import { SkillRepository } from "../repositories/skillRepository.js";
import { parseSkillMd } from "./skillParser.js";
import { readSkillFile } from "./skillStorage.js";
import { checkSkillToolRateLimit } from "./rateLimits.js";

export const SKILL_TOOL_DEFINITION = {
  name: "Skill",
  description:
    "Load the full instructions of an enabled skill. Call this first when the task matches a skill description in <available_skills>.",
  input_schema: {
    type: "object",
    properties: {
      skill: {
        type: "string",
        description: "The name of the enabled skill to load instructions for.",
      },
    },
    required: ["skill"],
  },
} as const;

export interface SkillToolResult {
  content: string;
  isError?: boolean;
}

/**
 * Handles model invocation of the 'Skill' tool.
 * Verifies that the requested skill is enabled for the specific conversation.
 * Returns the SKILL.md body and logs usage.
 */
export async function handleSkillToolCall(
  skillName: string,
  conversationId: string,
  userId?: string | null,
  repo: SkillRepository = new SkillRepository(),
  orgId?: string | null
): Promise<SkillToolResult> {
  const rateLimitStatus = checkSkillToolRateLimit(conversationId);
  if (!rateLimitStatus.allowed) {
    return {
      content:
        rateLimitStatus.message ||
        "Rate limit exceeded for Skill tool calls. Please wait before trying again.",
      isError: true,
    };
  }

  if (!skillName || typeof skillName !== "string" || !skillName.trim()) {
    return { content: "Error: No skill name provided.", isError: true };
  }

  const cleanName = skillName.trim();

  // Fresh load from DB of this conversation's enabled skills
  const enabledSkills = await repo.getConversationSkills(conversationId, userId, orgId);
  const matched = enabledSkills.find((s) => s.name === cleanName && s.isActive);

  if (!matched) {
    return { content: "Skill not enabled", isError: true };
  }

  // Read SKILL.md body
  let rawContent: Buffer | null = null;

  rawContent = await readSkillFile(matched.storagePath, "SKILL.md");

  if (!rawContent) {
    return {
      content: `Error: SKILL.md file for skill '${cleanName}' could not be loaded.`,
      isError: true,
    };
  }

  let instructionsBody = "";
  try {
    const parsed = parseSkillMd(rawContent);
    instructionsBody = parsed.body || rawContent.toString("utf8");
  } catch {
    instructionsBody = rawContent.toString("utf8");
  }

  // Log usage to skill_usage table
  await repo.logUsage(conversationId, cleanName, userId ?? null);

  return {
    content: instructionsBody,
    isError: false,
  };
}
