# Attendance & Awards Live Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded seed data in the Attendance Streak widget and Awards Preview widget with live data from GymMaster (attendance) and Staff Hub Supabase (awards).

**Architecture:** `AttendanceStreak` becomes an async Server Component. It calls the existing `getMonthlyVisits()` helper walking backwards month by month (up to 24 months max) until a week with <3 visits is found, giving an accurate all-time streak. `AwardsPreview` becomes an async Server Component reading from the `member_awards` table in Staff Hub Supabase via a new `fetchAwards()` helper in `staffhub.ts`.

**Tech Stack:** Next.js 16 App Router Server Components, `@supabase/supabase-js` v2, existing `getMonthlyVisits()` from `@/lib/gymmaster`, `staffHubReader` from `@/lib/staffhub`, TypeScript, Tailwind CSS v4.

---

## Important Pre-Read

- `getMonthlyVisits(gymMasterId, year, month, memberToken?)` lives in `src/lib/gymmaster.ts`. It returns `MonthlyVisits: { memberId, year, month, visitCount, visitDates: string[] }` where `visitDates` are ISO strings like `'2026-04-03'`. Note: the current GymMaster API may not yet return individual `visitDates` (the array may be empty) — the widget must handle both cases gracefully.
- `staffHubReader` and the fetch helper pattern live in `src/lib/staffhub.ts`.
- Staff Hub Supabase has a `member_awards` table with columns: `id`, `month` (date string, first of month e.g. `'2026-04-01'`), `award_type` (`'athlete_of_month' | 'commitment_club'`), `member_name` (text), `reason` (text | null), `prize_given` (bool), `created_at`.
- The `gymmaster_member_id` and `gymmaster_token` cookies are set at login and available via `cookies()` from `next/headers`.
- Member cookies: `gymmaster_member_id` (readable), `gymmaster_token` (httpOnly).
- Tailwind design tokens in use: `bg-bg-card`, `border-border-light`, `text-brand`, `text-text-primary`, `text-text-secondary`, `text-status-amber`, `bg-status-amber/10`, `border-status-amber/20`.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/staffhub.ts` | Modify | Add `StaffHubAward` type + `fetchAwards(limit?)` helper |
| `src/components/dashboard/AttendanceStreak.tsx` | Rewrite | Async Server Component — real GymMaster visit dates + streak |
| `src/components/dashboard/AwardsPreview.tsx` | Rewrite | Async Server Component — live awards from Staff Hub |

---

## Task 1: Add `fetchAwards` to staffhub.ts

**Files:**
- Modify: `src/lib/staffhub.ts`

- [ ] **Step 1: Read `src/lib/staffhub.ts`** to find where to add the new type and helper (after the existing types, before or after `fetchChallenges`).

- [ ] **Step 2: Add `StaffHubAward` type and `fetchAwards` helper**

Add this to `src/lib/staffhub.ts` after the existing type definitions:

```typescript
export type StaffHubAward = {
  id: string
  month: string           // ISO date string, first of month e.g. '2026-04-01'
  award_type: 'athlete_of_month' | 'commitment_club'
  member_name: string
  reason: string | null
  created_at: string
}

/**
 * Fetch recent awards from Staff Hub — shown as a noticeboard on the Members Area dashboard.
 * Returns up to `limit` most recent awards ordered by month descending.
 */
