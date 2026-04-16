import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { fetchChallenge, isMemberSignedUp } from '@/lib/staffhub'
import SignUpButton from './SignUpButton'

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const challenge = await fetchChallenge(id)
  if (!challenge) notFound()

  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value ?? ''
  const alreadySignedUp = gymMasterId
    ? await isMemberSignedUp(challenge.id, gymMasterId)
    : false

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

      {challenge.how_to_signup && (
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
    </div>
  )
}
