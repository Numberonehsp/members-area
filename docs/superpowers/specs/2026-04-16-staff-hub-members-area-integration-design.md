# Design: Staff Hub → Members Area Integration

**Date:** 2026-04-16  
**Status:** Approved  
**Scope:** Connect Staff Hub (events, announcements, accountability challenges) to the Members Area dashboard and community pages

---

## Overview

Staff create events, announcements, and accountability challenges in the Staff Hub. Members see them automatically in the Members Area. Members can sign up for challenges via the Members Area — sign-ups are recorded in the Staff Hub database so coaches can track who's committed.

---

## Architecture

**Approach:** Shared Read Access (Option A)

The Members Area gains a second Supabase client that points at the Staff Hub's Supabase project. Reads use the public anon key. Sign-up writes go via a secure server-side API route using the Staff Hub's service role key — never exposed to the browser.

| | Members Area | Staff Hub |
|---|---|---|
| Supabase project | `cwuojhibgclirxsutwtg` | `entbakkftqdejpjdynts` |
| Role | Reads events/challenges from Staff Hub | Source of truth for events/challenges |

**No changes to the Staff Hub's existing codebase API surface** — we add schema and UI only. The Members Area connects directly to the database.

---

## Database Changes (Staff Hub Supabase)

### 1. New `challenges` table (create first — events references it)

> **Note:** Create `challenges` before altering `events`, since `events` gains a foreign key to `challenges`.

### 3. Alter `events` table (after challenges exists)

```sql
-- Add new event types: announcement, challenge
ALTER TABLE events DROP CONSTRAINT events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN (
    'competition', 'social', 'holiday', 'bank_holiday', 
    'school_holiday', 'marketing', 'six_week_start', 'other',
    'announcement', 'challenge'
  ));

-- Add expiry date for announcements
ALTER TABLE events ADD COLUMN IF NOT EXISTS expires_at DATE;

-- Add optional link back to a challenge record
ALTER TABLE events ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL;
```

### 2. New `challenges` table

```sql
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  signup_deadline DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  how_to_signup TEXT NOT NULL,  -- e.g. "Speak to a member of staff at reception"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Service role write for challenges" ON challenges FOR ALL USING (auth.role() = 'service_role');
```

### 3. New `challenge_signups` table

```sql
CREATE TABLE challenge_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  gymmaster_member_id TEXT NOT NULL,  -- GymMaster member ID from cookie
  member_name TEXT,                   -- Stored at signup time for easy display in Staff Hub
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (challenge_id, gymmaster_member_id)  -- prevent duplicate signups
);

ALTER TABLE challenge_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON challenge_signups FOR ALL USING (auth.role() = 'service_role');
```

---

## Staff Hub UI Changes

### Calendar — Events tab

- Add `announcement` as a selectable event type in the event creation form
- When `announcement` is selected, show an **Expires on** date field (`expires_at`)
- Announcements display in the calendar with a distinct colour/badge

### Member Engagement page — Accountability Challenges section

New section at the bottom of the existing Member Engagement page with:

**Challenge list view:**
- Table of all challenges (title, start date, end date, sign-up deadline, sign-up count)
- Create / edit / delete controls

**Create/edit challenge form fields:**
- Title (required)
- Description (rich text or plain textarea)
- Sign-up deadline (date picker)
- Start date (date picker)
- End date (date picker)
- How to sign up (text — e.g. "Speak to a member of staff at reception to book on")
- Active toggle

**On save:** automatically creates a linked `events` record with:
- `event_type = 'challenge'`
- `title` = challenge title
- `start_date` = challenge start date
- `end_date` = challenge end date
- `challenge_id` = the new challenge's UUID

This means challenges appear in the Staff Hub calendar automatically without any extra steps.

**Sign-ups view:** Clicking a challenge shows a list of members who have signed up (name, date signed up).

---

## Members Area Changes

### New environment variables (`.env.local`)

```
STAFFHUB_SUPABASE_URL=https://entbakkftqdejpjdynts.supabase.co
STAFFHUB_SUPABASE_ANON_KEY=<anon key>           # read-only, safe to use server-side
STAFFHUB_SUPABASE_SERVICE_ROLE_KEY=<service key> # write access, server-side only — never in client code
```

### New file: `src/lib/staffhub.ts`

Exports two Supabase clients:
- `staffHubReader` — anon key, used in Server Components to read events/challenges
- `staffHubWriter` — service role key, used only in API routes to write sign-ups

