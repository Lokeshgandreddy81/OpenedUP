import { useState, useEffect, useCallback, useRef } from "react";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { authenticatedChatFetch } from "../../../app/api/chatApi";
import { getSupabaseAccessToken } from "../../../app/integrations/supabaseAuth";

export interface ArtifactItem {
  id: string;
  legacyId?: string;
  title: string;
  category: "Code" | "Documents";
  content: string;
  language?: string;
  modelUsed?: string;
  isShared?: boolean;
  isFavorite?: boolean;
  collection?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  isOwner?: boolean;
}

export type ArtifactVersion = Pick<
  ArtifactItem,
  "id" | "title" | "category" | "content" | "language" | "modelUsed" | "updatedAt"
>;

export interface ArtifactOrganizationUpdate {
  isFavorite?: boolean;
  collection?: string | null;
  tags?: string[];
}

const ARTIFACTS_STORAGE_KEY = "openedup_artifacts_v1";
const ANONYMOUS_ARTIFACTS_STORAGE_KEY = `${ARTIFACTS_STORAGE_KEY}:anonymous`;
const ARTIFACT_IMPORT_OWNER_KEY = `${ARTIFACTS_STORAGE_KEY}:import-owner`;
const ARTIFACT_IMPORT_OWNER_COOKIE = "openedup_artifact_import_owner";
const ARTIFACT_IMPORT_COMPLETE_KEY = `${ARTIFACTS_STORAGE_KEY}:import-complete`;
const ARTIFACTS_SYNC_EVENT = "openedup-artifacts-sync";
const ARTIFACT_VERSIONS_STORAGE_KEY = "openedup_artifact_versions_v1";

function readArtifactImportOwner(): string | null {
  try {
    const owner = window.localStorage.getItem(ARTIFACT_IMPORT_OWNER_KEY);
    if (owner) return owner;
  } catch {
    // Try the cross-tab cookie when local storage is unavailable.
  }
  try {
    const ownerCookie = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ARTIFACT_IMPORT_OWNER_COOKIE}=`));
    return ownerCookie
      ? decodeURIComponent(ownerCookie.slice(ARTIFACT_IMPORT_OWNER_COOKIE.length + 1))
      : null;
  } catch {
    return null;
  }
}

function reserveArtifactImport(userId: string): boolean {
  try {
    window.localStorage.setItem(ARTIFACT_IMPORT_OWNER_KEY, userId);
    if (window.localStorage.getItem(ARTIFACT_IMPORT_OWNER_KEY) === userId) return true;
  } catch {
    // Use a cross-tab cookie when the storage quota is exhausted.
  }
  try {
    document.cookie = `${ARTIFACT_IMPORT_OWNER_COOKIE}=${encodeURIComponent(userId)}; Path=/; Max-Age=31536000; SameSite=Strict`;
    return readArtifactImportOwner() === userId;
  } catch {
    return false;
  }
}

function clearArtifactImportOwner(): void {
  try {
    window.localStorage.removeItem(ARTIFACT_IMPORT_OWNER_KEY);
  } catch {
    // Clear the cross-tab marker too.
  }
  try {
    document.cookie = `${ARTIFACT_IMPORT_OWNER_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
  } catch {
    // A stale marker is safe once the legacy source has been removed.
  }
}

function localArtifactStorageKey(): string {
  try {
    if (
      readArtifactImportOwner() ||
      window.localStorage.getItem(ARTIFACT_IMPORT_COMPLETE_KEY) === "true"
    ) {
      return ANONYMOUS_ARTIFACTS_STORAGE_KEY;
    }
  } catch {
    return ANONYMOUS_ARTIFACTS_STORAGE_KEY;
  }
  return ARTIFACTS_STORAGE_KEY;
}

export function getStoredArtifactVersions(id: string): ArtifactVersion[] {
  try {
    const all = JSON.parse(
      window.localStorage.getItem(ARTIFACT_VERSIONS_STORAGE_KEY) || "{}"
    ) as Record<string, ArtifactVersion[]>;
    return all[id] || [];
  } catch {
    return [];
  }
}

