import { lookup } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import { Agent } from "undici";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  PROVIDER_CATALOG,
  MODEL_REGISTRY,
  getModelMeta,
  type ProviderId,
  type ChatMessage,
} from "@charan-interiors/contracts";
import { isValidApiKey } from "../../../platform/config/index.js";
import { logEvent } from "../../../platform/observability/logger.js";

export interface LlmGenerateParams {
  modelId: string;
  customModel?: string | undefined;
  messages: ChatMessage[];
  systemInstruction: string;
  effort?: string | undefined;
  injectedApiKey?: string | undefined;
  injectedBaseUrl?: string | undefined;
  customProvider?: ProviderId | undefined;
  signal?: AbortSignal | undefined;
}

export interface LlmGenerateResult {
  text: string;
  modelUsed: string;
  providerUsed: ProviderId;
}

export type LlmStreamEvent =
  { type: "token"; delta: string } | { type: "done"; result: LlmGenerateResult };

async function consumeSseResponse(
  response: Response,
  extract: (data: unknown) => string | null,
  onDelta: (delta: string) => void
): Promise<string> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Provider API error (${response.status}): ${body.slice(0, 1000) || response.statusText}`
    );
  }
  if (!response.body) throw new Error("Provider returned no streaming body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let full = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const events = pending.split(/\r?\n\r?\n/);
      pending = events.pop() || "";
      for (const event of events) {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!data || data === "[DONE]") continue;
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
        const delta = extract(parsed);
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  return full;
}

export async function generateMultiProviderChatStream(
  params: LlmGenerateParams,
  onDelta: (delta: string) => void
): Promise<LlmGenerateResult> {
  const { provider, upstreamModelId, apiKey, baseUrl } = resolveProviderCredentials(
    params.modelId,
    params.injectedApiKey,
    params.injectedBaseUrl,
    params.customModel,
    params.customProvider
  );
  const effort = resolveEffort(params.effort);
  const maxTokens = maxOutputTokensForEffort(effort);
  let text: string;
  const modelUsed = upstreamModelId;
  if (provider === "google") {
    const contents = params.messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { baseUrl, apiVersion: "", fetch: fetchProviderFromSdk },
    });
    const stream = await ai.models.generateContentStream({
      model: upstreamModelId,
      contents: `${contents}\n\nAssistant:`,
      config: {
        ...(params.signal ? { abortSignal: params.signal } : {}),
        maxOutputTokens: maxTokens,
        systemInstruction: params.systemInstruction,
        thinkingConfig: {
          thinkingLevel:
            effort === "low"
              ? ThinkingLevel.LOW
              : effort === "medium"
                ? ThinkingLevel.MEDIUM
                : ThinkingLevel.HIGH,
        },
      },
    });
    text = "";
    for await (const chunk of stream) {
      const delta = chunk.text || "";
      if (delta) {
        text += delta;
        onDelta(delta);
      }
    }
  } else if (provider === "anthropic") {
    const response = await fetchProvider(`${baseUrl.replace(/\/+$/, "")}/messages`, {
      method: "POST",
      ...(params.signal ? { signal: params.signal } : {}),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: upstreamModelId,
        max_tokens: maxTokens,
        stream: true,
        system: params.systemInstruction,
        messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    text = await consumeSseResponse(
      response,
      (data) => {
        const item = data as { type?: string; delta?: { type?: string; text?: string } };
        return item.type === "content_block_delta" && item.delta?.type === "text_delta"
          ? item.delta.text || null
          : null;
      },
      onDelta
    );
  } else {
    const response = await fetchProvider(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      ...(params.signal ? { signal: params.signal } : {}),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: upstreamModelId,
        stream: true,
        ...(provider === "openai"
          ? { reasoning_effort: resolveOpenAiEffort(effort), max_completion_tokens: maxTokens }
          : { temperature: 0.2, max_tokens: maxTokens }),
        messages: [
          { role: "system", content: params.systemInstruction },
          ...params.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    text = await consumeSseResponse(
      response,
      (data) => {
        const item = data as {
          choices?: Array<{ delta?: { content?: string | Array<{ text?: string }> } }>;
        };
        const content = item.choices?.[0]?.delta?.content;
        return typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content.map((part) => part.text || "").join("")
            : null;
      },
      onDelta
    );
  }
  return { text: text || "No response content returned.", modelUsed, providerUsed: provider };
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0] || address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    const mappedV4 = normalized.slice("::ffff:".length);
    if (isIP(mappedV4) === 4) return isPrivateAddress(mappedV4);
  }
  if (isIP(normalized) === 4) {
    const [a = 0, b = 0] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && [0, 2, 88, 168].includes(b)) ||
      (a === 198 && [18, 19, 51].includes(b)) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }
  return normalized === "::" || normalized === "::1" || /^(fc|fd|fe[89ab]|ff)/.test(normalized);
}

async function fetchProvider(url: string, init: RequestInit): Promise<Response> {
  const parsed = new URL(url);
  const hostAddress = parsed.hostname.replace(/^\[|\]$/g, "");
  if (parsed.protocol !== "https:") throw new Error("Provider URL must use HTTPS.");
  if (parsed.username || parsed.password)
    throw new Error("Provider URL must not contain credentials.");
  const addresses = isIP(hostAddress)
    ? [{ address: hostAddress, family: isIP(hostAddress) }]
    : await lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Provider URL cannot resolve to a private or local network address.");
  }
  const pinnedAddress = addresses[0]!;
  const pinnedLookup = ((
    _hostname: string,
    options: number | { all?: boolean } | undefined,
    callback: (...args: unknown[]) => void
  ) => {
    if (typeof options === "object" && options?.all) callback(null, [pinnedAddress]);
    else callback(null, pinnedAddress.address, pinnedAddress.family);
  }) as LookupFunction;
  const dispatcher = new Agent({ connect: { lookup: pinnedLookup } });
  let response: Response;
  try {
    response = await fetch(url, { ...init, redirect: "error", dispatcher } as RequestInit);
  } catch (error) {
    await dispatcher.close();
    throw error;
  }
  if (!response.body) {
    await dispatcher.close();
    return response;
  }
  const reader = response.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (chunk.done) {
          controller.close();
          await dispatcher.close();
        } else controller.enqueue(chunk.value);
      } catch (error) {
        controller.error(error);
        await dispatcher.close();
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        await dispatcher.close();
      }
    },
  });
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function fetchProviderFromSdk(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  const requestOptions =
    init ??
    (input instanceof Request
      ? {
          method: input.method,
          headers: input.headers,
          signal: input.signal,
          redirect: input.redirect,
          ...(input.body ? { body: input.body, duplex: "half" as const } : {}),
        }
      : {});
  return fetchProvider(url, requestOptions);
}

/** Chat generation accepts only a key supplied for this user/request. */
export function resolveProviderCredentials(
  modelId: string,
  injectedApiKey?: string,
  injectedBaseUrl?: string,
  customModel?: string,
  customProvider?: ProviderId
): {
  provider: ProviderId;
  upstreamModelId: string;
  apiKey: string;
  baseUrl: string;
} {
  if (!MODEL_REGISTRY[modelId]) {
    throw new Error(`UNKNOWN_MODEL:${modelId}:The requested model is not in the model catalog.`);
  }
  if (modelId === "custom-model" && !customModel?.trim()) {
    throw new Error("MISSING_CUSTOM_MODEL:Enter a model ID for the custom provider.");
  }
  const modelMeta = getModelMeta(modelId);
  const meta =
    modelId === "custom-model" && customModel
      ? {
          ...modelMeta,
          provider: customProvider || modelMeta.provider,
          upstreamModelId: customModel.trim(),
        }
      : modelMeta;
  const providerMeta = PROVIDER_CATALOG[meta.provider];

  // 1. Check client-supplied BYOK key
  if (isValidApiKey(injectedApiKey)) {
    return {
      provider: meta.provider,
      upstreamModelId: meta.upstreamModelId,
      apiKey: injectedApiKey.trim(),
      baseUrl: injectedBaseUrl?.trim() || providerMeta.defaultBaseUrl,
    };
  }

  throw new Error(
    `MISSING_API_KEY:${meta.provider}:No API key found for ${providerMeta.name} (${meta.name}). Please connect your ${providerMeta.name} API key in Customize → Providers or via the model selector.`
  );
}

/**
 * Live ping verification for a provider API key
 */
export async function verifyProviderKey(params: {
  provider: ProviderId;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
}): Promise<{
  valid: boolean;
  provider: ProviderId;
  latencyMs: number;
  message: string;
}> {
  const startMs = Date.now();
  const providerMeta = PROVIDER_CATALOG[params.provider];
  const sampleModelMap: Record<ProviderId, string> = {
    anthropic: "claude-opus-5.5",
    openai: "gpt-6-astra",
    google: "gemini-3.8-flash",
    deepseek: "deepseek-v4.1-flash",
    xai: "grok-4.7",
    zhipu: "glm-5.3",
    custom: "custom-model",
  };

  try {
    const creds = resolveProviderCredentials(
      sampleModelMap[params.provider],
      params.apiKey,
      params.baseUrl,
      params.provider === "custom" ? "openai/gpt-4o-mini" : undefined
    );

    if (params.provider === "google") {
      const ai = new GoogleGenAI({
        apiKey: creds.apiKey,
        httpOptions: {
          baseUrl: creds.baseUrl,
          apiVersion: "",
          fetch: fetchProviderFromSdk,
        },
      });
      await ai.models.generateContent({
        model: creds.upstreamModelId,
        contents: "Ping",
        config: { maxOutputTokens: 5 },
      });
    } else if (params.provider === "anthropic") {
      const endpoint = `${creds.baseUrl.replace(/\/+$/, "")}/messages`;
      const res = await fetchProvider(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": creds.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: creds.upstreamModelId,
          max_tokens: 4,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120) || res.statusText}`);
      }
    } else {
      const endpoint = `${creds.baseUrl.replace(/\/+$/, "")}/models`;
      const res = await fetchProvider(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }

    const latencyMs = Math.max(1, Date.now() - startMs);
    return {
      valid: true,
      provider: params.provider,
      latencyMs,
      message: `${providerMeta.name} key verified (${latencyMs}ms)`,
    };
  } catch (err: unknown) {
    const latencyMs = Math.max(1, Date.now() - startMs);
    const rawMsg = err instanceof Error ? err.message : "Verification failed";
    return {
      valid: false,
      provider: params.provider,
      latencyMs,
      message: rawMsg.replace(/^MISSING_API_KEY:[^:]+:/, ""),
    };
  }
}

