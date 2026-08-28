# Results Edit & Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let members delete their own strength results and InBody scans (inline confirm), and let coaches delete InBody scans and edit both strength results and InBody scans (modal).

**Architecture:** Five new API handlers added to existing route files, writing to the staff-hub Supabase via `staffHubWriter`; member deletes are ownership-filtered by the `gymmaster_member_id` cookie. One reusable `InlineDeleteConfirm` client component for member deletes. Two coach edit modals. The member body-composition scan table moves into a small client component so it can host a delete control.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4. No test runner — verification is `npx eslint <files>` (per-file; global lint is noisy) and `npm run build`, plus a browser check.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `src/app/api/strength/route.ts` | + `DELETE` (member, ownership-filtered) |
| Modify | `src/app/api/inbody/member/route.ts` | + `DELETE` (member, ownership-filtered) |
| Modify | `src/app/api/inbody/route.ts` | + `DELETE` (coach) + `PATCH` (coach; 409 on date clash) |
| Modify | `src/app/api/coach/strength/route.ts` | + `PATCH` (coach) |
| **Create** | `src/components/results/InlineDeleteConfirm.tsx` | reusable two-step delete control |
| **Create** | `src/components/results/ScanHistoryTable.tsx` | client scan-history table with delete |
| Modify | `src/components/results/StrengthClient.tsx` | per-result delete control in `TrendChart` |
| Modify | `src/app/(member)/results/body-composition/page.tsx` | render `ScanHistoryTable` |
| **Create** | `src/components/coach/EditStrengthResultModal.tsx` | coach strength edit modal |
| **Create** | `src/components/coach/EditScanModal.tsx` | coach InBody edit modal |
| Modify | `src/app/coach/(portal)/input/strength/page.tsx` | edit button + modal |
| Modify | `src/app/coach/(portal)/input/testing/page.tsx` | edit button + modal |
| Modify | `src/app/coach/(portal)/input/inbody/page.tsx` | delete button + edit button + modal |
| Modify | `session-notes-members-area.md` | session note + backlog correction |

---

## Task 1: Member DELETE API routes

**Files:**
- Modify: `src/app/api/strength/route.ts`
- Modify: `src/app/api/inbody/member/route.ts`

- [ ] **Step 1: Add `DELETE` to `src/app/api/strength/route.ts`**

  Append this handler after the existing `POST` (the file already imports
  `NextRequest`, `NextResponse`, `cookies`, `staffHubWriter`):

  ```ts
  /** DELETE — member removes one of their OWN strength results */
  export async function DELETE(request: NextRequest) {
    const cookieStore = await cookies()
    const gymMasterId = cookieStore.get('gymmaster_member_id')?.value

    if (!gymMasterId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await staffHubWriter
      .from('strength_results')
      .delete()
      .eq('id', id)
      .eq('gymmaster_member_id', gymMasterId)

    if (error) {
      console.error('[Strength] member delete failed:', error.message)
      return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }
  ```

- [ ] **Step 2: Add `DELETE` to `src/app/api/inbody/member/route.ts`**

  Append after the existing `POST` (file imports `NextRequest`, `NextResponse`,
  `cookies`, `staffHubWriter`):

  ```ts
  /** DELETE — member removes one of their OWN InBody scans */
  export async function DELETE(request: NextRequest) {
    const cookieStore = await cookies()
    const gymMasterId = cookieStore.get('gymmaster_member_id')?.value

    if (!gymMasterId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await staffHubWriter
      .from('inbody_scans')
      .delete()
      .eq('id', id)
      .eq('gymmaster_member_id', gymMasterId)

    if (error) {
      console.error('[InBody] member delete failed:', error)
      return NextResponse.json({ error: 'Failed to delete scan' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }
  ```

