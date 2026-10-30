import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import AdmZip from "adm-zip";
import type { Request, Response } from "express";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import { seedBuiltinSkills } from "../application/seedBuiltinSkills.js";
import {
  listSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  getConversationSkills,
  syncConversationProjectSkills,
  setConversationSkills,
  getProjectSkills,
  setProjectSkills,
  downloadConversationFile,
  setSkillRepository,
} from "./skill.controller.js";

interface TestResponseBody {
  error: string;
  skills: Array<{ id: string; name: string }>;
  skill: {
    id: string;
    name: string;
    version: number;
    ownerId: string;
    files: Array<{ relativePath: string }>;
  };
}

function mockRes() {
  let statusCode = 200;
  let body = {} as TestResponseBody;
  const headers: Record<string, string> = {};

  const res: Partial<Response> = {
    status(code: number) {
      statusCode = code;
      return res as Response;
    },
    json(data: TestResponseBody) {
      body = data;
      return res as Response;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res as Response;
    },
    end() {
      return res as Response;
    },
  };

  return {
    res: res as Response,
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

function createSampleZip(name: string, description: string): Buffer {
  const zip = new AdmZip();
  zip.addFile(
    "SKILL.md",
    Buffer.from(`---
name: ${name}
description: ${description}
---
# Instructions
Do work.`)
  );
  return zip.toBuffer();
}

test("Skill Registry API - listSkills returns seeded builtin skills and filters", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);
  await seedBuiltinSkills(repo);

  const { res, getStatus, getBody } = mockRes();
  const req = {
    principal: { uid: "user-123" },
    query: {},
    headers: {},
  } as unknown as Request;

  await listSkills(req, res);
  assert.equal(getStatus(), 200);
  const skills = getBody().skills;
  assert.ok(Array.isArray(skills));
  assert.ok(skills.some((skill) => skill.name === "hello-format"));
  assert.ok(skills.some((skill) => skill.name === "csv-summary"));

  // Query filter
  const { res: resQuery, getBody: getQueryBody } = mockRes();
  const reqQuery = {
    principal: { uid: "user-123" },
    query: { q: "csv" },
    headers: {},
  } as unknown as Request;

  await listSkills(reqQuery, resQuery);
  const filtered = getQueryBody().skills;
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]!.name, "csv-summary");
});

test("Skill Registry API - getSkill returns metadata with file tree", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);
  await seedBuiltinSkills(repo);

  const builtin = await repo.getByNameAndScope("csv-summary", "builtin");
  assert.ok(builtin);

  const { res, getStatus, getBody } = mockRes();
  const req = {
    principal: { uid: "user-1" },
    params: { id: builtin.id },
    headers: {},
  } as unknown as Request;

  await getSkill(req, res);
  assert.equal(getStatus(), 200);
  const skill = getBody().skill;
  assert.equal(skill.name, "csv-summary");
  assert.ok(Array.isArray(skill.files));
  assert.ok(skill.files.some((file) => file.relativePath === "SKILL.md"));
  assert.ok(skill.files.some((file) => file.relativePath === "scripts/summarize.py"));
});

