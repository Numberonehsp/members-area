'use client'

import { useState } from 'react'
import { type PendingTask, formatDueDate } from '@/lib/tasks'

export default function ActiveCardTasks({ initialTasks }: { initialTasks: PendingTask[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [completing, setCompleting] = useState<string | null>(null)

  async function markComplete(id: string) {
    setCompleting(id)
    const res = await fetch(`/api/member/tasks/${id}`, { method: 'PATCH' })
    if (res.ok) setTasks(ts => ts.filter(t => t.id !== id))
    setCompleting(null)
  }

  if (tasks.length === 0) return null

  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary font-semibold mb-2">
        From your coach
      </p>
      <div className="space-y-2">
        {tasks.map(task => {
          const due = formatDueDate(task.due_date)
          return (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-xl border border-border-light bg-bg-main p-3"
            >
              <button
                onClick={() => markComplete(task.id)}
                disabled={completing === task.id}
                aria-label="Mark complete"
                className="mt-0.5 w-5 h-5 rounded-full border-2 border-border-light hover:border-brand transition-colors shrink-0 flex items-center justify-center disabled:opacity-50"
              >
                {completing === task.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand/40 animate-pulse" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary leading-tight">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{task.description}</p>
                )}
                {due && (
                  <p className={`text-[11px] mt-1 font-medium ${due.overdue ? 'text-red-500' : 'text-text-secondary'}`}>
                    {due.label}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
