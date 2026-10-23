import { describe, it, expect } from "vitest";
import {
  romanToInteger,
  wordNumberToInteger,
  normalizeChapterNumber,
  sortChapterItems,
  stripChapterNumberPrefix,
  isChapterItem,
} from "@charan-interiors/contracts";

describe("chapterSorting utils", () => {
  describe("romanToInteger", () => {
    it("converts basic Roman numerals accurately", () => {
      expect(romanToInteger("I")).toBe(1);
      expect(romanToInteger("iv")).toBe(4);
      expect(romanToInteger("VIII")).toBe(8);
      expect(romanToInteger("ix")).toBe(9);
      expect(romanToInteger("XIV")).toBe(14);
      expect(romanToInteger("XLII")).toBe(42);
    });

    it("returns null for non-Roman strings", () => {
      expect(romanToInteger("ABC")).toBeNull();
      expect(romanToInteger("123")).toBeNull();
      expect(romanToInteger("")).toBeNull();
    });
  });

  describe("wordNumberToInteger", () => {
    it("converts English number words to integers", () => {
      expect(wordNumberToInteger("one")).toBe(1);
      expect(wordNumberToInteger("four")).toBe(4);
      expect(wordNumberToInteger("ten")).toBe(10);
      expect(wordNumberToInteger("TWELVE")).toBe(12);
    });

    it("returns null for non-number words", () => {
      expect(wordNumberToInteger("chapter")).toBeNull();
      expect(wordNumberToInteger("introduction")).toBeNull();
    });
  });

  describe("normalizeChapterNumber", () => {
    it("parses numeric values and strings", () => {
      expect(normalizeChapterNumber(5)).toBe(5);
      expect(normalizeChapterNumber("7")).toBe(7);
      expect(normalizeChapterNumber("Chapter 3")).toBe(3);
      expect(normalizeChapterNumber("Unit IV")).toBe(4);
      expect(normalizeChapterNumber("Section Nine")).toBe(9);
    });

    it("returns null for unparseable input", () => {
      expect(normalizeChapterNumber(null)).toBeNull();
      expect(normalizeChapterNumber(undefined)).toBeNull();
      expect(normalizeChapterNumber("Random Unrelated Text")).toBeNull();
    });
  });

  describe("sortChapterItems", () => {
    it("sorts chapters in sequential order", () => {
      const unsorted = [
        { chapter_number: 3, title: "Chapter 3", start_page: 30 },
        { chapter_number: 1, title: "Chapter 1", start_page: 1 },
        { chapter_number: 2, title: "Chapter 2", start_page: 15 },
      ];
      const sorted = sortChapterItems(unsorted);
      expect(sorted.map((c) => c.chapter_number)).toEqual([1, 2, 3]);
    });

    it("sorts by start_page when chapter_number is identical", () => {
      const items = [
        { chapter_number: 1, title: "Part B", start_page: 10 },
        { chapter_number: 1, title: "Part A", start_page: 1 },
      ];
      const sorted = sortChapterItems(items);
      expect(sorted[0]!.title).toBe("Part A");
      expect(sorted[1]!.title).toBe("Part B");
    });
  });

  describe("stripChapterNumberPrefix", () => {
    it("strips numerical and roman prefixes from titles", () => {
      expect(stripChapterNumberPrefix("Chapter 1: The Beginning", 1)).toBe("The Beginning");
      expect(stripChapterNumberPrefix("Section 1 - Overview", 1)).toBe("Overview");
      expect(stripChapterNumberPrefix("Chapter IV: Advanced Patterns", 4)).toBe(
        "Advanced Patterns"
      );
    });

    it("returns original title if no prefix pattern matches", () => {
      expect(stripChapterNumberPrefix("Introduction to Physics", 1)).toBe(
        "Introduction to Physics"
      );
    });
  });

  describe("isChapterItem", () => {
    it("identifies valid chapter objects", () => {
      expect(isChapterItem({ chapter_number: 1, start_page: 1 })).toBe(true);
      expect(isChapterItem({ title: "Chapter 1", start_page: 1 })).toBe(true);
      expect(isChapterItem({ start_page: 1 })).toBe(true);
    });

    it("rejects non-chapter items", () => {
      expect(isChapterItem(null)).toBe(false);
      expect(isChapterItem("string")).toBe(false);
      expect(isChapterItem({})).toBe(false);
    });
  });
});
