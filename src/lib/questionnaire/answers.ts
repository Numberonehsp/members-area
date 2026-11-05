// Checking answers on the server. Pure: no database, no network.

import { ALL_QUESTIONS, SHORT_TEXT_MAX, TEXT_MAX, questionById, type Question } from './schema'

export type AnswerValue = string | number | boolean | string[]
export type Answers = Record<string, AnswerValue>

type Checked = { ok: true; value: AnswerValue } | { ok: false; error: string }

function checkOne(q: Question, v: unknown): Checked {
  switch (q.kind) {
    case 'text': {
      if (typeof v !== 'string') return { ok: false, error: 'text expected' }
      const t = v.trim()
      if (t.length > (q.short ? SHORT_TEXT_MAX : TEXT_MAX)) return { ok: false, error: 'too long' }
      return { ok: true, value: t }
    }
    case 'yesno':
      return typeof v === 'boolean' ? { ok: true, value: v } : { ok: false, error: 'yes or no expected' }
    case 'scale':
      return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 10 ? { ok: true, value: v } : { ok: false, error: '1 to 10 expected' }
    case 'hours':
      return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 168 ? { ok: true, value: Math.round(v * 2) / 2 } : { ok: false, error: '0 to 168 expected' }
    case 'single':
      return typeof v === 'string' && q.options.some(o => o.value === v) ? { ok: true, value: v } : { ok: false, error: 'not an option' }
    case 'multi': {
      if (!Array.isArray(v) || v.length > q.options.length) return { ok: false, error: 'list expected' }
      const allowed = new Set(q.options.map(o => o.value))
      if (!v.every(x => typeof x === 'string' && allowed.has(x))) return { ok: false, error: 'not an option' }
      return { ok: true, value: [...new Set(v as string[])] }
    }
  }
}

/**
 * Keep only known questions with valid values. A blank text answer is dropped.
 * Used for drafts, which may be incomplete. Unknown ids and bad values are an error.
 */
export function cleanAnswers(raw: unknown): { ok: true; answers: Answers } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'Answers must be an object.' }
  const out: Answers = {}
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const q = questionById(id)
    if (!q) return { ok: false, error: 'Unknown question.' }
    if (v === null || v === undefined) continue
    const c = checkOne(q, v)
    if (!c.ok) return { ok: false, error: `Check your answer to “${q.label}”: ${c.error}.` }
    if (typeof c.value === 'string' && c.value === '') continue
    out[id] = c.value
  }
  return { ok: true, answers: out }
}

/** Required questions with no answer, in order. Empty means ready to submit. */
export function missingRequired(answers: Answers): Question[] {
  return ALL_QUESTIONS.filter(q => q.required && (answers[q.id] === undefined || (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0)))
}
