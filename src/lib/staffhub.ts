// =============================================
// Staff Hub Supabase clients
//
// staffHubReader — anon key, safe for server components
// staffHubWriter — service role key, API routes ONLY
//
// Both are server-side only — never import in 'use client' components.
// =============================================

import { createClient } from '@supabase/supabase-js'

const STAFFHUB_URL = process.env.STAFFHUB_SUPABASE_URL ?? ''
const STAFFHUB_ANON_KEY = process.env.STAFFHUB_SUPABASE_ANON_KEY ?? ''
const STAFFHUB_SERVICE_KEY = process.env.STAFFHUB_SUPABASE_SERVICE_ROLE_KEY ?? ''

/** Read-only client — use in Server Components to fetch events and challenges */
export const staffHubReader = createClient(STAFFHUB_URL, STAFFHUB_ANON_KEY, {
  auth: { persistSession: false },
})

/** Write client — use ONLY in /api route handlers to record sign-ups */
export const staffHubWriter = createClient(STAFFHUB_URL, STAFFHUB_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Shared types ──────────────────────────────────────────────────────────────

export type StaffHubEvent = {
  id: string
  title: string
  description: string | null
  event_type: string
  start_date: string
  end_date: string | null
  expires_at: string | null
}

export type StaffHubChallenge = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  signup_deadline: string | null
  how_to_signup: string | null
  is_active: boolean
}

export type StaffHubAward = {
  id: string
  month: string           // ISO date string, first of month e.g. '2026-04-01'
  award_type: 'athlete_of_month' | 'commitment_club'
  member_name: string
  reason: string | null
  created_at: string
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch announcements that haven't expired yet.
 * Used by AnnouncementBanner on the dashboard.
 */
export async function fetchAnnouncements(): Promise<StaffHubEvent[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await staffHubReader
      .from('events')
      .select('id, title, description, event_type, start_date, end_date, expires_at')
      .eq('event_type', 'announcement')
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order('start_date', { ascending: false })
    if (error) {
      console.warn('[StaffHub] fetchAnnouncements failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchAnnouncements threw:', err)
    return []
  }
}

/**
 * Fetch upcoming gym events (excludes announcements and challenges).
 * Used by GymEvents widget on the dashboard.
 */
export async function fetchGymEvents(): Promise<StaffHubEvent[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await staffHubReader
      .from('events')
      .select('id, title, description, event_type, start_date, end_date, expires_at')
      .not('event_type', 'in', '("announcement","challenge")')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(5)
    if (error) {
      console.warn('[StaffHub] fetchGymEvents failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchGymEvents threw:', err)
    return []
  }
}

/**
 * Fetch active challenges.
 * Used by ChallengesPreview on the dashboard and Community page.
 */
export async function fetchChallenges(limit = 3): Promise<StaffHubChallenge[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('challenges')
      .select('id, name, description, start_date, end_date, signup_deadline, how_to_signup, is_active')
      .eq('is_active', true)
      .order('start_date', { ascending: true })
      .limit(limit)
    if (error) {
      console.warn('[StaffHub] fetchChallenges failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchChallenges threw:', err)
    return []
  }
}

/**
 * Fetch a single challenge by ID.
 * Used by challenge detail page.
 */
export async function fetchChallenge(id: string): Promise<StaffHubChallenge | null> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return null
  try {
    const { data, error } = await staffHubReader
      .from('challenges')
      .select('id, name, description, start_date, end_date, signup_deadline, how_to_signup, is_active')
      .eq('id', id)
      .single()
    if (error) {
      console.warn('[StaffHub] fetchChallenge failed:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[StaffHub] fetchChallenge threw:', err)
    return null
  }
}

/**
 * Fetch recent awards from Staff Hub — shown as a noticeboard on the Members Area dashboard.
 * Returns up to `limit` most recent awards ordered by month descending.
 */
export async function fetchAwards(limit = 6): Promise<StaffHubAward[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('member_awards')
      .select('id, month, award_type, member_name, reason, created_at')
      .order('month', { ascending: false })
      .order('award_type', { ascending: true })
      .limit(limit)
    if (error) {
      console.warn('[StaffHub] fetchAwards failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchAwards threw:', err)
    return []
  }
}

/**
 * Check if a member has already signed up for a challenge.
 */
export async function isMemberSignedUp(challengeId: string, gymMasterId: string): Promise<boolean> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return false
  try {
    // Check challenge_participants — the table staff see — not just challenge_signups.
    // This means a member who signed up before migrations ran (stuck in signups-only state)
    // will see the Sign Up button again and can recover.
    const { data, error } = await staffHubReader
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('gymmaster_member_id', gymMasterId)
      .maybeSingle()
    if (error) {
      console.warn('[StaffHub] isMemberSignedUp failed:', error.message)
      return false
    }
    return data !== null
  } catch (err) {
    console.warn('[StaffHub] isMemberSignedUp threw:', err)
    return false
  }
}

