# Nutrition Education Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5 placeholder nutrition modules in the education hub with a fully designed 7-module beginner nutrition series, add a new Understanding Supplements pathway, and produce all scripts, slide outlines, quiz questions, and summary sheet content.

**Architecture:** All module data lives in `src/lib/education-seed.ts` (used as placeholder until Supabase is wired — replace data here now, Supabase migration is a separate task). D-format "lessons" are individual `Module` records within a pathway — each has its own `video_url`, `pdf_url`, and quiz entry in `SEED_QUIZ`. Content deliverables (scripts, slides, PDFs) are produced as Google Docs/Slides and referenced by URL once recorded.

**Tech Stack:** TypeScript, Next.js App Router, existing `src/types/education.ts` types, `src/lib/education-seed.ts` seed data, Google Slides (slide decks), Google Docs (scripts + summary sheets).

**Spec:** `docs/superpowers/specs/2026-04-19-nutrition-education-modules-design.md`

---

## Module ID Reference

Use these IDs consistently throughout — the quiz map keys must match module IDs exactly.

| ID | Description |
|----|-------------|
| `nf-01` | Tracking Calories |
| `nf-02` | Using MyFitnessPal |
| `nf-03a` | Macros — Lesson 1: What are macros? |
| `nf-03b` | Macros — Lesson 2: Protein |
| `nf-03c` | Macros — Lesson 3: Carbohydrates |
| `nf-03d` | Macros — Lesson 4: Fats |
| `nf-03e` | Macros — Lesson 5: Setting targets |
| `nf-04` | Intermittent Fasting |
| `nf-05a` | Myths — Lesson 1: Carbs & fat myths |
| `nf-05b` | Myths — Lesson 2: Weight loss myths |
| `nf-05c` | Myths — Lesson 3: Protein & supplement myths |
| `nf-05d` | Myths — Lesson 4: Training myths |
| `rt-5` | Recovery & DOMS (Recovery Toolkit pathway) |
| `us-01` | Supplements — Lesson 1: What supplements are |
| `us-02` | Supplements — Lesson 2: Protein powder |
| `us-03` | Supplements — Lesson 3: Creatine |
| `us-04` | Supplements — Lesson 4: Pre-workout & fat burners |
| `us-05` | Supplements — Lesson 5: Reading labels |

---

## Task 1: Update SEED_PATHWAYS

**Files:**
- Modify: `src/lib/education-seed.ts`

- [ ] **Step 1: Update the `nutrition-foundations` pathway record**

Replace the existing `nutrition-foundations` entry in `SEED_PATHWAYS` with:

```typescript
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
  total_duration_minutes: 110,
  completed_count: 0,
},
```

Note: `module_count: 12` because D-format modules expand to individual lesson records (1+1+5+1+4=12). `total_duration_minutes` is the sum of all lesson durations (see Task 2).

- [ ] **Step 2: Add the `understanding-supplements` pathway record**

