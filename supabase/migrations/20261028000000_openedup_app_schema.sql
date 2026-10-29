-- Openedup application tables for Supabase Postgres.
-- The backend uses a server-only Postgres connection; browser access stays disabled by RLS.

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
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
  created_at BIGINT NOT NULL,
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
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
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
  created_at BIGINT NOT NULL,
  FOREIGN KEY(artifact_id) REFERENCES chat_artifacts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS artifact_versions_owner_created
  ON chat_artifact_versions(user_id, artifact_id, created_at DESC);

CREATE TABLE IF NOT EXISTS provider_credentials (
  user_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  nonce BYTEA NOT NULL,
  auth_tag BYTEA NOT NULL,
  ciphertext BYTEA NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY(user_id, provider_id)
);

CREATE TABLE IF NOT EXISTS project_snapshots (
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
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
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  last_run_at BIGINT,
  next_run_at BIGINT,
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
  scheduled_for BIGINT,
  created_at BIGINT NOT NULL,
  started_at BIGINT,
  finished_at BIGINT,
  lease_until BIGINT,
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

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  scope TEXT NOT NULL CHECK(scope IN ('builtin', 'org', 'user', 'directory')),
  owner_id TEXT,
  org_id TEXT,
  storage_path TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  icon TEXT,
  author TEXT,
  source_label TEXT,
  changelog TEXT,
  tools_required TEXT,
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK(approval_status IN ('draft', 'pending_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_unique_name
  ON skills(name, scope, COALESCE(owner_id, ''), COALESCE(org_id, ''));
CREATE INDEX IF NOT EXISTS idx_skills_scope_owner
  ON skills(scope, owner_id, org_id, is_active, approval_status);

CREATE TABLE IF NOT EXISTS skill_files (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(skill_id, relative_path)
);
CREATE INDEX IF NOT EXISTS idx_skill_files_skill
  ON skill_files(skill_id);

CREATE TABLE IF NOT EXISTS conversation_skills (
  conversation_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  enabled_at BIGINT NOT NULL,
  enabled_by TEXT NOT NULL,
  explicitly_selected INTEGER NOT NULL DEFAULT 0,
  preloaded_at BIGINT,
  source TEXT NOT NULL DEFAULT 'direct' CHECK(source IN ('direct', 'project')),
  PRIMARY KEY(conversation_id, skill_id),
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_conversation_skills_conv
  ON conversation_skills(conversation_id);

CREATE TABLE IF NOT EXISTS project_skills (
  project_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  PRIMARY KEY(project_id, skill_id),
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_project_skills_project
  ON project_skills(project_id);

CREATE TABLE IF NOT EXISTS skill_usage (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  skill TEXT NOT NULL,
  user_id TEXT,
  timestamp BIGINT NOT NULL,
  tool_name TEXT DEFAULT 'Skill',
  duration_ms INTEGER,
  outcome TEXT DEFAULT 'success' CHECK(outcome IN ('success', 'error', 'timeout'))
);
CREATE INDEX IF NOT EXISTS idx_skill_usage_conv
  ON skill_usage(conversation_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS skill_categories (
  skill_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  PRIMARY KEY(skill_id, category_id),
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skill_versions (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  changelog TEXT,
  file_manifest TEXT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(skill_id, version)
);

CREATE TABLE IF NOT EXISTS skill_agents (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tools TEXT,
  system_prompt TEXT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(skill_id, name)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_task_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_agents ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('openedup-pdfs', 'openedup-pdfs', false, 104857600, ARRAY['application/pdf']),
  ('openedup-images', 'openedup-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('openedup-skill-packages', 'openedup-skill-packages', false, 20971520, ARRAY['application/zip', 'application/x-zip-compressed', 'text/markdown', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
