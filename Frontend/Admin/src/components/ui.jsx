/* Small pieces shared by the admin pages. */

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </header>
  )
}

export function Chips({ label, options, value, onChange }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>
          {text}
        </button>
      ))}
    </div>
  )
}

export const Badge = ({ tone, children }) => <span className={`badge badge--${tone}`}>{children}</span>

export function Toggle({ on, label, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="toggle"
      {...props}
    >
      {on ? 'On' : 'Off'}
    </button>
  )
}

export function Stats({ items }) {
  return (
    <dl className="stats" style={{ '--columns': items.length }}>
      {items.map(({ label, value, suffix, note, noteTone }) => (
        <div key={label} className="card">
          <dt>{label}</dt>
          <dd>
            {value}
            {suffix && <small> {suffix}</small>}
          </dd>
          {note && <dd className={`stats__note ${noteTone ?? ''}`}>{note}</dd>}
        </div>
      ))}
    </dl>
  )
}

/** A table inside a card. `empty` is shown when there are no rows. */
export function Table({ columns, empty, children }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <div className="card table-card">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!hasRows && <p className="empty">{empty}</p>}
    </div>
  )
}

/** Shown while a page is loading or when it could not be loaded. */
export function LoadState({ error, onRetry }) {
  if (!error) {
    return (
      <div className="load-state" role="status">
        <span className="spinner" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }
  return (
    <div className="load-state" role="alert">
      <p>{error.message}</p>
      <button type="button" className="button button--soft" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

/** A warning above data that could not be refreshed. */
export const Stale = ({ error }) =>
  error && (
    <p className="form-error" role="alert">
      Could not refresh. {error.message}
    </p>
  )
