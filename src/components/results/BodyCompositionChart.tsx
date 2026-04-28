'use client'

import { useState } from 'react'
import type { InBodyScan } from '@/lib/staffhub'

// ── Metric config ──────────────────────────────────────────────────────────────

type MetricKey = 'weight' | 'smm' | 'bf_pct' | 'bf_mass'

const METRICS: { key: MetricKey; label: string; unit: string; colour: string; dimColour: string }[] = [
  { key: 'weight',  label: 'Weight',  unit: 'kg', colour: '#2a9a9b', dimColour: '#2a9a9b40' },
  { key: 'smm',     label: 'SMM',     unit: 'kg', colour: '#3fb950', dimColour: '#3fb95040' },
  { key: 'bf_pct',  label: 'BF%',     unit: '%',  colour: '#f0883e', dimColour: '#f0883e40' },
  { key: 'bf_mass', label: 'BF Mass', unit: 'kg', colour: '#a78bfa', dimColour: '#a78bfa40' },
]

function getValue(scan: InBodyScan, key: MetricKey): number | null {
  return scan[key]
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── SVG chart ─────────────────────────────────────────────────────────────────

const W = 500
const H = 180
const PAD_L = 52
const PAD_R = 52
const PAD_T = 16
const PAD_B = 32
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B

function scaleY(value: number, min: number, max: number): number {
  if (max === min) return PAD_T + PLOT_H / 2
  return PAD_T + PLOT_H - ((value - min) / (max - min)) * PLOT_H
}

function scaleX(index: number, total: number): number {
  if (total <= 1) return PAD_L + PLOT_W / 2
  return PAD_L + (index / (total - 1)) * PLOT_W
}

function yLabels(min: number, max: number, count = 4): number[] {
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => min + step * i)
}

interface ChartLineProps {
  scans: InBodyScan[]
  metricKey: MetricKey
  colour: string
  side: 'left' | 'right'
  hoveredIndex: number | null
}

function ChartLine({ scans, metricKey, colour, side, hoveredIndex }: ChartLineProps) {
  const values = scans.map(s => getValue(s, metricKey))
  const defined = values.filter((v): v is number => v != null)
  if (defined.length === 0) return null

  const min = Math.min(...defined)
  const max = Math.max(...defined)
  const pad = (max - min) * 0.15 || 1
  const yMin = min - pad
  const yMax = max + pad

  const points = scans
    .map((_, i) => {
      const v = values[i]
      if (v == null) return null
      return { x: scaleX(i, scans.length), y: scaleY(v, yMin, yMax), v }
    })

  const pathD = points
    .map((p, i) => p ? `${i === 0 || points.slice(0, i).every(q => q == null) ? 'M' : 'L'} ${p.x} ${p.y}` : null)
    .filter(Boolean)
    .join(' ')

  const labels = yLabels(yMin, yMax)
  const unit = METRICS.find(m => m.key === metricKey)?.unit ?? ''

  return (
    <g>
      {/* Y-axis labels */}
      {labels.map((val, i) => {
        const y = scaleY(val, yMin, yMax)
        const text = Math.abs(val) < 10 ? val.toFixed(1) : Math.round(val).toString()
        return (
          <text
            key={i}
            x={side === 'left' ? PAD_L - 6 : W - PAD_R + 6}
            y={y + 4}
            textAnchor={side === 'left' ? 'end' : 'start'}
            fontSize={9}
            fill={colour}
            opacity={0.8}
          >
            {text}{unit === '%' ? '%' : ''}
          </text>
        )
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke={colour} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) =>
        p ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 3.5}
            fill={hoveredIndex === i ? colour : '#1a1a1a'}
            stroke={colour}
            strokeWidth={2}
          />
        ) : null
      )}

      {/* Hover value labels */}
      {hoveredIndex != null && points[hoveredIndex] && (() => {
        const p = points[hoveredIndex]!
        const val = p.v
        const text = `${val.toFixed(1)}${unit}`
        const labelY = p.y > PAD_T + 20 ? p.y - 10 : p.y + 18
        return (
          <text x={p.x} y={labelY} textAnchor="middle" fontSize={10} fontWeight="600" fill={colour}>
            {text}
          </text>
        )
      })()}
    </g>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  scans: InBodyScan[]
}

