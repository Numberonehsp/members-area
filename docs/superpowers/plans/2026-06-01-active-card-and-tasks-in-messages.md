# Active Card + Tasks in Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate Challenges and Coach Tasks dashboard widgets with a single personalised "What's On" card, and add a task panel above the chat on the Messages page.

**Architecture:** A shared `src/lib/tasks.ts` helper provides the pending-tasks query to both the new `ActiveCard` server component and the updated messages page. Two new Staff Hub fetch helpers get challenges and Bring-a-Friend signups for the logged-in member. All mark-complete interactions stay client-side via the existing `PATCH /api/member/tasks/[id]` endpoint.

**Tech Stack:** Next.js 15 App Router, Supabase JS v2, TypeScript, Tailwind CSS. Members Area project (`cwuojhibgclirxsutwtg`), Staff Hub project (`entbakkftqdejpjdynts`).

---

## File Map

| Action | File | Purpose |
|---|---|---|
| **Create** | `src/lib/tasks.ts` | Shared `getPendingTasks` + `formatDueDate` + `PendingTask` type |
| Modify | `src/lib/staffhub.ts` | Add `MemberChallenge`, `MemberBaFSignup` types + fetch helpers |
| **Create** | `src/components/dashboard/ActiveCardTasks.tsx` | Client: mark-complete interaction for tasks in ActiveCard |
| **Create** | `src/components/dashboard/ActiveCard.tsx` | Server: combined active view |
| Modify | `src/app/(member)/dashboard/page.tsx` | Swap ChallengesPreview + CoachTasksPreview → ActiveCard |
| **Create** | `src/components/messages/TasksPanel.tsx` | Client: tasks panel above chat |
| Modify | `src/app/(member)/messages/page.tsx` | Fetch tasks + render TasksPanel above MessageThread |

---

## Task 1: Create shared tasks helper

**Files:**
- Create: `src/lib/tasks.ts`

- [ ] **Step 1: Create the file**

  Create `src/lib/tasks.ts`:

  ```ts
  import { createClient } from '@supabase/supabase-js'

  export type PendingTask = {
    id: string
    title: string
    description: string | null
    due_date: string | null
    set_by: string
  }

  /** Formats a due date as a human-readable label with overdue flag. */
  export function formatDueDate(
    dateStr: string | null,
  ): { label: string; overdue: boolean } | null {
    if (!dateStr) return null
    const due = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
    if (diff === 0) return { label: 'Due today', overdue: false }
    if (diff === 1) return { label: 'Due tomorrow', overdue: false }
    return {
      label: `Due ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      overdue: false,
    }
  }

  /**
   * Fetch pending (incomplete) tasks for a member.
   * Uses Members Area Supabase anon key — server-side only.
   */
  export async function getPendingTasks(memberId: string): Promise<PendingTask[]> {
    if (!memberId) return []
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data } = await supabase
      .from('member_tasks')
      .select('id, title, description, due_date, set_by')
      .eq('gymmaster_member_id', memberId)
      .is('completed_at', null)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10)
    return data ?? []
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | grep -v "education" | head -10
  ```
  Expected: no output (the 2 pre-existing education page errors are acceptable).

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/lib/tasks.ts
  git commit -m "feat: add shared getPendingTasks helper and PendingTask type"
  ```

---

## Task 2: Add Member-scoped Staff Hub fetch helpers

**Files:**
- Modify: `src/lib/staffhub.ts` (append to bottom)

