import { useRouter } from '../routes/router.jsx'
import Icon from './Icon.jsx'

export default function FlowHeader({ title, subtitle, step, fallback, onBack }) {
  const { back } = useRouter()

  return (
    <header className="flow-header">
      <div className="flow-header__row">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Back"
          onClick={onBack ?? (() => back(fallback))}
        >
          <Icon name="back" size={22} strokeWidth={2.4} />
        </button>
        <div className="flow-header__title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {step && <span className="flow-header__step">Step {step} of 3</span>}
      </div>
      {step && (
        <div className="flow-header__progress" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= step ? 'is-done' : undefined} />
          ))}
        </div>
      )}
    </header>
  )
}
