-- ============================================================
-- Migration 006: Add 'achievement' to member_awards award_type
-- Run in the Staff Hub Supabase SQL Editor (NOT Members Area)
-- ============================================================

-- Drop the existing CHECK constraint and recreate with achievement included.
-- Constraint name follows Postgres convention: tablename_columnname_check.
ALTER TABLE member_awards
  DROP CONSTRAINT IF EXISTS member_awards_award_type_check;

ALTER TABLE member_awards
  ADD CONSTRAINT member_awards_award_type_check
  CHECK (award_type IN ('athlete_of_month', 'commitment_club', 'achievement'));
