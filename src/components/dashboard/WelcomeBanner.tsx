type Props = {
  firstName?: string
  dateOfBirth?: string // ISO date string e.g. '1990-04-12'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function isBirthdayWithin7Days(dob?: string): boolean {
  if (!dob) return false
  const today = new Date()
  const birthday = new Date(dob)
  birthday.setFullYear(today.getFullYear())
  const diff = (birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}

export default function WelcomeBanner({ firstName = 'there', dateOfBirth }: Props) {
  const greeting = getGreeting()
  const isBirthday = isBirthdayWithin7Days(dateOfBirth)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mb-8">
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-1 font-semibold">
        {today}
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-2">
        {greeting},<br />
        <span className="text-brand">{firstName}.</span>
      </h1>
      {isBirthday ? (
        <p className="text-sm text-text-secondary">
          🎂 Happy birthday week! Hope you&apos;re treating yourself today.
        </p>
      ) : (
        <p className="text-sm text-text-secondary">
          Here&apos;s what&apos;s happening at Number One HSP.
        </p>
      )}
    </div>
  )
}
