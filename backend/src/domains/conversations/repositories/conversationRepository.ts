import { randomUUID } from "node:crypto";
import { getChatDatabase, type ChatDatabase } from "../../../platform/database/chatDatabase.js";
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
  constructor(private readonly db: ChatDatabase = getChatDatabase()) {}

  list(userId: string): StoredConversation[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, model, is_pinned, is_archived, created_at, updated_at
         FROM conversations WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC`
      )
      .all(userId) as Array<Record<string, unknown>>;
    return rows.map((row) => this.mapConversation(row));
  }

  get(userId: string, id: string): StoredConversation | null {
    const row = this.db
      .prepare(
        `SELECT id, title, model, is_pinned, is_archived, created_at, updated_at
         FROM conversations WHERE user_id = ? AND id = ?`
      )
      .get(userId, id) as Record<string, unknown> | undefined;
    if (!row) return null;
    const messageRows = this.db
      .prepare(
        `SELECT id, role, content, status, metadata_json, created_at
         FROM chat_messages WHERE user_id = ? AND conversation_id = ? ORDER BY sequence ASC`
      )
      .all(userId, id) as Array<Record<string, unknown>>;
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

  create(userId: string, title: string, model: string, projectId?: string): StoredConversation {
    const now = Date.now();
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO conversations(id, user_id, title, model, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, userId, title, model, now, now);

    if (projectId) {
      new SkillRepository(this.db).inheritProjectSkills(id, projectId, userId);
    }

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

  update(
    userId: string,
    id: string,
    patch: {
      title?: string | undefined;
      model?: string | undefined;
      isPinned?: boolean | undefined;
      isArchived?: boolean | undefined;
    }
  ): boolean {
    const current = this.db
      .prepare("SELECT id FROM conversations WHERE user_id = ? AND id = ?")
      .get(userId, id);
    if (!current) return false;
    const next = {
      title: patch.title,
      model: patch.model,
      isPinned: patch.isPinned,
      isArchived: patch.isArchived,
    };
    this.db
      .prepare(
        `UPDATE conversations SET
          title = COALESCE(?, title),
          model = COALESCE(?, model),
          is_pinned = COALESCE(?, is_pinned),
          is_archived = COALESCE(?, is_archived),
          updated_at = ?
         WHERE user_id = ? AND id = ?`
      )
      .run(
        next.title ?? null,
        next.model ?? null,
        next.isPinned === undefined ? null : Number(next.isPinned),
        next.isArchived === undefined ? null : Number(next.isArchived),
        Date.now(),
        userId,
        id
      );
    return true;
  }

  delete(userId: string, id: string): boolean {
    return (
      this.db.prepare("DELETE FROM conversations WHERE user_id = ? AND id = ?").run(userId, id)
        .changes > 0
    );
  }

  deleteMessagesFrom(userId: string, conversationId: string, messageId: string): boolean {
    const result = this.db
      .prepare(
        `DELETE FROM chat_messages
         WHERE user_id = ? AND conversation_id = ? AND sequence >= (
           SELECT sequence FROM chat_messages
           WHERE user_id = ? AND conversation_id = ? AND id = ?
         )`
      )
      .run(userId, conversationId, userId, conversationId, messageId);
    return result.changes > 0;
  }

  appendMessage(
    userId: string,
    conversationId: string,
    message: Omit<StoredMessage, "id" | "createdAt"> & { id?: string }
  ): StoredMessage | null {
    const appendTx = this.db.transaction((): StoredMessage | null => {
      const conversation = this.db
        .prepare("SELECT id, title FROM conversations WHERE user_id = ? AND id = ?")
        .get(userId, conversationId) as { id: string; title: string } | undefined;
      if (!conversation) return null;
      const nextSequence = Number(
        (
          this.db
            .prepare(
              "SELECT COALESCE(MAX(sequence), -1) + 1 AS next_sequence FROM chat_messages WHERE user_id = ? AND conversation_id = ?"
            )
            .get(userId, conversationId) as { next_sequence: number }
        ).next_sequence
      );
      const now = Date.now();
      const id = message.id || randomUUID();
      this.db
        .prepare(
          `INSERT INTO chat_messages(id, conversation_id, user_id, role, content, status, metadata_json, sequence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          conversationId,
          userId,
          message.role,
          message.content,
          message.status,
          JSON.stringify(message.metadata),
          nextSequence,
          now
        );
      const title =
        message.role === "user" && nextSequence === 0
          ? message.content.slice(0, 24) + (message.content.length > 24 ? "..." : "")
          : conversation.title;
      this.db
        .prepare("UPDATE conversations SET title = ?, updated_at = ? WHERE user_id = ? AND id = ?")
        .run(title, now, userId, conversationId);
      return {
        id,
        role: message.role,
        content: message.content,
        status: message.status,
        metadata: message.metadata,
        createdAt: now,
      };
    });
    return appendTx.immediate();
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
