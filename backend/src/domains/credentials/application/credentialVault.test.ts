import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  getEncryptionKey,
  saveProviderCredential,
  getProviderCredential,
  updateProviderEndpoint,
  listProviderCredentials,
  deleteProviderCredential,
  CredentialDecryptionError,
  secureWipeBuffer,
  getFallbackEncryptionKeys,
  deriveTenantDek,
  CryptographicMaterialsCache,
  generateBlindIndex,
  getVaultAttestationFingerprint,
  verifyVaultHealth,
  sanitizeCredentialForAudit,
  withDecryptedCredential,
  constantTimeEqual,
  reencryptAllCredentialsWithPrimaryKey,
  purgeOrQuarantineCredential,
} from "./credentialVault.js";
import { getChatDatabase } from "../../../platform/database/chatDatabase.js";

function setupIsolatedEnv() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-test-"));
  const origEnv = { ...process.env };
  process.env["CHAT_DB_PATH"] = ":memory:";
  process.env["KEY_STORAGE_DIR"] = tmpDir;
  delete process.env["BYOK_ENCRYPTION_KEY"];
  process.env["NODE_ENV"] = "test";

  return {
    tmpDir,
    cleanup: () => {
      process.env = origEnv;
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    },
  };
}

test("1. Master key derivation and permission enforcement", () => {
  const { tmpDir, cleanup } = setupIsolatedEnv();
  try {
    // 1.1 Filesystem fallback generates 32-byte key with 0700 dir and 0600 file permissions
    const key1 = getEncryptionKey();
    assert.equal(key1.length, 32);

    const keyFile = path.join(tmpDir, "credential.key");
    assert.ok(fs.existsSync(keyFile));

    const dirStat = fs.statSync(tmpDir);
    const fileStat = fs.statSync(keyFile);

    // Verify POSIX permissions if on supported OS
    if (process.platform !== "win32") {
      assert.equal(dirStat.mode & 0o777, 0o700, "Directory permissions must be 0700");
      assert.equal(fileStat.mode & 0o777, 0o600, "Key file permissions must be 0600");
    }

    // 1.2 Calling again reuses the existing generated master key
    const key2 = getEncryptionKey();
    assert.deepEqual(key1, key2);

    // 1.3 Permissions are corrected if previously loosened
    if (process.platform !== "win32") {
      fs.chmodSync(keyFile, 0o644);
      fs.chmodSync(tmpDir, 0o755);
      getEncryptionKey();
      assert.equal(fs.statSync(tmpDir).mode & 0o777, 0o700);
      assert.equal(fs.statSync(keyFile).mode & 0o777, 0o600);
    }

    // 1.4 Corrupted key file (invalid length) throws descriptive error
    fs.writeFileSync(keyFile, Buffer.from("too-short-key"));
    assert.throws(
      () => getEncryptionKey(),
      /expected 32 bytes/
    );

    // 1.5 BYOK_ENCRYPTION_KEY env var takes precedence
    const customKey = crypto.randomBytes(32);
    process.env["BYOK_ENCRYPTION_KEY"] = customKey.toString("base64");
    const derivedFromEnv = getEncryptionKey();
    assert.deepEqual(derivedFromEnv, customKey);

    // 1.6 Invalid BYOK_ENCRYPTION_KEY length throws error
    process.env["BYOK_ENCRYPTION_KEY"] = Buffer.from("short").toString("base64");
    assert.throws(
      () => getEncryptionKey(),
      /must be a base64-encoded 32-byte key/
    );

    // 1.7 Production environment mandates BYOK_ENCRYPTION_KEY
    delete process.env["BYOK_ENCRYPTION_KEY"];
    process.env["NODE_ENV"] = "production";
    assert.throws(
      () => getEncryptionKey(),
      /BYOK_ENCRYPTION_KEY is required in production/
    );
  } finally {
    cleanup();
  }
});

