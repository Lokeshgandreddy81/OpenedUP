import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { runAnthropicToolLoop } from "./anthropicToolLoop.js";
import { seedBuiltinSkills } from "./seedBuiltinSkills.js";

interface AnthropicMessageContent {
  type: string;
  name?: string;
  input?: { skill?: string };
}

interface AnthropicMessage {
  role: string;
  content: string | AnthropicMessageContent[];
}

interface AnthropicRequestBody {
  messages: AnthropicMessage[];
}

describe("Phase 3: Force-load on Explicit Selection", () => {
  let repo: SkillRepository;
  const conversationId = `conv-explicit-${Date.now()}`;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    const db = getChatDatabase();
    repo = new SkillRepository(db);
    seedBuiltinSkills(repo);
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("Explicitly selected skill is preloaded exactly once, while unselected enabled skills use progressive loading", async () => {
    const helloSkill = repo.getByNameAndScope("hello-format", "builtin");
    const csvSkill = repo.getByNameAndScope("csv-summary", "builtin");
    assert.ok(helloSkill);
    assert.ok(csvSkill);

    // 1. Explicitly select hello-format (explicitly_selected: true)
    repo.setConversationSkills(conversationId, [helloSkill.id], "test-user", {
      explicitlySelected: true,
    });

    const unpreloaded = repo.getUnpreloadedExplicitSkills(conversationId);
    assert.equal(unpreloaded.length, 1);
    assert.equal(unpreloaded[0]!.name, "hello-format");

    // Track the messages sent to the mock model
    let callCount = 0;
    let receivedMessages: AnthropicMessage[] = [];

    // Mock fetch implementation passed to tool loop
    const mockFetch = async (
      _url: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> => {
      callCount++;
      const body = JSON.parse(init?.body as string) as AnthropicRequestBody;
      receivedMessages = body.messages;

      return new Response(
        JSON.stringify({
          id: `msg-${callCount}`,
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "Hello! I have loaded the greeting instructions." }],
          stop_reason: "end_turn",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    // Turn 1
    const result1 = await runAnthropicToolLoop({
      apiKey: "test-key",
      baseUrl: "https://mock.anthropic.test",
      model: "test-model",
      messages: [{ role: "user", content: "Hi there" }],
      systemInstruction: "System",
      conversationId,
      repo,
      fetchFn: mockFetch,
    });
    assert.equal(result1.finalText, "Hello! I have loaded the greeting instructions.");

    // Verify synthetic tool call was preloaded into messages on Turn 1
    const syntheticToolUse = receivedMessages.find(
      (m) =>
        m.role === "assistant" &&
        Array.isArray(m.content) &&
        m.content.some(
          (c) => c.type === "tool_use" && c.name === "Skill" && c.input?.skill === "hello-format"
        )
    );
    assert.ok(
      syntheticToolUse,
      "Turn 1 must contain synthetic tool_use for explicitly selected skill"
    );

    const syntheticToolResult = receivedMessages.find(
      (m) =>
        m.role === "user" &&
        Array.isArray(m.content) &&
        m.content.some((c) => c.type === "tool_result")
    );
    assert.ok(syntheticToolResult, "Turn 1 must contain synthetic tool_result with SKILL.md body");

    // Check that skill is now marked as preloaded in database
    const unpreloadedAfter = repo.getUnpreloadedExplicitSkills(conversationId);
    assert.equal(unpreloadedAfter.length, 0, "Skill must be marked as preloaded after Turn 1");

    // Turn 2: Send another message in the same conversation
    const mockTurn2Fetch = async (_url: string): Promise<Response> => {
      return new Response(
        JSON.stringify({
          id: "msg-turn2",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "Turn 2 response." }],
          stop_reason: "end_turn",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const turn2Result = await runAnthropicToolLoop({
      apiKey: "test-key",
      baseUrl: "https://mock.anthropic.test",
      model: "test-model",
      messages: [{ role: "user", content: "Second question" }],
      systemInstruction: "System",
      conversationId,
      repo,
      fetchFn: mockTurn2Fetch,
    });
    assert.equal(turn2Result.finalText, "Turn 2 response.");

    // On Turn 2, toolTraces in result must NOT contain another pre-load
    const unpreloadedTurn2 = repo.getUnpreloadedExplicitSkills(conversationId);
    assert.equal(unpreloadedTurn2.length, 0);

    // 2. Unselected enabled skill (explicitlySelected = false) uses progressive loading (not preloaded)
    const convAutoId = `conv-auto-${Date.now()}`;
    repo.setConversationSkills(convAutoId, [csvSkill.id], "test-user", {
      explicitlySelected: false,
    });

    const unselectedUnpreloaded = repo.getUnpreloadedExplicitSkills(convAutoId);
    assert.equal(
      unselectedUnpreloaded.length,
      0,
      "Unselected skill must NOT be marked for preloading"
    );

    let autoTurnMessages: AnthropicMessage[] = [];
    const mockAutoFetch = async (
      _url: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> => {
      const body = JSON.parse(init?.body as string) as AnthropicRequestBody;
      autoTurnMessages = body.messages;
      return new Response(
        JSON.stringify({
          id: "msg-auto",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "Auto turn without preloading" }],
          stop_reason: "end_turn",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    await runAnthropicToolLoop({
      apiKey: "test-key",
      baseUrl: "https://mock.anthropic.test",
      model: "test-model",
      messages: [{ role: "user", content: "Summarize something" }],
      systemInstruction: "System",
      conversationId: convAutoId,
      repo,
      fetchFn: mockAutoFetch,
    });

    const hasSyntheticToolUse = autoTurnMessages.some(
      (m) =>
        m.role === "assistant" &&
        Array.isArray(m.content) &&
        m.content.some((c) => c.type === "tool_use" && c.name === "Skill")
    );
    assert.equal(
      hasSyntheticToolUse,
      false,
      "Auto-matched skill must NOT be preloaded as synthetic tool call"
    );
  });
});
