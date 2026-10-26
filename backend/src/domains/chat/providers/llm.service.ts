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
import { logEvent, redactSecretsString } from "../../../platform/observability/logger.js";

export interface LlmGenerateParams {
  modelId: string;
  customModel?: string | undefined;
  messages: ChatMessage[];
  imagePages?: Array<{ pageNumber: number; mimeType: string; base64Data: string }> | undefined;
  images?: Array<{ name?: string | undefined; mimeType: string; base64Data: string }> | undefined;
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
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined;
}

export type LlmStreamEvent =
  { type: "token"; delta: string } | { type: "done"; result: LlmGenerateResult };

function getSseProviderError(
  data: unknown,
  eventType: string
): { message: string; status?: number } | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;
  const error = payload.error;
  if (!error && eventType !== "error" && payload.type !== "error") return null;

  const errorPayload =
    error && typeof error === "object" ? (error as Record<string, unknown>) : payload;
  const message =
    typeof error === "string"
      ? error
      : typeof errorPayload.message === "string"
        ? errorPayload.message
        : JSON.stringify(errorPayload);
  const code = errorPayload.code ?? errorPayload.status ?? payload.code ?? payload.status;
  const status = typeof code === "number" && code >= 400 && code <= 599 ? code : undefined;
  const type = typeof errorPayload.type === "string" ? errorPayload.type : undefined;
  const fullMessage = type && !message.includes(type) ? `${type}: ${message}` : message;

  return { message: redactSecretsString(fullMessage), ...(status ? { status } : {}) };
}

async function consumeSseResponse(
  response: Response,
  extract: (data: unknown) => string | null,
  onDelta: (delta: string) => void
): Promise<string> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const safeBody = redactSecretsString(body.slice(0, 1000) || response.statusText);
    throw new Error(`Provider API error (${response.status}): ${safeBody}`);
  }
  if (!response.body) throw new Error("Provider returned no streaming body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let full = "";
  let reachedEnd = false;
  const consumeEvent = (eventText: string) => {
    const lines = eventText.split(/\r?\n/);
    const eventType =
      lines
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim()
        .toLowerCase() || "";
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data || data === "[DONE]") return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new Error("Provider returned malformed streaming data.");
    }

    const providerError = getSseProviderError(parsed, eventType);
    if (providerError) {
      const prefix = providerError.status ? ` (${providerError.status})` : "";
      throw new Error(
        `Provider API error${prefix}: ${providerError.message || response.statusText}`
      );
    }

    const delta = extract(parsed);
    if (delta) {
      full += delta;
      onDelta(delta);
    }
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const events = pending.split(/\r?\n\r?\n/);
      pending = events.pop() || "";
      for (const event of events) consumeEvent(event);
      if (done) {
        if (pending.trim()) consumeEvent(pending);
        reachedEnd = true;
        break;
      }
    }
  } finally {
    if (!reachedEnd) {
      try {
        await reader.cancel();
      } catch {
        // Preserve the original stream error.
      }
    }
    reader.releaseLock();
  }
  return full;
}

export function normalizeMimeType(mime: string): string {
  const lower = (mime || "").toLowerCase().trim();
  const base = lower.split(";")[0]?.trim() || "";
  if (
    base === "image/jpg" ||
    base === "image/pjpeg" ||
    base === "image/jfif" ||
    base === "jpg" ||
    base === "jpeg"
  ) {
    return "image/jpeg";
  }
  if (base === "png" || base === "image/png") return "image/png";
  if (base === "webp" || base === "image/webp") return "image/webp";
  if (base === "gif" || base === "image/gif") return "image/gif";
  return base || "image/jpeg";
}

export function normalizeAnthropicMediaType(
  mime: string
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const normalized = normalizeMimeType(mime);
  if (
    normalized === "image/jpeg" ||
    normalized === "image/png" ||
    normalized === "image/gif" ||
    normalized === "image/webp"
  ) {
    return normalized;
  }
  return "image/jpeg";
}

export interface PreparedImage {
  mimeType: string;
  base64Data: string;
}

