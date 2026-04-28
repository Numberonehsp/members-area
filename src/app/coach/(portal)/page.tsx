import { getAllMembers } from '@/lib/gymmaster'
import CoachDashboardClient from './CoachDashboardClient'

function getUpcomingBirthdays(members: Awaited<ReturnType<typeof getAllMembers>>) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return members
    .filter((m) => m.dob)
    .map((m) => {
      const dob = new Date(m.dob!)
      const thisYear = today.getFullYear()

      // Birthday this calendar year
      let next = new Date(thisYear, dob.getMonth(), dob.getDate())
      if (next < today) {
        // Already passed this year — use next year
        next = new Date(thisYear + 1, dob.getMonth(), dob.getDate())
      }

      const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000)
      const age = next.getFullYear() - dob.getFullYear()

      return { id: m.id, name: `${m.firstName} ${m.lastName}`, daysUntil, age }
    })
    .filter((b) => b.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

export default async function CoachDashboardPage() {
  const members = await getAllMembers()
  const upcomingBirthdays = getUpcomingBirthdays(members)

  return <CoachDashboardClient members={members} upcomingBirthdays={upcomingBirthdays} />
}