- [ ] **Step 3: Lint**

  Run: `npx eslint src/app/api/strength/route.ts src/app/api/inbody/member/route.ts`
  Expected: no output.

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/strength/route.ts src/app/api/inbody/member/route.ts
  git commit -m "feat(api): member delete for own strength results and InBody scans"
  ```

---

## Task 2: Coach DELETE + PATCH API routes

**Files:**
- Modify: `src/app/api/inbody/route.ts`
- Modify: `src/app/api/coach/strength/route.ts`

- [ ] **Step 1: Add `DELETE` and `PATCH` to `src/app/api/inbody/route.ts`**

  Append after the existing `POST` (file imports `NextRequest`, `NextResponse`,
  `staffHubWriter`, `fetchRecentScans`):

  ```ts
  /** DELETE — coach removes any InBody scan by id */
  export async function DELETE(request: NextRequest) {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await staffHubWriter.from('inbody_scans').delete().eq('id', id)

    if (error) {
      console.error('[InBody] delete failed:', error)
      return NextResponse.json({ error: 'Failed to delete scan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  /** PATCH — coach edits an existing InBody scan by id */
  export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const { id, scan_date, weight, smm, bf_pct, bf_mass, notes } = body

    if (!id || !scan_date) {
      return NextResponse.json({ error: 'id and scan_date are required' }, { status: 400 })
    }

    const { error } = await staffHubWriter
      .from('inbody_scans')
      .update({
        scan_date,
        weight: weight ?? null,
        smm: smm ?? null,
        bf_pct: bf_pct ?? null,
        bf_mass: bf_mass ?? null,
        notes: notes || null,
      })
      .eq('id', id)

    if (error) {
      // Unique (gymmaster_member_id, scan_date) collision
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A scan already exists for that date' },
          { status: 409 },
        )
      }
      console.error('[InBody] update failed:', error)
      return NextResponse.json({ error: 'Failed to update scan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
  ```

- [ ] **Step 2: Add `PATCH` to `src/app/api/coach/strength/route.ts`**

  Append after the existing `DELETE` (file imports `NextRequest`, `NextResponse`,
  `staffHubReader`, `staffHubWriter`):

  ```ts
  /** PATCH — coach edits an existing strength result by id */
  export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const { id, exercise, result_value, result_notes, tested_date } = body

    if (!id || !exercise || result_value == null || !tested_date) {
      return NextResponse.json(
        { error: 'id, exercise, result_value and tested_date are required' },
        { status: 400 },
      )
    }

    const { error } = await staffHubWriter
      .from('strength_results')
      .update({
        exercise,
        result_value: Number(result_value),
        result_notes: result_notes || null,
        tested_date,
      })
      .eq('id', id)

    if (error) {
      console.error('[coach/strength] update failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }
  ```

- [ ] **Step 3: Lint**

  Run: `npx eslint src/app/api/inbody/route.ts src/app/api/coach/strength/route.ts`
  Expected: no output.

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/inbody/route.ts src/app/api/coach/strength/route.ts
  git commit -m "feat(api): coach delete + edit for InBody scans and strength results"
  ```

---

## Task 3: `InlineDeleteConfirm` component

**Files:**
- Create: `src/components/results/InlineDeleteConfirm.tsx`

- [ ] **Step 1: Create the component**

  ```tsx
  "use client";

  import { useState } from "react";

  type Props = {
    /** Perform the delete. The parent removes the row on resolve. */
    onConfirm: () => Promise<void> | void;
    className?: string;
  };

  export default function InlineDeleteConfirm({ onConfirm, className }: Props) {
    const [state, setState] = useState<"idle" | "confirming" | "deleting">("idle");

    if (state === "idle") {
      return (
        <button
          type="button"
          onClick={() => setState("confirming")}
          title="Delete"
          className={`text-text-muted hover:text-status-red transition-colors ${className ?? ""}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${className ?? ""}`}>
        <span className="text-status-red font-semibold">Delete?</span>
        <button
          type="button"
          disabled={state === "deleting"}
          onClick={async () => {
            setState("deleting");
            try {
              await onConfirm();
            } catch {
              setState("idle");
            }
          }}
          className="border border-status-red text-status-red rounded px-1.5 py-0.5 font-semibold disabled:opacity-50"
        >
          {state === "deleting" ? "…" : "Yes"}
        </button>
        <button
          type="button"
          disabled={state === "deleting"}
          onClick={() => setState("idle")}
          className="border border-border-light text-text-secondary rounded px-1.5 py-0.5 disabled:opacity-50"
        >
          No
        </button>
      </span>
    );
  }
  ```

- [ ] **Step 2: Lint**

  Run: `npx eslint src/components/results/InlineDeleteConfirm.tsx`
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/results/InlineDeleteConfirm.tsx
  git commit -m "feat(results): reusable inline delete-confirm control"
  ```

---

## Task 4: Member delete on the strength page

**Files:**
- Modify: `src/components/results/StrengthClient.tsx`

Context: `TrendChart({ results, exercise, pbId })` (~line 68) renders a per-result
row list at ~line 161 (`[...sorted].reverse().map((r, i) => <div key={r.id} className="flex items-center justify-between px-4 py-2 …">`). `ExerciseCard({ exercise, results, isLoggedIn })` (~line 191) has `const router = useRouter()` and renders `<TrendChart …>`.

- [ ] **Step 1: Import the control**

  Add near the top of `StrengthClient.tsx`:

  ```tsx
  import InlineDeleteConfirm from "@/components/results/InlineDeleteConfirm";
  ```

- [ ] **Step 2: Give `TrendChart` an `onDelete` prop**

  In the `TrendChartProps` type, add:

  ```ts
  onDelete?: (id: string) => Promise<void>;
  ```

  Destructure it in the component signature: `function TrendChart({ results, exercise, pbId, onDelete }: TrendChartProps)`.

  In the row map at ~line 161, inside each row's right-hand `<div className="flex items-center gap-2">` (the one holding the PB badge and value), append — as the last child of that row `<div>`, after the value span's wrapper:

  ```tsx
  {onDelete && (
    <InlineDeleteConfirm onConfirm={() => onDelete(r.id)} className="ml-2" />
  )}
  ```

  (If the row's structure is `<div className="flex items-center justify-between …"><span>date</span><div className="flex items-center gap-2">…</div></div>`, place the `InlineDeleteConfirm` as a sibling of that inner `<div>`, i.e. a direct child of the row, so it sits at the far right.)

- [ ] **Step 3: Wire the handler in `ExerciseCard`**

  Inside `ExerciseCard`, add:

  ```ts
  async function handleDeleteResult(id: string) {
    await fetch("/api/strength", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }
  ```

  Where `ExerciseCard` renders `<TrendChart …>`, add the prop:

  ```tsx
  onDelete={isLoggedIn ? handleDeleteResult : undefined}
  ```

- [ ] **Step 4: Lint**

  Run: `npx eslint src/components/results/StrengthClient.tsx`
  Expected: no output.

- [ ] **Step 5: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/results/StrengthClient.tsx
  git commit -m "feat(results): members can delete their own strength results"
  ```

---

## Task 5: Member delete on the body-composition page

**Files:**
- Create: `src/components/results/ScanHistoryTable.tsx`
- Modify: `src/app/(member)/results/body-composition/page.tsx`

Context: `body-composition/page.tsx` is a server component. Its "Scan history
table" is the last `<div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">` block in the main `return`, containing a `<table>` (columns Date / Weight / SMM / BF% / BF Mass), a `[...chronological].reverse().map((scan, i) => …)` body with a "Latest" badge on `i === 0`, and a footer `<div className="px-5 py-3 border-t border-border-light"><span>{scans.length} scan{…} recorded</span></div>`. `isLoggedIn` is already computed in the page.

- [ ] **Step 1: Create `ScanHistoryTable.tsx`**

  ```tsx
  "use client";

  import { useRouter } from "next/navigation";
  import type { InBodyScan } from "@/lib/staffhub";
  import InlineDeleteConfirm from "@/components/results/InlineDeleteConfirm";

  function formatDateLabel(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  type Props = {
    scans: InBodyScan[];
    canDelete: boolean;
  };

  export default function ScanHistoryTable({ scans, canDelete }: Props) {
    const router = useRouter();

    async function handleDelete(id: string) {
      await fetch("/api/inbody/member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    }

    // scans arrive newest-first from fetchMemberScans
    return (
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light">
          <h2 className="font-semibold text-text-primary text-sm">Scan History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-bg-main/50">
                {["Date", "Weight", "SMM", "BF%", "BF Mass"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {col}
                  </th>
                ))}
                {canDelete && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {scans.map((scan, i) => {
                const isLatest = i === 0;
                return (
                  <tr
                    key={scan.id}
                    className={isLatest ? "bg-brand/5" : "hover:bg-bg-main/60 transition-colors"}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary text-xs">
                      {formatDateLabel(scan.scan_date)}
                      {isLatest && (
                        <span className="ml-2 text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.weight != null ? `${scan.weight} kg` : "—"}</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.smm != null ? `${scan.smm} kg` : "—"}</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bf_pct != null ? `${scan.bf_pct}%` : "—"}</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bf_mass != null ? `${scan.bf_mass} kg` : "—"}</td>
                    {canDelete && (
                      <td className="px-4 py-3 text-right">
                        <InlineDeleteConfirm onConfirm={() => handleDelete(scan.id)} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border-light">
          <span className="text-xs text-text-secondary">{scans.length} scan{scans.length !== 1 ? "s" : ""} recorded</span>
        </div>
      </div>
    );
  }
  ```

  Note: the original inline table iterated `[...chronological].reverse()`
  (newest-first). `fetchMemberScans` returns newest-first already and the page
  keeps that array as `scans`, so pass `scans` directly (newest-first) — the
  component does not re-sort.

- [ ] **Step 2: Use it in `body-composition/page.tsx`**

  Add import near the other component imports:

  ```tsx
  import ScanHistoryTable from "@/components/results/ScanHistoryTable";
  ```

  Replace the entire inline "Scan history table" `<div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden"> … </div>` block (the table + its footer) at the end of the main `return` with:

  ```tsx
  <ScanHistoryTable scans={scans} canDelete={isLoggedIn} />
  ```

  Leave everything else (header, latest-scan card, progress summary, `AddScanForm`,
  `BodyCompositionChart`) unchanged. If `formatDateLabel` is now unused elsewhere
  in the page, leave it — it is still used by the latest-scan card and progress
  summary (`formatDateLabel(latest.scan_date)` / `firstLabel`). Do **not** remove it.

- [ ] **Step 3: Lint**

  Run: `npx eslint src/components/results/ScanHistoryTable.tsx "src/app/(member)/results/body-composition/page.tsx"`
  Expected: no output (in particular no `no-unused-vars`).

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/results/ScanHistoryTable.tsx "src/app/(member)/results/body-composition/page.tsx"
  git commit -m "feat(results): members can delete their own InBody scans"
  ```

---

## Task 6: Coach edit modals

**Files:**
- Create: `src/components/coach/EditStrengthResultModal.tsx`
- Create: `src/components/coach/EditScanModal.tsx`

- [ ] **Step 1: Create `EditStrengthResultModal.tsx`**

  ```tsx
  "use client";

  import { useState, useEffect } from "react";

  export type EditableStrengthResult = {
    id: string;
    exercise: string;
    result_value: number;
    result_notes: string | null;
    tested_date: string;
  };

  type Props = {
    result: EditableStrengthResult;
    exerciseOptions: string[];
    onClose: () => void;
    onSaved: () => void;
  };

  export default function EditStrengthResultModal({ result, exerciseOptions, onClose, onSaved }: Props) {
    const [exercise, setExercise] = useState(result.exercise);
    const [value, setValue] = useState(String(result.result_value));
    const [date, setDate] = useState(result.tested_date);
    const [notes, setNotes] = useState(result.result_notes ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
      }
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/coach/strength", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: result.id,
            exercise,
            result_value: parseFloat(value),
            result_notes: notes || null,
            tested_date: date,
          }),
        });
        if (res.ok) {
          onSaved();
          onClose();
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Failed to save");
        }
      } catch {
        setError("Network error — please try again");
      } finally {
        setSaving(false);
      }
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          className="bg-bg-card border border-border-light rounded-2xl p-6 w-full max-w-sm space-y-4"
        >
          <h2 className="font-semibold text-text-primary text-sm">Edit result</h2>

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Exercise</span>
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
            >
              {(exerciseOptions.includes(exercise) ? exerciseOptions : [exercise, ...exerciseOptions]).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Result value</span>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Tested date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Notes</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
            />
          </label>

          {error && <p className="text-xs text-status-red">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand text-white text-sm font-semibold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary rounded-xl hover:bg-bg-main transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Create `EditScanModal.tsx`**

  ```tsx
  "use client";

  import { useState, useEffect } from "react";

  export type EditableScan = {
    id: string;
    scan_date: string;
    weight: number | null;
    smm: number | null;
    bf_pct: number | null;
    bf_mass: number | null;
    notes: string | null;
  };

  type Props = {
    scan: EditableScan;
    onClose: () => void;
    onSaved: () => void;
  };

  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  export default function EditScanModal({ scan, onClose, onSaved }: Props) {
    const [date, setDate] = useState(scan.scan_date);
    const [weight, setWeight] = useState(scan.weight?.toString() ?? "");
    const [smm, setSmm] = useState(scan.smm?.toString() ?? "");
    const [bfPct, setBfPct] = useState(scan.bf_pct?.toString() ?? "");
    const [bfMass, setBfMass] = useState(scan.bf_mass?.toString() ?? "");
    const [notes, setNotes] = useState(scan.notes ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
      }
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/inbody", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: scan.id,
            scan_date: date,
            weight: numOrNull(weight),
            smm: numOrNull(smm),
            bf_pct: numOrNull(bfPct),
            bf_mass: numOrNull(bfMass),
            notes: notes || null,
          }),
        });
        if (res.ok) {
          onSaved();
          onClose();
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Failed to save");
        }
      } catch {
        setError("Network error — please try again");
      } finally {
        setSaving(false);
      }
    }

    const fields: Array<[string, string, (v: string) => void]> = [
      ["Weight (kg)", weight, setWeight],
      ["SMM (kg)", smm, setSmm],
      ["Body fat %", bfPct, setBfPct],
      ["BF mass (kg)", bfMass, setBfMass],
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          className="bg-bg-card border border-border-light rounded-2xl p-6 w-full max-w-sm space-y-4"
        >
          <h2 className="font-semibold text-text-primary text-sm">Edit scan</h2>

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Scan date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {fields.map(([label, val, set]) => (
              <label key={label} className="block">
                <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">{label}</span>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
                />
              </label>
            ))}
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Notes</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
            />
          </label>

          {error && <p className="text-xs text-status-red">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand text-white text-sm font-semibold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary rounded-xl hover:bg-bg-main transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 3: Lint**

  Run: `npx eslint src/components/coach/EditStrengthResultModal.tsx src/components/coach/EditScanModal.tsx`
  Expected: no output.

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/coach/EditStrengthResultModal.tsx src/components/coach/EditScanModal.tsx
  git commit -m "feat(coach): edit modals for strength results and InBody scans"
  ```

---

## Task 7: Wire edit/delete into the three coach pages

**Files:**
- Modify: `src/app/coach/(portal)/input/strength/page.tsx`
- Modify: `src/app/coach/(portal)/input/testing/page.tsx`
- Modify: `src/app/coach/(portal)/input/inbody/page.tsx`

All three are `"use client"` pages. Each has a `RecentEntry` / `recent` / `RecentScan`
style row type and a `load…` function that re-fetches the list. Each holds a local
`const EXERCISES` list (strength / testing) whose `.name` values are the exercise
labels stored in the DB.

Pattern for each page:
1. Import the relevant modal + `useState` for `editing` (the row being edited, or `null`).
2. Add a pencil button beside the existing trash button in each row; `onClick={() => setEditing(row)}`.
3. Render `{editing && <EditXModal … onClose={() => setEditing(null)} onSaved={loadFn} />}` once, near the end of the JSX.

Pencil icon (15px, matches the trash button styling):

```tsx
<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 20h9" />
  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
</svg>
```

- [ ] **Step 1: `input/strength/page.tsx`**

  - Import: `import EditStrengthResultModal from "@/components/coach/EditStrengthResultModal";`
  - Add state: `const [editing, setEditing] = useState<RecentEntry | null>(null);`
    (use the file's existing recent-row type name).
  - In the Recent Results table's actions `<td>` (currently just the trash
    `<button>`), add a pencil `<button>` before it:

    ```tsx
    <button
      onClick={() => setEditing(entry)}
      className="text-text-muted hover:text-brand transition-colors mr-2"
      title="Edit entry"
    >
      {/* pencil svg */}
    </button>
    ```

  - Before the component's closing markup, add:

    ```tsx
    {editing && (
      <EditStrengthResultModal
        result={{
          id: editing.id,
          exercise: editing.exercise,
          result_value: editing.result_value,
          result_notes: editing.result_notes ?? null,
          tested_date: editing.tested_date,
        }}
        exerciseOptions={EXERCISES.map((e) => e.name)}
        onClose={() => setEditing(null)}
        onSaved={loadRecentEntries}
      />
    )}
    ```

- [ ] **Step 2: `input/testing/page.tsx`**

  - Import the same modal.
  - Add `const [editing, setEditing] = useState<(typeof recent)[number] | null>(null);`
    (or the file's explicit recent-row type).
  - In the history view rows (the `recent.map((r) => …)` block), add a pencil
    `<button onClick={() => setEditing(r)} className="text-text-muted hover:text-brand transition-colors shrink-0 p-1" title="Edit entry">` immediately before the existing trash `<button>`.
  - Near the end of the JSX add:

    ```tsx
    {editing && (
      <EditStrengthResultModal
        result={{
          id: editing.id,
          exercise: editing.exercise,
          result_value: editing.result_value,
          result_notes: editing.result_notes ?? null,
          tested_date: editing.tested_date,
        }}
        exerciseOptions={EXERCISES.map((e) => e.name)}
        onClose={() => setEditing(null)}
        onSaved={loadRecent}
      />
    )}
    ```

- [ ] **Step 3: `input/inbody/page.tsx`**

  - Imports:

    ```tsx
    import EditScanModal from "@/components/coach/EditScanModal";
    ```

  - Add state:

    ```tsx
    const [editing, setEditing] = useState<InBodyScan | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    ```

  - Add a delete handler (mirrors `coach/input/strength`'s pattern):

    ```tsx
    async function handleDelete(id: string) {
      setDeletingId(id);
      try {
        const res = await fetch("/api/inbody", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) setRecentScans((prev) => prev.filter((s) => s.id !== id));
      } finally {
        setDeletingId(null);
      }
    }
    ```

  - In the Recent Scans `<table>`: add a trailing header cell `<th className="px-4 py-3" />` after "BF Mass", and a trailing `<td>` per row containing a pencil button (`onClick={() => setEditing(scan)}`, `hover:text-brand`) and a trash button (`onClick={() => handleDelete(scan.id)}`, `disabled={deletingId === scan.id}`, `hover:text-status-red`, showing `…` while deleting) — reuse the 15px pencil + trash SVGs.
  - Near the end of the JSX:

    ```tsx
    {editing && (
      <EditScanModal
        scan={{
          id: editing.id,
          scan_date: editing.scan_date,
          weight: editing.weight,
          smm: editing.smm,
          bf_pct: editing.bf_pct,
          bf_mass: editing.bf_mass,
          notes: editing.notes,
        }}
        onClose={() => setEditing(null)}
        onSaved={loadRecentScans}
      />
    )}
    ```

- [ ] **Step 4: Lint**

  Run: `npx eslint "src/app/coach/(portal)/input/strength/page.tsx" "src/app/coach/(portal)/input/testing/page.tsx" "src/app/coach/(portal)/input/inbody/page.tsx"`
  Expected: no output.

- [ ] **Step 5: Build**

  Run: `npm run build`
  Expected: compiles successfully.

- [ ] **Step 6: Commit**

  ```bash
  git add "src/app/coach/(portal)/input/strength/page.tsx" "src/app/coach/(portal)/input/testing/page.tsx" "src/app/coach/(portal)/input/inbody/page.tsx"
  git commit -m "feat(coach): edit results/scans and delete scans from the input pages"
  ```

---

## Task 8: Browser verification + notes

**Files:**
- Modify: `session-notes-members-area.md`

- [ ] **Step 1: Full verification**

  Run: `npx eslint src/app/api/strength/route.ts src/app/api/inbody/member/route.ts src/app/api/inbody/route.ts src/app/api/coach/strength/route.ts src/components/results/InlineDeleteConfirm.tsx src/components/results/ScanHistoryTable.tsx src/components/results/StrengthClient.tsx "src/app/(member)/results/body-composition/page.tsx" src/components/coach/EditStrengthResultModal.tsx src/components/coach/EditScanModal.tsx "src/app/coach/(portal)/input/strength/page.tsx" "src/app/coach/(portal)/input/testing/page.tsx" "src/app/coach/(portal)/input/inbody/page.tsx" && npm run build`
  Expected: eslint clean; build passes.

- [ ] **Step 2: Member browser checks**

  Dev server + `/demo-login` (passphrase from `.env.local` `DEMO_LOGIN_PASSPHRASE`), then:
  - `/results/strength` — expand an exercise with results; each row shows a trash
    icon; tapping it shows `Delete? Yes / No`; `No` reverts; `Yes` removes the row
    after refresh. (DEMO member has no real data — if the exercise lists are empty,
    add one result via the form first, then delete it.)
  - `/results/body-composition` — Scan History rows show the same control and a
    delete round-trips.
  - Log out → both pages show no delete controls.

- [ ] **Step 3: Coach browser checks**

  Coach portal (`/coach/login` or existing session):
  - `input/strength` → Recent Results: pencil opens the edit modal prefilled;
    change value + date + notes → Save → row updates in the list. Trash still works.
  - `input/testing` → history view: pencil edits a result.
  - `input/inbody` → Recent Scans: pencil opens the scan modal; edit metrics →
    Save → list updates. Trash button deletes a scan. Editing a scan's date onto
    another scan's date for the same member shows "A scan already exists for that
    date" inline and does not save.

- [ ] **Step 4: Ownership check**

  With devtools/curl as a logged-in member, `DELETE /api/strength` (or
  `/api/inbody/member`) with an `id` belonging to a different member → response
  `{ ok: true }` but the row is untouched (still visible to its owner). Confirms
  the compound-filter guard.

- [ ] **Step 5: Session note + backlog correction**

  In `session-notes-members-area.md`:
  - In "## Deferred / Next Steps", update item 6 to note what now exists: members
    can delete their own strength results and InBody scans (inline confirm);
    coaches can delete InBody scans and edit both strength results and InBody
    scans via a modal. Remaining gap: no *member* edit; coach edit of an InBody
    `scan_date` onto an existing date returns 409.
  - Append a dated session entry: new API handlers (`DELETE /api/strength`,
    `DELETE /api/inbody/member` — both cookie-ownership-filtered; `DELETE` +
    `PATCH /api/inbody`; `PATCH /api/coach/strength`); `InlineDeleteConfirm` +
    `ScanHistoryTable` components; `StrengthClient` `TrendChart` gained an
    `onDelete`; body-comp scan table extracted to a client component;
    `EditStrengthResultModal` + `EditScanModal`; wired into the three coach input
    pages. Note the InBody unique `(gymmaster_member_id, scan_date)` constraint
    drives the 409 path.

- [ ] **Step 6: Commit**

  ```bash
  git add session-notes-members-area.md
  git commit -m "docs: session notes for results edit & delete"
  ```

---

## Self-review notes

- **Spec coverage:** member delete APIs → Task 1; coach delete+edit APIs → Task 2;
  `InlineDeleteConfirm` → Task 3; strength member delete → Task 4; InBody member
  delete + `ScanHistoryTable` → Task 5; both edit modals → Task 6; coach page
  wiring (incl. new InBody delete button) → Task 7; verification + notes → Task 8.
- **No placeholders:** full source for every new file; edits specify the exact
  anchor and inserted code.
- **Type consistency:** `InlineDeleteConfirm` prop `onConfirm: () => Promise<void> | void`
  used by `TrendChart` (`() => onDelete(r.id)`) and `ScanHistoryTable`
  (`() => handleDelete(scan.id)`). `EditStrengthResultModal` expects
  `{ id, exercise, result_value, result_notes, tested_date }` — the coach pages
  build exactly that from their recent-row objects. `EditScanModal` expects
  `{ id, scan_date, weight, smm, bf_pct, bf_mass, notes }` — matches `InBodyScan`.
  PATCH `/api/inbody` returns `409` with `{ error }`, which both `EditScanModal`
  surfaces via `d.error`.
- **Response-shape consistency:** strength routes use `{ ok: true }`; inbody
  routes use `{ success: true }` — matched to each file's existing convention;
  modals/handlers only check `res.ok`, so the difference is inert.
