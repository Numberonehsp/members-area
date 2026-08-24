import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  fetchChallenge,
  isMemberSignedUp,
  fetchChallengeCategories,
  fetchParticipantMeasurements,
  staffHubReader,
} from '@/lib/staffhub'
import SignUpButton from '@/components/community/SignUpButton'
import TrackingGrid from './TrackingGrid'
import InBodyForm from './InBodyForm'

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const challenge = await fetchChallenge(id)
  if (!challenge) notFound()

  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value ?? ''
  const alreadySignedUp = gymMasterId
    ? await isMemberSignedUp(challenge.id, gymMasterId)
    : false

  // If signed up, fetch participant + tracking data
  type ParticipantRow = {
    id: string
    pre_weight_kg: number | null
    pre_body_fat_pct: number | null
    pre_fat_mass_kg: number | null
    pre_smm_kg: number | null
    post_weight_kg: number | null
    post_body_fat_pct: number | null
    post_fat_mass_kg: number | null
    post_smm_kg: number | null
  }

  let participant: ParticipantRow | null = null
  if (alreadySignedUp && gymMasterId) {
    const { data } = await staffHubReader
      .from('challenge_participants')
      .select('id, pre_weight_kg, pre_body_fat_pct, pre_fat_mass_kg, pre_smm_kg, post_weight_kg, post_body_fat_pct, post_fat_mass_kg, post_smm_kg')
      .eq('challenge_id', challenge.id)
      .eq('gymmaster_member_id', gymMasterId)
      .maybeSingle()
    participant = data
  }

  const [categories, existingMeasurements] = participant
    ? await Promise.all([
        fetchChallengeCategories(challenge.id),
        fetchParticipantMeasurements(participant.id),
      ])
    : [[], []]

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

  const deadlinePassed = challenge.signup_deadline
    ? new Date(challenge.signup_deadline + 'T23:59:59') < new Date()
    : false

  const canSelfSignUp = !!gymMasterId && !deadlinePassed

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold text-white mb-2">{challenge.name}</h1>
      <p className="text-sm text-text-muted mb-6">
        {formatDate(challenge.start_date)} — {formatDate(challenge.end_date)}
      </p>

      {challenge.description && (
        <div className="bg-bg-card rounded-xl p-5 mb-6">
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{challenge.description}</p>
        </div>
      )}

      {challenge.signup_deadline && (
        <p className={`text-sm mb-4 ${deadlinePassed ? 'text-red-400' : 'text-amber-400'}`}>
          {deadlinePassed
            ? '⏰ Sign-up deadline has passed'
            : `📅 Sign-up deadline: ${formatDate(challenge.signup_deadline)}`}
        </p>
      )}

      {/* The "how to sign up" note is only useful when the member can't just tap the
          button below — otherwise it competes with the one-tap sign-up. */}
      {challenge.how_to_signup && !alreadySignedUp && !canSelfSignUp && (
        <div className="bg-bg-card rounded-xl p-4 mb-6 border border-brand/20">
          <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">How to sign up</p>
          <p className="text-sm text-text-secondary">{challenge.how_to_signup}</p>
        </div>
      )}

      <SignUpButton
        challengeId={challenge.id}
        alreadySignedUp={alreadySignedUp}
        deadlinePassed={deadlinePassed}
        isLoggedIn={!!gymMasterId}
      />

      {/* Self-reporting section — only shown when signed up */}
      {alreadySignedUp && participant && (
        <>
          {/* Weekly tracking grid */}
          {categories.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display font-bold text-text-primary text-lg">My Tracking Data</h2>
                <div className="flex-1 h-px bg-border-light" />
              </div>
              <p className="text-xs text-text-muted mb-4">
                Enter your numbers below — your coach can see these in the Staff Hub.
              </p>
              <TrackingGrid
                challengeId={challenge.id}
                participantId={participant.id}
                categories={categories}
                existingMeasurements={existingMeasurements}
                startDate={challenge.start_date}
                endDate={challenge.end_date}
              />
            </div>
          )}

          {/* InBody body composition */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display font-bold text-text-primary text-lg">Body Composition (InBody)</h2>
              <div className="flex-1 h-px bg-border-light" />
            </div>
            <InBodyForm
              challengeId={challenge.id}
              participantId={participant.id}
              existing={{
                pre_weight_kg: participant.pre_weight_kg,
                pre_body_fat_pct: participant.pre_body_fat_pct,
                pre_fat_mass_kg: participant.pre_fat_mass_kg,
                pre_smm_kg: participant.pre_smm_kg,
                post_weight_kg: participant.post_weight_kg,
                post_body_fat_pct: participant.post_body_fat_pct,
                post_fat_mass_kg: participant.post_fat_mass_kg,
                post_smm_kg: participant.post_smm_kg,
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