test("2. AES-256-GCM cipher setup, 12-byte random nonces, auth tags, and CRUD", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const userId = `usr_${crypto.randomUUID()}`;
    const provider = "openai";

    // 2.1 Save credential
    saveProviderCredential(userId, provider, {
      apiKey: "sk-test-secret-key-12345",
      baseUrl: "https://api.openai.com/v1",
    });

    // 2.2 Verify raw storage in database
    const db = getChatDatabase();
    const row = db
      .prepare(
        "SELECT nonce, auth_tag, ciphertext, updated_at FROM provider_credentials WHERE user_id = ? AND provider_id = ?"
      )
      .get(userId, provider) as {
      nonce: Buffer;
      auth_tag: Buffer;
      ciphertext: Buffer;
      updated_at: number;
    };

    assert.ok(row, "Row must exist in SQLite");
    assert.equal(row.nonce.length, 12, "Nonce must be 12 bytes");
    assert.equal(row.auth_tag.length, 16, "Auth tag must be 16 bytes");
    assert.ok(row.ciphertext.length > 0, "Ciphertext must not be empty");
    assert.ok(row.updated_at > 0);

    // Plaintext secret must NOT appear in raw ciphertext
    assert.ok(
      !row.ciphertext.toString("utf8").includes("sk-test-secret-key-12345"),
      "Ciphertext must not contain plaintext secret"
    );

    // 2.3 Retrieve credential
    const retrieved = getProviderCredential(userId, provider);
    assert.ok(retrieved);
    assert.equal(retrieved.apiKey, "sk-test-secret-key-12345");
    assert.equal(retrieved.baseUrl, "https://api.openai.com/v1");

    // 2.4 Nonce freshness on conflict update
    const firstNonce = Buffer.from(row.nonce);
    saveProviderCredential(userId, provider, {
      apiKey: "sk-test-updated-key-99999",
    });

    const updatedRow = db
      .prepare(
        "SELECT nonce, auth_tag, ciphertext FROM provider_credentials WHERE user_id = ? AND provider_id = ?"
      )
      .get(userId, provider) as {
      nonce: Buffer;
      auth_tag: Buffer;
      ciphertext: Buffer;
    };

    assert.notDeepEqual(
      updatedRow.nonce,
      firstNonce,
      "New 12-byte nonce must be generated on every update to prevent nonce reuse"
    );

    const updatedRetrieved = getProviderCredential(userId, provider);
    assert.equal(updatedRetrieved?.apiKey, "sk-test-updated-key-99999");
    assert.equal(updatedRetrieved?.baseUrl, undefined);

    // 2.5 List credentials
    saveProviderCredential(userId, "anthropic", { apiKey: "sk-ant-111" });
    saveProviderCredential(userId, "google", { apiKey: "AIza-222" });

    const providers = listProviderCredentials(userId);
    assert.deepEqual(providers, ["anthropic", "google", "openai"]);

    // User isolation in listing
    const otherUserProviders = listProviderCredentials("other-user-999");
    assert.deepEqual(otherUserProviders, []);

    // 2.6 Atomic endpoint update
    const endpointUpdated = updateProviderEndpoint(
      userId,
      "anthropic",
      "https://proxy.anthropic.internal"
    );
    assert.ok(endpointUpdated);
    assert.equal(endpointUpdated.apiKey, "sk-ant-111");
    assert.equal(endpointUpdated.baseUrl, "https://proxy.anthropic.internal");

    const endpointFetched = getProviderCredential(userId, "anthropic");
    assert.equal(endpointFetched?.baseUrl, "https://proxy.anthropic.internal");

    // Updating non-existent returns null
    const nonExistent = updateProviderEndpoint(userId, "deepseek", "https://api.deepseek.com");
    assert.equal(nonExistent, null);
  } finally {
    cleanup();
  }
});

test("3. Secure deletion and pre-deletion zero-shredding", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const userId = "user-delete-test";
    const provider = "google";

    saveProviderCredential(userId, provider, { apiKey: "AIza-secure-delete" });
    assert.ok(getProviderCredential(userId, provider));

    const deleted = deleteProviderCredential(userId, provider);
    assert.equal(deleted, true);

    // Record is removed
    assert.equal(getProviderCredential(userId, provider), null);
    assert.deepEqual(listProviderCredentials(userId), []);

    // Deleting again returns false
    assert.equal(deleteProviderCredential(userId, provider), false);
  } finally {
    cleanup();
  }
});

