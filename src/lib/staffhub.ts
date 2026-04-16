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
 * Check if a member has already signed up for a challenge.
 */
export async function isMemberSignedUp(challengeId: string, gymMasterId: string): Promise<boolean> {
  if (!STAFFHUB_URL || !STAFFHUB_ANON_KEY) return false
  try {
    const { data, error } = await staffHubReader
      .from('challenge_signups')
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
