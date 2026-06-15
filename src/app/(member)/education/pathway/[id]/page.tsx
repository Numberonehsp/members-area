export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { SEED_PATHWAYS, SEED_MODULES, getPathwayProgress } from '@/lib/education-seed'
import { notFound } from 'next/navigation'
import type { Pathway, Module } from '@/types/education'

const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗', training: '🏋️', recovery: '🛌', mindset: '🧠',
}

const STATUS_CONFIG = {
  completed:   { icon: '✓', colour: 'text-brand',           bg: 'bg-brand/10',           border: 'border-brand/20'           },
  in_progress: { icon: '▶', colour: 'text-blue-600',        bg: 'bg-blue-500/10',        border: 'border-blue-500/20'        },
  not_started: { icon: '○', colour: 'text-text-secondary',  bg: 'bg-bg-main',            border: 'border-border-light'       },
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-/.test(id)
}

async function loadDbPathway(id: string): Promise<{ pathway: Pathway; modules: Module[] } | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [{ data: p }, { data: mods }] = await Promise.all([
    supabase.from('education_pathways').select('*').eq('id', id).single(),
    supabase.from('education_modules').select('*').eq('pathway_id', id).order('module_order'),
  ])
  if (!p) return null
  return {
    pathway: {
      id: p.id, title: p.title, description: p.description,
      category: p.category, is_sequential: p.is_sequential,
      display_order: p.display_order, thumbnail_url: p.thumbnail_url,
      is_published: p.is_published, required_plan: p.required_plan ?? null,
      created_at: p.created_at,
      module_count: (mods ?? []).length,
      total_duration_minutes: (mods ?? []).reduce((s: number, m: Module) => s + (m.duration_minutes ?? 0), 0),
    },
    modules: (mods ?? []).map((m: Module) => ({ ...m, progress_status: 'not_started' as const })),
  }
}

export default async function PathwayDetailPage({
  params,
}: PageProps<'/education/pathway/[id]'>) {
  const { id } = await params

  const cookieStore = await cookies()
  const { parseMemberPlans, canAccess } = await import('@/lib/education-access')
  const memberPlans = parseMemberPlans(cookieStore.get('gymmaster_plans')?.value)

  let pathway: Pathway | undefined
  let modules: Module[]

  if (isUuid(id)) {
    const result = await loadDbPathway(id)
    if (!result) notFound()
    pathway = result.pathway
    modules = result.modules
  } else {
    pathway = SEED_PATHWAYS.find(p => p.id === id)
    if (!pathway) notFound()
    modules = SEED_MODULES[id] ?? []
  }

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
          <span>{pathway.total_duration_minutes} min total</span>
          <span>{pct}% complete</span>
        </div>
      </div>

      {/* Notice when member can see this pathway but modules 2+ are locked */}
      {pathway.required_plan && canAccess(pathway.required_plan, memberPlans) === 'locked' && (
        <div className="bg-status-amber/10 border border-status-amber/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl mt-0.5">⭐</span>
          <div>
            <p className="text-sm font-semibold text-text-primary mb-0.5">First module free</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Module 1 of every pathway is included with your membership. Upgrade to access the full pathway and resource library.
            </p>
          </div>
        </div>
      )}

      {/* Module list */}
      <div className="space-y-2">
        {modules
          .sort((a, b) => a.module_order - b.module_order)
          .map((module, idx) => {
            const membershipLocked =
              !!pathway.required_plan &&
              canAccess(pathway.required_plan, memberPlans) === 'locked' &&
              module.module_order > 1
            const isLocked = membershipLocked || module.is_locked
            const status = isLocked ? 'not_started' : (module.progress_status ?? 'not_started')
            const cfg = STATUS_CONFIG[status]

            return (
              <div key={module.id}>
                {isLocked ? (
                  <div className={`bg-bg-card border border-border-light rounded-xl p-4 cursor-not-allowed ${membershipLocked ? 'opacity-60' : 'opacity-50'}`}>
                    <ModuleRow module={module} idx={idx} cfg={cfg} locked membershipLocked={membershipLocked} />
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
                      <ModuleRow module={module} idx={idx} cfg={cfg} locked={false} membershipLocked={false} />
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
  module, idx, cfg, locked, membershipLocked
}: {
  module: { title: string; description: string | null; duration_minutes: number | null; pdf_url: string | null }
  idx: number
  cfg: { icon: string; colour: string; bg: string; border: string }
  locked: boolean
  membershipLocked: boolean
}) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${cfg.bg} ${cfg.border} ${cfg.colour}`}>
        {membershipLocked ? '⭐' : locked ? '🔒' : cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] text-text-secondary mb-0.5">Module {idx + 1}</p>
            <h3 className="font-semibold text-text-primary text-sm leading-snug">{module.title}</h3>
            {module.description && (
              <p className="text-text-secondary text-xs mt-1 leading-relaxed line-clamp-2">{module.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {membershipLocked && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-status-amber/10 text-status-amber border-status-amber/30">
                Perform+
              </span>
            )}
            {module.pdf_url && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-red/10 text-status-red border border-status-red/20">PDF</span>
            )}
            {module.duration_minutes && (
              <span className="text-[10px] text-text-secondary font-data">{module.duration_minutes}m</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
