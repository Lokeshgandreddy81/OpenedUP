import fs from "fs";
import pino from "pino";
import { LOG_FILE } from "./config.ts";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
});

const recentLogs: string[] = [];
const MAX_RECENT_LOGS = 500;

export function logEvent(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[${new Date().toISOString()}] ${message}${metaStr}\n`;

  recentLogs.push(line);
  if (recentLogs.length > MAX_RECENT_LOGS) {
    recentLogs.shift();
  }

  logger.info(meta || {}, message);

  try {
    fs.appendFile(LOG_FILE, line, "utf8", () => {});
  } catch {
    // Ignore file write issues in restricted runtimes
  }
}

export function getRecentLogs(): string {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return fs.readFileSync(LOG_FILE, "utf8");
    } catch {
      // Fallback to memory
    }
  }
  return recentLogs.join("") || "No logs yet.";
}
