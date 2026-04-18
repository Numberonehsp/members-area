# Goals Page — Event Planner & Body Fat Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Upcoming Events" section to the Goals page (up to 3 personal events stored in Staff Hub Supabase) and fix the body fat goal progress bar so lower-is-better goals show correct progress.

**Architecture:** The Goals page is split into a server component shell (page.tsx) that renders a new async EventPlanner server component alongside the existing client-side goals UI (extracted to GoalsClient.tsx). Events are stored in a new `member_events` Supabase table, written via two API routes, and read server-side using the member's cookie. The body fat fix adds `startValue` to the Goal type and recalculates progress correctly for decrease goals.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase JS client, cookies() from next/headers. No test framework — verification is manual via the dev server.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/lib/staffhub.ts` | Add `MemberEvent` type + `fetchMemberEvents()` |
| Create | `src/app/api/member-events/route.ts` | POST — add event (enforces 3-cap) |
| Create | `src/app/api/member-events/[id]/route.ts` | DELETE — remove event |
| Create | `src/components/goals/EventPlannerClient.tsx` | Client component — add/delete UI |
| Create | `src/components/goals/EventPlanner.tsx` | Server component — fetches events, passes to client |
| Create | `src/components/goals/GoalsClient.tsx` | Client component — extracted goals UI with body fat fix |
| Modify | `src/app/(member)/goals/page.tsx` | Convert to server component, render EventPlanner + GoalsClient |

---

## Task 1: Create the `member_events` table in Staff Hub Supabase

**Files:** No code files — manual SQL in Supabase dashboard.

- [ ] **Step 1: Open the Staff Hub Supabase SQL editor**

Go to https://supabase.com/dashboard, open the **Staff Hub** project (`entbakkftqdejpjdynts`), then navigate to **SQL Editor**.

- [ ] **Step 2: Run the migration**

Paste and run this SQL:

```sql
create table member_events (
  id uuid primary key default gen_random_uuid(),
  gymmaster_member_id text not null,
  member_name text not null,
  event_name text not null,
  event_date date not null,
  created_at timestamptz not null default now()
);

alter table member_events enable row level security;

create policy "anon read all"
  on member_events for select using (true);

create policy "service role write"
  on member_events for all using (true);
```

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the table exists**

In the Supabase **Table Editor**, confirm `member_events` appears with columns: `id`, `gymmaster_member_id`, `member_name`, `event_name`, `event_date`, `created_at`.

---

## Task 2: Add `MemberEvent` type and `fetchMemberEvents` to staffhub.ts

**Files:**
- Modify: `src/lib/staffhub.ts` (append after the `fetchAwards` function, around line 180)

- [ ] **Step 1: Add the type and fetch helper**

Open `src/lib/staffhub.ts` and append this after the closing brace of `fetchAwards`:

```typescript
export type MemberEvent = {
  id: string
  gymmaster_member_id: string
  member_name: string
  event_name: string
  event_date: string   // ISO date 'YYYY-MM-DD'
  created_at: string
}

/**
 * Fetch upcoming events for a single member, ordered by event date ascending.
 * Used by the EventPlanner server component on the Goals page.
 */
export async function fetchMemberEvents(gymMasterId: string): Promise<MemberEvent[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('member_events')
      .select('id, gymmaster_member_id, member_name, event_name, event_date, created_at')
      .eq('gymmaster_member_id', gymMasterId)
      .order('event_date', { ascending: true })
    if (error) {
      console.warn('[StaffHub] fetchMemberEvents failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchMemberEvents threw:', err)
    return []
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/lib/staffhub.ts
git commit -m "feat: add MemberEvent type and fetchMemberEvents to staffhub client"
```

---

## Task 3: POST `/api/member-events` route

**Files:**
- Create: `src/app/api/member-events/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/member-events/route.ts` with this content:

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

