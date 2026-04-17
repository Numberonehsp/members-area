import { getMonthlyVisits } from '@/lib/gymmaster'
import Link from 'next/link'

// TODO: replace with logged-in member's gymmaster_member_id from session
const DEMO_GYMMASTER_ID = '1001'
const TARGET = 12

// Seed leaderboard — members who've hit 12+ this month
// TODO: replace with real data from getAllMemberVisitsThisMonth() joined with members table
const SEED_QUALIFIERS = [
  { name: 'Sarah J.', visits: 15, isYou: false },
  { name: 'You', visits: 9, isYou: true },
  { name: 'Mike T.', visits: 14, isYou: false },
  { name: 'Emma R.', visits: 12, isYou: false },
  { name: 'James O.', visits: 13, isYou: false },
  { name: 'Priya S.', visits: 7, isYou: false },
]

const SEED_PAST_WINNERS = [
  { month: 'March 2026', name: 'Mike T.' },
  { month: 'February 2026', name: 'Emma R.' },
  { month: 'January 2026', name: 'Sarah J.' },
]

export default async function CommitmentClubPage() {
  const now = new Date()
  const data = await getMonthlyVisits(DEMO_GYMMASTER_ID, now.getFullYear(), now.getMonth() + 1)
  const { visitCount } = data
  const qualified = visitCount >= TARGET
  const remaining = Math.max(TARGET - visitCount, 0)
  const pct = Math.min(Math.round((visitCount / TARGET) * 100), 100)
  const monthName = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

  const qualifiers = SEED_QUALIFIERS.filter(m => m.visits >= TARGET)

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">Monthly Draw</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          Commitment<br />
          <span className="text-brand">Club</span>
        </h1>
        <p className="text-text-secondary text-sm max-w-xl">
          Attend {TARGET} or more times in a calendar month and you're entered into our monthly prize draw.
          Winners are announced at the start of the following month.
        </p>
      </div>

      {/* Your progress card */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">Your progress</p>
            <p className="text-sm text-text-secondary">{monthName}</p>
          </div>
          {qualified ? (
            <div className="text-center">
              <div className="text-3xl mb-1">🏆</div>
              <p className="text-[10px] font-semibold text-brand">In the draw!</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="font-data font-bold text-2xl text-text-primary">{visitCount}<span className="text-sm text-text-secondary font-sans font-normal">/{TARGET}</span></p>
              <p className="text-[10px] text-text-secondary">{daysLeft}d remaining</p>
            </div>
          )}
        </div>

        <div className="h-3 bg-border-light rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${qualified ? 'bg-gradient-to-r from-brand to-brand-light' : 'bg-gradient-to-r from-brand/60 to-brand'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary">
          {qualified
            ? `You've qualified with ${visitCount} visits — you're in this month's draw! 🎉`
            : `${remaining} more visit${remaining !== 1 ? 's' : ''} to qualify for ${monthName}'s draw`}
        </p>
      </div>

      {/* This month's qualifiers */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-border-light">
          <h2 className="font-display text-2xl text-text-primary">This month's entrants</h2>
          <p className="text-xs text-text-secondary mt-0.5">Members who've hit {TARGET}+ visits in {monthName}</p>
        </div>
        {qualifiers.length > 0 ? (
          <div className="divide-y divide-border-light">
            {qualifiers
              .sort((a, b) => b.visits - a.visits)
              .map((m, i) => (
                <div key={m.name} className={`flex items-center gap-4 px-5 py-3.5 ${m.isYou ? 'bg-brand/5' : ''}`}>
                  <span className="font-data text-xs text-text-secondary w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${m.isYou ? 'text-brand' : 'text-text-primary'}`}>
                      {m.name} {m.isYou && <span className="text-[10px] font-normal text-brand">(you)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-sm font-bold text-text-primary">{m.visits}</span>
                    <span className="text-xs text-text-secondary">visits</span>
                    <span className="text-brand text-sm">✓</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-8 text-center text-text-secondary text-sm">
            No members have qualified yet this month — be the first!
          </div>
        )}
      </div>

      {/* Past winners */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border-light">
          <h2 className="font-display text-2xl text-text-primary">Past winners</h2>
        </div>
        <div className="divide-y divide-border-light">
          {SEED_PAST_WINNERS.map(w => (
            <div key={w.month} className="flex items-center justify-between px-5 py-3.5">
              <p className="text-sm text-text-secondary">{w.month}</p>
              <div className="flex items-center gap-2">
                <span className="text-base">🏆</span>
                <p className="text-sm font-semibold text-text-primary">{w.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-secondary text-center mt-6">
        Winners are drawn at random from all qualifying members at the start of each month.{' '}
        <Link href="/dashboard" className="text-brand hover:underline">Back to dashboard</Link>
      </p>
    </div>
  )
}
