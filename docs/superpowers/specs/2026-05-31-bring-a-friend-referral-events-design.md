# Referral Events (Bring a Friend) — Design Spec

**Date:** 2026-05-31  
**Status:** Approved  
**Scope:** Members Area + Staff Hub

---

## Overview

Members can register guests for special "Bring a Friend" gym sessions. The event appears on the Members Area dashboard events widget. Members click through to a dedicated page, enter one or more guest's details, and submit. Staff see all referrals in a new "Referral Events" tab inside the Staff Hub Member Engagement section, with checkboxes to track follow-up actions.

A secondary fix is included: the Awards nominations panel is updated so nominations are soft-archived rather than hard-deleted, allowing coaches to look back at any month's nominations via the existing month dropdown.

---

## 1. Database (Staff Hub Supabase — `entbakkftqdejpjdynts`)

### New table: `bring_a_friend_signups`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` | |
| `event_id` | UUID | NOT NULL | references `events.id` |
| `gymmaster_member_id` | text | NOT NULL | the referring member |
| `member_name` | text | NOT NULL | stored at sign-up time |
| `friend_name` | text | NOT NULL | |
| `friend_email` | text | nullable | at least one of email/phone required (UI-enforced) |
| `friend_phone` | text | nullable | |
| `added_to_gymmaster` | boolean | NOT NULL, default false | staff follow-up checkbox |
| `booked_for_consultation` | boolean | NOT NULL, default false | staff follow-up checkbox |
| `created_at` | timestamptz | default now() | |

No unique constraint — a member may register multiple different guests per event.

### Migration: `award_nominations` — soft-archive

Add one column to the existing `award_nominations` table:

