'use client'

import { useState } from 'react'
import type { OFFProduct, NutritionLog } from '@/types/nutrition'
import { calculatePortion } from '@/lib/open-food-facts'

type Props = {
  product: OFFProduct
  date: string
  onAdded: (updatedLog: NutritionLog) => void
  onClose: () => void
}

export default function PortionPicker({ product, date, onAdded, onClose }: Props) {
  const defaultGrams = product.serving_size_g ?? 100
  const [useServing, setUseServing] = useState(product.serving_size_g !== null)
  const [customGrams, setCustomGrams] = useState(String(defaultGrams))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quantityG = useServing && product.serving_size_g
    ? product.serving_size_g
    : parseFloat(customGrams) || 100

  const portion = calculatePortion(product, quantityG)

  async function handleAdd() {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          item: {
            name:      `${product.brand ? product.brand + ' ' : ''}${product.name}`.trim(),
            calories:  portion.calories,
            protein_g: portion.protein_g,
            carbs_g:   portion.carbs_g,
            fats_g:    portion.fats_g,
            quantity_g: quantityG,
            barcode:   product.barcode,
            source:    'barcode' as const,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      onAdded(data.log)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-xl text-text-primary">{product.name}</h2>
              {product.brand && <p className="text-xs text-text-secondary">{product.brand}</p>}
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none ml-4">×</button>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-bg-main rounded-xl p-3 mb-4 text-center">
            {[
              { label: 'Kcal', value: product.nutriments.calories_per_100g },
              { label: 'Pro', value: `${product.nutriments.protein_per_100g}g` },
              { label: 'Carb', value: `${product.nutriments.carbs_per_100g}g` },
              { label: 'Fat', value: `${product.nutriments.fats_per_100g}g` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-text-secondary uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-text-primary">{value}</p>
              </div>
            ))}
            <p className="col-span-4 text-[10px] text-text-secondary mt-0.5">per 100g</p>
          </div>

          <p className="text-xs text-text-secondary mb-2">How much did you have?</p>
          <div className="flex gap-2 mb-3">
            {product.serving_size_g && (
              <button
                onClick={() => setUseServing(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  useServing
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-bg-main border-border-light text-text-secondary hover:border-brand/50'
                }`}
              >
                1 serving ({product.serving_size_g}g)
              </button>
            )}
            <button
              onClick={() => setUseServing(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                !useServing
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-bg-main border-border-light text-text-secondary hover:border-brand/50'
              }`}
            >
              Custom (g)
            </button>
          </div>

          {!useServing && (
            <input
              type="number"
              inputMode="decimal"
              value={customGrams}
              onChange={(e) => setCustomGrams(e.target.value)}
              placeholder="e.g. 200"
              className="w-full bg-bg-main border border-border-light rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-brand transition-colors mb-3"
            />
          )}

          <div className="grid grid-cols-4 gap-2 bg-brand/5 border border-brand/20 rounded-xl p-3 mb-4 text-center">
            {[
              { label: 'Kcal', value: portion.calories },
              { label: 'Pro', value: `${portion.protein_g}g` },
              { label: 'Carb', value: `${portion.carbs_g}g` },
              { label: 'Fat', value: `${portion.fats_g}g` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-brand uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-text-primary">{value}</p>
              </div>
            ))}
            <p className="col-span-4 text-[10px] text-brand mt-0.5">for {quantityG}g</p>
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={saving || (!useServing && !parseFloat(customGrams))}
            className="w-full bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Adding…' : '+ Add to Today'}
          </button>
        </div>
      </div>
    </div>
  )
}
