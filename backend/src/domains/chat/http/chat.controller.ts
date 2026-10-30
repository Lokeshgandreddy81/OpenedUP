import type { Request, Response, NextFunction } from "express";
import type {
  ChapterChatRequest,
  ChatRequest,
  WorkspaceRulesRequest,
} from "@charan-interiors/contracts";
import {
  CHAT_GENERATION_TIMEOUT_MS,
  processChat,
  processChatStream,
} from "../application/chat.service.js";
import { answerChapterQuestion } from "../application/chapterChat.service.js";
import { isValidApiKey } from "../../../platform/config/index.js";
import {
  runAgenticWorkspaceTools,
  getWorkspaceRules,
  saveWorkspaceRules,
} from "../application/tools.service.js";
import { logEvent, redactSecretsString } from "../../../platform/observability/logger.js";
import {
  getUnsupportedInputMessage,
  modelSupportsInput,
  PROVIDER_CATALOG,
} from "@charan-interiors/contracts";
import {
  providerForModelRequest,
  resolveRequestProviderCredential,
} from "../../credentials/application/requestCredential.js";
import { SKILLS } from "../application/skillRegistry.js";
import { actionableProviderError, classifyProviderFailure } from "../providers/providerErrors.js";
import { deleteUserUploads, downloadUserImage } from "../../../platform/storage/supabaseStorage.js";
import { AppError } from "../../../platform/errors/errors.js";
import { getRequestIdentity } from "../../../platform/auth/identity.js";

function isLoopbackRequest(req: Request): boolean {
  const address = req.socket.remoteAddress?.replace(/^::ffff:/, "");
  return address === "127.0.0.1" || address === "::1";
}

function requireUserCredential(
  req: Request,
  res: Response,
  payload: Pick<ChatRequest, "model" | "customModel" | "customProvider">,
  apiKey: string | undefined
): boolean {
  if (isValidApiKey(apiKey)) return true;
  const provider = providerForModelRequest(payload);
  const providerName = PROVIDER_CATALOG[provider].name;
  if (!req.principal) res.setHeader("WWW-Authenticate", "Bearer");
  res.status(401).json({
    error: `MISSING_API_KEY:${provider}:Connect your own ${providerName} API key in Customize → Providers to use this model.`,
    requestId: req.id,
  });
  return false;
}

function publicProviderError(message: string): string {
  return actionableProviderError(message);
}

async function resolveStoredChatImages(
  req: Request,
  res: Response,
  payload: ChatRequest
): Promise<ChatRequest> {
  const images = payload.images || [];
  const storagePaths = images.flatMap((image) => (image.storagePath ? [image.storagePath] : []));
  if (!storagePaths.length) return payload;
  if (!req.principal?.uid) throw new AppError("Sign in to process these image uploads.", 401);
  const userId = req.principal.uid;
  res.once("finish", () => void deleteUserUploads(userId, storagePaths));
  return {
    ...payload,
    images: await Promise.all(
      images.map(async (image) => {
        if (!image.storagePath) return image;
        const bytes = await downloadUserImage(userId, image.storagePath, image.mimeType);
        const { storagePath: _storagePath, ...inlineImage } = image;
        return { ...inlineImage, base64Data: bytes.toString("base64") };
      })
    ),
  };
}

async function resolveStoredChapterImages(
  req: Request,
  res: Response,
  request: ChapterChatRequest
): Promise<ChapterChatRequest> {
  const imagePages = request.imagePages || [];
  const storagePaths = imagePages.flatMap((image) =>
    image.storagePath ? [image.storagePath] : []
  );
  if (!storagePaths.length) return request;
  if (!req.principal?.uid) throw new AppError("Sign in to process these chapter images.", 401);
  const userId = req.principal.uid;
  res.once("finish", () => void deleteUserUploads(userId, storagePaths));
  return {
    ...request,
    imagePages: await Promise.all(
      imagePages.map(async (image) => {
        if (!image.storagePath) return image;
        const bytes = await downloadUserImage(userId, image.storagePath, image.mimeType);
        const { storagePath: _storagePath, ...inlineImage } = image;
        return { ...inlineImage, base64Data: bytes.toString("base64") };
      })
    ),
  };
}

