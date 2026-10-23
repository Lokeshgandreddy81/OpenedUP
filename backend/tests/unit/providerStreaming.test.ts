import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMultiProviderChatStream } from "../../src/domains/chat/providers/llm.service.js";

const { googleGenerateContentStream } = vi.hoisted(() => ({
  googleGenerateContentStream: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContentStream: googleGenerateContentStream };
  },
  ThinkingLevel: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH" },
}));

vi.mock("node:dns/promises", () => ({
  lookup: async () => [{ address: "8.8.8.8", family: 4 }],
}));

describe("provider streaming adapters", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    googleGenerateContentStream.mockReset();
  });

  it("forwards OpenAI-compatible deltas as they arrive and preserves Unicode", async () => {
    const encoder = new TextEncoder();
    let releaseSecondChunk: (() => void) | undefined;
    const secondChunkReady = new Promise<void>((resolve) => {
      releaseSecondChunk = resolve;
    });
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n')
        );
        void secondChunkReady.then(() => {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"🚀"}}]}\n\n'));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        });
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const deltas: string[] = [];
    const generation = generateMultiProviderChatStream(
      {
        modelId: "gpt-6-astra",
        messages: [{ role: "user", content: "Say hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "unit-test-key",
      },
      (delta) => deltas.push(delta)
    );

    while (!deltas.length) await new Promise((resolve) => setTimeout(resolve, 0));
    expect(deltas).toEqual(["Hello "]);
    releaseSecondChunk?.();
    const result = await generation;
    expect(deltas).toEqual(["Hello ", "🚀"]);
    expect(result.text).toBe("Hello 🚀");
    expect(result.providerUsed).toBe("openai");
  });

  it("streams Anthropic text events through its adapter", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Claude reply"}}\n\n'
          )
        );
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const deltas: string[] = [];

    const result = await generateMultiProviderChatStream(
      {
        modelId: "claude-opus-5.5",
        messages: [{ role: "user", content: "Hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "unit-test-key",
      },
      (delta) => deltas.push(delta)
    );

    expect(deltas).toEqual(["Claude reply"]);
    expect(result.text).toBe("Claude reply");
    expect(result.providerUsed).toBe("anthropic");
  });

  it("streams Gemini SDK deltas with a bounded output limit", async () => {
    googleGenerateContentStream.mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield { text: "Gemini " };
        yield { text: "reply" };
      },
    });
    const deltas: string[] = [];

    const result = await generateMultiProviderChatStream(
      {
        modelId: "gemini-3.8-flash",
        messages: [{ role: "user", content: "Hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "unit-test-key",
        effort: "High",
      },
      (delta) => deltas.push(delta)
    );

    expect(deltas).toEqual(["Gemini ", "reply"]);
    expect(result.text).toBe("Gemini reply");
    expect(result.providerUsed).toBe("google");
    expect(googleGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({ config: expect.objectContaining({ maxOutputTokens: 4096 }) })
    );
  });

  it("reports a mid-stream provider failure after preserving prior deltas", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n')
        );
        setTimeout(() => controller.error(new Error("provider socket closed")), 0);
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const deltas: string[] = [];

    await expect(
      generateMultiProviderChatStream(
        {
          modelId: "gpt-6-astra",
          messages: [{ role: "user", content: "Hello" }],
          systemInstruction: "Be concise.",
          injectedApiKey: "unit-test-key",
        },
        (delta) => deltas.push(delta)
      )
    ).rejects.toThrow(/socket closed/);
    expect(deltas).toEqual(["partial"]);
  });

  it("passes cancellation through to the upstream provider request", async () => {
    const controller = new AbortController();
    let upstreamSignal: AbortSignal | null | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => {
        upstreamSignal = init.signal;
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        });
      })
    );
    const generation = generateMultiProviderChatStream(
      {
        modelId: "gpt-6-astra",
        messages: [{ role: "user", content: "Hello" }],
        systemInstruction: "Be concise.",
        injectedApiKey: "unit-test-key",
        signal: controller.signal,
      },
      () => undefined
    );

    while (!upstreamSignal) await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    await expect(generation).rejects.toThrow(/Aborted/);
    expect(upstreamSignal?.aborted).toBe(true);
  });

  it("rejects local-network custom endpoints in development too", async () => {
    await expect(
      generateMultiProviderChatStream(
        {
          modelId: "custom-model",
          customModel: "local-test-model",
          messages: [{ role: "user", content: "hello" }],
          systemInstruction: "Be concise.",
          injectedApiKey: "unit-test-key",
          injectedBaseUrl: "http://127.0.0.1:11434/v1",
        },
        () => undefined
      )
    ).rejects.toThrow(/must use HTTPS/);

    await expect(
      generateMultiProviderChatStream(
        {
          modelId: "custom-model",
          customModel: "local-test-model",
          messages: [{ role: "user", content: "hello" }],
          systemInstruction: "Be concise.",
          injectedApiKey: "unit-test-key",
          injectedBaseUrl: "https://127.0.0.1/v1",
        },
        () => undefined
      )
    ).rejects.toThrow(/private or local network/);
  });
});
