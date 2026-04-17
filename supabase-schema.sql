-- =============================================
-- Number One HSP — Members Area Database Schema
-- Phase 1
-- =============================================

-- ---------------------------------------------
-- members
-- Cached mirror of GymMaster members + portal-specific fields
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id BIGINT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  avatar_url TEXT,
  membership_status TEXT DEFAULT 'active', -- active, suspended, expired

  -- GDPR: timestamp when GymMaster waiver was first synced (proof of consent)
  consent_recorded_at TIMESTAMPTZ,

  -- Coach notes: internal only, never shown to members
  coach_notes TEXT,

  -- Engagement tracking (synced from GymMaster / attendance_log)
  last_visit_date DATE,
  last_portal_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- inbody_scans
-- Body composition history (manual entry in Phase 1, API-fed in Phase 5)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS inbody_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  skeletal_muscle_mass_kg DECIMAL(5,2),
  body_fat_percent DECIMAL(5,2),
  body_fat_mass_kg DECIMAL(5,2),
  notes TEXT,
  entered_by TEXT DEFAULT 'coach', -- 'coach' or 'api'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- sc_test_types
-- Configurable list of strength & conditioning tests
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS sc_test_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  higher_is_better BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- sc_test_results
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS sc_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  test_type_id UUID REFERENCES sc_test_types(id) ON DELETE CASCADE,
  testing_block TEXT,
  test_date DATE NOT NULL,
  result DECIMAL(8,2) NOT NULL,
  is_personal_best BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- education_pathways
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS education_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'nutrition', 'training', 'recovery', 'mindset'
  is_sequential BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- education_modules
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID REFERENCES education_pathways(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  module_order INT NOT NULL,
  video_url TEXT,
  pdf_url TEXT,
  duration_minutes INT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- member_module_progress
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS member_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  module_id UUID REFERENCES education_modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quiz_score INT,
  UNIQUE(member_id, module_id)
);

-- ---------------------------------------------
-- education_resources
-- Standalone library items (not part of a pathway)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS education_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'video', 'pdf', 'article', 'link'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- attendance_log
-- Synced nightly from GymMaster
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, visit_date)
);

-- ---------------------------------------------
-- community_challenges
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'attendance', 'education', 'custom'
  target_value INT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- challenge_entries
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS challenge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  current_value INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, member_id)
);

-- ---------------------------------------------
-- member_awards
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS member_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  award_type TEXT NOT NULL, -- 'athlete_of_the_month', 'commitment_club', 'achievement'
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  award_month DATE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- gym_partners
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS gym_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- announcements
-- Coach-posted notices shown on member dashboard
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT DEFAULT 'normal', -- 'normal', 'high' (high = pinned, shown with accent colour)
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,          -- null = no expiry; set to auto-hide old notices
  created_by TEXT,                 -- coach name or 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- wellbeing_checkins
-- Weekly member self-report (energy, sleep, stress + comments)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS wellbeing_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,          -- Monday of the ISO week — used for dedup
  energy SMALLINT NOT NULL CHECK (energy BETWEEN 1 AND 5),
  sleep SMALLINT NOT NULL CHECK (sleep BETWEEN 1 AND 5),
  stress SMALLINT NOT NULL CHECK (stress BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, week_start)      -- one check-in per member per week
);

-- ---------------------------------------------
-- commitment_club_winners
-- Monthly prize draw winner (qualifying: 12+ visits in calendar month)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS commitment_club_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month DATE NOT NULL,               -- first day of month e.g. 2026-04-01
  recorded_by TEXT NOT NULL,         -- coach name
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(month)                      -- one winner per calendar month
);

-- ---------------------------------------------
-- message_threads
-- One thread per member ↔ coaching team conversation
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- messages
-- Individual messages within a thread
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('member', 'coach')),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at DESC);

-- =============================================
-- Row Level Security
-- Enabled now; granular policies will be added
-- when GymMaster auth is wired up.
-- =============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbody_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_test_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_club_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