test("4. Tampering resistance and AAD cross-user/cross-provider swapping protection", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const aliceId = "alice-uid";
    const bobId = "bob-uid";
    const db = getChatDatabase();

    saveProviderCredential(aliceId, "openai", { apiKey: "alice-openai-secret" });

    const aliceRow = db
      .prepare(
        "SELECT nonce, auth_tag, ciphertext FROM provider_credentials WHERE user_id = ? AND provider_id = ?"
      )
      .get(aliceId, "openai") as { nonce: Buffer; auth_tag: Buffer; ciphertext: Buffer };

    // 4.1 Cross-user swapping attack:
    // Attacker copies Alice's encrypted blob into Bob's row
    db.prepare(
      "INSERT INTO provider_credentials (user_id, provider_id, nonce, auth_tag, ciphertext, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(bobId, "openai", aliceRow.nonce, aliceRow.auth_tag, aliceRow.ciphertext, Date.now());

    // Bob attempts to decrypt Alice's ciphertext
    // AAD = `${bobId}:openai` does not match Alice's AAD `${aliceId}:openai`
    assert.throws(
      () => getProviderCredential(bobId, "openai"),
      (err: unknown) => {
        assert.ok(err instanceof CredentialDecryptionError);
        assert.ok(err.message.includes("authentication failed"));
        return true;
      },
      "Decryption MUST fail when ciphertext is swapped across users due to AAD mismatch"
    );

    // 4.2 Cross-provider swapping attack:
    // Attacker copies Alice's openai ciphertext into Alice's anthropic row
    db.prepare(
      "INSERT INTO provider_credentials (user_id, provider_id, nonce, auth_tag, ciphertext, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(aliceId, "anthropic", aliceRow.nonce, aliceRow.auth_tag, aliceRow.ciphertext, Date.now());

    // Decryption attempts with provider 'anthropic' but ciphertext was encrypted under 'openai'
    assert.throws(
      () => getProviderCredential(aliceId, "anthropic"),
      (err: unknown) => {
        assert.ok(err instanceof CredentialDecryptionError);
        return true;
      },
      "Decryption MUST fail when ciphertext is swapped across providers due to AAD mismatch"
    );

    // 4.3 Bit-flipping ciphertext tampering resistance
    const tamperedCiphertext = Buffer.from(aliceRow.ciphertext);
    tamperedCiphertext[0] = ((tamperedCiphertext[0] ?? 0) ^ 0x01); // flip 1 bit
    db.prepare(
      "UPDATE provider_credentials SET ciphertext = ? WHERE user_id = ? AND provider_id = ?"
    ).run(tamperedCiphertext, aliceId, "openai");

    assert.throws(
      () => getProviderCredential(aliceId, "openai"),
      CredentialDecryptionError,
      "Bit-flipped ciphertext must fail authentication"
    );

    // 4.4 Bit-flipping auth tag tampering resistance
    const tamperedTag = Buffer.from(aliceRow.auth_tag);
    tamperedTag[0] = ((tamperedTag[0] ?? 0) ^ 0xff);
    db.prepare(
      "UPDATE provider_credentials SET auth_tag = ?, ciphertext = ? WHERE user_id = ? AND provider_id = ?"
    ).run(tamperedTag, aliceRow.ciphertext, aliceId, "openai");

    assert.throws(
      () => getProviderCredential(aliceId, "openai"),
      CredentialDecryptionError,
      "Bit-flipped auth tag must fail authentication"
    );

    // 4.5 Bit-flipping nonce tampering resistance
    const tamperedNonce = Buffer.from(aliceRow.nonce);
    tamperedNonce[0] = ((tamperedNonce[0] ?? 0) ^ 0x55);
    db.prepare(
      "UPDATE provider_credentials SET nonce = ?, auth_tag = ?, ciphertext = ? WHERE user_id = ? AND provider_id = ?"
    ).run(tamperedNonce, aliceRow.auth_tag, aliceRow.ciphertext, aliceId, "openai");

    assert.throws(
      () => getProviderCredential(aliceId, "openai"),
      CredentialDecryptionError,
      "Bit-flipped nonce must fail authentication"
    );

    // 4.6 Truncated nonce or tag length validation
    db.prepare(
      "UPDATE provider_credentials SET nonce = ? WHERE user_id = ? AND provider_id = ?"
    ).run(Buffer.alloc(8, 0), aliceId, "openai");

    assert.throws(
      () => getProviderCredential(aliceId, "openai"),
      /Invalid nonce length/
    );

    db.prepare(
      "UPDATE provider_credentials SET nonce = ?, auth_tag = ? WHERE user_id = ? AND provider_id = ?"
    ).run(aliceRow.nonce, Buffer.alloc(8, 0), aliceId, "openai");

    assert.throws(
      () => getProviderCredential(aliceId, "openai"),
      /Invalid auth tag length/
    );
  } finally {
    cleanup();
  }
});

