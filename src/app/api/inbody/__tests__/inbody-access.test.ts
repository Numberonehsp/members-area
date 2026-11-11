import { describe, it, expect, vi, beforeEach } from 'vitest'

// A forged `gymmaster_member_id` cookie must never decide whose scans are
// read, written or deleted. Only the verified GymMaster token counts.

// Imports are hoisted, and staffhub.ts reads these at load time.
vi.hoisted(() => {
  process.env.STAFFHUB_SUPABASE_URL = 'https://example.test'
  process.env.STAFFHUB_SUPABASE_ANON_KEY = 'anon'
  process.env.STAFFHUB_SUPABASE_SERVICE_ROLE_KEY = 'service'
})

const verified = vi.hoisted(() => ({ id: null as string | null }))
const calls = vi.hoisted(() => ({
  upserts: [] as unknown[],
  deleteFilters: [] as Array<[string, unknown]>,
  selectEq: [] as Array<[string, unknown]>,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === 'gymmaster_member_id' ? { value: 'FORGED-999' } : undefined,
  })),
}))
vi.mock('@/lib/member-auth', () => ({ verifiedMemberId: vi.fn(async () => verified.id) }))

vi.mock('@supabase/supabase-js', () => {
  const builder = () => {
    const b: Record<string, unknown> = {}
    b.upsert = (row: unknown) => {
      calls.upserts.push(row)
      return Promise.resolve({ error: null })
    }
    b.delete = () => {
      const d: Record<string, unknown> = {}
      d.eq = (col: string, val: unknown) => {
        calls.deleteFilters.push([col, val])
        // chainable and awaitable
        return Object.assign(Promise.resolve({ error: null }), d)
      }
      return d
    }
    b.select = () => {
      const q: Record<string, unknown> = {}
      q.eq = (col: string, val: unknown) => {
        calls.selectEq.push([col, val])
        return q
      }
      q.order = () => q
      q.limit = () => q
      q.then = (res: (v: unknown) => unknown) => res({ data: [], error: null })
      return q
    }
    return b
  }
  return { createClient: () => ({ from: () => builder() }) }
})

import { POST, DELETE } from '../member/route'
import { fetchOwnScans } from '@/lib/staffhub'

const req = (body: unknown) =>
  new Request('http://x.test/api/inbody/member', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as never

beforeEach(() => {
  verified.id = null
  calls.upserts.length = 0
  calls.deleteFilters.length = 0
  calls.selectEq.length = 0
})

describe('POST /api/inbody/member', () => {
  it('is 401 when the GymMaster token is not verified, even with a member id cookie', async () => {
    const res = await POST(req({ scan_date: '2026-11-01', weight: 80 }))
    expect(res.status).toBe(401)
    expect(calls.upserts).toHaveLength(0)
  })

  it('saves under the verified id, not the cookie id', async () => {
    verified.id = '100'
    const res = await POST(req({ scan_date: '2026-11-01', weight: 80 }))
    expect(res.status).toBe(200)
    expect(calls.upserts[0]).toMatchObject({ gymmaster_member_id: '100' })
  })
})

describe('DELETE /api/inbody/member', () => {
  it('is 401 when not verified', async () => {
    const res = await DELETE(req({ id: 'scan-1' }))
    expect(res.status).toBe(401)
    expect(calls.deleteFilters).toHaveLength(0)
  })

  it('limits the delete to the verified id', async () => {
    verified.id = '100'
    const res = await DELETE(req({ id: 'scan-1' }))
    expect(res.status).toBe(200)
    expect(calls.deleteFilters).toContainEqual(['gymmaster_member_id', '100'])
    expect(calls.deleteFilters).not.toContainEqual(['gymmaster_member_id', 'FORGED-999'])
  })
})

describe('fetchOwnScans', () => {
  it('returns nothing and runs no query when not verified', async () => {
    expect(await fetchOwnScans()).toEqual([])
    expect(calls.selectEq).toHaveLength(0)
  })

  it('queries the verified id only', async () => {
    verified.id = '100'
    await fetchOwnScans()
    expect(calls.selectEq).toEqual([['gymmaster_member_id', '100']])
  })
})
