import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { resolveApiKey } from "../../config/index.js";

const execFileAsync = promisify(execFile);

export function getHealthz(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export async function getReadyz(_req: Request, res: Response): Promise<void> {
  let pythonAvailable = false;
  try {
    const { stdout } = await execFileAsync("python3", ["--version"]);
    pythonAvailable = Boolean(stdout && stdout.toLowerCase().includes("python"));
  } catch {
    pythonAvailable = false;
  }

  const geminiConfigured = Boolean(resolveApiKey());

  res.status(200).json({
    status: "ready",
    geminiConfigured,
    pythonAvailable,
    timestamp: new Date().toISOString(),
  });
}
