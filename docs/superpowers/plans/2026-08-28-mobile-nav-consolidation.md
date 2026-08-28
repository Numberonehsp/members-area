# Mobile Nav Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the members area one navigation structure on mobile and desktop — four destinations (Home, Learn, Tracking, Community) — with every page reachable on a phone and a new mobile header for notifications, profile, and logout.

**Architecture:** A shared `src/components/layout/navItems.ts` module holds the 4-item nav list plus an `isNavItemActive` matcher (with "owned" path prefixes so hub tabs stay highlighted on their sub-pages). Both `MemberMobileNav` and `MemberSidebar` consume it, so they cannot drift. `LogoutButton` is extracted from the sidebar into its own file and reused by a new `MemberMobileHeader` (sticky, `md:hidden`). The Tracking hub (`/results`) becomes a card page linking to pages that already exist; the Community page gains a Partners & Discounts section. No routes are moved or renamed.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript. No test runner in this project — verification is `npm run lint`, `npm run build`, and a browser checklist.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| **Create** | `src/components/layout/navItems.ts` | Shared `MEMBER_NAV_ITEMS` list + `isNavItemActive` matcher |
| **Create** | `src/components/layout/LogoutButton.tsx` | `LogoutButton` extracted from `MemberSidebar`, now with optional `className` |
| **Create** | `src/components/layout/MemberMobileHeader.tsx` | Mobile-only sticky top header: wordmark, notifications bell, profile menu |
| Modify | `src/components/layout/MemberSidebar.tsx` | Use shared nav list + matcher; import extracted `LogoutButton`; delete now-unused icon components |
| Modify | `src/components/layout/MemberMobileNav.tsx` | 4 tabs from shared list; use `isNavItemActive` |
| Modify | `src/app/(member)/layout.tsx` | Render `<MemberMobileHeader />` |
| Modify | `src/app/(member)/results/page.tsx` | Rewrite as the "My Tracking" 7-card hub |
| Modify | `src/app/(member)/community/page.tsx` | Add "Partners & Discounts" section |
| Modify | `session-notes-members-area.md` | Append session note |

---

## Task 1: Shared nav items module

**Files:**
- Create: `src/components/layout/navItems.ts`

- [ ] **Step 1: Create the module**

  Create `src/components/layout/navItems.ts`:

  ```ts
  export type MemberNavItem = {
    /** Primary route for the nav item. */
    href: string;
    label: string;
    /** Extra path prefixes this item "owns" for active-state highlighting. */
    match: string[];
  };

  /** The four member-area destinations, shared by the sidebar and the mobile nav. */
  export const MEMBER_NAV_ITEMS: MemberNavItem[] = [
    { href: "/dashboard", label: "Home", match: [] },
    { href: "/education", label: "Learn", match: [] },
    {
      href: "/results",
      label: "Tracking",
      match: ["/goals", "/nutrition", "/wellbeing", "/messages"],
    },
    {
      href: "/community",
      label: "Community",
      match: ["/partners", "/commitment-club"],
    },
  ];

  /** True when `pathname` is the item's href/a child of it, or under any owned prefix. */
  export function isNavItemActive(pathname: string, item: MemberNavItem): boolean {
    const prefixes = [item.href, ...item.match];
    return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  ```

