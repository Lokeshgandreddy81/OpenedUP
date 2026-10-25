import { afterEach, describe, expect, it, vi } from "vitest";
import { openChatDatabase } from "../../src/platform/database/chatDatabase.js";
import { ConversationRepository } from "../../src/domains/conversations/repositories/conversationRepository.js";
import { ScheduledTaskService } from "../../src/domains/scheduled/application/scheduledTaskService.js";
import { ScheduledTaskRepository } from "../../src/domains/scheduled/repositories/scheduledTaskRepository.js";
import { ScheduledTaskWorker } from "../../src/domains/scheduled/application/scheduledTaskWorker.js";
import type { ScheduledTaskInput } from "@charan-interiors/contracts";
import type { processChat } from "../../src/domains/chat/application/chat.service.js";

const db = openChatDatabase(":memory:");

function task(overrides: Partial<ScheduledTaskInput> = {}): ScheduledTaskInput {
  return {
    title: "Morning summary",
    prompt: "Summarize what changed overnight.",
    icon: "☀️",
    frequency: "daily",
    time: "09:00",
    timezone: "Asia/Kolkata",
    isActive: true,
    model: "gpt-6-astra",
    effort: "Medium",
    notifications: "Important updates",
    startInNewChat: true,
    ...overrides,
  };
}

afterEach(() => {
  db.exec(
    "DELETE FROM scheduled_task_runs; DELETE FROM scheduled_tasks; DELETE FROM chat_messages; DELETE FROM conversations;"
  );
});

describe("scheduled task execution", () => {
  it("uses the owner's saved key and persists the provider result in its own conversation", async () => {
    const tasks = new ScheduledTaskRepository(db);
    const conversations = new ConversationRepository(db);
    const generate = vi.fn<typeof processChat>(async () => ({
      content: "The overnight changes are ready.",
      thinkingTime: "1s",
      stepTitle: "Done",
      stepDescription: "Completed",
      thoughtDetails: [],
      modelUsed: "gpt-6-astra",
      providerUsed: "openai",
    }));
    const service = new ScheduledTaskService(tasks, conversations, generate, (userId, provider) => {
      expect(userId).toBe("user-a");
      expect(provider).toBe("openai");
      return { apiKey: "saved-user-key" };
    });
    const created = service.create("user-a", task());
    const queued = service.runNow("user-a", created.id)!;

    await expect(service.executeNext()).resolves.toBe(true);

    const completed = service.getRun("user-a", queued.id)!;
    expect(completed).toMatchObject({
      status: "succeeded",
      output: "The overnight changes are ready.",
      modelUsed: "gpt-6-astra",
      conversationId: expect.any(String),
    });
    expect(conversations.get("user-a", completed.conversationId!)?.messages).toMatchObject([
      { role: "user", content: "Summarize what changed overnight." },
      { role: "assistant", content: "The overnight changes are ready." },
    ]);
    expect(generate).toHaveBeenCalledWith(
      {
        messages: [{ role: "user", content: "Summarize what changed overnight." }],
        model: "gpt-6-astra",
        effort: "Medium",
      },
      { injectedApiKey: "saved-user-key", injectedBaseUrl: undefined }
    );
  });

  it("records a failed run when that owner has no provider key", async () => {
    const tasks = new ScheduledTaskRepository(db);
    const generate = vi.fn<typeof processChat>();
    const service = new ScheduledTaskService(
      tasks,
      new ConversationRepository(db),
      generate,
      () => null
    );
    const created = service.create("user-a", task({ model: "claude-opus-5.5" }));
    const queued = service.runNow("user-a", created.id)!;

    await service.executeNext();

    expect(service.getRun("user-a", queued.id)).toMatchObject({
      status: "failed",
      error: expect.stringContaining("Connect your Anthropic key"),
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it("recovers and executes a due task from the background worker", async () => {
    const tasks = new ScheduledTaskRepository(db);
    const conversations = new ConversationRepository(db);
    const generate = vi.fn<typeof processChat>(async () => ({
      content: "The scheduled report is ready.",
      thinkingTime: "1s",
      stepTitle: "Done",
      stepDescription: "Completed",
      thoughtDetails: [],
      modelUsed: "gpt-6-astra",
      providerUsed: "openai",
    }));
    const service = new ScheduledTaskService(tasks, conversations, generate, () => ({
      apiKey: "saved-user-key",
    }));
    const created = service.create("user-a", task());
    const dueAt = Date.now() - 1_000;
    db.prepare("UPDATE scheduled_tasks SET next_run_at = ? WHERE id = ?").run(dueAt, created.id);
    tasks.enqueueDueRuns(Date.now());
    expect(tasks.claimNextRun(Date.now(), 5 * 60_000)?.status).toBe("running");

    const worker = new ScheduledTaskWorker(service, 10);
    worker.start();
    try {
      await vi.waitFor(() => {
        expect(service.listRuns("user-a", created.id)).toMatchObject([
          { status: "succeeded", output: "The scheduled report is ready." },
        ]);
      });
    } finally {
      await worker.stop();
    }
  });
});
