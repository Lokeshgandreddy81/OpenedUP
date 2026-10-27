import assert from "node:assert/strict";
import test from "node:test";
import type { ChapterSource } from "./chapterSource";
import { retrieveChapterPassages } from "./chapterRetrieval";

test("chapter summaries sample pages across the selected chapter", () => {
  const source: ChapterSource = {
    documentId: "document-1",
    chapterId: "chapter-1",
    title: "System Design",
    startPage: 1,
    endPage: 12,
    pages: Array.from({ length: 12 }, (_, index) => ({
      id: `document-1:chapter-1:page-${index + 1}`,
      pageNumber: index + 1,
      text: `Chapter content from page ${index + 1}.`,
    })),
  };

  const passages = retrieveChapterPassages(source, "Summarize the key ideas", 4);

  assert.deepEqual(
    passages.map((passage) => passage.pageNumber),
    [1, 4, 8, 12]
  );
  assert.ok(passages.every((passage) => passage.id.startsWith("document-1:chapter-1:")));
});

test("specific questions return the matching chapter page without unrelated pages", () => {
  const source: ChapterSource = {
    documentId: "document-1",
    chapterId: "chapter-1",
    title: "System Design",
    startPage: 1,
    endPage: 3,
    pages: [
      {
        id: "document-1:chapter-1:page-1",
        pageNumber: 1,
        text: "Load balancing spreads requests across healthy servers.",
      },
      {
        id: "document-1:chapter-1:page-2",
        pageNumber: 2,
        text: "Consistent hashing maps keys and servers onto a hash ring.",
      },
      {
        id: "document-1:chapter-1:page-3",
        pageNumber: 3,
        text: "Replication keeps copies of data available across regions.",
      },
    ],
  };

  const passages = retrieveChapterPassages(source, "How does consistent hashing work?", 4);

  assert.deepEqual(
    passages.map(({ id, pageNumber }) => ({ id, pageNumber })),
    [{ id: "document-1:chapter-1:page-2:chunk-1", pageNumber: 2 }]
  );
});
