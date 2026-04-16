# Staff Hub → Members Area Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the Staff Hub's events, announcements, and accountability challenges to the Members Area dashboard and community pages, with member sign-ups recorded in the Staff Hub database.

**Architecture:** Members Area gains a second Supabase client pointing at the Staff Hub's Supabase project (`entbakkftqdejpjdynts`). Server components read via the anon key. Challenge sign-ups write via a server-side API route using the service role key. No changes to the Staff Hub's existing API surface — schema and UI additions only.

**Tech Stack:** Next.js 16 App Router, `@supabase/supabase-js` v2, TypeScript, Tailwind CSS v4, two separate Supabase projects.

---

## Important Pre-Read: What Already Exists

Before starting, note these discoveries from reading the Staff Hub codebase:

- The **`challenges` table already exists** in Staff Hub Supabase with columns: `id`, `name`, `start_date`, `end_date`, `challenge_type`, `target_description`, `description`, `is_active`, `calendar_event_id`. The column is `name` (not `title`). We need to **ALTER** it, not create it from scratch.
- The **`challenge` event type already exists** in `EventManager.tsx` `EVENT_TYPES` array — the DB constraint was updated outside of `supabase-schema.sql`.
- The **`announcements` table** in the Staff Hub is for weekly WhatsApp staff comms — it is NOT for member-facing announcements. We use the `events` table with a new `announcement` event type instead.
- The Staff Hub already auto-creates calendar events when challenges are created.

---

## File Map

### Staff Hub (`/Users/edharper/Documents/Claude Gym/staff-hub`)

| File | Action | Purpose |
|------|--------|---------|
| Supabase SQL editor (live) | Run migration | Add `signup_deadline`, `how_to_signup` to `challenges`; add `challenge_signups` table; add `announcement` event type; add `expires_at` to `events` |
| `src/components/calendar/EventManager.tsx` | Modify | Add `announcement` to EVENT_TYPES; show `expires_at` field when type is `announcement` |
| `src/components/engagement/ChallengesTab.tsx` | Modify | Add `signup_deadline` and `how_to_signup` fields to create form + insert |

### Members Area (`/Users/edharper/Documents/Claude Gym/members-area`)

| File | Action | Purpose |
|------|--------|---------|
| `.env.local` | Modify | Add 3 Staff Hub env vars |
| `src/lib/staffhub.ts` | Create | Two Supabase clients: anon reader + service-role writer |
| `src/components/dashboard/GymEvents.tsx` | Modify | Async server component fetching real events from Staff Hub |
| `src/app/(member)/dashboard/page.tsx` | Modify | Fetch announcements from Staff Hub, pass to AnnouncementBanner |
| `src/components/dashboard/ChallengesPreview.tsx` | Modify | Async server component fetching real challenges from Staff Hub |
| `src/app/(member)/community/page.tsx` | Modify | Wire challenges section to live Staff Hub data |
| `src/app/(member)/community/challenge/[id]/page.tsx` | Rewrite | Fetch single challenge by UUID; show sign-up button with instructions |
| `src/app/api/challenges/signup/route.ts` | Create | POST endpoint that writes sign-up to Staff Hub using service role key |

---

## Task 1: Staff Hub — Database Migration

Run these SQL statements in the **Supabase SQL Editor** for the Staff Hub project (`entbakkftqdejpjdynts`). Navigate to: https://supabase.com/dashboard/project/entbakkftqdejpjdynts/sql/new

**Files:** Supabase SQL editor (no local files changed in this task)

- [ ] **Step 1: Add signup_deadline and how_to_signup to challenges table**

```sql
ALTER TABLE challenges 
  ADD COLUMN IF NOT EXISTS signup_deadline DATE,
  ADD COLUMN IF NOT EXISTS how_to_signup TEXT;
```

Run this. Expected: `Success. No rows returned.`

- [ ] **Step 2: Create challenge_signups table**

```sql
CREATE TABLE IF NOT EXISTS challenge_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  gymmaster_member_id TEXT NOT NULL,
  member_name TEXT,
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (challenge_id, gymmaster_member_id)
);

ALTER TABLE challenge_signups ENABLE ROW LEVEL SECURITY;

-- Members can read their own signups via anon key
CREATE POLICY "Anon read challenge_signups" ON challenge_signups 
  FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role write challenge_signups" ON challenge_signups 
  FOR ALL USING (auth.role() = 'service_role');
```

Run this. Expected: `Success. No rows returned.`

- [ ] **Step 3: Add announcement event type and expires_at to events**

