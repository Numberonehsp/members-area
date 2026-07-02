# Nutrition Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a member-facing daily nutrition logger with manual entry and barcode scanning, backed by Supabase, with a nutrition summary card on the dashboard.

**Architecture:** Three Supabase tables (`nutrition_targets`, `nutrition_logs`, `nutrition_log_items`) store per-member targets and daily entries. A server component fetches today's data and passes it to client components. Barcode scanning uses the native `BarcodeDetector` Web API to query Open Food Facts. A small REST API route handles log upserts from the client.

**Tech Stack:** Next.js 14 App Router, Supabase (anon key), Tailwind CSS, Open Food Facts REST API (`world.openfoodfacts.org`), native `BarcodeDetector` Web API

---

## Context for the engineer

- Member identity comes from the cookie `gymmaster_member_id` (a string like `"123456"`). This is the identifier used in all nutrition tables — there is no UUID FK to a members table.
- Server components use `createServerSupabaseClient()` from `src/lib/supabase-server.ts`. Client components use `createClient()` from `src/lib/supabase.ts`.
- All cookies are read via `import { cookies } from 'next/headers'` in server components and API routes.
- Tailwind classes use CSS variables defined in the project: `bg-bg-main`, `bg-bg-card`, `border-border-light`, `text-text-primary`, `text-text-secondary`, `text-brand`, `bg-brand`, `font-display`, etc.
- The nutrition targets for a member are set by a coach (Plan 2). Until Plan 2 is built, hardcode sensible fallback targets: `{ calories: 2000, protein_g: 150, carbs_g: 200, fats_g: 65 }` when no row exists.
- This plan covers **Phase 1 only**: manual entry + barcode scan. Phase 2 (search by name) is a future plan.
- No test framework is installed. Verification steps use `npm run build` (TypeScript + lint) and manual browser testing.
- Read `node_modules/next/dist/docs/` if you hit any unexpected Next.js behaviour — this version has breaking changes.

---

## File Map

**New files — members-area:**

| File | Purpose |
|------|---------|
| `migrations/008_nutrition_tracker.sql` | Creates all 3 nutrition tables in Supabase |
| `src/types/nutrition.ts` | TypeScript types for nutrition entities |
| `src/lib/open-food-facts.ts` | Open Food Facts API client (fetch by barcode) |
| `src/lib/nutrition-queries.ts` | Supabase read/write functions |
| `src/app/api/nutrition/log/route.ts` | POST — upsert daily log; GET — fetch today's log |
| `src/app/api/nutrition/scan/route.ts` | GET — proxy barcode lookup to Open Food Facts |
| `src/app/(member)/nutrition/page.tsx` | Server component — fetches data, renders page |
| `src/components/nutrition/NutritionPage.tsx` | Client component — main nutrition UI container |
| `src/components/nutrition/DailyGrid.tsx` | 2×2 grid: calories, protein, carbs, fats vs targets |
| `src/components/nutrition/LogModal.tsx` | Manual entry modal — 4 number fields |
| `src/components/nutrition/WeeklyChart.tsx` | 7-day calorie bar chart |
| `src/components/nutrition/BarcodeScanner.tsx` | Camera UI + BarcodeDetector + result display |
| `src/components/nutrition/PortionPicker.tsx` | Serving size / custom grams selector |
| `src/components/dashboard/NutritionCard.tsx` | Dashboard summary card |

**Modified files — members-area:**

| File | Change |
|------|--------|
| `src/app/(member)/dashboard/page.tsx` | Import and render `NutritionCard` |

---

## Task 1: Database Migration

**Files:**
- Create: `migrations/008_nutrition_tracker.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- ============================================================
-- Migration 008: Nutrition Tracker
-- Run in Supabase SQL Editor (Members Area project)
-- ============================================================

-- nutrition_targets
-- One row per member. Set by coaches (Plan 2).
-- gymmaster_member_id is the GymMaster string ID (e.g. "123456").
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL UNIQUE,
  calories             INT NOT NULL DEFAULT 2000,
  protein_g            INT NOT NULL DEFAULT 150,
  carbs_g              INT NOT NULL DEFAULT 200,
  fats_g               INT NOT NULL DEFAULT 65,
  if_method            TEXT CHECK (if_method IN ('16:8', '14:10', '5:2', 'none')),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  updated_by           TEXT  -- coach identifier, set in Plan 2
);

ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nutrition_targets"
  ON nutrition_targets FOR ALL USING (true) WITH CHECK (true);

-- nutrition_logs
-- One row per member per day. Stores the daily total.
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id  TEXT NOT NULL,
  date                 DATE NOT NULL,
  calories             INT NOT NULL DEFAULT 0,
  protein_g            INT NOT NULL DEFAULT 0,
  carbs_g              INT NOT NULL DEFAULT 0,
  fats_g               INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gymmaster_member_id, date)
);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nutrition_logs"
  ON nutrition_logs FOR ALL USING (true) WITH CHECK (true);

-- nutrition_log_items
-- Individual food entries linked to a daily log.
-- source: 'barcode' = scanned product, 'manual' = bulk entry.
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_log_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      UUID NOT NULL REFERENCES nutrition_logs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  calories    INT NOT NULL DEFAULT 0,
  protein_g   DECIMAL(6,1) NOT NULL DEFAULT 0,
  carbs_g     DECIMAL(6,1) NOT NULL DEFAULT 0,
  fats_g      DECIMAL(6,1) NOT NULL DEFAULT 0,
  quantity_g  DECIMAL(6,1) NOT NULL DEFAULT 100,
  barcode     TEXT,  -- EAN barcode if scanned
  source      TEXT NOT NULL CHECK (source IN ('barcode', 'manual')) DEFAULT 'manual',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nutrition_log_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nutrition_log_items"
  ON nutrition_log_items FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Run the migration**

Open the Supabase SQL Editor for the Members Area project and paste the contents of `migrations/008_nutrition_tracker.sql`. Click "Run".

Verify by checking the Table Editor — you should see three new tables: `nutrition_targets`, `nutrition_logs`, `nutrition_log_items`.

- [ ] **Step 3: Commit**

```bash
git add migrations/008_nutrition_tracker.sql
git commit -m "feat: add nutrition tracker database migration"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/nutrition.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/nutrition.ts

