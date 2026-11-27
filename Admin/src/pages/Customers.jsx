import { useState } from 'react'
import { useRouter } from '../router.jsx'
import { useAction, useDebounced, useResource } from '../hooks.js'
import { formatPhone, formatRupees, shortDate } from '../utils.js'
import Modal, { ConfirmModal } from '../components/Modal.jsx'
import { Badge, LoadState, PageHeader, Stale, Table } from '../components/ui.jsx'

const accountBadge = (status) =>
  status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Blocked</Badge>

export default function Customers() {
  const { query, navigate } = useRouter()
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(25)
  const q = useDebounced(search.trim())
  const { data, error, reload } = useResource(`/customers?${new URLSearchParams({ q, limit })}`)
  const selected = query.get('id') ?? data?.customers[0]?.id

  return (
    <>
      <PageHeader title="Customers">
        <input
          type="search"
          className="search"
          aria-label="Search customers"
          placeholder="Search name, phone or referral code"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            if (query.get('id')) navigate('/customers', { replace: true })
          }}
        />
      </PageHeader>

      {!data ? (
        <LoadState error={error} onRetry={reload} />
      ) : (
        <div className="split">
          <div>
            <Stale error={error} />
            <Table
              columns={['Name', 'Referral code', 'Sponsor', 'Orders', 'Wallet', 'Account']}
              empty="No customers match."
            >
              {data.customers.map((customer) => (
                <tr
                  key={customer.id}
                  className={customer.id === selected ? 'is-clickable is-selected' : 'is-clickable'}
                  onClick={() => navigate(`/customers?id=${customer.id}`, { replace: true })}
                >
                  <td>
                    <button type="button" className="link" aria-current={customer.id === selected || undefined}>
                      {customer.name}
                    </button>
                  </td>
                  <td className="code">{customer.referralCode}</td>
                  <td>{customer.sponsorName}</td>
                  <td>{customer.orders}</td>
                  <td className="strong">{formatRupees(customer.walletBalance)}</td>
                  <td>{accountBadge(customer.status)}</td>
                </tr>
              ))}
            </Table>
            {data.total > data.customers.length && (
              <div className="more">
                <span>
                  Showing {data.customers.length} of {data.total.toLocaleString('en-IN')}
                </span>
                {limit < 200 && (
                  <button type="button" className="button button--outline" onClick={() => setLimit(limit + 25)}>
                    Show more
                  </button>
                )}
              </div>
            )}
          </div>
          {selected && <CustomerPanel key={selected} id={selected} onChange={reload} />}
        </div>
      )}
    </>
  )
}

function CustomerPanel({ id, onChange }) {
  const { navigate } = useRouter()
  const { data, error, reload, replace } = useResource(`/customers/${id}`)
  const [run, busy] = useAction()
  const [dialog, setDialog] = useState(null)

  if (!data) {
    return (
      <aside className="card panel">
        <LoadState error={error} onRetry={reload} />
      </aside>
    )
  }

  const { customer } = data
  const blocked = customer.status === 'blocked'

  const setStatus = async () => {
    const result = await run(`/customers/${id}/status`, {
      body: { status: blocked ? 'active' : 'blocked' },
      message: blocked ? 'Account unblocked' : 'Account blocked',
    })
    setDialog(null)
    if (result) {
      replace(result)
      onChange()
    }
  }

  return (
    <aside className="card panel" aria-label={customer.name}>
      <div>
        <h2>{customer.name}</h2>
        <p className="panel__sub">{formatPhone(customer.phone)}</p>
      </div>
      <dl className="mini-stats">
        {[
          ['Direct', customer.direct],
          ['Team', customer.team],
          ['Earned', formatRupees(customer.earned)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <dl className="facts">
        {[
          ['Sponsor:', customer.sponsorName],
          ['Referral code:', customer.referralCode],
          ['Wallet balance:', formatRupees(customer.walletBalance)],
          ['Total orders:', customer.orders],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="button button--soft button--block"
        onClick={() => navigate(`/referrals?member=${id}`)}
      >
        View network tree
      </button>
      <button type="button" className="button button--soft button--block" onClick={() => setDialog('wallet')}>
        Wallet transactions
      </button>
      <button
        type="button"
        className={`button button--block ${blocked ? 'button--outline' : 'button--danger-outline'}`}
        onClick={() => setDialog('status')}
      >
        {blocked ? 'Unblock account' : 'Block account'}
      </button>

      {dialog === 'wallet' && <Transactions customer={customer} onClose={() => setDialog(null)} />}
      {dialog === 'status' && (
        <ConfirmModal
          title={`${blocked ? 'Unblock' : 'Block'} ${customer.name}?`}
          message={
            blocked
              ? 'The account will be active again.'
              : 'A blocked member stops earning referral commission.'
          }
          confirmLabel={blocked ? 'Unblock account' : 'Block account'}
          danger={!blocked}
          busy={busy}
          onConfirm={setStatus}
          onClose={() => setDialog(null)}
        />
      )}
    </aside>
  )
}

function Transactions({ customer, onClose }) {
  const { data, error, reload } = useResource(`/customers/${customer.id}/transactions`)

  return (
    <Modal title={`${customer.name}: wallet`} onClose={onClose}>
      {!data ? (
        <LoadState error={error} onRetry={reload} />
      ) : data.transactions.length === 0 ? (
        <p className="empty">No wallet transactions yet.</p>
      ) : (
        <ul className="list">
          {data.transactions.map((t) => (
            <li key={t.id}>
              <div>
                <strong>{t.title}</strong>
                <p>
                  {shortDate(t.at)} · {t.detail}
                </p>
              </div>
              <strong className={t.amount > 0 ? 'is-up' : undefined}>
                {t.amount > 0 && '+'}
                {formatRupees(t.amount)}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
