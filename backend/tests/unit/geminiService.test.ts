import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getActiveModelId,
  getGenAIClient,
  generateWithModelFallback,
} from "../../src/domains/chat/providers/gemini.service.js";

describe("gemini.service unit tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns default active model ID", () => {
    expect(getActiveModelId()).toBe("gemini-3.8-flash");
  });

  it("throws when GEMINI_API_KEY is not configured", () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      expect(() => getGenAIClient()).toThrow("GEMINI_API_KEY environment variable is missing");
    } finally {
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });

  it("creates and caches GoogleGenAI client when key is valid", () => {
    process.env.GEMINI_API_KEY = "test-valid-key";
    const client1 = getGenAIClient();
    const client2 = getGenAIClient();
    expect(client1).toBeDefined();
    expect(client1).toBe(client2);
  });

  it("executes generateWithModelFallback and records active model", async () => {
    process.env.GEMINI_API_KEY = "test-valid-key";
    const client = getGenAIClient();
    const generateSpy = vi.spyOn(client.models, "generateContent").mockResolvedValue({
      text: "Generated test response",
    } as unknown as Awaited<ReturnType<typeof client.models.generateContent>>);

    const result = await generateWithModelFallback({
      contents: "Hello Gemini",
    });

    expect(result.response.text).toBe("Generated test response");
    expect(result.modelUsed).toBe("gemini-3.8-flash");
    expect(generateSpy).toHaveBeenCalled();
  });

  it("cascades to fallback model on transient 503 or overload error", async () => {
    process.env.GEMINI_API_KEY = "test-valid-key";
    const client = getGenAIClient();
    let callCount = 0;

    vi.spyOn(client.models, "generateContent").mockImplementation(async (params) => {
      callCount++;
      if (params.model === "gemini-3.8-flash") {
        throw new Error("503 Service Unavailable: High load");
      }
      return {
        text: "Fallback succeeded",
      } as unknown as Awaited<ReturnType<typeof client.models.generateContent>>;
    });

    const result = await generateWithModelFallback({
      contents: "Hello Gemini",
    });

    expect(result.response.text).toBe("Fallback succeeded");
    expect(result.modelUsed).not.toBe("gemini-3.8-flash");
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});
