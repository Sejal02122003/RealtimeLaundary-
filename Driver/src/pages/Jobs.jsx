import { useState } from 'react'
import { Link, useRouter } from '../router.jsx'
import { useSession } from '../session.jsx'
import { useResource } from '../useResource.js'
import { formatRupees, jobWindow, longDate, plural } from '../utils.js'
import LoadState from '../components/LoadState.jsx'
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
      <header className="home-header">
        <h1>Hi, {firstName(name)}</h1>
      </header>
      <div className="screen__scroll">
        <div className="banner">
          <h2>Verification in progress</h2>
          <p>Jobs start after admin approval.</p>
          <Link to="/profile" className="button button--primary banner__action">
            View my documents
          </Link>
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
      <header className="home-header">
        <div className="home-header__top">
          <div>
            <h1>Hi, {firstName(driver.name)}</h1>
            <p>{longDate(today)}</p>
          </div>
          <button
            type="button"
            className={driver.online ? 'online online--on' : 'online'}
            aria-pressed={driver.online}
            disabled={busy}
            onClick={toggleOnline}
          >
            ● {driver.online ? 'Online' : 'Offline'}
          </button>
        </div>
        <dl className="home-stats">
          {[
            ['Assigned', stats.assigned],
            ['Pending', stats.pending],
            ['Done', stats.done],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="screen__scroll">
        {error && (
          <p className="form-error offline-note" role="alert">
            Could not refresh. {error.message}
          </p>
        )}

        {offer && (
          <section className="banner offer" aria-live="polite">
            <h2>New {offer.type} request</h2>
            <p>
              {[offer.customer.area, offer.distanceKm && `${offer.distanceKm} km`, jobWindow(offer, today)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div className="offer__actions">
              <button
                type="button"
                className="button button--warm"
                disabled={busy}
                onClick={() => answer('decline', 'Request declined')}
              >
                Decline
              </button>
              <button
                type="button"
                className="button button--primary"
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

        <div className="segments">
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
          <p className="empty">No pending {tab} right now.</p>
        ) : (
          <ul className="job-list">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} today={today} />
            ))}
          </ul>
        )}
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
    <li className="job">
      <div className="job__top">
        <span className="job__time">{jobWindow(job, today)}</span>
        <span className="job__id">#{job.orderId}</span>
      </div>
      <div className="job__body">
        <div>
          <h3>{customer.name}</h3>
          <p>
            {customer.area}
            {distanceKm && ` · ${distanceKm} km`}
          </p>
          <strong>{summary}</strong>
        </div>
        <Link
          to={`/jobs/${job.id}`}
          className="button button--primary job__open"
          aria-label={`Open ${job.type} for ${customer.name}`}
        >
          Open
        </Link>
      </div>
    </li>
  )
}