export type InBodyScan = {
  id: string
  gymmaster_member_id: string
  scan_date: string      // 'YYYY-MM-DD'
  weight: number | null
  smm: number | null
  bf_pct: number | null
  bf_mass: number | null
  member_name: string | null
  notes: string | null
  created_at: string
}

/**
 * Fetch InBody scan history for a single member, newest first.
 * Used by the member body-composition page.
 */
export async function fetchMemberScans(gymMasterId: string): Promise<InBodyScan[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('inbody_scans')
      .select('id, gymmaster_member_id, scan_date, weight, smm, bf_pct, bf_mass, member_name, notes, created_at')
      .eq('gymmaster_member_id', gymMasterId)
      .order('scan_date', { ascending: false })
    if (error) {
      console.warn('[StaffHub] fetchMemberScans failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchMemberScans threw:', err)
    return []
  }
}

/**
 * Fetch the most recent InBody scans across all members.
 * Used by the coach InBody input page to show recent activity.
 */
export async function fetchRecentScans(limit = 20): Promise<InBodyScan[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('inbody_scans')
      .select('id, gymmaster_member_id, scan_date, weight, smm, bf_pct, bf_mass, member_name, notes, created_at')
      .order('scan_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      console.warn('[StaffHub] fetchRecentScans failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchRecentScans threw:', err)
    return []
  }
}

export type StrengthResult = {
  id: string
  gymmaster_member_id: string
  exercise: string
  result_value: number
  result_notes: string | null
  tested_date: string   // 'YYYY-MM-DD'
  created_at: string
}

/**
 * Fetch all strength results for a single member, newest first.
 * Used by the strength & conditioning results page.
 */
export async function fetchMemberStrengthResults(gymMasterId: string): Promise<StrengthResult[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('strength_results')
      .select('id, gymmaster_member_id, exercise, result_value, result_notes, tested_date, created_at')
      .eq('gymmaster_member_id', gymMasterId)
      .order('tested_date', { ascending: false })
    if (error) {
      console.warn('[StaffHub] fetchMemberStrengthResults failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchMemberStrengthResults threw:', err)
    return []
  }
}

export type MemberEvent = {
  id: string
  gymmaster_member_id: string
  member_name: string
  event_name: string
  event_date: string   // ISO date 'YYYY-MM-DD'
  created_at: string
}

/**
 * Fetch upcoming events for a single member, ordered by event date ascending.
 * Used by the EventPlanner server component on the Goals page.
 */
export async function fetchMemberEvents(gymMasterId: string): Promise<MemberEvent[]> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return []
  try {
    const { data, error } = await staffHubReader
      .from('member_events')
      .select('id, gymmaster_member_id, member_name, event_name, event_date, created_at')
      .eq('gymmaster_member_id', gymMasterId)
      .order('event_date', { ascending: true })
    if (error) {
      console.warn('[StaffHub] fetchMemberEvents failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[StaffHub] fetchMemberEvents threw:', err)
    return []
  }
}
