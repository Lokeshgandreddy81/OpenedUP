import type { Request, Response, NextFunction } from "express";
import { logger } from "../../observability/logger.js";

function sanitizeLogUrl(rawUrl: string): string {
  try {
    const dummy = new URL(rawUrl, "http://localhost");
    for (const key of Array.from(dummy.searchParams.keys())) {
      const lower = key.toLowerCase();
      if (
        lower.includes("key") ||
        lower.includes("token") ||
        lower.includes("secret") ||
        lower.includes("password") ||
        lower.includes("auth")
      ) {
        dummy.searchParams.set(key, "[REDACTED]");
      }
    }
    return dummy.pathname + dummy.search;
  } catch {
    return rawUrl.replace(/(?:key|token|secret|password|auth)=([^&\s]+)/gi, "$1=[REDACTED]");
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.id ?? "unknown";

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      url: sanitizeLogUrl(req.originalUrl || req.url),
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}
