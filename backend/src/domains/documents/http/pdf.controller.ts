import type { Request, Response, NextFunction } from "express";
import type { ParsePdfChaptersRequest } from "@charan-interiors/contracts";
import { parsePdfChapters } from "../application/pdf.service.js";
import { extractHumanErrorMessage } from "../../../platform/errors/errors.js";
import { logEvent } from "../../../platform/observability/logger.js";

export async function handleParsePdfChapters(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  try {
    const payload = req.body as ParsePdfChaptersRequest;
    const result = await parsePdfChapters({
      mimeType: payload.mimeType,
      base64Data: payload.base64Data,
      fileName: payload.fileName,
    });
    res.json(result);
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = extractHumanErrorMessage(
      error,
      "Failed to parse PDF document. Please verify the file is a valid PDF."
    );
    logEvent("ERROR /api/parse-pdf-chapters", { message, elapsedMs });

    const statusCode =
      typeof (error as { statusCode?: number })?.statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;

    res.status(statusCode).json({ error: message, requestId: req.id });
  }
}
