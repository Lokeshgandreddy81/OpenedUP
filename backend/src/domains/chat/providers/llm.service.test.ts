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
  generateMultiProviderChat,
  generateMultiProviderChatStream,
  resolveGeminiThinkingLevel,
  resolveOpenAiEffort,
  normalizeBaseUrl,
} from "./llm.service.js";
import { processChat, processChatStream } from "../application/chat.service.js";
import {
  redactSecretsString,
  redactSecretsObject,
} from "../../../platform/observability/logger.js";
import { ThinkingLevel } from "@google/genai";
import {
  MODEL_REGISTRY,
  getChatModels,
  getChatModelsForProvider,
  modelSupportsInput,
} from "@charan-interiors/contracts";
import { actionableProviderError, classifyProviderFailure } from "./providerErrors.js";

function chunkedSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  );
}

test("provider model choices only include chat models the app can select", () => {
  const openRouterModels = getChatModelsForProvider("custom");
  assert.ok(openRouterModels.length > 0);
  assert.ok(openRouterModels.every((model) => model.isChatModel));
});

test("Gemini Flash-Lite is a free-tier eligible model routed through the user's Google key", () => {
  const model = getChatModelsForProvider("google").find(
    (candidate) => candidate.id === "gemini-3.5-flash-lite"
  );

  assert.ok(model, "Gemini Flash-Lite should be available in the Google provider model list");
  assert.equal(model.provider, "google");
  assert.equal(model.upstreamModelId, "gemini-3.5-flash-lite");
  assert.equal(model.isChatModel, true);
  assert.notEqual(model.isFree, true, "Google free-tier access must not route through OpenRouter");
});

test("input admission follows app-supported modalities and treats custom endpoints conservatively", () => {
  assert.equal(modelSupportsInput("deepseek-v4-pro", "image"), false);
  assert.equal(modelSupportsInput("openrouter-flint-v1-free", "image"), false);
  assert.equal(modelSupportsInput("gemini-3.8-flash", "image"), true);
  assert.equal(modelSupportsInput("custom-model", "image"), false);
  assert.ok(MODEL_REGISTRY["gemini-4-argon"]?.upstreamInputModalities?.includes("video"));
  assert.equal(modelSupportsInput("gemini-4-argon", "video"), false);
});

test("every catalog entry has dated provenance and non-chat entries are explicitly unavailable", () => {
  for (const [key, model] of Object.entries(MODEL_REGISTRY)) {
    assert.equal(model.id, key);
    assert.ok(model.sourceUrl, `${key} is missing a source URL`);
    assert.equal(new URL(model.sourceUrl!).protocol, "https:");
    assert.match(model.reviewedAt || "", /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(model.catalogStatus, `${key} is missing an evidence status`);
    assert.ok(model.apiProtocol, `${key} is missing its request protocol`);

    if (model.catalogStatus === "restricted" || model.catalogStatus === "unavailable") {
      assert.equal(model.isChatModel, false, `${key} must not be selectable for standard chat`);
    }
    if (model.catalogStatus === "verified" && model.isChatModel) {
      assert.ok(model.upstreamModelId.trim(), `${key} is missing its upstream model ID`);
      assert.ok(
        model.upstreamInputModalities?.length,
        `${key} is missing documented input modalities`
      );
      assert.ok(model.inputModalities?.length, `${key} is missing app-supported input modalities`);
      assert.ok(model.contextWindowTokens, `${key} is missing a context limit`);
    }
  }
});

test("every selectable catalog model reaches its documented provider adapter", async (t) => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    requests.push({ url, init });
    if (url.includes(":generateContent")) {
      return new Response(
        JSON.stringify({
          candidates: [{ content: { role: "model", parts: [{ text: "provider reply" }] } }],
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.endsWith("/messages")) {
      return new Response(JSON.stringify({ content: [{ type: "text", text: "provider reply" }] }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: "provider reply" } }] }), {
      headers: { "Content-Type": "application/json" },
    });
  });

  for (const model of getChatModels()) {
    const customModel = model.id === "custom-model" ? "vendor/test-model" : undefined;
    const expectedModel = customModel || model.upstreamModelId;
    const result = await generateMultiProviderChat({
      modelId: model.id,
      ...(customModel ? { customModel, customProvider: "custom" as const } : {}),
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: `fixture-key-${model.provider}`,
      injectedBaseUrl: "https://1.1.1.1/v1",
    });

    const request = requests.at(-1)!;
    assert.equal(result.text, "provider reply", model.id);
    assert.equal(result.modelUsed, expectedModel, model.id);
    assert.equal(result.providerUsed, model.provider, model.id);
    assert.equal(request.init?.method, "POST", model.id);
    const body = JSON.parse(String(request.init?.body)) as { model?: string };
    if (model.provider === "google") {
      assert.match(request.url, new RegExp(`/models/${expectedModel}:generateContent$`), model.id);
      assert.equal(
        new Headers(request.init?.headers).get("x-goog-api-key"),
        `fixture-key-${model.provider}`
      );
    } else if (model.provider === "anthropic") {
      assert.equal(request.url, "https://1.1.1.1/v1/messages", model.id);
      assert.equal(body.model, expectedModel, model.id);
      assert.equal(
        new Headers(request.init?.headers).get("x-api-key"),
        `fixture-key-${model.provider}`
      );
      assert.equal(new Headers(request.init?.headers).get("anthropic-version"), "2023-06-01");
    } else {
      assert.equal(request.url, "https://1.1.1.1/v1/chat/completions", model.id);
      assert.equal(body.model, expectedModel, model.id);
      assert.equal(
        new Headers(request.init?.headers).get("authorization"),
        `Bearer fixture-key-${model.provider}`,
        model.id
      );
    }

    const expectedProtocol =
      model.provider === "google"
        ? "gemini-generate-content"
        : model.provider === "anthropic"
          ? "anthropic-messages"
          : model.id === "custom-model"
            ? "user-configured-openai-compatible"
            : "openai-chat-completions";
    assert.equal(model.apiProtocol, expectedProtocol, model.id);
  }
  assert.equal(requests.length, getChatModels().length);
});

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
  assert.equal(normalizeBaseUrl("https://api.moonshot.ai/v1"), "https://api.moonshot.ai/v1");

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
  assert.equal(resolveOpenAiEffort("xhigh"), "xhigh");
  assert.equal(resolveOpenAiEffort("max"), "max");
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

  await assert.rejects(
    processChatStream(
      {
        model: "deepseek-v4-pro",
        messages: [{ role: "user", content: "Analyze" }],
        images,
      },
      undefined,
      () => undefined
    ),
    /DeepSeek V4 Pro does not support image analysis/
  );
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
      prompt: "private customer prompt",
      messages: [{ role: "user", content: "private customer content" }],
      content: "private customer content",
    },
  };
  const sanitizedMeta = redactSecretsObject(metaWithSecrets);
  assert.equal(sanitizedMeta.apiKey, "[REDACTED]");
  assert.equal(sanitizedMeta.injectedApiKey, "[REDACTED]");
  assert.equal((sanitizedMeta.nested as { clientSecret: string }).clientSecret, "[REDACTED]");
  assert.equal((sanitizedMeta.nested as { prompt: string }).prompt, "[REDACTED]");
  assert.equal((sanitizedMeta.nested as Record<string, unknown>).messages, "[REDACTED]");
  assert.equal((sanitizedMeta.nested as { content: string }).content, "[REDACTED]");
  assert.equal(sanitizedMeta.provider, "anthropic");
});

