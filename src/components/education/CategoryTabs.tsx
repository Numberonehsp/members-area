'use client'

import { useState } from 'react'
import PathwayCard from './PathwayCard'
import ResourceCard from './ResourceCard'
import type { Pathway, Resource, Category } from '@/types/education'

const TABS = [
  { id: 'all',       label: 'All',       icon: '✦' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { id: 'training',  label: 'Training',  icon: '🏋️' },
  { id: 'recovery',  label: 'Recovery',  icon: '🛌' },
  { id: 'mindset',   label: 'Mindset',   icon: '🧠' },
]

type Props = {
  pathways: Pathway[]
  resources: Resource[]
}

export default function CategoryTabs({ pathways, resources }: Props) {
  const [active, setActive] = useState<string>('all')

  const filteredPathways = active === 'all'
    ? pathways
    : pathways.filter(p => p.category === active)

  const filteredResources = active === 'all'
    ? resources
    : resources.filter(r => r.category === active)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-8 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              active === tab.id
                ? 'bg-brand text-white shadow-sm'
                : 'bg-bg-card border border-border-light text-text-secondary hover:text-text-primary hover:border-brand/30'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pathways */}
      {filteredPathways.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-3xl text-text-primary leading-none">
              Pathways
            </h2>
            <span className="text-xs text-text-secondary">
              {filteredPathways.length} pathway{filteredPathways.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPathways.map(p => (
              <PathwayCard key={p.id} pathway={p} />
            ))}
          </div>
        </section>
      )}

      {/* Open Library */}
      {filteredResources.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-3xl text-text-primary leading-none">
              Open Library
            </h2>
            <a
              href="/education/library"
              className="text-xs text-brand hover:text-brand-dark font-medium transition-colors"
            >
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredResources.slice(0, 6).map(r => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      {filteredPathways.length === 0 && filteredResources.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No content in this category yet — check back soon.</p>
        </div>
      )}
    </div>
  )
}
