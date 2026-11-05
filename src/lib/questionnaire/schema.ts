// The member questionnaire: sections and questions, in our own words.
// Pure data, shared by the form, the server checks and the scoring. Answers are
// stored by question id, so a question can be reworded without losing data;
// change QUESTIONNAIRE_VERSION when a question is added, removed or changes meaning.

export const QUESTIONNAIRE_VERSION = 1
export const TEXT_MAX = 1000
export const SHORT_TEXT_MAX = 120

export type Option = { value: string; label: string }

export type Question =
  | { id: string; kind: 'single' | 'multi'; label: string; options: Option[]; required?: boolean }
  | { id: string; kind: 'yesno'; label: string; required?: boolean; detailId?: string; detailLabel?: string }
  | { id: string; kind: 'scale'; label: string; low: string; high: string; required?: boolean }
  | { id: string; kind: 'text'; label: string; short?: boolean; required?: boolean; hint?: string }
  | { id: string; kind: 'hours'; label: string; required?: boolean }

export type Section = { key: string; title: string; intro?: string; questions: Question[] }

const opts = (...pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }))
const bands = opts(['lt5', 'Fewer than 5 hours'], ['5-9', '5 to 9 hours'], ['10-14', '10 to 14 hours'], ['15-19', '15 to 19 hours'], ['20+', '20 hours or more'])
const household = opts(['me', 'Me'], ['partner', 'Partner'], ['children', 'Children'], ['housemates', 'Housemates'], ['family', 'Other family'])

export type Variant = 'adult' | 'youth'
export const VARIANTS: readonly Variant[] = ['adult', 'youth']

