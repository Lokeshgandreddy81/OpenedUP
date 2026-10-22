import { z } from "zod";
import { Type } from "@google/genai";

export const readReceiptsPhotoSchema = z.object({
  globalIndex: z.number(),
  totalPhotos: z.number(),
  mimeType: z.string().default("image/jpeg"),
  base64Data: z.string().min(1, "base64Data is required"),
});

export const readReceiptsRequestSchema = z.object({
  photos: z.array(readReceiptsPhotoSchema).min(1, "No photos provided in batch"),
});

export type ReadReceiptsRequest = z.infer<typeof readReceiptsRequestSchema>;

export const checkDuplicatesRowSchema = z.object({
  row: z.number(),
  photo_index: z.number(),
  merchant: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  final_total: z.number().nullable().optional(),
  printed_total: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  card_last4: z.string().nullable().optional(),
  source_type: z.string().optional(),
  source_label: z.string().optional(),
});

export const checkDuplicatesRequestSchema = z.object({
  rows: z.array(checkDuplicatesRowSchema),
});

export type CheckDuplicatesRequest = z.infer<typeof checkDuplicatesRequestSchema>;

export const READ_SYSTEM_INSTRUCTION = `You are a careful, meticulous bookkeeper examining photos of physical receipts and business invoices. Your job is to find every receipt in every photo, box each one accurately, and extract its printed and handwritten values.

What to look for and catch that a basic scanner misses:
- Several receipts per photo: Box each physical receipt separately using box_2d = [ymin, xmin, ymax, xmax] normalised 0–1000 relative to the photo, even when receipts overlap or are tilted.
- Which number is the total: Find the true total charged, NOT the subtotal, NOT "cash tendered", and NOT "change". When there is no handwritten tip, set both printed_total and final_total to the same true total charged.
- Handwritten tips on card slips that change the printed total: Return printed_total, handwritten_tip, and final_total separately. If there is a handwritten tip that changes the total, add a flag with type "tip_changes_total". If there is no handwritten tip on the receipt, simply return null for handwritten_tip with NO flag.
- Foreign currency: Read the ISO 3-letter currency code (e.g., USD, GBP, EUR, NZD, AUD, JPY, CAD) from currency symbols, words, tax labels, or shop address. Never convert currencies.
- Tax lines (VAT, GST, consumption tax): Read the tax amount and tax_label (e.g. "VAT 20%", "GST 15%"). If a tax line is visibly printed on the receipt but blurred/unreadable, return null for tax, lower tax confidence, and add a flag with type "unreadable_field" and note "tax unreadable". If the receipt simply has no tax line, return null for tax and tax_label with NO flag.
- B2B Tax & Invoice compliance fields:
  - tax_id_or_vat: Extract the merchant's VAT, GST, EIN, or ABN tax registration ID if printed on the receipt (e.g. "GB 123 4567 89", "GST 12-345-678"), or null if not printed.
  - is_tax_invoice: Set to true if the receipt shows an itemized tax/VAT line, a merchant tax registration number, or a formal "TAX INVOICE" header; set to false if it is only a summary card terminal slip or receipt without tax details.
- Faded, creased, stained, or cut-off text: Only add an "unreadable_field" or "low_confidence" flag when a core printed field (merchant, date, total, or a visibly present tax/tip line) is damaged, blurry, or cut off. Do NOT add flags for optional fields (like handwritten_tip, time, item_count, card_last4, or tax_id_or_vat) that are simply not printed on the receipt.
- Time and item count: Read "time" (as HH:MM:SS or HH:MM as printed, or null if not printed) and "item_count" (explicit printed item count or count of printed line items on the receipt, or null if not printed or unreadable). Never guess either field.

Strict rules:
1. Return one entry per physical receipt, even if the same receipt appears in two photos (a separate duplicate pass handles that).
2. Every total, tax, and tip must be read directly from the receipt. Never compute or estimate a missing monetary value; return null and a flag.
3. Categories must come strictly from this fixed list: "Meals", "Travel", "Lodging", "Office", "Other".
4. Never give advice on what is tax-deductible, allowable, or claimable.
5. Date should be formatted as YYYY-MM-DD when possible, or as printed if partial, or null if unreadable.`;

