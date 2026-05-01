# Number One HSP Members Area — Nutrition Education Hub
## Project Status & Handoff Document
*Last updated: 2026-04-20*

---

## What This Project Is

A 7-module beginner nutrition education series built into the Number One HSP members area. Members work through structured pathways covering calorie tracking, macronutrients, intermittent fasting, nutrition myths, recovery, and supplements. Content includes video lessons (with slides), quizzes, and downloadable reference PDFs.

---

## Tech Stack

- **Framework:** Next.js 14+ (check `node_modules/next/dist/docs/` before writing any code — has breaking changes)
- **Database/Auth:** Supabase
- **Styling:** Tailwind CSS
- **Seed data file:** `src/lib/education-seed.ts`
- **Types:** `@/types/education` (Pathway, Module, Resource, QuizQuestion)
- **Slide design tool:** Canva (MCP integration, brand kit ID: `kADc7gzaPzw` — "Number One HSP")

---

## Pathways & Modules

### Phase 1 — Nutrition Foundations (pathway ID: `nutrition-foundations`)

| Module ID | Title | Format | Duration | Video URL | Has Quiz |
|-----------|-------|--------|----------|-----------|----------|
| `nf-01` | Tracking Calories | A-format (1 video) | 7 min | null | No |
| `nf-02` | Using MyFitnessPal | A-format (1 video) | 7 min | null | No |
| `nf-03a` | What Are Macros? | D-format lesson 1/5 | 7 min | null | No |
| `nf-03b` | Protein | D-format lesson 2/5 | 8 min | null | Yes |
| `nf-03c` | Carbohydrates | D-format lesson 3/5 | 7 min | null | Yes |
| `nf-03d` | Fats | D-format lesson 4/5 | 7 min | null | Yes |
| `nf-03e` | Setting Your Macro Targets | D-format lesson 5/5 | 8 min | null | Yes — **pdf_url also null** |
| `nf-04` | Intermittent Fasting | A-format (1 video) | 6 min | null | No |
| `nf-05a` | Carbs & Fat Myths | D-format lesson 1/4 | 7 min | null | No |
| `nf-05b` | Weight Loss Myths | D-format lesson 2/4 | 8 min | null | Yes |
| `nf-05c` | Protein & Supplement Myths | D-format lesson 3/4 | 7 min | null | Yes |
| `nf-05d` | Training Myths | D-format lesson 4/4 | 8 min | null | Yes — **pdf_url also null** |

### Phase 2 — Recovery Toolkit (pathway ID: `recovery-toolkit`)

| Module ID | Title | Format | Duration | Video URL |
|-----------|-------|--------|----------|-----------|
| `rt-06` | Recovery & DOMS | A-format (1 video) | 8 min | null |

### Phase 3 — Understanding Supplements (pathway ID: `understanding-supplements`)

| Module ID | Title | Format | Duration | Video URL | Has Quiz |
|-----------|-------|--------|----------|-----------|----------|
| `us-01` | What Supplements Actually Are | D-format lesson 1/5 | 8 min | null | No |
| `us-02` | Protein Powder | D-format lesson 2/5 | 10 min | null | Yes |
| `us-03` | Creatine | D-format lesson 3/5 | 10 min | null | Yes |
| `us-04` | Pre-workout & Fat Burners | D-format lesson 4/5 | 10 min | null | Yes |
| `us-05` | Reading Labels & Spotting Marketing Nonsense | D-format lesson 5/5 | 10 min | null | No — **pdf_url also null** |

**Format key:**
- **A-format** = single video + slides (no quiz)
- **D-format** = multi-lesson series, some lessons have a quiz

---

## Scripts (Word-for-Word Video Scripts)

All scripts are saved as markdown files in `docs/scripts/`:

| File | Covers |
|------|--------|
| `docs/scripts/module-01-tracking-calories.md` | Module 1 — single video |
| `docs/scripts/module-02-using-myfitnesspal.md` | Module 2 — single video |
| `docs/scripts/module-03-understanding-macros.md` | Module 3 — all 5 lessons |
| `docs/scripts/module-04-intermittent-fasting.md` | Module 4 — single video |
| `docs/scripts/module-05-nutrition-myths.md` | Module 5 — all 4 lessons |
| `docs/scripts/module-06-recovery-doms.md` | Module 6 — single video |
| `docs/scripts/module-07-understanding-supplements.md` | Module 7 — all 5 lessons |

Each script follows the same 5-part structure: Hook → Signpost → Content → Key Takeaway → Action Step + Next.

---

## Canva Slide Decks (all use Number One HSP brand kit, geometric style)

### Video Slide Decks (17 total — all saved)

