import { getFirebaseIdToken } from "../../../app/integrations/workspaceLiveSync";

export type SkillScope = "builtin" | "org" | "user" | "directory";

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  scope: SkillScope;
  version: number;
  ownerId?: string | null;
  orgId?: string | null;
  icon?: string | null;
  author?: string | null;
  sourceLabel?: string | null;
  changelog?: string | null;
  toolsRequired?: string[] | null;
  categories?: string[] | null;
  approvalStatus?: string;
  source?: "direct" | "project";
  explicitlySelected?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface SkillDetail extends SkillItem {
  files: Array<{
    id: string;
    relativePath: string;
    sizeBytes: number;
    sha256: string;
  }>;
}

export interface SkillVersion {
  id: string;
  version: number;
  changelog: string | null;
  fileManifest: unknown[];
  createdAt: number;
}

export interface SkillContents extends SkillItem {
  categories: string[];
  agents: Array<{
    id: string;
    name: string;
    description: string;
    tools: string[];
    systemPrompt: string;
  }>;
  files: Array<{
    relativePath: string;
    sizeBytes: number;
    sha256: string;
    isText: boolean;
    content: string | null;
  }>;
}

export interface SkillAnalytics {
  topSkills: Array<{ skill: string; callCount: number; failureCount: number }>;
  callsPerDay: Array<{ date: string; calls: number }>;
  failureRate: number;
  totalCalls: number;
  totalToolLoops: number;
  averageIterations: number;
}

const LOCAL_SKILLS_PREFIX = "openedup_skills_";

/**
 * Independent safe fetch: attaches Firebase token if available,
 * but never throws or requires authentication so features can be tested freely.
 */
async function safeFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    const token = await getFirebaseIdToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    // Auth optional for independent feature testing
  }
  return fetch(input, { ...init, headers });
}

