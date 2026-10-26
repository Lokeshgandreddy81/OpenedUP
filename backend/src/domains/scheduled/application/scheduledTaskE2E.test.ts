import assert from "node:assert/strict";
import test from "node:test";
import type { ScheduledTaskInput } from "@charan-interiors/contracts";
import type { ProcessChatOptions } from "../../chat/application/chat.service.js";
import { ConversationRepository } from "../../conversations/repositories/conversationRepository.js";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { ScheduledTaskService } from "./scheduledTaskService.js";
import { ScheduledTaskWorker } from "./scheduledTaskWorker.js";
import { ScheduledTaskRepository } from "../repositories/scheduledTaskRepository.js";

test("scheduled task persists, runs when due, advances recurrence, and delivers its result", async () => {
  const db = openChatDatabase(":memory:");
  try {
    const tasks = new ScheduledTaskRepository(db);
    const conversations = new ConversationRepository(db);
    const taskInput: ScheduledTaskInput = {
      title: "Schedule end-to-end check",
      prompt: "Summarize the latest updates",
      icon: "🧪",
      frequency: "daily",
      time: "09:00",
      timezone: "UTC",
      isActive: true,
      model: "gpt-6-astra",
      effort: "Medium",
      notifications: "Important updates",
      startInNewChat: false,
    };
    const task = tasks.create("schedule-e2e-user", taskInput);
    const dueAt = Date.now() - 1_000;
    db.prepare("UPDATE scheduled_tasks SET next_run_at = ? WHERE id = ?").run(dueAt, task.id);

    const service = new ScheduledTaskService(
      tasks,
      conversations,
      async (_request, _options?: ProcessChatOptions) => ({
        content: "Three updates need attention.",
        thinkingTime: "1s",
        stepTitle: "Complete",
        stepDescription: "",
        thoughtDetails: [],
        modelUsed: "gpt-6-astra",
        providerUsed: "openai",
      }),
      () => ({ apiKey: "test-provider-key" })
    );

    assert.equal(await service.executeNext(Date.now()), true);
    assert.equal(await service.executeNext(Date.now()), false);

    const runs = tasks.listRuns("schedule-e2e-user", task.id);
    assert.equal(runs.length, 1);
    assert.equal(runs[0]?.trigger, "scheduled");
    assert.equal(runs[0]?.status, "succeeded");
    assert.equal(runs[0]?.scheduledFor, dueAt);
    assert.equal(runs[0]?.output, "Three updates need attention.");
    assert.ok(runs[0]?.startedAt);
    assert.ok(runs[0]?.finishedAt);
    assert.ok((tasks.get("schedule-e2e-user", task.id)?.nextRunAt ?? 0) > Date.now());

    const conversationId = runs[0]?.conversationId;
    assert.ok(conversationId);
    const conversation = conversations.get("schedule-e2e-user", conversationId);
    assert.deepEqual(
      conversation?.messages.map(({ role, content, status, metadata }) => ({
        role,
        content,
        status,
        metadata,
      })),
      [
        {
          role: "user",
          content: taskInput.prompt,
          status: "complete",
          metadata: { source: "scheduled-task", taskId: task.id },
        },
        {
          role: "assistant",
          content: "Three updates need attention.",
          status: "complete",
          metadata: { source: "scheduled-task", taskId: task.id },
        },
      ]
    );
  } finally {
    db.close();
  }
});

test("background worker claims a due task once and records its completed run", async () => {
  const db = openChatDatabase(":memory:");
  const worker = (() => {
    const tasks = new ScheduledTaskRepository(db);
    const task = tasks.create("schedule-worker-user", {
      title: "Worker check",
      prompt: "Return worker status.",
      icon: "🧪",
      frequency: "daily",
      time: "09:00",
      timezone: "UTC",
      isActive: true,
      model: "gpt-6-astra",
      effort: "Low",
      notifications: "Failed runs only",
      startInNewChat: false,
    });
    db.prepare("UPDATE scheduled_tasks SET next_run_at = ? WHERE id = ?").run(
      Date.now() - 1_000,
      task.id
    );
    const service = new ScheduledTaskService(
      tasks,
      new ConversationRepository(db),
      async () => ({
        content: "Worker completed the task.",
        thinkingTime: "1s",
        stepTitle: "Complete",
        stepDescription: "",
        thoughtDetails: [],
        modelUsed: "gpt-6-astra",
        providerUsed: "openai",
      }),
      () => ({ apiKey: "test-provider-key" })
    );
    return { tasks, task, instance: new ScheduledTaskWorker(service, 10) };
  })();

  worker.instance.start();
  try {
    const deadline = Date.now() + 2_000;
    while (
      Date.now() < deadline &&
      worker.tasks.listRuns("schedule-worker-user", worker.task.id).length === 0
    ) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await new Promise((resolve) => setTimeout(resolve, 30));

    const runs = worker.tasks.listRuns("schedule-worker-user", worker.task.id);
    assert.equal(runs.length, 1);
    assert.equal(runs[0]?.status, "succeeded");
    assert.equal(runs[0]?.output, "Worker completed the task.");
  } finally {
    await worker.instance.stop();
    db.close();
  }
});