```sql
-- Drop existing constraint and recreate with announcement added
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN (
    'competition', 'social', 'holiday', 'bank_holiday', 
    'school_holiday', 'marketing', 'six_week_start', 'other',
    'challenge', 'announcement'
  ));

ALTER TABLE events ADD COLUMN IF NOT EXISTS expires_at DATE;
```

Run this. Expected: `Success. No rows returned.`

- [ ] **Step 4: Verify migration**

Run this query to confirm the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('challenges', 'events', 'challenge_signups')
  AND column_name IN ('signup_deadline', 'how_to_signup', 'expires_at', 'gymmaster_member_id')
ORDER BY table_name, column_name;
```

Expected: 4 rows — `expires_at (date)` on events, `gymmaster_member_id (text)` on challenge_signups, `how_to_signup (text)` on challenges, `signup_deadline (date)` on challenges.

---

## Task 2: Staff Hub — Add Announcement to EventManager

**Files:**
- Modify: `src/components/calendar/EventManager.tsx`

- [ ] **Step 1: Add `announcement` to EVENT_TYPES and add `expiresAt` state**

Replace the `EVENT_TYPES` array and add `expiresAt` state in `EventManager.tsx`:

```tsx
// Replace the existing EVENT_TYPES array (around line 15)
const EVENT_TYPES = [
  { value: 'competition', label: 'Competition', color: '#268384' },
  { value: 'social', label: 'Social', color: '#2a9a9b' },
  { value: 'holiday', label: 'Gym Holiday', color: '#f0883e' },
  { value: 'bank_holiday', label: 'Bank Holiday', color: '#f0883e' },
  { value: 'school_holiday', label: 'School Holiday', color: '#d2a679' },
  { value: 'marketing', label: 'Marketing', color: '#58a6ff' },
  { value: 'six_week_start', label: '6 Week Start', color: '#3fb950' },
  { value: 'challenge', label: 'Member Challenge', color: '#8b5cf6' },
  { value: 'announcement', label: 'Member Announcement', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#888' },
]
```

In the `EventManager` component function, add `expiresAt` state after the existing state declarations (after the `const [endDate, setEndDate] = useState('')` line):

```tsx
const [expiresAt, setExpiresAt] = useState('')
```

- [ ] **Step 2: Update `addEvent` to include `expires_at`**

Replace the `addEvent` function body:

```tsx
async function addEvent() {
  if (!title || !startDate) return
  setSaving(true)

  const { error } = await supabase.from('events').insert({
    title,
    description: description || null,
    event_type: eventType,
    start_date: startDate,
    end_date: endDate || null,
    expires_at: eventType === 'announcement' ? (expiresAt || null) : null,
  })

  if (error) console.error('Error adding event:', error)
  else {
    setTitle('')
    setDescription('')
    setEventType('competition')
    setStartDate('')
    setEndDate('')
    setExpiresAt('')
    setShowForm(false)
    await loadEvents()
  }
  setSaving(false)
}
```

- [ ] **Step 3: Add expires_at field to the form — show only when announcement type selected**

In the form JSX, after the End Date field (`<div>` containing `End Date (optional)`) and before the closing `</div>` of the grid, add:

```tsx
{eventType === 'announcement' && (
  <div>
    <label className="block text-xs text-[#666] mb-1">
      Expires on (optional — hides from members after this date)
    </label>
    <input
      type="date"
      value={expiresAt}
      onChange={(e) => setExpiresAt(e.target.value)}
      className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#268384] transition-colors"
    />
  </div>
)}
```

- [ ] **Step 4: Update the Event type to include expires_at**

At the top of the file, update the `Event` type definition:

```tsx
type Event = {
  id: string
  title: string
  description: string | null
  event_type: string
  start_date: string
  end_date: string | null
  expires_at: string | null
}
```

- [ ] **Step 5: Update event list to show expiry badge for announcements**

In the events list, after the description paragraph, add the expiry indicator. Find the block that renders `{event.description && ...}` and add after it:

```tsx
{event.event_type === 'announcement' && event.expires_at && (
  <p className="text-[11px] text-[#f59e0b] mt-1">
    📢 Expires {new Date(event.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
  </p>
)}
```

- [ ] **Step 6: Test in Staff Hub**

Start the staff-hub dev server:
```bash
cd "/Users/edharper/Documents/Claude Gym/staff-hub" && npm run dev
```

Open http://localhost:3000/calendar → Events tab → Add Event. Confirm:
- "Member Announcement" appears in the Type dropdown
- Selecting it shows the "Expires on" date field
- Other types do NOT show the expires field
- Creating an announcement saves without error

- [ ] **Step 7: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/staff-hub"
git add src/components/calendar/EventManager.tsx
git commit -m "feat: add announcement event type with expiry date to EventManager"
```

---

## Task 3: Staff Hub — Add Signup Fields to ChallengesTab

**Files:**
- Modify: `src/components/engagement/ChallengesTab.tsx`

- [ ] **Step 1: Update the `newChallenge` state to include new fields**

Find the `newChallenge` state initialisation (around line 87):

```tsx
// Replace:
const [newChallenge, setNewChallenge] = useState({
  name: '', start_date: '', end_date: '',
  challenge_type: 'custom', target_description: '', description: '',
})

// With:
const [newChallenge, setNewChallenge] = useState({
  name: '', start_date: '', end_date: '',
  challenge_type: 'custom', target_description: '', description: '',
  signup_deadline: '', how_to_signup: '',
})
```

- [ ] **Step 2: Add the two new form fields to the create form**

In the `showNewChallenge` form, find the `Description / Rules` input (around line 326) and add these two fields after it:

```tsx
<div>
  <label className={labelClass}>Sign-up Deadline</label>
  <input type="date" value={newChallenge.signup_deadline}
    onChange={(e) => setNewChallenge({ ...newChallenge, signup_deadline: e.target.value })}
    className={inputClass} />
  <p className="text-[11px] text-[#555] mt-1">Members can sign up before this date via the Members Area.</p>
</div>
<div className="md:col-span-2">
  <label className={labelClass}>How to Sign Up (shown to members)</label>
  <input type="text" value={newChallenge.how_to_signup}
    onChange={(e) => setNewChallenge({ ...newChallenge, how_to_signup: e.target.value })}
    placeholder="e.g. Speak to a member of staff at reception to book on"
    className={inputClass} />
</div>
```

- [ ] **Step 3: Update createChallenge to save new fields**

In the `createChallenge` function, update the insert call (around line 149) to include the new fields:

```tsx
const { data: cData, error: cErr } = await supabase
  .from('challenges')
  .insert({
    ...newChallenge,
    target_description: newChallenge.target_description || null,
    description: newChallenge.description || null,
    signup_deadline: newChallenge.signup_deadline || null,
    how_to_signup: newChallenge.how_to_signup || null,
  })
  .select()
  .single()
```

- [ ] **Step 4: Reset new fields on form clear**

Update the reset after successful creation (around line 191):

```tsx
setNewChallenge({ 
  name: '', start_date: '', end_date: '', 
  challenge_type: 'custom', target_description: '', description: '',
  signup_deadline: '', how_to_signup: '',
})
```

- [ ] **Step 5: Update the Challenge type to include new fields**

At the top of the file, update the `Challenge` type:

```tsx
type Challenge = {
  id: string
  name: string
  start_date: string
  end_date: string
  challenge_type: string
  target_description: string | null
  description: string | null
  is_active: boolean
  calendar_event_id: string | null
  signup_deadline: string | null
  how_to_signup: string | null
}
```

- [ ] **Step 6: Show signup info in the challenge detail info bar**

In the challenge info bar (inside `{selected && (...)}`, after the `calendar_event_id` paragraph), add:

```tsx
{selected.signup_deadline && (
  <p className="text-[11px] text-[#f59e0b] mt-1">
    📅 Sign-up deadline: {new Date(selected.signup_deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
  </p>
)}
{selected.how_to_signup && (
  <p className="text-[11px] text-[#2a9a9b] mt-1">
    ℹ️ {selected.how_to_signup}
  </p>
)}
```

- [ ] **Step 7: Test in Staff Hub**

Open http://localhost:3000/accountability → Accountability Challenges tab → New Challenge. Confirm:
- "Sign-up Deadline" date field appears
- "How to Sign Up" text field appears
- Creating a challenge with these fields works without error

- [ ] **Step 8: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/staff-hub"
git add src/components/engagement/ChallengesTab.tsx
git commit -m "feat: add signup_deadline and how_to_signup fields to challenges form"
```

---

## Task 4: Members Area — Environment Variables + Staff Hub Client

**Files:**
- Modify: `/Users/edharper/Documents/Claude Gym/members-area/.env.local`
- Create: `src/lib/staffhub.ts`

- [ ] **Step 1: Get the Staff Hub Supabase service role key**

1. Open https://supabase.com/dashboard/project/entbakkftqdejpjdynts/settings/api
2. Copy the **service_role** key (labelled "secret" — never commit this)
3. The anon key is already in the staff-hub `.env.local` — copy it from `/Users/edharper/Documents/Claude Gym/staff-hub/.env.local`

- [ ] **Step 2: Add env vars to Members Area .env.local**

Open `/Users/edharper/Documents/Claude Gym/members-area/.env.local` and add these three lines at the end:

```
# Staff Hub Supabase — read events/challenges/announcements
STAFFHUB_SUPABASE_URL=https://entbakkftqdejpjdynts.supabase.co
STAFFHUB_SUPABASE_ANON_KEY=<paste anon key from staff-hub .env.local>
STAFFHUB_SUPABASE_SERVICE_ROLE_KEY=<paste service_role key from Supabase dashboard>
```

> ⚠️ `STAFFHUB_SUPABASE_SERVICE_ROLE_KEY` must NOT start with `NEXT_PUBLIC_` — it must never be exposed to the browser.

- [ ] **Step 3: Create `src/lib/staffhub.ts`**

Create the file `/Users/edharper/Documents/Claude Gym/members-area/src/lib/staffhub.ts`:

```typescript
// =============================================
// Staff Hub Supabase clients
//
// staffHubReader — anon key, safe for server components
// staffHubWriter — service role key, API routes ONLY
//
// Both are server-side only — never import in 'use client' components.
// =============================================

import { createClient } from '@supabase/supabase-js'

const STAFFHUB_URL = process.env.STAFFHUB_SUPABASE_URL ?? ''
const STAFFHUB_ANON_KEY = process.env.STAFFHUB_SUPABASE_ANON_KEY ?? ''
const STAFFHUB_SERVICE_KEY = process.env.STAFFHUB_SUPABASE_SERVICE_ROLE_KEY ?? ''

/** Read-only client — use in Server Components to fetch events and challenges */
export const staffHubReader = createClient(STAFFHUB_URL, STAFFHUB_ANON_KEY, {
  auth: { persistSession: false },
})

/** Write client — use ONLY in /api route handlers to record sign-ups */
export const staffHubWriter = createClient(STAFFHUB_URL, STAFFHUB_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Shared types ──────────────────────────────────────────────────────────────

export type StaffHubEvent = {
  id: string
  title: string
  description: string | null
  event_type: string
  start_date: string
  end_date: string | null
  expires_at: string | null
}

export type StaffHubChallenge = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  signup_deadline: string | null
  how_to_signup: string | null
  is_active: boolean
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch announcements that haven't expired yet.
 * Used by AnnouncementBanner on the dashboard.
 */
export async function fetchAnnouncements(): Promise<StaffHubEvent[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await staffHubReader
      .from('events')
      .select('id, title, description, event_type, start_date, end_date, expires_at')
      .eq('event_type', 'announcement')
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order('start_date', { ascending: false })
    if (error) {
      console.warn('[StaffHub] fetchAnnouncements failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchAnnouncements threw:', err)
    return []
  }
}

/**
 * Fetch upcoming gym events (excludes announcements and challenges).
 * Used by GymEvents widget on the dashboard.
 */
export async function fetchGymEvents(): Promise<StaffHubEvent[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await staffHubReader
      .from('events')
      .select('id, title, description, event_type, start_date, end_date, expires_at')
      .not('event_type', 'in', '("announcement","challenge")')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(5)
    if (error) {
      console.warn('[StaffHub] fetchGymEvents failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchGymEvents threw:', err)
    return []
  }
}

/**
 * Fetch active accountability challenges.
 * Used by ChallengesPreview on dashboard and community page.
 */
export async function fetchChallenges(limit?: number): Promise<StaffHubChallenge[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const today = new Date().toISOString().split('T')[0]
    let query = staffHubReader
      .from('challenges')
      .select('id, name, description, start_date, end_date, signup_deadline, how_to_signup, is_active')
      .eq('is_active', true)
      .gte('end_date', today)
      .order('start_date', { ascending: true })
    if (limit) query = query.limit(limit)
    const { data, error } = await query
    if (error) {
      console.warn('[StaffHub] fetchChallenges failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchChallenges threw:', err)
    return []
  }
}

/**
 * Fetch a single challenge by ID.
 * Used by the challenge detail page.
 */
export async function fetchChallenge(id: string): Promise<StaffHubChallenge | null> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return null
  try {
    const { data, error } = await staffHubReader
      .from('challenges')
      .select('id, name, description, start_date, end_date, signup_deadline, how_to_signup, is_active')
      .eq('id', id)
      .single()
    if (error) {
      console.warn('[StaffHub] fetchChallenge failed:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[StaffHub] fetchChallenge threw:', err)
    return null
  }
}

/**
 * Check whether a member has already signed up for a challenge.
 */
export async function isMemberSignedUp(challengeId: string, gymMasterId: string): Promise<boolean> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return false
  try {
    const { data } = await staffHubReader
      .from('challenge_signups')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('gymmaster_member_id', gymMasterId)
      .maybeSingle()
    return data !== null
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If you see `Cannot find module '@supabase/supabase-js'` it's already installed — check `package.json`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/lib/staffhub.ts
git commit -m "feat: add Staff Hub Supabase client with typed fetch helpers"
```

---

## Task 5: Members Area — Wire GymEvents Widget

**Files:**
- Modify: `src/components/dashboard/GymEvents.tsx`

- [ ] **Step 1: Replace GymEvents.tsx entirely**

```tsx
// src/components/dashboard/GymEvents.tsx
import { fetchGymEvents, StaffHubEvent } from '@/lib/staffhub'

const TYPE_CONFIG: Record<string, { emoji: string; colour: string; bg: string; border: string }> = {
  social:         { emoji: '🎉', colour: 'text-brand',         bg: 'bg-brand/10',         border: 'border-brand/20' },
  competition:    { emoji: '🏆', colour: 'text-status-amber',  bg: 'bg-status-amber/10',  border: 'border-status-amber/20' },
  marketing:      { emoji: '📣', colour: 'text-text-primary',  bg: 'bg-border-light',     border: 'border-border-light' },
  six_week_start: { emoji: '🚀', colour: 'text-brand',         bg: 'bg-brand/10',         border: 'border-brand/20' },
  holiday:        { emoji: '🔒', colour: 'text-status-amber',  bg: 'bg-status-amber/10',  border: 'border-status-amber/20' },
  bank_holiday:   { emoji: '🔒', colour: 'text-status-amber',  bg: 'bg-status-amber/10',  border: 'border-status-amber/20' },
  other:          { emoji: '📌', colour: 'text-text-secondary', bg: 'bg-bg-main',          border: 'border-border-light' },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.other
}

function formatEventDate(isoDate: string) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function daysUntil(isoDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function GymEvents() {
  const events: StaffHubEvent[] = await fetchGymEvents()

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Coming Up
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Gym Events</h2>
        </div>
        <span className="text-xl">📅</span>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-text-secondary">No upcoming events — check back soon.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const cfg = getTypeConfig(event.event_type)
            const days = daysUntil(event.start_date)
            return (
              <div key={event.id} className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0 mt-0.5">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-text-primary leading-tight">
                        {event.title}
                      </p>
                      <span className={`text-[10px] font-semibold shrink-0 ${cfg.colour}`}>
                        {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : formatEventDate(event.start_date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/GymEvents.tsx
git commit -m "feat: wire GymEvents widget to live Staff Hub events"
```

---

## Task 6: Members Area — Wire AnnouncementBanner to Live Data

**Files:**
- Modify: `src/app/(member)/dashboard/page.tsx`

The `AnnouncementBanner` component accepts an `announcements` prop — we fetch in the dashboard page (server component) and pass down.

- [ ] **Step 1: Update dashboard/page.tsx imports and fetch**

At the top of `src/app/(member)/dashboard/page.tsx`, add the staffhub import alongside the existing cookies import:

```tsx
import { fetchAnnouncements } from "@/lib/staffhub";
```

- [ ] **Step 2: Fetch announcements in the page and pass to component**

In the `DashboardPage` function, add the fetch call after the cookie read:

```tsx
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const firstName = cookieStore.get("gymmaster_first_name")?.value || "there";

  // Fetch live announcements from Staff Hub (falls back to [] if unreachable)
  const announcements = await fetchAnnouncements();
```

- [ ] **Step 3: Update AnnouncementBanner call to use live data**

Replace the hardcoded `SAMPLE_ANNOUNCEMENTS` usage:

```tsx
{/* Announcements */}
<AnnouncementBanner announcements={announcements.map(a => ({
  id: a.id,
  title: a.title,
  body: a.description,
  priority: 'normal',
  published_at: a.start_date,
}))} />
```

- [ ] **Step 4: Remove the SAMPLE_ANNOUNCEMENTS constant**

Delete these lines from dashboard/page.tsx (they are no longer needed):

```tsx
// TODO Phase 1: replace with real Supabase + GymMaster data once auth is wired
const SAMPLE_ANNOUNCEMENTS = [
  {
    id: "1",
    title: "New testing block starts Monday 14th April",
    body: "Make sure you've booked in for your testing session. Results will be available in your dashboard the same day.",
    priority: "high",
    published_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Gym closed Easter Bank Holiday — Friday 18th & Monday 21st April",
    body: null,
    priority: "normal",
    published_at: new Date().toISOString(),
  },
];
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/(member)/dashboard/page.tsx
git commit -m "feat: wire AnnouncementBanner to live Staff Hub announcements"
```

---

## Task 7: Members Area — Wire ChallengesPreview Widget

**Files:**
- Modify: `src/components/dashboard/ChallengesPreview.tsx`

- [ ] **Step 1: Replace ChallengesPreview.tsx entirely**

```tsx
// src/components/dashboard/ChallengesPreview.tsx
import Link from 'next/link'
import { fetchChallenges, StaffHubChallenge } from '@/lib/staffhub'

function daysUntil(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function ChallengesPreview() {
  const challenges: StaffHubChallenge[] = await fetchChallenges(2)

  if (challenges.length === 0) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Active
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Challenges</h2>
        </div>
        <Link
          href="/community"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-4">
        {challenges.map((challenge) => {
          const daysLeft = daysUntil(challenge.end_date)
          const deadlinePassed = challenge.signup_deadline
            ? new Date(challenge.signup_deadline + 'T00:00:00') < new Date()
            : false

          return (
            <Link
              key={challenge.id}
              href={`/community/challenge/${challenge.id}`}
              className="block group"
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">
                  {challenge.name}
                </p>
                <span className="text-[10px] text-text-secondary shrink-0 ml-2">
                  {daysLeft}d left
                </span>
              </div>
              {challenge.description && (
                <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                  {challenge.description}
                </p>
              )}
              {!deadlinePassed && challenge.signup_deadline && (
                <p className="text-[11px] text-brand font-medium">
                  Sign up by {new Date(challenge.signup_deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} →
                </p>
              )}
              {deadlinePassed && (
                <p className="text-[11px] text-text-secondary">Sign-up closed</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ChallengesPreview.tsx
git commit -m "feat: wire ChallengesPreview to live Staff Hub challenges"
```

---

## Task 8: Members Area — Wire Community Page Challenges

**Files:**
- Modify: `src/app/(member)/community/page.tsx`

The community page has seed `ACTIVE_CHALLENGES` array. We replace just that section with live data. The awards section stays on seed for now.

- [ ] **Step 1: Read the current community page structure**

Open `src/app/(member)/community/page.tsx` and identify:
- The `Challenge` type definition
- The `ACTIVE_CHALLENGES` seed array  
- Where challenges are rendered in the JSX

- [ ] **Step 2: Make the component async and add Staff Hub import**

Change the function signature at the top of the file:

```tsx
// Add at top of file with other imports:
import { fetchChallenges, StaffHubChallenge } from '@/lib/staffhub'

// Change the component signature from:
export default function CommunityPage() {

// To:
export default async function CommunityPage() {
```

- [ ] **Step 3: Fetch challenges in the component**

At the start of the component body, before the return statement, add:

```tsx
const liveChallenges: StaffHubChallenge[] = await fetchChallenges()
```

- [ ] **Step 4: Replace the ACTIVE_CHALLENGES usage in JSX**

Find where `ACTIVE_CHALLENGES.map(...)` is used in the JSX and replace it with `liveChallenges.map(...)`. Update the map callback to use the new field names (`challenge.name` instead of `challenge.title`):

```tsx
{liveChallenges.length === 0 ? (
  <p className="text-text-secondary text-sm">No active challenges right now — check back soon.</p>
) : (
  liveChallenges.map((challenge) => {
    const daysLeft = Math.round(
      (new Date(challenge.end_date + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) 
      / (1000 * 60 * 60 * 24)
    )
    const deadlinePassed = challenge.signup_deadline
      ? new Date(challenge.signup_deadline + 'T00:00:00') < new Date()
      : false

    return (
      <Link
        key={challenge.id}
        href={`/community/challenge/${challenge.id}`}
        className="block bg-bg-card border border-border-light rounded-2xl p-5 hover:border-brand/40 transition-colors relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-text-primary text-sm">{challenge.name}</h3>
          <span className="text-[10px] text-text-secondary shrink-0 ml-3">{daysLeft}d left</span>
        </div>
        {challenge.description && (
          <p className="text-xs text-text-secondary mb-3 leading-relaxed line-clamp-3">
            {challenge.description}
          </p>
        )}
        <span className={`text-xs font-semibold ${deadlinePassed ? 'text-text-secondary' : 'text-brand'}`}>
          {deadlinePassed ? 'Sign-up closed' : `Sign up →`}
        </span>
      </Link>
    )
  })
)}
```

- [ ] **Step 5: Remove the old Challenge type and ACTIVE_CHALLENGES seed constant**

Delete the `Challenge` type and `ACTIVE_CHALLENGES` array from the file — they are replaced by `StaffHubChallenge` from staffhub.ts.

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(member)/community/page.tsx
git commit -m "feat: wire community page challenges to live Staff Hub data"
```

---

## Task 9: Members Area — Sign-Up API Route

**Files:**
- Create: `src/app/api/challenges/signup/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/challenges/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(req: NextRequest) {
  // Auth check — member must be logged in
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
  const memberName = cookieStore.get('gymmaster_first_name')?.value ?? null

  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Parse body
  let challengeId: string
  try {
    const body = await req.json()
    challengeId = body.challengeId
    if (!challengeId || typeof challengeId !== 'string') throw new Error('missing')
  } catch {
    return NextResponse.json({ error: 'Invalid request body — challengeId required' }, { status: 400 })
  }

  // Check challenge exists and sign-up deadline hasn't passed
  const { data: challenge, error: fetchError } = await staffHubWriter
    .from('challenges')
    .select('id, name, signup_deadline, end_date, is_active')
    .eq('id', challengeId)
    .single()

  if (fetchError || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  if (!challenge.is_active) {
    return NextResponse.json({ error: 'This challenge is no longer active' }, { status: 400 })
  }

  if (challenge.signup_deadline) {
    const deadline = new Date(challenge.signup_deadline + 'T23:59:59')
    if (new Date() > deadline) {
      return NextResponse.json({ error: 'Sign-up deadline has passed' }, { status: 400 })
    }
  }

  // Record sign-up
  const { error: insertError } = await staffHubWriter
    .from('challenge_signups')
    .insert({
      challenge_id: challengeId,
      gymmaster_member_id: gymMasterId,
      member_name: memberName,
    })

  if (insertError) {
    // Postgres unique violation code = 23505
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'already_signed_up' }, { status: 409 })
    }
    console.error('[challenges/signup] insert error:', insertError.message)
    return NextResponse.json({ error: 'Failed to record sign-up — please try again' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/challenges/signup/route.ts
git commit -m "feat: add challenge sign-up API route writing to Staff Hub"
```

---

## Task 10: Members Area — Challenge Detail Page

**Files:**
- Rewrite: `src/app/(member)/community/challenge/[id]/page.tsx`

This page currently has seed data with leaderboards and progress tracking. We replace it with a simpler page that shows live challenge data and a sign-up button with instructions.

- [ ] **Step 1: Replace the entire file**

```tsx
// src/app/(member)/community/challenge/[id]/page.tsx
'use client' // needs to be client for sign-up button state

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StaffHubChallenge } from '@/lib/staffhub'

// The page is a client component but data fetching happens via a server-rendered
// parent. We use a hybrid: the page shell is server (metadata, fetch), 
// and the sign-up button is extracted to a client component.

export { default } from './_page'
```

Wait — actually this should be a Server Component for data fetching, with just the sign-up button as a Client Component. Let me structure it properly.

Delete the above and instead write the file as follows:

```tsx
// src/app/(member)/community/challenge/[id]/page.tsx
import Link from 'next/link'
import { fetchChallenge, isMemberSignedUp } from '@/lib/staffhub'
import { cookies } from 'next/headers'
import SignUpButton from './SignUpButton'

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value ?? ''

  const [challenge, alreadySignedUp] = await Promise.all([
    fetchChallenge(id),
    gymMasterId ? isMemberSignedUp(id, gymMasterId) : Promise.resolve(false),
  ])

  if (!challenge) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-secondary text-sm mb-4">Challenge not found.</p>
        <Link href="/community" className="text-brand text-sm font-medium hover:underline">
          ← Back to Community
        </Link>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(challenge.end_date + 'T00:00:00')
  const daysLeft = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const deadlinePassed = challenge.signup_deadline
    ? new Date(challenge.signup_deadline + 'T23:59:59') < new Date()
    : false

  const formatDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

  return (
    <div>
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-brand transition-colors mb-6 font-medium"
      >
        ← Community
      </Link>

      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-3 bg-brand/10 text-brand border border-brand/20">
          Accountability Challenge
        </span>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          {challenge.name}
        </h1>
        {challenge.description && (
          <p className="text-text-secondary text-sm max-w-prose leading-relaxed">
            {challenge.description}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <span className="text-xs text-text-secondary font-medium">
          {formatDate(challenge.start_date)} — {formatDate(challenge.end_date)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
          {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
        </span>
        {challenge.signup_deadline && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
            deadlinePassed
              ? 'bg-bg-card border-border-light text-text-secondary'
              : 'bg-brand/10 border-brand/20 text-brand'
          }`}>
            {deadlinePassed ? 'Sign-up closed' : `Sign up by ${formatDate(challenge.signup_deadline)}`}
          </span>
        )}
      </div>

      {/* How to sign up + button */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm max-w-lg">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <h2 className="font-semibold text-text-primary text-sm mb-3">How to join</h2>

        {challenge.how_to_signup ? (
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            {challenge.how_to_signup}
          </p>
        ) : (
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            Speak to a member of staff to join this challenge.
          </p>
        )}

        <SignUpButton
          challengeId={challenge.id}
          deadlinePassed={deadlinePassed}
          alreadySignedUp={alreadySignedUp}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the SignUpButton client component**

Create `src/app/(member)/community/challenge/[id]/SignUpButton.tsx`:

```tsx
'use client'

import { useState } from 'react'

type Props = {
  challengeId: string
  deadlinePassed: boolean
  alreadySignedUp: boolean
}

export default function SignUpButton({ challengeId, deadlinePassed, alreadySignedUp }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>(
    alreadySignedUp ? 'already' : 'idle'
  )

  async function handleSignUp() {
    setStatus('loading')
    try {
      const res = await fetch('/api/challenges/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      })
      const data = await res.json()
      if (res.status === 409 || data.error === 'already_signed_up') {
        setStatus('already')
      } else if (!res.ok) {
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setStatus('error')
    }
  }

  if (deadlinePassed) {
    return (
      <p className="text-sm text-text-secondary font-medium">
        Sign-up is now closed for this challenge.
      </p>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-status-green font-semibold text-sm">
        <span>✓</span> You&apos;re signed up! 🎉
      </div>
    )
  }

  if (status === 'already') {
    return (
      <div className="flex items-center gap-2 text-brand font-semibold text-sm">
        <span>✓</span> You&apos;re already signed up for this challenge
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-status-red">Something went wrong — please try again.</p>
        <button
          onClick={handleSignUp}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignUp}
      disabled={status === 'loading'}
      className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-brand text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
    >
      {status === 'loading' ? 'Signing you up...' : 'Sign Up for this Challenge'}
    </button>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(member)/community/challenge/[id]/
git commit -m "feat: rewrite challenge detail page with live data and sign-up button"
```

---

## Task 11: End-to-End Test

- [ ] **Step 1: Create a test announcement in Staff Hub**

1. Start staff-hub dev server: `cd "/Users/edharper/Documents/Claude Gym/staff-hub" && npm run dev`
2. Go to http://localhost:3000/calendar → Events tab → Add Event
3. Set Type to "Member Announcement", Title to "Test Announcement", Start Date to today, Expires on to one week from today
4. Click Add Event

- [ ] **Step 2: Create a test challenge in Staff Hub**

1. Go to http://localhost:3000/accountability → Accountability Challenges tab
2. Click "New Challenge"
3. Fill in: Name "Test April Challenge", Start Date today, End Date in 2 weeks, Sign-up Deadline in 1 week, How to Sign Up "Speak to staff at reception"
4. Click Create Challenge

- [ ] **Step 3: Start members area dev server and verify dashboard**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npm run dev
```

Open http://localhost:3001/dashboard (log in first if needed). Verify:
- The announcement you created appears in the banner above the dashboard content
- The challenge appears in the Challenges preview widget
- No red error overlays in the browser or terminal

- [ ] **Step 4: Test the challenge sign-up flow**

1. Click the challenge in the dashboard or navigate to /community
2. Click the challenge card to open the detail page
3. Confirm sign-up instructions ("Speak to staff at reception") appear
4. Click "Sign Up for this Challenge"
5. Confirm button changes to "You're signed up! 🎉"

- [ ] **Step 5: Verify sign-up recorded in Staff Hub Supabase**

Run this query in the Staff Hub Supabase SQL editor:

```sql
SELECT cs.*, c.name as challenge_name 
FROM challenge_signups cs
JOIN challenges c ON c.id = cs.challenge_id
ORDER BY signed_up_at DESC 
LIMIT 5;
```

Expected: One row showing your gymmaster_member_id, your name (from cookie), the challenge name, and a recent timestamp.

- [ ] **Step 6: Final commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add .
git commit -m "feat: complete Staff Hub → Members Area integration

- Live announcements on dashboard (auto-hide on expiry)
- Live gym events widget 
- Live challenges preview + community page
- Challenge sign-up with database recording

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review Notes

1. **The `challenges` table uses `name` not `title`** — all references in members-area code use `challenge.name`. Checked: ✅
2. **The `announcement` event type constraint** — Task 1 Step 3 drops and recreates the constraint including all existing types plus `announcement`. If the DB already has `challenge` type events, dropping the constraint and recreating without `challenge` would break things. The recreation in Step 3 includes `challenge`. Checked: ✅
3. **The `fetchChallenges` function** uses `not('event_type', 'in', '("announcement","challenge")')` — this is the correct Supabase syntax for NOT IN with PostgREST. Checked: ✅
4. **Sign-up deadline check** — the API uses `T23:59:59` so signing up on the deadline day itself is allowed until midnight. Checked: ✅
5. **The challenge detail page uses Promise.all** for fetching challenge + signed-up status in parallel. Checked: ✅
