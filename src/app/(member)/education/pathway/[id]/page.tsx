import Link from 'next/link'
import { SEED_PATHWAYS, SEED_MODULES, getPathwayProgress } from '@/lib/education-seed'
import { notFound } from 'next/navigation'

const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗', training: '🏋️', recovery: '🛌', mindset: '🧠',
}

const STATUS_CONFIG = {
  completed:   { icon: '✓', colour: 'text-brand',           bg: 'bg-brand/10',           border: 'border-brand/20'           },
  in_progress: { icon: '▶', colour: 'text-blue-600',        bg: 'bg-blue-500/10',        border: 'border-blue-500/20'        },
  not_started: { icon: '○', colour: 'text-text-secondary',  bg: 'bg-bg-main',            border: 'border-border-light'       },
}

export default async function PathwayDetailPage({
  params,
}: PageProps<'/education/pathway/[id]'>) {
  const { id } = await params

  // TODO: replace with Supabase query
  const pathway = SEED_PATHWAYS.find(p => p.id === id)
  if (!pathway) notFound()

  const modules = SEED_MODULES[id] ?? []
  const pct = getPathwayProgress(modules)
  const completedCount = modules.filter(m => m.progress_status === 'completed').length

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <Link href="/education" className="text-xs text-text-secondary hover:text-brand transition-colors inline-flex items-center gap-1 mb-6">
        ← Education Hub
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bg-sidebar to-brand/30 flex items-center justify-center text-3xl shrink-0">
          {CATEGORY_ICONS[pathway.category] ?? '📚'}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold">
              {pathway.category}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card border border-border-light text-text-secondary">
              {pathway.is_sequential ? '🔒 Sequential' : '🔓 Open access'}
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-none">
            {pathway.title}
          </h1>
        </div>
      </div>

      {pathway.description && (
        <p className="text-text-secondary leading-relaxed mb-6">{pathway.description}</p>
      )}

      {/* Progress bar */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="font-semibold text-text-primary">Your progress</span>
          <span className={`font-data font-semibold ${pct === 100 ? 'text-brand' : 'text-text-secondary'}`}>
            {completedCount} / {modules.length} modules {pct === 100 ? '🎉' : ''}
          </span>
        </div>
        <div className="h-2.5 bg-border-light rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-2">
          <span>
            {pathway.total_duration_minutes} min total
          </span>
          <span>{pct}% complete</span>
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-2">
        {modules
          .sort((a, b) => a.module_order - b.module_order)
          .map((module, idx) => {
            const isLocked = module.is_locked
            const status = isLocked ? 'not_started' : (module.progress_status ?? 'not_started')
            const cfg = STATUS_CONFIG[status]

            return (
              <div key={module.id}>
                {isLocked ? (
                  <div className="bg-bg-card border border-border-light rounded-xl p-4 opacity-50 cursor-not-allowed">
                    <ModuleRow module={module} idx={idx} cfg={cfg} locked />
                  </div>
                ) : (
                  <Link href={`/education/module/${module.id}`} className="group block">
                    <div className={`bg-bg-card border rounded-xl p-4 transition-all duration-200 ${
                      status === 'completed'
                        ? 'border-brand/20 hover:border-brand/40'
                        : status === 'in_progress'
                        ? 'border-blue-500/20 hover:border-blue-500/40'
                        : 'border-border-light hover:border-brand/30 hover:shadow-sm'
                    }`}>
                      <ModuleRow module={module} idx={idx} cfg={cfg} locked={false} />
                    </div>
                  </Link>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

function ModuleRow({
  module, idx, cfg, locked
}: {
  module: { title: string; description: string | null; duration_minutes: number | null; pdf_url: string | null }
  idx: number
  cfg: { icon: string; colour: string; bg: string; border: string }
  locked: boolean
}) {
  return (
    <div className="flex items-start gap-4">
      {/* Status orb */}
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${cfg.bg} ${cfg.border} ${cfg.colour}`}>
        {locked ? '🔒' : cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-[10px] text-text-secondary mb-0.5`}>
              Module {idx + 1}
            </p>
            <h3 className="font-semibold text-text-primary text-sm leading-snug">
              {module.title}
            </h3>
            {module.description && (
              <p className="text-text-secondary text-xs mt-1 leading-relaxed line-clamp-2">
                {module.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {module.pdf_url && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-red/10 text-status-red border border-status-red/20">
                PDF
              </span>
            )}
            {module.duration_minutes && (
              <span className="text-[10px] text-text-secondary font-data">
                {module.duration_minutes}m
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
