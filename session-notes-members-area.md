# Members Area — Session Notes

> Concise reference for picking up a new session. Last updated: 2026-04-28.

---

## Project Overview

**Members Area** — Next.js 16 (App Router) member portal for Number One HSP gym.
**Live URL:** `members-area-seven.vercel.app`
**Repo:** `https://github.com/Numberonehsp/members-area.git` (public)
**Local path:** `/Users/edharper/Documents/Claude Gym/members-area`
**Deployed via:** Vercel (auto-deploy on push to `main`)

---

## Architecture

### Two Supabase Databases

| Project | Purpose | Client |
|---|---|---|
| **Members Area** (`cwuojhibgclirxsutwtg`) | Body comp scans, goals (future) | Not used heavily yet |
| **Staff Hub** (`entbakkftqdejpjdynts`) | Events, challenges, awards, member_events, signups | `staffHubReader` (anon, Server Components) / `staffHubWriter` (service role, API routes only) |

Staff Hub clients are in `src/lib/staffhub.ts`. **Never import `staffHubWriter` in `'use client'` components.**

### GymMaster API
- Base URL: `https://{SITE_NAME}.gymmasteronline.com/portal/api/v1`
- Auth: `token` + `api_key` as query params
- Client in `src/lib/gymmaster.ts`
- **Key behaviour:** `/member/visits/monthly` always returns all 12 months for the current year regardless of what year/month you pass. Do NOT loop this 24 times — use `getAnnualVisits()` (one call, all months).
- Falls back to `SEED_VISITS` (visitCount: 9) when env vars missing — watch for seed data appearing in production.

### Auth Flow
Login → `/api/auth/login` → sets cookies: `gymmaster_token` (httpOnly), `gymmaster_member_id`, `gymmaster_first_name`, `gymmaster_last_name`

---

## Required Env Vars

All must be set both in `.env.local` and **Vercel dashboard**:

```
GYMMASTER_SITE_NAME
GYMMASTER_MEMBER_API_KEY
GYMMASTER_STAFF_API_KEY
STAFFHUB_SUPABASE_URL
STAFFHUB_SUPABASE_ANON_KEY
STAFFHUB_SUPABASE_SERVICE_ROLE_KEY   ← needed for any write operations
```

---

## Staff Hub Supabase Tables (relevant to Members Area)

| Table | Purpose |
|---|---|
| `events` | Gym calendar (announcements, competitions, 6-week starts) |
| `challenges` | Active challenges (has `signup_deadline`, `how_to_signup` columns) |
| `challenge_signups` | `challenge_id`, `gymmaster_member_id`, `signed_up_at` — **no `member_name` column** |
| `member_awards` | `month`, `award_type` (athlete_of_month / commitment_club), `member_name`, `reason` |
| `member_events` | Personal events added via Goals page — `gymmaster_member_id`, `member_name`, `event_name`, `event_date` |

---

## Key Bugs Fixed This Session

### GymMaster visits showing seed data (9 visits)
**Root cause:** Parser looked for `entry.count` but API returns `entry.visits`.
**Fix:** `src/lib/gymmaster.ts` Shape 1 parser now checks `entry.visits` first.

### Attendance streak showing "24 months in a row"
**Root cause:** Called `getMonthlyVisits` 24 times going back 2 years; API always returns current-year data, so past years got false positives from months with visits.
**Fix:** Added `getAnnualVisits()` — single API call, returns all 12 months. `AttendanceStreak` now makes one call only.

### Challenge signup "Failed to sign up"
**Root cause:** `challenge_signups` table was created without `member_name` column; insert tried to write it.
**Fix:** Removed `member_name` from insert. To add it later: `ALTER TABLE challenge_signups ADD COLUMN IF NOT EXISTS member_name TEXT;`

### Notification dropdown clipping
**Root cause:** Sidebar header had `overflow-hidden` clipping the dropdown.
**Fix:** Removed `overflow-hidden`, changed dropdown to `left-0` (opens into content area), raised `z-index` to 100.

---

## Key Decisions Made

