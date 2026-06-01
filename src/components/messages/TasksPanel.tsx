'use client'

import { useState } from 'react'
import { type PendingTask, formatDueDate } from '@/lib/tasks'

export default function TasksPanel({ initialTasks }: { initialTasks: PendingTask[] }) {
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
    <div className="shrink-0 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold text-text-secondary">From your coach</p>
        <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-semibold">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map(task => {
          const due = formatDueDate(task.due_date)
          return (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-xl border border-border-light bg-bg-card p-3"
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
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{task.description}</p>
                )}
                {due && (
                  <p className={`text-[11px] mt-0.5 font-medium ${due.overdue ? 'text-red-500' : 'text-text-secondary'}`}>
                    {due.label}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <hr className="border-border-light mt-3" />
    </div>
  )
}