export type NutritionTargets = {
  id: string
  gymmaster_member_id: string
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  if_method: '16:8' | '14:10' | '5:2' | 'none' | null
  updated_at: string
  updated_by: string | null
}

export type NutritionLog = {
  id: string
  gymmaster_member_id: string
  date: string  // ISO date string: 'YYYY-MM-DD'
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  updated_at: string
}

export type NutritionLogItem = {
  id: string
  log_id: string
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  quantity_g: number
  barcode: string | null
  source: 'barcode' | 'manual'
  created_at: string
}

// Nutrition per 100g from Open Food Facts
export type OFFNutriments = {
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fats_per_100g: number
}

// Parsed product from Open Food Facts barcode lookup
export type OFFProduct = {
  barcode: string
  name: string       // product_name from OFF
  brand: string      // brands from OFF
  serving_size_g: number | null  // serving_size parsed to grams
  nutriments: OFFNutriments
}

// Default targets to use when no nutrition_targets row exists for a member
export const DEFAULT_TARGETS: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'> = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fats_g: 65,
  if_method: null,
}

// Data shape for the weekly chart: 7 days, oldest first
export type WeekDay = {
  date: string    // 'YYYY-MM-DD'
  label: string   // 'Mon', 'Tue', etc.
  calories: number | null  // null = not logged
}
```

- [ ] **Step 2: Verify with TypeScript**

```bash
cd /Users/edharper/Documents/Claude/Gym/members-area
npm run build 2>&1 | grep -E "error TS|warning"
```

Expected: no errors related to `src/types/nutrition.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/types/nutrition.ts
git commit -m "feat: add nutrition TypeScript types"
```

---

## Task 3: Open Food Facts API Client

**Files:**
- Create: `src/lib/open-food-facts.ts`
- Create: `src/app/api/nutrition/scan/route.ts`

The Open Food Facts API is queried server-side (via an API route) to avoid CORS issues in the browser and to keep the barcode lookup proxied through your own domain.

- [ ] **Step 1: Create the OFF API client**

```typescript
// src/lib/open-food-facts.ts

import type { OFFProduct } from '@/types/nutrition'

type OFFApiResponse = {
  status: number  // 1 = found, 0 = not found
  product?: {
    product_name?: string
    brands?: string
    serving_size?: string
    nutriments?: {
      'energy-kcal_100g'?: number
      proteins_100g?: number
      carbohydrates_100g?: number
      fat_100g?: number
    }
  }
}

// Parse a serving_size string like "150g" or "2 biscuits (28g)" → grams as number
// Returns null if no gram value can be extracted
function parseServingSizeGrams(raw: string | undefined): number | null {
  if (!raw) return null
  const match = raw.match(/(\d+(?:\.\d+)?)\s*g/i)
  return match ? parseFloat(match[1]) : null
}

export async function fetchProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,serving_size,nutriments`

  const res = await fetch(url, {
    next: { revalidate: 86400 },  // cache for 24 hours — product data rarely changes
  })

  if (!res.ok) return null

  const data: OFFApiResponse = await res.json()

  if (data.status !== 1 || !data.product) return null

  const p = data.product
  const n = p.nutriments ?? {}

  return {
    barcode,
    name: p.product_name?.trim() || 'Unknown product',
    brand: p.brands?.trim() || '',
    serving_size_g: parseServingSizeGrams(p.serving_size),
    nutriments: {
      calories_per_100g: Math.round(n['energy-kcal_100g'] ?? 0),
      protein_per_100g:  parseFloat((n.proteins_100g ?? 0).toFixed(1)),
      carbs_per_100g:    parseFloat((n.carbohydrates_100g ?? 0).toFixed(1)),
      fats_per_100g:     parseFloat((n.fat_100g ?? 0).toFixed(1)),
    },
  }
}

// Calculate nutrition for a given portion size
export function calculatePortion(
  product: OFFProduct,
  quantityG: number
): { calories: number; protein_g: number; carbs_g: number; fats_g: number } {
  const ratio = quantityG / 100
  return {
    calories:  Math.round(product.nutriments.calories_per_100g * ratio),
    protein_g: parseFloat((product.nutriments.protein_per_100g * ratio).toFixed(1)),
    carbs_g:   parseFloat((product.nutriments.carbs_per_100g * ratio).toFixed(1)),
    fats_g:    parseFloat((product.nutriments.fats_per_100g * ratio).toFixed(1)),
  }
}
```

- [ ] **Step 2: Create the scan API route**

This proxies the barcode lookup so the browser never hits OFF directly (avoids CORS).

```typescript
// src/app/api/nutrition/scan/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchProductByBarcode } from '@/lib/open-food-facts'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')?.trim()

  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 })
  }

  const product = await fetchProductByBarcode(barcode)

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ product })
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|warning"
```

Expected: no TypeScript errors.

- [ ] **Step 4: Manual test the scan route**

Start the dev server (`npm run dev`), then in your browser (logged in as demo):

```
http://localhost:3000/api/nutrition/scan?barcode=5000112637922
```

