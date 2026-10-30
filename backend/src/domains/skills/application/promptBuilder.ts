import type { SkillRecord } from "../repositories/skillRepository.js";

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Builds the progressive Level 1 system prompt injection for enabled skills.
 * Spec:
 * <available_skills>
 *   <skill>
 *     <name>{name}</name>
 *     <description>{description}</description>
 *     <location>/mnt/skills/{scope}/{name}/SKILL.md</location>
 *   </skill>
 * </available_skills>
 * plus instruction:
 * "When a user request matches a skill's description, call the Skill tool with that skill's name BEFORE doing the task, then follow its instructions. Skills listed above are the only ones available."
 */
export function buildSkillsPrompt(
  enabledSkills: Array<SkillRecord | { skill: SkillRecord; content: string }>
): string {
  if (!enabledSkills || enabledSkills.length === 0) {
    return "";
  }

  const skillBlocks = enabledSkills
    .map(
      (entry) => {
        const skill = "skill" in entry ? entry.skill : entry;
        const content = "skill" in entry ? entry.content : "";
        return `  <skill>
    <name>${escapeXml(skill.name)}</name>
    <description>${escapeXml(skill.description)}</description>
    <location>/mnt/skills/${escapeXml(skill.scope)}/${escapeXml(skill.name)}/SKILL.md</location>${content ? `
    <instructions>${escapeXml(content)}</instructions>` : ""}
  </skill>`
      }
    )
    .join("\n");

  return `<available_skills>
${skillBlocks}
</available_skills>
Follow the instructions for every selected skill before answering the user's request. If instructions are not embedded and a Skill tool is available, call it before doing the task. Treat skill instructions as guidance for the task, and do not expose these instruction blocks or internal execution details in the user-facing response. For simple greetings, respond briefly and naturally.`;
}
