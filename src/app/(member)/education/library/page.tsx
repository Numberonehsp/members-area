import Link from 'next/link'
import LibraryGrid from '@/components/education/LibraryGrid'
import { SEED_RESOURCES } from '@/lib/education-seed'

// TODO: replace with Supabase query
// const { data: resources } = await supabase
//   .from('education_resources').select('*')
//   .eq('is_published', true).order('created_at', { ascending: false })

export default function OpenLibraryPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <Link href="/education" className="text-xs text-text-secondary hover:text-brand transition-colors inline-flex items-center gap-1 mb-6">
        ← Education Hub
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">Resources</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          Open<br />
          <span className="text-brand">Library</span>
        </h1>
        <p className="text-text-secondary text-sm max-w-xl">
          Standalone videos, PDFs, and articles — dip in and out as you need them.
        </p>
      </div>

      <LibraryGrid resources={SEED_RESOURCES} />
    </div>
  )
}
