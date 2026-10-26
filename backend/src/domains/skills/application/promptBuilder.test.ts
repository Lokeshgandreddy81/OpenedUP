import assert from "node:assert/strict";
import test from "node:test";
import { buildSkillsPrompt, escapeXml } from "./promptBuilder.js";
import type { SkillRecord } from "../repositories/skillRepository.js";

test("PromptBuilder - escapeXml correctly encodes XML special characters", () => {
  const raw = `<tag & "attribute" 'quote'>`;
  const escaped = escapeXml(raw);
  assert.equal(escaped, "&lt;tag &amp; &quot;attribute&quot; &apos;quote&apos;&gt;");
});

test("PromptBuilder - buildSkillsPrompt returns empty string when no skills enabled", () => {
  assert.equal(buildSkillsPrompt([]), "");
});

test("PromptBuilder - buildSkillsPrompt creates expected XML block and instruction text", () => {
  const skills: SkillRecord[] = [
    {
      id: "skill-1",
      name: "csv-summary",
      description: "Analyze & summarize CSV datasets.",
      scope: "builtin",
      ownerId: null,
      orgId: null,
      storagePath: "/path/to/csv",
      version: 1,
      isActive: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "skill-2",
      name: "hello-format",
      description: "Format greetings with <warmth>.",
      scope: "user",
      ownerId: "user-1",
      orgId: null,
      storagePath: "/path/to/hello",
      version: 2,
      isActive: true,
      createdAt: 2000,
      updatedAt: 2000,
    },
  ];

  const prompt = buildSkillsPrompt(skills);

  // Check XML tags
  assert.ok(prompt.includes("<available_skills>"));
  assert.ok(prompt.includes("</available_skills>"));
  assert.ok(prompt.includes("<name>csv-summary</name>"));
  assert.ok(prompt.includes("<location>/mnt/skills/builtin/csv-summary/SKILL.md</location>"));
  assert.ok(prompt.includes("<location>/mnt/skills/user/hello-format/SKILL.md</location>"));

  // Check XML escaping on description
  assert.ok(prompt.includes("Analyze &amp; summarize CSV datasets."));
  assert.ok(prompt.includes("Format greetings with &lt;warmth&gt;."));

  // Check required instruction text exactly matches spec
  const expectedInstruction =
    "When a user request matches a skill's description, call the Skill tool with that skill's name BEFORE doing the task, then follow its instructions. Skills listed above are the only ones available.";
  assert.ok(prompt.includes(expectedInstruction));
});
