import assert from "node:assert/strict";
import test from "node:test";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { seedBuiltinSkills } from "./seedBuiltinSkills.js";
import { handleSkillToolCall } from "./skillToolHandler.js";
import { runAnthropicToolLoop } from "./anthropicToolLoop.js";

test("SkillTool - handleSkillToolCall returns error when skill is not enabled for conversation", () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  seedBuiltinSkills(repo);

  const result = handleSkillToolCall("csv-summary", "conv-empty", "user-1", repo);
  assert.equal(result.isError, true);
  assert.equal(result.content, "Skill not enabled");
});

test("SkillTool - handleSkillToolCall loads SKILL.md body and logs usage when enabled", () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  seedBuiltinSkills(repo);

  // Insert conversation
  const now = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-101", "user-1", "Test Chat", "gemini-3.8-flash", now, now);

  const builtin = repo.getByNameAndScope("hello-format", "builtin");
  assert.ok(builtin);

  // Enable skill
  repo.setConversationSkills("conv-101", [builtin.id], "user-1");

  // Call tool
  const result = handleSkillToolCall("hello-format", "conv-101", "user-1", repo);
  assert.equal(result.isError, false);
  assert.ok(result.content.includes("Hello Format Instructions"));

  // Check usage log
  const usage = repo.listUsage("conv-101");
  assert.equal(usage.length, 1);
  assert.equal(usage[0]?.skill, "hello-format");
  assert.equal(usage[0]?.userId, "user-1");
});

test("AnthropicToolLoop - completes tool call turn and finishes loop", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  seedBuiltinSkills(repo);

  const now = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-loop-1", "user-1", "Loop Test", "claude-3-5-sonnet", now, now);

  const builtin = repo.getByNameAndScope("hello-format", "builtin");
  assert.ok(builtin);
  repo.setConversationSkills("conv-loop-1", [builtin.id], "user-1");

  // Mock fetch calls for Anthropic:
  // Turn 1: model returns tool_use block for Skill("hello-format")
  // Turn 2: model sees tool_result and returns final greeting text
  let turn = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    turn++;
    if (turn === 1) {
      return new Response(
        JSON.stringify({
          stop_reason: "tool_use",
          content: [
            { type: "text", text: "Checking skill instructions." },
            {
              type: "tool_use",
              id: "toolu_abc123",
              name: "Skill",
              input: { skill: "hello-format" },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          stop_reason: "end_turn",
          content: [{ type: "text", text: "Welcome! How may I assist you today?" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  }) as typeof fetch;

  try {
    const loopResult = await runAnthropicToolLoop({
      apiKey: "sk-ant-test-key",
      baseUrl: "https://1.1.1.1/v1",
      model: "claude-3-5-sonnet",
      messages: [{ role: "user", content: "Hello there!" }],
      systemInstruction: "You are a helpful assistant.",
      conversationId: "conv-loop-1",
      userId: "user-1",
      repo,
    });

    assert.equal(loopResult.iterations, 2);
    assert.equal(loopResult.stopReason, "end_turn");
    assert.equal(loopResult.finalText, "Welcome! How may I assist you today?");
    assert.equal(loopResult.toolTraces.length, 1);
    assert.equal(loopResult.toolTraces[0]?.toolName, "Skill");
    assert.ok(loopResult.toolTraces[0]?.output.includes("Hello Format Instructions"));

    // Verify usage logging occurred
    const usage = repo.listUsage("conv-loop-1");
    assert.equal(usage.length, 1);
    assert.equal(usage[0]?.skill, "hello-format");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
