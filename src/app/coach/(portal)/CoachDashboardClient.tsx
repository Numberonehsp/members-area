'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MemberRow } from './page'

type EngagementStatus = 'engaged' | 'at_risk' | 'disengaged' | 'unknown'

const STATUS_CONFIG: Record<EngagementStatus, { dot: string; label: string; text: string; bg: string; border: string }> = {
  engaged:    { dot: 'bg-status-green',  label: 'Engaged',    text: 'text-status-green',  bg: 'bg-status-green/10',  border: 'border-status-green/20'  },
  at_risk:    { dot: 'bg-status-amber',  label: 'At Risk',    text: 'text-status-amber',  bg: 'bg-status-amber/10',  border: 'border-status-amber/20'  },
  disengaged: { dot: 'bg-status-red',    label: 'Disengaged', text: 'text-status-red',    bg: 'bg-status-red/10',    border: 'border-status-red/20'    },
  unknown:    { dot: 'bg-text-secondary', label: 'No data',   text: 'text-text-secondary', bg: 'bg-bg-main',         border: 'border-border-light'     },
}

function getStatus(lastVisitDate: string | null): EngagementStatus {
  if (!lastVisitDate) return 'unknown'
  const days = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / 86400000)
  if (days <= 7) return 'engaged'
  if (days <= 21) return 'at_risk'
  return 'disengaged'
}

