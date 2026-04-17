import WellbeingPage from '@/components/wellbeing/WellbeingPage'

// TODO: replace with Supabase query for logged-in member's check-in history
// const { data } = await supabase
//   .from('wellbeing_checkins')
//   .select('*')
//   .eq('member_id', session.user.id)
//   .order('week_start', { ascending: false })
//   .limit(12)

const SEED_CHECKINS = [
  { id: 'w1', week_start: '2026-03-31', energy: 4, sleep: 3, stress: 2, comments: 'Good week overall, felt strong in sessions.' },
  { id: 'w2', week_start: '2026-03-24', energy: 3, sleep: 4, stress: 3, comments: null },
  { id: 'w3', week_start: '2026-03-17', energy: 5, sleep: 5, stress: 1, comments: 'Best week in months, everything clicked.' },
  { id: 'w4', week_start: '2026-03-10', energy: 2, sleep: 2, stress: 5, comments: 'Stressful week at work, struggled to sleep.' },
  { id: 'w5', week_start: '2026-03-03', energy: 3, sleep: 3, stress: 3, comments: null },
  { id: 'w6', week_start: '2026-02-24', energy: 4, sleep: 4, stress: 2, comments: 'Felt recovered after deload.' },
  { id: 'w7', week_start: '2026-02-17', energy: 3, sleep: 3, stress: 4, comments: null },
  { id: 'w8', week_start: '2026-02-10', energy: 4, sleep: 4, stress: 2, comments: null },
]

export default function WellbeingPageRoute() {
  return <WellbeingPage checkins={SEED_CHECKINS} />
}
