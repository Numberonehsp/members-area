import ContentManager from '@/components/coach/ContentManager'
import { getContentWithOverrides } from '@/lib/content'

export default async function ContentManagerPage() {
  const { pathways, modules, resources } = await getContentWithOverrides()
  return <ContentManager pathways={pathways} modules={modules} resources={resources} />
}
