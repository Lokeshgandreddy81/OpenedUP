import assert from "node:assert/strict";
import test from "node:test";
import {
  PROJECTS_COLLECTION_MAX_ITEMS,
  ProjectsCollectionSchema,
} from "@charan-interiors/contracts";
import type { ProjectItem } from "./projectTypes";
import {
  clearSharedLocalProjects,
  getLocalProjects,
  PROJECTS_STORAGE_KEY,
  saveLocalProjects,
  savePendingProjectImport,
} from "./projectStore";

const accountAProject: ProjectItem = {
  id: "account-a-project",
  name: "Account A project",
  colorTag: "stone",
  createdAt: 1,
  updatedAt: 2,
  sessionCount: 0,
};

test("project collection validation allows chunked imports above 100 and enforces the shared cap", () => {
  const projects = Array.from({ length: 101 }, (_, index) => ({
    ...accountAProject,
    id: `project-${index}`,
  }));

  assert.equal(ProjectsCollectionSchema.safeParse({ projects }).success, true);
  assert.equal(PROJECTS_COLLECTION_MAX_ITEMS, 1_000);
  assert.equal(
    ProjectsCollectionSchema.safeParse({
      projects: Array.from({ length: PROJECTS_COLLECTION_MAX_ITEMS + 1 }, (_, index) => ({
        ...accountAProject,
        id: `project-${index}`,
      })),
    }).success,
    false
  );
});

test("sign-out clears browser-wide projects without assigning them to an account", () => {
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

  try {
    const sharedLegacyProject: ProjectItem = {
      ...accountAProject,
      id: "shared-legacy-project",
      name: "Shared legacy project",
    };
    entries.set(PROJECTS_STORAGE_KEY, JSON.stringify([sharedLegacyProject]));
    entries.set("shoebox_user_projects_import_owner", "account-a");
    entries.set(
      `${PROJECTS_STORAGE_KEY}:pending:account-a`,
      JSON.stringify({ projects: [accountAProject] })
    );
    assert.equal(savePendingProjectImport("account-a", [sharedLegacyProject]), true);

    clearSharedLocalProjects("account-a");

    assert.equal(localStorage.getItem(PROJECTS_STORAGE_KEY), null);
    assert.equal(localStorage.getItem("shoebox_user_projects_import_owner"), null);
    assert.deepEqual(
      JSON.parse(localStorage.getItem(`${PROJECTS_STORAGE_KEY}:pending:account-a`) || "null"),
      { projects: [accountAProject] }
    );
    assert.deepEqual(
      JSON.parse(
        localStorage.getItem(`${PROJECTS_STORAGE_KEY}:pending-import:account-a`) || "null"
      ),
      { projects: [sharedLegacyProject] }
    );
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
  }
});

test("failed account-scoped preservation keeps shared projects reserved to their owner", () => {
  const originalStorage = globalThis.localStorage;
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key.includes(":pending-import:")) throw new Error("storage full");
        entries.set(key, value);
      },
      removeItem: (key: string) => entries.delete(key),
    },
  });

  try {
    const sharedProjects = [
      {
        id: "account-a-project",
        name: "Account A project",
        colorTag: "stone",
        createdAt: 1,
        updatedAt: 2,
        sessionCount: 0,
      },
    ];
    entries.set(PROJECTS_STORAGE_KEY, JSON.stringify(sharedProjects));

    assert.equal(clearSharedLocalProjects("account-a", "account-a"), false);
    assert.equal(localStorage.getItem(PROJECTS_STORAGE_KEY), JSON.stringify(sharedProjects));
    assert.equal(localStorage.getItem("shoebox_user_projects_import_owner"), "account-a");
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
  }
});

test("a reserved account snapshot is hidden from anonymous and other accounts", () => {
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

  try {
    entries.set(PROJECTS_STORAGE_KEY, JSON.stringify([accountAProject]));
    entries.set("shoebox_user_projects_import_owner", "account-a");

    assert.deepEqual(getLocalProjects(), []);
    assert.deepEqual(getLocalProjects("account-b"), []);
    assert.deepEqual(getLocalProjects("account-a"), [accountAProject]);

    const anonymousProject: ProjectItem = { ...accountAProject, id: "anonymous-project" };
    saveLocalProjects([anonymousProject]);
    assert.equal(localStorage.getItem(PROJECTS_STORAGE_KEY), JSON.stringify([accountAProject]));
    assert.deepEqual(
      JSON.parse(localStorage.getItem(`${PROJECTS_STORAGE_KEY}:anonymous`) || "null"),
      [anonymousProject]
    );
    assert.deepEqual(getLocalProjects(), [anonymousProject]);

    assert.equal(clearSharedLocalProjects("account-b"), false);
    assert.equal(localStorage.getItem(PROJECTS_STORAGE_KEY), JSON.stringify([accountAProject]));
    assert.equal(localStorage.getItem("shoebox_user_projects_import_owner"), "account-a");
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
  }
});

test("anonymous saves recover from a stale owner marker after the reserved source is gone", () => {
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

  try {
    entries.set("shoebox_user_projects_import_owner", "account-a");
    saveLocalProjects([accountAProject]);

    assert.equal(localStorage.getItem("shoebox_user_projects_import_owner"), null);
    assert.deepEqual(getLocalProjects(), [accountAProject]);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
  }
});