Append after `mindset-for-progress` in `SEED_PATHWAYS`:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/education-seed.ts
git commit -m "feat(education): update pathway records for nutrition series and supplements"
```

---

## Task 2: Replace SEED_MODULES for nutrition-foundations

**Files:**
- Modify: `src/lib/education-seed.ts`

Replace the entire `'nutrition-foundations'` array in `SEED_MODULES` with the following. All `video_url` values are `null` until recordings are uploaded as unlisted YouTube videos. All `pdf_url` values are `null` until summary sheets are exported and uploaded.

- [ ] **Step 1: Replace the nutrition-foundations module array**

```typescript
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
    description: 'No pain, no gain. Women who lift will get bulky. Sweating means you\'re burning fat. You can out-train a bad diet. Four myths that hold people back.',
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
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/education-seed.ts
git commit -m "feat(education): replace placeholder nutrition-foundations modules with full content"
```

---

## Task 3: Add Recovery & DOMS to SEED_MODULES

**Files:**
- Modify: `src/lib/education-seed.ts`

- [ ] **Step 1: Append the DOMS module to the recovery-toolkit array**

In `SEED_MODULES`, find the `'recovery-toolkit'` array (currently ends at `rt-4`). Append:

```typescript
{
  id: 'rt-5',
  pathway_id: 'recovery-toolkit',
  title: 'Recovery & DOMS',
  description: 'What DOMS (Delayed Onset Muscle Soreness) actually is, why beginners feel it more, how nutrition speeds recovery, and when soreness is normal versus a warning sign.',
  module_order: 5,
  video_url: null,
  pdf_url: null,
  duration_minutes: 8,
  is_published: true,
  created_at: '2026-01-01T00:00:00Z',
  progress_status: 'not_started',
  is_locked: false,
},
```

- [ ] **Step 2: Update recovery-toolkit pathway `module_count` and `total_duration_minutes`**

In `SEED_PATHWAYS`, find `id: 'recovery-toolkit'` and update:

```typescript
module_count: 5,          // was 4
total_duration_minutes: 48, // was 40 — add 8 min for rt-5
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/education-seed.ts
git commit -m "feat(education): add Recovery & DOMS module to recovery-toolkit pathway"
```

---

## Task 4: Add understanding-supplements to SEED_MODULES

**Files:**
- Modify: `src/lib/education-seed.ts`

- [ ] **Step 1: Add the supplements pathway module array**

Append a new key to `SEED_MODULES`:

```typescript
'understanding-supplements': [
  {
    id: 'us-01',
    pathway_id: 'understanding-supplements',
    title: 'What Supplements Actually Are',
    description: 'The food-first principle, what the word "supplement" legally means, and why most of the industry is barely regulated — before you spend a penny on any product.',
    module_order: 1,
    video_url: null,
    pdf_url: null,
    duration_minutes: 8,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    progress_status: 'not_started',
    is_locked: false,
  },
  {
    id: 'us-02',
    pathway_id: 'understanding-supplements',
    title: 'Protein Powder — Do You Need It?',
    description: 'Whey, casein, and plant protein explained. When a protein supplement genuinely helps, when it\'s unnecessary, and how to choose one without being misled by marketing.',
    module_order: 2,
    video_url: null,
    pdf_url: null,
    duration_minutes: 10,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    progress_status: 'not_started',
    is_locked: true,
  },
  {
    id: 'us-03',
    pathway_id: 'understanding-supplements',
    title: 'Creatine — The Most Researched Supplement',
    description: 'What creatine actually does (ATP production), the correct dose (3–5g daily, no loading needed), and why the kidney damage and water retention fears are not supported by evidence.',
    module_order: 3,
    video_url: null,
    pdf_url: null,
    duration_minutes: 10,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    progress_status: 'not_started',
    is_locked: true,
  },
  {
    id: 'us-04',
    pathway_id: 'understanding-supplements',
    title: 'Pre-Workout and Fat Burners',
    description: 'What pre-workout supplements actually contain, why caffeine dependency develops fast, the truth about fat burners, and who should avoid stimulant-based products entirely.',
    module_order: 4,
    video_url: null,
    pdf_url: null,
    duration_minutes: 10,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    progress_status: 'not_started',
    is_locked: true,
  },
  {
    id: 'us-05',
    pathway_id: 'understanding-supplements',
    title: 'Reading Labels and Spotting Marketing Nonsense',
    description: 'Proprietary blends, third-party testing, certifications worth trusting, and the red flag ingredients and claims that signal a product you should avoid.',
    module_order: 5,
    video_url: null,
    pdf_url: null,   // Summary sheet: supplement decision tree — populate when PDF uploaded
    duration_minutes: 10,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    progress_status: 'not_started',
    is_locked: true,
  },
],
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/education-seed.ts
git commit -m "feat(education): add understanding-supplements pathway modules"
```

---

## Task 5: Add all quiz questions to SEED_QUIZ

**Files:**
- Modify: `src/lib/education-seed.ts`

Quizzes apply to D-format lessons only: `nf-03b`, `nf-03c`, `nf-03d`, `nf-05a`, `nf-05b`, `nf-05c`, `nf-05d`, `us-02`, `us-03`, `us-04`. True/false questions use `options: ['True', 'False']` with `correct_index: 0` (True) or `1` (False).

- [ ] **Step 1: Replace the entire SEED_QUIZ export with the following**

```typescript
export const SEED_QUIZ: Record<string, QuizQuestion[]> = {
  // ── Macros: Protein lesson ─────────────────────────────────────────────
  'nf-03b': [
    {
      id: 'nf03b-q1',
      question: 'What is the recommended daily protein intake for someone doing strength training?',
      options: ['0.5–0.8g per kg of bodyweight', '1.6–2.2g per kg of bodyweight', '3.0–4.0g per kg of bodyweight', '0.1–0.3g per kg of bodyweight'],
      correct_index: 1,
    },
    {
      id: 'nf03b-q2',
      question: 'Which of the following is NOT a primary function of protein?',
      options: ['Muscle repair and growth', 'Keeping you feeling full', 'Providing your main source of energy during training', 'Supporting immune function'],
      correct_index: 2,
    },
    {
      id: 'nf03b-q3',
      question: 'Protein contains 4 calories per gram.',
      options: ['True', 'False'],
      correct_index: 0,
    },
    {
      id: 'nf03b-q4',
      question: 'Most beginners already eat enough protein through their normal diet.',
      options: ['True', 'False'],
      correct_index: 1,
    },
  ],

  // ── Macros: Carbohydrates lesson ───────────────────────────────────────
  'nf-03c': [
    {
      id: 'nf03c-q1',
      question: 'What is glycogen?',
      options: ['A type of dietary fat', 'Stored carbohydrate used as fuel during exercise', 'A hormone that controls blood sugar', 'A type of protein found in muscles'],
      correct_index: 1,
    },
    {
      id: 'nf03c-q2',
      question: 'Cutting out carbohydrates completely is the best approach for fat loss.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf03c-q3',
      question: 'How many calories per gram do carbohydrates contain?',
      options: ['2', '4', '7', '9'],
      correct_index: 1,
    },
    {
      id: 'nf03c-q4',
      question: 'Which factor matters most when choosing carbohydrate sources?',
      options: ['Eating only low-carb vegetables', 'Avoiding all white foods', 'Food quality and fibre content', 'Eating carbs only at breakfast'],
      correct_index: 2,
    },
  ],

  // ── Macros: Fats lesson ────────────────────────────────────────────────
  'nf-03d': [
    {
      id: 'nf03d-q1',
      question: 'How many calories per gram does dietary fat contain?',
      options: ['4', '6', '7', '9'],
      correct_index: 3,
    },
    {
      id: 'nf03d-q2',
      question: 'Dietary fat is essential for absorbing vitamins A, D, E and K.',
      options: ['True', 'False'],
      correct_index: 0,
    },
    {
      id: 'nf03d-q3',
      question: 'Which of the following is a function of dietary fat?',
      options: ['Fuelling high-intensity exercise', 'Producing hormones including testosterone', 'Preventing muscle breakdown during fasting', 'All of the above'],
      correct_index: 1,
    },
    {
      id: 'nf03d-q4',
      question: 'Eating dietary fat directly causes body fat gain.',
      options: ['True', 'False'],
      correct_index: 1,
    },
  ],

  // ── Myths: Carb and fat myths ──────────────────────────────────────────
  'nf-05a': [
    {
      id: 'nf05a-q1',
      question: 'What actually causes fat gain?',
      options: ['Eating carbohydrates', 'Eating dietary fat', 'A sustained calorie surplus over time', 'Eating after 6pm'],
      correct_index: 2,
    },
    {
      id: 'nf05a-q2',
      question: 'Low-fat food products are always a better choice for weight loss.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf05a-q3',
      question: 'Why are low-fat products often NOT better for weight loss?',
      options: ['They contain more protein', 'They often replace fat with added sugar to maintain taste', 'They are harder to digest', 'They raise cholesterol'],
      correct_index: 1,
    },
    {
      id: 'nf05a-q4',
      question: 'Dietary fat and body fat are the same thing.',
      options: ['True', 'False'],
      correct_index: 1,
    },
  ],

  // ── Myths: Weight loss myths ───────────────────────────────────────────
  'nf-05b': [
    {
      id: 'nf05b-q1',
      question: 'Can you "spot reduce" fat by training a specific body part?',
      options: ['Yes, with the right exercises', 'No — fat loss is determined by overall calorie deficit, not exercise location', 'Only with high repetitions', 'Only if combined with a fat burner'],
      correct_index: 1,
    },
    {
      id: 'nf05b-q2',
      question: 'Eating calories late at night causes more fat gain than eating the same calories earlier in the day.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf05b-q3',
      question: 'Fasted cardio burns significantly more total fat over 24 hours than fed cardio.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf05b-q4',
      question: 'What does a juice cleanse primarily cause you to lose?',
      options: ['Body fat', 'Muscle tissue', 'Water and potentially muscle', 'Visceral fat'],
      correct_index: 2,
    },
  ],

  // ── Myths: Protein and supplement myths ───────────────────────────────
  'nf-05c': [
    {
      id: 'nf05c-q1',
      question: 'High protein diets damage the kidneys in healthy adults.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf05c-q2',
      question: 'You MUST consume protein within 30 minutes of finishing a workout.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf05c-q3',
      question: 'What is the most important factor for muscle recovery after training?',
      options: ['Consuming a protein shake within 30 minutes', 'Total daily protein intake throughout the day', 'Taking a creatine supplement', 'Eating a large meal immediately after'],
      correct_index: 1,
    },
    {
      id: 'nf05c-q4',
      question: 'Fat burner supplements can cause significant fat loss without changes to diet or exercise.',
      options: ['True', 'False'],
      correct_index: 1,
    },
  ],

  // ── Myths: Training myths ─────────────────────────────────────────────
  'nf-05d': [
    {
      id: 'nf05d-q1',
      question: '"No pain, no gain" — muscle soreness after every session is a sign of an effective workout.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf05d-q2',
      question: 'Women who lift weights will get bulky muscles.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'nf05d-q3',
      question: 'Why is it very difficult for most women to build large muscles from strength training?',
      options: ['Women\'s muscles are structurally different', 'Women have significantly lower testosterone levels than men', 'Women cannot perform compound lifts effectively', 'Women\'s metabolism is faster'],
      correct_index: 1,
    },
    {
      id: 'nf05d-q4',
      question: 'Sweating more during a workout means you are burning more calories.',
      options: ['True', 'False'],
      correct_index: 1,
    },
  ],

  // ── Supplements: Protein powder lesson ───────────────────────────────
  'us-02': [
    {
      id: 'us02-q1',
      question: 'Protein powder is necessary for building muscle.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'us02-q2',
      question: 'What is the main difference between whey and casein protein?',
      options: ['Whey has more calories', 'Whey is fast-digesting; casein is slow-digesting', 'Casein causes more muscle growth', 'Whey is only for men'],
      correct_index: 1,
    },
    {
      id: 'us02-q3',
      question: 'When is a protein supplement MOST useful?',
      options: ['When you cannot meet your daily protein target through whole food alone', 'Immediately after every workout regardless of diet', 'First thing every morning', 'When training more than 5 days a week'],
      correct_index: 0,
    },
    {
      id: 'us02-q4',
      question: 'Protein powder can cause fat gain.',
      options: ['True — it is high in calories so excess intake contributes to a calorie surplus', 'False — protein has no calories', 'False — protein is always used for muscle building', 'True — it raises insulin'],
      correct_index: 0,
    },
  ],

  // ── Supplements: Creatine lesson ─────────────────────────────────────
  'us-03': [
    {
      id: 'us03-q1',
      question: 'What does creatine do in the body?',
      options: ['Directly builds muscle tissue', 'Helps muscles regenerate ATP (energy) faster during high-intensity effort', 'Burns fat during exercise', 'Increases testosterone production'],
      correct_index: 1,
    },
    {
      id: 'us03-q2',
      question: 'You need to "load" creatine with a high dose for the first week to see results.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'us03-q3',
      question: 'What is the recommended daily maintenance dose of creatine?',
      options: ['10–15g', '3–5g', '1g', '20g'],
      correct_index: 1,
    },
    {
      id: 'us03-q4',
      question: 'Creatine supplementation causes kidney damage in healthy adults.',
      options: ['True', 'False'],
      correct_index: 1,
    },
  ],

  // ── Supplements: Pre-workout and fat burners ──────────────────────────
  'us-04': [
    {
      id: 'us04-q1',
      question: 'What is the primary active ingredient in most pre-workout supplements?',
      options: ['Creatine', 'Beta-alanine', 'Caffeine', 'BCAAs'],
      correct_index: 2,
    },
    {
      id: 'us04-q2',
      question: 'Fat burner supplements work independently of diet and exercise changes.',
      options: ['True', 'False'],
      correct_index: 1,
    },
    {
      id: 'us04-q3',
      question: 'Which group of people should be MOST cautious about stimulant-based supplements?',
      options: ['People who train in the morning', 'People with heart conditions, anxiety, or high blood pressure', 'People who are new to the gym', 'People who are vegetarian'],
      correct_index: 1,
    },
    {
      id: 'us04-q4',
      question: 'Regular use of caffeine-containing pre-workout supplements can lead to caffeine dependency.',
      options: ['True', 'False'],
      correct_index: 0,
    },
  ],
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start the dev server and open the education page to verify all pathways and modules render correctly**

```bash
cd "/Users/edharper/Documents/Claude Gym/members-area" && npm run dev
```

Open `http://localhost:3000/education` (or the relevant local port). Verify:
- Nutrition Foundations shows 12 modules, progress bar renders correctly
- Recovery Toolkit shows 5 modules including Recovery & DOMS at the end
- Understanding Supplements pathway card appears
- Navigate into Nutrition Foundations — all 12 modules list with correct titles and lock states

- [ ] **Step 4: Commit**

```bash
git add src/lib/education-seed.ts
git commit -m "feat(education): add all quiz questions for D-format nutrition and supplements modules"
```

---

## Task 6: Module 1 — Tracking Calories (Script & Slides)

**Deliverable:** Google Slides deck + paired Google Doc script.  
**Naming convention:** `N1HSP — Module 01 — Tracking Calories — Slides` / `N1HSP — Module 01 — Tracking Calories — Script`

- [ ] **Step 1: Create the Google Slides deck using the brand template**

Slide colour palette: background `#0d1a1a`, accent `#2a9090`, light teal `#6ab8b8`, pale teal `#a0c8c8`, white `#ffffff`. Geometric polygon texture on title and key takeaway slides. 16:9 widescreen.

Create 7 slides with the following content:

**Slide 1 — Title**
- Module number: `MODULE 01`
- Title: `TRACKING CALORIES`
- Rule: horizontal teal line
- Subtitle: `Nutrition Foundations · Phase 1`
- Background: polygon texture

**Slide 2 — What is a calorie?**
- Label: `What is a calorie?`
- Headline: `A calorie is a unit of energy — nothing more.`
- Bullets:
  - Food stores energy, measured in calories (kcal)
  - Your body burns calories constantly — at rest and during movement
  - Eat more than you burn → your body stores the surplus
  - Eat less than you burn → your body uses stored energy

**Slide 3 — What is TDEE?**
- Label: `TDEE — Total Daily Energy Expenditure`
- Headline: `How many calories your body burns in a day.`
- Bullets:
  - BMR (Basal Metabolic Rate): calories burned just staying alive
  - Activity factor: calories burned through movement and exercise
  - TDEE = BMR + activity — this is your maintenance number
  - Most people underestimate their TDEE by 200–400 kcal

**Slide 4 — The calorie deficit**
- Label: `Calorie deficit`
- Headline: `Eat less than your TDEE and your body uses stored fat.`
- Bullets:
  - A deficit of ~500 kcal/day → roughly 0.5kg loss per week
  - You don't need an aggressive deficit — sustainable wins
  - Protein intake protects muscle during a deficit (covered in Module 3)
  - No food is "fattening" — only a sustained surplus causes fat gain

**Slide 5 — Precision vs consistency**
- Label: `The real goal`
- Headline: `Consistency beats precision every time.`
- Bullets:
  - Calorie counts on packaging can be 20% inaccurate — that's fine
  - Logging apps are estimates, not lab measurements
  - Aim for 80% accuracy, 100% of the time
  - One day over target won't matter — patterns matter

**Slide 6 — Quick-start: your target**
- Label: `Getting started`
- Headline: `A rough starting point for most people.`
- Bullets:
  - Fat loss: bodyweight (lbs) × 12–13 = rough daily calorie target
  - OR: use an online TDEE calculator and subtract 300–500 kcal
  - Track for 2 weeks before adjusting — data first, changes second
  - Next up: Module 2 walks you through MyFitnessPal step by step

**Slide 7 — Key Takeaway**
- Label: `Key Takeaway`
- Quote: `"You can't manage what you don't measure — but you don't need to be obsessed. Awareness, not perfection."`
- Background: polygon texture, teal border

- [ ] **Step 2: Write the paired script in Google Docs**

Structure each section as follows. Coaches can deliver this in their own style — this is a talking guide, not a word-for-word read.

**① Hook (15–20 sec)**
> "If you've ever eaten 'healthily' all week and still not lost weight — this module is going to explain exactly why. And the answer isn't complicated."

**② Signpost (20–30 sec)**
> "In the next six minutes, we're going to cover what a calorie actually is, something called TDEE, and what a calorie deficit means for fat loss. By the end, you'll have a rough daily calorie target and know how to hit it without turning every meal into a maths problem."

**③ Content — Slide 2: What is a calorie? (45–60 sec)**
> "A calorie is simply a unit of energy. That's it — nothing magical, nothing sinister. Food stores energy, and your body uses that energy to keep you alive and moving. When you eat more energy than your body needs, it stores the surplus — mostly as body fat. When you eat less than it needs, it draws on those stores. Everything else in nutrition is built on top of this one principle."

**③ Content — Slide 3: TDEE (60–75 sec)**
> "TDEE stands for Total Daily Energy Expenditure — and it just means the total number of calories your body burns in a day. It's made up of two parts. Your BMR — Basal Metabolic Rate — is the energy your body burns just to stay alive: breathing, organ function, body temperature. That's typically the biggest chunk. Then you add your activity: walking, training, everything else. Most people are surprised how high their TDEE actually is — we tend to underestimate it by a few hundred calories."

**③ Content — Slide 4: The calorie deficit (60 sec)**
> "A calorie deficit just means you're eating less than your TDEE. When you do that consistently, your body uses stored fat to make up the difference. A deficit of around 500 calories a day tends to produce about half a kilogram of fat loss per week — sustainable without being aggressive. And before anyone asks — no, you don't need to cut carbs, avoid certain foods, or eat at specific times. None of that matters if you're not in a deficit."

**③ Content — Slide 5: Precision vs consistency (45 sec)**
> "Here's the thing people miss: calorie counts aren't perfectly accurate. Food labels can be off by 20%. Cooking changes things. That's completely fine — because what matters isn't precision, it's consistency. Aim to be roughly right, reliably. One day over target changes nothing. A year of being roughly on target changes everything."

**③ Content — Slide 6: Quick-start target (45 sec)**
> "To get a rough starting point: take your bodyweight in pounds and multiply by 12 or 13. That gives most people a reasonable starting calorie target for fat loss. You can also use an online TDEE calculator — just search TDEE calculator — and subtract 300 to 500 from the number it gives you. Track for two weeks before changing anything. Data first."

**④ Key Takeaway (20 sec)**
> "You can't manage what you don't measure. But you don't need to be obsessed with it either. Awareness, not perfection — that's the goal."

**⑤ Action Step + Next (20 sec)**
> "This week: find your rough calorie target using one of those two methods. Write it down. Next up, Module 2 walks you through MyFitnessPal — we'll set up the app and start logging."

---

## Task 7: Module 2 — Using MyFitnessPal (Script & Slides)

**Deliverable:** `N1HSP — Module 02 — Using MyFitnessPal — Slides` / `N1HSP — Module 02 — Using MyFitnessPal — Script`

- [ ] **Step 1: Create the Google Slides deck (7 slides)**

**Slide 1 — Title:** `MODULE 02` / `USING MYFITNESSPAL` / `Nutrition Foundations · Phase 1`

**Slide 2 — Setting up the app**
- Headline: `Set your calorie goal first. Ignore macros for now.`
- Bullets:
  - Download MyFitnessPal (free version works fine)
  - Enter your details and select "lose weight" or "maintain"
  - Override the calorie target with your number from Module 1
  - Ignore the macro split for now — that's Module 3

**Slide 3 — Logging a meal**
- Headline: `Three ways to log food — use whichever is fastest.`
- Bullets:
  - Barcode scanner: point at any packaged food — fastest method
  - Search: type the food name, select the closest match
  - Custom entry: for home cooking, enter ingredients separately
  - The goal is speed — logging should take 2 minutes per meal

**Slide 4 — What people forget**
- Headline: `Three things that quietly wreck your accuracy.`
- Bullets:
  - Drinks: coffee with milk, juice, protein shakes — all count
  - Cooking oil: 1 tbsp olive oil = ~120 kcal — log it
  - Sauces and condiments: ketchup, mayo, dressings add up fast
  - These three alone can account for 300–500 uncounted kcal daily

**Slide 5 — How accurate is it?**
- Headline: `Accurate enough — but not a science experiment.`
- Bullets:
  - User-generated database entries can be wrong — check portion sizes
  - Restaurant meals are the hardest to log accurately — do your best
  - "Roughly right" is good enough — you're building awareness, not precision
  - If your weight isn't moving after 3–4 weeks, look here first

**Slide 6 — Building the habit**
- Headline: `The 80% rule: log 80% of the time, consistently.`
- Bullets:
  - Don't aim for perfect — aim for consistent
  - Log for 2–4 weeks to build calorie intuition
  - Many people stop needing to log once patterns are established
  - If you miss a day, just start again tomorrow — no guilt

**Slide 7 — Key Takeaway**
- Quote: `"The app is a tool to build awareness — not a life sentence. Two to four weeks of logging teaches you more about food than years of guessing."`

- [ ] **Step 2: Write the paired script in Google Docs**

**① Hook:** > "Most people who try to track their food give up within a week — usually because they're making it harder than it needs to be. Here's how to actually use MyFitnessPal without it taking over your life."

**② Signpost:** > "We're going to set up the app, walk through the three ways to log food, cover the things people forget that quietly wreck their accuracy, and talk about how long you actually need to do this."

**③ Slide 2 — Setting up (45 sec):** > "When you first open MyFitnessPal, it'll ask about your goals and spit out a calorie target. Ignore that number — or at least check it against the target you calculated in Module 1. Set your goal to the number you worked out. You'll also see a macro split — protein, carbs, fat percentages. Leave that alone for now. We cover macros properly in the next module. One thing at a time."

**③ Slide 3 — Logging (60 sec):** > "There are three ways to log food. The barcode scanner is fastest — point it at any packaged food and it pulls up the nutritional info. For anything without a barcode, search the name. For home cooking, log each ingredient separately — it sounds tedious but it's quicker than it sounds. The whole thing should take about two minutes per meal. If it's taking longer, you're overthinking it."

**③ Slide 4 — What people forget (60 sec):** > "Here's where most people's logs fall apart. Drinks — coffee with milk, juice, a protein shake — all have calories and all need logging. Cooking oil is the big one: a single tablespoon of olive oil is about 120 calories, and most people use two or three tablespoons without thinking about it. Sauces and condiments — ketchup, mayo, salad dressings — these add up to hundreds of calories that never get counted. Between these three, most people are unknowingly eating 300 to 500 more calories than they think."

**③ Slide 5 — Accuracy (45 sec):** > "The database on MyFitnessPal is user-generated, which means some entries are wrong. Always check the portion size makes sense — if something says a portion of chicken has 12 calories, that's not right. Restaurant meals are the hardest — just log your best estimate and move on. Roughly right is good enough. If your weight isn't moving after three or four weeks of tracking, the first thing to do is look at whether your log is genuinely accurate."

**③ Slide 6 — Building the habit (45 sec):** > "You don't need to track forever. The goal is to use the app for two to four weeks to build calorie intuition — to understand what a 500-calorie meal actually looks like versus a 1,000-calorie one. Most people stop needing to log once those patterns are established. The rule is 80%: log 80% of the time, consistently. Miss a day? Fine. Just start again tomorrow."

**④ Key Takeaway:** > "The app is a tool to build awareness — not a life sentence. Two to four weeks of accurate logging teaches you more about food than years of guessing."

**⑤ Action Step + Next:** > "This week: download MyFitnessPal, set your calorie goal, and log for three days — no changes to what you're eating, just observe. Next up: Module 3 covers macronutrients — protein, carbs, and fat — and why the ratio matters as much as the total."

---

## Task 8: Module 3 — Understanding Macros (Scripts & Slides, 5 lessons)

**Deliverable:** One slide deck per lesson (`N1HSP — Module 03a` through `03e`) + one script doc per lesson.

- [ ] **Step 1: Create Lesson 1 slides — What Are Macros? (6 slides)**

**Slide 1 — Title:** `MODULE 03 · LESSON 1` / `WHAT ARE MACROS?` / `Nutrition Foundations · Phase 1`

**Slide 2:** Headline: `Macros = macronutrients. Three categories that all food falls into.`
Bullets: Protein (meat, fish, eggs, dairy, legumes) · Carbohydrates (grains, fruit, vegetables, sugar) · Fat (oils, nuts, avocado, meat) · Every food is a mix — nothing is purely one macro

**Slide 3:** Headline: `Each macro contains a different amount of energy per gram.`
Bullets: Protein: 4 kcal/g · Carbohydrates: 4 kcal/g · Fat: 9 kcal/g · Alcohol: 7 kcal/g (not a macro, but worth knowing)

**Slide 4:** Headline: `Why ratios matter — not just total calories.`
Bullets: 2,000 kcal of mostly protein = very different results to 2,000 kcal of mostly fat · Protein protects muscle · Carbs fuel performance · Fat supports hormones and health · The mix affects body composition, not just weight

**Slide 5:** Headline: `You're already eating macros — now you'll understand them.`
Bullets: Nothing is "good" or "bad" — all three are essential · No macro is the enemy · Over the next four lessons: deep dive into each one · Then: how to set your own targets

**Slide 6 — Key Takeaway:** `"Macros are just categories of food. Once you understand them, nothing is off the table — you just understand what you're working with."`

- [ ] **Step 2: Write Lesson 1 script (Google Doc)**

**Hook:** > "You've probably seen the word 'macros' everywhere — in gyms, on food packaging, in every fitness app. But most people have a vague idea at best. Let's clear it up in under ten minutes."

**Signpost:** > "By the end of this lesson, you'll know exactly what macros are, why they have different effects on your body, and why the ratio matters just as much as total calories."

**Slide 2 (60 sec):** > "Macronutrients — macros — are the three categories that all food falls into: protein, carbohydrates, and fat. Every food you eat is made up of one or more of these three. Chicken is mostly protein with some fat. Bread is mostly carbohydrate. Olive oil is almost entirely fat. A meal like chicken, rice, and broccoli with olive oil has all three. There's no food that's purely one macro — but most foods are dominated by one or two."

**Slide 3 (45 sec):** > "Here's something that matters for calorie counting: each macro has a different calorie density. Protein and carbs both have four calories per gram. Fat has nine — more than double. That's why a handful of nuts has more calories than it looks — nuts are mostly fat. It's also why a big plate of vegetables is very low in calories despite its size — vegetables are mostly water and fibre."

**Slide 4 (60 sec):** > "Here's why the ratio matters — not just the total. Two people could both eat 2,000 calories a day and get completely different results, depending on where those calories come from. Someone eating 2,000 calories with high protein and moderate carbs will likely retain more muscle and lose more fat than someone eating 2,000 calories mostly from fat and sugar. Same calories. Very different body composition outcomes. That's why we go beyond just calories — macros give you much more control."

**Slide 5 (30 sec):** > "All three macros are essential — none of them are the enemy. Protein, carbs, and fat all have important jobs. Over the next four lessons we go into each one properly. Then in lesson five we pull it together and set your actual targets."

**Key Takeaway:** > "Macros are just categories of food. Once you understand them, nothing is off the table — you just understand what you're working with."

**Action Step + Next:** > "Before the next lesson, have a look at the nutritional label on something you eat regularly — notice how many grams of protein, carbs, and fat it contains. Next up: protein — why it's the most important macro and how much you actually need."

- [ ] **Step 3: Create Lesson 2 slides — Protein (7 slides)**

**Slide 1 — Title:** `MODULE 03 · LESSON 2` / `PROTEIN — THE MOST IMPORTANT MACRO`

**Slide 2:** Headline: `What protein does in your body.` Bullets: Builds and repairs muscle after training · Keeps you full longer than carbs or fat · Supports immune function and hormone production · Highest "thermic effect" — your body burns more energy digesting it

**Slide 3:** Headline: `How much protein do you actually need?` Bullets: General recommendation: 1.6–2.2g per kg of bodyweight per day · 80kg person = 128–176g protein per day · Most people eat around 60–80g — roughly half of what they need · Hitting protein is the single biggest nutrition change most beginners can make

**Slide 4:** Headline: `The best protein sources.` Bullets: Animal: chicken, turkey, beef, fish, eggs, Greek yoghurt, cottage cheese · Plant: tofu, tempeh, lentils, edamame, chickpeas · Protein powder: useful when food sources fall short (covered in Module 7) · Aim to include a protein source in every meal

**Slide 5:** Headline: `Practical ways to hit your target.` Bullets: Start breakfast with a protein source — eggs, Greek yoghurt · Aim for 30–40g protein per main meal · Snacks: cottage cheese, hard-boiled eggs, edamame · Track for 1 week to see where your gap actually is

**Slide 6:** Headline: `The protein myth — does it damage your kidneys?` Bullets: In healthy adults: no — the evidence does not support this · Kidney concerns only apply to people with pre-existing kidney disease · If you have a kidney condition, speak to your GP first · For everyone else: high protein is safe and beneficial

**Slide 7 — Key Takeaway:** `"Protein is the macro that protects your muscle while you lose fat. Hit your protein target first — everything else is secondary."`

- [ ] **Step 4: Write Lesson 2 script (Protein)**

**Hook:** > "If there's one change that makes the biggest difference for beginners — not a supplement, not a specific diet, not intermittent fasting — it's eating enough protein. Most people are eating about half of what they need."

**Slide 2 (60 sec):** > "Protein has four key jobs. First: it repairs and builds muscle after training — without enough protein, your training stimulus doesn't result in much adaptation. Second: it keeps you full. Protein is significantly more satiating than carbs or fat, gram for gram — meaning higher protein meals naturally reduce hunger. Third: it supports immune function and hormone production. And fourth: your body actually burns more energy digesting protein than it does digesting carbs or fat. It's the most metabolically expensive macro to process."

**Slide 3 (60 sec):** > "The research-backed recommendation for people doing strength training is 1.6 to 2.2 grams of protein per kilogram of bodyweight, per day. For an 80kg person, that's somewhere between 128 and 176 grams. Most beginners we work with are eating around 60 to 80 grams — roughly half that. This gap is significant. Closing it is often the single most impactful nutrition change a beginner can make."

**Slide 4 (45 sec):** > "The best sources are chicken, turkey, beef, fish, eggs, Greek yoghurt, and cottage cheese on the animal side. For plant-based sources: tofu, tempeh, lentils, edamame, and chickpeas are the best options. The goal is to include a protein source at every meal — not as a supplement, as actual food."

**Slide 5 (45 sec):** > "Practically: start breakfast with something that contains protein — eggs, Greek yoghurt, or a protein-rich shake if you're in a rush. Aim for 30 to 40 grams per main meal. If you track for one week and look at where your protein gaps are, you'll immediately see where the easy wins are."

**Slide 6 (45 sec):** > "One myth worth addressing: high protein diets damage your kidneys. In healthy adults, there is no evidence for this. The concern comes from research done on people who already had kidney disease — for those people, high protein intake can be a problem. If you have pre-existing kidney issues, speak to your GP. For everyone else: the research is clear that high protein intake is safe."

**Key Takeaway:** > "Protein is the macro that protects your muscle while you lose fat. Hit your protein target first — everything else is secondary."

**Action Step + Next:** > "Calculate your protein target: your bodyweight in kilograms multiplied by 1.8. That's your daily goal. Track your protein intake for three days and see where you actually are. Next lesson: carbohydrates — why they're not the enemy and what they actually do."

- [ ] **Step 5: Create Lesson 3 slides — Carbohydrates (6 slides)**

**Slide 1 — Title:** `MODULE 03 · LESSON 3` / `CARBOHYDRATES — FUEL, NOT FEAR`

**Slide 2:** Headline: `What carbohydrates actually do.` Bullets: Primary fuel source for high-intensity exercise · Stored as glycogen in muscles and liver · Brain prefers glucose (from carbs) as fuel · Essential for training performance and recovery

**Slide 3:** Headline: `Low-carb feels effective — here's why.` Bullets: Glycogen holds water — low carb = rapid water loss (not fat) · Initial weight drop is water, not body fat · Calorie reduction often responsible for any actual fat loss · Low-carb works if it helps you eat in a deficit — not because carbs are bad

**Slide 4:** Headline: `Carb quality matters more than carb quantity.` Bullets: Whole food carbs (oats, rice, fruit, veg) = fibre, vitamins, minerals · Ultra-processed carbs (biscuits, crisps, sugary drinks) = calories with little nutrition · Focus on food quality, not total carb grams · No need to fear fruit

**Slide 5:** Headline: `Carb timing: before and after training.` Bullets: Pre-training: carbs 1–2 hours before provide readily available fuel · Post-training: carbs + protein supports glycogen replenishment · Rest days: naturally eat slightly fewer carbs — no strict protocol needed

**Slide 6 — Key Takeaway:** `"Carbohydrates don't make you fat. A calorie surplus makes you fat. Carbs make you perform, recover, and think clearly."`

- [ ] **Step 6: Write Lesson 3 script (Carbohydrates)**

**Hook:** > "Carbs have been the villain of nutrition for thirty years. They're not. Let's deal with this once and for all."

**Slide 2 (60 sec):** > "Carbohydrates are your body's preferred fuel source for exercise — specifically high-intensity exercise. They're stored as glycogen in your muscles and liver. When you train, you're running on that glycogen. When it runs low, your performance drops. Your brain also runs on glucose, which comes from carbohydrates — which is part of why very low-carb diets make some people feel foggy and lethargic."

**Slide 3 (60 sec):** > "Here's why low-carb diets feel so effective initially. Glycogen holds water — roughly 3 to 4 grams of water per gram of glycogen. When you cut carbs, you rapidly deplete glycogen stores and lose that water. For most people that's 2 to 4 kilograms in the first week or two. That's not fat — it comes straight back when carbs are reintroduced. Any genuine fat loss on low-carb diets is because cutting carbs made it easier to eat in a calorie deficit — not because carbs are uniquely fattening."

**Slide 4 (45 sec):** > "What actually matters is carb quality. Oats, rice, potatoes, fruit, and vegetables provide carbohydrates along with fibre, vitamins, and minerals. Ultra-processed carbs — biscuits, crisps, sugary drinks — provide the same or more calories with very little nutritional value. Focus on whole food carb sources and don't stress the quantity."

**Slide 5 (45 sec):** > "Timing matters a little for performance — less so for body composition. Having carbs one to two hours before training provides readily available fuel. After training, carbs combined with protein supports glycogen replenishment and recovery. On rest days, you'll naturally eat slightly fewer carbs — no strict protocol needed."

**Key Takeaway:** > "Carbohydrates don't make you fat. A calorie surplus makes you fat. Carbs make you perform, recover, and think clearly."

**Action Step + Next:** > "Next lesson: dietary fat — why it's essential, what it actually does, and why low-fat products are often not the better choice."

- [ ] **Step 7: Create Lesson 4 slides — Fats (6 slides)**

**Slide 1 — Title:** `MODULE 03 · LESSON 4` / `FATS — ESSENTIAL, NOT THE ENEMY`

**Slide 2:** Headline: `What dietary fat does in your body.` Bullets: Produces hormones including testosterone and oestrogen · Enables absorption of fat-soluble vitamins (A, D, E, K) · Cell membrane structure and brain function · Provides satiety — fat digests slowly and keeps you full

**Slide 3:** Headline: `Fat has 9 kcal per gram — almost double protein and carbs.` Bullets: Easy to overeat in a small volume · This is why calorie-dense foods are often high-fat · Not because fat is bad — just dense · Track it accurately or it quietly pushes you into a surplus

**Slide 4:** Headline: `Types of fat — what to focus on.` Bullets: Unsaturated fats (olive oil, avocado, nuts, oily fish): prioritise these · Saturated fats (butter, fatty meat, coconut oil): fine in moderation · Trans fats (partially hydrogenated oils in ultra-processed food): minimise · The goal: mostly unsaturated, some saturated, minimal trans

**Slide 5:** Headline: `Why low-fat products often aren't better.` Bullets: Fat removed → less flavour → manufacturers add sugar or starch · Low-fat yoghurt often has more sugar than full-fat · Full-fat dairy is more satiating — you naturally eat less of it · Always check the full label, not just the fat content

**Slide 6 — Key Takeaway:** `"Dietary fat is not body fat. You need fat to produce hormones, absorb vitamins, and feel full. The goal is quality and quantity — not elimination."`

- [ ] **Step 8: Write Lesson 4 script (Fats)**

**Hook:** > "In the 1980s and 90s, dietary fat was declared the enemy of health and weight loss. The food industry replaced it with sugar and marketed the result as 'healthy'. Neither the science nor the outcomes backed that up."

**Slides 2–5 talking points:** Fat's four functions (hormones, vitamins, cell structure, satiety). Calorie density: 9 kcal/g makes it easy to overeat in small portions — not because fat is bad, but because it's dense. Types: unsaturated fats (olive oil, nuts, oily fish) are the priority. Saturated fat (butter, fatty meat) is fine in reasonable amounts. Trans fats in ultra-processed foods are the ones to genuinely minimise. Low-fat products: explain the swap — fat removed, sugar added, overall calories often unchanged, satiety reduced.

**Key Takeaway:** > "Dietary fat is not body fat. You need fat to produce hormones, absorb vitamins, and feel full. The goal is quality and quantity — not elimination."

**Action Step + Next:** > "Next lesson: we bring all three macros together and set your actual targets in MyFitnessPal."

- [ ] **Step 9: Create Lesson 5 slides — Setting Targets (7 slides)**

**Slide 1 — Title:** `MODULE 03 · LESSON 5` / `SETTING YOUR MACRO TARGETS`

**Slide 2:** Headline: `Set protein first — always.` Bullets: Protein target: bodyweight (kg) × 1.8–2.0g · Example: 75kg person = 135–150g protein · This is non-negotiable — hit this before worrying about carbs or fat · 1g protein = 4 kcal

**Slide 3:** Headline: `Then set your fat floor.` Bullets: Minimum fat for hormonal health: ~0.8–1.0g per kg bodyweight · Example: 75kg person = 60–75g fat · 1g fat = 9 kcal · Going below this long-term can affect hormones and vitamin absorption

**Slide 4:** Headline: `Fill remaining calories with carbohydrates.` Bullets: Remaining kcal after protein + fat = carb allocation · Example: 2,000 kcal goal − protein kcal (150g × 4 = 600) − fat kcal (70g × 9 = 630) = 770 kcal left = ~190g carbs · Carbs are flexible — adjust up/down based on training and preference

**Slide 5:** Headline: `How to enter this in MyFitnessPal.` Bullets: Tap "More" → Goals → Calorie & Macronutrient Goals · Enter grams (not percentages) for accuracy · App converts to percentages automatically — ignore those · Re-check every 4–8 weeks as bodyweight changes

**Slide 6:** Headline: `The macro reference card — keep this handy.` Bullets: Protein: bodyweight (kg) × 1.8–2.0g · Fat: bodyweight (kg) × 0.8–1.0g · Carbs: fill remaining calories · Daily calorie target: from Module 1 · Summary sheet included below this video

**Slide 7 — Key Takeaway:** `"Protein first, fat floor second, carbs to fill. Once your protein is sorted, everything else follows."`

- [ ] **Step 10: Write Lesson 5 script (Setting Targets)**

**Hook:** > "This is the lesson where everything from the last four lessons comes together into actual numbers you can act on today."

**Slides 2–5 talking points:** Walk through the calculation step by step using a 75kg example person. Protein: 75 × 1.8 = 135g = 540 kcal. Fat: 75 × 0.9 = 67g = 603 kcal. Total so far = 1,143 kcal. If daily target is 2,000 kcal: 857 kcal left → 857 ÷ 4 = ~214g carbs. Emphasise entering in grams not percentages. Summary sheet at the bottom of this module has a reference card to keep.

**Key Takeaway:** > "Protein first, fat floor second, carbs to fill. Once your protein is sorted, everything else follows."

**Action Step + Next:** > "Set your macro targets in MyFitnessPal today using the formula we just walked through. Download the summary sheet below — it has everything on one page. Next up: Module 4, Intermittent Fasting — what it actually is and whether it's right for you."

- [ ] **Step 11: Produce the Module 3 summary sheet**

Create in Google Docs, export as PDF. Content:

**Title:** MACRO TARGETS — QUICK REFERENCE CARD · Number One HSP

**Table: Protein**
- Target: bodyweight (kg) × 1.8–2.0g
- Calories per gram: 4 kcal
- Example (75kg): 135–150g / 540–600 kcal
- Best sources: chicken, turkey, fish, eggs, Greek yoghurt, cottage cheese, tofu, lentils

**Table: Fat**
- Target: bodyweight (kg) × 0.8–1.0g (minimum)
- Calories per gram: 9 kcal
- Example (75kg): 60–75g / 540–675 kcal
- Best sources: olive oil, avocado, nuts, oily fish, eggs

**Table: Carbohydrates**
- Target: fill remaining calories after protein + fat
- Calories per gram: 4 kcal
- Best sources: oats, rice, potatoes, fruit, vegetables

**Calculation steps:** 1) Set daily calorie target (Module 1) · 2) Set protein: kg × 1.8 × 4 = kcal from protein · 3) Set fat: kg × 0.9 × 9 = kcal from fat · 4) Carbs: remaining kcal ÷ 4 = grams

