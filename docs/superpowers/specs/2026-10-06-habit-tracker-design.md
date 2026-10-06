# Habit Tracker — Design

## Context

Ed wants to expand the Tracking section of the Members Area (members.numberonehsp.com) with a structured habit tracker, sitting alongside the existing Goals and Events features on `/goals`. The nav item currently labeled "Tracking" (`src/components/layout/navItems.ts:14-17`) gains a renamed label: "Habits, Goals & Events".

Members choose up to 5 active habits at a time from 11 predefined metrics across 3 categories:
- **Wellbeing** — Sleep (hours & minutes), Stretching (minutes), Hydration (litres)
- **Nutrition** — Calories (kcal), Fat (g), Protein (g), Carbs (g)
- **Activity** — Steps, Distance (km), Workouts, Exercise (reps)

Each habit has its own start/end date, an optional target, and is evaluated daily, weekly-total, or weekly-average. Progress is shown via graphs and tables.

## What already exists (verified against members-area repo, 2026-10-06)

- Goals: `member_goals` table (`migrations/003_add_member_goals.sql:4-20`), columns `type` (CHECK: `strength|body|habit|education`), `title`, `target_value`, `current_value`, `start_value`, `unit`, `deadline`, `status` (`active|completed`), `note`. Rendered by `src/components/goals/GoalsClient.tsx`, with a `TYPE_CONFIG` map (`GoalsClient.tsx:44-80`) giving each `type` an emoji/color, including `habit` (🔥, green).
- Events: `src/components/goals/EventPlanner.tsx` → `EventPlannerClient.tsx` (heading "Upcoming Events", `MAX_EVENTS = 3`). Data lives in `member_events`, queried via `src/lib/staffhub.ts`'s `fetchAllMemberEvents` against the **Staff Hub's** Supabase project (`staffHubWriter` client) — not this app's own database. This is the odd one out of the three Tracking features.
- Nutrition: `migrations/008_nutrition_tracker.sql` — `nutrition_targets` (one row per member, `calories`/`protein_g`/`carbs_g`/`fats_g` defaults) and `nutrition_logs` (one row per member per day, same four numeric columns, `UNIQUE(gymmaster_member_id, date)`). Both RLS-enabled with an open dev-phase policy. This is the closest existing analog to "log a numeric value against a date" and the pattern the new habit tables follow.
- No charting library exists anywhere in this repo (`package.json`, and no recharts/chart.js/visx/nivo imports found). All progress visuals today are hand-rolled divs (e.g. the Goals progress bar).
- `supabase-schema.sql` at the repo root does not include `member_goals` or the nutrition tables — they only exist in the numbered `migrations/` files. It appears to be stale/not auto-regenerated; out of scope to fix here, but new habit tables follow the same `migrations/NNN_*.sql` convention rather than touching that file.

## Decisions made (this session)