```sql
ALTER TABLE award_nominations
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## 2. Staff Hub changes

### 2a. EventManager — new event type

Add `bring_a_friend` to the `EVENT_TYPES` array in `src/components/calendar/EventManager.tsx`:

```ts
{ value: 'bring_a_friend', label: 'Bring a Friend', color: '#3fb950' }
```

Staff create Bring a Friend sessions through the existing Events tab — no other changes to EventManager.

### 2b. Member Engagement — new "Referral Events" tab

**File:** `src/components/engagement/ReferralEventsTab.tsx` (new)  
**Registration:** Add to `TABS` array in `src/app/member-engagement/page.tsx`

Tab label: `🤝 Referral Events`

**UI layout:**
- Event filter dropdown at the top — lists all `bring_a_friend` events from the `events` table, ordered by `start_date` descending. Default: most recent event.
- Below the filter: a flat list of all `bring_a_friend_signups` for the selected event, ordered by `created_at` ascending.
- Each row shows:
  - **Member name** (who referred)
  - **Guest name**
  - **Email** (or em-dash if none)
  - **Phone** (or em-dash if none)
  - **Added to GymMaster** — inline toggle checkbox, saves immediately on click
  - **Booked for consultation** — inline toggle checkbox, saves immediately on click
- Rows where neither checkbox is ticked are highlighted with an orange left border (matching the pending-actions pattern used elsewhere in the Staff Hub).
- If no event has been created yet, show a prompt linking to the Events tab.
- If the selected event has no sign-ups yet, show an empty state message.

**Data flow:** The tab reads directly from `bring_a_friend_signups` via the Staff Hub Supabase client. Checkbox toggles call `supabase.from('bring_a_friend_signups').update(...)` with optimistic UI (toggle immediately, revert on error).

### 2c. Awards nominations — soft-archive

**File:** `src/components/engagement/AwardsTab.tsx`

- Replace the `deleteNomination` hard-delete with an `archiveNomination` function that sets `archived = true`.
- The `loadNominations` query adds `.eq('archived', false)` to filter out archived entries.
- The ✕ button label and tooltip change to "Dismiss" (title="Dismiss nomination").
- Add a "Show dismissed" toggle link beneath the nominations panel. When active, re-fetches with `archived = true` and renders dismissed nominations in a faded style (`opacity-50`, strikethrough on nominee name). The toggle only appears if there is at least one dismissed nomination for the selected month.

No changes to how the month dropdown or nomination storage work — they are already correct.

---

## 3. Members Area changes

### 3a. GymEvents widget — bring-a-friend CTA

**File:** `src/components/dashboard/GymEvents.tsx`

Add `bring_a_friend` to `EVENT_TYPE_CONFIG`:

```ts
bring_a_friend: {
  emoji: '🤝',
  colour: 'text-status-green',
  bg: 'bg-status-green/10',
  border: 'border-status-green/20',
  label: 'Bring a Friend',
}
```

For events with `event_type === 'bring_a_friend'`, render a "Register your guest →" link inside the event card pointing to `/community/bring-a-friend/[eventId]`. All other rendering stays identical.

`fetchGymEvents` in `src/lib/staffhub.ts` already excludes `announcement` and `challenge` types — `bring_a_friend` will be included automatically with no query changes needed.

### 3b. New page: `/community/bring-a-friend/[eventId]`

**File:** `src/app/(member)/community/bring-a-friend/[id]/page.tsx` (server component)

**Data fetched server-side:**
- The event row from `events` (via `staffHubReader`) — 404 redirect if not found or wrong type.
- Whether the logged-in member has already submitted at least one guest for this event (for the confirmation state).

**Page layout:**
1. Back link → `/community`
2. Event header: title, date, description.
3. A client component `GuestSignUpForm` handles the interactive form.

**File:** `src/app/(member)/community/bring-a-friend/[id]/GuestSignUpForm.tsx` (client component)

**Form state:** An array of guest entries. Each entry has `{ name, email, phone }`.

**Initial state:** One blank entry.

**Per-entry UI:**
- **Name** — text input, required
- **Email** — email input, optional
- **Phone** — tel input, optional
- A note beneath each entry: *"Please provide at least an email or phone number."*
- A small × remove button (hidden when only one entry remains).

**"+ Add another guest" button** — appends a new blank entry to the array.

**"Register guests" button** — disabled until every entry has a name and at least one of email/phone filled in.

**Submission:**
- Fires `POST /api/bring-a-friend/signup` once per guest entry in sequence.
- On full success: replaces the form with a confirmation panel listing the names registered, with a "Register more guests" button that resets the form.
- On partial failure: shows an inline error on the failed entry and allows retry.

**Not logged in:** render a prompt — *"Log in to register your guest"* — matching the challenge sign-up pattern.

### 3c. New API route: `POST /api/bring-a-friend/signup`

**File:** `src/app/api/bring-a-friend/signup/route.ts`

**Auth:** reads `gymmaster_member_id`, `gymmaster_first_name`, `gymmaster_last_name` cookies. Returns 401 if not authenticated.

**Request body:**
```ts
{ eventId: string; friendName: string; friendEmail?: string; friendPhone?: string }
```

**Validation:**
- `eventId` and `friendName` must be non-empty strings.
- At least one of `friendEmail` or `friendPhone` must be a non-empty string.
- Returns 400 with a descriptive error if any validation fails.

**On success:** inserts one row into `bring_a_friend_signups` via `staffHubWriter`. Returns `{ success: true }`.

**No duplicate prevention** — a member may legitimately register the same friend's name for different events, and registering the same person twice is a minor UX issue not worth a database constraint.

### 3d. `staffhub.ts` — fetch helper

Add `fetchBringAFriendEvent(id: string)` to `src/lib/staffhub.ts`:

```ts
export async function fetchBringAFriendEvent(id: string): Promise<StaffHubEvent | null>
```

Fetches a single event by ID, validates `event_type === 'bring_a_friend'`, returns null otherwise. Used by the server component to guard the page.

---

## 4. Data flow summary

```
Staff Hub EventManager
  → creates event with event_type = 'bring_a_friend'
  → stored in events table

Members Area GymEvents widget (dashboard)
  → fetchGymEvents() includes bring_a_friend events
  → renders "Register your guest →" CTA link

Member clicks → /community/bring-a-friend/[eventId]
  → server component fetches event, checks auth
  → GuestSignUpForm rendered client-side

Member fills in guests, clicks "Register guests"
  → POST /api/bring-a-friend/signup (once per guest)
  → inserts into bring_a_friend_signups (staffHubWriter)

Staff Hub Referral Events tab
  → reads bring_a_friend_signups by event
  → coaches tick "Added to GymMaster" / "Booked for consultation"
  → instant save via supabase update
```

---

## 5. Out of scope

- Email/SMS notifications to guests or members (future)
- Capacity limits per event (future)
- Deduplication of guest contact details across events (not needed)
- Any changes to GymMaster itself
