import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import AdmZip from "adm-zip";
import type { Request, Response } from "express";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import {
  setSkillRepository,
  createSkill,
  submitForReview,
  approveSkill,
  rejectSkill,
  getAdminQueue,
} from "../http/skill.controller.js";

interface TestResponseBody {
  error: string;
  skill: {
    id: string;
    name: string;
    version: number;
    approvalStatus: string;
    rejectionReason: string;
  };
  queue: Array<{ id: string }>;
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

describe("Phase 6: Admin Approval Flow & Visibility Tests", () => {
  let db: ReturnType<typeof openChatDatabase>;
  let repo: SkillRepository;

  beforeEach(() => {
    db = openChatDatabase(":memory:");
    repo = new SkillRepository(db);
    setSkillRepository(repo);
  });

  test("Skill lifecycle: draft -> pending_review -> approved", async () => {
    // 1. Author creates a directory skill as draft
    const sampleSkillMd = `---
name: team-guidelines
description: Standard guidelines for our engineering organization.
---
# Guidelines
Follow best practices.`;

    const { res: createRes, getStatus: getCreateStatus, getBody: getCreateBody } = mockRes();
    const createReq = {
      body: {
        zipBase64: Buffer.from(
          // Minimal zip containing SKILL.md
          (() => {
            const zip = new AdmZip();
            zip.addFile("SKILL.md", Buffer.from(sampleSkillMd));
            return zip.toBuffer();
          })()
        ).toString("base64"),
        scope: "directory",
      },
      headers: {
        "x-user-id": "author-123",
        "x-org-id": "org-corp",
        "x-is-admin": "false",
      },
    } as unknown as Request;

    await createSkill(createReq, createRes);
    assert.equal(getCreateStatus(), 201);
    const skillId = getCreateBody().skill.id;
    assert.equal(getCreateBody().skill.approvalStatus, "draft");

    // 2. Author submits for review
    const { res: subRes, getStatus: getSubStatus, getBody: getSubBody } = mockRes();
    const subReq = {
      params: { id: skillId },
      body: {},
      headers: {
        "x-user-id": "author-123",
        "x-is-admin": "false",
      },
    } as unknown as Request;

    await submitForReview(subReq, subRes);
    assert.equal(getSubStatus(), 200);
    assert.equal(getSubBody().skill.approvalStatus, "pending_review");

    // 3. Admin views queue
    const { res: queueRes, getStatus: getQueueStatus, getBody: getQueueBody } = mockRes();
    const queueReq = {
      headers: {
        "x-user-id": "admin-999",
        "x-is-admin": "true",
        "x-role": "admin",
      },
    } as unknown as Request;

    await getAdminQueue(queueReq, queueRes);
    assert.equal(getQueueStatus(), 200);
    assert.ok(getQueueBody().queue.some((skill) => skill.id === skillId));

    // 4. Non-admin cannot approve
    const { res: unauthApproveRes, getStatus: getUnauthApproveStatus } = mockRes();
    const unauthApproveReq = {
      params: { id: skillId },
      headers: {
        "x-user-id": "other-user",
        "x-is-admin": "false",
      },
    } as unknown as Request;
    await approveSkill(unauthApproveReq, unauthApproveRes);
    assert.equal(getUnauthApproveStatus(), 403);

    // 5. Admin approves skill
    const { res: approveRes, getStatus: getApproveStatus, getBody: getApproveBody } = mockRes();
    const approveReq = {
      params: { id: skillId },
      headers: {
        "x-user-id": "admin-999",
        "x-is-admin": "true",
        "x-role": "admin",
      },
    } as unknown as Request;

    await approveSkill(approveReq, approveRes);
    assert.equal(getApproveStatus(), 200);
    assert.equal(getApproveBody().skill.approvalStatus, "approved");
  });

  test("Skill lifecycle: draft -> pending_review -> rejected with reason", async () => {
    const created = await repo.create({
      name: "unsafe-skill",
      description: "Tries suspicious things without justification.",
      scope: "directory",
      ownerId: "author-attacker",
      storagePath: "/tmp/fake",
      version: 1,
      approvalStatus: "draft",
    });

    // Author submits
    const { res: subRes, getStatus: getSubStatus } = mockRes();
    await submitForReview(
      {
        params: { id: created.id },
        body: {},
        headers: { "x-user-id": "author-attacker", "x-is-admin": "false" },
      } as unknown as Request,
      subRes
    );
    assert.equal(getSubStatus(), 200);

    // Admin rejects with reason
    const { res: rejRes, getStatus: getRejStatus, getBody: getRejBody } = mockRes();
    await rejectSkill(
      {
        params: { id: created.id },
        body: { reason: "Security violation: missing documentation on scripts." },
        headers: { "x-user-id": "admin-999", "x-is-admin": "true", "x-role": "admin" },
      } as unknown as Request,
      rejRes
    );
    assert.equal(getRejStatus(), 200);
    assert.equal(getRejBody().skill.approvalStatus, "rejected");
    assert.equal(
      getRejBody().skill.rejectionReason,
      "Security violation: missing documentation on scripts."
    );
  });

  test("Visibility rules: author always sees their own skills; others only see approved skills", async () => {
    const authorId = "author-dev";
    const otherUserId = "other-reader";

    // 1. Author's draft skill
    const draftSkill = await repo.create({
      name: "private-draft",
      description: "Still in progress",
      scope: "directory",
      ownerId: authorId,
      storagePath: "/tmp/draft",
      version: 1,
      approvalStatus: "draft",
    });

    // 2. Author's rejected skill
    const rejectedSkill = await repo.create({
      name: "rejected-one",
      description: "Needs revision",
      scope: "directory",
      ownerId: authorId,
      storagePath: "/tmp/rejected",
      version: 1,
      approvalStatus: "rejected",
      rejectionReason: "Too vague",
    });

    // 3. Approved directory skill
    const approvedSkill = await repo.create({
      name: "approved-prod",
      description: "Ready for company use",
      scope: "directory",
      ownerId: authorId,
      storagePath: "/tmp/approved",
      version: 1,
      approvalStatus: "approved",
    });

    // Check author's visible skills
    const authorVisible = await repo.listVisible(authorId);
    const authorIds = authorVisible.map((s) => s.id);
    assert.ok(authorIds.includes(draftSkill.id), "Author must see their own draft skill");
    assert.ok(authorIds.includes(rejectedSkill.id), "Author must see their own rejected skill");
    assert.ok(authorIds.includes(approvedSkill.id), "Author must see their own approved skill");

    // Check other user's visible skills
    const otherVisible = await repo.listVisible(otherUserId);
    const otherIds = otherVisible.map((s) => s.id);
    assert.ok(!otherIds.includes(draftSkill.id), "Other user must NOT see draft skill");
    assert.ok(!otherIds.includes(rejectedSkill.id), "Other user must NOT see rejected skill");
    assert.ok(otherIds.includes(approvedSkill.id), "Other user MUST see approved skill");
  });
});
