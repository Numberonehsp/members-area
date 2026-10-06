import EventPlanner from '@/components/goals/EventPlanner'
import HabitsClient from '@/components/habits/HabitsClient'
import GoalsClient from '@/components/goals/GoalsClient'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <EventPlanner />
      <HabitsClient />
      <GoalsClient />
    </div>
  )
}
