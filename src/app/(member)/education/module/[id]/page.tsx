export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  SEED_MODULES,
  SEED_PATHWAYS,
  SEED_QUIZ,
  getModuleNeighbours,
} from '@/lib/education-seed'
import ModuleViewer from '@/components/education/ModuleViewer'
import type { Module, Pathway } from '@/types/education'

function isUuid(id: string) {
  return /^[0-9a-f]{8}-/.test(id)
}

async function loadDbModule(moduleId: string): Promise<{ module: Module; pathway: Pathway; allModules: Module[] } | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: m } = await supabase.from('education_modules').select('*').eq('id', moduleId).single()
  if (!m) return null
  const [{ data: p }, { data: siblings }] = await Promise.all([
    supabase.from('education_pathways').select('*').eq('id', m.pathway_id).single(),
    supabase.from('education_modules').select('*').eq('pathway_id', m.pathway_id).order('module_order'),
  ])
  if (!p) return null
  const toModule = (r: Record<string, unknown>): Module => ({
    id: r.id as string, pathway_id: r.pathway_id as string,
    title: r.title as string, description: r.description as string | null,
    module_order: r.module_order as number, video_url: r.video_url as string | null,
    pdf_url: r.pdf_url as string | null, duration_minutes: r.duration_minutes as number | null,
    is_published: r.is_published as boolean, created_at: r.created_at as string,
    progress_status: 'not_started' as const,
  })
  const allModules = (siblings ?? []).map(toModule)
  const pathway: Pathway = {
    id: p.id, title: p.title, description: p.description, category: p.category,
    is_sequential: p.is_sequential, display_order: p.display_order,
    thumbnail_url: p.thumbnail_url, is_published: p.is_published,
    required_plan: p.required_plan ?? null, created_at: p.created_at,
    module_count: allModules.length,
    total_duration_minutes: allModules.reduce((s, mod) => s + (mod.duration_minutes ?? 0), 0),
  }
  return { module: toModule(m), pathway, allModules }
}

export default async function ModuleViewPage({
  params,
}: PageProps<'/education/module/[id]'>) {
  const { id } = await params

  const cookieStore = await cookies()
  const { parseMemberPlans, canAccess } = await import('@/lib/education-access')
  const memberPlans = parseMemberPlans(cookieStore.get('gymmaster_plans')?.value)

  let module: Module | null = null
  let pathway: Pathway | null = null
  let allModules: Module[] = []

  if (isUuid(id)) {
    const result = await loadDbModule(id)
    if (!result) notFound()
    module = result.module
    pathway = result.pathway
    allModules = result.allModules
  } else {
    for (const [pathwayId, modules] of Object.entries(SEED_MODULES)) {
      const found = modules.find(m => m.id === id)
      if (found) {
        module = found
        pathway = SEED_PATHWAYS.find(p => p.id === pathwayId) ?? null
        allModules = modules
        break
      }
    }
  }

  if (!module || !pathway) notFound()

  // Block access if the pathway requires a plan the member doesn't have, and this isn't module 1
  const pathwayAccess = canAccess(pathway.required_plan, memberPlans)
  if (pathwayAccess === 'locked' && module.module_order > 1) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-6">
          <Link href="/education" className="hover:text-brand transition-colors">Education Hub</Link>
          <span>→</span>
          <Link href={`/education/pathway/${pathway.id}`} className="hover:text-brand transition-colors">
            {pathway.title}
          </Link>
          <span>→</span>
          <span className="text-text-primary">Module {module.module_order}</span>
        </div>

        <div className="bg-bg-card border border-status-amber/30 rounded-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-status-amber via-yellow-400 to-transparent" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-status-amber/10 border border-status-amber/30 flex items-center justify-center text-3xl mx-auto mb-5">⭐</div>
            <h2 className="font-display text-3xl text-text-primary mb-2">Perform membership required</h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto mb-6">
              <strong className="text-text-primary">{module.title}</strong> is Module {module.module_order} of{' '}
              {pathway.title}. Full pathway access is included with Perform membership.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/education/pathway/${pathway.id}`} className="px-5 py-2.5 rounded-xl border border-border-light text-sm text-text-secondary hover:border-brand/30 hover:text-brand transition-colors">
                ← Back to pathway
              </Link>
              <a href="mailto:info@numberonehsp.com?subject=Upgrade to Perform" className="px-5 py-2.5 rounded-xl bg-status-amber text-white text-sm font-semibold hover:bg-yellow-500 transition-colors">
                Upgrade membership →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { prev, next } = getModuleNeighbours(allModules, id)
  const quiz = SEED_QUIZ[id] ?? []

  return (
    <ModuleViewer
      module={module}
      pathway={pathway}
      quiz={quiz}
      prev={prev}
      next={next}
      pathwayModuleCount={pathway.module_count ?? allModules.length}
    />
  )
}
