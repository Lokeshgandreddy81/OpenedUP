import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { verifyFirebaseIdToken } from "./firebaseAuth.js";

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

test("Firebase verification returns only signed user, organization, and role claims", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const header = encodeJson({ alg: "RS256", kid: "test-key" });
  const payload = encodeJson({
    aud: "test-project",
    auth_time: 900,
    exp: 2_000,
    iat: 900,
    iss: "https://securetoken.google.com/test-project",
    sub: "signed-user",
    orgId: "signed-org",
    role: "admin",
  });
  const signingInput = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKey).toString("base64url");
  const token = `${signingInput}.${signature}`;
  const certificate = publicKey.export({ type: "spki", format: "pem" }).toString();

  const principal = await verifyFirebaseIdToken(token, {
    projectId: "test-project",
    certificates: async () => ({ "test-key": certificate }),
    nowSeconds: 1_000,
  });

  assert.deepEqual(principal, { uid: "signed-user", orgId: "signed-org", role: "admin" });
});
