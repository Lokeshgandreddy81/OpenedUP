import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeMimeType,
  normalizeAnthropicMediaType,
  resolveAllImages,
  cleanBase64Data,
  isPrivateAddress,
  buildGeminiContents,
  buildAnthropicMessages,
  buildOpenAiMessages,
  resolveProviderCredentials,
  resolveGeminiThinkingLevel,
} from "./llm.service.js";
import { processChat } from "../application/chat.service.js";
import {
  redactSecretsString,
  redactSecretsObject,
} from "../../../platform/observability/logger.js";
import { ThinkingLevel } from "@google/genai";

test("1. MIME type normalization", () => {
  assert.equal(normalizeMimeType("image/jpg"), "image/jpeg");
  assert.equal(normalizeMimeType("image/pjpeg"), "image/jpeg");
  assert.equal(normalizeMimeType("image/jfif"), "image/jpeg");
  assert.equal(normalizeMimeType("jpg"), "image/jpeg");
  assert.equal(normalizeMimeType("JPEG"), "image/jpeg");
  assert.equal(normalizeMimeType("IMAGE/JPG; charset=utf-8"), "image/jpeg");
  assert.equal(normalizeMimeType("image/png"), "image/png");
  assert.equal(normalizeMimeType("png"), "image/png");
  assert.equal(normalizeMimeType("image/webp"), "image/webp");
  assert.equal(normalizeMimeType("image/gif"), "image/gif");
  assert.equal(normalizeMimeType(""), "image/jpeg");

  // Anthropic media type normalization
  assert.equal(normalizeAnthropicMediaType("image/jpg"), "image/jpeg");
  assert.equal(normalizeAnthropicMediaType("image/png"), "image/png");
  assert.equal(normalizeAnthropicMediaType("image/webp"), "image/webp");
  assert.equal(normalizeAnthropicMediaType("image/gif"), "image/gif");
  assert.equal(normalizeAnthropicMediaType("image/svg+xml"), "image/jpeg");
  assert.equal(normalizeAnthropicMediaType("unknown/mime"), "image/jpeg");
});

test("2. Image resolving and data URI cleanup", () => {
  const resolved = resolveAllImages({
    images: [
      { name: "test.jpg", mimeType: "image/jpg", base64Data: "data:image/jpeg;base64,aGVsbG8=" },
    ],
    imagePages: [{ pageNumber: 1, mimeType: "image/png", base64Data: "   d29ybGQ= \n  " }],
  });

  assert.equal(resolved.length, 2);
  assert.equal(resolved[0]!.mimeType, "image/jpeg");
  assert.equal(resolved[0]!.base64Data, "aGVsbG8=");
  assert.equal(resolved[1]!.mimeType, "image/png");
  assert.equal(resolved[1]!.base64Data, "d29ybGQ=");
});

test("3. Prompt-free image sends and empty prompt defaulting", () => {
  const images = [{ mimeType: "image/jpeg", base64Data: "aGVsbG8=" }];

  // Empty string content
  const geminiEmpty = buildGeminiContents([{ role: "user", content: "" }], images);
  assert.equal(geminiEmpty[0]!.parts[0]!.text, "Please analyze the attached image(s).");
  assert.deepEqual(geminiEmpty[0]!.parts[1]!.inlineData, {
    mimeType: "image/jpeg",
    data: "aGVsbG8=",
  });

  // Whitespace-only content
  const anthropicWhitespace = buildAnthropicMessages(
    [{ role: "user", content: "   \n  " }],
    images
  );
  const anthropicContent = anthropicWhitespace[0]!.content as Array<{
    type: string;
    text?: string;
  }>;
  assert.equal(anthropicContent[0]!.text, "Please analyze the attached image(s).");

  // Empty messages array
  const openAiEmptyMsgs = buildOpenAiMessages([], images, "openai");
  assert.equal(openAiEmptyMsgs.length, 1);
  assert.equal(openAiEmptyMsgs[0]!.role, "user");
  const openAiContent = openAiEmptyMsgs[0]!.content as Array<{ type: string; text?: string }>;
  assert.equal(openAiContent[0]!.text, "Please analyze the attached image(s).");
});

