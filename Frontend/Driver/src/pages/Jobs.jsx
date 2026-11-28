import { useState } from 'react'
import { Link, useRouter } from '../routes/router.jsx'
import { useSession } from '../context/session.jsx'
import { useResource } from '../hooks/useResource.js'
import { formatRupees, jobWindow, longDate, plural } from '../utils/utils.js'
import CountUp from '../components/CountUp.jsx'
import Icon from '../components/Icon.jsx'
import LoadState from '../components/LoadState.jsx'
import VanArt from '../components/VanArt.jsx'
import { useToast } from '../components/Toast.jsx'

const REFRESH_MS = 10_000

export default function Jobs() {
  const { driver } = useSession()
  const profile = useResource('/me')

  if (driver?.status === 'approved') return <Dashboard />
  if (driver) return <AwaitingApproval name={driver.name} />
  return (
    <main className="screen">
      <LoadState error={profile.error} onRetry={profile.reload} />
    </main>
  )
}

const firstName = (name) => name.split(' ')[0]

function AwaitingApproval({ name }) {
  // Keeps checking, so the jobs appear as soon as an admin approves.
  useResource('/me', { interval: REFRESH_MS })

  return (
    <main className="screen">
      <div className="screen__scroll">
        <header className="hero">
          <h1>Hi, {firstName(name)}</h1>
          <p>Almost ready to drive</p>
        </header>
        <div className="jobs__content">
          <div className="art-panel">
            <VanArt className="art-panel__art" />
            <h2>Verification in progress</h2>
            <p>Jobs start after admin approval.</p>
            <Link to="/profile" className="button button--primary">
              View my documents
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function Dashboard() {
  const { query, navigate } = useRouter()
  const { request } = useSession()
  const { data, error, reload } = useResource('/jobs/dashboard', { interval: REFRESH_MS })
  const showToast = useToast()
  const [busy, setBusy] = useState(false)

  if (!data) {
    return (
      <main className="screen">
        <LoadState error={error} onRetry={reload} />
      </main>
    )
  }

  const { driver, today, stats, offer, pickups, deliveries } = data
  const tab = query.get('tab') === 'deliveries' ? 'deliveries' : 'pickups'
  const jobs = tab === 'pickups' ? pickups : deliveries

  /** Runs an action, then refreshes the screen whether or not it worked. */
  const run = async (action, message) => {
    setBusy(true)
    try {
      await action()
      if (message) showToast(message)
    } catch (err) {
      showToast(err.message)
    }
    await reload()
    setBusy(false)
  }

  const toggleOnline = () =>
    run(
      () => request('/me/online', { method: 'PATCH', body: { online: !driver.online } }),
      driver.online ? 'You are offline' : 'You are online',
    )

  const answer = (action, message) =>
    run(() => request(`/jobs/${offer.id}/${action}`, { method: 'POST' }), message)

  return (
    <main className="screen">
      <div className="screen__scroll">
        <header className="hero">
          <div className="hero__top">
            <div>
              <h1>Hi, {firstName(driver.name)}</h1>
              <p>{longDate(today)}</p>
            </div>
            <button
              type="button"
              className="online"
              aria-pressed={driver.online}
              disabled={busy}
              onClick={toggleOnline}
            >
              <span className="online__label">{driver.online ? 'Online' : 'Offline'}</span>
              <span className="online__track" />
            </button>
          </div>
          <dl className="stat-card">
            {[
              ['Assigned', stats.assigned],
              ['Pending', stats.pending],
              ['Done', stats.done],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <CountUp value={value} />
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="jobs__content">
          {error && (
            <p className="form-error" role="alert">
              Could not refresh. {error.message}
            </p>
          )}

          {offer && (
            // Keyed by job, so each new request animates in.
            <section key={offer.id} className="offer" aria-live="polite">
              <div className="offer__top">
                <span className="offer__icon">
                  <Icon name="bell" />
                </span>
                <div>
                  <h2>New {offer.type} request</h2>
                  <p>
                    {[
                      offer.customer.area,
                      offer.distanceKm && `${offer.distanceKm} km`,
                      jobWindow(offer, today),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
              <div className="offer__actions">
                <button
                  type="button"
                  className="button button--outline"
                  disabled={busy}
                  onClick={() => answer('decline', 'Request declined')}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="button button--blue"
                  disabled={busy}
                  onClick={() => answer('accept', 'Added to your jobs')}
                >
                  Accept
                </button>
              </div>
            </section>
          )}

          {!driver.online && (
            <p className="banner">You are offline. Go online to receive new requests.</p>
          )}

          <div className="segmented" data-tab={tab}>
            {[
              ['pickups', 'Pickups', pickups.length],
              ['deliveries', 'Deliveries', deliveries.length],
            ].map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => navigate(`/jobs?tab=${id}`, { replace: true, transition: 'none' })}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {jobs.length === 0 ? (
            <div key={tab} className="art-panel">
              <VanArt className="art-panel__art" />
              <p>No pending {tab} right now.</p>
            </div>
          ) : (
            <ul key={tab} className="job-list stagger">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} today={today} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

function JobCard({ job, today }) {
  const { customer, distanceKm, payment } = job

  const summary =
    job.type === 'pickup'
      ? `${job.service} · about ${plural(job.pieces, 'piece')}`
      : `${plural(job.pieces, 'piece')} · ${
          payment.method === 'cod' ? `COD ${formatRupees(payment.amount)}` : 'Paid'
        }`

  return (
    <li>
      <Link to={`/jobs/${job.id}`} className="job">
        <span className="job__icon">
          <Icon name={job.type === 'pickup' ? 'box' : 'truck'} />
        </span>
        <span className="job__info">
          <span className="job__top">
            <span className="badge">{jobWindow(job, today)}</span>
            <span className="job__id">#{job.orderId}</span>
          </span>
          <strong>{customer.name}</strong>
          <span className="job__area">
            {customer.area}
            {distanceKm && ` · ${distanceKm} km`}
          </span>
          <span className="job__summary">{summary}</span>
        </span>
        <Icon name="chevron" size={18} strokeWidth={2.4} />
      </Link>
    </li>
  )
}