**Footer:** members.numberonehsp.com · Health · Strength · Performance

Upload PDF to Supabase Storage and update `pdf_url` for module `nf-03e`.

---

## Task 9: Module 4 — Intermittent Fasting (Script & Slides)

**Deliverable:** `N1HSP — Module 04 — Intermittent Fasting — Slides` / Script

- [ ] **Step 1: Create the Google Slides deck (8 slides)**

**Slide 1 — Title:** `MODULE 04` / `INTERMITTENT FASTING` / `Nutrition Foundations · Phase 2`

**Slide 2:** Headline: `What IF actually is.` Bullets: An eating pattern — not a diet · You're restricting WHEN you eat, not necessarily WHAT · The fasting window: no calories (water, black coffee, plain tea: fine) · The eating window: eat normally within it

**Slide 3:** Headline: `The three most common protocols.` Bullets: 16:8 — fast 16 hrs, eat within 8hrs (e.g. 12pm–8pm) — most popular · 14:10 — fast 14 hrs, eat within 10hrs — gentler starting point · 5:2 — eat normally 5 days, restrict to ~500 kcal on 2 non-consecutive days · All three work — the best one is the one you'll stick to

**Slide 4:** Headline: `Who benefits most from IF.` Bullets: People who naturally aren't hungry in the morning · Anyone who struggles to control evening eating · People who find fewer, larger meals easier to manage than many small ones · Those who want simplicity — fewer meals, less planning

