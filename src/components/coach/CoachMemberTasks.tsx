'use client'

import { useState } from 'react'

type Task = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  set_by: string
  completed_at: string | null
  created_at: string
}

type Props = {
  memberId: string
  memberName: string
  initialTasks: Task[]
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dueDateLabel(dateStr: string | null): { label: string; overdue: boolean } | null {
  if (!dateStr) return null
  const due = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'Due today', overdue: false }
  if (diff === 1) return { label: 'Due tomorrow', overdue: false }
  return { label: `Due ${formatDate(dateStr)}`, overdue: false }
}

export default function CoachMemberTasks({ memberId, memberName, initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const pending = tasks.filter(t => !t.completed_at)
  const completed = tasks.filter(t => t.completed_at)

  async function handleAdd() {
    if (!title.trim()) return
    setSaving(true)

    const res = await fetch(`/api/coach/members/${memberId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || null,
        due_date: dueDate || null,
        member_name: memberName,
      }),
    })

    if (res.ok) {
      const { task } = await res.json()
      setTasks(ts => [task, ...ts])
      setTitle('')
      setDescription('')
      setDueDate('')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(taskId: string) {
    setDeletingId(taskId)
    const res = await fetch(`/api/coach/members/${memberId}/tasks/${taskId}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks(ts => ts.filter(t => t.id !== taskId))
    }
    setDeletingId(null)
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-text-primary text-sm">📋 Tasks</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition-colors"
          >
            + Add Task
          </button>
        )}
      </div>

      {/* Add task form */}
      {showForm && (
        <div className="mb-4 p-3 bg-bg-main border border-border-light rounded-xl space-y-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title…"
            className="w-full bg-bg-card border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-bg-card border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="flex-1 bg-bg-card border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!title.trim() || saving}
              className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Add Task'}
            </button>
            <button
              onClick={() => { setShowForm(false); setTitle(''); setDescription(''); setDueDate('') }}
              className="px-4 py-2 rounded-lg border border-border-light text-text-secondary text-sm hover:border-brand/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length === 0 && !showForm ? (
        <p className="text-xs text-text-secondary">No tasks assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {pending.map(task => {
            const due = dueDateLabel(task.due_date)
            return (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-border-light bg-bg-main">
                <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-border-light shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary leading-tight">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-text-secondary mt-0.5">{task.description}</p>
                  )}
                  {due && (
                    <p className={`text-[11px] mt-1 font-medium ${due.overdue ? 'text-red-500' : 'text-text-secondary'}`}>
                      {due.label}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={deletingId === task.id}
                  aria-label="Delete task"
                  className="text-text-secondary hover:text-red-400 transition-colors disabled:opacity-40 shrink-0 p-0.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed tasks (collapsible) */}
      {completed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="text-[11px] text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            {showCompleted ? '▾' : '▸'} {completed.length} completed task{completed.length !== 1 ? 's' : ''}
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1.5">
              {completed.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-xl border border-border-light opacity-60">
                  <div className="w-4 h-4 mt-0.5 rounded-full bg-brand/30 border-2 border-brand/40 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary line-through leading-tight">{task.title}</p>
                    {task.completed_at && (
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        Completed {formatDate(task.completed_at.split('T')[0])}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={deletingId === task.id}
                    aria-label="Delete task"
                    className="text-text-secondary hover:text-red-400 transition-colors disabled:opacity-40 shrink-0 p-0.5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
