import {
  PROJECTS_COLLECTION_MAX_ITEMS,
  PROJECTS_PAYLOAD_MAX_BYTES,
  ProjectsCollectionSchema,
  type ProjectSnapshot,
} from "@charan-interiors/contracts";
import { authenticatedChatFetch } from "../../../app/api/chatApi";
import { uploadBlobForProcessing } from "../../../app/files/storageUploads";
import type { ProjectItem } from "./projectTypes";

export const PROJECTS_STORAGE_KEY = "shoebox_user_projects";
const ANONYMOUS_PROJECTS_STORAGE_KEY = `${PROJECTS_STORAGE_KEY}:anonymous`;
const PROJECT_IMPORT_OWNER_KEY = "shoebox_user_projects_import_owner";
const PROJECT_IMPORT_OWNER_COOKIE = "shoebox_project_import_owner";
const PROJECT_IMPORT_OWNER_SESSION_KEY = "shoebox_project_import_owner_session";
const DEMO_PROJECT_ID = "proj-demo-yes";
const INLINE_PROJECT_BODY_MAX_BYTES = 3 * 1024 * 1024;
const PROJECT_SNAPSHOT_MAX_ENVELOPE_BYTES = PROJECTS_PAYLOAD_MAX_BYTES + 1024;

export interface ProjectRequestTransport {
  authenticatedFetch: typeof authenticatedChatFetch;
  uploadBlob: typeof uploadBlobForProcessing;
}

export interface ProjectAccountTransport extends ProjectRequestTransport {
  download: typeof fetch;
  storageBaseUrl: string | undefined;
}

const defaultProjectRequestTransport: ProjectRequestTransport = {
  authenticatedFetch: authenticatedChatFetch,
  uploadBlob: uploadBlobForProcessing,
};

const defaultProjectAccountTransport: ProjectAccountTransport = {
  ...defaultProjectRequestTransport,
  download: fetch,
  storageBaseUrl:
    typeof import.meta.env === "undefined" ? undefined : import.meta.env.VITE_SUPABASE_URL,
};

interface PendingProjectSnapshot {
  projects: ProjectItem[];
}

function accountSnapshotKey(userId: string): string {
  return `${PROJECTS_STORAGE_KEY}:pending:${encodeURIComponent(userId)}`;
}

function pendingImportKey(userId: string): string {
  return `${PROJECTS_STORAGE_KEY}:pending-import:${encodeURIComponent(userId)}`;
}

function readProjectsAt(key: string): ProjectItem[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProjectItem[]) : null;
  } catch {
    return null;
  }
}

function readImportOwner(): string | null {
  let localOwner: string | null = null;
  try {
    localOwner = localStorage.getItem(PROJECT_IMPORT_OWNER_KEY);
  } catch {
    // Fall through to browser stores that do not share localStorage's quota.
  }
  if (localOwner) return localOwner;
  try {
    const cookie =
      typeof document === "undefined"
        ? undefined
        : document.cookie
            .split(";")
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${PROJECT_IMPORT_OWNER_COOKIE}=`));
    const cookieOwner = cookie?.slice(PROJECT_IMPORT_OWNER_COOKIE.length + 1);
    if (cookieOwner) return decodeURIComponent(cookieOwner);
  } catch {
    // Try session storage if cookies are unavailable.
  }
  try {
    return sessionStorage.getItem(PROJECT_IMPORT_OWNER_SESSION_KEY);
  } catch {
    return null;
  }
}

function writeImportOwner(userId: string): boolean {
  try {
    localStorage.setItem(PROJECT_IMPORT_OWNER_KEY, userId);
    if (localStorage.getItem(PROJECT_IMPORT_OWNER_KEY) === userId) return true;
  } catch {
    // Fall through to a cross-tab cookie, then tab-scoped session storage.
  }
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${PROJECT_IMPORT_OWNER_COOKIE}=${encodeURIComponent(userId)}; Path=/; Max-Age=31536000; SameSite=Strict`;
      if (readImportOwner() === userId) return true;
    }
  } catch {
    // Try session storage if cookies are unavailable.
  }
  try {
    sessionStorage.setItem(PROJECT_IMPORT_OWNER_SESSION_KEY, userId);
    return sessionStorage.getItem(PROJECT_IMPORT_OWNER_SESSION_KEY) === userId;
  } catch {
    return false;
  }
}

