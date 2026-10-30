import { randomUUID } from "node:crypto";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import {
  asDatabaseClient,
  type DatabaseClient,
} from "../../../platform/database/databaseClient.js";

export type SkillScope = "builtin" | "org" | "user" | "directory";
export type SkillApprovalStatus = "draft" | "pending_review" | "approved" | "rejected";

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  scope: SkillScope;
  ownerId: string | null;
  orgId: string | null;
  storagePath: string;
  version: number;
  isActive: boolean;
  icon?: string | null;
  author?: string | null;
  sourceLabel?: string | null;
  changelog?: string | null;
  toolsRequired?: string[] | null;
  approvalStatus?: SkillApprovalStatus;
  rejectionReason?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SkillFileRecord {
  id: string;
  skillId: string;
  relativePath: string;
  sizeBytes: number;
  sha256: string;
  createdAt: number;
}

export interface ConversationSkillRecord {
  conversationId: string;
  skillId: string;
  enabledAt: number;
  enabledBy: string;
  explicitlySelected: boolean;
  preloadedAt: number | null;
  source: "direct" | "project";
}

export interface ProjectSkillRecord {
  projectId: string;
  skillId: string;
}

export interface SkillUsageRecord {
  id: string;
  conversationId: string | null;
  skill: string;
  userId: string | null;
  timestamp: number;
  toolName?: string;
  durationMs?: number | null;
  outcome?: "success" | "error" | "timeout";
}

export interface CreateSkillInput {
  id?: string | undefined;
  name: string;
  description: string;
  scope: SkillScope;
  ownerId?: string | null | undefined;
  orgId?: string | null | undefined;
  storagePath: string;
  version?: number | undefined;
  isActive?: boolean | undefined;
  icon?: string | null | undefined;
  author?: string | null | undefined;
  sourceLabel?: string | null | undefined;
  changelog?: string | null | undefined;
  toolsRequired?: string[] | null | undefined;
  approvalStatus?: SkillApprovalStatus | undefined;
  rejectionReason?: string | null | undefined;
}

export interface ListVisibleSkillsOptions {
  scope?: SkillScope | undefined;
  query?: string | undefined;
  skillId?: string | undefined;
}

export class SkillRepository {
  private readonly db: DatabaseClient;

  constructor(db?: DatabaseClient | BetterSqliteDatabase) {
    this.db = asDatabaseClient(db);
  }

  private mapSkill(row: Record<string, unknown>): SkillRecord {
    let toolsRequired: string[] | null = null;
    if (row["tools_required"]) {
      try {
        toolsRequired = JSON.parse(String(row["tools_required"])) as string[];
      } catch {
        toolsRequired = null;
      }
    }

    return {
      id: String(row["id"]),
      name: String(row["name"]),
      description: String(row["description"]),
      scope: row["scope"] as SkillScope,
      ownerId: row["owner_id"] ? String(row["owner_id"]) : null,
      orgId: row["org_id"] ? String(row["org_id"]) : null,
      storagePath: String(row["storage_path"] || ""),
      version: Number(row["version"] ?? 1),
      isActive: Boolean(row["is_active"] ?? 1),
      icon: row["icon"] ? String(row["icon"]) : null,
      author: row["author"] ? String(row["author"]) : null,
      sourceLabel: row["source_label"] ? String(row["source_label"]) : null,
      changelog: row["changelog"] ? String(row["changelog"]) : null,
      toolsRequired,
      approvalStatus: (row["approval_status"] as SkillApprovalStatus) || "approved",
      rejectionReason: row["rejection_reason"] ? String(row["rejection_reason"]) : null,
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
    };
  }

  private mapFile(row: Record<string, unknown>): SkillFileRecord {
    return {
      id: String(row["id"]),
      skillId: String(row["skill_id"]),
      relativePath: String(row["relative_path"]),
      sizeBytes: Number(row["size_bytes"]),
      sha256: String(row["sha256"]),
      createdAt: Number(row["created_at"]),
    };
  }

