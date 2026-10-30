import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadAccountProjects,
  PROJECTS_STORAGE_KEY,
  type ProjectAccountTransport,
} from "./projectStore";
import type { ProjectItem } from "./projectTypes";

const ownerKey = "shoebox_user_projects_import_owner";

const project: ProjectItem = {
  id: "account-project",
  name: "Account project",
  colorTag: "stone",
  createdAt: 1,
  updatedAt: 2,
  sessionCount: 0,
};

function useLocalStorage<T>(run: (entries: Map<string, string>) => Promise<T>): Promise<T> {
  const originalStorage = globalThis.localStorage;
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    },
  });
  return run(entries).finally(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
  });
}

function makeTransport(
  options: {
    projects?: ProjectItem[];
    snapshotUrl?: string;
    downloadBody?: unknown;
    importStatus?: number;
  } = {}
) {
  const calls: Array<{
    url: RequestInfo | URL;
    method: string;
    expectedUserId?: string;
    body?: unknown;
  }> = [];
  const transport: ProjectAccountTransport = {
    async authenticatedFetch(url, init = {}, expectedUserId) {
      calls.push({
        url,
        method: init.method ?? "GET",
        expectedUserId:
          expectedUserId ?? new Headers(init.headers).get("X-Expected-User-Id") ?? undefined,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      });
      if (String(url) === "/api/projects/import") {
        return new Response("{}", { status: options.importStatus ?? 200 });
      }
      return new Response(
        JSON.stringify(
          options.snapshotUrl
            ? { snapshotUrl: options.snapshotUrl }
            : { projects: options.projects ?? [] }
        ),
        { status: 200 }
      );
    },
    async uploadBlob() {
      throw new Error("This fixture does not upload snapshots.");
    },
    async download() {
      return new Response(JSON.stringify(options.downloadBody), { status: 200 });
    },
    storageBaseUrl: "https://storage.example",
  };
  return { transport, calls };
}

test("successful legacy import clears its reservation and scopes both requests to the account", async () => {
  await useLocalStorage(async (entries) => {
    entries.set(PROJECTS_STORAGE_KEY, JSON.stringify([project]));
    const { transport, calls } = makeTransport({ projects: [project] });

    const loaded = await loadAccountProjects("account-a", transport);

    assert.deepEqual(loaded.projects, [project]);
    assert.equal(entries.has(PROJECTS_STORAGE_KEY), false);
    assert.equal(entries.has(ownerKey), false);
    assert.deepEqual(
      calls.map(({ url, method, expectedUserId }) => ({ url, method, expectedUserId })),
      [
        { url: "/api/projects/import", method: "POST", expectedUserId: "account-a" },
        { url: "/api/projects", method: "GET", expectedUserId: "account-a" },
      ]
    );
    assert.deepEqual(calls[0]?.body, { projects: [project] });
  });
});

test("another account loads only its own projects while a legacy snapshot remains reserved", async () => {
  await useLocalStorage(async (entries) => {
    entries.set(PROJECTS_STORAGE_KEY, JSON.stringify([project]));
    entries.set(ownerKey, "account-a");
    const accountBProject = { ...project, id: "account-b-project" };
    const { transport, calls } = makeTransport({ projects: [accountBProject] });

    const loaded = await loadAccountProjects("account-b", transport);

    assert.deepEqual(loaded.projects, [accountBProject]);
    assert.deepEqual(
      calls.map(({ url }) => url),
      ["/api/projects"]
    );
    assert.equal(entries.get(PROJECTS_STORAGE_KEY), JSON.stringify([project]));
    assert.equal(entries.get(ownerKey), "account-a");
  });
});

test("a cross-tab owner cookie keeps a full-storage legacy snapshot reserved", async () => {
  const originalStorage = globalThis.localStorage;
  const originalDocument = globalThis.document;
  const entries = new Map<string, string>();
  let cookie = "";
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key === ownerKey || key.includes(":pending-import:")) {
          throw new Error("localStorage is full");
        }
        entries.set(key, value);
      },
      removeItem: (key: string) => entries.delete(key),
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get cookie() {
        return cookie;
      },
      set cookie(value: string) {
        const [pair, ...attributes] = value.split(";");
        const [name, content] = pair!.trim().split("=", 2);
        if (attributes.some((attribute) => attribute.trim() === "Max-Age=0")) cookie = "";
        else cookie = `${name}=${content}`;
      },
    },
  });

  try {
    entries.set(PROJECTS_STORAGE_KEY, JSON.stringify([project]));
    const firstAccount = makeTransport({ importStatus: 503 });
    const loadedA = await loadAccountProjects("account-a", firstAccount.transport);
    assert.match(loadedA.importWarning, /remain in this browser/);
    assert.equal(entries.get(PROJECTS_STORAGE_KEY), JSON.stringify([project]));
    assert.equal(cookie, "shoebox_project_import_owner=account-a");

    const accountBProject = { ...project, id: "account-b-project" };
    const secondAccount = makeTransport({ projects: [accountBProject] });
    const loadedB = await loadAccountProjects("account-b", secondAccount.transport);
    assert.deepEqual(loadedB.projects, [accountBProject]);
    assert.deepEqual(
      secondAccount.calls.map(({ url }) => url),
      ["/api/projects"]
    );
    assert.equal(entries.get(PROJECTS_STORAGE_KEY), JSON.stringify([project]));
    assert.equal(cookie, "shoebox_project_import_owner=account-a");
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  }
});

test("account snapshots with more than 100 projects download and validate consistently", async () => {
  const projects = Array.from({ length: 101 }, (_, index) => ({
    ...project,
    id: `project-${index}`,
  }));
  const { transport } = makeTransport({
    snapshotUrl: "https://storage.example/signed/snapshot",
    downloadBody: { projects },
  });

  const loaded = await useLocalStorage(async () => loadAccountProjects("account-a", transport));

  assert.equal(loaded.projects.length, 101);
  assert.deepEqual(loaded.projects, projects);
});

test("account snapshot downloads reject URLs outside the configured storage origin", async () => {
  const { transport } = makeTransport({
    snapshotUrl: "https://untrusted.example/snapshot",
    downloadBody: { projects: [project] },
  });

  await useLocalStorage(async () => {
    await assert.rejects(loadAccountProjects("account-a", transport), /download URL is invalid/);
  });
});
