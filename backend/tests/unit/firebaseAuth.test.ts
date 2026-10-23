import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyFirebaseIdToken } from "../../src/platform/auth/firebaseAuth.js";

const projectId = "chat-auth-test";
const nowSeconds = 1_800_000_000;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const certificate = publicKey.export({ type: "spki", format: "pem" }).toString();

function makeToken(overrides: Record<string, unknown> = {}, kid = "test-key"): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid, typ: "JWT" })).toString(
    "base64url"
  );
  const payload = Buffer.from(
    JSON.stringify({
      aud: projectId,
      iss: `https://securetoken.google.com/${projectId}`,
      sub: "firebase-user-1",
      iat: nowSeconds - 60,
      exp: nowSeconds + 3600,
      auth_time: nowSeconds - 120,
      email: "user@example.com",
      ...overrides,
    })
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

const dependencies = {
  projectId,
  nowSeconds,
  certificates: async () => ({ "test-key": certificate }),
};

describe("verifyFirebaseIdToken", () => {
  it("returns the UID and email only after signature and project claim verification", async () => {
    await expect(verifyFirebaseIdToken(makeToken(), dependencies)).resolves.toEqual({
      uid: "firebase-user-1",
      email: "user@example.com",
    });
  });

  it("rejects a forged signature", async () => {
    const token = makeToken().slice(0, -4) + "abcd";
    await expect(verifyFirebaseIdToken(token, dependencies)).rejects.toThrow();
  });

  it("rejects wrong audience, issuer, expired, future-issued, and missing-subject tokens", async () => {
    for (const claims of [
      { aud: "another-project" },
      { iss: "https://securetoken.google.com/another-project" },
      { exp: nowSeconds - 120 },
      { iat: nowSeconds + 120 },
      { sub: "" },
    ]) {
      await expect(verifyFirebaseIdToken(makeToken(claims), dependencies)).rejects.toThrow();
    }
  });

  it("rejects an unknown signing key", async () => {
    await expect(verifyFirebaseIdToken(makeToken({}, "unknown"), dependencies)).rejects.toThrow();
  });
});