function resolveEffort(effort?: string): "low" | "medium" | "high" | "xhigh" | "max" {
  switch (effort) {
    case "Low":
      return "low";
    case "Extra":
      return "xhigh";
    case "High":
      return "high";
    case "Max":
      return "max";
    case "Medium":
    default:
      return "medium";
  }
}

function resolveOpenAiEffort(effort: "low" | "medium" | "high" | "xhigh" | "max") {
  return effort === "max" ? "xhigh" : effort;
}

function maxOutputTokensForEffort(effort: "low" | "medium" | "high" | "xhigh" | "max") {
  return effort === "low" ? 1024 : effort === "medium" ? 2048 : effort === "high" ? 4096 : 8192;
}

/**
 * Calls Anthropic Messages API (https://api.anthropic.com/v1/messages)
 */
async function callAnthropic(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  systemInstruction: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens: number;
}): Promise<string> {
  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/messages`;
  const response = await fetchProvider(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens,
      thinking: { type: "adaptive" },
      output_config: { effort: params.effort },
      system: params.systemInstruction,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Anthropic API error (${response.status}): ${errBody || response.statusText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const textBlock = data.content?.find((c) => c.type === "text");
  return textBlock?.text || "No response content returned from Anthropic.";
}

/**
 * Calls OpenAI-compatible Chat Completions API (OpenAI, DeepSeek, xAI Grok, Zhipu GLM, OpenRouter, Ollama)
 */
async function callOpenAICompatible(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  systemInstruction: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens: number;
  provider: ProviderId;
}): Promise<string> {
  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const response = await fetchProvider(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      ...(params.provider === "openai"
        ? {
            reasoning_effort: resolveOpenAiEffort(params.effort),
            max_completion_tokens: params.maxTokens,
          }
        : { temperature: 0.2, max_tokens: params.maxTokens }),
      messages: [
        { role: "system", content: params.systemInstruction },
        ...params.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Provider API error (${response.status}): ${errBody || response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || "No response content returned.";
}

/**
 * Calls Google Gemini API via @google/genai with the injected key or default server fallback
 */
async function callGoogleGemini(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  systemInstruction: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  allowFallback: boolean;
}): Promise<{ text: string; modelUsed: string }> {
  const contents = params.messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const ai = new GoogleGenAI({
    apiKey: params.apiKey,
    httpOptions: {
      baseUrl: params.baseUrl,
      apiVersion: "",
      fetch: fetchProviderFromSdk,
    },
  });
  const fallbackPool = params.allowFallback
    ? [...new Set([params.model, "gemini-3.8-flash"])]
    : [params.model];

  let lastErr: unknown = null;
  for (const candidateModel of fallbackPool) {
    try {
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents: `${contents}\n\nAssistant:`,
        config: {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: maxOutputTokensForEffort(params.effort),
          thinkingConfig: {
            thinkingLevel:
              params.effort === "xhigh" || params.effort === "max"
                ? ThinkingLevel.HIGH
                : params.effort === "high"
                  ? ThinkingLevel.HIGH
                  : params.effort === "medium"
                    ? ThinkingLevel.MEDIUM
                    : ThinkingLevel.LOW,
          },
        },
      });
      return {
        text: response.text || "No response received from Gemini.",
        modelUsed: candidateModel,
      };
    } catch (err) {
      lastErr = err;
      logEvent(
        `Gemini model ${candidateModel} failed${candidateModel === fallbackPool.at(-1) ? "." : ", trying next fallback..."}`
      );
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gemini request failed.");
}

/**
 * Unified Multi-Provider Generation Dispatcher
 */
export async function generateMultiProviderChat(
  params: LlmGenerateParams
): Promise<LlmGenerateResult> {
  const { provider, upstreamModelId, apiKey, baseUrl } = resolveProviderCredentials(
    params.modelId,
    params.injectedApiKey,
    params.injectedBaseUrl,
    params.customModel,
    params.customProvider
  );

  const effort = resolveEffort(params.effort);
  const maxTokens = maxOutputTokensForEffort(effort);

  logEvent(`Dispatching BYOK chat -> provider=${provider} model=${upstreamModelId}`);

  if (provider === "anthropic") {
    const text = await callAnthropic({
      apiKey,
      baseUrl,
      model: upstreamModelId,
      messages: params.messages,
      systemInstruction: params.systemInstruction,
      effort,
      maxTokens,
    });
    return { text, modelUsed: upstreamModelId, providerUsed: provider };
  }

  if (provider === "google") {
    const { text, modelUsed } = await callGoogleGemini({
      apiKey,
      baseUrl,
      model: upstreamModelId,
      messages: params.messages,
      systemInstruction: params.systemInstruction,
      effort,
      allowFallback: params.modelId !== "custom-model",
    });
    return { text, modelUsed, providerUsed: provider };
  }

  // OpenAI, DeepSeek, xAI Grok, Zhipu GLM, Custom / OpenRouter / Ollama
  const text = await callOpenAICompatible({
    apiKey,
    baseUrl,
    model: upstreamModelId,
    messages: params.messages,
    systemInstruction: params.systemInstruction,
    effort,
    maxTokens,
    provider,
  });

  return { text, modelUsed: upstreamModelId, providerUsed: provider };
}
