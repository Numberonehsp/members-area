-- ============================================================
-- Migration 010: Goals from your coach
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================
-- The newest "current goals" and "next goal" a coach writes in a Staff Hub
-- check-in, shown on My Goals under "From your coach". Written only by the
-- Staff Hub (best effort, after a check-in is saved, edited or hidden);
-- members read their own row through /api/goals/coach. At most one row per
-- member per kind. Check-ins marked sensitive or hidden are never copied.
-- Same access model as member_tasks (RLS on, open policy).
-- ============================================================
CREATE TABLE IF NOT EXISTS member_coach_goals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL,
  kind                 TEXT NOT NULL CHECK (kind IN ('goal', 'next')),
  goal_text            TEXT NOT NULL CHECK (char_length(goal_text) <= 500),
  set_on               DATE NOT NULL,
  set_by               TEXT NOT NULL DEFAULT 'Coach',
  checkin_id           UUID,
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gymmaster_member_id, kind)
);

ALTER TABLE member_coach_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to member_coach_goals"
  ON member_coach_goals FOR ALL USING (true) WITH CHECK (true);
