import { cookies } from 'next/headers'
import CategoryTabs from '@/components/education/CategoryTabs'
import ContinueLearning from '@/components/education/ContinueLearning'
import { SEED_MODULES } from '@/lib/education-seed'
import { getContentWithOverrides } from '@/lib/content'

export default async function EducationHubPage() {
  const cookieStore = await cookies()
  const memberTier = (cookieStore.get('gymmaster_access_tier')?.value ?? 'standard') as 'full' | 'standard'

  const { pathways, resources } = await getContentWithOverrides()
  const publishedPathways = pathways.filter(p => p.is_published !== false)

  const inProgressPathway = publishedPathways.find(p =>
    (p.completed_count ?? 0) > 0 && (p.completed_count ?? 0) < (p.module_count ?? 0)
  )
  const inProgressModule = inProgressPathway
    ? SEED_MODULES[inProgressPathway.id]?.find(m => m.progress_status === 'in_progress')
      ?? SEED_MODULES[inProgressPathway.id]?.find(m => m.progress_status === 'not_started' && !m.is_locked)
    : null

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">Learn</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          Education<br />
          <span className="text-brand">Hub</span>
        </h1>
        <p className="text-text-secondary text-sm max-w-xl">
          Structured pathways and a library of standalone resources — everything you need
          to understand the why behind your training.
        </p>
      </div>

      {inProgressPathway && inProgressModule && (
        <div className="mb-10 max-w-xl">
          <ContinueLearning pathway={inProgressPathway} module={inProgressModule} />
        </div>
      )}

      <CategoryTabs pathways={publishedPathways} resources={resources.filter(r => r.is_published !== false)} memberTier={memberTier} />
    </div>
  )
}
