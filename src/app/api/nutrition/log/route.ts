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
