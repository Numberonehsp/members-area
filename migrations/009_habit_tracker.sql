-- ============================================================
-- Migration 009: Habit Tracker
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================

-- member_habits
-- Up to 5 'active' rows per member at a time (enforced in the API layer,
-- not here, same as member_events' MAX_EVENTS check in the sibling route).
-- Nutrition-category habits (calories/fat/protein/carbs) never get rows in
-- habit_logs below — their progress is read from the existing
-- nutrition_logs table instead, so a member never enters the same number
-- twice across the Nutrition page and the habit tracker.
-- ============================================================
CREATE TABLE IF NOT EXISTS member_habits (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL,
  metric               TEXT NOT NULL CHECK (metric IN (
                          'sleep', 'stretching', 'hydration',
                          'calories', 'fat', 'protein', 'carbs',
                          'steps', 'distance', 'workouts', 'exercise_reps'
                        )),
  category             TEXT NOT NULL CHECK (category IN ('wellbeing', 'nutrition', 'activity')),
  target               NUMERIC CHECK (target IS NULL OR target > 0),
  cadence              TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly')),
  aggregation          TEXT CHECK (aggregation IN ('total', 'average')),
  start_date           DATE NOT NULL,
  end_date             DATE,
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  -- aggregation only means something for a weekly habit — daily habits
  -- compare a single day's value to the target, nothing to total/average.
  CHECK (
    (cadence = 'daily' AND aggregation IS NULL) OR
    (cadence = 'weekly' AND aggregation IS NOT NULL)
  )
);

-- Backstops the API-layer "already active" check in POST /api/habits
-- against a double-submit race (two concurrent requests both passing the
-- check before either insert lands) — unlike the 5-habit cap, there's no
-- similarly cheap partial-index backstop for a count, so that one stays
-- API-layer-only, but this one-metric-at-a-time rule is a natural fit.
CREATE UNIQUE INDEX IF NOT EXISTS member_habits_one_active_per_metric
  ON member_habits (gymmaster_member_id, metric) WHERE status = 'active';

ALTER TABLE member_habits ENABLE ROW LEVEL SECURITY;
-- NOTE: Open-access policy for dev phase, matching nutrition_targets/nutrition_logs.
-- Tighten to per-member access before production launch.
CREATE POLICY "Allow all access to member_habits"
  ON member_habits FOR ALL USING (true) WITH CHECK (true);

-- habit_logs
-- One row per habit per day. Never written for a nutrition-category habit.
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id             UUID NOT NULL REFERENCES member_habits(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  value                NUMERIC NOT NULL CHECK (value >= 0),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to habit_logs"
  ON habit_logs FOR ALL USING (true) WITH CHECK (true);
