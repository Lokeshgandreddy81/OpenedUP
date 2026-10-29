import { randomUUID } from "node:crypto";
import type {
  ArtifactOrganizationRequest,
  ArtifactRequest,
  ImportArtifactsRequest,
} from "@charan-interiors/contracts";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import {
  asDatabaseClient,
  type DatabaseClient,
} from "../../../platform/database/databaseClient.js";

export interface StoredArtifact {
  id: string;
  legacyId?: string;
  title: string;
  category: "Code" | "Documents";
  content: string;
  language?: string;
  modelUsed?: string;
  isShared: boolean;
  isFavorite: boolean;
  collection?: string;
  tags: string[];
  isOwner: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StoredArtifactVersion {
  id: string;
  title: string;
  category: "Code" | "Documents";
  content: string;
  language?: string;
  modelUsed?: string;
  createdAt: number;
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function readTags(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((tag) => typeof tag === "string")
      ? normalizeTags(parsed)
      : [];
  } catch {
    return [];
  }
}

export class ArtifactRepository {
  private readonly db: DatabaseClient;

  constructor(db?: DatabaseClient | BetterSqliteDatabase) {
    this.db = asDatabaseClient(db);
  }

  async list(userId: string): Promise<StoredArtifact[]> {
    const rows = await this.db
      .prepare(
        `SELECT id, user_id, legacy_id, title, category, content, language, model_used, is_shared,
                is_favorite, collection, tags_json, created_at, updated_at
         FROM chat_artifacts WHERE user_id = ? OR is_shared = 1 ORDER BY updated_at DESC`
      )
      .all(userId) as Array<Record<string, unknown>>;
    return rows.map((row) => this.map(row, userId));
  }

  async create(
    userId: string,
    input: ArtifactRequest,
    legacy?: { id: string; createdAt: number; updatedAt: number }
  ): Promise<StoredArtifact> {
    const now = Date.now();
    const id = randomUUID();
    await this.db
      .prepare(
        `INSERT INTO chat_artifacts(id, user_id, legacy_id, title, category, content, language, model_used,
                                    is_shared, is_favorite, collection, tags_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        userId,
        legacy?.id ?? null,
        input.title,
        input.category,
        input.content,
        input.language ?? null,
        input.modelUsed ?? null,
        Number(Boolean(input.isShared)),
        Number(Boolean(input.isFavorite)),
        input.collection ?? null,
        JSON.stringify(normalizeTags(input.tags ?? [])),
        legacy?.createdAt ?? now,
        legacy?.updatedAt ?? now
      );
    return {
      id,
      ...(legacy ? { legacyId: legacy.id } : {}),
      title: input.title,
      category: input.category,
      content: input.content,
      ...(input.language ? { language: input.language } : {}),
      ...(input.modelUsed ? { modelUsed: input.modelUsed } : {}),
      isShared: Boolean(input.isShared),
      isFavorite: Boolean(input.isFavorite),
      ...(input.collection ? { collection: input.collection } : {}),
      tags: normalizeTags(input.tags ?? []),
      isOwner: true,
      createdAt: legacy?.createdAt ?? now,
      updatedAt: legacy?.updatedAt ?? now,
    };
  }

  async import(userId: string, request: ImportArtifactsRequest): Promise<{ imported: number; skipped: number }> {
    const insert = this.db.prepare(
      `INSERT INTO chat_artifacts(id, user_id, legacy_id, title, category, content, language, model_used,
                                  is_shared, is_favorite, collection, tags_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, legacy_id) DO NOTHING`
    );
    let imported = 0;
    await this.db.transaction(async () => {
      for (const artifact of request.artifacts) {
        const result = await insert.run(
          randomUUID(),
          userId,
          artifact.legacyId,
          artifact.title,
          artifact.category,
          artifact.content,
          artifact.language ?? null,
          artifact.modelUsed ?? null,
          Number(Boolean(artifact.isShared)),
          Number(Boolean(artifact.isFavorite)),
          artifact.collection ?? null,
          JSON.stringify(normalizeTags(artifact.tags ?? [])),
          artifact.createdAt,
          artifact.updatedAt
        );
        imported += Number(result.changes > 0);
      }
    })();
    return { imported, skipped: request.artifacts.length - imported };
  }

  async setShared(userId: string, id: string, isShared: boolean): Promise<boolean> {
    const result = await this.db
      .prepare(
        "UPDATE chat_artifacts SET is_shared = ?, updated_at = ? WHERE user_id = ? AND id = ?"
      )
      .run(Number(isShared), Date.now(), userId, id);
    return result.changes > 0;
  }

  async update(userId: string, id: string, input: ArtifactRequest): Promise<StoredArtifact | null> {
    const update = this.db.transaction(async () => {
      const current = await this.db
        .prepare(
          `SELECT title, category, content, language, model_used, is_favorite, collection, tags_json
           FROM chat_artifacts WHERE user_id = ? AND id = ?`
        )
        .get(userId, id) as Record<string, unknown> | undefined;
      if (!current) return false;
      await this.db
        .prepare(
          `INSERT INTO chat_artifact_versions(id, artifact_id, user_id, title, category, content, language, model_used, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          randomUUID(),
          id,
          userId,
          current["title"],
          current["category"],
          current["content"],
          current["language"],
          current["model_used"],
          Date.now()
        );
      await this.db
        .prepare(
          `DELETE FROM chat_artifact_versions
           WHERE user_id = ? AND artifact_id = ? AND id NOT IN (
             SELECT id FROM chat_artifact_versions WHERE user_id = ? AND artifact_id = ?
             ORDER BY created_at DESC, id DESC LIMIT 50
           )`
        )
        .run(userId, id, userId, id);
      await this.db
        .prepare(
          `UPDATE chat_artifacts
           SET title = ?, category = ?, content = ?, language = ?, model_used = ?, is_shared = ?,
               is_favorite = ?, collection = ?, tags_json = ?, updated_at = ?
           WHERE user_id = ? AND id = ?`
        )
        .run(
          input.title,
          input.category,
          input.content,
          input.language ?? null,
          input.modelUsed ?? null,
          Number(Boolean(input.isShared)),
          Number(input.isFavorite ?? Boolean(current["is_favorite"])),
          input.collection === undefined ? current["collection"] : input.collection,
          JSON.stringify(
            input.tags === undefined ? readTags(current["tags_json"]) : normalizeTags(input.tags)
          ),
          Date.now(),
          userId,
          id
        );
      return true;
    });
    if (!await update()) return null;
    return (await this.list(userId)).find((artifact) => artifact.id === id) || null;
  }

