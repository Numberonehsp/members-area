// src/lib/habit-queries.ts
// All functions use the anon Supabase client. Call these from server
// components and API routes only — mirrors src/lib/nutrition-queries.ts.

import { createClient } from '@supabase/supabase-js'
import type { Habit, HabitLog, HabitCategory, HabitCadence, HabitAggregation } from '@/types/habits'

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function fetchHabits(gymMasterId: string, status: 'active' | 'archived'): Promise<Habit[]> {
  const supabase = client()
  const { data } = await supabase
    .from('member_habits')
    .select('*')
    .eq('gymmaster_member_id', gymMasterId)
    .eq('status', status)
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function countActiveHabits(gymMasterId: string): Promise<number> {
  const supabase = client()
  const { count } = await supabase
    .from('member_habits')
    .select('id', { count: 'exact', head: true })
    .eq('gymmaster_member_id', gymMasterId)
    .eq('status', 'active')

  return count ?? 0
}

export async function hasActiveHabitForMetric(gymMasterId: string, metric: string): Promise<boolean> {
  const supabase = client()
  const { count } = await supabase
    .from('member_habits')
    .select('id', { count: 'exact', head: true })
    .eq('gymmaster_member_id', gymMasterId)
    .eq('metric', metric)
    .eq('status', 'active')

  return (count ?? 0) > 0
}

export async function createHabit(gymMasterId: string, fields: {
  metric: string
  category: HabitCategory
  target: number | null
  cadence: HabitCadence
  aggregation: HabitAggregation | null
  start_date: string
  end_date: string | null
}): Promise<Habit> {
  const supabase = client()
  const { data, error } = await supabase
    .from('member_habits')
    .insert({ gymmaster_member_id: gymMasterId, ...fields, status: 'active' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function fetchHabitById(gymMasterId: string, id: string): Promise<Habit | null> {
  const supabase = client()
  const { data } = await supabase
    .from('member_habits')
    .select('*')
    .eq('id', id)
    .eq('gymmaster_member_id', gymMasterId)
    .single()

  return data ?? null
}

export async function updateHabit(
  gymMasterId: string,
  id: string,
  fields: Partial<Pick<Habit, 'target' | 'end_date' | 'status'>>
): Promise<Habit> {
  const supabase = client()
  const { data, error } = await supabase
    .from('member_habits')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('gymmaster_member_id', gymMasterId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Flips any active habit whose end_date has passed into 'archived'. Called
 * at the top of GET /api/habits so the list self-heals on every page load —
 * this is a member-facing, request-driven app with no cron, unlike the
 * sibling staff-hub repo.
 */
export async function archiveExpiredHabits(gymMasterId: string, today: string): Promise<void> {
  const supabase = client()
  await supabase
    .from('member_habits')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('gymmaster_member_id', gymMasterId)
    .eq('status', 'active')
    .lt('end_date', today)
}

export async function fetchHabitLogs(habitId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
  const supabase = client()
  const { data } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  return data ?? []
}

export async function upsertHabitLog(habitId: string, date: string, value: number): Promise<HabitLog> {
  const supabase = client()
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(
      { habit_id: habitId, date, value, updated_at: new Date().toISOString() },
      { onConflict: 'habit_id,date' }
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}
