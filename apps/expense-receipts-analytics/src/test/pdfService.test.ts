import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validateAndRepairChapters, parsePdfWithPdfLib } from "../../server/services/pdfService.ts";

describe("pdfService", () => {
  describe("validateAndRepairChapters", () => {
    it("handles empty chapter inputs by synthesizing a full-document chapter", () => {
      const { chapters, totalPages } = validateAndRepairChapters([], 10, "Quarterly Report");
      expect(totalPages).toBe(10);
      expect(chapters.length).toBe(1);
      expect(chapters[0]!.title).toBe("Quarterly Report");
      expect(chapters[0]!.start_page).toBe(1);
      expect(chapters[0]!.end_page).toBe(10);
    });

    it("inserts front matter when chapter 1 starts on a later page", () => {
      const rawChapters = [
        { chapter_number: 1, title: "Foundations", start_page: 5, end_page: 15 },
        { chapter_number: 2, title: "Advanced Topics", start_page: 16, end_page: 30 },
      ];
      const { chapters } = validateAndRepairChapters(rawChapters, 30, "Tech Manual");
      expect(chapters[0]!.title).toContain("Front Matter");
      expect(chapters[0]!.start_page).toBe(1);
      expect(chapters[0]!.end_page).toBe(4);
      expect(chapters[1]!.title).toBe("Foundations");
      expect(chapters[1]!.start_page).toBe(5);
    });

    it("repairs contiguous page gaps and overlaps between adjacent chapters", () => {
      const rawChapters = [
        { chapter_number: 1, title: "Part 1", start_page: 1, end_page: 10 },
        // Gap from page 10 to 14
        { chapter_number: 2, title: "Part 2", start_page: 15, end_page: 25 },
      ];
      const { chapters } = validateAndRepairChapters(rawChapters, 25, "Book");
      // Chapter 1's end_page should be extended to 14 to cover the gap
      expect(chapters[0]!.end_page).toBe(14);
      expect(chapters[1]!.start_page).toBe(15);
    });
  });

  describe("parsePdfWithPdfLib", () => {
    it("partitions a programmatic PDF into balanced logical sections", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([600, 400]);
      doc.addPage([600, 400]);
      doc.addPage([600, 400]);
      const pdfBytes = await doc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      const result = await parsePdfWithPdfLib(pdfBuffer, "Test Document.pdf");
      expect(result.document_title).toBe("Test Document");
      expect(result.total_pages).toBe(3);
      expect(result.chapters.length).toBeGreaterThan(0);
      expect(result.chapters[0]!.start_page).toBe(1);
    });
  });
});
