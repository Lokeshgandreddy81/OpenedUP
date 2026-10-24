import { afterEach, describe, expect, it } from "vitest";
import { PROVIDER_CATALOG, type ProviderId } from "@charan-interiors/contracts";
import {
  getProviderChatRequestConfig,
  getStoredKeys,
  removeStoredKey,
  saveCustomModelId,
  saveCustomModelProvider,
  saveStoredKey,
} from "../features/customize/services/keyStore";

const providers: ProviderId[] = [
  "anthropic",
  "openai",
  "google",
  "deepseek",
  "kimi",
  "qwen",
  "xai",
  "custom",
];

afterEach(() => {
  for (const provider of providers) removeStoredKey(provider);
  localStorage.clear();
});

it("keeps unsigned provider keys in memory while making them available to chat", () => {
  const key = "ephemeral-google-api-key";
  saveStoredKey("google", key);

  expect(getStoredKeys().google).toBe(key);
  expect(localStorage.getItem("openedup_byok_keys_v1")).toBeNull();
  expect(getProviderChatRequestConfig("gemini-3.8-flash").headers["x-provider-key"]).toBe(key);
});

it("does not override an account-saved endpoint with the browser default", () => {
  saveStoredKey("kimi", "session-kimi-api-key");

  const requestConfig = getProviderChatRequestConfig("kimi-k3.1-pro");

  expect(requestConfig.headers["x-provider-base-url"]).toBeUndefined();
});

describe.each(providers)("custom model routing for %s", (provider) => {
  it("uses the selected provider's stored key and endpoint", () => {
    const endpoint = `https://gateway.example/${provider}/v1`;
    const key = `selected-${provider}-api-key`;
    saveStoredKey(provider, key, endpoint);
    saveCustomModelProvider(provider);
    saveCustomModelId("org/model-custom");

    const requestConfig = getProviderChatRequestConfig("custom-model");

    expect(requestConfig.headers).toEqual({
      "Content-Type": "application/json",
      "x-provider-key": key,
      "x-provider-base-url": endpoint,
    });
    expect(requestConfig.providerName).toBe(PROVIDER_CATALOG[provider].name);
    expect(requestConfig.customModelFields).toEqual({
      customModel: "org/model-custom",
      customProvider: provider,
    });
  });
});
