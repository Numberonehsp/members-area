'use client'

import type { NutritionLog, NutritionTargets } from '@/types/nutrition'
import { DEFAULT_TARGETS } from '@/types/nutrition'

type Props = {
  log: NutritionLog | null
  targets: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'>
}

type Metric = {
  label: string
  logged: number
  target: number
  unit: string
  colour: string
}

export default function DailyGrid({ log, targets }: Props) {
  const t = targets ?? DEFAULT_TARGETS

  const metrics: Metric[] = [
    { label: 'Calories', logged: log?.calories ?? 0,   target: t.calories,  unit: 'kcal', colour: 'text-brand' },
    { label: 'Protein',  logged: log?.protein_g ?? 0,  target: t.protein_g, unit: 'g',    colour: 'text-brand' },
    { label: 'Carbs',    logged: log?.carbs_g ?? 0,    target: t.carbs_g,   unit: 'g',    colour: 'text-text-secondary' },
    { label: 'Fats',     logged: log?.fats_g ?? 0,     target: t.fats_g,    unit: 'g',    colour: 'text-text-secondary' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map(({ label, logged, target, unit, colour }) => {
        const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0
        return (
          <div key={label} className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary mb-1">{label}</p>
            <p className={`font-display text-3xl leading-none mb-0.5 ${colour}`}>
              {logged.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              of {target.toLocaleString()} {unit}
            </p>
            <div className="mt-3 h-1 bg-bg-main rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
