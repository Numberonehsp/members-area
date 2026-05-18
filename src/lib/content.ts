import { createClient } from '@supabase/supabase-js'
import { SEED_PATHWAYS, SEED_MODULES, SEED_RESOURCES } from './education-seed'
import type { Pathway, Module, Resource, EducationPlan } from '@/types/education'

type Override = { id: string; entity_type: string; is_published: boolean; required_plan: string | null }

async function fetchOverrides(): Promise<Override[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data } = await supabase
    .from('education_publish_overrides')
    .select('id, entity_type, is_published, required_plan')
  return data ?? []
}

export type MergedContent = {
  pathways: Pathway[]
  modules: Record<string, Module[]>
  resources: Resource[]
}

/**
 * Returns seed content with publish state overridden by coach decisions stored in Supabase.
 * Falls back to seed defaults if the table doesn't exist yet (e.g. before migration runs).
 */
export async function getContentWithOverrides(): Promise<MergedContent> {
  let overrides: Override[] = []
  try {
    overrides = await fetchOverrides()
  } catch {
    // Table not yet created — return raw seed defaults
  }

  const pathwayMap = new Map(
    overrides.filter(o => o.entity_type === 'pathway').map(o => [o.id, o])
  )
  const moduleMap = new Map(
    overrides.filter(o => o.entity_type === 'module').map(o => [o.id, o])
  )
  const resourceMap = new Map(
    overrides.filter(o => o.entity_type === 'resource').map(o => [o.id, o])
  )

  const pathways = SEED_PATHWAYS.map(p => {
    const ov = pathwayMap.get(p.id)
    return {
      ...p,
      is_published: ov ? ov.is_published : p.is_published,
      required_plan: ov && ov.required_plan !== undefined ? (ov.required_plan as EducationPlan | null) : p.required_plan,
    }
  })

  const modules: Record<string, Module[]> = {}
  for (const [pathwayId, mods] of Object.entries(SEED_MODULES)) {
    modules[pathwayId] = mods.map(m => {
      const ov = moduleMap.get(m.id)
      return { ...m, is_published: ov ? ov.is_published : m.is_published }
    })
  }

  const resources = SEED_RESOURCES.map(r => {
    const ov = resourceMap.get(r.id)
    return {
      ...r,
      is_published: ov ? ov.is_published : r.is_published,
      required_plan: ov && ov.required_plan !== undefined ? (ov.required_plan as EducationPlan | null) : r.required_plan,
    }
  })

  return { pathways, modules, resources }
}
