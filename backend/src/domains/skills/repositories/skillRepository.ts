import { randomUUID } from "node:crypto";
import { getChatDatabase, type ChatDatabase } from "../../../platform/database/chatDatabase.js";

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
}

export class SkillRepository {
  constructor(private readonly db: ChatDatabase = getChatDatabase()) {}

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

  create(input: CreateSkillInput): SkillRecord {
    const id = input.id || randomUUID();
    const now = Date.now();
    const version = input.version ?? 1;
    const isActive = input.isActive !== undefined ? (input.isActive ? 1 : 0) : 1;
    const toolsRequiredStr = input.toolsRequired ? JSON.stringify(input.toolsRequired) : null;
    const approvalStatus = input.approvalStatus ?? "approved";

    this.db
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

    return this.get(id)!;
  }

  get(id: string): SkillRecord | null {
    const row = this.db.prepare(`SELECT * FROM skills WHERE id = ?`).get(id) as
      Record<string, unknown> | undefined;

    return row ? this.mapSkill(row) : null;
  }

  getByNameAndScope(
    name: string,
    scope: SkillScope,
    ownerId?: string | null,
    orgId?: string | null
  ): SkillRecord | null {
    const row = this.db
      .prepare(
        `SELECT * FROM skills
         WHERE name = ? AND scope = ? AND ifnull(owner_id, '') = ? AND ifnull(org_id, '') = ?`
      )
      .get(name, scope, ownerId || "", orgId || "") as Record<string, unknown> | undefined;

    return row ? this.mapSkill(row) : null;
  }

  listVisible(
    userId: string,
    orgId?: string | null,
    options?: ListVisibleSkillsOptions
  ): SkillRecord[] {
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

    const sql = `
      SELECT *
      FROM skills
      WHERE ${conditions.join(" AND ")}
      ORDER BY scope = 'builtin' DESC, scope = 'org' DESC, name ASC
    `;

    const rows = this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    return rows.map((row) => this.mapSkill(row));
  }

