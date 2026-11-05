-- ============================================================
-- Migration 013: member injury reports
-- Run in Supabase SQL Editor (Members Area project).
--
-- PRIVATE DATA, same pattern as member_questionnaires: row-level security ON,
-- NO policy, no anon/authenticated grants. Only server code using the service
-- role key can reach it, after checking who is asking.
-- ============================================================
CREATE TABLE IF NOT EXISTS member_injuries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id   TEXT NOT NULL,
  areas                 TEXT[] NOT NULL CHECK (cardinality(areas) BETWEEN 1 AND 8),
  injured_on            DATE NOT NULL,
  pain                  SMALLINT NOT NULL CHECK (pain BETWEEN 0 AND 10),
  status                TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'recovering', 'resolved')),
  seen_therapist        BOOLEAN NOT NULL DEFAULT false,
  therapist_note        TEXT CHECK (therapist_note IS NULL OR char_length(therapist_note) <= 200),
  notes                 TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  wants_therapist_info  BOOLEAN NOT NULL DEFAULT false,
  consent_at            TIMESTAMPTZ NOT NULL,
  alert_sent_at         TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_injuries_member
  ON member_injuries (gymmaster_member_id, created_at DESC);

ALTER TABLE member_injuries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON member_injuries FROM anon, authenticated;
