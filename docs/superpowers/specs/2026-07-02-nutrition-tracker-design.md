# Nutrition Tracker & Intermittent Fasting — Design Spec
*Date: 2026-07-02*

---

## Overview

A built-in nutrition tracking feature for the Number One HSP members area, giving members a fast and easy way to log daily calories and macros, with full coach visibility into adherence and trends. Includes an intermittent fasting (IF) module with goal-based recommendations, calendar sync, and push notifications.

---

## Goals

- Members can log daily nutrition quickly (manual entry or barcode scan)
- Coaches can set per-member calorie and macro targets
- Coaches can view daily summaries, weekly trends, and full log detail per member
- Members can set up and track an IF schedule with calendar and notification reminders
- The feature links naturally into the existing nutrition education modules

---

## Non-Goals

- No integration with MyFitnessPal (public API was shut down in 2020)
- No social or community sharing of nutrition data
- No AI-generated meal plans (out of scope for this phase)

---

## Architecture

### Tech stack
- **Framework:** Next.js 14+ (existing)
- **Database:** Supabase (existing)
- **Food database:** Open Food Facts API (free, open source, excellent UK coverage)
- **Barcode scanning:** `BarcodeDetector` Web API (native browser support, no library required)
- **Calendar sync:** iCal subscription URL (`.ics` feed, works with Google Calendar, Apple Calendar, Outlook)
- **Push notifications:** Web Push API via Supabase Edge Functions

### New pages (members area)
- `/nutrition` — daily tracker, barcode scanner, weekly chart, IF status
- `/nutrition/fasting` — IF setup and schedule management

### New pages (staff hub)
- Member profile → Nutrition tab — coach view: targets, weekly chart, daily drill-down

### New Supabase tables

**`nutrition_targets`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `member_id` | uuid | FK → members |
| `calories` | int | daily kcal target |
| `protein_g` | int | grams |
| `carbs_g` | int | grams |
| `fats_g` | int | grams |
| `if_method` | text | Coach's recommendation: `16:8`, `14:10`, `5:2`, or `none`. This is what the member sees as the suggested method — separate from their active `fasting_schedules` record. |
| `updated_at` | timestamptz | |
| `updated_by` | uuid | FK → staff (coach who set it) |

**`nutrition_logs`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `member_id` | uuid | FK → members |
| `date` | date | one row per member per day |
| `calories` | int | total for the day |
| `protein_g` | int | |
| `carbs_g` | int | |
| `fats_g` | int | |
| `updated_at` | timestamptz | |

**`nutrition_log_items`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `log_id` | uuid | FK → nutrition_logs |
| `name` | text | product name from Open Food Facts or manual |
| `calories` | int | |
| `protein_g` | decimal | |
| `carbs_g` | decimal | |
| `fats_g` | decimal | |
| `quantity_g` | decimal | portion in grams |
| `barcode` | text | EAN barcode if scanned, null if manual |
| `source` | text | `barcode`, `manual` |

**`fasting_schedules`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `member_id` | uuid | FK → members |
| `method` | text | `16:8`, `14:10`, `5:2` |
| `eating_window_start` | time | e.g. `12:00` — null for 5:2 (which uses restricted-calorie days, not a time window) |
| `eating_window_end` | time | e.g. `20:00` — null for 5:2 |
| `active` | bool | |
| `push_notifications_enabled` | bool | |
| `ical_token` | uuid | unique token for iCal URL |

---

## Member Experience

### Daily nutrition page (`/nutrition`)

**Layout:** 2×2 grid showing calories, protein, carbs, fats — each tile displays the logged amount, the target, and a small progress bar.

**Date navigation:** Left/right arrows to browse past days. Defaults to today.

**Logging:**
- **"+ Log Manually"** button — opens a modal with four number fields (calories, protein, carbs, fats). Pre-fills with yesterday's values to speed up entry. Saves on submit, updates grid instantly.
- **"📷 Scan Barcode"** button — opens camera via `BarcodeDetector` API. On successful scan, queries Open Food Facts API by EAN barcode. Returns product name and nutrition per 100g. Member selects portion (serving size from label, or custom grams). Nutritional values are calculated and added to `nutrition_log_items`, daily totals updated in `nutrition_logs`.

**Weekly bar chart:** Below the daily grid, a 7-day bar chart shows calorie intake vs. target for the current week. Bars colour-coded: teal = on/under target, red = over target, dark = not logged. Shows average and days-logged count.

