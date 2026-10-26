import { randomUUID } from "node:crypto";
import { getChatDatabase, type ChatDatabase } from "../../../platform/database/chatDatabase.js";

export type SkillScope = "builtin" | "org" | "user";

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
}

export interface CreateSkillInput {
  id?: string;
  name: string;
  description: string;
  scope: SkillScope;
  ownerId?: string | null;
  orgId?: string | null;
  storagePath: string;
  version?: number;
  isActive?: boolean;
}

export interface ListVisibleSkillsOptions {
  scope?: SkillScope | undefined;
  query?: string | undefined;
}

export class SkillRepository {
  constructor(private readonly db: ChatDatabase = getChatDatabase()) {}

  private mapSkill(row: Record<string, unknown>): SkillRecord {
    return {
      id: String(row["id"]),
      name: String(row["name"]),
      description: String(row["description"]),
      scope: row["scope"] as SkillScope,
      ownerId: row["owner_id"] ? String(row["owner_id"]) : null,
      orgId: row["org_id"] ? String(row["org_id"]) : null,
      storagePath: String(row["storage_path"]),
      version: Number(row["version"] ?? 1),
      isActive: Boolean(row["is_active"] ?? 1),
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

    this.db
      .prepare(
        `INSERT INTO skills (
          id, name, description, scope, owner_id, org_id, storage_path, version, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        now,
        now
      );

    return {
      id,
      name: input.name,
      description: input.description,
      scope: input.scope,
      ownerId: input.ownerId ?? null,
      orgId: input.orgId ?? null,
      storagePath: input.storagePath,
      version,
      isActive: Boolean(isActive),
      createdAt: now,
      updatedAt: now,
    };
  }

  get(id: string): SkillRecord | null {
    const row = this.db
      .prepare(
        `SELECT id, name, description, scope, owner_id, org_id, storage_path, version, is_active, created_at, updated_at
         FROM skills WHERE id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;

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
        `SELECT id, name, description, scope, owner_id, org_id, storage_path, version, is_active, created_at, updated_at
         FROM skills
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

    // Visible: builtin, or owned by user, or owned by user's org
    const visibilityClauses: string[] = ["scope = 'builtin'", "(scope = 'user' AND owner_id = ?)"];
    params.push(userId);

    if (orgId) {
      visibilityClauses.push("(scope = 'org' AND org_id = ?)");
      params.push(orgId);
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
      SELECT id, name, description, scope, owner_id, org_id, storage_path, version, is_active, created_at, updated_at
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
    enabledBy: string
  ): SkillRecord[] {
    const now = Date.now();
    const transaction = this.db.transaction(() => {
      this.db.prepare("DELETE FROM conversation_skills WHERE conversation_id = ?").run(conversationId);
      const insert = this.db.prepare(
        `INSERT INTO conversation_skills (conversation_id, skill_id, enabled_at, enabled_by)
         VALUES (?, ?, ?, ?)`
      );
      for (const skillId of skillIds) {
        insert.run(conversationId, skillId, now, enabledBy);
      }
    });
    transaction();
    return this.getConversationSkills(conversationId);
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
    userId?: string | null
  ): SkillUsageRecord {
    const id = randomUUID();
    const timestamp = Date.now();
    this.db
      .prepare(
        `INSERT INTO skill_usage (id, conversation_id, skill, user_id, timestamp)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, conversationId, skill, userId ?? null, timestamp);

    return { id, conversationId, skill, userId: userId ?? null, timestamp };
  }

  listUsage(conversationId: string): SkillUsageRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, conversation_id, skill, user_id, timestamp
         FROM skill_usage WHERE conversation_id = ? ORDER BY timestamp DESC`
      )
      .all(conversationId) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row["id"]),
      conversationId: row["conversation_id"] ? String(row["conversation_id"]) : null,
      skill: String(row["skill"]),
      userId: row["user_id"] ? String(row["user_id"]) : null,
      timestamp: Number(row["timestamp"]),
    }));
  }
}
