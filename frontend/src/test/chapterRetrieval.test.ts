import { describe, expect, it } from "vitest";
import {
  prepareChapterEvidence,
  retrieveChapterPassages,
} from "../features/chapters/services/chapterRetrieval";
import type { ChapterSource } from "../features/chapters/services/chapterSource";

const source: ChapterSource = {
  documentId: "document-1",
  chapterId: "chapter-1",
  title: "Foundations",
  startPage: 4,
  endPage: 5,
  pages: [
    {
      id: "document-1:chapter-1:page-4",
      pageNumber: 4,
      text: "A production system needs clear boundaries and predictable failure handling.",
    },
    {
      id: "document-1:chapter-1:page-5",
      pageNumber: 5,
      text: "Retrieval supplies relevant context so a model can answer from the selected source.",
    },
  ],
};

describe("chapter passage retrieval", () => {
  it("returns chapter context for each built-in broad study prompt", () => {
    for (const question of [
      "Summarize the chapter’s key ideas",
      "Explain a key term from the chapter",
      "What should I remember?",
    ]) {
      const passages = retrieveChapterPassages(source, question);
      expect(
        passages.map(({ pageNumber }) => pageNumber),
        question
      ).toEqual([4, 5]);
      expect(
        passages.every(({ score }) => score === 0),
        question
      ).toBe(true);
    }
  });

  it("spreads broad-prompt evidence across long chapters", () => {
    const longChapter: ChapterSource = {
      ...source,
      endPage: 15,
      pages: Array.from({ length: 12 }, (_, index) => ({
        id: `document-1:chapter-1:page-${index + 4}`,
        pageNumber: index + 4,
        text: `Chapter concept from page ${index + 4}.`,
      })),
    };

    const pages = retrieveChapterPassages(longChapter, "Summarize the chapter’s key ideas").map(
      ({ pageNumber }) => pageNumber
    );

    expect(pages).toHaveLength(8);
    expect(pages[0]).toBe(4);
    expect(pages.at(-1)).toBe(15);
    expect(pages).toContain(10);
  });

  it("gives the model a bounded chapter sample when a paraphrase has no keyword overlap", () => {
    const passages = retrieveChapterPassages(source, "How do these parts work together?");

    expect(passages.map(({ pageNumber }) => pageNumber)).toEqual([4, 5]);
    expect(passages.every(({ score }) => score === 0)).toBe(true);
  });

  it("gives every sent page image a matching citation page", () => {
    const passages = retrieveChapterPassages(source, "boundaries failure", 8);
    const images = [
      { pageNumber: 4, mimeType: "image/jpeg" as const, base64Data: "page-four" },
      { pageNumber: 5, mimeType: "image/jpeg" as const, base64Data: "page-five" },
    ];

    const prepared = prepareChapterEvidence(passages, images);

    expect(prepared.evidence.map(({ pageNumber }) => pageNumber)).toEqual([4, 5]);
    expect(prepared.images.map(({ pageNumber }) => pageNumber)).toEqual([4, 5]);
  });
});