export function getStoredArtifacts(userId: string | null = null): ArtifactItem[] {
  if (typeof window === "undefined") return [];
  try {
    const owner = readArtifactImportOwner();
    if (owner && owner !== userId) {
      const anonymousRaw = window.localStorage.getItem(ANONYMOUS_ARTIFACTS_STORAGE_KEY);
      const anonymousItems = anonymousRaw ? JSON.parse(anonymousRaw) : [];
      return Array.isArray(anonymousItems) ? anonymousItems : [];
    }
    const migrationComplete = window.localStorage.getItem(ARTIFACT_IMPORT_COMPLETE_KEY) === "true";
    const key = userId
      ? migrationComplete && !owner
        ? null
        : ARTIFACTS_STORAGE_KEY
      : localArtifactStorageKey();
    const raw = key ? window.localStorage.getItem(key) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeArtifactTags(tags: string[] = []): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

export function saveArtifactItem(
  item: Omit<ArtifactItem, "id" | "createdAt" | "updatedAt"> & { id?: string }
): ArtifactItem {
  const storageKey = localArtifactStorageKey();
  const current = readLocalArtifactsAt(storageKey);
  const existingArtifact = current.find((artifact) => artifact.id === item.id);
  const now = Date.now();
  const newItem: ArtifactItem = {
    id: item.id || `art-${now}-${Math.random().toString(36).slice(2, 6)}`,
    title: item.title.trim() || "Untitled Artifact",
    category: item.category,
    content: item.content,
    language: item.language,
    modelUsed: item.modelUsed,
    isShared: Boolean(item.isShared),
    isFavorite: item.isFavorite ?? existingArtifact?.isFavorite ?? false,
    collection:
      item.collection === undefined ? existingArtifact?.collection : item.collection || undefined,
    tags: normalizeArtifactTags(item.tags ?? existingArtifact?.tags),
    createdAt: now,
    updatedAt: now,
  };

  const existsIdx = current.findIndex((a) => a.id === newItem.id);
  if (existsIdx >= 0) {
    const existing = current[existsIdx];
    if (existing) {
      const versions = getStoredArtifactVersions(newItem.id);
      const allVersions = JSON.parse(
        window.localStorage.getItem(ARTIFACT_VERSIONS_STORAGE_KEY) || "{}"
      ) as Record<string, ArtifactVersion[]>;
      allVersions[newItem.id] = [
        {
          id: `version-${now}-${Math.random().toString(36).slice(2, 8)}`,
          title: existing.title,
          category: existing.category,
          content: existing.content,
          language: existing.language,
          modelUsed: existing.modelUsed,
          updatedAt: existing.updatedAt,
        },
        ...versions,
      ].slice(0, 50);
      window.localStorage.setItem(ARTIFACT_VERSIONS_STORAGE_KEY, JSON.stringify(allVersions));
    }
  }
  const next =
    existsIdx >= 0
      ? current.map((a, i) => (i === existsIdx ? { ...newItem, createdAt: a.createdAt } : a))
      : [newItem, ...current];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(ARTIFACTS_SYNC_EVENT));
  }
  return newItem;
}

function readLocalArtifactsAt(key: string): ArtifactItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function updateStoredArtifactOrganization(
  id: string,
  update: ArtifactOrganizationUpdate
): ArtifactItem | null {
  const storageKey = localArtifactStorageKey();
  const current = readLocalArtifactsAt(storageKey);
  const existing = current.find((artifact) => artifact.id === id);
  if (!existing) return null;
  const updated: ArtifactItem = {
    ...existing,
    ...(update.isFavorite !== undefined ? { isFavorite: update.isFavorite } : {}),
    ...(update.collection !== undefined ? { collection: update.collection || undefined } : {}),
    ...(update.tags !== undefined ? { tags: normalizeArtifactTags(update.tags) } : {}),
  };
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(current.map((artifact) => (artifact.id === id ? updated : artifact)))
  );
  window.dispatchEvent(new CustomEvent(ARTIFACTS_SYNC_EVENT));
  return updated;
}

