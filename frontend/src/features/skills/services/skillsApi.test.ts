import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getConversationSkills,
  getSkills,
  setConversationSkills,
  setProjectSkills,
  uploadSkill,
  type SkillItem,
} from "./skillsApi";

test("account-scoped skill reads and mutations bind requests to the captured account", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: RequestInfo | URL; expectedUserId: string | null }> = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({
      url,
      expectedUserId: new Headers(init.headers).get("X-Expected-User-Id"),
    });
    return new Response(JSON.stringify({ skills: [] }), { status: 200 });
  };

  try {
    await getSkills({ scope: "user" }, "account-a");
    await getConversationSkills("persisted-conversation", "account-a");
    await setConversationSkills("persisted-conversation", [], { userId: "account-a" });
    await setProjectSkills("project-a", [], "account-a");

    assert.deepEqual(
      requests.map(({ url, expectedUserId }) => ({ url, expectedUserId })),
      [
        { url: "/api/skills?scope=user", expectedUserId: "account-a" },
        {
          url: "/api/conversations/persisted-conversation/skills",
          expectedUserId: "account-a",
        },
        {
          url: "/api/conversations/persisted-conversation/skills",
          expectedUserId: "account-a",
        },
        { url: "/api/projects/project-a/skills", expectedUserId: "account-a" },
      ]
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("skill package uploads and creation both retain the captured account", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: RequestInfo | URL; expectedUserId: string | null }> = [];
  let uploadedUserId: string | undefined;
  globalThis.fetch = async (url, init = {}) => {
    requests.push({
      url,
      expectedUserId: new Headers(init.headers).get("X-Expected-User-Id"),
    });
    return new Response(
      JSON.stringify({ skill: { id: "new-skill", name: "New skill", scope: "user", version: 1 } }),
      { status: 200 }
    );
  };

  try {
    const file = new File(["skill package"], "skill.zip", { type: "application/zip" });
    const created = await uploadSkill(
      file,
      "user",
      "account-a",
      async (_file, _name, _purpose, userId) => {
        uploadedUserId = userId;
        return "account-a/skill-package/123.zip";
      }
    );

    assert.equal(created.id, "new-skill");
    assert.equal(uploadedUserId, "account-a");
    assert.deepEqual(requests, [{ url: "/api/skills", expectedUserId: "account-a" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local chat skills survive an unsaved conversation and stay scoped to its account", async () => {
  const originalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    },
  });
  globalThis.fetch = async () => new Response("{}", { status: 404 });

  const skill: SkillItem = {
    id: "local-skill",
    name: "Local skill",
    description: "Used in a chat that was not saved to the server.",
    scope: "user",
    version: 1,
  };

  try {
    const saved = await setConversationSkills("chat-123", [skill.id], {
      userId: "account-a",
      localSkills: [skill],
    });
    assert.deepEqual(saved, [skill]);
    assert.equal(entries.get("openedup_skills_account-a_chat-123"), JSON.stringify([skill]));
    assert.deepEqual(await getConversationSkills("chat-123", "account-a"), [skill]);
    assert.deepEqual(await getConversationSkills("chat-123", "account-b"), []);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
  }
});

test("a failed skill update for a server conversation does not overwrite local storage", async () => {
  const originalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  const entries = new Map<string, string>([
    ["openedup_skills_persisted-123", JSON.stringify([{ id: "stale-skill" }])],
  ]);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    },
  });
  globalThis.fetch = async () => new Response("{}", { status: 404 });

  try {
    await assert.rejects(
      setConversationSkills("persisted-123", ["new-skill"], {
        userId: "account-a",
        localSkills: [
          {
            id: "new-skill",
            name: "New skill",
            description: "A real server skill.",
            scope: "user",
            version: 1,
          },
        ],
      }),
      /Failed to save conversation skills \(404\)/
    );
    assert.equal(entries.has("openedup_skills_account-a_persisted-123"), false);
    assert.deepEqual(await getConversationSkills("persisted-123", "account-a"), []);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalStorage,
    });
  }
});
