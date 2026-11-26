import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { countPieces, formatRupees, orderStatus, serviceName, shortDate } from '../utils.js'

export default function Orders() {
  const { query, navigate } = useRouter()
  const { orders } = useStore()
  const tab = query.get('tab') === 'past' ? 'past' : 'active'
  const visible = orders.filter((o) => (o.status === 'active') === (tab === 'active'))

  return (
    <main className="screen">
      <div className="screen__scroll">
        <h1 className="page-title">My orders</h1>

        <div className="segmented" role="group" aria-label="Order list">
          {['active', 'past'].map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() =>
                navigate(id === 'past' ? '/orders?tab=past' : '/orders', {
                  replace: true,
                  transition: 'none',
                })
              }
            >
              {id === 'active' ? 'Active' : 'Past'}
            </button>
          ))}
        </div>

        <ul className="order-list" key={tab}>
          {visible.map((order) => {
            const status = orderStatus(order)
            const count = countPieces(order.lines)
            return (
              <li key={order.id} className="card order-card">
                <div>
                  <h2>#{order.id}</h2>
                  <span className={`badge badge--${status.tone}`}>{status.label}</span>
                </div>
                <p>
                  {serviceName(order.lines)} · {count} {count === 1 ? 'item' : 'items'} ·{' '}
                  {shortDate(order.date)}
                </p>
                <div>
                  <strong>{formatRupees(order.total)}</strong>
                  <button
                    type="button"
                    className="soft-button"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    {order.status === 'active' ? 'Track order' : 'View details'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {visible.length === 0 && (
          <div className="empty">
            <p>No {tab} orders yet.</p>
            <button type="button" className="soft-button" onClick={() => navigate('/items')}>
              Schedule a pickup
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