const ADULT_SECTIONS: Section[] = [
  {
    key: 'about',
    title: 'Staying in touch',
    intro: 'We already have your contact details. Just tell us how you like to hear from us.',
    questions: [
      { id: 'contact_pref', kind: 'single', label: 'How do you prefer us to contact you?', required: true, options: opts(['whatsapp', 'WhatsApp'], ['text', 'Text'], ['email', 'Email'], ['phone', 'Phone call'], ['in_person', 'In person at the gym']) },
      { id: 'emergency_name', kind: 'text', short: true, label: 'Emergency contact name', required: true },
      { id: 'emergency_phone', kind: 'text', short: true, label: 'Emergency contact phone number', required: true },
    ],
  },
  {
    key: 'goals',
    title: 'What you want',
    questions: [
      {
        id: 'goals', kind: 'multi', label: 'What are your goals? Tick all that apply.', required: true,
        options: opts(
          ['lose_fat', 'Lose weight or fat'], ['add_muscle', 'Add muscle'], ['get_stronger', 'Get stronger'], ['fitness', 'Improve fitness'],
          ['energy', 'More energy'], ['feel_better', 'Feel better'], ['look_better', 'Look better'], ['health', 'Improve overall health'],
          ['eating', 'Get control of eating habits'], ['performance', 'Improve sport performance'], ['ageing', 'Healthy ageing'], ['medication', 'Reduce reliance on medication'],
        ),
      },
      { id: 'priority_1', kind: 'text', label: 'Your most important change', required: true, hint: 'In your own words' },
      { id: 'priority_2', kind: 'text', label: 'Your second most important change' },
      { id: 'priority_3', kind: 'text', label: 'Your third most important change' },
      { id: 'why_now', kind: 'text', label: 'Why now? What made you decide to start?' },
    ],
  },
  {
    key: 'past',
    title: 'What you have tried',
    questions: [
      { id: 'tried_before', kind: 'yesno', label: 'Have you tried to change your habits, health, eating or body before?' },
      { id: 'worked', kind: 'text', label: 'What worked well for you, even a little?' },
      { id: 'not_worked', kind: 'text', label: 'What did not work, and why not?' },
      { id: 'blockers', kind: 'text', label: 'What has held you back until now?' },
    ],
  },
  {
    key: 'training',
    title: 'Training now',
    questions: [
      { id: 'active', kind: 'yesno', label: 'Are you regularly active in sport or exercise?' },
      { id: 'hours_active', kind: 'single', label: 'Roughly how many hours a week?', options: bands },
      { id: 'activity_types', kind: 'text', label: 'What do you usually do?' },
      { id: 'hours_other_activity', kind: 'single', label: 'Hours a week of other movement (walking, housework, gardening, active job)?', options: bands },
      { id: 'equipment', kind: 'multi', label: 'What can you use outside the gym?', options: opts(['none', 'Nothing'], ['weights', 'Weights at home'], ['bands', 'Resistance bands'], ['cardio', 'Cardio equipment'], ['outdoors', 'Outdoor space or routes']) },
      { id: 'best_times', kind: 'multi', label: 'When can you usually train?', options: opts(['early', 'Early morning'], ['morning', 'Morning'], ['lunch', 'Lunchtime'], ['afternoon', 'Afternoon'], ['evening', 'Evening'], ['weekend', 'Weekends']) },
    ],
  },
  {
    key: 'nutrition',
    title: 'Eating now',
    questions: [
      { id: 'rating_nutrition', kind: 'scale', label: 'How would you rate your eating habits right now?', low: 'Horrible', high: 'Awesome', required: true },
      { id: 'why_nutrition', kind: 'text', label: 'Why that number?' },
      { id: 'meals_per_day', kind: 'single', label: 'Meals a day, on a normal day', options: opts(['1-2', '1 or 2'], ['3', '3'], ['4', '4'], ['5+', '5 or more']) },
      { id: 'alcohol', kind: 'single', label: 'Alcohol in a typical week', options: opts(['none', 'None'], ['1-5', '1 to 5 units'], ['6-14', '6 to 14 units'], ['15+', '15 units or more']) },
      { id: 'water', kind: 'single', label: 'Water in a typical day', options: opts(['lt1', 'Under 1 litre'], ['1-2', '1 to 2 litres'], ['2-3', '2 to 3 litres'], ['3+', 'Over 3 litres']) },
      { id: 'shops', kind: 'multi', label: 'Who does most of the food shopping?', options: household },
      { id: 'cooks', kind: 'multi', label: 'Who does most of the cooking?', options: household },
      { id: 'decides', kind: 'multi', label: 'Who decides what you eat?', options: household },
    ],
  },
  {
    key: 'health',
    title: 'Your health',
    intro: 'This helps your coach train you safely. It is shared only with your coaches.',
    questions: [
      { id: 'has_condition', kind: 'yesno', label: 'Have you been diagnosed with a medical condition or injury, now or in the past?', required: true, detailId: 'condition_detail', detailLabel: 'Tell us a little about it' },
      { id: 'has_pain', kind: 'yesno', label: 'Do you have any pain, illness or injury right now?', required: true, detailId: 'pain_detail', detailLabel: 'Tell us a little about it' },
      { id: 'takes_meds', kind: 'yesno', label: 'Are you taking any medication, prescribed or over the counter?', required: true },
      { id: 'rating_health', kind: 'scale', label: 'How would you rate your health right now?', low: 'Worst', high: 'Awesome', required: true },
      { id: 'why_health', kind: 'text', label: 'Why that number?' },
    ],
  },
  {
    key: 'life',
    title: 'Life around you',
    questions: [
      { id: 'lives_with', kind: 'multi', label: 'Who lives with you?', options: opts(['partner', 'Partner'], ['children', 'Children'], ['housemates', 'Housemates'], ['family', 'Other family'], ['pets', 'Pets'], ['alone', 'I live alone']) },
      { id: 'rating_support', kind: 'scale', label: 'How much do the people and things around you support your health and fitness?', low: 'Not at all', high: 'Completely', required: true },
      { id: 'hours_work', kind: 'hours', label: 'Hours a week in paid work' },
      { id: 'hours_study', kind: 'hours', label: 'Hours a week studying' },
      { id: 'hours_travel', kind: 'hours', label: 'Hours a week travelling or commuting' },
      { id: 'hours_caring', kind: 'hours', label: 'Hours a week caring for others' },
      { id: 'hours_other', kind: 'hours', label: 'Hours a week on other unpaid work (housework, errands, volunteering)' },
      { id: 'rating_schedule', kind: 'scale', label: 'How do you feel about how busy your schedule is?', low: 'Panicked and insane', high: 'Calm and relaxed', required: true },
    ],
  },
  {
    key: 'recovery',
    title: 'Stress and sleep',
    questions: [
      { id: 'rating_stress', kind: 'scale', label: 'On an average day, how stressed are you?', low: 'No stress', high: 'Extreme stress', required: true },
      { id: 'sleep_hours', kind: 'single', label: 'On average, how many hours do you sleep a night?', required: true, options: opts(['4-', '4 or fewer'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['10+', '10 or more']) },
      { id: 'coping', kind: 'text', label: 'How do you usually cope with stress?' },
    ],
  },
  {
    key: 'readiness',
    title: 'Ready, willing and able',
    questions: [
      { id: 'ready', kind: 'scale', label: 'How READY are you to change your habits?', low: 'Not at all', high: 'Completely', required: true },
      { id: 'willing', kind: 'scale', label: 'How WILLING are you to change your habits?', low: 'Not at all', high: 'Completely', required: true },
      { id: 'able', kind: 'scale', label: 'How ABLE are you to change your habits right now?', low: 'Not at all', high: 'Completely', required: true },
    ],
  },
  {
    key: 'expect',
    title: 'What you expect',
    questions: [
      { id: 'expect_coach', kind: 'text', label: 'What do you expect from your coach?' },
      { id: 'will_do', kind: 'text', label: 'What are you prepared to do to reach your goals?' },
    ],
  },
]

const youthBands = opts(['lt3', 'Fewer than 3 hours'], ['3-5', '3 to 5 hours'], ['6-8', '6 to 8 hours'], ['9-11', '9 to 11 hours'], ['12+', '12 hours or more'])

// The youth athlete version: shorter, simpler words, no weight-loss goals, and a
// parent or guardian section. A parent can fill it in with, or for, the athlete.
const YOUTH_SECTIONS: Section[] = [
  {
    key: 'about',
    title: 'About you',
    intro: 'A parent or guardian should help with this, or fill it in for the athlete.',
    questions: [
      { id: 'completed_by', kind: 'single', label: 'Who is filling this in?', required: true, options: opts(['athlete', 'The athlete, with a parent or guardian'], ['parent', 'A parent or guardian']) },
      { id: 'guardian_name', kind: 'text', short: true, label: 'Parent or guardian name', required: true },
      { id: 'guardian_phone', kind: 'text', short: true, label: 'Parent or guardian phone number (our emergency contact)', required: true },
      { id: 'contact_pref', kind: 'single', label: 'How should we contact the family?', required: true, options: opts(['whatsapp', 'WhatsApp'], ['text', 'Text'], ['email', 'Email'], ['phone', 'Phone call'], ['in_person', 'In person at the gym']) },
    ],
  },
  {
    key: 'sport',
    title: 'Sport and goals',
    questions: [
      { id: 'sports', kind: 'text', label: 'Which sports or activities do you do?', required: true, hint: 'For example football, netball, swimming' },
      { id: 'level', kind: 'single', label: 'What level?', options: opts(['fun', 'For fun'], ['school', 'School team'], ['club', 'Club team'], ['county', 'County or regional'], ['national', 'National or academy']) },
      { id: 'season', kind: 'text', label: 'Any big matches, events or seasons coming up?' },
      {
        id: 'youth_goals', kind: 'multi', label: 'What do you want from training? Tick all that apply.', required: true,
        options: opts(
          ['stronger', 'Get stronger'], ['faster', 'Get faster'], ['fitter', 'Get fitter'], ['performance', 'Play better in my sport'], ['injury', 'Avoid injuries'],
          ['confidence', 'Feel more confident'], ['team', 'Make a team'], ['fun', 'Enjoy exercise'], ['energy', 'Have more energy'],
        ),
      },
      { id: 'priority_1', kind: 'text', label: 'What is the one thing you most want to improve?', required: true },
    ],
  },
  {
    key: 'training',
    title: 'Training now',
    questions: [
      { id: 'youth_hours_active', kind: 'single', label: 'Roughly how many hours a week do you train or play sport, in total?', options: youthBands },
      { id: 'best_times', kind: 'multi', label: 'When can you usually train?', options: opts(['early', 'Before school'], ['afterschool', 'After school'], ['evening', 'Evening'], ['weekend', 'Weekends'], ['holidays', 'School holidays']) },
      { id: 'worked', kind: 'text', label: 'What has worked well for you in training before?' },
    ],
  },
  {
    key: 'health',
    title: 'Health',
    intro: 'A parent or guardian should answer these. They help the coach keep training safe. Only your coaches see them.',
    questions: [
      { id: 'has_condition', kind: 'yesno', label: 'Does the athlete have a medical condition or past injury we should know about?', required: true, detailId: 'condition_detail', detailLabel: 'Tell us a little about it' },
      { id: 'has_pain', kind: 'yesno', label: 'Any pain, illness or injury right now?', required: true, detailId: 'pain_detail', detailLabel: 'Tell us a little about it' },
      { id: 'has_asthma_allergy', kind: 'yesno', label: 'Asthma, allergies or anything else we may need to act on in an emergency?', required: true, detailId: 'asthma_allergy_detail', detailLabel: 'Tell us a little about it' },
      { id: 'takes_meds', kind: 'yesno', label: 'Taking any regular medication?', required: true },
      { id: 'rating_health', kind: 'scale', label: 'How healthy do you feel right now?', low: 'Not healthy', high: 'Very healthy', required: true },
    ],
  },
  {
    key: 'everyday',
    title: 'Eating, sleep and school life',
    questions: [
      { id: 'rating_nutrition', kind: 'scale', label: 'How would you rate your eating habits?', low: 'Not good', high: 'Really good', required: true },
      { id: 'meals_per_day', kind: 'single', label: 'Meals a day, on a normal day', options: opts(['1-2', '1 or 2'], ['3', '3'], ['4', '4'], ['5+', '5 or more']) },
      { id: 'breakfast', kind: 'single', label: 'Do you usually have breakfast?', options: opts(['always', 'Most days'], ['sometimes', 'Sometimes'], ['rarely', 'Rarely']) },
      { id: 'sleep_hours_youth', kind: 'single', label: 'How many hours do you sleep on a school night?', required: true, options: opts(['7-', '7 or fewer'], ['8', '8'], ['9', '9'], ['10', '10'], ['11+', '11 or more']) },
      { id: 'rating_stress', kind: 'scale', label: 'How stressed or worried do you feel on a normal week (school, exams, sport)?', low: 'Not at all', high: 'Extremely', required: true },
      { id: 'rating_schedule', kind: 'scale', label: 'How busy does your week feel?', low: 'Way too busy', high: 'Calm and relaxed', required: true },
      { id: 'rating_support', kind: 'scale', label: 'How much do family, friends and coaches support your training?', low: 'Not at all', high: 'Completely', required: true },
    ],
  },
  {
    key: 'readiness',
    title: 'Ready to train',
    questions: [
      { id: 'ready', kind: 'scale', label: 'How READY are you to put in the work?', low: 'Not at all', high: 'Completely', required: true },
      { id: 'willing', kind: 'scale', label: 'How WILLING are you to try new things?', low: 'Not at all', high: 'Completely', required: true },
      { id: 'able', kind: 'scale', label: 'How easy is it for you to fit training in?', low: 'Very hard', high: 'Very easy', required: true },
      { id: 'expect_coach', kind: 'text', label: 'What do you hope to get from your coach?' },
      { id: 'parent_notes', kind: 'text', label: 'Anything else a parent or guardian would like us to know?' },
    ],
  },
]

const SECTION_SETS: Record<Variant, Section[]> = { adult: ADULT_SECTIONS, youth: YOUTH_SECTIONS }

export const sectionsFor = (v: Variant): Section[] => SECTION_SETS[v]
export const questionsFor = (v: Variant): Question[] => SECTION_SETS[v].flatMap(s => s.questions)

const BY_ID: Record<Variant, Map<string, Question>> = { adult: new Map(), youth: new Map() }
for (const v of VARIANTS) {
  for (const q of questionsFor(v)) {
    BY_ID[v].set(q.id, q)
    if (q.kind === 'yesno' && q.detailId) BY_ID[v].set(q.detailId, { id: q.detailId, kind: 'text', label: q.detailLabel ?? '' })
  }
}
export const questionById = (id: string, v: Variant): Question | undefined => BY_ID[v].get(id)

export const isVariant = (v: unknown): v is Variant => v === 'adult' || v === 'youth'

/** Wording the member agrees to when they submit. */
const CONSENT: Record<Variant, string> = {
  adult:
    'I am happy for Number One HSP to store these answers and share them with my coaches so they can tailor my training and support. I can ask to see or delete them at any time.',
  youth:
    'I am the parent or legal guardian of this athlete. I am happy for Number One HSP to store these answers and share them with the athlete’s coaches so they can tailor training and support. I can ask to see or delete them at any time.',
}
export const consentTextFor = (v: Variant): string => CONSENT[v]
