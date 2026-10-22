export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type?: string;
  uploadedAt: number;
}

export interface ProjectSessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ProjectSession {
  id: string;
  projectId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ProjectSessionMessage[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  customInstructions?: string;
  files?: ProjectFile[];
  sessions?: ProjectSession[];
  colorTag: "stone" | "terracotta" | "indigo" | "emerald" | "amber" | "rose";
  createdAt: number;
  updatedAt: number;
  sessionCount: number;
  isPinned?: boolean;
}

export type ProjectSortOption = "updated" | "name" | "created";
