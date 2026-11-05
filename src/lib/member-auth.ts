// Who is this member? Decided on the server from the httpOnly GymMaster token
// (checked with GymMaster), never from the readable `gymmaster_member_id`
// cookie, which anyone can change. Use for any route that touches private data.
//
// Returns null for no token, a token GymMaster rejects, or the demo login
// (its fake token never verifies, so the demo user cannot save private data).

import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { verifyMemberToken } from '@/lib/gymmaster'

const TTL_MS = 60_000
const cache = new Map<string, { memberId: string | null; at: number }>()

/** Same answer as verifyMemberToken, remembered for a minute per server instance. */
export async function memberIdForToken(
  token: string | undefined,
  verify: (t: string) => Promise<string | null> = verifyMemberToken,
  now: number = Date.now(),
): Promise<string | null> {
  if (!token) return null
  // Keyed by a hash so the raw token is never held as a map key.
  const key = createHash('sha256').update(token).digest('hex')
  const hit = cache.get(key)
  if (hit && now - hit.at < TTL_MS) return hit.memberId
  const memberId = await verify(token)
  if (cache.size > 500) cache.clear()
  cache.set(key, { memberId, at: now })
  return memberId
}

export function clearMemberAuthCache() {
  cache.clear()
}

/** The signed-in member's id, verified with GymMaster, or null. */
export async function verifiedMemberId(): Promise<string | null> {
  const jar = await cookies()
  return memberIdForToken(jar.get('gymmaster_token')?.value)
}