- [ ] **Step 1: Append the two new types and helpers to the bottom of `src/lib/staffhub.ts`**

  ```ts
  // ── Member-scoped fetch helpers ───────────────────────────────────────────────

  export type MemberChallenge = {
    challenge_id: string
    name: string
    start_date: string
    end_date: string
  }

  /**
   * Fetch active challenges the member is enrolled in (via challenge_participants).
   * Only returns challenges where is_active = true.
   */
  export async function fetchMemberChallenges(gymMasterId: string): Promise<MemberChallenge[]> {
    if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY || !gymMasterId) return []
    try {
      const { data, error } = await staffHubReader
        .from('challenge_participants')
        .select('challenge_id, challenges!inner(name, start_date, end_date, is_active)')
        .eq('gymmaster_member_id', gymMasterId)
      if (error) {
        console.warn('[StaffHub] fetchMemberChallenges failed:', error.message)
        return []
      }
      return (data ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((row: any) => row.challenges?.is_active === true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => ({
          challenge_id: row.challenge_id as string,
          name: row.challenges.name as string,
          start_date: row.challenges.start_date as string,
          end_date: row.challenges.end_date as string,
        }))
    } catch (err) {
      console.warn('[StaffHub] fetchMemberChallenges threw:', err)
      return []
    }
  }

  export type MemberBaFSignup = {
    event_id: string
    title: string
    start_date: string
  }

  /**
   * Fetch upcoming Bring-a-Friend events the member has registered guests for.
   * Deduplicates by event_id (member may have registered multiple guests).
   * Only returns events with start_date >= today.
   */
  export async function fetchMemberBaFSignups(gymMasterId: string): Promise<MemberBaFSignup[]> {
    if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY || !gymMasterId) return []
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await staffHubReader
        .from('bring_a_friend_signups')
        .select('event_id, events!inner(id, title, start_date)')
        .eq('gymmaster_member_id', gymMasterId)
      if (error) {
        console.warn('[StaffHub] fetchMemberBaFSignups failed:', error.message)
        return []
      }
      // Deduplicate by event_id and filter for future events
      const seen = new Set<string>()
      const result: MemberBaFSignup[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (data ?? []) as any[]) {
        const startDate = row.events?.start_date as string | undefined
        if (!startDate || startDate < today) continue
        if (!seen.has(row.event_id)) {
          seen.add(row.event_id)
          result.push({
            event_id: row.event_id as string,
            title: row.events.title as string,
            start_date: startDate,
          })
        }
      }
      return result.sort((a, b) => a.start_date.localeCompare(b.start_date))
    } catch (err) {
      console.warn('[StaffHub] fetchMemberBaFSignups threw:', err)
      return []
    }
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | grep -v "education" | head -10
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/lib/staffhub.ts
  git commit -m "feat: add fetchMemberChallenges and fetchMemberBaFSignups to staffhub"
  ```

---

## Task 3: Create ActiveCardTasks client component

**Files:**
- Create: `src/components/dashboard/ActiveCardTasks.tsx`

- [ ] **Step 1: Create the file**

  Create `src/components/dashboard/ActiveCardTasks.tsx`:

  ```tsx
  'use client'

  import { useState } from 'react'
  import { type PendingTask, formatDueDate } from '@/lib/tasks'

  export default function ActiveCardTasks({ initialTasks }: { initialTasks: PendingTask[] }) {
    const [tasks, setTasks] = useState(initialTasks)
    const [completing, setCompleting] = useState<string | null>(null)

    async function markComplete(id: string) {
      setCompleting(id)
      const res = await fetch(`/api/member/tasks/${id}`, { method: 'PATCH' })
      if (res.ok) setTasks(ts => ts.filter(t => t.id !== id))
      setCompleting(null)
    }

    if (tasks.length === 0) return null

    return (
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary font-semibold mb-2">
          From your coach
        </p>
        <div className="space-y-2">
          {tasks.map(task => {
            const due = formatDueDate(task.due_date)
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-xl border border-border-light bg-bg-main p-3"
              >
                <button
                  onClick={() => markComplete(task.id)}
                  disabled={completing === task.id}
                  aria-label="Mark complete"
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-border-light hover:border-brand transition-colors shrink-0 flex items-center justify-center disabled:opacity-50"
                >
                  {completing === task.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand/40 animate-pulse" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary leading-tight">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{task.description}</p>
                  )}
                  {due && (
                    <p className={`text-[11px] mt-1 font-medium ${due.overdue ? 'text-red-500' : 'text-text-secondary'}`}>
                      {due.label}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | grep -v "education" | head -10
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/components/dashboard/ActiveCardTasks.tsx
  git commit -m "feat: add ActiveCardTasks client component"
  ```

---

## Task 4: Create ActiveCard server component

**Files:**
- Create: `src/components/dashboard/ActiveCard.tsx`

