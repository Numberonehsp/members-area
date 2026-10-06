// src/types/habits.ts

export type HabitMetric =
  | 'sleep' | 'stretching' | 'hydration'
  | 'calories' | 'fat' | 'protein' | 'carbs'
  | 'steps' | 'distance' | 'workouts' | 'exercise_reps'

export type HabitCategory = 'wellbeing' | 'nutrition' | 'activity'
export type HabitCadence = 'daily' | 'weekly'
export type HabitAggregation = 'total' | 'average'
export type HabitStatus = 'active' | 'archived'

export type Habit = {
  id: string
  gymmaster_member_id: string
  metric: HabitMetric
  category: HabitCategory
  target: number | null
  cadence: HabitCadence
  aggregation: HabitAggregation | null
  start_date: string
  end_date: string | null
  status: HabitStatus
  created_at: string
  updated_at: string
}

export type HabitLog = {
  id: string
  habit_id: string
  date: string // 'YYYY-MM-DD'
  value: number
  updated_at: string
}

export type MetricConfig = {
  metric: HabitMetric
  category: HabitCategory
  label: string
  emoji: string
  unit: string
  /** Sleep is entered as hours + minutes and stored as total minutes. */
  inputKind: 'number' | 'hours_minutes'
}

export const METRIC_CONFIG: Record<HabitMetric, MetricConfig> = {
  sleep:         { metric: 'sleep',         category: 'wellbeing', label: 'Sleep',       emoji: '😴', unit: 'h',       inputKind: 'hours_minutes' },
  stretching:    { metric: 'stretching',    category: 'wellbeing', label: 'Stretching',  emoji: '🧘', unit: 'min',     inputKind: 'number' },
  hydration:     { metric: 'hydration',     category: 'wellbeing', label: 'Hydration',   emoji: '💧', unit: 'L',       inputKind: 'number' },
  calories:      { metric: 'calories',      category: 'nutrition', label: 'Calories',    emoji: '🔥', unit: 'kcal',    inputKind: 'number' },
  fat:           { metric: 'fat',           category: 'nutrition', label: 'Fat',         emoji: '🥑', unit: 'g',       inputKind: 'number' },
  protein:       { metric: 'protein',       category: 'nutrition', label: 'Protein',     emoji: '🍗', unit: 'g',       inputKind: 'number' },
  carbs:         { metric: 'carbs',         category: 'nutrition', label: 'Carbs',       emoji: '🍞', unit: 'g',       inputKind: 'number' },
  steps:         { metric: 'steps',         category: 'activity',  label: 'Steps',       emoji: '👟', unit: 'steps',   inputKind: 'number' },
  distance:      { metric: 'distance',      category: 'activity',  label: 'Distance',    emoji: '🏃', unit: 'km',      inputKind: 'number' },
  workouts:      { metric: 'workouts',      category: 'activity',  label: 'Workouts',    emoji: '🏋️', unit: 'sessions', inputKind: 'number' },
  exercise_reps: { metric: 'exercise_reps', category: 'activity',  label: 'Exercise',    emoji: '💪', unit: 'reps',    inputKind: 'number' },
}

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  wellbeing: 'Wellbeing',
  nutrition: 'Nutrition',
  activity: 'Activity',
}

export const CATEGORY_ORDER: HabitCategory[] = ['wellbeing', 'nutrition', 'activity']

/** Calories/Fat/Protein/Carbs read from nutrition_logs — they never get their own habit_logs rows. */
export const NUTRITION_METRICS: ReadonlySet<HabitMetric> = new Set<HabitMetric>(['calories', 'fat', 'protein', 'carbs'])

export function metricsInCategory(category: HabitCategory): MetricConfig[] {
  return Object.values(METRIC_CONFIG).filter((m) => m.category === category)
}

export const MAX_ACTIVE_HABITS = 5