test("5. Wrong master key resistance", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const userId = "key-rotation-test-user";
    const keyA = crypto.randomBytes(32);
    const keyB = crypto.randomBytes(32);

    process.env["BYOK_ENCRYPTION_KEY"] = keyA.toString("base64");
    saveProviderCredential(userId, "openai", { apiKey: "key-a-secret" });

    // Switch to key B (e.g. wrong key configured)
    process.env["BYOK_ENCRYPTION_KEY"] = keyB.toString("base64");
    assert.throws(
      () => getProviderCredential(userId, "openai"),
      CredentialDecryptionError,
      "Decryption with wrong master key must throw CredentialDecryptionError"
    );

    // Switch back to key A
    process.env["BYOK_ENCRYPTION_KEY"] = keyA.toString("base64");
    const recovered = getProviderCredential(userId, "openai");
    assert.equal(recovered?.apiKey, "key-a-secret");
  } finally {
    cleanup();
  }
});

test("6. Agent 1: Secure in-memory buffer wiping and scoped execution", () => {
  const buf = Buffer.from("super-secret-temporary-key");
  assert.equal(buf.toString("utf8"), "super-secret-temporary-key");
  secureWipeBuffer(buf);
  // Ensure buffer is wiped and zeroes out
  assert.ok(buf.every((byte) => byte === 0), "Buffer must be zero-filled");

  // withDecryptedCredential safely wraps access
  const { cleanup } = setupIsolatedEnv();
  try {
    const key = crypto.randomBytes(32);
    process.env["BYOK_ENCRYPTION_KEY"] = key.toString("base64");
    saveProviderCredential("mem-user", "anthropic", { apiKey: "sk-ant-test-123" });

    const executed = withDecryptedCredential("mem-user", "anthropic", (cred) => {
      return cred.apiKey.toUpperCase();
    });
    assert.equal(executed, "SK-ANT-TEST-123");

    const nonExistent = withDecryptedCredential("mem-user", "google", (c) => c.apiKey);
    assert.equal(nonExistent, null);
  } finally {
    cleanup();
  }
});

test("7. Agent 2: Zero-downtime key rotation with fallback keys and re-encryption", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const oldKey = crypto.randomBytes(32);
    const newKey = crypto.randomBytes(32);
    const userId = "rotation-user";

    // 1. Initial credential saved under old key
    process.env["BYOK_ENCRYPTION_KEY"] = oldKey.toString("base64");
    saveProviderCredential(userId, "openai", { apiKey: "original-openai-key" });

    // 2. Rotate to newKey, keeping oldKey in fallback list
    process.env["BYOK_ENCRYPTION_KEY"] = newKey.toString("base64");
    process.env["BYOK_FALLBACK_ENCRYPTION_KEYS"] = oldKey.toString("base64");

    const fallbacks = getFallbackEncryptionKeys();
    assert.equal(fallbacks.length, 1);
    assert.deepEqual(fallbacks[0], oldKey);

    // 3. Credential is decrypted via fallback AND transparently re-encrypted with newKey!
    const decrypted = getProviderCredential(userId, "openai");
    assert.equal(decrypted?.apiKey, "original-openai-key");

    // 4. Remove fallback keys: reading MUST succeed with newKey alone because it was re-encrypted!
    delete process.env["BYOK_FALLBACK_ENCRYPTION_KEYS"];
    const decryptedWithNewKeyAlone = getProviderCredential(userId, "openai");
    assert.equal(decryptedWithNewKeyAlone?.apiKey, "original-openai-key");

    // Proactive canary probe verifyVaultHealth
    const health = verifyVaultHealth();
    assert.equal(health.healthy, true);
    assert.ok(health.latencyMs >= 0);
  } finally {
    cleanup();
  }
});

