import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteArtifactItem,
  getStoredArtifactVersions,
  getStoredArtifacts,
  saveArtifactItem,
} from "./artifactStore";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

test("deleting a local artifact also removes its saved version history", () => {
  const storage = createStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage, dispatchEvent: () => true } as unknown as Window,
  });
  storage.setItem(
    "openedup_artifacts_v1",
    JSON.stringify([
      { id: "artifact-to-delete", title: "Delete me" },
      { id: "keep-artifact", title: "Keep me" },
    ])
  );
  storage.setItem(
    "openedup_artifact_versions_v1",
    JSON.stringify({
      "artifact-to-delete": [{ id: "old-version", content: "old" }],
      "keep-artifact": [{ id: "kept-version", content: "keep" }],
    })
  );

  deleteArtifactItem("artifact-to-delete");

  assert.deepEqual(JSON.parse(storage.getItem("openedup_artifacts_v1") || "[]"), [
    { id: "keep-artifact", title: "Keep me" },
  ]);
  assert.deepEqual(getStoredArtifactVersions("artifact-to-delete"), []);
  assert.deepEqual(getStoredArtifactVersions("keep-artifact"), [
    { id: "kept-version", content: "keep" },
  ]);
  delete (globalThis as { window?: Window }).window;
});

test("reserved legacy artifacts stay hidden from other accounts and anonymous writes", () => {
  const storage = createStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage, dispatchEvent: () => true } as unknown as Window,
  });
  storage.setItem("openedup_artifacts_v1:import-owner", "account-a");
  const legacyArtifact = {
    id: "legacy-private-artifact",
    title: "Private legacy artifact",
    category: "Documents",
    content: "Account A content",
    createdAt: 1,
    updatedAt: 1,
  };
  storage.setItem("openedup_artifacts_v1", JSON.stringify([legacyArtifact]));

  assert.deepEqual(getStoredArtifacts("account-a"), [legacyArtifact]);
  assert.deepEqual(getStoredArtifacts("account-b"), []);
  assert.deepEqual(getStoredArtifacts(null), []);

  const anonymousArtifact = saveArtifactItem({
    title: "Anonymous artifact",
    category: "Documents",
    content: "Anonymous content",
  });

  assert.deepEqual(JSON.parse(storage.getItem("openedup_artifacts_v1") || "[]"), [legacyArtifact]);
  assert.deepEqual(getStoredArtifacts("account-b"), [
    {
      id: anonymousArtifact.id,
      title: anonymousArtifact.title,
      category: anonymousArtifact.category,
      content: anonymousArtifact.content,
      isShared: false,
      isFavorite: false,
      tags: [],
      createdAt: anonymousArtifact.createdAt,
      updatedAt: anonymousArtifact.updatedAt,
    },
  ]);
  assert.deepEqual(getStoredArtifacts(null), getStoredArtifacts("account-b"));
  delete (globalThis as { window?: Window }).window;
});
