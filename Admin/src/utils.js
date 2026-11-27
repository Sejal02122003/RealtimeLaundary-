const TIME_ZONE = 'Asia/Kolkata'

export const STAGES = [
  'Booking confirmed',
  'Pickup assigned',
  'Picked up',
  'Processing / washing',
  'Ready for delivery',
  'Out for delivery',
  'Delivered',
]

export const METHODS = { online: 'Online', cod: 'COD', wallet: 'Wallet' }

export const VEHICLES = {
  two_wheeler: 'Two wheeler',
  three_wheeler: 'Three wheeler',
  four_wheeler: 'Four wheeler',
  van: 'Van',
}

export const formatRupees = (amount) =>
  `${amount < 0 ? '−' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}`

export const formatNumber = (value) => value.toLocaleString('en-IN')

export const plural = (count, word, many = `${word}s`) =>
  `${formatNumber(count)} ${count === 1 ? word : many}`

/** "+91 98765 43210" */
export const formatPhone = (phone) => `+91 ${phone.replace(/(\d{5})(\d+)/, '$1 $2')}`

const format = (options) => new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, ...options })
const shortFormat = format({ day: 'numeric', month: 'short' })

/** "26 Nov" */
export const shortDate = (date) => shortFormat.format(new Date(date))

// For "YYYY-MM-DD" days, which have no time zone of their own.
const dayDate = (day) => new Date(`${day}T12:00:00+05:30`)

/** "Thursday, 26 November" */
export const longDay = (day) =>
  `${format({ weekday: 'long' }).format(dayDate(day))}, ${format({ day: 'numeric', month: 'long' }).format(dayDate(day))}`

/** "Thu" */
export const weekday = (day) => format({ weekday: 'short' }).format(dayDate(day))

/** Today in India as "YYYY-MM-DD". */
export const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

export function orderBadge({ stage, cancelled }) {
  if (cancelled) return { label: 'Cancelled', tone: 'red' }
  const label = stage === 3 ? 'Processing' : STAGES[stage]
  const tone = stage === 0 ? 'amber' : stage === 6 ? 'green' : 'blue'
  return { label, tone }
}

export const payTo = ({ method, account }) =>
  method === 'upi' ? `UPI · ${account}` : `Bank · ••${account}`
