import { useState, useEffect, useCallback, useRef } from "react";
import { PROVIDER_CATALOG, getModelMeta, type ProviderId } from "@charan-interiors/contracts";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";
import { authenticatedChatFetch } from "../../../app/api/chatApi";

const KEYS_STORAGE_KEY = "openedup_byok_keys_v1";
const URLS_STORAGE_KEY = "openedup_byok_urls_v1";
const CUSTOM_MODEL_STORAGE_KEY = "openedup_byok_custom_model_v1";
const CUSTOM_PROVIDER_STORAGE_KEY = "openedup_byok_custom_provider_v1";
const SYNC_BEACON_KEY = "openedup_byok_sync_beacon_v1";
const SYNC_EVENT = "openedup-byok-sync";

export type StoredKeysMap = Partial<Record<ProviderId, string>>;
export type StoredUrlsMap = Partial<Record<ProviderId, string>>;

let memoryKeys: StoredKeysMap = {};
const legacyKeysToImport: StoredKeysMap = {};

export function purgeSensitiveKeysFromPersistentStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEYS_STORAGE_KEY);
  } catch {
    /* ignore restricted storage environments */
  }
  try {
    window.sessionStorage?.removeItem?.(KEYS_STORAGE_KEY);
  } catch {
    /* ignore restricted storage environments */
  }
}

if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(KEYS_STORAGE_KEY);
    if (raw) {
      const legacy = JSON.parse(raw);
      if (legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
        for (const [k, v] of Object.entries(legacy)) {
          if (k in PROVIDER_CATALOG && typeof v === "string" && v.trim().length > 0) {
            const trimmed = v.trim();
            legacyKeysToImport[k as ProviderId] = trimmed;
            memoryKeys[k as ProviderId] = trimmed;
          }
        }
      }
    }
  } catch {
    /* malformed legacy key cache */
  }
  // Ensure sensitive API keys are immediately purged from persistent browser storage
  purgeSensitiveKeysFromPersistentStorage();
}

let cachedAccountProviders: ProviderId[] = [];
let pendingCredentialsFetch: Promise<ProviderId[]> | null = null;

function notifySync(includeCrossTab = true): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  if (includeCrossTab) {
    try {
      window.localStorage.setItem(SYNC_BEACON_KEY, String(Date.now()));
    } catch {
      /* ignore storage quota or private browsing errors */
    }
  }
}

async function fetchAccountProviders(userId?: string): Promise<ProviderId[]> {
  if (!userId) {
    cachedAccountProviders = [];
    return [];
  }
  if (pendingCredentialsFetch) return pendingCredentialsFetch;

  pendingCredentialsFetch = (async () => {
    try {
      const accountResponse = await authenticatedChatFetch("/api/credentials");
      if (accountResponse.ok) {
        const accountData = (await accountResponse.json()) as { providers: ProviderId[] };
        const valid = (Array.isArray(accountData.providers) ? accountData.providers : []).filter(
          (p) => p in PROVIDER_CATALOG
        );
        cachedAccountProviders = valid;
        window.dispatchEvent(new CustomEvent(SYNC_EVENT));
        return valid;
      }
      return cachedAccountProviders;
    } catch {
      return cachedAccountProviders;
    } finally {
      pendingCredentialsFetch = null;
    }
  })();

  return pendingCredentialsFetch;
}

export function clearMemoryKeys(): void {
  memoryKeys = {};
  for (const k of Object.keys(legacyKeysToImport)) {
    delete legacyKeysToImport[k as ProviderId];
  }
  notifySync(true);
}

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
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const sanitized: StoredUrlsMap = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k in PROVIDER_CATALOG && typeof v === "string" && v.trim().length > 0) {
          sanitized[k as ProviderId] = v.trim();
        }
      }
      return sanitized;
    }
    return {};
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
  notifySync(true);
}

export function getCustomModelProvider(): ProviderId {
  if (typeof window === "undefined") return "custom";
  const stored = window.localStorage.getItem(CUSTOM_PROVIDER_STORAGE_KEY) as ProviderId | null;
  return stored && stored in PROVIDER_CATALOG ? stored : "custom";
}

