import { useState } from 'react'
import { useStore } from '../context/store.jsx'
import { PENDING_EARNINGS } from '../data/data.js'
import { formatRupees, shortDate } from '../utils/utils.js'
import WithdrawSheet from '../components/WithdrawSheet.jsx'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'earning', label: 'Earnings' },
  { id: 'spent', label: 'Spent' },
]

export default function Wallet() {
  const { wallet } = useStore()
  const [filter, setFilter] = useState('all')
  const [withdrawing, setWithdrawing] = useState(false)
  const visible = wallet.transactions.filter((t) => filter === 'all' || t.type === filter)

  return (
    <main className="screen">
      <div className="screen__scroll">
        <h1 className="page-title">Wallet</h1>

        <section className="balance-card">
          <h2>Available balance</h2>
          <strong>{formatRupees(wallet.balance)}</strong>
          <p>{formatRupees(PENDING_EARNINGS)} more waiting for approval</p>
          <button type="button" onClick={() => setWithdrawing(true)}>
            Withdraw money
          </button>
        </section>

        <div className="chips chips--plain" role="group" aria-label="Filter transactions">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ul className="card rows transactions" key={filter}>
          {visible.map((t) => (
            <li key={t.id}>
              <div>
                <h3>{t.title}</h3>
                <p>{[t.detail, t.date && shortDate(t.date)].filter(Boolean).join(' · ')}</p>
              </div>
              <strong className={t.amount > 0 ? 'is-credit' : undefined}>
                {t.amount > 0 ? '+' : '−'} {formatRupees(t.amount)}
              </strong>
            </li>
          ))}
          {visible.length === 0 && <li>No transactions yet.</li>}
        </ul>
      </div>

      <WithdrawSheet open={withdrawing} onClose={() => setWithdrawing(false)} />
    </main>
  )
}
