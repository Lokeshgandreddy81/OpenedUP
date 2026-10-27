import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests. Please wait and try again.",
    keyGenerator = (req: Request) =>
      req.principal?.uid ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown",
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  const cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of hits.entries()) {
        if (record.resetTime <= now) {
          hits.delete(key);
        }
      }
    },
    Math.min(windowMs, 60_000)
  );

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
    const key = keyGenerator(req);
    const now = Date.now();
    let record = hits.get(key);

    if (!record || record.resetTime <= now) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

    res.setHeader("RateLimit-Limit", String(maxRequests));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", String(resetSeconds));
      res.status(429).json({
        error: message,
        requestId: req.id,
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}
