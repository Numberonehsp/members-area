'use client'

import type { WeekDay } from '@/types/nutrition'

type Props = {
  days: WeekDay[]
  targetCalories: number
}

export default function WeeklyChart({ days, targetCalories }: Props) {
  const maxCalories = Math.max(targetCalories * 1.2, ...days.map((d) => d.calories ?? 0))
  const logged = days.filter((d) => d.calories !== null).length
  const avg = logged > 0
    ? Math.round(days.reduce((sum, d) => sum + (d.calories ?? 0), 0) / logged)
    : null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold text-text-primary text-sm">This week</h3>
        <div className="text-xs text-text-secondary">
          {logged}/7 days · {avg !== null ? `avg ${avg.toLocaleString()} kcal` : 'no data yet'}
        </div>
      </div>

      <div className="flex items-end gap-1.5 h-20 mb-2">
        {days.map((day) => {
          const height = day.calories !== null && maxCalories > 0
            ? Math.max(4, Math.round((day.calories / maxCalories) * 80))
            : 4
          const isOver = day.calories !== null && day.calories > targetCalories
          const isEmpty = day.calories === null

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <div
                className={`w-full rounded-t transition-all ${
                  isEmpty ? 'bg-bg-main' : isOver ? 'bg-red-400/70' : 'bg-brand/70'
                }`}
                style={{ height: `${height}px` }}
                title={day.calories !== null ? `${day.calories.toLocaleString()} kcal` : 'Not logged'}
              />
            </div>
          )
        })}
      </div>

      <div className="flex gap-1.5">
        {days.map((day) => (
          <div key={day.date} className="flex-1 text-center text-[10px] text-text-secondary">
            {day.label}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-brand/70" />
          <span className="text-[10px] text-text-secondary">On target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-red-400/70" />
          <span className="text-[10px] text-text-secondary">Over target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-bg-main border border-border-light" />
          <span className="text-[10px] text-text-secondary">Not logged</span>
        </div>
      </div>
    </div>
  )
}