| Module | Title | Canva Edit URL |
|--------|-------|----------------|
| Module 1 | Tracking Calories | https://www.canva.com/d/GLZuH5NvH0jvoFg |
| Module 2 | Using MyFitnessPal | https://www.canva.com/d/pH0JTBW3txTQv1j |
| Module 3 L1 | What Are Macros? | https://www.canva.com/d/G2CInXlgSaEJz9Q |
| Module 3 L2 | Protein | https://www.canva.com/d/abiXNsEgCp-HLGK |
| Module 3 L3 | Carbohydrates | https://www.canva.com/d/kw2MzCmCPAkxyWP |
| Module 3 L4 | Fats | https://www.canva.com/d/CYLCbc7VO8fUHji |
| Module 3 L5 | Setting Macro Targets | https://www.canva.com/d/VucBEpVQfziUGhu |
| Module 4 | Intermittent Fasting | https://www.canva.com/d/h-UO8pohg505Xh- |
| Module 5 L1 | Carbs & Fat Myths | https://www.canva.com/d/m8qzLkmIpWKCUcT |
| Module 5 L2 | Weight Loss Myths | https://www.canva.com/d/7qHT3bbPh7wNsES |
| Module 5 L3 | Protein & Supplement Myths | https://www.canva.com/d/Jk8c61i2zlnQqwQ |
| Module 5 L4 | Training Myths | https://www.canva.com/d/TCOXxEd1KdKQui- |
| Module 6 | Recovery & DOMS | https://www.canva.com/d/VxYA_huKQkg1WJQ |
| Module 7 L1 | What Supplements Are | https://www.canva.com/d/zgSIZ8aNo4o8LZH |
| Module 7 L2 | Protein Powder | https://www.canva.com/d/p1035lunjs1JFik |
| Module 7 L3 | Creatine | https://www.canva.com/d/O0AGi6lYd6apjEF |
| Module 7 L4 | Pre-workout & Fat Burners | https://www.canva.com/d/p1_U8N3I2BeoHAm |
| Module 7 L5 | Reading Labels | https://www.canva.com/d/sw7KyeUVTrif44y |

### Summary Sheet / PDF Designs (3 total — all saved, not yet exported)

| ID | Title | Canva Edit URL |
|----|-------|----------------|
| `nf-03e` | Macro Reference Card | https://www.canva.com/d/B3ovzax0gLoII1p |
| `nf-05d` | Nutrition Myth vs. Fact | https://www.canva.com/d/cBS-kpnEyddPDDE |
| `us-05` | Supplement Decision Tree | https://www.canva.com/d/CoLeg5iz7zkLZz7 |

---

## What's Still Outstanding

### 1. Record the videos
- Use the scripts in `docs/scripts/` and the Canva slide decks together
- 17 videos total (see module table above)

### 2. Upload videos to YouTube
- Upload each recording (recommend: unlisted or members-only)
- Copy the YouTube URL for each

### 3. Update `video_url` fields in `src/lib/education-seed.ts`
- All 17 module records currently have `video_url: null`
- Replace each null with the YouTube URL after upload

### 4. Export PDFs from Canva
- Open each of the 3 summary sheet designs (links above)
- Review/tidy the design if needed
- Export as **PDF (Print quality)**

### 5. Upload PDFs to Supabase Storage
- Suggested bucket path: `education-resources/pdfs/`
- Files: `macro-reference-card.pdf`, `nutrition-myth-vs-fact.pdf`, `supplement-decision-tree.pdf`

### 6. Update `pdf_url` fields in `src/lib/education-seed.ts`
Three module records currently have `pdf_url: null`:
```
nf-03e → macro reference card PDF URL
nf-05d → myth vs fact card PDF URL
us-05  → supplement decision tree PDF URL
```

---

## Seed Data Location

`src/lib/education-seed.ts` — contains:
- `SEED_PATHWAYS` — the 3 pathways
- `SEED_MODULES` — all 17 module records
- `SEED_QUIZ` — quiz questions for modules that have them

> This is currently used as static demo data while Supabase queries are being wired up. Replace with real Supabase queries once auth is complete (comments in the file explain this).

---

## Brand Details

- **Brand kit name:** Number One HSP
- **Canva brand kit ID:** `kADc7gzaPzw`
- **Colours:** `#0d1a1a` (background), `#2a9090` (teal), `#6ab8b8` (light teal), `#a0c8c8` (pale teal), `#ffffff` (white)
- **Slide style:** Geometric

---

## Git History (key commits)

- `a83d7d0` — Fix us02-q4 quiz options (normalised to `['True', 'False']`)
- `b1a2182` — Fix understanding-supplements total_duration_minutes 50→48
- `2dc3113` — Add all 7 module scripts to docs/scripts/