const MAX_EVENTS = 3

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  const firstName = cookieStore.get('gymmaster_first_name')?.value ?? ''
  const lastName = cookieStore.get('gymmaster_last_name')?.value ?? ''

  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { event_name?: string; event_date?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event_name, event_date } = body
  if (!event_name?.trim() || !event_date) {
    return NextResponse.json({ error: 'event_name and event_date are required' }, { status: 400 })
  }

  // Enforce 3-event cap
  const { count, error: countError } = await staffHubWriter
    .from('member_events')
    .select('id', { count: 'exact', head: true })
    .eq('gymmaster_member_id', memberId)

  if (countError) {
    console.error('[member-events POST] count error:', countError.message)
    return NextResponse.json({ error: 'Failed to check event count' }, { status: 500 })
  }

  if ((count ?? 0) >= MAX_EVENTS) {
    return NextResponse.json({ error: `Maximum ${MAX_EVENTS} events allowed` }, { status: 422 })
  }

  const memberName = [firstName, lastName].filter(Boolean).join(' ') || 'Member'

  const { data, error } = await staffHubWriter
    .from('member_events')
    .insert({
      gymmaster_member_id: memberId,
      member_name: memberName,
      event_name: event_name.trim(),
      event_date,
    })
    .select('id, gymmaster_member_id, member_name, event_name, event_date, created_at')
    .single()

  if (error) {
    console.error('[member-events POST] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add "src/app/api/member-events/route.ts"
git commit -m "feat: add POST /api/member-events route with 3-event cap"
```

---

## Task 4: DELETE `/api/member-events/[id]` route

**Files:**
- Create: `src/app/api/member-events/[id]/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/member-events/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value

  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params

  // Only delete if the event belongs to this member
  const { error } = await staffHubWriter
    .from('member_events')
    .delete()
    .eq('id', id)
    .eq('gymmaster_member_id', memberId)

  if (error) {
    console.error('[member-events DELETE] error:', error.message)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add "src/app/api/member-events/[id]/route.ts"
git commit -m "feat: add DELETE /api/member-events/[id] route"
```

---

## Task 5: EventPlannerClient component

**Files:**
- Create: `src/components/goals/EventPlannerClient.tsx`

- [ ] **Step 1: Create the client component**

Create `src/components/goals/EventPlannerClient.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberEvent } from '@/lib/staffhub'

const MAX_EVENTS = 3

function formatEventDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(iso + 'T00:00:00')
  return Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function EventPlannerClient({
  initialEvents,
}: {
  initialEvents: MemberEvent[]
}) {
  const router = useRouter()
  const [events, setEvents] = useState<MemberEvent[]>(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAdd = events.length < MAX_EVENTS

  const today = new Date().toISOString().split('T')[0]

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/member-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: eventName, event_date: eventDate }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    setEvents((prev) =>
      [...prev, json.event].sort(
        (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )
    )
    setEventName('')
    setEventDate('')
    setShowForm(false)
    setSaving(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/member-events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Events
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Upcoming Events</h2>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => { setShowForm((v) => !v); setError(null) }}
            className="text-xs bg-brand hover:bg-brand-dark text-white font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {/* Event list */}
      {events.length > 0 && (
        <div className="space-y-2 mb-4">
          {events.map((ev) => {
            const days = daysUntil(ev.event_date)
            const isPast = days < 0
            return (
              <div
                key={ev.id}
                className="flex items-center gap-3 bg-bg-main border border-border-light rounded-xl px-4 py-3"
              >
                <span className="text-lg">📅</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{ev.event_name}</p>
                  <p className="text-xs text-text-secondary">{formatEventDate(ev.event_date)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isPast ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20 font-semibold">
                      Completed
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold font-data">
                      {days}d
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    className="text-text-secondary hover:text-status-red transition-colors"
                    aria-label={`Remove ${ev.event_name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && !showForm && (
        <p className="text-sm text-text-secondary mb-4">
          Add races, competitions, or other important dates — up to 3 events.
        </p>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 border-t border-border-light pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Event name
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Hyrox Manchester"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Date
            </label>
            <input
              required
              type="date"
              min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          {error && (
            <p className="text-xs text-status-red">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="flex-1 py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save event'}
            </button>
          </div>
        </form>
      )}

      {/* Cap notice */}
      {events.length >= MAX_EVENTS && (
        <p className="text-xs text-text-secondary mt-2">
          3 events saved — remove one to add another.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/components/goals/EventPlannerClient.tsx
git commit -m "feat: add EventPlannerClient component with add/delete and 3-event cap UI"
```

---

## Task 6: EventPlanner server component

**Files:**
- Create: `src/components/goals/EventPlanner.tsx`

- [ ] **Step 1: Create the server component**

Create `src/components/goals/EventPlanner.tsx`:

```typescript
import { cookies } from 'next/headers'
import { fetchMemberEvents } from '@/lib/staffhub'
import EventPlannerClient from './EventPlannerClient'

export default async function EventPlanner() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'

  const events = await fetchMemberEvents(memberId)

  return <EventPlannerClient initialEvents={events} />
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/components/goals/EventPlanner.tsx
git commit -m "feat: add EventPlanner server component"
```

---

## Task 7: Extract GoalsClient and convert goals page to server component

The current `src/app/(member)/goals/page.tsx` is a `"use client"` component containing all the goal UI. We need to:
1. Move all existing goals code into `src/components/goals/GoalsClient.tsx`
2. Convert `page.tsx` to a server component that renders `<EventPlanner />` then `<GoalsClient />`

**Files:**
- Create: `src/components/goals/GoalsClient.tsx`
- Modify: `src/app/(member)/goals/page.tsx`

- [ ] **Step 1: Create GoalsClient.tsx**

Create `src/components/goals/GoalsClient.tsx` with the full content below. This is the entire existing goals page content, moved verbatim — the only change is the export name becomes `GoalsClient` and `"use client"` stays at the top:

```typescript
"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalType = "strength" | "body" | "habit" | "education";
type GoalStatus = "active" | "completed";

type Goal = {
  id: string;
  type: GoalType;
  title: string;
  targetValue: number;
  unit: string;
  currentValue: number;
  startValue: number;
  deadline: string;
  status: GoalStatus;
  note: string;
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_GOALS: Goal[] = [
  {
    id: "g1",
    type: "strength",
    title: "Deadlift 180kg",
    targetValue: 180,
    unit: "kg",
    currentValue: 160,
    startValue: 160,
    deadline: "2026-07-01",
    status: "active",
    note: "Hit 160 in April testing — 20kg to go.",
  },
  {
    id: "g2",
    type: "body",
    title: "Reach 15% body fat",
    targetValue: 15,
    unit: "%",
    currentValue: 18.6,
    startValue: 18.6,
    deadline: "2026-09-01",
    status: "active",
    note: "",
  },
  {
    id: "g3",
    type: "habit",
    title: "Train 12x this month",
    targetValue: 12,
    unit: "sessions",
    currentValue: 9,
    startValue: 0,
    deadline: "2026-04-30",
    status: "active",
    note: "",
  },
  {
    id: "g4",
    type: "education",
    title: "Complete Movement Fundamentals",
    targetValue: 6,
    unit: "modules",
    currentValue: 0,
    startValue: 0,
    deadline: "2026-06-01",
    status: "active",
    note: "",
  },
  {
    id: "g5",
    type: "strength",
    title: "Back Squat 130kg",
    targetValue: 130,
    unit: "kg",
    currentValue: 120,
    startValue: 100,
    deadline: "2026-07-01",
    status: "completed",
    note: "Actually hit 120 in April — updating target.",
  },
];

// ─── Type config ──────────────────────────────────────────────────────────────

type TypeConfig = {
  label: string;
  emoji: string;
  accentClass: string;
  progressClass: string;
  badgeBg: string;
  badgeText: string;
};

const TYPE_CONFIG: Record<GoalType, TypeConfig> = {
  strength: {
    label: "Strength",
    emoji: "💪",
    accentClass: "from-brand to-transparent",
    progressClass: "bg-brand",
    badgeBg: "bg-brand/10",
    badgeText: "text-brand",
  },
  body: {
    label: "Body",
    emoji: "⚖️",
    accentClass: "from-status-amber to-transparent",
    progressClass: "bg-status-amber",
    badgeBg: "bg-status-amber/10",
    badgeText: "text-status-amber",
  },
  habit: {
    label: "Habit",
    emoji: "🔥",
    accentClass: "from-status-green to-transparent",
    progressClass: "bg-status-green",
    badgeBg: "bg-status-green/10",
    badgeText: "text-status-green",
  },
  education: {
    label: "Education",
    emoji: "📚",
    accentClass: "",
    progressClass: "",
    badgeBg: "bg-[#7c6fcd]/10",
    badgeText: "text-[#7c6fcd]",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function progressPct(current: number, target: number, start: number): number {
  if (target === start) return 100;
  if (target > start) {
    // Increase goal (e.g. deadlift heavier)
    return Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)));
  } else {
    // Decrease goal (e.g. lower body fat)
    return Math.max(0, Math.min(100, Math.round(((start - current) / (start - target)) * 100)));
  }
}

function generateId(): string {
  return `g${Date.now()}`;
}

// ─── Blank form state ─────────────────────────────────────────────────────────

type FormState = {
  title: string;
  type: GoalType;
  currentValue: string;
  targetValue: string;
  unit: string;
  deadline: string;
  note: string;
};

const BLANK_FORM: FormState = {
  title: "",
  type: "strength",
  currentValue: "",
  targetValue: "",
  unit: "",
  deadline: "",
  note: "",
};

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onMarkComplete,
  onEdit,
}: {
  goal: Goal;
  onMarkComplete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}) {
  const cfg = TYPE_CONFIG[goal.type];
  const pct = progressPct(goal.currentValue, goal.targetValue, goal.startValue);
  const days = daysLeft(goal.deadline);
  const isOverdue = days < 0;
  const isEducation = goal.type === "education";
  const lowerIsBetter = goal.targetValue < goal.startValue;

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl relative overflow-hidden shadow-sm flex flex-col">
      {isEducation ? (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: "linear-gradient(to right, #7c6fcd, transparent)" }}
        />
      ) : (
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.accentClass}`} />
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${cfg.badgeBg} ${cfg.badgeText}`}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(goal)}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-border-light text-text-secondary hover:text-text-primary hover:border-brand/40 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onMarkComplete(goal.id)}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-status-green/30 text-status-green hover:bg-status-green/10 transition-colors"
              title="Mark complete"
            >
              ✓
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-text-primary text-sm leading-snug">{goal.title}</h3>

        <div>
          <div className="h-2 bg-border-light rounded-full overflow-hidden mb-1.5">
            {isEducation ? (
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: "#7c6fcd" }}
              />
            ) : (
              <div
                className={`h-full rounded-full transition-all ${cfg.progressClass}`}
                style={{ width: `${pct}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-data text-xs text-text-primary font-semibold">
              {goal.currentValue} / {goal.targetValue}{" "}
              <span className="text-text-secondary font-normal">{goal.unit}</span>
            </span>
            <div className="flex items-center gap-2">
              {lowerIsBetter && (
                <span className="text-[10px] text-text-secondary">↓ lower is better</span>
              )}
              <span className="text-xs text-text-secondary font-medium">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{formatDeadline(goal.deadline)}</span>
          {isOverdue ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-red/10 text-status-red border border-status-red/20 font-semibold">
              Overdue
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-light text-text-secondary font-medium">
              {days}d left
            </span>
          )}
        </div>

        {goal.note && (
          <p className="text-xs text-text-secondary italic leading-relaxed">{goal.note}</p>
        )}
      </div>
    </div>
  );
}

// ─── Completed card (compact) ─────────────────────────────────────────────────

function CompletedGoalCard({ goal }: { goal: Goal }) {
  const cfg = TYPE_CONFIG[goal.type];
  const pct = progressPct(goal.currentValue, goal.targetValue, goal.startValue);

  return (
    <div className="bg-bg-card border border-border-light rounded-xl relative overflow-hidden opacity-60 flex items-center gap-4 px-4 py-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-status-green/10 border border-status-green/20 flex items-center justify-center text-status-green text-sm font-bold">
        ✓
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
            {cfg.emoji}
          </span>
          <span className="text-sm font-semibold text-text-primary truncate">{goal.title}</span>
        </div>
        <span className="font-data text-xs text-text-secondary">
          {goal.currentValue} / {goal.targetValue} {goal.unit} · {pct}%
        </span>
      </div>
      <span className="text-[10px] text-text-secondary shrink-0">{formatDeadline(goal.deadline)}</span>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const GOAL_TYPES: { value: GoalType; label: string; emoji: string }[] = [
  { value: "strength", label: "Strength", emoji: "💪" },
  { value: "body", label: "Body", emoji: "⚖️" },
  { value: "habit", label: "Habit", emoji: "🔥" },
  { value: "education", label: "Education", emoji: "📚" },
];

function GoalModal({
  editingGoal,
  onSave,
  onClose,
}: {
  editingGoal: Goal | null;
  onSave: (form: FormState, editingId: string | null) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    editingGoal
      ? {
          title: editingGoal.title,
          type: editingGoal.type,
          currentValue: String(editingGoal.currentValue),
          targetValue: String(editingGoal.targetValue),
          unit: editingGoal.unit,
          deadline: editingGoal.deadline,
          note: editingGoal.note,
        }
      : BLANK_FORM
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form, editingGoal?.id ?? null);
  }

  function field(label: string, children: React.ReactNode) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </label>
        {children}
      </div>
    );
  }

  const inputClass =
    "bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-light rounded-2xl w-full max-w-md shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            {editingGoal ? "Edit Goal" : "New Goal"}
          </p>
          <h2 className="font-display text-xl text-text-primary">
            {editingGoal ? editingGoal.title : "Set a new target"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {field(
            "Title",
            <input
              required
              type="text"
              className={inputClass}
              placeholder="e.g. Deadlift 180kg"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          )}

          {field(
            "Type",
            <div className="flex gap-2 flex-wrap">
              {GOAL_TYPES.map((t) => {
                const selected = form.type === t.value;
                const cfg = TYPE_CONFIG[t.value];
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      selected
                        ? `${cfg.badgeBg} ${cfg.badgeText} border-current`
                        : "bg-bg-main border-border-light text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {field(
              "Current",
              <input
                required
                type="number"
                step="any"
                className={inputClass}
                placeholder="0"
                value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
              />
            )}
            {field(
              "Target",
              <input
                required
                type="number"
                step="any"
                className={inputClass}
                placeholder="100"
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
              />
            )}
            {field(
              "Unit",
              <input
                required
                type="text"
                className={inputClass}
                placeholder="kg"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            )}
          </div>

          {field(
            "Deadline",
            <input
              required
              type="date"
              className={inputClass}
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          )}

          {field(
            "Note (optional)",
            <textarea
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Any context or motivation…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-brand/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-sm font-semibold text-white transition-colors"
            >
              {editingGoal ? "Save changes" : "Add goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function GoalsClient() {
  const [goals, setGoals] = useState<Goal[]>(SEED_GOALS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const closestDeadline = activeGoals
    .slice()
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    ?.deadline;

  function openAddModal() { setEditingGoal(null); setModalOpen(true); }
  function openEditModal(goal: Goal) { setEditingGoal(goal); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingGoal(null); }

  function handleMarkComplete(id: string) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: "completed" } : g)));
  }

  function handleSave(form: FormState, editingId: string | null) {
    if (editingId) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === editingId
            ? {
                ...g,
                title: form.title,
                type: form.type,
                currentValue: parseFloat(form.currentValue) || 0,
                targetValue: parseFloat(form.targetValue) || 0,
                unit: form.unit,
                deadline: form.deadline,
                note: form.note,
              }
            : g
        )
      );
    } else {
      const currentVal = parseFloat(form.currentValue) || 0;
      const newGoal: Goal = {
        id: generateId(),
        type: form.type,
        title: form.title,
        currentValue: currentVal,
        startValue: currentVal,  // startValue locked at creation time
        targetValue: parseFloat(form.targetValue) || 0,
        unit: form.unit,
        deadline: form.deadline,
        status: "active",
        note: form.note,
      };
      setGoals((prev) => [...prev, newGoal]);
    }
    closeModal();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-brand font-semibold mb-0.5">
            My Goals
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-[0.95]">
            Goals
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Set targets, track progress, celebrate wins.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="mt-1 shrink-0 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + Add Goal
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active goals", value: activeGoals.length, colour: "text-text-primary" },
          { label: "Completed", value: completedGoals.length, colour: "text-status-green" },
          {
            label: "Closest deadline",
            value: closestDeadline ? formatDeadline(closestDeadline) : "—",
            colour: "text-status-amber",
            small: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden shadow-sm text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className={`font-display leading-none mb-1 ${s.colour} ${s.small ? "text-lg mt-1" : "text-3xl"}`}>
              {s.value}
            </p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {activeGoals.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold">
              Active — {activeGoals.length}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onMarkComplete={handleMarkComplete} onEdit={openEditModal} />
            ))}
          </div>
        </section>
      ) : (
        <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="font-semibold text-text-primary mb-1">No active goals</p>
          <p className="text-sm text-text-secondary mb-4">
            Add your first goal to start tracking progress.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Add Goal
          </button>
        </div>
      )}

      {completedGoals.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setCompletedOpen((v) => !v)}
            className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-semibold text-text-secondary hover:text-text-primary transition-colors mb-3"
          >
            <span className={`transition-transform ${completedOpen ? "rotate-90" : ""}`}>▶</span>
            <span>Completed — {completedGoals.length}</span>
          </button>

          {completedOpen && (
            <div className="space-y-2">
              {completedGoals.map((goal) => (
                <CompletedGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </section>
      )}

      {modalOpen && (
        <GoalModal editingGoal={editingGoal} onSave={handleSave} onClose={closeModal} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace page.tsx with a server component shell**

Replace the entire contents of `src/app/(member)/goals/page.tsx` with:

```typescript
import EventPlanner from '@/components/goals/EventPlanner'
import GoalsClient from '@/components/goals/GoalsClient'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <EventPlanner />
      <GoalsClient />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Start dev server and manually verify**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npm run dev
```

Go to http://localhost:3000/goals. You should see:
- "Upcoming Events" card at the top with an empty state message and "+ Add" button
- The existing goals grid below, unchanged
- The body fat goal ("Reach 15% body fat") progress bar should now show ~0% (not 100%) with a "↓ lower is better" label

Test adding an event:
1. Click "+ Add", fill in a name and date, click "Save event"
2. The event should appear as a card with a countdown badge
3. Click the trash icon — event disappears

- [ ] **Step 5: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/components/goals/GoalsClient.tsx "src/app/(member)/goals/page.tsx"
git commit -m "feat: extract GoalsClient, convert goals page to server component, fix body fat progress bar"
```

---

## Task 8: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git push
```

- [ ] **Step 2: Verify Vercel build passes**

Go to https://vercel.com and confirm the deployment succeeds with no TypeScript errors. The build log should show no errors.

- [ ] **Step 3: Smoke test on live URL**

Visit `https://members-area-seven.vercel.app/goals` (logged in as John). Confirm:
- Event Planner section renders at the top
- Adding and deleting events works (data persists on refresh — it's coming from Supabase)
- Body fat goal shows a low progress bar with "↓ lower is better" label

---

## Self-Review

**Spec coverage:**
- ✅ `member_events` table with RLS — Task 1
- ✅ `MemberEvent` type + `fetchMemberEvents` — Task 2
- ✅ POST route with 3-cap enforcement — Task 3
- ✅ DELETE route with ownership check — Task 4
- ✅ EventPlannerClient: add form, delete, countdown, past events, cap notice — Task 5
- ✅ EventPlanner server component reading cookies — Task 6
- ✅ Goals page converted to server component, GoalsClient extracted — Task 7
- ✅ `startValue` added to Goal type and SEED_GOALS — Task 7
- ✅ `progressPct` updated for decrease goals — Task 7
- ✅ "↓ lower is better" label on decrease goal cards — Task 7
- ✅ `startValue` locked at creation in `handleSave` — Task 7
- ✅ Staff Hub display deferred (noted in spec, not in plan) — correct

**Placeholder scan:** None found.

**Type consistency:** `MemberEvent` defined in Task 2, imported in Tasks 5 and 6. `Goal.startValue: number` added in Task 7, used consistently in `progressPct()`, `GoalCard`, `CompletedGoalCard`, and `handleSave`. All match.
