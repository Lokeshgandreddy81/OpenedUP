import { describe, it, expect } from "vitest";
import { checkDuplicates } from "../../src/domains/receipts/application/duplicate.service.js";

describe("duplicate.service unit tests", () => {
  it("returns empty duplicates when less than 2 rows are provided", async () => {
    const res1 = await checkDuplicates([]);
    expect(res1.duplicates).toEqual([]);

    const res2 = await checkDuplicates([
      {
        row: 1,
        photo_index: 1,
        merchant: "Acme",
        date: "2026-01-01",
        final_total: 100,
      },
    ]);
    expect(res2.duplicates).toEqual([]);
  });

  it("handles empty API key without crashing", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const res = await checkDuplicates([
        { row: 1, photo_index: 1, merchant: "Coffee", final_total: 5 },
        { row: 2, photo_index: 1, merchant: "Coffee", final_total: 5 },
      ]);
      expect(res.duplicates).toEqual([]);
    } finally {
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });
});
