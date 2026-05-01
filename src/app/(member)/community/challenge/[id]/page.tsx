import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  fetchChallenge,
  isMemberSignedUp,
  fetchParticipant,
  fetchChallengeCategories,
  fetchParticipantMeasurements,
} from '@/lib/staffhub'
import SignUpButton from './SignUpButton'
import TrackingGrid from './TrackingGrid'

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
  const participant = alreadySignedUp && gymMasterId
    ? await fetchParticipant(challenge.id, gymMasterId)
    : null

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

      {challenge.how_to_signup && !alreadySignedUp && (
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
    </div>
  )
}
