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
export function buildSkillsPrompt(enabledSkills: SkillRecord[]): string {
  if (!enabledSkills || enabledSkills.length === 0) {
    return "";
  }

  const skillBlocks = enabledSkills
    .map(
      (skill) => `  <skill>
    <name>${escapeXml(skill.name)}</name>
    <description>${escapeXml(skill.description)}</description>
    <location>/mnt/skills/${escapeXml(skill.scope)}/${escapeXml(skill.name)}/SKILL.md</location>
  </skill>`
    )
    .join("\n");

  return `<available_skills>
${skillBlocks}
</available_skills>
When a user request matches a skill's description, call the Skill tool with that skill's name BEFORE doing the task, then follow its instructions. Skills listed above are the only ones available. Use skills silently: never include skill names, raw tool inputs or outputs, JSON payloads, execution traces, or labels such as "Skill Input" and "Skill Output" in the user-facing response. Return only the polished answer. For simple greetings, respond briefly and naturally; do not list capabilities unless asked.`;
}
