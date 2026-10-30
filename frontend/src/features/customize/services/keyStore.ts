import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { PROVIDER_CATALOG, getModelMeta, type ProviderId } from "@charan-interiors/contracts";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { authenticatedChatFetch } from "../../../app/api/chatApi";

const KEYS_STORAGE_KEY = "openedup_byok_keys_v1";
const URLS_STORAGE_KEY = "openedup_byok_urls_v2";
const LEGACY_URLS_STORAGE_KEY = "openedup_byok_urls_v1";
const CUSTOM_MODEL_STORAGE_KEY = "openedup_byok_custom_model_v1";
const CUSTOM_PROVIDER_STORAGE_KEY = "openedup_byok_custom_provider_v1";
const SYNC_BEACON_KEY = "openedup_byok_sync_beacon_v1";
const SYNC_EVENT = "openedup-byok-sync";

export type StoredKeysMap = Partial<Record<ProviderId, string>>;
export type StoredUrlsMap = Partial<Record<ProviderId, string>>;
type StoredUrlGroups = Record<string, StoredUrlsMap>;

async function getCredentialError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return new Error(payload.error);
    }
  } catch {
    // Keep the stable fallback for non-JSON or empty responses.
  }
  return new Error(fallback);
}

const ANONYMOUS_URL_SCOPE = "__anonymous__";

function getUrlScope(userId?: string | null): string {
  return userId || ANONYMOUS_URL_SCOPE;
}

/**
 * Legacy endpoint settings were browser-wide. Keep those settings in the anonymous
 * scope during migration so one signed-in account cannot inherit another account's
 * endpoint override.
 */
export function migrateStoredUrlGroups(
  currentValue: unknown,
  legacyValue: unknown
): StoredUrlGroups {
  const groups: StoredUrlGroups = {};
  if (currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)) {
    for (const [scope, value] of Object.entries(currentValue)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const urls: StoredUrlsMap = {};
      for (const [provider, endpoint] of Object.entries(value)) {
        if (provider in PROVIDER_CATALOG && typeof endpoint === "string" && endpoint.trim()) {
          urls[provider as ProviderId] = endpoint.trim();
        }
      }
      groups[scope] = urls;
    }
  }

  if (
    Object.keys(groups).length === 0 &&
    legacyValue &&
    typeof legacyValue === "object" &&
    !Array.isArray(legacyValue)
  ) {
    const anonymousUrls: StoredUrlsMap = {};
    for (const [provider, endpoint] of Object.entries(legacyValue)) {
      if (provider in PROVIDER_CATALOG && typeof endpoint === "string" && endpoint.trim()) {
        anonymousUrls[provider as ProviderId] = endpoint.trim();
      }
    }
    if (Object.keys(anonymousUrls).length > 0) groups[ANONYMOUS_URL_SCOPE] = anonymousUrls;
  }

  return groups;
}

export function getUrlsForUser(groups: StoredUrlGroups, userId?: string | null): StoredUrlsMap {
  return { ...(groups[getUrlScope(userId)] ?? {}) };
}

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

let activeAccountUserId: string | undefined;
const cachedAccountProvidersByUser = new Map<string, ProviderId[]>();
const pendingCredentialsFetches = new Map<string, Promise<ProviderId[]>>();

export function fetchAccountCredentialRequest(
  userId: string,
  input: RequestInfo | URL,
  init: RequestInit = {},
  fetchCredentials: typeof authenticatedChatFetch = authenticatedChatFetch
): Promise<Response> {
  return fetchCredentials(input, init, userId);
}

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

export async function fetchAccountProviders(
  userId?: string,
  fetchCredentials: typeof authenticatedChatFetch = authenticatedChatFetch
): Promise<ProviderId[]> {
  if (!userId) return [];
  const cached = cachedAccountProvidersByUser.get(userId) ?? [];
  const pending = pendingCredentialsFetches.get(userId);
  if (pending) return pending;

  const request = (async () => {
    try {
      const accountResponse = await fetchAccountCredentialRequest(
        userId,
        "/api/credentials",
        {},
        fetchCredentials
      );
      if (accountResponse.ok) {
        const accountData = (await accountResponse.json()) as { providers: ProviderId[] };
        const valid = (Array.isArray(accountData.providers) ? accountData.providers : []).filter(
          (p) => p in PROVIDER_CATALOG
        );
        cachedAccountProvidersByUser.set(userId, valid);
        if (activeAccountUserId === userId && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(SYNC_EVENT));
        }
        return valid;
      }
      return cached;
    } catch {
      return cached;
    } finally {
      pendingCredentialsFetches.delete(userId);
    }
  })();

  pendingCredentialsFetches.set(userId, request);
  return request;
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

