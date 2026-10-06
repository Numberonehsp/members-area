# Habit Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let members track up to 5 habits (Wellbeing/Nutrition/Activity metrics) with daily logging, optional targets, daily/weekly-total/weekly-average evaluation, and graphs/tables — under a renamed "Habits, Goals & Events" tracking section.

**Architecture:** Two new Supabase tables (`member_habits`, `habit_logs`) in this app's own project, following the exact conventions `member_goals` and `nutrition_logs` already use (cookie-derived `gymmaster_member_id`, anon-key Supabase client, REST API routes under `src/app/api/habits/`). Nutrition-category habits (Calories/Fat/Protein/Carbs) read the *existing* `nutrition_logs` table instead of writing their own rows — one source of truth, no double entry. A new pure module (`src/lib/habit-logic.ts`) holds all the cadence/aggregation/progress math, kept separate and unit-testable from the DB/UI layers, mirroring the split `src/lib/reminderEligibility.ts` uses in the sibling staff-hub repo.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (`@supabase/supabase-js`), Tailwind CSS 4, Recharts (new dependency — no charting library exists in this repo today), Vitest (new dependency — no test runner exists in this repo today).

---

## Before you start

Read `docs/superpowers/specs/2026-10-06-habit-tracker-design.md` first — this plan implements that spec.

