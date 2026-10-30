import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after, type TestContext } from "node:test";
import { ProjectRepository } from "../repositories/projectRepository.js";

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "openedup-project-routes-"));
process.env["CHAT_DB_PATH"] = path.join(testDirectory, "projects.sqlite");
process.env["SUPABASE_URL"] = "https://openedup-project-routes-test.supabase.co";
process.env["SUPABASE_PUBLISHABLE_KEY"] = "test-supabase-publishable-key";
process.env["SUPABASE_SECRET_KEY"] = "test-supabase-secret-key";

const [{ createApp }, { closeChatDatabase }] = await Promise.all([
  import("../../../app.js"),
  import("../../../platform/database/chatDatabase.js"),
]);

const supabaseUserUrl = `${process.env["SUPABASE_URL"]}/auth/v1/user`;
const nativeFetch = globalThis.fetch.bind(globalThis);

after(() => {
  closeChatDatabase();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

function tokenFor(uid: string): string {
  return `test-access-token:${uid}`;
}

function mockSupabaseUserLookup(
  t: TestContext,
  uploadedSnapshot?: { path: string; bytes: Buffer }
): void {
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === supabaseUserUrl) {
      const authorization = new Headers(init?.headers).get("Authorization") ?? "";
      const uid = authorization.match(/^Bearer test-access-token:(.+)$/)?.[1];
      if (!uid) return new Response(JSON.stringify({ message: "Invalid token" }), { status: 401 });
      return new Response(
        JSON.stringify({
          id: uid,
          email: `${uid}@example.test`,
          email_confirmed_at: "2026-01-01T00:00:00Z",
          app_metadata: {},
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const method = init?.method?.toUpperCase() ?? "GET";
    if (uploadedSnapshot && method === "GET" && url.includes("/storage/v1/object")) {
      return new Response(new Uint8Array(uploadedSnapshot.bytes), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/storage/v1/object") && method === "DELETE") {
      return new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/storage/v1/object/sign/") && method === "POST") {
      const signedURL = url.replace("/storage/v1", "") + "?token=test-signed-token";
      return new Response(JSON.stringify({ signedURL }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/storage/v1/object/") && method === "POST") {
      return new Response(JSON.stringify({ Key: "uploaded-project-snapshot" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return nativeFetch(input, init);
  });
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
  mockSupabaseUserLookup(t);

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

  const wrongExpectedOwner = await nativeFetch(apiUrl, {
    headers: { ...userAHeaders, "X-Expected-User-Id": "projects-user-b" },
  });
  assert.equal(wrongExpectedOwner.status, 409);

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

  const staleAccountSave = await nativeFetch(apiUrl, {
    method: "PUT",
    headers: { ...userAHeaders, "X-Expected-User-Id": "projects-user-b" },
    body: JSON.stringify({ projects: [createProject("wrong-owner", "Must not save", 300)] }),
  });
  assert.equal(staleAccountSave.status, 409);

  const staleAccountUpload = await nativeFetch(apiUrl.replace("/projects", "/uploads/signed"), {
    method: "POST",
    headers: { ...userAHeaders, "X-Expected-User-Id": "projects-user-b" },
    body: JSON.stringify({
      purpose: "project-snapshot",
      fileName: "projects.json",
      contentType: "application/json",
      sizeBytes: 10,
    }),
  });
  assert.equal(staleAccountUpload.status, 409);

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
  mockSupabaseUserLookup(t);

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
  mockSupabaseUserLookup(t);

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

test("oversized project snapshots use storage for upload and download transport", async (t) => {
  const app = createApp();
  const server: Server = createServer(app);
  const userId = "projects-large-user";
  const snapshotPath = `${userId}/project-snapshot/11111111-1111-4111-8111-111111111111.json`;
  const largeProject = {
    ...createProject("large-project", "Large project", 900),
    files: [
      {
        id: "large-image",
        name: "large.png",
        size: 3_300_000,
        type: "image/png",
        mimeType: "image/png",
        uploadedAt: 850,
        base64Data: "A".repeat(4_400_000),
      },
    ],
  };
  const storedSnapshot = Buffer.from(JSON.stringify({ projects: [largeProject] }), "utf8");
  assert.ok(storedSnapshot.byteLength > 4 * 1024 * 1024);
  mockSupabaseUserLookup(t, { path: snapshotPath, bytes: storedSnapshot });

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
    Authorization: `Bearer ${tokenFor(userId)}`,
    "Content-Type": "application/json",
  };
  const saved = await nativeFetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ snapshotPath }),
  });
  assert.equal(saved.status, 200);
  const savedBody = (await saved.json()) as { snapshotUrl?: string; projects?: unknown[] };
  assert.equal(savedBody.projects, undefined);
  assert.match(
    savedBody.snapshotUrl || "",
    /^https:\/\/openedup-project-routes-test\.supabase\.co\//
  );

  const storedProjects = await new ProjectRepository().list(userId);
  assert.equal(storedProjects[0]?.files?.[0]?.base64Data?.length, 4_400_000);

  const listed = await nativeFetch(apiUrl, { headers });
  assert.equal(listed.status, 200);
  const listedBody = (await listed.json()) as { snapshotUrl?: string; projects?: unknown[] };
  assert.equal(listedBody.projects, undefined);
  assert.ok(listedBody.snapshotUrl);
});
