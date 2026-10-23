import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMultiProviderChat, verifyProviderKey } from "../../src/domains/chat/providers/llm.service.js";
import { PROVIDER_CATALOG, type ProviderId } from "@charan-interiors/contracts";

const googleGenerateContent = vi.fn();
const googleGenerateContentStream = vi.fn();
let googleClientOptions: {
  apiKey?: string;
  httpOptions?: {
    baseUrl?: string;
    apiVersion?: string;
    fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  };
};

vi.mock("node:dns/promises", () => ({
  lookup: async () => [{ address: "8.8.8.8", family: 4 }],
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: googleGenerateContent,
      generateContentStream: googleGenerateContentStream,
    };
    constructor(options: typeof googleClientOptions) {
      googleClientOptions = options;
    }
  },
  ThinkingLevel: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH" },
}));

const providers: ProviderId[] = [
  "anthropic",
  "openai",
  "google",
  "deepseek",
  "xai",
  "zhipu",
  "custom",
];

function getRequest(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    init,
    body: init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined,
  };
}

describe.each(providers)("%s provider adapter", (provider) => {
  afterEach(() => {
    vi.unstubAllGlobals();
    googleGenerateContent.mockReset();
    googleGenerateContentStream.mockReset();
    googleClientOptions = {};
  });

  it("verifies a key using the provider's verification request", async () => {
    googleGenerateContent.mockResolvedValue({ text: "ok" });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyProviderKey({ provider, apiKey: "adapter-test-key" });

    expect(result.valid).toBe(true);
    expect(result.provider).toBe(provider);
    if (provider === "google") {
      expect(googleClientOptions).toMatchObject({
        apiKey: "adapter-test-key",
        httpOptions: {
          baseUrl: PROVIDER_CATALOG.google.defaultBaseUrl,
          apiVersion: "",
        },
      });
      expect(googleClientOptions.httpOptions?.fetch).toBeTypeOf("function");
      expect(googleGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-3.8-flash",
          contents: "Ping",
          config: { maxOutputTokens: 5 },
        })
      );
      return;
    }
    const { url, init, body } = getRequest(fetchMock);
    expect(new URL(url).origin).toBe(new URL(PROVIDER_CATALOG[provider].defaultBaseUrl).origin);
    if (provider === "anthropic") {
      expect(url).toBe(`${PROVIDER_CATALOG[provider].defaultBaseUrl}/messages`);
      expect(new Headers(init.headers).get("x-api-key")).toBe("adapter-test-key");
      expect(body?.model).toBe("claude-opus-5-5");
    } else {
      expect(url).toBe(`${PROVIDER_CATALOG[provider].defaultBaseUrl}/models`);
      expect(new Headers(init.headers).get("authorization")).toBe("Bearer adapter-test-key");
      expect(init.method).toBe("GET");
    }
  });

  it("sends a chat request through the provider adapter and returns its response", async () => {
    googleGenerateContent.mockResolvedValue({ text: "adapter response" });
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const request = JSON.parse(String(init.body)) as { model?: string };
      if (provider === "anthropic") {
        return new Response(
          JSON.stringify({ content: [{ type: "text", text: "adapter response" }] }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({ choices: [{ message: { content: `response for ${request.model}` } }] }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateMultiProviderChat({
      modelId:
        provider === "custom"
          ? "custom-model"
          : (
              {
                anthropic: "claude-opus-5.5",
                openai: "gpt-6-astra",
                google: "gemini-3.8-flash",
                deepseek: "deepseek-v4.1-flash",
                xai: "grok-4.7",
                zhipu: "glm-5.3",
              } as const
            )[provider],
      ...(provider === "custom"
        ? { customModel: "vendor/test-chat", customProvider: "custom" as const }
        : {}),
      messages: [{ role: "user", content: "Reply with one short greeting." }],
      systemInstruction: "Be concise.",
      effort: provider === "openai" ? "Max" : "Low",
      injectedApiKey: "adapter-test-key",
    });

    expect(result.providerUsed).toBe(provider);
    expect(result.text).toContain("response");
    if (provider === "google") {
      expect(googleGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-3.8-flash",
          config: expect.objectContaining({ maxOutputTokens: 1024 }),
        })
      );
      return;
    }
    const { url, init, body } = getRequest(fetchMock);
    expect(url).toBe(
      `${PROVIDER_CATALOG[provider].defaultBaseUrl}/${provider === "anthropic" ? "messages" : "chat/completions"}`
    );
    expect(
      new Headers(init.headers).get(provider === "anthropic" ? "x-api-key" : "authorization")
    ).toBe(provider === "anthropic" ? "adapter-test-key" : "Bearer adapter-test-key");
    expect(body?.model).toBeTruthy();
    if (provider === "openai") expect(body?.reasoning_effort).toBe("xhigh");
    if (provider === "custom") expect(body?.model).toBe("vendor/test-chat");
  });

  it("routes a custom model through this provider's selected key and saved endpoint", async () => {
    googleGenerateContent.mockResolvedValue({ text: "selected-provider response" });
    const endpoint = `https://gateway.example/${provider}/v1`;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          provider === "anthropic"
            ? JSON.stringify({ content: [{ type: "text", text: "selected-provider response" }] })
            : JSON.stringify({ choices: [{ message: { content: "selected-provider response" } }] }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateMultiProviderChat({
      modelId: "custom-model",
      customModel: "vendor/custom-chat",
      customProvider: provider,
      messages: [{ role: "user", content: "Say hello." }],
      systemInstruction: "Be concise.",
      injectedApiKey: `selected-${provider}-key`,
      injectedBaseUrl: endpoint,
    });

    expect(result.providerUsed).toBe(provider);
    expect(result.modelUsed).toBe("vendor/custom-chat");
    expect(result.text).toContain("response");
    if (provider === "google") {
      expect(googleClientOptions).toMatchObject({
        apiKey: "selected-google-key",
        httpOptions: { baseUrl: endpoint, apiVersion: "" },
      });
      expect(googleClientOptions.httpOptions?.fetch).toBeTypeOf("function");
      expect(googleGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: "vendor/custom-chat" })
      );
      await googleClientOptions.httpOptions!.fetch!(`${endpoint}/models`, { method: "GET" });
      expect(fetchMock).toHaveBeenCalledWith(
        `${endpoint}/models`,
        expect.objectContaining({ method: "GET", redirect: "error" })
      );
    } else {
      const { url, init, body } = getRequest(fetchMock);
      expect(url).toBe(`${endpoint}/${provider === "anthropic" ? "messages" : "chat/completions"}`);
      expect(body?.model).toBe("vendor/custom-chat");
      expect(
        new Headers(init.headers).get(provider === "anthropic" ? "x-api-key" : "authorization")
      ).toBe(
        provider === "anthropic" ? `selected-${provider}-key` : `Bearer selected-${provider}-key`
      );
    }
  });
});

