export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errMsg: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errMsg)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export function isTransientError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("503") ||
    lower.includes("unavailable") ||
    lower.includes("high demand") ||
    lower.includes("spikes in demand") ||
    lower.includes("overloaded") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("try again later") ||
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("500") ||
    lower.includes("internal") ||
    lower.includes("502") ||
    lower.includes("bad gateway") ||
    lower.includes("504") ||
    lower.includes("gateway timeout") ||
    lower.includes("fetch failed") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("timed out")
  );
}

export function isQuotaExhaustedError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("resource_exhausted") ||
    lower.includes("quota exceeded") ||
    lower.includes("exceeded your current quota") ||
    lower.includes("free tier") ||
    lower.includes("credit balance")
  );
}

export function isModelCascadeError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    isTransientError(msg) ||
    lower.includes("404") ||
    lower.includes("not found") ||
    lower.includes("not supported") ||
    lower.includes("no longer available")
  );
}

export function extractHumanErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  const rawMsg = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(rawMsg) as { error?: { message?: string } };
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // not JSON
  }
  return rawMsg;
}

export function parseJsonSafely<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        // continue
      }
    }
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1)) as T;
      } catch {
        // continue
      }
    }
    return fallback;
  }
}
