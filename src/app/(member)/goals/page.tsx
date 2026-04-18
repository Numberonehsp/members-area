import EventPlanner from '@/components/goals/EventPlanner'
import GoalsClient from '@/components/goals/GoalsClient'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <EventPlanner />
      <GoalsClient />
    </div>
  )
}
