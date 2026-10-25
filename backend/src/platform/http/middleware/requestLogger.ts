import type { Request, Response, NextFunction } from "express";
import { logger, redactSecretsString } from "../../observability/logger.js";

export function sanitizeLogUrl(rawUrl: string): string {
  try {
    const dummy = new URL(rawUrl, "http://localhost");
    for (const key of Array.from(dummy.searchParams.keys())) {
      const lower = key.toLowerCase();
      if (
        lower.includes("key") ||
        lower.includes("token") ||
        lower.includes("secret") ||
        lower.includes("password") ||
        lower.includes("auth") ||
        lower.includes("credential")
      ) {
        dummy.searchParams.set(key, "[REDACTED]");
      }
    }
    return redactSecretsString(dummy.pathname + dummy.search);
  } catch {
    const cleaned = rawUrl.replace(
      /(?:key|token|secret|password|auth|credential)=([^&\s]+)/gi,
      (match, val) => match.replace(val, "[REDACTED]")
    );
    return redactSecretsString(cleaned);
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