**Slide 5:** Headline: `Who should be cautious.` Bullets: People with a history of disordered eating · Pregnant or breastfeeding women · Type 1 diabetics or those on blood sugar medication (speak to GP first) · Anyone whose job or training demands energy first thing in the morning

**Slide 6:** Headline: `The first two weeks — what to expect.` Bullets: Hunger, headaches, irritability — normal · These pass within 7–14 days as the body adapts · Start with a shorter fast (12:12) and build up · Electrolytes help — salt, magnesium during the fasting window

**Slide 7:** Headline: `The muscle loss myth — addressed.` Bullets: IF does not cause muscle loss — with adequate protein · The research: IF + sufficient protein = same muscle retention as normal eating · Where muscle loss occurs: when total protein AND calories are too low · Solution: hit your protein target within your eating window

**Slide 8 — Key Takeaway:** `"IF is a tool, not a rule. It works brilliantly for some people and terribly for others. Try it for four weeks and let the results decide."`

- [ ] **Step 2: Write the paired script**

**Hook:** > "Intermittent fasting is either the best thing that ever happened to someone's diet, or they tried it for three days, felt terrible, and never touched it again. The difference is almost always in the approach."

**Slides 2–7 talking points:** Clarify what IF is — a timing protocol, not a food restriction. Walk through the three protocols. Address who benefits: people who skip breakfast naturally, who prefer fewer bigger meals, who find evening hunger harder to control. Cautions: disordered eating history, medication interactions — always check with GP if unsure. First two weeks are the hard part — most people give up before the adaptation happens. Muscle loss: only occurs if total protein is too low. Hit your protein target in your eating window and muscle loss is not a concern.