### Dashboard — `AnnouncementBanner`

- Currently uses `SAMPLE_ANNOUNCEMENTS` hardcoded array
- Replace with a fetch from Staff Hub `events` where:
  - `event_type = 'announcement'`
  - `expires_at IS NULL OR expires_at >= today`
- Falls back to empty array if Staff Hub is unreachable (no error overlay)

### Dashboard — `GymEvents` widget

- Replace seed data with a fetch from Staff Hub `events` where:
  - `event_type NOT IN ('announcement', 'challenge')`
  - `start_date >= today`
  - Order by `start_date ASC`, limit 5
- Falls back to empty list if unreachable

### Dashboard — `ChallengesPreview` widget

- Replace seed data with a fetch from Staff Hub `challenges` where:
  - `is_active = true`
  - `end_date >= today`
  - Order by `start_date ASC`, limit 2
- Shows challenge title, dates, and a "View & Sign Up" link

### Community — Challenges list (`/community`)

- Replace seed challenge cards with live data from Staff Hub `challenges`
- Shows: title, description excerpt, sign-up deadline, start/end dates, sign-up CTA

### Challenge detail page (`/community/challenge/[id]`)

- Fetches a single challenge by UUID from Staff Hub `challenges`
- Shows full description, dates, how-to-signup instructions
- **"Sign Up" button** — if the sign-up deadline has passed, shows "Sign-up closed". Otherwise:
  1. Calls `POST /api/challenges/signup` with the challenge ID
  2. On success: shows a confirmation ("You're signed up! 🎉") and updates button to disabled "Signed up ✓"
  3. On duplicate (already signed up): shows "You're already signed up"

### New API route: `POST /api/challenges/signup`

Server-side only. Reads `gymmaster_member_id` and `gymmaster_first_name` from cookies, then writes to `challenge_signups` in the Staff Hub database using the service role key.

```
Request body: { challengeId: string }
Auth: reads gymmaster_member_id cookie (must be logged in)
Response: { success: true } | { error: string }
```

Handles the `UNIQUE` constraint violation gracefully (returns a friendly "already signed up" message rather than a 500).

---

## Data Flow Summary

```
Staff Hub UI
  → creates announcement → saved to events (type=announcement, expires_at=date)
  → creates challenge    → saved to challenges + auto-creates events (type=challenge)

Members Area (server components, at request time)
  → reads events (type=announcement, not expired) → AnnouncementBanner
  → reads events (upcoming, not announcement/challenge) → GymEvents widget
  → reads challenges (active, not ended) → ChallengesPreview + Community page

Member clicks "Sign Up"
  → POST /api/challenges/signup (server route)
  → writes to challenge_signups in Staff Hub Supabase (service role key)
  → returns success/already-signed-up

Staff Hub Member Engagement
  → reads challenge_signups → shows coach who has committed
```

---

## Error Handling

- All Staff Hub reads are wrapped in try/catch. On failure, components fall back to empty data (no error overlays, no broken pages).
- Sign-up API returns clear error messages for: not logged in, deadline passed, already signed up, Staff Hub unreachable.
- All Staff Hub fetches use `cache: 'no-store'` for announcements/challenges (always fresh) and `revalidate: 300` for gym events (5-minute cache is fine).

---

## Out of Scope

- Email reminders for announcements or challenges (deferred — can add via Resend later)
- Member-facing challenge leaderboards or progress tracking
- Staff Hub mobile app or push notifications
- Merging the two Supabase projects into one

---

## Files to Create / Modify

### Staff Hub (`/Users/edharper/Documents/Claude Gym/staff-hub`)
- `supabase-schema.sql` — add new SQL migrations
- `src/app/calendar/` — update events form to support announcement type + expires_at
- `src/app/member-engagement/` — add Accountability Challenges section

### Members Area (`/Users/edharper/Documents/Claude Gym/members-area`)
- `.env.local` — add 3 new Staff Hub env vars
- `src/lib/staffhub.ts` — NEW: Staff Hub Supabase clients
- `src/components/dashboard/AnnouncementBanner.tsx` — wire to live data
- `src/components/dashboard/GymEvents.tsx` — wire to live data  
- `src/components/dashboard/ChallengesPreview.tsx` — wire to live data
- `src/app/(member)/community/page.tsx` — wire challenges to live data
- `src/app/(member)/community/challenge/[id]/page.tsx` — wire to live data + sign-up button
- `src/app/api/challenges/signup/route.ts` — NEW: sign-up API route
