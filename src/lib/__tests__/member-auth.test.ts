import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))

import { memberIdForToken, clearMemberAuthCache } from '../member-auth'
import { adminSupabase } from '../supabase-admin'

beforeEach(() => clearMemberAuthCache())

describe('memberIdForToken', () => {
  it('is null without a token, and never calls GymMaster', async () => {
    const verify = vi.fn(async () => '100')
    expect(await memberIdForToken(undefined, verify)).toBeNull()
    expect(await memberIdForToken('', verify)).toBeNull()
    expect(verify).not.toHaveBeenCalled()
  })

  it('returns the id GymMaster gives for the token, not anything from a cookie', async () => {
    const verify = vi.fn(async () => '100')
    expect(await memberIdForToken('tok-a', verify)).toBe('100')
  })

  it('is null when GymMaster rejects the token', async () => {
    expect(await memberIdForToken('bad', vi.fn(async () => null))).toBeNull()
  })

  it('remembers an answer for a minute, then asks again', async () => {
    const verify = vi.fn(async () => '100')
    await memberIdForToken('tok-b', verify, 1_000)
    await memberIdForToken('tok-b', verify, 30_000)
    expect(verify).toHaveBeenCalledTimes(1)
    await memberIdForToken('tok-b', verify, 70_000)
    expect(verify).toHaveBeenCalledTimes(2)
  })

  it('keeps different tokens apart', async () => {
    const verify = vi.fn(async (t: string) => (t === 'tok-1' ? '1' : '2'))
    expect(await memberIdForToken('tok-1', verify)).toBe('1')
    expect(await memberIdForToken('tok-2', verify)).toBe('2')
  })
})

describe('adminSupabase', () => {
  const saved = { ...process.env }
  afterEach(() => { process.env = { ...saved } })

  it('refuses to build without the service role key (never falls back to the anon key)', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(() => adminSupabase()).toThrow('supabase_admin_not_configured')
  })

  it('builds when both are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'
    expect(() => adminSupabase()).not.toThrow()
  })
})
