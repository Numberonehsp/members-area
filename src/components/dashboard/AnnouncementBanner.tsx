import { StaffHubEvent } from '@/lib/staffhub'

type Props = {
  announcement: StaffHubEvent | null
}

export default function AnnouncementBanner({ announcement }: Props) {
  if (!announcement) return null

  return (
    <div className="mb-6">
      <div className="rounded-xl px-5 py-4 border-l-4 bg-brand/10 border-brand">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-brand">
              <span className="mr-1.5">📌</span>
              {announcement.title}
            </p>
            {announcement.description && (
              <p className="text-text-secondary text-sm mt-1 leading-relaxed">
                {announcement.description}
              </p>
            )}
          </div>
          <span className="shrink-0 text-[11px] text-text-secondary whitespace-nowrap">
            {new Date(announcement.start_date + 'T00:00:00').toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
