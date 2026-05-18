import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import {
  SEED_MODULES,
  SEED_PATHWAYS,
  SEED_QUIZ,
  getModuleNeighbours,
} from '@/lib/education-seed'
import ModuleViewer from '@/components/education/ModuleViewer'

export default async function ModuleViewPage({
  params,
}: PageProps<'/education/module/[id]'>) {
  const { id } = await params

  const cookieStore = await cookies()
  const memberTier = (cookieStore.get('gymmaster_access_tier')?.value ?? 'standard') as 'full' | 'standard'

  // TODO: replace with Supabase query
  let module = null
  let pathway = null

  for (const [pathwayId, modules] of Object.entries(SEED_MODULES)) {
    const found = modules.find(m => m.id === id)
    if (found) {
      module = found
      pathway = SEED_PATHWAYS.find(p => p.id === pathwayId) ?? null
      break
    }
  }

  if (!module || !pathway) notFound()

  // Block access to modules beyond the first one for standard-tier members
  if (memberTier === 'standard' && module.module_order > 1) {
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
            <div className="w-16 h-16 rounded-full bg-status-amber/10 border border-status-amber/30 flex items-center justify-center text-3xl mx-auto mb-5">
              ⭐
            </div>
            <h2 className="font-display text-3xl text-text-primary mb-2">
              Perform membership required
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto mb-6">
              <strong className="text-text-primary">{module.title}</strong> is Module {module.module_order} of{' '}
              {pathway.title}. Full pathway access is included with Perform membership.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/education/pathway/${pathway.id}`}
                className="px-5 py-2.5 rounded-xl border border-border-light text-sm text-text-secondary hover:border-brand/30 hover:text-brand transition-colors"
              >
                ← Back to pathway
              </Link>
              <a
                href="mailto:info@numberonehsp.com?subject=Upgrade to Perform"
                className="px-5 py-2.5 rounded-xl bg-status-amber text-white text-sm font-semibold hover:bg-yellow-500 transition-colors"
              >
                Upgrade to Perform →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const allModules = SEED_MODULES[pathway.id] ?? []
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