test("provider failures reduce to safe diagnostic categories", () => {
  assert.equal(
    classifyProviderFailure(new Error("Provider API error (401): rejected")),
    "authentication"
  );
  assert.equal(
    classifyProviderFailure(
      new Error('{"error":{"code":400,"message":"API key not valid","reason":"API_KEY_INVALID"}}')
    ),
    "authentication"
  );
  assert.equal(
    classifyProviderFailure(new Error("Provider API error: authentication_error: invalid x-api-key")),
    "authentication"
  );
  assert.equal(
    classifyProviderFailure(new Error("Provider API error (429): rate limited")),
    "rate_limit"
  );
  assert.equal(
    classifyProviderFailure(new Error("Provider API error: rate_limit_error: quota exceeded")),
    "rate_limit"
  );
  assert.equal(
    classifyProviderFailure(new DOMException("deadline exceeded", "TimeoutError")),
    "timeout"
  );
  assert.equal(
    classifyProviderFailure(new Error("Provider API error (504): gateway timeout")),
    "timeout"
  );
  assert.equal(
    classifyProviderFailure(new Error("Provider returned malformed streaming data.")),
    "malformed_stream"
  );
  assert.equal(classifyProviderFailure(new Error("fetch failed: socket reset")), "network");
  assert.equal(
    classifyProviderFailure(new Error("Provider API error (503): unavailable")),
    "provider_unavailable"
  );
  assert.equal(
    classifyProviderFailure(new Error("Provider API error: overloaded_error: Overloaded")),
    "provider_unavailable"
  );
  assert.equal(
    classifyProviderFailure(new Error("Provider API error (404): invalid model")),
    "invalid_request"
  );
  assert.equal(
    classifyProviderFailure(new Error("Request exceeds the model context window.")),
    "invalid_request"
  );
  assert.equal(
    classifyProviderFailure(
      new Error("Provider URL cannot resolve to a private or local network address.")
    ),
    "invalid_request"
  );
});

test("statusless permission and API errors produce actionable provider guidance", () => {
  const permissionError = new Error("Provider API error: permission_error: access denied");
  const apiError = new Error("Provider API error: api_error: internal provider failure");

  assert.equal(classifyProviderFailure(permissionError), "authentication");
  assert.match(actionableProviderError(permissionError.message), /permissions.*Customize → Providers/i);
  assert.equal(classifyProviderFailure(apiError), "provider_unavailable");
  assert.match(actionableProviderError(apiError.message), /temporarily unavailable.*Retry/i);
});

test("context overflow and endpoint errors give accurate user guidance", () => {
  assert.match(
    actionableProviderError(
      "Provider API error (400): This model's maximum context length is 16377 tokens."
    ),
    /conversation and its attached context exceed the provider's model limit/i
  );
  assert.match(
    actionableProviderError("Input token count exceeds the maximum number of tokens allowed."),
    /Remove older messages or attachments/i
  );
  assert.equal(
    actionableProviderError(
      '{"error":{"code":400,"message":"API key not valid","reason":"API_KEY_INVALID"}}'
    ),
    "The provider rejected this API key. Check the key and selected provider in Customize → Providers, then verify the connection."
  );
  assert.equal(
    actionableProviderError("Provider API error: overloaded_error: Overloaded"),
    "The provider is temporarily unavailable. Retry in a moment or check the provider’s status page."
  );
  assert.equal(
    actionableProviderError("Provider API error: rate_limit_error: Too many requests"),
    "The provider rate limit or quota was reached. Wait briefly, check your provider quota and billing, then retry."
  );
  assert.match(
    actionableProviderError("Provider URL cannot resolve to a private or local network address."),
    /configured provider endpoint URL is invalid or points to a restricted local network address/i
  );
});