  async create(input: CreateSkillInput): Promise<SkillRecord> {
    const id = input.id || randomUUID();
    const now = Date.now();
    const version = input.version ?? 1;
    const isActive = input.isActive !== undefined ? (input.isActive ? 1 : 0) : 1;
    const toolsRequiredStr = input.toolsRequired ? JSON.stringify(input.toolsRequired) : null;
    const approvalStatus = input.approvalStatus ?? "approved";

    await this.db
      .prepare(
        `INSERT INTO skills (
          id, name, description, scope, owner_id, org_id, storage_path, version, is_active,
          icon, author, source_label, changelog, tools_required, approval_status, rejection_reason,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.name,
        input.description,
        input.scope,
        input.ownerId ?? null,
        input.orgId ?? null,
        input.storagePath,
        version,
        isActive,
        input.icon ?? null,
        input.author ?? null,
        input.sourceLabel ?? null,
        input.changelog ?? null,
        toolsRequiredStr,
        approvalStatus,
        input.rejectionReason ?? null,
        now,
        now
      );

    return (await this.get(id))!;
  }

  async get(id: string): Promise<SkillRecord | null> {
    const row = (await this.db.prepare(`SELECT * FROM skills WHERE id = ?`).get(id)) as
      Record<string, unknown> | undefined;

    return row ? this.mapSkill(row) : null;
  }

  async getByNameAndScope(
    name: string,
    scope: SkillScope,
    ownerId?: string | null,
    orgId?: string | null
  ): Promise<SkillRecord | null> {
    const row = (await this.db
      .prepare(
        `SELECT * FROM skills
         WHERE name = ? AND scope = ? AND COALESCE(owner_id, '') = ? AND COALESCE(org_id, '') = ?`
      )
      .get(name, scope, ownerId || "", orgId || "")) as Record<string, unknown> | undefined;

    return row ? this.mapSkill(row) : null;
  }

  async listVisible(
    userId: string,
    orgId?: string | null,
    options?: ListVisibleSkillsOptions
  ): Promise<SkillRecord[]> {
    const conditions: string[] = ["is_active = 1"];
    const params: unknown[] = [];

    // Visible:
    // - Built-in: only if approved
    // - User: owned by user
    // - Org: owned by user's org AND (approved OR author is user)
    // - Directory: approved OR author is user
    const visibilityClauses: string[] = [
      `(
        scope = 'builtin' AND approval_status = 'approved'
        AND NOT EXISTS (
          SELECT 1
          FROM skills directory_copy
          WHERE directory_copy.name = skills.name
            AND directory_copy.scope = 'directory'
            AND directory_copy.is_active = 1
            AND directory_copy.approval_status = 'approved'
        )
      )`,
      "(scope = 'user' AND owner_id = ?)",
      "(scope = 'directory' AND (approval_status = 'approved' OR owner_id = ?))",
    ];
    params.push(userId, userId);

    if (orgId) {
      visibilityClauses.push(
        "(scope = 'org' AND org_id = ? AND (approval_status = 'approved' OR owner_id = ?))"
      );
      params.push(orgId, userId);
    } else {
      visibilityClauses.push("(scope = 'org' AND owner_id = ?)");
      params.push(userId);
    }

    conditions.push(`(${visibilityClauses.join(" OR ")})`);

    if (options?.scope) {
      conditions.push("scope = ?");
      params.push(options.scope);
    }

    if (options?.query && options.query.trim()) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      const term = `%${options.query.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    if (options?.skillId) {
      conditions.push("id = ?");
      params.push(options.skillId);
    }

    const sql = `
      SELECT *
      FROM skills
      WHERE ${conditions.join(" AND ")}
      ORDER BY scope = 'builtin' DESC, scope = 'org' DESC, name ASC
    `;

    const rows = (await this.db.prepare(sql).all(...params)) as Array<Record<string, unknown>>;
    return rows.map((row) => this.mapSkill(row));
  }

  async getVisibleSkill(
    skillId: string,
    userId: string,
    orgId?: string | null
  ): Promise<SkillRecord | null> {
    return (await this.listVisible(userId, orgId, { skillId }))[0] ?? null;
  }

  async update(
    id: string,
    updates: Partial<{
      description: string;
      storagePath: string;
      version: number;
      isActive: boolean;
    }>
  ): Promise<SkillRecord | null> {
    const existing = await this.get(id);
    if (!existing) return null;

    const sets: string[] = ["updated_at = ?"];
    const params: unknown[] = [Date.now()];

    if (updates.description !== undefined) {
      sets.push("description = ?");
      params.push(updates.description);
    }
    if (updates.storagePath !== undefined) {
      sets.push("storage_path = ?");
      params.push(updates.storagePath);
    }
    if (updates.version !== undefined) {
      sets.push("version = ?");
      params.push(updates.version);
    }
    if (updates.isActive !== undefined) {
      sets.push("is_active = ?");
      params.push(updates.isActive ? 1 : 0);
    }

    params.push(id);

    await this.db.prepare(`UPDATE skills SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    return await this.get(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.prepare("DELETE FROM skills WHERE id = ?").run(id);
    return res.changes > 0;
  }

  async addFiles(
    skillId: string,
    files: Array<{ relativePath: string; sizeBytes: number; sha256: string }>
  ): Promise<SkillFileRecord[]> {
    const now = Date.now();
    const insert = this.db.prepare(
      `INSERT INTO skill_files (id, skill_id, relative_path, size_bytes, sha256, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const inserted: SkillFileRecord[] = [];
    const transaction = this.db.transaction(async () => {
      for (const file of files) {
        const id = randomUUID();
        await insert.run(id, skillId, file.relativePath, file.sizeBytes, file.sha256, now);
        inserted.push({
          id,
          skillId,
          relativePath: file.relativePath,
          sizeBytes: file.sizeBytes,
          sha256: file.sha256,
          createdAt: now,
        });
      }
    });

    await transaction();
    return inserted;
  }

  async replaceFiles(
    skillId: string,
    files: Array<{ relativePath: string; sizeBytes: number; sha256: string }>
  ): Promise<SkillFileRecord[]> {
    const transaction = this.db.transaction(async () => {
      await this.db.prepare("DELETE FROM skill_files WHERE skill_id = ?").run(skillId);
      return await this.addFiles(skillId, files);
    });
    return await transaction();
  }

  async listFiles(skillId: string): Promise<SkillFileRecord[]> {
    const rows = (await this.db
      .prepare(
        `SELECT id, skill_id, relative_path, size_bytes, sha256, created_at
         FROM skill_files WHERE skill_id = ? ORDER BY relative_path ASC`
      )
      .all(skillId)) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapFile(row));
  }

  private async listConversationSkillLinks(conversationId: string): Promise<SkillRecord[]> {
    const rows = (await this.db
      .prepare(
        `SELECT s.id, s.name, s.description, s.scope, s.owner_id, s.org_id, s.storage_path, s.version, s.is_active, s.created_at, s.updated_at
         FROM skills s
         JOIN conversation_skills cs ON cs.skill_id = s.id
         WHERE cs.conversation_id = ? AND s.is_active = 1
         ORDER BY s.name ASC`
      )
      .all(conversationId)) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapSkill(row));
  }

  private async visibleSkillIds(userId: string, orgId?: string | null): Promise<Set<string>> {
    return new Set((await this.listVisible(userId, orgId)).map((skill) => skill.id));
  }

  async getConversationSkills(
    conversationId: string,
    userId?: string | null,
    orgId?: string | null
  ): Promise<SkillRecord[]> {
    if (!userId || !(await this.ownsConversation(conversationId, userId))) return [];
    const [linkedSkills, visibleIds] = await Promise.all([
      this.listConversationSkillLinks(conversationId),
      this.visibleSkillIds(userId, orgId),
    ]);
    return linkedSkills.filter((skill) => visibleIds.has(skill.id));
  }

  async ownsConversation(conversationId: string, userId: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT 1 AS owned FROM conversations WHERE id = ? AND user_id = ?")
      .get(conversationId, userId);
    return Boolean(row);
  }

  async ownsProject(projectId: string, userId: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT 1 AS owned FROM project_snapshots WHERE project_id = ? AND user_id = ?")
      .get(projectId, userId);
    return Boolean(row);
  }

  async setConversationSkills(
    conversationId: string,
    skillIds: string[],
    enabledBy: string,
    options?: { explicitlySelected?: boolean; source?: "direct" | "project"; orgId?: string | null }
  ): Promise<SkillRecord[]> {
    const now = Date.now();
    const isExplicit = options?.explicitlySelected ?? false;
    const src = options?.source ?? "direct";

    const transaction = this.db.transaction(async () => {
      // Ensure conversation exists so foreign key succeeds even for guest/unauthenticated testing
      await this.db
        .prepare(
          `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
           VALUES (?, ?, 'Chat', 'default', ?, ?) ON CONFLICT(id) DO NOTHING`
        )
        .run(conversationId, enabledBy || "guest", now, now);

      await this.db
        .prepare("DELETE FROM conversation_skills WHERE conversation_id = ?")
        .run(conversationId);
      const insert = this.db.prepare(
        `INSERT INTO conversation_skills (
          conversation_id, skill_id, enabled_at, enabled_by, explicitly_selected, preloaded_at, source
        ) VALUES (?, ?, ?, ?, ?, NULL, ?)`
      );
      for (const skillId of skillIds) {
        await insert.run(
          conversationId,
          skillId,
          now,
          enabledBy || "guest",
          isExplicit ? 1 : 0,
          src
        );
      }
    });
    await transaction();
    return await this.getConversationSkills(conversationId, enabledBy, options?.orgId);
  }

  async getConversationSkillMeta(
    conversationId: string,
    skillId: string
  ): Promise<ConversationSkillRecord | null> {
    const row = (await this.db
      .prepare(
        `SELECT conversation_id, skill_id, enabled_at, enabled_by, explicitly_selected, preloaded_at, source
         FROM conversation_skills WHERE conversation_id = ? AND skill_id = ?`
      )
      .get(conversationId, skillId)) as Record<string, unknown> | undefined;

    if (!row) return null;
    return {
      conversationId: String(row["conversation_id"]),
      skillId: String(row["skill_id"]),
      enabledAt: Number(row["enabled_at"]),
      enabledBy: String(row["enabled_by"]),
      explicitlySelected: Boolean(row["explicitly_selected"]),
      preloadedAt: row["preloaded_at"] ? Number(row["preloaded_at"]) : null,
      source: (row["source"] as "direct" | "project") || "direct",
    };
  }

  async markSkillPreloaded(conversationId: string, skillId: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE conversation_skills SET preloaded_at = ? WHERE conversation_id = ? AND skill_id = ?`
      )
      .run(Date.now(), conversationId, skillId);
  }

  async getUnpreloadedExplicitSkills(
    conversationId: string,
    userId?: string | null,
    orgId?: string | null
  ): Promise<SkillRecord[]> {
    if (!userId || !(await this.ownsConversation(conversationId, userId))) return [];
    const rows = (await this.db
      .prepare(
        `SELECT s.*
         FROM skills s
         JOIN conversation_skills cs ON cs.skill_id = s.id
         WHERE cs.conversation_id = ? AND cs.explicitly_selected = 1 AND cs.preloaded_at IS NULL AND s.is_active = 1
         ORDER BY cs.enabled_at ASC`
      )
      .all(conversationId)) as Array<Record<string, unknown>>;

    const visibleIds = await this.visibleSkillIds(userId, orgId);
    return rows.map((row) => this.mapSkill(row)).filter((skill) => visibleIds.has(skill.id));
  }

  async inheritProjectSkills(
    conversationId: string,
    projectId: string,
    userId: string,
    orgId?: string | null
  ): Promise<SkillRecord[]> {
    const projectSkills = await this.getProjectSkills(userId, projectId, orgId);
    const now = Date.now();

    const transaction = this.db.transaction(async () => {
      await this.db
        .prepare(
          `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
           VALUES (?, ?, 'Chat', 'default', ?, ?) ON CONFLICT(id) DO NOTHING`
        )
        .run(conversationId, userId || "guest", now, now);

      const insert = this.db.prepare(
        `INSERT INTO conversation_skills (
          conversation_id, skill_id, enabled_at, enabled_by, explicitly_selected, preloaded_at, source
        ) VALUES (?, ?, ?, ?, 0, NULL, 'project') ON CONFLICT(conversation_id, skill_id) DO NOTHING`
      );

      for (const skill of projectSkills) {
        await insert.run(conversationId, skill.id, now, userId || "guest");
      }
    });

    await transaction();
    return await this.getConversationSkills(conversationId, userId, orgId);
  }

  async removeProjectSourcedConversationSkills(conversationId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM conversation_skills WHERE conversation_id = ? AND source = 'project'`)
      .run(conversationId);
  }

  private async listProjectSkillLinks(userId: string, projectId: string): Promise<SkillRecord[]> {
    const rows = (await this.db
      .prepare(
        `SELECT s.id, s.name, s.description, s.scope, s.owner_id, s.org_id, s.storage_path, s.version, s.is_active, s.created_at, s.updated_at
         FROM skills s
         JOIN project_skills ps ON ps.skill_id = s.id
         WHERE ps.user_id = ? AND ps.project_id = ? AND s.is_active = 1
         ORDER BY s.name ASC`
      )
      .all(userId, projectId)) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapSkill(row));
  }

