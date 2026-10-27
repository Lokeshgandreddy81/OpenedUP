import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  initSandbox,
  executeBash,
  executeWrite,
  executeRead,
  cleanupSandbox,
  cleanupOldSandboxes,
} from "./sandboxManager.js";
import { UnsafeLocalSandboxExecutor } from "./sandboxExecutor.js";
import type { SkillRecord } from "../repositories/skillRepository.js";

describe("Phase 1: Sandbox Hardening & Adversarial Testing", () => {
  const testBaseDir = path.join(os.tmpdir(), `sandbox-adv-test-${Date.now()}`);
  const origSandboxBase = process.env["SANDBOX_BASE_DIR"];
  const origSandboxMode = process.env["SANDBOX_MODE"];
  const origNodeEnv = process.env["NODE_ENV"];

  before(() => {
    process.env["SANDBOX_BASE_DIR"] = testBaseDir;
    process.env["SANDBOX_MODE"] = "unsafe-local";
    process.env["NODE_ENV"] = "test";
  });

  after(() => {
    process.env["SANDBOX_BASE_DIR"] = origSandboxBase;
    process.env["SANDBOX_MODE"] = origSandboxMode;
    process.env["NODE_ENV"] = origNodeEnv;
    if (fs.existsSync(testBaseDir)) {
      fs.rmSync(testBaseDir, { recursive: true, force: true });
    }
  });

  const dummySkill: SkillRecord = {
    id: "skill-adv-1",
    name: "adv-skill",
    description: "adversarial test skill",
    scope: "builtin",
    version: 1,
    ownerId: null,
    orgId: null,
    storagePath: "",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  test("UnsafeLocalSandboxExecutor strictly throws when SANDBOX_MODE !== 'unsafe-local'", () => {
    const prevMode = process.env["SANDBOX_MODE"];
    try {
      process.env["SANDBOX_MODE"] = "normal";
      assert.throws(
        () => new UnsafeLocalSandboxExecutor(),
        /CRITICAL SECURITY ERROR: UnsafeLocalSandboxExecutor is prohibited/
      );
    } finally {
      process.env["SANDBOX_MODE"] = prevMode;
    }
  });

  test("Adversarial: cat /etc/passwd is strictly blocked", async () => {
    const convId = "conv-adv-passwd";
    const sandbox = initSandbox(convId, [dummySkill]);
    const res = await executeBash("cat /etc/passwd", sandbox);
    assert.equal(res.isError, true);
    assert.match(res.content, /Security Policy Violation/);
    cleanupSandbox(convId);
  });

  test("Adversarial: env stripping ensures sandbox cannot see host secrets or API keys", async () => {
    const convId = "conv-adv-env";
    const sandbox = initSandbox(convId, [dummySkill]);

    // Set a fake secret in the host process.env
    process.env["SUPER_SECRET_HOST_KEY"] = "super-sensitive-12345";

    const res = await executeBash("env", sandbox);
    // Even if env runs, it must NOT contain host secret
    assert.doesNotMatch(res.content, /super-sensitive-12345/);
    assert.doesNotMatch(res.content, /SUPER_SECRET_HOST_KEY/);

    delete process.env["SUPER_SECRET_HOST_KEY"];
    cleanupSandbox(convId);
  });

  test("Adversarial: reading host app's .env file is strictly blocked", async () => {
    const convId = "conv-adv-dotenv";
    const sandbox = initSandbox(convId, [dummySkill]);
    const res = await executeBash("cat ../../.env", sandbox);
    assert.equal(res.isError, true);
    assert.match(res.content, /Security Policy Violation/);
    cleanupSandbox(convId);
  });

  test("Adversarial: curl https://example.com is strictly blocked", async () => {
    const convId = "conv-adv-curl";
    const sandbox = initSandbox(convId, [dummySkill]);
    const res = await executeBash("curl https://example.com", sandbox);
    assert.equal(res.isError, true);
    assert.match(res.content, /Security Policy Violation/);
    cleanupSandbox(convId);
  });

  test("Adversarial: writing into /mnt/skills is rejected (read-only mount)", async () => {
    const convId = "conv-adv-mnt";
    const sandbox = initSandbox(convId, [dummySkill]);

    // via Write tool
    const writeRes = executeWrite("/mnt/skills/builtin/adv-skill/hacked.txt", "evil", sandbox);
    assert.equal(writeRes.isError, true);
    assert.match(writeRes.content, /read-only/i);

    // via Bash tool
    const bashRes = await executeBash("touch /mnt/skills/evil.txt", sandbox);
    assert.equal(bashRes.isError, true);

    cleanupSandbox(convId);
  });

  test("Adversarial: infinite loop times out cleanly and kills process tree without hanging host", async () => {
    const convId = "conv-adv-infloop";
    const sandbox = initSandbox(convId, [dummySkill]);

    const start = Date.now();
    // 200ms timeout
    const res = await executeBash("while true; do :; done", sandbox, { timeoutMs: 200 });
    const elapsed = Date.now() - start;

    assert.equal(res.isError, true);
    assert.match(res.content, /timed out/i);
    assert.ok(elapsed < 2000, `Execution took ${elapsed}ms, should time out promptly`);

    cleanupSandbox(convId);
  });

  test("Adversarial: fork bomb attempt times out and is terminated promptly", async () => {
    const convId = "conv-adv-fork";
    const sandbox = initSandbox(convId, [dummySkill]);

    // Short timeout for test safety
    const res = await executeBash(":(){ :|:& };:", sandbox, { timeoutMs: 300 });
    assert.equal(res.isError, true);

    cleanupSandbox(convId);
  });

  test("Adversarial: cross-conversation snooping is blocked", async () => {
    const victimConvId = "conv-victim";
    const attackerConvId = "conv-attacker";

    const victimSandbox = initSandbox(victimConvId, [dummySkill]);
    executeWrite("secret_journal.txt", "confidential user journal entries", victimSandbox);

    const attackerSandbox = initSandbox(attackerConvId, [dummySkill]);

    // Attempt 1: Path traversal via Read tool
    const readAttempt = executeRead(
      `../../${victimConvId}/workspace/secret_journal.txt`,
      attackerSandbox
    );
    assert.equal(readAttempt.isError, true);
    assert.match(readAttempt.content, /Path traversal escape/i);

    // Attempt 2: Bash relative traversal
    const bashAttempt = await executeBash(
      `cat ../../${victimConvId}/workspace/secret_journal.txt`,
      attackerSandbox
    );
    assert.equal(bashAttempt.isError, true);
    assert.doesNotMatch(bashAttempt.content, /confidential user journal entries/);

    cleanupSandbox(victimConvId);
    cleanupSandbox(attackerConvId);
  });

  test("Adversarial: symlink escape is blocked from reading outside sandbox", async () => {
    const convId = "conv-adv-symlink";
    const sandbox = initSandbox(convId, [dummySkill]);

    // Create a symlink pointing to /etc inside the workspace
    const symlinkPath = path.join(sandbox.workspaceDir, "etc_link");
    try {
      fs.symlinkSync("/etc", symlinkPath, "dir");
    } catch {
      // ignore if symlink creation not permitted on system
    }

    if (fs.existsSync(symlinkPath)) {
      const readRes = executeRead("etc_link/passwd", sandbox);
      // Must either fail, be blocked, or be rejected by policy
      if (!readRes.isError) {
        assert.doesNotMatch(readRes.content, /root:.*:0:0:/);
      }
    }

    cleanupSandbox(convId);
  });

  test("Cleanup: cleanupSandbox and cleanupOldSandboxes TTL janitor removes expired directories", () => {
    const convId1 = "conv-ttl-old";
    const convId2 = "conv-ttl-new";

    const oldSandbox = initSandbox(convId1);
    const newSandbox = initSandbox(convId2);

    assert.ok(fs.existsSync(oldSandbox.baseDir));
    assert.ok(fs.existsSync(newSandbox.baseDir));

    // Manually backdate the mtime on old sandbox
    const pastTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
    fs.utimesSync(oldSandbox.baseDir, pastTime, pastTime);

    // Run janitor with 24hr TTL
    const cleaned = cleanupOldSandboxes(24 * 60 * 60 * 1000);
    assert.ok(cleaned >= 1, "Must clean at least one expired sandbox");
    assert.equal(fs.existsSync(oldSandbox.baseDir), false, "Old sandbox must be deleted");
    assert.equal(fs.existsSync(newSandbox.baseDir), true, "New sandbox must still exist");

    cleanupSandbox(convId2);
  });
});
