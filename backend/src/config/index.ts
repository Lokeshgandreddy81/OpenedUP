import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PLACEHOLDER_API_KEYS: ReadonlySet<string> = new Set([
  "",
  "MY_GEMINI_API_KEY",
  "PLACEHOLDER_API_KEY",
  "YOUR_GEMINI_API_KEY",
  "YOUR_API_KEY",
  "TODO",
  "undefined",
  "null",
]);

export const MODEL_ID = "gemini-3.8-flash";
export const FALLBACK_MODELS: readonly string[] = [
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-2.5-flash",
];

export function isValidApiKey(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && !PLACEHOLDER_API_KEYS.has(trimmed);
}

export function readDevEnvJson(): Record<string, unknown> {
  const candidates = [
    path.join(process.cwd(), ".dev.env.json"),
    path.join(process.cwd(), "..", ".dev.env.json"),
    "/tmp/.dev.env.json",
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
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
  for (const candidate of [process.env["GEMINI_API_KEY"], process.env["API_KEY"]]) {
    if (isValidApiKey(candidate)) {
      return candidate.trim();
    }
  }

  const devEnv = readDevEnvJson();
  for (const candidate of [devEnv["GEMINI_API_KEY"], devEnv["API_KEY"]]) {
    if (isValidApiKey(candidate)) {
      return candidate.trim();
    }
  }

  return undefined;
}

export function resolveFirebaseConfig(): {
  firebaseConfig: Record<string, unknown> | null;
  googleClientId: string | null;
} {
  const devEnv = readDevEnvJson();
  let firebaseConfig: Record<string, unknown> | null = null;

  const configCandidates = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.join(__dirname, "..", "..", "firebase-applet-config.json"),
    path.join(__dirname, "..", "firebase-applet-config.json"),
    path.join(process.cwd(), "..", "firebase-applet-config.json"),
  ];

  for (const candidatePath of configCandidates) {
    try {
      if (fs.existsSync(candidatePath)) {
        const parsed = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
        if (parsed && typeof parsed === "object") {
          const apiKey = typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "";
          const authDomain = typeof parsed.authDomain === "string" ? parsed.authDomain.trim() : "";
          const projectId = typeof parsed.projectId === "string" ? parsed.projectId.trim() : "";
          const isValidFb =
            apiKey.length > 0 &&
            !PLACEHOLDER_API_KEYS.has(apiKey) &&
            !apiKey.includes("remixed-") &&
            authDomain.length > 0 &&
            !authDomain.includes("remixed-") &&
            !projectId.includes("remixed-");
          if (isValidFb) {
            firebaseConfig = parsed as Record<string, unknown>;
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const rawFbClientId =
    (typeof firebaseConfig?.["oAuthClientId"] === "string"
      ? (firebaseConfig["oAuthClientId"] as string).trim()
      : null) ||
    (typeof firebaseConfig?.["oauthClientId"] === "string"
      ? (firebaseConfig["oauthClientId"] as string).trim()
      : null);

  const fbClientId =
    rawFbClientId && !PLACEHOLDER_API_KEYS.has(rawFbClientId) && !rawFbClientId.includes("remixed-")
      ? rawFbClientId
      : null;

  const rawId =
    process.env["GOOGLE_CLIENT_ID"] ||
    process.env["VITE_GOOGLE_CLIENT_ID"] ||
    (typeof devEnv["GOOGLE_CLIENT_ID"] === "string"
      ? (devEnv["GOOGLE_CLIENT_ID"] as string)
      : null) ||
    (typeof devEnv["VITE_GOOGLE_CLIENT_ID"] === "string"
      ? (devEnv["VITE_GOOGLE_CLIENT_ID"] as string)
      : null) ||
    fbClientId;

  const cleanId =
    rawId && !PLACEHOLDER_API_KEYS.has(rawId.trim()) && !rawId.trim().includes("remixed-")
      ? rawId.trim()
      : null;

  return {
    firebaseConfig,
    googleClientId: cleanId,
  };
}

export const envConfig = {
  PORT: Number(process.env["PORT"]) || 3000,
  NODE_ENV: process.env["NODE_ENV"] || "development",
  LOG_LEVEL: process.env["LOG_LEVEL"] || "info",
};
