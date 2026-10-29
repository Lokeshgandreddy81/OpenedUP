import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("production scheduled task routes require a verified signed-in user", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "scheduled-task-auth-"));
  const originalDatabasePath = process.env["CHAT_DB_PATH"];
  const originalNodeEnv = process.env["NODE_ENV"];
  const originalDatabaseUrl = process.env["DATABASE_URL"];
  process.env["CHAT_DB_PATH"] = path.join(directory, "chat.sqlite");
  process.env["NODE_ENV"] = "production";
  process.env["DATABASE_URL"] = "postgres://test:test@127.0.0.1:5432/test";

  let server: ReturnType<(typeof import("node:http"))["createServer"]> | undefined;
  try {
    const [{ createApp }, { closeChatDatabase }] = await Promise.all([
      import("../../../app.js"),
      import("../../../platform/database/chatDatabase.js"),
    ]);
    const app = createApp();
    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");

    const endpoint = `http://127.0.0.1:${address.port}/api/scheduled-tasks`;
    const anonymousResponse = await fetch(endpoint);
    assert.equal(anonymousResponse.status, 401);
    assert.equal((await anonymousResponse.json()).error, "Sign in to access this resource.");

    const invalidTokenResponse = await fetch(endpoint, {
      headers: { Authorization: "Bearer invalid-session-token" },
    });

    assert.equal(invalidTokenResponse.status, 401);
    assert.equal(
      (await invalidTokenResponse.json()).error,
      "Your sign-in has expired or your email is not verified. Please sign in again."
    );
    closeChatDatabase();
  } finally {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
    }
    if (originalDatabasePath === undefined) delete process.env["CHAT_DB_PATH"];
    else process.env["CHAT_DB_PATH"] = originalDatabasePath;
    if (originalNodeEnv === undefined) delete process.env["NODE_ENV"];
    else process.env["NODE_ENV"] = originalNodeEnv;
    if (originalDatabaseUrl === undefined) delete process.env["DATABASE_URL"];
    else process.env["DATABASE_URL"] = originalDatabaseUrl;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
