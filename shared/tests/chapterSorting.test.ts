import { describe, it, expect } from "vitest";
import {
  romanToInteger,
  wordNumberToInteger,
  normalizeChapterNumber,
  extractChapterNumberFromObject,
  isChapterItem,
  sortChapterItems,
  stripChapterNumberPrefix,
} from "../src/utils/chapterSorting.js";

describe("chapterSorting utils", () => {
  describe("romanToInteger", () => {
    it("converts basic and complex roman numerals", () => {
      expect(romanToInteger("I")).toBe(1);
      expect(romanToInteger("IV")).toBe(4);
      expect(romanToInteger("IX")).toBe(9);
      expect(romanToInteger("XIV")).toBe(14);
      expect(romanToInteger("XXXII")).toBe(32);
      expect(romanToInteger("XL")).toBe(40);
      expect(romanToInteger("XC")).toBe(90);
      expect(romanToInteger("CD")).toBe(400);
      expect(romanToInteger("CM")).toBe(900);
      expect(romanToInteger("MCMXCV")).toBe(1995);
    });

    it("returns null for invalid strings", () => {
      expect(romanToInteger("")).toBeNull();
      expect(romanToInteger("ABC")).toBeNull();
      expect(romanToInteger("IIII")).toBeNull();
    });
  });

  describe("wordNumberToInteger", () => {
    it("converts spelled out numbers", () => {
      expect(wordNumberToInteger("one")).toBe(1);
      expect(wordNumberToInteger("twenty")).toBe(20);
      expect(wordNumberToInteger("twenty five")).toBe(25);
      expect(wordNumberToInteger("thirty-two")).toBe(32);
      expect(wordNumberToInteger("one hundred")).toBe(100);
    });

    it("returns null for non-numbers", () => {
      expect(wordNumberToInteger("hello world")).toBeNull();
      expect(wordNumberToInteger("")).toBeNull();
    });
  });

  describe("normalizeChapterNumber", () => {
    it("handles numbers and numeric strings", () => {
      expect(normalizeChapterNumber(12)).toBe(12);
      expect(normalizeChapterNumber("42")).toBe(42);
      expect(normalizeChapterNumber(null)).toBeNull();
      expect(normalizeChapterNumber(undefined)).toBeNull();
    });

    it("handles front-matter and back-matter keywords", () => {
      expect(normalizeChapterNumber("Preface")).toBe(0);
      expect(normalizeChapterNumber("Table of Contents")).toBe(0);
      expect(normalizeChapterNumber("Foreword")).toBe(0);
      expect(normalizeChapterNumber("Index")).toBe(2000);
      expect(normalizeChapterNumber("Bibliography")).toBe(2000);
    });

    it("handles prefixed chapter titles", () => {
      expect(normalizeChapterNumber("Chapter 4")).toBe(4);
      expect(normalizeChapterNumber("Ch. IV")).toBe(4);
      expect(normalizeChapterNumber("Section 12: Discussion")).toBe(12);
      expect(normalizeChapterNumber("Appendix A")).toBe(1001);
      expect(normalizeChapterNumber("Appendix B")).toBe(1002);
      expect(normalizeChapterNumber("Capítulo 3")).toBe(3);
    });

    it("handles fallback embedded numbers and standalone numerals", () => {
      expect(normalizeChapterNumber("IV")).toBe(4);
      expect(normalizeChapterNumber("Document - Chapter 7 overview")).toBe(7);
      expect(normalizeChapterNumber("5. Methods")).toBe(5);
      expect(normalizeChapterNumber("V. Conclusion")).toBe(5);
      expect(normalizeChapterNumber("Three")).toBe(3);
    });
  });

  describe("extractChapterNumberFromObject", () => {
    it("extracts from direct properties and nested receipts", () => {
      expect(extractChapterNumberFromObject({ chapter_number: 3 })).toBe(3);
      expect(extractChapterNumberFromObject({ title: "Chapter 5" })).toBe(5);
      expect(extractChapterNumberFromObject({ name: "Section 8" })).toBe(8);
      expect(extractChapterNumberFromObject({ start_page: 15 })).toBe(15);
      expect(extractChapterNumberFromObject({ row: 22 })).toBe(22);
      expect(
        extractChapterNumberFromObject({
          receipts: [{ chapter_number: "Ch. 9" }],
        })
      ).toBe(9);
      expect(extractChapterNumberFromObject(null)).toBe(Infinity);
    });
  });

  describe("isChapterItem", () => {
    it("identifies chapter items", () => {
      expect(isChapterItem({ chapter_number: 1 })).toBe(true);
      expect(isChapterItem({ start_page: 10 })).toBe(true);
      expect(isChapterItem({ chapter_title: "Intro" })).toBe(true);
      expect(isChapterItem({ name: "Chapter 1" })).toBe(true);
      expect(isChapterItem({ receipts: [{ chapter_number: 2 }] })).toBe(true);
      expect(isChapterItem({ name: "Regular Merchant" })).toBe(false);
      expect(isChapterItem(null)).toBe(false);
    });
  });

  describe("sortChapterItems", () => {
    it("sorts items by docIndex, page, chapter_number, and row", () => {
      const items = [
        { doc_index: 2, start_page: 1, chapter_number: 1 },
        { doc_index: 1, start_page: 15, chapter_number: 2 },
        { doc_index: 1, start_page: 5, chapter_number: 1 },
        { doc_index: 1, start_page: 25, chapter_number: 3, row: 2 },
        { doc_index: 1, start_page: 25, chapter_number: 3, row: 1 },
      ];

      const sorted = sortChapterItems(items);
      expect(sorted[0]).toEqual({ doc_index: 1, start_page: 5, chapter_number: 1 });
      expect(sorted[1]).toEqual({ doc_index: 1, start_page: 15, chapter_number: 2 });
      expect(sorted[2]).toEqual({ doc_index: 1, start_page: 25, chapter_number: 3, row: 1 });
      expect(sorted[3]).toEqual({ doc_index: 1, start_page: 25, chapter_number: 3, row: 2 });
      expect(sorted[4]).toEqual({ doc_index: 2, start_page: 1, chapter_number: 1 });
    });
  });

  describe("stripChapterNumberPrefix", () => {
    it("strips matching chapter prefixes from title", () => {
      expect(stripChapterNumberPrefix("Chapter 4: Memory", 4)).toBe("Memory");
      expect(stripChapterNumberPrefix("Ch. IV – Memory", 4)).toBe("Memory");
      expect(stripChapterNumberPrefix("Chapter 5: Memory", 4)).toBe("Chapter 5: Memory");
    });
  });
});
