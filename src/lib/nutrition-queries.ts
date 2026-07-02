// src/lib/nutrition-queries.ts
// All functions use the anon Supabase client.
// Call these from server components and API routes only.

import { createClient } from '@supabase/supabase-js'
import type { NutritionTargets, NutritionLog, NutritionLogItem, WeekDay } from '@/types/nutrition'
import { DEFAULT_TARGETS } from '@/types/nutrition'

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

  return data ?? DEFAULT_TARGETS
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

  // Upsert the daily log to avoid race conditions on concurrent requests
  const { data: logRow, error: logError } = await supabase
    .from('nutrition_logs')
    .upsert(
      { gymmaster_member_id: gymMasterId, date, calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
      { onConflict: 'gymmaster_member_id,date', ignoreDuplicates: true },
    )
    .select('id, calories, protein_g, carbs_g, fats_g')
    .single()

  if (logError) throw new Error(logError.message)
  const logId = logRow.id
  const current = { calories: logRow.calories, protein_g: logRow.protein_g, carbs_g: logRow.carbs_g, fats_g: logRow.fats_g }

  // Insert the item
  const { error: itemError } = await supabase
    .from('nutrition_log_items')
    .insert({ log_id: logId, ...item })

  if (itemError) throw new Error(itemError.message)

  // Update daily totals
  const { error: updateError } = await supabase
    .from('nutrition_logs')
    .update({
      calories:  current.calories  + item.calories,
      protein_g: current.protein_g + item.protein_g,
      carbs_g:   current.carbs_g   + item.carbs_g,
      fats_g:    current.fats_g    + item.fats_g,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId)

  if (updateError) throw new Error(updateError.message)
}
