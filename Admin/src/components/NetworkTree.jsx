import { useState } from 'react'
import { useRouter } from '../router.jsx'
import { useDebounced, useResource } from '../hooks.js'

export default function NetworkTree({ member, loading }) {
  const { navigate } = useRouter()
  const [closed, setClosed] = useState(() => new Set())
  const show = (id) => navigate(`/referrals?member=${id}`, { replace: true })

  if (!member) {
    return (
      <section className="card block">
        <h2>Network tree</h2>
        <p className="empty">There are no members yet.</p>
      </section>
    )
  }

  const childrenOf = Map.groupBy(member.team, (m) => m.parentId)
  const direct = childrenOf.get(member.id)?.length ?? 0

  const toggle = (id) =>
    setClosed((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const describe = (node, children) => {
    if (children) return `Level ${node.level} · ${children} direct`
    return node.hasOrder ? `Level ${node.level}` : `Level ${node.level} · no order yet`
  }

  // Walks the tree depth first, skipping whatever is collapsed.
  const rows = []
  const walk = (id) => {
    for (const node of childrenOf.get(id) ?? []) {
      rows.push(node)
      if (!closed.has(node.id)) walk(node.id)
    }
  }
  if (!closed.has(member.id)) walk(member.id)

  const row = (node, depth, detail, children) => (
    <li key={node.id} style={{ '--depth': depth }} className={depth === 0 ? 'is-root' : undefined}>
      {children ? (
        <button
          type="button"
          className="tree__toggle"
          aria-expanded={!closed.has(node.id)}
          aria-label={`${closed.has(node.id) ? 'Expand' : 'Collapse'} ${node.name}`}
          onClick={() => toggle(node.id)}
        >
          {closed.has(node.id) ? '+' : '−'}
        </button>
      ) : (
        <span className="tree__toggle" aria-hidden="true">
          ·
        </span>
      )}
      <button
        type="button"
        className="tree__name"
        title={depth ? `Show ${node.name}'s network` : undefined}
        disabled={depth === 0}
        onClick={() => show(node.id)}
      >
        {node.name}
      </button>
      <span>{detail}</span>
    </li>
  )

  return (
    <section className="card block tree" aria-busy={loading}>
      <div className="card__head">
        <h2>Network tree</h2>
        <MemberSearch name={member.name} onPick={show} />
      </div>
      <p className="hint">
        Sponsor:{' '}
        {member.sponsor ? (
          <button type="button" className="link" onClick={() => show(member.sponsor.id)}>
            {member.sponsor.name}
          </button>
        ) : (
          'Company'
        )}
      </p>
      <ul>
        {row(member, 0, `${direct} direct · team of ${member.team.length}`, direct)}
        {rows.map((node) => {
          const children = childrenOf.get(node.id)?.length ?? 0
          return row(node, node.level, describe(node, children), children)
        })}
      </ul>
      {member.team.length === 0 && <p className="empty">{member.name} has not referred anyone yet.</p>}
    </section>
  )
}

/** Type a name or referral code, then pick a member from the list. */
function MemberSearch({ name, onPick }) {
  const [text, setText] = useState(null) // null while not searching
  const q = useDebounced(text?.trim() ?? '')
  const { data, stale } = useResource(q ? `/customers?${new URLSearchParams({ q, limit: 6 })}` : null)
  const matches = text?.trim() && !stale ? data?.customers : null

  return (
    <div className="member-search" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setText(null)}>
      <input
        type="search"
        aria-label="Find a member"
        value={text ?? name}
        // Clear the shown name so a new one can be typed.
        onFocus={() => setText('')}
        placeholder="Search member"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur()
          if (e.key === 'Enter' && matches?.[0]) {
            onPick(matches[0].id)
            e.currentTarget.blur()
          }
        }}
      />
      {matches && (
        <ul>
          {matches.length === 0 && <li className="hint">No member found</li>}
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setText(null)
                  onPick(m.id)
                }}
              >
                {m.name} <small>{m.referralCode}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
