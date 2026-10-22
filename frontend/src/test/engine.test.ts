import { describe, it, expect } from "vitest";
import {
  isZeroDecimalCurrency,
  toMinorUnits,
  fromMinorUnits,
  getCurrencySymbol,
  formatCurrencyAmount,
  formatDisplayDate,
  normalizeMerchantName,
  areMerchantsSimilar,
  areDatesWithinOneDay,
  isBoxValid,
  generateReceiptsCsv,
} from "../utils/engine.ts";
import type { ComputedRow } from "@charan-interiors/shared";

describe("engine financial & ledger utils", () => {
  describe("currency calculations", () => {
    it("handles standard 2-decimal currencies via minor units", () => {
      expect(isZeroDecimalCurrency("USD")).toBe(false);
      expect(toMinorUnits(19.99, "USD")).toBe(1999);
      expect(fromMinorUnits(1999, "USD")).toBe(19.99);
    });

    it("handles zero-decimal currencies (JPY, KRW, VND)", () => {
      expect(isZeroDecimalCurrency("JPY")).toBe(true);
      expect(toMinorUnits(1500, "JPY")).toBe(1500);
      expect(fromMinorUnits(1500, "JPY")).toBe(1500);
    });

    it("resolves currency symbols properly", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
      expect(getCurrencySymbol("GBP")).toBe("£");
      expect(getCurrencySymbol("EUR")).toBe("€");
      expect(getCurrencySymbol("JPY")).toBe("¥");
    });

    it("formats currency amounts gracefully", () => {
      expect(formatCurrencyAmount(123.45, "USD")).toBe("$123.45");
      expect(formatCurrencyAmount(2000, "JPY")).toBe("¥2,000");
      expect(formatCurrencyAmount(null, "USD")).toBe("—");
    });

    it("formats display dates gracefully", () => {
      expect(formatDisplayDate("2026-09-23")).toBe("23/09/2026");
      expect(formatDisplayDate(null)).toBe("—");
      expect(formatDisplayDate("invalid-date")).toBe("invalid-date");
    });
  });

  describe("merchant & date matching", () => {
    it("normalizes merchant names by stripping punctuation and corporate suffixes", () => {
      expect(normalizeMerchantName("STARBUCKS COFFEE #124")).toBe("Starbucks Coffee");
      expect(normalizeMerchantName(null)).toBe("Unreadable merchant");
    });

    it("evaluates merchant similarity", () => {
      expect(areMerchantsSimilar("Uber Technologies", "Uber")).toBe(true);
      expect(areMerchantsSimilar("Delta Air Lines", "United Airlines")).toBe(false);
      expect(areMerchantsSimilar(null, "Google")).toBe(false);
    });

    it("verifies if two dates are within one calendar day", () => {
      expect(areDatesWithinOneDay("2026-03-15", "2026-03-15")).toBe(true);
      expect(areDatesWithinOneDay("2026-03-15", "2026-03-16")).toBe(true);
      expect(areDatesWithinOneDay("2026-03-15", "2026-03-17")).toBe(false);
      expect(areDatesWithinOneDay(null, "2026-03-15")).toBe(true);
    });
  });

  describe("bounding box validation", () => {
    it("validates correct normalised 0-1000 boxes", () => {
      expect(isBoxValid([100, 100, 500, 500])).toBe(true);
      expect(isBoxValid([0, 0, 1000, 1000])).toBe(true);
    });

    it("rejects inverted or out-of-range boxes", () => {
      expect(isBoxValid([500, 100, 100, 500])).toBe(false); // ymin > ymax
      expect(isBoxValid([100, 500, 500, 100])).toBe(false); // xmin > xmax
    });
  });

  describe("generateReceiptsCsv", () => {
    it("exports ledger rows to well-formed CSV with headers", () => {
      const sampleRow: ComputedRow = {
        id: "rec-1",
        box_2d: [100, 100, 900, 900],
        row: 1,
        photo_index: 1,
        merchant: "Office Supplies Co",
        date: "2026-04-01",
        time: "14:30",
        item_count: 3,
        printed_total: 45.0,
        handwritten_tip: null,
        final_total: 45.0,
        currency: "USD",
        tax: 3.6,
        tax_label: "Sales Tax",
        tax_id_or_vat: "12-3456789",
        is_tax_invoice: true,
        category: "Office",
        card_last4: "4242",
        confidence: {
          merchant: 0.95,
          date: 0.99,
          printed_total: 0.98,
          handwritten_tip: 1.0,
          currency: 0.99,
          tax: 0.95,
        },
        flags: [],
        all_flags: [],
        code_calculated_total: 48.6,
        tip_mismatch: false,
        effective_currency: "USD",
        is_foreign: false,
        converted_main_total: 48.6,
        needs_check: false,
        primary_flag_label: null,
        duplicate_of: null,
        duplicate_reason: null,
      };

      const csv = generateReceiptsCsv([sampleRow]);
      expect(csv).toContain("Row,Document Index,Document Name");
      expect(csv).toContain("Office Supplies Co");
      expect(csv).toContain("12-3456789");
    });
  });
});