function readStoredUrlGroups(): StoredUrlGroups {
  if (typeof window === "undefined") return {};
  try {
    const currentRaw = window.localStorage.getItem(URLS_STORAGE_KEY);
    const legacyRaw = window.localStorage.getItem(LEGACY_URLS_STORAGE_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : undefined;
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : undefined;
    return migrateStoredUrlGroups(current, legacy);
  } catch {
    return {};
  }
}

function writeStoredUrlGroups(groups: StoredUrlGroups): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(URLS_STORAGE_KEY, JSON.stringify(groups));
  window.localStorage.removeItem(LEGACY_URLS_STORAGE_KEY);
}

export function getStoredBaseUrls(
  userId: string | null | undefined = activeAccountUserId
): StoredUrlsMap {
  return getUrlsForUser(readStoredUrlGroups(), userId);
}

function saveStoredBaseUrls(
  urls: StoredUrlsMap,
  userId: string | null | undefined = activeAccountUserId
): void {
  const groups = readStoredUrlGroups();
  const scope = getUrlScope(userId);
  if (Object.keys(urls).length === 0) delete groups[scope];
  else groups[scope] = urls;
  writeStoredUrlGroups(groups);
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

export function saveStoredKey(
  provider: ProviderId,
  apiKey: string,
  baseUrl?: string,
  userId: string | null | undefined = activeAccountUserId
): void {
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
    const currentUrls = getStoredBaseUrls(userId);
    const trimmedUrl = baseUrl.trim();
    if (trimmedUrl) {
      currentUrls[provider] = trimmedUrl;
    } else {
      delete currentUrls[provider];
    }
    saveStoredBaseUrls(currentUrls, userId);
  }

  notifySync(true);
}

export function removeStoredKey(
  provider: ProviderId,
  userId: string | null | undefined = activeAccountUserId
): void {
  if (typeof window === "undefined" || !(provider in PROVIDER_CATALOG)) return;
  delete legacyKeysToImport[provider];
  const currentKeys = { ...getStoredKeys() };
  delete currentKeys[provider];
  memoryKeys = currentKeys;

  const currentUrls = getStoredBaseUrls(userId);
  delete currentUrls[provider];
  saveStoredBaseUrls(currentUrls, userId);

  notifySync(true);
}

export function hasKeyForProvider(
  providerOrModel: ProviderId | string,
  userId: string | null | undefined = activeAccountUserId
): boolean {
  const provider =
    providerOrModel === "custom-model" ? getCustomModelProvider() : (providerOrModel as ProviderId);
  const accountProviders = userId ? (cachedAccountProvidersByUser.get(userId) ?? []) : [];
  return (
    (!userId && Boolean(getStoredKeys()[provider]?.trim())) || accountProviders.includes(provider)
  );
}

export function hasAccountKeyForProvider(provider: ProviderId): boolean {
  const accountProviders = activeAccountUserId
    ? (cachedAccountProvidersByUser.get(activeAccountUserId) ?? [])
    : [];
  return accountProviders.includes(provider);
}

export function hasKeyForModel(
  modelId: string,
  userId: string | null | undefined = activeAccountUserId
): boolean {
  const { provider } = getKeyForModel(modelId, userId);
  return hasKeyForProvider(provider, userId);
}