test("4. Multimodal payload construction for all 8 providers", () => {
  const images = [{ mimeType: "image/jpeg", base64Data: "aGVsbG8=" }];
  const messages = [{ role: "user" as const, content: "Describe this image" }];

  // Google Gemini
  const geminiPayload = buildGeminiContents(messages, images);
  assert.equal(geminiPayload.length, 1);
  assert.equal(geminiPayload[0]!.role, "user");
  assert.equal(geminiPayload[0]!.parts[0]!.text, "Describe this image");
  assert.deepEqual(geminiPayload[0]!.parts[1], {
    inlineData: { mimeType: "image/jpeg", data: "aGVsbG8=" },
  });

  // Anthropic
  const anthropicPayload = buildAnthropicMessages(messages, images);
  assert.equal(anthropicPayload.length, 1);
  assert.equal(anthropicPayload[0]!.role, "user");
  assert.deepEqual(anthropicPayload[0]!.content, [
    { type: "text", text: "Describe this image" },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: "aGVsbG8=",
      },
    },
  ]);

  // OpenAI: detail: "high"
  const openaiPayload = buildOpenAiMessages(messages, images, "openai", "System prompt");
  assert.equal(openaiPayload[0]!.role, "system");
  assert.equal(openaiPayload[0]!.content, "System prompt");
  assert.deepEqual(openaiPayload[1]!.content, [
    { type: "text", text: "Describe this image" },
    {
      type: "image_url",
      image_url: {
        url: "data:image/jpeg;base64,aGVsbG8=",
        detail: "high",
      },
    },
  ]);

  // xAI: detail: "high"
  const xaiPayload = buildOpenAiMessages(messages, images, "xai");
  assert.deepEqual(xaiPayload[0]!.content, [
    { type: "text", text: "Describe this image" },
    {
      type: "image_url",
      image_url: {
        url: "data:image/jpeg;base64,aGVsbG8=",
        detail: "high",
      },
    },
  ]);

  // Kimi: NO detail property
  const kimiPayload = buildOpenAiMessages(messages, images, "kimi");
  const kimiImage = (
    kimiPayload[0]!.content as Array<{ type: string; image_url: { detail?: string } }>
  )[1]!;
  assert.equal(kimiImage.image_url.detail, undefined);

  // Qwen: NO detail property
  const qwenPayload = buildOpenAiMessages(messages, images, "qwen");
  const qwenImage = (
    qwenPayload[0]!.content as Array<{ type: string; image_url: { detail?: string } }>
  )[1]!;
  assert.equal(qwenImage.image_url.detail, undefined);

  // DeepSeek: NO detail property
  const deepseekPayload = buildOpenAiMessages(messages, images, "deepseek");
  const deepseekImage = (
    deepseekPayload[0]!.content as Array<{ type: string; image_url: { detail?: string } }>
  )[1]!;
  assert.equal(deepseekImage.image_url.detail, undefined);

  // Custom/OpenRouter: NO detail property
  const customPayload = buildOpenAiMessages(messages, images, "custom");
  const customImage = (
    customPayload[0]!.content as Array<{ type: string; image_url: { detail?: string } }>
  )[1]!;
  assert.equal(customImage.image_url.detail, undefined);
});

test("5. Target user message selection for multi-turn history", () => {
  const images = [{ mimeType: "image/jpeg", base64Data: "aGVsbG8=" }];
  const messages = [
    { role: "user" as const, content: "Initial query" },
    { role: "assistant" as const, content: "Prior response" },
    { role: "user" as const, content: "Followup with attachment" },
  ];

  const gemini = buildGeminiContents(messages, images);
  assert.equal(gemini[0]!.parts.length, 1); // only text
  assert.equal(gemini[1]!.parts.length, 1); // only text
  assert.equal(gemini[2]!.parts.length, 2); // text + inlineData
});

