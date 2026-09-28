'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export type Slide = {
  id: string
  eyebrow: string
  title: string
  body?: string
  href: string
  cta: string
  emoji: string
  tone: 'amber' | 'brand'
}

const TONE: Record<Slide['tone'], { text: string; bar: string; bg: string; dot: string }> = {
  amber: { text: 'text-status-amber', bar: 'from-status-amber via-brand to-transparent', bg: 'bg-status-amber/10', dot: 'bg-status-amber' },
  brand: { text: 'text-brand', bar: 'from-brand via-brand-light to-transparent', bg: 'bg-brand/10', dot: 'bg-brand' },
}

const INTERVAL_MS = 6000

export default function SpotlightRotator({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (slides.length < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [slides.length, paused])

  if (slides.length === 0) return null
  const slide = slides[index % slides.length]
  const tone = TONE[slide.tone]

  return (
    <div
      className="w-full md:max-w-sm bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tone.bar}`} />

      <Link href={slide.href} className="flex items-start gap-3 min-h-[5.5rem]">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${tone.bg}`}>
          {slide.emoji}
        </span>
        <span className="flex-1 min-w-0" aria-live={paused ? 'polite' : 'off'}>
          <span className={`block text-[10px] tracking-[0.2em] uppercase font-semibold mb-0.5 ${tone.text}`}>
            {slide.eyebrow}
          </span>
          <span className="block text-sm font-semibold text-text-primary leading-snug">{slide.title}</span>
          {slide.body && (
            <span className="block text-xs text-text-secondary mt-0.5 line-clamp-2">{slide.body}</span>
          )}
          <span className={`block text-xs font-semibold mt-1.5 ${tone.text}`}>{slide.cta} →</span>
        </span>
      </Link>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show item ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? `w-4 ${tone.dot}` : 'w-1.5 bg-border-light'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
