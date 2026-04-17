# Goals Page Improvements — Event Planner & Body Fat Fix

> **For agentic workers:** This spec covers two related improvements to the Goals page. Implement together in one plan.

**Goal:** Add an Event Planner section to the Goals page so members can track up to 3 personal events (races, competitions, weddings), and fix the body fat goal progress bar to correctly show lower-is-better goals.

**Architecture:** Event data is stored in the Staff Hub Supabase `member_events` table and read server-side at page load. Writes go through two API routes (POST to add, DELETE to remove). The body fat fix adds a `startValue` field to the Goal type and adjusts the progress calculation for decrease goals.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, Supabase (Staff Hub), cookies() from next/headers, existing `staffHubWriter` and `staffHubReader` clients from `src/lib/staffhub.ts`.

---

## 1. Database — Staff Hub Supabase

New table `member_events` in the Staff Hub Supabase project (`entbakkftqdejpjdynts`):

```sql
create table member_events (
  id uuid primary key default gen_random_uuid(),
  gymmaster_member_id text not null,
  member_name text not null,
  event_name text not null,
  event_date date not null,
  created_at timestamptz not null default now()
);

-- Members can only see/edit their own events
alter table member_events enable row level security;
create policy "anon read all" on member_events for select using (true);
create policy "service role write" on member_events for all using (true);
```

RLS allows anon reads (so the server component can read with the anon key) and service role writes (used by the API routes).

---

## 2. Staff Hub client additions — `src/lib/staffhub.ts`

Add type and fetch helper:

```typescript
export type MemberEvent = {
  id: string
  gymmaster_member_id: string
  member_name: string
  event_name: string
  event_date: string   // ISO date 'YYYY-MM-DD'
  created_at: string
}

export async function fetchMemberEvents(gymMasterId: string): Promise<MemberEvent[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('member_events')
      .select('id, gymmaster_member_id, member_name, event_name, event_date, created_at')
      .eq('gymmaster_member_id', gymMasterId)
      .order('event_date', { ascending: true })
    if (error) { console.warn('[StaffHub] fetchMemberEvents failed:', error.message); return [] }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchMemberEvents threw:', err)
    return []
  }
}
```

---

## 3. API Routes

### POST `/api/member-events`
Adds a new event. Enforces the 3-event cap server-side.

Request body: `{ event_name: string, event_date: string }`  
Reads `gymmaster_member_id` and `gymmaster_first_name` + `gymmaster_last_name` from cookies to identify the member.  
Returns `{ event: MemberEvent }` on success or `{ error: string }` on failure (including when cap is reached).

### DELETE `/api/member-events/[id]`
Deletes an event by ID. Verifies the event belongs to the requesting member (by `gymmaster_member_id` cookie) before deleting.  
Returns `{ ok: true }` or `{ error: string }`.

---

## 4. Goals page — Event Planner section

The Goals page (`src/app/(member)/goals/page.tsx`) becomes a hybrid: it gains a server-side data fetch for events at the top, but keeps the existing `"use client"` goal management below. The cleanest approach: extract the Event Planner into its own async Server Component (`EventPlanner`) that fetches events and renders them, with a separate `"use client"` `EventPlannerClient` that handles add/delete interactions via `fetch()` calls to the API routes and `router.refresh()` to re-render.

**EventPlanner server component** (`src/components/goals/EventPlanner.tsx`):
- Reads `gymmaster_member_id`, `gymmaster_first_name`, `gymmaster_last_name` from cookies
- Calls `fetchMemberEvents(memberId)`
- Passes events and memberId to `EventPlannerClient`

**EventPlannerClient client component** (`src/components/goals/EventPlannerClient.tsx`):
- Displays up to 3 events as cards in chronological order
- Each card shows: event name, date formatted as "Sat 15 Nov 2026", days-until countdown badge
- Past events show "Completed" badge instead of countdown
- "Add event" button (disabled/hidden when 3 events exist) opens an inline form with two fields: event name (text, required) and event date (date picker, required, min = today)
- Trash icon on each card calls DELETE and refreshes
- On submit, calls POST, closes form, refreshes

**Layout on Goals page:**
- EventPlanner section sits between the page header and the summary stats row
- Titled "Upcoming Events" with a 📅 emoji and the "EVENTS" eyebrow label in brand colour

---

## 5. Body fat fix — Goals page

**Schema change:** Add `startValue: number` to the `Goal` type. Default it to `currentValue` when creating a new goal in `handleSave`. Existing seed goals get `startValue` set equal to their current hardcoded `currentValue`.

**Progress calculation:** New helper:

```typescript
function progressPct(current: number, target: number, start: number): number {
  if (target === start) return 100
  if (target > start) {
    // Increase goal (e.g. deadlift heavier): current/target as before
    return Math.min(Math.round(((current - start) / (target - start)) * 100), 100)
  } else {
    // Decrease goal (e.g. lower body fat): how much of the gap has been closed
    return Math.min(Math.round(((start - current) / (start - target)) * 100), 100)
  }
}
```

**Visual indicator:** For decrease goals (`target < startValue`), render a small `↓ lower is better` label in `text-text-secondary` below the progress bar, alongside the current/target numbers.

**Direction:** The existing current/target display (`18.6 / 15 %`) stays as-is — it's already clear. The fix is purely in the bar calculation and the directional label.

---

## 6. What's deferred

- Showing member events in the Staff Hub coach portal — this is a follow-up after the member-side is built and reviewed.
- Members editing an existing event (name or date) — add/delete covers the MVP. Editing can be added later.
