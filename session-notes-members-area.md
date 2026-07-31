# Members Area — Session Notes

> Concise reference for picking up a new session. Last updated: 2026-05-11.

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

## GymMaster Measurements API (v2)

- **Endpoint:** `GET https://numberonehsp.gymmasteronline.com/portal/api/v2/member/measurements`
- **Auth:** `?api_key={GYMMASTER_MEMBER_API_KEY}&token={member_token}` (query params)
- **Returns:** Array of measurements sorted by `created` timestamp, newest first
- **Status:** Fetch function added to `gymmaster.ts` with full response logging. Response shape not yet confirmed — check Vercel logs after a logged-in member visits `/results/body-composition` for the `[GymMaster] measurements 200:` log line.
- **Next step:** Once response shape confirmed, map fields to `InBodyScan` format and merge with Supabase data.
- `getMemberMeasurements(memberToken)` in `src/lib/gymmaster.ts` — returns raw `GymMasterMeasurement[]`

---

## Staff Hub Supabase Tables (relevant to Members Area)

| Table | Purpose |
|---|---|
| `events` | Gym calendar (announcements, competitions, 6-week starts) |
| `challenges` | Active challenges (has `signup_deadline`, `how_to_signup` columns) |
| `challenge_signups` | `challenge_id`, `gymmaster_member_id`, `signed_up_at` — **no `member_name` column** |
| `challenge_participants` | `challenge_id`, `gymmaster_member_id`, `member_name` — participant record written at signup |
| `challenge_categories` | `challenge_id`, `name`, `unit`, `lower_is_better`, `sort_order` |
| `challenge_measurements` | `participant_id`, `category_id`, `entry_type`, `value` — unique on (participant_id, category_id, entry_type) |
| `member_awards` | `month` (date), `award_type` (athlete_of_month / commitment_club), `member_name`, `reason` |
| `award_nominations` | `gymmaster_member_id`, `nominator_name`, `nominee_name`, `reason`, `month` (YYYY-MM) — member-submitted nominations |
| `member_events` | Personal events added via Goals page — `gymmaster_member_id`, `member_name`, `event_name`, `event_date` |
| `inbody_scans` | `gymmaster_member_id`, `scan_date`, `weight`, `smm`, `bf_pct`, `bf_mass`, `member_name`, `notes`; unique on `(gymmaster_member_id, scan_date)` |
| `strength_results` | `gymmaster_member_id`, `exercise`, `result_value`, `result_notes`, `tested_date`, `member_name`, `testing_block` |

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
| Awards page | Live from Staff Hub `member_awards` + nomination form | ✅ Live |
| Challenge detail | Sign-up + self-reporting tracking grid (writes to Staff Hub) | ✅ Live |
| Results — Body Composition | Supabase `inbody_scans` + member self-entry + coach entry | ✅ Live |
| Results — Strength & Conditioning | Supabase `strength_results` + member self-entry + coach entry | ✅ Live |
| Wellbeing | Members Area Supabase `wellbeing_checkins` | ✅ Live |
| Education | Seed data (nutrition modules added) | ⚠️ Seed |
| Messages | Members Area Supabase `messages` + `message_threads` | ✅ Live |
| Partners | Placeholder | ❌ Not built |

---

## Cross-Project Integrations (built in previous sessions)

### Feature 1 — Challenge self-reporting
- Members open a challenge detail page → if signed up, see **My Tracking Data** grid
- Grid shows all categories × entry types (pre / week N / post)
- On save → `POST /api/challenges/[id]/measurements` → upserts to Staff Hub `challenge_measurements`
- Staff see the data in Staff Hub → Member Engagement → Challenges tab
- Key files: `src/app/(member)/community/challenge/[id]/TrackingGrid.tsx`, `src/app/api/challenges/[id]/measurements/route.ts`

### Feature 2 — Athlete of the Month nominations
- Members see **NominationForm** on the Awards page (`community/awards`)
- On submit → `POST /api/nominations` → inserts to Staff Hub `award_nominations`
- Staff see nominations in Staff Hub → Member Engagement → Awards tab (grouped by selected month)
- Key files: `src/app/(member)/community/awards/NominationForm.tsx`, `src/app/api/nominations/route.ts`

### Feature 3 — Challenge signup linking (Members Area → Staff Hub)
- Member clicks "Sign Up" on a challenge → `POST /api/challenges/signup`
- Route upserts to `challenge_signups`, then checks `challenge_participants` and inserts if not present
- Fetches member full name from GymMaster via `gymmaster_token` cookie for `member_name` field
- `isMemberSignedUp()` in `staffhub.ts` checks `challenge_participants` (not `challenge_signups`) — this makes it self-healing: a member stuck in signups-only state can retry
- Key fix: previous version checked `challenge_signups`, causing stuck "You're signed up" state

