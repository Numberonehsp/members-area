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

  // TODO: replace with Supabase query
  // Find which pathway this module belongs to
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