test("Skill Registry API - createSkill, updateSkill (versioning), deleteSkill with permissions", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  // 1. Create user skill
  const zip1 = createSampleZip("custom-user-skill", "User skill description for tests.");
  const { res: resCreate, getStatus: getCreateStatus, getBody: getCreateBody } = mockRes();
  const reqCreate = {
    principal: { uid: "user-alice" },
    body: { zipBase64: zip1.toString("base64"), scope: "user" },
    headers: {},
  } as unknown as Request;

  await createSkill(reqCreate, resCreate);
  assert.equal(getCreateStatus(), 201);
  const created = getCreateBody().skill;
  assert.equal(created.name, "custom-user-skill");
  assert.equal(created.version, 1);
  assert.equal(created.ownerId, "user-alice");

  // 2. Unauthorized update attempt by user-bob
  const zip2 = createSampleZip("custom-user-skill", "Updated by bob.");
  const { res: resBob, getStatus: getBobStatus } = mockRes();
  const reqBob = {
    principal: { uid: "user-bob" },
    params: { id: created.id },
    body: { zipBase64: zip2.toString("base64") },
    headers: {},
  } as unknown as Request;

  await updateSkill(reqBob, resBob);
  assert.equal(getBobStatus(), 403);

  // 3. Authorized update by user-alice -> bumps version to 2
  const { res: resUpdate, getStatus: getUpdateStatus, getBody: getUpdateBody } = mockRes();
  const reqUpdate = {
    principal: { uid: "user-alice" },
    params: { id: created.id },
    body: { zipBase64: zip2.toString("base64") },
    headers: {},
  } as unknown as Request;

  await updateSkill(reqUpdate, resUpdate);
  assert.equal(getUpdateStatus(), 200);
  assert.equal(getUpdateBody().skill.version, 2);

  // 4. Unauthorized delete attempt by user-bob
  const { res: resBobDel, getStatus: getBobDelStatus } = mockRes();
  const reqBobDel = {
    principal: { uid: "user-bob" },
    params: { id: created.id },
    headers: {},
  } as unknown as Request;
  await deleteSkill(reqBobDel, resBobDel);
  assert.equal(getBobDelStatus(), 403);

  // 5. Authorized delete by user-alice
  const { res: resDel, getStatus: getDelStatus } = mockRes();
  const reqDel = {
    principal: { uid: "user-alice" },
    params: { id: created.id },
    headers: {},
  } as unknown as Request;
  await deleteSkill(reqDel, resDel);
  assert.equal(getDelStatus(), 204);
  assert.equal(await repo.get(created.id), null);
});

test("Skill Registry API - Conversation skills permissions guard (cannot enable private skill of other user)", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  // User Alice's private skill
  const aliceSkill = await repo.create({
    name: "alice-secret",
    description: "Alice private skill",
    scope: "user",
    ownerId: "user-alice",
    storagePath: "/tmp/alice",
  });

  const bobNow = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-bob-1", "user-bob", "Bob Chat", "gemini-3.8-flash", bobNow, bobNow);

  // User Bob attempts to enable Alice's private skill in Bob's conversation
  const { res: resBob, getStatus: getBobStatus, getBody: getBobBody } = mockRes();
  const reqBob = {
    principal: { uid: "user-bob" },
    params: { id: "conv-bob-1" },
    body: { skill_ids: [aliceSkill.id] },
    headers: {},
  } as unknown as Request;

  await setConversationSkills(reqBob, resBob);
  assert.equal(getBobStatus(), 403);
  assert.ok(getBobBody().error.includes("access denied"));

  // Alice enables her own skill -> 200
  // Insert conversation first
  const now = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-alice-1", "user-alice", "Alice Chat", "gemini-3.8-flash", now, now);

  const { res: resAlice, getStatus: getAliceStatus, getBody: getAliceBody } = mockRes();
  const reqAlice = {
    principal: { uid: "user-alice" },
    params: { id: "conv-alice-1" },
    body: { skill_ids: [aliceSkill.id] },
    headers: {},
  } as unknown as Request;

  await setConversationSkills(reqAlice, resAlice);
  assert.equal(getAliceStatus(), 200);
  assert.equal(getAliceBody().skills.length, 1);
  assert.equal(getAliceBody().skills[0]!.name, "alice-secret");
});

