import assert from "node:assert/strict";
import test from "node:test";
import { ScheduledTaskService } from "./scheduledTaskService.js";
import type { ScheduledTaskRecord } from "@charan-interiors/contracts";
import type { ChatRequest } from "@charan-interiors/contracts";
import type { ProcessChatOptions } from "../../chat/application/chat.service.js";
import type { StoredMessage } from "../../conversations/repositories/conversationRepository.js";

type TaskRepositoryDouble = ConstructorParameters<typeof ScheduledTaskService>[0];
type ConversationRepositoryDouble = ConstructorParameters<typeof ScheduledTaskService>[1];
type GeneratorDouble = ConstructorParameters<typeof ScheduledTaskService>[2];
type CredentialLoaderDouble = ConstructorParameters<typeof ScheduledTaskService>[3];
type AppendedMessage = Omit<StoredMessage, "id" | "createdAt"> & { id?: string };

interface MockTask extends ScheduledTaskRecord {
  userId: string;
  conversationId?: string | null;
}

test("ScheduledTaskService - Autonomous background execution with credential vault and notifications", async (t) => {
  await t.test("1. Successfully retrieves user credential from vault and runs task", async () => {
    let loadedUserId = "";
    let loadedProvider = "";
    let generatedWithKey = "";
    let generatedSignal: AbortSignal | undefined;
    let persistedConversation = false;

    const mockTasksRepo = {
      enqueueDueRuns: () => 1,
      claimNextRun: () => ({
        id: "run-1",
        taskId: "task-1",
        userId: "user-123",
        trigger: "scheduled" as const,
        status: "running" as const,
        scheduledFor: Date.now(),
        createdAt: Date.now(),
        startedAt: Date.now(),
        finishedAt: null,
        output: null,
        error: null,
        modelUsed: null,
        providerUsed: null,
        conversationId: null,
      }),
      getForExecution: (_id: string): MockTask => ({
        id: "task-1",
        userId: "user-123",
        title: "Daily Standup Summary",
        prompt: "Summarize today's tickets",
        icon: "⏱️",
        frequency: "daily",
        time: "09:00",
        timezone: "UTC",
        isActive: true,
        model: "claude-opus-5.5",
        effort: "Medium",
        notifications: "Important updates",
        startInNewChat: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastRunAt: null,
        nextRunAt: null,
        conversationId: null,
      }),
      setConversationId: () => {},
      finishRun: (params: { status: string; output?: string; conversationId?: string }) => {
        assert.equal(params.status, "succeeded");
        assert.equal(params.output, "Summary generated successfully");
        assert.equal(params.conversationId, "conv-1");
      },
    } as unknown as TaskRepositoryDouble;

    const mockConversationsRepo = {
      get: () => null,
      create: () => ({ id: "conv-1" }),
      appendMessage: (_userId: string, convId: string) => {
        persistedConversation = true;
        assert.equal(convId, "conv-1");
      },
    } as unknown as ConversationRepositoryDouble;

    const mockGenerateChat = async (_payload: ChatRequest, options?: ProcessChatOptions) => {
      generatedWithKey = options?.injectedApiKey ?? "";
      generatedSignal = options?.signal;
      return {
        content: "Summary generated successfully",
        modelUsed: "claude-sonnet-4.6",
        providerUsed: "anthropic" as const,
      };
    };

    const mockLoadCredential = (userId: string, provider: string) => {
      loadedUserId = userId;
      loadedProvider = provider;
      return { apiKey: "sk-ant-test-key-12345", baseUrl: "https://api.anthropic.com" };
    };

    const service = new ScheduledTaskService(
      mockTasksRepo,
      mockConversationsRepo,
      mockGenerateChat as unknown as GeneratorDouble,
      mockLoadCredential as unknown as CredentialLoaderDouble
    );

    const executed = await service.executeNext();
    assert.equal(executed, true);
    assert.equal(loadedUserId, "user-123");
    assert.equal(loadedProvider, "anthropic");
    assert.equal(generatedWithKey, "sk-ant-test-key-12345");
    assert.ok(generatedSignal instanceof AbortSignal);
    assert.equal(generatedSignal.aborted, false);
    assert.equal(persistedConversation, true);
  });

  await t.test(
    "2. Missing API key triggers actionable error and persists failure notification to conversation",
    async () => {
      let finishedStatus = "";
      let finishedError = "";
      let finishedConversationId: string | undefined;
      const appendedMessages: AppendedMessage[] = [];

      const mockTasksRepo = {
        enqueueDueRuns: () => 1,
        claimNextRun: () => ({
          id: "run-2",
          taskId: "task-2",
          userId: "user-456",
          trigger: "scheduled" as const,
          status: "running" as const,
          scheduledFor: Date.now(),
          createdAt: Date.now(),
          startedAt: Date.now(),
          finishedAt: null,
          output: null,
          error: null,
          modelUsed: null,
          providerUsed: null,
          conversationId: null,
        }),
        getForExecution: (_id: string): MockTask => ({
          id: "task-2",
          userId: "user-456",
          title: "Market Report",
          prompt: "Analyze latest market stats",
          icon: "📊",
          frequency: "daily",
          time: "08:00",
          timezone: "UTC",
          isActive: true,
          model: "gpt-6-astra",
          effort: "High",
          notifications: "Important updates",
          startInNewChat: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastRunAt: null,
          nextRunAt: null,
          conversationId: null,
        }),
        setConversationId: () => {},
        finishRun: (params: { status: string; error?: string; conversationId?: string }) => {
          finishedStatus = params.status;
          finishedError = params.error || "";
          finishedConversationId = params.conversationId;
        },
      } as unknown as TaskRepositoryDouble;

      const mockConversationsRepo = {
        get: () => null,
        create: () => ({ id: "conv-missing-key" }),
        appendMessage: (_userId: string, _convId: string, msg: AppendedMessage) => {
          appendedMessages.push(msg);
        },
      } as unknown as ConversationRepositoryDouble;

      const mockLoadCredential = () => null; // Missing key

      const service = new ScheduledTaskService(
        mockTasksRepo,
        mockConversationsRepo,
        (async (_payload: ChatRequest, _options?: ProcessChatOptions) => {
          throw new Error("not expected");
        }) as unknown as GeneratorDouble,
        mockLoadCredential as unknown as CredentialLoaderDouble
      );

      const executed = await service.executeNext();
      assert.equal(executed, true);
      assert.equal(finishedStatus, "failed");
      assert.match(
        finishedError,
        /Connect your OpenAI key in Customize → Providers to run this task/
      );
      assert.equal(finishedConversationId, "conv-missing-key");
      assert.equal(appendedMessages.length, 2);
      // User message
      assert.equal(appendedMessages[0]!.role, "user");
      assert.equal(appendedMessages[0]!.content, "Analyze latest market stats");
      // Assistant actionable notification message
      assert.equal(appendedMessages[1]!.role, "assistant");
      assert.equal(appendedMessages[1]!.status, "interrupted");
      assert.match(appendedMessages[1]!.content, /⚠️ Scheduled task "Market Report" could not run/);
      assert.match(appendedMessages[1]!.content, /Customize → Providers/);
    }
  );

  await t.test(
    "3. Revoked / rejected API key triggers actionable error and persists failure notification",
    async () => {
      let finishedStatus = "";
      let finishedError = "";
      const appendedMessages: AppendedMessage[] = [];

      const mockTasksRepo = {
        enqueueDueRuns: () => 1,
        claimNextRun: () => ({
          id: "run-3",
          taskId: "task-3",
          userId: "user-789",
          trigger: "scheduled" as const,
          status: "running" as const,
          scheduledFor: Date.now(),
          createdAt: Date.now(),
          startedAt: Date.now(),
          finishedAt: null,
          output: null,
          error: null,
          modelUsed: null,
          providerUsed: null,
          conversationId: null,
        }),
        getForExecution: (_id: string): MockTask => ({
          id: "task-3",
          userId: "user-789",
          title: "Daily Briefing",
          prompt: "Give me the morning briefing",
          icon: "⏱️",
          frequency: "weekdays",
          time: "07:30",
          timezone: "UTC",
          isActive: true,
          model: "claude-opus-5.5",
          effort: "Medium",
          notifications: "Failed runs only", // specifically wants failure alerts
          startInNewChat: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastRunAt: null,
          nextRunAt: null,
          conversationId: null,
        }),
        setConversationId: () => {},
        finishRun: (params: { status: string; error?: string; conversationId?: string }) => {
          finishedStatus = params.status;
          finishedError = params.error || "";
        },
      } as unknown as TaskRepositoryDouble;

      const mockConversationsRepo = {
        get: () => null,
        create: () => ({ id: "conv-revoked-key" }),
        appendMessage: (_userId: string, _convId: string, msg: AppendedMessage) => {
          appendedMessages.push(msg);
        },
      } as unknown as ConversationRepositoryDouble;

      // Upstream 401 Unauthorized / revoked key error
      const mockGenerateChat = async () => {
        throw new Error("HTTP 401 Unauthorized: invalid x-api-key");
      };

      const mockLoadCredential = () => ({ apiKey: "sk-ant-revoked-key" });

      const service = new ScheduledTaskService(
        mockTasksRepo,
        mockConversationsRepo,
        mockGenerateChat as unknown as GeneratorDouble,
        mockLoadCredential as unknown as CredentialLoaderDouble
      );

      const executed = await service.executeNext();
      assert.equal(executed, true);
      assert.equal(finishedStatus, "failed");
      assert.match(
        finishedError,
        /The provider rejected this API key\. Check the key and selected provider in Customize → Providers/
      );
      assert.equal(appendedMessages.length, 2);
      assert.match(appendedMessages[1]!.content, /The provider rejected this API key/);
    }
  );

  await t.test("4. 'Failed runs only' does not spam conversation on success", async () => {
    let conversationCreated = false;

    const mockTasksRepo = {
      enqueueDueRuns: () => 1,
      claimNextRun: () => ({
        id: "run-4",
        taskId: "task-4",
        userId: "user-silent",
        trigger: "scheduled" as const,
        status: "running" as const,
        scheduledFor: Date.now(),
        createdAt: Date.now(),
        startedAt: Date.now(),
        finishedAt: null,
        output: null,
        error: null,
        modelUsed: null,
        providerUsed: null,
        conversationId: null,
      }),
      getForExecution: (_id: string): MockTask => ({
        id: "task-4",
        userId: "user-silent",
        title: "Silent Standup",
        prompt: "Run silent check",
        icon: "⏱️",
        frequency: "daily",
        time: "09:00",
        timezone: "UTC",
        isActive: true,
        model: "claude-opus-5.5",
        effort: "Medium",
        notifications: "Failed runs only",
        startInNewChat: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastRunAt: null,
        nextRunAt: null,
        conversationId: null,
      }),
      finishRun: (params: { status: string; conversationId?: string }) => {
        assert.equal(params.status, "succeeded");
        assert.equal(params.conversationId, undefined);
      },
    } as unknown as TaskRepositoryDouble;

    const mockConversationsRepo = {
      create: () => {
        conversationCreated = true;
        return { id: "conv-should-not-exist" };
      },
    } as unknown as ConversationRepositoryDouble;

    const service = new ScheduledTaskService(
      mockTasksRepo,
      mockConversationsRepo,
      (async (_payload: ChatRequest, _options?: ProcessChatOptions) => ({
        content: "Success",
        thinkingTime: "1s",
        stepTitle: "",
        stepDescription: "",
        thoughtDetails: [],
        modelUsed: "claude-sonnet-4.6",
        providerUsed: "anthropic",
      })) as unknown as GeneratorDouble,
      (() => ({ apiKey: "sk-ant-valid" })) as unknown as CredentialLoaderDouble
    );

    const executed = await service.executeNext();
    assert.equal(executed, true);
    assert.equal(conversationCreated, false);
  });

  await t.test(
    "5. Timed-out provider generation persists timeout message instead of generic error",
    async () => {
      let finishedStatus = "";
      let finishedError = "";
      const appendedMessages: AppendedMessage[] = [];

      const mockTasksRepo = {
        enqueueDueRuns: () => 1,
        claimNextRun: () => ({
          id: "run-5",
          taskId: "task-5",
          userId: "user-timeout",
          trigger: "scheduled" as const,
          status: "running" as const,
          scheduledFor: Date.now(),
          createdAt: Date.now(),
          startedAt: Date.now(),
          finishedAt: null,
          output: null,
          error: null,
          modelUsed: null,
          providerUsed: null,
          conversationId: null,
        }),
        getForExecution: (_id: string): MockTask => ({
          id: "task-5",
          userId: "user-timeout",
          title: "Slow Task",
          prompt: "Run slow check",
          icon: "⏱️",
          frequency: "daily",
          time: "09:00",
          timezone: "UTC",
          isActive: true,
          model: "claude-opus-5.5",
          effort: "Medium",
          notifications: "Failed runs only",
          startInNewChat: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastRunAt: null,
          nextRunAt: null,
          conversationId: null,
        }),
        setConversationId: () => {},
        finishRun: (params: { status: string; error?: string }) => {
          finishedStatus = params.status;
          finishedError = params.error || "";
        },
      } as unknown as TaskRepositoryDouble;

      const mockConversationsRepo = {
        get: () => null,
        create: () => ({ id: "conv-timeout" }),
        appendMessage: (_userId: string, _convId: string, msg: AppendedMessage) => {
          appendedMessages.push(msg);
        },
      } as unknown as ConversationRepositoryDouble;

      const mockGenerateChat = async () => {
        const timeoutErr = new Error("The operation was aborted due to timeout");
        timeoutErr.name = "TimeoutError";
        throw timeoutErr;
      };

      const service = new ScheduledTaskService(
        mockTasksRepo,
        mockConversationsRepo,
        mockGenerateChat as unknown as GeneratorDouble,
        (() => ({ apiKey: "sk-ant-valid" })) as unknown as CredentialLoaderDouble
      );

      const executed = await service.executeNext();
      assert.equal(executed, true);
      assert.equal(finishedStatus, "failed");
      assert.equal(
        finishedError,
        "This model took too long to respond. Try again or choose another model."
      );
      assert.equal(appendedMessages.length, 2);
      assert.match(appendedMessages[1]!.content, /This model took too long to respond/);
    }
  );
});
