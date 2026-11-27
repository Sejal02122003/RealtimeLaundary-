const TIME_ZONE = 'Asia/Kolkata'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const formatRupees = (amount) => `₹${amount.toLocaleString('en-IN')}`

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

/** "99887 76655" */
export const spacedPhone = (phone) => phone.replace(/(\d{5})(\d+)/, '$1 $2')

export const phoneDigits = (value) => value.replace(/[\s-]/g, '').replace(/^\+91/, '')
export const isValidPhone = (value) => /^[6-9]\d{9}$/.test(phoneDigits(value))

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export const dayKey = (date) => dayFormat.format(new Date(date))

const dayParts = (day) => {
  const date = new Date(`${day}T00:00:00Z`)
  return {
    date: date.getUTCDate(),
    month: MONTHS[date.getUTCMonth()],
    weekday: WEEKDAYS[date.getUTCDay()],
  }
}

/** "26 Nov" */
export const shortDate = (day) => {
  const { date, month } = dayParts(day)
  return `${date} ${month}`
}

/** "Thu, 26 Nov" */
export const longDate = (day) => `${dayParts(day).weekday}, ${shortDate(day)}`

export const dayLabel = (day, today) => (day === today ? 'Today' : shortDate(day))

/** "9:40 AM" */
export const clockTime = (date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(
    new Date(date),
  )

/** When an open job has to happen, e.g. "10 AM – 12 PM" or "By 6:30 PM". */
export function jobWindow(job, today = dayKey(Date.now())) {
  const time = job.type === 'pickup' ? job.slotLabel : `By ${clockTime(job.dueAt)}`
  return job.day === today ? time : `${shortDate(job.day)}, ${time}`
}

export const mapsUrl = ({ address, area }) => {
  const destination = address.includes(area) ? address : `${address}, ${area}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

function outcome(job) {
  if (job.status === 'missed') return job.missedReason
  if (job.type === 'pickup') return plural(job.pieces, 'piece')

  const { method, cashStatus, collected } = job.payment
  if (method !== 'cod') return method === 'wallet' ? 'Paid by wallet' : 'Paid online'
  if (cashStatus === 'not_paid') return 'COD not paid'
  return `COD ${formatRupees(collected)}${cashStatus === 'partial' ? ' (partial)' : ''}`
}

/** Second line of a history row, e.g. "Today, 9:40 AM · COD ₹420". */
export function historyDetail(job, today) {
  const day = dayKey(job.closedAt)
  const when = day === today ? `Today, ${clockTime(job.closedAt)}` : shortDate(day)
  return `${when} · ${outcome(job)}`
}

export const jobTitle = (job) =>
  `${job.type === 'pickup' ? 'Pickup' : 'Delivery'} #${job.orderId}`
