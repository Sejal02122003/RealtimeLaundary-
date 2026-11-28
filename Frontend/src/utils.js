import { ITEMS, SLOTS, STAGES } from './data.js'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const OFFER = { code: 'FRESH40', amount: 40, minimum: 200 }
const TAX_RATE = 0.18
const DELIVERY_DAYS = 2

export const formatRupees = (amount) => `₹${Math.abs(amount).toLocaleString('en-IN')}`

// Dates are stored as local "YYYY-MM-DD" strings to avoid timezone shifts.
export const toISODate = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const fromISODate = (iso) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const addDays = (iso, days) => {
  const date = fromISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export const shortDate = (iso) => {
  const date = fromISODate(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export const longDate = (iso) => `${WEEKDAYS[fromISODate(iso).getDay()]} ${shortDate(iso)}`

export const clockTime = (date) =>
  `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}`

export const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export const getItem = (id) => ITEMS.find((entry) => entry.id === id)

export const countPieces = (lines) => lines.reduce((sum, line) => sum + line.qty, 0)

export function priceCart(cart) {
  const lines = ITEMS.filter((entry) => cart[entry.id] > 0).map((entry) => ({
    itemId: entry.id,
    name: entry.name,
    qty: cart[entry.id],
    amount: entry.price * cart[entry.id],
  }))
  const count = countPieces(lines)
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)
  const discount = subtotal >= OFFER.minimum ? OFFER.amount : 0
  const tax = Math.round((subtotal - discount) * TAX_RATE)

  return {
    lines,
    count,
    subtotal,
    discount,
    offerCode: OFFER.code,
    tax,
    total: subtotal - discount + tax,
  }
}

export const describeLines = (lines) =>
  lines
    .map(({ itemId, qty }) => `${qty} ${getItem(itemId).nouns[qty === 1 ? 0 : 1]}`)
    .join(', ')

export function serviceName(lines) {
  const categories = [...new Set(lines.map((line) => getItem(line.itemId).category))]
  if (categories.length > 1) return 'Mixed services'
  const names = {
    'wash-iron': 'Wash & iron',
    'by-weight': 'Wash by weight',
    'dry-clean': 'Dry clean',
    packages: 'Package',
    ironing: 'Ironing',
    premium: 'Premium',
  }
  return names[categories[0]]
}

export function orderStatus(order) {
  if (order.status === 'cancelled') return { label: 'Cancelled', tone: 'red' }
  if (order.status === 'delivered') return { label: 'Delivered', tone: 'green' }
  const label = order.stage === 3 ? 'Processing' : STAGES[order.stage]
  return { label, tone: order.stage === 3 ? 'amber' : 'blue' }
}

/** Resolves the pickup day and time, skipping slots that have already started. */
export function getSchedule(booking, now = new Date()) {
  const today = toISODate(now)
  const isOpen = (date, slot) => date !== today || now.getHours() < slot.startHour

  const days = [0, 1, 2, 3].map((offset) => {
    const date = addDays(today, offset)
    return {
      date,
      label: offset === 0 ? 'Today' : WEEKDAYS[fromISODate(date).getDay()],
      day: fromISODate(date).getDate(),
      disabled: !SLOTS.some((slot) => isOpen(date, slot)),
    }
  })

  const day = days.find((d) => d.date === booking.date && !d.disabled) ?? days.find((d) => !d.disabled)
  const slots = SLOTS.map((slot) => ({ ...slot, disabled: !isOpen(day.date, slot) }))
  const preferred = [booking.slot, '10-12']
    .map((id) => slots.find((slot) => slot.id === id && !slot.disabled))
    .find(Boolean)

  return {
    days,
    slots,
    date: day.date,
    slot: preferred ?? slots.find((slot) => !slot.disabled),
    deliveryDate: addDays(day.date, DELIVERY_DAYS),
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function shareInvite(code, showToast) {
  const url = `${window.location.origin}/?ref=${code}`
  const text = `Join Realtime with my code ${code}`

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Realtime', text, url })
      return
    } catch (err) {
      if (err.name === 'AbortError') return
    }
  }
  const copied = await copyText(`${text}: ${url}`)
  showToast(copied ? 'Invite link copied' : 'Could not copy the invite link')
}
