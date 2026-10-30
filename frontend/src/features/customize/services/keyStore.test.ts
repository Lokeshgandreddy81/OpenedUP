import assert from "node:assert/strict";
import { test } from "node:test";
import type { ProviderId } from "@charan-interiors/contracts";
import {
  fetchAccountCredentialRequest,
  fetchAccountProviders,
  getProviderChatRequestConfig,
  getUrlsForUser,
  migrateStoredUrlGroups,
} from "./keyStore";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("provider status requests stay isolated when the signed-in account changes", async () => {
  const accountA = deferred<Response>();
  const accountB = deferred<Response>();
  const requestedUserIds: Array<string | undefined> = [];
  const fetchFor =
    (response: Promise<Response>) =>
    async (_input: RequestInfo | URL, _init?: RequestInit, expectedUserId?: string) => {
      requestedUserIds.push(expectedUserId);
      return response;
    };

  const requestA = fetchAccountProviders("customize-account-a", fetchFor(accountA.promise));
  const requestB = fetchAccountProviders("customize-account-b", fetchFor(accountB.promise));

  accountA.resolve(new Response(JSON.stringify({ providers: ["openai"] }), { status: 200 }));
  assert.deepEqual(await requestA, ["openai"] satisfies ProviderId[]);

  accountB.resolve(new Response(JSON.stringify({ providers: ["google"] }), { status: 200 }));
  assert.deepEqual(await requestB, ["google"] satisfies ProviderId[]);
  assert.deepEqual(requestedUserIds, ["customize-account-a", "customize-account-b"]);
});

test("credential reads and mutations carry the identity captured by the caller", async () => {
  const calls: Array<{ url: RequestInfo | URL; method: string; expectedUserId?: string }> = [];
  const fetchForUser = async (
    url: RequestInfo | URL,
    init: RequestInit = {},
    expectedUserId?: string
  ) => {
    calls.push({ url, method: init.method ?? "GET", expectedUserId });
    return new Response(null, { status: 204 });
  };

  await fetchAccountCredentialRequest("account-a", "/api/credentials", {}, fetchForUser);
  await fetchAccountCredentialRequest(
    "account-a",
    "/api/credentials",
    { method: "PUT" },
    fetchForUser
  );
  await fetchAccountCredentialRequest(
    "account-a",
    "/api/credentials",
    { method: "PATCH" },
    fetchForUser
  );
  await fetchAccountCredentialRequest(
    "account-a",
    "/api/credentials/openai",
    { method: "DELETE" },
    fetchForUser
  );

  assert.deepEqual(calls, [
    { url: "/api/credentials", method: "GET", expectedUserId: "account-a" },
    { url: "/api/credentials", method: "PUT", expectedUserId: "account-a" },
    { url: "/api/credentials", method: "PATCH", expectedUserId: "account-a" },
    { url: "/api/credentials/openai", method: "DELETE", expectedUserId: "account-a" },
  ]);
});

test("saved provider endpoints stay scoped to the account that configured them", () => {
  const groups = migrateStoredUrlGroups(
    {
      "customize-account-a": { openai: "https://account-a.example/v1/" },
      "customize-account-b": { openai: "https://account-b.example/v1" },
    },
    { openai: "https://legacy.example/v1" }
  );

  assert.deepEqual(getUrlsForUser(groups, "customize-account-a"), {
    openai: "https://account-a.example/v1/",
  });
  assert.deepEqual(getUrlsForUser(groups, "customize-account-b"), {
    openai: "https://account-b.example/v1",
  });
  assert.deepEqual(getUrlsForUser(groups), {});
});

test("legacy provider endpoints migrate to anonymous scope and never to a signed-in account", () => {
  const groups = migrateStoredUrlGroups(undefined, {
    openai: " https://legacy.example/v1/ ",
    invalid: "https://ignored.example/v1",
  });

  assert.deepEqual(getUrlsForUser(groups), { openai: "https://legacy.example/v1/" });
  assert.deepEqual(getUrlsForUser(groups, "new-account"), {});
});

test("chat provider config selects endpoint by the request's current account", () => {
  const originalWindow = globalThis.window;
  const entries = new Map<string, string>([
    [
      "openedup_byok_urls_v2",
      JSON.stringify({
        "account-a": { openai: "https://account-a.example/v1" },
        "account-b": { openai: "https://account-b.example/v1" },
        __anonymous__: { openai: "https://anonymous.example/v1" },
      }),
    ],
  ]);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => entries.set(key, value),
        removeItem: (key: string) => entries.delete(key),
      },
    } as unknown as Window & typeof globalThis,
  });

  try {
    assert.equal(
      getProviderChatRequestConfig("gpt-6-astra", "account-b").headers["x-provider-base-url"],
      "https://account-b.example/v1"
    );
    assert.equal(
      getProviderChatRequestConfig("gpt-6-astra", "account-b").headers["X-Expected-User-Id"],
      "account-b"
    );
    assert.equal(
      getProviderChatRequestConfig("gpt-6-astra", null).headers["x-provider-base-url"],
      "https://anonymous.example/v1"
    );
    assert.equal(
      getProviderChatRequestConfig("gpt-6-astra", null).headers["X-Expected-User-Id"],
      undefined
    );
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});
