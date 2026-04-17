'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function getISOWeekMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

type Props = { hasCheckedInThisWeek: boolean }

export default function WellbeingPrompt({ hasCheckedInThisWeek }: Props) {
  const [dismissed, setDismissed] = useState(true) // start hidden, check localStorage

  useEffect(() => {
    const week = getISOWeekMonday(new Date())
    const key = `wellbeing_dismissed_${week}`
    const isDismissed = localStorage.getItem(key) === '1'
    setDismissed(isDismissed || hasCheckedInThisWeek)
  }, [hasCheckedInThisWeek])

  function handleDismiss() {
    const week = getISOWeekMonday(new Date())
    localStorage.setItem(`wellbeing_dismissed_${week}`, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-4 mb-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-brand to-transparent" />
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">🧘</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Weekly wellbeing check-in</p>
          <p className="text-xs text-text-secondary mt-0.5">30 seconds — how are you feeling this week?</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/wellbeing"
            className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors"
          >
            Check in
          </Link>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
