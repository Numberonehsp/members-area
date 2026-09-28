// Athlete of the Month voting window: the last 5 days of every calendar month (Europe/London).

const VOTING_DAYS = 5

function londonParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

export function isVotingWindow(date: Date = new Date()): boolean {
  const { year, month, day } = londonParts(date)
  const daysInMonth = new Date(year, month, 0).getDate()
  return day > daysInMonth - VOTING_DAYS
}

/** Days left in the month, counting today (1 on the last day). */
export function votingDaysLeft(date: Date = new Date()): number {
  const { year, month, day } = londonParts(date)
  return new Date(year, month, 0).getDate() - day + 1
}
