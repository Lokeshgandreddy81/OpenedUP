import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database, { type Database as BetterSqliteDatabase } from "better-sqlite3";

export type ChatDatabase = BetterSqliteDatabase;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS conversations_user_updated
  ON conversations(user_id, is_archived, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'complete' CHECK(status IN ('complete', 'interrupted')),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  sequence INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(conversation_id, sequence),
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS messages_conversation_sequence
  ON chat_messages(conversation_id, sequence);

CREATE TABLE IF NOT EXISTS chat_artifacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  legacy_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Code', 'Documents')),
  content TEXT NOT NULL,
  language TEXT,
  model_used TEXT,
  is_shared INTEGER NOT NULL DEFAULT 0,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  collection TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, legacy_id)
);
CREATE INDEX IF NOT EXISTS artifacts_shared_updated
  ON chat_artifacts(is_shared, updated_at DESC);
CREATE INDEX IF NOT EXISTS artifacts_user_updated
  ON chat_artifacts(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_artifact_versions (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Code', 'Documents')),
  content TEXT NOT NULL,
  language TEXT,
  model_used TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(artifact_id) REFERENCES chat_artifacts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS artifact_versions_owner_created
  ON chat_artifact_versions(user_id, artifact_id, created_at DESC);

CREATE TABLE IF NOT EXISTS provider_credentials (
  user_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  nonce BLOB NOT NULL,
  auth_tag BLOB NOT NULL,
  ciphertext BLOB NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, provider_id)
);

CREATE TABLE IF NOT EXISTS project_snapshots (
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, project_id)
);
CREATE INDEX IF NOT EXISTS project_snapshots_owner_updated
  ON project_snapshots(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  legacy_id TEXT,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  icon TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekdays', 'weekly', 'monthly')),
  time TEXT NOT NULL,
  timezone TEXT NOT NULL,
  day_of_week INTEGER,
  day_of_month INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  model_id TEXT NOT NULL,
  effort TEXT NOT NULL CHECK(effort IN ('Low', 'Medium', 'High')),
  notifications TEXT NOT NULL CHECK(notifications IN ('Important updates', 'Failed runs only')),
  start_in_new_chat INTEGER NOT NULL DEFAULT 0,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_run_at INTEGER,
  next_run_at INTEGER,
  UNIQUE(user_id, legacy_id)
);
CREATE INDEX IF NOT EXISTS scheduled_tasks_due
  ON scheduled_tasks(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS scheduled_tasks_owner_updated
  ON scheduled_tasks(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS scheduled_task_runs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK(trigger IN ('scheduled', 'manual')),
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed')),
  scheduled_for INTEGER,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  finished_at INTEGER,
  lease_until INTEGER,
  output TEXT,
  error TEXT,
  model_used TEXT,
  provider_used TEXT,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  FOREIGN KEY(task_id) REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, scheduled_for)
);
CREATE INDEX IF NOT EXISTS scheduled_task_runs_owner_task
  ON scheduled_task_runs(user_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS scheduled_task_runs_queue
  ON scheduled_task_runs(status, lease_until, created_at);

`;

function migrateChatDatabase(database: ChatDatabase): void {
  const columns = database.pragma("table_info(chat_artifacts)") as Array<{ name: string }>;
  const names = new Set(columns.map((column) => column.name));
  if (!names.has("is_favorite")) {
    database.exec("ALTER TABLE chat_artifacts ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0");
  }
  if (!names.has("collection")) {
    database.exec("ALTER TABLE chat_artifacts ADD COLUMN collection TEXT");
  }
  if (!names.has("tags_json")) {
    database.exec("ALTER TABLE chat_artifacts ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'");
  }
  const runColumns = database.pragma("table_info(scheduled_task_runs)") as Array<{ name: string }>;
  const runColumnNames = new Set(runColumns.map((column) => column.name));
  if (runColumns.length > 0 && !runColumnNames.has("conversation_id")) {
    database.exec(
      "ALTER TABLE scheduled_task_runs ADD COLUMN conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL"
    );
  }
  database.exec("PRAGMA user_version = 4;");
}

function defaultDatabasePath(): string {
  return (
    process.env["CHAT_DB_PATH"]?.trim() ||
    path.join(os.homedir(), ".local", "share", "openedup", "chat.sqlite")
  );
}

export function openChatDatabase(databasePath = defaultDatabasePath()): ChatDatabase {
  if (databasePath !== ":memory:") fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA secure_delete = ON;");
  if (databasePath !== ":memory:") database.exec("PRAGMA journal_mode = WAL;");
  database.exec(SCHEMA);
  migrateChatDatabase(database);
  return database;
}

let sharedDatabase: ChatDatabase | null = null;

export function getChatDatabase(): ChatDatabase {
  sharedDatabase ??= openChatDatabase();
  return sharedDatabase;
}

export function closeChatDatabase(): void {
  sharedDatabase?.close();
  sharedDatabase = null;
}
