import { Link, useRouter } from '../routes/router.jsx'
import Icon from './Icon.jsx'

const TABS = [
  { label: 'Jobs', icon: 'truck', path: '/jobs' },
  { label: 'History', icon: 'receipt', path: '/history' },
  { label: 'Profile', icon: 'user', path: '/profile' },
]

// The profile screen has its own back button and save bar, so no tabs there.
export const TAB_PATHS = ['/jobs', '/history']

export default function TabBar() {
  const { pathname } = useRouter()

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          transition={tab.path === '/profile' ? 'forward' : 'fade'}
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
