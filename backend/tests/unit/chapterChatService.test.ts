import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChapterChatRequest } from "@charan-interiors/contracts";

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));

vi.mock("../../src/domains/chat/providers/llm.service.js", () => ({
  generateMultiProviderChatStream: generate,
}));

import { answerChapterQuestion } from "../../src/domains/chat/application/chapterChat.service.js";

const request: ChapterChatRequest = {
  chapterId: "doc:chapter-1",
  chapterTitle: "System Boundaries",
  startPage: 3,
  endPage: 4,
  question: "Why are boundaries important?",
  model: "openrouter-nemotron-3.5-lightning-free",
  history: [],
  evidence: [
    {
      id: "doc:chapter-1:page-3:chunk-1",
      pageNumber: 3,
      text: "Clear boundaries contain failures and make responsibilities explicit.",
    },
  ],
};

describe("chapter chat answer contract", () => {
  beforeEach(() => generate.mockReset());

  it("maps a model citation label back to its original PDF page", async () => {
    generate.mockResolvedValue({
      text: "ANSWER: Boundaries contain failures and clarify ownership.\nCITATIONS: P1\nABSTAINED: false",
      modelUsed: "nvidia/nemotron-3.5-lightning:free",
      providerUsed: "custom",
    });

    const result = await answerChapterQuestion(request, {});

    expect(result.answer).toBe("Boundaries contain failures and clarify ownership.");
    expect(result.citations.map(({ id, pageNumber }) => ({ id, pageNumber }))).toEqual([
      { id: "doc:chapter-1:page-3:chunk-1", pageNumber: 3 },
    ]);
    expect(result.abstained).toBe(false);
  });
});