function clearImportOwner(): boolean {
  try {
    localStorage.removeItem(PROJECT_IMPORT_OWNER_KEY);
  } catch {
    // Continue clearing browser fallbacks.
  }
  try {
    sessionStorage.removeItem(PROJECT_IMPORT_OWNER_SESSION_KEY);
  } catch {
    // Session storage is optional.
  }
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${PROJECT_IMPORT_OWNER_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
    }
  } catch {
    // A stale marker is safe once the shared snapshot has been removed.
  }
  return readImportOwner() === null;
}

function hasValidProjectCollection(projects: ProjectItem[]): boolean {
  return (
    projects.length <= PROJECTS_COLLECTION_MAX_ITEMS &&
    ProjectsCollectionSchema.safeParse({ projects }).success
  );
}

function readPendingAccountSnapshot(userId: string): PendingProjectSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(accountSnapshotKey(userId)) || "null");
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as PendingProjectSnapshot).projects) ||
      !hasValidProjectCollection((parsed as PendingProjectSnapshot).projects)
    ) {
      return null;
    }
    return parsed as PendingProjectSnapshot;
  } catch {
    return null;
  }
}

export function getLocalProjects(userId: string | null = null): ProjectItem[] {
  const owner = readImportOwner();
  if (owner && owner !== userId) return readProjectsAt(ANONYMOUS_PROJECTS_STORAGE_KEY) ?? [];
  if (!owner && userId === null) {
    const anonymousProjects = readProjectsAt(ANONYMOUS_PROJECTS_STORAGE_KEY);
    if (anonymousProjects !== null && anonymousProjects.length > 0) return anonymousProjects;
  }
  return readProjectsAt(PROJECTS_STORAGE_KEY) ?? [];
}

export function saveLocalProjects(projects: ProjectItem[]): void {
  let owner = readImportOwner();
  const sharedProjects = owner ? readProjectsAt(PROJECTS_STORAGE_KEY) : null;
  if (owner && sharedProjects !== null && sharedProjects.length === 0) {
    if (clearImportOwner()) owner = null;
  }
  const key =
    owner || localStorage.getItem(ANONYMOUS_PROJECTS_STORAGE_KEY) !== null
      ? ANONYMOUS_PROJECTS_STORAGE_KEY
      : PROJECTS_STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(projectsForPersistence(projects)));
}

export function clearSharedLocalProjects(
  actorUserId: string | null,
  preserveForUserId?: string
): boolean {
  const owner = readImportOwner();
  if (owner && owner !== actorUserId) return false;
  if (preserveForUserId && preserveForUserId !== actorUserId) return false;

  const sharedProjects = readProjectsAt(PROJECTS_STORAGE_KEY);
  if (sharedProjects === null && owner) return false;
  const importOwner = owner ?? preserveForUserId;
  if (importOwner && (sharedProjects?.length ?? 0) > 0) {
    if (!savePendingProjectImport(importOwner, sharedProjects!)) {
      if (!owner) writeImportOwner(importOwner);
      return false;
    }
  }
  try {
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    clearImportOwner();
    return true;
  } catch {
    // Account snapshots remain separately scoped if browser storage is unavailable.
    return false;
  }
}

function readPendingImport(userId: string): ProjectItem[] | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(pendingImportKey(userId)) || "null");
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as { projects?: unknown }).projects) ||
      !hasValidProjectCollection((parsed as { projects: ProjectItem[] }).projects)
    ) {
      return null;
    }
    return (parsed as { projects: ProjectItem[] }).projects;
  } catch {
    return null;
  }
}

