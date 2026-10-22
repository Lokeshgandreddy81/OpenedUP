import "dotenv/config";
import fs from "fs";
import path from "path";

export const MODEL_ID = "gemini-3.8-flash";
export const FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-2.5-flash",
] as const;

export const PORT = Number(process.env.PORT) || 3000;
export const LOG_FILE = "/tmp/shoebox.log";

const PLACEHOLDER_API_KEYS = new Set([
  "",
  "MY_GEMINI_API_KEY",
  "PLACEHOLDER_API_KEY",
  "YOUR_GEMINI_API_KEY",
  "YOUR_API_KEY",
  "TODO",
  "undefined",
  "null",
]);

export function isValidApiKey(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && !PLACEHOLDER_API_KEYS.has(trimmed);
}

export function readDevEnvJson(): Record<string, unknown> {
  const candidates = [path.join(process.cwd(), ".dev.env.json"), "/tmp/.dev.env.json"];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed as Record<string, unknown>;
        }
      }
    } catch {
      // ignore unreadable or malformed .dev.env.json
    }
  }
  return {};
}

export function resolveApiKey(): string | undefined {
  for (const candidate of [process.env.GEMINI_API_KEY, process.env.API_KEY]) {
    if (isValidApiKey(candidate)) {
      return candidate.trim();
    }
  }

  const devEnv = readDevEnvJson();
  for (const candidate of [devEnv.GEMINI_API_KEY, devEnv.API_KEY]) {
    if (isValidApiKey(candidate)) {
      return candidate.trim();
    }
  }

  return undefined;
}
