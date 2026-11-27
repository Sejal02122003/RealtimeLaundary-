import { Link, useRouter } from '../router.jsx'
import { useResource } from '../hooks.js'
import { formatNumber, formatRupees, longDay, plural } from '../utils.js'
import OrdersChart from '../components/OrdersChart.jsx'
import { LoadState, PageHeader, Stale, Stats } from '../components/ui.jsx'

const PERIODS = {
  today: { label: 'Today', suffix: 'today', versus: 'yesterday', joined: 'today' },
  week: { label: 'Last 7 days', suffix: ', last 7 days', versus: 'previous 7 days', joined: 'in 7 days' },
  month: { label: 'This month', suffix: 'this month', versus: 'last month', joined: 'this month' },
}

const heading = (word, suffix) => `${word}${suffix.startsWith(',') ? '' : ' '}${suffix}`

export default function Dashboard() {
  const { query, navigate } = useRouter()
  const period = PERIODS[query.get('period')] ? query.get('period') : 'today'
  const { data, error, reload } = useResource(`/dashboard?period=${period}`, { interval: 15_000 })

  if (!data) return <LoadState error={error} onRetry={reload} />

  // Labels follow the data on screen while a new period is loading.
  const text = PERIODS[data.period]
  const { orders, revenue, customers, drivers, commissions, attention, week, stages } = data
  const change = orders.count - orders.previous

  const tiles = [
    ['amber', attention.unassigned, 'Order', 'without a driver', '/orders?filter=needs-driver'],
    ['blue', attention.pendingDrivers, 'Driver', 'awaiting approval', '/drivers'],
    ['green', attention.withdrawals, 'Withdrawal request', '', '/finance'],
    ['red', attention.refunds, 'Refund request', '', '/orders?filter=refunds'],
  ]

  return (
    <>
      <PageHeader title="Dashboard" subtitle={longDay(data.today)}>
        <label className="period">
          Period
          <select
            value={period}
            onChange={(e) => navigate(`/dashboard?period=${e.target.value}`, { replace: true })}
          >
            {Object.entries(PERIODS).map(([id, { label }]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>
      <Stale error={error} />

      <Stats
        items={[
          {
            label: heading('Orders', text.suffix),
            value: formatNumber(orders.count),
            note: `${change >= 0 ? '▲' : '▼'} ${formatNumber(Math.abs(change))} vs ${text.versus}`,
            noteTone: change >= 0 ? 'is-up' : 'is-down',
          },
          {
            label: heading('Revenue', text.suffix),
            value: formatRupees(revenue.total),
            note: `Online ${formatRupees(revenue.online)} · COD ${formatRupees(revenue.cod)}`,
          },
          {
            label: 'Customers',
            value: formatNumber(customers.total),
            note: `${formatNumber(customers.joined)} joined ${text.joined}`,
          },
          {
            label: 'Drivers online',
            value: drivers.online,
            suffix: `of ${drivers.total}`,
            note: `${drivers.free} free right now`,
          },
          {
            label: 'Commissions this month',
            value: formatRupees(commissions.month),
            note: plural(commissions.referrals, 'new referral'),
          },
        ]}
      />

      <section className="card attention">
        <h2>Needs your attention</h2>
        <div>
          {tiles.map(([tone, count, noun, rest, to]) => (
            <Link key={noun} to={to} className={`attention__tile attention__tile--${tone}`}>
              <strong>{count}</strong>
              <span>
                {noun}
                {count === 1 ? '' : 's'} {rest} ›
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <OrdersChart days={week} />
        <section className="card stage-list">
          <h2>
            {data.period === 'today' ? 'Today’s orders by status' : `Orders by status, ${text.label.toLowerCase()}`}
          </h2>
          <ul>
            {stages.map(({ stage, label, count }) => (
              <li key={stage}>
                <span>{label}</span>
                <strong>{formatNumber(count)}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
