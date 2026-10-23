import { beforeEach, describe, expect, it, vi } from "vitest";

const processChatStream = vi.hoisted(() => vi.fn());
const runAgenticWorkspaceTools = vi.hoisted(() => vi.fn());

vi.mock("../../src/domains/chat/application/chat.service.js", () => ({
  processChat: vi.fn(),
  processChatStream,
}));
vi.mock("../../src/domains/chat/application/tools.service.js", () => ({
  runAgenticWorkspaceTools,
  getWorkspaceRules: vi.fn(),
  saveWorkspaceRules: vi.fn(),
}));

import { handleChatStream } from "../../src/domains/chat/http/chat.controller.js";
import type { Request, Response } from "express";

function request(remoteAddress: string, model = "openrouter-nemotron-3.5-lightning-free") {
  return {
    body: {
      messages: [{ role: "user", content: "hello" }],
      model,
    },
    headers: {},
    socket: { remoteAddress },
    id: "test-request",
  } as unknown as Request;
}

function response() {
  const res = {
    headers: new Map<string, string>(),
    events: [] as string[],
    writableEnded: false,
    destroyed: false,
    setHeader(name: string, value: string) {
      res.headers.set(name, value);
    },
    on: vi.fn(),
    write(event: string) {
      res.events.push(event);
    },
    end() {
      res.writableEnded = true;
    },
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("unauthenticated free OpenRouter streaming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env["OPENROUTER_FREE_MODELS_ENABLED"] = "true";
    process.env["OPENROUTER_API_KEY"] = "test-openrouter-api-key";
    processChatStream.mockResolvedValue({
      content: "Hello",
      thinkingTime: "1s",
      stepTitle: "Done",
      stepDescription: "",
      thoughtDetails: [],
      modelUsed: "nvidia/nemotron-3.5-lightning:free",
      providerUsed: "custom",
    });
    runAgenticWorkspaceTools.mockReturnValue({
      stepTitle: "Preparing",
      stepDescription: "",
      thoughtDetails: [],
    });
  });

  it("allows enabled free models from localhost without sign-in", async () => {
    const res = response();
    await handleChatStream(request("127.0.0.1"), res as unknown as Response, vi.fn());

    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.events.join("")).toContain("event: done");
    expect(res.writableEnded).toBe(true);
  });

  it("does not expose the server key to non-local unauthenticated requests", async () => {
    const res = response();
    await handleChatStream(request("203.0.113.10"), res as unknown as Response, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Sign in to use server-configured provider keys." })
    );
    expect(processChatStream).not.toHaveBeenCalled();
  });

  it("does not allow paid models to use unauthenticated local server credentials", async () => {
    const res = response();
    await handleChatStream(
      request("127.0.0.1", "claude-opus-5.5"),
      res as unknown as Response,
      vi.fn()
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(processChatStream).not.toHaveBeenCalled();
  });

  it("keeps local free-model access disabled unless explicitly enabled", async () => {
    process.env["OPENROUTER_FREE_MODELS_ENABLED"] = "false";
    const res = response();
    await handleChatStream(request("127.0.0.1"), res as unknown as Response, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(processChatStream).not.toHaveBeenCalled();
  });
});
