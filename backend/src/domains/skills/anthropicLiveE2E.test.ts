import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getChatDatabase } from "../../platform/database/chatDatabase.js";
import { SkillRepository } from "./repositories/skillRepository.js";
import { seedBuiltinSkills } from "./application/seedBuiltinSkills.js";
import { buildSkillsPrompt } from "./application/promptBuilder.js";
import { SKILL_TOOL_DEFINITION } from "./application/skillToolHandler.js";
import { SANDBOX_TOOLS, executeSandboxTool } from "./application/sandboxTools.js";
import { initSandbox } from "./application/sandboxManager.js";
import { runAnthropicToolLoop } from "./application/anthropicToolLoop.js";

describe("Live Anthropic E2E Tool Loop", () => {
  const apiKey = process.env["ANTHROPIC_API_KEY"];

  test("runs full live tool loop with csv-summary skill (skipped when ANTHROPIC_API_KEY absent)", async (t) => {
    if (!apiKey) {
      t.skip("Skipping live Anthropic E2E test because ANTHROPIC_API_KEY is not set.");
      return;
    }

    const db = getChatDatabase();
    const repo = new SkillRepository(db);
    await seedBuiltinSkills(repo);

    const conversationId = `live-e2e-${Date.now()}`;
    const csvSkill = await repo.getByNameAndScope("csv-summary", "builtin");
    assert.ok(csvSkill, "csv-summary skill must be seeded");

    // Enable skill on conversation
    await repo.setConversationSkills(conversationId, [csvSkill.id], "test-user");

    // Init sandbox
    const enabledSkills = await repo.getConversationSkills(conversationId);
    const sandbox = initSandbox(conversationId, enabledSkills);

    // Put a sample CSV in workspace
    const sampleCsvContent = `name,department,salary\nAlice,Engineering,95000\nBob,Marketing,62000\nCharlie,Engineering,105000\nDiana,Design,78000\n`;
    fs.writeFileSync(path.join(sandbox.workspaceDir, "test_data.csv"), sampleCsvContent, "utf8");

    // Build system prompt with progressive loading instruction
    const baseSystem = "You are a helpful data analyst assistant with access to tools.";
    const skillsPrompt = buildSkillsPrompt(enabledSkills);
    const fullSystemPrompt = `${baseSystem}\n\n${skillsPrompt}`;

    const tools = [SKILL_TOOL_DEFINITION, ...SANDBOX_TOOLS];

    const result = await runAnthropicToolLoop({
      apiKey,
      baseUrl: process.env["ANTHROPIC_BASE_URL"] || "https://api.anthropic.com/v1",
      model: process.env["ANTHROPIC_MODEL"] || "claude-3-5-sonnet-20241022",
      messages: [
        {
          role: "user",
          content:
            "Please summarize this CSV file located at test_data.csv using the csv-summary skill instructions and python script.",
        },
      ],
      systemInstruction: fullSystemPrompt,
      conversationId,
      tools,
      repo,
      executeCustomTool: async (toolName, input) => {
        return await executeSandboxTool(toolName, input, conversationId, sandbox, repo);
      },
    });

    // Assertions:
    // (a) model calls Skill
    const skillCall = result.toolTraces.find((tr) => tr.toolName === "Skill");
    assert.ok(skillCall, "Model must call Skill tool");
    assert.equal(skillCall.input["skill"], "csv-summary");

    // (b) tool_result contains SKILL.md body
    assert.ok(
      skillCall.output.includes("scripts/summarize.py") ||
        skillCall.output.includes("CSV Summary Skill"),
      "Skill tool result must contain SKILL.md instructions"
    );

    // (c) Bash runs scripts/summarize.py
    const bashCall = result.toolTraces.find(
      (tr) =>
        tr.toolName === "Bash" &&
        typeof tr.input["command"] === "string" &&
        tr.input["command"].includes("summarize.py")
    );
    assert.ok(bashCall, "Bash tool must execute summarize.py");

    // (d) file or summary comes back
    assert.ok(result.finalText.length > 20, "Model must return non-empty summary");

    // (e) loop ends in end_turn under iteration cap
    assert.ok(result.iterations < 20, "Tool loop must complete well under 20 iterations");
    assert.equal(result.stopReason, "end_turn", "Stop reason must be end_turn");
  });
});
