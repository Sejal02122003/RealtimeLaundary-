import { useState } from 'react'
import { useRouter } from '../routes/router.jsx'
import { useAction, useDownload, useResource } from '../hooks/hooks.js'
import { formatRupees, METHODS, payTo, shortDate, todayKey } from '../utils/utils.js'
import { ConfirmModal } from '../components/Modal.jsx'
import { Badge, Chips, LoadState, PageHeader, Stale, Stats, Table } from '../components/ui.jsx'

// Each tab exports the matching report for this month.
const TABS = {
  withdrawals: { label: 'Withdrawal requests', report: 'payouts' },
  payments: { label: 'Payments & COD', report: 'payments' },
  ledger: { label: 'Commission ledger', report: 'mlm' },
  payouts: { label: 'Payout records', report: 'payouts' },
}

const STATUS_TONES = { approved: 'green', pending: 'amber', rejected: 'red' }
const capital = (word) => word[0].toUpperCase() + word.slice(1)

export default function Finance() {
  const { query, navigate } = useRouter()
  const tab = TABS[query.get('tab')] ? query.get('tab') : 'withdrawals'
  const { data, error, reload } = useResource('/finance', { interval: 15_000 })
  const download = useDownload()

  if (!data) return <LoadState error={error} onRetry={reload} />

  const { stats } = data
  const exportTab = () => {
    const { report } = TABS[tab]
    download(`/reports/${report}`, `freshfold-${report}-${todayKey()}.csv`)
  }

  return (
    <>
      <PageHeader title="Finance & payouts">
        <button type="button" className="button button--outline" onClick={exportTab}>
          Export
        </button>
      </PageHeader>
      <Stale error={error} />
      <Stats
        items={[
          { label: 'Online payments (month)', value: formatRupees(stats.online) },
          { label: 'COD with drivers', value: formatRupees(stats.codWithDrivers) },
          { label: 'Refunds (month)', value: formatRupees(stats.refunds) },
          { label: 'Pending withdrawals', value: formatRupees(stats.pendingWithdrawals) },
        ]}
      />
      <Chips
        label="Finance records"
        options={Object.entries(TABS).map(([id, { label }]) => [id, label])}
        value={tab}
        onChange={(id) => navigate(`/finance?tab=${id}`, { replace: true })}
      />

      {tab === 'withdrawals' && <Withdrawals rows={data.withdrawals} onChange={reload} />}
      {tab === 'payments' && <Payments data={data} onChange={reload} />}
      {tab === 'ledger' && <Ledger rows={data.commissions} />}
      {tab === 'payouts' && <Payouts rows={data.payouts} />}
    </>
  )
}

