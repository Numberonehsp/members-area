// =============================================
// Education seed / demo data
// Used while Supabase queries are not yet wired.
// Replace each import with a real Supabase query
// when auth is complete.
// =============================================
import type { Pathway, Module, Resource, QuizQuestion } from '@/types/education'

export const SEED_PATHWAYS: Pathway[] = [
  {
    id: 'nutrition-foundations',
    title: 'Nutrition Foundations',
    description: 'Everything you need to understand food, fuel your training, and manage your body composition — without obsessing over it. Seven modules from complete beginner to confident.',
    category: 'nutrition',
    is_sequential: true,
    display_order: 1,
    thumbnail_url: null,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    module_count: 12,
    total_duration_minutes: 105,
    completed_count: 0,
  },
  {
    id: 'movement-fundamentals',
    title: 'Movement Fundamentals',
    description: 'Master the five foundational movement patterns: hinge, squat, push, pull, and carry. These are the building blocks of everything we do at Number One HSP.',
    category: 'training',
    is_sequential: true,
    display_order: 2,
    thumbnail_url: null,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    module_count: 6,
    total_duration_minutes: 72,
    completed_count: 0,
  },
  {
    id: 'recovery-toolkit',
    title: 'Recovery Toolkit',
    description: 'Training is the stimulus — recovery is where adaptation happens. Learn the evidence-based practices that maximise your progress between sessions.',
    category: 'recovery',
    is_sequential: false,
    display_order: 3,
    thumbnail_url: null,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    module_count: 4,
    total_duration_minutes: 40,
    completed_count: 1,
  },
  {
    id: 'mindset-for-progress',
    title: 'Mindset for Progress',
    description: "The mental side of training is often the missing piece. This pathway covers goal-setting, building sustainable habits, and staying consistent when life gets busy.",
    category: 'mindset',
    is_sequential: false,
    display_order: 4,
    thumbnail_url: null,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    module_count: 4,
    total_duration_minutes: 36,
    completed_count: 0,
  },
  {
    id: 'understanding-supplements',
    title: 'Understanding Supplements',
    description: 'Supplements are the 1% — food is the 99%. Cut through the marketing noise and learn what the evidence actually says about protein powder, creatine, pre-workout, and fat burners.',
    category: 'nutrition',
    is_sequential: true,
    display_order: 5,
    thumbnail_url: null,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    module_count: 5,
    total_duration_minutes: 50,
    completed_count: 0,
  },
]

