# Active Card + Tasks in Messages — Design Spec

**Date:** 2026-06-01  
**Status:** Approved  
**Scope:** Members Area only

---

## Overview

Two changes to the Members Area:

1. **Dashboard ActiveCard** — replaces the current `ChallengesPreview` widget (which shows all challenges regardless of member signup) and absorbs `CoachTasksPreview`. Shows only things the logged-in member is personally involved in: pending tasks, challenges they're enrolled in, and Bring a Friend events they've registered guests for. Completely hidden if all three are empty.

2. **Tasks panel on Messages page** — a small "From your coach" task list rendered above the chat thread. Members can see outstanding homework/tasks and mark them complete without leaving the page, then immediately ask a question in the chat below.

---

## 1. New fetch helpers in `src/lib/staffhub.ts`

### 1a. `fetchMemberChallenges(gymMasterId: string)`

Fetches challenges the member is actively enrolled in, by joining `challenge_participants` → `challenges`.

```ts
export type MemberChallenge = {
  challenge_id: string
  name: string
  start_date: string
  end_date: string
}

export async function fetchMemberChallenges(gymMasterId: string): Promise<MemberChallenge[]>
```

Query: 
```sql
SELECT cp.challenge_id, c.name, c.start_date, c.end_date
FROM challenge_participants cp
JOIN challenges c ON c.id = cp.challenge_id
WHERE cp.gymmaster_member_id = $gymMasterId
  AND c.is_active = true
ORDER BY c.start_date ASC
```

Via Supabase JS: `staffHubReader.from('challenge_participants').select('challenge_id, challenges!inner(name, start_date, end_date)').eq('gymmaster_member_id', gymMasterId).eq('challenges.is_active', true)`

Returns empty array on error (consistent with other fetch helpers).

### 1b. `fetchMemberBaFSignups(gymMasterId: string)`

Fetches upcoming Bring a Friend events that the member has registered guests for.

```ts
export type MemberBaFSignup = {
  event_id: string
  title: string
  start_date: string
}

export async function fetchMemberBaFSignups(gymMasterId: string): Promise<MemberBaFSignup[]>
```

Query: `bring_a_friend_signups` joined with `events`, filtered by gymmaster_member_id and events.start_date >= today. Deduplicated by event_id (a member may have registered multiple guests for the same event — show the event once). Order by start_date ascending.

Via Supabase JS: `staffHubReader.from('bring_a_friend_signups').select('event_id, events!inner(id, title, start_date)').eq('gymmaster_member_id', gymMasterId).gte('events.start_date', today)` — then deduplicate in JS by event_id.

Returns empty array on error.

---

## 2. New component: `src/components/dashboard/ActiveCard.tsx`

Async server component. Replaces `ChallengesPreview` on the dashboard. `CoachTasksPreview` is removed from the dashboard entirely (its logic is absorbed here).

### Data fetching

Fetches in parallel:
```ts
const [tasks, challenges, bafSignups] = await Promise.all([
  getPendingTasks(memberId),      // existing query from CoachTasksPreview
  fetchMemberChallenges(memberId),
  fetchMemberBaFSignups(memberId),
])
```

If all three are empty → return `null` (renders nothing, no empty card).

### Rendering

Card header: label "Active", title "What's On", link "View all →" to `/community`.

Three subsections, each only rendered if non-empty:

**Tasks subsection** ("From your coach")
- Renders `ActiveCardTasks` client component (handles mark-complete interaction)
- Each task: circular tick button + title + description snippet + due date if set

**Challenges subsection** ("Challenges you're in")
- Each challenge: name + date range + "View →" link to `/community/challenge/[id]`

**Guest sessions subsection** ("Guest sessions")
- Each unique event: 🤝 emoji + event title + formatted date + "View →" link to `/community/bring-a-friend/[event_id]`

Subsections are separated by a thin divider (`<hr>`). No divider after the last subsection.

