import type { CoachQuestionnaires } from '@/lib/questionnaire/coachView'
import type { QuestionnaireRow } from '@/lib/questionnaire/service'
import { FLAG_LABELS, type Scores } from '@/lib/questionnaire/scoring'
import { questionById } from '@/lib/questionnaire/schema'
import { answerSections, formatAnswer, RADAR_AXES, radarPoint, radarPolygon, READINESS, sleepPercent, TIME_USE } from '@/lib/questionnaire/view'

// Server component: no client JavaScript. Charts are plain SVG and bars.

const TITLES = { adult: 'My Health Profile', youth: 'My Health Profile: Youth Athlete' } as const
const TIME_COLOURS = ['bg-brand', 'bg-brand-light', 'bg-sky-400', 'bg-amber-400', 'bg-slate-400']
const ukDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

function Radar({ ratings }: { ratings: Scores['ratings'] }) {
  const size = 220
  const c = size / 2
  const radius = 78
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto" role="img" aria-label={`Ratings out of 10: ${RADAR_AXES.map((a) => `${a.label} ${ratings[a.key] ?? 'not answered'}`).join(', ')}`}>
      {[2.5, 5, 7.5, 10].map((ring) => (
        <polygon key={ring} points={RADAR_AXES.map((_, i) => radarPoint(i, RADAR_AXES.length, ring, radius, c, c).join(',')).join(' ')} fill="none" className="stroke-border-light" strokeWidth="1" />
      ))}
      {RADAR_AXES.map((a, i) => {
        const [x, y] = radarPoint(i, RADAR_AXES.length, 10, radius, c, c)
        const [lx, ly] = radarPoint(i, RADAR_AXES.length, 12.6, radius, c, c)
        return (
          <g key={a.key}>
            <line x1={c} y1={c} x2={x} y2={y} className="stroke-border-light" strokeWidth="1" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-text-secondary" fontSize="10">
              {a.label}
            </text>
          </g>
        )
      })}
      <polygon points={radarPolygon(ratings, radius, c, c)} className="fill-brand/30 stroke-brand" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function Bar({ label, value, max = 10, tone = 'bg-brand' }: { label: string; value: number | undefined; max?: number; tone?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 text-text-secondary">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-bg-main overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value === undefined ? 0 : (value / max) * 100}%` }} />
      </div>
      <span className="w-9 text-right font-medium text-text-primary">{value === undefined ? '—' : `${value}/${max}`}</span>
    </div>
  )
}

function Block({ row, variant }: { row: QuestionnaireRow; variant: 'adult' | 'youth' }) {
  const scores = row.scores as Scores
  const a = row.answers
  const gaps = (r: Scores['ratings']) => r.ready !== undefined && r.able !== undefined && (r.ready >= 7 || (r.willing ?? 0) >= 7) && r.able <= 4
  const sections = answerSections(variant, a)
  const goalsId = Array.isArray(a.goals) ? 'goals' : 'youth_goals'
  const goalsQ = questionById(goalsId, variant)
  const goalsText = goalsQ ? formatAnswer(goalsQ, a[goalsId]) : null
  const sleepId = variant === 'adult' ? 'sleep_hours' : 'sleep_hours_youth'
  const sleepQ = questionById(sleepId, variant)
  const sleepText = sleepQ ? formatAnswer(sleepQ, a[sleepId]) : null
  const priorities = ['priority_1', 'priority_2', 'priority_3'].map((k) => a[k]).filter((v): v is string => typeof v === 'string' && v !== '')
  const total = scores.timeUse?.total ?? 0

  return (
    <div className="space-y-5">
      <p className="text-xs text-text-secondary">
        {row.kind === 'refresh' ? 'Update' : 'First answers'} submitted {ukDate(row.submitted_at)} · consent given {ukDate(row.consent_at)}
      </p>

      {row.flags.length > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3" aria-label="Flags">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-amber-800 mb-1">Worth a conversation</p>
          <ul className="text-xs text-amber-900 space-y-0.5 list-disc pl-4">
            {row.flags.map((f) => (
              <li key={f}>{FLAG_LABELS[f] ?? f}</li>
            ))}
          </ul>
          <p className="text-[11px] text-amber-800/80 mt-2">Prompts for a chat, not a diagnosis.</p>
        </div>
      ) : (
        <p className="text-xs text-text-secondary">No flags raised.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-text-primary mb-1">How they rate things (out of 10)</p>
          <Radar ratings={scores.ratings} />
          <p className="text-[11px] text-text-secondary text-center mt-1">For stress, a higher number means more stress.</p>
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-text-primary mb-2">Ready, willing, able</p>
            <div className="space-y-1.5">
              {READINESS.map((r) => (
                <Bar key={r.key} label={r.label} value={scores.ratings[r.key]} tone={r.key === 'able' && gaps(scores.ratings) ? 'bg-amber-400' : 'bg-brand'} />
              ))}
            </div>
            {gaps(scores.ratings) && <p className="text-[11px] text-amber-800 mt-1">Motivated, but finds it hard to fit in. Talk about what gets in the way.</p>}
          </div>

          {scores.sleepHours !== undefined && (
            <div>
              <p className="text-xs font-semibold text-text-primary mb-2">Sleep</p>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 h-2.5 rounded-full bg-bg-main overflow-hidden">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${sleepPercent(scores.sleepHours)}%` }} />
                </div>
                <span className="font-medium text-text-primary w-32 text-right">{sleepText ?? `${scores.sleepHours} hours`} a night</span>
              </div>
            </div>
          )}

          {variant === 'adult' && total > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-primary mb-2">A typical week ({total} hours committed)</p>
              <div className="flex h-3 rounded-full overflow-hidden bg-bg-main" role="img" aria-label={TIME_USE.map((t) => `${t.label} ${scores.timeUse[t.key]} hours`).join(', ')}>
                {TIME_USE.map((t, i) => (scores.timeUse[t.key] > 0 ? <div key={t.key} className={TIME_COLOURS[i]} style={{ width: `${(scores.timeUse[t.key] / total) * 100}%` }} /> : null))}
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-text-secondary">
                {TIME_USE.map((t, i) => (
                  <li key={t.key} className="flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${TIME_COLOURS[i]}`} />
                    {t.label} {scores.timeUse[t.key]}h
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {(priorities.length > 0 || goalsText) && (
        <div>
          <p className="text-xs font-semibold text-text-primary mb-1">Goals and priorities</p>
          {priorities.length > 0 && (
            <ol className="text-xs text-text-primary list-decimal pl-4 space-y-0.5 mb-2">
              {priorities.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          )}
          {goalsText && <p className="text-xs text-text-secondary">Ticked: {goalsText}</p>}
        </div>
      )}

      <details className="rounded-xl border border-border-light">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-text-primary">View all answers</summary>
        <div className="px-4 pb-4 space-y-4">
          {sections.map((s) => (
            <div key={s.key}>
              <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">{s.title}</p>
              <dl className="space-y-1.5">
                {s.rows.map((r) => (
                  <div key={r.id} className="text-xs">
                    <dt className="text-text-secondary">{r.label}</dt>
                    <dd className="text-text-primary whitespace-pre-wrap">{r.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

export default function QuestionnaireSection({ data }: { data: CoachQuestionnaires | null }) {
  const variants = (['adult', 'youth'] as const).filter((v) => data?.[v])
  return (
    <section className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden mb-6" aria-label="Health profile">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <h2 className="font-semibold text-text-primary text-sm mb-3">🩺 Health profile</h2>
      {data === null ? (
        <p className="text-xs text-text-secondary">Could not load the health profile.</p>
      ) : variants.length === 0 ? (
        <p className="text-xs text-text-secondary">Not completed yet.</p>
      ) : (
        <div className="space-y-8">
          {variants.map((v) => (
            <div key={v}>
              {variants.length > 1 && <p className="text-sm font-semibold text-text-primary mb-2">{TITLES[v]}</p>}
              {variants.length === 1 && v === 'youth' && <p className="text-sm font-semibold text-text-primary mb-2">{TITLES[v]}</p>}
              <Block row={data![v]!} variant={v} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