export function cleanBase64Data(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const stripped = trimmed.replace(/^data:[^;]{1,128};base64,/i, "");
  return stripped.trim().replace(/\s+/g, "");
}

export function resolveAllImages(params: {
  images?: Array<{ name?: string | undefined; mimeType: string; base64Data: string }> | undefined;
  imagePages?: Array<{ pageNumber: number; mimeType: string; base64Data: string }> | undefined;
}): PreparedImage[] {
  return [
    ...(params.images || []).map((img) => ({
      mimeType: normalizeMimeType(img.mimeType),
      base64Data: cleanBase64Data(img.base64Data),
    })),
    ...(params.imagePages || []).map((image) => ({
      mimeType: normalizeMimeType(image.mimeType),
      base64Data: cleanBase64Data(image.base64Data),
    })),
  ];
}

export function normalizeMessages(messages: ChatMessage[], hasImages: boolean): ChatMessage[] {
  const list = messages?.length ? [...messages] : [];
  if (list.length === 0) {
    return [
      {
        role: "user",
        content: hasImages ? "Please analyze the attached image(s)." : "Hello",
      },
    ];
  }
  const hasUser = list.some((m) => m.role === "user");
  if (!hasUser) {
    list.push({
      role: "user",
      content: hasImages ? "Please analyze the attached image(s)." : "Hello",
    });
  }
  return list;
}

export function buildGeminiContents(
  rawMessages: ChatMessage[],
  allImages: PreparedImage[]
): Array<{
  role: "user" | "model";
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}> {
  const messages = normalizeMessages(rawMessages, allImages.length > 0);
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");

  return messages.map((m, index) => {
    const isTargetUser = index === lastUserIndex;
    const textContent = isTargetUser
      ? m.content?.trim() || (allImages.length ? "Please analyze the attached image(s)." : " ")
      : m.content?.trim() || " ";

    return {
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [
        { text: textContent },
        ...(isTargetUser
          ? allImages.map((image) => ({
              inlineData: { mimeType: normalizeMimeType(image.mimeType), data: image.base64Data },
            }))
          : []),
      ],
    };
  });
}

export function buildAnthropicMessages(
  rawMessages: ChatMessage[],
  allImages: PreparedImage[]
): Array<{
  role: "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | {
            type: "image";
            source: {
              type: "base64";
              media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
              data: string;
            };
          }
      >;
}> {
  const messages = normalizeMessages(rawMessages, allImages.length > 0);
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");

  return messages.map((m, index) => {
    const isTargetUser = index === lastUserIndex;
    if (isTargetUser && allImages.length) {
      return {
        role: m.role,
        content: [
          {
            type: "text" as const,
            text: m.content?.trim() || "Please analyze the attached image(s).",
          },
          ...allImages.map((image) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: normalizeAnthropicMediaType(image.mimeType),
              data: image.base64Data,
            },
          })),
        ],
      };
    }
    return {
      role: m.role,
      content: m.content?.trim() || (m.role === "user" ? "Continue." : "..."),
    };
  });
}

export function buildOpenAiMessages(
  rawMessages: ChatMessage[],
  allImages: PreparedImage[],
  provider: ProviderId,
  systemInstruction?: string
): Array<{
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | {
            type: "image_url";
            image_url: {
              url: string;
              detail?: "high";
            };
          }
      >;
}> {
  const messages = normalizeMessages(rawMessages, allImages.length > 0);
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");

  const formattedMessages = messages.map((m, index) => {
    const isTargetUser = index === lastUserIndex;
    if (isTargetUser && allImages.length) {
      return {
        role: m.role,
        content: [
          {
            type: "text" as const,
            text: m.content?.trim() || "Please analyze the attached image(s).",
          },
          ...allImages.map((image) => ({
            type: "image_url" as const,
            image_url: {
              url: `data:${normalizeMimeType(image.mimeType)};base64,${image.base64Data}`,
              ...(provider === "openai" || provider === "xai" ? { detail: "high" as const } : {}),
            },
          })),
        ],
      };
    }
    return {
      role: m.role,
      content: m.content?.trim() || (m.role === "user" ? "Continue." : "..."),
    };
  });

  return [
    ...(systemInstruction?.trim()
      ? [{ role: "system" as const, content: systemInstruction.trim() }]
      : []),
    ...formattedMessages,
  ];
}

