import ContentManager from '@/components/coach/ContentManager'
import { SEED_PATHWAYS, SEED_MODULES, SEED_RESOURCES } from '@/lib/education-seed'

// TODO: replace with Supabase queries
// const { data: pathways } = await supabase
//   .from('education_pathways').select('*, education_modules(count)')
//   .order('display_order')
// const { data: resources } = await supabase
//   .from('education_resources').select('*').order('created_at', { ascending: false })

export default function ContentManagerPage() {
  return (
    <ContentManager
      pathways={SEED_PATHWAYS}
      modules={SEED_MODULES}
      resources={SEED_RESOURCES}
    />
  )
}
