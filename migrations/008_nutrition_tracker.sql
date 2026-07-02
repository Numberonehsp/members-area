-- ============================================================
-- Migration 008: Nutrition Tracker
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================

-- nutrition_targets
-- One row per member. Set by coaches (Plan 2).
-- gymmaster_member_id is the GymMaster string ID (e.g. "123456").
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL UNIQUE,
  calories             INT NOT NULL DEFAULT 2000,
  protein_g            INT NOT NULL DEFAULT 150,
  carbs_g              INT NOT NULL DEFAULT 200,
  fats_g               INT NOT NULL DEFAULT 65,
  if_method            TEXT CHECK (if_method IN ('16:8', '14:10', '5:2', 'none')),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  updated_by           TEXT  -- coach identifier, set in Plan 2
);

ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nutrition_targets"
  ON nutrition_targets FOR ALL USING (true) WITH CHECK (true);

-- nutrition_logs
-- One row per member per day. Stores the daily total.
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL,
  date                 DATE NOT NULL,
  calories             INT NOT NULL DEFAULT 0,
  protein_g            INT NOT NULL DEFAULT 0,
  carbs_g              INT NOT NULL DEFAULT 0,
  fats_g               INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gymmaster_member_id, date)
);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nutrition_logs"
  ON nutrition_logs FOR ALL USING (true) WITH CHECK (true);

-- nutrition_log_items
-- Individual food entries linked to a daily log.
-- source: 'barcode' = scanned product, 'manual' = bulk entry.
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_log_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      UUID NOT NULL REFERENCES nutrition_logs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  calories    INT NOT NULL DEFAULT 0,
  protein_g   DECIMAL(6,1) NOT NULL DEFAULT 0,
  carbs_g     DECIMAL(6,1) NOT NULL DEFAULT 0,
  fats_g      DECIMAL(6,1) NOT NULL DEFAULT 0,
  quantity_g  DECIMAL(6,1) NOT NULL DEFAULT 100,
  barcode     TEXT,  -- EAN barcode if scanned
  source      TEXT NOT NULL CHECK (source IN ('barcode', 'manual')) DEFAULT 'manual',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nutrition_log_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nutrition_log_items"
  ON nutrition_log_items FOR ALL USING (true) WITH CHECK (true);
