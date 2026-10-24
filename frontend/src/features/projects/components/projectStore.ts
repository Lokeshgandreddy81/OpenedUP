import { ProjectSnapshotSchema, type ProjectSnapshot } from "@charan-interiors/contracts";
import { authenticatedChatFetch } from "../../../app/api/chatApi";
import type { ProjectItem } from "./projectTypes";

export const PROJECTS_STORAGE_KEY = "shoebox_user_projects";
const PROJECT_IMPORT_OWNER_KEY = "shoebox_user_projects_import_owner";
const DEMO_PROJECT_ID = "proj-demo-yes";

interface PendingProjectSnapshot {
  projects: ProjectItem[];
}

function accountSnapshotKey(userId: string): string {
  return `${PROJECTS_STORAGE_KEY}:pending:${encodeURIComponent(userId)}`;
}

function readPendingAccountSnapshot(userId: string): PendingProjectSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(accountSnapshotKey(userId)) || "null");
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as PendingProjectSnapshot).projects) ||
      (parsed as PendingProjectSnapshot).projects.length > 100 ||
      !(parsed as PendingProjectSnapshot).projects.every(
        (project) => ProjectSnapshotSchema.safeParse(project).success
      )
    ) {
      return null;
    }
    return parsed as PendingProjectSnapshot;
  } catch {
    return null;
  }
}

export function getLocalProjects(): ProjectItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || "null");
    return Array.isArray(parsed) ? (parsed as ProjectItem[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalProjects(projects: ProjectItem[]): void {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export async function loadAccountProjects(userId: string): Promise<{
  projects: ProjectItem[];
  importWarning: string;
  hasPendingSnapshot: boolean;
}> {
  const claimedBy = localStorage.getItem(PROJECT_IMPORT_OWNER_KEY);
  let importWarning = "";
  if (!claimedBy || claimedBy === userId) {
    const legacyProjects = getLocalProjects().filter((project) => project.id !== DEMO_PROJECT_ID);
    if (legacyProjects.length > 0) {
      const imported = await authenticatedChatFetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: legacyProjects }),
      });
      if (!imported.ok) {
        importWarning =
          "Some browser-saved projects could not be imported. They remain in this browser; remove or shorten oversized project history, then retry import.";
      } else {
        localStorage.setItem(PROJECT_IMPORT_OWNER_KEY, userId);
        localStorage.removeItem(PROJECTS_STORAGE_KEY);
      }
    }
  }

  const response = await authenticatedChatFetch("/api/projects");
  if (!response.ok) throw new Error("Could not load projects from your account.");
  const data = (await response.json()) as { projects: ProjectSnapshot[] };
  // An account-scoped snapshot is written before each save. If a previous request
  // failed or the page closed mid-save, restore it and let the normal save queue
  // retry it. It can never be offered to a different signed-in account.
  const pending = readPendingAccountSnapshot(userId);
  return {
    projects: pending?.projects ?? (data.projects as ProjectItem[]),
    importWarning,
    hasPendingSnapshot: pending !== null,
  };
}

export async function saveAccountProjects(userId: string, projects: ProjectItem[]): Promise<void> {
  const key = accountSnapshotKey(userId);
  const pendingSnapshot: PendingProjectSnapshot = { projects };
  const serializedPending = JSON.stringify(pendingSnapshot);
  try {
    localStorage.setItem(key, serializedPending);
  } catch {
    // The server remains the primary store; still attempt the save if browser
    // storage is unavailable or full.
  }
  const response = await authenticatedChatFetch("/api/projects", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects }),
  });
  if (!response.ok) throw new Error("Could not save projects to your account.");
  try {
    // Do not clear a newer recovery snapshot written while this request was in flight.
    if (localStorage.getItem(key) === serializedPending) localStorage.removeItem(key);
  } catch {
    // Clearing a recovery copy is best effort after the server has confirmed the save.
  }
}
