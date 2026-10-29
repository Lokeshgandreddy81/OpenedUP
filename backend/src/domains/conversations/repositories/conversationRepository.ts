import { randomUUID } from "node:crypto";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import {
  asDatabaseClient,
  type DatabaseClient,
} from "../../../platform/database/databaseClient.js";
import { SkillRepository } from "../../skills/repositories/skillRepository.js";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "complete" | "interrupted";
  metadata: Record<string, unknown>;
  createdAt: number;
}

export interface StoredConversation {
  id: string;
  title: string;
  model: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
}

export class ConversationRepository {
  private readonly db: DatabaseClient;

  constructor(db?: DatabaseClient | BetterSqliteDatabase) {
    this.db = asDatabaseClient(db);
  }

  async list(userId: string): Promise<StoredConversation[]> {
    const rows = await this.db.all(
      `SELECT id, title, model, is_pinned, is_archived, created_at, updated_at
       FROM conversations WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC`,
      [userId]
    );
    return rows.map((row) => this.mapConversation(row));
  }

  async get(userId: string, id: string): Promise<StoredConversation | null> {
    const row = await this.db.get(
      `SELECT id, title, model, is_pinned, is_archived, created_at, updated_at
       FROM conversations WHERE user_id = ? AND id = ?`,
      [userId, id]
    );
    if (!row) return null;
    const messageRows = await this.db.all(
      `SELECT id, role, content, status, metadata_json, created_at
       FROM chat_messages WHERE user_id = ? AND conversation_id = ? ORDER BY sequence ASC`,
      [userId, id]
    );
    return {
      ...this.mapConversation(row),
      messages: messageRows.map((message) => ({
        id: String(message["id"]),
        role: message["role"] as StoredMessage["role"],
        content: String(message["content"]),
        status: message["status"] as StoredMessage["status"],
        metadata: JSON.parse(String(message["metadata_json"])) as Record<string, unknown>,
        createdAt: Number(message["created_at"]),
      })),
    };
  }

  async create(
    userId: string,
    title: string,
    model: string,
    projectId?: string
  ): Promise<StoredConversation> {
    const now = Date.now();
    const id = randomUUID();
    await this.db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO conversations(id, user_id, title, model, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, title, model, now, now]
      );
      if (projectId) {
        await new SkillRepository(tx).inheritProjectSkills(id, projectId, userId);
      }
    })();

    return {
      id,
      title,
      model,
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
  }

  async update(
    userId: string,
    id: string,
    patch: {
      title?: string | undefined;
      model?: string | undefined;
      isPinned?: boolean | undefined;
      isArchived?: boolean | undefined;
    }
  ): Promise<boolean> {
    const result = await this.db.run(
      `UPDATE conversations SET
        title = COALESCE(?, title),
        model = COALESCE(?, model),
        is_pinned = COALESCE(?, is_pinned),
        is_archived = COALESCE(?, is_archived),
        updated_at = ?
       WHERE user_id = ? AND id = ?`,
      [
        patch.title ?? null,
        patch.model ?? null,
        patch.isPinned === undefined ? null : Number(patch.isPinned),
        patch.isArchived === undefined ? null : Number(patch.isArchived),
        Date.now(),
        userId,
        id,
      ]
    );
    return result.changes > 0;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.db.run(
      "DELETE FROM conversations WHERE user_id = ? AND id = ?",
      [userId, id]
    );
    return result.changes > 0;
  }

  async deleteMessagesFrom(userId: string, conversationId: string, messageId: string): Promise<boolean> {
    const result = await this.db.run(
      `DELETE FROM chat_messages
       WHERE user_id = ? AND conversation_id = ? AND sequence >= (
         SELECT sequence FROM chat_messages
         WHERE user_id = ? AND conversation_id = ? AND id = ?
       )`,
      [userId, conversationId, userId, conversationId, messageId]
    );
    return result.changes > 0;
  }

  async appendMessage(
    userId: string,
    conversationId: string,
    message: Omit<StoredMessage, "id" | "createdAt"> & { id?: string }
  ): Promise<StoredMessage | null> {
    return this.db.transaction(async (tx) => {
      const conversation = await tx.get<{ id: string; title: string }>(
        "SELECT id, title FROM conversations WHERE user_id = ? AND id = ?",
        [userId, conversationId]
      );
      if (!conversation) return null;
      const sequenceRow = await tx.get<{ next_sequence: number }>(
        `SELECT COALESCE(MAX(sequence), -1) + 1 AS next_sequence
         FROM chat_messages WHERE user_id = ? AND conversation_id = ?`,
        [userId, conversationId]
      );
      const nextSequence = Number(sequenceRow?.next_sequence ?? 0);
      const now = Date.now();
      const id = message.id || randomUUID();
      await tx.run(
        `INSERT INTO chat_messages(id, conversation_id, user_id, role, content, status, metadata_json, sequence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          conversationId,
          userId,
          message.role,
          message.content,
          message.status,
          JSON.stringify(message.metadata),
          nextSequence,
          now,
        ]
      );
      const title =
        message.role === "user" && nextSequence === 0
          ? message.content.slice(0, 24) + (message.content.length > 24 ? "..." : "")
          : conversation.title;
      await tx.run(
        "UPDATE conversations SET title = ?, updated_at = ? WHERE user_id = ? AND id = ?",
        [title, now, userId, conversationId]
      );
      return {
        id,
        role: message.role,
        content: message.content,
        status: message.status,
        metadata: message.metadata,
        createdAt: now,
      };
    })();
  }

  private mapConversation(row: Record<string, unknown>): StoredConversation {
    return {
      id: String(row["id"]),
      title: String(row["title"]),
      model: String(row["model"]),
      isPinned: Boolean(row["is_pinned"]),
      isArchived: Boolean(row["is_archived"]),
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
      messages: [],
    };
  }
}
