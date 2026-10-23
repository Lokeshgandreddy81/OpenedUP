import type { ProjectSnapshot } from "@charan-interiors/contracts";
import { authenticatedChatFetch } from "../../../app/api/chatApi";
import type { ProjectItem } from "./projectTypes";

export const PROJECTS_STORAGE_KEY = "shoebox_user_projects";
const PROJECT_IMPORT_OWNER_KEY = "shoebox_user_projects_import_owner";
const DEMO_PROJECT_ID = "proj-demo-yes";

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
  return { projects: data.projects as ProjectItem[], importWarning };
}

export async function saveAccountProjects(projects: ProjectItem[]): Promise<void> {
  const response = await authenticatedChatFetch("/api/projects", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects }),
  });
  if (!response.ok) throw new Error("Could not save projects to your account.");
}
