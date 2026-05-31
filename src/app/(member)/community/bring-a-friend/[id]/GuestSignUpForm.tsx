'use client'

import { useState } from 'react'

type GuestEntry = { name: string; email: string; phone: string }

function blankGuest(): GuestEntry {
  return { name: '', email: '', phone: '' }
}

function isEntryValid(entry: GuestEntry): boolean {
  return (
    entry.name.trim().length > 0 &&
    (entry.email.trim().length > 0 || entry.phone.trim().length > 0)
  )
}

export default function GuestSignUpForm({
  eventId,
  isLoggedIn,
}: {
  eventId: string
  isLoggedIn: boolean
}) {
  const [guests, setGuests] = useState<GuestEntry[]>([blankGuest()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedNames, setConfirmedNames] = useState<string[] | null>(null)

  if (!isLoggedIn) {
    return (
      <div className="bg-bg-card border border-border-light rounded-2xl p-6 text-center">
        <p className="text-text-secondary text-sm">
          Please <a href="/login" className="text-brand hover:underline">log in</a> to register your guest.
        </p>
      </div>
    )
  }

  function updateGuest(idx: number, field: keyof GuestEntry, value: string) {
    setGuests(prev =>
      prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)),
    )
  }

  function addGuest() {
    setGuests(prev => [...prev, blankGuest()])
  }

  function removeGuest(idx: number) {
    setGuests(prev => prev.filter((_, i) => i !== idx))
  }

  const allValid = guests.length > 0 && guests.every(isEntryValid)

  async function handleSubmit() {
    if (!allValid) return
    setSubmitting(true)
    setError(null)
    const names: string[] = []

    for (const guest of guests) {
      const res = await fetch('/api/bring-a-friend/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          friendName: guest.name.trim(),
          friendEmail: guest.email.trim() || undefined,
          friendPhone: guest.phone.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(`Failed to register ${guest.name}: ${data.error ?? 'please try again'}`)
        setSubmitting(false)
        return
      }

      names.push(guest.name.trim())
    }

    setConfirmedNames(names)
    setSubmitting(false)
  }

  const inputClass =
    'w-full bg-bg-card border border-border-light rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors'

  if (confirmedNames) {
    const nameList =
      confirmedNames.length === 1
        ? confirmedNames[0]
        : `${confirmedNames.slice(0, -1).join(', ')} and ${confirmedNames[confirmedNames.length - 1]}`

    return (
      <div className="bg-bg-card border border-border-light rounded-2xl p-6">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🤝</div>
          <p className="font-semibold text-text-primary mb-1">Guests registered!</p>
          <p className="text-sm text-text-secondary">
            You&apos;ve registered {nameList} for this session. We&apos;ll be in touch with them shortly.
          </p>
        </div>
        <button
          onClick={() => {
            setGuests([blankGuest()])
            setConfirmedNames(null)
          }}
          className="w-full border border-border-light hover:border-brand text-text-secondary hover:text-brand rounded-xl py-2.5 text-sm transition-colors"
        >
          + Register more guests
        </button>
      </div>
    )
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Your Guests
        </p>
        <p className="text-xs text-text-muted">
          Enter the name and contact details for each person you&apos;re bringing. Please include at least an email or phone number so we can get in touch.
        </p>
      </div>

      <div className="space-y-4">
        {guests.map((guest, idx) => (
          <div
            key={idx}
            className="bg-bg-base border border-border-light rounded-xl p-4 space-y-3 relative"
          >
            {guests.length > 1 && (
              <button
                type="button"
                onClick={() => removeGuest(idx)}
                className="absolute top-3 right-3 text-text-muted hover:text-red-400 text-lg leading-none transition-colors"
                aria-label="Remove guest"
              >
                ×
              </button>
            )}

            <p className="text-xs font-semibold text-text-secondary">
              Guest {idx + 1}
            </p>

            <div>
              <label className="block text-xs text-text-muted mb-1">
                Name <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                value={guest.name}
                onChange={e => updateGuest(idx, 'name', e.target.value)}
                placeholder="e.g. Jane Smith"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">Email</label>
              <input
                type="email"
                value={guest.email}
                onChange={e => updateGuest(idx, 'email', e.target.value)}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">Phone</label>
              <input
                type="tel"
                value={guest.phone}
                onChange={e => updateGuest(idx, 'phone', e.target.value)}
                placeholder="07XXX XXXXXX"
                className={inputClass}
              />
            </div>

            {guest.name.trim().length > 0 && !isEntryValid(guest) && (
              <p className="text-xs text-red-400">
                Please provide at least an email or phone number.
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addGuest}
        className="w-full border border-dashed border-border-light hover:border-brand text-text-muted hover:text-brand rounded-xl py-2.5 text-sm transition-colors"
      >
        + Add another guest
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allValid || submitting}
        className="w-full bg-brand hover:bg-brand/80 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        {submitting
          ? 'Registering…'
          : `Register ${guests.length === 1 ? 'guest' : `${guests.length} guests`}`}
      </button>
    </div>
  )
}
