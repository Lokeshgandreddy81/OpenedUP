import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { parsePdfWithPdfLib } from "../../src/services/pdf.service.js";

describe("pdfService backend unit tests", () => {
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
