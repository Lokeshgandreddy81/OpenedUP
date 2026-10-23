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

const loggerOptions: LoggerOptions = {
  level: process.env["LOG_LEVEL"] || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
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
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[${new Date().toISOString()}] ${message}${metaStr}\n`;
  try {
    fs.appendFile(LOG_FILE, line, "utf8", () => {});
  } catch {
    // Ignore error writing to log file
  }
  logger.info({ meta }, message);
}

export { LOG_FILE };
