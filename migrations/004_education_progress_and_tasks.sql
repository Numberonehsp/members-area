-- ============================================================
-- Migration 004: Education progress + Member tasks (homework)
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================

-- ---------------------------------------------
-- education_progress
-- Tracks which modules a member has started/completed.
-- Uses gymmaster_member_id + module_id (string) as key
-- because education content is still seed-data driven,
-- not stored in the DB.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS education_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id TEXT NOT NULL,
  module_id   TEXT NOT NULL,           -- matches seed module id e.g. 'nutrition-module-1'
  pathway_id  TEXT NOT NULL,           -- matches seed pathway id e.g. 'nutrition-foundations'
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gymmaster_member_id, module_id)
);

ALTER TABLE education_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to education_progress"
  ON education_progress FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_edu_progress_member
  ON education_progress (gymmaster_member_id);

-- ---------------------------------------------
-- member_tasks
-- Coach-assigned homework items visible to members.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS member_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id TEXT NOT NULL,
  member_name TEXT,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  completed_at TIMESTAMPTZ,            -- null = not yet complete
  set_by      TEXT NOT NULL DEFAULT 'Coach',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE member_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to member_tasks"
  ON member_tasks FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_member_tasks_member
  ON member_tasks (gymmaster_member_id);
