'use client'

import { useState } from 'react'
import Link from 'next/link'

type Task = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  set_by: string
}

function formatDueDate(dateStr: string | null): { label: string; overdue: boolean } | null {
  if (!dateStr) return null
  const due = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)

  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'Due today', overdue: false }
  if (diff === 1) return { label: 'Due tomorrow', overdue: false }
  return { label: `Due ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, overdue: false }
}

export default function CoachTasksList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [completing, setCompleting] = useState<string | null>(null)

  async function markComplete(id: string) {
    setCompleting(id)
    const res = await fetch(`/api/member/tasks/${id}`, { method: 'PATCH' })
    if (res.ok) {
      setTasks(ts => ts.filter(t => t.id !== id))
    }
    setCompleting(null)
  }

  if (tasks.length === 0) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            From your coach
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Tasks</h2>
        </div>
        <Link
          href="/goals"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
        >
          View all →
        </Link>
      </div>

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