- **Habit vs. Goal overlap**: the new habit tracker replaces the `habit` value as a selectable `type` when creating a new Goal. Existing goals already saved with `type = 'habit'` are left exactly as-is (still visible, editable, completable) — no migration, no data loss. Only the create-goal picker stops offering "Habit" going forward.
- **Time period**: per-habit, not a single shared period for all 5. Each habit gets its own `start_date` and optional `end_date`, set when it's added — matches how Goals already work per-item.
- **Target**: optional per habit. A member can set a numeric target (shown as progress, same visual language as Goals) or leave it blank and just see the trend.
- **Cadence vs. "total or average"**: a member always logs one value per day for a given habit (never a direct weekly entry). `cadence` (`daily`/`weekly`) and `aggregation` (`total`/`average`, only meaningful when `cadence = 'weekly'`) control how those daily logs are rolled up and compared against the target — e.g. Steps evaluated as a weekly total, Sleep evaluated as a weekly average hours/night. This keeps logging uniform across every metric while letting the target-check vary.
- **Nutrition metrics reuse existing data**: Calories/Fat/Protein/Carbs habits do **not** get their own daily entry field or their own log rows. A nutrition-category habit is purely a `member_habits` configuration row (target/cadence/aggregation/dates); its progress is computed by reading the existing `nutrition_logs` table for the relevant date range. This avoids asking a member to enter the same number twice if they use both features. Steps/Distance/Workouts/Exercise (Activity) and Sleep/Stretching/Hydration (Wellbeing) have no existing equivalent in this app, so they get real daily entries via a new `habit_logs` table.
- **Lifecycle**: a habit past its `end_date`, or manually ended by the member, moves to `status = 'archived'` rather than being deleted. Archived habits and their full log history stay viewable in a separate list (mirroring Goals' Completed list), and ending one frees a slot in the active-5 cap.
- **Logging UI**: each active non-nutrition habit shows a quick-entry input for *today* directly on the tracking page. Opening a habit's detail view (graph + table) allows adding or correcting a value for any past date within that habit's period — covers a member forgetting to log same-day.
- **Charting**: Recharts, added as a new dependency (none exists in this repo today). Styled to match the existing teal/Goals accent rather than Recharts' default theme — bar charts for discrete daily metrics (Steps, Workouts), line charts for continuous ones (Sleep, Hydration).

## Data model

New migration, `migrations/0XX_habit_tracker.sql` (exact number assigned at implementation time — check latest in `migrations/` first, since this repo's numbering may have moved on since this doc was written):

```sql
create table if not exists member_habits (
  id uuid primary key default gen_random_uuid(),
  gymmaster_member_id text not null,
  metric text not null check (metric in (
    'sleep', 'stretching', 'hydration',
    'calories', 'fat', 'protein', 'carbs',
    'steps', 'distance', 'workouts', 'exercise_reps'
  )),
  category text not null check (category in ('wellbeing', 'nutrition', 'activity')),
  target numeric,
  cadence text not null check (cadence in ('daily', 'weekly')),
  aggregation text check (aggregation in ('total', 'average')),
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references member_habits(id) on delete cascade,
  date date not null,
  value numeric not null,
  updated_at timestamptz default now(),
  unique(habit_id, date)
);
```

RLS enabled with the same open dev-phase policy used by `nutrition_logs`/`nutrition_targets`, for consistency with this repo's current convention (not introducing a stricter policy unilaterally).

`habit_logs` rows are never written for `category = 'nutrition'` habits — their progress is computed at read time by querying `nutrition_logs` for the member within `[start_date, min(end_date, today)]`, aggregated per the habit's `cadence`/`aggregation`, exactly as a real `habit_logs`-backed habit would be.

A server-side check enforces at most 5 rows with `status = 'active'` per `gymmaster_member_id` on habit creation, mirroring the existing `MAX_EVENTS` check in `src/app/api/member-events/route.ts`.

## UI changes

- `src/components/layout/navItems.ts:15` — label becomes "Habits, Goals & Events".
- `src/app/(member)/goals/page.tsx` — new "My Habits" section rendered between `<EventPlanner />` and `<GoalsClient />`.
- New component tree under `src/components/habits/`: a setup flow (category tabs → metric picker, grayed out past 5 active → config form for target/cadence/aggregation/dates), an active-habits list (quick-entry input + mini progress, same card language as Goals), a per-habit detail view (Recharts chart + table, backfill any past date), and an archived-habits list.
- `src/components/goals/GoalsClient.tsx` — remove `habit` from the creatable `type` options in the new-goal form; leave `TYPE_CONFIG`'s `habit` entry in place so existing habit-type goals still render correctly.

## Testing

- API route tests: the 5-active-habit cap (reject a 6th), the nutrition-aggregation read path (correct total/average computed from `nutrition_logs` for a given habit's date range and cadence), archiving on `end_date` passing or manual end.
- Component tests: setup flow blocks selecting a 6th metric and blocks selecting an already-active metric twice; cadence/aggregation correctly roll daily `habit_logs` entries into weekly totals/averages; nutrition-category habits render without a manual entry field.
- No real member data in tests or fixtures — synthetic records only.

## Out of scope for this spec

- Any change to the existing Nutrition page itself (it remains the single place nutrition values are entered).
- Any change to Events or its external Staff Hub data source.
- Retrofitting `supabase-schema.sql` to include the (already-stale) Goals/Nutrition tables — the new habit tables follow the same `migrations/` convention those already use, not the stale root schema file.