**Key Takeaway:** > "IF is a tool, not a rule. It works brilliantly for some people and terribly for others. Try it for four weeks and let the results decide."

**Action Step + Next:** > "If you're curious about IF: start with 12:12 — stop eating at 8pm and don't eat until 8am. Do that for a week, then try extending to 14:10. Module 5 is up next — we start working through the most persistent nutrition myths one by one."

---

## Task 10: Module 5 — Nutrition Myths (Scripts & Slides, 4 lessons)

**Deliverable:** 4 slide decks + 4 scripts. One summary sheet at the end of lesson 4.

- [ ] **Step 1: Create Lesson 1 slides — Carb and Fat Myths (6 slides)**

**Slide 1 — Title:** `MODULE 05 · LESSON 1` / `CARB AND FAT MYTHS`

**Slide 2 — Myth:** `"Carbohydrates make you fat."` | **Fact:** `Carbs don't make you fat — a calorie surplus does.` Bullets: Carbs are 4 kcal/g — same as protein · Excess calories from any source = fat gain · Studies: equal calories, equal fat loss regardless of carb content · The confusion: low-carb causes rapid water loss (not fat)

**Slide 3 — Myth:** `"Dietary fat makes you fat."` | **Fact:** `Dietary fat and body fat are not the same thing.` Bullets: Fat is 9 kcal/g — easy to overeat in small portions · The 1980s "fat is bad" era coincided with rising obesity — from added sugar replacing fat · Healthy fats (olive oil, avocado, nuts) actively support health · Fat gain = calorie surplus, whatever the source

