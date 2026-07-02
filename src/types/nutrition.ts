// src/types/nutrition.ts

export type NutritionTargets = {
  id: string
  gymmaster_member_id: string
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  if_method: '16:8' | '14:10' | '5:2' | 'none' | null
  updated_at: string
  updated_by: string | null
}

export type NutritionLog = {
  id: string
  gymmaster_member_id: string
  date: string  // ISO date string: 'YYYY-MM-DD'
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  updated_at: string
}

export type NutritionLogItem = {
  id: string
  log_id: string
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  quantity_g: number
  barcode: string | null
  source: 'barcode' | 'manual'
  created_at: string
}

// Nutrition per 100g from Open Food Facts
export type OFFNutriments = {
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fats_per_100g: number
}

// Parsed product from Open Food Facts barcode lookup
export type OFFProduct = {
  barcode: string
  name: string       // product_name from OFF
  brand: string      // brands from OFF
  serving_size_g: number | null  // serving_size parsed to grams
  nutriments: OFFNutriments
}

// Default targets to use when no nutrition_targets row exists for a member
export const DEFAULT_TARGETS: Omit<NutritionTargets, 'id' | 'gymmaster_member_id' | 'updated_at' | 'updated_by'> = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fats_g: 65,
  if_method: null,
}

// Data shape for the weekly chart: 7 days, oldest first
export type WeekDay = {
  date: string    // 'YYYY-MM-DD'
  label: string   // 'Mon', 'Tue', etc.
  calories: number | null  // null = not logged
}
