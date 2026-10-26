import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { openChatDatabase } from "../../platform/database/chatDatabase.js";
import { SkillRepository } from "./repositories/skillRepository.js";
import { seedBuiltinSkills } from "./application/seedBuiltinSkills.js";
import { buildSkillsPrompt } from "./application/promptBuilder.js";
import { runAnthropicToolLoop } from "./application/anthropicToolLoop.js";
import {
  initSandbox,
  executeWrite,
} from "./application/sandboxManager.js";
import {
  SANDBOX_TOOLS,
  executeSandboxTool,
} from "./application/sandboxTools.js";
import { SKILL_TOOL_DEFINITION } from "./application/skillToolHandler.js";

function setupE2EEnvironment() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skills-e2e-"));
  process.env["SANDBOX_BASE_DIR"] = tmpDir;
  process.env["SKILLS_STORAGE_DIR"] = path.join(tmpDir, "skill_storage");

  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  seedBuiltinSkills(repo);

  return {
    db,
    repo,
    tmpDir,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    },
  };
}

test("Skills E2E Integration - Full progressive loading & multi-tool workflow", async () => {
  const { db, repo, cleanup } = setupE2EEnvironment();

  try {
    const conversationId = "conv-e2e-123";
    const userId = "user-alice";
    const now = Date.now();

    // 1. Create conversation in DB
    db.prepare(
      `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(conversationId, userId, "CSV Analytics", "claude-3-5-sonnet", now, now);

    // 2. Enable 'csv-summary' skill for this conversation
    const csvSkill = repo.getByNameAndScope("csv-summary", "builtin");
    assert.ok(csvSkill, "csv-summary skill should be seeded");
    repo.setConversationSkills(conversationId, [csvSkill.id], userId);

    const enabledSkills = repo.getConversationSkills(conversationId);
    assert.equal(enabledSkills.length, 1);
    assert.equal(enabledSkills[0]?.name, "csv-summary");

    // 3. Level 1 Prompt Builder: Only name, description, location injected
    const systemPrompt = buildSkillsPrompt(enabledSkills);
    assert.ok(systemPrompt.includes("<available_skills>"));
    assert.ok(systemPrompt.includes("<name>csv-summary</name>"));
    assert.ok(systemPrompt.includes("<location>/mnt/skills/builtin/csv-summary/SKILL.md</location>"));
    assert.ok(!systemPrompt.includes("import sys")); // instructions body is NOT yet injected

    // 4. Initialize sandbox & prepare test CSV file in workspace
    const sandboxPaths = initSandbox(conversationId, enabledSkills);
    executeWrite("sales.csv", "order_id,product,amount\n101,Desk,450\n102,Chair,150\n", sandboxPaths);

    // 5. Simulate multi-turn tool-use loop:
    // Turn 1: Model calls 'Skill' tool with 'csv-summary' (Level 2)
    // Turn 2: Model receives instructions body, calls 'Bash' tool to run summarize.py (Level 3)
    // Turn 3: Model calls 'SendUserFile' to return summary.txt attachment
    // Turn 4: Model finishes turn and provides final message to user
    let apiCallCount = 0;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      apiCallCount++;
      const body = JSON.parse(init?.body as string);

      if (apiCallCount === 1) {
        // Model requests Skill tool
        return new Response(
          JSON.stringify({
            stop_reason: "tool_use",
            content: [
              { type: "text", text: "I will consult the csv-summary skill instructions." },
              {
                type: "tool_use",
                id: "toolu_step1_skill",
                name: "Skill",
                input: { skill: "csv-summary" },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else if (apiCallCount === 2) {
        // Model received SKILL.md body, now calls Bash tool to run the script
        const lastUserMsg = body.messages[body.messages.length - 1];
        const toolResult = lastUserMsg.content[0];
        assert.equal(toolResult.type, "tool_result");
        assert.ok(toolResult.content.includes("CSV Summary Instructions"));

        return new Response(
          JSON.stringify({
            stop_reason: "tool_use",
            content: [
              { type: "text", text: "Running summarization script on sales.csv." },
              {
                type: "tool_use",
                id: "toolu_step2_bash",
                name: "Bash",
                input: {
                  command: 'python3 /mnt/skills/builtin/csv-summary/scripts/summarize.py sales.csv',
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else if (apiCallCount === 3) {
        // Model sees script output, writes report and calls SendUserFile
        executeWrite("summary_report.txt", "Summary: 2 orders totaling $600.", sandboxPaths);

        return new Response(
          JSON.stringify({
            stop_reason: "tool_use",
            content: [
              {
                type: "tool_use",
                id: "toolu_step3_sendfile",
                name: "SendUserFile",
                input: {
                  path: "summary_report.txt",
                  title: "Sales Summary Report",
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else {
        // Final response
        return new Response(
          JSON.stringify({
            stop_reason: "end_turn",
            content: [
              {
                type: "text",
                text: "Here is the summary of sales.csv: 2 total orders processed. The full report has been attached.",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }) as typeof fetch;

    try {
      const allTools = [SKILL_TOOL_DEFINITION, ...SANDBOX_TOOLS];

      const loopResult = await runAnthropicToolLoop({
        apiKey: "sk-ant-test",
        baseUrl: "https://1.1.1.1/v1",
        model: "claude-3-5-sonnet",
        messages: [{ role: "user", content: "Please summarize sales.csv." }],
        systemInstruction: systemPrompt,
        conversationId,
        userId,
        tools: allTools,
        repo,
        executeCustomTool: (name, input) =>
          executeSandboxTool(name, input, conversationId, sandboxPaths, repo),
      });

      assert.equal(loopResult.stopReason, "end_turn");
      assert.equal(loopResult.iterations, 4);
      assert.ok(loopResult.finalText.includes("Here is the summary of sales.csv"));

      // Verify tool traces
      const toolNames = loopResult.toolTraces.map((t) => t.toolName);
      assert.deepEqual(toolNames, ["Skill", "Bash", "SendUserFile"]);

      // Verify skill usage table was updated
      const usage = repo.listUsage(conversationId);
      assert.equal(usage.length, 1);
      assert.equal(usage[0]?.skill, "csv-summary");

      // Verify attachment was published
      const attachmentPath = path.join(sandboxPaths.attachmentsDir, "summary_report.txt");
      assert.ok(fs.existsSync(attachmentPath));
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    cleanup();
  }
});

test("Skills E2E Security - Unauthorized skill access is strictly blocked", () => {
  const { db, repo, cleanup } = setupE2EEnvironment();
  try {
    // User Alice creates a private skill
    const aliceSkill = repo.create({
      name: "alice-confidential",
      description: "Alice confidential skill",
      scope: "user",
      ownerId: "user-alice",
      storagePath: "/path/to/alice",
    });

    // User Bob tries to list visible skills
    const visibleToBob = repo.listVisible("user-bob");
    assert.ok(!visibleToBob.some((s) => s.id === aliceSkill.id));

    // Bob creates conversation
    const now = Date.now();
    db.prepare(
      `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("conv-bob-99", "user-bob", "Bob chat", "claude-3-5-sonnet", now, now);

    // Bob tries to force-enable Alice's private skill
    // The prompt builder must never see Alice's skill for Bob
    const bobEnabled = repo.getConversationSkills("conv-bob-99");
    const bobPrompt = buildSkillsPrompt(bobEnabled);
    assert.ok(!bobPrompt.includes("alice-confidential"));
  } finally {
    cleanup();
  }
});
