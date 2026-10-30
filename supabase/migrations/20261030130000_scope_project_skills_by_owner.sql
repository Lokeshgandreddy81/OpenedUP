BEGIN;

-- Legacy project skill links did not record an owner, so quarantine them instead
-- of attributing them to an account when project IDs collide across users.

ALTER TABLE project_skills
  DROP CONSTRAINT project_skills_pkey,
  ADD COLUMN user_id TEXT NOT NULL DEFAULT '__legacy_unowned__',
  ADD CONSTRAINT project_skills_pkey PRIMARY KEY (user_id, project_id, skill_id);
ALTER TABLE project_skills ALTER COLUMN user_id DROP DEFAULT;

DROP INDEX IF EXISTS idx_project_skills_project;

COMMIT;
