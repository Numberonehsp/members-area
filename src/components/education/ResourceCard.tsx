import type { Resource } from '@/types/education'

const TYPE_CONFIG: Record<string, { label: string; icon: string; colour: string }> = {
  video:   { label: 'Video',   icon: '▶', colour: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  pdf:     { label: 'PDF',     icon: '📄', colour: 'bg-status-red/10 text-status-red border-status-red/20' },
  article: { label: 'Article', icon: '📝', colour: 'bg-brand/10 text-brand border-brand/20' },
  link:    { label: 'Link',    icon: '🔗', colour: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
}

const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗', training: '🏋️', recovery: '🛌', mindset: '🧠',
}

type Props = { resource: Resource }

export default function ResourceCard({ resource }: Props) {
  const type = TYPE_CONFIG[resource.resource_type] ?? TYPE_CONFIG.link
  const isExternal = resource.resource_type === 'video' || resource.resource_type === 'link'

  return (
    <a
      href={resource.url}
      target={isExternal ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className="group block bg-bg-card border border-border-light rounded-xl p-4 hover:border-brand/40 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-bg-main border border-border-light flex items-center justify-center text-lg shrink-0">
          {CATEGORY_ICONS[resource.category] ?? '📌'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-text-primary text-sm leading-snug group-hover:text-brand transition-colors line-clamp-2">
              {resource.title}
            </h3>
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${type.colour}`}>
              {type.icon} {type.label}
            </span>
          </div>
          {resource.description && (
            <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
              {resource.description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}
