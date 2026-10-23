import type { Request, Response } from "express";
import { MODEL_ID, FALLBACK_MODELS, resolveApiKey } from "../../../platform/config/index.js";
import { getActiveModelId } from "../../chat/providers/gemini.service.js";

export function getBenchmarkOverview(_req: Request, res: Response): void {
  const apiKeyAvailable = Boolean(resolveApiKey());
  res.json({
    activeModel: getActiveModelId(),
    defaultModel: MODEL_ID,
    availableFallbacks: FALLBACK_MODELS,
    apiKeyConfigured: apiKeyAvailable,
    benchmarkDimensions: [
      "swe_bench",
      "live_code_bench",
      "humaneval",
      "speed",
      "cost_per_m_tokens",
    ],
  });
}