test("Skill conversation and project endpoints enforce resource ownership", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  const skill = await repo.create({
    name: "alice-project-skill",
    description: "Skill attached to Alice's project and conversation.",
    scope: "user",
    ownerId: "user-alice",
    storagePath: "/tmp/alice-project-skill",
  });
  const now = Date.now();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-alice-private", "user-alice", "Alice Chat", "default", now, now);
  db.prepare(
    `INSERT INTO project_snapshots (user_id, project_id, payload_json, updated_at)
     VALUES (?, ?, ?, ?)`
  ).run(
    "user-alice",
    "project-alice-private",
    JSON.stringify({ id: "project-alice-private" }),
    now
  );
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("conv-bob-private", "user-bob", "Bob Chat", "default", now, now);
  db.prepare(
    `INSERT INTO project_snapshots (user_id, project_id, payload_json, updated_at)
     VALUES (?, ?, ?, ?)`
  ).run("user-bob", "project-alice-private", JSON.stringify({ id: "project-alice-private" }), now);
  await repo.setConversationSkills("conv-alice-private", [skill.id], "user-alice");
  await repo.setProjectSkills("user-alice", "project-alice-private", [skill.id]);

  const reqFor = (
    uid: string,
    params: Record<string, string>,
    body: object = {},
    query = {},
    orgId?: string
  ) =>
    ({
      principal: { uid, ...(orgId ? { orgId } : {}) },
      params,
      body,
      query,
      headers: orgId ? { "x-org-id": orgId } : {},
    }) as unknown as Request;

  const conversationRead = mockRes();
  await getConversationSkills(
    reqFor("user-bob", { id: "conv-alice-private" }),
    conversationRead.res
  );
  assert.equal(conversationRead.getStatus(), 404);

  const conversationWrite = mockRes();
  await setConversationSkills(
    reqFor("user-bob", { id: "conv-alice-private" }, { skill_ids: [] }),
    conversationWrite.res
  );
  assert.equal(conversationWrite.getStatus(), 404);
  assert.deepEqual(
    (await repo.getConversationSkills("conv-alice-private", "user-alice")).map((item) => item.id),
    [skill.id]
  );

  const projectRead = mockRes();
  await getProjectSkills(reqFor("user-bob", { id: "project-alice-private" }), projectRead.res);
  assert.equal(projectRead.getStatus(), 200);
  assert.deepEqual((projectRead.getBody() as { skills: unknown[] }).skills, []);

  const projectWrite = mockRes();
  await setProjectSkills(
    reqFor("user-bob", { id: "project-alice-private" }, { skill_ids: [] }),
    projectWrite.res
  );
  assert.equal(projectWrite.getStatus(), 200);
  assert.deepEqual((projectWrite.getBody() as { skills: unknown[] }).skills, []);
  assert.deepEqual(
    (await repo.getProjectSkills("user-alice", "project-alice-private")).map((item) => item.id),
    [skill.id]
  );

  const projectSync = mockRes();
  await syncConversationProjectSkills(
    reqFor("user-bob", { id: "conv-alice-private" }, { projectId: "project-alice-private" }),
    projectSync.res
  );
  assert.equal(projectSync.getStatus(), 404);
  assert.deepEqual(
    (await repo.getConversationSkills("conv-alice-private", "user-alice")).map((item) => item.id),
    [skill.id]
  );

  const ownerRead = mockRes();
  await getConversationSkills(reqFor("user-alice", { id: "conv-alice-private" }), ownerRead.res);
  assert.equal(ownerRead.getStatus(), 200);

  const foreignProjectRead = mockRes();
  await getConversationSkills(
    reqFor("user-alice", { id: "conv-alice-private" }, {}, { projectId: "project-bob-private" }),
    foreignProjectRead.res
  );
  assert.equal(foreignProjectRead.getStatus(), 404);

  const ownerProjectRead = mockRes();
  await getProjectSkills(
    reqFor("user-alice", { id: "project-alice-private" }),
    ownerProjectRead.res
  );
  assert.equal(ownerProjectRead.getStatus(), 200);

  const collidingProjectRead = mockRes();
  await getProjectSkills(
    reqFor("user-bob", { id: "project-alice-private" }),
    collidingProjectRead.res
  );
  assert.equal(collidingProjectRead.getStatus(), 200);
  assert.deepEqual((collidingProjectRead.getBody() as { skills: unknown[] }).skills, []);

  const collidingProjectSync = mockRes();
  await syncConversationProjectSkills(
    reqFor("user-bob", { id: "conv-bob-private" }, { projectId: "project-alice-private" }),
    collidingProjectSync.res
  );
  assert.equal(collidingProjectSync.getStatus(), 200);
  assert.deepEqual((collidingProjectSync.getBody() as { skills: unknown[] }).skills, []);
});

