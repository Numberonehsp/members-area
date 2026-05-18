import { cookies } from 'next/headers'
import CategoryTabs from '@/components/education/CategoryTabs'
import ContinueLearning from '@/components/education/ContinueLearning'
import { SEED_MODULES } from '@/lib/education-seed'
import { getContentWithOverrides } from '@/lib/content'
import { parseMemberPlans, canAccess } from '@/lib/education-access'

export default async function EducationHubPage() {
  const cookieStore = await cookies()
  const memberPlans = parseMemberPlans(cookieStore.get('gymmaster_plans')?.value)

  const { pathways, resources } = await getContentWithOverrides()
  const publishedPathways = pathways.filter(p => p.is_published !== false)
  const publishedResources = resources.filter(r => r.is_published !== false)

  // Foundations resources are shown in their own section, not in the main library
  const foundationsResources = publishedResources.filter(r => r.required_plan === 'foundations')
  const mainResources = publishedResources.filter(r => r.required_plan !== 'foundations')

  // Only show "continue" for pathways the member can actually access
  const accessiblePathways = publishedPathways.filter(
    p => canAccess(p.required_plan, memberPlans) === 'full'
  )
  const inProgressPathway = accessiblePathways.find(p =>
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

      <CategoryTabs
        pathways={publishedPathways}
        resources={mainResources}
        memberPlans={Array.from(memberPlans)}
        foundationsResources={foundationsResources}
      />
    </div>
  )
}
