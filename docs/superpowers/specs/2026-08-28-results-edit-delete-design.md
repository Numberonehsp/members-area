# Results Edit & Delete — Design

**Date:** 2026-08-28
**Status:** Approved for planning
**Area:** `members-area` — member-facing web app + coach portal

## Problem

Members and coaches can *add* strength results and InBody scans, but:

- **Members can't fix or remove their own mistakes** — no edit, no delete, for
  either data type.
- **Coaches can delete strength results** (`DELETE /api/coach/strength`) but have
  **no InBody delete** anywhere, and **no edit** for either type — the only way
  to correct a value is delete + re-enter.

## Scope

Build (from the agreed selection):

1. **Member delete** — strength results *and* InBody scans, own rows only.
2. **Coach InBody delete** — parity with the existing coach strength delete.
3. **Coach edit** — strength results *and* InBody scans, via a modal.

Not in scope:

- **Member edit** (members get delete only).
- Any schema change (both tables already have an `id` PK).
- Editing `member_name` / reassigning a row to a different member.
- Undo / soft-delete / audit trail.
- Coach-facing changes beyond the three input pages named below.

## Data model (unchanged)

Both tables live in the **staff-hub** Supabase project; `members-area` reads via
`staffHubReader` and writes via `staffHubWriter` (service role). No RLS in play —
**authorisation is enforced in the API route.**

| Table | Key fields | Notes |
|---|---|---|
| `strength_results` | `id` (PK), `gymmaster_member_id`, `member_name`, `exercise`, `result_value`, `result_notes`, `tested_date`, `created_at` | plain inserts; multiple rows per exercise/date allowed |
| `inbody_scans` | `id` (PK), `gymmaster_member_id`, `member_name`, `scan_date`, `weight`, `smm`, `bf_pct`, `bf_mass`, `notes`, `created_at` | **unique `(gymmaster_member_id, scan_date)`**; writes are upserts on that key |

## API routes

All in `src/app/api/…`. All new handlers follow the existing style in their file
(`NextRequest`/`NextResponse`, `await request.json()`, `console.error` on failure,
JSON error body + status).

### `DELETE /api/strength` (new handler in existing `route.ts`)

- Body: `{ id: string }`.
- `const gymMasterId = cookieStore.get('gymmaster_member_id')?.value` — `401` if
  absent.
- `400` if `id` missing.
- `staffHubWriter.from('strength_results').delete().eq('id', id).eq('gymmaster_member_id', gymMasterId)`
  — ownership is enforced by the compound filter; deleting someone else's row (or
  a non-existent id) is a silent no-op, still `200`.
- On Supabase error: `console.error('[strength] delete failed:', error.message)` +
  `500`.
- Response: `{ ok: true }`.

### `DELETE /api/inbody/member` (new handler in existing `route.ts`)

- Identical shape to the above, table `inbody_scans`, same cookie-ownership
  filter. `{ ok: true }` / `401` / `400` / `500`.

### `DELETE /api/inbody` (new handler in existing `route.ts`)