- [ ] **Step 2: Lint**

  Run: `npm run lint`
  Expected: no new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/layout/navItems.ts
  git commit -m "feat(nav): add shared member nav items module"
  ```

---

## Task 2: Extract LogoutButton into its own file

This task is a pure refactor — no visual or behavioural change. The sidebar keeps
working exactly as before.

**Files:**
- Create: `src/components/layout/LogoutButton.tsx`
- Modify: `src/components/layout/MemberSidebar.tsx`

- [ ] **Step 1: Create `LogoutButton.tsx`**

  Create `src/components/layout/LogoutButton.tsx` with the logic currently inline
  in `MemberSidebar.tsx`, plus an optional `className` override so it can also be
  used on a light background:

  ```tsx
  "use client";

  import { useState } from "react";
  import { useRouter } from "next/navigation";

  const DEFAULT_CLASS =
    "w-full flex items-center gap-3 text-sm text-text-on-dark/70 hover:text-text-on-dark disabled:opacity-50";

  export default function LogoutButton({ className }: { className?: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
      setIsLoading(true);
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      } catch (err) {
        console.error("Logout failed:", err);
        setIsLoading(false);
      }
    };

    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={className ?? DEFAULT_CLASS}
      >
        <LogoutIcon className="w-5 h-5" />
        {isLoading ? "Logging out..." : "Logout"}
      </button>
    );
  }

  function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    );
  }
  ```

- [ ] **Step 2: Update `MemberSidebar.tsx` to import it**

  In `src/components/layout/MemberSidebar.tsx`:

  1. Add near the other imports at the top:

     ```tsx
     import LogoutButton from "@/components/layout/LogoutButton";
     ```

  2. Delete the local `function LogoutButton() { ... }` definition (the whole
     function, lines ~74–100).

  3. Delete the local `function LogoutIcon(props ...) { ... }` definition (moved
     into `LogoutButton.tsx`).

  4. Remove now-unused imports if they are only used by the deleted function:
     `useRouter` and `useState` are still imported — check the file after editing.
     `MemberSidebar` no longer uses `useState`/`useRouter` itself, so change:

     ```tsx
     import { usePathname, useRouter } from "next/navigation";
     import { useState } from "react";
     ```

     to:

     ```tsx
     import { usePathname } from "next/navigation";
     ```

  The `<LogoutButton />` usage in the footer (`<div className="border-t border-white/10 p-4 space-y-2">`) stays unchanged — it now resolves to the imported component.

- [ ] **Step 3: Lint**

  Run: `npm run lint`
  Expected: no new errors (in particular no `no-unused-vars` for `useState`/`useRouter`).

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/layout/LogoutButton.tsx src/components/layout/MemberSidebar.tsx
  git commit -m "refactor(nav): extract LogoutButton into its own file"
  ```

---

## Task 3: Trim the desktop sidebar to the four shared items

**Files:**
- Modify: `src/components/layout/MemberSidebar.tsx`

- [ ] **Step 1: Replace the local nav list with the shared one**

  In `src/components/layout/MemberSidebar.tsx`:

  1. Add import:

     ```tsx
     import { MEMBER_NAV_ITEMS, isNavItemActive } from "@/components/layout/navItems";
     ```

  2. Delete the local `const navItems = [ ... ]` array (the 8-item list).

  3. Add an icon lookup keyed by href, above the component:

     ```tsx
     const SIDEBAR_ICONS: Record<
       string,
       (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
     > = {
       "/dashboard": HomeIcon,
       "/education": BookIcon,
       "/results": ChartIcon,
       "/community": UsersIcon,
     };
     ```

  4. Replace the `<nav className="flex-1 py-3">` block's `.map` with:

     ```tsx
     <nav className="flex-1 py-3">
       {MEMBER_NAV_ITEMS.map((item) => {
         const Icon = SIDEBAR_ICONS[item.href];
         const isActive = isNavItemActive(pathname, item);
         return (
           <Link
             key={item.href}
             href={item.href}
             className={`flex items-center gap-3 px-6 py-3 text-sm transition-all ${
               isActive
                 ? "bg-brand/10 text-brand border-r-2 border-brand font-semibold"
                 : "text-text-on-dark/60 hover:text-text-on-dark hover:bg-white/5"
             }`}
           >
             <Icon className="w-5 h-5" />
             {item.label}
           </Link>
         );
       })}
     </nav>
     ```

- [ ] **Step 2: Delete now-unused icon components**

  In the same file, delete these icon function definitions (no longer referenced
  after the trim): `HandshakeIcon`, `TrophyIcon`, `HeartIcon`, `NutritionIcon`,
  `MessageIcon`, `TargetIcon`.

  Keep: `HomeIcon`, `BookIcon`, `ChartIcon`, `UsersIcon` (used by
  `SIDEBAR_ICONS`) and `UserIcon` (used by the Profile link in the footer).

