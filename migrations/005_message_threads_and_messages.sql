-- ============================================================
-- Migration 005: Message threads + Messages
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================

-- ---------------------------------------------
-- message_threads
-- One row per member. gymmaster_member_id is the
-- natural key; member_name is denormalised for display.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS message_threads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL UNIQUE,
  member_name          TEXT,
  last_message_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to message_threads"
  ON message_threads FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_msg_threads_member
  ON message_threads (gymmaster_member_id);

-- ---------------------------------------------
-- messages
-- Individual messages within a thread.
-- sender_role: 'member' | 'coach'
-- is_read: true once the recipient has seen it
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_role  TEXT NOT NULL CHECK (sender_role IN ('member', 'coach')),
  sender_name  TEXT NOT NULL,
  body         TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to messages"
  ON messages FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_messages_thread
  ON messages (thread_id, created_at);
