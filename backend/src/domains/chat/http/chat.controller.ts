import type { Request, Response, NextFunction } from "express";
import type {
  ChapterChatRequest,
  ChatRequest,
  WorkspaceRulesRequest,
} from "@charan-interiors/contracts";
import { processChat, processChatStream } from "../application/chat.service.js";
import { answerChapterQuestion } from "../application/chapterChat.service.js";
import { isValidApiKey } from "../../../platform/config/index.js";
import {
  runAgenticWorkspaceTools,
  getWorkspaceRules,
  saveWorkspaceRules,
} from "../application/tools.service.js";
import { logEvent } from "../../../platform/observability/logger.js";
import { getModelMeta, PROVIDER_CATALOG, type ProviderId } from "@charan-interiors/contracts";
import { getProviderCredential } from "../../credentials/application/credentialVault.js";
import { SKILLS } from "../application/skillRegistry.js";
import { actionableProviderError } from "../providers/providerErrors.js";

function requestProviderCredential(
  req: Request,
  payload: Pick<ChatRequest, "model" | "customModel" | "customProvider">,
  headerApiKey?: string,
  headerBaseUrl?: string
) {
  const provider =
    payload.model === "custom-model"
      ? payload.customProvider || "custom"
      : (getModelMeta(payload.model || "gemini-3.8-flash").provider as ProviderId);
  const savedCredential = req.principal ? getProviderCredential(req.principal.uid, provider) : null;
  if (headerApiKey)
    return { apiKey: headerApiKey, baseUrl: headerBaseUrl || savedCredential?.baseUrl };
  return savedCredential || {};
}

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
  const provider =
    payload.model === "custom-model"
      ? payload.customProvider || "custom"
      : (getModelMeta(payload.model || "gemini-3.8-flash").provider as ProviderId);
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

export async function handleChat(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const startTime = Date.now();
  try {
    const payload = req.body as ChatRequest;
    const headerApiKey =
      typeof req.headers["x-provider-key"] === "string" ? req.headers["x-provider-key"] : undefined;
    const headerBaseUrl =
      typeof req.headers["x-provider-base-url"] === "string"
        ? req.headers["x-provider-base-url"]
        : undefined;

    const credential = requestProviderCredential(req, payload, headerApiKey, headerBaseUrl);
    if (!requireUserCredential(req, res, payload, credential.apiKey)) return;

    const result = await processChat(payload, {
      injectedApiKey: credential.apiKey,
      injectedBaseUrl: credential.baseUrl,
    });
    res.json(result);
  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Failed to process chat";
    logEvent("ERROR /api/chat", {
      errorType: error instanceof Error ? error.name : "UnknownError",
      model: (req.body as ChatRequest | undefined)?.model,
      elapsedMs,
    });
    const status = message.startsWith("MISSING_API_KEY:")
      ? 401
      : message.startsWith("UNKNOWN_MODEL:") || message.startsWith("MISSING_CUSTOM_MODEL:")
        ? 400
        : 500;
    res
      .status(status)
      .json({ error: status === 500 ? publicProviderError(message) : message, requestId: req.id });
  }
}

export async function handleChatStream(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  const payload = req.body as ChatRequest;
  const headerApiKey =
    typeof req.headers["x-provider-key"] === "string" ? req.headers["x-provider-key"] : undefined;
  const headerBaseUrl =
    typeof req.headers["x-provider-base-url"] === "string"
      ? req.headers["x-provider-base-url"]
      : undefined;
  let credential: ReturnType<typeof requestProviderCredential>;
  try {
    credential = requestProviderCredential(req, payload, headerApiKey, headerBaseUrl);
  } catch (error: unknown) {
    logEvent("ERROR /api/chat/stream credential lookup", {
      errorType: error instanceof Error ? error.name : "UnknownError",
      model: payload.model,
    });
    res.status(500).json({
      error: "Provider credentials could not be loaded. Check the server configuration.",
      requestId: req.id,
    });
    return;
  }
  if (!requireUserCredential(req, res, payload, credential.apiKey)) return;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const abortController = new AbortController();
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
        signal: abortController.signal,
      },
      (delta) => sendEvent("token", { delta })
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
      errorType: error instanceof Error ? error.name : "UnknownError",
      model: payload.model,
      elapsedMs,
    });
    if (!res.destroyed && !res.writableEnded) {
      sendEvent("error", { error: publicProviderError(message), partial: true });
      res.end();
    }
  }
}

export async function handleChapterChat(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const request = req.body as ChapterChatRequest;
  const headerApiKey =
    typeof req.headers["x-provider-key"] === "string" ? req.headers["x-provider-key"] : undefined;
  const headerBaseUrl =
    typeof req.headers["x-provider-base-url"] === "string"
      ? req.headers["x-provider-base-url"]
      : undefined;

  let credential: ReturnType<typeof requestProviderCredential>;
  try {
    credential = requestProviderCredential(req, request, headerApiKey, headerBaseUrl);
  } catch {
    res.status(400).json({ error: "The selected model is unavailable." });
    return;
  }
  if (!requireUserCredential(req, res, request, credential.apiKey)) return;

  try {
    const result = await answerChapterQuestion(request, {
      ...(credential.apiKey ? { apiKey: credential.apiKey } : {}),
      ...(credential.baseUrl ? { baseUrl: credential.baseUrl } : {}),
    });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chapter chat failed.";
    logEvent("ERROR /api/chat/chapter", {
      errorType: error instanceof Error ? error.name : "UnknownError",
      model: request.model,
    });
    const status =
      message.startsWith("UNKNOWN_MODEL:") || message.startsWith("MISSING_CUSTOM_MODEL:")
        ? 400
        : 500;
    res
      .status(status)
      .json({ error: status === 500 ? publicProviderError(message) : message, requestId: req.id });
  }
}

export async function handleChapterChatStream(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const request = req.body as ChapterChatRequest;
  const headerApiKey =
    typeof req.headers["x-provider-key"] === "string" ? req.headers["x-provider-key"] : undefined;
  const headerBaseUrl =
    typeof req.headers["x-provider-base-url"] === "string"
      ? req.headers["x-provider-base-url"]
      : undefined;

  let credential: ReturnType<typeof requestProviderCredential>;
  try {
    credential = requestProviderCredential(req, request, headerApiKey, headerBaseUrl);
  } catch {
    res.status(400).json({ error: "The selected model is unavailable." });
    return;
  }
  if (!requireUserCredential(req, res, request, credential.apiKey)) return;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const abortController = new AbortController();
  const timeoutSignal = AbortSignal.timeout(90_000);
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
      errorType: error instanceof Error ? error.name : "UnknownError",
      model: request.model,
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
