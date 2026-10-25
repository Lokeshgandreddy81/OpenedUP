import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { getChatDatabase } from "../../src/platform/database/chatDatabase.js";

const app = createApp();

function clearScheduledData() {
  const db = getChatDatabase();
  db.exec("DELETE FROM scheduled_task_runs; DELETE FROM scheduled_tasks;");
}

beforeEach(() => {
  clearScheduledData();
});

afterEach(() => {
  clearScheduledData();
});

describe("Scheduled Tasks Unauthenticated HTTP API", () => {
  it("allows unauthenticated CRUD, manual run queuing, and run history listing", async () => {
    // 1. List initially empty
    const listInitial = await request(app).get("/api/scheduled-tasks");
    expect(listInitial.status).toBe(200);
    expect(listInitial.body.tasks).toEqual([]);

    // 2. Create task without auth
    const createRes = await request(app)
      .post("/api/scheduled-tasks")
      .send({
        title: "Daily summary",
        prompt: "Summarize the day.",
        icon: "☀️",
        frequency: "daily",
        time: "09:00",
        timezone: "Asia/Kolkata",
        model: "gpt-6-astra",
        effort: "Medium",
        notifications: "Important updates",
        startInNewChat: true,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.task).toMatchObject({
      title: "Daily summary",
      prompt: "Summarize the day.",
      frequency: "daily",
      time: "09:00",
      isActive: true,
    });
    const taskId = createRes.body.task.id;

    // 3. List shows the created task
    const listAfterCreate = await request(app).get("/api/scheduled-tasks");
    expect(listAfterCreate.status).toBe(200);
    expect(listAfterCreate.body.tasks).toHaveLength(1);
    expect(listAfterCreate.body.tasks[0].id).toBe(taskId);

    // 4. Update task (toggle paused) without auth
    const updateRes = await request(app)
      .put(`/api/scheduled-tasks/${taskId}`)
      .send({
        title: "Daily summary",
        prompt: "Summarize the day.",
        icon: "☀️",
        frequency: "daily",
        time: "09:00",
        timezone: "Asia/Kolkata",
        model: "gpt-6-astra",
        effort: "Medium",
        notifications: "Important updates",
        startInNewChat: true,
        isActive: false,
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.isActive).toBe(false);

    // 5. Queue immediate manual run without auth
    const runRes = await request(app)
      .post(`/api/scheduled-tasks/${taskId}/run`)
      .set("x-provider-key", "sk-mock-key");
    expect(runRes.status).toBe(202);
    expect(runRes.body.run).toMatchObject({
      taskId,
      trigger: "manual",
      status: "queued",
    });
    const runId = runRes.body.run.id;

    // 6. Get run status without auth
    const getRunRes = await request(app).get(`/api/scheduled-tasks/runs/${runId}`);
    expect(getRunRes.status).toBe(200);
    expect(getRunRes.body.run.id).toBe(runId);

    // 7. List task runs without auth
    const listRunsRes = await request(app).get(`/api/scheduled-tasks/${taskId}/runs`);
    expect(listRunsRes.status).toBe(200);
    expect(listRunsRes.body.runs).toHaveLength(1);
    expect(listRunsRes.body.runs[0].id).toBe(runId);

    // 8. Delete task without auth
    const deleteRes = await request(app).delete(`/api/scheduled-tasks/${taskId}`);
    expect(deleteRes.status).toBe(204);

    // 9. Task is deleted
    const listAfterDelete = await request(app).get("/api/scheduled-tasks");
    expect(listAfterDelete.status).toBe(200);
    expect(listAfterDelete.body.tasks).toEqual([]);
  });
});
