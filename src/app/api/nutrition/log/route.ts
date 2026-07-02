// src/app/api/nutrition/log/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upsertDayLog, fetchDayLog, addLogItem, todayISO } from '@/lib/nutrition-queries'

// GET /api/nutrition/log?date=YYYY-MM-DD
// Returns the log for the given date (or today if omitted), or null
export async function GET(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  if (!memberId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? todayISO()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  const log = await fetchDayLog(memberId, date)
  return NextResponse.json({ log })
}

// POST /api/nutrition/log
// Body option A: { date, calories, protein_g, carbs_g, fats_g } — upsert daily totals (manual entry)
// Body option B: { date, item: { name, calories, protein_g, carbs_g, fats_g, quantity_g, barcode, source } } — add a log item (barcode scan)
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayISO()) {
    return NextResponse.json({ error: 'Invalid or future date' }, { status: 400 })
  }

  // Branch: adding an individual item (barcode scan)
  if (body.item) {
    const rawItem = body.item as Record<string, unknown>

    if (
      typeof rawItem.name !== 'string' || !rawItem.name.trim() ||
      typeof rawItem.calories !== 'number' || !isFinite(rawItem.calories) ||
      typeof rawItem.protein_g !== 'number' || !isFinite(rawItem.protein_g) ||
      typeof rawItem.carbs_g !== 'number' || !isFinite(rawItem.carbs_g) ||
      typeof rawItem.fats_g !== 'number' || !isFinite(rawItem.fats_g) ||
      typeof rawItem.quantity_g !== 'number' || !isFinite(rawItem.quantity_g) ||
      (rawItem.source !== 'barcode' && rawItem.source !== 'manual')
    ) {
      return NextResponse.json({ error: 'Invalid item fields' }, { status: 400 })
    }

    const item = {
      name:      rawItem.name as string,
      calories:  rawItem.calories as number,
      protein_g: rawItem.protein_g as number,
      carbs_g:   rawItem.carbs_g as number,
      fats_g:    rawItem.fats_g as number,
      quantity_g: rawItem.quantity_g as number,
      barcode:   (rawItem.barcode as string | null) ?? null,
      source:    rawItem.source as 'barcode' | 'manual',
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
    calories?: unknown
    protein_g?: unknown
    carbs_g?: unknown
    fats_g?: unknown
  }

  if (
    typeof calories !== 'number' || !isFinite(calories) ||
    typeof protein_g !== 'number' || !isFinite(protein_g) ||
    typeof carbs_g !== 'number' || !isFinite(carbs_g) ||
    typeof fats_g !== 'number' || !isFinite(fats_g)
  ) {
    return NextResponse.json({ error: 'calories, protein_g, carbs_g, fats_g must be finite numbers' }, { status: 400 })
  }

  try {
    const log = await upsertDayLog(memberId, date, { calories, protein_g, carbs_g, fats_g })
    return NextResponse.json({ log }, { status: 201 })
  } catch (err) {
    console.error('[nutrition log POST]', err)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}
