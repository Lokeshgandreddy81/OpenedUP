import type { Request, Response, NextFunction } from "express";
import { logger } from "../../observability/logger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.id ?? "unknown";

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}