describe("selected Google custom model", () => {
  afterEach(() => {
    googleGenerateContent.mockReset();
    googleGenerateContentStream.mockReset();
    googleClientOptions = {};
  });

  it("does not silently fall back to another model when the selected model fails", async () => {
    googleGenerateContent.mockRejectedValue(new Error("Selected model unavailable"));

    await expect(
      generateMultiProviderChat({
        modelId: "custom-model",
        customModel: "account/custom-model",
        customProvider: "google",
        messages: [{ role: "user", content: "Say hello." }],
        systemInstruction: "Be concise.",
        injectedApiKey: "selected-google-key",
        injectedBaseUrl: "https://gateway.example/google/v1beta",
      })
    ).rejects.toThrow("Selected model unavailable");

    expect(googleGenerateContent).toHaveBeenCalledTimes(1);
    expect(googleGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: "account/custom-model" })
    );
  });
});

describe("Gemini fallback retry", () => {
  afterEach(() => googleGenerateContent.mockReset());

  it("tries the fallback model after the selected model fails", async () => {
    googleGenerateContent
      .mockRejectedValueOnce(new Error("temporary model availability issue"))
      .mockResolvedValueOnce({ text: "fallback response" });

    const result = await generateMultiProviderChat({
      modelId: "gemini-4-argon",
      messages: [{ role: "user", content: "hello" }],
      systemInstruction: "Be concise.",
      injectedApiKey: "adapter-test-key",
    });

    expect(googleGenerateContent).toHaveBeenCalledTimes(2);
    expect(googleGenerateContent.mock.calls[0]?.[0].model).toBe("gemini-4-argon");
    expect(googleGenerateContent.mock.calls[1]?.[0].model).toBe("gemini-3.8-flash");
    expect(result.text).toBe("fallback response");
    expect(result.modelUsed).toBe("gemini-3.8-flash");
  });
});
