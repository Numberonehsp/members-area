// =============================================
// GymMaster API client
// Docs: https://www.gymmaster.com/gymmaster-api/
// V3 docs: https://www.gymmasteronline.com/api/v3/doc
//
// Base URL: https://{SITE_NAME}.gymmasteronline.com/portal/api/v1/
// Auth: Portal-API-Key header (Member API key recommended per GymMaster support)
//
// Falls back to seed data when env vars are absent (local dev).
// =============================================

export type MonthlyVisits = {
  memberId: string        // gymmaster_member_id as string
  year: number
  month: number           // 1–12
  visitCount: number
  visitDates: string[]    // ISO date strings e.g. '2026-04-03'
}

// ── Seed data (used when env vars are absent) ────────────────────────────────
const today = new Date()
const SEED_VISITS: MonthlyVisits = {
  memberId: 'seed',
  year: today.getFullYear(),
  month: today.getMonth() + 1,
  visitCount: 9,
  visitDates: Array.from({ length: 9 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), i + 1)
    return d.toISOString().split('T')[0]
  }),
}

// ── Config ───────────────────────────────────────────────────────────────────
const SITE_NAME = process.env.GYMMASTER_SITE_NAME ?? ''
const MEMBER_API_KEY = process.env.GYMMASTER_MEMBER_API_KEY ?? ''
const STAFF_API_KEY = process.env.GYMMASTER_STAFF_API_KEY ?? ''

function baseUrl() {
  return `https://${SITE_NAME}.gymmasteronline.com/portal/api/v1`
}

/**
 * Authenticate a member with GymMaster.
 * Called from /api/auth/login — never exposed to the client.
 */
export async function loginMember(
  email: string,
  password: string
): Promise<{ token: string; memberid: string; expiry: string } | null> {
  if (!SITE_NAME || !MEMBER_API_KEY) return null

  // GymMaster support confirmed api_key can be passed in the request body
  // or via Portal-API-Key / X-GM-API-KEY headers. We include it in both
  // to maximise compatibility with v1 member portal endpoints.
  const res = await fetch(`${baseUrl()}/login`, {
    method: 'POST',
    headers: {
      'Portal-API-Key': MEMBER_API_KEY,
      'X-GM-API-KEY': MEMBER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, api_key: MEMBER_API_KEY }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`GymMaster login failed: ${res.status} — ${text}`)
    return null
  }

  let data: {
    error?: string | null
    result?: { token?: string; memberid?: number | string; expires?: number } | null
  }
  try {
    data = await res.json()
  } catch {
    console.error('GymMaster login: could not parse response as JSON')
    return null
  }

  // GymMaster returns 200 even on error — check the body envelope
  if (data.error || !data.result?.token || data.result?.memberid == null) {
    console.error(`GymMaster login: rejected (error="${data.error ?? 'missing token/memberid'}")`)
    return null
  }

  console.log(`[GymMaster] login OK for memberid ${data.result.memberid}`)

  return {
    token: data.result.token,
    memberid: String(data.result.memberid),
    expiry: data.result.expires ? String(data.result.expires) : '',
  }
}

export type MemberProfile = {
  memberId: string
  firstName: string
  lastName: string
  email: string
}

/**
 * Fetch the logged-in member's profile (name, email, etc.).
 * Uses the member's own GymMaster token obtained at login.
 * Returns null if no token, no site, or the request fails — caller should fall back.
 */
export async function getMemberProfile(memberToken: string): Promise<MemberProfile | null> {
  if (!SITE_NAME || !memberToken) return null

  // GymMaster support: pass token and api_key as query params
  const url = `${baseUrl()}/member/profile?token=${encodeURIComponent(memberToken)}&api_key=${encodeURIComponent(MEMBER_API_KEY)}`
  console.log(`[GymMaster] profile GET ${url.replace(memberToken, 'TOKEN').replace(MEMBER_API_KEY, 'KEY')}`)
  const res = await fetch(url, { cache: 'no-store' })

  const text = await res.text()
  console.log(`[GymMaster] profile response ${res.status}: ${text.slice(0, 500)}`)

  if (!res.ok) return null

  let data: {
    error?: string | null
    result?: Record<string, unknown> | null
  }
  try {
    data = JSON.parse(text)
  } catch {
    console.warn('GymMaster profile: could not parse response as JSON')
    return null
  }

  if (data.error || !data.result) {
    console.warn(`GymMaster profile: rejected (error="${data.error ?? 'no result'}")`)
    return null
  }

  const r = data.result
  return {
    memberId: String(r.memberid ?? r.id ?? ''),
    firstName: r.firstname ?? '',
    lastName: r.surname ?? '',
    email: r.email ?? '',
  }
}

