import fs from "node:fs";
import path from "node:path";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { seedBuiltinSkills } from "../application/seedBuiltinSkills.js";
import { buildSkillsPrompt } from "../application/promptBuilder.js";
import { SKILL_TOOL_DEFINITION } from "../application/skillToolHandler.js";
import { SANDBOX_TOOLS, executeSandboxTool } from "../application/sandboxTools.js";
import { initSandbox } from "../application/sandboxManager.js";
import { runAnthropicToolLoop } from "../application/anthropicToolLoop.js";

async function main(): Promise<void> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    console.error(
      "Error: ANTHROPIC_API_KEY environment variable is required to run live E2E test."
    );
    console.log("Usage: ANTHROPIC_API_KEY=sk-ant-... npm run e2e:skills");
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("Starting Live Skills E2E Tool Loop Run");
  console.log("=======================================================\n");

  const db = getChatDatabase();
  const repo = new SkillRepository(db);
  await seedBuiltinSkills(repo);

  const conversationId = `manual-e2e-${Date.now()}`;
  const csvSkill = await repo.getByNameAndScope("csv-summary", "builtin");
  if (!csvSkill) {
    throw new Error("csv-summary builtin skill not found in database.");
  }

  // 1. Enable csv-summary skill
  await repo.setConversationSkills(conversationId, [csvSkill.id], "test-user");
  const enabledSkills = await repo.getConversationSkills(conversationId, "test-user");
  console.log(`[Setup] Enabled skill: ${csvSkill.name} (ID: ${csvSkill.id})`);

  // 2. Initialize sandbox & prepare workspace
  const sandbox = initSandbox(conversationId, enabledSkills);
  const sampleCsv = `name,department,salary\nAlice,Engineering,95000\nBob,Marketing,62000\nCharlie,Engineering,105000\nDiana,Design,78000\n`;
  const csvPath = path.join(sandbox.workspaceDir, "test_data.csv");
  fs.writeFileSync(csvPath, sampleCsv, "utf8");
  console.log(`[Setup] Wrote sample CSV file to sandbox workspace: ${csvPath}`);

  // 3. Build progressive system prompt
  const baseSystem = "You are a helpful data analyst assistant with access to tools.";
  const skillsPrompt = buildSkillsPrompt(enabledSkills);
  const fullSystemPrompt = `${baseSystem}\n\n${skillsPrompt}`;
  console.log("[Prompt Builder] Injected system prompt with <available_skills> XML block.");

  const tools = [SKILL_TOOL_DEFINITION, ...SANDBOX_TOOLS];

  // 4. Run tool loop
  console.log("[Tool Loop] Invoking Anthropic model with prompt: 'Summarize test_data.csv'...\n");
  const result = await runAnthropicToolLoop({
    apiKey,
    baseUrl: process.env["ANTHROPIC_BASE_URL"] || "https://api.anthropic.com/v1",
    model: process.env["ANTHROPIC_MODEL"] || "claude-3-5-sonnet-20241022",
    messages: [
      {
        role: "user",
        content:
          "Please summarize the CSV data located at test_data.csv using the csv-summary skill instructions and python script.",
      },
    ],
    systemInstruction: fullSystemPrompt,
    conversationId,
    userId: "test-user",
    tools,
    repo,
    executeCustomTool: async (toolName, input) => {
      console.log(`\n  -> [TOOL CALL] ${toolName} with input: ${JSON.stringify(input)}`);
      const toolRes = await executeSandboxTool(
        toolName,
        input,
        conversationId,
        sandbox,
        repo,
        "test-user"
      );
      const preview =
        toolRes.content.length > 200 ? toolRes.content.slice(0, 200) + "..." : toolRes.content;
      console.log(`  <- [TOOL RESULT] (${toolRes.isError ? "ERROR" : "OK"}): ${preview}`);
      return toolRes;
    },
  });

  console.log("\n=======================================================");
  console.log(
    `Completed in ${result.iterations} iteration(s) with stop reason: ${result.stopReason}`
  );
  console.log("=======================================================");
  console.log("\n--- Full Tool Call Trace ---");
  for (const [index, trace] of result.toolTraces.entries()) {
    console.log(
      `#${index + 1}: ${trace.toolName} | Input: ${JSON.stringify(trace.input)} | Output length: ${trace.output.length} chars`
    );
  }

  console.log("\n--- Final Assistant Response ---");
  console.log(result.finalText);
  console.log("\n=======================================================\n");
}

main().catch((err) => {
  console.error("Fatal error running E2E skills loop:", err);
  process.exit(1);
});
