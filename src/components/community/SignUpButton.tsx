'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  challengeId: string
  alreadySignedUp: boolean
  deadlinePassed: boolean
  isLoggedIn: boolean
  /** 'full' = challenge detail page, 'compact' = inline on a Community/dashboard card */
  variant?: 'full' | 'compact'
}

export default function SignUpButton({
  challengeId,
  alreadySignedUp,
  deadlinePassed,
  isLoggedIn,
  variant = 'full',
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(alreadySignedUp)
  const [justSignedUp, setJustSignedUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compact = variant === 'compact'

  if (!isLoggedIn) {
    return compact ? null : (
      <p className="text-sm text-text-muted">Log in to sign up for this challenge.</p>
    )
  }

  if (signedUp) {
    return (
      <div>
        <div
          className={
            compact
              ? 'inline-flex items-center gap-1.5 bg-brand/10 text-brand rounded-lg px-3 py-1.5 text-xs font-semibold'
              : 'inline-flex items-center gap-2 bg-brand/10 text-brand rounded-xl px-5 py-3 text-sm font-medium'
          }
        >
          ✅ You&apos;re in
        </div>
        {justSignedUp && !compact && (
          <p className="text-sm text-text-secondary mt-3">
            Nice one — you&apos;re on the list. Your coach can see you&apos;ve joined.
            Come and get your starting numbers taken at the gym, then log your progress
            on this page each week.
          </p>
        )}
        {justSignedUp && compact && (
          <p className="text-[11px] text-text-secondary mt-1.5">
            Tap View for what happens next.
          </p>
        )}
      </div>
    )
  }

  if (deadlinePassed) {
    return compact ? (
      <span className="text-[11px] text-text-muted">Sign-up closed</span>
    ) : (
      <p className="text-sm text-text-muted">Sign-up for this challenge is now closed.</p>
    )
  }

  async function handleSignUp() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/challenges/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      })
      if (res.ok) {
        setSignedUp(true)
        setJustSignedUp(true)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSignUp}
        disabled={loading}
        className={
          compact
            ? 'bg-brand text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            : 'bg-brand text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        }
      >
        {loading ? 'Signing up…' : compact ? 'Sign Up' : 'Sign Up for this Challenge'}
      </button>
      {error && (
        <p className={`text-red-400 mt-2 ${compact ? 'text-[11px]' : 'text-sm'}`}>{error}</p>
      )}
    </div>
  )
}