test("text-only requests exceeding the catalog context budget stop before provider dispatch", async (t) => {
  let fetchCalled = false;
  t.mock.method(globalThis, "fetch", async () => {
    fetchCalled = true;
    return new Response("unexpected provider call", { status: 500 });
  });
  const params = {
    modelId: "openrouter-flint-v1-free",
    messages: [{ role: "user" as const, content: "x".repeat(260_593) }],
    systemInstruction: "",
    effort: "low",
    injectedApiKey: "sk-or-v1-test-key",
  };

  await assert.rejects(generateMultiProviderChat(params), /exceeds the model context window/);
  await assert.rejects(
    generateMultiProviderChatStream(params, () => assert.fail("No output should be emitted")),
    /exceeds the model context window/
  );
  assert.equal(fetchCalled, false);
});

test("OpenAI-compatible generation sends the selected model and returns provider content", async (t) => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: input instanceof Request ? input.url : String(input), init });
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "compat reply" } }],
        usage: { prompt_tokens: 17, completion_tokens: 5, total_tokens: 22 },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const result = await generateMultiProviderChat({
    modelId: "deepseek-v4.1-flash",
    messages: [{ role: "user", content: "hello" }],
    systemInstruction: "Be concise.",
    injectedApiKey: "test-provider-key",
    injectedBaseUrl: "https://1.1.1.1/v1",
  });

  assert.equal(result.text, "compat reply");
  assert.equal(result.providerUsed, "deepseek");
  assert.equal(result.modelUsed, "deepseek-flash");
  assert.deepEqual(result.usage, { inputTokens: 17, outputTokens: 5, totalTokens: 22 });
  assert.equal(requests.length, 1);
  assert.equal(requests[0]!.url, "https://1.1.1.1/v1/chat/completions");
  assert.equal(
    new Headers(requests[0]!.init?.headers).get("authorization"),
    "Bearer test-provider-key"
  );
  const body = JSON.parse(String(requests[0]!.init?.body)) as {
    model: string;
    max_tokens: number;
    reasoning_effort: string;
    thinking: { type: string };
    messages: Array<{ role: string; content: string }>;
  };
  assert.equal(body.model, "deepseek-flash");
  assert.equal(body.reasoning_effort, "high");
  assert.deepEqual(body.thinking, { type: "enabled" });
  assert.ok(Number.isInteger(body.max_tokens) && body.max_tokens > 0);
  assert.deepEqual(body.messages, [
    { role: "system", content: "Be concise." },
    { role: "user", content: "hello" },
  ]);
});

test("an empty successful provider response is surfaced as an error, never fallback text", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: "   " } }] }), {
      headers: { "Content-Type": "application/json" },
    })
  );

  await assert.rejects(
    generateMultiProviderChat({
      modelId: "deepseek-v4.1-flash",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "test-provider-key",
      injectedBaseUrl: "https://1.1.1.1/v1",
    }),
    /EMPTY_PROVIDER_RESPONSE:deepseek/
  );
  assert.match(
    actionableProviderError("EMPTY_PROVIDER_RESPONSE:deepseek:empty"),
    /selected provider returned an empty response/i
  );
});

test("OpenAI-compatible provider routing preserves each provider and model request", async (t) => {
  const cases = [
    { modelId: "gpt-6-astra", provider: "openai", upstreamModel: "gpt-6-astra" },
    {
      modelId: "kimi-k3.1-pro",
      provider: "kimi",
      upstreamModel: "kimi-k3.1-pro",
      effort: "high",
    },
    {
      modelId: "qwen3.8-max",
      provider: "qwen",
      upstreamModel: "qwen3.8-max",
      effort: "medium",
    },
    { modelId: "grok-4.7", provider: "xai", upstreamModel: "grok-4.7", effort: "medium" },
    {
      modelId: "custom-model",
      customModel: "vendor/custom-chat-model",
      customProvider: "custom" as const,
      provider: "custom",
      upstreamModel: "vendor/custom-chat-model",
    },
  ];
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: input instanceof Request ? input.url : String(input), init });
    return new Response(JSON.stringify({ choices: [{ message: { content: "provider reply" } }] }), {
      headers: { "Content-Type": "application/json" },
    });
  });

  for (const entry of cases) {
    const result = await generateMultiProviderChat({
      modelId: entry.modelId,
      ...(entry.customModel ? { customModel: entry.customModel } : {}),
      ...(entry.customProvider ? { customProvider: entry.customProvider } : {}),
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: `key-for-${entry.provider}`,
      injectedBaseUrl: "https://1.1.1.1/compatible/v1",
    });

    const request = requests.at(-1)!;
    assert.equal(result.text, "provider reply");
    assert.equal(result.providerUsed, entry.provider);
    assert.equal(result.modelUsed, entry.upstreamModel);
    assert.equal(request.url, "https://1.1.1.1/compatible/v1/chat/completions");
    assert.equal(
      new Headers(request.init?.headers).get("authorization"),
      `Bearer key-for-${entry.provider}`
    );

    const body = JSON.parse(String(request.init?.body)) as Record<string, unknown>;
    assert.equal(body.model, entry.upstreamModel);
    if (entry.provider === "openai") {
      assert.equal(typeof body.reasoning_effort, "string");
      assert.ok(Number.isInteger(body.max_completion_tokens));
      assert.equal("max_tokens" in body, false);
    } else if ("effort" in entry) {
      assert.equal(body.reasoning_effort, entry.effort);
      assert.ok(Number.isInteger(body.max_tokens));
    } else {
      assert.equal(body.temperature, 0.2);
      assert.ok(Number.isInteger(body.max_tokens));
    }
  }

  assert.equal(requests.length, cases.length);
});

