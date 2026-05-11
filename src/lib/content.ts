import { createClient } from '@supabase/supabase-js'
import { SEED_PATHWAYS, SEED_MODULES, SEED_RESOURCES } from './education-seed'
import type { Pathway, Module, Resource } from '@/types/education'

type Override = { id: string; entity_type: string; is_published: boolean }

async function fetchOverrides(): Promise<Override[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data } = await supabase
    .from('education_publish_overrides')
    .select('id, entity_type, is_published')
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
    overrides.filter(o => o.entity_type === 'pathway').map(o => [o.id, o.is_published])
  )
  const moduleMap = new Map(
    overrides.filter(o => o.entity_type === 'module').map(o => [o.id, o.is_published])
  )
  const resourceMap = new Map(
    overrides.filter(o => o.entity_type === 'resource').map(o => [o.id, o.is_published])
  )

  const pathways = SEED_PATHWAYS.map(p => ({
    ...p,
    is_published: pathwayMap.has(p.id) ? pathwayMap.get(p.id)! : p.is_published,
  }))

  const modules: Record<string, Module[]> = {}
  for (const [pathwayId, mods] of Object.entries(SEED_MODULES)) {
    modules[pathwayId] = mods.map(m => ({
      ...m,
      is_published: moduleMap.has(m.id) ? moduleMap.get(m.id)! : m.is_published,
    }))
  }

  const resources = SEED_RESOURCES.map(r => ({
    ...r,
    is_published: resourceMap.has(r.id) ? resourceMap.get(r.id)! : r.is_published,
  }))

  return { pathways, modules, resources }
}
