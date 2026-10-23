import { useState, useEffect, useCallback, useRef } from "react";
import { PROVIDER_CATALOG, getModelMeta, type ProviderId } from "@charan-interiors/contracts";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";
import { authenticatedChatFetch } from "../../../app/api/chatApi";

const KEYS_STORAGE_KEY = "openedup_byok_keys_v1";
const URLS_STORAGE_KEY = "openedup_byok_urls_v1";
const CUSTOM_MODEL_STORAGE_KEY = "openedup_byok_custom_model_v1";
const CUSTOM_PROVIDER_STORAGE_KEY = "openedup_byok_custom_provider_v1";
const SYNC_EVENT = "openedup-byok-sync";

export type StoredKeysMap = Partial<Record<ProviderId, string>>;
export type StoredUrlsMap = Partial<Record<ProviderId, string>>;

let memoryKeys: StoredKeysMap = {};
let legacyKeysToImport: StoredKeysMap = {};
if (typeof window !== "undefined") {
  try {
    const legacy = JSON.parse(window.localStorage.getItem(KEYS_STORAGE_KEY) || "{}");
    if (legacy && typeof legacy === "object") legacyKeysToImport = legacy as StoredKeysMap;
  } catch {
    /* malformed legacy key cache */
  }
  window.localStorage.removeItem(KEYS_STORAGE_KEY);
}

export interface ServerProviderInfo {
  provider: ProviderId;
  name: string;
  configuredOnServer: boolean;
  source: "env" | "config" | "none";
  maskedKey?: string;
}

let cachedServerStatus: Partial<Record<ProviderId, ServerProviderInfo>> = {};

export function getStoredKeys(): StoredKeysMap {
  return { ...memoryKeys };
}

function getKeyDrafts(): StoredKeysMap {
  return { ...legacyKeysToImport, ...memoryKeys };
}

export function getStoredBaseUrls(): StoredUrlsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(URLS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getCustomModelId(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CUSTOM_MODEL_STORAGE_KEY)?.trim() || "";
}

