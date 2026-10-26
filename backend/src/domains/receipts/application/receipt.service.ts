import { z } from "zod";
import type { PhotoInput, ProviderId } from "@charan-interiors/contracts";
import { AppError } from "../../../platform/errors/errors.js";
import { generateMultiProviderChat } from "../../chat/providers/llm.service.js";
import { logEvent } from "../../../platform/observability/logger.js";

const READ_SYSTEM_INSTRUCTION = `You are a careful, meticulous bookkeeper examining photos of physical receipts and business invoices. Your job is to find every receipt in every photo, box each one accurately, and extract its printed and handwritten values.

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

const ReceiptExtractionSchema = z
  .object({
    receipts: z.array(
      z
        .object({
          photo_index: z.number().int().positive(),
          box_2d: z.tuple([z.number(), z.number(), z.number(), z.number()]),
          merchant: z.string().nullable(),
          date: z.string().nullable(),
          time: z.string().nullable(),
          item_count: z.number().nullable(),
          printed_total: z.number().nullable(),
          handwritten_tip: z.number().nullable(),
          final_total: z.number().nullable(),
          currency: z.string().nullable(),
          tax: z.number().nullable(),
          tax_label: z.string().nullable(),
          tax_id_or_vat: z.string().nullable().optional(),
          is_tax_invoice: z.boolean().nullable().optional(),
          category: z.enum(["Meals", "Travel", "Lodging", "Office", "Other"]),
          card_last4: z.string().nullable(),
          confidence: z.object({
            merchant: z.number().min(0).max(1),
            date: z.number().min(0).max(1),
            printed_total: z.number().min(0).max(1),
            handwritten_tip: z.number().min(0).max(1),
            currency: z.number().min(0).max(1),
            tax: z.number().min(0).max(1),
          }),
          flags: z.array(z.object({ type: z.string(), note: z.string() })),
        })
        .passthrough()
    ),
  })
  .strict();

export interface ReceiptExtractionModel {
  modelId: string;
  customModel?: string;
  customProvider?: ProviderId;
  apiKey?: string;
  baseUrl?: string;
  signal?: AbortSignal;
}

export async function readReceipts(
  photos: PhotoInput[],
  model: ReceiptExtractionModel
): Promise<{ receipts: unknown[] }> {
  const startTime = Date.now();
  const indices = photos.map((photo) => photo.globalIndex);
  const totalKB = Math.round(
    photos.reduce((total, photo) => total + photo.base64Data.length * 0.75, 0) / 1024
  );

  logEvent("START /api/read-receipts", {
    model: model.modelId,
    photoIndices: indices,
    totalKB,
  });

  const indexDescriptions = photos
    .map(
      (photo, index) =>
        `Image ${index + 1} in this request is Photo ${photo.globalIndex} of ${photo.totalPhotos} (set photo_index = ${photo.globalIndex}).`
    )
    .join("\n");
  const userPrompt = `Examine the following ${photos.length} photo(s) of receipts.\n${indexDescriptions}\n\nFind every physical receipt in each photo, box it with box_2d = [ymin, xmin, ymax, xmax] (0-1000), and extract all fields strictly following the system instructions. Return only JSON in this shape: {"receipts":[{"photo_index":1,"box_2d":[0,0,1000,1000],"merchant":null,"date":null,"time":null,"item_count":null,"printed_total":null,"handwritten_tip":null,"final_total":null,"currency":null,"tax":null,"tax_label":null,"tax_id_or_vat":null,"is_tax_invoice":null,"category":"Other","card_last4":null,"confidence":{"merchant":0,"date":0,"printed_total":0,"handwritten_tip":0,"currency":0,"tax":0},"flags":[]}]}. Do not include markdown or commentary.`;
  const generated = await generateMultiProviderChat({
    modelId: model.modelId,
    ...(model.customModel ? { customModel: model.customModel } : {}),
    ...(model.customProvider ? { customProvider: model.customProvider } : {}),
    ...(model.apiKey ? { injectedApiKey: model.apiKey } : {}),
    ...(model.baseUrl ? { injectedBaseUrl: model.baseUrl } : {}),
    ...(model.signal ? { signal: model.signal } : {}),
    images: photos.map((photo) => ({
      name: `Photo ${photo.globalIndex} of ${photo.totalPhotos}`,
      mimeType: photo.mimeType || "image/jpeg",
      base64Data: photo.base64Data,
    })),
    systemInstruction: READ_SYSTEM_INSTRUCTION,
    effort: "Low",
    messages: [{ role: "user", content: userPrompt }],
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(generated.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new AppError(
      "The selected model returned invalid receipt data. Retry or choose another model.",
      502
    );
  }
  const result = ReceiptExtractionSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError(
      "The selected model returned invalid receipt data. Retry or choose another model.",
      502
    );
  }
  const requestedPhotoIndices = new Set(indices);
  if (result.data.receipts.some((receipt) => !requestedPhotoIndices.has(receipt.photo_index))) {
    throw new AppError(
      "The selected model returned receipt data for an unknown photo. Retry the upload.",
      502
    );
  }

  logEvent("DONE /api/read-receipts", {
    model: generated.modelUsed,
    provider: generated.providerUsed,
    photoIndices: indices,
    receiptsFound: result.data.receipts.length,
    elapsedMs: Date.now() - startTime,
  });

  return result.data;
}
