import { Link, useRouter } from '../routes/router.jsx'
import Icon from './Icon.jsx'

export const TABS = [
  { label: 'Home', icon: 'home', path: '/home' },
  { label: 'Orders', icon: 'receipt', path: '/orders' },
  { label: 'Refer', icon: 'users', path: '/refer' },
  { label: 'Wallet', icon: 'wallet', path: '/wallet' },
  { label: 'Account', icon: 'user', path: '/account' },
]

export default function TabBar() {
  const { pathname } = useRouter()
  const active = TABS.findIndex((tab) => tab.path === pathname)

  return (
    <nav className="tabbar" aria-label="Main">
      {/* The two variables tell the CSS where to slide the notch and circle. */}
      <div className="tabbar__bar" style={{ '--tabs': TABS.length, '--active': active }}>
        <span className="tabbar__cursor" aria-hidden="true">
          <svg className="tabbar__notch" width="78" height="28" viewBox="0 0 78 28">
            <path d="M0 0H78V.5C70 .5 65.5 4 64 9.5C61 20 51.5 27.5 39 27.5S17 20 14 9.5C12.5 4 8 .5 0 .5Z" />
            <path d="M0 .5C8 .5 12.5 4 14 9.5C17 20 26.5 27.5 39 27.5S61 20 64 9.5C65.5 4 70 .5 78 .5" />
          </svg>
          <span className="tabbar__bubble" />
        </span>
        {TABS.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            transition="fade"
            aria-current={pathname === tab.path ? 'page' : undefined}
          >
            <span className="tabbar__icon">
              <Icon name={tab.icon} size={24} strokeWidth={1.8} />
            </span>
            <span className="tabbar__label">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
