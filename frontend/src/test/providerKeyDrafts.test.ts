import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  localStorage.clear();
  vi.resetModules();
});

it("removing a provider key also clears its migrated legacy draft", async () => {
  localStorage.setItem(
    "openedup_byok_keys_v1",
    JSON.stringify({ anthropic: "legacy-anthropic-key" })
  );
  vi.resetModules();

  const { getProviderKeyDrafts, removeStoredKey } =
    await import("../features/customize/services/keyStore");

  expect(getProviderKeyDrafts().anthropic).toBe("legacy-anthropic-key");

  removeStoredKey("anthropic");

  expect(getProviderKeyDrafts().anthropic).toBeUndefined();
});
