import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { MODEL_ID, FALLBACK_MODELS, resolveApiKey } from "../../../platform/config/index.js";
import {
  withTimeout,
  isTransientError,
  isQuotaExhaustedError,
  isModelCascadeError,
} from "../../../platform/errors/errors.js";
import { logEvent } from "../../../platform/observability/logger.js";

let activeModelId: string = MODEL_ID;
const unavailableModels = new Set<string>();

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

export function getActiveModelId(): string {
  return activeModelId;
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
    // Attempt up to 2 tries per model with backoff on transient errors
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
          cause && typeof cause === "object" && "message" in cause
            ? ` [cause: ${cause.message}]`
            : cause
              ? ` [cause: ${String(cause)}]`
              : "";
        logEvent(`Model ${candidateModel} attempt ${attempt} failed: ${rawMsg}${causeMsg}`);

        if (!isCascade) {
          throw err;
        }

        // If the account quota is completely exhausted, do not cascade through all models
        if (isQuotaExhaustedError(rawMsg)) {
          unavailableModels.add(candidateModel);
          logEvent(
            `Gemini API quota exhausted (${rawMsg}). Halting model retries to allow instant local fallback.`
          );
          throw err;
        }

        // If the model is fundamentally unavailable or unsupported (404), cascade immediately
        if (!isTransient && isCascade) {
          unavailableModels.add(candidateModel);
          logEvent(
            `Model ${candidateModel} permanently unavailable/unsupported, cascading immediately...`
          );
          break;
        }

        if (attempt === 1) {
          // Jittered backoff (1200-1600ms) for temporary demand spikes before retrying
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

  // If all models in pool failed, clear unavailable cache and throw clean error
  unavailableModels.clear();
  throw lastErr;
}