test("streaming provider adapters apply the selected native effort", async (t) => {
  const requests: Array<{ model: string; body: Record<string, unknown> }> = [];
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ model: String(body.model), body });
    return chunkedSseResponse([
      'data: {"choices":[{"delta":{"content":"reply"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
  });

  const cases = [
    { modelId: "deepseek-v4.1-flash", effort: "Medium", mapped: "high" },
    { modelId: "deepseek-v4.1-flash", effort: "Max", mapped: "max" },
    { modelId: "kimi-k3.1-pro", effort: "Low", mapped: "low" },
    { modelId: "kimi-k3.1-pro", effort: "Max", mapped: "max" },
    { modelId: "qwen3.8-max", effort: "Low", mapped: "low" },
    { modelId: "qwen3.8-max", effort: "Medium", mapped: "medium" },
    { modelId: "qwen3.8-max", effort: "High", mapped: "xhigh" },
    { modelId: "grok-4.7", effort: "Low", mapped: "low" },
    { modelId: "grok-4.7", effort: "Medium", mapped: "medium" },
    { modelId: "grok-4.7", effort: "High", mapped: "high" },
    { modelId: "grok-4.7", effort: "Extra", mapped: "xhigh" },
    { modelId: "openrouter-nemotron-3-ultra-free", effort: "Medium", mapped: "medium" },
    { modelId: "openrouter-nemotron-3-ultra-free", effort: "High", mapped: "high" },
  ] as const;

  for (const entry of cases) {
    await generateMultiProviderChatStream(
      {
        modelId: entry.modelId,
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "provider-fixture-token",
        effort: entry.effort,
      },
      () => undefined
    );
  }

  assert.deepEqual(
    requests.map(({ body }) => ({ model: body.model, effort: body.reasoning_effort })),
    cases.map((entry) => ({
      model:
        entry.modelId === "deepseek-v4.1-flash"
          ? "deepseek-flash"
          : entry.modelId === "openrouter-nemotron-3-ultra-free"
            ? "nvidia/nemotron-3-ultra-550b-a55b:free"
            : entry.modelId,
      effort: entry.mapped,
    }))
  );
  assert.ok(requests[0]?.body.thinking);
});

test("Anthropic generation uses Messages API credentials and returns text content", async (t) => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: input instanceof Request ? input.url : String(input), init });
    return new Response(
      JSON.stringify({
        content: [{ type: "text", text: "claude reply" }],
        usage: { input_tokens: 19, output_tokens: 4 },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const result = await generateMultiProviderChat({
    modelId: "claude-opus-5.5",
    messages: [{ role: "user", content: "hello" }],
    systemInstruction: "Be concise.",
    injectedApiKey: "enterprise-token",
    injectedBaseUrl: "https://1.1.1.1/v1",
  });

  assert.deepEqual(result, {
    text: "claude reply",
    modelUsed: "claude-opus-5-5",
    providerUsed: "anthropic",
    usage: { inputTokens: 19, outputTokens: 4 },
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0]!.url, "https://1.1.1.1/v1/messages");
  const headers = new Headers(requests[0]!.init?.headers);
  assert.equal(headers.get("x-api-key"), "enterprise-token");
  assert.equal(headers.get("anthropic-version"), "2023-06-01");
  const body = JSON.parse(String(requests[0]!.init?.body)) as {
    model: string;
    system: string;
    max_tokens: number;
    messages: Array<{ role: string; content: string }>;
  };
  assert.equal(body.model, "claude-opus-5-5");
  assert.equal(body.system, "Be concise.");
  assert.ok(Number.isInteger(body.max_tokens) && body.max_tokens > 0);
  assert.deepEqual(body.messages, [{ role: "user", content: "hello" }]);
});

test("Anthropic non-streaming requests forward all advertised effort levels for every catalog model", async (t) => {
  const bodies: Array<Record<string, unknown>> = [];
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(JSON.stringify({ content: [{ type: "text", text: "Claude reply" }] }), {
      headers: { "Content-Type": "application/json" },
    });
  });

  const models = getChatModelsForProvider("anthropic");
  const efforts = ["Low", "Medium", "High", "Extra", "Max"] as const;
  for (const model of models) {
    for (const effort of efforts) {
      await generateMultiProviderChat({
        modelId: model.id,
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "anthropic-fixture-token",
        effort,
      });
    }
  }
  assert.deepEqual(
    bodies.map((body) => (body.output_config as { effort: string }).effort),
    models.flatMap(() => efforts.map((effort) => effort === "Extra" ? "xhigh" : effort.toLowerCase()))
  );
  assert.ok(bodies.every((body) => body.max_tokens === 128000));
});

