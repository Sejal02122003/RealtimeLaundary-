import { Link, useRouter } from '../router.jsx'
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

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          transition="fade"
          aria-current={pathname === tab.path ? 'page' : undefined}
        >
          <span>
            <Icon name={tab.icon} size={20} />
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