export function saveCustomModelId(modelId: string): void {
  if (typeof window === "undefined") return;
  const trimmed = modelId.trim();
  if (trimmed) window.localStorage.setItem(CUSTOM_MODEL_STORAGE_KEY, trimmed);
  else window.localStorage.removeItem(CUSTOM_MODEL_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function getCustomModelProvider(): ProviderId {
  if (typeof window === "undefined") return "custom";
  const stored = window.localStorage.getItem(CUSTOM_PROVIDER_STORAGE_KEY) as ProviderId | null;
  return stored && stored in PROVIDER_CATALOG ? stored : "custom";
}

export function saveCustomModelProvider(provider: ProviderId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_PROVIDER_STORAGE_KEY, provider);
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function saveStoredKey(provider: ProviderId, apiKey: string, baseUrl?: string): void {
  if (typeof window === "undefined") return;
  const trimmedKey = apiKey.trim();
  const currentKeys = { ...getStoredKeys() };

  if (trimmedKey) {
    currentKeys[provider] = trimmedKey;
    delete legacyKeysToImport[provider];
  } else {
    delete currentKeys[provider];
  }
  memoryKeys = currentKeys;

  if (baseUrl !== undefined) {
    const currentUrls = getStoredBaseUrls();
    const trimmedUrl = baseUrl.trim();
    if (trimmedUrl) {
      currentUrls[provider] = trimmedUrl;
    } else {
      delete currentUrls[provider];
    }
    window.localStorage.setItem(URLS_STORAGE_KEY, JSON.stringify(currentUrls));
  }

  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function removeStoredKey(provider: ProviderId): void {
  if (typeof window === "undefined") return;
  const currentKeys = { ...getStoredKeys() };
  delete currentKeys[provider];
  memoryKeys = currentKeys;

  const currentUrls = getStoredBaseUrls();
  delete currentUrls[provider];
  window.localStorage.setItem(URLS_STORAGE_KEY, JSON.stringify(currentUrls));

  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function hasKeyForProvider(provider: ProviderId): boolean {
  const keys = getStoredKeys();
  const val = keys[provider];
  if (val && val.trim().length > 0) return true;
  return Boolean(cachedServerStatus[provider]?.configuredOnServer);
}

export function getKeyForModel(modelId: string): {
  provider: ProviderId;
  apiKey: string;
  baseUrl: string;
  modelName: string;
  providerName: string;
} {
  const provider =
    modelId === "custom-model" ? getCustomModelProvider() : getModelMeta(modelId).provider;
  const keys = getStoredKeys();
  const urls = getStoredBaseUrls();
  const providerMeta = PROVIDER_CATALOG[provider];

  return {
    provider,
    apiKey: keys[provider]?.trim() || "",
    baseUrl: urls[provider]?.trim() || providerMeta.defaultBaseUrl,
    modelName:
      modelId === "custom-model"
        ? getCustomModelId() || providerMeta.name
        : getModelMeta(modelId).name,
    providerName: providerMeta.name,
  };
}

export function getProviderChatRequestConfig(modelId: string): {
  headers: Record<string, string>;
  providerName: string;
  modelName: string;
  customModelFields: { customModel?: string; customProvider?: ProviderId };
} {
  const { apiKey, baseUrl, providerName, modelName } = getKeyForModel(modelId);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-provider-key"] = apiKey;
  if (baseUrl) headers["x-provider-base-url"] = baseUrl;
  if (modelId !== "custom-model")
    return { headers, providerName, modelName, customModelFields: {} };
  return {
    headers,
    providerName,
    modelName,
    customModelFields: {
      customModel: getCustomModelId(),
      customProvider: getCustomModelProvider(),
    },
  };
}

export function maskApiKey(key?: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 6)}••••${trimmed.slice(-4)}`;
}

export async function verifyProviderKeyRequest(params: {
  provider: ProviderId;
  apiKey?: string;
  baseUrl?: string;
}): Promise<{
  valid: boolean;
  provider: ProviderId;
  latencyMs: number;
  message: string;
}> {
  try {
    const res = await fetch("/api/chat/verify-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      return {
        valid: false,
        provider: params.provider,
        latencyMs: 0,
        message: `Verification failed (${res.status})`,
      };
    }
    return await res.json();
  } catch (err) {
    return {
      valid: false,
      provider: params.provider,
      latencyMs: 0,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

export function useProviderKeys() {
  const { user } = useChatAuth();
  const [keys, setKeys] = useState<StoredKeysMap>(() => getKeyDrafts());
  const [baseUrls, setBaseUrls] = useState<StoredUrlsMap>(() => getStoredBaseUrls());
  const [serverProviders, setServerProviders] = useState<
    Partial<Record<ProviderId, ServerProviderInfo>>
  >(() => cachedServerStatus);
  const [customModelId, setCustomModelIdState] = useState(() => getCustomModelId());
  const [customModelProvider, setCustomModelProviderState] = useState(() =>
    getCustomModelProvider()
  );
  const lastUserIdRef = useRef(user?.uid);
  const currentUserId = user?.uid;

  const refresh = useCallback(() => {
    setKeys(getKeyDrafts());
    setBaseUrls(getStoredBaseUrls());
    setServerProviders({ ...cachedServerStatus });
    setCustomModelIdState(getCustomModelId());
    setCustomModelProviderState(getCustomModelProvider());
  }, []);

  useEffect(() => {
    if (lastUserIdRef.current !== currentUserId) {
      if (lastUserIdRef.current) memoryKeys = {};
      cachedServerStatus = {};
      setKeys(getKeyDrafts());
    }
    lastUserIdRef.current = currentUserId;
    let cancelled = false;
    void (async () => {
      try {
        const serverResponse = await fetch("/api/chat/providers");
        const serverData = serverResponse.ok
          ? ((await serverResponse.json()) as { providers?: ServerProviderInfo[] })
          : null;
        const next: Partial<Record<ProviderId, ServerProviderInfo>> = {};
        for (const item of serverData?.providers || []) next[item.provider] = item;
        if (currentUserId) {
          const accountResponse = await authenticatedChatFetch("/api/credentials");
          if (accountResponse.ok) {
            const accountData = (await accountResponse.json()) as { providers: ProviderId[] };
            for (const provider of accountData.providers)
              next[provider] = {
                provider,
                name: PROVIDER_CATALOG[provider].name,
                configuredOnServer: true,
                source: "config",
              };
          }
        }
        if (!cancelled) {
          cachedServerStatus = next;
          setServerProviders(next);
        }
      } catch {
        if (!cancelled) setServerProviders({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    const handleSync = () => refresh();
    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [refresh]);

  const setProviderKey = useCallback(
    async (provider: ProviderId, apiKey: string, baseUrl?: string) => {
      saveStoredKey(provider, apiKey, baseUrl);
      if (user && apiKey.trim()) {
        const response = await authenticatedChatFetch("/api/credentials", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey, baseUrl }),
        });
        if (!response.ok) throw new Error("Could not save provider key to your account.");
        delete memoryKeys[provider];
        const status = {
          provider,
          name: PROVIDER_CATALOG[provider].name,
          configuredOnServer: true,
          source: "config" as const,
        };
        cachedServerStatus[provider] = status;
      }
      if (apiKey.trim()) delete legacyKeysToImport[provider];
      refresh();
    },
    [refresh, user]
  );

  const setProviderEndpoint = useCallback(
    async (provider: ProviderId, baseUrl: string) => {
      if (!user) throw new Error("Sign in before saving a provider endpoint.");
      const response = await authenticatedChatFetch("/api/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, baseUrl }),
      });
      if (!response.ok) throw new Error("Could not save provider endpoint to your account.");
      saveStoredKey(provider, getStoredKeys()[provider] || "", baseUrl);
      refresh();
    },
    [refresh, user]
  );

  const deleteProviderKey = useCallback(
    async (provider: ProviderId) => {
      if (user) {
        const response = await authenticatedChatFetch(
          `/api/credentials/${encodeURIComponent(provider)}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) throw new Error("Could not remove provider key from your account.");
        const serverResponse = await fetch("/api/chat/providers");
        const data = serverResponse.ok
          ? ((await serverResponse.json()) as { providers?: ServerProviderInfo[] })
          : null;
        const serverProvider = data?.providers?.find((item) => item.provider === provider);
        if (serverProvider) cachedServerStatus[provider] = serverProvider;
      }
      removeStoredKey(provider);
      refresh();
    },
    [refresh, user]
  );

  const setCustomModel = useCallback(
    (modelId: string) => {
      saveCustomModelId(modelId);
      refresh();
    },
    [refresh]
  );

  const setCustomProvider = useCallback((provider: ProviderId) => {
    saveCustomModelProvider(provider);
    setCustomModelProviderState(provider);
  }, []);

  const hasKey = useCallback(
    (provider: ProviderId) => {
      if (memoryKeys[provider]?.trim()) return true;
      return Boolean(serverProviders[provider]?.configuredOnServer);
    },
    [serverProviders]
  );

  const allProviderIds = Object.keys(PROVIDER_CATALOG) as ProviderId[];
  const connectedCount = allProviderIds.filter((id) => hasKey(id)).length;

  return {
    keys,
    baseUrls,
    serverProviders,
    customModelId,
    customModelProvider,
    setCustomModel,
    setCustomProvider,
    connectedCount,
    setProviderKey,
    setProviderEndpoint,
    deleteProviderKey,
    hasKey,
  };
}
