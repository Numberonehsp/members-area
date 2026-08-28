# Mobile Nav Consolidation — Design

**Date:** 2026-08-28
**Status:** Approved for planning
**Area:** `members-area` — member-facing web app

## Problem

Most members use the app on a phone. The mobile bottom nav (`MemberMobileNav.tsx`)
only exposes 5 tabs — Home, Learn, Tracking, Community, Goals — while the desktop
sidebar (`MemberSidebar.tsx`) exposes 8. On mobile there is **no link at all** to
Nutrition, Wellbeing, Partners, or Messages, so those pages are unreachable.

Mobile also has **no header**: the logo, notifications bell, Profile link, and
Logout button live only in the desktop sidebar, which is `hidden md:flex`. A
phone user cannot see notifications, reach their profile, or log out.

The member likes the current phone UI and wants to keep its look — the fix is to
**consolidate**, not redesign: fewer top-level destinations, each grouping related
pages, with the same structure on mobile and desktop.

## Goals

- Every member page reachable on mobile.
- Identical navigation structure on mobile and desktop.
- Notifications, Profile, and Logout reachable on mobile.
- No routes moved or renamed; minimal churn.
- `npm run lint` and `npm run build` pass.

## Non-goals

- No visual redesign of existing pages.
- No changes to the coach portal (`/coach/*`).
- No database changes.
- Not persisting goals to a DB (tracked separately in session notes).

## Information architecture

Four destinations, identical on mobile and desktop:

| Nav item   | Route         | Contents                                                                 |
|------------|---------------|-------------------------------------------------------------------------|
| **Home**   | `/dashboard`  | unchanged                                                              |
| **Learn**  | `/education`  | unchanged                                                              |
| **Tracking**| `/results`   | hub page of cards linking to Goals, S&C, InBody, Nutrition, Wellbeing, Messages, Athlete Snapshot |
| **Community**| `/community`| existing scroll page + new "Partners & Discounts" section              |

Pages that stop being top-level nav items but keep their routes and become
reachable via a hub card: `/goals`, `/nutrition`, `/wellbeing`, `/messages`,
`/partners`. `/results/strength`, `/results/body-composition`,
`/results/snapshot` are unchanged. `/commitment-club` remains as it is today —
not linked from nav (consistent with current state per session notes).

### Active-tab matching

Because a hub tab must stay highlighted while the user is on one of its
sub-pages, each nav item carries a list of owned path prefixes. A tab is active
when `pathname` equals the href or starts with `href + "/"`, **or** starts with
any owned prefix (or `prefix + "/"`).

- **Tracking** owns: `/results`, `/goals`, `/nutrition`, `/wellbeing`, `/messages`
- **Community** owns: `/community`, `/partners`, `/commitment-club`
- **Home**, **Learn**: just their own href

The same matching helper is used by both `MemberMobileNav` and `MemberSidebar`.
Extract it to a shared module (e.g. `src/components/layout/navItems.ts`) exporting
the nav item list (label, href, owned prefixes, icon key) and an
`isNavItemActive(pathname, item)` function, so the two components cannot drift.

## Components

### `src/components/layout/navItems.ts` (new)

- `MEMBER_NAV_ITEMS`: array of `{ href, label, match: string[] }` for the 4
  destinations, in order Home, Learn, Tracking, Community.
- `isNavItemActive(pathname: string, item): boolean` implementing the matching
  rule above.
- Icons stay in their respective components (emoji in the mobile nav, SVG
  components in the sidebar), keyed by href or a `key` field — this module holds
  no JSX.

### `src/components/layout/MemberMobileNav.tsx` (edit)

- Build tabs from `MEMBER_NAV_ITEMS` (4 tabs; Goals tab removed).
- Emoji map: Home 🏠, Learn 📚, Tracking 📊, Community 🏆.
- Active state via `isNavItemActive`.
- Layout/styling unchanged (`flex justify-around`, `h-16`, safe-area padding).

### `src/components/layout/MemberSidebar.tsx` (edit)

- Nav links built from `MEMBER_NAV_ITEMS` — 4 links instead of 8.
- Active state via `isNavItemActive` (replaces the inline
  `pathname === href || pathname.startsWith(...)`).
- Keep: `bg-facets` header block, wordmark, `<NotificationBell />`, footer with
  Profile link and Logout.
- Icon components: keep `HomeIcon`, `BookIcon`, `ChartIcon`, `UsersIcon`.
  **Delete** components left unused after the trim (`HandshakeIcon`,
  `NutritionIcon`, `HeartIcon`, `TargetIcon`, plus any already-unused ones such
  as `TrophyIcon`, `MessageIcon`) so `npm run lint` stays clean.
- `LogoutButton` (currently defined inline in this file) moves to its own file —
  see below — and is imported here.

### `src/components/layout/LogoutButton.tsx` (new — extracted)

- Move the existing `LogoutButton` function verbatim (the `useRouter` +
  `fetch("/api/auth/logout", { method: "POST" })` + `router.push("/")` logic and
  the `LogoutIcon`).
- Exported as default. Imported by both `MemberSidebar` and the new mobile
  header. No behaviour change.

### `src/components/layout/MemberMobileHeader.tsx` (new)

- `"use client"`.
- Wrapper: `md:hidden sticky top-0 z-40`, dark background matching the nav
  (`bg-bg-sidebar text-text-on-dark`), `border-b border-white/10`,
  `pt-[env(safe-area-inset-top)]`, horizontal padding, fixed height (~`h-14`),
  `flex items-center justify-between`.
- Left: "Members Area" wordmark (compact; brand accent on "Area", mirroring the
  sidebar treatment but single-line).
