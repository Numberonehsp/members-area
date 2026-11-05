-- ============================================================
-- Migration 011: Member questionnaires (health and lifestyle answers)
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================
-- PRIVATE DATA. Unlike the other tables, this one has row-level security ON
-- and NO policy, and the anon and authenticated roles have no grants, so the
-- public key can read or write nothing. Only server code using the service
-- role key (SUPABASE_SERVICE_ROLE_KEY) can reach it, after checking who is
-- asking (see src/lib/member-auth.ts and src/lib/supabase-admin.ts).
-- ============================================================
CREATE TABLE IF NOT EXISTS member_questionnaires (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL,
  kind                 TEXT NOT NULL DEFAULT 'initial' CHECK (kind IN ('initial', 'refresh')),
  version              INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  answers              JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores               JSONB NOT NULL DEFAULT '{}'::jsonb,
  flags                TEXT[] NOT NULL DEFAULT '{}',
  consent_at           TIMESTAMPTZ,
  submitted_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'submitted' OR (submitted_at IS NOT NULL AND consent_at IS NOT NULL))
);

-- One open draft per member and kind.
CREATE UNIQUE INDEX IF NOT EXISTS member_questionnaires_one_draft
  ON member_questionnaires (gymmaster_member_id, kind) WHERE status = 'draft';
CREATE INDEX IF NOT EXISTS member_questionnaires_member
  ON member_questionnaires (gymmaster_member_id, submitted_at DESC);

ALTER TABLE member_questionnaires ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON member_questionnaires FROM anon, authenticated;
