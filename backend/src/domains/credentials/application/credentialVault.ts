import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ProviderId } from "@charan-interiors/contracts";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";
import { AppError } from "../../../platform/errors/errors.js";

export class CredentialDecryptionError extends AppError {
  public override readonly cause?: unknown;

  constructor(
    message = "Failed to decrypt provider credential: authentication failed or corrupted ciphertext.",
    cause?: unknown
  ) {
    super(message, 500);
    this.name = "CredentialDecryptionError";
    this.cause = cause;
  }
}

export function getEncryptionKey(): Buffer {
  const configured = process.env["BYOK_ENCRYPTION_KEY"]?.trim();
  if (configured) {
    const key = Buffer.from(configured, "base64");
    if (key.length !== 32) {
      throw new Error("BYOK_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
    }
    return key;
  }
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("BYOK_ENCRYPTION_KEY is required in production.");
  }
  const dir =
    process.env["KEY_STORAGE_DIR"]?.trim() ||
    path.join(os.homedir(), ".local", "share", "openedup");
  const file = path.join(dir, "credential.key");

  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // Best-effort for platforms or filesystems that do not support chmod
  }

  try {
    const existing = fs.readFileSync(file);
    if (existing.length !== 32) {
      throw new Error(`Master key file at ${file} is invalid: expected 32 bytes, got ${existing.length}.`);
    }
    try {
      const stat = fs.statSync(file);
      if ((stat.mode & 0o777) !== 0o600) {
        fs.chmodSync(file, 0o600);
      }
    } catch {
      // Best-effort
    }
    return existing;
  } catch (readErr: unknown) {
    if ((readErr as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw readErr;
    }

    const key = crypto.randomBytes(32);
    try {
      fs.writeFileSync(file, key, { mode: 0o600, flag: "wx" });
      try {
        fs.chmodSync(file, 0o600);
      } catch {
        // Best-effort
      }
      return key;
    } catch (writeErr: unknown) {
      if ((writeErr as NodeJS.ErrnoException)?.code === "EEXIST") {
        const raceKey = fs.readFileSync(file);
        if (raceKey.length !== 32) {
          throw new Error(`Master key file at ${file} is invalid: expected 32 bytes, got ${raceKey.length}.`);
        }
        return raceKey;
      }
      throw writeErr;
    }
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
  const key = getEncryptionKey();
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  const aad = Buffer.from(`${userId}:${provider}`, "utf8");
  cipher.setAAD(aad);

  const plaintextBuffer = Buffer.from(JSON.stringify(credential), "utf8");
  const ciphertext = Buffer.concat([
    cipher.update(plaintextBuffer),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  plaintextBuffer.fill(0);

  const db = getChatDatabase();
  const saveTx = db.transaction(() => {
    db.prepare(
      `INSERT INTO provider_credentials(user_id, provider_id, nonce, auth_tag, ciphertext, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, provider_id) DO UPDATE SET
         nonce = excluded.nonce,
         auth_tag = excluded.auth_tag,
         ciphertext = excluded.ciphertext,
         updated_at = excluded.updated_at`
    ).run(userId, provider, nonce, authTag, ciphertext, Date.now());
  });
  saveTx();
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

  if (!Buffer.isBuffer(row.nonce) || row.nonce.length !== 12) {
    throw new CredentialDecryptionError(
      `Invalid nonce length for provider ${provider}: expected 12 bytes.`
    );
  }
  if (!Buffer.isBuffer(row.auth_tag) || row.auth_tag.length !== 16) {
    throw new CredentialDecryptionError(
      `Invalid auth tag length for provider ${provider}: expected 16 bytes.`
    );
  }
  if (!Buffer.isBuffer(row.ciphertext) || row.ciphertext.length === 0) {
    throw new CredentialDecryptionError(
      `Invalid ciphertext buffer for provider ${provider}.`
    );
  }

  let decrypted: Buffer;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), row.nonce);
    decipher.setAAD(Buffer.from(`${userId}:${provider}`, "utf8"));
    decipher.setAuthTag(row.auth_tag);
    decrypted = Buffer.concat([decipher.update(row.ciphertext), decipher.final()]);
  } catch (cause) {
    throw new CredentialDecryptionError(
      `Failed to decrypt credential for provider ${provider}: authentication failed or corrupted ciphertext.`,
      cause
    );
  }

  let parsed: ProviderCredential;
  try {
    parsed = JSON.parse(decrypted.toString("utf8")) as ProviderCredential;
  } catch (cause) {
    throw new CredentialDecryptionError(
      `Failed to parse decrypted credential JSON for provider ${provider}.`,
      cause
    );
  } finally {
    decrypted.fill(0);
  }

  if (!parsed || typeof parsed.apiKey !== "string") {
    throw new CredentialDecryptionError(
      `Decrypted credential payload for provider ${provider} is malformed.`
    );
  }
  return parsed;
}

export function updateProviderEndpoint(
  userId: string,
  provider: ProviderId,
  baseUrl: string
): ProviderCredential | null {
  const db = getChatDatabase();
  const tx = db.transaction(() => {
    const existing = getProviderCredential(userId, provider);
    if (!existing) return null;
    const updated: ProviderCredential = {
      ...existing,
      baseUrl,
    };
    saveProviderCredential(userId, provider, updated);
    return updated;
  });
  return tx();
}

export function listProviderCredentials(userId: string): ProviderId[] {
  return (
    getChatDatabase()
      .prepare("SELECT provider_id FROM provider_credentials WHERE user_id = ? ORDER BY provider_id ASC")
      .all(userId) as Array<{ provider_id: ProviderId }>
  ).map((row) => row.provider_id);
}

export function deleteProviderCredential(userId: string, provider: ProviderId): boolean {
  const db = getChatDatabase();
  const tx = db.transaction(() => {
    const zeroNonce = Buffer.alloc(12, 0);
    const zeroAuthTag = Buffer.alloc(16, 0);
    const zeroCiphertext = Buffer.alloc(0);

    // Secure shredding prior to row removal
    db.prepare(
      `UPDATE provider_credentials
       SET nonce = ?, auth_tag = ?, ciphertext = ?, updated_at = ?
       WHERE user_id = ? AND provider_id = ?`
    ).run(zeroNonce, zeroAuthTag, zeroCiphertext, Date.now(), userId, provider);

    const result = db
      .prepare("DELETE FROM provider_credentials WHERE user_id = ? AND provider_id = ?")
      .run(userId, provider);
    return result.changes > 0;
  });
  return tx();
}
