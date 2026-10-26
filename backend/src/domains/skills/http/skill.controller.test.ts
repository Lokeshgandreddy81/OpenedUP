import assert from "node:assert/strict";
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
  setConversationSkills,
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

test("Skill Registry API - listSkills returns seeded builtin skills and filters", () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);
  seedBuiltinSkills(repo);

  const { res, getStatus, getBody } = mockRes();
  const req = {
    principal: { uid: "user-123" },
    query: {},
    headers: {},
  } as unknown as Request;

  listSkills(req, res);
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

  listSkills(reqQuery, resQuery);
  const filtered = getQueryBody().skills;
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]!.name, "csv-summary");
});

test("Skill Registry API - getSkill returns metadata with file tree", () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);
  seedBuiltinSkills(repo);

  const builtin = repo.getByNameAndScope("csv-summary", "builtin");
  assert.ok(builtin);

  const { res, getStatus, getBody } = mockRes();
  const req = {
    principal: { uid: "user-1" },
    params: { id: builtin.id },
    headers: {},
  } as unknown as Request;

  getSkill(req, res);
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
  deleteSkill(reqBobDel, resBobDel);
  assert.equal(getBobDelStatus(), 403);

  // 5. Authorized delete by user-alice
  const { res: resDel, getStatus: getDelStatus } = mockRes();
  const reqDel = {
    principal: { uid: "user-alice" },
    params: { id: created.id },
    headers: {},
  } as unknown as Request;
  deleteSkill(reqDel, resDel);
  assert.equal(getDelStatus(), 204);
  assert.equal(repo.get(created.id), null);
});

test("Skill Registry API - Conversation skills permissions guard (cannot enable private skill of other user)", () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  // User Alice's private skill
  const aliceSkill = repo.create({
    name: "alice-secret",
    description: "Alice private skill",
    scope: "user",
    ownerId: "user-alice",
    storagePath: "/tmp/alice",
  });

  // User Bob attempts to enable Alice's private skill in Bob's conversation
  const { res: resBob, getStatus: getBobStatus, getBody: getBobBody } = mockRes();
  const reqBob = {
    principal: { uid: "user-bob" },
    params: { id: "conv-bob-1" },
    body: { skill_ids: [aliceSkill.id] },
    headers: {},
  } as unknown as Request;

  setConversationSkills(reqBob, resBob);
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

  setConversationSkills(reqAlice, resAlice);
  assert.equal(getAliceStatus(), 200);
  assert.equal(getAliceBody().skills.length, 1);
  assert.equal(getAliceBody().skills[0]!.name, "alice-secret");
});