  async getProjectSkills(
    userId: string | null | undefined,
    projectId: string,
    orgId?: string | null
  ): Promise<SkillRecord[]> {
    if (!userId || !(await this.ownsProject(projectId, userId))) return [];
    const [linkedSkills, visibleIds] = await Promise.all([
      this.listProjectSkillLinks(userId, projectId),
      this.visibleSkillIds(userId, orgId),
    ]);
    return linkedSkills.filter((skill) => visibleIds.has(skill.id));
  }

  async setProjectSkills(
    userId: string,
    projectId: string,
    skillIds: string[],
    orgId?: string | null
  ): Promise<SkillRecord[]> {
    const transaction = this.db.transaction(async () => {
      await this.db
        .prepare("DELETE FROM project_skills WHERE user_id = ? AND project_id = ?")
        .run(userId, projectId);
      const insert = this.db.prepare(
        `INSERT INTO project_skills (user_id, project_id, skill_id) VALUES (?, ?, ?)`
      );
      for (const skillId of skillIds) {
        await insert.run(userId, projectId, skillId);
      }
    });
    await transaction();
    return await this.getProjectSkills(userId, projectId, orgId);
  }

  async logUsage(
    conversationId: string | null,
    skill: string,
    userId?: string | null,
    toolName: string = "Skill",
    durationMs: number | null = null,
    outcome: "success" | "error" | "timeout" = "success"
  ): Promise<SkillUsageRecord> {
    const id = randomUUID();
    const timestamp = Date.now();

    if (conversationId) {
      await this.db
        .prepare(
          `INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
           VALUES (?, ?, 'Chat', 'default', ?, ?) ON CONFLICT(id) DO NOTHING`
        )
        .run(conversationId, userId || "guest", timestamp, timestamp);
    }

    await this.db
      .prepare(
        `INSERT INTO skill_usage (id, conversation_id, skill, user_id, timestamp, tool_name, duration_ms, outcome)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, conversationId, skill, userId ?? null, timestamp, toolName, durationMs, outcome);

    return {
      id,
      conversationId,
      skill,
      userId: userId ?? null,
      timestamp,
      toolName,
      durationMs,
      outcome,
    };
  }

  async getAnalytics(days: number = 30): Promise<{
    topSkills: Array<{ skill: string; callCount: number; failureCount: number }>;
    callsPerDay: Array<{ date: string; calls: number }>;
    failureRate: number;
    totalCalls: number;
    totalToolLoops: number;
    averageIterations: number;
  }> {
    const sinceTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

    const topSkillsRows = (await this.db
      .prepare(
        `SELECT skill,
                COUNT(*) as call_count,
                SUM(CASE WHEN outcome != 'success' THEN 1 ELSE 0 END) as failure_count
         FROM skill_usage
         WHERE timestamp >= ?
         GROUP BY skill
         ORDER BY call_count DESC
         LIMIT 10`
      )
      .all(sinceTimestamp)) as Array<Record<string, unknown>>;

    const topSkills = topSkillsRows.map((r) => ({
      skill: String(r["skill"]),
      callCount: Number(r["call_count"] || 0),
      failureCount: Number(r["failure_count"] || 0),
    }));

    const callsPerDayRows = (await this.db
      .prepare("SELECT timestamp FROM skill_usage WHERE timestamp >= ?")
      .all(sinceTimestamp)) as Array<Record<string, unknown>>;
    const callsByDate = new Map<string, number>();
    for (const row of callsPerDayRows) {
      const date = new Date(Number(row["timestamp"])).toISOString().slice(0, 10);
      callsByDate.set(date, (callsByDate.get(date) ?? 0) + 1);
    }
    const callsPerDay = [...callsByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, calls]) => ({ date, calls }));

    const totalsRow = (await this.db
      .prepare(
        `SELECT COUNT(*) as total_calls,
                SUM(CASE WHEN outcome != 'success' THEN 1 ELSE 0 END) as failure_calls,
                COUNT(DISTINCT conversation_id) as total_conversations
         FROM skill_usage
         WHERE timestamp >= ?`
      )
      .get(sinceTimestamp)) as Record<string, unknown> | undefined;

    const totalCalls = Number(totalsRow?.["total_calls"] || 0);
    const failureCalls = Number(totalsRow?.["failure_calls"] || 0);
    const totalConversations = Number(totalsRow?.["total_conversations"] || 1);
    const failureRate = totalCalls > 0 ? failureCalls / totalCalls : 0;
    const averageIterations =
      totalCalls > 0 ? Number((totalCalls / Math.max(1, totalConversations)).toFixed(2)) : 0;

    return {
      topSkills,
      callsPerDay,
      failureRate: Number(failureRate.toFixed(4)),
      totalCalls,
      totalToolLoops: totalConversations,
      averageIterations,
    };
  }

  async listUsage(conversationId: string): Promise<SkillUsageRecord[]> {
    const rows = (await this.db
      .prepare(
        `SELECT id, conversation_id, skill, user_id, timestamp, tool_name, duration_ms, outcome
         FROM skill_usage WHERE conversation_id = ? ORDER BY timestamp DESC`
      )
      .all(conversationId)) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row["id"]),
      conversationId: row["conversation_id"] ? String(row["conversation_id"]) : null,
      skill: String(row["skill"]),
      userId: row["user_id"] ? String(row["user_id"]) : null,
      timestamp: Number(row["timestamp"]),
      toolName: row["tool_name"] ? String(row["tool_name"]) : "Skill",
      durationMs: row["duration_ms"] != null ? Number(row["duration_ms"]) : null,
      outcome: (row["outcome"] as "success" | "error" | "timeout") || "success",
    }));
  }

  // --- Skill Versions History ---
  async recordSkillVersion(
    skillId: string,
    version: number,
    changelog: string | null,
    fileManifest: SkillFileRecord[]
  ): Promise<void> {
    const id = randomUUID();
    const manifestJson = JSON.stringify(
      fileManifest.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );
    await this.db
      .prepare(
        `INSERT INTO skill_versions (id, skill_id, version, changelog, file_manifest, created_at)
         VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(skill_id, version) DO UPDATE SET id = EXCLUDED.id, changelog = EXCLUDED.changelog, file_manifest = EXCLUDED.file_manifest, created_at = EXCLUDED.created_at`
      )
      .run(id, skillId, version, changelog, manifestJson, Date.now());
  }

  async listSkillVersions(skillId: string): Promise<
    Array<{
      id: string;
      version: number;
      changelog: string | null;
      fileManifest: unknown[];
      createdAt: number;
    }>
  > {
    const rows = (await this.db
      .prepare(
        `SELECT id, version, changelog, file_manifest, created_at
         FROM skill_versions WHERE skill_id = ? ORDER BY version DESC`
      )
      .all(skillId)) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r["id"]),
      version: Number(r["version"]),
      changelog: r["changelog"] ? String(r["changelog"]) : null,
      fileManifest: r["file_manifest"] ? JSON.parse(String(r["file_manifest"])) : [],
      createdAt: Number(r["created_at"]),
    }));
  }

  // --- Agents Support ---
  async saveSkillAgents(
    skillId: string,
    agents: Array<{ name: string; description: string; tools: string[]; systemPrompt: string }>
  ): Promise<void> {
    const transaction = this.db.transaction(async () => {
      await this.db.prepare("DELETE FROM skill_agents WHERE skill_id = ?").run(skillId);
      const insert = this.db.prepare(
        `INSERT INTO skill_agents (id, skill_id, name, description, tools, system_prompt, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const agent of agents) {
        await insert.run(
          randomUUID(),
          skillId,
          agent.name,
          agent.description,
          JSON.stringify(agent.tools),
          agent.systemPrompt,
          Date.now()
        );
      }
    });
    await transaction();
  }

  async listSkillAgents(skillId: string): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      tools: string[];
      systemPrompt: string;
    }>
  > {
    const rows = (await this.db
      .prepare(
        `SELECT id, name, description, tools, system_prompt
         FROM skill_agents WHERE skill_id = ? ORDER BY name ASC`
      )
      .all(skillId)) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r["id"]),
      name: String(r["name"]),
      description: String(r["description"] || ""),
      tools: r["tools"] ? (JSON.parse(String(r["tools"])) as string[]) : [],
      systemPrompt: String(r["system_prompt"] || ""),
    }));
  }

  // --- Categories & Directory ---
  async ensureCategory(name: string, description?: string): Promise<string> {
    const existing = (await this.db
      .prepare("SELECT id FROM categories WHERE name = ?")
      .get(name)) as { id: string } | undefined;
    if (existing) return existing.id;

    const id = randomUUID();
    await this.db
      .prepare("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)")
      .run(id, name, description ?? null);
    return id;
  }

  async linkSkillCategory(skillId: string, categoryId: string): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO skill_categories (skill_id, category_id) VALUES (?, ?) ON CONFLICT(skill_id, category_id) DO NOTHING"
      )
      .run(skillId, categoryId);
  }

  async getSkillCategories(skillId: string): Promise<string[]> {
    const rows = (await this.db
      .prepare(
        `SELECT c.name
         FROM categories c
         JOIN skill_categories sc ON sc.category_id = c.id
         WHERE sc.skill_id = ?`
      )
      .all(skillId)) as Array<{ name: string }>;
    return rows.map((r) => r.name);
  }

  async listCategories(): Promise<Array<{ id: string; name: string; description: string }>> {
    const rows = (await this.db
      .prepare("SELECT id, name, description FROM categories ORDER BY name ASC")
      .all()) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r["id"]),
      name: String(r["name"]),
      description: String(r["description"] || ""),
    }));
  }

  async listDirectorySkills(options?: {
    category?: string | undefined;
    query?: string | undefined;
  }): Promise<SkillRecord[]> {
    let sql = `
      SELECT DISTINCT s.*
      FROM skills s
      LEFT JOIN skill_categories sc ON sc.skill_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      WHERE s.scope IN ('directory', 'builtin') AND s.is_active = 1 AND s.approval_status = 'approved'
        AND NOT (
          s.scope = 'builtin' AND EXISTS (
            SELECT 1
            FROM skills directory_copy
            WHERE directory_copy.name = s.name
              AND directory_copy.scope = 'directory'
              AND directory_copy.is_active = 1
              AND directory_copy.approval_status = 'approved'
          )
        )
    `;
    const params: unknown[] = [];

    if (options?.category && options.category !== "All") {
      sql += " AND c.name = ?";
      params.push(options.category);
    }

    if (options?.query && options.query.trim()) {
      sql += " AND (s.name LIKE ? OR s.description LIKE ?)";
      const term = `%${options.query.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    sql += " ORDER BY s.name ASC";

    const rows = (await this.db.prepare(sql).all(...params)) as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapSkill(r));
  }

  async updateApprovalStatus(
    id: string,
    status: SkillApprovalStatus,
    rejectionReason: string | null = null,
    targetScope?: SkillScope
  ): Promise<SkillRecord | null> {
    const existing = await this.get(id);
    if (!existing) return null;

    const sets: string[] = ["approval_status = ?", "rejection_reason = ?", "updated_at = ?"];
    const params: unknown[] = [status, rejectionReason, Date.now()];

    if (targetScope) {
      sets.push("scope = ?");
      params.push(targetScope);
    }

    params.push(id);
    await this.db.prepare(`UPDATE skills SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    return await this.get(id);
  }

  async listPendingApproval(): Promise<SkillRecord[]> {
    const rows = (await this.db
      .prepare(
        "SELECT * FROM skills WHERE approval_status = 'pending_review' ORDER BY updated_at DESC"
      )
      .all()) as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapSkill(r));
  }

  async addDirectorySkillToUserLibrary(
    directorySkillId: string,
    userId: string
  ): Promise<SkillRecord> {
    const dirSkill = await this.get(directorySkillId);
    if (!dirSkill) {
      throw new Error("Directory skill not found.");
    }

    // Check if user already has a copy in their library
    const existing = await this.getByNameAndScope(dirSkill.name, "user", userId);
    if (existing) return existing;

    // Create a copy in user library referencing storagePath and metadata
    const userCopy = await this.create({
      name: dirSkill.name,
      description: dirSkill.description,
      scope: "user",
      ownerId: userId,
      storagePath: dirSkill.storagePath,
      version: dirSkill.version,
      icon: dirSkill.icon,
      author: dirSkill.author,
      sourceLabel: dirSkill.sourceLabel || "from Directory",
      changelog: dirSkill.changelog,
      toolsRequired: dirSkill.toolsRequired,
      approvalStatus: "approved",
    });

    // Copy file records
    const files = await this.listFiles(directorySkillId);
    await this.addFiles(
      userCopy.id,
      files.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );

    // Copy agent records if any
    const agents = await this.listSkillAgents(directorySkillId);
    if (agents.length > 0) {
      await this.saveSkillAgents(userCopy.id, agents);
    }

    return userCopy;
  }
}
