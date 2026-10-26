import fs from "node:fs";
import path from "node:path";
import { SkillRepository } from "../repositories/skillRepository.js";
import { parseSkillMd } from "./skillParser.js";
import { readSkillFileFromDisk } from "./skillStorage.js";

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
  isError: boolean;
}

/**
 * Handles model invocation of the 'Skill' tool.
 * Verifies that the requested skill is enabled for the specific conversation.
 * Returns the SKILL.md body and logs usage.
 */
export function handleSkillToolCall(
  skillName: string,
  conversationId: string,
  userId?: string | null,
  repo: SkillRepository = new SkillRepository()
): SkillToolResult {
  if (!skillName || typeof skillName !== "string" || !skillName.trim()) {
    return { content: "Error: No skill name provided.", isError: true };
  }

  const cleanName = skillName.trim();

  // Fresh load from DB of this conversation's enabled skills
  const enabledSkills = repo.getConversationSkills(conversationId);
  const matched = enabledSkills.find((s) => s.name === cleanName && s.isActive);

  if (!matched) {
    return { content: "Skill not enabled", isError: true };
  }

  // Read SKILL.md body
  let rawContent: Buffer | null = null;

  // Try reading from disk storage path
  if (matched.storagePath) {
    rawContent = readSkillFileFromDisk(matched.storagePath, "SKILL.md");
  }

  if (!rawContent) {
    // Check if relative path was stored directly
    const directPath = path.join(matched.storagePath, "SKILL.md");
    if (fs.existsSync(directPath)) {
      rawContent = fs.readFileSync(directPath);
    }
  }

  if (!rawContent) {
    return {
      content: `Error: SKILL.md file for skill '${cleanName}' could not be located on disk.`,
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
  repo.logUsage(conversationId, cleanName, userId ?? null);

  return {
    content: instructionsBody,
    isError: false,
  };
}