### Feature 4 — Staff message notifications
- `MemberMessagesWidget.tsx` already built in Staff Hub dashboard
- Reads unread member messages from Members Area Supabase
- **Needs Vercel env vars on Staff Hub**: `NEXT_PUBLIC_MEMBERS_AREA_SUPABASE_URL` + `NEXT_PUBLIC_MEMBERS_AREA_SUPABASE_ANON_KEY`

---

## Features Built This Session (2026-05-11)

### 1 — Body Composition Page (live data + interactive chart)
- Page at `/results/body-composition` is now a server component reading `gymmaster_member_id` cookie
- Fetches from `inbody_scans` via `fetchMemberScans()` in `staffhub.ts`
- Replaced static weight trend bars with `BodyCompositionChart` — interactive SVG dual-metric line chart
  - 4 toggle buttons: Weight, SMM, BF%, BF Mass (each with its own colour)
  - Max 2 metrics simultaneously; independent Y-axis scaling per metric
  - Hover: vertical dashed line, value labels, enlarged dots
  - Shows last 5 scans chronologically
- **Member self-entry:** `AddScanForm` client component — "Add Scan" button expands inline form (date, weight, SMM, BF%, BF Mass, notes). Posts to `/api/inbody/member` which reads `gymmaster_member_id` cookie for auth
- **Coach entry:** `/coach/input/inbody` page — member dropdown (from GymMaster), all 4 fields, saves via `/api/inbody` (service role key, no member cookie required). Recent scans table below form
- Key files: `src/components/results/BodyCompositionChart.tsx`, `src/components/results/AddScanForm.tsx`, `src/app/api/inbody/member/route.ts`, `src/app/api/inbody/route.ts`

### 2 — Strength & Conditioning Page (live data + member input)
- Page at `/results/strength` is now a server component — reads cookie, fetches `strength_results`, passes to `StrengthClient`
- `StrengthClient` (client component) renders 10 exercise cards:
  - Hex Deadlift 3RM, Back Squat 3RM, Bench Press 3RM, Clean & Jerk 1RM, Snatch 1RM, Pull Up Max Reps, 9min AMRAP, 6min Time Trial, 5km Run, 10km Run
  - Each card: latest result, PB badge (computed dynamically), history row (last 5), notes display, `+ Add Result` inline form
  - Notes field shown only for 9min AMRAP and 6min Time Trial
  - Running times stored as decimal minutes, displayed as MM:SS
  - PB: highest value for lifting/reps, lowest for running
- Summary bar: total exercises tracked, results recorded count, current PBs count
- Member POST: `/api/strength` reads `gymmaster_member_id` cookie
- **Coach entry:** `/coach/input/strength` — member dropdown, exercise picker (same 10), result + date, notes for AMRAP/Time Trial. Posts to `/api/coach/strength`. Recent results table below
- Coach sidebar updated with "S&C Input" link
- Key files: `src/components/results/StrengthClient.tsx`, `src/app/api/strength/route.ts`, `src/app/api/coach/strength/route.ts`, `src/app/coach/(portal)/input/strength/page.tsx`

### 3 — GymMaster Measurements Pull (in progress)
- `getMemberMeasurements(memberToken)` added to `gymmaster.ts`
- Called on body-composition page load alongside Supabase fetch
- Full response logged to Vercel (`[GymMaster] measurements 200:`) to confirm field names
- **Waiting:** need to visit `/results/body-composition` while logged in and check Vercel logs to see actual response shape, then build the mapping

### 4 — GymMaster members API route
- `GET /api/gymmaster/members` — fetches all active (`status=Current`, not prospect) members from GymMaster staff API, returns `{id, name}[]` sorted alphabetically
- Used by both coach input pages (InBody and Strength) for member dropdowns

---

## Deferred / Next Steps

