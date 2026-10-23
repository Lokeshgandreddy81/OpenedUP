import { describe, it, expect } from "vitest";
import { validateAndRepairChapters } from "../../src/domains/receipts/application/chapterRepair.js";

describe("chapterRepair", () => {
  it("creates a single complete document chapter if chapters list is empty", () => {
    const { chapters, totalPages } = validateAndRepairChapters([], 10, "Test Doc");
    expect(totalPages).toBe(10);
    expect(chapters.length).toBe(1);
    expect(chapters[0]?.title).toBe("Test Doc");
    expect(chapters[0]?.start_page).toBe(1);
    expect(chapters[0]?.end_page).toBe(10);
  });

  it("fixes overlapping page ranges between adjacent chapters", () => {
    const raw = [
      { chapter_number: 1, title: "Ch 1", start_page: 1, end_page: 8 },
      { chapter_number: 2, title: "Ch 2", start_page: 6, end_page: 15 },
    ];
    const { chapters } = validateAndRepairChapters(raw, 15, "Test Doc");
    expect(chapters[0]?.start_page).toBe(1);
    expect(chapters[0]?.end_page).toBe(5);
    expect(chapters[1]?.start_page).toBe(6);
    expect(chapters[1]?.end_page).toBe(15);
  });

  it("fills gaps between adjacent chapters so no pages are orphaned", () => {
    const raw = [
      { chapter_number: 1, title: "Ch 1", start_page: 1, end_page: 4 },
      { chapter_number: 2, title: "Ch 2", start_page: 8, end_page: 12 },
    ];
    const { chapters } = validateAndRepairChapters(raw, 12, "Test Doc");
    expect(chapters[0]?.end_page).toBe(7);
    expect(chapters[1]?.start_page).toBe(8);
  });

  it("adds Front Matter when first chapter does not begin at page 1", () => {
    const raw = [{ chapter_number: 1, title: "First Chapter", start_page: 5, end_page: 10 }];
    const { chapters } = validateAndRepairChapters(raw, 10, "Book");
    expect(chapters[0]?.title).toBe("Front Matter & Preface");
    expect(chapters[0]?.start_page).toBe(1);
    expect(chapters[0]?.end_page).toBe(4);
    expect(chapters[1]?.start_page).toBe(5);
  });

  it("adds Back Matter when trailing pages remain unassigned", () => {
    const raw = [{ chapter_number: 1, title: "Main Body", start_page: 1, end_page: 10 }];
    const { chapters } = validateAndRepairChapters(raw, 20, "Book");
    expect(chapters.length).toBe(2);
    expect(chapters[1]?.title).toBe("Back Matter & Index");
    expect(chapters[1]?.start_page).toBe(11);
    expect(chapters[1]?.end_page).toBe(20);
  });
});
