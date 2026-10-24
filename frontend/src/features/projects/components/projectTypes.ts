import type { ChatAttachmentFile } from "../../../app/files/chatAttachments";

export type ProjectFile = ChatAttachmentFile;

export interface ProjectSessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  thinkingTime?: string;
  isStreaming?: boolean;
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