export async function persistArtifactItem(
  item: Omit<ArtifactItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  userId: string | null = null
): Promise<ArtifactItem> {
  const token = await getSupabaseAccessToken();
  if (!token && !userId) return saveArtifactItem(item);
  if (!token || !userId) {
    throw new Error("The signed-in account changed. Retry saving this artifact.");
  }
  const response = await authenticatedChatFetch(
    "/api/artifacts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    },
    userId
  );
  if (!response.ok) throw new Error("Could not save artifact to your account.");
  return ((await response.json()) as { artifact: ArtifactItem }).artifact;
}

export function deleteArtifactItem(id: string): void {
  if (typeof window === "undefined") return;
  const storageKey = localArtifactStorageKey();
  const next = readLocalArtifactsAt(storageKey).filter((a) => a.id !== id);
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  try {
    const versions = JSON.parse(
      window.localStorage.getItem(ARTIFACT_VERSIONS_STORAGE_KEY) || "{}"
    ) as Record<string, ArtifactVersion[]>;
    delete versions[id];
    window.localStorage.setItem(ARTIFACT_VERSIONS_STORAGE_KEY, JSON.stringify(versions));
  } catch {
    window.localStorage.removeItem(ARTIFACT_VERSIONS_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(ARTIFACTS_SYNC_EVENT));
}

export function useArtifacts() {
  const { user } = useChatAuth();
  const currentUserId = user?.uid;
  const currentUserIdRef = useRef<string | null>(currentUserId ?? null);
  currentUserIdRef.current = currentUserId ?? null;
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>(() => getStoredArtifacts(null));
  const [loadedAccountUid, setLoadedAccountUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncAttempt, setSyncAttempt] = useState(0);

  const refresh = useCallback(() => {
    if (currentUserId) setSyncAttempt((attempt) => attempt + 1);
    else setArtifacts(getStoredArtifacts(null));
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      refresh();
      setLoadedAccountUid(null);
      setLoading(false);
      setError("");
      return;
    }
    const userId = user.uid;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        let legacyOwner = readArtifactImportOwner();
        const legacy = legacyOwner && legacyOwner !== userId ? [] : getStoredArtifacts(userId);
        if (legacy.length && !legacyOwner) {
          if (!reserveArtifactImport(userId)) {
            throw new Error("Could not safely reserve browser-saved artifacts for this account.");
          }
          legacyOwner = userId;
        }
        if (legacy.length) {
          const imported = await authenticatedChatFetch(
            "/api/artifacts/import",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                artifacts: legacy.map((a) => ({
                  legacyId: a.id,
                  title: a.title,
                  category: a.category,
                  content: a.content,
                  language: a.language,
                  modelUsed: a.modelUsed,
                  // Existing local share toggles were device-local. Never expose old local records
                  // to every signed-in account as a side effect of the one-time import.
                  isShared: false,
                  isFavorite: a.isFavorite ?? false,
                  collection: a.collection ?? null,
                  tags: a.tags ?? [],
                  createdAt: a.createdAt,
                  updatedAt: a.updatedAt,
                })),
              }),
            },
            userId
          );
          if (!imported.ok) throw new Error("Artifact import failed.");
          window.localStorage.removeItem(ARTIFACTS_STORAGE_KEY);
          if (window.localStorage.getItem(ARTIFACTS_STORAGE_KEY) === null) {
            window.localStorage.setItem(ARTIFACT_IMPORT_COMPLETE_KEY, "true");
            clearArtifactImportOwner();
          }
        } else if (legacyOwner === userId) {
          window.localStorage.removeItem(ARTIFACTS_STORAGE_KEY);
          if (window.localStorage.getItem(ARTIFACTS_STORAGE_KEY) === null) {
            window.localStorage.setItem(ARTIFACT_IMPORT_COMPLETE_KEY, "true");
            clearArtifactImportOwner();
          }
        }
        const response = await authenticatedChatFetch("/api/artifacts", {}, userId);
        if (!response.ok) throw new Error("Artifact load failed.");
        const data = (await response.json()) as { artifacts: ArtifactItem[] };
        if (!cancelled) {
          setArtifacts(data.artifacts);
          setLoadedAccountUid(userId);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not sync artifacts with your account. Retry to load them from your account."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refresh, syncAttempt]);

  useEffect(() => {
    const handleSync = () => refresh();
    window.addEventListener(ARTIFACTS_SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(ARTIFACTS_SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [refresh]);

  const assertCurrentAccount = (expectedUserId: string) => {
    if (currentUserIdRef.current !== expectedUserId) {
      throw new Error("The signed-in account changed. Retry the action.");
    }
  };

  return {
    artifacts:
      (user && loadedAccountUid !== user.uid) || (!user && loadedAccountUid !== null)
        ? []
        : artifacts,
    loading,
    error,
    retrySync: () => setSyncAttempt((attempt) => attempt + 1),
    addArtifact: async (
      item: Omit<ArtifactItem, "id" | "createdAt" | "updatedAt"> & { id?: string }
    ) => {
      if (!user) return saveArtifactItem(item);
      const response = await authenticatedChatFetch(
        "/api/artifacts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        },
        user.uid
      );
      if (!response.ok) throw new Error("Could not save artifact.");
      const data = (await response.json()) as { artifact: ArtifactItem };
      assertCurrentAccount(user.uid);
      setArtifacts((current) => [
        data.artifact,
        ...current.filter((a) => a.id !== data.artifact.id),
      ]);
      return data.artifact;
    },
    updateArtifact: async (
      id: string,
      item: Omit<ArtifactItem, "id" | "createdAt" | "updatedAt" | "isOwner">
    ) => {
      if (!user) return saveArtifactItem({ ...item, id });
      const response = await authenticatedChatFetch(
        `/api/artifacts/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        },
        user.uid
      );
      if (!response.ok) throw new Error("Could not update artifact.");
      const data = (await response.json()) as { artifact: ArtifactItem };
      assertCurrentAccount(user.uid);
      setArtifacts((current) =>
        current.map((artifact) => (artifact.id === id ? data.artifact : artifact))
      );
      return data.artifact;
    },
    updateOrganization: async (id: string, update: ArtifactOrganizationUpdate) => {
      if (!user) {
        const updated = updateStoredArtifactOrganization(id, update);
        if (!updated) throw new Error("Could not find this artifact.");
        return updated;
      }
      const response = await authenticatedChatFetch(
        `/api/artifacts/${encodeURIComponent(id)}/organization`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        },
        user.uid
      );
      if (!response.ok) throw new Error("Could not update artifact organization.");
      const data = (await response.json()) as { artifact: ArtifactItem };
      assertCurrentAccount(user.uid);
      setArtifacts((current) =>
        current.map((artifact) => (artifact.id === id ? data.artifact : artifact))
      );
      return data.artifact;
    },
    getVersions: async (id: string): Promise<ArtifactVersion[]> => {
      if (!user) return getStoredArtifactVersions(id);
      const response = await authenticatedChatFetch(
        `/api/artifacts/${encodeURIComponent(id)}/versions`,
        {},
        user.uid
      );
      if (!response.ok) throw new Error("Could not load artifact history.");
      const data = (await response.json()) as {
        versions: Array<Omit<ArtifactVersion, "updatedAt"> & { createdAt: number }>;
      };
      assertCurrentAccount(user.uid);
      return data.versions.map(({ createdAt, ...version }) => ({
        ...version,
        updatedAt: createdAt,
      }));
    },
    removeArtifact: async (id: string) => {
      if (!user) return deleteArtifactItem(id);
      const response = await authenticatedChatFetch(
        `/api/artifacts/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
        user.uid
      );
      if (!response.ok) throw new Error("Could not delete artifact.");
      assertCurrentAccount(user.uid);
      setArtifacts((current) => current.filter((a) => a.id !== id));
    },
    setShared: async (id: string, isShared: boolean) => {
      if (!user) throw new Error("Sign in to share artifacts.");
      const response = await authenticatedChatFetch(
        `/api/artifacts/${encodeURIComponent(id)}/share`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isShared }),
        },
        user.uid
      );
      if (!response.ok) throw new Error("Could not update artifact sharing.");
      assertCurrentAccount(user.uid);
      setArtifacts((current) => current.map((a) => (a.id === id ? { ...a, isShared } : a)));
    },
  };
}
