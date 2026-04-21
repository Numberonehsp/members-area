'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  challengeId: string
  alreadySignedUp: boolean
  deadlinePassed: boolean
  isLoggedIn: boolean
}

export default function SignUpButton({ challengeId, alreadySignedUp, deadlinePassed, isLoggedIn }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(alreadySignedUp)
  const [error, setError] = useState<string | null>(null)

  if (!isLoggedIn) {
    return <p className="text-sm text-text-muted">Log in to sign up for this challenge.</p>
  }

  if (signedUp) {
    return (
      <div className="inline-flex items-center gap-2 bg-brand/10 text-brand rounded-xl px-5 py-3 text-sm font-medium">
        ✅ You&apos;re signed up!
      </div>
    )
  }

  if (deadlinePassed) {
    return <p className="text-sm text-text-muted">Sign-up for this challenge is now closed.</p>
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
        router.refresh()
      } else {
        const data = await res.json()
        const detail = data.code ? ` (${data.code}: ${data.detail})` : ''
        setError((data.error ?? 'Something went wrong') + detail)
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
        className="bg-brand text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing up…' : 'Sign Up for this Challenge'}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