export default function BodyCompositionChart({ scans }: Props) {
  // Last 5 scans, chronological order (scans come in newest-first)
  const displayed = [...scans].reverse().slice(-5)

  const [selected, setSelected] = useState<MetricKey[]>(['weight', 'bf_pct'])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  function toggleMetric(key: MetricKey) {
    setSelected(prev => {
      if (prev.includes(key)) {
        // Deselect — keep at least 1
        if (prev.length === 1) return prev
        return prev.filter(k => k !== key)
      }
      if (prev.length >= 2) {
        // Swap out the first selected
        return [prev[1], key]
      }
      return [...prev, key]
    })
  }

  const [primary, secondary] = [
    METRICS.find(m => m.key === selected[0])!,
    selected[1] ? METRICS.find(m => m.key === selected[1]) : null,
  ]

  if (displayed.length === 0) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden mb-4">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      {/* Header + metric toggles */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-semibold text-text-primary text-sm">Trend</h2>
        <div className="flex gap-2 flex-wrap">
          {METRICS.map(m => {
            const isSelected = selected.includes(m.key)
            const selIndex = selected.indexOf(m.key)
            const borderCol = isSelected ? m.colour : undefined
            return (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                style={isSelected ? { borderColor: m.colour, color: m.colour } : {}}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-transparent'
                    : 'border-border-light text-text-secondary hover:text-text-primary'
                }`}
              >
                {m.label}
                {isSelected && selIndex === 0 && selected.length === 2 && (
                  <span className="ml-1 opacity-60">①</span>
                )}
                {isSelected && selIndex === 1 && (
                  <span className="ml-1 opacity-60">②</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3">
        {selected.map(key => {
          const m = METRICS.find(x => x.key === key)!
          const latest = displayed[displayed.length - 1]
          const val = getValue(latest, key)
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: m.colour }} />
              <span className="text-xs text-text-secondary">{m.label}</span>
              {val != null && (
                <span className="text-xs font-semibold" style={{ color: m.colour }}>
                  {val.toFixed(1)}{m.unit}
                </span>
              )}
            </div>
          )
        })}
        {displayed.length < 5 && (
          <span className="text-xs text-text-secondary ml-auto opacity-60">
            Showing {displayed.length} scan{displayed.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ overflow: 'visible' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = PAD_T + t * PLOT_H
            return (
              <line key={t} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                stroke="#ffffff08" strokeWidth={1} />
            )
          })}

          {/* Vertical hover zones */}
          {displayed.map((_, i) => {
            const x = scaleX(i, displayed.length)
            const zoneW = displayed.length > 1 ? PLOT_W / (displayed.length - 1) : PLOT_W
            return (
              <rect
                key={i}
                x={x - zoneW / 2}
                y={PAD_T}
                width={zoneW}
                height={PLOT_H}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            )
          })}

          {/* Hover line */}
          {hoveredIndex != null && (
            <line
              x1={scaleX(hoveredIndex, displayed.length)}
              y1={PAD_T}
              x2={scaleX(hoveredIndex, displayed.length)}
              y2={PAD_T + PLOT_H}
              stroke="#ffffff18"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* Chart lines */}
          <ChartLine scans={displayed} metricKey={primary.key} colour={primary.colour} side="left" hoveredIndex={hoveredIndex} />
          {secondary && (
            <ChartLine scans={displayed} metricKey={secondary.key} colour={secondary.colour} side="right" hoveredIndex={hoveredIndex} />
          )}

          {/* X-axis date labels */}
          {displayed.map((scan, i) => (
            <text
              key={scan.scan_date}
              x={scaleX(i, displayed.length)}
              y={H - 4}
              textAnchor="middle"
              fontSize={9}
              fill="#555"
            >
              {formatDate(scan.scan_date)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