test("conversation and project links stop exposing organization skills after access is revoked", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);
  const reqFor = (uid: string, params: Record<string, string>, body: object = {}, orgId?: string) =>
    ({
      principal: { uid, ...(orgId ? { orgId } : {}) },
      params,
      body,
      query: {},
      headers: orgId ? { "x-org-id": orgId } : {},
    }) as unknown as Request;

  try {
    const orgSkill = await repo.create({
      id: "revoked-org-skill",
      name: "Former org skill",
      description: "Private organization instructions",
      scope: "org",
      ownerId: "org-admin",
      orgId: "old-org",
      storagePath: "",
    });
    const now = Date.now();
    db.prepare(
      `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("revoked-org-conversation", "former-member", "Old Chat", "default", now, now);
    db.prepare(
      `INSERT INTO project_snapshots (user_id, project_id, payload_json, updated_at)
       VALUES (?, ?, ?, ?)`
    ).run(
      "former-member",
      "revoked-org-project",
      JSON.stringify({ id: "revoked-org-project" }),
      now
    );
    await repo.setConversationSkills("revoked-org-conversation", [orgSkill.id], "former-member", {
      orgId: "old-org",
    });
    await repo.setProjectSkills("former-member", "revoked-org-project", [orgSkill.id], "old-org");

    const memberConversation = mockRes();
    await getConversationSkills(
      reqFor("former-member", { id: "revoked-org-conversation" }, {}, "old-org"),
      memberConversation.res
    );
    assert.deepEqual(
      (memberConversation.getBody() as { skills: Array<{ id: string }> }).skills.map(
        ({ id }) => id
      ),
      [orgSkill.id]
    );

    const memberProject = mockRes();
    await getProjectSkills(
      reqFor("former-member", { id: "revoked-org-project" }, {}, "old-org"),
      memberProject.res
    );
    assert.deepEqual(
      (memberProject.getBody() as { skills: Array<{ id: string }> }).skills.map(({ id }) => id),
      [orgSkill.id]
    );

    const revokedConversation = mockRes();
    await getConversationSkills(
      reqFor("former-member", { id: "revoked-org-conversation" }),
      revokedConversation.res
    );
    assert.deepEqual((revokedConversation.getBody() as { skills: unknown[] }).skills, []);

    const revokedProject = mockRes();
    await getProjectSkills(
      reqFor("former-member", { id: "revoked-org-project" }),
      revokedProject.res
    );
    assert.deepEqual((revokedProject.getBody() as { skills: unknown[] }).skills, []);

    const syncAfterRevocation = mockRes();
    await syncConversationProjectSkills(
      reqFor(
        "former-member",
        { id: "revoked-org-conversation" },
        { projectId: "revoked-org-project" }
      ),
      syncAfterRevocation.res
    );
    assert.deepEqual((syncAfterRevocation.getBody() as { skills: unknown[] }).skills, []);
    assert.deepEqual(
      (await repo.getConversationSkills("revoked-org-conversation", "former-member")).map(
        ({ id }) => id
      ),
      []
    );
  } finally {
    db.close();
    setSkillRepository(null);
  }
});

test("conversation file downloads require ownership of the conversation", async () => {
  const previousSandboxBase = process.env["SANDBOX_BASE_DIR"];
  const sandboxBase = fs.mkdtempSync(path.join(os.tmpdir(), "openedup-file-ownership-"));
  process.env["SANDBOX_BASE_DIR"] = sandboxBase;
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  try {
    const now = Date.now();
    db.prepare(
      `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("conv-file-owner", "file-owner", "Owner Chat", "default", now, now);

    const filePath = path.join(sandboxBase, "conv-file-owner", "attachments", "report.txt");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "private attachment");

    const requestFor = (uid: string) =>
      ({
        principal: { uid },
        params: { id: "conv-file-owner", filename: "report.txt" },
        headers: {},
      }) as unknown as Request;
    const responseFor = () => {
      let statusCode = 200;
      let downloadedPath: string | undefined;
      const response = {
        status(code: number) {
          statusCode = code;
          return response;
        },
        json() {
          return response;
        },
        download(target: string) {
          downloadedPath = target;
          return response;
        },
      } as unknown as Response;
      return {
        response,
        status: () => statusCode,
        downloadedPath: () => downloadedPath,
      };
    };

    const foreignResponse = responseFor();
    await downloadConversationFile(requestFor("another-user"), foreignResponse.response);
    assert.equal(foreignResponse.status(), 404);
    assert.equal(foreignResponse.downloadedPath(), undefined);

    const ownerResponse = responseFor();
    await downloadConversationFile(requestFor("file-owner"), ownerResponse.response);
    assert.equal(ownerResponse.status(), 200);
    assert.equal(ownerResponse.downloadedPath(), filePath);
  } finally {
    db.close();
    setSkillRepository(null);
    if (previousSandboxBase === undefined) delete process.env["SANDBOX_BASE_DIR"];
    else process.env["SANDBOX_BASE_DIR"] = previousSandboxBase;
    fs.rmSync(sandboxBase, { recursive: true, force: true });
  }
});
