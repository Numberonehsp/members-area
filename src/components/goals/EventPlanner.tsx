import { cookies } from 'next/headers'
import { fetchAllMemberEvents } from '@/lib/staffhub'
import EventPlannerClient from './EventPlannerClient'

export default async function EventPlanner() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'

  const events = await fetchAllMemberEvents(memberId)

  return <EventPlannerClient initialEvents={events} />
}
