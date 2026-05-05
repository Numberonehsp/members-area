import { getAllMembers } from '@/lib/gymmaster'
import { fetchMemberScans, fetchMemberStrengthResults } from '@/lib/staffhub'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// ─── Data helpers ─────────────────────────────────────────────────────────────

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getMemberGoals(gymMasterId: string) {
  const { data } = await db()
    .from('member_goals')
    .select('*')
    .eq('gymmaster_member_id', gymMasterId)
    .order('created_at', { ascending: true })
  return data ?? []
}

async function getMemberVisitCache(gymMasterId: string) {
  const { data } = await db()
    .from('member_visit_cache')
    .select('visits_this_month, last_visit_date, updated_at')
    .eq('gymmaster_member_id', gymMasterId)
    .maybeSingle()
  return data
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function age(dob: string | null) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

function progressPct(current: number, target: number, start: number) {
  if (target === start) return 100
  if (target > start) return Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)))
  return Math.max(0, Math.min(100, Math.round(((start - current) / (start - target)) * 100)))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CoachMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch everything in parallel
  const [allMembers, scans, strengthResults, goals, visitCache] = await Promise.all([
    getAllMembers(),
    fetchMemberScans(id),
    fetchMemberStrengthResults(id),
    getMemberGoals(id),
    getMemberVisitCache(id),
  ])

  const member = allMembers.find((m) => m.id === id)

  // Group strength results by exercise
  const exerciseMap = new Map<string, typeof strengthResults>()
  for (const r of strengthResults) {
    if (!exerciseMap.has(r.exercise)) exerciseMap.set(r.exercise, [])
    exerciseMap.get(r.exercise)!.push(r)
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  const GOAL_EMOJI: Record<string, string> = { strength: '💪', body: '⚖️', habit: '🔥', education: '📚' }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-2">
        <Link href="/coach/members" className="text-xs text-text-secondary hover:text-brand transition-colors">
          ← All Members
        </Link>
      </div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Coach · Member Detail</p>

      {member ? (
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-6">
          {member.firstName} {member.lastName}
        </h1>
      ) : (
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-6">
          Member #{id}
        </h1>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-4">

          {/* Member Profile */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">Member Profile</h2>
            {member ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Email</span>
                  <span className="text-text-primary text-xs">{member.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Phone</span>
                  <span className="text-text-primary">{member.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Age</span>
                  <span className="text-text-primary">{age(member.dob) ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Joined</span>
                  <span className="text-text-primary">{fmt(member.joinDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Membership</span>
                  <span className="text-text-primary text-xs">{member.membershipType || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Last Visit</span>
                  <span className="text-text-primary">{fmt(member.lastVisitDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">This Month</span>
                  <span className="text-text-primary font-semibold">
                    {visitCache?.visits_this_month ?? '—'} visits
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Member not found in GymMaster.</p>
            )}
          </div>

          {/* Goals summary */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">🎯 Goals</h2>
            {goals.length === 0 ? (
              <p className="text-xs text-text-secondary">No goals set yet.</p>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((g) => {
                  const pct = progressPct(parseFloat(g.current_value), parseFloat(g.target_value), parseFloat(g.start_value))
                  return (
                    <div key={g.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-primary">
                          {GOAL_EMOJI[g.type] ?? '🎯'} {g.title}
                        </span>
                        <span className="text-[10px] text-text-secondary">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {parseFloat(g.current_value)} / {parseFloat(g.target_value)} {g.unit} · due {fmt(g.deadline)}
                      </p>
                    </div>
                  )
                })}
                {completedGoals.length > 0 && (
                  <p className="text-[10px] text-status-green mt-1">✓ {completedGoals.length} completed</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMNS ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Body Composition */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">⚖️ Body Composition History</h2>
            {scans.length === 0 ? (
              <p className="text-sm text-text-secondary">No InBody scans recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-light text-text-secondary">
                      <th className="text-left pb-2 font-semibold">Date</th>
                      <th className="text-right pb-2 font-semibold">Weight</th>
                      <th className="text-right pb-2 font-semibold">SMM</th>
                      <th className="text-right pb-2 font-semibold">BF%</th>
                      <th className="text-right pb-2 font-semibold">BF Mass</th>
                      <th className="text-left pb-2 font-semibold pl-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {scans.map((s) => (
                      <tr key={s.id} className="hover:bg-bg-main/40">
                        <td className="py-2 text-text-primary font-medium">{fmt(s.scan_date)}</td>
                        <td className="py-2 text-right font-data">{s.weight != null ? `${s.weight} kg` : '—'}</td>
                        <td className="py-2 text-right font-data">{s.smm != null ? `${s.smm} kg` : '—'}</td>
                        <td className="py-2 text-right font-data">{s.bf_pct != null ? `${s.bf_pct}%` : '—'}</td>
                        <td className="py-2 text-right font-data">{s.bf_mass != null ? `${s.bf_mass} kg` : '—'}</td>
                        <td className="py-2 pl-3 text-text-secondary">{s.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* S&C Results */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">🏋️ S&amp;C Test Results</h2>
            {strengthResults.length === 0 ? (
              <p className="text-sm text-text-secondary">No strength &amp; conditioning results recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {Array.from(exerciseMap.entries()).map(([exercise, results]) => {
                  const sorted = [...results].sort((a, b) => b.tested_date.localeCompare(a.tested_date))
                  const best = Math.max(...results.map((r) => r.result_value))
                  return (
                    <div key={exercise}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-text-primary">{exercise}</span>
                        <span className="text-[10px] text-brand font-semibold">PB: {best}</span>
                      </div>
                      <div className="space-y-1">
                        {sorted.slice(0, 5).map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs text-text-secondary">
                            <span>{fmt(r.tested_date)}</span>
                            <span className={`font-data font-semibold ${r.result_value === best ? 'text-status-green' : 'text-text-primary'}`}>
                              {r.result_value} {r.result_value === best ? '★' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Attendance */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">📅 Attendance</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-bg-main rounded-xl p-3 text-center border border-border-light">
                <p className="font-display text-2xl text-text-primary">{visitCache?.visits_this_month ?? '—'}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Visits this month</p>
              </div>
              <div className="bg-bg-main rounded-xl p-3 text-center border border-border-light">
                <p className="text-sm text-text-primary font-semibold">{fmt(visitCache?.last_visit_date ?? null)}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Last visit</p>
              </div>
              <div className="bg-bg-main rounded-xl p-3 text-center border border-border-light">
                <p className="text-sm text-text-primary font-semibold">{fmt(member?.joinDate ?? null)}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Member since</p>
              </div>
            </div>
            {visitCache?.updated_at && (
              <p className="text-[10px] text-text-secondary/50 mt-2">
                Cache updated {fmt(visitCache.updated_at)}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
