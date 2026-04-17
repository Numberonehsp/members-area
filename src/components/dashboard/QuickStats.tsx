type Stat = {
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'neutral'
  trendLabel: string
  trendPositive: boolean // whether this trend direction is good
}

// Seed data — replace with Supabase query when InBody scans exist
const SEED_STATS: Stat[] = [
  {
    label: 'Weight',
    value: '82.4',
    unit: 'kg',
    trend: 'down',
    trendLabel: '−1.2kg',
    trendPositive: true,
  },
  {
    label: 'Body Fat',
    value: '18.6',
    unit: '%',
    trend: 'down',
    trendLabel: '−0.8%',
    trendPositive: true,
  },
  {
    label: 'Muscle Mass',
    value: '36.1',
    unit: 'kg',
    trend: 'up',
    trendLabel: '+0.4kg',
    trendPositive: true,
  },
  {
    label: 'Visits',
    value: '9',
    unit: 'this month',
    trend: 'up',
    trendLabel: '+2 vs last',
    trendPositive: true,
  },
]

function TrendArrow({ trend, positive }: { trend: Stat['trend']; positive: boolean }) {
  if (trend === 'neutral') return null
  const colour = positive ? 'text-status-green' : 'text-status-red'
  return (
    <span className={`text-xs font-semibold ${colour}`}>
      {trend === 'up' ? '↑' : '↓'}
    </span>
  )
}

export default function QuickStats() {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-text-primary text-sm">Quick Stats</h2>
        <span className="text-[10px] text-text-secondary">Latest scan · 3 Apr</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SEED_STATS.map((stat) => (
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
            <div className="flex items-center gap-1">
              <TrendArrow trend={stat.trend} positive={stat.trendPositive} />
              <span
                className={`text-xs ${
                  stat.trendPositive ? 'text-status-green' : 'text-status-red'
                }`}
              >
                {stat.trendLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
