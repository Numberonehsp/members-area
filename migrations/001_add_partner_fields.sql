-- Add missing fields to gym_partners table to support partner manager
-- This migration adds: category, emoji, and offer fields

ALTER TABLE gym_partners
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS offer TEXT DEFAULT '';
