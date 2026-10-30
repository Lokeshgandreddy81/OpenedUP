import assert from "node:assert/strict";
import { test } from "node:test";
import { sendProjectRequest, type ProjectRequestTransport } from "./projectStore";
import type { ProjectItem } from "./projectTypes";

const snapshotPath = "account-a/project-snapshot/123e4567-e89b-12d3-a456-426614174000.json";

function createTransport(uploadPath = snapshotPath) {
  let uploaded:
    | { name: string; purpose: string; expectedUserId: string | undefined; contents: unknown }
    | undefined;
  let request:
    { url: RequestInfo | URL; init: RequestInit; expectedUserId: string | null } | undefined;

  const transport: ProjectRequestTransport = {
    async uploadBlob(file, name, purpose, expectedUserId) {
      uploaded = {
        name,
        purpose,
        expectedUserId,
        contents: JSON.parse(await file.text()),
      };
      return uploadPath;
    },
    async authenticatedFetch(url, init = {}) {
      request = {
        url,
        init,
        expectedUserId: new Headers(init.headers).get("X-Expected-User-Id"),
      };
      return new Response("{}", { status: 200 });
    },
  };

  return {
    transport,
    getUploaded: () => uploaded,
    getRequest: () => request,
  };
}

function createProject(messages: number): ProjectItem[] {
  const projectId = "transport-project";
  return [
    {
      id: projectId,
      name: "Transport project",
      colorTag: "stone",
      createdAt: 1,
      updatedAt: 2,
      sessionCount: 1,
      sessions: [
        {
          id: "transport-session",
          projectId,
          title: "Large project history",
          createdAt: 1,
          updatedAt: 2,
          messages: Array.from({ length: messages }, (_, index) => ({
            id: `message-${index}`,
            role: "user" as const,
            content: "x".repeat(40_000),
            timestamp: "2026-10-30T00:00:00.000Z",
          })),
        },
      ],
    },
  ];
}

test("large project saves upload an account-bound snapshot before sending its reference", async () => {
  const harness = createTransport();
  const response = await sendProjectRequest(
    "/api/projects",
    "PUT",
    createProject(80),
    "account-a",
    harness.transport
  );

  assert.equal(response.status, 200);
  const uploaded = harness.getUploaded();
  assert.ok(uploaded);
  assert.equal(uploaded.name, "projects.json");
  assert.equal(uploaded.purpose, "project-snapshot");
  assert.equal(uploaded.expectedUserId, "account-a");
  assert.equal(
    (uploaded.contents as { projects: Array<{ id: string }> }).projects[0]?.id,
    "transport-project"
  );

  const request = harness.getRequest();
  assert.ok(request);
  assert.equal(request.url, "/api/projects");
  assert.equal(request.expectedUserId, "account-a");
  assert.deepEqual(JSON.parse(String(request.init.body)), { snapshotPath });
});

test("small project saves stay inline and still bind the authenticated account", async () => {
  const harness = createTransport();
  const project = createProject(1);
  const response = await sendProjectRequest(
    "/api/projects",
    "PUT",
    project,
    "account-b",
    harness.transport
  );

  assert.equal(response.status, 200);
  assert.equal(harness.getUploaded(), undefined);
  const request = harness.getRequest();
  assert.ok(request);
  assert.equal(request.expectedUserId, "account-b");
  assert.deepEqual(JSON.parse(String(request.init.body)), { projects: project });
});
