import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import {
  redactSecretsString,
  redactSecretsObject,
} from "../../platform/observability/logger.js";
import {
  isValidApiKey,
  sanitizeApiKey,
  sanitizeBaseUrl,
} from "../../platform/config/index.js";
import { sanitizeLogUrl } from "../../platform/http/middleware/requestLogger.js";
import { errorHandler } from "../../platform/http/middleware/errorHandler.js";
import { createRateLimiter } from "../../platform/http/middleware/rateLimiter.js";
import { actionableProviderError } from "../chat/providers/providerErrors.js";
import { resolveProviderCredentials } from "../chat/providers/llm.service.js";
import {
  listCredentials,
  removeCredential,
} from "./http/credential.controller.js";

function mockResponse() {
  let statusCode = 200;
  let jsonBody: unknown = undefined;
  let ended = false;
  const headers = new Map<string, string | number>();

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(name: string, value: string | number) {
      headers.set(name.toLowerCase(), value);
      return res;
    },
    getHeader(name: string) {
      return headers.get(name.toLowerCase());
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
    get headers() {
      return headers;
    },
  } as unknown as Response & {
    statusCode: number;
    body: unknown;
    ended: boolean;
    headers: Map<string, string | number>;
  };

  return res;
}

test("ADVERSARIAL AUDIT 1: No BYOK keys in logs, structured logs, stack traces, or error responses", () => {
  const keys = [
    ["sk-proj", "mocktest1234567890abcdef123456"].join("-"),
    ["sk-ant", "api03", "mocktest1234567890abcdef"].join("-"),
    ["AIza", "MockTest1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6"].join(""),
    ["gsk", "mocktest1234567890abcdefghijklmnopqr"].join("_"),
    ["pplx", "mocktest1234567890abcdefghijklmnop"].join("-"),
    ["sk-or", "v1", "mocktest1234567890abcdefghijklmnopqrstuvwxyz"].join("-"),
  ];

  for (const key of keys) {
    // 1.1 Text redaction
    const rawText = `Failed request with key ${key} and header x-provider-key: ${key}`;
    const cleanText = redactSecretsString(rawText);
    assert.ok(!cleanText.includes(key), `Expected ${key} to be stripped from text`);
    assert.ok(cleanText.includes("[REDACTED]"));

    // 1.2 URL redaction in requestLogger
    const urlWithKey = `https://api.journal.local/api/chat?apiKey=${key}&other=123`;
    const cleanUrl = sanitizeLogUrl(urlWithKey);
    assert.ok(!cleanUrl.includes(key), `Expected ${key} to be stripped from URL`);

    // 1.3 Object redaction
    const meta = { auth: key, apiKey: key, nested: { providerKey: key, token: key } };
    const cleanMeta = redactSecretsObject(meta) as any;
    assert.equal(cleanMeta.auth, "[REDACTED]");
    assert.equal(cleanMeta.apiKey, "[REDACTED]");
    assert.equal(cleanMeta.nested.providerKey, "[REDACTED]");
    assert.equal(cleanMeta.nested.token, "[REDACTED]");

    // 1.4 Stack trace redaction in errorHandler
    const fakeError = new Error(`Upstream failed for key ${key}`);
    fakeError.stack = `Error: Upstream failed for key ${key}\n    at fetchProvider (/app/src/llm.service.ts:12:34?key=${key})`;
    const req = { originalUrl: "/api/chat", method: "POST", id: "req-test-1" } as Request;
    const res = mockResponse();

    errorHandler(fakeError, req, res, () => {});
    assert.equal(res.statusCode, 500);
    // 500 responses must NEVER leak raw error or key to client
    const responseBody = res.body as { error: string };
    assert.equal(responseBody.error, "Internal Server Error");
    assert.ok(!JSON.stringify(responseBody).includes(key));
  }
});

test("ADVERSARIAL AUDIT 2: Malicious inputs cannot reflect API key in error responses", () => {
  const secretKey = "sk-proj-super-secret-key-that-must-never-leak";

  // 2.1 Malicious model ID containing secret key
  const maliciousModelId = secretKey;
  assert.throws(
    () => resolveProviderCredentials(maliciousModelId, "AIzaSyTestValidKey12345678901234567890"),
    (err: Error) => {
      assert.ok(
        !err.message.includes(secretKey),
        "Model ID error reflection must redact secret key patterns"
      );
      assert.ok(err.message.includes("[REDACTED]"));
      return true;
    }
  );

  // 2.2 Upstream 401/403 responses reflecting keys
  const upstream401Body = `HTTP 401 Unauthorized: Invalid API key provided: ${secretKey}`;
  const actionable401 = actionableProviderError(upstream401Body);
  assert.ok(
    !actionable401.includes(secretKey),
    "Actionable 401 error must not expose upstream response bodies or secret keys"
  );
  assert.equal(
    actionable401,
    "The provider rejected this API key. Check the key and selected provider in Customize → Providers, then verify the connection."
  );

  const upstream403Body = `403 Forbidden: Token ${secretKey} lacks permissions`;
  const actionable403 = actionableProviderError(upstream403Body);
  assert.ok(!actionable403.includes(secretKey));
  assert.equal(
    actionable403,
    "The provider rejected this API key. Check the key and selected provider in Customize → Providers, then verify the connection."
  );

  // 2.3 Upstream error with unknown format containing secrets
  const weirdUpstreamError = `Unexpected failure: token=${secretKey} was rejected`;
  const actionableWeird = actionableProviderError(weirdUpstreamError);
  assert.ok(!actionableWeird.includes(secretKey));
});

