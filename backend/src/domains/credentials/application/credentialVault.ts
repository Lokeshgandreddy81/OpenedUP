import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ProviderId } from "@charan-interiors/contracts";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";

function encryptionKey(): Buffer {
  const configured = process.env["BYOK_ENCRYPTION_KEY"];
  if (configured) {
    const key = Buffer.from(configured, "base64");
    if (key.length !== 32)
      throw new Error("BYOK_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
    return key;
  }
  if (process.env["NODE_ENV"] === "production")
    throw new Error("BYOK_ENCRYPTION_KEY is required in production.");
  const dir = path.join(os.homedir(), ".local", "share", "openedup");
  const file = path.join(dir, "credential.key");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    return fs.readFileSync(file);
  } catch {
    const key = crypto.randomBytes(32);
    fs.writeFileSync(file, key, { mode: 0o600, flag: "wx" });
    return key;
  }
}

export interface ProviderCredential {
  apiKey: string;
  baseUrl?: string;
}

export function saveProviderCredential(
  userId: string,
  provider: ProviderId,
  credential: ProviderCredential
): void {
  const key = encryptionKey();
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`${userId}:${provider}`, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(credential), "utf8"),
    cipher.final(),
  ]);
  getChatDatabase()
    .prepare(
      `INSERT INTO provider_credentials(user_id, provider_id, nonce, auth_tag, ciphertext, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, provider_id) DO UPDATE SET nonce=excluded.nonce, auth_tag=excluded.auth_tag, ciphertext=excluded.ciphertext, updated_at=excluded.updated_at`
    )
    .run(userId, provider, nonce, cipher.getAuthTag(), ciphertext, Date.now());
}

export function getProviderCredential(
  userId: string,
  provider: ProviderId
): ProviderCredential | null {
  const row = getChatDatabase()
    .prepare(
      "SELECT nonce, auth_tag, ciphertext FROM provider_credentials WHERE user_id = ? AND provider_id = ?"
    )
    .get(userId, provider) as { nonce: Buffer; auth_tag: Buffer; ciphertext: Buffer } | undefined;
  if (!row) return null;
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), row.nonce);
  decipher.setAAD(Buffer.from(`${userId}:${provider}`, "utf8"));
  decipher.setAuthTag(row.auth_tag);
  return JSON.parse(
    Buffer.concat([decipher.update(row.ciphertext), decipher.final()]).toString("utf8")
  ) as ProviderCredential;
}

export function listProviderCredentials(userId: string): ProviderId[] {
  return (
    getChatDatabase()
      .prepare("SELECT provider_id FROM provider_credentials WHERE user_id = ?")
      .all(userId) as Array<{ provider_id: ProviderId }>
  ).map((row) => row.provider_id);
}

export function deleteProviderCredential(userId: string, provider: ProviderId): void {
  getChatDatabase()
    .prepare("DELETE FROM provider_credentials WHERE user_id = ? AND provider_id = ?")
    .run(userId, provider);
}
