import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { Request, Response } from "express";
import {
  listCredentials,
  putCredential,
  updateCredentialEndpoint,
  removeCredential,
  getAttestation,
} from "./credential.controller.js";
import { getProviderCredential } from "../application/credentialVault.js";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";

function setupIsolatedEnv() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "controller-test-"));
  const origEnv = { ...process.env };
  process.env["CHAT_DB_PATH"] = ":memory:";
  process.env["KEY_STORAGE_DIR"] = tmpDir;
  delete process.env["BYOK_ENCRYPTION_KEY"];
  process.env["NODE_ENV"] = "test";

  return {
    tmpDir,
    cleanup: () => {
      process.env = origEnv;
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    },
  };
}

function mockResponse() {
  let statusCode = 200;
  let jsonBody: unknown = undefined;
  let ended = false;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      ended = true;
      return res;
    },
    end() {
      ended = true;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return jsonBody;
    },
    get ended() {
      return ended;
    },
  } as unknown as Response & { statusCode: number; body: unknown; ended: boolean };

  return res;
}

test("Credential HTTP Controller: list, put, patch endpoint, and remove", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const userId = "test-http-user";
    const reqBase = {
      principal: { uid: userId },
    } as unknown as Request;

    // 1. Initial list should be empty
    const listRes1 = mockResponse();
    listCredentials(reqBase, listRes1);
    assert.equal(listRes1.statusCode, 200);
    assert.deepEqual(listRes1.body, { providers: [] });

    // 2. Put credential
    const putReq = {
      ...reqBase,
      body: {
        provider: "anthropic",
        apiKey: "sk-ant-test-controller-123",
      },
    } as unknown as Request;
    const putRes = mockResponse();
    putCredential(putReq, putRes);
    assert.equal(putRes.statusCode, 204);
    assert.equal(putRes.ended, true);

    // Verify it is in database
    const saved = getProviderCredential(userId, "anthropic");
    assert.equal(saved?.apiKey, "sk-ant-test-controller-123");

    // 3. List should now contain anthropic
    const listRes2 = mockResponse();
    listCredentials(reqBase, listRes2);
    assert.equal(listRes2.statusCode, 200);
    assert.deepEqual(listRes2.body, { providers: ["anthropic"] });

    // 4. Update endpoint successfully
    const patchReq = {
      ...reqBase,
      body: {
        provider: "anthropic",
        baseUrl: "https://custom.anthropic.endpoint/v1",
      },
    } as unknown as Request;
    const patchRes = mockResponse();
    updateCredentialEndpoint(patchReq, patchRes);
    assert.equal(patchRes.statusCode, 204);

    const updated = getProviderCredential(userId, "anthropic");
    assert.equal(updated?.apiKey, "sk-ant-test-controller-123");
    assert.equal(updated?.baseUrl, "https://custom.anthropic.endpoint/v1");

    // 5. Update endpoint for non-existent credential returns 404
    const patchReq404 = {
      ...reqBase,
      body: {
        provider: "openai",
        baseUrl: "https://custom.openai.com",
      },
    } as unknown as Request;
    const patchRes404 = mockResponse();
    updateCredentialEndpoint(patchReq404, patchRes404);
    assert.equal(patchRes404.statusCode, 404);
    assert.deepEqual(patchRes404.body, { error: "No saved provider credential exists." });

    // 6. Update endpoint when ciphertext is corrupted returns 422
    const db = getChatDatabase();
    db.prepare(
      "UPDATE provider_credentials SET ciphertext = ? WHERE user_id = ? AND provider_id = ?"
    ).run(crypto.randomBytes(40), userId, "anthropic");

    const patchReq422 = {
      ...reqBase,
      body: {
        provider: "anthropic",
        baseUrl: "https://new-url.com",
      },
    } as unknown as Request;
    const patchRes422 = mockResponse();
    updateCredentialEndpoint(patchReq422, patchRes422);
    assert.equal(patchRes422.statusCode, 422);
    const errorBody = patchRes422.body as { error?: string };
    assert.ok(errorBody?.error?.includes("cannot be decrypted"));

    // 7. Remove credential
    const removeReq = {
      ...reqBase,
      params: { provider: "anthropic" },
    } as unknown as Request;
    const removeRes = mockResponse();
    removeCredential(removeReq, removeRes);
    assert.equal(removeRes.statusCode, 204);

    // Verify it is gone
    const listRes3 = mockResponse();
    listCredentials(reqBase, listRes3);
    assert.deepEqual(listRes3.body, { providers: [] });

    // 8. Attestation and vault health query
    const attestRes = mockResponse();
    getAttestation(reqBase, attestRes);
    assert.equal(attestRes.statusCode, 200);
    const attestBody = attestRes.body as {
      attestation?: { status: string; algorithm: string };
      health?: { healthy: boolean };
    };
    assert.equal(attestBody.attestation?.status, "healthy");
    assert.equal(attestBody.attestation?.algorithm, "AES-256-GCM+HKDF");
    assert.equal(attestBody.health?.healthy, true);
  } finally {
    cleanup();
  }
});