export function getKeyForModel(
  modelId: string,
  userId: string | null | undefined = activeAccountUserId
): {
  provider: ProviderId;
  apiKey: string;
  baseUrl: string;
  modelName: string;
  providerName: string;
} {
  const provider =
    modelId === "custom-model" ? getCustomModelProvider() : getModelMeta(modelId).provider;
  const keys: StoredKeysMap = userId ? {} : getStoredKeys();
  const urls = getStoredBaseUrls(userId);
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

export function getProviderChatRequestConfig(
  modelId: string,
  userId: string | null | undefined = activeAccountUserId
): {
  headers: Record<string, string>;
  providerName: string;
  modelName: string;
  customModelFields: { customModel?: string; customProvider?: ProviderId };
} {
  const { apiKey, baseUrl, provider, providerName, modelName } = getKeyForModel(modelId, userId);
  const baseUrls = getStoredBaseUrls(userId);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["X-Expected-User-Id"] = userId;
  if (apiKey) headers["x-provider-key"] = apiKey;
  // Let the backend apply an account's saved endpoint when no browser override exists.
  if (baseUrls[provider]?.trim()) headers["x-provider-base-url"] = baseUrl;
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
  const [keysOwnerId, setKeysOwnerId] = useState<string | undefined>(user?.uid);
  const [baseUrls, setBaseUrls] = useState<StoredUrlsMap>(() =>
    getStoredBaseUrls(user?.uid ?? null)
  );
  const [baseUrlsOwnerId, setBaseUrlsOwnerId] = useState<string | undefined>(user?.uid);
  const [accountProviders, setAccountProviders] = useState<ProviderId[]>(() =>
    user?.uid ? (cachedAccountProvidersByUser.get(user.uid) ?? []) : []
  );
  const [accountProvidersOwnerId, setAccountProvidersOwnerId] = useState<string | undefined>(
    user?.uid
  );
  const [customModelId, setCustomModelIdState] = useState(() => getCustomModelId());
  const [customModelProvider, setCustomModelProviderState] = useState(() =>
    getCustomModelProvider()
  );
  const lastUserIdRef = useRef<string | null | undefined>(undefined);
  const currentUserId = user?.uid;
  const currentUserIdRef = useRef<string | undefined>(currentUserId);
  currentUserIdRef.current = currentUserId;
  const visibleAccountProviders = useMemo(
    () => (accountProvidersOwnerId === currentUserId ? accountProviders : []),
    [accountProvidersOwnerId, accountProviders, currentUserId]
  );
  const visibleBaseUrls =
    baseUrlsOwnerId === currentUserId ? baseUrls : getStoredBaseUrls(currentUserId ?? null);
  const visibleKeys = keysOwnerId === currentUserId && !currentUserId ? keys : {};

  const refresh = useCallback(() => {
    setKeys(getProviderKeyDrafts());
    setKeysOwnerId(currentUserId);
    setBaseUrls(getStoredBaseUrls(currentUserId ?? null));
    setBaseUrlsOwnerId(currentUserId);
    setAccountProviders(
      currentUserId ? [...(cachedAccountProvidersByUser.get(currentUserId) ?? [])] : []
    );
    setAccountProvidersOwnerId(currentUserId);
    setCustomModelIdState(getCustomModelId());
    setCustomModelProviderState(getCustomModelProvider());
  }, [currentUserId]);

  useEffect(() => {
    let isCurrentAccount = true;
    if (lastUserIdRef.current !== currentUserId) {
      if (lastUserIdRef.current || currentUserId) {
        memoryKeys = {};
        for (const k of Object.keys(legacyKeysToImport)) {
          delete legacyKeysToImport[k as ProviderId];
        }
      }
      activeAccountUserId = currentUserId;
      setKeys(getProviderKeyDrafts());
      setKeysOwnerId(currentUserId);
      setAccountProviders(
        currentUserId ? (cachedAccountProvidersByUser.get(currentUserId) ?? []) : []
      );
      setAccountProvidersOwnerId(currentUserId);
      notifySync(false);
    } else {
      activeAccountUserId = currentUserId;
    }
    setBaseUrls(getStoredBaseUrls(currentUserId ?? null));
    setBaseUrlsOwnerId(currentUserId);
    lastUserIdRef.current = currentUserId;

    if (currentUserId) {
      void fetchAccountProviders(currentUserId).then((providers) => {
        if (isCurrentAccount) setAccountProviders(providers);
      });
    }
    return () => {
      isCurrentAccount = false;
    };
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
          const requestUserId = currentUserId;
          void fetchAccountProviders(requestUserId).then((providers) => {
            if (activeAccountUserId === requestUserId) setAccountProviders(providers);
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
      if (user && apiKey.trim()) {
        const requestUserId = user.uid;
        const response = await fetchAccountCredentialRequest(requestUserId, "/api/credentials", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey, baseUrl }),
        });
        if (!response.ok) {
          throw await getCredentialError(response, "Could not save provider key to your account.");
        }
        if (currentUserIdRef.current !== requestUserId) {
          throw new Error("The signed-in account changed. Retry saving the provider key.");
        }
        delete memoryKeys[provider];
        saveStoredKey(provider, "", baseUrl, requestUserId);
        const accountProviders = cachedAccountProvidersByUser.get(requestUserId) ?? [];
        if (!accountProviders.includes(provider)) {
          cachedAccountProvidersByUser.set(requestUserId, [...accountProviders, provider]);
        }
        // Other mounted views and other browser tabs need the updated account-backed status
        notifySync(true);
      } else {
        saveStoredKey(provider, apiKey, baseUrl, null);
      }
      if (apiKey.trim()) delete legacyKeysToImport[provider];
      refresh();
    },
    [refresh, user]
  );

  const setProviderEndpoint = useCallback(
    async (provider: ProviderId, baseUrl: string) => {
      if (!user) throw new Error("Sign in before saving a provider endpoint.");
      const requestUserId = user.uid;
      const response = await fetchAccountCredentialRequest(requestUserId, "/api/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, baseUrl }),
      });
      if (!response.ok) {
        throw await getCredentialError(
          response,
          "Could not save provider endpoint to your account."
        );
      }
      if (currentUserIdRef.current !== requestUserId) {
        throw new Error("The signed-in account changed. Retry saving the provider endpoint.");
      }
      saveStoredKey(provider, getStoredKeys()[provider] || "", baseUrl, requestUserId);
      refresh();
    },
    [refresh, user]
  );

  const deleteProviderKey = useCallback(
    async (provider: ProviderId) => {
      if (user) {
        const requestUserId = user.uid;
        const response = await fetchAccountCredentialRequest(
          requestUserId,
          `/api/credentials/${encodeURIComponent(provider)}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          throw await getCredentialError(
            response,
            "Could not remove provider key from your account."
          );
        }
        if (currentUserIdRef.current !== requestUserId) {
          throw new Error("The signed-in account changed. Retry removing the provider key.");
        }
        const accountProviders = cachedAccountProvidersByUser.get(requestUserId) ?? [];
        cachedAccountProvidersByUser.set(
          requestUserId,
          accountProviders.filter((item) => item !== provider)
        );
      }
      removeStoredKey(provider, user?.uid ?? null);
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
      if (currentUserIdRef.current !== currentUserId) return false;
      const provider =
        providerOrModel === "custom-model" ? customModelProvider : (providerOrModel as ProviderId);
      if (!currentUserId && memoryKeys[provider]?.trim()) return true;
      return visibleAccountProviders.includes(provider);
    },
    [currentUserId, customModelProvider, visibleAccountProviders]
  );

  const hasKeyForModelHook = useCallback(
    (modelId: string) => {
      const { provider } = getKeyForModel(modelId, currentUserId ?? null);
      return hasKey(provider);
    },
    [currentUserId, hasKey]
  );

  const hasAccountKey = useCallback(
    (provider: ProviderId) =>
      currentUserIdRef.current === currentUserId && visibleAccountProviders.includes(provider),
    [currentUserId, visibleAccountProviders]
  );

  const refreshAccountProviders = useCallback(async (): Promise<ProviderId[]> => {
    const requestUserId = currentUserId;
    if (!requestUserId) return [];
    const providers = await fetchAccountProviders(requestUserId);
    if (currentUserIdRef.current !== requestUserId) return [];
    setAccountProviders(providers);
    setAccountProvidersOwnerId(requestUserId);
    notifySync(true);
    return providers;
  }, [currentUserId]);

  const allProviderIds = Object.keys(PROVIDER_CATALOG) as ProviderId[];
  const connectedCount = allProviderIds.filter((id) => hasKey(id)).length;

  return {
    keys: visibleKeys,
    baseUrls: visibleBaseUrls,
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
