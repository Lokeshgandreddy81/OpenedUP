import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/errors.js";
import { logger } from "../../observability/logger.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.id ?? "unknown";

  if (err instanceof AppError) {
    logger.warn({
      requestId,
      statusCode: err.statusCode,
      message: err.message,
    });
    res.status(err.statusCode).json({
      error: err.message,
      requestId,
      statusCode: err.statusCode,
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error({
    requestId,
    url: req.originalUrl,
    method: req.method,
    message,
    stack,
  });

  const statusCode =
    typeof (err as { status?: number })?.status === "number"
      ? (err as { status: number }).status
      : 500;

  res.status(statusCode).json({
    error: message,
    requestId,
    statusCode,
  });
}
