import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  initSandbox,
  executeRead,
  executeWrite,
  executeBash,
  executeSendUserFile,
  resolveSandboxPath,
  SandboxSecurityError,
} from "./sandboxManager.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { seedBuiltinSkills } from "./seedBuiltinSkills.js";

function createTestSandbox() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sandbox-test-"));
  process.env["SANDBOX_BASE_DIR"] = tmpDir;

  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  seedBuiltinSkills(repo);

  const skills = repo.listVisible("user-1");
  const paths = initSandbox("conv-sandbox-1", skills);

  return {
    paths,
    repo,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    },
  };
}

test("Sandbox - initSandbox creates directories and mounts skills read-only", () => {
  const { paths, cleanup } = createTestSandbox();
  try {
    assert.ok(fs.existsSync(paths.workspaceDir));
    assert.ok(fs.existsSync(paths.skillsMountDir));
    assert.ok(fs.existsSync(paths.attachmentsDir));

    // Verify mounted skill exists
    const csvSummaryMount = path.join(paths.skillsMountDir, "builtin", "csv-summary", "SKILL.md");
    assert.ok(fs.existsSync(csvSummaryMount));
  } finally {
    cleanup();
  }
});

test("Sandbox - Write & Read tools in workspace", () => {
  const { paths, cleanup } = createTestSandbox();
  try {
    // Write
    const writeRes = executeWrite("notes/todo.txt", "1. Test sandbox\n2. Ship skills", paths);
    assert.ok(!writeRes.isError);
    assert.ok(writeRes.content.includes("Successfully wrote"));

    // Read from workspace
    const readRes = executeRead("notes/todo.txt", paths);
    assert.ok(!readRes.isError);
    assert.equal(readRes.content, "1. Test sandbox\n2. Ship skills");

    // Read from /mnt/skills/
    const readSkill = executeRead("/mnt/skills/builtin/csv-summary/SKILL.md", paths);
    assert.ok(!readSkill.isError);
    assert.ok(readSkill.content.includes("CSV Summary Instructions"));
  } finally {
    cleanup();
  }
});

test("Sandbox - Write tool rejects modifications to /mnt/skills (read-only mount)", () => {
  const { paths, cleanup } = createTestSandbox();
  try {
    const writeAttempt = executeWrite(
      "/mnt/skills/builtin/csv-summary/SKILL.md",
      "malicious edit",
      paths
    );
    assert.equal(writeAttempt.isError, true);
    assert.ok(writeAttempt.content.includes("read-only"));
  } finally {
    cleanup();
  }
});

test("Sandbox - Path traversal attempts are blocked", () => {
  const { paths, cleanup } = createTestSandbox();
  try {
    assert.throws(
      () => resolveSandboxPath("../../etc/passwd", paths),
      (err: Error) => err instanceof SandboxSecurityError
    );

    const readEscape = executeRead("../../secret.txt", paths);
    assert.equal(readEscape.isError, true);
    assert.ok(readEscape.content.includes("Error"));
  } finally {
    cleanup();
  }
});

test("Sandbox - Bash tool executes commands inside workspace and runs python script", async () => {
  const { paths, cleanup } = createTestSandbox();
  try {
    // 1. Simple bash execution
    const echoRes = await executeBash("echo 'hello from sandbox'", paths);
    assert.ok(!echoRes.isError);
    assert.equal(echoRes.content, "hello from sandbox");

    // 2. Create sample data and run csv-summary python script
    executeWrite("data.csv", "name,role,salary\nAlice,Eng,120\nBob,Design,110\n", paths);

    const scriptPath = path.join(paths.skillsMountDir, "builtin", "csv-summary", "scripts", "summarize.py");
    const pyRes = await executeBash(`python3 "${scriptPath}" data.csv`, paths);
    assert.ok(!pyRes.isError);
    assert.ok(pyRes.content.includes("Columns (3): name, role, salary"));
    assert.ok(pyRes.content.includes("Total Rows: 2"));
  } finally {
    cleanup();
  }
});

test("Sandbox - Bash tool enforces timeout limit", async () => {
  const { paths, cleanup } = createTestSandbox();
  try {
    const timeoutRes = await executeBash("sleep 3", paths, { timeoutMs: 150 });
    assert.equal(timeoutRes.isError, true);
    assert.ok(timeoutRes.content.includes("timed out"));
  } finally {
    cleanup();
  }
});

test("Sandbox - SendUserFile creates downloadable attachment", () => {
  const { paths, cleanup } = createTestSandbox();
  try {
    executeWrite("report.pdf", "%PDF-fake-content", paths);
    const sendRes = executeSendUserFile("report.pdf", "conv-sandbox-1", paths);

    assert.ok(!sendRes.isError);
    assert.ok(sendRes.attachment);
    assert.equal(sendRes.attachment?.fileName, "report.pdf");
    assert.ok(sendRes.attachment?.downloadUrl.includes("/api/conversations/conv-sandbox-1/files/report.pdf"));

    // Verify file copied to attachments directory
    const attachmentPath = path.join(paths.attachmentsDir, "report.pdf");
    assert.ok(fs.existsSync(attachmentPath));
  } finally {
    cleanup();
  }
});
