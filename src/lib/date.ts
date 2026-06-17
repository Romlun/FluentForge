function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  )

  const timeZoneAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  )

  return timeZoneAsUtc - date.getTime()
}

// Returns the UTC instant corresponding to midnight in the given IANA
// timezone, for "today" as currently observed in that timezone.
// Defaulted to America/Los_Angeles for now per operator request - a
// per-user timezone preference would be the more correct long-term fix,
// but isn't built yet (no timezone column on profiles).
export function startOfTodayInTimeZone(timeZone = 'America/Los_Angeles'): Date {
  const now = new Date()
  const todayParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const values = Object.fromEntries(
    todayParts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  )

  const candidateUTCMidnight = new Date(
    Date.UTC(values.year, values.month - 1, values.day, 0, 0, 0)
  )
  const offsetMs = getTimeZoneOffsetMs(candidateUTCMidnight, timeZone)

  return new Date(candidateUTCMidnight.getTime() - offsetMs)
}