test("8. Agent 3 & 4: Hierarchical Key Derivation (HKDF) & Cryptographic Materials Cache", () => {
  const masterKey = crypto.randomBytes(32);

  // Deterministic HKDF derivation
  const dek1 = deriveTenantDek(masterKey, "tenant-alpha");
  const dek2 = deriveTenantDek(masterKey, "tenant-alpha");
  const dek3 = deriveTenantDek(masterKey, "tenant-beta");

  assert.equal(dek1.length, 32);
  assert.deepEqual(dek1, dek2, "Same tenant must derive identical DEK");
  assert.notDeepEqual(dek1, dek3, "Different tenants must derive distinct DEKs");

  // In-memory materials cache with operation limit & TTL
  CryptographicMaterialsCache.clear();
  CryptographicMaterialsCache.set("cache-test", dek1, 60000, 2); // max 2 ops

  // Op 1
  const cached1 = CryptographicMaterialsCache.get("cache-test");
  assert.ok(cached1);
  assert.deepEqual(cached1, dek1);

  // Op 2
  const cached2 = CryptographicMaterialsCache.get("cache-test");
  assert.ok(cached2);

  // Op 3: exhausted max operations
  const cached3 = CryptographicMaterialsCache.get("cache-test");
  assert.equal(cached3, null, "Cache must invalidate after reaching max operations limit");

  // Invalidate on command
  CryptographicMaterialsCache.set("cache-test-2", dek1);
  CryptographicMaterialsCache.invalidate("cache-test-2");
  assert.equal(CryptographicMaterialsCache.get("cache-test-2"), null);
});

test("9. Agent 5: Blind indexing for zero-knowledge queries and audit sanitizer", () => {
  const masterKey = crypto.randomBytes(32);
  const hash1 = generateBlindIndex("acme-customer@example.com", masterKey);
  const hash2 = generateBlindIndex("ACME-CUSTOMER@example.com", masterKey);
  const hash3 = generateBlindIndex("different-customer@example.com", masterKey);

  assert.equal(hash1, hash2, "Blind index must be case-insensitive deterministic HMAC");
  assert.notEqual(hash1, hash3, "Different plaintext must yield distinct blind index");
  assert.equal(hash1.length, 64, "HMAC-SHA256 hex digest length must be 64 characters");

  // Sanitizer
  const sanitized = sanitizeCredentialForAudit({
    apiKey: "sk-proj-1234567890abcdef",
    baseUrl: "https://api.openai.com/v1",
  });
  assert.equal(sanitized.keyPreview, "sk-...cdef");
  assert.equal(sanitized.baseUrl, "https://api.openai.com/v1");
});

test("10. Agent 6: Runtime attestation integrity fingerprint", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const key = crypto.randomBytes(32);
    process.env["BYOK_ENCRYPTION_KEY"] = key.toString("base64");
    process.env["BYOK_FALLBACK_ENCRYPTION_KEYS"] = crypto.randomBytes(32).toString("base64");

    const fingerprint = getVaultAttestationFingerprint();
    assert.equal(fingerprint.status, "healthy");
    assert.equal(fingerprint.algorithm, "AES-256-GCM+HKDF");
    assert.equal(fingerprint.primaryKeyFingerprint.length, 16);
    assert.equal(fingerprint.fallbackCount, 1);
    assert.equal(fingerprint.fallbackFingerprints.length, 1);
  } finally {
    cleanup();
  }
});