export async function fetchAwards(limit = 6): Promise<StaffHubAward[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('member_awards')
      .select('id, month, award_type, member_name, reason, created_at')
      .order('month', { ascending: false })
      .order('award_type', { ascending: true })
      .limit(limit)
    if (error) {
      console.warn('[StaffHub] fetchAwards failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchAwards threw:', err)
    return []
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: same errors as before (pre-existing gymmaster.ts + education type errors only — no new errors).

- [ ] **Step 4: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/lib/staffhub.ts
git commit -m "feat: add StaffHubAward type and fetchAwards helper to staffhub.ts"
```

---

## Task 2: Rewrite AwardsPreview as async Server Component

**Files:**
- Rewrite: `src/components/dashboard/AwardsPreview.tsx`

- [ ] **Step 1: Read the current `src/components/dashboard/AwardsPreview.tsx`** to understand the existing visual structure before rewriting it.

- [ ] **Step 2: Rewrite `AwardsPreview.tsx`**

Replace the entire file with:

```typescript
import Link from 'next/link'
import { fetchAwards, StaffHubAward } from '@/lib/staffhub'

const AWARD_CONFIG: Record<StaffHubAward['award_type'], {
  emoji: string
  label: string
  colour: string
  bg: string
  border: string
}> = {
  athlete_of_month: {
    emoji: '🏆',
    label: 'Athlete of the Month',
    colour: 'text-status-amber',
    bg: 'bg-status-amber/10',
    border: 'border-status-amber/20',
  },
  commitment_club: {
    emoji: '🔥',
    label: 'Commitment Club',
    colour: 'text-brand',
    bg: 'bg-brand/10',
    border: 'border-brand/20',
  },
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default async function AwardsPreview() {
  const awards = await fetchAwards(6)

  if (awards.length === 0) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-amber via-brand to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">
            Recent
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Awards</h2>
        </div>
        <Link
          href="/community/awards"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-3">
        {awards.map((award) => {
          const cfg = AWARD_CONFIG[award.award_type]
          return (
            <div
              key={award.id}
              className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-xs font-semibold ${cfg.colour}`}>
                      {cfg.label}
                    </p>
                    <span className="text-[10px] text-text-secondary shrink-0">
                      {formatMonth(award.month)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {award.member_name}
                  </p>
                  {award.reason && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {award.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/components/dashboard/AwardsPreview.tsx
git commit -m "feat: wire AwardsPreview to live Staff Hub member_awards data"
```

---

## Task 3: Rewrite AttendanceStreak as async Server Component

**Files:**
- Rewrite: `src/components/dashboard/AttendanceStreak.tsx`

- [ ] **Step 1: Read the current `src/components/dashboard/AttendanceStreak.tsx`** to understand the visual structure.

- [ ] **Step 2: Rewrite `AttendanceStreak.tsx`**

Replace the entire file with:

```typescript
import { cookies } from 'next/headers'
import { getMonthlyVisits } from '@/lib/gymmaster'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MIN_VISITS_FOR_STREAK = 3
const MAX_MONTHS_BACK = 24

/** Returns ISO day index 0=Mon … 6=Sun */
function isoDay(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** Returns the Monday of the week containing `date` at midnight */
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - isoDay(d))
  return d
}

/** Returns an ISO date string 'YYYY-MM-DD' for a Date */
function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Count how many consecutive weeks (going back from the current week)
 * have at least `minVisits` visits, given a flat array of visit date strings.
 * The current week counts toward the streak only if it already has enough visits.
 */
function calcStreak(visitDates: string[], minVisits: number): number {
  if (visitDates.length === 0) return 0

  const visitSet = new Set(visitDates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let weekMonday = getMondayOf(today)

  // Walk back up to MAX_MONTHS_BACK * 5 weeks as a hard cap
  const maxWeeks = MAX_MONTHS_BACK * 5

  for (let w = 0; w < maxWeeks; w++) {
    // Count visits in this Mon–Sun window
    let count = 0
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekMonday)
      day.setDate(weekMonday.getDate() + d)
      if (day > today) break  // don't count future days
      if (visitSet.has(toISO(day))) count++
    }

    if (count >= minVisits) {
      streak++
    } else {
      // Streak broken — stop
      break
    }

    // Move to previous week
    weekMonday = new Date(weekMonday)
    weekMonday.setDate(weekMonday.getDate() - 7)
  }

  return streak
}

export default async function AttendanceStreak() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'
  const memberToken = cookieStore.get('gymmaster_token')?.value ?? ''

  // Collect visit dates walking backwards until streak breaks or 24 months elapsed
  const allVisitDates: string[] = []
  const today = new Date()
  let year = today.getFullYear()
  let month = today.getMonth() + 1  // 1-based
  let monthsFetched = 0
  let streakBroken = false

  while (monthsFetched < MAX_MONTHS_BACK && !streakBroken) {
    const data = await getMonthlyVisits(memberId, year, month, memberToken || undefined)
    allVisitDates.push(...data.visitDates)
    monthsFetched++

    // If this month returned no visits at all and it's not the current month,
    // the streak is broken — no need to go further back
    if (data.visitDates.length === 0 && monthsFetched > 1) {
      streakBroken = true
    }

    // Move to previous month
    month--
    if (month === 0) {
      month = 12
      year--
    }
  }

  // Build current week heatmap
  const weekMonday = getMondayOf(today)
  const visitSet = new Set(allVisitDates)
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekMonday)
    d.setDate(weekMonday.getDate() + i)
    return d
  })
  const visitedDays = weekDates.map(d => visitSet.has(toISO(d)))
  const visitsThisWeek = visitedDays.filter(Boolean).length
  const todayIso = isoDay(today)

  // Calculate streak
  const streakWeeks = calcStreak(allVisitDates, MIN_VISITS_FOR_STREAK)

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            This Week
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Attendance Streak</h2>
        </div>
        <div className="text-right">
          <p className="font-data text-2xl font-semibold text-text-primary leading-none">
            {visitsThisWeek}
          </p>
          <p className="text-[10px] text-text-secondary">visits</p>
        </div>
      </div>

      {/* Day heatmap */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day, i) => {
          const date = weekDates[i]
          const isPast = i < todayIso
          const isToday = i === todayIso
          const isFuture = i > todayIso
          const visited = visitedDays[i]

          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-medium ${isToday ? 'text-brand' : 'text-text-secondary'}`}>
                {day}
              </span>
              <div
                title={date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                  visited
                    ? 'bg-brand shadow-sm shadow-brand/20'
                    : isPast
                    ? 'bg-border-light'
                    : isToday
                    ? 'border-2 border-brand/40 bg-brand/5'
                    : isFuture
                    ? 'bg-bg-main border border-border-light'
                    : 'bg-bg-main'
                }`}
              >
                {visited && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Streak badge */}
      <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-2">
        <span className="text-base">🔥</span>
        {streakWeeks > 0 ? (
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{streakWeeks} week{streakWeeks !== 1 ? 's' : ''} in a row</span>
            {' '}with {MIN_VISITS_FOR_STREAK}+ visits
          </p>
        ) : (
          <p className="text-xs text-text-secondary">
            Hit {MIN_VISITS_FOR_STREAK}+ visits this week to start your streak!
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git add src/components/dashboard/AttendanceStreak.tsx
git commit -m "feat: wire AttendanceStreak to live GymMaster visit dates with all-time streak"
```

---

## Task 4: Push and verify

- [ ] **Step 1: Push to GitHub (triggers Vercel redeploy)**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
git push
```

- [ ] **Step 2: Start local dev server to test before checking Vercel**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area"
npm run dev
```

Open http://localhost:3000, log in, and verify:

1. **Awards widget** — shows real award data from Staff Hub (or shows nothing if no awards have been created yet — that's correct behaviour). To test: go to Staff Hub → Member Engagement → Awards tab → add an award, then refresh Members Area dashboard.

2. **Attendance Streak heatmap** — check the terminal for `[GymMaster] visits/monthly result:` log lines. If `visitDates` array is empty in the response, the heatmap will show all days as unvisited (grey) — this is expected if GymMaster doesn't return individual dates yet. The visit count in Commitment Club widget (already live) confirms the API is working.

3. **Streak badge** — if `visitDates` are returned, the streak calculates correctly. If not, it shows "Hit 3+ visits this week to start your streak!" which is the correct fallback.

- [ ] **Step 3: Verify Vercel deployment succeeded**

Check https://vercel.com/dashboard — confirm the new deployment is green. Then verify https://members-area-seven.vercel.app/dashboard shows the same results as local.