test("6. Gemini thinking level resolution", () => {
  assert.equal(resolveGeminiThinkingLevel("low"), ThinkingLevel.LOW);
  assert.equal(resolveGeminiThinkingLevel("medium"), ThinkingLevel.MEDIUM);
  assert.equal(resolveGeminiThinkingLevel("high"), ThinkingLevel.HIGH);
  assert.equal(resolveGeminiThinkingLevel("xhigh"), ThinkingLevel.HIGH);
  assert.equal(resolveGeminiThinkingLevel("max"), ThinkingLevel.HIGH);
});

test("7. BYOK credential resolution and overrides", () => {
  // Google BYOK
  const googleCreds = resolveProviderCredentials("gemini-3.8-flash", "AIzaSyTest123");
  assert.equal(googleCreds.provider, "google");
  assert.equal(googleCreds.apiKey, "AIzaSyTest123");
  assert.equal(googleCreds.baseUrl, "https://generativelanguage.googleapis.com/v1beta");

  // Custom Base URL override
  const customBase = resolveProviderCredentials(
    "claude-opus-5.5",
    "sk-ant-test123",
    "https://proxy.example.com/anthropic"
  );
  assert.equal(customBase.provider, "anthropic");
  assert.equal(customBase.baseUrl, "https://proxy.example.com/anthropic");

  // Custom model
  const customModelCreds = resolveProviderCredentials(
    "custom-model",
    "sk-or-test123",
    "https://openrouter.ai/api/v1",
    "openai/gpt-4o",
    "custom"
  );
  assert.equal(customModelCreds.provider, "custom");
  assert.equal(customModelCreds.upstreamModelId, "openai/gpt-4o");

  // Missing custom model ID
  assert.throws(
    () => resolveProviderCredentials("custom-model", "sk-test", undefined, ""),
    /MISSING_CUSTOM_MODEL/
  );

  // Missing API Key
  assert.throws(() => resolveProviderCredentials("gpt-6-astra", ""), /MISSING_API_KEY:openai/);

  // Unknown model
  assert.throws(
    () => resolveProviderCredentials("nonexistent-model-xyz", "key"),
    /UNKNOWN_MODEL:nonexistent-model-xyz/
  );
});

test("8. Text-only model protection in chat.service.ts", async () => {
  const images = [{ mimeType: "image/jpeg", base64Data: "aGVsbG8=" }];

  // deepseek-v4-pro is text-only
  await assert.rejects(async () => {
    await processChat({
      model: "deepseek-v4-pro",
      messages: [{ role: "user", content: "Analyze" }],
      images,
    });
  }, /DeepSeek V4 Pro does not support image analysis/);

  // openrouter-nemotron-3.5-lightning-free is text-only
  await assert.rejects(async () => {
    await processChat({
      model: "openrouter-nemotron-3.5-lightning-free",
      messages: [{ role: "user", content: "Analyze" }],
      images,
    });
  }, /Nemotron 3.5 Lightning \(Free\) does not support image analysis/);

  // openrouter-flint-v1-free is text-only
  await assert.rejects(async () => {
    await processChat({
      model: "openrouter-flint-v1-free",
      messages: [{ role: "user", content: "Analyze" }],
      images,
    });
  }, /Flint v1.0 \(Free\) does not support image analysis/);
});

