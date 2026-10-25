import fs from "node:fs";
import pino, { type LoggerOptions } from "pino";

const LOG_FILE = process.env["LOG_FILE"] || "/tmp/shoebox.log";

// Ensure log file directory exists if needed
try {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "", { flag: "a" });
  }
} catch {
  // Ignore permission or file creation errors in constrained environments
}

const SECRET_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /\bsk-(?:proj-|live-)?[a-zA-Z0-9_-]{20,}\b/g,
  /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/g,
  /x-provider-key:\s*[^\s,]+/gi,
  /(?:apiKey|api_key|injectedApiKey|token|secret|password)=([^&\s]+)/gi,
];

export function redactSecretsString(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, (match, ...args) => {
      const capturedGroups = args.slice(0, -2);
      const firstCapture = capturedGroups.find((g) => typeof g === "string" && g.length > 0);
      if (firstCapture) {
        return match.replace(firstCapture, "[REDACTED]");
      }
      return "[REDACTED]";
    });
  }
  return result;
}

export function redactSecretsObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return redactSecretsString(obj) as unknown as T;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactSecretsObject(item)) as unknown as T;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("key") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("password") ||
      lowerKey.includes("authorization")
    ) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactSecretsObject(value);
    }
  }
  return result as T;
}

const loggerOptions: LoggerOptions = {
  level: process.env["LOG_LEVEL"] || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers["x-provider-key"]',
      'req.headers["x-api-key"]',
      'req.headers["authorization"]',
      'headers["x-provider-key"]',
      'headers["x-api-key"]',
      'headers["authorization"]',
      "apiKey",
      "*.apiKey",
      "*.*.apiKey",
      "injectedApiKey",
      "*.injectedApiKey",
      "token",
      "*.token",
      "secret",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
};

if (process.env["NODE_ENV"] === "development") {
  loggerOptions.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  };
}

export const logger = pino(loggerOptions);

/**
 * Appends a log line to the legacy /tmp/shoebox.log file for compatibility with /api/logs
 */
export function logEvent(message: string, meta?: Record<string, unknown>): void {
  const sanitizedMessage = redactSecretsString(message);
  const sanitizedMeta = meta ? redactSecretsObject(meta) : undefined;
  const metaStr = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : "";
  const line = `[${new Date().toISOString()}] ${sanitizedMessage}${metaStr}\n`;
  try {
    fs.appendFile(LOG_FILE, line, "utf8", () => {});
  } catch {
    // Ignore error writing to log file
  }
  logger.info({ meta: sanitizedMeta }, sanitizedMessage);
}

export { LOG_FILE };