test("Google generation sends Gemini generateContent and returns candidate text", async (t) => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: input instanceof Request ? input.url : String(input), init });
    return new Response(
      JSON.stringify({
        candidates: [{ content: { role: "model", parts: [{ text: "gemini reply" }] } }],
        usageMetadata: {
          promptTokenCount: 23,
          candidatesTokenCount: 6,
          totalTokenCount: 29,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const result = await generateMultiProviderChat({
    modelId: "gemini-3.8-flash",
    messages: [{ role: "user", content: "hello" }],
    systemInstruction: "Be concise.",
    injectedApiKey: "google-enterprise-token",
    injectedBaseUrl: "https://1.1.1.1/v1beta",
  });

  assert.deepEqual(result, {
    text: "gemini reply",
    modelUsed: "gemini-3.8-flash",
    providerUsed: "google",
    usage: { inputTokens: 23, outputTokens: 6, totalTokens: 29 },
  });
  assert.equal(requests.length, 1);
  const requestUrl = new URL(requests[0]!.url);
  assert.match(requestUrl.pathname, /\/models\/gemini-3\.8-flash:generateContent$/);
  assert.equal(
    new Headers(requests[0]!.init?.headers).get("x-goog-api-key"),
    "google-enterprise-token"
  );
  const body = JSON.parse(String(requests[0]!.init?.body)) as {
    systemInstruction: { parts: Array<{ text: string }> };
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    generationConfig: { maxOutputTokens: number };
  };
  assert.deepEqual(body.systemInstruction.parts, [{ text: "Be concise." }]);
  assert.deepEqual(body.contents, [{ role: "user", parts: [{ text: "hello" }] }]);
  assert.ok(
    Number.isInteger(body.generationConfig.maxOutputTokens) &&
      body.generationConfig.maxOutputTokens > 0
  );
});

test("Google generation forwards Low, Medium, and High effort to the selected model", async (t) => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: input instanceof Request ? input.url : String(input),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return new Response(
      JSON.stringify({
        candidates: [{ content: { role: "model", parts: [{ text: "Gemini reply" }] } }],
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const models = getChatModelsForProvider("google");
  const efforts = ["Low", "Medium", "High"] as const;
  for (const model of models) {
    for (const effort of efforts) {
      await generateMultiProviderChat({
        modelId: model.id,
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "google-enterprise-token",
        effort,
      });
    }
  }

  assert.deepEqual(
    requests.map(({ url, body }) => {
      const generationConfig = body.generationConfig as {
        maxOutputTokens: number;
        thinkingConfig: { thinkingLevel: string };
      };
      return {
        model: new URL(url).pathname,
        thinkingLevel: generationConfig.thinkingConfig.thinkingLevel,
        maxOutputTokens: generationConfig.maxOutputTokens,
      };
    }),
    models.flatMap((model) =>
      efforts.map((effort) => ({
        model: `/v1beta/models/${model.upstreamModelId}:generateContent`,
        thinkingLevel: effort.toUpperCase(),
        maxOutputTokens: 65536,
      }))
    )
  );
});

test("OpenAI generation forwards all advertised effort levels for every catalog model", async (t) => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: input instanceof Request ? input.url : String(input),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "OpenAI reply" } }] }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const models = getChatModelsForProvider("openai");
  const efforts = ["Low", "Medium", "High", "Extra", "Max"] as const;
  for (const model of models) {
    for (const effort of efforts) {
      await generateMultiProviderChat({
        modelId: model.id,
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "openai-fixture-token",
        effort,
      });
    }
  }

  assert.deepEqual(
    requests.map(({ url, body }) => ({
      url,
      model: body.model,
      reasoningEffort: body.reasoning_effort,
      maxCompletionTokens: body.max_completion_tokens,
    })),
    models.flatMap((model) =>
      efforts.map((effort) => ({
        url: "https://api.openai.com/v1/chat/completions",
        model: model.upstreamModelId,
        reasoningEffort: effort === "Extra" ? "xhigh" : effort.toLowerCase(),
        maxCompletionTokens: 128000,
      }))
    )
  );
});

test("streaming OpenAI adapter forwards all advertised effort levels for every catalog model", async (t) => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ url, body });
    return chunkedSseResponse([
      'data: {"choices":[{"delta":{"content":"reply"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
  });

  const models = getChatModelsForProvider("openai");
  const efforts = ["Low", "Medium", "High", "Extra", "Max"] as const;
  for (const model of models) {
    for (const effort of efforts) {
      await generateMultiProviderChatStream(
        {
          modelId: model.id,
          messages: [{ role: "user", content: "hello" }],
          systemInstruction: "Be concise.",
          injectedApiKey: "openai-fixture-token",
          effort,
        },
        () => undefined
      );
    }
  }

  assert.deepEqual(
    requests.map(({ body }) => ({
      effort: body.reasoning_effort,
      maxTokens: body.max_completion_tokens,
    })),
    models.flatMap(() =>
      efforts.map((effort) => ({
        effort: effort === "Extra" ? "xhigh" : effort.toLowerCase(),
        maxTokens: 128000,
      }))
    )
  );
});

test("streaming Gemini adapter sends every advertised thinking level for every catalog model", async (t) => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ url, body });
    return chunkedSseResponse([
      'data: {"candidates":[{"content":{"parts":[{"text":"reply"}]}}]}\n\n',
    ]);
  });

  const models = getChatModelsForProvider("google");
  const efforts = ["Low", "Medium", "High"] as const;
  for (const model of models) {
    for (const effort of efforts) {
      await generateMultiProviderChatStream(
        {
          modelId: model.id,
          messages: [{ role: "user", content: "hello" }],
          systemInstruction: "Be concise.",
          injectedApiKey: "google-fixture-token",
          effort,
        },
        () => undefined
      );
    }
  }

  assert.deepEqual(
    requests.map(({ url, body }) => ({
      url: new URL(url).pathname,
      thinkingLevel: (body.generationConfig as { thinkingConfig: { thinkingLevel: string } })
        .thinkingConfig.thinkingLevel,
      maxOutputTokens: (body.generationConfig as { maxOutputTokens: number }).maxOutputTokens,
    })),
    models.flatMap((model) =>
      efforts.map((effort) => ({
        url: `/v1beta/models/${model.upstreamModelId}:streamGenerateContent`,
        thinkingLevel: effort.toUpperCase(),
        maxOutputTokens: 65536,
      }))
    )
  );
});

