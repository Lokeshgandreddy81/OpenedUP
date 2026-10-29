import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { resolveApiKey } from "../../config/index.js";
import {
  verifyVaultHealth,
  getVaultAttestationFingerprint,
} from "../../../domains/credentials/application/credentialVault.js";

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
  const vaultHealth = verifyVaultHealth();
  const vaultAttestation = getVaultAttestationFingerprint();
  // SQLite is useful for local development, but Vercel's function filesystem is ephemeral.
  // Until the repositories use the configured Postgres database, Vercel is not durable-ready.
  const persistentStorageReady = process.env["VERCEL"] !== "1";

  res.status(200).json({
    status: vaultHealth.healthy && persistentStorageReady ? "ready" : "degraded",
    geminiConfigured,
    pythonAvailable,
    vaultHealthy: vaultHealth.healthy,
    vaultAttestation: vaultAttestation.status,
    persistentStorageReady,
    timestamp: new Date().toISOString(),
  });
}
