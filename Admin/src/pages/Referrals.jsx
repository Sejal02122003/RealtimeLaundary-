import { useState } from 'react'
import { useRouter } from '../router.jsx'
import { useAction, useResource } from '../hooks.js'
import NetworkTree from '../components/NetworkTree.jsx'
import CommissionQueue from '../components/CommissionQueue.jsx'
import { LoadState, PageHeader, Stale } from '../components/ui.jsx'

export default function Referrals() {
  const { query } = useRouter()
  const member = query.get('member') ?? ''
  const { data, error, stale, reload } = useResource(
    `/referrals?${new URLSearchParams({ member })}`,
  )

  if (!data) return <LoadState error={error} onRetry={reload} />

  return (
    <>
      <PageHeader title="Referral network" />
      <Stale error={error} />
      {!data.rules.confirmed && (
        <p className="notice notice--wide">
          <strong>Rules not yet confirmed.</strong> Enter levels, percentages and eligibility after
          they are agreed against the reference MLM project.
        </p>
      )}

      <div className="split split--even">
        <RulesForm
          key={JSON.stringify(data.rules)}
          rules={data.rules}
          triggers={data.triggers}
          team={data.member?.team ?? []}
          onSaved={reload}
        />
        <div>
          <NetworkTree key={data.member?.id} member={data.member} loading={stale} />
          <CommissionQueue pending={data.pending} total={data.pendingCount} onChange={reload} />
        </div>
      </div>
    </>
  )
}

const asText = (value) => (value === null ? '' : String(value))
const decimal = (value) => value.replace(/[^\d.]/g, '')
const whole = (value) => value.replace(/\D/g, '')

function RulesForm({ rules, triggers, team, onSaved }) {
  const [levels, setLevels] = useState(() => rules.levels.map(asText))
  const [trigger, setTrigger] = useState(rules.trigger)
  const [minOwnOrders, setMinOwnOrders] = useState(() => asText(rules.minOwnOrders))
  const [minWithdrawal, setMinWithdrawal] = useState(() => asText(rules.minWithdrawal))
  const [run, busy] = useAction()

  const save = async (event) => {
    event.preventDefault()
    const saved = await run('/referrals/rules', {
      method: 'PUT',
      body: { levels, trigger, minOwnOrders, minWithdrawal },
      message: 'Referral rules saved',
    })
    if (saved) onSaved()
  }

  return (
    <form className="card block rules form" onSubmit={save} noValidate>
      <h2>Commission levels</h2>
      <ol>
        {levels.map((percent, i) => {
          const members = team.filter((m) => m.level === i + 1).length
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>
              <strong>Level {i + 1}</strong>
              <label>
                Commission %
                <input
                  inputMode="decimal"
                  maxLength={5}
                  placeholder="Set"
                  value={percent}
                  onChange={(e) =>
                    setLevels(levels.map((v, j) => (j === i ? decimal(e.target.value) : v)))
                  }
                />
              </label>
              <span>{i < rules.levels.length ? `${members} members` : 'New'}</span>
              {i > 0 && i === levels.length - 1 && (
                <button
                  type="button"
                  className="rules__remove"
                  aria-label={`Remove level ${i + 1}`}
                  onClick={() => setLevels(levels.slice(0, -1))}
                >
                  ×
                </button>
              )}
            </li>
          )
        })}
      </ol>
      <button
        type="button"
        className="button button--outline button--block"
        disabled={levels.length >= 10}
        onClick={() => setLevels([...levels, ''])}
      >
        + Add level
      </button>

      <h3>Eligibility &amp; payout rules</h3>
      <label className="field">
        Commission is earned when
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
          {Object.entries(triggers).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="rules__pair">
        <label className="field">
          Min. own orders / month
          <input
            inputMode="numeric"
            placeholder="Set"
            value={minOwnOrders}
            onChange={(e) => setMinOwnOrders(whole(e.target.value))}
          />
        </label>
        <label className="field">
          Min. withdrawal (₹)
          <input
            inputMode="numeric"
            placeholder="Set"
            value={minWithdrawal}
            onChange={(e) => setMinWithdrawal(whole(e.target.value))}
          />
        </label>
      </div>
      <button type="submit" className="button button--ink button--block" disabled={busy}>
        Save rules
      </button>
    </form>
  )
}