(That's Tesco Greek Style Yoghurt.) Expected response:
```json
{
  "product": {
    "barcode": "5000112637922",
    "name": "Greek Style Yoghurt",
    "brand": "Tesco",
    "serving_size_g": 150,
    "nutriments": { "calories_per_100g": 82, "protein_per_100g": 5.3, ... }
  }
}
```

If OFF doesn't have that barcode, try `5010477348859` (Tesco Whole Milk). A `404` response means the product isn't in the OFF database, which is fine — the UI handles that gracefully.

- [ ] **Step 5: Commit**

```bash
git add src/lib/open-food-facts.ts src/app/api/nutrition/scan/route.ts
git commit -m "feat: add Open Food Facts API client and scan proxy route"
```

---

## Task 4: Supabase Query Functions

**Files:**
- Create: `src/lib/nutrition-queries.ts`

- [ ] **Step 1: Create the query functions**

```typescript
// src/lib/nutrition-queries.ts
// All functions use the anon Supabase client.
// Call these from server components and API routes only.

import { createClient } from '@supabase/supabase-js'
import type { NutritionTargets, NutritionLog, NutritionLogItem, WeekDay, DEFAULT_TARGETS } from '@/types/nutrition'
import { DEFAULT_TARGETS as DEFAULTS } from '@/types/nutrition'

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Return today's date as 'YYYY-MM-DD' in UTC
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Return the 7-day window ending today: ['YYYY-MM-DD', ...] oldest first
export function weekDates(): string[] {
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

// Fetch targets for a member. Returns DEFAULT_TARGETS values if no row exists.
export async function fetchTargets(gymMasterId: string): Promise<Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'>> {
  const supabase = client()
  const { data } = await supabase
    .from('nutrition_targets')
    .select('calories, protein_g, carbs_g, fats_g, if_method')
    .eq('gymmaster_member_id', gymMasterId)
    .single()

  return data ?? DEFAULTS
}

// Fetch a single day's log. Returns null if not yet logged.
export async function fetchDayLog(gymMasterId: string, date: string): Promise<NutritionLog | null> {
  const supabase = client()
  const { data } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('gymmaster_member_id', gymMasterId)
    .eq('date', date)
    .single()

  return data ?? null
}

// Fetch all log items for a given log ID
export async function fetchLogItems(logId: string): Promise<NutritionLogItem[]> {
  const supabase = client()
  const { data } = await supabase
    .from('nutrition_log_items')
    .select('*')
    .eq('log_id', logId)
    .order('created_at', { ascending: true })

  return data ?? []
}

// Fetch the last 7 days of logs for the weekly chart
export async function fetchWeekLogs(gymMasterId: string): Promise<WeekDay[]> {
  const supabase = client()
  const dates = weekDates()
  const oldest = dates[0]

  const { data } = await supabase
    .from('nutrition_logs')
    .select('date, calories')
    .eq('gymmaster_member_id', gymMasterId)
    .gte('date', oldest)

  const logsByDate = new Map((data ?? []).map((r) => [r.date, r.calories]))

  return dates.map((date) => ({
    date,
    label: new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short' }),
    calories: logsByDate.get(date) ?? null,
  }))
}

// Upsert the daily log totals (called from the API route)
export async function upsertDayLog(
  gymMasterId: string,
  date: string,
  totals: { calories: number; protein_g: number; carbs_g: number; fats_g: number },
): Promise<NutritionLog> {
  const supabase = client()
  const { data, error } = await supabase
    .from('nutrition_logs')
    .upsert(
      { gymmaster_member_id: gymMasterId, date, ...totals, updated_at: new Date().toISOString() },
      { onConflict: 'gymmaster_member_id,date' },
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Insert a log item (barcode scan result) and update daily totals
export async function addLogItem(
  gymMasterId: string,
  date: string,
  item: Omit<NutritionLogItem, 'id' | 'log_id' | 'created_at'>,
): Promise<void> {
  const supabase = client()

  // Get or create the daily log
  const { data: existing } = await supabase
    .from('nutrition_logs')
    .select('id, calories, protein_g, carbs_g, fats_g')
    .eq('gymmaster_member_id', gymMasterId)
    .eq('date', date)
    .single()

  let logId: string
  let current = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }

  if (existing) {
    logId = existing.id
    current = { calories: existing.calories, protein_g: existing.protein_g, carbs_g: existing.carbs_g, fats_g: existing.fats_g }
  } else {
    const { data: newLog, error } = await supabase
      .from('nutrition_logs')
      .insert({ gymmaster_member_id: gymMasterId, date, calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    logId = newLog.id
  }

  // Insert the item
  const { error: itemError } = await supabase
    .from('nutrition_log_items')
    .insert({ log_id: logId, ...item })

  if (itemError) throw new Error(itemError.message)

  // Update daily totals
  await supabase
    .from('nutrition_logs')
    .update({
      calories:  current.calories  + item.calories,
      protein_g: current.protein_g + item.protein_g,
      carbs_g:   current.carbs_g   + item.carbs_g,
      fats_g:    current.fats_g    + item.fats_g,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId)
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/nutrition-queries.ts
git commit -m "feat: add nutrition Supabase query functions"
```

---

## Task 5: Nutrition Log API Route

**Files:**
- Create: `src/app/api/nutrition/log/route.ts`

This is the endpoint the client-side `LogModal` and `PortionPicker` call to save nutrition data.

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/nutrition/log/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upsertDayLog, fetchDayLog, addLogItem } from '@/lib/nutrition-queries'
import { todayISO } from '@/lib/nutrition-queries'