function Withdrawals({ rows, onChange }) {
  const [run, busy] = useAction()
  const [dialog, setDialog] = useState(null)

  const decide = async () => {
    const { row, decision } = dialog
    await run(`/finance/withdrawals/${row.id}/${decision}`, {
      message: decision === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected',
    })
    setDialog(null)
    onChange()
  }

  return (
    <>
      <Table
        columns={['Member', 'Requested', 'Wallet balance', 'Pay to', 'Date', 'Decision']}
        empty="No withdrawal requests are waiting."
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="strong">{row.memberName}</td>
            <td className="strong">{formatRupees(row.amount)}</td>
            <td>{formatRupees(row.walletBalance)}</td>
            <td>{payTo(row.payTo)}</td>
            <td>{shortDate(row.requestedAt)}</td>
            <td>
              <div className="row-actions">
                <button
                  type="button"
                  className="button button--green button--small"
                  disabled={busy || row.amount > row.walletBalance}
                  title={row.amount > row.walletBalance ? 'The wallet balance is too low' : undefined}
                  onClick={() => setDialog({ row, decision: 'approve' })}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="button button--danger-outline button--small"
                  disabled={busy}
                  onClick={() => setDialog({ row, decision: 'reject' })}
                >
                  Reject
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {dialog && (
        <ConfirmModal
          title={`${capital(dialog.decision)} ${formatRupees(dialog.row.amount)} for ${dialog.row.memberName}?`}
          message={
            dialog.decision === 'approve'
              ? `The amount is taken from the wallet. Send the money to ${payTo(dialog.row.payTo)}; this app does not transfer it.`
              : 'The money stays in the wallet.'
          }
          confirmLabel={capital(dialog.decision)}
          danger={dialog.decision === 'reject'}
          busy={busy}
          onConfirm={decide}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

function paymentBadge(payment) {
  if (payment.refunded >= payment.amount) return <Badge tone="red">Refunded</Badge>
  if (payment.cancelled) return <Badge tone="red">Cancelled</Badge>
  if (payment.refunded > 0) return <Badge tone="amber">Part refunded</Badge>
  return payment.paid ? <Badge tone="green">Paid</Badge> : <Badge tone="grey">Not collected</Badge>
}

function Payments({ data, onChange }) {
  const [run, busy] = useAction()
  const [driver, setDriver] = useState(null)

  const deposit = async () => {
    await run(`/drivers/${driver.id}/deposit`, { message: 'Cash deposit recorded' })
    setDriver(null)
    onChange()
  }

  return (
    <>
      <h2 className="section-title">Cash held by drivers</h2>
      <Table columns={['Driver', 'COD orders', 'Cash held', 'Deposit']} empty="No driver is holding cash.">
        {data.cashHolders.map((row) => (
          <tr key={row.id}>
            <td className="strong">{row.name}</td>
            <td>{row.orders}</td>
            <td className="strong">{formatRupees(row.amount)}</td>
            <td>
              <button
                type="button"
                className="button button--outline button--small"
                disabled={busy}
                onClick={() => setDriver(row)}
              >
                Mark deposited
              </button>
            </td>
          </tr>
        ))}
      </Table>
      <h2 className="section-title">Latest payments</h2>
      <Table columns={['Date', 'Order', 'Customer', 'Method', 'Amount', 'Status']} empty="No payments yet.">
        {data.payments.map((row) => (
          <tr key={row.code}>
            <td>{shortDate(row.placedAt)}</td>
            <td className="strong">#{row.code}</td>
            <td>{row.customerName}</td>
            <td>{METHODS[row.method]}</td>
            <td className="strong">{formatRupees(row.amount)}</td>
            <td>{paymentBadge(row)}</td>
          </tr>
        ))}
      </Table>
      {driver && (
        <ConfirmModal
          title={`Received ${formatRupees(driver.amount)} from ${driver.name}?`}
          message="Confirm only after the cash is in hand."
          confirmLabel="Mark deposited"
          busy={busy}
          onConfirm={deposit}
          onClose={() => setDriver(null)}
        />
      )}
    </>
  )
}

const Ledger = ({ rows }) => (
  <Table
    columns={['Date', 'Member', 'From', 'Level', 'Order', 'Commission', 'Status']}
    empty="No commissions yet."
  >
    {rows.map((row) => (
      <tr key={row.id}>
        <td>{shortDate(row.createdAt)}</td>
        <td className="strong">{row.earnerName}</td>
        <td>{row.sourceName}</td>
        <td>{row.level}</td>
        <td>#{row.orderCode}</td>
        <td className="strong">{formatRupees(row.amount)}</td>
        <td>
          <Badge tone={STATUS_TONES[row.status]}>{capital(row.status)}</Badge>
        </td>
      </tr>
    ))}
  </Table>
)

const Payouts = ({ rows }) => (
  <Table
    columns={['Member', 'Amount', 'Pay to', 'Requested', 'Decided', 'Status']}
    empty="No withdrawals have been decided yet."
  >
    {rows.map((row) => (
      <tr key={row.id}>
        <td className="strong">{row.memberName}</td>
        <td className="strong">{formatRupees(row.amount)}</td>
        <td>{payTo(row.payTo)}</td>
        <td>{shortDate(row.requestedAt)}</td>
        <td>{row.decidedAt ? shortDate(row.decidedAt) : '–'}</td>
        <td>
          <Badge tone={STATUS_TONES[row.status]}>
            {row.status === 'approved' ? 'Approved' : 'Rejected'}
          </Badge>
        </td>
      </tr>
    ))}
  </Table>
)
