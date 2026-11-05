// Turning stored answers into words and chart numbers for the coach view. Pure.

import type { Answers, AnswerValue } from './answers'
import { sectionsFor, type Question, type Variant } from './schema'
import type { Scores } from './scoring'

export type AnswerRow = { id: string; label: string; text: string }
export type AnswerSection = { key: string; title: string; rows: AnswerRow[] }

const optionLabel = (q: Extract<Question, { options: unknown }>, v: string) => q.options.find(o => o.value === v)?.label ?? v

export function formatAnswer(q: Question, v: AnswerValue | undefined, answers: Answers = {}): string | null {
  if (v === undefined || v === '') return null
  let text: string
  switch (q.kind) {
    case 'single':
      text = typeof v === 'string' ? optionLabel(q, v) : String(v)
      break
    case 'multi':
      text = Array.isArray(v) ? v.map(x => optionLabel(q, x)).join(', ') : String(v)
      if (text === '') return null
      break
    case 'yesno': {
      text = v === true ? 'Yes' : v === false ? 'No' : String(v)
      const detail = q.detailId ? answers[q.detailId] : undefined
      if (v === true && typeof detail === 'string' && detail !== '') text += `: ${detail}`
      break
    }
    case 'scale':
      text = `${v}/10`
      break
    case 'hours':
      text = `${v} hours`
      break
    default:
      text = String(v)
  }
  return text
}

/** Every answered question, grouped in form order. Detail boxes are folded into their Yes/No row. */
export function answerSections(variant: Variant, answers: Answers): AnswerSection[] {
  const out: AnswerSection[] = []
  for (const s of sectionsFor(variant)) {
    const rows: AnswerRow[] = []
    for (const q of s.questions) {
      const text = formatAnswer(q, answers[q.id], answers)
      if (text !== null) rows.push({ id: q.id, label: q.label, text })
    }
    if (rows.length > 0) out.push({ key: s.key, title: s.title, rows })
  }
  return out
}

export const RADAR_AXES = [
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'health', label: 'Health' },
  { key: 'support', label: 'Support' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'stress', label: 'Stress' },
] as const

export const READINESS = [
  { key: 'ready', label: 'Ready' },
  { key: 'willing', label: 'Willing' },
  { key: 'able', label: 'Able' },
] as const

export const TIME_USE = [
  { key: 'work', label: 'Work' },
  { key: 'study', label: 'Study' },
  { key: 'travel', label: 'Travel' },
  { key: 'caring', label: 'Caring' },
  { key: 'other', label: 'Other' },
] as const

/** Radar corner for an axis: 1 to 10 maps from the centre to the edge, clockwise from the top. */
export function radarPoint(index: number, count: number, value: number, radius: number, cx: number, cy: number): [number, number] {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  const r = (Math.max(0, Math.min(10, value)) / 10) * radius
  return [Math.round((cx + r * Math.cos(angle)) * 10) / 10, Math.round((cy + r * Math.sin(angle)) * 10) / 10]
}

/** Points for the radar polygon. Missing ratings count as 0 so the shape still closes. */
export function radarPolygon(ratings: Scores['ratings'], radius: number, cx: number, cy: number): string {
  return RADAR_AXES.map((a, i) => radarPoint(i, RADAR_AXES.length, ratings[a.key] ?? 0, radius, cx, cy).join(',')).join(' ')
}

/** Sleep bar position: 4 hours or fewer is empty, 10 or more is full. */
export const sleepPercent = (hours: number): number => Math.max(0, Math.min(100, Math.round(((hours - 4) / 6) * 100)))
