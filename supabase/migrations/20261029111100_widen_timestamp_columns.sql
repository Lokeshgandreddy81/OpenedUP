-- JavaScript timestamps are milliseconds since the epoch and exceed Postgres INTEGER.
-- Keep persisted event times as BIGINT so snapshot/project writes do not overflow.
ALTER TABLE conversations
  ALTER COLUMN created_at TYPE BIGINT,
  ALTER COLUMN updated_at TYPE BIGINT;
ALTER TABLE chat_messages ALTER COLUMN created_at TYPE BIGINT;
ALTER TABLE chat_artifacts
  ALTER COLUMN created_at TYPE BIGINT,
  ALTER COLUMN updated_at TYPE BIGINT;
ALTER TABLE chat_artifact_versions ALTER COLUMN created_at TYPE BIGINT;
ALTER TABLE provider_credentials ALTER COLUMN updated_at TYPE BIGINT;
ALTER TABLE project_snapshots ALTER COLUMN updated_at TYPE BIGINT;
ALTER TABLE scheduled_tasks
  ALTER COLUMN created_at TYPE BIGINT,
  ALTER COLUMN updated_at TYPE BIGINT,
  ALTER COLUMN last_run_at TYPE BIGINT,
  ALTER COLUMN next_run_at TYPE BIGINT;
ALTER TABLE scheduled_task_runs
  ALTER COLUMN scheduled_for TYPE BIGINT,
  ALTER COLUMN created_at TYPE BIGINT,
  ALTER COLUMN started_at TYPE BIGINT,
  ALTER COLUMN finished_at TYPE BIGINT,
  ALTER COLUMN lease_until TYPE BIGINT;
ALTER TABLE skills
  ALTER COLUMN created_at TYPE BIGINT,
  ALTER COLUMN updated_at TYPE BIGINT;
ALTER TABLE skill_files ALTER COLUMN created_at TYPE BIGINT;
ALTER TABLE conversation_skills
  ALTER COLUMN enabled_at TYPE BIGINT,
  ALTER COLUMN preloaded_at TYPE BIGINT;
ALTER TABLE skill_usage ALTER COLUMN timestamp TYPE BIGINT;
ALTER TABLE skill_versions ALTER COLUMN created_at TYPE BIGINT;
ALTER TABLE skill_agents ALTER COLUMN created_at TYPE BIGINT;
