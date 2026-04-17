import CategoryTabs from '@/components/education/CategoryTabs'
import ContinueLearning from '@/components/education/ContinueLearning'
import { SEED_PATHWAYS, SEED_MODULES, SEED_RESOURCES } from '@/lib/education-seed'

// TODO Phase 2 wiring: replace with Supabase queries
// const { data: pathways } = await supabase
//   .from('education_pathways').select('*, education_modules(count)')
//   .eq('is_published', true).order('display_order')
// const { data: resources } = await supabase
//   .from('education_resources').select('*')
//   .eq('is_published', true).order('created_at', { ascending: false })

export default function EducationHubPage() {
  // Find the active in-progress module for Continue Learning
  const inProgressPathway = SEED_PATHWAYS.find(p =>
    (p.completed_count ?? 0) > 0 && (p.completed_count ?? 0) < (p.module_count ?? 0)
  )
  const inProgressModule = inProgressPathway
    ? SEED_MODULES[inProgressPathway.id]?.find(m => m.progress_status === 'in_progress')
      ?? SEED_MODULES[inProgressPathway.id]?.find(m => m.progress_status === 'not_started' && !m.is_locked)
    : null

  return (
    <div>
      {/* Header */}
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

      {/* Continue Learning */}
      {inProgressPathway && inProgressModule && (
        <div className="mb-10 max-w-xl">
          <ContinueLearning pathway={inProgressPathway} module={inProgressModule} />
        </div>
      )}

      {/* Category tabs + content */}
      <CategoryTabs pathways={SEED_PATHWAYS} resources={SEED_RESOURCES} />
    </div>
  )
}
