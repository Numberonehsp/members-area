'use client'

import { useState, useRef } from 'react'
import type { Pathway, Module, Resource, Category } from '@/types/education'
import { PLAN_OPTIONS } from '@/lib/education-access'
import type { EducationPlan } from '@/lib/education-access'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  pathways: Pathway[]
  modules: Record<string, Module[]>
  resources: Resource[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗', training: '🏋️', recovery: '🛌', mindset: '🧠',
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'training', label: 'Training' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'mindset', label: 'Mindset' },
]

const TYPE_CONFIG: Record<string, { icon: string; colour: string }> = {
  video:   { icon: '▶', colour: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  pdf:     { icon: '📄', colour: 'text-status-red bg-status-red/10 border-status-red/20' },
  article: { icon: '📝', colour: 'text-brand bg-brand/10 border-brand/20' },
  link:    { icon: '🔗', colour: 'text-status-amber bg-status-amber/10 border-status-amber/20' },
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

// ─── PDF Uploader ─────────────────────────────────────────────────────────────

function PdfUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/coach/content/upload-pdf', { method: 'POST', body: form })
    const json = await res.json()
    if (res.ok) {
      onChange(json.url)
    } else {
      setError(json.error ?? 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setError(null) }}
          className="flex-1 bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
          placeholder="Paste URL or upload a file →"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 px-3 py-2.5 rounded-xl border border-border-light text-sm text-text-secondary hover:border-brand/40 hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {uploading ? (
            <span className="animate-pulse">Uploading…</span>
          ) : (
            <>
              <span>📄</span>
              <span>Upload PDF</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {value && !uploading && (
        <div className="flex items-center gap-2">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand hover:underline truncate flex-1"
          >
            ✓ {value.split('/').pop()}
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-text-secondary hover:text-red-400 transition-colors shrink-0"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContentManager({ pathways: initPathways, modules: initModules, resources: initResources }: Props) {
  // ── Core state ──
  const [tab, setTab] = useState<'pathways' | 'library'>('pathways')
  const [pathways, setPathways] = useState<Pathway[]>(() =>
    [...initPathways].sort((a, b) => a.display_order - b.display_order)
  )
  const [modulesMap, setModulesMap] = useState<Record<string, Module[]>>(() => {
    const sorted: Record<string, Module[]> = {}
    for (const [k, v] of Object.entries(initModules)) {
      sorted[k] = [...v].sort((a, b) => a.module_order - b.module_order)
    }
    return sorted
  })
  const [resources, setResources] = useState<Resource[]>(initResources)

  // ── UI state ──
  const [expandedPathway, setExpandedPathway] = useState<string | null>(null)
  const [moduleModal, setModuleModal] = useState<{ pathwayId: string; module: Module | null } | null>(null)
  const [resourceModal, setResourceModal] = useState<Resource | 'new' | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  // ── Draft state ──
  const [draftModule, setDraftModule] = useState<Partial<Module>>({})
  const [draftResource, setDraftResource] = useState<Partial<Resource>>({})

  // ── Flash saved indicator ──
  function flashSaved(id: string) {
    setSavedId(id)
    setTimeout(() => setSavedId(null), 2000)
  }

  // ── Persist publish state and/or required_plan ──
  function savePublish(id: string, entity_type: 'pathway' | 'module' | 'resource', is_published: boolean, required_plan?: EducationPlan | null) {
    fetch('/api/coach/content/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, entity_type, is_published, ...(required_plan !== undefined ? { required_plan } : {}) }),
    })
  }

  // ── Pathway plan ──
  function setPathwayPlan(id: string, plan: EducationPlan | null) {
    const pathway = pathways.find(p => p.id === id)!
    setPathways(prev => prev.map(p => p.id === id ? { ...p, required_plan: plan } : p))
    flashSaved(id)
    savePublish(id, 'pathway', pathway.is_published, plan)
  }

  // ── Pathway actions ──
  function togglePathwayPublished(id: string) {
    const newValue = !pathways.find(p => p.id === id)!.is_published
    setPathways(prev => prev.map(p => p.id === id ? { ...p, is_published: newValue } : p))
    flashSaved(id)
    savePublish(id, 'pathway', newValue)
  }

  // ── Module modal ──
  function openNewModule(pathwayId: string) {
    setDraftModule({ pathway_id: pathwayId, title: '', description: '', video_url: '', pdf_url: '', duration_minutes: undefined, is_published: false })
    setModuleModal({ pathwayId, module: null })
  }
  function openEditModule(pathwayId: string, m: Module) {
    setDraftModule({ ...m })
    setModuleModal({ pathwayId, module: m })
  }
  function closeModuleModal() {
    setModuleModal(null)
    setDraftModule({})
  }
  function saveModule() {
    if (!moduleModal) return
    const { pathwayId, module: existing } = moduleModal
    setModulesMap(prev => {
      const list = prev[pathwayId] ?? []
      if (existing) {
        return { ...prev, [pathwayId]: list.map(m => m.id === existing.id ? { ...m, ...draftModule } as Module : m) }
      } else {
        const newMod: Module = {
          id: `mod-${Date.now()}`,
          pathway_id: pathwayId,
          title: draftModule.title ?? 'New Module',
          description: draftModule.description ?? null,
          video_url: draftModule.video_url || null,
          pdf_url: draftModule.pdf_url || null,
          duration_minutes: draftModule.duration_minutes ?? null,
          module_order: list.length + 1,
          is_published: draftModule.is_published ?? false,
          created_at: new Date().toISOString(),
        }
        return { ...prev, [pathwayId]: [...list, newMod] }
      }
    })
    flashSaved(pathwayId)
    closeModuleModal()
  }

  // ── Module reorder ──
  function moveModule(pathwayId: string, idx: number, dir: 'up' | 'down') {
    setModulesMap(prev => {
      const list = [...(prev[pathwayId] ?? [])]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= list.length) return prev
      ;[list[idx], list[target]] = [list[target], list[idx]]
      return { ...prev, [pathwayId]: list.map((m, i) => ({ ...m, module_order: i + 1 })) }
    })
  }

  // ── Module publish toggle ──
  function toggleModulePublished(pathwayId: string, moduleId: string) {
    let newValue = false
    setModulesMap(prev => {
      const updated = {
        ...prev,
        [pathwayId]: (prev[pathwayId] ?? []).map(m => {
          if (m.id === moduleId) {
            newValue = !m.is_published
            return { ...m, is_published: newValue }
          }
          return m
        }),
      }
      return updated
    })
    savePublish(moduleId, 'module', newValue)
  }

  // ── Resource modal ──
  function openNewResource() {
    setDraftResource({ title: '', description: '', category: 'training', resource_type: 'video', url: '', is_published: false })
    setResourceModal('new')
  }
  function openEditResource(r: Resource) {
    setDraftResource({ ...r })
    setResourceModal(r)
  }
  function closeResourceModal() {
    setResourceModal(null)
    setDraftResource({})
  }
  function saveResource() {
    if (resourceModal === 'new') {
      const newRes: Resource = {
        id: `res-${Date.now()}`,
        title: draftResource.title ?? 'New Resource',
        description: draftResource.description ?? null,
        category: draftResource.category ?? 'training',
        resource_type: draftResource.resource_type ?? 'article',
        url: draftResource.url ?? '',
        thumbnail_url: null,
        required_plan: draftResource.required_plan ?? null,
        is_published: draftResource.is_published ?? false,
        created_at: new Date().toISOString(),
      }
      setResources(prev => [...prev, newRes])
      flashSaved(newRes.id)
      savePublish(newRes.id, 'resource', newRes.is_published, newRes.required_plan)
    } else if (resourceModal) {
      const updated = { ...resourceModal, ...draftResource } as Resource
      setResources(prev => prev.map(r => r.id === resourceModal.id ? updated : r))
      flashSaved(resourceModal.id)
      savePublish(resourceModal.id, 'resource', updated.is_published, updated.required_plan)
    }
    closeResourceModal()
  }
  function toggleResourcePublished(id: string) {
    let newValue = false
    setResources(prev => prev.map(r => {
      if (r.id === id) {
        newValue = !r.is_published
        return { ...r, is_published: newValue }
      }
      return r
    }))
    flashSaved(id)
    savePublish(id, 'resource', newValue)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Coach</p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-6">
        Content Manager
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-main border border-border-light rounded-xl p-1 mb-8 w-fit">
        {[
          { key: 'pathways' as const, label: '📚 Pathways' },
          { key: 'library' as const, label: '📂 Open Library' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-bg-card text-text-primary shadow-sm border border-border-light'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PATHWAYS TAB ── */}
      {tab === 'pathways' && (
        <div className="space-y-3">
          {pathways.map(pathway => {
            const mods = modulesMap[pathway.id] ?? []
            const isExpanded = expandedPathway === pathway.id
            const publishedMods = mods.filter(m => m.is_published).length

            return (
              <div key={pathway.id} className="bg-bg-card border border-border-light rounded-2xl overflow-hidden">
                {/* Pathway row */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-main border border-border-light flex items-center justify-center text-xl shrink-0">
                    {CATEGORY_ICONS[pathway.category] ?? '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-semibold text-text-primary text-sm">{pathway.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        pathway.is_published
                          ? 'bg-status-green/10 text-status-green border-status-green/20'
                          : 'bg-bg-main text-text-secondary border-border-light'
                      }`}>
                        {pathway.is_published ? '● Live' : '○ Draft'}
                      </span>
                      {savedId === pathway.id && (
                        <span className="text-[10px] text-brand font-semibold animate-pulse">✓ Saved</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">
                      {mods.length} module{mods.length !== 1 ? 's' : ''} · {publishedMods} published
                      {pathway.total_duration_minutes ? ` · ${pathway.total_duration_minutes} min total` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={pathway.required_plan ?? ''}
                      onChange={e => setPathwayPlan(pathway.id, (e.target.value as EducationPlan) || null)}
                      className="text-xs bg-bg-main border border-border-light rounded-lg px-2 py-1.5 text-text-secondary focus:outline-none focus:border-brand transition-colors"
                    >
                      {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                      onClick={() => togglePathwayPublished(pathway.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border-light text-text-secondary hover:border-brand/30 hover:text-brand transition-colors"
                    >
                      {pathway.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => setExpandedPathway(isExpanded ? null : pathway.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-light text-text-secondary hover:border-brand/30 hover:text-brand transition-colors"
                    >
                      <span className={`inline-block transition-transform duration-200 text-xs ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </button>
                  </div>
                </div>

                {/* Module list */}
                {isExpanded && (
                  <div className="border-t border-border-light">
                    {mods.length === 0 && (
                      <p className="text-sm text-text-secondary text-center py-6">No modules yet.</p>
                    )}
                    {mods.map((mod, idx) => (
                      <div
                        key={mod.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-b-0 hover:bg-bg-main/40 transition-colors"
                      >
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            onClick={() => moveModule(pathway.id, idx, 'up')}
                            disabled={idx === 0}
                            className="w-5 h-4 flex items-center justify-center text-text-secondary hover:text-brand disabled:opacity-20 disabled:cursor-not-allowed text-[9px] transition-colors"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveModule(pathway.id, idx, 'down')}
                            disabled={idx === mods.length - 1}
                            className="w-5 h-4 flex items-center justify-center text-text-secondary hover:text-brand disabled:opacity-20 disabled:cursor-not-allowed text-[9px] transition-colors"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Order number */}
                        <span className="font-data text-xs text-text-secondary w-4 shrink-0 text-right">{idx + 1}</span>

                        {/* Module info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{mod.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {mod.duration_minutes && (
                              <span className="text-xs text-text-secondary">⏱ {mod.duration_minutes} min</span>
                            )}
                            {mod.video_url && <span className="text-xs text-text-secondary">▶ Video</span>}
                            {mod.pdf_url && <span className="text-xs text-text-secondary">📄 PDF</span>}
                          </div>
                        </div>

                        {/* Published toggle */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Toggle
                            checked={mod.is_published}
                            onChange={() => toggleModulePublished(pathway.id, mod.id)}
                          />
                          <span className="text-xs text-text-secondary hidden sm:inline">
                            {mod.is_published ? 'Live' : 'Draft'}
                          </span>
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => openEditModule(pathway.id, mod)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border-light text-text-secondary hover:border-brand/30 hover:text-brand transition-colors shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    ))}

                    {/* Add module */}
                    <button
                      onClick={() => openNewModule(pathway.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 text-xs text-brand hover:text-brand-dark font-medium transition-colors border-t border-border-light"
                    >
                      + Add Module
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === 'library' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">{resources.length} resource{resources.length !== 1 ? 's' : ''}</p>
            <button
              onClick={openNewResource}
              className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors"
            >
              + Add Resource
            </button>
          </div>

          <div className="space-y-2">
            {resources.map(resource => {
              const type = TYPE_CONFIG[resource.resource_type] ?? TYPE_CONFIG.link
              return (
                <div
                  key={resource.id}
                  className="flex items-center gap-3 bg-bg-card border border-border-light rounded-2xl p-4 hover:border-brand/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-bg-main border border-border-light flex items-center justify-center text-base shrink-0">
                    {CATEGORY_ICONS[resource.category] ?? '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-text-primary truncate">{resource.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${type.colour}`}>
                        {type.icon}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${
                        resource.is_published
                          ? 'bg-status-green/10 text-status-green border-status-green/20'
                          : 'bg-bg-main text-text-secondary border-border-light'
                      }`}>
                        {resource.is_published ? '● Live' : '○ Draft'}
                      </span>
                      {savedId === resource.id && (
                        <span className="text-[10px] text-brand font-semibold animate-pulse">✓ Saved</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary capitalize">{resource.category}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleResourcePublished(resource.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border-light text-text-secondary hover:border-brand/30 hover:text-brand transition-colors"
                    >
                      {resource.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => openEditResource(resource)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand font-medium hover:bg-brand/20 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MODULE MODAL ── */}
      {moduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-border-light flex items-center justify-between">
              <h2 className="font-display text-2xl text-text-primary">
                {moduleModal.module ? 'Edit Module' : 'New Module'}
              </h2>
              <button onClick={closeModuleModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Title</label>
                <input
                  type="text"
                  value={draftModule.title ?? ''}
                  onChange={e => setDraftModule(d => ({ ...d, title: e.target.value }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  placeholder="Module title"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={draftModule.description ?? ''}
                  onChange={e => setDraftModule(d => ({ ...d, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors resize-none"
                  placeholder="Brief description shown on the pathway page"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  value={draftModule.video_url ?? ''}
                  onChange={e => setDraftModule(d => ({ ...d, video_url: e.target.value }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
                <p className="text-[11px] text-text-secondary mt-1">Use the embed format: youtube.com/embed/VIDEO_ID</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">
                  PDF <span className="normal-case font-normal">(optional)</span>
                </label>
                <PdfUploader
                  value={draftModule.pdf_url ?? ''}
                  onChange={url => setDraftModule(d => ({ ...d, pdf_url: url || null }))}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Duration (minutes)</label>
                <input
                  type="number"
                  value={draftModule.duration_minutes ?? ''}
                  onChange={e => setDraftModule(d => ({ ...d, duration_minutes: Number(e.target.value) || undefined }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  placeholder="e.g. 12"
                  min={1}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium text-text-primary">Published</p>
                  <p className="text-xs text-text-secondary">Visible to members in this pathway</p>
                </div>
                <Toggle
                  checked={draftModule.is_published ?? false}
                  onChange={v => setDraftModule(d => ({ ...d, is_published: v }))}
                />
              </div>
            </div>

            <div className="p-5 border-t border-border-light flex gap-3">
              <button
                onClick={saveModule}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
              >
                {moduleModal.module ? 'Save Changes' : 'Add Module'}
              </button>
              <button
                onClick={closeModuleModal}
                className="px-5 py-2.5 rounded-xl border border-border-light text-text-secondary text-sm hover:border-brand/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESOURCE MODAL ── */}
      {resourceModal !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-border-light flex items-center justify-between">
              <h2 className="font-display text-2xl text-text-primary">
                {resourceModal === 'new' ? 'New Resource' : 'Edit Resource'}
              </h2>
              <button onClick={closeResourceModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Title</label>
                <input
                  type="text"
                  value={draftResource.title ?? ''}
                  onChange={e => setDraftResource(d => ({ ...d, title: e.target.value }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  placeholder="Resource title"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={draftResource.description ?? ''}
                  onChange={e => setDraftResource(d => ({ ...d, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Category</label>
                  <select
                    value={draftResource.category ?? 'training'}
                    onChange={e => setDraftResource(d => ({ ...d, category: e.target.value as Category }))}
                    className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  >
                    {CATEGORY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Type</label>
                  <select
                    value={draftResource.resource_type ?? 'article'}
                    onChange={e => setDraftResource(d => ({ ...d, resource_type: e.target.value as Resource['resource_type'] }))}
                    className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="article">Article</option>
                    <option value="link">Link</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">
                  {draftResource.resource_type === 'pdf' ? 'PDF' : 'URL'}
                </label>
                {draftResource.resource_type === 'pdf' ? (
                  <PdfUploader
                    value={draftResource.url ?? ''}
                    onChange={url => setDraftResource(d => ({ ...d, url }))}
                  />
                ) : (
                  <input
                    type="url"
                    value={draftResource.url ?? ''}
                    onChange={e => setDraftResource(d => ({ ...d, url: e.target.value }))}
                    className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                    placeholder="https://..."
                  />
                )}
              </div>
              <div>
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Access</label>
                <select
                  value={draftResource.required_plan ?? ''}
                  onChange={e => setDraftResource(d => ({ ...d, required_plan: (e.target.value as EducationPlan) || null }))}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                >
                  {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium text-text-primary">Published</p>
                  <p className="text-xs text-text-secondary">Visible in the Open Library</p>
                </div>
                <Toggle
                  checked={draftResource.is_published ?? false}
                  onChange={v => setDraftResource(d => ({ ...d, is_published: v }))}
                />
              </div>
            </div>

            <div className="p-5 border-t border-border-light flex gap-3">
              <button
                onClick={saveResource}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
              >
                {resourceModal === 'new' ? 'Add Resource' : 'Save Changes'}
              </button>
              <button
                onClick={closeResourceModal}
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