- Right: a flex row with `<NotificationBell />` and a **profile menu**:
  - A button (user/avatar SVG icon) toggling a small dropdown.
  - Dropdown (absolute, right-aligned, light card styling consistent with the
    app): a `Link` to `/profile` labelled "Profile", and `<LogoutButton />`.
  - Closes on outside click / route change / `Escape`. Use a local `useState`
    plus a `useEffect` pointer-down listener; keep it self-contained.
- Because the header is `sticky` (not `fixed`) it occupies layout space — no
  padding compensation needed on `<main>`.

### `src/app/(member)/layout.tsx` (edit)

```tsx
<div className="min-h-screen bg-bg-main">
  <MemberSidebar />
  <MemberMobileHeader />        {/* new; md:hidden sticky */}
  <MemberMobileNav />
  <main className="md:ml-64 pb-20 md:pb-0 p-5 md:p-10 max-w-6xl">
    {children}
  </main>
</div>
```

Keep existing `pb-20 md:pb-0` (space for the fixed bottom nav). No new top
padding — the sticky header handles its own space.

## Tracking hub — `src/app/(member)/results/page.tsx` (rewrite)

Replace the current 3-card "My Results" page with a hub titled **"My Tracking"**,
reusing the existing card markup in that file exactly (rounded `bg-bg-card`
border card, `absolute` top gradient bar, emoji, title, subtitle, hover "View →").
Keep it a server component (no client hooks needed).

Cards, in order:

| Emoji | Title                        | href                        |
|-------|------------------------------|-----------------------------|
| 🎯    | Goals & Events               | `/goals`                    |
| 🏋️    | S&C Testing                  | `/results/strength`         |
| ⚖️    | InBody / Body Composition    | `/results/body-composition` |
| 🥗    | Nutrition                    | `/nutrition`                |
| 💗    | Wellbeing                    | `/wellbeing`                |
| 💬    | Messages                     | `/messages`                 |
| 📊    | Athlete Snapshot             | `/results/snapshot`         |

Subtitles: short, in the voice of the existing ones (e.g. Goals & Events —
"Your targets and upcoming event logging"; Messages — "Chat with your coach";
Wellbeing — "Your check-in questionnaires").

Grid: keep the existing `grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl`.

## Community addition — `src/app/(member)/community/page.tsx` (edit)

Add one `<section>` after the "Athlete of the Month" section, in the same visual
style as the other sections (`text-[10px] tracking-[0.2em] uppercase` label +
`font-semibold` heading, then a `bg-bg-card` rounded container).

- Label: "Perks" / heading: "Partners & Discounts".
- **Default implementation:** a single card / short teaser summarising that
  members get partner discounts, with a `Link` to `/partners` ("View all
  partners →"). This avoids introducing a new server-side data path.
- **Optional (only if trivial):** if a `fetchPartners` helper can be added to
  `src/lib/staffhub.ts` mirroring the existing `fetch*` helpers (hitting the same
  source `/api/partners` uses), render the first 3–4 active partners inline
  (emoji, name, offer) each linking to `/partners`, with a "View all →" row.
  If it is not trivial, ship the teaser card and note it.

No change to `/partners` itself.

## Edge cases

- **Deep link to `/nutrition` etc. on mobile:** Tracking tab highlights via owned
  prefixes; the page renders full-screen; browser back returns to the hub.
- **`/results` exact path:** hub renders; Tracking tab active.
- **Profile menu open + navigate:** menu closes on route change.
- **Safe areas:** header uses `env(safe-area-inset-top)`, bottom nav already uses
  `env(safe-area-inset-bottom)`.
- **Desktop:** header is `md:hidden`; sidebar unchanged except the 4-item trim;
  `md:ml-64` spacing unaffected.
- **`/commitment-club`:** still unlinked; if reached directly, Community tab
  highlights (it is in Community's owned prefixes).

## Verification

1. `npm run lint` — clean (watch for unused icon components).
2. `npm run build` — passes.
3. Browser at mobile width (e.g. 390px):
   - All 4 tabs present and navigable.
   - Each of the 7 Tracking hub cards opens the correct page.
   - On `/nutrition`, `/wellbeing`, `/goals`, `/messages`, `/results/*` the
     **Tracking** tab is highlighted; on `/partners` the **Community** tab is.
   - Mobile header: sticky on scroll; notifications bell opens; profile menu
     opens, "Profile" navigates to `/profile`, "Logout" logs out.
   - Community page shows the new Partners & Discounts section.
4. Browser at desktop width (≥768px):
   - Sidebar shows exactly 4 nav links + Profile + Logout + notifications.
   - Mobile header not rendered.
   - Existing pages visually unchanged.

## Files touched

| File | Change |
|---|---|
| `src/components/layout/navItems.ts` | new — shared nav list + `isNavItemActive` |
| `src/components/layout/LogoutButton.tsx` | new — extracted from `MemberSidebar` |
| `src/components/layout/MemberMobileHeader.tsx` | new — mobile top header |
| `src/components/layout/MemberMobileNav.tsx` | edit — 4 tabs, shared matcher |
| `src/components/layout/MemberSidebar.tsx` | edit — 4 links, shared matcher, import `LogoutButton`, drop unused icons |
| `src/app/(member)/layout.tsx` | edit — render `MemberMobileHeader` |
| `src/app/(member)/results/page.tsx` | rewrite — "My Tracking" 7-card hub |
| `src/app/(member)/community/page.tsx` | edit — add Partners & Discounts section |
| `src/lib/staffhub.ts` | optional — add `fetchPartners` if trivial |
| `session-notes-members-area.md` | append session note |
