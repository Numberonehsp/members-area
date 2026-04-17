// =============================================
// Education — shared TypeScript types
// =============================================

export type Category = 'nutrition' | 'training' | 'recovery' | 'mindset'
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type ResourceType = 'video' | 'pdf' | 'article' | 'link'

export type Pathway = {
  id: string
  title: string
  description: string | null
  category: Category
  is_sequential: boolean
  display_order: number
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
  // Computed / joined fields
  module_count?: number
  total_duration_minutes?: number
  completed_count?: number  // for logged-in member
}

export type Module = {
  id: string
  pathway_id: string
  title: string
  description: string | null
  module_order: number
  video_url: string | null   // YouTube unlisted embed URL
  pdf_url: string | null
  duration_minutes: number | null
  is_published: boolean
  created_at: string
  // Computed / joined fields
  progress_status?: ProgressStatus
  is_locked?: boolean  // true if sequential and prev not complete
}

export type ModuleProgress = {
  id: string
  member_id: string
  module_id: string
  status: ProgressStatus
  started_at: string | null
  completed_at: string | null
  quiz_score: number | null
}

export type Resource = {
  id: string
  title: string
  description: string | null
  category: Category
  resource_type: ResourceType
  url: string
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
}

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correct_index: number
}