export async function handleChat(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const startTime = Date.now();
  const timeoutSignal = AbortSignal.timeout(CHAT_GENERATION_TIMEOUT_MS);
  const identity = getRequestIdentity(req);
  let payload = req.body as ChatRequest;
  try {
    payload = await resolveStoredChatImages(req, res, payload);
    const credential = await resolveRequestProviderCredential(req, payload);
    if (!requireUserCredential(req, res, payload, credential.apiKey)) return;

    const result = await processChat(payload, {
      injectedApiKey: credential.apiKey,
      injectedBaseUrl: credential.baseUrl,
      signal: timeoutSignal,
      userId: identity.userId,
      orgId: identity.orgId,
    });
    res.json(result);
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Failed to process chat";
    logEvent("ERROR /api/chat", {
      requestId: req.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
      provider: providerForModelRequest(payload),
      model: payload.model,
      failureCategory: classifyProviderFailure(error, timeoutSignal.aborted),
      elapsedMs,
    });
    const isBadRequest =
      message.startsWith("UNKNOWN_MODEL:") ||
      message.startsWith("MISSING_CUSTOM_MODEL:") ||
      message.includes("does not support image analysis");
    const status =
      error instanceof AppError
        ? error.statusCode
        : message.startsWith("MISSING_API_KEY:")
          ? 401
          : isBadRequest
            ? 400
            : 500;
    const errorText = timeoutSignal.aborted
      ? "This model took too long to respond. Try again or choose another model."
      : status === 500
        ? publicProviderError(message)
        : redactSecretsString(message);
    res.status(status).json({ error: errorText, requestId: req.id });
  }
}

export async function handleChatStream(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  const identity = getRequestIdentity(req);
  let payload = req.body as ChatRequest;
  let credential: Awaited<ReturnType<typeof resolveRequestProviderCredential>>;
  try {
    payload = await resolveStoredChatImages(req, res, payload);
    credential = await resolveRequestProviderCredential(req, payload);
  } catch (error: unknown) {
    logEvent("ERROR /api/chat/stream credential lookup", {
      requestId: req.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
      provider: providerForModelRequest(payload),
      model: payload.model,
      failureCategory: classifyProviderFailure(error),
    });
    res.status(500).json({
      error: "Provider credentials could not be loaded. Check the server configuration.",
      requestId: req.id,
    });
    return;
  }
  if (!requireUserCredential(req, res, payload, credential.apiKey)) return;

  const modelId = payload.model;
  if (payload.images?.length && !modelSupportsInput(modelId, "image")) {
    res.status(400).json({
      error: getUnsupportedInputMessage(modelId, "image"),
      requestId: req.id,
    });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const abortController = new AbortController();
  const timeoutSignal = AbortSignal.timeout(CHAT_GENERATION_TIMEOUT_MS);
  const requestSignal = AbortSignal.any([abortController.signal, timeoutSignal]);
  let emittedAnyDelta = false;
  res.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const toolTraces = runAgenticWorkspaceTools(payload);
    sendEvent("step", {
      stepTitle: toolTraces.stepTitle,
      stepDescription: toolTraces.stepDescription,
      thoughtDetails: toolTraces.thoughtDetails,
    });

    const result = await processChatStream(
      payload,
      {
        injectedApiKey: credential.apiKey,
        injectedBaseUrl: credential.baseUrl,
        toolTraces,
        signal: requestSignal,
        userId: identity.userId,
        orgId: identity.orgId,
      },
      (delta) => {
        emittedAnyDelta = true;
        sendEvent("token", { delta });
      }
    );

    sendEvent("done", {
      content: result.content,
      thinkingTime: result.thinkingTime,
      stepTitle: result.stepTitle,
      stepDescription: result.stepDescription,
      thoughtDetails: result.thoughtDetails,
      modelUsed: result.modelUsed,
      providerUsed: result.providerUsed,
    });
    res.end();
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Failed to stream chat";
    logEvent("ERROR /api/chat/stream", {
      requestId: req.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
      provider: providerForModelRequest(payload),
      model: payload.model,
      failureCategory: classifyProviderFailure(error, timeoutSignal.aborted),
      elapsedMs,
    });
    if (!res.destroyed && !res.writableEnded) {
      sendEvent("error", {
        error: timeoutSignal.aborted
          ? "This model took too long to respond. Try again or choose another model."
          : publicProviderError(message),
        partial: emittedAnyDelta,
      });
      res.end();
    }
  }
}

