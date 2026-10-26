import type { Request, Response } from "express";
import {
  getChatModels,
  getUnsupportedInputMessage,
  modelSupportsInput,
  type ParsePdfChaptersRequest,
} from "@charan-interiors/contracts";
import { parsePdfChapters } from "../application/pdf.service.js";
import { extractHumanErrorMessage } from "../../../platform/errors/errors.js";
import { logEvent } from "../../../platform/observability/logger.js";
import { classifyProviderFailure } from "../../chat/providers/providerErrors.js";
import { isValidApiKey } from "../../../platform/config/index.js";
import {
  providerForModelRequest,
  resolveRequestProviderCredential,
} from "../../credentials/application/requestCredential.js";

export async function handleParsePdfChapters(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const payload = req.body as ParsePdfChaptersRequest;
  const provider = providerForModelRequest(payload);
  try {
    const selectableImageModel = getChatModels().some(
      (model) =>
        model.id === payload.model &&
        model.catalogStatus === "verified" &&
        modelSupportsInput(model.id, "image")
    );
    if (!selectableImageModel) {
      res.status(400).json({
        error: getUnsupportedInputMessage(payload.model, "image"),
        requestId: req.id,
      });
      return;
    }
    const { apiKey, baseUrl } = resolveRequestProviderCredential(req, payload);
    const result = await parsePdfChapters({
      mimeType: payload.mimeType,
      base64Data: payload.base64Data,
      ...(payload.fileName ? { fileName: payload.fileName } : {}),
      modelId: payload.model,
      ...(payload.customModel ? { customModel: payload.customModel } : {}),
      ...(payload.customProvider ? { customProvider: payload.customProvider } : {}),
      ...(isValidApiKey(apiKey) ? { apiKey } : {}),
      ...(baseUrl ? { baseUrl } : {}),
    });
    res.json(result);
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = extractHumanErrorMessage(
      error,
      "Failed to parse PDF document. Please verify the file is a valid PDF."
    );
    logEvent("ERROR /api/parse-pdf-chapters", {
      requestId: req.id,
      provider,
      errorType: error instanceof Error ? error.name : "UnknownError",
      failureCategory: classifyProviderFailure(error),
      elapsedMs,
    });

    const statusCode =
      typeof (error as { statusCode?: number })?.statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;

    res.status(statusCode).json({ error: message, requestId: req.id });
  }
}