test("effort settings map to each provider's documented request format", async (t) => {
  const requests: Array<Record<string, unknown>> = [];
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(JSON.stringify({ choices: [{ message: { content: "reply" } }] }), {
      headers: { "Content-Type": "application/json" },
    });
  });

  const cases = [
    { modelId: "deepseek-v4.1-flash", effort: "Low", effortValue: "low", thinking: true },
    { modelId: "deepseek-v4.1-flash", effort: "Medium", effortValue: "high", thinking: true },
    { modelId: "deepseek-v4.1-flash", effort: "High", effortValue: "high", thinking: true },
    { modelId: "deepseek-v4.1-flash", effort: "Extra", effortValue: "high", thinking: true },
    { modelId: "deepseek-v4.1-flash", effort: "Max", effortValue: "max", thinking: true },
    { modelId: "kimi-k3.1-pro", effort: "Low", effortValue: "low" },
    { modelId: "kimi-k3.1-pro", effort: "Medium", effortValue: "high" },
    { modelId: "kimi-k3.1-pro", effort: "High", effortValue: "high" },
    { modelId: "kimi-k3.1-pro", effort: "Max", effortValue: "max" },
    { modelId: "qwen3.8-max", effort: "Low", effortValue: "low" },
    { modelId: "qwen3.8-max", effort: "Medium", effortValue: "medium" },
    { modelId: "qwen3.8-max", effort: "High", effortValue: "xhigh" },
    { modelId: "grok-4.7", effort: "Low", effortValue: "low" },
    { modelId: "grok-4.7", effort: "Medium", effortValue: "medium" },
    { modelId: "grok-4.7", effort: "High", effortValue: "high" },
    { modelId: "grok-4.7", effort: "Extra", effortValue: "xhigh" },
    { modelId: "openrouter-nemotron-3-ultra-free", effort: "Medium", effortValue: "medium" },
    { modelId: "openrouter-nemotron-3-ultra-free", effort: "High", effortValue: "high" },
  ] as const;
  for (const entry of cases) {
    await generateMultiProviderChat({
      modelId: entry.modelId,
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "provider-fixture-token",
      effort: entry.effort,
    });
  }

  for (const [index, entry] of cases.entries()) {
    assert.equal(requests[index]?.reasoning_effort, entry.effortValue);
    if ("thinking" in entry) assert.deepEqual(requests[index]?.thinking, { type: "enabled" });
  }
  assert.equal(
    requests.find((body) => body.model === "nvidia/nemotron-3-ultra-550b-a55b:free")?.max_tokens,
    65_536
  );

  await generateMultiProviderChat({
    modelId: "openrouter-flint-v1-free",
    messages: [{ role: "user", content: "hello" }],
    systemInstruction: "Be concise.",
    injectedApiKey: "openrouter-fixture-token",
    effort: "High",
  });
  const unsupportedBody = requests.at(-1)!;
  assert.equal(unsupportedBody.reasoning_effort, undefined);
  assert.equal(unsupportedBody.max_tokens, 2048);
});

test("custom models without declared native effort support do not imply it was applied", async (t) => {
  const requests: Array<Record<string, unknown>> = [];
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(JSON.stringify({ choices: [{ message: { content: "reply" } }] }), {
      headers: { "Content-Type": "application/json" },
    });
  });

  await generateMultiProviderChat({
    modelId: "custom-model",
    customProvider: "openai",
    customModel: "vendor/custom-reasoning-model",
    messages: [{ role: "user", content: "hello" }],
    systemInstruction: "Be concise.",
    injectedApiKey: "custom-fixture-token",
    injectedBaseUrl: "https://1.1.1.1/v1",
    effort: "High",
  });

  assert.equal(requests[0]?.reasoning_effort, undefined);
  assert.equal(requests[0]?.max_tokens, 2048);
});

test("Google generation does not retry a cancelled request with a fallback model", async (t) => {
  const controller = new AbortController();
  let requestCount = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requestCount += 1;
    controller.abort(new DOMException("The operation was aborted.", "AbortError"));
    return new Response(JSON.stringify({ error: { message: "Selected model unavailable" } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  });

  await assert.rejects(
    generateMultiProviderChat({
      modelId: "gemini-4-argon",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "google-enterprise-token",
      injectedBaseUrl: "https://1.1.1.1/v1beta",
      signal: controller.signal,
    })
  );

  assert.equal(requestCount, 1);
});

test("Google generation does not retry another model after an authentication error", async (t) => {
  let requestCount = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requestCount += 1;
    return new Response(JSON.stringify({ error: { message: "Invalid API key" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  });

  await assert.rejects(
    generateMultiProviderChat({
      modelId: "gemini-4-argon",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "invalid-google-key",
      injectedBaseUrl: "https://1.1.1.1/v1beta",
    })
  );

  assert.equal(requestCount, 1);
});

test("OpenAI-compatible streaming delivers fragmented SSE deltas and final content", async (t) => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = input instanceof Request ? input.url : String(input);
    requestInit = init;
    return chunkedSseResponse([
      'data: {"choices":[{"delta":{"content":"Hel',
      'lo"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
  });

  const deltas: string[] = [];
  const result = await generateMultiProviderChatStream(
    {
      modelId: "deepseek-v4.1-flash",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "test-provider-key",
      injectedBaseUrl: "https://1.1.1.1/v1",
    },
    (delta) => deltas.push(delta)
  );

  assert.equal(requestUrl, "https://1.1.1.1/v1/chat/completions");
  assert.equal(JSON.parse(String(requestInit?.body)).stream, true);
  assert.deepEqual(deltas, ["Hello", " world"]);
  assert.deepEqual(result, {
    text: "Hello world",
    modelUsed: "deepseek-flash",
    providerUsed: "deepseek",
  });
});

test("Anthropic streaming extracts text_delta events and returns accumulated content", async (t) => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = input instanceof Request ? input.url : String(input);
    requestInit = init;
    return chunkedSseResponse([
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"',
      '}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":" there"}}\n\n',
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
    ]);
  });

  const deltas: string[] = [];
  const result = await generateMultiProviderChatStream(
    {
      modelId: "claude-opus-5.5",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "enterprise-token",
      injectedBaseUrl: "https://1.1.1.1/v1",
    },
    (delta) => deltas.push(delta)
  );

  assert.equal(requestUrl, "https://1.1.1.1/v1/messages");
  assert.equal(new Headers(requestInit?.headers).get("x-api-key"), "enterprise-token");
  assert.equal(JSON.parse(String(requestInit?.body)).stream, true);
  assert.deepEqual(deltas, ["Hi", " there"]);
  assert.deepEqual(result, {
    text: "Hi there",
    modelUsed: "claude-opus-5-5",
    providerUsed: "anthropic",
  });
});

