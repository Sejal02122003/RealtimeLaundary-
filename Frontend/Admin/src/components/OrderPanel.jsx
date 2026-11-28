import { useState } from 'react'
import { useAction, useResource } from '../hooks/hooks.js'
import { formatRupees, METHODS, plural, STAGES } from '../utils/utils.js'
import FileViewer, { useProtectedFile } from './FileViewer.jsx'
import { ConfirmModal, FormModal } from './Modal.jsx'
import { LoadState } from './ui.jsx'

/** Details and actions for the order selected in the list. */
export default function OrderPanel({ code, onChange }) {
  const { data, error, reload, replace } = useResource(`/orders/${code}`, { interval: 15_000 })
  const [run, busy] = useAction()
  const [driverId, setDriverId] = useState('')
  const [dialog, setDialog] = useState(null)
  const [photo, setPhoto] = useState(null)

  if (!data) {
    return (
      <aside className="card panel">
        <LoadState error={error} onRetry={reload} />
      </aside>
    )
  }

  const { order } = data
  const done = order.cancelled || order.stage === STAGES.length - 1
  const left = order.total - order.refunded

  // The chosen driver, else the one already on the trip, else the least busy.
  const chosen = [driverId, order.openJob?.driverId, order.drivers[0]?.id].find((id) =>
    order.drivers.some((d) => d.id === id),
  )

  const act = async (action, body, message) => {
    const result = await run(`/orders/${code}/${action}`, { body, message })
    setDialog(null)
    if (result) {
      replace(result)
      onChange()
    } else {
      reload()
    }
  }

  let assignHint = ''
  if (done) assignHint = 'This order is closed.'
  else if (!order.leg) assignHint = 'A delivery driver can be assigned once it is ready for delivery.'
  else if (order.openJob?.status === 'offered') assignHint = 'Waiting for the driver to accept.'
  else if (order.openJob) assignHint = `The driver accepted this ${order.openJob.type}.`
  else if (!order.drivers.length) assignHint = 'No driver is online right now.'

  return (
    <aside className="card panel" aria-label={`Order ${order.code}`}>
      <div>
        <h2>#{order.code}</h2>
        <p className="panel__sub">
          {order.customerName} · {order.area}
        </p>
      </div>

      <dl className="facts">
        <div>
          <dt>Service:</dt>
          <dd>
            {order.service}, {plural(order.pieces, 'piece')}
          </dd>
        </div>
        <div>
          <dt>Payment:</dt>
          <dd>
            {METHODS[order.method]}, {formatRupees(order.total)}
            {order.refunded > 0 && ` · ${formatRupees(order.refunded)} refunded`}
          </dd>
        </div>
        <div>
          <dt>Instructions:</dt>
          <dd>{order.instructions || 'None'}</dd>
        </div>
      </dl>

      {order.refundRequest && (
        <div className="notice">
          <strong>Refund requested</strong>
          <p>{order.refundRequest.reason}</p>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => act('refund-request/reject', {}, 'Request dismissed')}
          >
            Dismiss request
          </button>
        </div>
      )}

      <label className="field">
        Assign driver
        <select
          value={chosen ?? ''}
          disabled={!order.leg || !order.drivers.length}
          onChange={(e) => setDriverId(e.target.value)}
        >
          {!order.drivers.length && <option value="">No drivers online</option>}
          {order.drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name} · {plural(driver.jobs, 'job')}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="button button--blue button--block"
        disabled={busy || !order.leg || !chosen || chosen === order.openJob?.driverId}
        onClick={() => act('assign', { driverId: chosen }, 'Driver assigned')}
      >
        Assign and notify driver
      </button>
      {assignHint && <p className="hint">{assignHint}</p>}

      <label className="field">
        Update status
        <select
          value={order.stage}
          disabled={done || busy}
          onChange={(e) => {
            const stage = Number(e.target.value)
            // Delivered cannot be undone, so it is confirmed first.
            if (stage === STAGES.length - 1) setDialog('delivered')
            else act('status', { stage }, 'Status updated')
          }}
        >
          {STAGES.map((label, stage) => (
            <option key={label} value={stage}>
              {order.cancelled && stage === order.stage ? 'Cancelled' : label}
            </option>
          ))}
        </select>
      </label>

      <div className="proof">
        <h3>Pickup &amp; delivery proof</h3>
        <div>
          {['pickup', 'delivery'].map((type) => (
            <Proof
              key={type}
              label={`${type === 'pickup' ? 'Pickup' : 'Delivery'} photo`}
              path={order.proof[type] ? `/orders/${code}/photos/${type}` : null}
              onOpen={setPhoto}
            />
          ))}
        </div>
      </div>

      <div className="panel__actions">
        <button
          type="button"
          className="button button--danger-outline"
          disabled={done || busy}
          onClick={() => setDialog('cancel')}
        >
          Cancel order
        </button>
        <button
          type="button"
          className="button button--outline"
          disabled={busy || !order.paid || left < 1}
          title={order.paid ? undefined : 'No payment has been received'}
          onClick={() => setDialog('refund')}
        >
          Record refund
        </button>
      </div>

      {dialog === 'cancel' && (
        <ConfirmModal
          title={`Cancel order #${order.code}?`}
          message={
            order.paid && left > 0
              ? `${formatRupees(left)} will be returned to the customer's wallet.`
              : 'Any driver assigned to it will be released.'
          }
          confirmLabel="Cancel order"
          danger
          busy={busy}
          onConfirm={() => act('cancel', {}, 'Order cancelled')}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'delivered' && (
        <ConfirmModal
          title="Mark as delivered?"
          message={
            order.method === 'cod' && !order.paid
              ? 'This cannot be undone. The cash will stay marked as not received.'
              : 'This cannot be undone.'
          }
          confirmLabel="Mark delivered"
          busy={busy}
          onConfirm={() => act('status', { stage: STAGES.length - 1 }, 'Status updated')}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'refund' && (
        <FormModal
          title={`Refund for #${order.code}`}
          submitLabel="Add refund to wallet"
          busy={busy}
          fields={[
            { name: 'amount', label: `Amount (₹, up to ${left})`, type: 'number', min: 1, max: left, value: left },
            { name: 'reason', label: 'Reason', maxLength: 200, value: order.refundRequest?.reason ?? '' },
          ]}
          onSubmit={(values) => act('refund', values, 'Refund recorded')}
          onClose={() => setDialog(null)}
        />
      )}
      {photo && <FileViewer {...photo} onClose={() => setPhoto(null)} />}
    </aside>
  )
}

function Proof({ label, path, onOpen }) {
  const { url } = useProtectedFile(path)

  if (!path) return <span className="proof__box">{label}</span>

  return (
    <button type="button" className="proof__box proof__box--photo" onClick={() => onOpen({ title: label, path })}>
      {url ? <img src={url} alt={label} /> : label}
    </button>
  )
}
