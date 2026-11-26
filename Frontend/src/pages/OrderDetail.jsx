import { useState } from 'react'
import { Redirect, useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { PAYMENT_METHODS, PICKED_UP_STAGE, STAGES } from '../data.js'
import { describeLines, formatRupees, initials } from '../utils.js'
import FlowHeader from '../components/FlowHeader.jsx'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import { useToast } from '../components/Toast.jsx'

export default function OrderDetail({ orderId }) {
  const { query, navigate } = useRouter()
  const { orders, actions } = useStore()
  const showToast = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)

  const order = orders.find((o) => o.id === orderId)
  if (!order) return <Redirect to="/orders" />

  const isActive = order.status === 'active'
  const isCancelled = order.status === 'cancelled'
  const canCancel = isActive && order.stage < PICKED_UP_STAGE
  // Right after payment, "back" should leave the booking flow.
  const goToOrders = query.get('new')
    ? () => navigate('/orders', { replace: true, transition: 'back' })
    : undefined

  const bookAgain = () => {
    const cart = Object.fromEntries(order.lines.map((l) => [l.itemId, l.qty]))
    navigate('/items', { onUpdate: () => actions.setBooking({ cart }) })
  }

  return (
    <main className="screen">
      <FlowHeader
        title={`Order #${order.id}`}
        subtitle={`${describeLines(order.lines)} · ${formatRupees(order.total)} ${PAYMENT_METHODS[order.payment].short}`}
        fallback="/orders"
        onBack={goToOrders}
      />

      <div className="screen__scroll">
        {isActive && (
          <section className="otp-card">
            <div>
              <h2>Delivery OTP</h2>
              <p>Share only after you receive your clothes</p>
            </div>
            <strong>{order.otp}</strong>
          </section>
        )}

        {isCancelled && (
          <p className="banner banner--red">
            This order was cancelled.
            {order.payment !== 'cod' && ` ${formatRupees(order.total)} was added to your wallet.`}
          </p>
        )}

        {isActive && (
          <section className="card partner">
            <span className="avatar">{order.partner ? initials(order.partner) : '…'}</span>
            <div>
              <h2>{order.partner ?? 'Assigning a partner'}</h2>
              <p>Your delivery partner</p>
            </div>
            {order.partner && (
              <button
                type="button"
                className="partner__call"
                aria-label={`Call ${order.partner}`}
                onClick={() => showToast('Calling is not connected in this demo')}
              >
                <Icon name="phone" size={20} />
              </button>
            )}
          </section>
        )}

        {!isCancelled && (
          <ol className="card timeline">
            {STAGES.map((stage, i) => {
              const done = i < order.stage || order.status === 'delivered'
              const current = !done && i === order.stage
              return (
                <li
                  key={stage}
                  className={done ? 'is-done' : current ? 'is-current' : undefined}
                  aria-current={current ? 'step' : undefined}
                >
                  <span className="timeline__dot">
                    {done && <Icon name="check" size={14} strokeWidth={3.2} />}
                  </span>
                  <span>{stage}</span>
                  <time>{order.times[i]}</time>
                </li>
              )
            })}
          </ol>
        )}

        <div className="order-actions">
          <button type="button" className="soft-button" onClick={bookAgain}>
            Book again
          </button>
          {!isCancelled && (
            <button
              type="button"
              className="outline-button"
              disabled={Boolean(order.refundRequest)}
              onClick={() => setSheetOpen(true)}
            >
              {order.refundRequest ? 'Refund requested' : 'Cancel / refund'}
            </button>
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        title={canCancel ? 'Cancel order' : 'Request a refund'}
        onClose={() => setSheetOpen(false)}
      >
        {canCancel ? (
          <div className="form">
            <p className="form__hint">
              Cancel order #{order.id}?
              {order.payment !== 'cod' && ` ${formatRupees(order.total)} will go to your wallet.`}
            </p>
            <button
              type="button"
              className="primary-button primary-button--danger"
              onClick={() => {
                actions.cancelOrder(order.id)
                setSheetOpen(false)
                showToast('Order cancelled')
              }}
            >
              Cancel order
            </button>
          </div>
        ) : (
          <RefundForm
            onSubmit={(reason) => {
              actions.requestRefund(order.id, reason)
              setSheetOpen(false)
              showToast('Refund request sent')
            }}
          />
        )}
      </Sheet>
    </main>
  )
}

function RefundForm({ onSubmit }) {
  const [reason, setReason] = useState('')

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault()
        if (reason.trim()) onSubmit(reason.trim())
      }}
    >
      <p className="form__hint">
        This order can no longer be cancelled. Tell us what went wrong and we will review it.
      </p>
      <label>
        Reason
        <textarea rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <button type="submit" className="primary-button" disabled={!reason.trim()}>
        Send request
      </button>
    </form>
  )
}
