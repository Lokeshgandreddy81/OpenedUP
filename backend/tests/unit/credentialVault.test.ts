import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeChatDatabase, getChatDatabase } from "../../src/platform/database/chatDatabase.js";
import {
  deleteProviderCredential,
  getProviderCredential,
  listProviderCredentials,
  saveProviderCredential,
} from "../../src/domains/credentials/application/credentialVault.js";

describe("per-user provider credential vault", () => {
  beforeAll(() => {
    process.env["NODE_ENV"] = "test";
    process.env["CHAT_DB_PATH"] = ":memory:";
    process.env["BYOK_ENCRYPTION_KEY"] = Buffer.alloc(32, 7).toString("base64");
  });
  afterAll(() => closeChatDatabase());

  it("encrypts credentials at rest and scopes reads to the user", () => {
    saveProviderCredential("user-a", "openai", {
      apiKey: "secret-test-key",
      baseUrl: "https://example.test/v1",
    });
    expect(getProviderCredential("user-a", "openai")).toEqual({
      apiKey: "secret-test-key",
      baseUrl: "https://example.test/v1",
    });
    expect(getProviderCredential("user-b", "openai")).toBeNull();
    expect(listProviderCredentials("user-a")).toEqual(["openai"]);
    const row = getChatDatabase()
      .prepare("SELECT ciphertext FROM provider_credentials WHERE user_id = ?")
      .get("user-a") as { ciphertext: Buffer };
    expect(row.ciphertext.toString("utf8")).not.toContain("secret-test-key");
  });

  it("rejects tampered ciphertext and deletes only the selected account key", () => {
    saveProviderCredential("user-a", "google", { apiKey: "another-secret" });
    getChatDatabase()
      .prepare(
        "UPDATE provider_credentials SET ciphertext = ? WHERE user_id = ? AND provider_id = ?"
      )
      .run(Buffer.from("tampered"), "user-a", "google");
    expect(() => getProviderCredential("user-a", "google")).toThrow();
    saveProviderCredential("user-b", "google", { apiKey: "other-account" });
    deleteProviderCredential("user-a", "google");
    expect(getProviderCredential("user-a", "google")).toBeNull();
    expect(getProviderCredential("user-b", "google")?.apiKey).toBe("other-account");
  });
});