Confirmed with Ed during planning (overrides anything in the spec that reads differently):
- This repo (`members-area`) has **zero existing test infrastructure** — no Vitest/Jest, no test script in `package.json`, no test files anywhere. Task 1 adds Vitest (mirroring the sibling `staff-hub` repo's config) before any other work, so the plan's TDD steps have something to run against.
- Recharts is the charting library (`^3.10.1` as of this plan — confirmed compatible with React 19 via its published peer deps).

---

### Task 1: Add Vitest test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^4
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
```

- [ ] **Step 4: Verify it runs (with nothing to test yet)**

Run: `npm run test`
Expected: `No test files found` — exits cleanly, confirms the runner itself works before any real tests exist.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "$(cat <<'EOF'
chore: add Vitest test infrastructure

This repo had no test runner at all. Mirrors the config already used by
the sibling staff-hub repo.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Database migration

**Files:**
- Create: `migrations/009_habit_tracker.sql`

The most recent migration in this repo is `migrations/008_nutrition_tracker.sql` — verify that's still true (`ls migrations | sort -V | tail -3`) before naming this file, in case another change landed first.

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- Migration 009: Habit Tracker
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================

-- member_habits
-- Up to 5 'active' rows per member at a time (enforced in the API layer,
-- not here, same as member_events' MAX_EVENTS check in the sibling route).
-- Nutrition-category habits (calories/fat/protein/carbs) never get rows in
-- habit_logs below — their progress is read from the existing
-- nutrition_logs table instead, so a member never enters the same number
-- twice across the Nutrition page and the habit tracker.
-- ============================================================
CREATE TABLE IF NOT EXISTS member_habits (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL,
  metric               TEXT NOT NULL CHECK (metric IN (
                          'sleep', 'stretching', 'hydration',
                          'calories', 'fat', 'protein', 'carbs',
                          'steps', 'distance', 'workouts', 'exercise_reps'
                        )),
  category             TEXT NOT NULL CHECK (category IN ('wellbeing', 'nutrition', 'activity')),
  target               NUMERIC CHECK (target IS NULL OR target > 0),
  cadence              TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly')),
  aggregation          TEXT CHECK (aggregation IN ('total', 'average')),
  start_date           DATE NOT NULL,
  end_date             DATE,
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (cadence = 'daily' AND aggregation IS NULL) OR
    (cadence = 'weekly' AND aggregation IS NOT NULL)
  )
);

-- Backstops the API-layer "already active" check in POST /api/habits
-- against a double-submit race (two concurrent requests both passing the
-- check before either insert lands) — unlike the 5-habit cap, there's no
-- similarly cheap partial-index backstop for a count, so that one stays
-- API-layer-only, but this one-metric-at-a-time rule is a natural fit.
CREATE UNIQUE INDEX IF NOT EXISTS member_habits_one_active_per_metric
  ON member_habits (gymmaster_member_id, metric) WHERE status = 'active';

ALTER TABLE member_habits ENABLE ROW LEVEL SECURITY;
-- NOTE: Open-access policy for dev phase, matching nutrition_targets/nutrition_logs.
-- Tighten to per-member access before production launch.
CREATE POLICY "Allow all access to member_habits"
  ON member_habits FOR ALL USING (true) WITH CHECK (true);

-- habit_logs
-- One row per habit per day. Never written for a nutrition-category habit.
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id             UUID NOT NULL REFERENCES member_habits(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  value                NUMERIC NOT NULL CHECK (value >= 0),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to habit_logs"
  ON habit_logs FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Commit**

```bash
git add migrations/009_habit_tracker.sql
git commit -m "$(cat <<'EOF'
feat: add habit tracker schema

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**Do not run this migration against Supabase yet.** It needs applying by hand in the SQL Editor once the branch is reviewed — flag this in the final report, same as every other migration in this org's repos.

---

### Task 3: Habit types and metric configuration

**Files:**
- Create: `src/types/habits.ts`

- [ ] **Step 1: Write the file**

```ts
// src/types/habits.ts

export type HabitMetric =
  | 'sleep' | 'stretching' | 'hydration'
  | 'calories' | 'fat' | 'protein' | 'carbs'
  | 'steps' | 'distance' | 'workouts' | 'exercise_reps'

export type HabitCategory = 'wellbeing' | 'nutrition' | 'activity'
export type HabitCadence = 'daily' | 'weekly'
export type HabitAggregation = 'total' | 'average'
export type HabitStatus = 'active' | 'archived'

export type Habit = {
  id: string
  gymmaster_member_id: string
  metric: HabitMetric
  category: HabitCategory
  target: number | null
  cadence: HabitCadence
  aggregation: HabitAggregation | null
  start_date: string
  end_date: string | null
  status: HabitStatus
  created_at: string
  updated_at: string
}

export type HabitLog = {
  id: string
  habit_id: string
  date: string // 'YYYY-MM-DD'
  value: number
  updated_at: string
}

export type MetricConfig = {
  metric: HabitMetric
  category: HabitCategory
  label: string
  emoji: string
  unit: string
  /** Sleep is entered as hours + minutes and stored as total minutes. */
  inputKind: 'number' | 'hours_minutes'
}

export const METRIC_CONFIG: Record<HabitMetric, MetricConfig> = {
  sleep:         { metric: 'sleep',         category: 'wellbeing', label: 'Sleep',       emoji: '😴', unit: 'h',       inputKind: 'hours_minutes' },
  stretching:    { metric: 'stretching',    category: 'wellbeing', label: 'Stretching',  emoji: '🧘', unit: 'min',     inputKind: 'number' },
  hydration:     { metric: 'hydration',     category: 'wellbeing', label: 'Hydration',   emoji: '💧', unit: 'L',       inputKind: 'number' },
  calories:      { metric: 'calories',      category: 'nutrition', label: 'Calories',    emoji: '🔥', unit: 'kcal',    inputKind: 'number' },
  fat:           { metric: 'fat',           category: 'nutrition', label: 'Fat',         emoji: '🥑', unit: 'g',       inputKind: 'number' },
  protein:       { metric: 'protein',       category: 'nutrition', label: 'Protein',     emoji: '🍗', unit: 'g',       inputKind: 'number' },
  carbs:         { metric: 'carbs',         category: 'nutrition', label: 'Carbs',       emoji: '🍞', unit: 'g',       inputKind: 'number' },
  steps:         { metric: 'steps',         category: 'activity',  label: 'Steps',       emoji: '👟', unit: 'steps',   inputKind: 'number' },
  distance:      { metric: 'distance',      category: 'activity',  label: 'Distance',    emoji: '🏃', unit: 'km',      inputKind: 'number' },
  workouts:      { metric: 'workouts',      category: 'activity',  label: 'Workouts',    emoji: '🏋️', unit: 'sessions', inputKind: 'number' },
  exercise_reps: { metric: 'exercise_reps', category: 'activity',  label: 'Exercise',    emoji: '💪', unit: 'reps',    inputKind: 'number' },
}

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  wellbeing: 'Wellbeing',
  nutrition: 'Nutrition',
  activity: 'Activity',
}

export const CATEGORY_ORDER: HabitCategory[] = ['wellbeing', 'nutrition', 'activity']

/** Calories/Fat/Protein/Carbs read from nutrition_logs — they never get their own habit_logs rows. */
export const NUTRITION_METRICS: ReadonlySet<HabitMetric> = new Set(['calories', 'fat', 'protein', 'carbs'])

export function metricsInCategory(category: HabitCategory): MetricConfig[] {
  return Object.values(METRIC_CONFIG).filter((m) => m.category === category)
}

export const MAX_ACTIVE_HABITS = 5
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors (this file has no runtime behavior to test yet — pure type/config declarations, exercised by later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/types/habits.ts
git commit -m "$(cat <<'EOF'
feat: add habit types and metric configuration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Pure habit logic (cadence, aggregation, progress)

**Files:**
- Create: `src/lib/habit-logic.ts`
- Test: `src/lib/__tests__/habit-logic.test.ts`

This is the trickiest math in the feature — isolated here, DB-free and UI-free, so it can be tested directly. Follows the same pure/testable split as `reminderEligibility.ts` in the sibling staff-hub repo.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/habit-logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  canAddHabit,
  currentPeriodValue,
  progressPct,
  isExpired,
  minutesToHoursMinutes,
  hoursMinutesToMinutes,
  formatMetricValue,
  type HabitLogEntry,
} from '@/lib/habit-logic'

describe('canAddHabit', () => {
  it('allows adding below the cap', () => {
    expect(canAddHabit(4, 5)).toBe(true)
  })
  it('blocks adding at the cap', () => {
    expect(canAddHabit(5, 5)).toBe(false)
  })
  it('blocks adding above the cap', () => {
    expect(canAddHabit(6, 5)).toBe(false)
  })
})

describe('currentPeriodValue — daily cadence', () => {
  const logs: HabitLogEntry[] = [
    { date: '2026-10-04', value: 10 },
    { date: '2026-10-05', value: 20 },
    { date: '2026-10-06', value: 30 },
  ]

  it("returns today's entry", () => {
    expect(currentPeriodValue(logs, 'daily', null, '2026-10-06')).toBe(30)
  })

  it('returns null when nothing logged today', () => {
    expect(currentPeriodValue(logs, 'daily', null, '2026-10-07')).toBeNull()
  })
})

describe('currentPeriodValue — weekly cadence', () => {
  // 7-day window ending 2026-10-06 is 2026-09-30..2026-10-06 inclusive
  const logs: HabitLogEntry[] = [
    { date: '2026-09-29', value: 1000 }, // outside the window — must be excluded
    { date: '2026-09-30', value: 100 },
    { date: '2026-10-02', value: 200 },
    { date: '2026-10-06', value: 300 },
  ]

  it('sums the window for total aggregation', () => {
    expect(currentPeriodValue(logs, 'weekly', 'total', '2026-10-06')).toBe(600)
  })

  it('averages the window for average aggregation', () => {
    expect(currentPeriodValue(logs, 'weekly', 'average', '2026-10-06')).toBe(200)
  })

  it('excludes entries outside the 7-day window', () => {
    const result = currentPeriodValue(logs, 'weekly', 'total', '2026-10-06')
    expect(result).not.toBe(1600) // would include the 2026-09-29 entry if the window were wrong
  })

  it('returns null when nothing logged in the window', () => {
    expect(currentPeriodValue([], 'weekly', 'total', '2026-10-06')).toBeNull()
  })
})

describe('progressPct', () => {
  it('computes a percentage against target', () => {
    expect(progressPct(5000, 10000)).toBe(50)
  })
  it('clamps above 100', () => {
    expect(progressPct(15000, 10000)).toBe(100)
  })
  it('clamps below 0', () => {
    expect(progressPct(-5, 10000)).toBe(0)
  })
  it('returns null when there is no current value', () => {
    expect(progressPct(null, 10000)).toBeNull()
  })
  it('returns null when there is no target', () => {
    expect(progressPct(5000, null)).toBeNull()
  })
  it('returns null for a zero or negative target rather than dividing by zero', () => {
    expect(progressPct(5000, 0)).toBeNull()
  })
})

describe('isExpired', () => {
  it('is true once end_date has passed', () => {
    expect(isExpired('2026-10-01', '2026-10-06')).toBe(true)
  })
  it('is false for a future end_date', () => {
    expect(isExpired('2026-12-01', '2026-10-06')).toBe(false)
  })
  it('is false for an open-ended habit (no end_date)', () => {
    expect(isExpired(null, '2026-10-06')).toBe(false)
  })
})

describe('sleep minutes conversion', () => {
  it('splits total minutes into hours and minutes', () => {
    expect(minutesToHoursMinutes(450)).toEqual({ hours: 7, minutes: 30 })
  })
  it('combines hours and minutes into total minutes', () => {
    expect(hoursMinutesToMinutes(7, 30)).toBe(450)
  })
})

describe('formatMetricValue', () => {
  it('formats hours_minutes as "Xh Ym"', () => {
    expect(formatMetricValue(450, 'hours_minutes', 'h')).toBe('7h 30m')
  })
  it('omits minutes when exactly on the hour', () => {
    expect(formatMetricValue(420, 'hours_minutes', 'h')).toBe('7h')
  })
  it('formats a plain number with its unit', () => {
    expect(formatMetricValue(8000, 'number', 'steps')).toBe('8000 steps')
  })
  it('rounds a long float tail (e.g. a weekly average) to one decimal place', () => {
    expect(formatMetricValue(914.2857142857143, 'number', 'steps')).toBe('914.3 steps')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- habit-logic`
Expected: FAIL with "Cannot find module '@/lib/habit-logic'"

- [ ] **Step 3: Implement**

Create `src/lib/habit-logic.ts`:

```ts
// Pure habit math — cadence/aggregation rollup, progress calculation, sleep
// minutes conversion. No DB, no fetch, no React — the API routes and
// components call this and the Supabase helpers in src/lib/habit-queries.ts
// separately, same split as the sibling staff-hub repo's
// src/lib/reminderEligibility.ts.

import type { HabitCadence, HabitAggregation } from '@/types/habits'

export type HabitLogEntry = { date: string; value: number }

export function canAddHabit(activeCount: number, maxActive: number): boolean {
  return activeCount < maxActive
}

/**
 * Rolls daily log entries up into the single number a habit's progress is
 * measured against. 'daily' cadence just looks up today's entry. 'weekly'
 * cadence sums or averages the 7-day window ending `today` (inclusive).
 */
export function currentPeriodValue(
  logs: HabitLogEntry[],
  cadence: HabitCadence,
  aggregation: HabitAggregation | null,
  today: string
): number | null {
  if (cadence === 'daily') {
    const entry = logs.find((l) => l.date === today)
    return entry ? entry.value : null
  }

  const end = new Date(`${today}T00:00:00Z`)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  const startISO = start.toISOString().slice(0, 10)

  const windowLogs = logs.filter((l) => l.date >= startISO && l.date <= today)
  if (windowLogs.length === 0) return null

  const sum = windowLogs.reduce((acc, l) => acc + l.value, 0)
  return aggregation === 'average' ? sum / windowLogs.length : sum
}

export function progressPct(current: number | null, target: number | null): number | null {
  if (current == null || target == null || target <= 0) return null
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

export function isExpired(endDate: string | null, today: string): boolean {
  return endDate != null && endDate < today
}

/** Sleep is logged/targeted as total minutes; this splits it for the h/m input pair. */
export function minutesToHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

export function hoursMinutesToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

export function formatMetricValue(
  value: number,
  inputKind: 'number' | 'hours_minutes',
  unit: string
): string {
  if (inputKind === 'hours_minutes') {
    const { hours, minutes } = minutesToHoursMinutes(Math.round(value))
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  // A weekly average (e.g. 2000/7) can carry a long float tail — round to
  // one decimal place so it never renders as e.g. "914.2857142857143 steps".
  const rounded = Math.round(value * 10) / 10
  return `${rounded} ${unit}`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- habit-logic`
Expected: PASS, 20 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/habit-logic.ts src/lib/__tests__/habit-logic.test.ts
git commit -m "$(cat <<'EOF'
feat: add pure habit cadence/aggregation/progress logic

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Nutrition date-range read helper

**Files:**
- Modify: `src/lib/nutrition-queries.ts`
- Test: `src/lib/__tests__/nutrition-queries.test.ts`

The habit tracker needs a range of nutrition logs (not just one day) to compute a nutrition-category habit's progress. `fetchDayLog` only fetches a single date — this adds a range variant alongside it. Since this function talks to Supabase, it isn't unit-testable the way `habit-logic.ts` is; the test here instead locks down the pure date-range math it's built from, by testing a small extracted helper rather than mocking Supabase.

- [ ] **Step 1: Read the current file to confirm the exact export shape**

Run: `grep -n "^export" src/lib/nutrition-queries.ts`
Confirm `NutritionLog` is imported from `@/types/nutrition` and the existing `client()` helper's signature, so the new function matches exactly.

- [ ] **Step 2: Add the range-fetch function**

Append to `src/lib/nutrition-queries.ts`:

```ts
// Fetch logs for a member within an inclusive date range, oldest first —
// used by the habit tracker to compute a nutrition-category habit's
// progress without a second entry point (those habits read this table,
// never write their own — see migrations/009_habit_tracker.sql).
export async function fetchLogsInRange(
  gymMasterId: string,
  startDate: string,
  endDate: string
): Promise<NutritionLog[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('gymmaster_member_id', gymMasterId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  // Unlike fetchDayLog/fetchWeekLogs, a failed fetch here must not look
  // identical to "nothing logged this week" — it feeds habit progress math
  // that decides whether a member hit their target.
  if (error) throw new Error(error.message)
  return data ?? []
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/nutrition-queries.ts
git commit -m "$(cat <<'EOF'
feat: add date-range nutrition log fetch for habit progress

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Habit database query helpers

**Files:**
- Create: `src/lib/habit-queries.ts`

Server-only Supabase helpers for `member_habits`/`habit_logs`, mirroring `src/lib/nutrition-queries.ts`'s shape exactly (anon-key client, called only from API routes/server components).

- [ ] **Step 1: Write the file**

```ts
// src/lib/habit-queries.ts
// All functions use the anon Supabase client. Call these from server
// components and API routes only — mirrors src/lib/nutrition-queries.ts.

import { createClient } from '@supabase/supabase-js'
import type { Habit, HabitLog, HabitCategory, HabitCadence, HabitAggregation } from '@/types/habits'

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function fetchHabits(gymMasterId: string, status: 'active' | 'archived'): Promise<Habit[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('member_habits')
    .select('*')
    .eq('gymmaster_member_id', gymMasterId)
    .eq('status', status)
    .order('created_at', { ascending: true })

  if (error) console.error('[habit-queries] fetchHabits failed:', error)
  return data ?? []
}

// Throws on error, unlike the plain fetch helpers below — this gates the
// 5-active-habit cap in POST /api/habits, so a swallowed DB error returning
// 0 would silently let a member bypass the cap entirely.
export async function countActiveHabits(gymMasterId: string): Promise<number> {
  const supabase = client()
  const { count, error } = await supabase
    .from('member_habits')
    .select('id', { count: 'exact', head: true })
    .eq('gymmaster_member_id', gymMasterId)
    .eq('status', 'active')

  if (error) throw error
  return count ?? 0
}

// Throws on error for the same reason as countActiveHabits — this gates
// the no-duplicate-active-metric rule in POST /api/habits.
export async function hasActiveHabitForMetric(gymMasterId: string, metric: string): Promise<boolean> {
  const supabase = client()
  const { count, error } = await supabase
    .from('member_habits')
    .select('id', { count: 'exact', head: true })
    .eq('gymmaster_member_id', gymMasterId)
    .eq('metric', metric)
    .eq('status', 'active')

  if (error) throw error
  return (count ?? 0) > 0
}

export async function createHabit(gymMasterId: string, fields: {
  metric: string
  category: HabitCategory
  target: number | null
  cadence: HabitCadence
  aggregation: HabitAggregation | null
  start_date: string
  end_date: string | null
}): Promise<Habit> {
  const supabase = client()
  const { data, error } = await supabase
    .from('member_habits')
    .insert({ gymmaster_member_id: gymMasterId, ...fields, status: 'active' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function fetchHabitById(gymMasterId: string, id: string): Promise<Habit | null> {
  const supabase = client()
  const { data } = await supabase
    .from('member_habits')
    .select('*')
    .eq('id', id)
    .eq('gymmaster_member_id', gymMasterId)
    .single()

  return data ?? null
}

export async function updateHabit(
  gymMasterId: string,
  id: string,
  fields: Partial<Pick<Habit, 'target' | 'end_date' | 'status'>>
): Promise<Habit> {
  const supabase = client()
  const { data, error } = await supabase
    .from('member_habits')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('gymmaster_member_id', gymMasterId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Flips any active habit whose end_date has passed into 'archived'. Called
 * at the top of GET /api/habits so the list self-heals on every page load —
 * this is a member-facing, request-driven app with no cron, unlike the
 * sibling staff-hub repo.
 */
export async function archiveExpiredHabits(gymMasterId: string, today: string): Promise<void> {
  const supabase = client()
  const { error } = await supabase
    .from('member_habits')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('gymmaster_member_id', gymMasterId)
    .eq('status', 'active')
    .lt('end_date', today)

  // Best-effort: a failed sweep here just means this member's list stays
  // uncorrected until the next GET /api/habits call, not a lost write.
  if (error) console.error('[habit-queries] archiveExpiredHabits failed:', error)
}

export async function fetchHabitLogs(habitId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) console.error('[habit-queries] fetchHabitLogs failed:', error)
  return data ?? []
}

export async function upsertHabitLog(habitId: string, date: string, value: number): Promise<HabitLog> {
  const supabase = client()
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(
      { habit_id: habitId, date, value, updated_at: new Date().toISOString() },
      { onConflict: 'habit_id,date' }
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/habit-queries.ts
git commit -m "$(cat <<'EOF'
feat: add habit database query helpers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: API route — list and create habits

**Files:**
- Create: `src/app/api/habits/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  fetchHabits,
  countActiveHabits,
  hasActiveHabitForMetric,
  createHabit,
  archiveExpiredHabits,
} from '@/lib/habit-queries'
import { METRIC_CONFIG, MAX_ACTIVE_HABITS, type HabitMetric } from '@/types/habits'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// GET — list the member's active and archived habits.
export async function GET() {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await archiveExpiredHabits(gymmaster_member_id, todayISO())

  const [active, archived] = await Promise.all([
    fetchHabits(gymmaster_member_id, 'active'),
    fetchHabits(gymmaster_member_id, 'archived'),
  ])

  return NextResponse.json({ active, archived })
}

// POST — add a new habit. metric/category/cadence/aggregation are always
// validated server-side against METRIC_CONFIG — never trust the client for
// which category a metric belongs to.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { metric, target, cadence, aggregation, start_date, end_date } = body

  const config = METRIC_CONFIG[metric as HabitMetric]
  if (!config) {
    return NextResponse.json({ error: 'Unknown metric' }, { status: 400 })
  }
  if (cadence !== 'daily' && cadence !== 'weekly') {
    return NextResponse.json({ error: 'cadence must be daily or weekly' }, { status: 400 })
  }
  if (cadence === 'weekly' && aggregation !== 'total' && aggregation !== 'average') {
    return NextResponse.json({ error: 'aggregation must be total or average for a weekly habit' }, { status: 400 })
  }
  if (!start_date) {
    return NextResponse.json({ error: 'start_date is required' }, { status: 400 })
  }
  // Number(target) silently becomes null for garbage input (NaN serializes
  // to null in the insert body) — reject it instead of discarding it.
  if (target != null && target !== '' && !Number.isFinite(Number(target))) {
    return NextResponse.json({ error: 'target must be a number' }, { status: 400 })
  }

  // countActiveHabits/hasActiveHabitForMetric throw on a DB error rather
  // than returning 0/false — don't let a failed check silently pass.
  let activeCount: number
  let alreadyTracking: boolean
  try {
    activeCount = await countActiveHabits(gymmaster_member_id)
    alreadyTracking = await hasActiveHabitForMetric(gymmaster_member_id, metric)
  } catch (err) {
    console.error('[habits POST] failed to check existing habits:', err)
    return NextResponse.json({ error: 'Failed to check existing habits' }, { status: 500 })
  }

  if (activeCount >= MAX_ACTIVE_HABITS) {
    return NextResponse.json({ error: `Maximum ${MAX_ACTIVE_HABITS} active habits allowed` }, { status: 422 })
  }

  if (alreadyTracking) {
    return NextResponse.json({ error: 'This habit is already active' }, { status: 422 })
  }

  let habit
  try {
    habit = await createHabit(gymmaster_member_id, {
      metric,
      category: config.category,
      target: target != null && target !== '' ? Number(target) : null,
      cadence,
      aggregation: cadence === 'weekly' ? aggregation : null,
      start_date,
      end_date: end_date || null,
    })
  } catch (err) {
    // 23505 = unique_violation — member_habits_one_active_per_metric catching
    // a double-submit race that slipped past the hasActiveHabitForMetric
    // check above (two concurrent requests both passing before either insert
    // landed). Report it the same way the check itself would have.
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      return NextResponse.json({ error: 'This habit is already active' }, { status: 422 })
    }
    console.error('[habits POST] failed to create habit:', err)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }

  return NextResponse.json({ habit }, { status: 201 })
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/habits/route.ts
git commit -m "$(cat <<'EOF'
feat: add list/create API route for habits

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: API route — edit/archive a habit

**Files:**
- Create: `src/app/api/habits/[id]/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchHabitById, updateHabit } from '@/lib/habit-queries'

// PUT — edit a habit's target/end_date, or archive it (body: { action: 'archive' }).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const existing = await fetchHabitById(gymmaster_member_id, id)
  if (!existing) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  const body = await req.json()
  // Number(body.target) silently becomes null for garbage input (NaN
  // serializes to null in the update body) — reject it instead of letting
  // it silently wipe a previously-valid target.
  if ('target' in body && body.target != null && body.target !== '' && !Number.isFinite(Number(body.target))) {
    return NextResponse.json({ error: 'target must be a number' }, { status: 400 })
  }
  const update: { target?: number | null; end_date?: string | null; status?: 'active' | 'archived' } = {}
  if ('target' in body) update.target = body.target != null && body.target !== '' ? Number(body.target) : null
  // Setting end_date alongside action:'archive' in one call is allowed —
  // nothing downstream reads end_date on an archived row, so there's
  // nothing to reconcile.
  if ('end_date' in body) update.end_date = body.end_date || null
  if (body.action === 'archive') update.status = 'archived'

  let habit
  try {
    habit = await updateHabit(gymmaster_member_id, id, update)
  } catch (err) {
    console.error('[habits PUT] failed to update habit:', err)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
  return NextResponse.json({ habit })
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/habits/[id]/route.ts"
git commit -m "$(cat <<'EOF'
feat: add edit/archive API route for a single habit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: API route — habit logs (read + daily entry)

**Files:**
- Create: `src/app/api/habits/[id]/logs/route.ts`

For a nutrition-category habit, GET transparently maps rows from `nutrition_logs` into the same `{ id, habit_id, date, value, updated_at }` shape the UI expects from real `habit_logs` rows — the component layer never needs to know which source a habit's data came from. POST is rejected for nutrition habits (entry happens on the Nutrition page, not here).

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchHabitById, fetchHabitLogs, upsertHabitLog } from '@/lib/habit-queries'
import { fetchLogsInRange } from '@/lib/nutrition-queries'
import { NUTRITION_METRICS, type HabitMetric } from '@/types/habits'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function nutritionValueForMetric(
  log: { calories: number; protein_g: number; carbs_g: number; fats_g: number },
  metric: HabitMetric
): number {
  switch (metric) {
    case 'calories': return log.calories
    case 'protein': return log.protein_g
    case 'carbs': return log.carbs_g
    case 'fat': return log.fats_g
    default: return 0
  }
}

// GET /api/habits/:id/logs?start=&end= — defaults to the habit's full period.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value
  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const habit = await fetchHabitById(gymmaster_member_id, id)
  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') ?? habit.start_date
  const end = searchParams.get('end') ?? todayISO()
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/
  if (!dateFormat.test(start) || !dateFormat.test(end)) {
    return NextResponse.json({ error: 'start and end must be YYYY-MM-DD' }, { status: 400 })
  }

  if (NUTRITION_METRICS.has(habit.metric)) {
    // fetchLogsInRange throws on a DB error rather than returning [] — don't
    // let that look like "nothing logged this week" to the caller.
    let nutritionLogs
    try {
      nutritionLogs = await fetchLogsInRange(gymmaster_member_id, start, end)
    } catch (err) {
      console.error('[habits logs GET] nutrition fetch failed:', err)
      return NextResponse.json({ error: 'Failed to load nutrition data' }, { status: 500 })
    }
    const logs = nutritionLogs.map((l) => ({
      id: l.id,
      habit_id: habit.id,
      date: l.date,
      value: nutritionValueForMetric(l, habit.metric),
      updated_at: l.updated_at,
    }))
    return NextResponse.json({ logs })
  }

  const logs = await fetchHabitLogs(habit.id, start, end)
  return NextResponse.json({ logs })
}

// POST /api/habits/:id/logs — body: { date, value }. Upserts today's (or a
// backfilled past) entry. Rejected for nutrition-category habits.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value
  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const habit = await fetchHabitById(gymmaster_member_id, id)
  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  if (NUTRITION_METRICS.has(habit.metric)) {
    return NextResponse.json({ error: 'Nutrition habits are logged from the Nutrition page' }, { status: 400 })
  }

  const body = await req.json()
  const { date, value } = body
  if (!date || typeof value !== 'number' || !isFinite(value)) {
    return NextResponse.json({ error: 'date and a finite numeric value are required' }, { status: 400 })
  }
  if (date > todayISO()) {
    return NextResponse.json({ error: 'Cannot log a future date' }, { status: 400 })
  }

  const log = await upsertHabitLog(habit.id, date, value)
  return NextResponse.json({ log }, { status: 201 })
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/habits/[id]/logs/route.ts"
git commit -m "$(cat <<'EOF'
feat: add habit logs API route, reading from nutrition_logs for nutrition habits

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Nav label rename

**Files:**
- Modify: `src/components/layout/navItems.ts:15`

- [ ] **Step 1: Change the label**

```ts
  {
    href: "/results",
    label: "Habits, Goals & Events",
    match: ["/goals", "/nutrition", "/wellbeing", "/messages"],
  },
```

(Only the `label` field changes — `href` and `match` stay exactly as they are.)

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/navItems.ts
git commit -m "$(cat <<'EOF'
feat: rename Tracking nav item to "Habits, Goals & Events"

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Remove "Habit" from the Goal type picker

**Files:**
- Modify: `src/components/goals/GoalsClient.tsx:279-284`

Existing goals with `type: 'habit'` must keep rendering exactly as before (the `TYPE_CONFIG.habit` entry stays untouched) — only the create/edit form's type picker stops offering it.

- [ ] **Step 1: Remove the `habit` entry from `GOAL_TYPES`**

Change:

```ts
const GOAL_TYPES: { value: GoalType; label: string; emoji: string }[] = [
  { value: "strength", label: "Strength", emoji: "💪" },
  { value: "body", label: "Body", emoji: "⚖️" },
  { value: "habit", label: "Habit", emoji: "🔥" },
  { value: "education", label: "Education", emoji: "📚" },
];
```

to:

```ts
const GOAL_TYPES: { value: GoalType; label: string; emoji: string }[] = [
  { value: "strength", label: "Strength", emoji: "💪" },
  { value: "body", label: "Body", emoji: "⚖️" },
  { value: "education", label: "Education", emoji: "📚" },
];
```

Leave `TYPE_CONFIG` (lines 52-85) completely untouched — it still needs the `habit` entry so any existing habit-type goal continues to render its badge/color correctly.

- [ ] **Step 2: Verify it typechecks and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors. `GoalType` still includes `"habit"` as a valid type (the `type` field on `Goal` is unchanged) — only the *picker array* shrank, so editing an existing habit-type goal (which pre-fills `form.type = "habit"` from `editingGoal.type`) still works even though `"habit"` is no longer a clickable option in that case. That's an accepted, minor rough edge — not worth special-casing for a feature we're actively retiring.

- [ ] **Step 3: Commit**

```bash
git add src/components/goals/GoalsClient.tsx
git commit -m "$(cat <<'EOF'
feat: remove Habit from the new-goal type picker

Existing habit-type goals are untouched (TYPE_CONFIG.habit stays in
place) — only new goal creation stops offering it, now that the habit
tracker is the structured place for habits.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Install Recharts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

```bash
npm install recharts@^3.10.1
```

- [ ] **Step 2: Verify the install didn't break the build**

Run: `npm run build`
Expected: builds cleanly (Recharts isn't used by any component yet — this just confirms the install itself is sound before relying on it in Task 14).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore: add recharts for habit progress charts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Habits client component (setup, active list, archived list)

**Files:**
- Create: `src/components/habits/HabitsClient.tsx`

This is the main habit tracker UI — structured the same way `src/components/goals/GoalsClient.tsx` is (one file: card components, a modal, the main export with its own `useState`/`useEffect`), since that's the established convention for a Tracking-section feature in this repo. It renders the setup flow (category tabs → metric grid → config form), the active-habits list with quick-entry, and a collapsible archived list. The per-habit chart/table (Task 14) opens from here but lives in its own file, since Recharts and date-range fetching are a distinct concern.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  METRIC_CONFIG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  metricsInCategory,
  NUTRITION_METRICS,
  MAX_ACTIVE_HABITS,
  type Habit,
  type HabitCategory,
  type HabitMetric,
  type HabitCadence,
  type HabitAggregation,
} from "@/types/habits";
import {
  hoursMinutesToMinutes,
  minutesToHoursMinutes,
  formatMetricValue,
} from "@/lib/habit-logic";
import HabitDetailModal from "./HabitDetailModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const inputClass =
  "bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors";

// ─── Quick-entry input (handles sleep's h/m pair vs a plain number) ──────────

function QuickEntryInput({
  habit,
  onSubmit,
}: {
  habit: Habit;
  onSubmit: (value: number) => void;
}) {
  const config = METRIC_CONFIG[habit.metric];
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (config.inputKind === "hours_minutes") {
      const h = parseInt(hours, 10) || 0;
      const m = parseInt(minutes, 10) || 0;
      onSubmit(hoursMinutesToMinutes(h, m));
      setHours("");
      setMinutes("");
    } else {
      const v = parseFloat(value);
      if (!isFinite(v)) return;
      onSubmit(v);
      setValue("");
    }
  }

  if (config.inputKind === "hours_minutes") {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          placeholder="h"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className={`${inputClass} w-14 text-center`}
        />
        <input
          type="number"
          min="0"
          max="59"
          placeholder="m"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className={`${inputClass} w-14 text-center`}
        />
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          Log
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        type="number"
        step="any"
        placeholder={config.unit}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} w-24`}
      />
      <button
        type="submit"
        className="bg-brand hover:bg-brand-dark text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
      >
        Log
      </button>
    </form>
  );
}

// ─── Habit card ───────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  onLog,
  onOpenDetail,
  onArchive,
  justLogged,
}: {
  habit: Habit;
  onLog: (habitId: string, value: number) => void;
  onOpenDetail: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  justLogged: boolean;
}) {
  const config = METRIC_CONFIG[habit.metric];
  const isNutrition = NUTRITION_METRICS.has(habit.metric);
  const cadenceLabel =
    habit.cadence === "daily"
      ? "Daily"
      : `Weekly ${habit.aggregation === "average" ? "average" : "total"}`;

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl relative overflow-hidden shadow-sm flex flex-col p-5 gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide bg-status-green/10 text-status-green">
          {config.emoji} {CATEGORY_LABELS[habit.category]}
        </span>
        <button
          type="button"
          onClick={() => onArchive(habit.id)}
          className="text-[11px] px-2.5 py-1 rounded-lg border border-border-light text-text-secondary hover:text-text-primary hover:border-brand/40 transition-colors"
        >
          End
        </button>
      </div>

      <h3 className="font-semibold text-text-primary text-sm leading-snug">{config.label}</h3>
      <p className="text-xs text-text-secondary">
        {cadenceLabel}
        {habit.target != null && ` · target ${formatMetricValue(habit.target, config.inputKind, config.unit)}`}
      </p>

      {isNutrition ? (
        <p className="text-xs text-text-secondary italic">
          Logged from the Nutrition page — view progress below.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <QuickEntryInput habit={habit} onSubmit={(v) => onLog(habit.id, v)} />
          {justLogged && <span className="text-xs text-status-green font-semibold">Logged ✓</span>}
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenDetail(habit)}
        className="text-xs text-brand hover:text-brand-dark font-semibold text-left mt-1"
      >
        View progress ▸
      </button>
    </div>
  );
}

