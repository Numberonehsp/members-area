import { createClient } from '@supabase/supabase-js'
import { SEED_PATHWAYS, SEED_MODULES, SEED_RESOURCES } from './education-seed'
import type { Pathway, Module, Resource, EducationPlan, Category, ResourceType } from '@/types/education'

type Override = { id: string; entity_type: string; is_published: boolean; required_plan: string | null }

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function fetchOverrides(): Promise<Override[]> {
  const { data } = await supabaseClient()
    .from('education_publish_overrides')
    .select('id, entity_type, is_published, required_plan')
  return data ?? []
}

/** Fetch coach-created resources stored in the database (not seed content). */
async function fetchDbResources(): Promise<Resource[]> {
  try {
    const { data, error } = await supabaseClient()
      .from('education_resources')
      .select('id, title, description, category, resource_type, url, thumbnail_url, required_plan, is_published, created_at')
      .order('created_at', { ascending: true })
    if (error) {
      console.warn('[content] fetchDbResources failed:', error.message)
      return []
    }
    return (data ?? []).map(r => ({
      id: r.id as string,
      title: r.title as string,
      description: r.description as string | null,
      category: r.category as Category,
      resource_type: r.resource_type as ResourceType,
      url: r.url as string,
      thumbnail_url: r.thumbnail_url as string | null,
      required_plan: (r.required_plan as EducationPlan | null) ?? null,
      is_published: r.is_published as boolean,
      created_at: r.created_at as string,
    }))
  } catch (err) {
    console.warn('[content] fetchDbResources threw:', err)
    return []
  }
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
  let dbResources: Resource[] = []
  try {
    ;[overrides, dbResources] = await Promise.all([fetchOverrides(), fetchDbResources()])
  } catch {
    // Tables not yet created — return raw seed defaults
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

  // Seed resources with publish overrides applied
  const seedResources = SEED_RESOURCES.map(r => {
    const ov = resourceMap.get(r.id)
    return {
      ...r,
      is_published: ov ? ov.is_published : r.is_published,
      required_plan: ov && ov.required_plan !== undefined ? (ov.required_plan as EducationPlan | null) : r.required_plan,
    }
  })

  // DB resources are already fully resolved (no override merging needed)
  const resources = [...seedResources, ...dbResources]

  return { pathways, modules, resources }
}
