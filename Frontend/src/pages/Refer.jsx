import { useState } from 'react'
import { useStore } from '../store.jsx'
import { SPONSOR, TEAM, TOTAL_EARNED } from '../data.js'
import { copyText, formatRupees, initials, shareInvite } from '../utils.js'
import { useToast } from '../components/Toast.jsx'

export default function Refer() {
  const { user } = useStore()
  const showToast = useToast()
  const [level, setLevel] = useState(0)

  const stats = [
    { label: 'Direct', value: TEAM[0].length },
    { label: 'Whole team', value: TEAM.flat().length },
    { label: 'Total earned', value: formatRupees(TOTAL_EARNED), earned: true },
  ]

  const copyCode = async () => {
    const copied = await copyText(user.referralCode)
    showToast(copied ? 'Code copied' : 'Could not copy the code')
  }

  return (
    <main className="screen">
      <div className="screen__scroll">
        <h1 className="page-title">Refer & earn</h1>

        <section className="refer-card">
          <h2>Your referral code</h2>
          <div className="refer-card__code">
            <strong>{user.referralCode}</strong>
            <button type="button" onClick={copyCode}>
              Copy
            </button>
          </div>
          <button
            type="button"
            className="primary-button primary-button--ink"
            onClick={() => shareInvite(user.referralCode, showToast)}
          >
            Share invite link
          </button>
        </section>

        <p className="eligibility">
          <strong>Eligibility: Active</strong>
          <span>Sponsor: {SPONSOR}</span>
        </p>

        <dl className="team-stats">
          {stats.map((stat) => (
            <div key={stat.label} className={`card${stat.earned ? ' is-earned' : ''}`}>
              <dd>{stat.value}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>

        <div className="levels" role="group" aria-label="Team level">
          {TEAM.map((members, i) => (
            <button
              key={i}
              type="button"
              className="option option--ink"
              aria-pressed={level === i}
              onClick={() => setLevel(i)}
            >
              Level {i + 1} ({members.length})
            </button>
          ))}
        </div>

        <ul className="card rows members" key={level}>
          {TEAM[level].map((member) => (
            <li key={member.name}>
              <span className="avatar avatar--small">{initials(member.name)}</span>
              <div>
                <h3>{member.name}</h3>
                <p>{member.joined ? `Joined ${member.joined} · Active` : 'No order yet'}</p>
              </div>
              <strong>{formatRupees(member.earned)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
