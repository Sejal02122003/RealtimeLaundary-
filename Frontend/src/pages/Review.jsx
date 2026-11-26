import { useEffect, useRef, useState } from 'react'
import { Redirect, useRouter } from '../router.jsx'
import { nextOrderId, useDefaultAddress, useStore } from '../store.jsx'
import { PAYMENT_METHODS } from '../data.js'
import { formatRupees, getSchedule, longDate, priceCart } from '../utils.js'
import FlowHeader from '../components/FlowHeader.jsx'

export default function Review() {
  const { navigate } = useRouter()
  const { booking, addresses, orders, wallet, actions } = useStore()
  const defaultAddress = useDefaultAddress()
  const [processing, setProcessing] = useState(false)
  const [emptyCart] = useState(() => Object.keys(booking.cart).length === 0)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  if (emptyCart) return <Redirect to="/home" />

  const address = addresses.find((a) => a.id === booking.addressId) ?? defaultAddress
  const { date, slot, deliveryDate } = getSchedule(booking)
  const { lines, subtotal, discount, offerCode, tax, total } = priceCart(booking.cart)

  const walletShort = wallet.balance < total
  const payment = booking.payment === 'wallet' && walletShort ? 'online' : booking.payment

  const methods = {
    online: 'UPI, card or net banking',
    wallet: `Balance ${formatRupees(wallet.balance)}${walletShort ? ' · Not enough' : ''}`,
    cod: 'Pay the driver when clothes arrive',
  }

  const placeOrder = () => {
    const id = nextOrderId(orders)
    navigate(`/orders/${id}?new=1`, {
      replace: true,
      onUpdate: () =>
        actions.placeOrder({
          id,
          lines,
          total,
          payment,
          address: address.label,
          pickupDate: date,
          slot,
          deliveryDate,
        }),
    })
  }

  const handlePay = () => {
    if (payment !== 'online') return placeOrder()
    // TODO: open the payment gateway here. This delay only simulates it.
    setProcessing(true)
    timer.current = setTimeout(placeOrder, 1200)
  }

  return (
    <main className="screen">
      <FlowHeader title="Review & pay" step={3} fallback="/schedule" />

      <div className="screen__scroll">
        <section className="card summary">
          <h2>
            Pickup: {longDate(date)}, {slot.label}
          </h2>
          <p>
            Delivery: {longDate(deliveryDate)} · {address.label}, {address.area}
          </p>
        </section>

        <dl className="card bill">
          {lines.map((line) => (
            <div key={line.itemId}>
              <dt>
                {line.name} × {line.qty}
              </dt>
              <dd>{formatRupees(line.amount)}</dd>
            </div>
          ))}
          <div className="bill__subtotal">
            <dt>Subtotal</dt>
            <dd>{formatRupees(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="bill__offer">
              <dt>Offer {offerCode}</dt>
              <dd>− {formatRupees(discount)}</dd>
            </div>
          )}
          <div className="bill__muted">
            <dt>Taxes</dt>
            <dd>{formatRupees(tax)}</dd>
          </div>
          <div className="bill__total">
            <dt>Total</dt>
            <dd>{formatRupees(total)}</dd>
          </div>
        </dl>

        <fieldset className="payments" disabled={processing}>
          <legend className="section-title">Payment method</legend>
          {Object.entries(PAYMENT_METHODS).map(([id, method]) => (
            <label key={id} className="payment">
              <input
                type="radio"
                name="payment"
                value={id}
                checked={payment === id}
                disabled={id === 'wallet' && walletShort}
                onChange={() => actions.setBooking({ payment: id })}
              />
              <span>
                <strong>{method.label}</strong>
                <small>{methods[id]}</small>
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      <footer className="screen__footer">
        <button type="button" className="primary-button" disabled={processing} onClick={handlePay}>
          {processing ? (
            <>
              <span className="spinner" aria-hidden="true" /> Processing…
            </>
          ) : payment === 'cod' ? (
            `Place order · ${formatRupees(total)}`
          ) : (
            `Pay ${formatRupees(total)}`
          )}
        </button>
      </footer>
    </main>
  )
}