- [ ] **Step 1: Create the file**

  Create `src/components/dashboard/ActiveCard.tsx`:

  ```tsx
  import Link from 'next/link'
  import { cookies } from 'next/headers'
  import { fetchMemberChallenges, fetchMemberBaFSignups } from '@/lib/staffhub'
  import { getPendingTasks } from '@/lib/tasks'
  import ActiveCardTasks from './ActiveCardTasks'

  function formatDateRange(start: string, end: string) {
    const fmt = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    return `${fmt(start)} — ${fmt(end)}`
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  export default async function ActiveCard() {
    const cookieStore = await cookies()
    const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''

    if (!memberId) return null

    const [tasks, challenges, bafSignups] = await Promise.all([
      getPendingTasks(memberId),
      fetchMemberChallenges(memberId),
      fetchMemberBaFSignups(memberId),
    ])

    // Hide the card entirely if the member has nothing active
    if (tasks.length === 0 && challenges.length === 0 && bafSignups.length === 0) {
      return null
    }

    // Count non-empty sections to know whether to render dividers
    const filledSections = [tasks.length > 0, challenges.length > 0, bafSignups.length > 0]

    return (
      <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
              Active
            </p>
            <h2 className="font-semibold text-text-primary text-sm">What&apos;s On</h2>
          </div>
          <Link
            href="/community"
            className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-4">
          {/* Tasks */}
          {tasks.length > 0 && (
            <>
              <ActiveCardTasks initialTasks={tasks} />
              {(challenges.length > 0 || bafSignups.length > 0) && (
                <hr className="border-border-light" />
              )}
            </>
          )}

          {/* Challenges the member is enrolled in */}
          {challenges.length > 0 && (
            <>
              <div>
                <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary font-semibold mb-2">
                  Challenges you&apos;re in
                </p>
                <div className="space-y-2">
                  {challenges.map(c => (
                    <div
                      key={c.challenge_id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-border-light bg-bg-main p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary leading-tight">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {formatDateRange(c.start_date, c.end_date)}
                        </p>
                      </div>
                      <Link
                        href={`/community/challenge/${c.challenge_id}`}
                        className="text-[10px] font-semibold text-brand shrink-0 hover:text-brand-dark transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              {bafSignups.length > 0 && <hr className="border-border-light" />}
            </>
          )}

          {/* Bring-a-Friend events registered */}
          {bafSignups.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary font-semibold mb-2">
                Guest sessions
              </p>
              <div className="space-y-2">
                {bafSignups.map(s => (
                  <div
                    key={s.event_id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-border-light bg-bg-main p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary leading-tight">
                        🤝 {s.title}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {formatDate(s.start_date)}
                      </p>
                    </div>
                    <Link
                      href={`/community/bring-a-friend/${s.event_id}`}
                      className="text-[10px] font-semibold text-brand shrink-0 hover:text-brand-dark transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  ```

  Note: The `filledSections` variable is declared but used only for context — the divider logic is handled inline. Remove it if TypeScript flags it as unused.

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | grep -v "education" | head -10
  ```
  Expected: no output. If TypeScript flags the unused `filledSections` variable, delete those lines — they are not needed.

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/components/dashboard/ActiveCard.tsx
  git commit -m "feat: add ActiveCard server component (combined active view)"
  ```

---

## Task 5: Update dashboard page

**Files:**
- Modify: `src/app/(member)/dashboard/page.tsx`

The current file imports and uses `ChallengesPreview` and `CoachTasksPreview`. Both are replaced by the single `ActiveCard`.

- [ ] **Step 1: Remove the old imports and add the new one**

  Find these two import lines:
  ```ts
  import ChallengesPreview from "@/components/dashboard/ChallengesPreview";
  import CoachTasksPreview from "@/components/dashboard/CoachTasksPreview";
  ```
  Replace them with:
  ```ts
  import ActiveCard from "@/components/dashboard/ActiveCard";
  ```

- [ ] **Step 2: Replace the two widget usages**

  In the JSX grid, find:
  ```tsx
          {/* Active Challenges — live from Staff Hub */}
          <ChallengesPreview />

          {/* Latest Awards */}
          <AwardsPreview />

          {/* Coach-assigned tasks */}
          <CoachTasksPreview />
  ```
  Replace with:
  ```tsx
          {/* Personalised active card — tasks, challenges, guest sessions */}
          <ActiveCard />

          {/* Latest Awards */}
          <AwardsPreview />
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | grep -v "education" | head -10
  ```
  Expected: no output.