/**
 * Fetch monthly visit count for a single member.
 * Uses the member's own GymMaster token (obtained at login).
 */
export async function getMonthlyVisits(
  gymMasterId: string | number,
  year: number,
  month: number,
  memberToken?: string
): Promise<MonthlyVisits> {
  if (!SITE_NAME || (!MEMBER_API_KEY && !memberToken)) {
    return { ...SEED_VISITS, memberId: String(gymMasterId), year, month }
  }

  // GymMaster support: /member/visits/monthly with token and api_key as query params
  const token = memberToken ?? MEMBER_API_KEY
  const url = `${baseUrl()}/member/visits/monthly?token=${encodeURIComponent(token)}&api_key=${encodeURIComponent(MEMBER_API_KEY)}`
  console.log(`[GymMaster] visits GET ${url.replace(token, 'TOKEN').replace(MEMBER_API_KEY, 'KEY')}`)

  const res = await fetch(url, { next: { revalidate: 300 } })
  const text = await res.text()
  console.log(`[GymMaster] visits response ${res.status}: ${text.slice(0, 500)}`)

  if (!res.ok) {
    console.warn(`GymMaster visits fetch failed: ${res.status} — falling back to seed`)
    return { ...SEED_VISITS, memberId: String(gymMasterId), year, month }
  }

  let data: { error?: string | null; result?: Record<string, unknown> | unknown[] | null }
  try {
    data = JSON.parse(text)
  } catch {
    console.warn('GymMaster visits: could not parse JSON — falling back to seed')
    return { ...SEED_VISITS, memberId: String(gymMasterId), year, month }
  }

  if (data.error || !data.result) {
    console.warn(`GymMaster visits: rejected (error="${data.error ?? 'no result'}")`)
    return { ...SEED_VISITS, memberId: String(gymMasterId), year, month }
  }

  // /visits/monthly returns grouped-by-month data — extract the count for the
  // requested month. The exact shape may vary; log it on first call so we can adapt.
  console.log('[GymMaster] visits/monthly result:', JSON.stringify(data.result).slice(0, 500))

  // Try to extract visit count from various possible response shapes
  let visitCount = 0
  const visitDates: string[] = []
  const r = data.result as Record<string, unknown>

  // Shape 1: array of { month: number, count: number }
  if (Array.isArray(data.result)) {
    const entry = (data.result as Array<{ month?: number; count?: number }>).find(
      (e) => e.month === month
    )
    if (entry?.count != null) visitCount = entry.count
  }
  // Shape 2: object with month numbers as keys e.g. { "4": 9 }
  else if (r[String(month)] != null) {
    visitCount = Number(r[String(month)])
  }
  // Shape 3: { visits: number } or { count: number }
  else if (typeof r.visits === 'number') {
    visitCount = r.visits
  } else if (typeof r.count === 'number') {
    visitCount = r.count
  }

  return {
    memberId: String(gymMasterId),
    year,
    month,
    visitCount,
    visitDates,
  }
}

/**
 * Fetch visit counts for ALL active members for the current month.
 * Uses the Staff API key — coach portal only.
 */
export async function getAllMemberVisitsThisMonth(): Promise<
  Array<{ gymMasterId: string; visitCount: number }>
> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  if (!SITE_NAME || !STAFF_API_KEY) {
    return [
      { gymMasterId: '1001', visitCount: 14 },
      { gymMasterId: '1002', visitCount: 12 },
      { gymMasterId: '1003', visitCount: 9 },
      { gymMasterId: '1004', visitCount: 7 },
      { gymMasterId: '1005', visitCount: 15 },
      { gymMasterId: '1006', visitCount: 3 },
    ]
  }

  const url = `${baseUrl()}/member/visits?year=${year}&month=${month}&group_by=member`

  const res = await fetch(url, {
    headers: { 'Portal-API-Key': STAFF_API_KEY },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    console.error(`GymMaster all-member visits fetch failed: ${res.status}`)
    return []
  }

  const data = await res.json()
  return (data.members ?? []).map((m: { member_id: string; count: number }) => ({
    gymMasterId: m.member_id,
    visitCount: m.count,
  }))
}