export function resolveGeminiThinkingLevel(
  effort: "low" | "medium" | "high" | "xhigh" | "max"
): ThinkingLevel {
  return effort === "low"
    ? ThinkingLevel.LOW
    : effort === "medium"
      ? ThinkingLevel.MEDIUM
      : ThinkingLevel.HIGH;
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
  const supportsNativeEffort =
    params.modelId !== "custom-model" &&
    supportsProviderReasoningEffort(provider, params.modelId);
  const effectiveEffort = supportsNativeEffort ? effort : "medium";
  const maxTokens = supportsNativeEffort
    ? (getModelMeta(params.modelId).maxOutputTokens ?? 8192)
    : maxOutputTokensForEffort("medium");
  let text = "";
  let modelUsed = upstreamModelId;
  const allImages = resolveAllImages(params);
  assertTextRequestFitsContextWindow(params, maxTokens, allImages.length > 0);

  const cleanApiKey = apiKey.replace(/[^\x21-\x7E]/g, "");

  if (provider === "google") {
    const contents = buildGeminiContents(params.messages, allImages);
    const ai = new GoogleGenAI({
      apiKey: cleanApiKey,
      httpOptions: { baseUrl, apiVersion: "", fetch: fetchProviderFromSdk },
    });
    const stream = await ai.models.generateContentStream({
      model: upstreamModelId,
      contents,
      config: {
        ...(params.signal ? { abortSignal: params.signal } : {}),
        maxOutputTokens: maxTokens,
        systemInstruction: params.systemInstruction,
        ...(supportsNativeEffort
          ? { thinkingConfig: { thinkingLevel: resolveGeminiThinkingLevel(effectiveEffort) } }
          : {}),
      },
    });
    for await (const chunk of stream) {
      const delta = chunk.text || "";
      if (delta) {
        text += delta;
        onDelta(delta);
      }
    }
    modelUsed = upstreamModelId;
  } else if (provider === "anthropic") {
    const response = await fetchProvider(`${baseUrl.replace(/\/+$/, "")}/messages`, {
      method: "POST",
      ...(params.signal ? { signal: params.signal } : {}),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cleanApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: upstreamModelId,
        max_tokens: maxTokens,
        ...(supportsNativeEffort ? { output_config: { effort: effectiveEffort } } : {}),
        stream: true,
        system: params.systemInstruction,
        messages: buildAnthropicMessages(params.messages, allImages),
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cleanApiKey}` },
      body: JSON.stringify({
        model: upstreamModelId,
        stream: true,
        ...openAiCompatibleEffortPayload(
          provider,
          params.modelId,
          effectiveEffort,
          maxTokens,
          supportsNativeEffort
        ),
        messages: buildOpenAiMessages(
          params.messages,
          allImages,
          provider,
          params.systemInstruction
        ),
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
  if (!text.trim()) {
    throw new Error(`EMPTY_PROVIDER_RESPONSE:${provider}:The selected provider returned no text.`);
  }
  return { text, modelUsed, providerUsed: provider };
}

function parseIpv4(ip: string): [number, number, number, number] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    nums.push(n);
  }
  return [nums[0]!, nums[1]!, nums[2]!, nums[3]!];
}

function isPrivateIpv4(a: number, b: number, c: number, _d: number): boolean {
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // 10.0.0.0/8
    a === 127 || // 127.0.0.0/8
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10
    (a === 169 && b === 254) || // 169.254.0.0/16
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 0 && c === 0) || // 192.0.0.0/24
    (a === 192 && b === 0 && c === 2) || // 192.0.2.0/24
    (a === 192 && b === 88 && c === 99) || // 192.88.99.0/24
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15
    (a === 198 && b === 51 && c === 100) || // 198.51.100.0/24
    (a === 203 && b === 0 && c === 113) || // 203.0.113.0/24
    a >= 224 // 224.0.0.0/4 (Multicast, Reserved, Broadcast)
  );
}

function parseIpv6(ip: string): number[] | null {
  const cleanIp = (ip.split("%")[0] ?? ip).toLowerCase();
  let normalized = cleanIp;

  // Handle embedded IPv4 dotted quad at the end if present (e.g., ::ffff:192.168.1.1 or ::192.168.1.1)
  const lastColon = cleanIp.lastIndexOf(":");
  if (lastColon !== -1) {
    const afterColon = cleanIp.slice(lastColon + 1);
    if (afterColon.includes(".")) {
      const v4 = parseIpv4(afterColon);
      if (!v4) return null;
      const hex1 = (((v4[0] << 8) | v4[1]) >>> 0).toString(16);
      const hex2 = (((v4[2] << 8) | v4[3]) >>> 0).toString(16);
      normalized = cleanIp.slice(0, lastColon) + ":" + hex1 + ":" + hex2;
    }
  }

  const halves = normalized.split("::");
  if (halves.length > 2) return null;

  let words: string[];
  if (halves.length === 2) {
    const left = halves[0] ? halves[0].split(":") : [];
    const right = halves[1] ? halves[1].split(":") : [];
    const fill = 8 - (left.length + right.length);
    if (fill < 0) return null;
    words = [...left, ...Array(fill).fill("0"), ...right];
  } else {
    words = normalized.split(":");
    if (words.length !== 8) return null;
  }

  if (words.length !== 8) return null;
  const parsed: number[] = [];
  for (const w of words) {
    if (!/^[0-9a-f]{1,4}$/.test(w)) return null;
    parsed.push(parseInt(w, 16));
  }
  return parsed;
}

function isPrivateIpv6(words: number[]): boolean {
  // 1. :: (Unspecified)
  if (words.every((w) => w === 0)) return true;

  // 2. ::1 (Loopback)
  if (words.slice(0, 7).every((w) => w === 0) && words[7] === 1) return true;

  // 3. IPv4-mapped IPv6 (::ffff:0:0/96, e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (words.slice(0, 5).every((w) => w === 0) && words[5] === 0xffff) {
    const a = (words[6]! >> 8) & 0xff;
    const b = words[6]! & 0xff;
    const c = (words[7]! >> 8) & 0xff;
    const d = words[7]! & 0xff;
    return isPrivateIpv4(a, b, c, d);
  }

  // 4. IPv4-translated (::ffff:0:0:0/96)
  if (words.slice(0, 4).every((w) => w === 0) && words[4] === 0xffff && words[5] === 0) {
    const a = (words[6]! >> 8) & 0xff;
    const b = words[6]! & 0xff;
    const c = (words[7]! >> 8) & 0xff;
    const d = words[7]! & 0xff;
    return isPrivateIpv4(a, b, c, d);
  }

  // 5. IPv4-compatible (::/96 deprecated RFC 4291)
  if (words.slice(0, 6).every((w) => w === 0)) {
    const a = (words[6]! >> 8) & 0xff;
    const b = words[6]! & 0xff;
    const c = (words[7]! >> 8) & 0xff;
    const d = words[7]! & 0xff;
    if (a !== 0 || b !== 0 || c !== 0 || d !== 1) {
      return isPrivateIpv4(a, b, c, d);
    }
  }

  // 6. NAT64 Well-Known Prefix (64:ff9b::/96)
  if (words[0] === 0x0064 && words[1] === 0xff9b && words.slice(2, 6).every((w) => w === 0)) {
    const a = (words[6]! >> 8) & 0xff;
    const b = words[6]! & 0xff;
    const c = (words[7]! >> 8) & 0xff;
    const d = words[7]! & 0xff;
    return isPrivateIpv4(a, b, c, d);
  }

  // 7. 6to4 (2002::/16) - embeds IPv4 in words[1] and words[2]
  if (words[0] === 0x2002) {
    const a = (words[1]! >> 8) & 0xff;
    const b = words[1]! & 0xff;
    const c = (words[2]! >> 8) & 0xff;
    const d = words[2]! & 0xff;
    return isPrivateIpv4(a, b, c, d);
  }

  // 8. Unique Local Address ULA (fc00::/7 -> fc00..fdff)
  if ((words[0]! & 0xfe00) === 0xfc00) return true;

  // 9. Link-Local Unicast (fe80::/10 -> fe80..febf)
  if ((words[0]! & 0xffc0) === 0xfe80) return true;

  // 10. Site-Local Unicast (fec0::/10 deprecated)
  if ((words[0]! & 0xffc0) === 0xfec0) return true;

  // 11. Multicast (ff00::/8)
  if ((words[0]! & 0xff00) === 0xff00) return true;

  // 12. Discard prefix (100::/64)
  if (words[0] === 0x0100 && words[1] === 0 && words[2] === 0 && words[3] === 0) return true;

  // 13. Documentation prefix (2001:db8::/32)
  if (words[0] === 0x2001 && words[1] === 0x0db8) return true;

  // 14. Benchmarking (2001:2::/48)
  if (words[0] === 0x2001 && words[1] === 0x0002 && words[2] === 0) return true;

  // 15. ORCHID / ORCHIDv2 (2001:10::/28 and 2001:20::/28)
  if (words[0] === 0x2001 && ((words[1]! & 0xfff0) === 0x0010 || (words[1]! & 0xfff0) === 0x0020)) {
    return true;
  }

  // 16. TEREDO (2001:0000::/32) - client IPv4 in words[6] and words[7] XOR 0xffff
  if (words[0] === 0x2001 && words[1] === 0x0000) {
    const w6 = words[6]! ^ 0xffff;
    const w7 = words[7]! ^ 0xffff;
    const a = (w6 >> 8) & 0xff;
    const b = w6 & 0xff;
    const c = (w7 >> 8) & 0xff;
    const d = w7 & 0xff;
    return isPrivateIpv4(a, b, c, d);
  }

  return false;
}

export function isPrivateAddress(address: string): boolean {
  const clean = (address.split("%")[0] ?? address).trim().toLowerCase();
  const v4 = parseIpv4(clean);
  if (v4) return isPrivateIpv4(v4[0], v4[1], v4[2], v4[3]);
  const v6 = parseIpv6(clean);
  if (v6) return isPrivateIpv6(v6);
  // Default deny: treat malformed or unparseable IPs as private/unsafe
  return true;
}

export async function fetchProvider(url: string, init: RequestInit): Promise<Response> {
  const parsed = new URL(url);
  const hostAddress = parsed.hostname.replace(/^\[|\]$/g, "");
  if (parsed.protocol !== "https:") throw new Error("Provider URL must use HTTPS.");
  if (parsed.username || parsed.password)
    throw new Error("Provider URL must not contain credentials.");
  if (!parsed.hostname || parsed.hostname.trim() === "")
    throw new Error("Provider URL must specify a valid hostname.");
  const addresses = isIP(hostAddress)
    ? [{ address: hostAddress, family: isIP(hostAddress) }]
    : await lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Provider URL cannot resolve to a private or local network address.");
  }
  const pinnedAddress = addresses[0]!;
  const pinnedLookup = ((
    _hostname: string,
    optionsOrCallback: number | { all?: boolean } | ((...args: unknown[]) => void) | undefined,
    maybeCallback?: (...args: unknown[]) => void
  ) => {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    const options = typeof optionsOrCallback === "object" ? optionsOrCallback : undefined;
    if (!callback) return;
    if (options?.all) callback(null, [pinnedAddress]);
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

export function normalizeBaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    throw new Error("Provider base URL cannot be empty.");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Provider base URL must be a valid URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Provider URL must use HTTPS.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Provider URL must not contain credentials.");
  }
  if (!parsed.hostname || parsed.hostname.trim() === "") {
    throw new Error("Provider URL must specify a valid hostname.");
  }
  return trimmed.replace(/\/+$/, "");
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
    const safeModelId = redactSecretsString(
      String(modelId)
        .replace(/[^\x21-\x7E]/g, "")
        .slice(0, 64)
    );
    throw new Error(
      `UNKNOWN_MODEL:${safeModelId}:The requested model is not in the model catalog.`
    );
  }
  if (modelId === "custom-model" && !customModel?.trim()) {
    throw new Error("MISSING_CUSTOM_MODEL:Enter a model ID for the custom provider.");
  }
  const modelMeta = getModelMeta(modelId);
  const resolvedProvider =
    modelId === "custom-model" && customProvider && customProvider in PROVIDER_CATALOG
      ? customProvider
      : modelMeta.provider;
  const meta =
    modelId === "custom-model" && customModel
      ? {
          ...modelMeta,
          provider: resolvedProvider,
          upstreamModelId: customModel.trim(),
        }
      : modelMeta;
  const providerMeta = PROVIDER_CATALOG[meta.provider];

  // 1. Check client-supplied BYOK key
  if (isValidApiKey(injectedApiKey)) {
    const rawBase = injectedBaseUrl?.trim();
    const baseUrl = rawBase
      ? normalizeBaseUrl(rawBase)
      : providerMeta.defaultBaseUrl.replace(/\/+$/, "");
    return {
      provider: meta.provider,
      upstreamModelId: meta.upstreamModelId,
      apiKey: injectedApiKey.trim(),
      baseUrl,
    };
  }

  throw new Error(
    `MISSING_API_KEY:${meta.provider}:No API key found for ${providerMeta.name} (${meta.name}). Please connect your ${providerMeta.name} API key in Customize → Providers or via the model selector.`
  );
}

export function resolveEffort(effort?: string): "low" | "medium" | "high" | "xhigh" | "max" {
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

export function resolveOpenAiEffort(
  effort: "low" | "medium" | "high" | "xhigh" | "max"
): "low" | "medium" | "high" | "xhigh" | "max" {
  return effort;
}

function resolveProviderReasoningEffort(
  provider: ProviderId,
  modelId: string,
  effort: "low" | "medium" | "high" | "xhigh" | "max"
): string | undefined {
  if (provider === "openai" || provider === "anthropic" || provider === "google") return effort;
  if (provider === "xai" && modelId === "grok-4.7") return effort === "max" ? undefined : effort;
  if (provider === "kimi" && modelId === "kimi-k3.1-pro") {
    return effort === "low" || effort === "max" ? effort : "high";
  }
  if (provider === "qwen" && modelId === "qwen3.8-max") {
    return effort === "low" || effort === "medium" ? effort : "xhigh";
  }
  if (provider === "deepseek" && ["deepseek-v4.1-flash", "deepseek-v4-pro"].includes(modelId)) {
    return effort === "low" || effort === "max" ? effort : "high";
  }
  if (provider === "custom" && modelId === "openrouter-nemotron-3-ultra-free") {
    return effort === "medium" || effort === "high" ? effort : undefined;
  }
  return undefined;
}

function supportsProviderReasoningEffort(provider: ProviderId, modelId: string): boolean {
  return (
    resolveProviderReasoningEffort(provider, modelId, "medium") !== undefined ||
    (provider === "xai" && modelId === "grok-4.7") ||
    (provider === "deepseek" && ["deepseek-v4.1-flash", "deepseek-v4-pro"].includes(modelId))
  );
}

function openAiCompatibleEffortPayload(
  provider: ProviderId,
  modelId: string,
  effort: "low" | "medium" | "high" | "xhigh" | "max",
  maxTokens: number,
  supportsNativeEffort: boolean
): Record<string, unknown> {
  if (!supportsNativeEffort) return { temperature: 0.2, max_tokens: maxTokens };
  if (provider === "openai") {
    return { reasoning_effort: effort, max_completion_tokens: maxTokens };
  }

  const reasoningEffort = resolveProviderReasoningEffort(provider, modelId, effort);
  return {
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    ...(provider === "deepseek" ? { thinking: { type: "enabled" } } : {}),
    max_tokens: maxTokens,
  };
}

function maxOutputTokensForEffort(effort: "low" | "medium" | "high" | "xhigh" | "max") {
  return effort === "low" ? 1024 : effort === "medium" ? 2048 : effort === "high" ? 4096 : 8192;
}

function normalizeUsage(input: unknown, output: unknown, total: unknown) {
  const usage = {
    ...(typeof input === "number" && Number.isSafeInteger(input) && input >= 0
      ? { inputTokens: input }
      : {}),
    ...(typeof output === "number" && Number.isSafeInteger(output) && output >= 0
      ? { outputTokens: output }
      : {}),
    ...(typeof total === "number" && Number.isSafeInteger(total) && total >= 0
      ? { totalTokens: total }
      : {}),
  };
  return Object.keys(usage).length ? usage : undefined;
}

function assertTextRequestFitsContextWindow(
  params: LlmGenerateParams,
  outputTokenBudget: number,
  hasImages: boolean
): void {
  if (hasImages) return;
  const contextWindowTokens = getModelMeta(params.modelId).contextWindowTokens;
  if (!contextWindowTokens) return;

  const textBytes =
    Buffer.byteLength(params.systemInstruction, "utf8") +
    params.messages.reduce(
      (total, message) => total + Buffer.byteLength(message.content, "utf8"),
      0
    );
  const messageOverheadReserve = 512 + params.messages.length * 16;
  const availableInputBytes = Math.max(
    0,
    contextWindowTokens - outputTokenBudget - messageOverheadReserve
  );

  if (textBytes > availableInputBytes) {
    throw new Error(
      "Request exceeds the model context window after reserving output tokens and message overhead."
    );
  }
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
  supportsNativeEffort: boolean;
  maxTokens: number;
  images?: PreparedImage[];
  signal?: AbortSignal | undefined;
}): Promise<{ text: string; usage?: LlmGenerateResult["usage"] }> {
  const images = params.images || [];
  const cleanApiKey = params.apiKey.replace(/[^\x21-\x7E]/g, "");
  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/messages`;
  const response = await fetchProvider(endpoint, {
    method: "POST",
    ...(params.signal ? { signal: params.signal } : {}),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cleanApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens,
      ...(params.supportsNativeEffort ? { output_config: { effort: params.effort } } : {}),
      system: params.systemInstruction,
      messages: buildAnthropicMessages(params.messages, images),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    const safeErr = redactSecretsString(errBody || response.statusText);
    throw new Error(`Anthropic API error (${response.status}): ${safeErr}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const textBlock = data.content?.find((c) => c.type === "text");
  const usage = normalizeUsage(data.usage?.input_tokens, data.usage?.output_tokens, undefined);
  return {
    text: requireProviderText(textBlock?.text, "anthropic"),
    ...(usage ? { usage } : {}),
  };
}

/**
 * Calls OpenAI-compatible Chat Completions API for the selected provider.
 */
async function callOpenAICompatible(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  modelId: string;
  messages: ChatMessage[];
  systemInstruction: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens: number;
  provider: ProviderId;
  supportsNativeEffort: boolean;
  images?: PreparedImage[];
  signal?: AbortSignal | undefined;
}): Promise<{ text: string; usage?: LlmGenerateResult["usage"] }> {
  const images = params.images || [];
  const cleanApiKey = params.apiKey.replace(/[^\x21-\x7E]/g, "");
  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const response = await fetchProvider(endpoint, {
    method: "POST",
    ...(params.signal ? { signal: params.signal } : {}),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanApiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      ...openAiCompatibleEffortPayload(
        params.provider,
        params.modelId,
        params.effort,
        params.maxTokens,
        params.supportsNativeEffort
      ),
      messages: buildOpenAiMessages(
        params.messages,
        images,
        params.provider,
        params.systemInstruction
      ),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    const safeErr = redactSecretsString(errBody || response.statusText);
    throw new Error(`Provider API error (${response.status}): ${safeErr}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const usage = normalizeUsage(
    data.usage?.prompt_tokens,
    data.usage?.completion_tokens,
    data.usage?.total_tokens
  );
  return {
    text: requireProviderText(data.choices?.[0]?.message?.content, params.provider),
    ...(usage ? { usage } : {}),
  };
}

/**
 * Calls the user-selected Google Gemini model with the user's injected key.
 */
async function callGoogleGemini(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  systemInstruction: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  supportsNativeEffort: boolean;
  maxTokens: number;
  images?: PreparedImage[];
  signal?: AbortSignal | undefined;
}): Promise<{ text: string; modelUsed: string; usage?: LlmGenerateResult["usage"] }> {
  const images = params.images || [];
  const contents = buildGeminiContents(params.messages, images);
  const cleanApiKey = params.apiKey.replace(/[^\x21-\x7E]/g, "");

  const ai = new GoogleGenAI({
    apiKey: cleanApiKey,
    httpOptions: {
      baseUrl: params.baseUrl,
      apiVersion: "",
      fetch: fetchProviderFromSdk,
    },
  });
  const response = await ai.models.generateContent({
    model: params.model,
    contents,
    config: {
      ...(params.signal ? { abortSignal: params.signal } : {}),
      systemInstruction: params.systemInstruction,
      maxOutputTokens: params.maxTokens,
      ...(params.supportsNativeEffort
        ? { thinkingConfig: { thinkingLevel: resolveGeminiThinkingLevel(params.effort) } }
        : {}),
    },
  });
  const usage = normalizeUsage(
    response.usageMetadata?.promptTokenCount,
    response.usageMetadata?.candidatesTokenCount,
    response.usageMetadata?.totalTokenCount
  );
  return {
    text: requireProviderText(response.text, "google"),
    modelUsed: params.model,
    ...(usage ? { usage } : {}),
  };
}

function requireProviderText(text: string | undefined, provider: ProviderId): string {
  if (!text?.trim()) {
    throw new Error(`EMPTY_PROVIDER_RESPONSE:${provider}:The selected provider returned no text.`);
  }
  return text;
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
  const supportsNativeEffort =
    params.modelId !== "custom-model" &&
    supportsProviderReasoningEffort(provider, params.modelId);
  const effectiveEffort = supportsNativeEffort ? effort : "medium";
  const maxTokens = supportsNativeEffort
    ? (getModelMeta(params.modelId).maxOutputTokens ?? 8192)
    : maxOutputTokensForEffort("medium");
  const allImages = resolveAllImages(params);
  assertTextRequestFitsContextWindow(params, maxTokens, allImages.length > 0);

  logEvent(`Dispatching BYOK chat -> provider=${provider} model=${upstreamModelId}`);

  if (provider === "anthropic") {
    const generated = await callAnthropic({
      apiKey,
      baseUrl,
      model: upstreamModelId,
      messages: params.messages,
      systemInstruction: params.systemInstruction,
      effort: effectiveEffort,
      supportsNativeEffort,
      maxTokens,
      images: allImages,
      signal: params.signal,
    });
    return {
      ...generated,
      modelUsed: upstreamModelId,
      providerUsed: provider,
    };
  }

  if (provider === "google") {
    const generated = await callGoogleGemini({
      apiKey,
      baseUrl,
      model: upstreamModelId,
      messages: params.messages,
      systemInstruction: params.systemInstruction,
      effort: effectiveEffort,
      supportsNativeEffort,
      maxTokens,
      images: allImages,
      signal: params.signal,
    });
    return { ...generated, providerUsed: provider };
  }

  // OpenAI-compatible providers, including OpenRouter.
  const generated = await callOpenAICompatible({
    apiKey,
    baseUrl,
    model: upstreamModelId,
    modelId: params.modelId,
    messages: params.messages,
    systemInstruction: params.systemInstruction,
    effort: effectiveEffort,
    maxTokens,
    provider,
    supportsNativeEffort,
    images: allImages,
    signal: params.signal,
  });

  return {
    ...generated,
    modelUsed: upstreamModelId,
    providerUsed: provider,
  };
}