  update(
    id: string,
    updates: Partial<{
      description: string;
      storagePath: string;
      version: number;
      isActive: boolean;
    }>
  ): SkillRecord | null {
    const existing = this.get(id);
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

    this.db.prepare(`UPDATE skills SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    return this.get(id);
  }

  delete(id: string): boolean {
    const res = this.db.prepare("DELETE FROM skills WHERE id = ?").run(id);
    return res.changes > 0;
  }

  addFiles(
    skillId: string,
    files: Array<{ relativePath: string; sizeBytes: number; sha256: string }>
  ): SkillFileRecord[] {
    const now = Date.now();
    const insert = this.db.prepare(
      `INSERT INTO skill_files (id, skill_id, relative_path, size_bytes, sha256, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const inserted: SkillFileRecord[] = [];
    const transaction = this.db.transaction(() => {
      for (const file of files) {
        const id = randomUUID();
        insert.run(id, skillId, file.relativePath, file.sizeBytes, file.sha256, now);
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

    transaction();
    return inserted;
  }

  replaceFiles(
    skillId: string,
    files: Array<{ relativePath: string; sizeBytes: number; sha256: string }>
  ): SkillFileRecord[] {
    const transaction = this.db.transaction(() => {
      this.db.prepare("DELETE FROM skill_files WHERE skill_id = ?").run(skillId);
      return this.addFiles(skillId, files);
    });
    return transaction();
  }

  listFiles(skillId: string): SkillFileRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, skill_id, relative_path, size_bytes, sha256, created_at
         FROM skill_files WHERE skill_id = ? ORDER BY relative_path ASC`
      )
      .all(skillId) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapFile(row));
  }

  getConversationSkills(conversationId: string): SkillRecord[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.name, s.description, s.scope, s.owner_id, s.org_id, s.storage_path, s.version, s.is_active, s.created_at, s.updated_at
         FROM skills s
         JOIN conversation_skills cs ON cs.skill_id = s.id
         WHERE cs.conversation_id = ? AND s.is_active = 1
         ORDER BY s.name ASC`
      )
      .all(conversationId) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapSkill(row));
  }

  setConversationSkills(
    conversationId: string,
    skillIds: string[],
    enabledBy: string,
    options?: { explicitlySelected?: boolean; source?: "direct" | "project" }
  ): SkillRecord[] {
    const now = Date.now();
    const isExplicit = options?.explicitlySelected ?? false;
    const src = options?.source ?? "direct";

    const transaction = this.db.transaction(() => {
      // Ensure conversation exists so foreign key succeeds even for guest/unauthenticated testing
      this.db
        .prepare(
          `INSERT OR IGNORE INTO conversations (id, user_id, title, model, created_at, updated_at)
           VALUES (?, ?, 'Chat', 'default', ?, ?)`
        )
        .run(conversationId, enabledBy || "guest", now, now);

      this.db
        .prepare("DELETE FROM conversation_skills WHERE conversation_id = ?")
        .run(conversationId);
      const insert = this.db.prepare(
        `INSERT INTO conversation_skills (
          conversation_id, skill_id, enabled_at, enabled_by, explicitly_selected, preloaded_at, source
        ) VALUES (?, ?, ?, ?, ?, NULL, ?)`
      );
      for (const skillId of skillIds) {
        insert.run(conversationId, skillId, now, enabledBy || "guest", isExplicit ? 1 : 0, src);
      }
    });
    transaction();
    return this.getConversationSkills(conversationId);
  }

  getConversationSkillMeta(
    conversationId: string,
    skillId: string
  ): ConversationSkillRecord | null {
    const row = this.db
      .prepare(
        `SELECT conversation_id, skill_id, enabled_at, enabled_by, explicitly_selected, preloaded_at, source
         FROM conversation_skills WHERE conversation_id = ? AND skill_id = ?`
      )
      .get(conversationId, skillId) as Record<string, unknown> | undefined;

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

  markSkillPreloaded(conversationId: string, skillId: string): void {
    this.db
      .prepare(
        `UPDATE conversation_skills SET preloaded_at = ? WHERE conversation_id = ? AND skill_id = ?`
      )
      .run(Date.now(), conversationId, skillId);
  }

  getUnpreloadedExplicitSkills(conversationId: string): SkillRecord[] {
    const rows = this.db
      .prepare(
        `SELECT s.*
         FROM skills s
         JOIN conversation_skills cs ON cs.skill_id = s.id
         WHERE cs.conversation_id = ? AND cs.explicitly_selected = 1 AND cs.preloaded_at IS NULL AND s.is_active = 1
         ORDER BY cs.enabled_at ASC`
      )
      .all(conversationId) as Array<Record<string, unknown>>;

    return rows.map((r) => this.mapSkill(r));
  }

  inheritProjectSkills(conversationId: string, projectId: string, userId: string): SkillRecord[] {
    const projectSkills = this.getProjectSkills(projectId);
    const now = Date.now();

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT OR IGNORE INTO conversations (id, user_id, title, model, created_at, updated_at)
           VALUES (?, ?, 'Chat', 'default', ?, ?)`
        )
        .run(conversationId, userId || "guest", now, now);

      const insert = this.db.prepare(
        `INSERT OR IGNORE INTO conversation_skills (
          conversation_id, skill_id, enabled_at, enabled_by, explicitly_selected, preloaded_at, source
        ) VALUES (?, ?, ?, ?, 0, NULL, 'project')`
      );

      for (const skill of projectSkills) {
        insert.run(conversationId, skill.id, now, userId || "guest");
      }
    });

    transaction();
    return this.getConversationSkills(conversationId);
  }

  removeProjectSourcedConversationSkills(conversationId: string): void {
    this.db
      .prepare(`DELETE FROM conversation_skills WHERE conversation_id = ? AND source = 'project'`)
      .run(conversationId);
  }

  getProjectSkills(projectId: string): SkillRecord[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.name, s.description, s.scope, s.owner_id, s.org_id, s.storage_path, s.version, s.is_active, s.created_at, s.updated_at
         FROM skills s
         JOIN project_skills ps ON ps.skill_id = s.id
         WHERE ps.project_id = ? AND s.is_active = 1
         ORDER BY s.name ASC`
      )
      .all(projectId) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapSkill(row));
  }

  setProjectSkills(projectId: string, skillIds: string[]): SkillRecord[] {
    const transaction = this.db.transaction(() => {
      this.db.prepare("DELETE FROM project_skills WHERE project_id = ?").run(projectId);
      const insert = this.db.prepare(
        `INSERT INTO project_skills (project_id, skill_id) VALUES (?, ?)`
      );
      for (const skillId of skillIds) {
        insert.run(projectId, skillId);
      }
    });
    transaction();
    return this.getProjectSkills(projectId);
  }

  logUsage(
    conversationId: string | null,
    skill: string,
    userId?: string | null,
    toolName: string = "Skill",
    durationMs: number | null = null,
    outcome: "success" | "error" | "timeout" = "success"
  ): SkillUsageRecord {
    const id = randomUUID();
    const timestamp = Date.now();

    if (conversationId) {
      this.db
        .prepare(
          `INSERT OR IGNORE INTO conversations (id, user_id, title, model, created_at, updated_at)
           VALUES (?, ?, 'Chat', 'default', ?, ?)`
        )
        .run(conversationId, userId || "guest", timestamp, timestamp);
    }

    this.db
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

  getAnalytics(days: number = 30): {
    topSkills: Array<{ skill: string; callCount: number; failureCount: number }>;
    callsPerDay: Array<{ date: string; calls: number }>;
    failureRate: number;
    totalCalls: number;
    totalToolLoops: number;
    averageIterations: number;
  } {
    const sinceTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

    const topSkillsRows = this.db
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
      .all(sinceTimestamp) as Array<Record<string, unknown>>;

    const topSkills = topSkillsRows.map((r) => ({
      skill: String(r["skill"]),
      callCount: Number(r["call_count"] || 0),
      failureCount: Number(r["failure_count"] || 0),
    }));

    const callsPerDayRows = this.db
      .prepare(
        `SELECT strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch') as date,
                COUNT(*) as calls
         FROM skill_usage
         WHERE timestamp >= ?
         GROUP BY date
         ORDER BY date ASC`
      )
      .all(sinceTimestamp) as Array<Record<string, unknown>>;

    const callsPerDay = callsPerDayRows.map((r) => ({
      date: String(r["date"]),
      calls: Number(r["calls"] || 0),
    }));

    const totalsRow = this.db
      .prepare(
        `SELECT COUNT(*) as total_calls,
                SUM(CASE WHEN outcome != 'success' THEN 1 ELSE 0 END) as failure_calls,
                COUNT(DISTINCT conversation_id) as total_conversations
         FROM skill_usage
         WHERE timestamp >= ?`
      )
      .get(sinceTimestamp) as Record<string, unknown> | undefined;

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

  listUsage(conversationId: string): SkillUsageRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, conversation_id, skill, user_id, timestamp, tool_name, duration_ms, outcome
         FROM skill_usage WHERE conversation_id = ? ORDER BY timestamp DESC`
      )
      .all(conversationId) as Array<Record<string, unknown>>;

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
  recordSkillVersion(
    skillId: string,
    version: number,
    changelog: string | null,
    fileManifest: SkillFileRecord[]
  ): void {
    const id = randomUUID();
    const manifestJson = JSON.stringify(
      fileManifest.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );
    this.db
      .prepare(
        `INSERT OR REPLACE INTO skill_versions (id, skill_id, version, changelog, file_manifest, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, skillId, version, changelog, manifestJson, Date.now());
  }

  listSkillVersions(skillId: string): Array<{
    id: string;
    version: number;
    changelog: string | null;
    fileManifest: unknown[];
    createdAt: number;
  }> {
    const rows = this.db
      .prepare(
        `SELECT id, version, changelog, file_manifest, created_at
         FROM skill_versions WHERE skill_id = ? ORDER BY version DESC`
      )
      .all(skillId) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r["id"]),
      version: Number(r["version"]),
      changelog: r["changelog"] ? String(r["changelog"]) : null,
      fileManifest: r["file_manifest"] ? JSON.parse(String(r["file_manifest"])) : [],
      createdAt: Number(r["created_at"]),
    }));
  }

  // --- Agents Support ---
  saveSkillAgents(
    skillId: string,
    agents: Array<{ name: string; description: string; tools: string[]; systemPrompt: string }>
  ): void {
    const transaction = this.db.transaction(() => {
      this.db.prepare("DELETE FROM skill_agents WHERE skill_id = ?").run(skillId);
      const insert = this.db.prepare(
        `INSERT INTO skill_agents (id, skill_id, name, description, tools, system_prompt, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const agent of agents) {
        insert.run(
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
    transaction();
  }

  listSkillAgents(skillId: string): Array<{
    id: string;
    name: string;
    description: string;
    tools: string[];
    systemPrompt: string;
  }> {
    const rows = this.db
      .prepare(
        `SELECT id, name, description, tools, system_prompt
         FROM skill_agents WHERE skill_id = ? ORDER BY name ASC`
      )
      .all(skillId) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r["id"]),
      name: String(r["name"]),
      description: String(r["description"] || ""),
      tools: r["tools"] ? (JSON.parse(String(r["tools"])) as string[]) : [],
      systemPrompt: String(r["system_prompt"] || ""),
    }));
  }

  // --- Categories & Directory ---
  ensureCategory(name: string, description?: string): string {
    const existing = this.db.prepare("SELECT id FROM categories WHERE name = ?").get(name) as
      { id: string } | undefined;
    if (existing) return existing.id;

    const id = randomUUID();
    this.db
      .prepare("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)")
      .run(id, name, description ?? null);
    return id;
  }

  linkSkillCategory(skillId: string, categoryId: string): void {
    this.db
      .prepare("INSERT OR IGNORE INTO skill_categories (skill_id, category_id) VALUES (?, ?)")
      .run(skillId, categoryId);
  }

  getSkillCategories(skillId: string): string[] {
    const rows = this.db
      .prepare(
        `SELECT c.name
         FROM categories c
         JOIN skill_categories sc ON sc.category_id = c.id
         WHERE sc.skill_id = ?`
      )
      .all(skillId) as Array<{ name: string }>;
    return rows.map((r) => r.name);
  }

  listCategories(): Array<{ id: string; name: string; description: string }> {
    const rows = this.db
      .prepare("SELECT id, name, description FROM categories ORDER BY name ASC")
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r["id"]),
      name: String(r["name"]),
      description: String(r["description"] || ""),
    }));
  }

  listDirectorySkills(options?: {
    category?: string | undefined;
    query?: string | undefined;
  }): SkillRecord[] {
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

    const rows = this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapSkill(r));
  }

  updateApprovalStatus(
    id: string,
    status: SkillApprovalStatus,
    rejectionReason: string | null = null,
    targetScope?: SkillScope
  ): SkillRecord | null {
    const existing = this.get(id);
    if (!existing) return null;

    const sets: string[] = ["approval_status = ?", "rejection_reason = ?", "updated_at = ?"];
    const params: unknown[] = [status, rejectionReason, Date.now()];

    if (targetScope) {
      sets.push("scope = ?");
      params.push(targetScope);
    }

    params.push(id);
    this.db.prepare(`UPDATE skills SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    return this.get(id);
  }

  listPendingApproval(): SkillRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM skills WHERE approval_status = 'pending_review' ORDER BY updated_at DESC"
      )
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapSkill(r));
  }

  addDirectorySkillToUserLibrary(directorySkillId: string, userId: string): SkillRecord {
    const dirSkill = this.get(directorySkillId);
    if (!dirSkill) {
      throw new Error("Directory skill not found.");
    }

    // Check if user already has a copy in their library
    const existing = this.getByNameAndScope(dirSkill.name, "user", userId);
    if (existing) return existing;

    // Create a copy in user library referencing storagePath and metadata
    const userCopy = this.create({
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
    const files = this.listFiles(directorySkillId);
    this.addFiles(
      userCopy.id,
      files.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );

    // Copy agent records if any
    const agents = this.listSkillAgents(directorySkillId);
    if (agents.length > 0) {
      this.saveSkillAgents(userCopy.id, agents);
    }

    return userCopy;
  }
}
