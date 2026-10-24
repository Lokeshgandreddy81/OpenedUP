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

let cachedAccountProviders: ProviderId[] = [];

export function getStoredKeys(): StoredKeysMap {
  return { ...memoryKeys };
}

export function getProviderKeyDrafts(): StoredKeysMap {
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
  delete legacyKeysToImport[provider];
  const currentKeys = { ...getStoredKeys() };
  delete currentKeys[provider];
  memoryKeys = currentKeys;

  const currentUrls = getStoredBaseUrls();
  delete currentUrls[provider];
  window.localStorage.setItem(URLS_STORAGE_KEY, JSON.stringify(currentUrls));

  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function hasKeyForProvider(provider: ProviderId): boolean {
  return Boolean(getStoredKeys()[provider]?.trim()) || cachedAccountProviders.includes(provider);
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
  const { apiKey, baseUrl, provider, providerName, modelName } = getKeyForModel(modelId);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-provider-key"] = apiKey;
  // Let the backend apply an account's saved endpoint when no browser override exists.
  if (getStoredBaseUrls()[provider]?.trim()) headers["x-provider-base-url"] = baseUrl;
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

export function useProviderKeys() {
  const { user } = useChatAuth();
  const [keys, setKeys] = useState<StoredKeysMap>(() => getProviderKeyDrafts());
  const [baseUrls, setBaseUrls] = useState<StoredUrlsMap>(() => getStoredBaseUrls());
  const [accountProviders, setAccountProviders] = useState<ProviderId[]>(
    () => cachedAccountProviders
  );
  const [customModelId, setCustomModelIdState] = useState(() => getCustomModelId());
  const [customModelProvider, setCustomModelProviderState] = useState(() =>
    getCustomModelProvider()
  );
  const lastUserIdRef = useRef(user?.uid);
  const currentUserId = user?.uid;

  const refresh = useCallback(() => {
    setKeys(getProviderKeyDrafts());
    setBaseUrls(getStoredBaseUrls());
    setAccountProviders([...cachedAccountProviders]);
    setCustomModelIdState(getCustomModelId());
    setCustomModelProviderState(getCustomModelProvider());
  }, []);

  useEffect(() => {
    if (lastUserIdRef.current !== currentUserId) {
      if (lastUserIdRef.current) memoryKeys = {};
      cachedAccountProviders = [];
      setKeys(getProviderKeyDrafts());
      setAccountProviders([]);
    }
    lastUserIdRef.current = currentUserId;
    let cancelled = false;
    void (async () => {
      try {
        let nextAccountProviders: ProviderId[] = [];
        if (currentUserId) {
          const accountResponse = await authenticatedChatFetch("/api/credentials");
          if (accountResponse.ok) {
            const accountData = (await accountResponse.json()) as { providers: ProviderId[] };
            nextAccountProviders = accountData.providers;
          }
        }
        if (!cancelled) {
          cachedAccountProviders = nextAccountProviders;
          setAccountProviders(nextAccountProviders);
        }
      } catch {
        if (!cancelled) {
          cachedAccountProviders = [];
          setAccountProviders([]);
        }
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
        if (!cachedAccountProviders.includes(provider))
          cachedAccountProviders = [...cachedAccountProviders, provider];
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
        cachedAccountProviders = cachedAccountProviders.filter((item) => item !== provider);
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
      return accountProviders.includes(provider);
    },
    [accountProviders]
  );

  const allProviderIds = Object.keys(PROVIDER_CATALOG) as ProviderId[];
  const connectedCount = allProviderIds.filter((id) => hasKey(id)).length;

  return {
    keys,
    baseUrls,
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