- **Attendance widget merged:** `AttendanceWidget` and `AttendanceStreak` combined into one card showing visits/12, progress bar, 6-month bar chart, and streak. `AttendanceWidget.tsx` deleted.
- **Commitment Club removed from sidebar:** Content moved into Community Hub page.
- **Goals page is hybrid:** `GoalsPage` is now a server component wrapper; goal logic is in `GoalsClient.tsx` (client), `EventPlanner.tsx` (server) + `EventPlannerClient.tsx` (client).
- **Body fat progress fix:** Added `startValue` to `Goal` type. Progress for decrease goals = `(start - current) / (start - target)`. Shows "↓ lower is better" label.
- **Event Planner cap:** 3 events max, enforced server-side in `POST /api/member-events`.
- **Goals data is still seed data** — goals are not persisted to a database yet. Goals page uses `useState` with `SEED_GOALS`.

---

## Current State of Each Page

| Page | Data Source | Status |
|---|---|---|
| Dashboard | GymMaster + Staff Hub | ✅ Live |
| Goals | Seed data (useState) | ⚠️ Not persisted |
| Event Planner (on Goals) | Staff Hub `member_events` | ✅ Live |
| Commitment Club | Removed from nav | — |
| Community Hub | Staff Hub challenges + awards + events | ✅ Live |
| Results | Seed data | ⚠️ Seed |
| Wellbeing | Members Area Supabase `wellbeing_checkins` | ✅ Live |
| Education | Seed data (nutrition modules added) | ⚠️ Seed |
| Messages | Members Area Supabase `messages` + `message_threads` | ✅ Live |
| Partners | Placeholder | ❌ Not built |

---

## Deferred / Next Steps

1. **Persist goals to database** — currently only in `useState`, lost on refresh. Needs a `member_goals` Supabase table + API routes.
2. **Staff Hub display of member events** — coaches can't yet see Event Planner entries. Need a section in the Staff Hub member engagement area.
3. **Add `member_name` to challenge_signups** — run the ALTER TABLE above, then restore the field in the signup route.
4. **Commitment Club page (live data)** — `/commitment-club` route still exists with hardcoded leaderboard. Either remove or wire up `getAllMemberVisitsThisMonth()`.
5. **Results page** — wire to real InBody scan data.
6. **Mobile review** — app is responsive but hasn't had a dedicated mobile pass.

---

## File Structure (key files)

```
src/
  app/
    (member)/
      dashboard/page.tsx          — server component, fetches announcements
      goals/page.tsx              — server wrapper: EventPlanner + GoalsClient
      community/page.tsx          — challenges, awards, upcoming events
      commitment-club/page.tsx    — still exists, hardcoded data
      community/challenge/[id]/   — detail + SignUpButton (client)
    api/
      auth/login/route.ts
      challenges/signup/route.ts
      member-events/route.ts      — POST (add event)
      member-events/[id]/route.ts — DELETE (remove event)
  components/
    dashboard/
      AttendanceStreak.tsx        — combined attendance + commitment club widget
      AwardsPreview.tsx           — live from Staff Hub
      GymEvents.tsx, ChallengesPreview.tsx, AnnouncementBanner.tsx
    goals/
      GoalsClient.tsx             — all goal logic (client)
      EventPlanner.tsx            — server: fetches, passes to client
      EventPlannerClient.tsx      — client: add/delete UI
    layout/
      MemberSidebar.tsx           — no Commitment Club in nav
      NotificationBell.tsx        — dropdown, seed data only
  lib/
    gymmaster.ts                  — getAnnualVisits(), getMonthlyVisits(), loginMember()
    staffhub.ts                   — all Staff Hub fetch helpers + types
```

---

## Workflow Notes

- Working directly on `main` branch (no worktrees — simpler for this user)
- Vercel deploys automatically on push — ~1 min build time
- TypeScript check: `npx tsc --noEmit` before committing
- Staff Hub app: `https://staff-hub-fawn.vercel.app/` — separate project
- Plan docs in `docs/superpowers/plans/`, specs in `docs/superpowers/specs/`