**IF status indicator:** If the member has an active fasting schedule, a small status pill shows "🔴 Fasting" or "🟢 Eating window open" with time remaining.

**Education link:** Subtle link to the Nutrition Hub education section at the bottom of the page.

---

## Barcode Scanner

Uses the native `BarcodeDetector` Web API — no third-party library. Opens the device camera, detects EAN-13 barcodes, and queries:

```
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

Returns product name, brand, and nutrition per 100g. Member selects portion:
- **Serving size** — uses `serving_size` from the product data (default)
- **Custom (g)** — member types a weight, values are calculated proportionally

The scanned item is saved to `nutrition_log_items` with `source: 'barcode'` and the EAN barcode stored for reference. Daily totals in `nutrition_logs` are updated accordingly.

---

## Intermittent Fasting (`/nutrition/fasting`)

### Educational layer
On first visit, the member answers:
1. What is your primary goal? (Weight loss / Muscle gain / General health)
2. How many days per week do you want to fast?

Based on answers, a recommended IF method is shown:

| Goal | Recommended method |
|------|-------------------|
| Weight loss | 16:8 — fast 16hrs, eat 8hrs |
| Muscle gain | 14:10 — fast 14hrs, eat 10hrs |
| General health | 5:2 — 2 restricted days/week |

A short explanation is displayed alongside a direct link to **Module 4: Intermittent Fasting** in the education hub.

### Active scheduling layer
Member sets their eating window (e.g. 12:00–20:00). This creates a `fasting_schedules` record.

**iCal sync:** A unique subscription URL is generated:
```
/api/nutrition/fasting/ical/{ical_token}
```
This endpoint returns a `.ics` feed with recurring eating window events. Member taps "Add to Google / Apple Calendar" — a deep-link pre-fills the subscription URL in their calendar app. Events update automatically if the schedule changes.

**Push notifications:** Member grants browser notification permission. A Supabase Edge Function runs on a schedule, sending Web Push notifications:
- When the eating window opens: *"Your eating window is now open 🍽"*
- When the eating window closes: *"Eating window closed — great work today 💪"*

---

## Coach View (Staff Hub — Member Profile → Nutrition Tab)

### Target setting
Coach sets per-member targets via four input fields: daily calories, protein (g), carbs (g), fats (g). A **macro calorie check** auto-calculates whether the macro totals align with the calorie target (protein × 4 + carbs × 4 + fats × 9), flagging any large discrepancy.

**Quick presets** — one-click options based on the member's goal:
- Moderate Deficit (~500 kcal below maintenance)
- Mild Deficit (~250 kcal below maintenance)
- Maintenance

Presets pre-fill the fields; the coach can adjust before saving.

Coach also selects the **recommended IF method** for the member from a dropdown. This appears as the recommendation in the member's IF tab.

Targets take effect immediately on save.

### Coach monitoring view
- **Weekly bar chart** — 7-day calorie intake vs. target, colour-coded (teal/red/grey)
- **Adherence badge** — "X/7 days logged this week"
- **Daily breakdown** — list of days, collapsed by default. Click any day to expand full macro detail (calories, protein, carbs, fats vs. targets) plus a list of individual logged items (scanned or manual)

---

## Phased Rollout

### Phase 1 (this spec)
- Manual daily logging
- Barcode scanner via Open Food Facts
- Weekly chart and coach view
- Coach target setting
- IF recommendations, scheduling, iCal sync, push notifications

### Phase 2 (future)
- Full food search by name via Open Food Facts API
- Members can browse/search the database without needing a barcode
- Builds on Phase 1 data model — `nutrition_log_items` table already supports this

---

## Integration with Existing Features

- **Education hub:** Links from the nutrition tracker and IF page into the existing Module 2 (Using MyFitnessPal as a manual reference tool), Module 3 (Macros), and Module 4 (Intermittent Fasting)
- **Member goals:** Member's primary goal (set elsewhere) informs the IF method recommendation
- **Dashboard:** A small nutrition summary card on the member dashboard shows today's calorie progress and prompts logging if nothing has been logged yet

---

## Open Questions / Future Considerations

- Should members be able to log water intake alongside macros?
- Should coaches be notified if a member hasn't logged for 3+ consecutive days?
- Phase 2 food search: consider caching frequently-scanned UK products locally in Supabase to reduce Open Food Facts API calls
