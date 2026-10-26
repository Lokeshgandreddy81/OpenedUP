import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { generateKeyPairSync, sign } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "openedup-artifact-routes-"));
process.env["CHAT_DB_PATH"] = path.join(testDirectory, "artifacts.sqlite");
process.env["FIREBASE_PROJECT_ID"] = "openedup-artifact-routes-test";

const [{ createApp }, { closeChatDatabase }] = await Promise.all([
  import("../../../app.js"),
  import("../../../platform/database/chatDatabase.js"),
]);

const firebaseProjectId = "openedup-artifact-routes-test";
const certificateUrl =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const certificate = publicKey.export({ type: "spki", format: "pem" }).toString();
const nativeFetch = globalThis.fetch.bind(globalThis);

after(() => {
  closeChatDatabase();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function tokenFor(uid: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "RS256", kid: "artifact-routes-test-key" });
  const payload = encodeJson({
    aud: firebaseProjectId,
    auth_time: now,
    exp: now + 3600,
    iat: now,
    iss: `https://securetoken.google.com/${firebaseProjectId}`,
    sub: uid,
  });
  const signingInput = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

test("Artifacts API enforces ownership and supports versioned, shared, organized persistence", async (t) => {
  const server: Server = createServer(createApp());
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === certificateUrl) {
      return new Response(JSON.stringify({ "artifact-routes-test-key": certificate }), {
        headers: { "Cache-Control": "public, max-age=3600", "Content-Type": "application/json" },
      });
    }
    return nativeFetch(input, init);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const apiUrl = `http://127.0.0.1:${address.port}/api/artifacts`;
  const ownerHeaders = {
    Authorization: `Bearer ${tokenFor("artifact-owner")}`,
    "Content-Type": "application/json",
  };
  const viewerHeaders = {
    Authorization: `Bearer ${tokenFor("artifact-viewer")}`,
    "Content-Type": "application/json",
  };

  const unauthenticated = await nativeFetch(apiUrl);
  assert.equal(unauthenticated.status, 401);
  assert.deepEqual(await (await nativeFetch(apiUrl, { headers: ownerHeaders })).json(), {
    artifacts: [],
  });

  const created = await nativeFetch(apiUrl, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      title: "  API design  ",
      category: "Documents",
      content: "# First version\n\nKeep this exact content.",
      language: "markdown",
      tags: ["  Design ", "design", "API"],
    }),
  });
  assert.equal(created.status, 201);
  const first = (await created.json()) as {
    artifact: { id: string; title: string; content: string; tags: string[]; isShared: boolean };
  };
  assert.equal(first.artifact.title, "API design");
  assert.equal(first.artifact.content, "# First version\n\nKeep this exact content.");
  assert.deepEqual(first.artifact.tags, ["Design", "API"]);
  assert.equal(first.artifact.isShared, false);

  assert.deepEqual(await (await nativeFetch(apiUrl, { headers: viewerHeaders })).json(), {
    artifacts: [],
  });

  const forbiddenUpdate = await nativeFetch(`${apiUrl}/${first.artifact.id}`, {
    method: "PUT",
    headers: viewerHeaders,
    body: JSON.stringify({ title: "Take over", category: "Documents", content: "stolen" }),
  });
  assert.equal(forbiddenUpdate.status, 404);
  const forbiddenHistory = await nativeFetch(`${apiUrl}/${first.artifact.id}/versions`, {
    headers: viewerHeaders,
  });
  assert.equal(forbiddenHistory.status, 404);

  const invalidUpdate = await nativeFetch(`${apiUrl}/${first.artifact.id}`, {
    method: "PUT",
    headers: ownerHeaders,
    body: JSON.stringify({ title: "   ", category: "Documents", content: "invalid" }),
  });
  assert.equal(invalidUpdate.status, 400);

  const updated = await nativeFetch(`${apiUrl}/${first.artifact.id}`, {
    method: "PUT",
    headers: ownerHeaders,
    body: JSON.stringify({
      title: "API design v2",
      category: "Documents",
      content: "# Second version\n\nUpdated content.",
    }),
  });
  assert.equal(updated.status, 200);
  const current = (await updated.json()) as {
    artifact: { title: string; content: string; tags: string[] };
  };
  assert.equal(current.artifact.title, "API design v2");
  assert.equal(current.artifact.content, "# Second version\n\nUpdated content.");
  assert.deepEqual(current.artifact.tags, ["Design", "API"]);

  const versionsResponse = await nativeFetch(`${apiUrl}/${first.artifact.id}/versions`, {
    headers: ownerHeaders,
  });
  assert.equal(versionsResponse.status, 200);
  const versions = (await versionsResponse.json()) as {
    versions: Array<{ title: string; content: string }>;
  };
  assert.equal(versions.versions.length, 1);
  assert.equal(versions.versions[0]?.title, "API design");
  assert.equal(versions.versions[0]?.content, "# First version\n\nKeep this exact content.");

  const organization = await nativeFetch(`${apiUrl}/${first.artifact.id}/organization`, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({
      isFavorite: true,
      collection: "  Research  ",
      tags: [" Notes", "notes", "API"],
    }),
  });
  assert.equal(organization.status, 200);
  const organized = (await organization.json()) as {
    artifact: { isFavorite: boolean; collection: string; tags: string[] };
  };
  assert.equal(organized.artifact.isFavorite, true);
  assert.equal(organized.artifact.collection, "Research");
  assert.deepEqual(organized.artifact.tags, ["Notes", "API"]);

  const imported = await nativeFetch(`${apiUrl}/import`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      artifacts: [
        {
          legacyId: "legacy-one",
          title: "Imported note",
          category: "Documents",
          content: "Original import",
          createdAt: 10,
          updatedAt: 20,
          isShared: true,
        },
      ],
    }),
  });
  assert.equal(imported.status, 200);
  assert.deepEqual(await imported.json(), { imported: 1, skipped: 0 });
  const duplicateImport = await nativeFetch(`${apiUrl}/import`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      artifacts: [
        {
          legacyId: "legacy-one",
          title: "Changed duplicate must not overwrite",
          category: "Documents",
          content: "Different content",
          createdAt: 10,
          updatedAt: 30,
        },
      ],
    }),
  });
  assert.equal(duplicateImport.status, 200);
  assert.deepEqual(await duplicateImport.json(), { imported: 0, skipped: 1 });
  const ownerList = (await (await nativeFetch(apiUrl, { headers: ownerHeaders })).json()) as {
    artifacts: Array<{ legacyId?: string; title: string; content: string }>;
  };
  assert.equal(
    ownerList.artifacts.find((artifact) => artifact.legacyId === "legacy-one")?.content,
    "Original import"
  );

  const share = await nativeFetch(`${apiUrl}/${first.artifact.id}/share`, {
    method: "PUT",
    headers: ownerHeaders,
    body: JSON.stringify({ isShared: true }),
  });
  assert.equal(share.status, 200);
  const viewerList = (await (await nativeFetch(apiUrl, { headers: viewerHeaders })).json()) as {
    artifacts: Array<{ id: string; isOwner: boolean; content: string }>;
  };
  const visibleShared = viewerList.artifacts.find((artifact) => artifact.id === first.artifact.id);
  assert.ok(visibleShared);
  assert.equal(visibleShared.isOwner, false);
  assert.equal(visibleShared.content, "# Second version\n\nUpdated content.");

  const viewerDelete = await nativeFetch(`${apiUrl}/${first.artifact.id}`, {
    method: "DELETE",
    headers: viewerHeaders,
  });
  assert.equal(viewerDelete.status, 204);
  assert.ok(
    (
      (await (await nativeFetch(apiUrl, { headers: ownerHeaders })).json()) as {
        artifacts: Array<{ id: string }>;
      }
    ).artifacts.some((artifact) => artifact.id === first.artifact.id)
  );

  const stopSharing = await nativeFetch(`${apiUrl}/${first.artifact.id}/share`, {
    method: "PUT",
    headers: ownerHeaders,
    body: JSON.stringify({ isShared: false }),
  });
  assert.equal(stopSharing.status, 200);
  const afterStopSharing = (await (
    await nativeFetch(apiUrl, { headers: viewerHeaders })
  ).json()) as {
    artifacts: Array<{ id: string }>;
  };
  assert.equal(
    afterStopSharing.artifacts.some((artifact) => artifact.id === first.artifact.id),
    false
  );

  const deleted = await nativeFetch(`${apiUrl}/${first.artifact.id}`, {
    method: "DELETE",
    headers: ownerHeaders,
  });
  assert.equal(deleted.status, 204);
  const afterDelete = (await (
    await nativeFetch(`${apiUrl}/${first.artifact.id}/versions`, {
      headers: ownerHeaders,
    })
  ).json()) as { error: string };
  assert.equal(afterDelete.error, "Artifact not found.");
});
