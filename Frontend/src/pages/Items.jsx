import { useEffect, useRef } from 'react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { CATEGORIES, ITEMS } from '../data.js'
import { formatRupees, priceCart } from '../utils.js'
import FlowHeader from '../components/FlowHeader.jsx'

export default function Items() {
  const { navigate } = useRouter()
  const { booking, actions } = useStore()
  const activeChip = useRef(null)

  const category = CATEGORIES.find((c) => c.id === booking.category) ?? CATEGORIES[0]
  const { count, subtotal } = priceCart(booking.cart)

  useEffect(() => {
    activeChip.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [category.id])

  return (
    <main className="screen">
      <FlowHeader title="Choose items" step={1} fallback="/home" />

      <div className="chips" role="group" aria-label="Service type">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            ref={c.id === category.id ? activeChip : null}
            type="button"
            aria-pressed={c.id === category.id}
            onClick={() => actions.setBooking({ category: c.id })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="screen__scroll">
        <p className="muted items__note">{category.note}</p>
        <ul className="items" key={category.id}>
          {ITEMS.filter((item) => item.category === category.id).map((item) => {
            const qty = booking.cart[item.id] ?? 0
            return (
              <li key={item.id} className="card item">
                <div>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <p className="item__price">
                    <strong>{formatRupees(item.price)}</strong> / {item.unit}
                  </p>
                </div>
                {qty > 0 ? (
                  <div className="stepper">
                    <button
                      type="button"
                      aria-label={`Remove one ${item.name}`}
                      onClick={() => actions.setQuantity(item.id, qty - 1)}
                    >
                      −
                    </button>
                    <output aria-label={`${item.name} quantity`}>{qty}</output>
                    <button
                      type="button"
                      aria-label={`Add one ${item.name}`}
                      onClick={() => actions.setQuantity(item.id, qty + 1)}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="item__add"
                    aria-label={`Add ${item.name}`}
                    onClick={() => actions.setQuantity(item.id, 1)}
                  >
                    Add
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <footer className="screen__footer">
        <button
          type="button"
          className="primary-button cart-bar"
          disabled={count === 0}
          onClick={() => navigate('/schedule')}
        >
          {count === 0 ? (
            'Add items to continue'
          ) : (
            <>
              <span>
                <small>
                  {count} {count === 1 ? 'item' : 'items'} selected
                </small>
                {formatRupees(subtotal)}
              </span>
              <span>Schedule pickup ›</span>
            </>
          )}
        </button>
      </footer>
    </main>
  )
}
