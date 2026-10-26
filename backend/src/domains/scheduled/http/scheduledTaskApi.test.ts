import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("scheduled task HTTP lifecycle validates, persists, runs safely, and deletes", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "scheduled-task-api-"));
  const originalDatabasePath = process.env["CHAT_DB_PATH"];
  process.env["CHAT_DB_PATH"] = path.join(directory, "chat.sqlite");

  let closeDatabase: (() => void) | undefined;
  let server: ReturnType<(typeof import("node:http"))["createServer"]> | undefined;
  try {
    const [{ createApp }, database] = await Promise.all([
      import("../../../app.js"),
      import("../../../platform/database/chatDatabase.js"),
    ]);
    closeDatabase = database.closeChatDatabase;
    const app = createApp();
    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}/api/scheduled-tasks`;
    const input = {
      title: "API lifecycle check",
      prompt: "Return a short status report.",
      icon: "🧪",
      frequency: "daily",
      time: "23:59",
      timezone: "UTC",
      isActive: true,
      model: "gpt-6-astra",
      effort: "Medium",
      notifications: "Failed runs only",
      startInNewChat: false,
    };

    const invalid = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, time: "25:99" }),
    });
    assert.equal(invalid.status, 400);

    const createdResponse = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    assert.equal(createdResponse.status, 201);
    const { task: created } = (await createdResponse.json()) as {
      task: { id: string; title: string; isActive: boolean; nextRunAt: number | null };
    };
    assert.equal(created.title, input.title);
    assert.equal(created.isActive, true);
    assert.ok(created.nextRunAt && created.nextRunAt > Date.now());

    const listResponse = await fetch(baseUrl);
    assert.equal(listResponse.status, 200);
    const { tasks: listed } = (await listResponse.json()) as { tasks: Array<{ id: string }> };
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.id, created.id);

    const pausedResponse = await fetch(`${baseUrl}/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, isActive: false }),
    });
    assert.equal(pausedResponse.status, 200);
    const { task: paused } = (await pausedResponse.json()) as {
      task: { isActive: boolean; nextRunAt: number | null };
    };
    assert.equal(paused.isActive, false);
    assert.equal(paused.nextRunAt, null);

    const noCredentialRun = await fetch(`${baseUrl}/${created.id}/run`, { method: "POST" });
    assert.equal(noCredentialRun.status, 401);
    assert.match((await noCredentialRun.json()).error, /Connect your OpenAI key/);

    const historyResponse = await fetch(`${baseUrl}/${created.id}/runs`);
    assert.equal(historyResponse.status, 200);
    assert.deepEqual((await historyResponse.json()).runs, []);

    const deletedResponse = await fetch(`${baseUrl}/${created.id}`, { method: "DELETE" });
    assert.equal(deletedResponse.status, 204);
    assert.deepEqual((await (await fetch(baseUrl)).json()).tasks, []);
    assert.equal((await fetch(`${baseUrl}/${created.id}`)).status, 404);
  } finally {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
    }
    closeDatabase?.();
    if (originalDatabasePath === undefined) delete process.env["CHAT_DB_PATH"];
    else process.env["CHAT_DB_PATH"] = originalDatabasePath;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