- [ ] **Step 4: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add "src/app/(member)/dashboard/page.tsx"
  git commit -m "feat: replace ChallengesPreview + CoachTasksPreview with ActiveCard on dashboard"
  ```

---

## Task 6: Create TasksPanel client component

**Files:**
- Create: `src/components/messages/TasksPanel.tsx`

- [ ] **Step 1: Create the file**

  Create `src/components/messages/TasksPanel.tsx`:

  ```tsx
  'use client'

  import { useState } from 'react'
  import { type PendingTask, formatDueDate } from '@/lib/tasks'

  export default function TasksPanel({ initialTasks }: { initialTasks: PendingTask[] }) {
    const [tasks, setTasks] = useState(initialTasks)
    const [completing, setCompleting] = useState<string | null>(null)

    async function markComplete(id: string) {
      setCompleting(id)
      const res = await fetch(`/api/member/tasks/${id}`, { method: 'PATCH' })
      if (res.ok) setTasks(ts => ts.filter(t => t.id !== id))
      setCompleting(null)
    }

    if (tasks.length === 0) return null

    return (
      <div className="shrink-0 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-text-secondary">From your coach</p>
          <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-semibold">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-2">
          {tasks.map(task => {
            const due = formatDueDate(task.due_date)
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-xl border border-border-light bg-bg-card p-3"
              >
                <button
                  onClick={() => markComplete(task.id)}
                  disabled={completing === task.id}
                  aria-label="Mark complete"
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-border-light hover:border-brand transition-colors shrink-0 flex items-center justify-center disabled:opacity-50"
                >
                  {completing === task.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand/40 animate-pulse" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary leading-tight">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  {due && (
                    <p className={`text-[11px] mt-0.5 font-medium ${due.overdue ? 'text-red-500' : 'text-text-secondary'}`}>
                      {due.label}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <hr className="border-border-light mt-3" />
      </div>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | grep -v "education" | head -10
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add src/components/messages/TasksPanel.tsx
  git commit -m "feat: add TasksPanel component for messages page"
  ```

---

## Task 7: Update messages page

**Files:**
- Modify: `src/app/(member)/messages/page.tsx`

- [ ] **Step 1: Add imports**

  At the top of `src/app/(member)/messages/page.tsx`, add two imports after the existing ones:
  ```ts
  import { getPendingTasks } from '@/lib/tasks'
  import TasksPanel from '@/components/messages/TasksPanel'
  ```

- [ ] **Step 2: Fetch tasks in the server component**

  In the `MemberMessagesPage` server component, after the `const messages = ...` line, add:
  ```ts
  const tasks = memberId ? await getPendingTasks(memberId) : []
  ```

- [ ] **Step 3: Render TasksPanel above MessageThread**

  The current return JSX is:
  ```tsx
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
        <div className="mb-4 shrink-0">
          <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-1">Direct</p>
          <h1 className="font-display text-4xl text-text-primary leading-none">
            Messages
          </h1>
          <p className="text-text-secondary text-xs mt-1">Your conversation with the Number One HSP coaching team</p>
        </div>

        <div className="flex-1 bg-bg-card border border-border-light rounded-2xl overflow-hidden min-h-0">
          <MessageThread
            messages={messages}
            viewerRole="member"
          />
        </div>
      </div>
    )
  ```

  Replace it with:
  ```tsx
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
        <div className="mb-4 shrink-0">
          <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-1">Direct</p>
          <h1 className="font-display text-4xl text-text-primary leading-none">
            Messages
          </h1>
          <p className="text-text-secondary text-xs mt-1">Your conversation with the Number One HSP coaching team</p>
        </div>

        {tasks.length > 0 && <TasksPanel initialTasks={tasks} />}

        <div className="flex-1 bg-bg-card border border-border-light rounded-2xl overflow-hidden min-h-0">
          <MessageThread
            messages={messages}
            viewerRole="member"
          />
        </div>
      </div>
    )
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  npx tsc --noEmit 2>&1 | grep -v "education" | head -10
  ```
  Expected: no output.

- [ ] **Step 5: Commit and push**

  ```bash
  cd "/Users/edharper/Documents/Claude Gym/members-area"
  git add "src/app/(member)/messages/page.tsx"
  git commit -m "feat: add tasks panel above chat on messages page"
  git push
  ```

---

## Self-review checklist

- [x] `src/lib/tasks.ts` — `PendingTask` type, `formatDueDate`, `getPendingTasks` — Task 1
- [x] `fetchMemberChallenges` — joins challenge_participants → challenges, filters is_active, maps to MemberChallenge — Task 2
- [x] `fetchMemberBaFSignups` — joins bring_a_friend_signups → events, filters future dates, deduplicates by event_id — Task 2
- [x] `ActiveCardTasks` — client, uses PendingTask + formatDueDate from tasks.ts, PATCH mark-complete — Task 3
- [x] `ActiveCard` — server, fetches all three in parallel, hides if all empty, three subsections with dividers — Task 4
- [x] `filledSections` variable in Task 4 noted as potentially unused — remove if TypeScript flags it
- [x] Dashboard page — removes ChallengesPreview + CoachTasksPreview imports and usages, adds ActiveCard — Task 5
- [x] `TasksPanel` — client, uses PendingTask + formatDueDate from tasks.ts, PATCH mark-complete, hidden when empty — Task 6
- [x] Messages page — fetches tasks server-side, renders TasksPanel above MessageThread — Task 7
- [x] Both ChallengesPreview.tsx and CoachTasksPreview.tsx left as dead code (not deleted) — consistent with spec
