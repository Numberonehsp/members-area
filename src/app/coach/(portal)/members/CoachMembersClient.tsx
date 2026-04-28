'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GymMasterMember } from '@/lib/gymmaster'

type EngagementStatus = 'engaged' | 'at_risk' | 'disengaged' | 'unknown'

const STATUS_CONFIG: Record<EngagementStatus, { dot: string; label: string; text: string; bg: string; border: string }> = {
  engaged:    { dot: 'bg-status-green',   label: 'Engaged',    text: 'text-status-green',   bg: 'bg-status-green/10',  border: 'border-status-green/20'  },
  at_risk:    { dot: 'bg-status-amber',   label: 'At Risk',    text: 'text-status-amber',   bg: 'bg-status-amber/10',  border: 'border-status-amber/20'  },
  disengaged: { dot: 'bg-status-red',     label: 'Disengaged', text: 'text-status-red',     bg: 'bg-status-red/10',    border: 'border-status-red/20'    },
  unknown:    { dot: 'bg-text-secondary', label: 'No data',    text: 'text-text-secondary', bg: 'bg-bg-main',          border: 'border-border-light'     },
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

type SortKey = 'name' | 'lastVisit' | 'joinDate' | 'membershipType' | 'status'

type Props = { members: GymMasterMember[] }

export default function CoachMembersClient({ members }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | 'all'>('all')

  const statusCounts = members.reduce(
    (acc, m) => { acc[getStatus(m.lastVisitDate)]++; return acc },
    { engaged: 0, at_risk: 0, disengaged: 0, unknown: 0 }
  )

  const filtered = members
    .filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase()
      const matchSearch =
        name.includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.membershipType.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || getStatus(m.lastVisitDate) === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') return mul * (`${a.lastName} ${a.firstName}`).localeCompare(`${b.lastName} ${b.firstName}`)
      if (sortKey === 'status') {
        const order: Record<EngagementStatus, number> = { engaged: 0, at_risk: 1, disengaged: 2, unknown: 3 }
        return mul * (order[getStatus(a.lastVisitDate)] - order[getStatus(b.lastVisitDate)])
      }
      if (sortKey === 'lastVisit') {
        return mul * (b.lastVisitDate ?? '').localeCompare(a.lastVisitDate ?? '')
      }
      if (sortKey === 'joinDate') return mul * (b.joinDate ?? '').localeCompare(a.joinDate ?? '')
      if (sortKey === 'membershipType') return mul * a.membershipType.localeCompare(b.membershipType)
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
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-2">All Members</h1>
      <p className="text-text-secondary text-sm mb-8">{members.length} active members from GymMaster</p>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { filter: 'all' as const, label: `All (${members.length})`, text: 'text-text-primary', bg: 'bg-bg-card', border: 'border-border-light' },
          { filter: 'engaged' as const,    label: `Engaged (${statusCounts.engaged})`,    text: STATUS_CONFIG.engaged.text,    bg: STATUS_CONFIG.engaged.bg,    border: STATUS_CONFIG.engaged.border    },
          { filter: 'at_risk' as const,    label: `At Risk (${statusCounts.at_risk})`,    text: STATUS_CONFIG.at_risk.text,    bg: STATUS_CONFIG.at_risk.bg,    border: STATUS_CONFIG.at_risk.border    },
          { filter: 'disengaged' as const, label: `Disengaged (${statusCounts.disengaged})`, text: STATUS_CONFIG.disengaged.text, bg: STATUS_CONFIG.disengaged.bg, border: STATUS_CONFIG.disengaged.border },
          { filter: 'unknown' as const,    label: `No data (${statusCounts.unknown})`,    text: STATUS_CONFIG.unknown.text,    bg: STATUS_CONFIG.unknown.bg,    border: STATUS_CONFIG.unknown.border    },
        ]).map((f) => (
          <button
            key={f.filter}
            onClick={() => setStatusFilter(statusFilter === f.filter ? 'all' : f.filter)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              statusFilter === f.filter
                ? `${f.bg} ${f.text} ${f.border} ring-1 ring-current`
                : 'bg-bg-card border-border-light text-text-secondary hover:border-brand/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-4 border-b border-border-light">
          <input
            type="text"
            placeholder="Search by name, email or membership…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-bg-main/50">
                {([
                  { key: 'name' as SortKey, label: 'Member' },
                  { key: 'membershipType' as SortKey, label: 'Membership' },
                  { key: 'joinDate' as SortKey, label: 'Joined' },
                  { key: 'lastVisit' as SortKey, label: 'Last Visit' },
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
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-secondary">
                    No members match your search.
                  </td>
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
                      {m.phone && <p className="text-[11px] text-text-secondary">{m.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                      {m.membershipType || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                      {formatDate(m.joinDate)}
                    </td>
                    <td className="px-4 py-3 font-data text-xs text-text-secondary whitespace-nowrap">
                      {daysAgoLabel(m.lastVisitDate)}
                      {m.lastVisitDate && (
                        <span className="text-text-secondary/50 ml-1">({formatDate(m.lastVisitDate)})</span>
                      )}
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

        <div className="px-5 py-3 border-t border-border-light">
          <span className="text-xs text-text-secondary">{filtered.length} of {members.length} members shown</span>
        </div>
      </div>
    </div>
  )
}