export function savePendingProjectImport(userId: string, projects: ProjectItem[]): boolean {
  try {
    const persistedProjects = projectsForPersistence(projects);
    if (!hasValidProjectCollection(persistedProjects)) return false;
    const value = JSON.stringify({ projects: persistedProjects });
    const key = pendingImportKey(userId);
    localStorage.setItem(key, value);
    return localStorage.getItem(key) === value;
  } catch {
    return false;
  }
}

function projectsForPersistence(projects: ProjectItem[]): ProjectItem[] {
  return projects.map((project) => ({
    ...project,
    ...(project.files
      ? {
          files: project.files.map((file) => {
            const persistedFile = { ...file };
            delete persistedFile.previewUrl;
            return persistedFile;
          }),
        }
      : {}),
  }));
}

export async function sendProjectRequest(
  url: string,
  method: "PUT" | "POST",
  projects: ProjectItem[],
  expectedUserId: string,
  transport: ProjectRequestTransport = defaultProjectRequestTransport
): Promise<Response> {
  const payload = { projects: projectsForPersistence(projects) };
  if (!ProjectsCollectionSchema.safeParse(payload).success) {
    throw new Error("Project data exceeds the supported collection limits.");
  }
  const serialized = JSON.stringify(payload);
  const snapshot = new Blob([serialized], { type: "application/json" });
  if (snapshot.size > PROJECT_SNAPSHOT_MAX_ENVELOPE_BYTES) {
    throw new Error("Project data exceeds the 20 MB limit.");
  }

  let body = serialized;
  if (snapshot.size > INLINE_PROJECT_BODY_MAX_BYTES) {
    const snapshotPath = await transport.uploadBlob(
      snapshot,
      "projects.json",
      "project-snapshot",
      expectedUserId
    );
    body = JSON.stringify({ snapshotPath });
  }

  return transport.authenticatedFetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Expected-User-Id": expectedUserId,
    },
    body,
  });
}

