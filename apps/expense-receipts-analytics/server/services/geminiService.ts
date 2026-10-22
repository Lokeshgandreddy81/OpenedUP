import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { MODEL_ID, FALLBACK_MODELS, resolveApiKey } from "../config.ts";
import { logEvent } from "../logger.ts";

let activeModelId: string = MODEL_ID;
const unavailableModels = new Set<string>();

export function getActiveModelId(): string {
  return activeModelId;
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errMsg)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
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
    if (parsed?.error?.message) {
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

let cachedClient: GoogleGenAI | null = null;
let cachedClientKey: string | undefined = undefined;

export function getGenAIClient(): GoogleGenAI {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing or set to a placeholder value."
    );
  }
  if (cachedClient && cachedClientKey === apiKey) {
    return cachedClient;
  }
  cachedClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  cachedClientKey = apiKey;
  return cachedClient;
}

export async function generateWithModelFallback(
  params: Omit<GenerateContentParameters, "model">
): Promise<{
  response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>;
  modelUsed: string;
}> {
  const ai = getGenAIClient();
  const allOrdered = [activeModelId, ...FALLBACK_MODELS.filter((m) => m !== activeModelId)];
  const candidates = allOrdered.filter((m) => !unavailableModels.has(m));
  const pool = candidates.length > 0 ? candidates : allOrdered;

  let lastErr: unknown = null;
  for (const candidateModel of pool) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        logEvent(`Calling Gemini model ${candidateModel} (attempt ${attempt})...`);
        const response = await withTimeout(
          ai.models.generateContent({
            ...params,
            model: candidateModel,
          }),
          90000,
          `Model ${candidateModel} timed out after 90s`
        );
        activeModelId = candidateModel;
        unavailableModels.delete(candidateModel);
        return { response, modelUsed: candidateModel };
      } catch (err: unknown) {
        lastErr = err;
        const rawMsg = err instanceof Error ? err.message : String(err);
        const isTransient = isTransientError(rawMsg);
        const isCascade = isModelCascadeError(rawMsg);

        const cause = (err as { cause?: { message?: string } | string })?.cause;
        const causeMsg =
          typeof cause === "object" && cause?.message
            ? ` [cause: ${cause.message}]`
            : cause
              ? ` [cause: ${String(cause)}]`
              : "";
        logEvent(`Model ${candidateModel} attempt ${attempt} failed: ${rawMsg}${causeMsg}`);

        if (!isCascade) {
          throw err;
        }

        if (isQuotaExhaustedError(rawMsg)) {
          unavailableModels.add(candidateModel);
          logEvent(
            `Gemini API quota exhausted (${rawMsg}). Halting model retries to allow instant local fallback.`
          );
          throw err;
        }

        if (!isTransient && isCascade) {
          unavailableModels.add(candidateModel);
          logEvent(
            `Model ${candidateModel} permanently unavailable/unsupported, cascading immediately...`
          );
          break;
        }

        if (attempt === 1) {
          const delay = 1200 + Math.floor(Math.random() * 400);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        unavailableModels.add(candidateModel);
        logEvent(`Model ${candidateModel} capacity exhausted, cascading to next fallback model...`);
        break;
      }
    }
  }

  unavailableModels.clear();
  throw lastErr;
}