- Body: `{ id: string }`. Coach route — **no ownership check.**
- `400` if `id` missing.
- `staffHubWriter.from('inbody_scans').delete().eq('id', id)`.
- `console.error('[InBody] delete failed:', error)` + `500` on error.
- Response: `{ success: true }` (matches the file's existing POST response shape).

### `PATCH /api/inbody` (new handler in existing `route.ts`)

- Body: `{ id, scan_date, weight, smm, bf_pct, bf_mass, notes }`. Coach route.
- `400` if `id` or `scan_date` missing.
- `staffHubWriter.from('inbody_scans').update({ scan_date, weight: weight ?? null, smm: smm ?? null, bf_pct: bf_pct ?? null, bf_mass: bf_mass ?? null, notes: notes || null }).eq('id', id)`.
- **Date-collision:** if the update hits the unique `(gymmaster_member_id,
  scan_date)` constraint (Postgres error code `23505`), return `409` with
  `{ error: 'A scan already exists for that date' }`. Any other error → `500`.
- Response: `{ success: true }`.

### `PATCH /api/coach/strength` (new handler in existing `route.ts`)

- Body: `{ id, exercise, result_value, result_notes, tested_date }`. Coach route.
- `400` if `id`, `exercise`, `tested_date` missing or `result_value == null`.
- `staffHubWriter.from('strength_results').update({ exercise, result_value: Number(result_value), result_notes: result_notes || null, tested_date }).eq('id', id)`.
- `console.error('[coach/strength] update failed:', error.message)` + `500`.
- Response: `{ ok: true }`.

## Member UI — delete own results

### `src/components/results/InlineDeleteConfirm.tsx` (new, client)

Reusable two-step delete control. Props:
`{ onConfirm: () => Promise<void> | void; label?: string; className?: string }`.

- State: `"idle" | "confirming" | "deleting"`.
- `idle`: a trash icon button (reuse the 15px SVG trash path already used in
  `coach/(portal)/input/strength/page.tsx`), `text-text-muted hover:text-status-red`.
- `confirming`: renders `Delete?` + a red-outline `Yes` button + a plain `No`
  button. `No` → back to `idle`.
- `deleting`: `Yes` shows `…`, both buttons disabled; on resolve the parent has
  removed the row so nothing else to do.
- No portal / overlay — it renders inline where placed.

### Strength — `src/components/results/StrengthClient.tsx` (edit; already client)

The per-result row list lives in the **`TrendChart`** sub-component (the
`[...sorted].reverse().map(r => <div key={r.id} …>)` table rendered under the
chart, ~line 161). `TrendChart` is presentational — it has no `router` and no
`isLoggedIn`.

- `ExerciseCard` already has `const router = useRouter()` and receives
  `isLoggedIn`. Add to it:

  ```ts
  async function handleDeleteResult(id: string) {
    await fetch('/api/strength', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }
  ```

- Pass `onDelete={isLoggedIn ? handleDeleteResult : undefined}` into the
  `<TrendChart …>` render.
- `TrendChart` gains an optional prop `onDelete?: (id: string) => Promise<void>`.
  In its row map, when `onDelete` is set, append
  `<InlineDeleteConfirm onConfirm={() => onDelete(r.id)} />` to the row's
  right-hand side. Row layout otherwise unchanged.

The `slice(-5)` mini-strip in `ExerciseCard` (~line 278) is a summary sparkline,
**not** a row list — no delete control there.

### InBody — new `src/components/results/ScanHistoryTable.tsx` (client)

Move the entire "Scan history table" `<div className="bg-bg-card … overflow-hidden">`
block out of `body-composition/page.tsx` into this component.

- Props: `{ scans: InBodyScan[]; canDelete: boolean }`.
- Renders the existing table markup unchanged (Date / Weight / SMM / BF% / BF Mass
  columns, "Latest" badge on the first row, the `{n} scans recorded` footer).
- Adds a trailing cell per row; when `canDelete`, an `<InlineDeleteConfirm>` whose
  `onConfirm` calls `DELETE /api/inbody/member` with `{ id: scan.id }` then
  `router.refresh()`.
- Row `key` changes from `scan.scan_date` to `scan.id` (needed for stable delete).

`body-composition/page.tsx` (server): import and render
`<ScanHistoryTable scans={scans} canDelete={isLoggedIn} />` in place of the inline
table. `isLoggedIn` is already computed in the page. No other change to the page.

## Coach UI — edit (modal) + InBody delete

### `src/components/coach/EditStrengthResultModal.tsx` (new, client)

Props:
`{ result: { id: string; exercise: string; result_value: number; result_notes: string | null; tested_date: string }; exerciseOptions: string[]; onClose: () => void; onSaved: () => void }`.

- Centered fixed overlay (`fixed inset-0 z-50 flex items-center justify-center
  bg-black/40`, inner card `bg-bg-card border border-border-light rounded-2xl
  p-6 w-full max-w-sm`), matching the app's card styling. Close on backdrop click,
  `Escape`, and a Cancel button.
- Fields, prefilled from `result`: **Exercise** `<select>` over `exerciseOptions`;
  **Result value** `<input type="number" step="any">`; **Tested date**
  `<input type="date">`; **Notes** `<input type="text">`.
- Submit: `PATCH /api/coach/strength` with `{ id, exercise, result_value,
  result_notes, tested_date }`; on ok → `onSaved()` then `onClose()`; on error →
  inline message, stay open. Disable the submit button while saving.

### `src/components/coach/EditScanModal.tsx` (new, client)

Props:
`{ scan: { id: string; scan_date: string; weight: number | null; smm: number | null; bf_pct: number | null; bf_mass: number | null; notes: string | null }; onClose: () => void; onSaved: () => void }`.

- Same overlay/card pattern.
- Fields prefilled: **Scan date** `<input type="date">`; **Weight / SMM / BF% /
  BF mass** `<input type="number" step="any">` (all optional — empty string →
  `null`); **Notes** `<input type="text">`.
- Submit: `PATCH /api/inbody` with `{ id, scan_date, weight, smm, bf_pct,
  bf_mass, notes }`. On `409` show the returned `error` string inline (date
  clash); on other error show a generic message; on ok → `onSaved()` + `onClose()`.

### Wiring

Each page keeps its existing "load recent" function; `onSaved` calls it.

| Page | List | Add |
|---|---|---|
| `src/app/coach/(portal)/input/strength/page.tsx` | Recent Results table | pencil button in the actions cell (beside the trash button) → opens `EditStrengthResultModal`. `exerciseOptions` = the exercise-name list this page already holds. `onSaved` = `loadRecentEntries`. |
| `src/app/coach/(portal)/input/testing/page.tsx` | history view rows | pencil button beside the existing trash button → `EditStrengthResultModal`, `exerciseOptions` from this page's exercise list. `onSaved` = `loadRecent`. |
| `src/app/coach/(portal)/input/inbody/page.tsx` | Recent Scans table | **add** a trash button (`DELETE /api/inbody`, no confirm, matching `coach/input/strength`'s pattern + spinner state) **and** a pencil button → `EditScanModal`. `onSaved` = `loadRecentScans`. |

Coach deletes stay confirmation-free (unchanged behaviour / new InBody delete
matches it). Only the member-facing deletes get the inline confirm.

## Edge cases

- **Member deletes a row that isn't theirs / already gone:** compound-filter
  delete is a no-op, returns `200`; `router.refresh()` just re-renders the same
  list. No error shown.
- **Not logged in:** member DELETE routes return `401`; the controls aren't
  rendered anyway (`isLoggedIn` / `canDelete` false).
- **Coach edits an InBody scan_date onto an existing scan for that member:** `409`
  → inline "A scan already exists for that date", modal stays open, nothing
  written.
- **Coach edits exercise to a name not in `strength_results` history:** allowed —
  it's free text in the DB; the `<select>` just constrains the common case.
- **Concurrent coach edit + member delete of the same row:** last write wins;
  a `PATCH` on a deleted `id` updates 0 rows and still returns ok — acceptable.
- **`result_value` / metric fields left blank in a modal:** strength value is
  required (`400`); InBody metric fields may be blank → stored `null`.

## Verification

1. `npx eslint` on every touched/new file — 0 errors / 0 warnings (global lint is
   noisy; gate per-file).
2. `npm run build` — passes.
3. Browser, member (`/demo-login`):
   - `/results/strength` (`StrengthClient`) — add a result, delete it via the
     inline confirm, confirm it's gone after refresh; `No` cancels.
   - `/results/body-composition` — delete a scan via the inline confirm.
   - Not-logged-in view shows no delete controls.
4. Browser, coach portal:
   - `input/strength` — edit a recent result (value + date + notes), see the list
     update; delete still works.
   - `input/testing` — edit a result from the history view.
   - `input/inbody` — edit a scan; delete a scan; trigger the date-collision
     `409` and see the inline message.
5. `curl`/devtools: `DELETE /api/strength` with another member's row id does not
   delete it (row still present for its owner).

## Files touched

| File | Change |
|---|---|
| `src/app/api/strength/route.ts` | + `DELETE` (member, ownership-filtered) |
| `src/app/api/inbody/member/route.ts` | + `DELETE` (member, ownership-filtered) |
| `src/app/api/inbody/route.ts` | + `DELETE` (coach) + `PATCH` (coach, 409 on date clash) |
| `src/app/api/coach/strength/route.ts` | + `PATCH` (coach) |
| `src/components/results/InlineDeleteConfirm.tsx` | new — reusable two-step delete |
| `src/components/results/ScanHistoryTable.tsx` | new — client scan-history table w/ delete |
| `src/components/results/StrengthClient.tsx` | inline delete control per result row |
| `src/app/(member)/results/body-composition/page.tsx` | render `ScanHistoryTable` instead of inline table |
| `src/components/coach/EditStrengthResultModal.tsx` | new |
| `src/components/coach/EditScanModal.tsx` | new |
| `src/app/coach/(portal)/input/strength/page.tsx` | edit button + modal wiring |
| `src/app/coach/(portal)/input/testing/page.tsx` | edit button + modal wiring |
| `src/app/coach/(portal)/input/inbody/page.tsx` | delete button + edit button + modal wiring |
| `session-notes-members-area.md` | session note; correct stale backlog item 6 |
