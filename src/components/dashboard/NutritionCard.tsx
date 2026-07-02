import Link from 'next/link'
import type { NutritionLog, NutritionTargets } from '@/types/nutrition'
import { DEFAULT_TARGETS } from '@/types/nutrition'

type Props = {
  log: NutritionLog | null
  targets: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'>
}

export default function NutritionCard({ log, targets }: Props) {
  const t = targets ?? DEFAULT_TARGETS
  const calories = log?.calories ?? 0
  const pct = t.calories > 0 ? Math.min(100, Math.round((calories / t.calories) * 100)) : 0
  const hasLogged = log !== null

  return (
    <Link
      href="/nutrition"
      className="group bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden hover:border-brand/40 transition-colors block"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <div className="p-5">
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand mb-3">Nutrition</p>

        {hasLogged ? (
          <>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="font-display text-3xl text-text-primary leading-none">
                {calories.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary">/ {t.calories.toLocaleString()} kcal</span>
            </div>
            <div className="h-1.5 bg-bg-main rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex gap-3 text-xs text-text-secondary">
              <span>P: {log.protein_g}g</span>
              <span>C: {log.carbs_g}g</span>
              <span>F: {log.fats_g}g</span>
            </div>
          </>
        ) : (
          <div>
            <p className="text-text-secondary text-sm mb-2">Nothing logged today</p>
            <p className="text-brand text-xs font-medium group-hover:underline">Log your nutrition →</p>
          </div>
        )}
      </div>
    </Link>
  )
}
