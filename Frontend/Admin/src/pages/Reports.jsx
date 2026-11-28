import { useState } from 'react'
import { useAction, useDownload, useResource } from '../hooks/hooks.js'
import { formatNumber, shortDate, todayKey } from '../utils/utils.js'
import { LoadState, PageHeader, Stale, Toggle } from '../components/ui.jsx'

const REPORTS = [
  ['users', 'Users', 'Sign-ups, active and blocked accounts'],
  ['drivers', 'Drivers', 'Jobs, on-time rate, cash held'],
  ['orders', 'Orders', 'Volume and status by service'],
  ['revenue', 'Revenue', 'Sales, taxes and discounts'],
  ['payments', 'Payments', 'Online, COD and refunds'],
  ['mlm', 'MLM activity', 'Referrals, levels and commissions'],
  ['payouts', 'Payouts', 'Withdrawals approved and paid'],
]

export default function Reports() {
  const { data, error, reload } = useResource('/notifications')

  return (
    <>
      <PageHeader title="Reports & notifications" />
      <div className="split split--reports">
        <Downloads />
        <div>
          {!data ? (
            <LoadState error={error} onRetry={reload} />
          ) : (
            <>
              <Stale error={error} />
              <PushForm audiences={data.audiences} recent={data.recent} onSent={reload} />
              <Automatic items={data.automatic} onChange={reload} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Downloads() {
  const download = useDownload()
  const [to, setTo] = useState(todayKey)
  const [from, setFrom] = useState(() => `${todayKey().slice(0, 7)}-01`)
  const invalid = !from || !to || from > to

  return (
    <section className="card block reports">
      <h2>Download a report</h2>
      <div className="reports__range">
        <label className="field">
          From
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field">
          To
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>
      {invalid && (
        <p className="form-error" role="alert">
          Choose a start date on or before the end date.
        </p>
      )}
      <ul>
        {REPORTS.map(([type, title, description]) => (
          <li key={type}>
            <h3>{title}</h3>
            <p>{description}</p>
            <button
              type="button"
              className="button button--soft button--block"
              disabled={invalid}
              aria-label={`Download ${title} report`}
              onClick={() =>
                download(
                  `/reports/${type}?${new URLSearchParams({ from, to })}`,
                  `freshfold-${type}-${from}-to-${to}.csv`,
                )
              }
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PushForm({ audiences, recent, onSent }) {
  const [audience, setAudience] = useState(audiences[0].id)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [run, busy] = useAction()

  const send = async (event) => {
    event.preventDefault()
    const sent = await run('/notifications', {
      body: { audience, title, message },
      message: (r) =>
        `Saved for ${formatNumber(r.recipients)} people. Push delivery is not connected yet.`,
    })
    if (sent) {
      setTitle('')
      setMessage('')
      onSent()
    }
  }

  return (
    <form className="card block form" onSubmit={send}>
      <h2>Send a push notification</h2>
      <label className="field">
        Send to
        <select value={audience} onChange={(e) => setAudience(e.target.value)}>
          {audiences.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Title
        <input maxLength={60} placeholder="Weekend offer" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        Message
        <textarea
          rows={3}
          maxLength={180}
          placeholder="Use FRESH40 for ₹40 off on orders above ₹200."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <div className="preview">
        <span>Preview on phone</span>
        <div>
          <small>FreshFold · now</small>
          <strong>{title || 'Your title'}</strong>
          <p>{message || 'Your message appears here.'}</p>
        </div>
      </div>
      <button
        type="submit"
        className="button button--blue button--block"
        disabled={busy || !title.trim() || !message.trim()}
      >
        Send notification
      </button>
      <p className="hint">
        No push service is connected yet, so messages are saved but not delivered to phones.
        {recent[0] && ` Last saved: “${recent[0].title}” on ${shortDate(recent[0].at)}.`}
      </p>
    </form>
  )
}

function Automatic({ items, onChange }) {
  const [run, busy] = useAction()

  const toggle = async ({ id, enabled }) => {
    await run(`/notifications/automatic/${id}`, { method: 'PATCH', body: { enabled: !enabled } })
    onChange()
  }

  return (
    <section className="card block">
      <h2>Automatic notifications</h2>
      <ul className="list">
        {items.map((item) => (
          <li key={item.id}>
            <div>{item.label}</div>
            <Toggle on={item.enabled} label={item.label} disabled={busy} onClick={() => toggle(item)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
