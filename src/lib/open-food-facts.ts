// src/lib/open-food-facts.ts

import type { OFFProduct } from '@/types/nutrition'

type OFFApiResponse = {
  status: number  // 1 = found, 0 = not found
  product?: {
    product_name?: string
    brands?: string
    serving_size?: string
    nutriments?: {
      'energy-kcal_100g'?: number
      proteins_100g?: number
      carbohydrates_100g?: number
      fat_100g?: number
    }
  }
}

// Parse a serving_size string like "150g" or "2 biscuits (28g)" → grams as number
// Returns null if no gram value can be extracted
function parseServingSizeGrams(raw: string | undefined): number | null {
  if (!raw) return null
  const match = raw.match(/(\d+(?:\.\d+)?)\s*g/i)
  return match ? parseFloat(match[1]) : null
}

export async function fetchProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,serving_size,nutriments`

  const res = await fetch(url, {
    next: { revalidate: 86400 },  // cache for 24 hours — product data rarely changes
  })

  if (!res.ok) return null

  const data: OFFApiResponse = await res.json()

  if (data.status !== 1 || !data.product) return null

  const p = data.product
  const n = p.nutriments ?? {}

  return {
    barcode,
    name: p.product_name?.trim() || 'Unknown product',
    brand: p.brands?.trim() || null,
    serving_size_g: parseServingSizeGrams(p.serving_size),
    nutriments: {
      calories_per_100g: Math.round(n['energy-kcal_100g'] ?? 0),
      protein_per_100g:  parseFloat((n.proteins_100g ?? 0).toFixed(1)),
      carbs_per_100g:    parseFloat((n.carbohydrates_100g ?? 0).toFixed(1)),
      fats_per_100g:     parseFloat((n.fat_100g ?? 0).toFixed(1)),
    },
  }
}

// Calculate nutrition for a given portion size
export function calculatePortion(
  product: OFFProduct,
  quantityG: number
): { calories: number; protein_g: number; carbs_g: number; fats_g: number } {
  const ratio = quantityG / 100
  return {
    calories:  Math.round(product.nutriments.calories_per_100g * ratio),
    protein_g: parseFloat((product.nutriments.protein_per_100g * ratio).toFixed(1)),
    carbs_g:   parseFloat((product.nutriments.carbs_per_100g * ratio).toFixed(1)),
    fats_g:    parseFloat((product.nutriments.fats_per_100g * ratio).toFixed(1)),
  }
}
