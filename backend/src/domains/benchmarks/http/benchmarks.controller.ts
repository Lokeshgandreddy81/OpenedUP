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
      "swe_bench_verified",
      "gpqa_diamond",
      "mmlu_pro",
      "math_500",
      "humanitys_last_exam",
      "briefcase_v1_1",
      "terminal_bench_4_0",
      "omniscience_accuracy",
      "output_speed_tps",
      "cost_per_m_tokens",
    ],
  });
}
