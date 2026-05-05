-- Add member_goals table for persistent goal tracking
-- This replaces the previous in-memory-only implementation in GoalsClient.tsx

CREATE TABLE IF NOT EXISTS member_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength', 'body', 'habit', 'education')),
  title TEXT NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coach-managed data accessed via service role — disable RLS
ALTER TABLE member_goals DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_member_goals_gymmaster ON member_goals(gymmaster_member_id);
