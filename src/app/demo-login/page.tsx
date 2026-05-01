'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoLoginPage() {
  const router = useRouter()
  const [passphrase, setPassphrase] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Incorrect passphrase')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-bg-card border border-border-light rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

          <div className="text-center mb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-brand font-semibold mb-1">Staff Preview</p>
            <h1 className="font-display text-2xl font-bold text-text-primary">Demo Access</h1>
            <p className="text-sm text-text-muted mt-2">
              See the Members Area as a member would — no real data attached.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter demo passphrase"
                required
                autoFocus
                className="w-full bg-bg-base border border-border-light rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !passphrase}
              className="w-full bg-brand hover:bg-brand/80 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Signing in…' : 'Enter Demo'}
            </button>
          </form>

          <p className="text-xs text-text-muted text-center mt-4">
            Ask your coach for the demo passphrase.
          </p>
        </div>
      </div>
    </div>
  )
}
