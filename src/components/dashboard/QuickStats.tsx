import { fetchMemberScans } from '@/lib/staffhub'
import type { InBodyScan } from '@/lib/staffhub'

type Props = {
  gymMasterId: string
  visitsThisMonth: number
}

function delta(current: number | null, previous: number | null, unit: string, lowerIsBetter = false) {
  if (current === null || previous === null) return null
  const diff = current - previous
  if (diff === 0) return null
  const positive = lowerIsBetter ? diff < 0 : diff > 0
  return {
    label: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}${unit}`,
    positive,
    direction: diff > 0 ? 'up' : 'down',
  }
}

function formatScanDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function TrendArrow({ dir, positive }: { dir: 'up' | 'down'; positive: boolean }) {
  const colour = positive ? 'text-status-green' : 'text-status-red'
  return <span className={`text-xs font-semibold ${colour}`}>{dir === 'up' ? '↑' : '↓'}</span>
}

export default async function QuickStats({ gymMasterId, visitsThisMonth }: Props) {
  // Fetch last two scans to compute deltas
  let scans: InBodyScan[] = []
  if (gymMasterId && gymMasterId !== 'DEMO') {
    scans = await fetchMemberScans(gymMasterId)
  }

  const latest = scans[0] ?? null
  const previous = scans[1] ?? null

  const weightDelta = delta(latest?.weight ?? null, previous?.weight ?? null, 'kg', true)
  const bfDelta = delta(latest?.bf_pct ?? null, previous?.bf_pct ?? null, '%', true)
  const smmDelta = delta(latest?.smm ?? null, previous?.smm ?? null, 'kg', false)

  const hasScans = latest !== null

  type Stat = {
    label: string
    value: string
    unit: string
    delta: { label: string; positive: boolean; direction: string } | null
  }

  const stats: Stat[] = [
    {
      label: 'Weight',
      value: latest?.weight != null ? latest.weight.toFixed(1) : '—',
      unit: 'kg',
      delta: weightDelta,
    },
    {
      label: 'Body Fat',
      value: latest?.bf_pct != null ? latest.bf_pct.toFixed(1) : '—',
      unit: '%',
      delta: bfDelta,
    },
    {
      label: 'Muscle Mass',
      value: latest?.smm != null ? latest.smm.toFixed(1) : '—',
      unit: 'kg',
      delta: smmDelta,
    },
    {
      label: 'Visits',
      value: String(visitsThisMonth),
      unit: 'this month',
      delta: null,
    },
  ]

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-text-primary text-sm">Quick Stats</h2>
        {hasScans ? (
          <span className="text-[10px] text-text-secondary">
            Latest scan · {formatScanDate(latest!.scan_date)}
          </span>
        ) : (
          <span className="text-[10px] text-text-secondary">No InBody scans yet</span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2 font-semibold">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-data text-3xl font-semibold text-text-primary leading-none">
                {stat.value}
              </span>
              <span className="text-xs text-text-secondary">{stat.unit}</span>
            </div>
            {stat.delta ? (
              <div className="flex items-center gap-1">
                <TrendArrow dir={stat.delta.direction as 'up' | 'down'} positive={stat.delta.positive} />
                <span className={`text-xs ${stat.delta.positive ? 'text-status-green' : 'text-status-red'}`}>
                  {stat.delta.label} vs prev
                </span>
              </div>
            ) : stat.label === 'Visits' ? (
              <p className="text-xs text-text-muted">—</p>
            ) : (
              <p className="text-xs text-text-muted">No scan data</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
