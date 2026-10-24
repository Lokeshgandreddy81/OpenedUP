import { describe, expect, it } from "vitest";
import { ChapterChatRequestSchema } from "../src/schemas/index.js";

const validRequest = {
  chapterId: "chapter-2",
  chapterTitle: "System Boundaries",
  startPage: 4,
  endPage: 6,
  question: "What does the chapter say about boundaries?",
  model: "provider-model",
  history: [],
  evidence: [{ id: "doc:chapter-2:page-4", pageNumber: 4, text: "Define clear boundaries." }],
};

describe("chapter chat request boundaries", () => {
  it("accepts evidence from the selected chapter page range", () => {
    expect(ChapterChatRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects evidence outside the selected chapter page range", () => {
    const result = ChapterChatRequestSchema.safeParse({
      ...validRequest,
      evidence: [{ id: "doc:chapter-1:page-3", pageNumber: 3, text: "Other chapter text." }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.join(".") === "evidence.0.pageNumber")
      ).toBe(true);
    }
  });
});
