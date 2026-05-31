# Referral Events (Bring a Friend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Members can register guests for Bring a Friend gym sessions via the Members Area; staff track referrals and follow-up actions in a new Staff Hub tab.

**Architecture:** A new `bring_a_friend` event type slots into the existing events table; the Members Area renders a dedicated sign-up page per event (mirroring the challenge pattern); the Staff Hub gains a Referral Events tab in Member Engagement. A secondary change soft-archives award nominations instead of hard-deleting them.

**Tech Stack:** Next.js 15 App Router (both projects), Supabase (Staff Hub project `entbakkftqdejpjdynts`), TypeScript, Tailwind CSS.

---

## File Map

### Staff Hub (`/Users/edharper/Documents/Claude Gym/staff-hub/`)
| Action | File | Purpose |
|---|---|---|
| Modify | `src/components/calendar/EventManager.tsx` | Add `bring_a_friend` to EVENT_TYPES |
| **Create** | `src/components/engagement/ReferralEventsTab.tsx` | New tab: list signups with inline checkboxes |
| Modify | `src/app/member-engagement/page.tsx` | Register Referral Events tab |
| Modify | `src/components/engagement/AwardsTab.tsx` | Soft-archive nominations instead of hard-delete |

### Members Area (`/Users/edharper/Documents/Claude Gym/members-area/`)
| Action | File | Purpose |
|---|---|---|
| Modify | `src/lib/staffhub.ts` | Add `fetchBringAFriendEvent()` helper |
| Modify | `src/components/dashboard/GymEvents.tsx` | Add bring_a_friend config + CTA link |
| **Create** | `src/app/(member)/community/bring-a-friend/[id]/page.tsx` | Server component: event header + auth check |
| **Create** | `src/app/(member)/community/bring-a-friend/[id]/GuestSignUpForm.tsx` | Client component: multi-guest form |
| **Create** | `src/app/api/bring-a-friend/signup/route.ts` | API: validate + insert one guest row |

---

## Task 1: Database migration

**Files:** Supabase MCP (project `entbakkftqdejpjdynts`)

- [ ] **Step 1: Apply migration via Supabase MCP**

  Run the following SQL using the `apply_migration` MCP tool with `project_id: entbakkftqdejpjdynts` and `name: bring_a_friend_signups_and_nominations_archive`:

  ```sql
  -- New table for Bring a Friend guest registrations
  CREATE TABLE bring_a_friend_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    gymmaster_member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    friend_name TEXT NOT NULL,
    friend_email TEXT,
    friend_phone TEXT,
    added_to_gymmaster BOOLEAN NOT NULL DEFAULT FALSE,
    booked_for_consultation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Enable RLS (anon key cannot read; service role key used by API routes can write)
  ALTER TABLE bring_a_friend_signups ENABLE ROW LEVEL SECURITY;

  -- Staff Hub anon key can read (needed by ReferralEventsTab via supabase client)
  CREATE POLICY "anon_read_bring_a_friend_signups"
    ON bring_a_friend_signups FOR SELECT USING (true);

  -- Soft-archive column on award_nominations
  ALTER TABLE award_nominations
    ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
  ```