export const SEED_MODULES: Record<string, Module[]> = {
  'nutrition-foundations': [
    // ── MODULE 1: Tracking Calories (A-format, single video) ──────────────
    {
      id: 'nf-01',
      pathway_id: 'nutrition-foundations',
      title: 'Tracking Calories',
      description: 'What a calorie actually is, why it matters for fat loss, and how to use that knowledge without letting it take over your life.',
      module_order: 1,
      video_url: null,
      pdf_url: null,
      duration_minutes: 6,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: false,
    },

    // ── MODULE 2: Using MyFitnessPal (A-format, single video) ─────────────
    {
      id: 'nf-02',
      pathway_id: 'nutrition-foundations',
      title: 'Using MyFitnessPal',
      description: 'A practical walkthrough of the app — how to set it up, log your food accurately, and build the tracking habit without becoming obsessive about it.',
      module_order: 2,
      video_url: null,
      pdf_url: null,
      duration_minutes: 7,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },

    // ── MODULE 3: Understanding Macros (D-format, 5 lessons) ──────────────
    {
      id: 'nf-03a',
      pathway_id: 'nutrition-foundations',
      title: 'What Are Macros and Why Do They Matter?',
      description: 'An introduction to macronutrients — protein, carbohydrates, and fat — and why understanding them changes how you think about food.',
      module_order: 3,
      video_url: null,
      pdf_url: null,
      duration_minutes: 9,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
    {
      id: 'nf-03b',
      pathway_id: 'nutrition-foundations',
      title: 'Protein — The Most Important Macro',
      description: 'How much protein you actually need, why most people eat half that amount, and the best sources for hitting your daily target.',
      module_order: 4,
      video_url: null,
      pdf_url: null,
      duration_minutes: 11,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
    {
      id: 'nf-03c',
      pathway_id: 'nutrition-foundations',
      title: 'Carbohydrates — Fuel, Not Fear',
      description: 'The real role of carbs in performance and body composition. When to eat them, how much, and why cutting them out is not the answer for most people.',
      module_order: 5,
      video_url: null,
      pdf_url: null,
      duration_minutes: 10,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
    {
      id: 'nf-03d',
      pathway_id: 'nutrition-foundations',
      title: 'Fats — Essential, Not the Enemy',
      description: 'Why dietary fat is critical for hormones, vitamin absorption, and satiety — and how to tell the difference between the fats that help and the ones that harm.',
      module_order: 6,
      video_url: null,
      pdf_url: null,
      duration_minutes: 9,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
    {
      id: 'nf-03e',
      pathway_id: 'nutrition-foundations',
      title: 'Setting Your Macro Targets',
      description: 'How to calculate your protein, carb, and fat targets in MyFitnessPal — and why you should set protein first before worrying about anything else.',
      module_order: 7,
      video_url: null,
      pdf_url: null,   // Summary sheet: macro targets reference card — populate when PDF uploaded
      duration_minutes: 10,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },

    // ── MODULE 4: Intermittent Fasting (A-format, single video) ───────────
    {
      id: 'nf-04',
      pathway_id: 'nutrition-foundations',
      title: 'Intermittent Fasting',
      description: 'What IF actually is, the three main protocols, who it suits — and the honest answer to whether it causes muscle loss.',
      module_order: 8,
      video_url: null,
      pdf_url: null,
      duration_minutes: 7,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },

    // ── MODULE 5: Nutrition Myths (D-format, 4 lessons) ───────────────────
    {
      id: 'nf-05a',
      pathway_id: 'nutrition-foundations',
      title: 'Carb and Fat Myths',
      description: 'Do carbs make you fat? Is dietary fat the enemy? Are low-fat foods actually healthy? The evidence on three of the most persistent nutrition myths.',
      module_order: 9,
      video_url: null,
      pdf_url: null,
      duration_minutes: 9,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
    {
      id: 'nf-05b',
      pathway_id: 'nutrition-foundations',
      title: 'Weight Loss Myths',
      description: 'Spot reduction, eating before bed, juice cleanses, fasted cardio — what the research actually says about four weight loss beliefs most people hold.',
      module_order: 10,
      video_url: null,
      pdf_url: null,
      duration_minutes: 9,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
    {
      id: 'nf-05c',
      pathway_id: 'nutrition-foundations',
      title: 'Protein and Supplement Myths',
      description: 'Does protein damage your kidneys? Do you need to eat it within 30 minutes of training? Can fat burners work without diet changes? Evidence over opinion.',
      module_order: 11,
      video_url: null,
      pdf_url: null,
      duration_minutes: 9,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
    {
      id: 'nf-05d',
      pathway_id: 'nutrition-foundations',
      title: 'Training Myths',
      description: "No pain, no gain. Women who lift will get bulky. Sweating means you're burning fat. You can out-train a bad diet. Four myths that hold people back.",
      module_order: 12,
      video_url: null,
      pdf_url: null,   // Summary sheet: myth vs. fact reference card — populate when PDF uploaded
      duration_minutes: 9,
      is_published: true,
      created_at: '2026-01-01T00:00:00Z',
      progress_status: 'not_started',
      is_locked: true,
    },
  ],
  'movement-fundamentals': [
    {
      id: 'mf-1', pathway_id: 'movement-fundamentals', title: 'The Hip Hinge', description: 'The foundation of every deadlift, Romanian deadlift, and KB swing. Get this right and everything else follows.', module_order: 1, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 14, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false,
    },
    {
      id: 'mf-2', pathway_id: 'movement-fundamentals', title: 'The Squat Pattern', description: 'Goblet squat, front squat, back squat — they all start the same way. Learn the cues that make it click.', module_order: 2, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 12, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: true,
    },
    {
      id: 'mf-3', pathway_id: 'movement-fundamentals', title: 'Pushing — horizontal and vertical', description: 'Press mechanics, shoulder positioning, and how to build a safe, strong upper body push.', module_order: 3, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 11, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: true,
    },
    {
      id: 'mf-4', pathway_id: 'movement-fundamentals', title: 'Pulling — rows and pull-ups', description: 'Upper back strength is your foundation. Rows, lat pulldowns, and the road to your first pull-up.', module_order: 4, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 13, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: true,
    },
    {
      id: 'mf-5', pathway_id: 'movement-fundamentals', title: 'Loaded Carries', description: "Farmer's carries, suitcase carries, overhead carries — the most underrated exercises in strength training.", module_order: 5, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 10, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: true,
    },
    {
      id: 'mf-6', pathway_id: 'movement-fundamentals', title: 'Putting it all together', description: 'How the five patterns combine into a balanced training week. Template programming to take away.', module_order: 6, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: '/resources/programming-template.pdf', duration_minutes: 12, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: true,
    },
  ],
  'recovery-toolkit': [
    { id: 'rt-1', pathway_id: 'recovery-toolkit', title: 'Sleep — the non-negotiable', description: 'Sleep is the most powerful recovery tool you have. What the research says and how to improve yours.', module_order: 1, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 12, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'completed', is_locked: false },
    { id: 'rt-2', pathway_id: 'recovery-toolkit', title: 'Managing stress and cortisol', description: 'Training stress + life stress = total load. Learn to manage both.', module_order: 2, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 10, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false },
    { id: 'rt-3', pathway_id: 'recovery-toolkit', title: 'Mobility work that actually helps', description: 'Cut through the noise. Which stretches and drills are worth your time.', module_order: 3, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: '/resources/mobility-routine.pdf', duration_minutes: 9, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false },
    { id: 'rt-4', pathway_id: 'recovery-toolkit', title: 'Deload weeks explained', description: "Why backing off is part of the programme, not a sign you're being lazy.", module_order: 4, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 9, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false },
  ],
  'mindset-for-progress': [
    { id: 'mp-1', pathway_id: 'mindset-for-progress', title: 'Setting goals that actually work', description: "Why 'lose weight' is not a goal — and what to replace it with.", module_order: 1, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 10, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false },
    { id: 'mp-2', pathway_id: 'mindset-for-progress', title: 'Building habits that stick', description: 'The science of habit formation applied to training and nutrition.', module_order: 2, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 9, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false },
    { id: 'mp-3', pathway_id: 'mindset-for-progress', title: 'Staying consistent when life is busy', description: 'The minimum effective dose — how to maintain progress during tough weeks.', module_order: 3, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 9, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false },
    { id: 'mp-4', pathway_id: 'mindset-for-progress', title: 'Dealing with setbacks', description: 'Missed a week? Had a bad month? How to get back on track without the guilt spiral.', module_order: 4, video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', pdf_url: null, duration_minutes: 8, is_published: true, created_at: '2026-01-01T00:00:00Z', progress_status: 'not_started', is_locked: false },
  ],
}

export const SEED_RESOURCES: Resource[] = [
  { id: 'r-1', title: 'Protein Sources Cheat Sheet', description: 'A quick-reference card for the best protein sources by food group, with gram-per-100g values.', category: 'nutrition', resource_type: 'pdf', url: '/resources/protein-cheat-sheet.pdf', thumbnail_url: null, is_published: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r-2', title: 'How to read an InBody result', description: 'A 3-minute video explaining what each number on your InBody printout means and what to focus on.', category: 'training', resource_type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, is_published: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r-3', title: 'Gym Etiquette Guide', description: "Everything you need to know about how we do things at Number One HSP — from rack etiquette to chalk rules.", category: 'training', resource_type: 'pdf', url: '/resources/etiquette.pdf', thumbnail_url: null, is_published: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r-4', title: 'Hydration for Performance', description: 'Simple guidelines for staying hydrated before, during, and after training.', category: 'nutrition', resource_type: 'article', url: '#', thumbnail_url: null, is_published: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r-5', title: '10-minute Morning Mobility Routine', description: 'A coach-designed routine to do before your morning session. PDF + video walkthrough.', category: 'recovery', resource_type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, is_published: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r-6', title: 'RPE Scale Explained', description: 'How to use Rate of Perceived Exertion to self-regulate training intensity.', category: 'training', resource_type: 'pdf', url: '/resources/rpe-scale.pdf', thumbnail_url: null, is_published: true, created_at: '2026-01-01T00:00:00Z' },
]

export const SEED_QUIZ: Record<string, QuizQuestion[]> = {
  'nf-1': [
    {
      id: 'q1',
      question: 'What is a calorie?',
      options: ['A unit of carbohydrate', 'A unit of energy', 'A type of macronutrient', 'A measure of fat'],
      correct_index: 1,
    },
    {
      id: 'q2',
      question: 'Which of the following creates a calorie deficit?',
      options: ['Eating more than you burn', 'Eating less than you burn', 'Eating only protein', 'Avoiding all fats'],
      correct_index: 1,
    },
  ],
  'nf-2': [
    {
      id: 'q1',
      question: 'Approximately how much protein per kg of bodyweight is recommended for strength athletes?',
      options: ['0.5–0.8g', '1.6–2.2g', '3.0–4.0g', '0.1–0.3g'],
      correct_index: 1,
    },
  ],
}

// Helper — find a module's neighbours in a pathway
export function getModuleNeighbours(modules: Module[], currentId: string) {
  const sorted = [...modules].sort((a, b) => a.module_order - b.module_order)
  const idx = sorted.findIndex(m => m.id === currentId)
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  }
}

// Helper — compute overall progress percentage for a pathway
export function getPathwayProgress(modules: Module[]): number {
  if (!modules.length) return 0
  const done = modules.filter(m => m.progress_status === 'completed').length
  return Math.round((done / modules.length) * 100)
}
