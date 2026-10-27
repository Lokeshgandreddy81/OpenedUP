import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/errors.js";
import { logger, redactSecretsString } from "../../observability/logger.js";
import { sanitizeLogUrl } from "./requestLogger.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.id ?? "unknown";

  if (err instanceof AppError) {
    const safeAppMessage = redactSecretsString(err.message);
    logger.warn({
      requestId,
      statusCode: err.statusCode,
      errorType: err.name,
      failureCategory: err.statusCode < 500 ? "client_error" : "server_error",
    });
    res.status(err.statusCode).json({
      error: safeAppMessage,
      requestId,
      statusCode: err.statusCode,
    });
    return;
  }

  const statusCode =
    typeof (err as { status?: number })?.status === "number"
      ? (err as { status: number }).status
      : 500;
  const safeMessage = redactSecretsString(
    err instanceof Error ? err.message : "Internal Server Error"
  );

  logger.error({
    requestId,
    url: sanitizeLogUrl(req.originalUrl || req.url),
    method: req.method,
    errorType: err instanceof Error ? err.name : "UnknownError",
    statusCode,
    failureCategory: statusCode < 500 ? "client_error" : "server_error",
  });

  // Never return raw 500 errors to client responses to prevent internal or upstream secret leakage
  const clientMessage = statusCode >= 500 ? "Internal Server Error" : safeMessage;

  res.status(statusCode).json({
    error: clientMessage,
    requestId,
    statusCode,
  });
}
