// Turn answers into chart numbers and coach flags. Pure, no database.
// Flags are prompts for a conversation, never a diagnosis.

import type { Answers } from './answers'

export type Scores = {
  ratings: { nutrition?: number; health?: number; support?: number; schedule?: number; stress?: number; ready?: number; willing?: number; able?: number }
  sleepHours?: number
  /** Weekly hours by use of time, and their total. */
  timeUse: { work: number; study: number; travel: number; caring: number; other: number; total: number }
}

export type FlagCode =
  | 'medical_condition'
  | 'pain_or_injury'
  | 'medication'
  | 'low_health'
  | 'high_stress'
  | 'low_sleep'
  | 'low_support'
  | 'asthma_or_allergy'
  | 'readiness_gap'

export const FLAG_LABELS: Record<FlagCode, string> = {
  medical_condition: 'Has a medical condition or injury, past or present',
  pain_or_injury: 'Pain, illness or injury right now',
  medication: 'Takes medication',
  low_health: 'Rates own health 4 or lower',
  high_stress: 'Stress 8 or higher',
  low_sleep: 'Sleeps too little (5 hours or fewer; 7 or fewer for the youth form)',
  low_support: 'Support around them 3 or lower',
  asthma_or_allergy: 'Asthma, allergy or emergency medical need (youth form)',
  readiness_gap: 'Ready or willing, but not able',
}

const num = (a: Answers, id: string): number | undefined => (typeof a[id] === 'number' ? (a[id] as number) : undefined)

const SLEEP: Record<string, number> = { '4-': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10+': 10 }
const YOUTH_SLEEP: Record<string, number> = { '7-': 7, '8': 8, '9': 9, '10': 10, '11+': 11 }

/** Youth athletes need more sleep: 7 hours or fewer is the flag, not 5. */
export const LOW_SLEEP_HOURS = { adult: 5, youth: 7 } as const

export function scoresFor(a: Answers): Scores {
  const work = num(a, 'hours_work') ?? 0
  const study = num(a, 'hours_study') ?? 0
  const travel = num(a, 'hours_travel') ?? 0
  const caring = num(a, 'hours_caring') ?? 0
  const other = num(a, 'hours_other') ?? 0
  const sleep =
    typeof a.sleep_hours === 'string' ? SLEEP[a.sleep_hours] : typeof a.sleep_hours_youth === 'string' ? YOUTH_SLEEP[a.sleep_hours_youth] : undefined
  return {
    ratings: {
      nutrition: num(a, 'rating_nutrition'),
      health: num(a, 'rating_health'),
      support: num(a, 'rating_support'),
      schedule: num(a, 'rating_schedule'),
      stress: num(a, 'rating_stress'),
      ready: num(a, 'ready'),
      willing: num(a, 'willing'),
      able: num(a, 'able'),
    },
    sleepHours: sleep,
    timeUse: { work, study, travel, caring, other, total: work + study + travel + caring + other },
  }
}

export function flagsFor(a: Answers, variant: 'adult' | 'youth' = 'adult'): FlagCode[] {
  const s = scoresFor(a)
  const r = s.ratings
  const out: FlagCode[] = []
  if (a.has_condition === true) out.push('medical_condition')
  if (a.has_pain === true) out.push('pain_or_injury')
  if (a.takes_meds === true) out.push('medication')
  if (a.has_asthma_allergy === true) out.push('asthma_or_allergy')
  if (r.health !== undefined && r.health <= 4) out.push('low_health')
  if (r.stress !== undefined && r.stress >= 8) out.push('high_stress')
  if (s.sleepHours !== undefined && s.sleepHours <= LOW_SLEEP_HOURS[variant]) out.push('low_sleep')
  if (r.support !== undefined && r.support <= 3) out.push('low_support')
  if (r.able !== undefined && r.able <= 4 && ((r.ready ?? 0) >= 7 || (r.willing ?? 0) >= 7)) out.push('readiness_gap')
  return out
}
