import { useSession } from '../context/session.jsx'
import { useResource } from '../hooks/useResource.js'
import { formatRupees, historyDetail, plural } from '../utils/utils.js'
import CountUp from '../components/CountUp.jsx'
import Icon from '../components/Icon.jsx'
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
      <div className="screen__scroll stagger">
        <h1 className="page-title">History &amp; earnings</h1>

        <section className="earnings">
          <h2>Earnings this week</h2>
          <strong>
            <CountUp value={earnings.total} format={formatRupees} />
          </strong>
          <p>
            {earnings.incentive
              ? `Includes ${formatRupees(earnings.incentive)} incentive`
              : 'Last 7 days'}
          </p>
        </section>

        <dl className="history-stats">
          {[
            ['Jobs done', jobsDone],
            ['On time', onTimePercent, (value) => `${value}%`],
            ['Declined', declined],
          ].map(([label, value, format]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value === null ? '–' : <CountUp value={value} format={format} />}</dd>
            </div>
          ))}
        </dl>

        <section className="deposit">
          <Icon name="wallet" size={24} />
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
                <span className="avatar">
                  <Icon name={job.type === 'pickup' ? 'box' : 'truck'} size={19} />
                </span>
                <div>
                  <h3>
                    #{job.orderId} · {job.type === 'pickup' ? 'Pickup' : 'Delivery'}
                  </h3>
                  <p>{historyDetail(job, today)}</p>
                </div>
                <span className={job.status === 'done' ? 'badge badge--green' : 'badge badge--red'}>
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