### `ActiveCardTasks` client component

Extracted to `src/components/dashboard/ActiveCardTasks.tsx`. Contains the mark-complete interaction only — same logic as the existing `CoachTasksList` component (PATCH `/api/member/tasks/[id]`). Renders the tasks list and removes items optimistically on completion.

---

## 3. Dashboard page changes (`src/app/(member)/dashboard/page.tsx`)

- Remove import and usage of `ChallengesPreview`
- Remove import and usage of `CoachTasksPreview`
- Add `ActiveCard` in their place (one card where two previously were)

The `ActiveCard` occupies one grid cell. Since it absorbs two widgets, the dashboard grid becomes slightly less crowded — acceptable.

---

## 4. Messages page changes (`src/app/(member)/messages/page.tsx`)

### Server component additions

Add task fetching to the existing server component:

```ts
const tasks = memberId ? await getPendingTasks(memberId) : []
```

Where `getPendingTasks` is the same query used in `CoachTasksPreview` — extracted to a shared helper in `src/lib/tasks.ts`:

```ts
// src/lib/tasks.ts
export type PendingTask = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  set_by: string
}

export async function getPendingTasks(memberId: string): Promise<PendingTask[]>
```

Both `ActiveCard` and the messages page import from this shared helper (DRY).

### Task panel rendering

If `tasks.length > 0`, render `TasksPanel` client component above the `MessageThread`:

```tsx
{tasks.length > 0 && <TasksPanel initialTasks={tasks} />}
<div className="flex-1 ... min-h-0">
  <MessageThread ... />
</div>
```

### `TasksPanel` client component (`src/components/messages/TasksPanel.tsx`)

- Header: "From your coach" label + count badge (e.g. "2 tasks")
- Task list: title, description snippet (1 line, truncated), circular tick button
- Mark-complete: calls `PATCH /api/member/tasks/[id]`, removes task from list optimistically
- Once all tasks are completed, the panel disappears
- Styled to match the existing card aesthetic but compact (no outer card border — it sits above the chat as an inline section with a bottom divider)

---

## 5. Shared task helper extraction

**New file:** `src/lib/tasks.ts`

Extracts `getPendingTasks` from `CoachTasksPreview` (which currently inlines the Supabase query). Both `ActiveCard` and the messages page use this shared helper.

`CoachTasksList.tsx` and `CoachTasksPreview.tsx` are **left in place** (unused after the dashboard change). Neither is deleted — this keeps the git diff minimal and avoids any risk.

---

## 6. Files summary

### Members Area (`/Users/edharper/Documents/Claude Gym/members-area/`)

| Action | File | Purpose |
|---|---|---|
| **Create** | `src/lib/tasks.ts` | Shared `getPendingTasks` helper |
| Modify | `src/lib/staffhub.ts` | Add `fetchMemberChallenges`, `fetchMemberBaFSignups`, `MemberChallenge`, `MemberBaFSignup` types |
| **Create** | `src/components/dashboard/ActiveCardTasks.tsx` | Client component: mark-complete interaction for tasks in ActiveCard |
| **Create** | `src/components/dashboard/ActiveCard.tsx` | Server component: combined active view |
| Modify | `src/app/(member)/dashboard/page.tsx` | Swap ChallengesPreview + CoachTasksPreview → ActiveCard |
| **Create** | `src/components/messages/TasksPanel.tsx` | Client component: tasks above chat |
| Modify | `src/app/(member)/messages/page.tsx` | Fetch tasks, render TasksPanel above MessageThread |

`CoachTasksPreview.tsx` and `CoachTasksList.tsx` are left in place — the former becomes unused but is not deleted to avoid any risk of breakage from other references.

---

## 7. Out of scope

- Redesigning the Community page (challenges/events sections stay as-is there)
- Any notification system for new tasks
- Sorting or filtering within the Active card
- Tasks appearing anywhere other than dashboard + messages page
