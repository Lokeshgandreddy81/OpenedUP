import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const generate = vi.hoisted(() => vi.fn());

vi.mock("../../src/domains/chat/providers/llm.service.js", () => ({
  generateMultiProviderChatStream: generate,
}));

import { createApp } from "../../src/app.js";

const app = createApp();

const chapterRequest = {
  chapterId: "document:chapter-1",
  chapterTitle: "System Boundaries",
  startPage: 2,
  endPage: 3,
  question: "Why do boundaries matter?",
  model: "openrouter-nemotron-3.5-lightning-free",
  history: [],
  evidence: [
    {
      id: "document:chapter-1:page-2:chunk-1",
      pageNumber: 2,
      text: "Clear boundaries contain failures and make responsibilities explicit.",
    },
  ],
};

describe("chapter chat stream route", () => {
  beforeEach(() => {
    generate.mockReset();
    generate.mockImplementation(async (_params, onDelta) => {
      const text = "ANSWER: Boundaries contain failures.\nCITATIONS: P1\nABSTAINED: false";
      onDelta(text);
      return {
        text,
        modelUsed: "nvidia/nemotron-3.5-lightning:free",
        providerUsed: "custom",
      };
    });
  });

  it("validates, grounds, streams, and maps citations to the submitted chapter evidence", async () => {
    const response = await request(app)
      .post("/api/chat/chapter/stream")
      .set("x-provider-key", "test-provider-key")
      .send(chapterRequest);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.text).toContain('event: phase\ndata: {"phase":"thinking"}');
    expect(response.text).toContain('event: phase\ndata: {"phase":"responding"}');
    const doneEvent = response.text.split("\n\n").find((event) => event.startsWith("event: done"));
    expect(doneEvent).toBeDefined();
    const result = JSON.parse(doneEvent!.split("\ndata: ")[1] || "{}") as {
      answer: string;
      citations: Array<{ id: string; pageNumber: number }>;
    };
    const [firstEvidence] = chapterRequest.evidence;
    expect(firstEvidence).toBeDefined();
    expect(result.answer).toBe("Boundaries contain failures.");
    expect(result.citations).toEqual([
      {
        id: firstEvidence!.id,
        pageNumber: firstEvidence!.pageNumber,
      },
    ]);
  });

  it("rejects evidence from outside the selected chapter before calling a model", async () => {
    const response = await request(app)
      .post("/api/chat/chapter/stream")
      .set("x-provider-key", "test-provider-key")
      .send({
        ...chapterRequest,
        evidence: [{ ...chapterRequest.evidence[0], pageNumber: 1 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(generate).not.toHaveBeenCalled();
  });
});
