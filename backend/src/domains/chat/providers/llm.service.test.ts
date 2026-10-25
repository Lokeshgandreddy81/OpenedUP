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
  resolveOpenAiEffort,
  normalizeBaseUrl,
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

test("7. BYOK credential resolution for all 8 providers and overrides", () => {
  // 1. Anthropic
  const anthropicCreds = resolveProviderCredentials("claude-opus-5.5", "sk-ant-test123");
  assert.equal(anthropicCreds.provider, "anthropic");
  assert.equal(anthropicCreds.upstreamModelId, "claude-opus-5-5");
  assert.equal(anthropicCreds.apiKey, "sk-ant-test123");
  assert.equal(anthropicCreds.baseUrl, "https://api.anthropic.com/v1");

  // 2. OpenAI
  const openaiCreds = resolveProviderCredentials("gpt-6-astra", "sk-test123");
  assert.equal(openaiCreds.provider, "openai");
  assert.equal(openaiCreds.upstreamModelId, "gpt-6-astra");
  assert.equal(openaiCreds.apiKey, "sk-test123");
  assert.equal(openaiCreds.baseUrl, "https://api.openai.com/v1");

  // 3. Google Gemini
  const googleCreds = resolveProviderCredentials("gemini-3.8-flash", "AIzaSyTest123");
  assert.equal(googleCreds.provider, "google");
  assert.equal(googleCreds.upstreamModelId, "gemini-3.8-flash");
  assert.equal(googleCreds.apiKey, "AIzaSyTest123");
  assert.equal(googleCreds.baseUrl, "https://generativelanguage.googleapis.com/v1beta");

  // 4. DeepSeek
  const deepseekCreds = resolveProviderCredentials("deepseek-v4.1-flash", "sk-ds-test123");
  assert.equal(deepseekCreds.provider, "deepseek");
  assert.equal(deepseekCreds.upstreamModelId, "deepseek-flash");
  assert.equal(deepseekCreds.apiKey, "sk-ds-test123");
  assert.equal(deepseekCreds.baseUrl, "https://api.deepseek.com");

  // 5. Kimi (Moonshot)
  const kimiCreds = resolveProviderCredentials("kimi-k3.1-pro", "sk-kimi-test123");
  assert.equal(kimiCreds.provider, "kimi");
  assert.equal(kimiCreds.upstreamModelId, "kimi-k3.1-pro");
  assert.equal(kimiCreds.apiKey, "sk-kimi-test123");
  assert.equal(kimiCreds.baseUrl, "https://api.moonshot.ai/v1");

  // 6. Qwen (DashScope)
  const qwenCreds = resolveProviderCredentials("qwen3.8-max", "sk-qwen-test123");
  assert.equal(qwenCreds.provider, "qwen");
  assert.equal(qwenCreds.upstreamModelId, "qwen3.8-max");
  assert.equal(qwenCreds.apiKey, "sk-qwen-test123");
  assert.equal(qwenCreds.baseUrl, "https://dashscope-intl.aliyuncs.com/compatible-mode/v1");

  // 7. xAI (Grok)
  const xaiCreds = resolveProviderCredentials("grok-4.7", "xai-test123");
  assert.equal(xaiCreds.provider, "xai");
  assert.equal(xaiCreds.upstreamModelId, "grok-4.7");
  assert.equal(xaiCreds.apiKey, "xai-test123");
  assert.equal(xaiCreds.baseUrl, "https://api.x.ai/v1");

  // 8. Custom / OpenRouter (default provider "custom")
  const customModelCreds = resolveProviderCredentials(
    "custom-model",
    "sk-or-test123",
    undefined,
    "meta-llama/llama-3-70b-instruct"
  );
  assert.equal(customModelCreds.provider, "custom");
  assert.equal(customModelCreds.upstreamModelId, "meta-llama/llama-3-70b-instruct");
  assert.equal(customModelCreds.apiKey, "sk-or-test123");
  assert.equal(customModelCreds.baseUrl, "https://openrouter.ai/api/v1");

  // Custom model with explicit customProvider override (e.g. openai)
  const customWithProvider = resolveProviderCredentials(
    "custom-model",
    "sk-proj-test123",
    undefined,
    "ft:gpt-4o:my-org",
    "openai"
  );
  assert.equal(customWithProvider.provider, "openai");
  assert.equal(customWithProvider.upstreamModelId, "ft:gpt-4o:my-org");
  assert.equal(customWithProvider.baseUrl, "https://api.openai.com/v1");

  // Custom model with invalid customProvider falls back safely to "custom"
  const customInvalidProvider = resolveProviderCredentials(
    "custom-model",
    "sk-or-test123",
    undefined,
    "custom-upstream",
    "invalid-provider" as unknown as undefined
  );
  assert.equal(customInvalidProvider.provider, "custom");

  // Missing custom model ID
  assert.throws(
    () => resolveProviderCredentials("custom-model", "sk-test", undefined, ""),
    /MISSING_CUSTOM_MODEL/
  );

  // Unknown model
  assert.throws(
    () => resolveProviderCredentials("nonexistent-model-xyz", "key"),
    /UNKNOWN_MODEL:nonexistent-model-xyz/
  );
});

