import { appendFile, chmod } from "node:fs/promises";
import { MODEL_REGISTRY, PROVIDER_IDS, type ProviderId } from "@charan-interiors/contracts";
import {
  generateMultiProviderChat,
  generateMultiProviderChatStream,
  type LlmGenerateResult,
} from "../src/domains/chat/providers/llm.service.js";
import {
  classifyProviderFailure,
  type ProviderFailureCategory,
} from "../src/domains/chat/providers/providerErrors.js";

const CONFIRMATION = "I_UNDERSTAND_THIS_MAY_COST";
const PROBE_TEXT = "BYOK_LIVE_MATRIX_OK";

type Mode = "non-stream" | "stream";
type Probe = "text" | "image";
type Outcome = "pass" | "request_failed" | "unexpected_output";
type FailureCategory = ProviderFailureCategory | "unexpected_output";

interface MatrixRecord {
  checkedAt: string;
  provider: ProviderId;
  modelId: string;
  upstreamModelId: string;
  probe: Probe;
  mode: Mode;
  outcome: Outcome;
  failureCategory: FailureCategory | null;
  durationMs: number;
  usage: LlmGenerateResult["usage"] | null;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required setting: ${name}`);
  return value;
}

function readConfig(): {
  provider: ProviderId;
  modelId: string;
  customModel?: string;
  apiKey: string;
  baseUrl?: string;
  probe: Probe;
  mode: Mode;
} {
  if (process.env.BYOK_LIVE_CONFIRM !== CONFIRMATION) {
    throw new Error(
      "Live calls are disabled. Set BYOK_LIVE_CONFIRM to the documented confirmation value."
    );
  }

  const provider = required("BYOK_LIVE_PROVIDER") as ProviderId;
  if (!PROVIDER_IDS.includes(provider)) throw new Error("BYOK_LIVE_PROVIDER is not supported.");

  const modelId = required("BYOK_LIVE_MODEL_ID");
  const metadata = MODEL_REGISTRY[modelId];
  if (!metadata || !metadata.isChatModel)
    throw new Error("BYOK_LIVE_MODEL_ID must name a catalog chat model.");
  const customModel = modelId === "custom-model" ? required("BYOK_LIVE_CUSTOM_MODEL") : undefined;
  if (modelId !== "custom-model" && metadata.provider !== provider) {
    throw new Error("BYOK_LIVE_PROVIDER does not match the selected catalog model.");
  }

  const probe = required("BYOK_LIVE_PROBE");
  if (probe !== "text" && probe !== "image") {
    throw new Error('BYOK_LIVE_PROBE must be "text" or "image".');
  }
  if (
    probe === "image" &&
    (modelId === "custom-model" ||
      metadata.catalogStatus !== "verified" ||
      !metadata.inputModalities?.includes("image"))
  ) {
    throw new Error(
      "Image probes require a verified catalog model marked app-supported for image input."
    );
  }

  const mode = required("BYOK_LIVE_MODE");
  if (mode !== "stream" && mode !== "non-stream") {
    throw new Error('BYOK_LIVE_MODE must be "stream" or "non-stream".');
  }

  const apiKey = required("BYOK_LIVE_API_KEY");
  const baseUrl = process.env.BYOK_LIVE_BASE_URL?.trim() || undefined;
  return {
    provider,
    modelId,
    ...(customModel ? { customModel } : {}),
    apiKey,
    ...(baseUrl ? { baseUrl } : {}),
    probe,
    mode,
  };
}

async function main(): Promise<void> {
  let config: ReturnType<typeof readConfig>;
  try {
    config = readConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid live matrix configuration.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 2;
    return;
  }

  const metadata = MODEL_REGISTRY[config.modelId]!;
  const recordBase = {
    checkedAt: new Date().toISOString(),
    provider: config.provider,
    modelId: config.modelId,
    upstreamModelId: config.customModel ?? metadata.upstreamModelId,
    probe: config.probe,
    mode: config.mode,
  } as const;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error("Provider request timed out")),
    90_000
  );

  let output = "";
  let usage: LlmGenerateResult["usage"] | null = null;
  let outcome: Outcome = "pass";
  let failureCategory: FailureCategory | null = null;
  try {
    const probeText =
      config.probe === "image"
        ? `Inspect the attached test image. It is a solid red square. Reply exactly ${PROBE_TEXT} if you can inspect it.`
        : `Reply exactly ${PROBE_TEXT}`;
    const params = {
      modelId: config.modelId,
      ...(config.customModel ? { customModel: config.customModel } : {}),
      ...(config.modelId === "custom-model" ? { customProvider: config.provider } : {}),
      messages: [{ role: "user" as const, content: probeText }],
      ...(config.probe === "image"
        ? {
            images: [
              {
                name: "byok-live-red-square.png",
                mimeType: "image/png",
                base64Data:
                  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGP4z8AARAwQCgAf7gP9i18U1AAAAABJRU5ErkJggg==",
              },
            ],
          }
        : {}),
      systemInstruction:
        "This is a provider connectivity check. Follow the user's short probe instruction exactly.",
      effort: "low",
      injectedApiKey: config.apiKey,
      ...(config.baseUrl ? { injectedBaseUrl: config.baseUrl } : {}),
      signal: controller.signal,
    };

    if (config.mode === "stream") {
      const result = await generateMultiProviderChatStream(params, (delta) => {
        output += delta;
      });
      usage = result.usage ?? null;
    } else {
      const result = await generateMultiProviderChat(params);
      output = result.text;
      usage = result.usage ?? null;
    }
    if (!output.includes(PROBE_TEXT)) {
      outcome = "unexpected_output";
      failureCategory = "unexpected_output";
    }
  } catch (error) {
    outcome = "request_failed";
    failureCategory = classifyProviderFailure(error, controller.signal.aborted);
  } finally {
    clearTimeout(timeout);
  }

  const record: MatrixRecord = {
    ...recordBase,
    outcome,
    failureCategory,
    durationMs: Date.now() - startedAt,
    usage,
  };
  const line = `${JSON.stringify(record)}\n`;
  process.stdout.write(line);
  const resultsFile = process.env.BYOK_LIVE_RESULTS_FILE?.trim();
  if (resultsFile) {
    await appendFile(resultsFile, line, { encoding: "utf8", mode: 0o600 });
    await chmod(resultsFile, 0o600);
  }
  if (outcome !== "pass") process.exitCode = 1;
}

await main();
