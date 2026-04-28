import { getAllMembers } from '@/lib/gymmaster'
import CoachMembersClient from './CoachMembersClient'

export default async function CoachMembersPage() {
  const members = await getAllMembers()
  return <CoachMembersClient members={members} />
}
