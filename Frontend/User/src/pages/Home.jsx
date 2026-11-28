import { useState } from 'react'
import { Link, useRouter } from '../routes/router.jsx'
import { useDefaultAddress, useStore } from '../context/store.jsx'
import { STAGES, TEAM } from '../data/data.js'
import { formatRupees, shareInvite, toISODate } from '../utils/utils.js'
import Basket from '../components/Basket.jsx'
import Icon from '../components/Icon.jsx'
import WithdrawSheet from '../components/WithdrawSheet.jsx'
import { useToast } from '../components/Toast.jsx'

const SERVICES = [
  { label: 'Wash', icon: 'washer', category: 'wash-iron' },
  { label: 'Dry clean', icon: 'hanger', category: 'dry-clean' },
  { label: 'Ironing', icon: 'iron', category: 'ironing' },
  { label: 'Premium', icon: 'star', category: 'premium' },
]

const TEAM_SIZE = TEAM.flat().length

export default function Home() {
  const { navigate } = useRouter()
  const { user, orders, wallet, unread, actions } = useStore()
  const address = useDefaultAddress()
  const showToast = useToast()
  const [withdrawing, setWithdrawing] = useState(false)

  const order = orders.find((o) => o.status === 'active')
  const month = toISODate(new Date()).slice(0, 7)
  const earned = wallet.transactions
    .filter((t) => t.type === 'earning' && (t.month ?? t.date.slice(0, 7)) === month)
    .reduce((sum, t) => sum + t.amount, 0)

  const book = (category) => navigate('/items', { onUpdate: () => actions.setBooking({ category }) })

  return (
    <main className="screen home">
      <div className="screen__scroll">
        <div className="home__hero">
          <header className="home__header">
            <div>
              <h1>Hi, {user.name.split(' ')[0]}</h1>
              <p>
                Pickup from {address.label}, {address.area}
              </p>
            </div>
            <button
              type="button"
              className="home__bell"
              aria-label={unread ? 'Notifications, unread' : 'Notifications'}
              onClick={() => navigate('/account', { transition: 'fade' })}
            >
              <Icon name="bell" />
              {unread && <span className="home__dot" />}
            </button>
          </header>

          {order ? (
            <Link to={`/orders/${order.id}`} className="order-banner">
              <span className="order-banner__info">
                <span className="order-banner__top">
                  <span>Order #{order.id}</span>
                  <span>Track ›</span>
                </span>
                <strong>
                  {STAGES[order.stage]}, {order.eta.startsWith('by') ? order.eta : `delivery ${order.eta}`}
                </strong>
                <span
                  className="order-banner__progress"
                  role="progressbar"
                  aria-label="Order progress"
                  aria-valuemin={0}
                  aria-valuemax={STAGES.length}
                  aria-valuenow={order.stage + 1}
                >
                  {STAGES.map((stage, i) => (
                    <span key={stage} className={i <= order.stage ? 'is-done' : undefined} />
                  ))}
                </span>
              </span>
              <Basket className="order-banner__art" />
            </Link>
          ) : (
            <Link to="/items" className="order-banner">
              <span className="order-banner__info">
                <span className="order-banner__top">No active orders</span>
                <strong>Book your next pickup ›</strong>
              </span>
              <Basket className="order-banner__art" />
            </Link>
          )}
        </div>

        <div className="section-head">
          <h2>Book a service</h2>
          <button type="button" className="text-button" onClick={() => book('wash-iron')}>
            Price list
          </button>
        </div>

        <div className="services">
          {SERVICES.map((service) => (
            <button type="button" key={service.label} onClick={() => book(service.category)}>
              <Icon name={service.icon} size={26} />
              {service.label}
            </button>
          ))}
        </div>

        <div className="home__stats">
          <section className="card home__stat">
            <p>Wallet balance</p>
            <strong>{formatRupees(wallet.balance)}</strong>
            <button type="button" className="text-button" onClick={() => setWithdrawing(true)}>
              Withdraw ›
            </button>
          </section>
          <section className="card home__stat home__stat--earned">
            <p>Earned this month</p>
            <strong>{formatRupees(earned)}</strong>
            <Link to="/refer" transition="fade">
              Team of {TEAM_SIZE} ›
            </Link>
          </section>
        </div>

        <section className="invite">
          <div>
            <h2>Invite friends, earn rewards</h2>
            <p>
              Your code: <strong>{user.referralCode}</strong>
            </p>
          </div>
          <button type="button" onClick={() => shareInvite(user.referralCode, showToast)}>
            Share
          </button>
        </section>

        <button type="button" className="primary-button home__cta" onClick={() => navigate('/items')}>
          Schedule a pickup
        </button>
      </div>

      <WithdrawSheet open={withdrawing} onClose={() => setWithdrawing(false)} />
    </main>
  )
}