export function saveCustomModelProvider(provider: ProviderId): void {
  if (typeof window === "undefined" || !(provider in PROVIDER_CATALOG)) return;
  window.localStorage.setItem(CUSTOM_PROVIDER_STORAGE_KEY, provider);
  notifySync(true);
}

export function saveStoredKey(provider: ProviderId, apiKey: string, baseUrl?: string): void {
  if (typeof window === "undefined" || !(provider in PROVIDER_CATALOG)) return;
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

  notifySync(true);
}

export function removeStoredKey(provider: ProviderId): void {
  if (typeof window === "undefined" || !(provider in PROVIDER_CATALOG)) return;
  delete legacyKeysToImport[provider];
  const currentKeys = { ...getStoredKeys() };
  delete currentKeys[provider];
  memoryKeys = currentKeys;

  const currentUrls = getStoredBaseUrls();
  delete currentUrls[provider];
  window.localStorage.setItem(URLS_STORAGE_KEY, JSON.stringify(currentUrls));

  notifySync(true);
}

export function hasKeyForProvider(providerOrModel: ProviderId | string): boolean {
  const provider =
    providerOrModel === "custom-model"
      ? getCustomModelProvider()
      : (providerOrModel as ProviderId);
  return Boolean(getStoredKeys()[provider]?.trim()) || cachedAccountProviders.includes(provider);
}

export function hasAccountKeyForProvider(provider: ProviderId): boolean {
  return cachedAccountProviders.includes(provider);
}

export function hasKeyForModel(modelId: string): boolean {
  const { provider } = getKeyForModel(modelId);
  return hasKeyForProvider(provider);
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
  const providerMeta = PROVIDER_CATALOG[provider] ?? PROVIDER_CATALOG.custom;

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
      ...(getCustomModelId() ? { customModel: getCustomModelId() } : {}),
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
      if (lastUserIdRef.current) {
        memoryKeys = {};
        for (const k of Object.keys(legacyKeysToImport)) {
          delete legacyKeysToImport[k as ProviderId];
        }
      }
      cachedAccountProviders = [];
      setKeys(getProviderKeyDrafts());
      setAccountProviders([]);
      notifySync(false);
    }
    lastUserIdRef.current = currentUserId;

    if (currentUserId) {
      void fetchAccountProviders(currentUserId).then((providers) => {
        setAccountProviders(providers);
      });
    }
  }, [currentUserId]);

  useEffect(() => {
    const handleSync = () => refresh();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === KEYS_STORAGE_KEY) {
        purgeSensitiveKeysFromPersistentStorage();
        return;
      }

      if (
        event.key === null ||
        event.key === SYNC_BEACON_KEY ||
        event.key === URLS_STORAGE_KEY ||
        event.key === CUSTOM_MODEL_STORAGE_KEY ||
        event.key === CUSTOM_PROVIDER_STORAGE_KEY
      ) {
        refresh();
        if (currentUserId) {
          void fetchAccountProviders(currentUserId).then((providers) => {
            setAccountProviders(providers);
          });
        }
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [currentUserId, refresh]);

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
        // Other mounted views and other browser tabs need the updated account-backed status
        notifySync(true);
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
    (providerOrModel: ProviderId | string) => {
      const provider =
        providerOrModel === "custom-model"
          ? customModelProvider
          : (providerOrModel as ProviderId);
      if (memoryKeys[provider]?.trim()) return true;
      return accountProviders.includes(provider);
    },
    [accountProviders, customModelProvider]
  );

  const hasKeyForModelHook = useCallback(
    (modelId: string) => {
      const { provider } = getKeyForModel(modelId);
      return hasKey(provider);
    },
    [hasKey]
  );

  const hasAccountKey = useCallback(
    (provider: ProviderId) => accountProviders.includes(provider),
    [accountProviders]
  );

  const refreshAccountProviders = useCallback(async (): Promise<ProviderId[]> => {
    if (!currentUserId) return [];
    const providers = await fetchAccountProviders(currentUserId);
    setAccountProviders(providers);
    notifySync(true);
    return providers;
  }, [currentUserId]);

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
    hasKeyForModel: hasKeyForModelHook,
    hasAccountKey,
    refreshAccountProviders,
  };
}