**Slide 4 — Myth:** `"Low-fat foods are a healthier choice."` | **Fact:** `Low-fat often means high-sugar.` Bullets: Fat removal reduces flavour → manufacturers add sugar or starch · Low-fat yoghurt often has 2–3× more sugar than full-fat · Full-fat is more satiating — you naturally eat less · Always read the full nutritional label, not just the fat figure

**Slide 5 — The pattern** Headline: `Every one of these myths has a calorie surplus hiding behind it.` Bullets: Carbs don't cause fat gain — excess calories do · Fat doesn't cause fat gain — excess calories do · "Healthy" labelling often masks worse overall nutrition · Cut through the marketing: calories and protein are what matter

**Slide 6 — Key Takeaway:** `"No macro is the enemy. Total calories and protein quality determine your results — not which macros you eat them from."`

- [ ] **Step 2: Write Lesson 1 script**

**Hook:** > "Carbs are bad. Fat is bad. Low-fat is good. These three beliefs dominated nutrition advice for decades. They're all wrong — or at best, dramatically oversimplified."

**Talking points per slide:** Use the research to debunk each myth clearly and specifically. Emphasise the calorie-surplus-is-always-the-culprit point. Low-fat product example: show a typical low-fat yoghurt vs full-fat comparison (coach can pull up a label during recording if helpful).

**Key Takeaway:** > "No macro is the enemy. Total calories and protein quality determine your results — not which macros you eat them from."

**Action + Next:** > "Next lesson: the weight loss myths — spot reduction, eating before bed, juice cleanses, and fasted cardio. Four things most people believe that the evidence doesn't support."

- [ ] **Step 3: Create Lesson 2 slides — Weight Loss Myths (6 slides)**

**Slide 1 — Title:** `MODULE 05 · LESSON 2` / `WEIGHT LOSS MYTHS`

**Slide 2 — Myth:** `"You can target fat loss in specific areas."` | **Fact:** `Spot reduction is not possible.` Bullets: You cannot choose where your body burns fat · Fat loss is determined by overall calorie deficit · Ab exercises build ab muscles — they don't burn belly fat · Body shape changes as overall body fat reduces

**Slide 3 — Myth:** `"Eating after 6pm (or before bed) causes fat gain."` | **Fact:** `Total daily calories determine fat gain — not timing.` Bullets: Controlled studies show identical fat loss regardless of meal timing · The reason this myth persists: evening eating often leads to overeating · If late eating is causing a surplus — that's the issue, not the time · Total intake is what matters

**Slide 4 — Myth:** `"Juice cleanses detox your body and cause fat loss."` | **Fact:** `Your liver and kidneys are your detox system.` Bullets: No scientific evidence that juice cleanses remove toxins · Weight loss = water and potentially muscle, not fat · Juices lack protein, fibre, and healthy fats — and spike blood sugar · Any weight lost returns immediately when normal eating resumes

