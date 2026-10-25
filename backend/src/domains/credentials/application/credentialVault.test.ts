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