  async updateOrganization(
    userId: string,
    id: string,
    input: ArtifactOrganizationRequest
  ): Promise<StoredArtifact | null> {
    const current = await this.db
      .prepare(
        `SELECT is_favorite, collection, tags_json
         FROM chat_artifacts WHERE user_id = ? AND id = ?`
      )
      .get(userId, id) as Record<string, unknown> | undefined;
    if (!current) return null;

    await this.db
      .prepare(
        `UPDATE chat_artifacts SET is_favorite = ?, collection = ?, tags_json = ?
         WHERE user_id = ? AND id = ?`
      )
      .run(
        Number(input.isFavorite ?? Boolean(current["is_favorite"])),
        input.collection === undefined ? current["collection"] : input.collection,
        JSON.stringify(
          input.tags === undefined ? readTags(current["tags_json"]) : normalizeTags(input.tags)
        ),
        userId,
        id
      );
    return (await this.list(userId)).find((artifact) => artifact.id === id) || null;
  }

  async versions(userId: string, artifactId: string): Promise<StoredArtifactVersion[] | null> {
    const owned = await this.db
      .prepare("SELECT 1 FROM chat_artifacts WHERE user_id = ? AND id = ?")
      .get(userId, artifactId);
    if (!owned) return null;
    const rows = await this.db
      .prepare(
        `SELECT id, title, category, content, language, model_used, created_at
         FROM chat_artifact_versions WHERE user_id = ? AND artifact_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`
      )
      .all(userId, artifactId) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row["id"]),
      title: String(row["title"]),
      category: row["category"] as StoredArtifactVersion["category"],
      content: String(row["content"]),
      ...(typeof row["language"] === "string" ? { language: row["language"] } : {}),
      ...(typeof row["model_used"] === "string" ? { modelUsed: row["model_used"] } : {}),
      createdAt: Number(row["created_at"]),
    }));
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM chat_artifacts WHERE user_id = ? AND id = ?")
      .run(userId, id);
    return result.changes > 0;
  }

  private map(row: Record<string, unknown>, viewerId: string): StoredArtifact {
    const isOwner = String(row["user_id"]) === viewerId;
    return {
      id: String(row["id"]),
      ...(isOwner && typeof row["legacy_id"] === "string" ? { legacyId: row["legacy_id"] } : {}),
      title: String(row["title"]),
      category: row["category"] as StoredArtifact["category"],
      content: String(row["content"]),
      ...(typeof row["language"] === "string" ? { language: row["language"] } : {}),
      ...(typeof row["model_used"] === "string" ? { modelUsed: row["model_used"] } : {}),
      isShared: Boolean(row["is_shared"]),
      isFavorite: Boolean(row["is_favorite"]),
      ...(typeof row["collection"] === "string" && row["collection"]
        ? { collection: row["collection"] }
        : {}),
      tags: readTags(row["tags_json"]),
      isOwner,
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
    };
  }
}
