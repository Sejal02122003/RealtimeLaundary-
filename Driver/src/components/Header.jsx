import { useRouter } from '../router.jsx'
import Icon from './Icon.jsx'

/** Navy header with a back button, used by the detail screens. */
export default function Header({ title, subtitle, fallback = '/jobs' }) {
  const { back } = useRouter()

  return (
    <header className="header">
      <button type="button" className="header__back" aria-label="Back" onClick={() => back(fallback)}>
        <Icon name="back" size={22} strokeWidth={2.4} />
      </button>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  )
}