test("7b. Custom base URL overrides: trailing slashes, custom ports, and protocol validation", () => {
  // Trailing slashes stripped
  const strippedSlash = resolveProviderCredentials(
    "claude-opus-5.5",
    "sk-ant-test123",
    "https://proxy.example.com/anthropic///"
  );
  assert.equal(strippedSlash.baseUrl, "https://proxy.example.com/anthropic");

  // Custom port preserved and trailing slash stripped
  const customPort = resolveProviderCredentials(
    "gpt-6-astra",
    "sk-test123",
    "https://proxy.example.com:8443/v1/"
  );
  assert.equal(customPort.baseUrl, "https://proxy.example.com:8443/v1");

  // Direct normalizeBaseUrl unit tests
  assert.equal(normalizeBaseUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1");
  assert.equal(
    normalizeBaseUrl("https://custom-gateway.corp.com:9443/llm/"),
    "https://custom-gateway.corp.com:9443/llm"
  );
  assert.equal(
    normalizeBaseUrl("https://api.moonshot.ai/v1"),
    "https://api.moonshot.ai/v1"
  );

  // Protocol validation: HTTP rejected
  assert.throws(
    () => resolveProviderCredentials("gpt-6-astra", "sk-test", "http://insecure.example.com/v1"),
    /Provider URL must use HTTPS\./
  );
  assert.throws(
    () => normalizeBaseUrl("http://insecure.example.com/v1"),
    /Provider URL must use HTTPS\./
  );

  // Protocol validation: FTP rejected
  assert.throws(
    () => normalizeBaseUrl("ftp://files.example.com/v1"),
    /Provider URL must use HTTPS\./
  );

  // Malformed URL rejected
  assert.throws(
    () => normalizeBaseUrl("not-a-valid-url"),
    /Provider base URL must be a valid URL\./
  );

  // Embedded credentials rejected
  assert.throws(
    () => normalizeBaseUrl("https://user:pass@proxy.example.com/v1"),
    /Provider URL must not contain credentials\./
  );
});

test("7c. Missing API key actionable error format for all 8 providers", () => {
  const missingCases = [
    { model: "claude-opus-5.5", provider: "anthropic" },
    { model: "gpt-6-astra", provider: "openai" },
    { model: "gemini-4-argon", provider: "google" },
    { model: "deepseek-v4.1-flash", provider: "deepseek" },
    { model: "kimi-k3.1-pro", provider: "kimi" },
    { model: "qwen3.8-max", provider: "qwen" },
    { model: "grok-4.7", provider: "xai" },
    { model: "custom-model", provider: "custom", customModel: "custom-upstream" },
  ];

  for (const { model, provider, customModel } of missingCases) {
    const expectedPattern = new RegExp(`MISSING_API_KEY:${provider}:.+Customize → Providers`);
    assert.throws(
      () => resolveProviderCredentials(model, "", undefined, customModel),
      expectedPattern
    );
    // Also verify whitespace-only key triggers missing key error
    assert.throws(
      () => resolveProviderCredentials(model, "   ", undefined, customModel),
      expectedPattern
    );
  }

  // Custom model with customProvider missing key error
  assert.throws(
    () => resolveProviderCredentials("custom-model", "", undefined, "gpt-4o", "openai"),
    /MISSING_API_KEY:openai:.+Customize → Providers/
  );
});

test("7d. OpenAI reasoning_effort resolution", () => {
  assert.equal(resolveOpenAiEffort("low"), "low");
  assert.equal(resolveOpenAiEffort("medium"), "medium");
  assert.equal(resolveOpenAiEffort("high"), "high");
  // Extra/Max must map safely to "high" for OpenAI API compliance
  assert.equal(resolveOpenAiEffort("xhigh"), "high");
  assert.equal(resolveOpenAiEffort("max"), "high");
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
