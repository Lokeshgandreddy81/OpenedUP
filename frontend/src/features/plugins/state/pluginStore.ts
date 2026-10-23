import { useEffect, useState } from "react";

export interface ChatPluginDefinition {
  id: "document-grounding" | "workspace-context" | "executive-directness";
  name: string;
  description: string;
  category: "Productivity" | "Writing";
  featured: boolean;
  permissions: string[];
}

export const CHAT_PLUGINS: ChatPluginDefinition[] = [
  {
    id: "document-grounding",
    name: "Document grounding",
    description: "Find relevant supplied document chapters and include source page ranges.",
    category: "Productivity",
    featured: true,
    permissions: ["Read chapter metadata attached to this chat"],
  },
  {
    id: "workspace-context",
    name: "Workspace context",
    description: "Apply project instructions and inspect the supplied file list.",
    category: "Productivity",
    featured: true,
    permissions: ["Read project instructions", "Read attached file names"],
  },
  {
    id: "executive-directness",
    name: "Executive directness",
    description: "Prefer concise answers with the conclusion first.",
    category: "Writing",
    featured: false,
    permissions: ["Set response-format guidance"],
  },
];

const STORAGE_KEY = "openedup_installed_chat_plugins_v1";
const CHANGE_EVENT = "openedup-plugins-changed";

export function getInstalledPluginIds(): ChatPluginDefinition["id"][] {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((id): id is ChatPluginDefinition["id"] =>
      CHAT_PLUGINS.some((plugin) => plugin.id === id)
    );
  } catch {
    return [];
  }
}

export function setPluginInstalled(id: ChatPluginDefinition["id"], installed: boolean) {
  const current = new Set(getInstalledPluginIds());
  if (installed) current.add(id);
  else current.delete(id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useInstalledPluginIds() {
  const [installed, setInstalled] = useState<ChatPluginDefinition["id"][]>(getInstalledPluginIds);
  useEffect(() => {
    const refresh = () => setInstalled(getInstalledPluginIds());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return installed;
}
