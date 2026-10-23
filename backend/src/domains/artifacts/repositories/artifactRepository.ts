import { randomUUID } from "node:crypto";
import type { ArtifactRequest, ImportArtifactsRequest } from "@charan-interiors/contracts";
import { getChatDatabase, type ChatDatabase } from "../../../platform/database/chatDatabase.js";

export interface StoredArtifact {
  id: string;
  legacyId?: string;
  title: string;
  category: "Code" | "Documents";
  content: string;
  language?: string;
  modelUsed?: string;
  isShared: boolean;
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

export class ArtifactRepository {
  constructor(private readonly db: ChatDatabase = getChatDatabase()) {}

  list(userId: string): StoredArtifact[] {
    const rows = this.db
      .prepare(
        `SELECT id, user_id, legacy_id, title, category, content, language, model_used, is_shared, created_at, updated_at
         FROM chat_artifacts WHERE user_id = ? OR is_shared = 1 ORDER BY updated_at DESC`
      )
      .all(userId) as Array<Record<string, unknown>>;
    return rows.map((row) => this.map(row, userId));
  }

  create(
    userId: string,
    input: ArtifactRequest,
    legacy?: { id: string; createdAt: number; updatedAt: number }
  ): StoredArtifact {
    const now = Date.now();
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO chat_artifacts(id, user_id, legacy_id, title, category, content, language, model_used, is_shared, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      isOwner: true,
      createdAt: legacy?.createdAt ?? now,
      updatedAt: legacy?.updatedAt ?? now,
    };
  }

  import(userId: string, request: ImportArtifactsRequest): { imported: number; skipped: number } {
    const insert = this.db.prepare(
      `INSERT INTO chat_artifacts(id, user_id, legacy_id, title, category, content, language, model_used, is_shared, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, legacy_id) DO NOTHING`
    );
    let imported = 0;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      for (const artifact of request.artifacts) {
        const result = insert.run(
          randomUUID(),
          userId,
          artifact.legacyId,
          artifact.title,
          artifact.category,
          artifact.content,
          artifact.language ?? null,
          artifact.modelUsed ?? null,
          Number(Boolean(artifact.isShared)),
          artifact.createdAt,
          artifact.updatedAt
        );
        imported += Number(result.changes > 0);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return { imported, skipped: request.artifacts.length - imported };
  }

  setShared(userId: string, id: string, isShared: boolean): boolean {
    return (
      this.db
        .prepare(
          "UPDATE chat_artifacts SET is_shared = ?, updated_at = ? WHERE user_id = ? AND id = ?"
        )
        .run(Number(isShared), Date.now(), userId, id).changes > 0
    );
  }

  update(userId: string, id: string, input: ArtifactRequest): StoredArtifact | null {
    const update = this.db.transaction(() => {
      const current = this.db
        .prepare(
          `SELECT title, category, content, language, model_used
           FROM chat_artifacts WHERE user_id = ? AND id = ?`
        )
        .get(userId, id) as Record<string, unknown> | undefined;
      if (!current) return false;
      this.db
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
      this.db
        .prepare(
          `DELETE FROM chat_artifact_versions
           WHERE user_id = ? AND artifact_id = ? AND id NOT IN (
             SELECT id FROM chat_artifact_versions WHERE user_id = ? AND artifact_id = ?
             ORDER BY created_at DESC, rowid DESC LIMIT 50
           )`
        )
        .run(userId, id, userId, id);
      this.db
        .prepare(
          `UPDATE chat_artifacts
           SET title = ?, category = ?, content = ?, language = ?, model_used = ?, is_shared = ?, updated_at = ?
           WHERE user_id = ? AND id = ?`
        )
        .run(
          input.title,
          input.category,
          input.content,
          input.language ?? null,
          input.modelUsed ?? null,
          Number(Boolean(input.isShared)),
          Date.now(),
          userId,
          id
        );
      return true;
    });
    if (!update()) return null;
    return this.list(userId).find((artifact) => artifact.id === id) || null;
  }

  versions(userId: string, artifactId: string): StoredArtifactVersion[] | null {
    const owned = this.db
      .prepare("SELECT 1 FROM chat_artifacts WHERE user_id = ? AND id = ?")
      .get(userId, artifactId);
    if (!owned) return null;
    const rows = this.db
      .prepare(
        `SELECT id, title, category, content, language, model_used, created_at
         FROM chat_artifact_versions WHERE user_id = ? AND artifact_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 50`
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

  delete(userId: string, id: string): boolean {
    return (
      this.db.prepare("DELETE FROM chat_artifacts WHERE user_id = ? AND id = ?").run(userId, id)
        .changes > 0
    );
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
      isOwner,
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
    };
  }
}