export const READ_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    receipts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          photo_index: {
            type: Type.NUMBER,
            description: "The 1-based global photo index passed in the prompt.",
          },
          box_2d: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Bounding box [ymin, xmin, ymax, xmax] normalised 0 to 1000.",
          },
          merchant: {
            type: Type.STRING,
            nullable: true,
            description: "Merchant or shop name as printed on the receipt, or null if unreadable.",
          },
          date: {
            type: Type.STRING,
            nullable: true,
            description: "Receipt date in YYYY-MM-DD format if possible, or null if unreadable.",
          },
          time: {
            type: Type.STRING,
            nullable: true,
            description:
              "Time printed on receipt (e.g. '09:34:12' or '09:34'), or null if not present.",
          },
          item_count: {
            type: Type.NUMBER,
            nullable: true,
            description: "Number of items read from the receipt, or null if not present.",
          },
          printed_total: {
            type: Type.NUMBER,
            nullable: true,
            description: "Printed total before handwritten tip, or null if unreadable.",
          },
          handwritten_tip: {
            type: Type.NUMBER,
            nullable: true,
            description: "Handwritten tip or gratuity amount if present, otherwise null.",
          },
          final_total: {
            type: Type.NUMBER,
            nullable: true,
            description: "Final total written or printed on the receipt, or null if unreadable.",
          },
          currency: {
            type: Type.STRING,
            nullable: true,
            description:
              "3-letter currency code read from symbols, words, or address (e.g. USD, GBP, JPY, NZD, EUR).",
          },
          tax: {
            type: Type.NUMBER,
            nullable: true,
            description: "Tax amount printed on the receipt, or null if not shown or unreadable.",
          },
          tax_label: {
            type: Type.STRING,
            nullable: true,
            description: "Tax label printed on the receipt (e.g. 'VAT 20%', 'GST'), or null.",
          },
          tax_id_or_vat: {
            type: Type.STRING,
            nullable: true,
            description:
              "Merchant VAT, GST, EIN, or ABN tax registration ID if printed on the receipt, or null.",
          },
          is_tax_invoice: {
            type: Type.BOOLEAN,
            nullable: true,
            description:
              "True if the receipt shows an itemized tax/VAT line, tax registration number, or formal TAX INVOICE header; false if only a card slip or receipt without tax details.",
          },
          category: {
            type: Type.STRING,
            description: "Fixed category: Meals, Travel, Lodging, Office, or Other.",
          },
          card_last4: {
            type: Type.STRING,
            nullable: true,
            description: "Last 4 digits of payment card if shown (e.g. '0000'), or null.",
          },
          confidence: {
            type: Type.OBJECT,
            properties: {
              merchant: { type: Type.NUMBER },
              date: { type: Type.NUMBER },
              printed_total: { type: Type.NUMBER },
              handwritten_tip: { type: Type.NUMBER },
              currency: { type: Type.NUMBER },
              tax: { type: Type.NUMBER },
            },
            required: ["merchant", "date", "printed_total", "handwritten_tip", "currency", "tax"],
          },
          flags: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description:
                    "One of: tip_changes_total, unreadable_field, foreign_currency, possible_duplicate, low_confidence, not_a_receipt",
                },
                note: {
                  type: Type.STRING,
                  description: "Short human-readable explanation of the flag.",
                },
              },
              required: ["type", "note"],
            },
          },
        },
        required: [
          "photo_index",
          "box_2d",
          "merchant",
          "date",
          "time",
          "item_count",
          "printed_total",
          "handwritten_tip",
          "final_total",
          "currency",
          "tax",
          "tax_label",
          "tax_id_or_vat",
          "is_tax_invoice",
          "category",
          "card_last4",
          "confidence",
          "flags",
        ],
      },
    },
  },
  required: ["receipts"],
};

export const DUPLICATES_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    duplicates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          row: {
            type: Type.NUMBER,
            description: "The later 1-based row number that is a likely duplicate.",
          },
          duplicate_of: {
            type: Type.NUMBER,
            description: "The earlier 1-based row number that this row duplicates.",
          },
          reason: {
            type: Type.STRING,
            description:
              "Clear explanation, e.g. 'Same merchant, date, total and card; photographed twice' or 'Cross-source duplicate between Google Drive and Gmail'.",
          },
        },
        required: ["row", "duplicate_of", "reason"],
      },
    },
  },
  required: ["duplicates"],
};
