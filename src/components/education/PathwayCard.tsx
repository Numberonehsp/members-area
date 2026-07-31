import Link from 'next/link'
import type { Pathway } from '@/types/education'
import { parseMemberPlans, canAccess, upgradePlanLabel } from '@/lib/education-access'

const CATEGORY_COLOURS: Record<string, string> = {
  nutrition: 'bg-brand/10 text-brand border-brand/20',
  training:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  recovery:  'bg-purple-500/10 text-purple-600 border-purple-500/20',
  mindset:   'bg-status-amber/10 text-status-amber border-status-amber/20',
}

const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗',
  training:  '🏋️',
  recovery:  '🛌',
  mindset:   '🧠',
}

type Props = { pathway: Pathway; memberPlans: string[] }

export default function PathwayCard({ pathway, memberPlans }: Props) {
  const plans = parseMemberPlans(memberPlans.join(','))
  const access = canAccess(pathway.required_plan, plans, 'pathway')
  const pct = pathway.module_count
    ? Math.round(((pathway.completed_count ?? 0) / pathway.module_count) * 100)
    : 0
  const colourCls = CATEGORY_COLOURS[pathway.category] ?? CATEGORY_COLOURS.training

  const card = (
    <div className={`bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${
      access === 'full'
        ? 'hover:shadow-md hover:border-brand/30'
        : 'opacity-70'
    }`}>
      {/* Thumbnail / category banner */}
      <div className="h-28 bg-gradient-to-br from-bg-sidebar to-brand/20 flex items-center justify-center relative overflow-hidden">
        <span className={`text-5xl ${access === 'locked' ? 'grayscale' : ''}`}>
          {CATEGORY_ICONS[pathway.category]}
        </span>
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colourCls}`}>
            {pathway.category.charAt(0).toUpperCase() + pathway.category.slice(1)}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-white/10 text-text-on-dark border-white/20">
            {pathway.is_sequential ? '🔒 Sequential' : '🔓 Open'}
          </span>
        </div>
        {access === 'locked' && pathway.required_plan && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-status-amber/20 text-status-amber border-status-amber/40">
              ⭐ {upgradePlanLabel(pathway.required_plan)}
            </span>
          </div>
        )}
        {access === 'locked' && (
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <span className="text-2xl">🔒</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className={`font-bold text-base mb-1 transition-colors ${access === 'full' ? 'text-text-primary group-hover:text-brand' : 'text-text-secondary'}`}>
          {pathway.title}
        </h3>
        {pathway.description && (
          <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2">
            {pathway.description}
          </p>
        )}

        {access === 'locked' && pathway.required_plan ? (
          <p className="text-xs text-status-amber flex items-center gap-1 mt-2">
            <span>⭐</span>
            <span>Available with {upgradePlanLabel(pathway.required_plan)} membership</span>
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
              <span>{pathway.module_count} modules</span>
              <span>·</span>
              <span>{pathway.total_duration_minutes} min</span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">Progress</span>
                <span className={pct === 100 ? 'text-brand font-semibold' : 'text-text-secondary'}>
                  {pathway.completed_count ?? 0}/{pathway.module_count} {pct === 100 ? '✓' : ''}
                </span>
              </div>
              <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (access === 'locked') {
    return <div className="cursor-not-allowed">{card}</div>
  }

  return (
    <Link href={`/education/pathway/${pathway.id}`} className="group block">
      {card}
    </Link>
  )
}
