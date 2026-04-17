import Link from 'next/link'
import type { Module, Pathway } from '@/types/education'

type Props = {
  pathway: Pathway
  module: Module
}

const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗', training: '🏋️', recovery: '🛌', mindset: '🧠',
}

export default function ContinueLearning({ pathway, module }: Props) {
  const pct = pathway.module_count
    ? Math.round(((pathway.completed_count ?? 0) / pathway.module_count) * 100)
    : 0

  return (
    <Link href={`/education/module/${module.id}`} className="group block">
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-brand/30 transition-all duration-200">

        {/* Top strip */}
        <div className="h-1 bg-gradient-to-r from-brand via-brand-light to-brand" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bg-sidebar to-brand/30 flex items-center justify-center text-2xl shrink-0">
              {CATEGORY_ICONS[pathway.category] ?? '📚'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
                Continue Learning
              </p>
              <p className="text-[11px] text-text-secondary mb-1 truncate">
                {pathway.title}
              </p>
              <h3 className="font-bold text-text-primary text-sm leading-snug group-hover:text-brand transition-colors line-clamp-1">
                {module.title}
              </h3>
              {module.duration_minutes && (
                <p className="text-[11px] text-text-secondary mt-1">
                  {module.duration_minutes} min · Module {module.module_order} of {pathway.module_count}
                </p>
              )}
            </div>

            {/* Play button */}
            <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-text-secondary mb-1">
              <span>Pathway progress</span>
              <span>{pathway.completed_count ?? 0}/{pathway.module_count} completed</span>
            </div>
            <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