// GET /api/nutrition/log?date=YYYY-MM-DD
// Returns today's log or null
export async function GET(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  if (!memberId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? todayISO()

  const log = await fetchDayLog(memberId, date)
  return NextResponse.json({ log })
}

// POST /api/nutrition/log
// Body: { date, calories, protein_g, carbs_g, fats_g } — upsert daily totals (manual entry)
// Body: { date, item: { name, calories, protein_g, carbs_g, fats_g, quantity_g, barcode, source } } — add a log item (barcode scan)
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  if (!memberId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const date = (body.date as string) ?? todayISO()

  // Branch: adding an individual item (barcode scan)
  if (body.item) {
    const item = body.item as {
      name: string
      calories: number
      protein_g: number
      carbs_g: number
      fats_g: number
      quantity_g: number
      barcode: string | null
      source: 'barcode' | 'manual'
    }

    if (!item.name || item.calories == null) {
      return NextResponse.json({ error: 'item.name and item.calories are required' }, { status: 400 })
    }

    try {
      await addLogItem(memberId, date, item)
      const log = await fetchDayLog(memberId, date)
      return NextResponse.json({ log }, { status: 201 })
    } catch (err) {
      console.error('[nutrition log POST item]', err)
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
    }
  }

  // Branch: upsert daily totals (manual entry)
  const { calories, protein_g, carbs_g, fats_g } = body as {
    calories?: number
    protein_g?: number
    carbs_g?: number
    fats_g?: number
  }

  if (calories == null || protein_g == null || carbs_g == null || fats_g == null) {
    return NextResponse.json({ error: 'calories, protein_g, carbs_g, fats_g are required' }, { status: 400 })
  }

  try {
    const log = await upsertDayLog(memberId, date, { calories, protein_g, carbs_g, fats_g })
    return NextResponse.json({ log }, { status: 201 })
  } catch (err) {
    console.error('[nutrition log POST]', err)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/nutrition/log/route.ts
git commit -m "feat: add nutrition log API route"
```

---

## Task 6: DailyGrid Component

**Files:**
- Create: `src/components/nutrition/DailyGrid.tsx`

- [ ] **Step 1: Create the DailyGrid component**

```typescript
// src/components/nutrition/DailyGrid.tsx
'use client'

import type { NutritionLog, NutritionTargets } from '@/types/nutrition'
import { DEFAULT_TARGETS } from '@/types/nutrition'

type Props = {
  log: NutritionLog | null
  targets: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'>
}

type Metric = {
  label: string
  logged: number
  target: number
  unit: string
  colour: string
}

export default function DailyGrid({ log, targets }: Props) {
  const t = targets ?? DEFAULT_TARGETS

  const metrics: Metric[] = [
    { label: 'Calories', logged: log?.calories ?? 0,   target: t.calories,  unit: 'kcal', colour: 'text-brand' },
    { label: 'Protein',  logged: log?.protein_g ?? 0,  target: t.protein_g, unit: 'g',    colour: 'text-brand' },
    { label: 'Carbs',    logged: log?.carbs_g ?? 0,    target: t.carbs_g,   unit: 'g',    colour: 'text-text-secondary' },
    { label: 'Fats',     logged: log?.fats_g ?? 0,     target: t.fats_g,    unit: 'g',    colour: 'text-text-secondary' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map(({ label, logged, target, unit, colour }) => {
        const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0
        return (
          <div key={label} className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary mb-1">{label}</p>
            <p className={`font-display text-3xl leading-none mb-0.5 ${colour}`}>
              {logged.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              of {target.toLocaleString()} {unit}
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-bg-main rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nutrition/DailyGrid.tsx
git commit -m "feat: add DailyGrid nutrition component"
```

---

## Task 7: LogModal Component (Manual Entry)

**Files:**
- Create: `src/components/nutrition/LogModal.tsx`

- [ ] **Step 1: Create the LogModal component**

```typescript
// src/components/nutrition/LogModal.tsx
'use client'

import { useState } from 'react'
import type { NutritionLog } from '@/types/nutrition'

type Props = {
  currentLog: NutritionLog | null
  date: string           // 'YYYY-MM-DD'
  onSaved: (log: NutritionLog) => void
  onClose: () => void
}

type Fields = { calories: string; protein_g: string; carbs_g: string; fats_g: string }

export default function LogModal({ currentLog, date, onSaved, onClose }: Props) {
  const [fields, setFields] = useState<Fields>({
    calories:  String(currentLog?.calories  ?? ''),
    protein_g: String(currentLog?.protein_g ?? ''),
    carbs_g:   String(currentLog?.carbs_g   ?? ''),
    fats_g:    String(currentLog?.fats_g    ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    const calories  = parseInt(fields.calories)
    const protein_g = parseInt(fields.protein_g)
    const carbs_g   = parseInt(fields.carbs_g)
    const fats_g    = parseInt(fields.fats_g)

    if (isNaN(calories) || isNaN(protein_g) || isNaN(carbs_g) || isNaN(fats_g)) {
      setError('Please fill in all four fields with numbers.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, calories, protein_g, carbs_g, fats_g }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      onSaved(data.log)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inputFields: { key: keyof Fields; label: string; placeholder: string }[] = [
    { key: 'calories',  label: 'Calories (kcal)', placeholder: 'e.g. 1800' },
    { key: 'protein_g', label: 'Protein (g)',      placeholder: 'e.g. 150'  },
    { key: 'carbs_g',   label: 'Carbs (g)',        placeholder: 'e.g. 200'  },
    { key: 'fats_g',    label: 'Fats (g)',         placeholder: 'e.g. 65'   },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-text-primary">Log Today</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">×</button>
          </div>

          <div className="space-y-3 mb-5">
            {inputFields.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-text-secondary mb-1">{label}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={fields[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nutrition/LogModal.tsx
git commit -m "feat: add manual entry LogModal component"
```

---

## Task 8: WeeklyChart Component

**Files:**
- Create: `src/components/nutrition/WeeklyChart.tsx`

- [ ] **Step 1: Create the WeeklyChart component**

```typescript
// src/components/nutrition/WeeklyChart.tsx
'use client'

import type { WeekDay } from '@/types/nutrition'

type Props = {
  days: WeekDay[]
  targetCalories: number
}

export default function WeeklyChart({ days, targetCalories }: Props) {
  const maxCalories = Math.max(targetCalories * 1.2, ...days.map((d) => d.calories ?? 0))
  const logged = days.filter((d) => d.calories !== null).length
  const avg = logged > 0
    ? Math.round(days.reduce((sum, d) => sum + (d.calories ?? 0), 0) / logged)
    : null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold text-text-primary text-sm">This week</h3>
        <div className="text-xs text-text-secondary">
          {logged}/7 days · {avg !== null ? `avg ${avg.toLocaleString()} kcal` : 'no data yet'}
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5 h-20 mb-2">
        {days.map((day) => {
          const height = day.calories !== null && maxCalories > 0
            ? Math.max(4, Math.round((day.calories / maxCalories) * 80))
            : 4

          const isOver = day.calories !== null && day.calories > targetCalories
          const isEmpty = day.calories === null

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <div
                className={`w-full rounded-t transition-all ${
                  isEmpty ? 'bg-bg-main' : isOver ? 'bg-red-400/70' : 'bg-brand/70'
                }`}
                style={{ height: `${height}px` }}
                title={day.calories !== null ? `${day.calories.toLocaleString()} kcal` : 'Not logged'}
              />
            </div>
          )
        })}
      </div>

      {/* Day labels */}
      <div className="flex gap-1.5">
        {days.map((day) => (
          <div key={day.date} className="flex-1 text-center text-[10px] text-text-secondary">
            {day.label}
          </div>
        ))}
      </div>

      {/* Target line label */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-brand/70" />
          <span className="text-[10px] text-text-secondary">On target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-red-400/70" />
          <span className="text-[10px] text-text-secondary">Over target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-bg-main border border-border-light" />
          <span className="text-[10px] text-text-secondary">Not logged</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nutrition/WeeklyChart.tsx
git commit -m "feat: add WeeklyChart nutrition component"
```

---

## Task 9: PortionPicker Component

**Files:**
- Create: `src/components/nutrition/PortionPicker.tsx`

This component appears after a barcode scan when the product is found. It lets the member choose serving size or custom grams before adding to the log.

- [ ] **Step 1: Create the PortionPicker component**

```typescript
// src/components/nutrition/PortionPicker.tsx
'use client'

import { useState } from 'react'
import type { OFFProduct, NutritionLog } from '@/types/nutrition'
import { calculatePortion } from '@/lib/open-food-facts'

type Props = {
  product: OFFProduct
  date: string
  onAdded: (updatedLog: NutritionLog) => void
  onClose: () => void
}

export default function PortionPicker({ product, date, onAdded, onClose }: Props) {
  const defaultGrams = product.serving_size_g ?? 100
  const [useServing, setUseServing] = useState(product.serving_size_g !== null)
  const [customGrams, setCustomGrams] = useState(String(defaultGrams))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quantityG = useServing && product.serving_size_g
    ? product.serving_size_g
    : parseFloat(customGrams) || 100

  const portion = calculatePortion(product, quantityG)

  async function handleAdd() {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          item: {
            name:      `${product.brand ? product.brand + ' ' : ''}${product.name}`.trim(),
            calories:  portion.calories,
            protein_g: portion.protein_g,
            carbs_g:   portion.carbs_g,
            fats_g:    portion.fats_g,
            quantity_g: quantityG,
            barcode:   product.barcode,
            source:    'barcode' as const,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      onAdded(data.log)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-xl text-text-primary">{product.name}</h2>
              {product.brand && <p className="text-xs text-text-secondary">{product.brand}</p>}
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none ml-4">×</button>
          </div>

          {/* Nutrition per 100g */}
          <div className="grid grid-cols-4 gap-2 bg-bg-main rounded-xl p-3 mb-4 text-center">
            {[
              { label: 'Kcal', value: product.nutriments.calories_per_100g },
              { label: 'Pro', value: `${product.nutriments.protein_per_100g}g` },
              { label: 'Carb', value: `${product.nutriments.carbs_per_100g}g` },
              { label: 'Fat', value: `${product.nutriments.fats_per_100g}g` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-text-secondary uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-text-primary">{value}</p>
              </div>
            ))}
            <p className="col-span-4 text-[10px] text-text-secondary mt-0.5">per 100g</p>
          </div>

          {/* Portion selector */}
          <p className="text-xs text-text-secondary mb-2">How much did you have?</p>
          <div className="flex gap-2 mb-3">
            {product.serving_size_g && (
              <button
                onClick={() => setUseServing(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  useServing
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-bg-main border-border-light text-text-secondary hover:border-brand/50'
                }`}
              >
                1 serving ({product.serving_size_g}g)
              </button>
            )}
            <button
              onClick={() => setUseServing(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                !useServing
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-bg-main border-border-light text-text-secondary hover:border-brand/50'
              }`}
            >
              Custom (g)
            </button>
          </div>

          {!useServing && (
            <input
              type="number"
              inputMode="decimal"
              value={customGrams}
              onChange={(e) => setCustomGrams(e.target.value)}
              placeholder="e.g. 200"
              className="w-full bg-bg-main border border-border-light rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-brand transition-colors mb-3"
            />
          )}

          {/* Calculated values for chosen portion */}
          <div className="grid grid-cols-4 gap-2 bg-brand/5 border border-brand/20 rounded-xl p-3 mb-4 text-center">
            {[
              { label: 'Kcal', value: portion.calories },
              { label: 'Pro', value: `${portion.protein_g}g` },
              { label: 'Carb', value: `${portion.carbs_g}g` },
              { label: 'Fat', value: `${portion.fats_g}g` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-brand uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-text-primary">{value}</p>
              </div>
            ))}
            <p className="col-span-4 text-[10px] text-brand mt-0.5">for {quantityG}g</p>
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={saving || (!useServing && !parseFloat(customGrams))}
            className="w-full bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Adding…' : '+ Add to Today'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nutrition/PortionPicker.tsx
git commit -m "feat: add PortionPicker component for barcode scan results"
```

---

## Task 10: BarcodeScanner Component

**Files:**
- Create: `src/components/nutrition/BarcodeScanner.tsx`

The `BarcodeDetector` API is available in Chrome and Safari but not Firefox. The component detects support on mount and falls back to a manual barcode entry field if unavailable.

- [ ] **Step 1: Create the BarcodeScanner component**

```typescript
// src/components/nutrition/BarcodeScanner.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { OFFProduct, NutritionLog } from '@/types/nutrition'
import PortionPicker from './PortionPicker'

type Props = {
  date: string
  onAdded: (log: NutritionLog) => void
  onClose: () => void
}

type ScanState = 'scanning' | 'loading' | 'found' | 'not-found' | 'error' | 'unsupported'

export default function BarcodeScanner({ date, onAdded, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const [state, setState] = useState<ScanState>('scanning')
  const [product, setProduct] = useState<OFFProduct | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setState('unsupported')
      return
    }

    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        detectorRef.current = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        scanLoop()
      } catch {
        if (!cancelled) setState('error')
      }
    }

    function scanLoop() {
      if (cancelled || !videoRef.current || !detectorRef.current) return

      detectorRef.current.detect(videoRef.current).then(async (barcodes) => {
        if (cancelled || barcodes.length === 0) {
          animFrameRef.current = requestAnimationFrame(scanLoop)
          return
        }

        const barcode = barcodes[0].rawValue
        stopCamera()
        await lookupBarcode(barcode)
      }).catch(() => {
        if (!cancelled) animFrameRef.current = requestAnimationFrame(scanLoop)
      })
    }

    start()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [])

  function stopCamera() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function lookupBarcode(barcode: string) {
    setState('loading')
    try {
      const res = await fetch(`/api/nutrition/scan?barcode=${encodeURIComponent(barcode)}`)
      if (res.status === 404) { setState('not-found'); return }
      if (!res.ok) throw new Error('Lookup failed')
      const data = await res.json()
      setProduct(data.product)
      setState('found')
    } catch {
      setState('error')
      setErrorMsg('Could not look up that barcode. Try again.')
    }
  }

  async function handleManualLookup() {
    if (!manualBarcode.trim()) return
    stopCamera()
    await lookupBarcode(manualBarcode.trim())
  }

  // If product found, hand off to PortionPicker
  if (state === 'found' && product) {
    return (
      <PortionPicker
        product={product}
        date={date}
        onAdded={(log) => { onAdded(log) }}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-text-primary">Scan Barcode</h2>
            <button onClick={() => { stopCamera(); onClose() }} className="text-text-secondary hover:text-text-primary text-xl leading-none">×</button>
          </div>

          {state === 'scanning' && (
            <>
              <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-24 border-2 border-brand rounded-lg" />
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center">Point the camera at a product barcode</p>
            </>
          )}

          {state === 'loading' && (
            <div className="py-8 text-center">
              <p className="text-text-secondary text-sm">Looking up product…</p>
            </div>
          )}

          {state === 'not-found' && (
            <div className="py-6 text-center">
              <p className="text-lg mb-1">😕</p>
              <p className="text-text-primary font-semibold text-sm mb-1">Product not found</p>
              <p className="text-text-secondary text-xs mb-4">This product isn&apos;t in Open Food Facts yet.</p>
              <button
                onClick={() => setState('scanning')}
                className="text-brand text-sm underline"
              >
                Try scanning again
              </button>
            </div>
          )}

          {(state === 'error' || state === 'unsupported') && (
            <div className="py-4">
              {state === 'unsupported' && (
                <p className="text-xs text-text-secondary mb-3 text-center">
                  Camera scanning isn&apos;t supported in this browser. Enter the barcode number manually.
                </p>
              )}
              {state === 'error' && errorMsg && (
                <p className="text-xs text-red-400 mb-3 text-center">{errorMsg}</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  className="flex-1 bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualLookup() }}
                />
                <button
                  onClick={handleManualLookup}
                  className="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

Note: `BarcodeDetector` is not in TypeScript's default lib types. Add a declaration to fix this:

- [ ] **Step 2: Add BarcodeDetector type declaration**

Create `src/types/barcode-detector.d.ts`:

```typescript
// src/types/barcode-detector.d.ts
// Type stub for the native BarcodeDetector Web API
// Not yet in TypeScript's built-in lib types

interface BarcodeDetectorOptions {
  formats?: string[]
}

interface DetectedBarcode {
  rawValue: string
  format: string
  boundingBox: DOMRectReadOnly
  cornerPoints: ReadonlyArray<{ x: number; y: number }>
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  detect(image: ImageBitmapSource | HTMLVideoElement): Promise<DetectedBarcode[]>
  static getSupportedFormats(): Promise<string[]>
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: no errors. If you see a TS error about `BarcodeDetector`, check that `src/types/barcode-detector.d.ts` was saved correctly and that `tsconfig.json` includes `"src"` in the `include` array (it should by default in Next.js).

- [ ] **Step 4: Commit**

```bash
git add src/components/nutrition/BarcodeScanner.tsx src/types/barcode-detector.d.ts
git commit -m "feat: add BarcodeScanner component with Open Food Facts lookup"
```

---

## Task 11: Date Navigation in NutritionPage

The spec requires left/right arrows so members can browse past days. When the selected date changes, the client fetches the log for that date from the API route.

**Files:**
- This logic is baked into `src/components/nutrition/NutritionPage.tsx` (written in Task 11 below)

The date state lives in `NutritionPage`. On date change, it calls `GET /api/nutrition/log?date=YYYY-MM-DD` to fetch that day's log. No extra files needed.

---

## Task 11: NutritionPage Client Component

**Files:**
- Create: `src/components/nutrition/NutritionPage.tsx`

This is the main client component that wires together DailyGrid, LogModal, BarcodeScanner, and WeeklyChart.

- [ ] **Step 1: Create the NutritionPage component**

This component owns the date state and fetches the log for past days via the API route.

```typescript
// src/components/nutrition/NutritionPage.tsx
'use client'

import { useState } from 'react'
import type { NutritionLog, NutritionTargets, WeekDay } from '@/types/nutrition'
import { DEFAULT_TARGETS } from '@/types/nutrition'
import DailyGrid from './DailyGrid'
import LogModal from './LogModal'
import BarcodeScanner from './BarcodeScanner'
import WeeklyChart from './WeeklyChart'

type Props = {
  initialLog: NutritionLog | null
  yesterdayLog: NutritionLog | null  // used to pre-fill LogModal when today is empty
  targets: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'>
  weekDays: WeekDay[]
  today: string  // 'YYYY-MM-DD'
}

type Modal = 'none' | 'log' | 'scan'

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T12:00:00Z')
  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setUTCDate(today.getUTCDate() - 1)

  if (date === today.toISOString().split('T')[0]) return 'Today'
  if (date === yesterday.toISOString().split('T')[0]) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function NutritionPage({ initialLog, yesterdayLog, targets, weekDays, today }: Props) {
  const [selectedDate, setSelectedDate] = useState(today)
  const [log, setLog] = useState<NutritionLog | null>(initialLog)
  const [loadingDate, setLoadingDate] = useState(false)
  const [modal, setModal] = useState<Modal>('none')
  const t = targets ?? DEFAULT_TARGETS

  const isToday = selectedDate === today

  async function navigateDate(direction: -1 | 1) {
    const d = new Date(selectedDate + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + direction)
    const newDate = d.toISOString().split('T')[0]

    // Don't navigate into the future
    if (newDate > today) return

    setSelectedDate(newDate)
    setLoadingDate(true)
    setLog(null)

    try {
      const res = await fetch(`/api/nutrition/log?date=${newDate}`)
      const data = await res.json()
      setLog(data.log)
    } catch {
      setLog(null)
    } finally {
      setLoadingDate(false)
    }
  }

  function handleSaved(updated: NutritionLog) {
    setLog(updated)
    setModal('none')
  }

  // Pre-fill LogModal with yesterday's values if today has no log yet
  const modalPrefill = log ?? (isToday ? yesterdayLog : null)

  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-1">Nutrition</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95]">
          Daily<br />
          <span className="text-brand">Tracker</span>
        </h1>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Previous day"
        >
          ←
        </button>
        <span className="text-sm font-medium text-text-primary">
          {loadingDate ? '…' : formatDateLabel(selectedDate)}
        </span>
        <button
          onClick={() => navigateDate(1)}
          disabled={isToday}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30"
          aria-label="Next day"
        >
          →
        </button>
      </div>

      {/* Daily grid */}
      <div className="mb-4">
        <DailyGrid log={log} targets={t} />
      </div>

      {/* Log buttons — only show for today */}
      {isToday && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setModal('log')}
            className="bg-brand text-white font-semibold py-3.5 rounded-xl text-sm hover:bg-brand/90 transition-colors"
          >
            + Log Manually
          </button>
          <button
            onClick={() => setModal('scan')}
            className="bg-bg-card border border-border-light text-text-primary font-semibold py-3.5 rounded-xl text-sm hover:border-brand/50 transition-colors"
          >
            📷 Scan Barcode
          </button>
        </div>
      )}

      {/* Weekly chart */}
      <WeeklyChart days={weekDays} targetCalories={t.calories} />

      {/* Education link */}
      <p className="text-xs text-text-secondary mt-4 text-center">
        Want to learn more?{' '}
        <a href="/education" className="text-brand underline">
          Visit the Nutrition Hub →
        </a>
      </p>

      {/* Modals */}
      {modal === 'log' && (
        <LogModal
          currentLog={modalPrefill}
          date={selectedDate}
          onSaved={handleSaved}
          onClose={() => setModal('none')}
        />
      )}
      {modal === 'scan' && (
        <BarcodeScanner
          date={selectedDate}
          onAdded={handleSaved}
          onClose={() => setModal('none')}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nutrition/NutritionPage.tsx
git commit -m "feat: add NutritionPage client component"
```

---

## Task 12: Nutrition Page Route

**Files:**
- Create: `src/app/(member)/nutrition/page.tsx`

- [ ] **Step 1: Create the server component page**

```typescript
// src/app/(member)/nutrition/page.tsx

import { cookies } from 'next/headers'
import { fetchTargets, fetchDayLog, fetchWeekLogs, todayISO } from '@/lib/nutrition-queries'
import { DEFAULT_TARGETS } from '@/types/nutrition'
import NutritionPage from '@/components/nutrition/NutritionPage'

export default async function NutritionRoute() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''
  const today = todayISO()

  // Yesterday's date for pre-filling the log modal
  const yesterdayDate = (() => {
    const d = new Date(today + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  const [targets, log, yesterdayLog, weekDays] = await Promise.all([
    memberId ? fetchTargets(memberId) : Promise.resolve(null),
    memberId ? fetchDayLog(memberId, today) : Promise.resolve(null),
    memberId ? fetchDayLog(memberId, yesterdayDate) : Promise.resolve(null),
    memberId ? fetchWeekLogs(memberId) : Promise.resolve([]),
  ])

  return (
    <NutritionPage
      initialLog={log}
      yesterdayLog={yesterdayLog}
      targets={targets ?? DEFAULT_TARGETS}
      weekDays={weekDays}
      today={today}
    />
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: Manual test the nutrition page**

With the dev server running and logged in as demo, navigate to `http://localhost:3000/nutrition`.

Expected:
- Page loads with the "Daily Tracker" heading
- 2×2 grid shows 0 for all metrics (demo has no logs)
- "Log Manually" and "Scan Barcode" buttons are visible
- Weekly chart shows 7 empty bars

Click "Log Manually":
- Modal appears with 4 input fields
- Enter: calories 1800, protein 140, carbs 180, fats 60
- Click Save
- Grid updates immediately with the new values (no page reload)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(member\)/nutrition/page.tsx
git commit -m "feat: add nutrition page route"
```

---

## Task 13: Dashboard Nutrition Card

**Files:**
- Create: `src/components/dashboard/NutritionCard.tsx`
- Modify: `src/app/(member)/dashboard/page.tsx`

- [ ] **Step 1: Create the NutritionCard component**

```typescript
// src/components/dashboard/NutritionCard.tsx

import Link from 'next/link'
import type { NutritionLog, NutritionTargets } from '@/types/nutrition'
import { DEFAULT_TARGETS } from '@/types/nutrition'

type Props = {
  log: NutritionLog | null
  targets: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'>
}

export default function NutritionCard({ log, targets }: Props) {
  const t = targets ?? DEFAULT_TARGETS
  const calories = log?.calories ?? 0
  const pct = Math.min(100, Math.round((calories / t.calories) * 100))
  const hasLogged = log !== null

  return (
    <Link
      href="/nutrition"
      className="group bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden hover:border-brand/40 transition-colors block"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <div className="p-5">
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand mb-3">Nutrition</p>

        {hasLogged ? (
          <>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="font-display text-3xl text-text-primary leading-none">
                {calories.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary">/ {t.calories.toLocaleString()} kcal</span>
            </div>
            <div className="h-1.5 bg-bg-main rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex gap-3 text-xs text-text-secondary">
              <span>P: {log.protein_g}g</span>
              <span>C: {log.carbs_g}g</span>
              <span>F: {log.fats_g}g</span>
            </div>
          </>
        ) : (
          <div>
            <p className="text-text-secondary text-sm mb-2">Nothing logged today</p>
            <p className="text-brand text-xs font-medium group-hover:underline">Log your nutrition →</p>
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Add NutritionCard to the dashboard page**

Open `src/app/(member)/dashboard/page.tsx`. Find the existing imports at the top and add:

```typescript
import NutritionCard from '@/components/dashboard/NutritionCard'
import { fetchTargets, fetchDayLog, todayISO } from '@/lib/nutrition-queries'
```

In the `DashboardPage` function body, add a nutrition data fetch alongside the existing fetches:

```typescript
// Nutrition — today's log and targets (best-effort)
let nutritionLog = null
let nutritionTargets = null
if (gymMasterId && gymMasterId !== 'DEMO') {
  try {
    const today = todayISO()
    ;[nutritionLog, nutritionTargets] = await Promise.all([
      fetchDayLog(gymMasterId, today),
      fetchTargets(gymMasterId),
    ])
  } catch {
    // silently ignore — nutrition card degrades gracefully
  }
}
```

Then in the JSX, add `<NutritionCard>` inside the grid section. Find the grid with `className="grid grid-cols-1 md:grid-cols-2 gap-4"` and add the card alongside the existing cards:

```tsx
<NutritionCard
  log={nutritionLog}
  targets={nutritionTargets ?? DEFAULT_TARGETS}
/>
```

Also add the import for DEFAULT_TARGETS at the top:
```typescript
import { DEFAULT_TARGETS } from '@/types/nutrition'
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 4: Manual test the dashboard card**

Navigate to `http://localhost:3000/dashboard`. Expected:
- A "Nutrition" card appears in the grid
- For demo user (DEMO id), the card shows "Nothing logged today"
- Clicking the card navigates to `/nutrition`

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/NutritionCard.tsx src/app/\(member\)/dashboard/page.tsx
git commit -m "feat: add nutrition summary card to dashboard"
```

---

## Task 14: End-to-End Manual Test

No automated tests are set up. Run through the full member flow manually.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Log in as demo**

Navigate to `http://localhost:3000/demo-login` and enter the passphrase `numberone-demo`.

- [ ] **Step 3: Test manual logging**

1. Click "Nutrition" in the sidebar — page loads with zeros in the grid
2. Click "+ Log Manually" — modal opens with empty fields
3. Enter: calories `1800`, protein `140`, carbs `180`, fats `60`
4. Click Save — modal closes, grid updates immediately
5. Refresh the page — values persist (loaded from Supabase)

- [ ] **Step 4: Test barcode scanning (mobile or Chrome desktop)**

1. On a phone or in Chrome, navigate to the nutrition page
2. Click "📷 Scan Barcode"
3. Allow camera access when prompted
4. Point at a UK supermarket product barcode (Tesco, Sainsbury's, etc.)
5. Product info appears with name, brand, and nutrition per 100g
6. Select "1 serving" or enter custom grams
7. Click "+ Add to Today" — modal closes, calorie grid increments

- [ ] **Step 5: Test barcode fallback**

1. Click "📷 Scan Barcode" in Firefox (which doesn't support BarcodeDetector)
2. Should show "Camera scanning isn't supported in this browser"
3. Enter a barcode manually: `5000112637922`
4. Click Go — product appears for portion selection

- [ ] **Step 6: Test dashboard card**

1. Navigate to `/dashboard`
2. Nutrition card shows today's logged calories and a progress bar
3. Click card — navigates to `/nutrition`

- [ ] **Step 7: Final build check**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 8: Commit and push**

```bash
git push
```

---

## What's Next

- **Plan 2:** Coach nutrition view — target setting in staff hub, weekly adherence chart, daily drill-down per member
- **Plan 3:** Intermittent Fasting feature — educational recommendations, schedule setup, iCal feed, push notifications
