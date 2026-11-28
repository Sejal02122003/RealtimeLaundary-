import { useState } from 'react'
import { useRouter } from '../routes/router.jsx'
import { useDebounced, useResource } from '../hooks/hooks.js'
import { formatRupees, METHODS, orderBadge } from '../utils/utils.js'
import OrderPanel from '../components/OrderPanel.jsx'
import { Badge, Chips, LoadState, PageHeader, Stale, Table } from '../components/ui.jsx'

const FILTERS = [
  ['all', 'All'],
  ['needs-driver', 'Needs driver'],
  ['in-progress', 'In progress'],
  ['out-for-delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
]

export default function Orders() {
  const { query, navigate } = useRouter()
  const filter = query.get('filter') ?? 'all'
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(25)
  const q = useDebounced(search.trim())

  const params = new URLSearchParams({ filter, q, limit })
  const { data, error, reload } = useResource(`/orders?${params}`, { interval: 15_000 })
  const selected = query.get('order') ?? data?.orders[0]?.code

  const go = (next) => {
    const url = new URLSearchParams({ filter, ...next })
    navigate(`/orders?${url}`, { replace: true })
  }

  // Reached from the dashboard, so it only shows while it is in use.
  const filters = filter === 'refunds' ? [...FILTERS, ['refunds', 'Refund requests']] : FILTERS

  return (
    <>
      <PageHeader title="Orders">
        <input
          type="search"
          className="search"
          aria-label="Search orders"
          placeholder="Search order, customer or phone"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            if (query.get('order')) go({})
          }}
        />
      </PageHeader>
      <Chips
        label="Filter orders"
        options={filters}
        value={filter}
        onChange={(id) => {
          setLimit(25)
          navigate(`/orders?filter=${id}`, { replace: true })
        }}
      />

      {!data ? (
        <LoadState error={error} onRetry={reload} />
      ) : (
        <div className="split">
          <div>
            <Stale error={error} />
            <Table
              columns={['Order', 'Customer', 'Amount', 'Payment', 'Status', 'Driver']}
              empty="No orders match."
            >
              {data.orders.map((order) => {
                const badge = orderBadge(order)
                return (
                  <tr
                    key={order.code}
                    className={order.code === selected ? 'is-clickable is-selected' : 'is-clickable'}
                    onClick={() => go({ order: order.code })}
                  >
                    <td>
                      <button type="button" className="link" aria-current={order.code === selected || undefined}>
                        #{order.code}
                      </button>
                    </td>
                    <td>{order.customerName}</td>
                    <td className="strong">{formatRupees(order.total)}</td>
                    <td>{METHODS[order.method]}</td>
                    <td>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </td>
                    <td>{order.driverName || 'Unassigned'}</td>
                  </tr>
                )
              })}
            </Table>
            {data.total > data.orders.length && (
              <div className="more">
                <span>
                  Showing {data.orders.length} of {data.total}
                </span>
                {limit < 200 && (
                  <button type="button" className="button button--outline" onClick={() => setLimit(limit + 25)}>
                    Show more
                  </button>
                )}
              </div>
            )}
          </div>
          {selected && <OrderPanel key={selected} code={selected} onChange={reload} />}
        </div>
      )}
    </>
  )
}