test("11. Agent 5: Constant-time comparison defends against timing attacks", () => {
  const secretA = "5f4dcc3b5aa765d61d8327deb882cf99";
  const secretB = "5f4dcc3b5aa765d61d8327deb882cf99";
  const secretC = "5f4dcc3b5aa765d61d8327deb882cf00";
  const secretD = "short";

  assert.equal(constantTimeEqual(secretA, secretB), true);
  assert.equal(constantTimeEqual(secretA, secretC), false);
  assert.equal(constantTimeEqual(secretA, secretD), false);
  assert.equal(constantTimeEqual(Buffer.from(secretA), Buffer.from(secretB)), true);
  assert.equal(constantTimeEqual(Buffer.from(secretA), Buffer.from(secretC)), false);
});

test("12. Agent 2: Bulk database re-encryption sweeps and migrates all fallback records", () => {
  const { cleanup } = setupIsolatedEnv();
  try {
    const keyOld = crypto.randomBytes(32);
    const keyNew = crypto.randomBytes(32);

    // Save records under keyOld
    process.env["BYOK_ENCRYPTION_KEY"] = keyOld.toString("base64");
    saveProviderCredential("bulk-user-1", "openai", { apiKey: "key-1" });
    saveProviderCredential("bulk-user-1", "anthropic", { apiKey: "key-2" });
    saveProviderCredential("bulk-user-1", "google", { apiKey: "key-3" });

    // Rotate active key to keyNew with keyOld as fallback
    process.env["BYOK_ENCRYPTION_KEY"] = keyNew.toString("base64");
    process.env["BYOK_FALLBACK_ENCRYPTION_KEYS"] = keyOld.toString("base64");

    // Proactive migration sweep for bulk-user-1
    const result = reencryptAllCredentialsWithPrimaryKey("bulk-user-1");
    assert.equal(result.total, 3);
    assert.equal(result.reencrypted, 3);
    assert.equal(result.failed, 0);

    // Running again: all should now be skipped because they are already under primary key!
    const secondPass = reencryptAllCredentialsWithPrimaryKey("bulk-user-1");
    assert.equal(secondPass.skipped, 3);
    assert.equal(secondPass.reencrypted, 0);

    // Remove fallback keys completely: everything must still decrypt cleanly under keyNew!
    delete process.env["BYOK_FALLBACK_ENCRYPTION_KEYS"];
    assert.equal(getProviderCredential("bulk-user-1", "openai")?.apiKey, "key-1");
    assert.equal(getProviderCredential("bulk-user-1", "anthropic")?.apiKey, "key-2");
    assert.equal(getProviderCredential("bulk-user-1", "google")?.apiKey, "key-3");
  } finally {
    cleanup();
  }
});

test("13. Agent 2 & 3: Defensive clone on cached materials and soft quarantine", () => {
  // Defensive clone prevents caller mutations
  CryptographicMaterialsCache.clear();
  const rawKey = crypto.randomBytes(32);
  CryptographicMaterialsCache.set("tenant-dek", rawKey);

  const retrieved = CryptographicMaterialsCache.get("tenant-dek");
  assert.ok(retrieved);
  // Modify caller's local copy
  retrieved.fill(0);

  // Subsequent fetch must NOT be corrupted
  const retrievedAgain = CryptographicMaterialsCache.get("tenant-dek");
  assert.ok(retrievedAgain);
  assert.notDeepEqual(retrievedAgain, retrieved, "Cache must return defensive copy to prevent caller mutation");
  assert.deepEqual(retrievedAgain, rawKey);

  // Soft-quarantine check
  const { cleanup } = setupIsolatedEnv();
  try {
    const key = crypto.randomBytes(32);
    process.env["BYOK_ENCRYPTION_KEY"] = key.toString("base64");
    saveProviderCredential("quarantine-user", "openai", { apiKey: "test-key" });

    // Quarantine without shredding
    const qResult = purgeOrQuarantineCredential("quarantine-user", "openai", { quarantineOnly: true });
    assert.equal(qResult.quarantined, true);
    assert.equal(qResult.shredded, false);

    // Active purge
    const pResult = purgeOrQuarantineCredential("quarantine-user", "openai");
    assert.equal(pResult.quarantined, false);
    assert.equal(pResult.shredded, true);
    assert.equal(getProviderCredential("quarantine-user", "openai"), null);
  } finally {
    cleanup();
  }
});
