import { describe, it, expect } from "vitest";
import {
  stripFileExtension,
  inferMimeTypeFromFile,
  isPdfFile,
  isSupportedImageFile,
  buildPhotoBatches,
} from "../utils/imageProcessor.ts";
import type { UploadedPhoto } from "../types";

describe("imageProcessor utils", () => {
  describe("stripFileExtension", () => {
    it("strips common file extensions cleanly", () => {
      expect(stripFileExtension("receipt_march.pdf")).toBe("receipt_march");
      expect(stripFileExtension("invoice_2026.jpeg")).toBe("invoice_2026");
      expect(stripFileExtension("archive.tar.gz")).toBe("archive.tar");
      expect(stripFileExtension("noextension")).toBe("noextension");
    });
  });

  describe("file type inference", () => {
    it("identifies PDF files correctly", () => {
      const pdfFile = new File(["dummy"], "contract.pdf", { type: "application/pdf" });
      expect(isPdfFile(pdfFile)).toBe(true);
      expect(isPdfFile(null, "document.pdf")).toBe(true);
      expect(isPdfFile(null, "photo.png")).toBe(false);
    });

    it("identifies supported image files correctly", () => {
      const pngFile = new File(["dummy"], "receipt.png", { type: "image/png" });
      const jpgFile = new File(["dummy"], "receipt.jpg", { type: "image/jpeg" });
      const textFile = new File(["dummy"], "notes.txt", { type: "text/plain" });

      expect(isSupportedImageFile(pngFile)).toBe(true);
      expect(isSupportedImageFile(jpgFile)).toBe(true);
      expect(isSupportedImageFile(textFile)).toBe(false);
    });

    it("infers MIME type from file extension when type is empty", () => {
      const fileWithoutType = new File(["dummy"], "scan.webp", { type: "" });
      expect(inferMimeTypeFromFile(fileWithoutType)).toBe("image/webp");
    });
  });

  describe("buildPhotoBatches", () => {
    it("batches photos into chunks respecting batch limits", () => {
      const photos: UploadedPhoto[] = Array.from({ length: 7 }, (_, i) => ({
        id: `photo-${i + 1}`,
        globalIndex: i + 1,
        docIndex: i + 1,
        file: new File(["dummy"], `receipt-${i + 1}.jpg`, { type: "image/jpeg" }),
        name: `receipt-${i + 1}.jpg`,
        displayName: `receipt-${i + 1}`,
        objectUrl: "blob:mock",
        base64Data: "abc",
        mimeType: "image/jpeg",
        status: "idle",
        receiptsCount: 0,
      }));

      const batches = buildPhotoBatches(photos);
      expect(batches.length).toBeGreaterThan(0);
      const totalFlattened = batches.reduce((acc, b) => acc + b.length, 0);
      expect(totalFlattened).toBe(7);
    });

    it("handles empty photos list", () => {
      expect(buildPhotoBatches([])).toEqual([]);
    });
  });
});