**Slide 5 — Myth:** `"Fasted cardio burns more fat."` | **Fact:** `It burns more fat during — and less after. The 24-hour total is the same.` Bullets: Fasted training increases fat oxidation in the session · But post-exercise fat burning is reduced to compensate · 24-hour fat balance is equivalent to fed-state training · If you prefer training fasted: fine. It's not superior.

**Slide 6 — Key Takeaway:** `"Fat loss happens in a calorie deficit — wherever, whenever, however you prefer to eat. Don't let myths make it more complicated than it needs to be."`

- [ ] **Step 4: Create Lesson 3 slides — Protein and Supplement Myths (6 slides)**

**Slide 1 — Title:** `MODULE 05 · LESSON 3` / `PROTEIN AND SUPPLEMENT MYTHS`

**Slide 2 — Myth:** `"High protein diets damage your kidneys."` | **Fact:** `Not in healthy adults.` Bullets: Research showing harm: conducted on people with pre-existing kidney disease · In healthy adults: no evidence of kidney damage from high protein · If you have kidney disease, speak to your GP before increasing protein · For everyone else: 1.6–2.2g/kg is safe

**Slide 3 — Myth:** `"You must eat protein within 30 minutes of training."` | **Fact:** `Total daily protein matters far more than timing.` Bullets: The "anabolic window" concept has been significantly overstated · Research: hitting daily protein total = same results regardless of when post-training · Protein timing helps at the margins — daily total is foundational · If you're hungry after training, eat — but don't panic if you can't

**Slide 4 — Myth:** `"Fat burners work on their own."` | **Fact:** `Fat burners don't create a deficit — they can only support one.` Bullets: Most fat burners: caffeine, green tea extract, minor stimulants · Metabolic effect: small (50–100 kcal/day at best) · Without a calorie deficit: no meaningful fat loss · With a calorie deficit: the deficit does the work, not the supplement

**Slide 5 — The pattern:** Headline: `Every supplement myth exploits real-but-small effects.` Bullets: Protein timing matters — a little · Fat burners raise metabolism — a little · The marketing takes a small effect and presents it as transformative · Real results come from the fundamentals — not the margins

**Slide 6 — Key Takeaway:** `"Total daily protein beats perfect timing. A calorie deficit beats any fat burner. Fundamentals beat supplements, every time."`

- [ ] **Step 5: Create Lesson 4 slides — Training Myths (6 slides)**

**Slide 1 — Title:** `MODULE 05 · LESSON 4` / `TRAINING MYTHS`

**Slide 2 — Myth:** `"No pain, no gain."` | **Fact:** `Soreness is not a measure of workout effectiveness.` Bullets: DOMS (muscle soreness) signals a novel stimulus — not progress · You can have highly effective training sessions with no soreness · Chasing soreness can lead to overtraining and injury · Progress is measured by performance: can you lift more? Move better? Not "am I sore?"

**Slide 3 — Myth:** `"Women who lift will get bulky."` | **Fact:** `Building large muscles requires testosterone, years of specific training, and significant calorie surpluses.` Bullets: Women have 10–20× less testosterone than men · The women with large, visible muscles train specifically and intensely for years · Most women who lift: get leaner, stronger, and more defined — not bigger · This myth stops women from doing the type of training that benefits them most

**Slide 4 — Myth:** `"Sweating more means burning more fat."` | **Fact:** `Sweating is your body's cooling system — not your fat-burning system.` Bullets: Sweat = water (and electrolytes) released to regulate temperature · The weight lost in sweat is replaced entirely when you rehydrate · Calorie burn is determined by exercise intensity — not sweat rate · Wearing extra layers to sweat more achieves nothing useful

**Slide 5 — Myth:** `"You can out-train a bad diet."` | **Fact:** `Exercise burns far fewer calories than most people think.` Bullets: 45-minute moderate-intensity run: ~400–500 kcal · One large restaurant meal: 1,000–2,000 kcal · It takes roughly 7–8 hours of running to burn 1kg of fat · Training for fat loss without diet control produces very slow results

**Slide 6 — Key Takeaway:** `"Progress is measurable: can you lift more, move better, perform harder? That's the goal — not soreness, not sweat, and not suffering."`

- [ ] **Step 6: Write Lesson 2 script + Lessons 3 and 4 scripts**

