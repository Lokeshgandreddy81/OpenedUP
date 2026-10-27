import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { generateKeyPairSync, sign } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "openedup-project-routes-"));
process.env["CHAT_DB_PATH"] = path.join(testDirectory, "projects.sqlite");
process.env["FIREBASE_PROJECT_ID"] = "openedup-project-routes-test";

const [{ createApp }, { closeChatDatabase }] = await Promise.all([
  import("../../../app.js"),
  import("../../../platform/database/chatDatabase.js"),
]);

const firebaseProjectId = "openedup-project-routes-test";
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
  const header = encodeJson({ alg: "RS256", kid: "project-routes-test-key" });
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

function createProject(id: string, name: string, updatedAt: number) {
  return {
    id,
    name,
    colorTag: "stone" as const,
    createdAt: updatedAt - 100,
    updatedAt,
    sessionCount: 1,
    files: [
      {
        id: `${id}-file`,
        name: "notes.txt",
        size: 5,
        type: "text/plain",
        uploadedAt: updatedAt - 50,
        content: "hello",
      },
    ],
    sessions: [
      {
        id: `${id}-session`,
        projectId: id,
        title: "Test session",
        createdAt: updatedAt - 20,
        updatedAt,
        messages: [
          {
            id: `${id}-message`,
            role: "user" as const,
            content: "Synthetic project test prompt",
            timestamp: new Date(updatedAt).toISOString(),
            attachments: [{ id: `${id}-file`, name: "notes.txt", size: 5, type: "text/plain" }],
          },
        ],
      },
    ],
  };
}

test("authenticated Projects API stores snapshots per owner and preserves project data", async (t) => {
  const app = createApp();
  const server: Server = createServer(app);
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === certificateUrl) {
      return new Response(JSON.stringify({ "project-routes-test-key": certificate }), {
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
  const apiUrl = `http://127.0.0.1:${address.port}/api/projects`;
  const userAHeaders = {
    Authorization: `Bearer ${tokenFor("projects-user-a")}`,
    "Content-Type": "application/json",
  };
  const userBHeaders = { Authorization: `Bearer ${tokenFor("projects-user-b")}` };

  const unauthenticated = await nativeFetch(apiUrl);
  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.headers.get("www-authenticate"), "Bearer");

  const emptyForUserA = await nativeFetch(apiUrl, { headers: userAHeaders });
  assert.equal(emptyForUserA.status, 200);
  assert.deepEqual(await emptyForUserA.json(), { projects: [] });

  const project = createProject("project-a", "  Project Alpha  ", 200);
  const saved = await nativeFetch(apiUrl, {
    method: "PUT",
    headers: userAHeaders,
    body: JSON.stringify({ projects: [project] }),
  });
  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), {
    projects: [{ ...project, name: "Project Alpha" }],
  });

  const isolatedForUserB = await nativeFetch(apiUrl, { headers: userBHeaders });
  assert.equal(isolatedForUserB.status, 200);
  assert.deepEqual(await isolatedForUserB.json(), { projects: [] });

  const reloadedForUserA = await nativeFetch(apiUrl, { headers: userAHeaders });
  assert.equal(reloadedForUserA.status, 200);
  assert.deepEqual(await reloadedForUserA.json(), {
    projects: [{ ...project, name: "Project Alpha" }],
  });
});

test("Projects import is idempotent and replacement validates before changing saved data", async (t) => {
  const app = createApp();
  const server: Server = createServer(app);
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === certificateUrl) {
      return new Response(JSON.stringify({ "project-routes-test-key": certificate }), {
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
  const apiUrl = `http://127.0.0.1:${address.port}/api/projects`;
  const headers = {
    Authorization: `Bearer ${tokenFor("projects-import-user")}`,
    "Content-Type": "application/json",
  };
  const original = createProject("kept-project", "Original", 200);
  const seeded = await nativeFetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ projects: [original] }),
  });
  assert.equal(seeded.status, 200);

  const duplicate = { ...original, name: "Imported overwrite must be ignored", updatedAt: 500 };
  const addition = createProject("new-project", "Imported", 300);
  const imported = await nativeFetch(`${apiUrl}/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({ projects: [duplicate, addition] }),
  });
  assert.equal(imported.status, 200);
  assert.deepEqual(await imported.json(), { imported: 1, skipped: 1 });

  const afterImport = await nativeFetch(apiUrl, { headers });
  assert.deepEqual(await afterImport.json(), {
    projects: [
      { ...addition, name: "Imported" },
      { ...original, name: "Original" },
    ],
  });

  const invalidReplacement = { ...createProject("bad-project", "Bad", 600) };
  invalidReplacement.sessions[0]!.projectId = "another-project";
  const rejected = await nativeFetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ projects: [invalidReplacement] }),
  });
  assert.equal(rejected.status, 400);
  const rejectionBody = (await rejected.json()) as {
    error: string;
    details: Array<{ path: string }>;
  };
  assert.equal(rejectionBody.error, "Validation failed");
  assert.ok(rejectionBody.details.some((detail) => detail.path === "projects.0.sessions"));

  const unchanged = await nativeFetch(apiUrl, { headers });
  assert.deepEqual(await unchanged.json(), {
    projects: [
      { ...addition, name: "Imported" },
      { ...original, name: "Original" },
    ],
  });

  const replaced = createProject("replacement", "Replacement", 700);
  const replacementResponse = await nativeFetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ projects: [replaced] }),
  });
  assert.deepEqual(await replacementResponse.json(), {
    projects: [{ ...replaced, name: "Replacement" }],
  });

  const cleared = await nativeFetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ projects: [] }),
  });
  assert.deepEqual(await cleared.json(), { projects: [] });
});

test("account project snapshots preserve uploaded image context for later sessions", async (t) => {
  const app = createApp();
  const server: Server = createServer(app);
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === certificateUrl) {
      return new Response(JSON.stringify({ "project-routes-test-key": certificate }), {
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
  const apiUrl = `http://127.0.0.1:${address.port}/api/projects`;
  const headers = {
    Authorization: `Bearer ${tokenFor("projects-image-user")}`,
    "Content-Type": "application/json",
  };
  const project = {
    ...createProject("image-project", "Image project", 800),
    files: [
      {
        id: "image-file",
        name: "reference.png",
        size: 68,
        type: "image/png",
        mimeType: "image/png",
        uploadedAt: 750,
        base64Data:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8B/u8AAAAASUVORK5CYII=",
        content: "[Attached image: reference.png]",
      },
    ],
  };

  const saved = await nativeFetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ projects: [project] }),
  });
  assert.equal(saved.status, 200);
  const savedBody = (await saved.json()) as {
    projects: Array<{ files?: Array<Record<string, unknown>> }>;
  };
  assert.equal(savedBody.projects[0]?.files?.[0]?.mimeType, "image/png");
  assert.equal(savedBody.projects[0]?.files?.[0]?.base64Data, project.files[0]?.base64Data);

  const reloaded = await nativeFetch(apiUrl, { headers });
  const reloadedBody = (await reloaded.json()) as {
    projects: Array<{ files?: Array<Record<string, unknown>> }>;
  };
  assert.equal(reloadedBody.projects[0]?.files?.[0]?.mimeType, "image/png");
  assert.equal(reloadedBody.projects[0]?.files?.[0]?.base64Data, project.files[0]?.base64Data);
});