export async function handleChapterChat(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  let request = req.body as ChapterChatRequest;
  let credential: Awaited<ReturnType<typeof resolveRequestProviderCredential>>;
  try {
    request = await resolveStoredChapterImages(req, res, request);
    credential = await resolveRequestProviderCredential(req, request);
  } catch (error: unknown) {
    const status = error instanceof AppError ? error.statusCode : 400;
    res.status(status).json({
      error: error instanceof Error ? error.message : "The selected model is unavailable.",
      requestId: req.id,
    });
    return;
  }
  if (!requireUserCredential(req, res, request, credential.apiKey)) return;

  const timeoutSignal = AbortSignal.timeout(CHAT_GENERATION_TIMEOUT_MS);
  try {
    const result = await answerChapterQuestion(request, {
      ...(credential.apiKey ? { apiKey: credential.apiKey } : {}),
      ...(credential.baseUrl ? { baseUrl: credential.baseUrl } : {}),
      signal: timeoutSignal,
    });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chapter chat failed.";
    logEvent("ERROR /api/chat/chapter", {
      requestId: req.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
      provider: providerForModelRequest(request),
      model: request.model,
      failureCategory: classifyProviderFailure(error, timeoutSignal.aborted),
    });
    const isBadRequest =
      message.startsWith("UNKNOWN_MODEL:") ||
      message.startsWith("MISSING_CUSTOM_MODEL:") ||
      message.includes("does not support image analysis");
    const status = isBadRequest ? 400 : 500;
    const errorText = timeoutSignal.aborted
      ? "This model took too long to respond. Try again or choose another model."
      : status === 500
        ? publicProviderError(message)
        : redactSecretsString(message);
    res.status(status).json({ error: errorText, requestId: req.id });
  }
}

export async function handleChapterChatStream(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  let request = req.body as ChapterChatRequest;
  let credential: Awaited<ReturnType<typeof resolveRequestProviderCredential>>;
  try {
    request = await resolveStoredChapterImages(req, res, request);
    credential = await resolveRequestProviderCredential(req, request);
  } catch (error: unknown) {
    const status = error instanceof AppError ? error.statusCode : 400;
    res.status(status).json({
      error: error instanceof Error ? error.message : "The selected model is unavailable.",
      requestId: req.id,
    });
    return;
  }
  if (!requireUserCredential(req, res, request, credential.apiKey)) return;

  if (request.imagePages?.length && !modelSupportsInput(request.model, "image")) {
    res.status(400).json({
      error: getUnsupportedInputMessage(request.model, "image"),
      requestId: req.id,
    });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const abortController = new AbortController();
  const timeoutSignal = AbortSignal.timeout(CHAT_GENERATION_TIMEOUT_MS);
  const requestSignal = AbortSignal.any([abortController.signal, timeoutSignal]);
  res.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });
  const sendEvent = (event: string, data: unknown) => {
    if (!res.destroyed && !res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  sendEvent("phase", { phase: "thinking" });
  try {
    const result = await answerChapterQuestion(request, {
      ...(credential.apiKey ? { apiKey: credential.apiKey } : {}),
      ...(credential.baseUrl ? { baseUrl: credential.baseUrl } : {}),
      signal: requestSignal,
      onGenerationStarted: () => sendEvent("phase", { phase: "responding" }),
    });
    sendEvent("done", result);
    if (!res.destroyed && !res.writableEnded) res.end();
  } catch (error: unknown) {
    if (abortController.signal.aborted) return;
    const message = error instanceof Error ? error.message : "Chapter chat failed.";
    logEvent("ERROR /api/chat/chapter/stream", {
      requestId: req.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
      provider: providerForModelRequest(request),
      model: request.model,
      failureCategory: classifyProviderFailure(error, timeoutSignal.aborted),
    });
    sendEvent("error", {
      error: timeoutSignal.aborted
        ? "This model took too long to respond. Try again or choose another model."
        : publicProviderError(message),
    });
    if (!res.destroyed && !res.writableEnded) res.end();
  }
}

export function handleGetSkills(_req: Request, res: Response): void {
  res.json({ skills: SKILLS });
}

export function handleGetRules(req: Request, res: Response): void {
  if (!isLoopbackRequest(req)) {
    res.status(403).json({ error: "Workspace rules are available only to local requests." });
    return;
  }
  const rules = getWorkspaceRules();
  res.json(rules);
}

export function handleSaveRules(req: Request, res: Response): void {
  const address = req.socket.remoteAddress?.replace(/^::ffff:/, "");
  const isLoopback = address === "127.0.0.1" || address === "::1";
  if (process.env["NODE_ENV"] === "production" || !isLoopback) {
    res
      .status(403)
      .json({ error: "Workspace rules can only be changed from a local development session." });
    return;
  }
  const { scope, content } = req.body as WorkspaceRulesRequest;
  try {
    const updated = saveWorkspaceRules({ scope, content });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to save workspace rules." });
  }
}