// ─── Archived card (compact) ──────────────────────────────────────────────────

function ArchivedHabitCard({ habit, onOpenDetail }: { habit: Habit; onOpenDetail: (habit: Habit) => void }) {
  const config = METRIC_CONFIG[habit.metric];
  return (
    <button
      type="button"
      onClick={() => onOpenDetail(habit)}
      className="w-full text-left bg-bg-card border border-border-light rounded-xl relative overflow-hidden opacity-60 hover:opacity-90 transition-opacity flex items-center gap-4 px-4 py-3"
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-border-light flex items-center justify-center text-sm">
        {config.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-text-primary truncate">{config.label}</span>
        <p className="text-xs text-text-secondary">
          {formatDate(habit.start_date)} – {habit.end_date ? formatDate(habit.end_date) : "ongoing"}
        </p>
      </div>
    </button>
  );
}

// ─── Setup modal ────────────────────────────────────────────────────────────

function SetupModal({
  activeCount,
  activeMetrics,
  onSave,
  onClose,
}: {
  activeCount: number;
  activeMetrics: Set<HabitMetric>;
  onSave: (fields: {
    metric: HabitMetric;
    target: string;
    cadence: HabitCadence;
    aggregation: HabitAggregation;
    start_date: string;
    end_date: string;
  }) => Promise<string | null>;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<HabitCategory>("wellbeing");
  const [metric, setMetric] = useState<HabitMetric | null>(null);
  const [target, setTarget] = useState("");
  const [targetHours, setTargetHours] = useState("");
  const [targetMinutes, setTargetMinutes] = useState("");
  const [cadence, setCadence] = useState<HabitCadence>("daily");
  const [aggregation, setAggregation] = useState<HabitAggregation>("total");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const atCap = activeCount >= MAX_ACTIVE_HABITS;
  const selectedConfig = metric ? METRIC_CONFIG[metric] : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!metric) return;
    setSaving(true);
    setError(null);

    const config = METRIC_CONFIG[metric];
    const targetValue =
      config.inputKind === "hours_minutes"
        ? targetHours || targetMinutes
          ? String(hoursMinutesToMinutes(parseInt(targetHours, 10) || 0, parseInt(targetMinutes, 10) || 0))
          : ""
        : target;

    const err = await onSave({
      metric,
      target: targetValue,
      cadence,
      aggregation,
      start_date: startDate,
      end_date: endDate,
    });

    setSaving(false);
    if (err) {
      setError(err);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-light rounded-2xl w-full max-w-lg shadow-xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">New Habit</p>
          <h2 className="font-display text-xl text-text-primary">Track something new</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {atCap ? (
            <p className="text-sm text-status-amber">
              You already have {MAX_ACTIVE_HABITS} active habits — end one before adding another.
            </p>
          ) : !metric ? (
            <>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_ORDER.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      category === c
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {metricsInCategory(category).map((m) => {
                  const disabled = activeMetrics.has(m.metric);
                  return (
                    <button
                      key={m.metric}
                      type="button"
                      disabled={disabled}
                      onClick={() => setMetric(m.metric)}
                      className={`text-center p-3 rounded-xl border transition-colors ${
                        disabled
                          ? "opacity-40 cursor-not-allowed border-border-light"
                          : "border-border-light hover:border-brand/40"
                      }`}
                    >
                      <div className="text-xl mb-1">{m.emoji}</div>
                      <div className="text-xs font-semibold text-text-primary">{m.label}</div>
                      <div className="text-[10px] text-text-secondary">{m.unit}</div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-text-primary font-semibold">
                {selectedConfig!.emoji} {selectedConfig!.label}
                <button
                  type="button"
                  onClick={() => setMetric(null)}
                  className="ml-2 text-xs text-brand hover:text-brand-dark font-normal"
                >
                  change
                </button>
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Target (optional)
                </label>
                {selectedConfig!.inputKind === "hours_minutes" ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="hours"
                      value={targetHours}
                      onChange={(e) => setTargetHours(e.target.value)}
                      className={`${inputClass} w-20`}
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="minutes"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(e.target.value)}
                      className={`${inputClass} w-24`}
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    step="any"
                    placeholder={`e.g. 10000 ${selectedConfig!.unit}`}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className={inputClass}
                  />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Evaluate as
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCadence("daily")}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      cadence === "daily"
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCadence("weekly");
                      setAggregation("total");
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      cadence === "weekly" && aggregation === "total"
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary"
                    }`}
                  >
                    Weekly total
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCadence("weekly");
                      setAggregation("average");
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      cadence === "weekly" && aggregation === "average"
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary"
                    }`}
                  >
                    Weekly average
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Start date
                  </label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    End date (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-status-red">{error}</p>}

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
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-sm font-semibold text-white transition-colors"
                >
                  {saving ? "Saving…" : "Add habit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HabitsClient() {
  const [active, setActive] = useState<Habit[]>([]);
  const [archived, setArchived] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/habits");
      const json = await res.json();
      setActive(json.active ?? []);
      setArchived(json.archived ?? []);
    } catch (err) {
      console.error("Failed to load habits:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLog(habitId: string, value: number) {
    try {
      await fetch(`/api/habits/${habitId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayISO(), value }),
      });
      setJustLoggedId(habitId);
      setTimeout(() => setJustLoggedId(null), 2000);
    } catch (err) {
      console.error("Failed to log habit value:", err);
    }
  }

  async function handleArchive(habitId: string) {
    setActive((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await fetch(`/api/habits/${habitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      await load();
    } catch (err) {
      console.error("Failed to archive habit:", err);
    }
  }

  async function handleSave(fields: {
    metric: HabitMetric;
    target: string;
    cadence: HabitCadence;
    aggregation: HabitAggregation;
    start_date: string;
    end_date: string;
  }): Promise<string | null> {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric: fields.metric,
          target: fields.target === "" ? null : Number(fields.target),
          cadence: fields.cadence,
          aggregation: fields.cadence === "weekly" ? fields.aggregation : null,
          start_date: fields.start_date,
          end_date: fields.end_date || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Something went wrong";
      await load();
      setModalOpen(false);
      return null;
    } catch (err) {
      console.error("Failed to save habit:", err);
      return "Something went wrong";
    }
  }

  const activeMetrics = new Set(active.map((h) => h.metric));

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary text-sm">Loading habits…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-brand font-semibold mb-0.5">My Habits</p>
          <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-[0.95]">Habits</h1>
          <p className="text-sm text-text-secondary mt-2">
            Up to {MAX_ACTIVE_HABITS} at a time — log daily, see your trend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-1 shrink-0 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + Add Habit
        </button>
      </div>

      {active.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onLog={handleLog}
              onOpenDetail={setDetailHabit}
              onArchive={handleArchive}
              justLogged={justLoggedId === habit.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🔥</p>
          <p className="font-semibold text-text-primary mb-1">No active habits</p>
          <p className="text-sm text-text-secondary mb-4">Pick up to {MAX_ACTIVE_HABITS} things to track.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Add Habit
          </button>
        </div>
      )}

      {archived.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setArchivedOpen((v) => !v)}
            className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-semibold text-text-secondary hover:text-text-primary transition-colors mb-3"
          >
            <span className={`transition-transform ${archivedOpen ? "rotate-90" : ""}`}>▶</span>
            <span>Archived — {archived.length}</span>
          </button>
          {archivedOpen && (
            <div className="space-y-2">
              {archived.map((habit) => (
                <ArchivedHabitCard key={habit.id} habit={habit} onOpenDetail={setDetailHabit} />
              ))}
            </div>
          )}
        </section>
      )}

      {modalOpen && (
        <SetupModal
          activeCount={active.length}
          activeMetrics={activeMetrics}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {detailHabit && <HabitDetailModal habit={detailHabit} onClose={() => setDetailHabit(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: errors only about the not-yet-created `./HabitDetailModal` — that's expected until Task 14. If there are any *other* errors, fix them before moving on.

- [ ] **Step 3: Commit**

```bash
git add src/components/habits/HabitsClient.tsx
git commit -m "$(cat <<'EOF'
feat: add habits client (setup flow, active list, archived list)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Habit detail modal (chart + table + backfill)

**Files:**
- Create: `src/components/habits/HabitDetailModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { METRIC_CONFIG, NUTRITION_METRICS, type Habit } from "@/types/habits";
import { currentPeriodValue, progressPct, formatMetricValue, type HabitLogEntry } from "@/lib/habit-logic";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// Discrete daily actions read better as bars; continuous measures as a line.
const BAR_METRICS = new Set(["steps", "workouts", "exercise_reps", "distance"]);

const inputClass =
  "bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors";

export default function HabitDetailModal({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const config = METRIC_CONFIG[habit.metric];
  const isNutrition = NUTRITION_METRICS.has(habit.metric);
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [backfillDate, setBackfillDate] = useState(todayISO());
  const [backfillValue, setBackfillValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/habits/${habit.id}/logs`);
      const json = await res.json();
      setLogs((json.logs ?? []).map((l: { date: string; value: number }) => ({ date: l.date, value: l.value })));
    } catch (err) {
      console.error("Failed to load habit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id]);

  async function handleBackfill(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(backfillValue);
    if (!isFinite(value)) return;
    setSaving(true);
    try {
      await fetch(`/api/habits/${habit.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: backfillDate, value }),
      });
      setBackfillValue("");
      await load();
    } catch (err) {
      console.error("Failed to save backfilled value:", err);
    } finally {
      setSaving(false);
    }
  }

  const current = currentPeriodValue(logs, habit.cadence, habit.aggregation, todayISO());
  const pct = progressPct(current, habit.target);
  const chartData = logs.map((l) => ({ date: formatDate(l.date), value: l.value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-light rounded-2xl w-full max-w-2xl shadow-xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-green to-transparent" />

        <div className="px-6 pt-6 pb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-status-green font-semibold mb-0.5">
            {config.emoji} {config.label}
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-text-primary">
                {current != null ? formatMetricValue(current, config.inputKind, config.unit) : "No data yet"}
              </h2>
              {habit.target != null && (
                <p className="text-sm text-text-secondary">
                  of {formatMetricValue(habit.target, config.inputKind, config.unit)} target
                  {pct != null && ` · ${pct}%`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {loading ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-text-secondary">No values logged yet.</p>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                {BAR_METRICS.has(habit.metric) ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {!isNutrition && (
            <form onSubmit={handleBackfill} className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={backfillDate}
                  max={todayISO()}
                  min={habit.start_date}
                  onChange={(e) => setBackfillDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Value ({config.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={backfillValue}
                  onChange={(e) => setBackfillValue(e.target.value)}
                  className={`${inputClass} w-28`}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                Save
              </button>
            </form>
          )}

          {logs.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary text-xs uppercase tracking-wide">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .slice()
                  .reverse()
                  .map((l) => (
                    <tr key={l.date} className="border-t border-border-light">
                      <td className="py-1.5 text-text-secondary">{formatDate(l.date)}</td>
                      <td className="py-1.5 text-text-primary font-data">
                        {formatMetricValue(l.value, config.inputKind, config.unit)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/habits/HabitDetailModal.tsx
git commit -m "$(cat <<'EOF'
feat: add habit detail modal with chart, table, and backfill

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Wire HabitsClient into the Goals page

**Files:**
- Modify: `src/app/(member)/goals/page.tsx`

- [ ] **Step 1: Add the import and render it between Events and Goals**

Change:

```tsx
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

to:

```tsx
import EventPlanner from '@/components/goals/EventPlanner'
import HabitsClient from '@/components/habits/HabitsClient'
import GoalsClient from '@/components/goals/GoalsClient'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <EventPlanner />
      <HabitsClient />
      <GoalsClient />
    </div>
  )
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: builds cleanly.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(member)/goals/page.tsx"
git commit -m "$(cat <<'EOF'
feat: wire habits into the Goals page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: Full verification

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass (the `habit-logic.test.ts` suite from Task 4 — 20 tests, nothing else exists yet in this repo).

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no new errors. If this repo has pre-existing lint errors unrelated to this work, report them separately rather than fixing or hiding them.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: clean build, `/goals` route present in the output.

- [ ] **Step 4: Report to Ed**

Summarize: what was built, that migration `009_habit_tracker.sql` needs running in the Supabase SQL Editor before any of this activates (every route returns a DB error until then — there's no graceful pre-migration degrade built in here, unlike the staff-hub plan's pattern, since this is new functionality with no existing users depending on it working mid-rollout), and that Vitest + Recharts are new dependencies now present in `package.json`. Do not push to `main` or run the migration — ask first.

---

## Self-review notes (from the writing-plans checklist)

- **Spec coverage:** nav rename (Task 10), habit-vs-goal picker change with existing goals untouched (Task 11), per-habit dates/target/cadence/aggregation (Tasks 3, 6, 7), 5-active cap (Tasks 6, 7), nutrition reuse (Tasks 5, 9), archiving lifecycle (Tasks 6, 7), quick-entry + backfill logging (Tasks 13, 14), charts + tables (Task 14), test infrastructure (Task 1) — all covered against the spec's decision list.
- **Placeholder scan:** none found — every step has real, complete code.
- **Type consistency:** `Habit`, `HabitLog`, `HabitMetric`, `HabitCategory`, `HabitCadence`, `HabitAggregation` field names checked consistent across `types/habits.ts`, `habit-queries.ts`, both API routes, and both components. `HabitLogEntry` (pure-logic shape, `{date, value}`) checked consistent between `habit-logic.ts` and its two callers (`HabitsClient` doesn't need it directly; `HabitDetailModal` maps API `HabitLog` rows into it explicitly).
- **Known rough edge flagged, not hidden:** Task 11's note about an existing habit-type goal's edit form no longer offering "Habit" as a re-selectable option is called out explicitly rather than silently shipped as a confusing dead end.
