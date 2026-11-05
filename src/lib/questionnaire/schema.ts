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

export const SECTIONS: Section[] = [
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

export const ALL_QUESTIONS: Question[] = SECTIONS.flatMap(s => s.questions)
const BY_ID = new Map<string, Question>()
for (const q of ALL_QUESTIONS) {
  BY_ID.set(q.id, q)
  if (q.kind === 'yesno' && q.detailId) BY_ID.set(q.detailId, { id: q.detailId, kind: 'text', label: q.detailLabel ?? '' })
}
export const questionById = (id: string): Question | undefined => BY_ID.get(id)

/** Wording the member agrees to when they submit. */
export const CONSENT_TEXT =
  'I am happy for Number One HSP to store these answers and share them with my coaches so they can tailor my training and support. I can ask to see or delete them at any time.'
