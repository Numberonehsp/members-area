'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Partner = {
  id: string
  name: string
  category: string
  emoji: string
  description: string
  offer: string
  website: string
  is_active: boolean
  display_order: number
}

type DraftPartner = Omit<Partner, 'id' | 'display_order'>

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PARTNERS: Partner[] = [
  { id: '1', name: 'Fuel & Flourish Nutrition', category: 'Nutrition', emoji: '🥗', description: 'Sports nutrition consultancy offering HSP members a free initial consultation and 10% off all coaching packages.', offer: 'Free initial consultation + 10% off', website: 'fuelflourish.co.uk', is_active: true, display_order: 1 },
  { id: '2', name: 'Physio First Cardiff', category: 'Physiotherapy', emoji: '🩺', description: 'Expert physiotherapy and sports injury rehabilitation. Priority booking for HSP members and a discounted first session.', offer: 'Priority booking + 15% off first session', website: 'physiofirstcardiff.co.uk', is_active: true, display_order: 2 },
  { id: '3', name: 'Revive Recovery Studio', category: 'Recovery', emoji: '💆', description: 'Ice baths, infrared sauna, and compression therapy. Show your HSP membership for a member discount on every visit.', offer: '10% off every visit', website: 'reviverecovery.co.uk', is_active: true, display_order: 3 },
  { id: '4', name: 'Performance Lab Apparel', category: 'Apparel', emoji: '👕', description: 'Technical training wear designed for performance. HSP members get an exclusive discount code.', offer: 'Exclusive member discount', website: 'perflab.co.uk', is_active: true, display_order: 4 },
  { id: '5', name: 'Cardiff Meal Prep Co.', category: 'Nutrition', emoji: '🍱', description: 'Weekly meal prep service tailored to your macros. Mention HSP Gym for a discount on your first order.', offer: '10% off first order', website: 'cardiffmealprep.co.uk', is_active: true, display_order: 5 },
  { id: '6', name: 'SleepWell Clinic', category: 'Wellness', emoji: '😴', description: 'Sleep coaching and CBT-I therapy. HSP members get a reduced rate on consultations.', offer: 'Reduced rate on consultations', website: 'sleepwellclinic.co.uk', is_active: true, display_order: 6 },
  { id: '7', name: 'MindStrong Psychology', category: 'Mental Performance', emoji: '🧠', description: 'Sports psychology and performance mindset coaching.', offer: 'Free 20-minute discovery call', website: 'mindstrongpsych.co.uk', is_active: true, display_order: 7 },
  { id: '8', name: 'The Protein Bakery', category: 'Nutrition', emoji: '🧁', description: 'High-protein baked goods and snacks. Collection available at the gym on Fridays.', offer: 'Friday collection available at HSP', website: 'theproteinbakery.co.uk', is_active: false, display_order: 8 },
]