Follow identical structure to previous lessons. Lesson 3 (Protein & Supplement Myths) debunks: kidney damage myth (research context), 30-minute protein window (the actual research says total daily protein matters far more than timing), fat burner efficacy (they support — they don't replace). Lesson 4 (Training Myths) debunks: no pain no gain (soreness ≠ effectiveness; progressive overload is what drives results), women getting bulky (testosterone levels — men have 10–20× more; building large muscle requires years of specific training), sweating = fat burning (sweat is thermoregulation, not fat metabolism — the weight lost in sweat returns with hydration), out-training a bad diet (exercise burns fewer calories than most people think; a 45-minute run burns roughly 400–500 kcal — one large meal).

- [ ] **Step 5: Produce the Module 5 summary sheet**

Title: MYTH VS. FACT — NUTRITION REFERENCE CARD

Two-column layout. Left column: Myth. Right column: Evidence.

| Myth | Evidence |
|------|----------|
| Carbs make you fat | A calorie surplus makes you fat — from any source |
| Dietary fat makes you fat | 9 kcal/g makes it easy to overeat — not uniquely fattening |
| Low-fat foods are healthier | Often higher in sugar — check the full label |
| Spot reduction works | Fat loss is whole-body — you can't target specific areas |
| Eating late causes fat gain | Total daily calories determine fat gain — not timing |
| Juice cleanses remove toxins | Your liver/kidneys do that — cleanses cause water loss |
| Fasted cardio burns more fat | Same 24-hr total as fed cardio |
| Protein damages kidneys | Only relevant if you already have kidney disease |
| You must eat protein within 30 min of training | Total daily protein matters far more than timing |
| Fat burners work without diet changes | They don't — they support a deficit, they don't create one |
| No pain, no gain | Soreness ≠ progress — progressive overload drives results |
| Women lifting = getting bulky | Women have 10–20× less testosterone than men |
| Sweating = burning fat | Sweat is temperature regulation — weight returns with hydration |
| You can out-train a bad diet | Exercise burns fewer calories than most people think |

Upload PDF and set `pdf_url` for module `nf-05d`.

---

## Task 11: Module 6 — Recovery & DOMS (Script & Slides)

**Deliverable:** `N1HSP — Module 06 — Recovery and DOMS — Slides` / Script

- [ ] **Step 1: Create the Google Slides deck (7 slides)**

**Slide 1 — Title:** `MODULE 06` / `RECOVERY & DOMS` / `Recovery Toolkit`

**Slide 2:** Headline: `What is DOMS?` Bullets: Delayed Onset Muscle Soreness — soreness that peaks 24–72 hours after training · Caused by micro-tears in muscle fibres and the resulting inflammatory response · Not an injury · A sign that muscles experienced a new or intense stimulus

**Slide 3:** Headline: `Why beginners feel it more — and when it gets better.` Bullets: Your nervous system and muscles are adapting to a new stimulus · The more novel the exercise, the worse the DOMS · After 3–6 weeks of consistent training, DOMS reduces significantly · It never fully disappears — but it becomes manageable

**Slide 4:** Headline: `Nutrition that speeds recovery.` Bullets: Protein (1.6–2.2g/kg/day): provides amino acids for muscle repair · Anti-inflammatory foods: tart cherry juice, turmeric, oily fish, berries · Hydration: even mild dehydration impairs recovery · Carbohydrates post-training: replenish glycogen and support repair

**Slide 5:** Headline: `Active recovery vs passive rest — what actually works.` Bullets: Light movement (walking, easy cycling, swimming) increases blood flow to sore muscles · Gentle stretching: reduces perceived tightness, not injury risk · Contrast showers (warm-cool): some evidence for reduced soreness · Sitting still is usually the worst option — move gently

**Slide 6:** Headline: `Normal soreness vs when to stop.` Bullets: Normal: diffuse aching in worked muscles, peaks 48hrs, improves by day 3–4 · Concern: sharp pain during movement, joint pain, localised swelling, pain that doesn't improve after 5+ days · When in doubt: rest the affected area and tell a coach · DOMS should never stop you training — train a different area

**Slide 7 — Key Takeaway:** `"DOMS means you worked hard — not that you're broken. Protein, movement, and time are the cure. Soreness is not a reason to stop."`

- [ ] **Step 2: Write the paired script**

**Hook:** > "If you've just started training and you're wondering why walking downstairs feels like a punishment — this module is for you. What you're experiencing is normal, it has a name, and it gets better."

**Talking points per slide:** Define DOMS clearly — micro-tears, inflammatory response, not damage in a harmful sense. Why beginners feel it worse: novelty of stimulus. The 3–6 week adaptation curve. Nutrition: protein is the most important factor; anti-inflammatory foods (coach can briefly mention tart cherry, turmeric, omega-3); hydration is underrated. Active recovery: light movement works better than complete rest — explain the blood flow mechanism simply. Red flags: sharp pain, joint pain, swelling — these are not DOMS.

**Key Takeaway:** > "DOMS means you worked hard — not that you're broken. Protein, movement, and time are the cure. Soreness is not a reason to stop."

**Action Step + Next:** > "If you're currently sore: go for a 20-minute walk today. Make sure you're hitting your protein target. The soreness will pass. Understanding Supplements is the final pathway — starting with what supplements actually are and whether you need any of them."

---

## Task 12: Module 7 — Understanding Supplements (Scripts & Slides, 5 lessons)

**Deliverable:** 5 slide decks + 5 scripts + 1 summary sheet.

- [ ] **Step 1: Create Lesson 1 slides — What Supplements Actually Are (6 slides)**

**Slide 1 — Title:** `MODULE 07 · LESSON 1` / `WHAT SUPPLEMENTS ACTUALLY ARE` / `Understanding Supplements`

**Slide 2:** Headline: `Food first — supplements supplement.` Bullets: A supplement fills a gap in your diet — it doesn't replace food · You cannot out-supplement a bad diet · The hierarchy: sleep → training → calories → protein → everything else · Supplements are at the bottom of that list

**Slide 3:** Headline: `What "supplement" legally means.` Bullets: In the UK: supplements are regulated as food, not medicine · No requirement to prove they work before selling · Claims are restricted but enforcement is inconsistent · This means anyone can sell almost anything labelled as a "supplement"

**Slide 4:** Headline: `The supplement industry — size and reality.` Bullets: Global supplement market: over £150 billion annually · Most products are backed by weak evidence or marketing, not science · A small number of supplements have strong, replicated research · Those are the only ones worth discussing — covered in the next four lessons

**Slide 5:** Headline: `The only supplements with strong evidence for most people.` Bullets: Protein powder: convenient protein source (not magic) · Creatine monohydrate: most researched supplement in existence · Vitamin D: most people in the UK are deficient · Omega-3 / fish oil: anti-inflammatory, heart and joint health · Everything else: weak evidence at best for most people

**Slide 6 — Key Takeaway:** `"Supplements supplement. If your sleep, training, calories, and protein are dialled in — then a small number of evidence-based supplements can offer a small, measurable benefit."`

- [ ] **Step 2: Write Lesson 1 script**

**Hook:** > "The supplement industry is worth over £150 billion a year globally. The vast majority of that money goes on products that do very little. This module series is about helping you spend nothing — or almost nothing — and get the same or better results."

**Talking points:** The hierarchy — emphasise that supplements are truly at the bottom of the priority list. Regulatory context: supplements in the UK aren't required to prove efficacy before sale — this is genuinely important context. The shortlist of evidence-backed supplements. Don't demonise — just set accurate expectations.

**Key Takeaway:** > "Supplements supplement. Nail the basics first — then if there's a gap, consider whether an evidence-based supplement can fill it."

**Action + Next:** > "Next lesson: protein powder — who actually needs it, which type to choose, and when it's genuinely useful versus unnecessary."

- [ ] **Step 3: Create Lessons 2–5 slides**

**Lesson 2 — Protein Powder (7 slides):**
Slide 2: Types — whey (fast, derived from milk), casein (slow, good before bed), plant (pea/rice blend for completeness). Slide 3: When it's useful — can't hit protein target through food, convenient post-training. Slide 4: When it's unnecessary — already hitting protein through food. Slide 5: How to choose — whey concentrate (cheap, effective), pea/rice blend for dairy-free. Slide 6: What to ignore on the label — "proprietary blends", "anabolic matrix", anything that sounds pharmaceutical. Slide 7 — Takeaway: `"Protein powder is just a convenient protein source. It has no special muscle-building properties that food doesn't have."`

**Lesson 3 — Creatine (7 slides):**
Slide 2: What ATP is and why creatine matters — ATP is the body's energy currency; creatine replenishes it faster during high-intensity efforts. Slide 3: What the research shows — strength gains, power output, some cognitive benefits, extensive safety record over 30+ years. Slide 4: Dosing — 3–5g daily, any time, no loading phase needed, doesn't need to be cycled. Slide 5: The water retention myth — creatine draws water into muscles (intramuscular, not subcutaneous) — this is a good thing — muscles are fuller and stronger. Slide 6: The kidney myth — no evidence of harm in healthy adults; research on people with pre-existing kidney disease; if unsure, check with GP. Slide 7 — Takeaway: `"Creatine monohydrate: 3–5g daily. The most researched supplement in existence. The fears about it are not supported by evidence."`

**Lesson 4 — Pre-Workout and Fat Burners (7 slides):**
Slide 2: What pre-workout actually contains — mostly caffeine (150–400mg per serving), some beta-alanine (causes tingling, not dangerous), possibly creatine. Slide 3: Caffeine — it works, the research is solid, performance benefits are real. Slide 4: Caffeine dependency — regular use builds tolerance; 2 weeks off resets sensitivity; don't become dependent. Slide 5: Who should avoid stimulants — heart conditions, anxiety disorders, high blood pressure, pregnancy, anyone caffeine-sensitive. Slide 6: Fat burners — they don't burn fat; they contain stimulants that slightly increase metabolic rate; the effect is small; the claims are large; they're not worth the money. Slide 7 — Takeaway: `"Pre-workout is mostly caffeine. Caffeine works. Fat burners don't. Save your money."`

**Lesson 5 — Reading Labels (6 slides):**
Slide 2: Proprietary blends — hidden ingredient amounts behind a blend name; a sign that individual doses are too low to be effective. Slide 3: Third-party testing — Informed Sport, NSF Certified for Sport; these certifications mean the product has been tested for banned substances. Slide 4: Red flag claims — "clinically proven" without citing the study; "burn fat while you sleep"; "as used by professional athletes". Slide 5: Red flag ingredients — DMAA, synephrine, high-dose stimulant stacks in unknown quantities. Slide 6 — Takeaway: `"If a product hides its ingredient doses, makes dramatic claims, or carries no third-party certification — leave it on the shelf."`

- [ ] **Step 4: Write scripts for Lessons 2–5**

Follow the same 5-part structure (Hook → Signpost → Content → Key Takeaway → Action Step + Next) for each lesson. Each script is a Google Doc with the same naming convention.

- [ ] **Step 5: Produce the Module 7 summary sheet — Supplement Decision Tree**

Title: SHOULD I TAKE THIS SUPPLEMENT? — Decision Tree · Number One HSP

**Decision flow (flowchart format, produce as a simple table if flowchart tool isn't available):**

```
Are your sleep, training, calories, and protein dialled in?
  └── NO → Sort these first. Supplements won't compensate.
  └── YES →
        Are you getting enough protein from food?
          └── NO → Consider protein powder (whey or plant-based)
          └── YES → Don't need protein powder
        
        Do you train at high intensity (strength/sprints)?
          └── YES → Creatine monohydrate (3–5g/day) is worth considering
          └── NO → Limited benefit
        
        Are you in the UK? Do you get limited sunlight?
          └── YES → Vitamin D (1,000–2,000 IU/day) is worth taking
        
        Do you eat oily fish fewer than 2× per week?
          └── YES → Omega-3 / fish oil worth considering
        
        Someone recommended a fat burner?
          └── NO — save your money
        
        Someone recommended a pre-workout?
          └── Only if you want caffeine. Check for third-party certification.
          └── Avoid if: heart condition, anxiety, high blood pressure
```

**Bottom of sheet:** Certifications to look for: Informed Sport · NSF Certified for Sport
Red flags: proprietary blends · "clinically proven" with no study · doses not listed per ingredient

Upload PDF and set `pdf_url` for module `us-05`.

---

## Task 13: Update pdf_url fields when PDFs are uploaded

**Files:**
- Modify: `src/lib/education-seed.ts`

Once each summary sheet PDF is exported and uploaded to Supabase Storage, update the `pdf_url` field for these three modules:

- [ ] **`nf-03e` (Macro targets reference card):** Update `pdf_url: null` → `pdf_url: '<supabase-storage-url>'`
- [ ] **`nf-05d` (Myth vs. fact reference card):** Update `pdf_url: null` → `pdf_url: '<supabase-storage-url>'`
- [ ] **`us-05` (Supplement decision tree):** Update `pdf_url: null` → `pdf_url: '<supabase-storage-url>'`

- [ ] **Commit**

```bash
git add src/lib/education-seed.ts
git commit -m "feat(education): add PDF summary sheet URLs for D-format modules"
```

---

## Task 14: Update video_url fields when recordings are uploaded

**Files:**
- Modify: `src/lib/education-seed.ts`

Once each module is recorded, uploaded to YouTube as unlisted, and the embed URL is available, update `video_url` for each module record. YouTube embed URL format: `https://www.youtube.com/embed/<VIDEO_ID>`

- [ ] Update `video_url` for all 17 module records (12 in nutrition-foundations, 1 in recovery-toolkit rt-5, 5 in understanding-supplements) as recordings become available.

- [ ] **Commit after each batch of updates**

```bash
git add src/lib/education-seed.ts
git commit -m "feat(education): add video URLs for [module name(s)]"
```
