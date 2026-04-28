import Link from 'next/link'
import { cookies } from 'next/headers'
import { fetchMemberStrengthResults } from '@/lib/staffhub'
import StrengthClient from '@/components/results/StrengthClient'

export default async function StrengthPage() {
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value ?? ''
  const isLoggedIn = !!gymMasterId

  const results = gymMasterId ? await fetchMemberStrengthResults(gymMasterId) : []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/results"
          className="text-text-secondary hover:text-brand transition-colors text-sm"
        >
          ← Results
        </Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-brand font-semibold mb-0.5">
            Results
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-[0.95]">
            Strength &amp; Conditioning
          </h1>
        </div>
        <span className="text-3xl mt-1">🏋️</span>
      </div>

      <StrengthClient results={results} isLoggedIn={isLoggedIn} />

      <p className="text-xs text-text-secondary mt-6 text-center">
        <Link href="/results" className="text-brand hover:text-brand-dark transition-colors">
          Back to Results
        </Link>
      </p>
    </div>
  )
}
