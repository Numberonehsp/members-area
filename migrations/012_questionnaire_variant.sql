-- ============================================================
-- Migration 012: adult and youth questionnaire variants
-- Run in Supabase SQL Editor (Members Area project), AFTER 011 and BEFORE
-- deploying the code that reads the `variant` column.
-- ============================================================
ALTER TABLE member_questionnaires
  ADD COLUMN IF NOT EXISTS variant TEXT NOT NULL DEFAULT 'adult' CHECK (variant IN ('adult', 'youth'));

-- One open draft per member, kind and variant (was per member and kind).
DROP INDEX IF EXISTS member_questionnaires_one_draft;
CREATE UNIQUE INDEX IF NOT EXISTS member_questionnaires_one_draft
  ON member_questionnaires (gymmaster_member_id, kind, variant) WHERE status = 'draft';
