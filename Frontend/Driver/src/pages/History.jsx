import { useSession } from '../context/session.jsx'
import { useResource } from '../hooks/useResource.js'
import { formatRupees, historyDetail, plural } from '../utils/utils.js'
import LoadState from '../components/LoadState.jsx'
import { Link } from '../routes/router.jsx'

export default function History() {
  const { driver } = useSession()
  const { data, error, reload } = useResource('/history')

  if (!data) {
    const pending = error?.status === 403 && driver?.status !== 'approved'
    return (
      <main className="screen">
        <div className="screen__scroll">
          <h1 className="page-title">History &amp; earnings</h1>
          {pending ? (
            <p className="banner">
              Earnings appear after admin approval. <Link to="/profile">View my documents</Link>
            </p>
          ) : (
            <LoadState error={error} onRetry={reload} />
          )}
        </div>
      </main>
    )
  }

  const { today, earnings, jobsDone, onTimePercent, declined, cash, jobs } = data

  return (
    <main className="screen">
      <div className="screen__scroll">
        <h1 className="page-title">History &amp; earnings</h1>

        <section className="earnings">
          <h2>Earnings this week</h2>
          <strong>{formatRupees(earnings.total)}</strong>
          <p>
            {earnings.incentive
              ? `Includes ${formatRupees(earnings.incentive)} incentive`
              : 'Last 7 days'}
          </p>
        </section>

        <dl className="history-stats">
          {[
            ['Jobs done', jobsDone],
            ['On time', onTimePercent === null ? '–' : `${onTimePercent}%`],
            ['Declined', declined],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <section className="deposit">
          <div>
            <h2>Cash to deposit</h2>
            <p>{plural(cash.orders, 'COD order')}</p>
          </div>
          <strong>{formatRupees(cash.amount)}</strong>
        </section>

        <h2 className="section-title">Completed jobs</h2>
        {jobs.length === 0 ? (
          <p className="empty">Your finished jobs will show here.</p>
        ) : (
          <ul className="card history-list">
            {jobs.map((job) => (
              <li key={job.id}>
                <div>
                  <h3>
                    #{job.orderId} · {job.type === 'pickup' ? 'Pickup' : 'Delivery'}
                  </h3>
                  <p>{historyDetail(job, today)}</p>
                </div>
                <span className={job.status === 'done' ? 'is-done' : 'is-missed'}>
                  {job.status === 'done' ? 'Done' : 'Missed'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