test("Anthropic streaming requests forward all advertised effort levels for every catalog model", async (t) => {
  const bodies: Array<Record<string, unknown>> = [];
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return chunkedSseResponse([
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"reply"}}\n\n',
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
    ]);
  });

  const models = getChatModelsForProvider("anthropic");
  const efforts = ["Low", "Medium", "High", "Extra", "Max"] as const;
  for (const model of models) {
    for (const effort of efforts) {
      await generateMultiProviderChatStream(
        {
          modelId: model.id,
          messages: [{ role: "user", content: "hello" }],
          systemInstruction: "Be concise.",
          injectedApiKey: "anthropic-fixture-token",
          effort,
        },
        () => undefined
      );
    }
  }
  assert.deepEqual(
    bodies.map((body) => (body.output_config as { effort: string }).effort),
    models.flatMap(() => efforts.map((effort) => effort === "Extra" ? "xhigh" : effort.toLowerCase()))
  );
  assert.ok(bodies.every((body) => body.max_tokens === 128000));
});

test("Google streaming returns generated text and emits incremental candidate content", async (t) => {
  let requestUrl = "";
  let requestHeaders: Headers | undefined;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = input instanceof Request ? input.url : String(input);
    requestHeaders = new Headers(init?.headers);
    return chunkedSseResponse([
      'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"Gem"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"ini"}]}}]}\n\n',
    ]);
  });

  const deltas: string[] = [];
  const result = await generateMultiProviderChatStream(
    {
      modelId: "gemini-3.8-flash",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "google-enterprise-token",
      injectedBaseUrl: "https://1.1.1.1/v1beta",
    },
    (delta) => deltas.push(delta)
  );

  assert.match(requestUrl, /\/models\/gemini-3\.8-flash:streamGenerateContent/);
  assert.equal(requestHeaders?.get("x-goog-api-key"), "google-enterprise-token");
  assert.deepEqual(deltas, ["Gem", "ini"]);
  assert.deepEqual(result, {
    text: "Gemini",
    modelUsed: "gemini-3.8-flash",
    providerUsed: "google",
  });
});

