import Link from 'next/link'

type BirthdayMember = {
  id: string
  name: string
  daysUntil: number
  age: number
}

// Seed data — replace with GymMaster DOB data
const SEED_BIRTHDAYS: BirthdayMember[] = [
  { id: '3', name: 'Jordan Williams', daysUntil: 3, age: 28 },
  { id: '7', name: 'Priya Sharma', daysUntil: 11, age: 34 },
  { id: '2', name: 'Sam Davies', daysUntil: 18, age: 41 },
  { id: '9', name: 'Tom Hughes', daysUntil: 24, age: 25 },
]

function birthdayLabel(daysUntil: number) {
  if (daysUntil === 0) return 'Today! 🎂'
  if (daysUntil === 1) return 'Tomorrow'
  return `In ${daysUntil} days`
}

export default function BirthdayWidget() {
  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-amber via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">
            Next 30 Days
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Upcoming Birthdays</h2>
        </div>
        <span className="text-xl">🎂</span>
      </div>

      {SEED_BIRTHDAYS.length === 0 ? (
        <p className="text-sm text-text-secondary">No birthdays coming up.</p>
      ) : (
        <ul className="space-y-2.5">
          {SEED_BIRTHDAYS.map((member) => (
            <li key={member.id}>
              <Link
                href={`/coach/members/${member.id}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-brand">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-text-secondary">Turns {member.age}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ml-2 ${
                    member.daysUntil <= 3
                      ? 'text-status-amber'
                      : 'text-text-secondary'
                  }`}
                >
                  {birthdayLabel(member.daysUntil)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