const BLANK_DRAFT: DraftPartner = {
  name: '',
  category: '',
  emoji: '',
  description: '',
  offer: '',
  website: '',
  is_active: true,
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
        checked ? 'bg-brand' : 'bg-border-light'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PartnerManagerPage() {
  const [partners, setPartners] = useState<Partner[]>(() =>
    [...SEED_PARTNERS].sort((a, b) => a.display_order - b.display_order)
  )

  // ── UI state ──
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftPartner>(BLANK_DRAFT)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [modalSaved, setModalSaved] = useState(false)

  // ── Flash helpers ──
  function flashRow(id: string) {
    setSavedId(id)
    setTimeout(() => setSavedId(null), 1800)
  }
  function flashModal() {
    setModalSaved(true)
    setTimeout(() => setModalSaved(false), 1800)
  }

  // ── Reorder ──
  function move(id: string, dir: 'up' | 'down') {
    setPartners(prev => {
      const list = [...prev]
      const idx = list.findIndex(p => p.id === id)
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= list.length) return prev
      ;[list[idx], list[target]] = [list[target], list[idx]]
      return list.map((p, i) => ({ ...p, display_order: i + 1 }))
    })
  }

  // ── Toggle active ──
  function toggleActive(id: string) {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
    flashRow(id)
  }

  // ── Modal actions ──
  function openAdd() {
    setDraft(BLANK_DRAFT)
    setEditingId(null)
    setModalMode('add')
    setModalSaved(false)
  }
  function openEdit(p: Partner) {
    setDraft({
      name: p.name,
      category: p.category,
      emoji: p.emoji,
      description: p.description,
      offer: p.offer,
      website: p.website,
      is_active: p.is_active,
    })
    setEditingId(p.id)
    setModalMode('edit')
    setModalSaved(false)
  }
  function closeModal() {
    setModalMode(null)
    setEditingId(null)
    setDraft(BLANK_DRAFT)
    setModalSaved(false)
  }
  function saveModal() {
    if (modalMode === 'add') {
      const newPartner: Partner = {
        id: `partner-${Date.now()}`,
        ...draft,
        display_order: partners.length + 1,
      }
      setPartners(prev => [...prev, newPartner])
      flashModal()
      setTimeout(closeModal, 900)
    } else if (modalMode === 'edit' && editingId) {
      setPartners(prev => prev.map(p => p.id === editingId ? { ...p, ...draft } : p))
      flashModal()
      flashRow(editingId)
      setTimeout(closeModal, 900)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Coach</p>
          <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95]">
            Partner Manager
          </h1>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 mt-1 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors"
        >
          + Add Partner
        </button>
      </div>

      {/* Partner list */}
      <div className="space-y-2">
        {partners.map((p, idx) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 bg-bg-card border border-border-light rounded-2xl p-4 hover:border-brand/20 transition-colors ${
              !p.is_active ? 'opacity-60' : ''
            }`}
          >
            {/* Emoji */}
            <div className="w-10 h-10 rounded-xl bg-bg-main border border-border-light flex items-center justify-center text-xl shrink-0">
              {p.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-semibold text-sm text-text-primary">{p.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-bg-main text-text-secondary border-border-light font-medium">
                  {p.category}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                  p.is_active
                    ? 'bg-status-green/10 text-status-green border-status-green/20'
                    : 'bg-status-amber/10 text-status-amber border-status-amber/20'
                }`}>
                  {p.is_active ? '● Active' : '○ Inactive'}
                </span>
                {savedId === p.id && (
                  <span className="text-[10px] text-brand font-semibold animate-pulse">✓</span>
                )}
              </div>
              <p className="text-xs text-text-secondary">{p.website}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => move(p.id, 'up')}
                  disabled={idx === 0}
                  className="w-5 h-4 flex items-center justify-center text-text-secondary hover:text-brand disabled:opacity-20 disabled:cursor-not-allowed text-[9px] transition-colors"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(p.id, 'down')}
                  disabled={idx === partners.length - 1}
                  className="w-5 h-4 flex items-center justify-center text-text-secondary hover:text-brand disabled:opacity-20 disabled:cursor-not-allowed text-[9px] transition-colors"
                >
                  ▼
                </button>
              </div>

              {/* Toggle active */}
              <button
                onClick={() => toggleActive(p.id)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border-light text-text-secondary hover:border-brand/30 hover:text-brand transition-colors"
              >
                {p.is_active ? 'Deactivate' : 'Activate'}
              </button>

              {/* Edit */}
              <button
                onClick={() => openEdit(p)}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand font-medium hover:bg-brand/20 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-text-secondary mt-6 text-center">
        Changes will persist to Supabase once wired in Phase 5 backend work.
      </p>

      {/* ── ADD / EDIT MODAL ── */}
      {modalMode !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="p-5 border-b border-border-light flex items-center justify-between">
              <h2 className="font-display text-2xl text-text-primary">
                {modalMode === 'add' ? 'New Partner' : 'Edit Partner'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Fields */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div>
                  <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Name</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                    className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                    placeholder="Partner name"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Emoji</label>
                  <input
                    type="text"
                    value={draft.emoji}
                    onChange={e => setDraft(d => ({ ...d, emoji: e.target.value.slice(-2) }))}
                    className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors text-center text-xl"
                    placeholder="🏋️"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Category</label>
                <input
                  type="text"
                  value={draft.category}
                  onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  placeholder="e.g. Nutrition, Recovery, Wellness"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={draft.description}
                  onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors resize-none"
                  placeholder="Brief description shown to members"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Offer</label>
                <input
                  type="text"
                  value={draft.offer}
                  onChange={e => setDraft(d => ({ ...d, offer: e.target.value }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  placeholder="e.g. 10% off first order"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Website</label>
                <input
                  type="text"
                  value={draft.website}
                  onChange={e => setDraft(d => ({ ...d, website: e.target.value }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  placeholder="example.co.uk"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium text-text-primary">Active</p>
                  <p className="text-xs text-text-secondary">Visible to members on the Partners page</p>
                </div>
                <Toggle
                  checked={draft.is_active}
                  onChange={v => setDraft(d => ({ ...d, is_active: v }))}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border-light flex items-center gap-3">
              <button
                onClick={saveModal}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
              >
                {modalSaved ? '✓ Saved' : modalMode === 'add' ? 'Add Partner' : 'Save Changes'}
              </button>
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-border-light text-text-secondary text-sm hover:border-brand/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
