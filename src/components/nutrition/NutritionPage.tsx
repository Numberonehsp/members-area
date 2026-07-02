'use client'

import { useState } from 'react'
import type { NutritionLog, NutritionTargets, WeekDay } from '@/types/nutrition'
import { DEFAULT_TARGETS } from '@/types/nutrition'
import DailyGrid from './DailyGrid'
import LogModal from './LogModal'
import BarcodeScanner from './BarcodeScanner'
import WeeklyChart from './WeeklyChart'

type Props = {
  initialLog: NutritionLog | null
  yesterdayLog: NutritionLog | null
  targets: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'>
  weekDays: WeekDay[]
  today: string  // 'YYYY-MM-DD'
}

type Modal = 'none' | 'log' | 'scan'

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T12:00:00Z')
  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setUTCDate(today.getUTCDate() - 1)

  if (date === today.toISOString().split('T')[0]) return 'Today'
  if (date === yesterday.toISOString().split('T')[0]) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function NutritionPage({ initialLog, yesterdayLog, targets, weekDays, today }: Props) {
  const [selectedDate, setSelectedDate] = useState(today)
  const [log, setLog] = useState<NutritionLog | null>(initialLog)
  const [loadingDate, setLoadingDate] = useState(false)
  const [modal, setModal] = useState<Modal>('none')
  const t = targets ?? DEFAULT_TARGETS

  const isToday = selectedDate === today

  async function navigateDate(direction: -1 | 1) {
    const d = new Date(selectedDate + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + direction)
    const newDate = d.toISOString().split('T')[0]

    if (newDate > today) return

    setSelectedDate(newDate)
    setLoadingDate(true)
    setLog(null)

    try {
      const res = await fetch(`/api/nutrition/log?date=${newDate}`)
      const data = await res.json()
      setLog(data.log)
    } catch {
      setLog(null)
    } finally {
      setLoadingDate(false)
    }
  }

  function handleSaved(updated: NutritionLog) {
    setLog(updated)
    setModal('none')
  }

  const modalPrefill = log ?? yesterdayLog

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-1">Nutrition</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95]">
          Daily<br />
          <span className="text-brand">Tracker</span>
        </h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Previous day"
        >
          ←
        </button>
        <span className="text-sm font-medium text-text-primary">
          {loadingDate ? '…' : formatDateLabel(selectedDate)}
        </span>
        <button
          onClick={() => navigateDate(1)}
          disabled={isToday}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30"
          aria-label="Next day"
        >
          →
        </button>
      </div>

      <div className="mb-4">
        <DailyGrid log={log} targets={t} />
      </div>

      {isToday && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setModal('log')}
            className="bg-brand text-white font-semibold py-3.5 rounded-xl text-sm hover:bg-brand/90 transition-colors"
          >
            + Log Manually
          </button>
          <button
            onClick={() => setModal('scan')}
            className="bg-bg-card border border-border-light text-text-primary font-semibold py-3.5 rounded-xl text-sm hover:border-brand/50 transition-colors"
          >
            📷 Scan Barcode
          </button>
        </div>
      )}

      <WeeklyChart days={weekDays} targetCalories={t.calories} />

      <p className="text-xs text-text-secondary mt-4 text-center">
        Want to learn more?{' '}
        <a href="/education" className="text-brand underline">
          Visit the Nutrition Hub →
        </a>
      </p>

      {modal === 'log' && (
        <LogModal
          currentLog={modalPrefill}
          date={selectedDate}
          onSaved={handleSaved}
          onClose={() => setModal('none')}
        />
      )}
      {modal === 'scan' && (
        <BarcodeScanner
          date={selectedDate}
          onAdded={handleSaved}
          onClose={() => setModal('none')}
        />
      )}
    </div>
  )
}