test("ADVERSARIAL AUDIT 3: Header sanitization blocks newlines, control chars, and HTTP header injection", () => {
  const maliciousHeaderKeys = [
    "sk-test\r\nX-Injected-Header: evil",
    "sk-test\nSet-Cookie: session=hijacked",
    "sk-test\r\n\r\nGET /admin HTTP/1.1",
    "sk-test\0nullbyte",
    "sk-test\x08backspace",
    "sk-test\x1b[31mcolor",
    "sk-test\x7fdelete",
    "sk test with space",
    "sk\ttest\twith\ttabs",
  ];

  for (const badKey of maliciousHeaderKeys) {
    // Must be rejected by isValidApiKey
    assert.equal(
      isValidApiKey(badKey),
      false,
      `Expected ${JSON.stringify(badKey)} to be rejected by isValidApiKey`
    );

    // Must be sanitized to undefined by sanitizeApiKey
    assert.equal(
      sanitizeApiKey(badKey),
      undefined,
      `Expected ${JSON.stringify(badKey)} to be rejected by sanitizeApiKey`
    );
  }

  // Legitimate keys must be accepted
  const legitimateKeys = [
    "sk-proj-1234567890abcdef123456",
    "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6",
    "gsk_valid_groq_key_1234567890abcdef",
    "custom-token.with_special-chars~123",
  ];

  for (const goodKey of legitimateKeys) {
    assert.equal(isValidApiKey(goodKey), true);
    assert.equal(sanitizeApiKey(goodKey), goodKey);
  }

  // Base URL sanitization against CRLF
  const badUrls = [
    "https://api.openai.com\r\nX-Injected: evil",
    "https://api.openai.com\nHost: evil.com",
    "javascript:alert(1)",
    "file:///etc/passwd",
  ];
  for (const badUrl of badUrls) {
    assert.equal(
      sanitizeBaseUrl(badUrl),
      undefined,
      `Expected ${JSON.stringify(badUrl)} to be rejected by sanitizeBaseUrl`
    );
  }
});

test("ADVERSARIAL AUDIT 4: Rate-limiting and authorization guards on /api/credentials", () => {
  // 4.1 Missing principal authorization check
  const reqUnauth = { principal: undefined } as unknown as Request;
  const resUnauth = mockResponse();
  listCredentials(reqUnauth, resUnauth);
  assert.equal(resUnauth.statusCode, 401);

  // 4.2 Invalid provider check on DELETE /api/credentials/:provider
  const reqBadProvider = {
    principal: { uid: "test-user" },
    params: { provider: "malicious-nonexistent-provider" },
  } as unknown as Request;
  const resBadProvider = mockResponse();
  removeCredential(reqBadProvider, resBadProvider);
  assert.equal(resBadProvider.statusCode, 400);
  assert.deepEqual(resBadProvider.body, { error: "Invalid provider specified.", requestId: undefined });

  // 4.3 Rate limiter enforcement
  const limiter = createRateLimiter({
    windowMs: 10_000,
    maxRequests: 3,
    message: "Rate limit exceeded for testing.",
    keyGenerator: () => "test-user-rate-limit",
  });

  const nextCalls: number[] = [];
  const req = { principal: { uid: "test-user-rate-limit" } } as Request;

  // Requests 1, 2, 3 succeed
  for (let i = 1; i <= 3; i++) {
    const res = mockResponse();
    limiter(req, res, () => {
      nextCalls.push(i);
    });
    assert.equal(res.statusCode, 200);
    assert.equal(Number(res.getHeader("ratelimit-remaining")), 3 - i);
  }
  assert.equal(nextCalls.length, 3);

  // Request 4 must be rate-limited (HTTP 429)
  const resBlocked = mockResponse();
  let nextCalled4 = false;
  limiter(req, resBlocked, () => {
    nextCalled4 = true;
  });
  assert.equal(nextCalled4, false, "Next must not be called when rate limit is exceeded");
  assert.equal(resBlocked.statusCode, 429);
  assert.equal(resBlocked.getHeader("retry-after") !== undefined, true);
  assert.deepEqual(resBlocked.body, {
    error: "Rate limit exceeded for testing.",
    requestId: undefined,
    retryAfter: Number(resBlocked.getHeader("retry-after")),
  });
});
