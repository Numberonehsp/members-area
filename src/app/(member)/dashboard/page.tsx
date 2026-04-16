import { cookies } from 'next/headers'
import AnnouncementBanner from '@/components/dashboard/AnnouncementBanner'
import ChallengesPreview from '@/components/dashboard/ChallengesPreview'
import GymEvents from '@/components/dashboard/GymEvents'
import { fetchAnnouncements } from '@/lib/staffhub'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const firstName = cookieStore.get('gymmaster_first_name')?.value || 'there'

  const announcements = await fetchAnnouncements()
  const latestAnnouncement = announcements[0] ?? null

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">
          Hey, {firstName}!
        </h1>
      </div>

      {/* Announcements */}
      <AnnouncementBanner announcement={latestAnnouncement} />

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Challenges */}
        <ChallengesPreview />

        {/* Gym Events */}
        <GymEvents />
      </div>
    </div>
  )
}
