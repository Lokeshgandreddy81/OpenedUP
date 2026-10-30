import type { ProjectItem, ProjectSession } from "./projectTypes";

export function applyProjectSessionUpdate(
  projects: ProjectItem[],
  projectId: string,
  updatedSession: ProjectSession
): ProjectItem[] {
  return projects.map((project) => {
    if (project.id !== projectId) return project;

    return {
      ...project,
      sessions: (project.sessions || []).map((session) =>
        session.id === updatedSession.id ? { ...session, ...updatedSession } : session
      ),
      updatedAt: Math.max(project.updatedAt, updatedSession.updatedAt),
    };
  });
}
