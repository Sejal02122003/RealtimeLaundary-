import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { INITIAL_STATE, PICKED_UP_STAGE, STAGES } from './data.js'
import { clockTime, formatRupees, shortDate, toISODate } from './utils.js'

const STORAGE_KEY = 'freshfold-state-v1'
const StoreContext = createContext(null)

function loadState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return saved ? { ...INITIAL_STATE, ...saved } : INITIAL_STATE
  } catch {
    return INITIAL_STATE
  }
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const notify = (state, title, detail) => ({
  notifications: [{ id: uid(), title, detail }, ...state.notifications],
  unread: true,
})

const addTransaction = (wallet, transaction) => ({
  balance: wallet.balance + transaction.amount,
  transactions: [{ id: uid(), date: toISODate(new Date()), ...transaction }, ...wallet.transactions],
})

export const nextOrderId = (orders) =>
  `FF-${Math.max(...orders.map((order) => Number(order.id.slice(3)))) + 1}`

function createActions(setState) {
  const update = (recipe) => setState((state) => ({ ...state, ...recipe(state) }))

  return {
    startLogin: (pendingContact) => update(() => ({ pendingContact })),
    login: () => update(() => ({ session: true, pendingContact: '' })),
    logout: () => update(() => ({ session: false })),

    setBooking: (patch) => update((s) => ({ booking: { ...s.booking, ...patch } })),

    setQuantity: (itemId, qty) =>
      update((s) => {
        const cart = { ...s.booking.cart, [itemId]: Math.min(Math.max(qty, 0), 99) }
        if (cart[itemId] === 0) delete cart[itemId]
        return { booking: { ...s.booking, cart } }
      }),

    placeOrder: ({ id, lines, total, payment, address, pickupDate, slot, deliveryDate }) =>
      update((s) => {
        const now = new Date()
        const order = {
          id,
          lines: lines.map(({ itemId, qty }) => ({ itemId, qty })),
          status: 'active',
          stage: 0,
          total,
          payment,
          address,
          date: toISODate(now),
          pickup: `${shortDate(pickupDate)}, ${slot.label}`,
          eta: `on ${shortDate(deliveryDate)}`,
          instructions: s.booking.instructions.trim(),
          otp: String(Math.floor(1000 + Math.random() * 9000)),
          partner: null,
          times: STAGES.map((_, i) => {
            if (i === 0) return `${shortDate(toISODate(now))}, ${clockTime(now)}`
            if (i === PICKED_UP_STAGE) return shortDate(pickupDate)
            return i === STAGES.length - 1 ? shortDate(deliveryDate) : ''
          }),
        }

        return {
          orders: [order, ...s.orders],
          wallet:
            payment === 'wallet'
              ? addTransaction(s.wallet, { type: 'spent', title: 'Order payment', detail: `#${id}`, amount: -total })
              : s.wallet,
          booking: { ...INITIAL_STATE.booking, cart: {} },
          ...notify(s, 'Your booking is confirmed', `#${id} · Pickup ${order.pickup}`),
        }
      }),

    cancelOrder: (id) =>
      update((s) => {
        const order = s.orders.find((o) => o.id === id)
        if (!order || order.status !== 'active' || order.stage >= PICKED_UP_STAGE) return {}
        const refund = order.payment !== 'cod'
        return {
          orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)),
          wallet: refund
            ? addTransaction(s.wallet, { type: 'refund', title: 'Order refund', detail: `#${id}`, amount: order.total })
            : s.wallet,
          ...notify(
            s,
            'Your order was cancelled',
            refund ? `#${id} · ${formatRupees(order.total)} added to wallet` : `#${id}`,
          ),
        }
      }),

    requestRefund: (id, reason) =>
      update((s) => ({
        orders: s.orders.map((o) => (o.id === id ? { ...o, refundRequest: reason } : o)),
        ...notify(s, 'Refund request received', `#${id}`),
      })),

    withdraw: (amount, upi) =>
      update((s) => {
        if (amount > s.wallet.balance) return {}
        return {
          wallet: addTransaction(s.wallet, {
            type: 'spent',
            title: 'Withdrawal requested',
            detail: `To ${upi}`,
            amount: -amount,
          }),
        }
      }),

    updateProfile: (patch) => update((s) => ({ user: { ...s.user, ...patch } })),

    addAddress: (address) =>
      update((s) => ({ addresses: [...s.addresses, { id: uid(), ...address }] })),

    setDefaultAddress: (defaultAddressId) => update(() => ({ defaultAddressId })),

    markNotificationsRead: () => update(() => ({ unread: false })),
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState)
  const actions = useMemo(() => createActions(setState), [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage can be blocked; the app still works for the current session.
    }
  }, [state])

  const value = useMemo(() => ({ ...state, actions }), [state, actions])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

export const useDefaultAddress = () => {
  const { addresses, defaultAddressId } = useStore()
  return addresses.find((a) => a.id === defaultAddressId) ?? addresses[0]
}