test("9. SSRF prevention and comprehensive isPrivateAddress checks", () => {
  const privateIps = [
    // Loopback & Unspecified
    "127.0.0.1",
    "127.255.255.254",
    "0.0.0.0",
    "::1",
    "0:0:0:0:0:0:0:1",
    "::",
    "0:0:0:0:0:0:0:0",

    // RFC 1918 Private
    "10.0.0.1",
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.0.1",
    "192.168.1.100",

    // Link-local / Cloud metadata (AWS, GCP, Azure 169.254.169.254)
    "169.254.169.254",
    "fe80::1",

    // Carrier Grade NAT & Reserved
    "100.64.0.1",
    "100.127.255.255",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
    "240.0.0.1",
    "255.255.255.255",

    // IPv6 Unique Local Address (ULA) & Multicast
    "fc00::1",
    "fd00::1",
    "ff02::1",

    // IPv4-mapped IPv6 (both hex and dotted decimal!)
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "0:0:0:0:0:ffff:127.0.0.1",
    "::ffff:169.254.169.254",
    "::ffff:a9fe:a9fe",
    "::ffff:10.0.0.1",
    "::ffff:192.168.1.1",
    "::ffff:c0a8:101",

    // IPv4-translated & IPv4-compatible
    "::ffff:0:127.0.0.1",
    "::ffff:0:7f00:1",
    "::127.0.0.1",

    // NAT64 & 6to4
    "64:ff9b::127.0.0.1",
    "64:ff9b::7f00:1",
    "2002:7f00:0001::",
    "2002:a9fe:a9fe::",

    // Malformed strings default to blocked
    "not-a-valid-ip",
    "",
  ];

  for (const ip of privateIps) {
    assert.equal(isPrivateAddress(ip), true, `Expected ${ip} to be blocked as private`);
  }

  const publicIps = [
    "8.8.8.8",
    "1.1.1.1",
    "93.184.216.34",
    "172.15.255.255",
    "172.32.0.1",
    "192.169.1.1",
    "100.63.255.255",
    "100.128.0.0",
    "::ffff:8.8.8.8",
    "::ffff:0808:0808",
    "64:ff9b::8.8.8.8",
    "2002:0808:0808::",
    "2606:4700:4700::1111",
    "2001:4860:4860::8888",
  ];

  for (const ip of publicIps) {
    assert.equal(isPrivateAddress(ip), false, `Expected ${ip} to be permitted as public`);
  }
});

test("10. Payload safety, base64 sanitization, and ReDoS safety", () => {
  const dataUri = "data:image/png;base64,aGVsbG8gd29ybGQ=";
  assert.equal(cleanBase64Data(dataUri), "aGVsbG8gd29ybGQ=");

  const formatted = "  data:image/jpeg;base64, \r\n aGVsbG8= \n ";
  assert.equal(cleanBase64Data(formatted), "aGVsbG8=");

  const upperCasePrefix = "DATA:IMAGE/WEBP;BASE64,dGVzdA==";
  assert.equal(cleanBase64Data(upperCasePrefix), "dGVzdA==");

  // Large input with no semicolon does not stall regex
  const largeNoSemi = "data:" + "A".repeat(50_000);
  const start = Date.now();
  cleanBase64Data(largeNoSemi);
  assert.ok(Date.now() - start < 50, "Base64 cleaning must be fast and resistant to ReDoS");
});

test("11. BYOK key safety and secret redaction in logs", () => {
  const logWithKeys =
    "Error with OpenAI key: sk-proj-1234567890abcdef123456 and Anthropic: sk-ant-api03-abcdef1234567890 and Bearer eyJhbGciOi...";
  const redacted = redactSecretsString(logWithKeys);
  assert.ok(!redacted.includes("sk-proj-1234567890abcdef123456"));
  assert.ok(!redacted.includes("sk-ant-api03-abcdef1234567890"));
  assert.ok(!redacted.includes("eyJhbGciOi"));
  assert.ok(redacted.includes("[REDACTED]"));

  const metaWithSecrets = {
    provider: "anthropic",
    apiKey: "sk-ant-123456789",
    injectedApiKey: "sk-test-secret",
    nested: {
      clientSecret: "very-secret-token",
    },
  };
  const sanitizedMeta = redactSecretsObject(metaWithSecrets);
  assert.equal(sanitizedMeta.apiKey, "[REDACTED]");
  assert.equal(sanitizedMeta.injectedApiKey, "[REDACTED]");
  assert.equal((sanitizedMeta.nested as { clientSecret: string }).clientSecret, "[REDACTED]");
  assert.equal(sanitizedMeta.provider, "anthropic");
});
