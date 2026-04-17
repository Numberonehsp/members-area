'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Module, QuizQuestion, Pathway } from '@/types/education'

type Props = {
  module: Module
  pathway: Pathway
  quiz: QuizQuestion[]
  prev: Module | null
  next: Module | null
  pathwayModuleCount: number
}

export default function ModuleViewer({ module, pathway, quiz, prev, next }: Props) {
  const alreadyComplete = module.progress_status === 'completed'

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [completed, setCompleted] = useState(alreadyComplete)

  const hasQuiz = quiz.length > 0
  const allAnswered = hasQuiz ? quiz.every(q => answers[q.id] !== undefined) : true
  const passed = hasQuiz
    ? quiz.every(q => answers[q.id] === q.correct_index)
    : true

  const score = hasQuiz
    ? quiz.filter(q => answers[q.id] === q.correct_index).length
    : 0

  function handleSubmitQuiz() {
    setSubmitted(true)
  }

  function handleMarkComplete() {
    // TODO: POST to /api/progress or Supabase member_module_progress
    setCompleted(true)
  }

  // Extract YouTube video ID from embed URL
  const videoId = module.video_url
    ? (module.video_url.match(/embed\/([^?&]+)/)?.[1] ?? null)
    : null

  const canMarkComplete = !hasQuiz || (submitted && passed)

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-secondary mb-6">
        <Link href="/education" className="hover:text-brand transition-colors">Education Hub</Link>
        <span>→</span>
        <Link href={`/education/pathway/${pathway.id}`} className="hover:text-brand transition-colors">
          {pathway.title}
        </Link>
        <span>→</span>
        <span className="text-text-primary">Module {module.module_order}</span>
      </div>

      {/* Module header */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Module {module.module_order} of {pathway.module_count}
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-none mb-2">
          {module.title}
        </h1>
        {module.description && (
          <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
            {module.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          {module.duration_minutes && (
            <span className="text-xs text-text-secondary font-data">{module.duration_minutes} min</span>
          )}
          {completed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-medium">
              ✓ Completed
            </span>
          )}
        </div>
      </div>

      {/* Video player */}
      {videoId && (
        <div className="mb-6 rounded-2xl overflow-hidden bg-black border border-border-light shadow-lg">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
              title={module.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}

      {/* PDF download */}
      {module.pdf_url && (
        <a
          href={module.pdf_url}
          download
          className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-bg-card border border-border-light hover:border-brand/30 hover:shadow-sm transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-lg bg-status-red/10 border border-status-red/20 flex items-center justify-center text-status-red text-lg shrink-0">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors">
              Download PDF Resource
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Supporting material for this module</p>
          </div>
          <svg className="w-4 h-4 text-text-secondary group-hover:text-brand transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      )}

      {/* Quiz */}
      {hasQuiz && (
        <div className="mb-6 bg-bg-card border border-border-light rounded-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="p-5">
            <h2 className="font-display text-2xl text-text-primary mb-1">Knowledge Check</h2>
            <p className="text-xs text-text-secondary mb-5">
              Answer all questions correctly to unlock the Mark as Complete button.
            </p>

            <div className="space-y-6">
              {quiz.map((q, qi) => {
                const selected = answers[q.id]
                const isCorrect = submitted ? selected === q.correct_index : null

                return (
                  <div key={q.id}>
                    <p className="text-sm font-semibold text-text-primary mb-3">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isSelected = selected === oi
                        const isCorrectOpt = oi === q.correct_index
                        let style = 'border-border-light bg-bg-main text-text-secondary hover:border-brand/30 hover:text-text-primary'
                        if (submitted) {
                          if (isCorrectOpt) style = 'border-brand/40 bg-brand/10 text-brand'
                          else if (isSelected && !isCorrectOpt) style = 'border-status-red/40 bg-status-red/10 text-status-red'
                          else style = 'border-border-light bg-bg-main text-text-secondary opacity-50'
                        } else if (isSelected) {
                          style = 'border-brand/50 bg-brand/10 text-brand'
                        }

                        return (
                          <button
                            key={oi}
                            disabled={submitted}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 ${style} ${!submitted ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <span className="font-data text-[10px] mr-2 opacity-60">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>

                    {submitted && (
                      <p className={`text-xs mt-2 font-medium ${isCorrect ? 'text-brand' : 'text-status-red'}`}>
                        {isCorrect ? '✓ Correct' : `✗ Incorrect — the right answer is: ${q.options[q.correct_index]}`}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {!submitted ? (
              <button
                disabled={!allAnswered}
                onClick={handleSubmitQuiz}
                className="mt-6 px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit answers
              </button>
            ) : (
              <div className={`mt-6 p-4 rounded-xl border text-sm font-semibold ${
                passed
                  ? 'bg-brand/10 border-brand/20 text-brand'
                  : 'bg-status-red/10 border-status-red/20 text-status-red'
              }`}>
                {passed
                  ? `🎉 ${score}/${quiz.length} correct — well done! You can now mark this module complete.`
                  : `${score}/${quiz.length} correct — review the answers above and try again.`
                }
                {!passed && (
                  <button
                    onClick={() => { setSubmitted(false); setAnswers({}) }}
                    className="block mt-2 text-xs font-medium text-text-secondary hover:text-text-primary underline"
                  >
                    Retry quiz
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mark as Complete */}
      {!completed ? (
        <button
          disabled={!canMarkComplete}
          onClick={handleMarkComplete}
          className="w-full py-4 rounded-2xl bg-brand text-white font-semibold text-base hover:bg-brand-dark transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed mb-6"
        >
          {hasQuiz && !submitted ? 'Complete the quiz to unlock' : 'Mark as Complete'}
        </button>
      ) : (
        <div className="w-full py-4 rounded-2xl bg-brand/10 border border-brand/20 text-brand font-semibold text-base text-center mb-6">
          ✓ Module Complete
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="flex gap-3">
        {prev ? (
          <Link
            href={`/education/module/${prev.id}`}
            className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-bg-card border border-border-light hover:border-brand/30 hover:shadow-sm transition-all duration-200 group"
          >
            <span className="text-text-secondary group-hover:text-brand transition-colors text-lg">←</span>
            <div className="min-w-0">
              <p className="text-[10px] text-text-secondary mb-0.5">Previous</p>
              <p className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors truncate">
                {prev.title}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next && !next.is_locked ? (
          <Link
            href={`/education/module/${next.id}`}
            className="flex-1 flex items-center justify-end gap-3 p-4 rounded-xl bg-bg-card border border-border-light hover:border-brand/30 hover:shadow-sm transition-all duration-200 group text-right"
          >
            <div className="min-w-0">
              <p className="text-[10px] text-text-secondary mb-0.5">Next</p>
              <p className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors truncate">
                {next.title}
              </p>
            </div>
            <span className="text-text-secondary group-hover:text-brand transition-colors text-lg shrink-0">→</span>
          </Link>
        ) : next?.is_locked ? (
          <div className="flex-1 flex items-center justify-end gap-3 p-4 rounded-xl bg-bg-main border border-border-light opacity-50 text-right cursor-not-allowed">
            <div className="min-w-0">
              <p className="text-[10px] text-text-secondary mb-0.5">Next</p>
              <p className="text-sm font-semibold text-text-secondary truncate">{next.title}</p>
            </div>
            <span className="text-lg shrink-0">🔒</span>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  )
}
