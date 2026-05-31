import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchBringAFriendEvent } from '@/lib/staffhub'
import GuestSignUpForm from './GuestSignUpForm'

function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BringAFriendPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await fetchBringAFriendEvent(id)
  if (!event) notFound()

  const cookieStore = await cookies()
  const isLoggedIn = !!cookieStore.get('gymmaster_member_id')?.value

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link
          href="/community"
          className="text-xs text-text-secondary hover:text-brand transition-colors font-medium mb-3 inline-block"
        >
          ← Community
        </Link>
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Bring a Friend
        </p>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {event.title}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {formatDate(event.start_date)}
        </p>
        {event.description && (
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      <GuestSignUpForm eventId={event.id} isLoggedIn={isLoggedIn} />
    </div>
  )
}