export async function getSkills(params?: { scope?: string; q?: string }): Promise<SkillItem[]> {
  const query = new URLSearchParams();
  if (params?.scope) query.set("scope", params.scope);
  if (params?.q) query.set("q", params.q);

  const url = `/api/skills${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await safeFetch(url);
  if (!res.ok) throw new Error(`Failed to load skills (${res.status})`);
  const data = await res.json();
  return data.skills || [];
}

export async function getDirectorySkills(params?: {
  category?: string;
  q?: string;
}): Promise<SkillItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.q) query.set("q", params.q);

  const url = `/api/directory/skills${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await safeFetch(url);
  if (!res.ok) throw new Error(`Failed to load directory skills (${res.status})`);
  const data = await res.json();
  return data.skills || [];
}

export async function getDirectoryCategories(): Promise<
  Array<{ id: string; name: string; description: string }>
> {
  const res = await safeFetch("/api/directory/categories");
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories || [];
}

export async function addDirectorySkillToLibrary(id: string): Promise<SkillItem> {
  const res = await safeFetch(`/api/directory/skills/${encodeURIComponent(id)}/add-to-library`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to add skill to library");
  const data = await res.json();
  return data.skill;
}

export async function getSkillVersions(id: string): Promise<SkillVersion[]> {
  const res = await safeFetch(`/api/skills/${encodeURIComponent(id)}/versions`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.versions || [];
}

export async function getSkillContents(id: string): Promise<SkillContents> {
  const res = await safeFetch(`/api/skills/${encodeURIComponent(id)}/contents`);
  if (!res.ok) throw new Error("Failed to load skill contents");
  const data = await res.json();
  return data.skill;
}

export async function getSkill(id: string): Promise<SkillDetail> {
  const res = await safeFetch(`/api/skills/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to load skill (${res.status})`);
  const data = await res.json();
  return data.skill;
}

export async function uploadSkill(file: File, scope: SkillScope = "user"): Promise<SkillItem> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("scope", scope);

  const res = await safeFetch("/api/skills", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.skill;
}

export async function submitSkillForReview(id: string, targetScope?: string): Promise<SkillItem> {
  const res = await safeFetch(`/api/skills/${encodeURIComponent(id)}/submit-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetScope }),
  });
  if (!res.ok) throw new Error("Failed to submit skill for review");
  const data = await res.json();
  return data.skill;
}

export async function approveSkill(id: string): Promise<SkillItem> {
  const res = await safeFetch(`/api/skills/${encodeURIComponent(id)}/approve`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to approve skill");
  const data = await res.json();
  return data.skill;
}

export async function rejectSkill(id: string, reason: string): Promise<SkillItem> {
  const res = await safeFetch(`/api/skills/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to reject skill");
  const data = await res.json();
  return data.skill;
}

export async function getAdminQueue(): Promise<SkillItem[]> {
  const res = await safeFetch("/api/admin/skills/queue");
  if (!res.ok) return [];
  const data = await res.json();
  return data.queue || [];
}

export async function validateSkillDraft(draft: {
  name: string;
  description: string;
  skillMd: string;
  files?: Array<{ relativePath: string; content: string }>;
}): Promise<{
  valid: boolean;
  errors: string[];
  quality: { score: "poor" | "fair" | "good"; hint: string; suggestions: string[] };
}> {
  const res = await safeFetch("/api/skills/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) {
    return {
      valid: false,
      errors: ["Validation request failed"],
      quality: { score: "poor", hint: "Unable to evaluate quality", suggestions: [] },
    };
  }
  return res.json();
}

export async function createSkillFromJson(payload: {
  name: string;
  description: string;
  skillMd: string;
  files?: Array<{ relativePath: string; content: string }>;
  scope?: SkillScope;
  approvalStatus?: "draft" | "pending_review" | "approved";
}): Promise<SkillItem> {
  const res = await safeFetch("/api/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Creation failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.skill;
}

export async function testScratchSkill(
  draft: {
    name: string;
    description: string;
    skillMd: string;
    files?: Array<{ relativePath: string; content: string }>;
  },
  prompt: string
): Promise<{
  success: boolean;
  scratchConversationId: string;
  toolTraces: Array<{
    toolName: string;
    input: Record<string, unknown>;
    output: string;
    isError: boolean;
  }>;
  finalText: string;
  iterations: number;
}> {
  const res = await safeFetch("/api/skills/test-scratch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, prompt }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Scratch test failed with status ${res.status}`);
  }
  return res.json();
}

export async function getSkillsAnalytics(days = 30): Promise<SkillAnalytics | null> {
  const res = await safeFetch(`/api/skills/analytics?days=${days}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.analytics;
}

export async function deleteSkill(id: string): Promise<void> {
  const res = await safeFetch(`/api/skills/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
}

export async function getConversationSkills(conversationId?: string): Promise<SkillItem[]> {
  const targetId = conversationId || "default";

  try {
    const res = await safeFetch(`/api/conversations/${encodeURIComponent(targetId)}/skills`);
    if (res.ok) {
      const data = await res.json();
      return data.skills || [];
    }
  } catch {
    // Fall back to local storage
  }

  try {
    const saved = localStorage.getItem(`${LOCAL_SKILLS_PREFIX}${targetId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function setConversationSkills(
  conversationId: string | undefined,
  skillIds: string[]
): Promise<SkillItem[]> {
  const targetId = conversationId || "default";
  let skills: SkillItem[] = [];

  try {
    const res = await safeFetch(`/api/conversations/${encodeURIComponent(targetId)}/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill_ids: skillIds }),
    });

    if (res.ok) {
      const data = await res.json();
      skills = data.skills || [];
    }
  } catch {
    // Continue with local storage persistence
  }

  try {
    localStorage.setItem(`${LOCAL_SKILLS_PREFIX}${targetId}`, JSON.stringify(skills));
  } catch {
    /* ignore */
  }

  return skills;
}

export async function getProjectSkills(projectId: string): Promise<SkillItem[]> {
  const res = await safeFetch(`/api/projects/${encodeURIComponent(projectId)}/skills`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.skills || [];
}

export async function syncConversationProjectSkills(
  conversationId: string,
  projectId: string
): Promise<{ skills: SkillItem[]; synced: boolean }> {
  const res = await safeFetch(
    `/api/conversations/${encodeURIComponent(conversationId)}/skills/sync-project`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }
  );
  if (!res.ok) throw new Error("Failed to sync project skills");
  return await res.json();
}

export async function setProjectSkills(
  projectId: string,
  skillIds: string[]
): Promise<SkillItem[]> {
  const res = await safeFetch(`/api/projects/${encodeURIComponent(projectId)}/skills`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill_ids: skillIds }),
  });
  if (!res.ok) throw new Error("Failed to set project skills");
  const data = await res.json();
  return data.skills || [];
}