function daysAgoLabel(lastVisitDate: string | null): string {
  if (!lastVisitDate) return '—'
  const days = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type SortKey = 'name' | 'lastVisit' | 'visitsMonth' | 'membershipType' | 'joinDate' | 'status'

type BirthdayRow = { id: string; name: string; daysUntil: number; age: number }

type Props = {
  members: MemberRow[]
  upcomingBirthdays: BirthdayRow[]
  cachedMemberCount: number
}

export default function CoachDashboardClient({ members, upcomingBirthdays, cachedMemberCount }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | 'all'>('all')

  const statusCounts = members.reduce(
    (acc, m) => { acc[getStatus(m.lastVisitDate)]++; return acc },
    { engaged: 0, at_risk: 0, disengaged: 0, unknown: 0 }
  )

  const filtered = members
    .filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase()
      const matchSearch = name.includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || getStatus(m.lastVisitDate) === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'status') {
        const order: Record<EngagementStatus, number> = { engaged: 0, at_risk: 1, disengaged: 2, unknown: 3 }
        return mul * (order[getStatus(a.lastVisitDate)] - order[getStatus(b.lastVisitDate)])
      }
      if (sortKey === 'name') {
        return mul * (`${a.lastName} ${a.firstName}`).localeCompare(`${b.lastName} ${b.firstName}`)
      }
      if (sortKey === 'lastVisit') {
        const aDate = a.lastVisitDate ?? '0000-00-00'
        const bDate = b.lastVisitDate ?? '0000-00-00'
        return mul * bDate.localeCompare(aDate) // most recent first when asc
      }
      if (sortKey === 'joinDate') {
        const aDate = a.joinDate ?? '0000-00-00'
        const bDate = b.joinDate ?? '0000-00-00'
        return mul * bDate.localeCompare(aDate)
      }
      if (sortKey === 'visitsMonth') {
        return mul * ((a.visitsThisMonth ?? -1) - (b.visitsThisMonth ?? -1))
      }
      if (sortKey === 'membershipType') {
        return mul * (a.membershipType).localeCompare(b.membershipType)
      }
      return 0
    })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="opacity-30">↕</span>
    return <span className="text-brand">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Coach</p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">Dashboard</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Members', value: members.length, sub: 'active', colour: '', filter: 'all' as const },
          { label: 'Engaged', value: statusCounts.engaged, sub: 'visited ≤ 7 days', colour: 'text-status-green', filter: 'engaged' as const },
          { label: 'At Risk', value: statusCounts.at_risk, sub: '8–21 days', colour: 'text-status-amber', filter: 'at_risk' as const },
          { label: 'Disengaged', value: statusCounts.disengaged, sub: '21+ days', colour: 'text-status-red', filter: 'disengaged' as const },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setStatusFilter(statusFilter === stat.filter ? 'all' : stat.filter)}
            className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden text-left hover:border-brand/40 transition-colors"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className={`font-display text-4xl leading-none mb-1 ${stat.colour || 'text-text-primary'}`}>{stat.value}</p>
            <p className="text-xs font-semibold text-text-primary">{stat.label}</p>
            <p className="text-[11px] text-text-secondary">{stat.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member engagement table */}
        <div className="lg:col-span-2 bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border-light">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h2 className="font-semibold text-text-primary text-sm mb-2">Member Engagement</h2>
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium shrink-0 ${STATUS_CONFIG[statusFilter].bg} ${STATUS_CONFIG[statusFilter].text} ${STATUS_CONFIG[statusFilter].border}`}
                >
                  {STATUS_CONFIG[statusFilter].label} ×
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-bg-main/50">
                  {([
                    { key: 'name' as SortKey, label: 'Member' },
                    { key: 'lastVisit' as SortKey, label: 'Last Visit' },
                    { key: 'visitsMonth' as SortKey, label: 'Visits' },
                    { key: 'status' as SortKey, label: 'Status' },
                  ]).map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand transition-colors select-none whitespace-nowrap"
                    >
                      {col.label} <SortIcon col={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">No members found</td>
                  </tr>
                ) : filtered.map((m) => {
                  const status = getStatus(m.lastVisitDate)
                  const cfg = STATUS_CONFIG[status]
                  return (
                    <tr key={m.id} className="hover:bg-bg-main/60 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/coach/members/${m.id}`} className="font-medium text-text-primary hover:text-brand transition-colors">
                          {m.firstName} {m.lastName}
                        </Link>
                        {m.email && <p className="text-[11px] text-text-secondary mt-0.5">{m.email}</p>}
                      </td>
                      <td className="px-4 py-3 font-data text-text-secondary text-xs whitespace-nowrap">
                        {daysAgoLabel(m.lastVisitDate)}
                      </td>
                      <td className="px-4 py-3 font-data text-xs text-text-primary font-semibold">
                        {m.visitsThisMonth !== null ? m.visitsThisMonth : <span className="text-text-secondary font-normal">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-border-light flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {filtered.length} of {members.length} members
              {cachedMemberCount > 0 && (
                <span className="ml-2 text-text-secondary/60">· visit data for {cachedMemberCount} who&apos;ve logged in</span>
              )}
            </span>
            <Link href="/coach/members" className="text-xs text-brand hover:text-brand-dark transition-colors font-medium">
              View all →
            </Link>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Birthdays */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-amber via-brand-light to-transparent" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">Next 30 Days</p>
                <h2 className="font-semibold text-text-primary text-sm">Upcoming Birthdays</h2>
              </div>
              <span className="text-xl">🎂</span>
            </div>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-text-secondary">No birthdays in the next 30 days.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcomingBirthdays.map((b) => (
                  <li key={b.id}>
                    <Link href={`/coach/members/${b.id}`} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-brand">{b.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">{b.name}</p>
                          <p className="text-[11px] text-text-secondary">Turns {b.age}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium shrink-0 ml-2 ${b.daysUntil <= 3 ? 'text-status-amber' : 'text-text-secondary'}`}>
                        {b.daysUntil === 0 ? 'Today! 🎂' : b.daysUntil === 1 ? 'Tomorrow' : `In ${b.daysUntil} days`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Input InBody Scan', href: '/coach/input/inbody', emoji: '⚖️' },
                { label: 'Input Testing Results', href: '/coach/input/testing', emoji: '🏋️' },
                { label: 'Give Award', href: '/coach/community', emoji: '🌟' },
                { label: 'Post Announcement', href: '/coach/community', emoji: '📌' },
                { label: 'Manage Partners', href: '/coach/partners', emoji: '🤝' },
              ].map(({ label, href, emoji }) => (
                <Link key={label} href={href} className="flex items-center gap-2 bg-bg-main border border-border-light text-text-primary text-xs font-medium px-3 py-2 rounded-xl hover:border-brand hover:text-brand transition-colors">
                  <span>{emoji}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