1. **GymMaster measurements mapping** — visit `/results/body-composition` while logged in, check Vercel logs for `[GymMaster] measurements 200:` line, then build mapping to merge GymMaster data into body-comp page.
2. **Add Vercel env vars to Staff Hub** — `NEXT_PUBLIC_MEMBERS_AREA_SUPABASE_URL` and `NEXT_PUBLIC_MEMBERS_AREA_SUPABASE_ANON_KEY` so `MemberMessagesWidget` works in production.
3. **Persist goals to database** — currently only in `useState`, lost on refresh. Needs a `member_goals` Supabase table + API routes.
4. **Staff Hub display of member events** — coaches can't yet see Event Planner entries.
5. **Commitment Club page (live data)** — `/commitment-club` route still exists with hardcoded leaderboard. Either remove or wire up `getAllMemberVisitsThisMonth()`.
6. **Delete/edit scan or strength result** — no edit/delete UI yet for either members or coaches.
7. **Mobile review** — app is responsive but hasn't had a dedicated mobile pass.

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
      community/challenge/[id]/   — detail + SignUpButton + TrackingGrid (client)
      community/awards/           — live awards + NominationForm (client)
    api/
      auth/login/route.ts
      challenges/signup/route.ts
      challenges/[id]/measurements/route.ts — POST (member self-reporting)
      nominations/route.ts        — POST (Athlete of Month nomination → Staff Hub)
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
    api/
      auth/login/route.ts
      challenges/signup/route.ts
      challenges/[id]/measurements/route.ts
      nominations/route.ts
      member-events/route.ts
      member-events/[id]/route.ts
      inbody/route.ts             — GET (recent scans for coach table) / POST (coach entry)
      inbody/member/route.ts      — POST (member self-entry, auth via cookie)
      strength/route.ts           — POST (member self-entry, auth via cookie)
      coach/strength/route.ts     — GET (recent 50 results) / POST (coach entry with member_name)
      gymmaster/members/route.ts  — GET active members list for coach dropdowns
    coach/(portal)/
      input/inbody/page.tsx       — coach InBody entry form + recent scans table
      input/strength/page.tsx     — coach S&C entry form + recent results table
  components/
    results/
      BodyCompositionChart.tsx    — interactive SVG dual-metric line chart (client)
      AddScanForm.tsx             — member self-entry form for body comp scans (client)
      StrengthClient.tsx          — 10 exercise cards with inline add-result forms (client)
  lib/
    gymmaster.ts                  — getAnnualVisits(), getMonthlyVisits(), loginMember(), getMemberMeasurements()
    staffhub.ts                   — all Staff Hub fetch helpers + types (incl. fetchMemberScans, fetchMemberStrengthResults)
```

---

## Workflow Notes

- Working directly on `main` branch (no worktrees — simpler for this user)
- Vercel deploys automatically on push — ~1 min build time
- TypeScript check: `npx tsc --noEmit` before committing
- Staff Hub app: `https://staff-hub-fawn.vercel.app/` — separate project
- Plan docs in `docs/superpowers/plans/`, specs in `docs/superpowers/specs/`

---

## Session — 2026-07-21: Foundations Recovery pathway now visible-but-locked

- **`canAccess()` in `lib/education-access.ts` gained a `kind: 'pathway' | 'resource'` parameter** (defaults to `'resource'`, preserving existing behaviour everywhere resources call it). Previously it returned `'hidden'` for any `required_plan === 'foundations'` content — correct for the personal per-session PDFs (Recovery 1-4, New Member FAQs — coach sends these to a specific member after a specific session, nothing to "unlock" for anyone else) but wrong for the "Foundations Recovery" **pathway**, which non-foundations members should be able to see exists (locked, same treatment as e.g. Nutrition Foundations) rather than have it vanish entirely.
  - `kind: 'pathway'` + `required_plan: 'foundations'` → `'locked'` (visible, non-clickable card, "Available with Foundations Programme membership")
  - `kind: 'resource'` (default) + `required_plan: 'foundations'` → unchanged, `'hidden'`
  - Updated all pathway-checking call sites to pass `'pathway'`: `education/page.tsx`, `CategoryTabs.tsx` (`visiblePathways`), `PathwayCard.tsx`, `pathway/[id]/page.tsx` (×2), `module/[id]/page.tsx`. Resource call sites (`CategoryTabs.tsx` `visibleResources`, `ResourceCard.tsx`) now pass `'resource'` explicitly for clarity — behaviour unchanged.
- **Fixed two pre-existing hardcoded "Perform membership required" / "Perform+" strings** (`pathway/[id]/page.tsx`, `module/[id]/page.tsx`) that would have been wrong the first time someone hit a locked module in the newly-locked Foundations Recovery pathway — now uses `upgradePlanLabel(pathway.required_plan)` so the copy matches whichever plan is actually required.
- **Verified locally** by setting `gymmaster_token`/`gymmaster_plans` cookies directly in the browser (the `proxy.ts` route guard only checks presence of `gymmaster_token`, not validity, so this is a legitimate way to test member-facing pages without a real GymMaster login): confirmed a `gym-only` member sees "Foundations Recovery" as a locked card (identical treatment to how gym-only members see Nutrition Foundations), the personal Recovery 1-4/FAQ resources stay absent from Open Library, and a `foundations` member still gets full pathway access + the dedicated "Foundations Programme" resources section as before.
- Build clean, lint identical to baseline (9336 problems before/after — this repo's lint includes `.worktrees/` and `.next/` build output in its glob, so the raw count is not a useful signal; confirmed via direct grep on touched files instead of full-repo comparison).
- **Fragility note:** `staff-hub`'s WhatsApp recovery-guide message templates (see staff-hub session notes) now link directly to this pathway via its Supabase row id (`e1498faf-4a3d-4848-95c8-8df9eeb0ebd9`). If "Foundations Recovery" is ever deleted and recreated in the coach portal's Content manager, that id changes and the staff-hub link needs updating to match.
