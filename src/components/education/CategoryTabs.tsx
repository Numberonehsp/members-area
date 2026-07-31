'use client'

import { useState } from 'react'
import PathwayCard from './PathwayCard'
import ResourceCard from './ResourceCard'
import type { Pathway, Resource, Category } from '@/types/education'
import { parseMemberPlans, canAccess } from '@/lib/education-access'

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
  memberPlans: string[]       // serialisable array from server; converted to Set inside
  foundationsResources?: Resource[]
}

export default function CategoryTabs({ pathways, resources, memberPlans, foundationsResources = [] }: Props) {
  const [active, setActive] = useState<string>('all')
  const plans = parseMemberPlans(memberPlans.join(','))

  const hasFoundations = plans.has('foundations')

  // Foundations pathways are visible-but-locked to non-foundations members
  // (like any other paid pathway); foundations resources (personal per-session
  // PDFs) stay fully hidden — see canAccess() for the reasoning.
  const visiblePathways = pathways.filter(p => canAccess(p.required_plan, plans, 'pathway') !== 'hidden')
  const visibleResources = resources.filter(r => canAccess(r.required_plan, plans, 'resource') !== 'hidden')

  const filteredPathways = active === 'all'
    ? visiblePathways
    : visiblePathways.filter(p => p.category === active)

  const filteredResources = active === 'all'
    ? visibleResources
    : visibleResources.filter(r => r.category === active as Category)

  return (
    <div>
      {/* Foundations section — only shown to foundations members */}
      {hasFoundations && foundationsResources.length > 0 && (
        <section className="mb-10">
          <div className="bg-bg-card border border-brand/20 rounded-2xl overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <div className="p-5 border-b border-border-light flex items-center gap-3">
              <span className="text-2xl">🏋️</span>
              <div>
                <h2 className="font-display text-2xl text-text-primary leading-none">
                  Foundations Programme
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Your personal 1-to-1 session support materials — sent by your coach after each session.
                </p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {foundationsResources.map(r => (
                <ResourceCard key={r.id} resource={r} memberPlans={memberPlans} />
              ))}
            </div>
          </div>
        </section>
      )}

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
              <PathwayCard key={p.id} pathway={p} memberPlans={memberPlans} />
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
              <ResourceCard key={r.id} resource={r} memberPlans={memberPlans} />
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