- [ ] **Step 2: Verify tables exist**

  Run via `execute_sql` MCP tool:
  ```sql
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'bring_a_friend_signups' ORDER BY ordinal_position;
  ```
  Expected: 10 rows including `id`, `event_id`, `gymmaster_member_id`, `member_name`, `friend_name`, `friend_email`, `friend_phone`, `added_to_gymmaster`, `booked_for_consultation`, `created_at`.

  Also run:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'award_nominations' AND column_name = 'archived';
  ```
  Expected: 1 row returned.

---

## Task 2: Staff Hub — add `bring_a_friend` event type

**Files:**
- Modify: `src/components/calendar/EventManager.tsx`

- [ ] **Step 1: Add the new type to EVENT_TYPES**

  In `src/components/calendar/EventManager.tsx`, find the `EVENT_TYPES` array (around line 16) and add the new entry:

  ```ts
  const EVENT_TYPES = [
    { value: 'competition', label: 'Competition', color: '#268384' },
    { value: 'social', label: 'Social', color: '#2a9a9b' },
    { value: 'bring_a_friend', label: 'Bring a Friend', color: '#3fb950' },  // ← add this line
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

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output (clean).

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  git add src/components/calendar/EventManager.tsx
  git commit -m "feat: add bring_a_friend event type to EventManager"
  ```

---

## Task 3: Staff Hub — ReferralEventsTab component

**Files:**
- Create: `src/components/engagement/ReferralEventsTab.tsx`

- [ ] **Step 1: Create the component**

  Create `src/components/engagement/ReferralEventsTab.tsx` with the full content below:

  ```tsx
  'use client'

  import { useState, useEffect } from 'react'
  import { supabase } from '@/lib/supabase'

  type BaFEvent = {
    id: string
    title: string
    start_date: string
  }

  type Signup = {
    id: string
    event_id: string
    gymmaster_member_id: string
    member_name: string
    friend_name: string
    friend_email: string | null
    friend_phone: string | null
    added_to_gymmaster: boolean
    booked_for_consultation: boolean
    created_at: string
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  export default function ReferralEventsTab() {
    const [events, setEvents] = useState<BaFEvent[]>([])
    const [selectedEventId, setSelectedEventId] = useState('')
    const [signups, setSignups] = useState<Signup[]>([])
    const [loading, setLoading] = useState(false)
    const [savingId, setSavingId] = useState<string | null>(null)

    useEffect(() => { loadEvents() }, [])
    useEffect(() => { if (selectedEventId) loadSignups() }, [selectedEventId])

    async function loadEvents() {
      const { data } = await supabase
        .from('events')
        .select('id, title, start_date')
        .eq('event_type', 'bring_a_friend')
        .order('start_date', { ascending: false })
      const evts = data || []
      setEvents(evts)
      if (evts.length > 0) setSelectedEventId(evts[0].id)
    }

    async function loadSignups() {
      setLoading(true)
      const { data } = await supabase
        .from('bring_a_friend_signups')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: true })
      setSignups(data || [])
      setLoading(false)
    }

    async function toggleField(
      id: string,
      field: 'added_to_gymmaster' | 'booked_for_consultation',
      current: boolean,
    ) {
      setSavingId(id)
      // Optimistic update
      setSignups(prev => prev.map(s => s.id === id ? { ...s, [field]: !current } : s))
      const { error } = await supabase
        .from('bring_a_friend_signups')
        .update({ [field]: !current })
        .eq('id', id)
      if (error) {
        // Revert on failure
        setSignups(prev => prev.map(s => s.id === id ? { ...s, [field]: current } : s))
      }
      setSavingId(null)
    }

    const pendingCount = signups.filter(
      s => !s.added_to_gymmaster || !s.booked_for_consultation,
    ).length

    const inputClass = 'bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#268384] transition-colors'

    if (events.length === 0) {
      return (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 text-center">
          <p className="text-[#888] text-sm mb-2">No Bring a Friend events found.</p>
          <p className="text-xs text-[#555]">
            Create one in the <span className="text-[#2a9a9b]">Events tab</span> using the &ldquo;Bring a Friend&rdquo; type.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        {/* Event selector + pending banner */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-[#666] mb-1">Event</label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className={inputClass}
            >
              {events.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} — {formatDate(e.start_date)}
                </option>
              ))}
            </select>
          </div>
          {pendingCount > 0 && (
            <div className="mt-4 bg-[#2e1f0a] border border-[#f0883e]/40 rounded-xl px-4 py-2.5 text-sm text-[#f0883e]">
              ⚠️ <strong>{pendingCount}</strong> guest{pendingCount !== 1 ? 's' : ''} with outstanding actions
            </div>
          )}
        </div>

        {/* Signups list */}
        {loading ? (
          <p className="text-sm text-[#555]">Loading…</p>
        ) : signups.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 text-center">
            <p className="text-[#888] text-sm">No guests registered for this event yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {signups.map(signup => {
              const pending = !signup.added_to_gymmaster || !signup.booked_for_consultation
              return (
                <div
                  key={signup.id}
                  className={`bg-[#0a0a0a] rounded-xl p-4 border ${
                    pending ? 'border-[#f0883e]/30' : 'border-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Guest info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-semibold text-sm">{signup.friend_name}</span>
                        <span className="text-[10px] text-[#555]">referred by</span>
                        <span className="text-[#888] text-xs">{signup.member_name}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-[#666]">
                        {signup.friend_email && <span>✉ {signup.friend_email}</span>}
                        {signup.friend_phone && <span>📞 {signup.friend_phone}</span>}
                        {!signup.friend_email && !signup.friend_phone && (
                          <span className="text-[#444]">No contact details</span>
                        )}
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex gap-4 shrink-0 flex-wrap">
                      {(['added_to_gymmaster', 'booked_for_consultation'] as const).map(field => {
                        const checked = signup[field]
                        const label = field === 'added_to_gymmaster' ? 'Added to GymMaster' : 'Booked for consultation'
                        return (
                          <button
                            key={field}
                            onClick={() => toggleField(signup.id, field, checked)}
                            disabled={savingId === signup.id}
                            className="flex items-center gap-2 text-xs text-left disabled:opacity-60"
                          >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors shrink-0 ${
                              checked ? 'bg-[#268384] border-[#268384] text-white' : 'border-[#333]'
                            }`}>
                              {checked ? '✓' : ''}
                            </span>
                            <span className={checked ? 'text-[#555] line-through' : 'text-[#aaa]'}>
                              {label}
                            </span>
                          </button>
                        )
                      })}
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

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  git add src/components/engagement/ReferralEventsTab.tsx
  git commit -m "feat: add ReferralEventsTab component"
  ```

---

## Task 4: Staff Hub — wire Referral Events tab into Member Engagement

**Files:**
- Modify: `src/app/member-engagement/page.tsx`

- [ ] **Step 1: Import the component and add the tab**

  Replace the full file content of `src/app/member-engagement/page.tsx` with:

  ```tsx
  'use client'

  import { useState } from 'react'
  import AnnouncementsTab from '@/components/engagement/AnnouncementsTab'
  import ChallengesTab from '@/components/engagement/ChallengesTab'
  import AwardsTab from '@/components/engagement/AwardsTab'
  import ReferralEventsTab from '@/components/engagement/ReferralEventsTab'

  const TABS = [
    { key: 'announcements', label: '📢 Announcements' },
    { key: 'challenges', label: '🏅 Accountability Challenges' },
    { key: 'awards', label: '🏆 Awards' },
    { key: 'referral', label: '🤝 Referral Events' },
  ]

  export default function MemberEngagementPage() {
    const [activeTab, setActiveTab] = useState('announcements')

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Accountability</h1>
          <p className="text-sm text-[#888] mt-1">Announcements, accountability challenges, awards and referral events</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#0d1f1f] text-[#2a9a9b] border border-[#268384]'
                  : 'text-[#666] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'awards' && <AwardsTab />}
        {activeTab === 'referral' && <ReferralEventsTab />}
      </div>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  git add src/app/member-engagement/page.tsx
  git commit -m "feat: add Referral Events tab to Member Engagement"
  ```

---

## Task 5: Staff Hub — soft-archive award nominations

**Files:**
- Modify: `src/components/engagement/AwardsTab.tsx`

- [ ] **Step 1: Update the Nomination type**

  Find the `Nomination` type near the top of `src/components/engagement/AwardsTab.tsx` and add the `archived` field:

  ```ts
  type Nomination = {
    id: string
    gymmaster_member_id: string
    nominator_name: string | null
    nominee_name: string
    reason: string | null
    month: string // YYYY-MM
    created_at: string
    archived: boolean   // ← add this line
  }
  ```

- [ ] **Step 2: Add showArchived state**

  Find the block of `useState` declarations (around line 54) and add one more:

  ```ts
  const [showArchived, setShowArchived] = useState(false)
  ```

- [ ] **Step 3: Update loadNominations to filter archived**

  Replace the existing `loadNominations` function with:

  ```ts
  async function loadNominations() {
    // selectedMonth is 'YYYY-MM-01'; nominations.month is 'YYYY-MM'
    const ym = selectedMonth.slice(0, 7)
    const { data } = await supabase
      .from('award_nominations')
      .select('*')
      .eq('month', ym)
      .eq('archived', showArchived)
      .order('created_at', { ascending: false })
    setNominations(data || [])
  }
  ```

  Also update the `useEffect` dependency array to re-run when `showArchived` changes. Find:

  ```ts
  useEffect(() => {
    loadAwards()
    loadAllAwards()
    loadNominations()
  }, [selectedMonth])
  ```

  Replace with:

  ```ts
  useEffect(() => {
    loadAwards()
    loadAllAwards()
    loadNominations()
  }, [selectedMonth, showArchived])
  ```

- [ ] **Step 4: Replace deleteNomination with archiveNomination**

  Find the `deleteNomination` function and replace it entirely:

  ```ts
  async function archiveNomination(id: string) {
    await supabase.from('award_nominations').update({ archived: true }).eq('id', id)
    await loadNominations()
  }
  ```

- [ ] **Step 5: Update the nominations panel UI**

  Find the nominations panel section (the `{nominations.length > 0 && (` block) and replace it with the version below. Key changes: the ✕ button calls `archiveNomination`, its title changes to "Dismiss", and a "Show dismissed" toggle is added at the bottom.

  ```tsx
  {/* Member nominations panel */}
  {(nominations.length > 0 || showArchived) && (
    <div className="bg-[#0d1a1a] border border-[#1a3030] rounded-xl p-4">
      <p className="text-sm font-semibold text-[#2a9a9b] mb-3">
        {showArchived
          ? `Dismissed nominations for ${formatMonth(selectedMonth)}`
          : `🏆 ${nominations.length} member nomination${nominations.length !== 1 ? 's' : ''} for ${formatMonth(selectedMonth)}`
        }
      </p>
      {nominations.length === 0 && showArchived && (
        <p className="text-xs text-[#555]">No dismissed nominations for this month.</p>
      )}
      <div className="space-y-2">
        {nominations.map((n) => (
          <div key={n.id} className={`flex items-start justify-between gap-3 text-xs text-[#aaa] ${showArchived ? 'opacity-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <span className={`text-white font-medium ${showArchived ? 'line-through' : ''}`}>{n.nominee_name}</span>
              {n.nominator_name && (
                <span className="text-[#666] ml-2">— nominated by {n.nominator_name}</span>
              )}
              {n.reason && (
                <p className="text-[#777] mt-0.5 italic truncate">&ldquo;{n.reason}&rdquo;</p>
              )}
            </div>
            {!showArchived && (
              <button
                onClick={() => archiveNomination(n.id)}
                className="text-[#333] hover:text-[#f85149] transition-colors flex-shrink-0 px-1"
                title="Dismiss nomination"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => setShowArchived(v => !v)}
        className="mt-3 text-[10px] text-[#444] hover:text-[#888] transition-colors"
      >
        {showArchived ? '← Back to active nominations' : 'Show dismissed nominations'}
      </button>
    </div>
  )}
  ```

- [ ] **Step 6: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 7: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  git add src/components/engagement/AwardsTab.tsx
  git commit -m "feat: soft-archive award nominations instead of hard-delete"
  ```

- [ ] **Step 8: Push Staff Hub**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/staff-hub"
  git push
  ```

---

## Task 6: Members Area — `fetchBringAFriendEvent` helper

**Files:**
- Modify: `src/lib/staffhub.ts`

- [ ] **Step 1: Add the fetch helper at the end of staffhub.ts**

  Append the following to the bottom of `src/lib/staffhub.ts`:

  ```ts
  /**
   * Fetch a single Bring a Friend event by ID.
   * Returns null if the event doesn't exist or has a different event_type.
   * Used by the bring-a-friend detail page to guard against wrong IDs.
   */
  export async function fetchBringAFriendEvent(id: string): Promise<StaffHubEvent | null> {
    if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return null
    try {
      const { data, error } = await staffHubReader
        .from('events')
        .select('id, title, description, event_type, start_date, end_date, expires_at')
        .eq('id', id)
        .eq('event_type', 'bring_a_friend')
        .maybeSingle()
      if (error) {
        console.warn('[StaffHub] fetchBringAFriendEvent failed:', error.message)
        return null
      }
      return data
    } catch (err) {
      console.warn('[StaffHub] fetchBringAFriendEvent threw:', err)
      return null
    }
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/lib/staffhub.ts
  git commit -m "feat: add fetchBringAFriendEvent helper to staffhub lib"
  ```

---

## Task 7: Members Area — GymEvents widget bring_a_friend CTA

**Files:**
- Modify: `src/components/dashboard/GymEvents.tsx`

- [ ] **Step 1: Add bring_a_friend to EVENT_TYPE_CONFIG**

  Find `EVENT_TYPE_CONFIG` in `src/components/dashboard/GymEvents.tsx` and add the new entry:

  ```ts
  const EVENT_TYPE_CONFIG: Record<string, { emoji: string; colour: string; bg: string; border: string; label: string }> = {
    social:           { emoji: '🎉', colour: 'text-brand',          bg: 'bg-brand/10',           border: 'border-brand/20',           label: 'Social' },
    competition:      { emoji: '🏆', colour: 'text-status-amber',   bg: 'bg-status-amber/10',    border: 'border-status-amber/20',    label: 'Competition' },
    workshop:         { emoji: '📚', colour: 'text-text-primary',   bg: 'bg-border-light',       border: 'border-border-light',       label: 'Workshop' },
    bring_a_friend:   { emoji: '🤝', colour: 'text-status-green',   bg: 'bg-status-green/10',    border: 'border-status-green/20',    label: 'Bring a Friend' },   // ← add this
    other:            { emoji: '📌', colour: 'text-text-secondary', bg: 'bg-bg-main',            border: 'border-border-light',       label: 'Event' },
  }
  ```

- [ ] **Step 2: Add the CTA link for bring_a_friend events**

  Inside the `events.map(...)` block, after the description paragraph, add the CTA. The full updated return inside the map should be:

  ```tsx
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
            {event.event_type === 'bring_a_friend' && (
              <a
                href={`/community/bring-a-friend/${event.id}`}
                className="inline-block mt-2 text-xs font-semibold text-status-green hover:underline"
              >
                Register your guest →
              </a>
            )}
          </div>
        </div>
      </div>
    )
  })}
  ```

  Note: `GymEvents` is a server component — use `<a>` not `<Link>` unless `next/link` is already imported. Check the file header; if `import Link from 'next/link'` is present, use `<Link href=...>` instead.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 4: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/components/dashboard/GymEvents.tsx
  git commit -m "feat: add bring_a_friend event type and CTA link to GymEvents widget"
  ```

---

## Task 8: Members Area — Bring a Friend page

**Files:**
- Create: `src/app/(member)/community/bring-a-friend/[id]/GuestSignUpForm.tsx`
- Create: `src/app/(member)/community/bring-a-friend/[id]/page.tsx`

- [ ] **Step 1: Create GuestSignUpForm client component**

  Create `src/app/(member)/community/bring-a-friend/[id]/GuestSignUpForm.tsx`:

  ```tsx
  'use client'

  import { useState } from 'react'

  type GuestEntry = { name: string; email: string; phone: string }

  function blankGuest(): GuestEntry {
    return { name: '', email: '', phone: '' }
  }

  function isEntryValid(entry: GuestEntry): boolean {
    return (
      entry.name.trim().length > 0 &&
      (entry.email.trim().length > 0 || entry.phone.trim().length > 0)
    )
  }

  export default function GuestSignUpForm({
    eventId,
    isLoggedIn,
  }: {
    eventId: string
    isLoggedIn: boolean
  }) {
    const [guests, setGuests] = useState<GuestEntry[]>([blankGuest()])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmedNames, setConfirmedNames] = useState<string[] | null>(null)

    if (!isLoggedIn) {
      return (
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 text-center">
          <p className="text-text-secondary text-sm">
            Please <a href="/login" className="text-brand hover:underline">log in</a> to register your guest.
          </p>
        </div>
      )
    }

    function updateGuest(idx: number, field: keyof GuestEntry, value: string) {
      setGuests(prev =>
        prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)),
      )
    }

    function addGuest() {
      setGuests(prev => [...prev, blankGuest()])
    }

    function removeGuest(idx: number) {
      setGuests(prev => prev.filter((_, i) => i !== idx))
    }

    const allValid = guests.length > 0 && guests.every(isEntryValid)

    async function handleSubmit() {
      if (!allValid) return
      setSubmitting(true)
      setError(null)
      const names: string[] = []

      for (const guest of guests) {
        const res = await fetch('/api/bring-a-friend/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            friendName: guest.name.trim(),
            friendEmail: guest.email.trim() || undefined,
            friendPhone: guest.phone.trim() || undefined,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(`Failed to register ${guest.name}: ${data.error ?? 'please try again'}`)
          setSubmitting(false)
          return
        }

        names.push(guest.name.trim())
      }

      setConfirmedNames(names)
      setSubmitting(false)
    }

    const inputClass =
      'w-full bg-bg-card border border-border-light rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors'

    if (confirmedNames) {
      const nameList =
        confirmedNames.length === 1
          ? confirmedNames[0]
          : `${confirmedNames.slice(0, -1).join(', ')} and ${confirmedNames[confirmedNames.length - 1]}`

      return (
        <div className="bg-bg-card border border-border-light rounded-2xl p-6">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🤝</div>
            <p className="font-semibold text-text-primary mb-1">Guests registered!</p>
            <p className="text-sm text-text-secondary">
              You&apos;ve registered {nameList} for this session. We&apos;ll be in touch with them shortly.
            </p>
          </div>
          <button
            onClick={() => {
              setGuests([blankGuest()])
              setConfirmedNames(null)
            }}
            className="w-full border border-border-light hover:border-brand text-text-secondary hover:text-brand rounded-xl py-2.5 text-sm transition-colors"
          >
            + Register more guests
          </button>
        </div>
      )
    }

    return (
      <div className="bg-bg-card border border-border-light rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
            Your Guests
          </p>
          <p className="text-xs text-text-muted">
            Enter the name and contact details for each person you&apos;re bringing. Please include at least an email or phone number so we can get in touch.
          </p>
        </div>

        <div className="space-y-4">
          {guests.map((guest, idx) => (
            <div
              key={idx}
              className="bg-bg-base border border-border-light rounded-xl p-4 space-y-3 relative"
            >
              {guests.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGuest(idx)}
                  className="absolute top-3 right-3 text-text-muted hover:text-red-400 text-lg leading-none transition-colors"
                  aria-label="Remove guest"
                >
                  ×
                </button>
              )}

              <p className="text-xs font-semibold text-text-secondary">
                Guest {idx + 1}
              </p>

              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Name <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  value={guest.name}
                  onChange={e => updateGuest(idx, 'name', e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={guest.email}
                  onChange={e => updateGuest(idx, 'email', e.target.value)}
                  placeholder="jane@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Phone</label>
                <input
                  type="tel"
                  value={guest.phone}
                  onChange={e => updateGuest(idx, 'phone', e.target.value)}
                  placeholder="07XXX XXXXXX"
                  className={inputClass}
                />
              </div>

              {guest.name.trim().length > 0 && !isEntryValid(guest) && (
                <p className="text-xs text-red-400">
                  Please provide at least an email or phone number.
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addGuest}
          className="w-full border border-dashed border-border-light hover:border-brand text-text-muted hover:text-brand rounded-xl py-2.5 text-sm transition-colors"
        >
          + Add another guest
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allValid || submitting}
          className="w-full bg-brand hover:bg-brand/80 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          {submitting
            ? 'Registering…'
            : `Register ${guests.length === 1 ? 'guest' : `${guests.length} guests`}`}
        </button>
      </div>
    )
  }
  ```

- [ ] **Step 2: Create the server component page**

  Create `src/app/(member)/community/bring-a-friend/[id]/page.tsx`:

  ```tsx
  import { cookies } from 'next/headers'
  import Link from 'next/link'
  import { notFound } from 'next/navigation'
  import { fetchBringAFriendEvent } from '@/lib/staffhub'
  import GuestSignUpForm from './GuestSignUpForm'

  function formatDate(isoDate: string): string {
    return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  export default async function BringAFriendPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params
    const event = await fetchBringAFriendEvent(id)
    if (!event) notFound()

    const cookieStore = await cookies()
    const isLoggedIn = !!cookieStore.get('gymmaster_member_id')?.value

    return (
      <div className="space-y-6 max-w-lg">
        {/* Back link + header */}
        <div>
          <Link
            href="/community"
            className="text-xs text-text-secondary hover:text-brand transition-colors font-medium mb-3 inline-block"
          >
            ← Community
          </Link>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
            Bring a Friend
          </p>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            {event.title}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {formatDate(event.start_date)}
          </p>
          {event.description && (
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        <GuestSignUpForm eventId={event.id} isLoggedIn={isLoggedIn} />
      </div>
    )
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 4: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add "src/app/(member)/community/bring-a-friend/[id]/page.tsx" \
          "src/app/(member)/community/bring-a-friend/[id]/GuestSignUpForm.tsx"
  git commit -m "feat: add bring-a-friend event page with multi-guest form"
  ```

---

## Task 9: Members Area — API route

**Files:**
- Create: `src/app/api/bring-a-friend/signup/route.ts`

- [ ] **Step 1: Create the API route**

  Create `src/app/api/bring-a-friend/signup/route.ts`:

  ```ts
  import { NextRequest, NextResponse } from 'next/server'
  import { cookies } from 'next/headers'
  import { staffHubWriter } from '@/lib/staffhub'
  import { getMemberProfile } from '@/lib/gymmaster'

  export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
    const firstName = cookieStore.get('gymmaster_first_name')?.value ?? ''
    const lastName = cookieStore.get('gymmaster_last_name')?.value ?? ''
    const gymMasterToken = cookieStore.get('gymmaster_token')?.value

    if (!gymMasterId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, friendName, friendEmail, friendPhone } = body as {
      eventId: string
      friendName: string
      friendEmail?: string
      friendPhone?: string
    }

    // Validate required fields
    if (!eventId || !friendName?.trim()) {
      return NextResponse.json(
        { error: 'eventId and friendName are required' },
        { status: 400 },
      )
    }

    if (!friendEmail?.trim() && !friendPhone?.trim()) {
      return NextResponse.json(
        { error: 'At least one of email or phone is required' },
        { status: 400 },
      )
    }

    // Resolve member name — cookies first, GymMaster API as fallback
    let memberName = [firstName, lastName].filter(Boolean).join(' ')
    if (!memberName && gymMasterToken) {
      const profile = await getMemberProfile(gymMasterToken)
      if (profile?.firstName) {
        memberName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
      }
    }
    if (!memberName) memberName = `Member ${gymMasterId}`

    const { error } = await staffHubWriter.from('bring_a_friend_signups').insert({
      event_id: eventId,
      gymmaster_member_id: gymMasterId,
      member_name: memberName,
      friend_name: friendName.trim(),
      friend_email: friendEmail?.trim() || null,
      friend_phone: friendPhone?.trim() || null,
    })

    if (error) {
      console.error('[bring-a-friend] insert failed:', error.message)
      return NextResponse.json({ error: 'Failed to register guest' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 3: Commit and push**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/app/api/bring-a-friend/signup/route.ts
  git commit -m "feat: add bring-a-friend signup API route"
  git push
  ```

---

## Task 10: End-to-end smoke test

- [ ] **Step 1: Create a test event in Staff Hub**

  In the Staff Hub, go to Calendar & Shifts → Events tab. Create a new event:
  - Title: `Test Bring a Friend Session`
  - Type: `Bring a Friend`
  - Start date: today or tomorrow

- [ ] **Step 2: Verify it appears on the Members Area dashboard**

  Open the Members Area dashboard. The GymEvents widget should show the event with a `🤝` emoji and a "Register your guest →" link.

- [ ] **Step 3: Submit a guest as a logged-in member**

  Click "Register your guest →". The bring-a-friend page should load with the event title and date. Fill in:
  - Guest name: `Test Guest`
  - Email: `test@example.com`

  Click "Register guest". The confirmation screen should appear.

- [ ] **Step 4: Verify in Staff Hub Referral Events tab**

  In Staff Hub → Member Engagement → 🤝 Referral Events tab, select the test event. The guest row should appear with the member's name and guest details. Both checkboxes should be unticked and the row should have an orange border.

- [ ] **Step 5: Tick a checkbox and verify it saves**

  Click "Added to GymMaster". The checkbox should tick immediately. Refresh the page — the tick should persist.

- [ ] **Step 6: Verify database directly**

  Run via Supabase MCP `execute_sql`:
  ```sql
  SELECT member_name, friend_name, friend_email, added_to_gymmaster, booked_for_consultation
  FROM bring_a_friend_signups
  ORDER BY created_at DESC
  LIMIT 5;
  ```
  Expected: the test guest row appears with `added_to_gymmaster = true`.

- [ ] **Step 7: Clean up test data**

  ```sql
  DELETE FROM bring_a_friend_signups WHERE friend_name = 'Test Guest';
  DELETE FROM events WHERE title = 'Test Bring a Friend Session';
  ```

---

## Self-review checklist

- [x] **DB table** `bring_a_friend_signups` — Task 1
- [x] **`award_nominations.archived` column** — Task 1
- [x] **`bring_a_friend` event type in EventManager** — Task 2
- [x] **ReferralEventsTab** with event filter, signups list, inline checkboxes, orange pending indicator — Task 3
- [x] **Referral Events tab wired into Member Engagement page** — Task 4
- [x] **AwardsTab soft-archive** — dismiss button, `archived` filter, "Show dismissed" toggle — Task 5
- [x] **`fetchBringAFriendEvent` helper** — Task 6
- [x] **GymEvents widget** bring_a_friend config + CTA link — Task 7
- [x] **Bring-a-friend page** (server + client, params awaited, notFound guard) — Task 8
- [x] **API route** validation (name + email/phone), member name resolution, insert — Task 9
- [x] **End-to-end smoke test** — Task 10
