// Dashboard spotlight — async Server Component. Builds the slides, SpotlightRotator cycles them.
// Last 5 days of the month: only the Athlete of the Month nomination. Otherwise: events + partner offers.

import { createClient } from '@supabase/supabase-js'
import { fetchGymEvents } from '@/lib/staffhub'
import { isVotingWindow, votingDaysLeft } from '@/lib/voting-window'
import SpotlightRotator, { type Slide } from './SpotlightRotator'

const MAX_EVENT_SLIDES = 2
const MAX_PARTNER_SLIDES = 3

type PartnerRow = { id: string; name: string; emoji: string | null; offer: string | null; description: string | null }

async function fetchPartnerSlides(): Promise<Slide[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const { data, error } = await createClient(url, key)
      .from('gym_partners')
      .select('id, name, emoji, offer, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(MAX_PARTNER_SLIDES)
    if (error) return []
    return ((data ?? []) as PartnerRow[]).map(p => ({
      id: `partner-${p.id}`,
      eyebrow: 'Member perk',
      title: p.name,
      body: p.offer || p.description || undefined,
      href: '/partners',
      cta: 'See the offer',
      emoji: p.emoji || '🤝',
      tone: 'brand' as const,
    }))
  } catch {
    return []
  }
}

function formatShortDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default async function Spotlight() {
  if (isVotingWindow()) {
    const left = votingDaysLeft()
    return (
      <SpotlightRotator
        slides={[{
          id: 'nominate',
          eyebrow: 'Nominations open',
          title: 'Athlete of the Month — NOMINATE HERE',
          body: left === 1 ? 'Last day to nominate.' : `${left} days left to nominate.`,
          href: '/community/awards',
          cta: 'Nominate someone',
          emoji: '🏆',
          tone: 'amber',
        }]}
      />
    )
  }

  const [events, partnerSlides] = await Promise.all([fetchGymEvents(), fetchPartnerSlides()])

  const eventSlides: Slide[] = events.slice(0, MAX_EVENT_SLIDES).map(e => ({
    id: `event-${e.id}`,
    eyebrow: `Coming up · ${formatShortDate(e.start_date)}`,
    title: e.title,
    body: e.description ?? undefined,
    href: '/community',
    cta: 'See events',
    emoji: e.event_type === 'competition' ? '🏆' : e.event_type === 'bring_a_friend' ? '🤝' : '📅',
    tone: 'brand',
  }))

  // Interleave so events and partner offers alternate
  const slides: Slide[] = []
  for (let i = 0; i < Math.max(eventSlides.length, partnerSlides.length); i++) {
    if (eventSlides[i]) slides.push(eventSlides[i])
    if (partnerSlides[i]) slides.push(partnerSlides[i])
  }

  return <SpotlightRotator slides={slides} />
}