async function importProjectBatches(
  projects: ProjectItem[],
  userId: string,
  transport: ProjectRequestTransport
): Promise<boolean> {
  if (!hasValidProjectCollection(projects)) return false;
  for (let start = 0; start < projects.length; start += 100) {
    try {
      const response = await sendProjectRequest(
        "/api/projects/import",
        "POST",
        projects.slice(start, start + 100),
        userId,
        transport
      );
      if (!response.ok) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export async function loadAccountProjects(
  userId: string,
  transport: ProjectAccountTransport = defaultProjectAccountTransport
): Promise<{
  projects: ProjectItem[];
  importWarning: string;
  hasPendingSnapshot: boolean;
}> {
  const pendingImport = readPendingImport(userId);
  let claimedBy = readImportOwner();
  let importWarning = "";
  const canImportShared = !claimedBy || claimedBy === userId;
  const sharedProjects = canImportShared
    ? (readProjectsAt(PROJECTS_STORAGE_KEY) ?? []).filter(
        (project) => project.id !== DEMO_PROJECT_ID
      )
    : [];
  let sharedReservationFailed = false;
  if (!pendingImport && sharedProjects.length > 0 && !claimedBy) {
    if (writeImportOwner(userId)) claimedBy = userId;
    else {
      const safelyStaged = savePendingProjectImport(userId, sharedProjects);
      if (safelyStaged) localStorage.removeItem(PROJECTS_STORAGE_KEY);
      else {
        sharedReservationFailed = true;
        importWarning =
          "Browser-saved projects could not be safely reserved for this account. They remain in this browser; check available storage, then retry import.";
      }
    }
  }
  const legacyProjects = pendingImport ?? (sharedReservationFailed ? [] : sharedProjects);
  const importSource = pendingImport ? "account" : "shared";
  if (legacyProjects.length > 0) {
    const imported = await importProjectBatches(legacyProjects, userId, transport);
    if (!imported) {
      const safelyRetained = savePendingProjectImport(userId, legacyProjects);
      if (importSource === "shared") {
        if (safelyRetained) {
          localStorage.removeItem(PROJECTS_STORAGE_KEY);
          clearImportOwner();
        } else {
          writeImportOwner(userId);
        }
      }
      if (!importWarning)
        importWarning = safelyRetained
          ? "Some browser-saved projects could not be imported. They are saved for this account; retry to continue."
          : "Some browser-saved projects could not be imported. They remain in this browser; remove or shorten oversized project history, then retry import.";
    } else {
      if (importSource === "account") {
        localStorage.removeItem(pendingImportKey(userId));
        if (claimedBy === userId) {
          localStorage.removeItem(PROJECTS_STORAGE_KEY);
          clearImportOwner();
        }
      } else {
        localStorage.removeItem(PROJECTS_STORAGE_KEY);
        clearImportOwner();
      }
    }
  } else if (pendingImport && claimedBy === userId) {
    // A previously imported pending copy is authoritative for this owner's
    // reserved legacy snapshot, so remove the stale duplicate after recovery.
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    clearImportOwner();
  }

  const response = await transport.authenticatedFetch("/api/projects", {}, userId);
  if (!response.ok) throw new Error("Could not load projects from your account.");
  const data = (await response.json()) as { projects?: ProjectSnapshot[]; snapshotUrl?: string };
  let accountProjects = data.projects;
  if (data.snapshotUrl) {
    const downloadUrl = new URL(data.snapshotUrl);
    const configuredStorageUrl = transport.storageBaseUrl;
    if (!configuredStorageUrl || downloadUrl.origin !== new URL(configuredStorageUrl).origin) {
      throw new Error("The project snapshot download URL is invalid.");
    }
    const snapshotResponse = await transport.download(downloadUrl);
    if (!snapshotResponse.ok) throw new Error("Could not download projects from your account.");
    const snapshotText = await snapshotResponse.text();
    let snapshot: unknown;
    try {
      snapshot = JSON.parse(snapshotText) as unknown;
    } catch {
      throw new Error("The downloaded project snapshot is invalid.");
    }
    if (
      new TextEncoder().encode(snapshotText).byteLength > PROJECT_SNAPSHOT_MAX_ENVELOPE_BYTES ||
      !ProjectsCollectionSchema.safeParse(snapshot).success
    ) {
      throw new Error("The downloaded project snapshot is invalid.");
    }
    accountProjects = (snapshot as { projects: ProjectSnapshot[] }).projects;
  }
  if (!accountProjects) throw new Error("Could not load projects from your account.");
  // An account-scoped snapshot is written before each save. If a previous request
  // failed or the page closed mid-save, restore it and let the normal save queue
  // retry it. It can never be offered to a different signed-in account.
  const pending = readPendingAccountSnapshot(userId);
  return {
    projects: pending?.projects ?? (accountProjects as ProjectItem[]),
    importWarning,
    hasPendingSnapshot: pending !== null,
  };
}

export async function saveAccountProjects(userId: string, projects: ProjectItem[]): Promise<void> {
  const key = accountSnapshotKey(userId);
  const persistedProjects = projectsForPersistence(projects);
  if (!hasValidProjectCollection(persistedProjects)) {
    throw new Error("Project data exceeds the supported collection limits.");
  }
  const pendingSnapshot: PendingProjectSnapshot = { projects: persistedProjects };
  const serializedPending = JSON.stringify(pendingSnapshot);
  try {
    localStorage.setItem(key, serializedPending);
  } catch {
    // The server remains the primary store; still attempt the save if browser
    // storage is unavailable or full.
  }
  const response = await sendProjectRequest("/api/projects", "PUT", persistedProjects, userId);
  if (!response.ok) throw new Error("Could not save projects to your account.");
  try {
    // Do not clear a newer recovery snapshot written while this request was in flight.
    if (localStorage.getItem(key) === serializedPending) localStorage.removeItem(key);
  } catch {
    // Clearing a recovery copy is best effort after the server has confirmed the save.
  }
}
