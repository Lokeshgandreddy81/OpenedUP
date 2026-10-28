import { useState, useEffect, useCallback } from "react";
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
const ARTIFACTS_SYNC_EVENT = "openedup-artifacts-sync";
const ARTIFACT_VERSIONS_STORAGE_KEY = "openedup_artifact_versions_v1";

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

export function getStoredArtifacts(): ArtifactItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ARTIFACTS_STORAGE_KEY);
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
  const current = getStoredArtifacts();
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
    window.localStorage.setItem(ARTIFACTS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(ARTIFACTS_SYNC_EVENT));
  }
  return newItem;
}

export function updateStoredArtifactOrganization(
  id: string,
  update: ArtifactOrganizationUpdate
): ArtifactItem | null {
  const current = getStoredArtifacts();
  const existing = current.find((artifact) => artifact.id === id);
  if (!existing) return null;
  const updated: ArtifactItem = {
    ...existing,
    ...(update.isFavorite !== undefined ? { isFavorite: update.isFavorite } : {}),
    ...(update.collection !== undefined ? { collection: update.collection || undefined } : {}),
    ...(update.tags !== undefined ? { tags: normalizeArtifactTags(update.tags) } : {}),
  };
  window.localStorage.setItem(
    ARTIFACTS_STORAGE_KEY,
    JSON.stringify(current.map((artifact) => (artifact.id === id ? updated : artifact)))
  );
  window.dispatchEvent(new CustomEvent(ARTIFACTS_SYNC_EVENT));
  return updated;
}

export async function persistArtifactItem(
  item: Omit<ArtifactItem, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<ArtifactItem> {
  if (!(await getSupabaseAccessToken())) return saveArtifactItem(item);
  const response = await authenticatedChatFetch("/api/artifacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error("Could not save artifact to your account.");
  return ((await response.json()) as { artifact: ArtifactItem }).artifact;
}

export function deleteArtifactItem(id: string): void {
  if (typeof window === "undefined") return;
  const next = getStoredArtifacts().filter((a) => a.id !== id);
  window.localStorage.setItem(ARTIFACTS_STORAGE_KEY, JSON.stringify(next));
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
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>(() => getStoredArtifacts());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncAttempt, setSyncAttempt] = useState(0);

  const refresh = useCallback(() => {
    setArtifacts(getStoredArtifacts());
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      refresh();
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const legacy = getStoredArtifacts();
        if (legacy.length) {
          const imported = await authenticatedChatFetch("/api/artifacts/import", {
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
          });
          if (!imported.ok) throw new Error("Artifact import failed.");
        }
        const response = await authenticatedChatFetch("/api/artifacts");
        if (!response.ok) throw new Error("Artifact load failed.");
        const data = (await response.json()) as { artifacts: ArtifactItem[] };
        if (!cancelled) setArtifacts(data.artifacts);
      } catch {
        if (!cancelled) {
          refresh();
          setError(
            "Could not sync artifacts with your account. Showing browser-saved artifacts; retry by reopening this page."
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

  return {
    artifacts,
    loading,
    error,
    retrySync: () => setSyncAttempt((attempt) => attempt + 1),
    addArtifact: async (
      item: Omit<ArtifactItem, "id" | "createdAt" | "updatedAt"> & { id?: string }
    ) => {
      if (!user) return saveArtifactItem(item);
      const response = await authenticatedChatFetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Could not save artifact.");
      const data = (await response.json()) as { artifact: ArtifactItem };
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
      const response = await authenticatedChatFetch(`/api/artifacts/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Could not update artifact.");
      const data = (await response.json()) as { artifact: ArtifactItem };
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
        }
      );
      if (!response.ok) throw new Error("Could not update artifact organization.");
      const data = (await response.json()) as { artifact: ArtifactItem };
      setArtifacts((current) =>
        current.map((artifact) => (artifact.id === id ? data.artifact : artifact))
      );
      return data.artifact;
    },
    getVersions: async (id: string): Promise<ArtifactVersion[]> => {
      if (!user) return getStoredArtifactVersions(id);
      const response = await authenticatedChatFetch(
        `/api/artifacts/${encodeURIComponent(id)}/versions`
      );
      if (!response.ok) throw new Error("Could not load artifact history.");
      const data = (await response.json()) as {
        versions: Array<Omit<ArtifactVersion, "updatedAt"> & { createdAt: number }>;
      };
      return data.versions.map(({ createdAt, ...version }) => ({
        ...version,
        updatedAt: createdAt,
      }));
    },
    removeArtifact: async (id: string) => {
      if (!user) return deleteArtifactItem(id);
      const response = await authenticatedChatFetch(`/api/artifacts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete artifact.");
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
        }
      );
      if (!response.ok) throw new Error("Could not update artifact sharing.");
      setArtifacts((current) => current.map((a) => (a.id === id ? { ...a, isShared } : a)));
    },
  };
}
