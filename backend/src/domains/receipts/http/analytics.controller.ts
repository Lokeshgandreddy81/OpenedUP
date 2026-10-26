import fs from "node:fs";
import type { Request, Response } from "express";
import {
  PROVIDER_CATALOG,
  getChatModels,
  type ReadReceiptsRequest,
  type CheckDuplicatesRequest,
  getUnsupportedInputMessage,
  modelSupportsInput,
} from "@charan-interiors/contracts";
import { checkDuplicates } from "../application/duplicate.service.js";
import { readReceipts } from "../application/receipt.service.js";
import { CHAT_GENERATION_TIMEOUT_MS } from "../../chat/application/chat.service.js";
import { LOG_FILE, logEvent, redactSecretsString } from "../../../platform/observability/logger.js";
import { isValidApiKey } from "../../../platform/config/index.js";
import { AppError } from "../../../platform/errors/errors.js";
import {
  actionableProviderError,
  classifyProviderFailure,
} from "../../chat/providers/providerErrors.js";
import {
  providerForModelRequest,
  resolveRequestProviderCredential,
} from "../../credentials/application/requestCredential.js";

export async function handleReadReceipts(req: Request, res: Response): Promise<void> {
  const timeoutSignal = AbortSignal.timeout(CHAT_GENERATION_TIMEOUT_MS);
  try {
    const payload = req.body as ReadReceiptsRequest;
    const provider = providerForModelRequest(payload);
    const selectableImageModel = getChatModels().some(
      (model) =>
        model.id === payload.model &&
        model.catalogStatus === "verified" &&
        modelSupportsInput(model.id, "image")
    );
    if (!selectableImageModel) {
      res
        .status(400)
        .json({ error: getUnsupportedInputMessage(payload.model, "image"), requestId: req.id });
      return;
    }
    const { apiKey, baseUrl } = resolveRequestProviderCredential(req, payload);
    if (!isValidApiKey(apiKey)) {
      const providerName = PROVIDER_CATALOG[provider].name;
      res.status(401).json({
        error: `MISSING_API_KEY:${provider}:Connect your ${providerName} API key in Customize → Providers to use this model.`,
        requestId: req.id,
      });
      return;
    }
    const result = await readReceipts(payload.photos, {
      modelId: payload.model,
      ...(payload.customModel ? { customModel: payload.customModel } : {}),
      ...(payload.customProvider ? { customProvider: payload.customProvider } : {}),
      ...(apiKey ? { apiKey } : {}),
      ...(baseUrl ? { baseUrl } : {}),
      signal: timeoutSignal,
    });
    res.json(result);
  } catch (err: unknown) {
    const payload = req.body as ReadReceiptsRequest;
    const message = err instanceof Error ? err.message : "Receipt extraction failed.";
    const isInvalidRequest =
      message.startsWith("UNKNOWN_MODEL:") || message.startsWith("MISSING_CUSTOM_MODEL:");
    const status = message.startsWith("MISSING_API_KEY:") ? 401 : isInvalidRequest ? 400 : 502;
    const failureCategory = classifyProviderFailure(err, timeoutSignal.aborted);
    logEvent("ERROR /api/read-receipts", {
      requestId: req.id,
      model: payload?.model,
      provider:
        payload?.model === "custom-model"
          ? payload.customProvider || "custom"
          : providerForModelRequest(payload),
      errorType: err instanceof Error ? err.name : "UnknownError",
      failureCategory,
    });
    const safeMessage = timeoutSignal.aborted
      ? "This model took too long to respond. Try again or choose another model."
      : status >= 500
        ? actionableProviderError(message)
        : redactSecretsString(message);
    if (status === 401 && !req.principal) res.setHeader("WWW-Authenticate", "Bearer");
    if (err instanceof AppError) {
      res
        .status(err.statusCode)
        .json({ error: redactSecretsString(err.message), requestId: req.id });
      return;
    }
    res.status(status).json({ error: safeMessage, requestId: req.id });
  }
}

export async function handleCheckDuplicates(req: Request, res: Response): Promise<void> {
  const timeoutSignal = AbortSignal.timeout(CHAT_GENERATION_TIMEOUT_MS);
  try {
    const payload = req.body as CheckDuplicatesRequest;
    if (payload.rows.length < 2) {
      res.json({ duplicates: [] });
      return;
    }
    const provider = providerForModelRequest(payload);
    const { apiKey, baseUrl } = resolveRequestProviderCredential(req, payload);
    if (!isValidApiKey(apiKey)) {
      const providerName = PROVIDER_CATALOG[provider].name;
      res.status(401).json({
        error: `MISSING_API_KEY:${provider}:Connect your ${providerName} API key in Customize → Providers to use this model.`,
        requestId: req.id,
      });
      return;
    }
    const result = await checkDuplicates(payload.rows, {
      modelId: payload.model,
      ...(payload.customModel ? { customModel: payload.customModel } : {}),
      ...(payload.customProvider ? { customProvider: payload.customProvider } : {}),
      ...(apiKey ? { apiKey } : {}),
      ...(baseUrl ? { baseUrl } : {}),
      signal: timeoutSignal,
    });
    res.json(result);
  } catch (err: unknown) {
    const payload = req.body as CheckDuplicatesRequest;
    const message = err instanceof Error ? err.message : "Duplicate review failed.";
    const isMalformedModelReview = /invalid duplicate (?:review|row references)/i.test(message);
    const isInvalidRequest =
      message.startsWith("UNKNOWN_MODEL:") || message.startsWith("MISSING_CUSTOM_MODEL:");
    const status = message.startsWith("MISSING_API_KEY:") ? 401 : isInvalidRequest ? 400 : 502;
    const failureCategory = classifyProviderFailure(err, timeoutSignal.aborted);
    logEvent("ERROR /api/check-duplicates", {
      requestId: req.id,
      model: payload?.model,
      provider:
        payload?.model === "custom-model"
          ? payload.customProvider || "custom"
          : providerForModelRequest(payload),
      errorType: err instanceof Error ? err.name : "UnknownError",
      failureCategory,
    });
    const safeMessage = isMalformedModelReview
      ? redactSecretsString(message)
      : timeoutSignal.aborted
        ? "This model took too long to respond. Try again or choose another model."
        : status >= 500
          ? actionableProviderError(message)
          : redactSecretsString(message);
    if (status === 401 && !req.principal) res.setHeader("WWW-Authenticate", "Bearer");
    if (err instanceof AppError) {
      res
        .status(err.statusCode)
        .json({ error: redactSecretsString(err.message), requestId: req.id });
      return;
    }
    res.status(status).json({ error: safeMessage, requestId: req.id });
  }
}

export function handleGetLogs(_req: Request, res: Response): void {
  try {
    const content = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, "utf8") : "No logs yet.";
    res.type("text/plain").send(content);
  } catch (err: unknown) {
    res.status(500).send(String(err));
  }
}