test("Google streaming does not switch models when the selected model is unavailable", async (t) => {
  const requests: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    requests.push(url);
    if (requests.length === 1) {
      return new Response(
        JSON.stringify({
          error: {
            message: "models/gemini-4-argon is not found for API version v1beta",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return chunkedSseResponse([
      'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"fallback reply"}]}}]}\n\n',
    ]);
  });

  await assert.rejects(
    generateMultiProviderChatStream(
      {
        modelId: "gemini-4-argon",
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "google-enterprise-token",
        injectedBaseUrl: "https://1.1.1.1/v1beta",
      },
      () => assert.fail("Unavailable selected model must not produce fallback output")
    )
  );

  assert.equal(requests.length, 1);
  assert.match(requests[0]!, /\/models\/gemini-4-argon:streamGenerateContent/);
});

test("Google streaming does not retry a request after it has emitted text", async (t) => {
  let requestCount = 0;
  const encoder = new TextEncoder();
  t.mock.method(globalThis, "fetch", async () => {
    requestCount += 1;
    let emittedText = false;
    return new Response(
      new ReadableStream<Uint8Array>({
        pull(controller) {
          if (!emittedText) {
            emittedText = true;
            controller.enqueue(
              encoder.encode(
                'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"partial"}]}}]}\n\n'
              )
            );
          } else {
            controller.error(new Error("Provider stream interrupted"));
          }
        },
      }),
      { headers: { "Content-Type": "text/event-stream" } }
    );
  });

  const deltas: string[] = [];
  await assert.rejects(
    generateMultiProviderChatStream(
      {
        modelId: "gemini-4-argon",
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "google-enterprise-token",
        injectedBaseUrl: "https://1.1.1.1/v1beta",
      },
      (delta) => deltas.push(delta)
    ),
    /Provider stream interrupted/
  );

  assert.equal(requestCount, 1);
  assert.deepEqual(deltas, ["partial"]);
});

test("Google streaming does not replace a caller-supplied model after failure", async (t) => {
  let requestCount = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requestCount += 1;
    return new Response(JSON.stringify({ error: { message: "Custom model is unavailable" } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  });

  await assert.rejects(
    generateMultiProviderChatStream(
      {
        modelId: "custom-model",
        customModel: "private-gemini-endpoint",
        customProvider: "google",
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "google-enterprise-token",
        injectedBaseUrl: "https://1.1.1.1/v1beta",
      },
      () => assert.fail("No deltas should be emitted for an HTTP error response")
    )
  );

  assert.equal(requestCount, 1);
});

test("Google streaming does not retry a cancelled generation", async (t) => {
  const controller = new AbortController();
  let requestCount = 0;
  let resolveRequestStarted: (() => void) | undefined;
  const requestStarted = new Promise<void>((resolve) => {
    resolveRequestStarted = resolve;
  });
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestCount += 1;
    resolveRequestStarted?.();
    return new Promise<Response>((_resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(init.signal.reason);
        return;
      }
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    });
  });

  const generation = generateMultiProviderChatStream(
    {
      modelId: "gemini-4-argon",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "google-enterprise-token",
      injectedBaseUrl: "https://1.1.1.1/v1beta",
      signal: controller.signal,
    },
    () => assert.fail("No deltas should be emitted after cancellation")
  );

  await requestStarted;
  controller.abort(new DOMException("The operation was aborted.", "AbortError"));
  await assert.rejects(generation, { name: "AbortError" });
  assert.equal(requestCount, 1);
});

test("streaming provider errors redact echoed keys and become safe user guidance", async (t) => {
  const apiKey = "sk-ant-api03-12345678901234567890";
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ error: `Invalid key api_key=${apiKey}` }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
  );

  await assert.rejects(
    generateMultiProviderChatStream(
      {
        modelId: "claude-opus-5.5",
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: apiKey,
        injectedBaseUrl: "https://1.1.1.1/v1",
      },
      () => assert.fail("No deltas should be emitted for an HTTP error response")
    ),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Provider API error \(401\)/);
      assert.ok(!error.message.includes(apiKey));
      assert.equal(
        actionableProviderError(error.message),
        "The provider rejected this API key. Check the key and selected provider in Customize → Providers, then verify the connection."
      );
      return true;
    }
  );
});

test("streaming surfaces provider error events returned with HTTP 200", async (t) => {
  const apiKey = "sk-proj-stream-secret";
  t.mock.method(globalThis, "fetch", async () =>
    chunkedSseResponse([
      `data: ${JSON.stringify({
        error: { message: `Rate limit reached api_key=${apiKey}`, code: 429 },
      })}\n\n`,
    ])
  );

  await assert.rejects(
    generateMultiProviderChatStream(
      {
        modelId: "gpt-6-astra",
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: apiKey,
        injectedBaseUrl: "https://1.1.1.1/v1",
      },
      () => assert.fail("No deltas should be emitted for a provider error event")
    ),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Provider API error \(429\)/);
      assert.ok(!error.message.includes(apiKey));
      assert.match(actionableProviderError(error.message), /rate limit or quota/);
      return true;
    }
  );
});

test("Anthropic error events in a successful SSE response reject the stream", async (t) => {
  let cancelled = false;
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'event: error\ndata: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}\n\n'
              )
            );
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } }
      )
  );

  await assert.rejects(
    generateMultiProviderChatStream(
      {
        modelId: "claude-opus-5.5",
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "anthropic-key",
        injectedBaseUrl: "https://1.1.1.1/v1",
      },
      () => assert.fail("No deltas should be emitted for a provider error event")
    ),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /overloaded_error: Overloaded/);
      assert.equal(classifyProviderFailure(error), "provider_unavailable");
      assert.equal(
        actionableProviderError(error.message),
        "The provider is temporarily unavailable. Retry in a moment or check the provider’s status page."
      );
      return true;
    }
  );
  assert.equal(cancelled, true);
});

test("streaming provider request forwards cancellation to the active fetch", async (t) => {
  const controller = new AbortController();
  let fetchSignal: AbortSignal | null | undefined;
  let resolveFetchStarted: (() => void) | undefined;
  const fetchStarted = new Promise<void>((resolve) => {
    resolveFetchStarted = resolve;
  });
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    fetchSignal = init?.signal;
    resolveFetchStarted?.();
    return new Promise<Response>((_resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(init.signal.reason);
        return;
      }
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    });
  });

  const generation = generateMultiProviderChatStream(
    {
      modelId: "deepseek-v4.1-flash",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "test-provider-key",
      injectedBaseUrl: "https://1.1.1.1/v1",
      signal: controller.signal,
    },
    () => assert.fail("No deltas should be emitted after cancellation")
  );

  await fetchStarted;
  controller.abort(new DOMException("The operation was aborted.", "AbortError"));

  await assert.rejects(generation, { name: "AbortError" });
  assert.equal(fetchSignal, controller.signal);
});

test("malformed provider SSE data fails clearly instead of returning an incomplete answer", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    chunkedSseResponse([
      'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
      'data: {"choices":[\n\n',
    ])
  );

  const deltas: string[] = [];
  await assert.rejects(
    generateMultiProviderChatStream(
      {
        modelId: "deepseek-v4.1-flash",
        messages: [{ role: "user", content: "hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "test-provider-key",
        injectedBaseUrl: "https://1.1.1.1/v1",
      },
      (delta) => deltas.push(delta)
    ),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Provider returned malformed streaming data.");
      assert.match(actionableProviderError(error.message), /unreadable response stream/i);
      return true;
    }
  );
  assert.deepEqual(deltas, ["partial"]);
});
