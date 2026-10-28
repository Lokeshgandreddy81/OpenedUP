import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

export const PLACEHOLDER_API_KEYS: ReadonlySet<string> = new Set([
  "",
  "MY_GEMINI_API_KEY",
  "PLACEHOLDER_API_KEY",
  "YOUR_GEMINI_API_KEY",
  "YOUR_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "YOUR_GOOGLE_CLIENT_ID",
  "YOUR_API_KEY",
  "TODO",
  "undefined",
  "null",
]);

export const MODEL_ID = "gemini-3.8-flash";
export function isValidApiKey(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 4096 || PLACEHOLDER_API_KEYS.has(trimmed)) {
    return false;
  }
  // Enforce visible ASCII characters only (no spaces, newlines, tabs, or control characters)
  return /^[\x21-\x7E]+$/.test(trimmed);
}

export function sanitizeApiKey(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 4096) return undefined;
  if (!/^[\x21-\x7E]+$/.test(trimmed)) return undefined;
  if (PLACEHOLDER_API_KEYS.has(trimmed)) return undefined;
  return trimmed;
}

export function sanitizeBaseUrl(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return undefined;
  // Disallow newlines, carriage returns, or control characters by requiring printable characters
  if (!/^[\x20-\x7E]+$/.test(trimmed)) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
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

export function resolveSupabaseConfig(): {
  url: string | null;
  publishableKey: string | null;
} {
  const devEnv = readDevEnvJson();
  const configuredUrl = process.env["SUPABASE_URL"] || devEnv["SUPABASE_URL"];
  const configuredPublishableKey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["SUPABASE_ANON_KEY"] ||
    devEnv["SUPABASE_PUBLISHABLE_KEY"] ||
    devEnv["SUPABASE_ANON_KEY"];
  const url = typeof configuredUrl === "string" ? configuredUrl.trim() : "";
  const publishableKey =
    typeof configuredPublishableKey === "string" ? configuredPublishableKey.trim() : "";
  const validUrl = (() => {
    try {
      const parsed = new URL(url);
      const loopbackHost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
      return (
        (parsed.protocol === "https:" || (parsed.protocol === "http:" && loopbackHost)) &&
        url.length <= 2048
      );
    } catch {
      return false;
    }
  })();

  return {
    url: validUrl ? url.replace(/\/+$/, "") : null,
    publishableKey: isValidApiKey(publishableKey) ? publishableKey : null,
  };
}

export function resolveGoogleClientId(): string | null {
  const devEnv = readDevEnvJson();
  const rawId =
    process.env["GOOGLE_CLIENT_ID"] ||
    process.env["VITE_GOOGLE_CLIENT_ID"] ||
    devEnv["GOOGLE_CLIENT_ID"] ||
    devEnv["VITE_GOOGLE_CLIENT_ID"];
  if (typeof rawId !== "string") return null;
  const cleanId = rawId.trim();
  return cleanId && !PLACEHOLDER_API_KEYS.has(cleanId) && /^[\x21-\x7E]+$/.test(cleanId)
    ? cleanId
    : null;
}

export const envConfig = {
  PORT: Number(process.env["PORT"]) || 3000,
  NODE_ENV: process.env["NODE_ENV"] || "development",
  LOG_LEVEL: process.env["LOG_LEVEL"] || "info",
};
