'use client'

import { useState } from 'react'
import ResourceCard from './ResourceCard'
import type { Resource } from '@/types/education'

const CATEGORY_TABS = [
  { id: 'all',       label: 'All',       icon: '✦' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { id: 'training',  label: 'Training',  icon: '🏋️' },
  { id: 'recovery',  label: 'Recovery',  icon: '🛌' },
  { id: 'mindset',   label: 'Mindset',   icon: '🧠' },
]

const TYPE_TABS = [
  { id: 'all',     label: 'All types' },
  { id: 'video',   label: 'Video' },
  { id: 'pdf',     label: 'PDF' },
  { id: 'article', label: 'Article' },
  { id: 'link',    label: 'Link' },
]

type Props = { resources: Resource[] }

export default function LibraryGrid({ resources }: Props) {
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('all')

  const filtered = resources.filter(r => {
    const catMatch = category === 'all' || r.category === category
    const typeMatch = type === 'all' || r.resource_type === type
    return catMatch && typeMatch
  })

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === tab.id
                ? 'bg-brand text-white shadow-sm'
                : 'bg-bg-card border border-border-light text-text-secondary hover:text-text-primary hover:border-brand/30'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap mb-8">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setType(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
              type === tab.id
                ? 'bg-bg-card border-brand/40 text-brand'
                : 'border-border-light text-text-secondary hover:border-brand/20 hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-xs text-text-secondary self-center ml-2">
          {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No resources match these filters.</p>
        </div>
      )}
    </div>
  )
}
