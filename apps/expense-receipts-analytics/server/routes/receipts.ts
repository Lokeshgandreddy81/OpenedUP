import { Router } from "express";
import {
  readReceiptsRequestSchema,
  checkDuplicatesRequestSchema,
  READ_SYSTEM_INSTRUCTION,
  READ_RESPONSE_SCHEMA,
  DUPLICATES_RESPONSE_SCHEMA,
  type ReadReceiptsRequest,
  type CheckDuplicatesRequest,
} from "../schemas/receipts.ts";
import { validateBody } from "../middleware/validateRequest.ts";
import {
  generateWithModelFallback,
  parseJsonSafely,
  getActiveModelId,
} from "../services/geminiService.ts";
import { resolveApiKey } from "../config.ts";
import { logEvent } from "../logger.ts";

export const receiptsRouter = Router();

receiptsRouter.post(
  "/api/read-receipts",
  validateBody(readReceiptsRequestSchema),
  async (req, res) => {
    const startTime = Date.now();
    try {
      const { photos } = req.body as ReadReceiptsRequest;

      if (!resolveApiKey()) {
        res.status(400).json({
          error:
            "Receipt photo scanning requires a Gemini API key. However, PDF chapter breakdown works 100% locally with Python (zero API key needed).",
        });
        return;
      }

      const indices = photos.map((p) => p.globalIndex);
      const totalKB = Math.round(
        photos.reduce((acc, p) => acc + (p.base64Data?.length || 0) * 0.75, 0) / 1024
      );
      logEvent("START /api/read-receipts", {
        model: getActiveModelId(),
        photoIndices: indices,
        totalKB,
      });

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
        [];

      const indexDescriptions = photos
        .map(
          (p, i) =>
            `Image ${i + 1} in this request is Photo ${p.globalIndex} of ${p.totalPhotos} (set photo_index = ${p.globalIndex}).`
        )
        .join("\n");

      parts.push({
        text: `Examine the following ${photos.length} photo(s) of receipts.\n${indexDescriptions}\n\nFind every physical receipt in each photo, box it with box_2d = [ymin, xmin, ymax, xmax] (0-1000), and extract all fields strictly following the schema.`,
      });

      for (const photo of photos) {
        parts.push({
          text: `Photo ${photo.globalIndex} of ${photo.totalPhotos} is the image below (use photo_index: ${photo.globalIndex}):`,
        });
        parts.push({
          inlineData: {
            mimeType: photo.mimeType || "image/jpeg",
            data: photo.base64Data,
          },
        });
      }

      const { response, modelUsed } = await generateWithModelFallback({
        contents: { parts },
        config: {
          systemInstruction: READ_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: READ_RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });

      const parsed = parseJsonSafely<{ receipts: unknown[] }>(response.text, {
        receipts: [],
      });
      const elapsedMs = Date.now() - startTime;
      logEvent("DONE /api/read-receipts", {
        model: modelUsed,
        photoIndices: indices,
        receiptsFound: Array.isArray(parsed.receipts) ? parsed.receipts.length : 0,
        elapsedMs,
      });

      res.json(parsed);
    } catch (error: unknown) {
      const elapsedMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : "Failed to read receipts batch";
      logEvent("ERROR /api/read-receipts", { message, elapsedMs });
      res.status(500).json({ error: message });
    }
  }
);

receiptsRouter.post(
  "/api/check-duplicates",
  validateBody(checkDuplicatesRequestSchema),
  async (req, res) => {
    const startTime = Date.now();
    try {
      const { rows } = req.body as CheckDuplicatesRequest;

      if (!rows || rows.length < 2) {
        res.json({ duplicates: [] });
        return;
      }

      if (!resolveApiKey()) {
        logEvent("SKIP /api/check-duplicates: No GEMINI_API_KEY configured");
        res.json({ duplicates: [] });
        return;
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

      res.json(parsed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to check duplicates";
      logEvent("ERROR /api/check-duplicates", {
        message,
        elapsedMs: Date.now() - startTime,
      });
      res.status(500).json({ error: message });
    }
  }
);
