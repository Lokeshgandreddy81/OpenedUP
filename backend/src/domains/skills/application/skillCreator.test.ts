import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { validateSkillDraft, evaluateDescriptionQuality } from "./skillValidator.js";
import { setSkillRepository, createSkill, testScratchSkill } from "../http/skill.controller.js";

interface TestResponseBody {
  error: string;
  success: boolean;
  skill: {
    id: string;
    name: string;
    version: number;
    approvalStatus: string;
    files: Array<{ relativePath: string; content?: string }>;
  };
  toolTraces: Array<{ toolName: string; output: string }>;
}

function mockRes() {
  let statusCode = 200;
  let responseBody = {} as TestResponseBody;
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(body: TestResponseBody) {
      responseBody = body;
      return res;
    },
  } as unknown as Response;
  return {
    res,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

describe("Phase 8: Skill Creator Backend & Validation Tests", () => {
  let db: ReturnType<typeof openChatDatabase>;
  let repo: SkillRepository;

  beforeEach(() => {
    db = openChatDatabase(":memory:");
    repo = new SkillRepository(db);
    setSkillRepository(repo);
  });

  test("1. Description quality evaluation detects vague descriptions vs good triggers", () => {
    // Vague / short description
    const vagueQuality = evaluateDescriptionQuality("A helper skill.");
    assert.equal(vagueQuality.score, "poor");
    assert.ok(vagueQuality.suggestions.some((s) => s.includes("under 40 characters")));
    assert.ok(vagueQuality.suggestions.some((s) => s.includes("trigger phrasing")));

    // High quality description with triggers and sufficient length
    const goodQuality = evaluateDescriptionQuality(
      "Use this skill when the user asks to analyze, visualize, or summarize CSV and tabular datasets."
    );
    assert.equal(goodQuality.score, "good");
    assert.equal(goodQuality.suggestions.length, 0);
  });

  test("2. validateSkillDraft catches name errors, invalid frontmatter, and file traversals", () => {
    // Bad name
    const badNameRes = validateSkillDraft({
      name: "Bad_Name_With_Caps!",
      description: "Use this skill when processing log data in JSON format.",
      skillMd: "---\nname: bad\ndescription: bad\n---\nBody",
    });
    assert.equal(badNameRes.valid, false);
    assert.ok(badNameRes.errors.some((e) => e.includes("lowercase alphanumeric")));

    // Missing frontmatter
    const missingFmRes = validateSkillDraft({
      name: "valid-name",
      description: "Use this skill when formatting markdown documentation.",
      skillMd: "Just raw text without yaml frontmatter",
    });
    assert.equal(missingFmRes.valid, false);
    assert.ok(missingFmRes.errors.some((e) => e.includes("frontmatter")));

    // Path traversal in extra files
    const traversalRes = validateSkillDraft({
      name: "traversal-test",
      description: "Use this skill when testing security boundaries.",
      skillMd: "---\nname: traversal-test\ndescription: desc\n---\nBody",
      files: [{ relativePath: "../outside.txt", content: "malicious" }],
    });
    assert.equal(traversalRes.valid, false);
    assert.ok(traversalRes.errors.some((e) => e.includes("Path traversal")));
  });

  test("3. createSkill creates package directly from raw JSON draft (no zip required)", async () => {
    const { res, getStatus, getBody } = mockRes();
    const req = {
      body: {
        name: "json-draft-skill",
        description: "Use this skill when transforming JSON payloads to YAML.",
        skillMd: `---
name: json-draft-skill
description: Use this skill when transforming JSON payloads to YAML.
categories:
  - Data
  - Formatting
---
# Instructions
Transform data accurately.`,
        files: [
          {
            relativePath: "scripts/transform.py",
            content: "print('transformed')",
          },
        ],
        scope: "user",
        approvalStatus: "draft",
      },
      headers: {
        "x-user-id": "creator-user-1",
        "x-is-admin": "false",
      },
    } as unknown as Request;

    await createSkill(req, res);
    assert.equal(getStatus(), 201);
    const created = getBody().skill;
    assert.equal(created.name, "json-draft-skill");
    assert.equal(created.approvalStatus, "draft");
    assert.equal(created.files.length, 2); // SKILL.md + scripts/transform.py
  });

  test("4. testScratchSkill mounts draft in scratch sandbox and executes trace", async () => {
    const { res, getStatus, getBody } = mockRes();
    const req = {
      body: {
        prompt: "Summarize this test input",
        draft: {
          name: "scratch-test-skill",
          description: "Use this skill when running scratch diagnostic checks.",
          skillMd: `---
name: scratch-test-skill
description: Use this skill when running scratch diagnostic checks.
---
# Diagnostic Instructions
Run python diagnostics.`,
          files: [
            {
              relativePath: "scripts/run.py",
              content: "print('Diagnostic check: SUCCESS')",
            },
          ],
        },
      },
      headers: {
        "x-user-id": "tester-user",
        "x-is-admin": "false",
      },
    } as unknown as Request;

    await testScratchSkill(req, res);
    assert.equal(getStatus(), 200);
    const body = getBody();
    assert.equal(body.success, true);
    assert.ok(body.toolTraces.length >= 2); // Skill load + Bash execution
    assert.equal(body.toolTraces[0]!.toolName, "Skill");
    assert.equal(body.toolTraces[1]!.toolName, "Bash");
    assert.ok(body.toolTraces[1]!.output.includes("Diagnostic check: SUCCESS"));
  });
});
