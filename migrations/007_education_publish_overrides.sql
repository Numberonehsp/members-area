-- ============================================================
-- Migration 007: Education publish overrides
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================
-- Stores coach publish/unpublish decisions for pathways,
-- modules, and resources. Seed data defaults are used when
-- no override exists for a given item.
-- ============================================================

CREATE TABLE IF NOT EXISTS education_publish_overrides (
  id           TEXT NOT NULL,
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('pathway', 'module', 'resource')),
  is_published BOOLEAN NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id, entity_type)
);

ALTER TABLE education_publish_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to education_publish_overrides"
  ON education_publish_overrides FOR ALL USING (true) WITH CHECK (true);
