import { useState } from 'react'
import { useAction } from '../hooks/hooks.js'
import { formatRupees, plural } from '../utils/utils.js'
import { ConfirmModal, FormModal } from './Modal.jsx'

export default function CommissionQueue({ pending, total, onChange }) {
  const [run, busy] = useAction()
  const [dialog, setDialog] = useState(null)
  const sum = pending.reduce((value, c) => value + c.amount, 0)

  const act = async (path, options) => {
    const result = await run(`/referrals/commissions/${path}`, options)
    if (result) setDialog(null)
    onChange()
  }

  return (
    <section className="card block queue">
      <div className="card__head">
        <h2>Commissions to approve</h2>
        <button
          type="button"
          className="button button--green"
          disabled={busy || !pending.length}
          onClick={() => setDialog({ type: 'all' })}
        >
          Approve all
        </button>
      </div>

      {pending.length === 0 ? (
        <p className="empty">Nothing is waiting for approval.</p>
      ) : (
        <ul className="list">
          {pending.map((c) => (
            <li key={c.id}>
              <div>
                <strong>
                  {c.earnerName} · {formatRupees(c.amount)}
                </strong>
                <p>
                  Level {c.level} · {c.sourceName} · #{c.orderCode}
                </p>
              </div>
              <button
                type="button"
                className="button button--outline button--small"
                disabled={busy}
                onClick={() => setDialog({ type: 'adjust', commission: c })}
              >
                Adjust
              </button>
              <button
                type="button"
                className="button button--green-outline button--small"
                disabled={busy}
                onClick={() => act(`${c.id}/approve`, { message: 'Commission added to wallet' })}
              >
                Approve
              </button>
            </li>
          ))}
        </ul>
      )}
      {total > pending.length && (
        <p className="hint">
          Showing {pending.length} of {total}.
        </p>
      )}

      {dialog?.type === 'all' && (
        <ConfirmModal
          title="Approve all shown?"
          message={`${plural(pending.length, 'commission')} totalling ${formatRupees(sum)} will be added to wallets.`}
          confirmLabel="Approve all"
          busy={busy}
          onConfirm={() =>
            act('approve-all', {
              body: { ids: pending.map((c) => c.id) },
              message: (r) => `${plural(r.approved, 'commission')} approved`,
            })
          }
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'adjust' && (
        <FormModal
          title={`Adjust ${dialog.commission.earnerName}'s commission`}
          submitLabel="Save amount"
          busy={busy}
          fields={[
            { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, value: dialog.commission.amount },
          ]}
          onSubmit={(body) =>
            act(dialog.commission.id, { method: 'PATCH', body, message: 'Amount updated' })
          }
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  )
}
