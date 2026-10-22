import { Type } from "@google/genai";
import type { ReceiptRowInput } from "@charan-interiors/shared";
import { resolveApiKey } from "../config/index.js";
import { parseJsonSafely } from "../utils/errors.js";
import { logEvent } from "../utils/logger.js";
import { generateWithModelFallback, getActiveModelId } from "./gemini.service.js";

const DUPLICATES_RESPONSE_SCHEMA = {
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

export async function checkDuplicates(rows: ReceiptRowInput[]): Promise<{ duplicates: unknown[] }> {
  const startTime = Date.now();

  if (!rows || rows.length < 2) {
    return { duplicates: [] };
  }

  if (!resolveApiKey()) {
    logEvent("SKIP /api/check-duplicates: No GEMINI_API_KEY configured");
    return { duplicates: [] };
  }

  logEvent("START /api/check-duplicates", {
    model: getActiveModelId(),
    rowCount: rows.length,
  });

  const { response, modelUsed } = await generateWithModelFallback({
    contents: `Here are the merged receipt rows extracted from a pile of receipt photos and synced Workspace sources:\n\n${JSON.stringify(
      rows,
      null,
      2
    )}\n\nIdentify any likely duplicate pairs where the same transaction appears more than once (e.g., same merchant, same total, same or adjacent date, same card last 4 digits). Pay special attention to duplicate transactions across different ingestion sources (e.g., a receipt synced from Google Drive or Gmail that matches a manual upload or another email/Drive file) and include that cross-source context in "reason". Always set "row" to the higher row number and "duplicate_of" to the lower row number.`,
    config: {
      systemInstruction:
        "You are a careful bookkeeper checking extracted receipt rows for duplicate transactions across manual uploads, Google Drive folders, and Gmail receipts. Only report pairs that are genuinely likely to be the same transaction captured twice.",
      responseMimeType: "application/json",
      responseSchema: DUPLICATES_RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

  const parsed = parseJsonSafely<{ duplicates: unknown[] }>(response.text, {
    duplicates: [],
  });

  logEvent("DONE /api/check-duplicates", {
    model: modelUsed,
    duplicatesFound: Array.isArray(parsed.duplicates) ? parsed.duplicates.length : 0,
    elapsedMs: Date.now() - startTime,
  });

  return parsed;
}