- [ ] **Step 3: Lint**

  Run: `npm run lint`
  Expected: no errors. If `no-unused-vars` fires, an icon that was deleted is
  still referenced, or one kept is now unused — reconcile against the list above.

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/layout/MemberSidebar.tsx
  git commit -m "feat(nav): trim desktop sidebar to four shared destinations"
  ```

---

## Task 4: Rebuild the mobile bottom nav from the shared list

**Files:**
- Modify: `src/components/layout/MemberMobileNav.tsx`

- [ ] **Step 1: Replace the file body**

  Replace the whole of `src/components/layout/MemberMobileNav.tsx` with:

  ```tsx
  "use client";

  import Link from "next/link";
  import { usePathname } from "next/navigation";
  import { MEMBER_NAV_ITEMS, isNavItemActive } from "@/components/layout/navItems";

  const TAB_EMOJI: Record<string, string> = {
    "/dashboard": "🏠",
    "/education": "📚",
    "/results": "📊",
    "/community": "🏆",
  };

  export default function MemberMobileNav() {
    const pathname = usePathname();

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-sidebar text-text-on-dark border-t border-white/10 z-40 pb-[env(safe-area-inset-bottom)]">
        <ul className="flex justify-around items-stretch h-16">
          {MEMBER_NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                    isActive ? "text-brand" : "text-text-on-dark/70"
                  }`}
                >
                  <span className="text-lg leading-none">{TAB_EMOJI[item.href]}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }
  ```

  This drops the Goals tab (4 tabs now) and highlights Tracking/Community on
  their owned sub-pages.

- [ ] **Step 2: Lint**

  Run: `npm run lint`
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/layout/MemberMobileNav.tsx
  git commit -m "feat(nav): rebuild mobile bottom nav from shared list (4 tabs)"
  ```

---

## Task 5: Mobile header component

**Files:**
- Create: `src/components/layout/MemberMobileHeader.tsx`

- [ ] **Step 1: Create the component**

  Create `src/components/layout/MemberMobileHeader.tsx`:

  ```tsx
  "use client";

  import Link from "next/link";
  import { useState, useEffect, useRef } from "react";
  import { usePathname } from "next/navigation";
  import NotificationBell from "@/components/layout/NotificationBell";
  import LogoutButton from "@/components/layout/LogoutButton";

  export default function MemberMobileHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Close the menu whenever the route changes.
    useEffect(() => {
      setMenuOpen(false);
    }, [pathname]);

    // Close on outside pointer-down or Escape.
    useEffect(() => {
      if (!menuOpen) return;
      function onPointerDown(e: PointerEvent) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setMenuOpen(false);
        }
      }
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") setMenuOpen(false);
      }
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [menuOpen]);

    return (
      <header className="md:hidden sticky top-0 z-40 bg-bg-sidebar text-text-on-dark border-b border-white/10 pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-lg leading-none">
            Members <span className="text-brand">Area</span>
          </Link>

          <div className="relative flex items-center gap-1" ref={menuRef}>
            <NotificationBell />

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="p-2 text-text-on-dark/80 hover:text-text-on-dark"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-bg-card text-text-primary border border-border-light rounded-xl shadow-lg overflow-hidden">
                <Link
                  href="/profile"
                  className="block px-4 py-3 text-sm hover:bg-black/5"
                >
                  Profile
                </Link>
                <div className="border-t border-border-light px-4 py-3">
                  <LogoutButton className="w-full flex items-center gap-3 text-sm text-text-primary hover:opacity-80 disabled:opacity-50" />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
  ```

  Notes:
  - `sticky` (not `fixed`) so the header occupies layout space — no padding
    compensation needed on `<main>`.
  - The dropdown is `absolute` anchored to the `relative` wrapper that also holds
    the `ref`, so outside-click detection covers the bell, the button, and the
    menu.

- [ ] **Step 2: Lint**

  Run: `npm run lint`
  Expected: no errors.

- [ ] **Step 3: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/layout/MemberMobileHeader.tsx
  git commit -m "feat(nav): add mobile header with notifications and account menu"
  ```

---

## Task 6: Render the mobile header in the member layout

**Files:**
- Modify: `src/app/(member)/layout.tsx`

- [ ] **Step 1: Add the import and element**

  Replace `src/app/(member)/layout.tsx` with:

  ```tsx
  import MemberSidebar from "@/components/layout/MemberSidebar";
  import MemberMobileHeader from "@/components/layout/MemberMobileHeader";
  import MemberMobileNav from "@/components/layout/MemberMobileNav";

  export default function MemberLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen bg-bg-main">
        <MemberSidebar />
        <MemberMobileHeader />
        <MemberMobileNav />
        <main className="md:ml-64 pb-20 md:pb-0 p-5 md:p-10 max-w-6xl">
          {children}
        </main>
      </div>
    );
  }
  ```

- [ ] **Step 2: Lint + build**

  Run: `npm run lint && npm run build`
  Expected: both pass.

- [ ] **Step 3: Commit**

  ```bash
  git add "src/app/(member)/layout.tsx"
  git commit -m "feat(nav): render mobile header in member layout"
  ```

---

## Task 7: Rewrite `/results` as the "My Tracking" hub

**Files:**
- Modify: `src/app/(member)/results/page.tsx`

- [ ] **Step 1: Replace the page**

  Replace the whole of `src/app/(member)/results/page.tsx` with (same card markup
  as before, retitled, seven cards):

  ```tsx
  import Link from "next/link";

  const CARDS = [
    {
      href: "/goals",
      emoji: "🎯",
      title: "Goals & Events",
      subtitle: "Your targets and upcoming event logging",
    },
    {
      href: "/results/strength",
      emoji: "🏋️",
      title: "S&C Testing",
      subtitle: "Your strength & conditioning testing history and PBs",
    },
    {
      href: "/results/body-composition",
      emoji: "⚖️",
      title: "InBody / Body Composition",
      subtitle: "Weight, muscle mass and body fat over time",
    },
    {
      href: "/nutrition",
      emoji: "🥗",
      title: "Nutrition",
      subtitle: "Your daily food and macro log",
    },
    {
      href: "/wellbeing",
      emoji: "💗",
      title: "Wellbeing",
      subtitle: "Your check-in questionnaires",
    },
    {
      href: "/messages",
      emoji: "💬",
      title: "Messages",
      subtitle: "Chat with your coach",
    },
    {
      href: "/results/snapshot",
      emoji: "📊",
      title: "Athlete Snapshot",
      subtitle: "Your full performance summary — body comp, strength PBs and upcoming events",
    },
  ];

  export default function TrackingHubPage() {
    return (
      <div>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
          My Tracking
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {CARDS.map(({ href, emoji, title, subtitle }) => (
            <Link
              key={href}
              href={href}
              className="group bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden hover:border-brand/40 transition-colors"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
              <div className="p-6 flex items-start gap-4">
                <span className="text-3xl leading-none mt-0.5">{emoji}</span>
                <div>
                  <h2 className="font-semibold text-text-primary text-base mb-1 group-hover:text-brand transition-colors">
                    {title}
                  </h2>
                  <p className="text-sm text-text-secondary leading-snug">{subtitle}</p>
                </div>
              </div>
              <div className="px-6 pb-4 flex items-center justify-end">
                <span className="text-xs font-medium text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Lint + build**

  Run: `npm run lint && npm run build`
  Expected: both pass.

- [ ] **Step 3: Commit**

  ```bash
  git add "src/app/(member)/results/page.tsx"
  git commit -m "feat(tracking): turn /results into the My Tracking hub"
  ```

---

## Task 8: Add "Partners & Discounts" to the Community page

The Community page is a server component. To avoid adding a new server-side data
path, this section is a teaser card linking to the existing `/partners` page.

**Files:**
- Modify: `src/app/(member)/community/page.tsx`

- [ ] **Step 1: Add the section**

  In `src/app/(member)/community/page.tsx`, add this `<section>` immediately
  **after** the "Athlete of the Month Winners" `</section>` and before the
  closing `</div>` of the page's root element:

  ```tsx
  {/* ── Partners & Discounts ─────────────────────────────────────────── */}
  <section>
    <div className="mb-3">
      <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">Perks</p>
      <h2 className="font-semibold text-text-primary">Partners &amp; Discounts</h2>
    </div>

    <Link
      href="/partners"
      className="group block bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm hover:border-brand/40 transition-colors"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <div className="flex items-center gap-4">
        <span className="text-2xl shrink-0">🤝</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Member discounts with our local partners</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Physio, nutrition, kit and more — see the current offers.
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
          View all →
        </span>
      </div>
    </Link>
  </section>
  ```

  `Link` is already imported at the top of the file — no import change needed.

- [ ] **Step 2: Lint + build**

  Run: `npm run lint && npm run build`
  Expected: both pass.

- [ ] **Step 3: Commit**

  ```bash
  git add "src/app/(member)/community/page.tsx"
  git commit -m "feat(community): add Partners & Discounts section"
  ```

---

## Task 9: Browser verification + session notes

**Files:**
- Modify: `session-notes-members-area.md`

- [ ] **Step 1: Start the dev server and open the app**

  Use the preview tooling to run `npm run dev` and open the members area
  (`/dashboard`) after logging in via `/demo-login` if needed.

- [ ] **Step 2: Mobile checklist (viewport ~390px wide)**

  Confirm each:
  - Bottom nav shows exactly 4 tabs: Home, Learn, Tracking, Community.
  - Mobile header is visible, stays pinned to the top on scroll.
  - Notifications bell in the header opens its panel.
  - Profile button opens a dropdown; "Profile" navigates to `/profile`;
    "Logout" ends the session and lands on `/`.
  - Dropdown closes on outside tap, on `Escape`, and after navigating.
  - Tracking tab opens `/results` → "My Tracking" with 7 cards.
  - Each card opens the right page: `/goals`, `/results/strength`,
    `/results/body-composition`, `/nutrition`, `/wellbeing`, `/messages`,
    `/results/snapshot`.
  - On `/nutrition`, `/wellbeing`, `/goals`, `/messages`, `/results/strength`
    the **Tracking** tab is highlighted.
  - On `/partners` the **Community** tab is highlighted.
  - Community page shows the new "Partners & Discounts" card; it links to
    `/partners`.

- [ ] **Step 3: Desktop checklist (viewport ≥768px)**

  Confirm each:
  - Sidebar shows exactly 4 nav links (Home, Learn, Tracking, Community) plus
    the Profile link, Logout button, and notifications bell.
  - Mobile header is not rendered; no layout shift or double header.
  - Sidebar active highlight follows the same owned-prefix rule (e.g. visiting
    `/nutrition` highlights Tracking).
  - Existing pages (dashboard, education, etc.) look unchanged.

- [ ] **Step 4: Final full build**

  Run: `npm run lint && npm run build`
  Expected: both pass with no warnings introduced by this work.

- [ ] **Step 5: Append session note**

  Add a dated entry to `session-notes-members-area.md` summarising: nav
  consolidated to 4 shared destinations (Home/Learn/Tracking/Community) via
  `navItems.ts`; `LogoutButton` extracted; new `MemberMobileHeader`
  (sticky, `md:hidden`) carries notifications + Profile + Logout on mobile;
  `/results` is now the "My Tracking" hub linking to Goals/Nutrition/Wellbeing/
  Messages/S&C/InBody/Snapshot; Community page gained a Partners & Discounts
  card. Note that `/commitment-club` remains unlinked and that the Community
  Partners section is a teaser link, not an inline partner list.

- [ ] **Step 6: Commit**

  ```bash
  git add session-notes-members-area.md
  git commit -m "docs: session notes for mobile nav consolidation"
  ```

---

## Self-review notes

- **Spec coverage:** IA table → Tasks 1,3,4,7,8. Active-tab matching → Task 1
  (`isNavItemActive`), consumed in Tasks 3–4. Bottom nav 4 tabs → Task 4.
  Sidebar trim + unused-icon cleanup → Task 3. Mobile header (wordmark, bell,
  profile menu, Profile + Logout, sticky) → Task 5, rendered in Task 6.
  `LogoutButton` extraction → Task 2. Tracking hub 7 cards → Task 7. Community
  Partners & Discounts section → Task 8. Verification checklist → Task 9.
  `fetchPartners` was optional in the spec and is intentionally **not** taken —
  Task 8 ships the teaser card.
- **No placeholders:** every code step shows full file or full inserted block.
- **Type consistency:** `MemberNavItem`, `MEMBER_NAV_ITEMS`, `isNavItemActive`
  used identically in Tasks 1, 3, 4. `LogoutButton`'s `className?: string` prop
  defined in Task 2, used in Task 5.
